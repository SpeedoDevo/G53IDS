'use strict';

angular.module('bridgeApp')
  .service('MakeTriangleOperator', function (AbstractMutationOperator) {
    class MakeTriangleOperator extends AbstractMutationOperator {
      constructor(rd) {
        super(rd);
      }

      _mutate(builder) {
        //count conns
        var connCnt = this.countNodeConnections(builder);

        //take ones with more than 2 conns
        let candidateNodes = connCnt.filter(v => v.ns.length >= 2);

        //pick two connected nodes
        let a = candidateNodes[this.randBetween(0, candidateNodes.length - 1)];
        let b = a.ns[this.randBetween(0, a.ns.length - 1)];

        let material = this.chooseMaterial();

        //try to make a triangle by looking for a third node that are in the range of both
        let inBrange = this.findInRange(builder, builder.nodes[b], material)
          .map(v => builder.nodes.indexOf(v));
        let inABrange = a.ns.filter(v => inBrange.indexOf(v) >= 0);

        if (inABrange.length === 0) {
          return false;
        } else {
          let c = inABrange[this.randBetween(0, inABrange.length - 1)];
          //if this connection is not intersecting with another edge then add it to the builder
          return !!this.connectNodesIfNotIntersecting(builder, builder.nodes[b], builder.nodes[c], material, false);
        }
      }
    }
    return MakeTriangleOperator;
  });
