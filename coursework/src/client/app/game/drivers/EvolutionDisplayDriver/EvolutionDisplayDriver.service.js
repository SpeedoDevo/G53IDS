'use strict';

angular.module('bridgeApp')
  .service('EvolutionDisplayDriver', function ($timeout, SimulationDriver, SimulationCONST, SettingsManager) {
    const S = SimulationCONST.states;

    class EvolutionDisplayDriver extends SimulationDriver {
      constructor(engine) {
        super(engine);
        this.resize = true;
        //initially free
        this.isFree = Promise.resolve(this);
        this.wait = SettingsManager.all.ga.wait;
        //and resumed
        this.resumed = Promise.resolve();
      }

      startSimulationWith(indi) {
        this.id = indi.id;
        this.state = S.designing;
        this.bridgeBuilder = angular.copy(indi.builder);
        this.resetWorld();
        //wait however long
        this.startTimeout(this.wait / this.simulationSpeed);
        //promise to finish the simulation at some point
        this.isFree = new Promise(resolve => {
          this.done = resolve;
        });

        return this.isFree;
      }


      startTimeout(wait) {
        $timeout(() => {
          //after resuming start the simulation
          this.resumed.then(() => {
            this.state = S.simulating;
            this.resetWorld();
            this.car.setStateListener(this.done);
          });
        }, wait);
      }

      doDrawOther() {
        //show the id & load
        if (this.isSimulating && this.simulationSettled) {
          this.drawText(0.2, 14, this.id, 3);
          this.drawText(0.2, 17, `${this.maxLoad.toFixed(2)}%`, 3);
        }
      }

      get opts() {
        return this._opts;
      }

      set opts(o) {
        //pause and resume when required
        if (o.simulate) {
          if (this.resume) this.resume();
        } else {
          this.resumed = new Promise(resolve => {
            this.resume = resolve;
          })
        }
        this.isDrawing = o.render;
        this._opts = o;
      }

      get isSimulating() {
        return this.opts ? (this.opts.simulate && super.isSimulating) : super.isSimulating;
      }

      get simulationSpeed() {
        return this.opts ? this.opts.speed : 1;
      }

      set simulationSpeed(s) {
      }
    }

    return EvolutionDisplayDriver;
  });
