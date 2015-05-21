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

mainModule.controller("bazaarCtrl", ["$scope", "$http", "$resource", "$log", "loginService",
function($scope, $http, $resource, $log, loginService) {
  
  $scope.debug = "";

  var enableRenkinSet = $resource("./assets/enableRenkinSet.json").get();
  var renkinTypeSet = $resource("./assets/renkinTypeSet.json").get();

  $scope.jobSet = $resource("./assets/jobSet.json").query();

  $scope.largeCategories = [];
  $scope.largeCategorySelected = null;

  $scope.smallCategoryDisabled = true;
  $scope.smallCategories = [];
  $scope.smallCategorySelected = null;
  
  $scope.itemCounts = [];
  $scope.itemCountSelected = null;

  $scope.jobSelected = null;

  $resource("./assets/eqLvSet.json").get(function(eqLvSet) {
    $scope.eqLvLowSet = eqLvSet.low;
    $scope.eqLvHighSet = eqLvSet.high;
  });

  $scope.eqLvLowSelected = null;
  $scope.eqLvHighSelected = null;


  $scope.qualitySet = $resource("./assets/qualitySet.json").query();
  $scope.qualitySelected = null;
  
  $scope.numOfRenkinSet = $resource("./assets/numOfRenkinSet.json").query();
  $scope.numOfRenkinSelected = null;

  $scope.renkinCategories = [];
  $scope.renkinCategory1Selected = null;
  $scope.renkinCategory2Selected = null;

  $scope.difficultySet = $resource("./assets/difficultySet.json").query();
  $scope.difficultyLowSelected = null;
  $scope.difficultyHighSelected = null;

  $scope.clickTab = function() {
      console.log(renkinTypeSet);

    if($scope.largeCategories.length) {
      // 既に読み込み済みの場合は改めてリクエストしない
      return;
    }

    console.log(loginService.sessionId);

    var req = {
      method: "GET",
      url: "https://happy.dqx.jp/capi/bazaar/largecategory/99/",
      headers: {
        "X-Smile-3DS-SESSIONID": loginService.character.sessionId,
      },
    };

    $http(req)
    .success(function(data, status, headers, config) {
      console.log(data);
      $scope.largeCategories = data.largeCategoryValueList;
    })
    .error(function(data, status, headers, config) {
    });

  };

  $scope.largeCategoryChanged = function(selected) {

    $scope.smallCategoryDisabled = true;
    if(!selected.isSmallCategory) {
      // isSmallCategory は、おそらく、smallCategoryを持っているかどうかの区分
      $scope.smallCategories = [];
      loadItemCount(selected.largeCategoryId, selected.smallCategoryId);
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
      $scope.smallCategories = data.smallCategoryValueList;
      $scope.smallCategoryDisabled = false;
    })
    .error(function(data, status, headers, config) {
    });

  };

  $scope.smallCategoryChanged = function(selected) {
    if($scope.largeCategorySelected && selected) {
      loadItemCount($scope.largeCategorySelected.largeCategoryId, selected.smallCategoryId);
    }
  };
  
  var loadItemCount = function(lc, sc) {
    
    var scStr = "" + sc;
    var enableRenkins = [];
    var enableRenkinIds = enableRenkinSet[scStr];

    if(enableRenkinIds){
      enableRenkinIds.forEach(function(rid) {
        var r = renkinTypeSet[rid];
        enableRenkins.push(r);
      });
    }

    $scope.renkinCategories = enableRenkins;

    var req = {
      method: "GET",
      url: "https://happy.dqx.jp/capi/bazaar/itemcount/99/" + lc + "/" + sc + "/",
      headers: {
        "X-Smile-3DS-SESSIONID": loginService.character.sessionId,
      },
    };

    $http(req)
    .success(function(data, status, headers, config) {
      console.log(data);
      $scope.itemCounts = data.itemCountValueList;
    })
    .error(function(data, status, headers, config) {
    });
    
  };

  $scope.itemCountChanged = function(selected) {
    console.log("clicked");
  };
  
  
}]);


