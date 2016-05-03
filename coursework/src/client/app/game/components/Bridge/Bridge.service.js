'use strict';

angular.module('bridgeApp')
  .service('Bridge', function (SimulationConfig) {
    let conf = SimulationConfig;
    const S = {
      fresh: 'fresh',
      broken: 'broken'
    };

    class Bridge {
      constructor(builder, driver) {
        this.nodes = angular.copy(builder.nodes);
        this.driver = driver;
        this.edges = [];

        this.constraints = [];
        this.cost = this.nodes.length * 10;

        this.nodes.forEach(n => n.setPlatform(driver.platforms));

        //connect nodes by making the edge bodies
        for (let conn of builder.connections) {
          this.nodes[conn.a].connect(this.nodes[conn.b], conn.e);
          this.edges.push(conn.e.makeBody(this, driver));
          this.cost += conn.e.cost;
        }

        //store data
        this.buildTime = driver.realTime;
        this.breakTime = 10;
        this.breakDistance = 0.01;
        this.brokenCount = 0;
        this.state = S.fresh;
      }

      clear(world) {
        for (let edge of this.edges) {
          edge.clear(world);
        }
      }

      addConstraint(con, fixed) {
        //hacky way of keeping track of broken constraints
        this.constraints.push(con);
        if (fixed) {
          con._clearCache = () => {
            this.state = S.broken;
            this.breakTime = this.driver.realTime - this.buildTime;
            this.breakDistance = this.driver.car.distance;
            this.brokenCount++;
          };
        } else {
          con._clearCache = () => this.brokenCount++;
        }
      }

      calculateErrorForConstraint(con) {
        //stolen from Turbulenz, cos you can't just get the error of constraints
        var data = con._data;
        var b1 = con.bodyA._data;
        var b2 = con.bodyB._data;

        var rx1 = data[(9)];
        var ry1 = data[(9) + 1];

        var rx2 = data[(11)];
        var ry2 = data[(11) + 1];

        var errX = ((b1[(2)] + rx1) - (b2[(2)] + rx2));
        var errY = ((b1[(2) + 1] + ry1) - (b2[(2) + 1] + ry2));

        return ((errX * errX) + (errY * errY));
      }

      getLoad() {
        if (this.state === S.broken) {
          return 100;
        } else {
          let max = -1;
          //maximal positional error
          for (let con of this.constraints) {
            let err = this.calculateErrorForConstraint(con);
            max = err > max ? err : max;
          }
          let ret = (max / (conf.maxError * conf.maxError) * 100);
          return ret > 100 ? 100 : ret;
        }
      }

      get brokenRate() {
        return this.brokenCount / this.constraints.length * 100;
      }

      exportConstructor() {
        let s = 'let bridge = {\n  nodes: [\n';
        for (let n of this.nodes) {
          s += `    new BridgeNode(${n.x},${n.y}),\n`;
        }
        s += '  ],\n  connections: [\n';
        for (let e of this.edges) {
          let a = this.nodes.findIndex(n => n === e.a);
          let b = this.nodes.findIndex(n => n === e.b);
          s += `    {a: ${a}, b: ${b},e: new BridgeEdge(this.bridgeMaterial, ${e.floor})},\n`;
        }
        s += '  ]\n};\n';
        return s;
      }

    }

    return Bridge;
  });
