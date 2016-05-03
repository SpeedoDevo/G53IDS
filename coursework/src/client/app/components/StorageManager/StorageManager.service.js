'use strict';

angular.module('bridgeApp')
  .service('StorageManager', function ($localStorage, BridgeEdge, BridgeNode) {
    //allows template strings that don't break indentation
    function dedent(callSite, ...args) {

      function format(str) {

        let size = -1;

        return str.replace(/\n(\s+)/g, (m, m1) => {

          if (size < 0)
            size = m1.replace(/\t/g, '    ').length;

          return '\n' + m1.slice(Math.min(m1.length, size));
        });
      }

      if (typeof callSite === 'string')
        return format(callSite);

      if (typeof callSite === 'function')
        return (...args) => format(callSite(...args));

      let output = callSite
        .slice(0, args.length + 1)
        .map((text, i) => (i === 0 ? '' : args[i - 1]) + text)
        .join('');

      return format(output);
    }

    class StorageManager {
      constructor() {
      }

      get default() {
        //mock material
        let material = {
          _data: {
            0: 0,
            1: 2,
            2: 1,
            3: 0.004999999888241291,
            4: 2
          },
          userData: {
            maxLength: 4.9,
            cost: 5
          }
        };

        return {
          //three sample bridges
          saves: [
            {
              builder: {
                nodes: [
                  new BridgeNode(0, 0),
                  new BridgeNode(4, 0),
                  new BridgeNode(2, -2),
                  new BridgeNode(6, -2),
                  new BridgeNode(8, 0),
                  new BridgeNode(10, -2),
                  new BridgeNode(12, 0),
                  new BridgeNode(14, -2),
                  new BridgeNode(16, 0),
                  new BridgeNode(18, -2),
                  new BridgeNode(20, 0),
                  new BridgeNode(-2, 0),
                  new BridgeNode(22, 0),
                ],
                connections: [
                  {a: 0, b: 1, e: new BridgeEdge(material, true)},
                  {a: 0, b: 2, e: new BridgeEdge(material, false)},
                  {a: 2, b: 1, e: new BridgeEdge(material, false)},
                  {a: 2, b: 3, e: new BridgeEdge(material, false)},
                  {a: 1, b: 4, e: new BridgeEdge(material, true)},
                  {a: 1, b: 3, e: new BridgeEdge(material, false)},
                  {a: 3, b: 4, e: new BridgeEdge(material, false)},
                  {a: 3, b: 5, e: new BridgeEdge(material, false)},
                  {a: 4, b: 6, e: new BridgeEdge(material, true)},
                  {a: 4, b: 5, e: new BridgeEdge(material, false)},
                  {a: 5, b: 6, e: new BridgeEdge(material, false)},
                  {a: 5, b: 7, e: new BridgeEdge(material, false)},
                  {a: 6, b: 8, e: new BridgeEdge(material, true)},
                  {a: 6, b: 7, e: new BridgeEdge(material, false)},
                  {a: 7, b: 8, e: new BridgeEdge(material, false)},
                  {a: 7, b: 9, e: new BridgeEdge(material, false)},
                  {a: 8, b: 10, e: new BridgeEdge(material, true)},
                  {a: 8, b: 9, e: new BridgeEdge(material, false)},
                  {a: 9, b: 10, e: new BridgeEdge(material, false)},
                  {a: 11, b: 2, e: new BridgeEdge(material, false)},
                  {a: 9, b: 12, e: new BridgeEdge(material, false)},
                ]
              },
              name: 'sample 1',
              id: 'sample1',
              cost: 494,
            },
            {
              builder: {
                nodes: [
                  new BridgeNode(0, 0),
                  new BridgeNode(4, 0),
                  new BridgeNode(0, 2),
                  new BridgeNode(4, 2),
                  new BridgeNode(8, 0),
                  new BridgeNode(8, 2),
                  new BridgeNode(12, 0),
                  new BridgeNode(12, 2),
                  new BridgeNode(16, 0),
                  new BridgeNode(16, 2),
                  new BridgeNode(20, 0),
                  new BridgeNode(20, 2),
                ],
                connections: [
                  {a: 0, b: 1, e: new BridgeEdge(material, true)},
                  {a: 2, b: 3, e: new BridgeEdge(material, false)},
                  {a: 0, b: 3, e: new BridgeEdge(material, false)},
                  {a: 1, b: 4, e: new BridgeEdge(material, true)},
                  {a: 3, b: 5, e: new BridgeEdge(material, false)},
                  {a: 3, b: 4, e: new BridgeEdge(material, false)},
                  {a: 1, b: 3, e: new BridgeEdge(material, false)},
                  {a: 4, b: 6, e: new BridgeEdge(material, true)},
                  {a: 5, b: 7, e: new BridgeEdge(material, false)},
                  {a: 4, b: 7, e: new BridgeEdge(material, false)},
                  {a: 4, b: 5, e: new BridgeEdge(material, false)},
                  {a: 6, b: 8, e: new BridgeEdge(material, true)},
                  {a: 7, b: 9, e: new BridgeEdge(material, false)},
                  {a: 7, b: 8, e: new BridgeEdge(material, false)},
                  {a: 6, b: 7, e: new BridgeEdge(material, false)},
                  {a: 8, b: 10, e: new BridgeEdge(material, true)},
                  {a: 9, b: 11, e: new BridgeEdge(material, false)},
                  {a: 8, b: 11, e: new BridgeEdge(material, false)},
                  {a: 8, b: 9, e: new BridgeEdge(material, false)},
                ]
              },
              name: 'sample 2',
              id: 'sample2',
              cost: 470,
            },
            {
              builder: {
                nodes: [
                  new BridgeNode(0, 0),
                  new BridgeNode(4, 0),
                  new BridgeNode(2, -3),
                  new BridgeNode(6, -3),
                  new BridgeNode(8, 0),
                  new BridgeNode(10, -4),
                  new BridgeNode(12, 0),
                  new BridgeNode(14, -3),
                  new BridgeNode(16, 0),
                  new BridgeNode(18, -3),
                  new BridgeNode(20, 0),
                  new BridgeNode(-1, 0),
                  new BridgeNode(21, 0),
                  new BridgeNode(-3, 0),
                  new BridgeNode(23, 0),
                  new BridgeNode(-2, -4),
                  new BridgeNode(22, -4),
                ],
                connections: [
                  {a: 0, b: 1, e: new BridgeEdge(material, true)},
                  {a: 0, b: 2, e: new BridgeEdge(material, false)},
                  {a: 2, b: 1, e: new BridgeEdge(material, false)},
                  {a: 2, b: 3, e: new BridgeEdge(material, false)},
                  {a: 1, b: 4, e: new BridgeEdge(material, true)},
                  {a: 1, b: 3, e: new BridgeEdge(material, false)},
                  {a: 3, b: 4, e: new BridgeEdge(material, false)},
                  {a: 3, b: 5, e: new BridgeEdge(material, false)},
                  {a: 4, b: 6, e: new BridgeEdge(material, true)},
                  {a: 4, b: 5, e: new BridgeEdge(material, false)},
                  {a: 5, b: 6, e: new BridgeEdge(material, false)},
                  {a: 5, b: 7, e: new BridgeEdge(material, false)},
                  {a: 6, b: 8, e: new BridgeEdge(material, true)},
                  {a: 6, b: 7, e: new BridgeEdge(material, false)},
                  {a: 7, b: 8, e: new BridgeEdge(material, false)},
                  {a: 7, b: 9, e: new BridgeEdge(material, false)},
                  {a: 8, b: 10, e: new BridgeEdge(material, true)},
                  {a: 8, b: 9, e: new BridgeEdge(material, false)},
                  {a: 9, b: 10, e: new BridgeEdge(material, false)},
                  {a: 11, b: 2, e: new BridgeEdge(material, false)},
                  {a: 9, b: 12, e: new BridgeEdge(material, false)},
                  {a: 11, b: 15, e: new BridgeEdge(material, false)},
                  {a: 13, b: 15, e: new BridgeEdge(material, false)},
                  {a: 12, b: 16, e: new BridgeEdge(material, false)},
                  {a: 14, b: 16, e: new BridgeEdge(material, false)},
                  {a: 2, b: 15, e: new BridgeEdge(material, false)},
                  {a: 9, b: 16, e: new BridgeEdge(material, false)},
                ]
              },
              name: 'sample 3',
              id: 'sample3',
              cost: 700
            },
          ],
          //basic line in editor
          editorState: {
            builder: {
              nodes: [
                new BridgeNode(0, 0),
                new BridgeNode(4, 0),
                new BridgeNode(8, 0),
                new BridgeNode(12, 0),
                new BridgeNode(16, 0),
                new BridgeNode(20, 0),
              ],
              connections: [
                {a: 0, b: 1, e: new BridgeEdge(material, true)},
                {a: 1, b: 2, e: new BridgeEdge(material, true)},
                {a: 2, b: 3, e: new BridgeEdge(material, true)},
                {a: 3, b: 4, e: new BridgeEdge(material, true)},
                {a: 4, b: 5, e: new BridgeEdge(material, true)},
              ]
            },
            undo: [],
            redo: []
          },
          //sensible ga&world settings
          settings: {
            world: {
              gravitation: 30,
              elevation: 0,
              distance: 20,
              weight: 20
            },
            ga: {
              mutationRate: 7,
              simulations: {
                w: 3,
                h: 3
              },
              population: 15,
              wait: 1000,
              fitness: dedent
                `/*
                 * This is the fitness function which should return a number representing an individual's strength.
                 * You have access to the following variables to determine this:
                 * - state: the van's state at the end of the run, one of ['crashed', 'stalling', 'finished']
                 * - time: time took to simulate this run in seconds
                 * - distance: the van's distance from the start point at the end of the run
                 * - brokenRate: how many constraints have been broken in the bridge in %
                 * - maxLoad: the biggest constraint displacement during a run in %, 100 if any constraint was broken
                 * - breakTime: the time it took for the bridge to break in seconds
                 * - breakDistance: the van's distance when the bridge broke
                 * - cost: the bridge's cost
                 * This is the default fitness function:
                 */
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
                }`,
              selection: dedent
                `/*
                 * This is the selection function which should return an array of individuals that will form the next generation
                 * or a function that generates an individual every time it is called.
                 * To do this you have access to the following variables:
                 * - population: an array of individuals (objects), each individual has a score property which represents its fitness
                 * - populationSize: the returned array's length should match this
                 * - mutationRate: the preset mutation rate
                 * - mutate: mutate(individual[, amount]) -> amount times mutated individual,
                 *      amount is optional, it defaults to mutationRate
                 *      mutate(i, 0) makes a copy of the individual, marking i as its parent
                 * - RandomList: a class that helps with randomising selection
                 *      constructor: new RandomList(array[, weighter])
                 *          random elements returned from this object will be weighted based on weighter (weighter(item) -> number)
                 *          the weighter is optional, defaults to item.weight
                 *      peek([n]): get n elements randomly, if n is 1 or omitted it only returns a single object
                 *      shuffle(): return the array in random order
                 *      push(i): add i to the random list
                 *      pop(i): return an element randomly
                 * - top: array of individuals in the leaderboard
                 * - state: you can store anything in this object, this will be persisted between function calls
                 *
                 * here are a few examples of basic selection functions, the default is binary tournament
                 */

                function binaryTournament() {
                  //create an equally weighted Random list
                  //with the top individual (quasi elitist replacement)
                  var current = new RandomList(population.concat(top[0]));
                  var next = RandomList();
                  //until we have enough individuals
                  while (next.length < populationSize) {
                    //add one
                    next.push(
                      //by choosing two individuals randomly
                      current.peek(2).reduce(function (prev, curr) {
                        //and selecting the better one
                        return prev.score > curr.score ? prev : curr;
                      })
                    );
                  }
                  //then mutate them using the base mutation rate
                  return function() {
                    return mutate(next.peek());
                  };
                }

                function rouletteWheel() {
                  //crete a new random list from the population
                  var current = new RandomList(population, function (individual) {
                    return individual.score
                  });
                  //when required return a random one and mutate it
                  return function () {
                    mutate(current.peek());
                  };
                }

                //this is a very bad selection function, don't use it
                function halfMutatedTruncation() {
                  //sort the population in reverse order and take half of it
                  var next = population.sort(function (a,b){
                    return b.score - a.score;
                  }).splice(0,population.length/2);

                  //store index in the state variable
                  state.i = 0;
                  return function () {
                    var index = Math.floor(i/2);
                    //make every odd individual a mutated one and every even a copy from the previous generation
                    return state.i++ % 2 ? mutate(next[index]) : next[index];
                  };
                }

                //this one is bad as well
                function randomFromTop() {
                  //create a random list from the individuals on the leaderboard
                  let rand = new RandomList(top, function(i) {
                    return i.score;
                  });
                  return function () {
                    //return a random mutated one when required
                    return mutate(rand.peek());
                  };
                }

                //default to binary tournament
                return binaryTournament();`,
              operators: {
                RemoveNodeOperator: 10,
                RemoveEdgeOperator: 10,
                AddNodeOperator: 10,
                ConnectNodesOperator: 10,
                MirrorNodeOperator: 13,
                NudgeNodeOperator: 10,
                MakeTriangleOperator: 15,
              }
            }
          }
        };
      }

      get storage() {
        if (!this._storage) {
          this._storage = $localStorage.$default(this.default);
        }
        return this._storage;
      }

      get saves() {
        if (!this._saves) {
          this._saves = this.storage.saves;
          this._saves.forEach(s => {
            s.builder = this.refresh(s.builder);
          });
        }
        return this._saves;
      }

      get editorState() {
        let sanitize = (s) => {
          return {
            builder: this.refresh(s.builder),
            undo: s.undo.map(b => this.refresh(b)),
            redo: s.redo.map(b => this.refresh(b)),
          };
        };
        let _this = this;
        return {
          load() {
            return sanitize(_this.storage.editorState);
          },
          save(es) {
            _this.storage.editorState = sanitize(es);
            _this.storage.$apply();
          }
        };
      }

      get settings() {
        if (!this._settings) {
          this._settings = this.storage.settings;
        }
        return this._settings;
      }

      set settings(fresh) {
        this._settings = this.storage.settings = fresh;
        this.storage.$apply();
      }

      //recreates the classes from objects
      refresh(builder) {
        let fresh = {
          nodes: [],
          connections: []
        };
        for (let node of builder.nodes) {
          fresh.nodes.push(new BridgeNode(node.x, node.y, node.fixed));
        }
        for (let conn of builder.connections) {
          fresh.connections.push({
            a: conn.a, b: conn.b,
            e: new BridgeEdge(conn.e.material, conn.e.floor, conn.e.onlyBody)
          });
        }
        return fresh;
      }
    }

    return new StorageManager();
  });
