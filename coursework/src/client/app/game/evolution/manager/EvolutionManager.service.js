'use strict';

angular.module('bridgeApp')
  .service('EvolutionManager', function (BridgeNode, BridgeEdge, SettingsManager, AddNodeOperator, ConnectNodesOperator,
                                         MirrorNodeOperator, RemoveNodeOperator, RemoveEdgeOperator, NudgeNodeOperator,
                                         MakeTriangleOperator, BiasedRandomList, KHeap, $mdDialog, $mdUtil) {
    let rd;

    class EvolutionManager {
      constructor(drivers) {
        this.drivers = drivers;
        rd = drivers[0]; //referenceDriver
        this.bridgeMaterial = rd.bridgeMaterial;

        let s = this.settings = SettingsManager.all;

        this.populationSize = s.ga.population;
        this.mutationRate = s.ga.mutationRate;

        //set up mutators
        this.mutators = new BiasedRandomList([
          new RemoveNodeOperator(rd),
          new RemoveEdgeOperator(rd),
          new AddNodeOperator(rd),
          new ConnectNodesOperator(rd),
          new MirrorNodeOperator(rd),
          new NudgeNodeOperator(rd),
          new MakeTriangleOperator(rd),
        ]);

        //different list to boost weights
        this.removers = [this.mutators.items[0], this.mutators.items[1]];
        this.firstNonCollapsing = false;
        this.generation = -1;
        //I really shouldn't be storing this
        this.generations = [];

        //top individuals stored in a limited size min heap
        this.top = new KHeap(31, [], (a, b) => {
          return b.score - a.score;
        });

        //after all drivers load
        Promise.all(this.drivers.map(d => d.loadPromise))
          //generate individuals
          .then(() => this.nextGen(() => this.makeInitialBuilder()))
          //if loading fails prompt for refresh
          .catch(() => {
            $mdDialog
              .show($mdDialog.alert({
                title: 'Oh snap!',
                textContent: 'Something went wrong while loading the page, please refresh!',
                ok: 'Refresh'
              }))
              .finally(function () {
                location.reload();
              });
          });
      }

      get population() {
        return this.generations[this.generation];
      }

      set population(v) {
        this.generations[this.generation] = v;
      }

      evolve() {
        //TODO: use compiled code
        let randomTop = new BiasedRandomList(this.top.sorted(), i => i.score);
        //create an equally weighted Random list, with a few top individuals injected
        let current = new BiasedRandomList(this.population.concat(...randomTop.peek(3)));
        let next = new BiasedRandomList();
        //until we have enough individuals
        while (next.length < this.populationSize) {
          //add one
          next.push(
            //by choosing two individuals randomly
            current.peek(2).reduce(function (prev, curr) {
              //and selecting the better one
              return prev.score > curr.score ? prev : curr;
            })
          );
        }

        //generate mutated individuals
        this.nextGen(() => this.mutate(next.peek(1, true)));
      }

      nextGen(using) {
        this.generation++;
        this.population = [];
        let simulations = [];

        let last;
        for (let i = 0; i < this.populationSize; i++) {
          //generate an individual
          let fresh = using();
          //add an id to it
          fresh.id = `${this.generation + 1}/${i + 1}`;
          this.population.push(fresh);

          //the corresponding simulation will be
          simulations[i] = (i => {
            //a promise
            return new Promise(resolve => {

              let startIthDriver = index => {
                this.drivers[index].startSimulationWith(this.population[i])
                  .then(driver => {
                    this.population[i].cost = driver.bridge.cost;
                    this.population[i].maxLoad = driver.maxLoad;
                    return driver;
                  })
                  .then(resolve);
              };

              if (simulations.length < this.drivers.length) {
                //that either starts immediately
                startIthDriver(i);
              } else {
                //or waits for a driver to become free
                let p = last || Promise.resolve();

                //after the last finishes take the first free driver
                last = p.then(() => Promise.race(this.drivers.map(d => d.isFree)))
                  .then(driver => {
                    let index = this.drivers.indexOf(driver);
                    startIthDriver(index);
                  });
              }
            });
          })(i); //iife to retain i's value
        }

        //semi-debounced updater for the top individuals
        let updateTop = (() => {
          //collect updates here
          let items = [];
          let updater = () => {
            //run updates in batch
            items.forEach(i => {
              this.top.push(i);
            });
            items = [];
          };

          let flush = () => $mdUtil.debounce(updater, 250);
          let debounced = flush();

          //this is the actual updater
          return (val) => {
            //log the update request
            items.push(val);

            if (items.length > 10) {
              //if enough is collected then create a new debouncer to let the previous finish
              debounced = flush();
            } else {
              //debounced fn can be called endlessly
              debounced();
            }
          };
        })(); //iife to separate scopes

        //promises that resolve with fitness
        let fitness = simulations.map((s, i) =>
          //after a simulation is finished evaluate the fitness
          s.then(this.fitness.bind(this))
            //and run a debounced update
            .then(f => {
              this.population[i].score = f;
              updateTop(this.population[i]);
            })
        );

        //when all fitness values have been evaluated then evolve population and recurse
        Promise.all(fitness).then(this.evolve.bind(this));
      }

      fitness(driver) {
        let state = driver.car.state;
        if (!this.firstNonCollapsing && state === 'finished') {
          this.firstNonCollapsing = true;
          //boost the destructuring mutations when the first stable bridge is achieved
          this.removers.forEach(op => op.boostWeight());
        }

        let time = driver.car.endTime;
        let distance = driver.car.distance;
        let brokenRate = driver.bridge.brokenRate;
        let maxLoad = driver.maxLoad;
        let breakTime = driver.bridge.breakTime;
        let breakDistance = breakTime === 100 ? 30 : driver.bridge.breakDistance;
        let cost = driver.bridge.cost;

        //TODO: compiled code here
        switch (state) {
          case 'crashed':
            return 5 * breakDistance;
          case 'stalling':
            return Math.max(distance - 5, 0) * (100 - brokenRate);
          case 'finished':
            if (maxLoad >= 100) {
              return (6 * breakTime * (250 - brokenRate)) - 3 * cost;
            } else {
              return (100 * (250 - maxLoad)) - 3 * cost;
            }
        }
      }

      makeInitialBuilder() {
        //TODO: consider initial population here
        //creates a builder that connects the two sides
        let floorVector = rd.mathDevice.v2Sub(rd.platforms.getEnd(), rd.platforms.getStart());
        let base = {
          nodes: [
            new BridgeNode(...floorVector, true),
            new BridgeNode(0, 0, true)
          ],
          connections: [],
        };
        let edgeNumber =
          Math.ceil(rd.mathDevice.v2Length(floorVector) / this.bridgeMaterial.userData.maxLength);

        rd.mathDevice.v2ScalarMul(floorVector, 1 / edgeNumber, floorVector);
        floorVector = floorVector.map(Math.round);
        let edgeVector = rd.mathDevice.v2BuildZero();
        for (let i = 0; i < edgeNumber - 1; i++) {
          rd.mathDevice.v2Add(floorVector, edgeVector, edgeVector);
          base.nodes.push(new BridgeNode(...edgeVector, true));
          base.connections.push({a: i + 1, b: i + 2, e: new BridgeEdge(this.bridgeMaterial, true), fixed: true});
        }
        base.connections.push({a: edgeNumber, b: 0, e: new BridgeEdge(this.bridgeMaterial, true), fixed: true});

        let res = this.mutate({builder: base}, 50, false);
        res.parent = null;
        return res;
      }

      mutate(parent, times = this.mutationRate, copy = true) {
        let builder = copy ? angular.copy(parent.builder) : parent.builder;
        let mutations = {
          succ: {},
          fail: {}
        };
        let c;

        //times times
        for (let i = 0; i < times; i++) {
          let m = this.mutators.peek();
          //mutate using a random weighted mutator
          if (m.mutate(builder)) {
            c = mutations.succ;
          } else {
            c = mutations.fail;
          }

          //log which one it was
          c[m.constructor.displayName] = c[m.constructor.displayName] ? c[m.constructor.displayName] + 1 : 1;
        }

        //return mutated
        return {mutations, builder, parent};
      }

    }

    return EvolutionManager;
  });
