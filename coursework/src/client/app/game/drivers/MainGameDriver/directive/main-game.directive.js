'use strict';

angular.module('bridgeApp')
  .directive('mainGame', function (MainGameDriver) {
    return {
      restrict: 'A',
      require: 'tzCanvas',
      priority: 1,
      compile: () => ({
        pre: (scope, element, attrs, tz) => {
          tz.setGameDriver(MainGameDriver)
            //send the instance to the controller scope
            .then(scope.main.setDriverInstance.bind(scope.main));
        }
      })
    };
  });
