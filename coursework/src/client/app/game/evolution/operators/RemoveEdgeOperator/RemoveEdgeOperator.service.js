'use strict';

angular.module('bridgeApp')
  .service('RemoveEdgeOperator', function (AbstractMutationOperator, SettingsManager) {
    class RemoveEdgeOperator extends AbstractMutationOperator {
      constructor(rd) {
        super(rd);
        this.tries = 5;
        this.boost = 0;
        this.baseWeight = SettingsManager.all.ga.operators.RemoveEdgeOperator;
      }


      get weight() {
        return this.rd.bridge ? this.baseWeight * ((this.rd.bridge.nodes.length + this.boost) / 30) : 7;
      }

      set weight(w) {

      }

      _mutate(builder) {
        //pick an edge
        let refIndex = this.randBetween(0, builder.connections.length - 1);
        if (builder.connections[refIndex].fixed) return false;

        let fresh = angular.copy(builder);

        //delete a connection
        fresh.connections.splice(refIndex, 1);

        //remove a node if it doesn't hae conns anymore
        let empties = this.countNodeConnections(fresh).filter(v => v.ns.length === 0);
        empties.forEach(v => this.builderWithoutNode(fresh, v.i));


        //check if the bridge is disjoint
        if (!this.traversableNodes(fresh)) return false;


        //accept mutation
        builder.nodes = fresh.nodes;
        builder.connections = fresh.connections;

        return true;
      }

      boostWeight() {
        this.boost += 10;
      }

    }

    return RemoveEdgeOperator;
  });
