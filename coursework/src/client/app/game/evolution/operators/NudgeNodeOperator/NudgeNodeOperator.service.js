'use strict';

angular.module('bridgeApp')
  .service('NudgeNodeOperator', function (AbstractMutationOperator) {
    class NudgeNodeOperator extends AbstractMutationOperator {
      constructor(rd) {
        super(rd);
      }

      _mutate(builder) {
        //pick a node
        let refIndex = this.randBetween(0, builder.nodes.length - 1);
        if (builder.nodes[refIndex].fixed) return false;

        //in a new builder
        let fresh = angular.copy(builder);

        //nudge a node
        let node = fresh.nodes[refIndex];
        node.x += this.randBetween(-2, 2);
        node.y += this.randBetween(-2, 2);

        //verify it
        if (!this.verifyNode(builder, node.relative)) return false;

        //verify connections
        for (let conn of fresh.connections) {
          if (conn.a === refIndex || conn.b === refIndex) {
            if (this.edgeIntersecting(fresh, fresh.nodes[conn.a], fresh.nodes[conn.b], true)) return false;
            if (this.distanceBetween(fresh.nodes[conn.a].relative, fresh.nodes[conn.b].relative) >
              conn.e.material.userData.maxLength) return false;
          }
        }

        //accept it
        builder.nodes = fresh.nodes;
        builder.connections = fresh.connections;

        return true;
      }
    }

    return NudgeNodeOperator;
  });
