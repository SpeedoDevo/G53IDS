'use strict';

angular.module('bridgeApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('evolve', {
        url: '/evolve',
        templateUrl: 'app/evolve/evolve.html',
        controller: 'EvolveCtrl',
        params: {
          lenient: false,
        },
        resolve: {
          settings: ($mdDialog, $state, $stateParams) => {
            //show a dialog before switching states
            let settingsPromise = $mdDialog.show({
              templateUrl: 'app/evolve/dialog.html',
              fullscreen: true,
              controller: ($scope, $mdUtil, SettingsManager, StorageManager) => {
                $scope.ga = SettingsManager.ga.load();
                $scope.saves = StorageManager.saves;
                $scope.activeSaves = (new Array($scope.saves.length)).fill(false);
                $scope.advanced = false;
                $scope.fitnessInvalid = false;
                $scope.selectionInvalid = false;
                $scope.lenient = !!$stateParams.lenient;

                //TODO: compile fns
                //let fitnessCompilerFn = function(e) {
                //  let valid = false;
                //  try {
                //    let f = new Function(
                //      'state, time, distance, brokenRate, maxLoad, breakTime, breakDistance, cost',
                //      e.data
                //    );
                //    f('crashed',0,0,100,100,0,0,1000);
                //    valid = true
                //  } catch (e) {}
                //
                //  self.postMessage(valid);
                //};
                //
                //let blob = new Blob(["onmessage ="+fitnessCompilerFn.toString()], { type: "text/javascript" });
                //
                //let fitnessCompiler = new Worker(window.URL.createObjectURL(blob));
                //fitnessCompiler.onmessage = function(e) {
                //  console.log(e.data);
                //};

                //debounce update to make things snappy
                let debouncedUpdate = $mdUtil.debounce((fresh, old) => {
                  //TODO: compilation
                  //$timeout(() => {
                  //  console.time('fn');
                  //  try {
                  //    new Function(
                  //      'state, time, distance, brokenRate, maxLoad, breakTime, breakDistance, cost',
                  //      $scope.ga.fitness
                  //    );
                  //    $scope.fitnessInvalid = false;
                  //  } catch (e) {
                  //    $scope.fitnessInvalid = true;
                  //  }
                  //  console.timeEnd('fn');
                  //}, 0, true);

                  //fitnessCompiler.postMessage($scope.ga.fitness);
                  SettingsManager.ga.update(fresh);
                }, 500);

                let unwatch = $scope.$watch('ga', debouncedUpdate, true);
                $scope.$on('$destroy', unwatch);

                $scope.close = () => {
                  $mdDialog.cancel();
                };
                $scope.proceed = () => {
                  //TODO: pass compiled fns here
                  $mdDialog.hide(SettingsManager.all);
                };

                $scope.defaultGA = () => {
                  $scope.ga = SettingsManager.default.ga;
                };
                $scope.editorLoaded = function (editor) {
                  editor.$blockScrolling = Infinity;
                  editor.resize(true);
                };

                $scope.floor = Math.floor;
              }
            });

            //determine if closing should throw back to main
            if (!$stateParams.lenient) {
              settingsPromise.catch(() => $state.go('main'));
            }

            return settingsPromise;
          }
        }
      });
  });
