'use strict';

angular.module('bridgeApp')
  .service('MirrorNodeOperator', function (AbstractMutationOperator) {
    class MirrorNodeOperator extends AbstractMutationOperator {
      constructor(rd) {
        super(rd);
      }

      _mutate(builder) {
        //pick a node
        let reference = builder.nodes[this.randBetween(0, builder.nodes.length - 1)];
        if (reference.fixed) return false;

        let [px, py] = reference.relative;

        //determine the midpoint of the platforms
        let midpoint = this.rd.mathDevice.v2ScalarMul(
          this.rd.mathDevice.v2Sub(this.rd.platforms.getEnd(), this.rd.platforms.getStart()),
          0.5);
        midpoint = midpoint.map(Math.round);

        let s = this.rd.platforms.getStart();
        let e = this.rd.platforms.getEnd();

        //mirror it by doing some bloody vector maths
        let [y1, x1] = this.rd.mathDevice.v2Add(
          this.rd.mathDevice.v2Mul(this.rd.mathDevice.v2Sub(s, midpoint), [-1, 1]), midpoint);
        let [y2, x2] = this.rd.mathDevice.v2Add(
          this.rd.mathDevice.v2Mul(this.rd.mathDevice.v2Sub(e, midpoint), [-1, 1]), midpoint);

        let a = y2 - y1;
        let b = -(x2 - x1);
        let c = -a * x1 - b * y1;

        let m = Math.sqrt(a * a + b * b);

        a = a / m;
        b = b / m;
        c = c / m;

        let d = a * px + b * py + c;

        let mirrored = [px - 2 * a * d, py - 2 * b * d].map(Math.round);

        //choose material, and therefore range
        let material = this.chooseMaterial();

        let node;
        if ((node = this.verifyNode(builder, mirrored, material))) {
          return this.connectRandomly(builder, node, material);
        } else {
          return false;
        }
      }
    }

    return MirrorNodeOperator;
  });
