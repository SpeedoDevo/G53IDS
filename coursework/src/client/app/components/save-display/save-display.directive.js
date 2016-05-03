'use strict';

angular.module('bridgeApp')
  .directive('saveDisplay', function () {
    return {
      templateUrl: 'app/components/save-display/save-display.html',
      restrict: 'E',
      scope: {save: '=', active: '='},
      link: (scope, el, attrs) => scope.input = 'input' in attrs,
      //actions are transcluded
      transclude: true,
    };
  });
