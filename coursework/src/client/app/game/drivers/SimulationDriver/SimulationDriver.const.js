'use strict';
/*jshint bitwise: false */
angular.module('bridgeApp')
  .service('SimulationCONST', function functionName() {
    let c = 0;

    return {
      groups: {
        WORLD: 1 << (c++),
        BRIDGE: {
          INNER: 1 << (c++),
          OUTER: 1 << (c++),
          FLOOR: 1 << (c++)
        },
        CAR: {
          CHASSIS: {
            FRONT: 1 << (c++),
            BACK: 1 << (c++),
          },
          WHEELS: 1 << (c++),
        },
        SENSORS: 1 << (c++),
      },
      states: {
        designing: 'designing',
        simulating: 'simulating',
      },
    };
  });
