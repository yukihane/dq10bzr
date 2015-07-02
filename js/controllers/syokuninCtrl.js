'use strict';

/*
職人タブコントローラ.
*/
angular.module("dq10bzr.Main").controller("syokuninCtrl", ["$rootScope", "$scope", "$log", "request",
function($rootScope, $scope, $log, request) {

  $scope.list = [];
  
  $scope.necessaryMaterials = [];
  
  $scope.bzrResults = [];

  $scope.reload = function() {

    var promise = request.joblist();
    promise.then(function(data) {
      $scope.list = data.syokuninGuildList;
    }, function(msg) {
      $rootScope.$broadcast("footer.notify", msg);
    });
  };

  $scope.detail = function(jobNo, recipeNo, createWebItemNoHash) {

    var req = {
      method: "GET",
      url: "https://happy.dqx.jp/capi/syokunin/jobdetail/" + jobNo + "/" + recipeNo + "/"
        + (createWebItemNoHash ? createWebItemNoHash + "/" : ""),
      headers: {
        "X-Smile-3DS-SESSIONID": loginService.character.sessionId,
      },
    };

    console.log("職人ギルド依頼");
    $http(req)
    .success(function(data, status, headers, config) {
      console.log(data);
      $scope.necessaryMaterials = data.recipeDetail.necessaryMaterialList;
    })
    .error(function(data, status, headers, config) {
    });

  };

  $scope.searchBzr = function(webItemNoHash) {

    var req = {
      method: "GET",
      url: "https://happy.dqx.jp/capi/bazaar/search/",
      params: {
        bazaarno: 99,
        webitemid: webItemNoHash,
      },
      headers: {
        "X-Smile-3DS-SESSIONID": loginService.character.sessionId,
      },
    };

    $http(req)
    .success(function(data, status, headers, config) {
      console.log(data);
      $scope.bzrResults = data;
    })
    .error(function(data, status, headers, config) {
    });

    
  };

}]);
