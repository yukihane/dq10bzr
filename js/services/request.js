/* global angular, chrome, console */

angular.module("dq10bzr.Main").factory("request", ["$http", "$q", "$log", "loginService",
  function ($http, $q, $log, loginService) {
    'use strict';

    var getSessionId = function () {
      try {
        return loginService.character.sessionId;
      } catch (e) {
        // 一度もログインしたことがなければ loginService.character はundefined
        throw "ログインしていません";
      }
    };

    // HTTPレスポンスコードからメッセージを生成します
    var getHttpMessage = function (status) {
      switch (status) {
        case 401:
          return "認証に失敗しました。再ログインが必要です。(" + status + ")";
        default:
          return "要求が失敗しました(" + status + ")";
      }
    };

    var getErrorMsg = function (code) {

      switch (code) {
        case 0:
          return "";
        case 106:
          return "ログイン中は本操作を実行できません(" + code + ")";
        case 22001:
          return "取得に失敗しました。しばらくしてから再実行してください。(" + code + ")";
        default:
          return "エラーが発生しました。(" + code + ")";
      }
    };

    /**
     * HTTP(S)リクエストを行い, 結果をpromiseで返します.
     * @param req リクエストパラメータ.
     * @returns {$q@call;defer.promise}
     */
    var requestAsync = function (req) {

      var deferred = $q.defer();

      $http(req)
        .success(function (data, status, headers, config) {
          $log.debug(data);

          if (data.resultCode !== 0) {
            var msg = getErrorMsg(data.resultCode);
            deferred.reject(msg);
          }

          deferred.resolve(data);
        })
        .error(function (data, status, headers, config) {
          var msg = getHttpMessage(status);
          deferred.reject(msg);
        });

      return deferred.promise;
    };

    var friends = function (index) {

      var req = {
        method: "GET",
        url: "https://happy.dqx.jp/capi/profile/friends/1/" + index + "/",
        headers: {
          "X-Smile-3DS-SESSIONID": getSessionId()
        }
      };

      return requestAsync(req);
    };

    var tobatsu = function () {

      var req = {
        method: "GET",
        url: "https://happy.dqx.jp/capi/tobatsu/tobatsulist/",
        headers: {
          "X-Smile-3DS-SESSIONID": getSessionId()
        }
      };

      var deferred = $q.defer();

      $http(req)
        .success(function (data, status, headers, config) {
          if (data.resultCode !== 0) {
            var msg = getErrorMsg(data.resultCode);
            deferred.reject(msg);
          }

          deferred.resolve(data);
        })
        .error(function (data, status, headers, config) {
          var msg = getHttpMessage(status);
          deferred.reject(msg);
        });

      return deferred.promise;
    };

    var joblist = function () {

      var req = {
        method: "GET",
        url: "https://happy.dqx.jp/capi/syokunin/joblist/",
        headers: {
          "X-Smile-3DS-SESSIONID": getSessionId()
        }
      };

      var deferred = $q.defer();

      $http(req)
        .success(function (data, status, headers, config) {
          deferred.resolve(data);
        })
        .error(function (data, status, headers, config) {
          var msg = getHttpMessage(status);
          deferred.reject(msg);
        });

      return deferred.promise;
    };

    var jobdetail = function (jobNo, recipeNo, createWebItemNoHash) {

      var req = {
        method: "GET",
        url: "https://happy.dqx.jp/capi/syokunin/jobdetail/" + jobNo + "/" + recipeNo + "/"
          + (createWebItemNoHash ? createWebItemNoHash + "/" : ""),
        headers: {
          "X-Smile-3DS-SESSIONID": getSessionId()
        }
      };

      var deferred = $q.defer();

      $http(req)
        .success(function (data, status, headers, config) {
          deferred.resolve(data);
        })
        .error(function (data, status, headers, config) {
          var msg = getHttpMessage(status);
          deferred.reject(msg);
        });

      return deferred.promise;
    };

    var bazaar = function (searchCond) {

      var req = {
        method: "GET",
        url: "https://happy.dqx.jp/capi/bazaar/search/",
        params: searchCond,
        headers: {
          "X-Smile-3DS-SESSIONID": getSessionId()
        }
      };

      var deferred = $q.defer();

      $http(req)
        .success(function (data, status, headers, config) {
          deferred.resolve(data);
        })
        .error(function (data, status, headers, config) {
          var msg = getHttpMessage(status);
          deferred.reject(msg);
        });

      return deferred.promise;
    };

    return {
      friends: friends,
      tobatsu: tobatsu,
      joblist: joblist,
      jobdetail: jobdetail,
      bazaar: bazaar
    };
  }
]);
