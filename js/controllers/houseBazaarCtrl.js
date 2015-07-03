/* global angular, chrome */

'use strict';

/*
モーモンバザータブコントローラ.
*/
angular.module("dq10bzr.Main").controller("houseBazaarCtrl", ["$scope", "$http", "$log", "loginService",
function($scope, $http, $log, loginService) {

  $scope.reload = function() {

    console.log(loginService.sessionId);

    var req = {
      method: "GET",
      url: "https://happy.dqx.jp/capi/housing/bazaar/history/",
      headers: {
        "X-Smile-3DS-SESSIONID": loginService.character.sessionId,
      },
    };

    $http(req)
    .success(function(data, status, headers, config) {
      console.log(data);
      $scope.debug = data;
    })
    .error(function(data, status, headers, config) {
    });

  };

}]);
