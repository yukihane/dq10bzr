'use strict';

angular.module("dq10bzr.Main").factory("request", ["$http", "$q", "loginService", function($http, $q, loginService){

  var getSessionId = function() {
    try {
      return loginService.character.sessionId;
    } catch (e) {
      // 一度もログインしたことがなければ loginService.character はundefined
      throw "ログインしていません";
    }
  };

  // HTTPレスポンスコードからメッセージを生成します
  var getMessage = function(status) {
    switch(status) {
      case 401:
        return "認証に失敗しました。再ログインが必要です。";
      default:
        return "要求が失敗しました";
    }
  };

  var friends = function(index) {

    var req = {
      method: "GET",
      url: "https://happy.dqx.jp/capi/profile/friends/1/" + index + "/",
      headers: {
        "X-Smile-3DS-SESSIONID": getSessionId(),
      },
    };

    var deferred = $q.defer();

    $http(req)
    .success(function(data, status, headers, config) {
      deferred.resolve(data);
    })
    .error(function(data, status, headers, config) {
      var msg = getMessage(status);
      deferred.reject(msg);
    });

    return deferred.promise;

  };

  return {
    friends: friends,
  };
}]);