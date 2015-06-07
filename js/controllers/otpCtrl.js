'use strict';

angular.module("dq10bzr.Main").controller('otpCtrl', ["$scope", "$modalInstance", "$http", "$log", "action",
function ($scope, $modalInstance, $http, $log, action) {

  $scope.otppw = "";

  $scope.ok = function () {

    var req = {
      method: "POST",
      url: OAUTH_URL + action,
      responseType: "document",
      headears: {
        "Content-type": "application/x-www-form-urlencoded",
      },
      params: {
        otppw: $scope.otppw
      },
    };

    $http(req)
    .success(function(data, status, headers, config) {
      
      $log.info(data);

      var inputCisSessid = data.querySelector("form input[name='cis_sessid']").value;
      var inputC = data.querySelector("form input[name='_c']").value;

      $modalInstance.close({cis_sessid: inputCisSessid, _c: inputC});
    })
    .error(function(data, status, headers, config) {
    });


  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
}]);
