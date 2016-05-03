'use strict';

angular.module('bridgeApp')
  .directive('worldSettings', function (SettingsManager, $mdUtil) {
    let settings = SettingsManager.world.load();
    return {
      templateUrl: 'app/components/world-settings/world-settings.html',
      restrict: 'E',
      replace: true,
      link: (scope) => {
        scope.settings = settings;
        scope.default = () => {
          angular.merge(settings, SettingsManager.default.world);
        };
        //debounce update to make things snappy
        let debouncedUpdate = $mdUtil.debounce((newValue) => {
          SettingsManager.world.update(newValue);
        }, 200);

        let unwatch = scope.$watch('settings', debouncedUpdate, true);
        scope.$on('$destroy', unwatch);
      }
    };
  });
