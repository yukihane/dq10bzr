'use strict';

/*
職人タブコントローラ.
*/
angular.module("dq10bzr.Main").controller("syokuninCtrl", ["$scope", "$http", "$log", "loginService",
function($scope, $http, $log, loginService) {

  $scope.list = [];
  
  $scope.necessaryMaterials = [];
  
  $scope.bzrResults = [];

  $scope.reload = function() {

    console.log(loginService.sessionId);

    var req = {
      method: "GET",
      url: "https://happy.dqx.jp/capi/syokunin/joblist/",
      headers: {
        "X-Smile-3DS-SESSIONID": loginService.character.sessionId,
      },
    };

    console.log("職人ギルド依頼");
    $http(req)
    .success(function(data, status, headers, config) {
      console.log(data);
      $scope.list = data.syokuninGuildList;
    })
    .error(function(data, status, headers, config) {
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
