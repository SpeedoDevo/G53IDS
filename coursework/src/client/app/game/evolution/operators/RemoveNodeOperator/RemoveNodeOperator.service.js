'use strict';

angular.module('bridgeApp')
  .service('RemoveNodeOperator', function (AbstractMutationOperator, SettingsManager) {
    class RemoveNodeOperator extends AbstractMutationOperator {
      constructor(rd) {
        super(rd);
        this.tries = 5;
        this.boost = 0;
        this.baseWeight = SettingsManager.all.ga.operators.RemoveNodeOperator;
      }

      get weight() {
        return this.rd.bridge ? this.baseWeight * ((this.rd.bridge.nodes.length + this.boost) / 30) : 7;
      }

      set weight(w) {

      }

      _mutate(builder) {
        //pick a node
        let refIndex = this.randBetween(0, builder.nodes.length - 1);
        if (builder.nodes[refIndex].fixed) return false;

        //remove it
        let fresh = this.builderWithoutNode(builder, refIndex);

        //check for disjointness
        if (!this.traversableNodes(fresh)) return false;


        //accept it
        builder.nodes = fresh.nodes;
        builder.connections = fresh.connections;

        return true;
      }

      boostWeight() {
        this.boost += 10;
      }

    }

    return RemoveNodeOperator;
  });
