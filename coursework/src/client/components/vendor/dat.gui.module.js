'use strict';
/* global dat: true */

angular.module('dat.gui', [])
  .service('DatGUI', function () {
    let instance;
    this.create = (config) => (instance = new dat.GUI(config));
    this.getInstance = () => instance;
  })
  .directive('datGui', function (DatGUI) {
    return {
      restrict: 'E',
      link: function (scope, el/*, attrs*/) {
        let gui = DatGUI.create({ autoPlace: false });
        el[0].appendChild(gui.domElement);
      }
    };
  });
