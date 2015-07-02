'use strict';

/*
フレンドタブコントローラ.
*/
angular.module("dq10bzr.Main").controller("friendCtrl", ["$scope", "$http", "$log", "request",
function($scope, $http, $log, request) {

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
    var promise = request.friends(index);
    promise.then(function(data) {
      $scope.friends = $scope.friends.concat(data.friendsValueList);
      $scope.isOffsetEnd = data.isOffsetEnd;
      $scope.nextIndex = index + 1;
    }, function(data){
      console.log("ERROR");
    });
  };

  $scope.open = function(webPcNo) {
    console.log("open clicked");
    window.open("http://hiroba.dqx.jp/sc/character/" + webPcNo + "/");
  };

}]);
