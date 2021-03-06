/* global angular, chrome, console */

/*
 footer コントローラ
 */
angular.module("dq10bzr.Main").controller("footerCtrl", ["$scope", "$timeout", "$log",
  function ($scope, $timeout, $log) {
    'use strict';

    $scope.message = "";

    $scope.$on("footer.notify", function (event, data) {
      console.log("message received");
      $scope.message = data;
      $timeout(function () {
        $scope.message = "";
      }, 30000);
    });
  }
]);
