var OAUTH_URL = "https://secure.square-enix.com/oauth/oa/";

var mainModule = angular.module("dq10bzr.Main", ["ui.bootstrap", "ngResource"]);


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

mainModule.controller("userInfoCtrl", ["$scope", "$modal", "$http", "$log", "loginService",
function($scope, $modal, $http, $log, loginService) {
  console.log("userInfo");

  $scope.loginInfo = loginService;

  chrome.storage.sync.get(["character", "auth"], function(items){
    console.log("logined: " + items["character"].characterName);
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

mainModule.controller('loginCtrl', ["$scope", "$modalInstance", "$http", "$log", "action",
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


mainModule.controller('otpCtrl', ["$scope", "$modalInstance", "$http", "$log", "action",
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

mainModule.controller('characterCtrl', ["$scope", "$modalInstance", "$http", "$log", "characters", "sessionId",
function ($scope, $modalInstance, $http, $log, characters, sessionId) {

  $scope.characters = characters;

  $scope.select = function (index) {
    $log.info("index: " + index);
    
    var character = characters[index];
    var webPcNo = character.webPcNo;
    
    var req = {
      method: "GET",
      url: "https://happy.dqx.jp/capi/login/characterselect/"+webPcNo+"/",
      headers: {
        "X-Smile-3DS-SESSIONID": sessionId,
      },
    };


    $http(req)
    .success(function(data, status, headers, config) {
      $log.info(data);
      $modalInstance.close(character);
    })
    .error(function(data, status, headers, config) {
    });

  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
}]);


mainModule.controller("friendCtrl", ["$scope", "$http", "$log", "loginService", 
function($scope, $http, $log, loginService) {

  $scope.friends = [];
  $scope.isOffsetEnd = true;
  $scope.nextIndex = 0;

  $scope.reload = function() {
    $scope.friends = [];
    $scope.isOffsetEnd = true;
    $scope.nextIndex = 0;

    $scope.query(0);
  };
  
  $scope.query = function(index) {
    console.log(loginService.sessionId);

    var req = {
      method: "GET",
      url: "https://happy.dqx.jp/capi/profile/friends/1/" + index + "/",
      headers: {
        "X-Smile-3DS-SESSIONID": loginService.character.sessionId,
      },
    };
    

    console.log("フレンドリクエスト");
    $http(req)
    .success(function(data, status, headers, config) {
      console.log(data);
      $scope.friends = $scope.friends.concat(data.friendsValueList);
      $scope.isOffsetEnd = data.isOffsetEnd;
      $scope.nextIndex = index + 1;
    })
    .error(function(data, status, headers, config) {
    });
  };

  $scope.open = function(webPcNo) {
    console.log("open clicked");
    window.open("http://hiroba.dqx.jp/sc/character/" + webPcNo + "/");
  };

}]);


mainModule.controller("tobatsuCtrl", ["$scope", "$http", "$log", "loginService", 
function($scope, $http, $log, loginService) {

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
      console.log(data);
      $scope.list = data;
    })
    .error(function(data, status, headers, config) {
    });

  };
}]);


mainModule.controller("syokuninCtrl", ["$scope", "$http", "$log", "loginService",
function($scope, $http, $log, loginService) {

  $scope.list = [];
  
  $scope.necessaryMaterials = [];
  
  $scope.bzrResults = [];

  $scope.reload = function() {

    console.log(loginService.sessionId);

    var req = {
      method: "GET",
      url: "https://happy.dqx.jp/capi/syokunin/joblist/",
      headers: {
        "X-Smile-3DS-SESSIONID": loginService.character.sessionId,
      },
    };

    console.log("職人ギルド依頼");
    $http(req)
    .success(function(data, status, headers, config) {
      console.log(data);
      $scope.list = data.syokuninGuildList;
    })
    .error(function(data, status, headers, config) {
    });

  };

  $scope.detail = function(jobNo, recipeNo, createWebItemNoHash) {

    var req = {
      method: "GET",
      url: "https://happy.dqx.jp/capi/syokunin/jobdetail/" + jobNo + "/" + recipeNo + "/"
        + (createWebItemNoHash ? createWebItemNoHash + "/" : ""),
      headers: {
        "X-Smile-3DS-SESSIONID": loginService.character.sessionId,
      },
    };

    console.log("職人ギルド依頼");
    $http(req)
    .success(function(data, status, headers, config) {
      console.log(data);
      $scope.necessaryMaterials = data.recipeDetail.necessaryMaterialList;
    })
    .error(function(data, status, headers, config) {
    });

  };

  $scope.searchBzr = function(webItemNoHash) {

    var req = {
      method: "GET",
      url: "https://happy.dqx.jp/capi/bazaar/search/",
      params: {
        bazaarno: 99,
        webitemid: webItemNoHash,
      },
      headers: {
        "X-Smile-3DS-SESSIONID": loginService.character.sessionId,
      },
    };

    $http(req)
    .success(function(data, status, headers, config) {
      console.log(data);
      $scope.bzrResults = data;
    })
    .error(function(data, status, headers, config) {
    });

    
  };

}]);


mainModule.controller("houseBazaarCtrl", ["$scope", "$http", "$log", "loginService",
function($scope, $http, $log, loginService) {

  $scope.reload = function() {

    console.log(loginService.sessionId);

    var req = {
      method: "GET",
      url: "https://happy.dqx.jp/capi/housing/bazaar/history/",
      headers: {
        "X-Smile-3DS-SESSIONID": loginService.character.sessionId,
      },
    };

    $http(req)
    .success(function(data, status, headers, config) {
      console.log(data);
      $scope.debug = data;
    })
    .error(function(data, status, headers, config) {
    });

  };

}]);


mainModule.controller("bazaarCtrl", ["$scope", "$http", "$resource", "$log", "loginService",
function($scope, $http, $resource, $log, loginService) {
  
  $scope.debug = "";

  // 「種類」のoptions
  $scope.largeCategorySet = [];

  var enableRenkinSet = $resource("./assets/enableRenkinSet.json").get();
  var renkinTypeSet = $resource("./assets/renkinTypeSet.json").get();


  // 「装備可能職業」のoptions
  var jobSet = $resource("./assets/jobSet.json").query();

  var eqLvMinSet = [];
  var eqLvMaxSet = [];
  $resource("./assets/eqLvSet.json").get(function(eqLvSet) {
    // 装備レベル下限のoptions
    eqLvMinSet = eqLvSet.min;
    // 装備レベル上限のoptions
    eqLvMaxSet = eqLvSet.max;
  });

  // できのよさのoptions
  var qualitySet = $resource("./assets/qualitySet.json").query();

  // 錬金効果数のoptions
  var numOfRenkinSet = $resource("./assets/numOfRenkinSet.json").query();

  // 難易度のoptions
  var difficultySet = $resource("./assets/difficultySet.json").query();

  var defaultSelected = {
    largeCategory: null,
    smallCategory: null,
    itemCount: null,
    job: null,
    eqLvMin: null,
    eqLvMax: null,
    quality: null,
    numOfRenkin: null,
    renkin: [
      {
        effect: null,
        minValue: null,
      },
      {
        effect: null,
        minValue: null,
      }
    ],
    difficultyMin: null,
    difficultyMax: null,
  };

  $scope.selected = Object.create(defaultSelected);
  
  var defaultDisabled = {
    smallCategory: true,
    itemCount: true,
    eqCond: true,
    quality: true,
    renkin: true,
    difficulty: true,
  };

  $scope.disabled = Object.create(defaultDisabled);

  var clear = function(){

    // 選択した値を保持
    $scope.selected = Object.create(defaultSelected);
    // 入力項目がdisabledかenabledかを保持
    $scope.disabled = Object.create(defaultDisabled);

    if(!$scope.largeCategorySet.length) {
      // 既に読み込み済みの場合は改めてリクエストしない

      var req = {
        method: "GET",
        url: "https://happy.dqx.jp/capi/bazaar/largecategory/99/",
        headers: {
          "X-Smile-3DS-SESSIONID": loginService.character.sessionId,
        },
      };
  
      $http(req)
      .success(function(data, status, headers, config) {
        $scope.largeCategorySet = data.largeCategoryValueList;
      })
      .error(function(data, status, headers, config) {
      });
    }

    // 「種類2」のoptions
    $scope.smallCategorySet = [];

    // 「アイテム名」のoptions
    $scope.itemCountSet = [];

    clearOptions();
  };
  
  var clearOptions = function() {
    
    // 装備可能職業のoptions
    $scope.jobSet = [];
    
    // 装備レベル下限, 上限
    $scope.eqLvMinSet = [];
    $scope.eqLvMaxSet = [];

    // できのよさ
    $scope.qualitySet = [];

    // 錬金効果数
    $scope.numOfRenkinSet = [];

    // 錬金効果
    $scope.renkinCategorySet = [];
    
    // 難易度
    $scope.difficultySet = [];

  };

  $scope.reload = function() {
    clear();
  };

  $scope.clickTab = function() {
    clear();
  };


  // 「種類」選択時
  $scope.largeCategoryChanged = function(selected) {

    $scope.disabled = Object.create(defaultDisabled);

    if(!selected.isSmallCategory) {
      // isSmallCategory は、おそらく、smallCategoryを持っているかどうかの区分
      $scope.smallCategorySet = [];
      smallCategoryCommitted(selected.largeCategoryId, selected.smallCategoryId);
      return;
    }


    var req = {
      method: "GET",
      url: "https://happy.dqx.jp/capi/bazaar/smallcategory/99/" + selected.largeCategoryId + "/",
      headers: {
        "X-Smile-3DS-SESSIONID": loginService.character.sessionId,
      },
    };

    $http(req)
    .success(function(data, status, headers, config) {
      console.log(data);
      $scope.smallCategorySet = data.smallCategoryValueList;
      $scope.disabled.smallCategory = false;
    })
    .error(function(data, status, headers, config) {
    });

  };


  // 「種類2」選択時
  $scope.smallCategoryChanged = function(selected) {
    if($scope.selected.largeCategory && selected) {
      smallCategoryCommitted($scope.selected.largeCategory.largeCategoryId, selected.smallCategoryId);
    }
  };
  
  var smallCategoryCommitted = function(lc, sc) {
    console.log("lc: " + lc + ", sc: " + sc);

    unsetDisabled(lc, sc);

    var req = {
      method: "GET",
      url: "https://happy.dqx.jp/capi/bazaar/itemcount/99/" + lc + "/" + sc + "/",
      headers: {
        "X-Smile-3DS-SESSIONID": loginService.character.sessionId,
      },
    };

    $http(req)
    .success(function(data, status, headers, config) {
      $scope.itemCountSet = data.itemCountValueList;
      $scope.disabled.itemCount = false;
    })
    .error(function(data, status, headers, config) {
    });
    
  };

  var unsetDisabled = function(lc, sc) {
    $scope.disabled = Object.create(defaultDisabled);
    // smallCategoryは決定済みの前提なのでenable
    $scope.disabled.smallCategory = false;

    clearOptions();
    
    var scStr = "" + sc;
    var enableRenkins = [];
    var enableRenkinIds = enableRenkinSet[scStr];

    if(enableRenkinIds){
      enableRenkinIds.forEach(function(rid) {
        var r = renkinTypeSet[rid];
        enableRenkins.push(r);
      });
    }

    // bazaar_searching_conditions.ods の「リクエストパラメータ」シートに仕様記載
    if(lc === 1 || lc === 2 || lc === 3) {
      // 武器, 盾, 防具の場合
      $scope.disabled.eqCond = false;
      $scope.disabled.itemCount = false;
      $scope.disabled.quality = false;
      $scope.disabled.renkin = false;

      $scope.jobSet = jobSet;
      $scope.eqLvMinSet = eqLvMinSet;
      $scope.eqLvMaxSet = eqLvMaxSet;

      $scope.qualitySet = qualitySet;
      $scope.numOfRenkinSet = numOfRenkinSet;
      $scope.renkinCategorySet = enableRenkins;

    } else if(lc === 5 || lc === 11 || sc === 606) {
      // 職人どうぐ, 釣りどうぐ, 消費アイテム>料理 の場合
      $scope.disabled.itemCount = false;
      $scope.disabled.quality = false;

      $scope.qualitySet = qualitySet;

    } else if(sc === 605) {
      // 消費アイテム>依頼書 の場合
      $scope.disabled.difficulty = false;

      $scope.difficultySet = difficultySet;

    } else if(lc === 6 || lc === 7 || lc === 8 || lc === 12 || lc === 9 || lc === 10) {
      // (料理と依頼書以外の)消費アイテム, 素材, 家具, 庭具, レシピ帳, スカウトの書
      $scope.disabled.itemCount = false;
    }
  };

  $scope.itemCountChanged = function(selected) {
    if(selected) {
      $scope.disabled.eqCond = true;
      $scope.selected.job = null;
      $scope.selected.eqLvMin = null;
      $scope.selected.eqLvMax = null;
    } else {
      if($scope.selected.largeCategory && $scope.selected.smallCategory) {
        var lc = $scope.selected.largeCategory.largeCategoryId;
        if(lc === 1 || lc === 2 || lc === 3) {
          $scope.disabled.eqCond = false;
        }
      }
    }
  };


  var defRenkinMinValueSpec = {
    min:0,
    max:0,
    setp:"1",
  };

  $scope.renkin1MinValueSpec = Object.create(defRenkinMinValueSpec);
  $scope.renkin2MinValueSpec = Object.create(defRenkinMinValueSpec);

  $scope.renkinCategoryChanged = function(number, selected) {
    console.log(selected);

    var v;
    if(!selected) {
      v = Object.create(defRenkinMinValueSpec);
    } else {
      v = {
        min: selected.min,
        max: selected.max,
        step: selected.step,
      };
    }
    
    if(number === 0){
      $scope.renkin1MinValueSpec = v;
    } else {
      $scope.renkin2MinValueSpec = v;
    }
  };


  // 検索ボタン
  $scope.submit = function() {
    var params = {
      offset: 0,
      bazaarno: 99,
      pricemin: 0,
      pricemax: 9999999999,
      stackmin: 1,
      stackmax: 99,
      creatorname: null,
      smileuniqueno: null,
      largecategoryid: $scope.selected.largeCategory.largeCategoryId,
      smallcategoryid: (!$scope.selected.largeCategory.isSmallCategory ? $scope.selected.largeCategory.smallCategoryId
        : $scope.selected.smallCategory.smallCategoryId),
      webitemid: (!!$scope.selected.itemCount ? $scope.selected.itemCount.webItemId : null),
      job: (!!$scope.selected.job ? $scope.selected.job.id : 0),
      levelmin: (!!$scope.selected.eqLvMin ? $scope.selected.eqLvMin : eqLvMinSet[0]),
      levelmax: (!!$scope.selected.eqLvMax ? $scope.selected.eqLvMax : eqLvMaxSet[eqLvMaxSet.length - 1]),
      qualitymin: (!!$scope.selected.quality ? $scope.selected.quality.min : 0),
      qualitymax: (!!$scope.selected.quality ? $scope.selected.quality.max : 0),
      renkinmin: (!!$scope.selected.numOfRenkin ? $scope.selected.numOfRenkin.min : null),
      renkinmax: (!!$scope.selected.numOfRenkin ? $scope.selected.numOfRenkin.max : null),
      renkinsearchcategory: (!!$scope.selected.renkin[0].effect ? $scope.selected.renkin[0].effect.id : 0),
      renkinsearchmin: (!!$scope.selected.renkin[0].minValue ? $scope.selected.renkin[0].minValue * $scope.selected.renkin[0].effect.scale : 0),
      renkinsearchcategory2: (!!$scope.selected.renkin[1].effect ? $scope.selected.renkin[1].effect.id : 0),
      renkinsearchmin2: (!!$scope.selected.renkin[1].minValue ? $scope.selected.renkin[1].minValue * $scope.selected.renkin[1].effect.scale : 0),
    };

    if(params.smallcategoryid === 605) {
      // 消費アイテム>依頼書 の場合
      params.qualitymin = (!!$scope.selected.difficultyMin ? $scope.selected.difficultyMin.parameter : difficultySet[0].parameter);
      params.qualitymax = (!!$scope.selected.difficultyMax ? $scope.selected.difficultyMax.parameter : difficultySet[difficultySet.length - 1].parameter);
    }

    $scope.debug = params;
  };

}]);
