'use strict';

angular.module('bridgeApp')
  .directive('evolutionDisplay', function (EvolutionDisplayDriver) {
    return {
      restrict: 'A',
      require: ['tzCanvas', '^evolutionManager'],
      priority: 1,
      compile: () => {
        return {
          pre: (scope, element, attrs, ctrls) => {
            let inst;
            ctrls[0].setGameDriver(EvolutionDisplayDriver)
              //after the driver loads
              .then(instance => {
                //store the instance
                ctrls[1].addDisplay(instance);
                inst = instance;
              });

            //remove it when the scope is destroyed
            scope.$on('$destroy', () => ctrls[1].removeDisplay(inst));
          }
        };
      }
    };
  });
