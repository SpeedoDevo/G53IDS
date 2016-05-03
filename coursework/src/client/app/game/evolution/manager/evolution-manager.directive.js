'use strict';

angular.module('bridgeApp')
  .directive('evolutionManager', function (EvolutionManager, SettingsManager) {

    return {
      restrict: 'EA',
      controller: function ($scope) {
        let target = SettingsManager.all.ga.simulations.w * SettingsManager.all.ga.simulations.h;
        let displays = [];

        let startMaybe = () => {
          //if we have all the required drivers then start evolution
          if (displays.length === target) {
            $scope.em = new EvolutionManager(displays);
          }
        };

        this.addDisplay = driver => {
          displays.push(driver);
          startMaybe();
        };

        this.removeDisplay = driver => {
          let i = displays.indexOf(driver);
          displays.splice(i, 1);
        }
      }
    };
  });
