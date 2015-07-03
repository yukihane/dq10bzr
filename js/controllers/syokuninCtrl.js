/* global angular, chrome */

'use strict';

/*
 職人タブコントローラ.
 */
angular.module("dq10bzr.Main").controller("syokuninCtrl", ["$rootScope", "$scope", "$log", "request",
  function ($rootScope, $scope, $log, request) {

    $scope.list = [];

    $scope.necessaryMaterials = [];

    $scope.bzrResults = [];

    $scope.reload = function () {

      var promise = request.joblist();
      promise.then(function (data) {
        $scope.list = data.syokuninGuildList;
      }, function (msg) {
        $rootScope.$broadcast("footer.notify", msg);
      });
    };

    $scope.detail = function (jobNo, recipeNo, createWebItemNoHash) {

      var promise = request.jobdetail(jobNo, recipeNo, createWebItemNoHash);

      promise.then(function (data) {
        $scope.necessaryMaterials = data.recipeDetail.necessaryMaterialList;
      }, function (msg) {
        $rootScope.$broadcast("footer.notify", msg);
      });
    };

    $scope.searchBzr = function (webItemNoHash) {

      var cond = {
        bazaarno: 99,
        webitemid: webItemNoHash
      };

      var promise = request.bazaar(cond);

      promise.then(function (data) {
        $scope.bzrResults = data;
      }, function (msg) {
        $rootScope.$broadcast("footer.notify", msg);
      });
    };

  }
]);
