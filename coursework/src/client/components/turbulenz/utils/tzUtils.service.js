'use strict';

/* global RequestHandler: true */
/* global FontManager: true */
/* global ShaderManager: true */
/* global TurbulenzServices: true */
/* global Physics2DDevice: true */
/* global Draw2D: true */
/* global Physics2DDebugDraw: true */
/* global WebGLTurbulenzEngine: true */

angular.module('bridgeApp.tz')
  .service('tzUtils', function () {
    return {
      RequestHandler,
      FontManager,
      ShaderManager,
      TurbulenzServices,
      Physics2DDevice,
      Draw2D,
      Draw2DSprite,
      Physics2DDebugDraw,
      WebGLTurbulenzEngine,
    };
  });
