/* global angular, chrome */

var OAUTH_URL = "https://secure.square-enix.com/oauth/oa/";

var mainModule = angular.module("dq10bzr.Main", ["ui.bootstrap", "ngResource"]);

mainModule.config(["$logProvider", function($logProvider){
  $logProvider.debugEnabled(true);
}]);

// アカウント(現在は1アカウントのみを想定)情報を管理するサービス
mainModule.factory("loginService", function(){
  return {
    // 認証情報
    // この情報を持っていればキャラクタ選択可能
    auth: {
      cis_sessid: null,
      _c: null,
    },

    character: {
      // キャラクタ選択をすればこの情報が取得できる
      // X-Smile-3DS-SESSIONID ヘッダ情報として付与する
      sessionId: null,

      // キャラクタ情報
      // キャラクタ名
      characterName: null,
      // ZZ999-999 といったキャラクタID
      smileUniqueNo: null,
      // 数字列で表されるユニーク番号
      webPcNo: null,
    }
  };
});

mainModule.filter("convertToProgress", function() {
  return function(isComplete) {
    if(isComplete) {
      return "済";
    }
    return "未";
  };
});


/*
エポックミリ秒文字列を受け取り、「日本時間帯における」月日文字列を返します.
*/
mainModule.filter("epochStrToJpDateStr", function(){
  return function(epoch) {
    var offsetEpoch = parseInt(epoch, 10) + 9*60*60*1000;
    var date = new Date(offsetEpoch);
    return "" + (date.getUTCMonth() + 1) + "/" + date.getUTCDate();
  };
});
