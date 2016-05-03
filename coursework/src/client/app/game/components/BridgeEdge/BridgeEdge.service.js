'use strict';
/* jshint bitwise: false */

angular.module('bridgeApp')
  .service('BridgeEdge', function (SimulationCONST, SimulationConfig) {
    let G = SimulationCONST.groups;
    let conf = SimulationConfig;

    class BridgeEdge {
      constructor(material, floor, onlyBody) {
        this.floor = floor;
        this.material = material;
        this.onlyBody = !!onlyBody;

        this.radius = 0.2;
      }

      setEnds(a, b) {
        this.a = a;
        this.b = b;
      }

      makeBody(bridge, driver) {
        let [x1, y1] = this.a.absolute;
        let [x2, y2] = this.b.absolute;

        let physics = driver.physics;
        let maths = driver.mathDevice;
        let world = driver.world;
        let refBody = driver.refBody;

        //calculate some vectors
        let normal = maths.v2Build(y2 - y1, x1 - x2);
        let width = maths.v2Length(normal) + this.radius;
        //base rotation used for sprite
        let baseRotation = Math.atan2(normal[1], normal[0]) - Math.atan2(1, 0);
        maths.v2ScalarMul(normal, this.radius / maths.v2Length(normal), normal);

        //absolute position of inner body
        let cent = maths.v2Build(x2 - x1, y2 - y1);
        maths.v2ScalarMul(cent, 0.5, cent);


        let sprite = driver.sprite.create({
          color: [0.6862745098039216, 0.5411764705882353, 0.4117647058823529, 1],
          width,
          height: this.radius * 2,
          origin: [width / 2, this.radius],
        });


        let shapes = [
          //parallelogram
          physics.createPolygonShape({
            vertices: [
              [-cent  [0], -cent  [1]],
              [normal[0], normal[1]],
              [cent  [0], cent  [1]],
              [-normal[0], -normal[1]],
            ],
            material: this.material,
            group: G.BRIDGE.INNER,
            mask: this.onlyBody ? 0 : (G.WORLD | G.BRIDGE.INNER),
          }),
          //rectangle
          physics.createPolygonShape({
            vertices: [
              [normal[0] - cent[0], normal[1] - cent[1]],
              [normal[0] + cent[0], normal[1] + cent[1]],
              [-normal[0] + cent[0], -normal[1] + cent[1]],
              [-normal[0] - cent[0], -normal[1] - cent[1]]
            ],
            material: this.material,
            group: G.BRIDGE.OUTER | this.floor ? G.BRIDGE.FLOOR : 0,
            mask: this.onlyBody ? 0 : (this.floor ? (G.CAR.CHASSIS.FRONT | G.CAR.CHASSIS.BACK | G.CAR.WHEELS) : 0),
            userData: {sprite},
          }),
        ];

        this.body = physics.createRigidBody({
          shapes,
          position: [x1 + cent[0], y1 + cent[1]]
        });

        //set pos and rotation on update
        sprite.update = () => {
          [sprite.x, sprite.y] = this.body.getPosition();
          sprite.rotation = baseRotation + this.body.getRotation();
        };

        this.body.userData = {
          a: this.a,
          b: this.b,
          constraints: [],
          group: G.BRIDGE,
        };

        world.addRigidBody(this.body);

        //constrain if necessary
        if (!this.onlyBody) {
          let fixed = this.a.fixed && this.b.fixed;
          this.constrain(this.a.absolute, bridge, physics, world, refBody, fixed);
          this.constrain(this.b.absolute, bridge, physics, world, refBody, fixed);
        }

        //cost = length * cost
        this.cost = Math.floor(maths.v2Length(maths.v2Sub(this.a.relative, this.b.relative)) * this.material.userData.cost);

        return this;
      }

      constrain(point, bridge, physics, world, refBody, fixed) {
        let stiff = true;
        let breakUnderError = true;

        let touchingBodies = [];
        //query bodies at the point
        let count = world.bodyPointQuery(point, touchingBodies);

        for (let i = 0; i < count; i++) {
          let touchingBody = touchingBodies[i];
          let constr;
          if (!touchingBody.userData) {
            continue;
          }
          //if its the wall then connect
          if (touchingBody.isStatic() &&
            typeof touchingBody.userData.group !== 'undefined' &&
            touchingBody.userData.group === G.WORLD) {
            constr = physics.createPointConstraint({
              bodyA: refBody,
              bodyB: this.body,
              anchorA: point,
              anchorB: this.body.transformWorldPointToLocal(point),
              stiff,
              breakUnderError,
              maxError: conf.maxError,
            });
            //if its another edge then connect
          } else if (touchingBody.isDynamic() &&
            typeof touchingBody.userData.group !== 'undefined' &&
            touchingBody.userData.group === G.BRIDGE) {
            constr = physics.createPointConstraint({
              bodyA: touchingBody,
              bodyB: this.body,
              anchorA: touchingBody.transformWorldPointToLocal(point),
              anchorB: this.body.transformWorldPointToLocal(point),
              stiff,
              breakUnderError,
              maxError: conf.maxError,
            });
            touchingBody.userData.constraints.push(constr);
          }

          //register the constraint
          if (constr) {
            world.addConstraint(constr);
            if (bridge) {
              bridge.addConstraint(constr, fixed);
            }
            this.body.userData.constraints.push(constr);
            break;
          }
        }

        return count !== 0;
      }

      clear(world) {
        world.removeRigidBody(this.body);
        if (!this.onlyBody) {
          for (let constraint of this.body.userData.constraints) {
            world.removeConstraint(constraint);
          }
        }
      }


    }

    return BridgeEdge;
  });