/*
function createCharaList(characters){
  var res = "<table>";
  for(var i = 0; i < characters.length; i++) {
    var chara = characters[i];
    var name = chara.characterName + " (" + chara.smileUniqueNo +")";
    var webPcNo = chara.webPcNo;

    var r = "<tr><td>" + name + "</td><td>"
      + "<button name='Select' value='" + webPcNo + "'>Select</button></td></tr>";

    res = res + r;
  }
  res = res + "</table>";
  return res;
}

function characterSelected(sessionId, webPcNo){
  console.log("characterSelected: " + webPcNo);

  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function(){
    if(xhr.readyState == 4) {
      console.log("status: " + xhr.status);
      console.log(xhr.response);
    }
  };
  
  xhr.open("GET", "https://happy.dqx.jp/capi/login/characterselect/"+webPcNo+"/", true);
  xhr.setRequestHeader("X-Smile-3DS-SESSIONID", sessionId);
  xhr.send();
}

function loginCompleted(cisSessid, c) {
  var action = "https://happy.dqx.jp/capi/login/securelogin/";

  console.log("cis_sessid: " + cisSessid + ", _c: " + c);

  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function(){
    if(xhr.readyState == 4) {
      console.log("status: " + xhr.status);

      var json = xhr.response;
      var sessionId = json["sessionId"];
      chrome.storage.sync.set({"login.sessionId": sessionId}, function(){
        console.log("data stored");
      });
      var characters = json["characterList"];
      var charaList = createCharaList(characters);
      document.querySelector("#charaList").innerHTML = charaList;
      
      var handler = function(){
        var webPcNo = this.getAttribute("value");
        characterSelected(sessionId, webPcNo);
      };
      buttons = document.querySelectorAll("button[name='Select']");
      for(var i = 0; i < buttons.length; i++){
        var b = buttons[i];
        b.addEventListener("click", handler);
      }
    }
  };
  
  xhr.open("POST", action, true);
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhr.responseType = "json";
  xhr.send("cis_sessid=" + cisSessid + "&_c=" + c);
}

function requireOtppw(form) {
  var sendIdButton = document.getElementById("sendIdButton");
  sendIdButton.disabled = true;

  var sendOtpButton = document.getElementById("sendOtpButton");
  sendOtpButton.disabled = false;
  
  sendOtpButton.addEventListener("click", function(){
    var action = form.getAttribute("action");
    console.log(action);

    var otppw = encodeURIComponent(document.getElementById("otppw").value);
    console.log("otppw: " + otppw);

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
      if(xhr.readyState == 4) {
        console.log("status: " + xhr.status);
        console.log(xhr.response);

        var xml = xhr.response;
        var form = xml.querySelector("form");
        console.log(form);
        var inputCisSessid = form.querySelector("input[name='cis_sessid']");
        var inputC = form.querySelector("input[name='_c']");
        console.log("inputCisSessid: " + inputCisSessid + ", inputC: " + inputC);

        if(inputCisSessid && inputC){
          var cisSessid = inputCisSessid.value;
          var c = inputC.value;

          chrome.storage.sync.set({"login.cis_sessid": cisSessid, "login._c": c}, function(){
            console.log("data stored");
          });
          
          loginCompleted(cisSessid, c);
        }
      }
    };
    
    xhr.open("POST", OAUTH_URL + action, true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.responseType = "document";
    xhr.send("otppw=" + otppw);
  });
}

function requireLogin(form) {
  var sendIdButton = document.getElementById("sendIdButton");
  sendIdButton.disabled = false;

  var sendOtpButton = document.getElementById("sendOtpButton");
  sendOtpButton.disabled = true;

  sendIdButton.addEventListener("click", function(){
    var action = form.getAttribute("action");
    console.log(action);
    var sqexid = encodeURIComponent(document.getElementById("sqexid").value);
    var password = encodeURIComponent(document.getElementById("password").value);
    console.log("sqexid: " + sqexid + ", password: " + password);

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
      if(xhr.readyState == 4) {
        console.log("status: " + xhr.status);
        console.log(xhr.response);

        var xml = xhr.response;
        var form = xml.querySelector("form");
        console.log(form);
        var inputOtppw = form.querySelector("#otppw");
        console.log(inputOtppw);

        if(inputOtppw){
          requireOtppw(form);
        }

      }
    };
    
    xhr.open("POST", OAUTH_URL + action, true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.responseType = "document";
    xhr.send("sqexid=" + sqexid + "&password=" + password + "&login.x=231&login.y=20");
  });
}

function prepareProceed() {

  var proceedButton = document.getElementById("proceedButton");
  proceedButton.addEventListener("click", function(){
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
      if(xhr.readyState == 4) {
        console.log("status: " + xhr.status);
        console.log(xhr.response);
        
        var xml = xhr.response;
        var form = xml.querySelector("form");
        console.log(form);
        var inputSqexid = form.querySelector("#sqexid");
        console.log(inputSqexid);
        console.log(inputSqexid === null);
        var inputPassword = form.querySelector("#password");
        console.log(inputPassword);
        console.log(inputPassword === null);
        
        if(inputSqexid && inputPassword){
          requireLogin(form);
        } else {
          var inputOtppw = form.querySelector("#otppw");
          console.log(inputOtppw);
  
          if(inputOtppw){
            requireOtppw(form);
          }
        }
      }
    };
    
    xhr.open("GET", OAUTH_URL + "oauthauth?client_id=happy&redirect_uri=https%3A%2F%2Fhappy.dqx.jp%2Fcapi%2Flogin%2Fsecurelogin%2F&response_type=code&yl=1", true);
    xhr.responseType = "document";
    xhr.send();
  });
}

function checkLoginSession() {
  chrome.storage.sync.get(["login.cis_sessid", "login._c"], function(items){
    console.log("items[0]: " + items["login.cis_sessid"] + ", items[1]: " + items["login._c"]);
    if(items["login.cis_sessid"] && items["login._c"]){
      console.log("loginCompleted");
      loginCompleted(items["login.cis_sessid"], items["login._c"]);
    } else {
      console.log("prepareProceed");
      prepareProceed();
    }
  });
}

window.onload = function() {
  var sendIdButton = document.getElementById("sendIdButton");
  sendIdButton.disabled = true;

  var sendOtpButton = document.getElementById("sendOtpButton");
  sendOtpButton.disabled = true;
  
  var masterButton = document.getElementById("masterButton");
  masterButton.addEventListener("click", function(){
    chrome.storage.sync.get("login.sessionId", function(items){
      var sessionId = items["login.sessionId"];
      if(!sessionId){
        console.log("sessionId is null!");
        return;
      }

      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function(){
        if(xhr.readyState == 4) {
          console.log("status: " + xhr.status);
          console.log(xhr.response);
          var json = xhr.response;
          var largeCategories = json.largeCategoryValueList;
          var optionText = "<option value=''></option>";
          for(var i = 0; i < largeCategories.length; i++) {
            var op = largeCategories[i];
            var opText = "<option value='" + op.largeCategoryId + "'>" + op.largeCategoryName + "</option>";
            optionText = optionText + opText;
          }
          
          var largeCategoryValueList = document.getElementById("largeCategoryValueList");
          largeCategoryValueList.innerHTML = optionText;
          
        }
      };
    
      xhr.open("GET", "https://happy.dqx.jp/capi/bazaar/largecategory/99/", true);
      xhr.setRequestHeader("X-Smile-3DS-SESSIONID", sessionId);
      xhr.responseType = "json";
      xhr.send();
    });
  });
  
  var largeCategoryValueList = document.getElementById("largeCategoryValueList");
  largeCategoryValueList.addEventListener("change", function(){
    var lCategoryId = this.options[this.selectedIndex].value;
    if(!lCategoryId) {
      console.log("empty value selected, return");
      return;
    }

    chrome.storage.sync.get("login.sessionId", function(items){
      var sessionId = items["login.sessionId"];
      if(!sessionId){
        console.log("sessionId is null!");
        return;
      }

      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function(){
        if(xhr.readyState == 4) {
          console.log("status: " + xhr.status);
          console.log(xhr.response);

          var json = xhr.response;
          var smallCategories = json.smallCategoryValueList;
          var optionText = "<option value=''></option>";
          for(var i = 0; i < smallCategories.length; i++) {
            var op = smallCategories[i];
            var opText = "<option value='" + op.smallCategoryId + "'>" + op.smallCategoryName + "</option>";
            optionText = optionText + opText;
          }
          
          var smallCategoryValueList = document.getElementById("smallCategoryValueList");
          smallCategoryValueList.innerHTML = optionText;

        }
      };

      xhr.open("GET", "https://happy.dqx.jp/capi/bazaar/smallcategory/99/" + lCategoryId + "/", true);
      xhr.setRequestHeader("X-Smile-3DS-SESSIONID", sessionId);
      xhr.responseType = "json";
      xhr.send();
    });
  });


  var smallCategoryValueList = document.getElementById("smallCategoryValueList");
  smallCategoryValueList.addEventListener("change", function(){
    var sCategoryId = this.options[this.selectedIndex].value;
    if(!sCategoryId) {
      console.log("empty value selected, return");
      return;
    }

    var largeCategoryValueList = document.getElementById("largeCategoryValueList");
    var lCategoryId = largeCategoryValueList.options[largeCategoryValueList.selectedIndex].value;
    if(!lCategoryId) {
      console.log("empty value selected, return");
      return;
    }

    chrome.storage.sync.get("login.sessionId", function(items){
      var sessionId = items["login.sessionId"];
      if(!sessionId){
        console.log("sessionId is null!");
        return;
      }

      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function(){
        console.log(xhr.readyState);
        if(xhr.readyState == 4) {
          console.log("status: " + xhr.status);
//          console.log(xhr.response);

          var json = xhr.response;
          var itemCounts = json.itemCountValueList;
          var optionText = "<option value=''></option>";
          for(var i = 0; i < itemCounts.length; i++) {
            var op = itemCounts[i];
            var opText = "<option value='" + op.webItemId + "'>" + op.itemName + "</option>";
            optionText = optionText + opText;
          }
          
          var itemCountValueList = document.getElementById("itemCountValueList");
          itemCountValueList.innerHTML = optionText;
        }
      };

      xhr.open("GET", "https://happy.dqx.jp/capi/bazaar/itemcount/99/" + lCategoryId + "/" + sCategoryId + "/", true);
      xhr.setRequestHeader("X-Smile-3DS-SESSIONID", sessionId);
      xhr.responseType = "json";
      xhr.send();
    });
  });

  var searchButton = document.getElementById("searchButton");
  searchButton.addEventListener("click", function(){

    var largeCategoryValueList = document.getElementById("largeCategoryValueList");
    var lCategoryId = largeCategoryValueList.options[largeCategoryValueList.selectedIndex].value;
    if(!lCategoryId) {
      console.log("empty value selected, return");
      return;
    }

    var smallCategoryValueList = document.getElementById("smallCategoryValueList");
    var sCategoryId = smallCategoryValueList.options[smallCategoryValueList.selectedIndex].value;
    if(!sCategoryId) {
      console.log("empty value selected, return");
      return;
    }

    var itemCountValueList = document.getElementById("itemCountValueList");
    var itemCountId = itemCountValueList.options[itemCountValueList.selectedIndex].value;
    if(!itemCountId) {
      console.log("empty value selected, return");
      return;
    }

    chrome.storage.sync.get("login.sessionId", function(items){
      var sessionId = items["login.sessionId"];
      if(!sessionId){
        console.log("sessionId is null!");
        return;
      }

      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function(){
        console.log(xhr.readyState);
        if(xhr.readyState == 4) {
          console.log("status: " + xhr.status);
//          console.log(xhr.response);

          var json = xhr.response;
          var items = json.itemListValueList;
          var html = "<table>";
          for(var i=0;i<items.length;i++){
            var item = items[i];
            var price = item.itemPrice;
            var quality = item.itemQuality;
            var renkins = item.renkinList;
            
            var r = "<tr><td>" + price + "</td><td>" + quality + "</td><td>"
              + renkins.length + "</td>";
            for(var j = 0;j<renkins.length;j++){
              r = r + "<td>" + renkins[j].renkinWord + "</td>";
            }
            
            html = html + r;
          }
          html = html + "</table>";

          
          var searchResult = document.getElementById("searchResult");
          searchResult.innerHTML = html;

        }
      };

      xhr.open("POST", "https://happy.dqx.jp/capi/bazaar/search/", true);
      xhr.setRequestHeader("X-Smile-3DS-SESSIONID", sessionId);
      xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xhr.responseType = "json";
      xhr.send("bazaarno=99&largecategoryid=" + lCategoryId + "&smallcategoryid=" + sCategoryId
        + "&webitemid=" + itemCountId);
    });
  });

  checkLoginSession();
};
*/