/* global angular, chrome */

'use strict';

/*
ログイン処理に関わるコントローラ.
*/
angular.module("dq10bzr.Main").controller('loginCtrl', ["$scope", "$modalInstance", "$http", "$log", "action",
function ($scope, $modalInstance, $http, $log, action) {

  $scope.sqexid = "";
  $scope.password = "";

  $scope.ok = function () {

    var req = {
      method: "POST",
      url: OAUTH_URL + action,
      responseType: "document",
      headears: {
        "Content-type": "application/x-www-form-urlencoded",
      },
      params: {
        sqexid: $scope.sqexid,
        password: $scope.password,
      },
    };

    $http(req)
    .success(function(data, status, headers, config) {
      $log.info(data);


      var inputSqexid = data.querySelector("form #sqexid");
      var inputPassword = data.querySelector("form #password");
      var inputOtppw = data.querySelector("form #otppw");
      
      if(inputSqexid && inputPassword) {
        $log.info("ID or password 誤り");
        return;
      }

      var otpAction = data.querySelector("form").getAttribute("action");

      $modalInstance.close({sqexid: $scope.sqexid, action: otpAction});
    })
    .error(function(data, status, headers, config) {
    });


  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
}]);
