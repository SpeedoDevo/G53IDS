'use strict';

angular.module('bridgeApp')
  .directive('leaderboardDisplay', function ($mdDialog) {
    return {
      templateUrl: 'app/components/leaderboard-display/leaderboard-display.html',
      restrict: 'E',
      replace: true,
      //take item and index from params
      scope: {
        item: '=',
        index: '='
      },
      link: (scope, el, attrs) => {
        //bridge display doesn't refresh itself
        scope.refresh = false;
        //open ancestry dialog
        scope.showAncestry = (targetEvent) => {
          $mdDialog.show({
            templateUrl: 'app/components/leaderboard-display/ancestry.html',
            targetEvent,
            clickOutsideToClose: true,
            controller: function ($scope, $mdDialog) {
              //current
              $scope.item = scope.item;
              //build list of ancestors
              $scope.items = (() => {
                let res = [];
                res.unshift(scope.item);
                let p = scope.item;
                while (p = p.parent) {
                  res.unshift(p);
                }
                return res;
              })();
              //aggregate mutations
              $scope.aggregate = (() => {
                let res = [];
                $scope.items.forEach((v, i) => {
                  let curr = i - 1 >= 0 ? angular.copy(res[i - 1]) : {};
                  for (let prop in v.mutations) {
                    if (v.mutations.hasOwnProperty(prop)) {
                      if (!curr[prop]) curr[prop] = {};
                      for (let type in v.mutations[prop]) {
                        if (v.mutations[prop].hasOwnProperty(type)) {
                          //make camelcase spaced out
                          let spaced = type.replace(/([a-z])([A-Z])/g, '$1 $2');
                          //add or create
                          curr[prop][spaced] = curr[prop][spaced] ?
                          curr[prop][spaced] + v.mutations[prop][type] : v.mutations[prop][type]
                        }
                      }
                    }
                  }
                  res.push(curr);
                });
                return res;
              })();
              //onkeypress for hidden input
              $scope.key = (ev) => {
                if (ev.keyCode == 39) {
                  $scope.current = $scope.current + 1 >= $scope.items.length ? $scope.current : $scope.current + 1;
                } else if (ev.keyCode == 37) {
                  $scope.current = $scope.current - 1 < 0 ? 0 : $scope.current - 1;
                }
              };
              //current is the last
              $scope.current = $scope.items.length - 1;

              $scope.maxGen = $scope.items[$scope.current].id.split('/')[0];

              //refresh bridge display if current changes
              $scope.refresh = false;
              let unwatch = $scope.$watch('current', () => {
                $scope.refresh = !$scope.refresh;
              });
              $scope.$on('$destroy', unwatch);

              $scope.close = $mdDialog.hide;
              console.log($scope);
            }
          })
        };

        let unwatch = scope.$watch('item', () => {
          scope.refresh = !scope.refresh;
        });
        scope.$on('$destroy', unwatch);
      }
    };
  });
