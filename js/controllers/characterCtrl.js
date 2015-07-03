/* global angular, chrome, console */

/*
 キャラ変更に関わるコントローラ.
 キャラ変更ボタンなど.
 */
angular.module("dq10bzr.Main").controller('characterCtrl', ["$scope", "$modalInstance", "$http", "$log", "characters", "sessionId",
  function ($scope, $modalInstance, $http, $log, characters, sessionId) {
    'use strict';

    $scope.characters = characters;

    $scope.select = function (index) {
      $log.info("index: " + index);

      var character = characters[index];
      var webPcNo = character.webPcNo;

      var req = {
        method: "GET",
        url: "https://happy.dqx.jp/capi/login/characterselect/" + webPcNo + "/",
        headers: {
          "X-Smile-3DS-SESSIONID": sessionId
        }
      };


      $http(req)
        .success(function (data, status, headers, config) {
          $log.info(data);
          $modalInstance.close(character);
        })
        .error(function (data, status, headers, config) {
        });

    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  }
]);
