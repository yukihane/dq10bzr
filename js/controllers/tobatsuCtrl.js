'use strict';

/*
討伐タブコントローラ.
*/
angular.module("dq10bzr.Main").controller("tobatsuCtrl", ["$scope", "$http", "$log", "loginService", 
function($scope, $http, $log, loginService) {

  $scope.list = [];

  $scope.reload = function() {
  
    console.log(loginService.sessionId);

    var req = {
      method: "GET",
      url: "https://happy.dqx.jp/capi/tobatsu/tobatsulist/",
      headers: {
        "X-Smile-3DS-SESSIONID": loginService.character.sessionId,
      },
    };
    

    console.log("討伐リクエスト");
    $http(req)
    .success(function(data, status, headers, config) {
      console.log(data);
      $scope.list = data;
    })
    .error(function(data, status, headers, config) {
    });

  };
}]);
