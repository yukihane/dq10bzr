'use strict';

/*
フレンドタブコントローラ.
*/
angular.module("dq10bzr.Main").controller("friendCtrl", ["$scope", "$http", "$log", "loginService", 
function($scope, $http, $log, loginService) {

  $scope.friends = [];
  $scope.isOffsetEnd = true;
  $scope.nextIndex = 0;

  $scope.reload = function() {
    $scope.friends = [];
    $scope.isOffsetEnd = true;
    $scope.nextIndex = 0;

    $scope.query(0);
  };
  
  $scope.query = function(index) {
    console.log(loginService.sessionId);

    var req = {
      method: "GET",
      url: "https://happy.dqx.jp/capi/profile/friends/1/" + index + "/",
      headers: {
        "X-Smile-3DS-SESSIONID": loginService.character.sessionId,
      },
    };
    

    console.log("フレンドリクエスト");
    $http(req)
    .success(function(data, status, headers, config) {
      console.log(data);
      $scope.friends = $scope.friends.concat(data.friendsValueList);
      $scope.isOffsetEnd = data.isOffsetEnd;
      $scope.nextIndex = index + 1;
    })
    .error(function(data, status, headers, config) {
    });
  };

  $scope.open = function(webPcNo) {
    console.log("open clicked");
    window.open("http://hiroba.dqx.jp/sc/character/" + webPcNo + "/");
  };

}]);
