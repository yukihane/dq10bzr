'use strict';

/*
討伐タブコントローラ.
*/
angular.module("dq10bzr.Main").controller("tobatsuCtrl", ["$rootScope", "$scope", "$http", "$log", "loginService", 
function($rootScope, $scope, $http, $log, loginService) {

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
      if(data.resultCode !== 0) {
        var msg = getErrorMsg(data.resultCode);
        $rootScope.$broadcast("footer.notify", msg);
        return;
      }

      $scope.list = data;

    })
    .error(function(data, status, headers, config) {
      $rootScope.$broadcast("footer.notify", "通信エラー");
      console.log(data);
    });

  };

  var getErrorMsg = function(code) {

    switch(code) {
      case 0:
        return "";
      case 106:
        return "ログイン中は本操作を実行できません";
      default:
        return "エラー発生(" + code + ")";
    }
  };

}]);
