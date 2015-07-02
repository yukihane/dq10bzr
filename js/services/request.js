'use strict';

angular.module("dq10bzr.Main").factory("request", ["$http", "$q", "loginService", function($http, $q, loginService){
  var friends = function(index) {
    
    var getSessionId = function() {
      return loginService.character.sessionId;
    };

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

      var result = {
        friends: data.friendsValueList,
        isOffsetEnd: data.isOffsetEnd,
      };

      deferred.resolve(result);
    })
    .error(function(data, status, headers, config) {
      deferred.reject(data);
    });

    return deferred.promise;

  };

  return {
    friends: friends,
  };
}]);