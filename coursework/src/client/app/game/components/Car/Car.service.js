'use strict';
/* jshint bitwise: false */

angular.module('bridgeApp')
  .service('Car', function (SimulationCONST, SimulationConfig, FinishSensor, CrashSensor) {
    let G = SimulationCONST.groups;
    let conf = SimulationConfig;
    let S = {
      driving: 'driving',
      crashed: 'crashed',
      finished: 'finished',
      stalling: 'stalling'
    };

    let density = 5;

    class Car {
      constructor(driver) {
        this.driver = driver;
        this.speed = conf.speed;

        this.make();
      }

      static get weight() {
        return density * 4;
      }

      static set weight(w) {
        density = w / 4;
      }

      make() {
        //spawn just above the platform
        let pos = [0.1, this.driver.platforms ? this.driver.platforms.getStart()[1] - 4 : 5];
        let heavy = this.driver.physics.createMaterial({density});

        //make the texture sprite
        let bodySprite = this.driver.sprite.create({
          texture: this.driver.textures['textures/lorry.png'],
          textureRectangle: [0, 0, 150, 58],
          width: 8,
          height: 3,
          origin: [4, 1.5],
        });

        //make the body
        this.body = this.driver.physics.createRigidBody({
          shapes: [
            this.driver.physics.createPolygonShape({
              vertices: this.driver.physics.createRectangleVertices(0, 0, 6, 3),
              group: G.CAR.CHASSIS.BACK,
              material: heavy,
              userData: {sprite: bodySprite}
            }),
            this.driver.physics.createPolygonShape({
              vertices: this.driver.physics.createRectangleVertices(6, 1, 8, 3),
              group: G.CAR.CHASSIS.FRONT,
              material: heavy
            })
          ],
        });

        //let the sprite update the rotation & position
        bodySprite.update = () => {
          [bodySprite.x, bodySprite.y] = this.body.getPosition();
          bodySprite.rotation = this.body.getRotation();
        };


        this.driver.world.addRigidBody(this.body);

        //relocate the body
        let bounds = this.body.computeWorldBounds();
        this.body.alignWithOrigin();
        this.driver.mathDevice.v4Sub(bounds, this.body.computeWorldBounds(), bounds);
        bodySprite.setOrigin([bounds[0], bounds[1]]);
        this.driver.mathDevice.v2Add(pos, [bounds[0], bounds[1]], pos);
        this.body.setPosition(pos);
        this.body.computeWorldBounds(bounds);


        this.wheels = [];
        this.wheels.rad = 0.6;
        this.wheels.origins = [
          [0.9, 3],
          [2.2, 3],
          [7.1, 3],
        ];

        for (let i = 0; i < 3; i++) {
          let origin = this.wheels.origins[i];

          let sprite = this.driver.sprite.create({
            texture: this.driver.textures['textures/wheel.png'],
            width: 1.2,
            height: 1.2,
            origin: [0.6, 0.6],
          });

          let shape = this.driver.physics.createCircleShape({
            radius: this.wheels.rad,
            group: G.CAR.WHEELS,
            mask: G.WORLD | G.BRIDGE.FLOOR | G.SENSORS,
            userData: {sprite}
          });

          //position wheel relative to vehicle
          let cpos = this.driver.mathDevice.v2Add(origin, [bounds[0], bounds[1]]);

          let bodyObj = {
            shapes: [shape],
            position: cpos
          };

          let body = this.driver.physics.createRigidBody(bodyObj);

          this.driver.world.addRigidBody(body);

          sprite.update = () => {
            [sprite.x, sprite.y] = body.getPosition();
            sprite.rotation = body.getRotation();
          };


          //line constraints with upper and lower bounds = spring
          let constraint =
            this.driver.physics.createLineConstraint({
              bodyA: this.body,
              bodyB: body,
              axis: [0, 1],
              anchorA: this.body.transformWorldPointToLocal(cpos),
              lowerBound: 0.2,
              upperBound: 0.5
            });

          this.driver.world.addConstraint(constraint);

          this.wheels.push({
            shape: shape,
            body: body,
            constraint
          });
        }

        //create own sensors
        this.sensors = [
          new FinishSensor(this.driver, () => this.changeState(S.finished)),
          new CrashSensor(this.driver, () => this.changeState(S.crashed))
        ];

        this.state = S.driving;
        this.stallCounter = 0;
        this.startTime = this.driver.realTime;
        this.endTime = -0.1;
        this.startPos = this.body.getPosition();
        this.distance = 0;
      }

      update() {
        if (this.state === S.driving) {
          //spin wheels to move the van
          this.wheels[0].body.setAngularVelocity(this.speed);
          this.wheels[1].body.setAngularVelocity(this.speed);

          //if we are not moving then count
          let velocity = this.driver.mathDevice.v2Length(this.body.getVelocity());
          if (velocity < 2) {
            this.stallCounter++;
          } else {
            this.stallCounter = 0;
          }

          //haven't moved in a while, we are stalling
          if (this.stallCounter > 100) {
            this.changeState(S.stalling);
          }

          this.distance = this.driver.mathDevice.v2Length(this.driver.mathDevice.v2Sub(this.startPos, this.body.getPosition()));
        }
      }

      changeState(newState) {
        if (this.state === newState) return;
        this.state = newState;
        this.endTime = this.driver.realTime - this.startTime;
        //resolve promise
        if (this.stateListener) {
          this.stateListener(this.driver);
        }
      }

      //listener :: Promise#resolve
      setStateListener(listener) {
        if (angular.isFunction(listener)) {
          this.stateListener = listener;
        }
      }

      reset() {
        this.clear();

        this.make();
      }

      clear() {
        this.driver.world.removeRigidBody(this.body);

        for (let wheel of this.wheels) {
          this.driver.world.removeConstraint(wheel.constraint);
          this.driver.world.removeRigidBody(wheel.body);
        }

        for (let sensor of this.sensors) {
          this.driver.world.removeRigidBody(sensor.body);
        }
      }
    }

    return Car;
  });
