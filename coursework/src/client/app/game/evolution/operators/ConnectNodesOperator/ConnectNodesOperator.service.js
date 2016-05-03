'use strict';

angular.module('bridgeApp')
  .service('ConnectNodesOperator', function (AbstractMutationOperator) {
    class ConnectNodesOperator extends AbstractMutationOperator {
      constructor(rd) {
        super(rd);
      }

      _mutate(builder) {
        //choose first
        let first = this.randBetween(0, builder.nodes.length - 1);

        //choose material, and therefore range
        let material = this.chooseMaterial();

        //filter nodes that are connectible
        let inRange = this.findInRange(builder, builder.nodes[first], material);

        //choose another node if none in range
        if (inRange.length === 0) return false;

        let second = this.randBetween(0, inRange.length - 1);
        second = builder.nodes.indexOf(inRange[second]);

        //nodes already connected, try again
        if (builder.connections.findIndex(c => {
            return (c.a === first && c.b === second) ||
              (c.a === second && c.b === first);
          }) >= 0) return false;

        let floor = this.randBetween(0, 100) < 1;

        return this.connectNodesIfNotIntersecting(builder, builder.nodes[first], builder.nodes[second], material, floor);
      }
    }

    return ConnectNodesOperator;
  });
