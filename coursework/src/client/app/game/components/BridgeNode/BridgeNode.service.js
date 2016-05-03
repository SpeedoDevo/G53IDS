'use strict';

angular.module('bridgeApp')
  .service('BridgeNode', function () {
    class BridgeNode {
      constructor(x, y, fixed) {
        this.x = x;
        this.y = y;
        this.fixed = !!fixed;
        this.children = [];
      }

      setPlatform(platforms) {
        this.platforms = platforms;
        //chainable calls
        return this;
      }

      connect(node, edge) {
        this.children.push(edge);
        node.children.push(edge);
        edge.setEnds(this, node);
      }

      //array lookup helper
      equals(other) {
        return other.x === this.x && other.y === this.y;
      }

      get absolute() {
        let [x,y] = this.platforms.getStart();
        return [this.x + x, this.y + y];
      }

      get relative() {
        return [this.x, this.y];
      }

      toString() {
        return `BN(${this.x},${this.y})`;
      }
    }

    return BridgeNode;
  });
