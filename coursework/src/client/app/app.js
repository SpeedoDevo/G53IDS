'use strict';

angular.module('bridgeApp', [
    'bridgeApp.constants',
    'bridgeApp.tz',
    'ngMaterial',
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ui.router',
    'ui.ace',
    'ngStorage',
  ])
  .config(function ($urlRouterProvider, $locationProvider, $mdThemingProvider) {
    $urlRouterProvider
      .otherwise('/');

    $locationProvider.html5Mode(true);

    $mdThemingProvider.theme('default')
      .accentPalette('deep-purple');
  });
