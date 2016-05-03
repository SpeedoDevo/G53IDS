'use strict';

angular.module('bridgeApp.tz')
  .service('canvasInit', function ($log) {

    this.checkCanvasSupported = function (canvas) {
      //check if webgl is supported
      let ret = true;
      let contextNames = ['webgl', 'experimental-webgl'];
      let context = null;

      for (var i = 0; i < contextNames.length; i += 1)
      {
          try {
              context = canvas.getContext(contextNames[i]);
          } catch (e) {}

        if (context) {
              break;
          }
      }
      if (!context)
      {
          ret = false;
          $log.error('Sorry, but your browser does not support WebGL or does not have it enabled.');
      }

      return ret;
    };

  });
