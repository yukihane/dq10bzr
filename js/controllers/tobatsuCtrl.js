/* global angular, chrome */

'use strict';

/*
討伐タブコントローラ.
*/
angular.module("dq10bzr.Main").controller("tobatsuCtrl", ["$rootScope", "$scope", "$log", "request",
function($rootScope, $scope, $log, request) {

  $scope.list = [];

  $scope.reload = function() {

    var promise = request.tobatsu();
    promise.then(function(data) {
      $scope.list = data;
    }, function(msg) {
      $rootScope.$broadcast("footer.notify", msg);
    });
  };

}]);
