'use strict';

angular.module('bridgeApp')
  .service('SettingsManager', function ($rootScope, StorageManager) {
    //this manages the settings
    class SettingsManager {
      constructor() {
        //load 'em in
        this.settings = StorageManager.settings;
      }

      get world() {
        let _this = this;
        return {
          load() {
            return angular.copy(_this.settings.world);
          },
          update(fresh) {
            //emit update event
            $rootScope.$broadcast('world-settings-update', fresh,
              (_this.settings.world.elevation !== fresh.elevation ||
              _this.settings.world.distance !== fresh.distance));
            _this.settings.world = angular.copy(fresh);
          }
        };
      }

      get ga() {
        let _this = this;
        return {
          load() {
            return angular.copy(_this.settings.ga);
          },
          update(fresh) {
            _this.settings.ga = angular.copy(fresh);
          }
        };
      }

      get all() {
        return angular.copy(this.settings);
      }

      get default() {
        return StorageManager.default.settings;
      }
    }

    //singleton instance
    return new SettingsManager();
  });
