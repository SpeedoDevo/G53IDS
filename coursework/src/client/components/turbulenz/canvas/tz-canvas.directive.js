'use strict';
/* global TurbulenzEngine: true */

angular.module('bridgeApp.tz')
  .directive('tzCanvas', function ($log, $window, $timeout, canvasInit, tzUtils) {

    return (function () {
      let bootstrap = (canvas, scope) => {
        if (!canvasInit.checkCanvasSupported(canvas)) {
          if (failed) failed('canvas not supported');
          return;
        }

        //if the driver is already set then
        if (scope.__GameDriver) {
          //initialise the engine
          let engine = TurbulenzEngine = tzUtils.WebGLTurbulenzEngine.create({
            canvas,
            fillParent: true
          });

          if (!engine) {
            $log.error('Failed to init TurbulenzEngine (canvas)');
            scope.__failed('TurbulenzEngine couldn\'t be initialised');
            return;
          }

          //initialise driver and bind to scope
          let driver = new scope.__GameDriver(engine);

          engine.onload = driver.onload;

          engine.onunload = driver.onunload.bind(driver);
          scope.$on('$destroy', driver.onunload.bind(driver));

          //start the driver
          driver.onload();
          if (driver.resize) $timeout(() => engine.resizeCanvas(), 300);
          //fulfill promise
          scope.__ready(driver);
        }
      };

      return {
        templateUrl: 'components/turbulenz/canvas/tz-canvas.html',
        restrict: 'E',
        replace: true,
        link: (scope, element/*, attrs*/) => {
          let GameDriver = scope.__GameDriver;
          //initialise the driver
          if (GameDriver && GameDriver.canvas) {
            GameDriver.canvas.then(c => {
              if (c) bootstrap(c, scope)
            });
          } else {
            bootstrap(element[0], scope);
          }
        },
        controller: function ($scope) {
          //used from driver directives to set the constructor
          this.setGameDriver = function (gameDriver) {
            $scope.__GameDriver = gameDriver;
            return new Promise((resolve, reject) => {
              $scope.__ready = resolve;
              $scope.__failed = reject;
            });
          };
        }
      };
    })();
  });
