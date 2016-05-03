'use strict';

angular.module('bridgeApp')
  .service('CrashSensor', function (SimulationCONST, AbstractSensor) {
    let G = SimulationCONST.groups;

    class CrashSensor extends AbstractSensor {
      constructor(driver, callback) {
        let [x1,] = driver.platforms.getStart();
        let [x2,] = driver.platforms.getEnd();
        let y = driver.stageHeight - 3;
        super(driver, [x1, y, x2, y + 1], 'begin', G.CAR.CHASSIS.BACK | G.CAR.CHASSIS.FRONT | G.CAR.WHEELS, callback);
      }
    }
    return CrashSensor;
  });
