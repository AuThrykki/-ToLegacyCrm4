
//Interfaces
interface i_appstate {
    menuIsOpen ? : boolean,
    menuIsCollapsed ? : boolean, 
    menuXPosition ? : number,
    menuYPosition ? : number,
}

interface i_localHtmlObjects {
    OpenMenuButton ? : HTMLButtonElement,
        resetMenuPositionButton ? : HTMLButtonElement,
        menuIsCollapsedInput ? : HTMLInputElement,
        xPositionInput ? : HTMLInputElement,
        yPositionInput ? : HTMLInputElement,
}

//Global variables
var _localAppstate: i_appstate;
var _localHTMLObjects: i_localHtmlObjects = {};
var allowLogging = true;
var _currentUrl;

//MAIN
document.addEventListener("DOMContentLoaded",  function (event) {

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs || !tabs[0] || !tabs[0].url)        
        {panic(); return;}

        _currentUrl = tabs[0].url;
       if(allowLogging)console.log("current url:",_currentUrl);

        if (!_currentUrl || !CheckIfDynamicsUrl()) 
        {
            panic();
            return;
        } else {
            popup_customMenyMainScript();
        }
    });


});


function CheckIfDynamicsUrl() {
    if (_currentUrl.indexOf("dynamics.com") == -1) {
        return false;
    }
    return true;
}
function panic() {
    var menu = document.getElementById("CME_mainWrapper");
    var errorScreen = document.getElementById("errorScreen");
    if (menu)
        menu.style.display = "none";
    if (errorScreen)
        errorScreen.style.display = "block";
}

//Custom InBoxMenu
function popup_customMenyMainScript() {
    if(allowLogging)console.log("CustomMenuStarted");

    chrome.tabs.query({currentWindow: true, active: true},function(tabs){
        _currentUrl = tabs[0].url;
        

        //complex button logics
        popup_handleToLegacyInterfaceButton();

        //simple button logics
        var buttonCollection = <HTMLCollectionOf<HTMLButtonElement>> document.getElementsByClassName('standardUrlNavButton');
        const buttonArray = Array.from(buttonCollection);
        buttonArray.forEach(e=>{e.addEventListener('click', popup_hostPlusUrl)});
     });

  
}

//Button "Open in legacy CRM"
function popup_handleToLegacyInterfaceButton() {
    if (_currentUrl) {
        let button = <HTMLButtonElement> document.getElementById('CME_toLegacyInterfaceButton');
        if (button && popup_checkIfUrlIsCorrect(_currentUrl)) {
            button.addEventListener('click', popup_openOldInterface);
        } else {
            button.disabled = true;
            button.innerText = "Not a unified interfaceurl";
            button.classList.add("disabled");
        }
    }
}

function popup_checkIfUrlIsCorrect(url) {
    if (url.indexOf("appid=") == -1) {
        if(allowLogging)console.log("Couldn't find appid in url");
        return false
    }
    return true;
}

function popup_openOldInterface() {

    let url = new URL(_currentUrl);
    let params = new URLSearchParams(url.search.slice(1));
    params.delete("appid");
    params.delete("forceUCI");
    let openUrl = "https://" + url.host.toString() + url.pathname.toString() + "?app=d365default&forceUCI=0&" + params.toString();
    window.open(openUrl);

}

//ToSolutionsButton 
function popup_hostPlusUrl() {
    var toUrl = this?.dataset.url;
    if (!toUrl) return;
  
    let url = new URL(_currentUrl);
    let openUrl = "https://" 
    + url.host.toString() 
    + toUrl;
    window.open(openUrl);

}