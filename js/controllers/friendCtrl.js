/* global angular, chrome, console */

/*
 フレンドタブコントローラ.
 */
angular.module("dq10bzr.Main").controller("friendCtrl", ["$rootScope", "$scope", "$log", "request",
  function ($rootScope, $scope, $log, request) {
    'use strict';

    $scope.friends = [];
    $scope.isOffsetEnd = true;
    $scope.nextIndex = 0;

    $scope.reload = function () {
      $scope.friends = [];
      $scope.isOffsetEnd = true;
      $scope.nextIndex = 0;

      $scope.query(0);
    };

    $scope.query = function (index) {
      try {
        var promise = request.friends(index);
        promise.then(function (data) {
          $scope.friends = $scope.friends.concat(data.friendsValueList);
          $scope.isOffsetEnd = data.isOffsetEnd;
          $scope.nextIndex = index + 1;
        }, function (msg) {
          $rootScope.$broadcast("footer.notify", msg);
        });
      } catch (e) {
        $rootScope.$broadcast("footer.notify", e);
      }
    };

    $scope.open = function (webPcNo) {
      console.log("open clicked");
      window.open("http://hiroba.dqx.jp/sc/character/" + webPcNo + "/");
    };

  }
]);
