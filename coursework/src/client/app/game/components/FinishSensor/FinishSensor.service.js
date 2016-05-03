'use strict';

angular.module('bridgeApp')
  .service('FinishSensor', function (SimulationCONST, AbstractSensor) {
    let G = SimulationCONST.groups;

    class FinishSensor extends AbstractSensor {
      constructor(driver, callback) {
        let [,y] = driver.platforms.getEnd();
        let x = driver.stageWidth;
        super(driver, [x - 2, 0, x - 1, y], 'begin', G.CAR.CHASSIS.FRONT, callback);
      }
    }
    return FinishSensor;
  });
