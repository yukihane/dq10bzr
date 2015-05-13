var OAUTH_URL = "https://secure.square-enix.com/oauth/oa/";

var mainModule = angular.module("dq10bzr.Main", ["ui.bootstrap"]);

mainModule.controller("userInfoCtrl", ["$scope", "$modal", "$log", function($scope, $modal, $log){
  $scope.id = "(未ログイン)";
  $scope.character = "(キャラクター未選択)";

  $scope.login = function(){
    $log.info("login clicked");

    var modalInstance = $modal.open({
      templateUrl: 'loginPane.html',
      controller: 'loginCtrl',
      resolve: {
        items: function () {
          return $scope.items;
        }
      }
    });

    modalInstance.result.then(function (input) {
      $log.info("id: " + input.sqexid);
    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
    });
  };


}]);

mainModule.controller('loginCtrl', ["$scope", "$modalInstance", "items", function ($scope, $modalInstance, items) {

  $scope.sqexid = "";
  $scope.password = "";

  $scope.ok = function () {
    $modalInstance.close({sqexid: $scope.sqexid, password: $scope.password});
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
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