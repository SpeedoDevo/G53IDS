'use strict';

angular.module('bridgeApp')
  .controller('MainController', function (StorageManager, $mdDialog, $timeout) {

    class MainController {
      constructor() {
        this.saves = StorageManager.saves;
        //show the help to newbies
        let newbie = typeof StorageManager.storage.newbie === 'undefined';
        if (newbie) {
          this.showHelp()
            //after the popup is gone mark the user as non-newbie
            .finally(() => StorageManager.storage.newbie = false);
        }
      }

      showHelp(event) {
        let opts = {
          templateUrl: 'app/help/main-help-dialog.html',
          clickOutsideToClose: true,
          controller: /*@ngInject*/ ($scope) => {
            $scope.close = () => {
              $mdDialog.cancel();
            };
          }
        };

        if (event) {
          opts.targetEvent = event;
        }
        return $mdDialog.show(opts);
      }

      setDriverInstance(driver) {
        this.driver = driver;
      }

      startSave() {
        //remove previous
        this.cancel();
        //let it propagate
        $timeout(() => {
          //then set a new one
          this.pending = {
            id: this.uuid(),
            name: 'save ' + (this.saves.length + 1),
            builder: StorageManager.refresh(this.driver.bridgeBuilder),
            cost: this.driver.bridge.cost
          };
        }, 0, true);
      }

      save() {
        this.saves.push(this.pending);
        this.cancel();
      }

      cancel() {
        this.pending = null;
      }

      remove(id) {
        this.saves.splice(this.saves.findIndex(s => s.id === id), 1);
      }

      load(id) {
        let save = this.saves[this.saves.findIndex(s => s.id === id)];
        this.driver.setBuilder(save.builder);
      }

      uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }

    }

    return new MainController();
  });
