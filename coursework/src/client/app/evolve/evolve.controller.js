'use strict';

angular.module('bridgeApp')
  .controller('EvolveCtrl', function ($scope, $state, settings) {
    //empty array fro ng-repeat
    $scope.simulations = new Array(settings.ga.simulations.w * settings.ga.simulations.h);
    $scope.cols = settings.ga.simulations.w;
    $scope.speed = 1;
    $scope.simulate = true;
    $scope.render = true;
    $scope.reload = () => {
      let sim = $scope.simulate;
      //pause
      $scope.simulate = false;
      //reload state
      $state.go('evolve', {lenient: true}, {reload: true})
        //resume if sims were running
        .catch(() => $scope.simulate = sim);
    };

    let unwatch = $scope.$watch(() => '' + $scope.simulate + $scope.render + $scope.speed, () => {
      //update drivers
      if ($scope.em) $scope.em.drivers.forEach(d => d.opts = {
        simulate: $scope.simulate,
        speed: $scope.speed,
        render: $scope.render
      });
    });
    $scope.$on('$destroy', unwatch);
  });
