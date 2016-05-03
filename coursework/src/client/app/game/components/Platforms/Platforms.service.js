'use strict';

angular.module('bridgeApp')
  .service('Platforms', function (SimulationCONST) {
    let G = SimulationCONST.groups;

    class Platforms {
      //config :: {
      // (stage)width, (stage)height, elevation, distance :: int,
      // sprite :: bool
      //}
      constructor(driver, config) {
        this.distance = config.distance;
        this.heights = [
          10 - Math.floor(config.elevation / 2),
          10 + Math.ceil(config.elevation / 2),
        ];
        let combined = config.width - config.distance;
        this.widths = [
          Math.floor(combined / 2),
          Math.ceil(combined / 2),
        ];

        this.rects = {
          left: [0, config.height - this.heights[0], this.widths[0], config.height],
          right: [config.width - this.widths[1], config.height - this.heights[1], config.width, config.height]
        };

        this.body = driver.physics.createRigidBody({
          type: 'static',
          userData: {group: G.WORLD},
        });

        this.body.addShape(driver.physics.createPolygonShape({
          vertices: driver.physics.createRectangleVertices(...this.rects.left),
          group: G.WORLD,
          userData: config.sprite ? {
            sprite: driver.sprite.create({
              texture: driver.textures['textures/platforms.png'],
              width: this.widths[0],
              height: this.heights[0],
              origin: [0, 0],
              x: this.rects.left[0],
              y: this.rects.left[1],
            })
          } : {}
        }));

        this.body.addShape(driver.physics.createPolygonShape({
          vertices: driver.physics.createRectangleVertices(...this.rects.right),
          group: G.WORLD,
          userData: config.sprite ? {
            sprite: driver.sprite.create({
              texture: driver.textures['textures/platforms.png'],
              width: this.widths[1],
              height: this.heights[1],
              origin: [0, 0],
              x: this.rects.right[0],
              y: this.rects.right[1],
            })
          } : {}
        }));

        driver.world.addRigidBody(this.body);
      }

      getStart() {
        return [this.rects.left[2], this.rects.left[1]];
      }

      getEnd() {
        return [this.rects.right[0], this.rects.right[1]];
      }

      //for intersection checking
      get segments() {
        return [
          [[0, 0], [-this.widths[0], 0]],
          [[0, 0], [0, this.heights[0]]],
          [[0, 0], [-this.widths[0], this.heights[0]]],

          [[this.distance, 0], [this.distance + this.widths[1], 0]],
          [[this.distance, 0], [this.distance, this.heights[1]]],
          [[this.distance, 0], [this.distance + this.widths[1], this.heights[1]]],
        ];
      }
    }

    return Platforms;
  });
