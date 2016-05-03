'use strict';

angular.module('bridgeApp')
  .service('AddNodeOperator', function (AbstractMutationOperator) {
    class AddNodeOperator extends AbstractMutationOperator {
      constructor(rd) {
        super(rd);
      }

      _mutate(builder) {
        //pick a node
        let reference = builder.nodes[this.randBetween(0, builder.nodes.length - 1)];
        let [rx, ry] = reference.relative;

        //choose a material
        let material = this.chooseMaterial();

        //generate a node that might be in range
        let xy = [
          rx + this.randBetween(-material.userData.maxLength, material.userData.maxLength),
          ry + this.randBetween(-material.userData.maxLength, material.userData.maxLength),
        ];

        //try again if it is too far
        let dist = this.distanceBetween([rx, ry], xy);
        if (dist > material.userData.maxLength || dist <= 0) return false;

        let node;
        if ((node = this.verifyNode(builder, xy, material))) {
          return this.connectRandomly(builder, node, material);
        } else {
          return false;
        }
      }
    }

    return AddNodeOperator;
  });
