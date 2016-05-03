'use strict';

angular.module('bridgeApp')
  .service('AbstractSensor', function (SimulationCONST) {
    let G = SimulationCONST.groups;

    class AbstractSensor {
      constructor(driver, rect, on, mask, callback) {
        //create a rect sensor from the destructured array as coordinates
        let sensor = driver.physics.createPolygonShape({
          vertices: driver.physics.createRectangleVertices(...rect),
          group: G.SENSORS,
          sensor: true,
        });

        sensor.addEventListener(on, callback, mask);

        this.body = driver.physics.createRigidBody({
          type: 'static',
          shapes: [sensor],
          userData: {group: G.SENSORS},
        });

        driver.world.addRigidBody(this.body);
      }
    }

    return AbstractSensor;
  });
