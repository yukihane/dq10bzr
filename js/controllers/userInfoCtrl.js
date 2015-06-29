'use strict';

angular.module("dq10bzr.Main").controller("userInfoCtrl", ["$scope", "$modal", "$http", "$log", "loginService",
function($scope, $modal, $http, $log, loginService) {
  console.log("userInfo");

  $scope.loginInfo = loginService;

  chrome.storage.sync.get(["character", "auth"], function(items){
    loginService.character = items["character"];
    loginService.auth = items["auth"];
    $scope.$apply();
  });

  $scope.login = function(){
    $log.info("login clicked");
    
    
    var req = {
      method: "GET",
      url: OAUTH_URL + "oauthauth?client_id=happy&redirect_uri=https%3A%2F%2Fhappy.dqx.jp%2Fcapi%2Flogin%2Fsecurelogin%2F&response_type=code&yl=1",
      responseType: "document",
    };
    
    $http(req)
    .success(function(data, status, headers, config) {

      var inputSqexid = data.querySelector("form #sqexid");
      var inputPassword = data.querySelector("form #password");
      var inputOtppw = data.querySelector("form #otppw");


      if(inputSqexid && inputPassword){
        $log.info("ログイン処理が必要");
        var action = data.querySelector("form").getAttribute("action");
        openLoginDialog(action);
      } else if(inputOtppw) {
        $log.info("OTP認証が必要");
        var otpAction = data.querySelector("form").getAttribute("action");
        openOtpDialog(otpAction);
      } else {
        // エラー
        // 想定しているフォームと異なる
      }

    })
    .error(function(data, status, headers, config) {
      $log.warn("error occured");
      // エラーが発生、またはサーバからエラーステータスが返された場合に、
      // 非同期で呼び出されます。
    });
  };
  
  $scope.selectCharacter = function() {
    loginCompleted(loginService.auth);
  };

  var openLoginDialog = function(action) {
    var modalInstance = $modal.open({
      templateUrl: 'loginPane.html',
      controller: 'loginCtrl',
      resolve: {
        action: function(){
          return action;
        },
      }
    });

    modalInstance.result.then(function (input) {
      $log.info("id: " + input.sqexid + ", action: " + input.action);
      if(input.action) {
        $log.info("OTP認証が必要");
        openOtpDialog(input.action);
      } else {
        $log.info("OTP認証不要");
      }
    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
    });
  };


  var openOtpDialog = function(action) {
    var modalInstance = $modal.open({
      templateUrl: 'otpPane.html',
      controller: 'otpCtrl',
      resolve: {
        action: function(){
          return action;
        },
      }
    });
    
    modalInstance.result.then(function (input) {

      var auth = {
        auth: {
          cis_sessid: input.cis_sessid,
          _c: input._c,
        },
      };
      
      chrome.storage.sync.set(auth, function(){
        console.log("auth saved: " + auth);
      });

      loginCompleted(auth.auth);

    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
    });
  };

  var loginCompleted = function(auth) {
    var action = "https://happy.dqx.jp/capi/login/securelogin/";

    console.log("cis_sessid: " + auth.cis_sessid + ", _c: " + auth._c);
    
    var req = {
      method: "POST",
      url: action,
      responseType: "json",
      headers: {
        "Content-type": "application/x-www-form-urlencoded",
      },
      params: {
        cis_sessid: auth.cis_sessid,
        _c: auth._c,
      },
    };

    $http(req)
    .success(function(data, status, headers, config) {
      var sessionId = data["sessionId"];
      var characters = data["characterList"];

      openCharaSelectDialog(characters, sessionId);

    })
    .error(function(data, status, headers, config) {
    });
  };

  var openCharaSelectDialog = function(characters, sessionId) {
    var modalInstance = $modal.open({
      templateUrl: 'characterSelectionPane.html',
      controller: 'characterCtrl',
      resolve: {
        characters: function() {
          return characters;
        },
        sessionId: function() {
          return sessionId;
        },
      }
    });
    
    modalInstance.result.then(function (input) {
      $log.info("character: " + input.webPcNo + ", sessionid: " + sessionId);

      var currentLogin = {
        character: {
          sessionId: sessionId,
          characterName: input.characterName,
          smileUniqueNo: input.smileUniqueNo,
        }
      };

      chrome.storage.sync.set(currentLogin, function(){
        console.log("data stored");
        loginService.character = currentLogin.character;

        console.log(loginService.character.smileUniqueNo);

      });

    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
    });
  };

}]);
