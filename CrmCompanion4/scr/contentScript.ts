//debug Variables
var allowLogging = true;

//Global Variables
var _localAppstate:i_appstate;


//Main function
window.onload = function() {
    //Killswitch for non CRM pages
    var urlString = window.location.href;
    if(!top_CheckIfDynamicsUrl(urlString)) {
        if (allowLogging)console.log("app invalid for this page. Aborting"); 
        return;
    }

    if (allowLogging)console.log("Running");

    //listeners
    chrome.runtime.onMessage.addListener(messageHandler);

    synchLocalAppstate();
}

function messageHandler(message) {
    if (allowLogging)console.log("received:",message.text)
    switch (message.text) {
        case "AppStateUpdate":
            synchLocalAppstate();
        break;
    }
}

function top_CheckIfDynamicsUrl(urlString) {
    if (urlString.indexOf("dynamics.com") == -1) {
        return false
    }
    return true;
}

function synchLocalAppstate() {
    if (allowLogging)console.log("in synchLocalAppstate")

    //default values
    _localAppstate = {
        menuIsOpen:false,
        menuIsCollapsed:false,
        menuXPosition:500,
        menuYPosition:300,
    }

    chrome.storage.local.get("appState",(result)=>{
        var incomingAppState:i_appstate = result?.appState;
        if (incomingAppState) {
            if (allowLogging)console.log("Reveiced Appstate:", incomingAppState);

            _localAppstate = incomingAppState;
           
            _localAppstate.menuIsOpen === false?
              closeAndDeactivateMenu():
              callMenu();
        } else {
            if (allowLogging)console.log("didn't receive any incoming appstate");
            callMenu();
        }
    });   
}


async function callMenu() {

    // BUILD BUTTONS
    var iframeWrapper = document.getElementById("CME_iframeWrapper");

    if (iframeWrapper) {
        if (allowLogging)console.log("renewing properties instead"); 
        iframeWrapper.style.top = _localAppstate.menuYPosition+"px";
        iframeWrapper.style.left = _localAppstate.menuXPosition+"px";
        renderCollapseUnfold();
        return;
    }

    var div = document.createElement('div');
    div.id = "CME_iframeWrapper";
    div.style.zIndex = "1000";
    div.style.position = "absolute";
    div.style.top = _localAppstate.menuYPosition+"px" ?? "40px";
    div.style.left = _localAppstate.menuXPosition+"px" ?? "40px";
    div.style.minWidth ="0px"
    div.style.width = "0px"
    div.style.minHeight = "0px";

    var fetchedHTML = await (await fetch(chrome.extension.getURL("customMenu.html"))).text();
    div.innerHTML = fetchedHTML;
    if(allowLogging)console.log("DIV:::",div);
    var menu = div.getElementsByClassName("CME_menu")[0];
    var fetchedHTML = await (await fetch(chrome.extension.getURL("menuButtons.html"))).text();
    menu.innerHTML = fetchedHTML;

    document.body.appendChild(div);


    //Collapse/UnCollapse
    renderCollapseUnfold();

    // BUILD BUTTONS
    dragElement(document.getElementById("CME_iframeWrapper"));
    document.getElementById("CME_closeWindow").onclick = closeAndDeactivateMenu;
    document.getElementById("CME_collapseDiv").onclick = collapseAndUnfoldMenu;
    

    var dragimg = <HTMLImageElement> document.getElementById("CME_dragDivimg");
    dragimg.src = chrome.extension.getURL("svg_dragSymbol.svg");
    var closeimg = <HTMLImageElement> document.getElementById("CME_closeWindowimg");
    closeimg.src = chrome.extension.getURL("svg_closeSymbol.svg");
    var collapseimg = <HTMLImageElement> document.getElementById("CME_collapseimg");
    collapseimg.src = chrome.extension.getURL("svg_collapseSymbol.svg");
    
    customMenyMainScript();
}

//Render functions
function renderCollapseUnfold() {
    var menu = document.getElementById("CME_menu");
    if (menu) {
        menu.style.display = (_localAppstate.menuIsCollapsed)?"none":"block";
    }

}


// Make the DIV element draggable:
function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;


  var dragdiv = document.getElementById("CME_dragDiv");
  if (allowLogging)console.log(dragdiv);
  if (dragdiv) {
    dragdiv.onmousedown = dragMouseDown;
  } 

  function dragMouseDown(e) {

    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {

    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";

  }

  function closeDragElement() {

    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;


    _localAppstate = {
        menuIsOpen: true,
        menuXPosition: elmnt.offsetLeft,
        menuYPosition: elmnt.offsetTop
    }
    if (allowLogging)console.log(_localAppstate)

    chrome.storage.local.set({"appState":_localAppstate},()=>
    {
		chrome.runtime.sendMessage({text:"AppStateUpdate"});
    });

  }
}

// Other functions 
function closeAndDeactivateMenu() {

    if (allowLogging)console.log("In closeAndDeactivateMenu")
    
    var iframeWrapper = document.getElementById("CME_iframeWrapper");
    if (!iframeWrapper) {return;}

    document.body.removeChild(iframeWrapper);

    _localAppstate.menuIsOpen = false;
    chrome.storage.local.set({"appState":_localAppstate},()=>
    {
        if (allowLogging)console.log("appstates saved",_localAppstate);
		chrome.runtime.sendMessage({text:"AppStateUpdate"});
    });
}

// Other functions 
function collapseAndUnfoldMenu() {

    if (allowLogging)console.log("In collapseAndUnfoldMenu")

    if (_localAppstate.menuIsCollapsed) 
    {_localAppstate.menuIsCollapsed = false;} 
    else if (!_localAppstate.menuIsCollapsed) _localAppstate.menuIsCollapsed = true;

    chrome.storage.local.set({"appState":_localAppstate},()=>
    {
        if (allowLogging)console.log("appstates saved",_localAppstate);
		chrome.runtime.sendMessage({text:"AppStateUpdate"});
    });
    renderCollapseUnfold();
}





//CUSTOM MENY SCRIPT

//Main function run on every opening of the tab querying towards the active tab
function customMenyMainScript() {
    if(allowLogging)console.log("CustomMenuStarted");

    var urlString = window.location.href;
    //complex button logics
    handleToLegacyInterfaceButton(urlString);

    //simple button logics
    var buttonCollection = <HTMLCollectionOf<HTMLButtonElement>> document.getElementsByClassName('standardUrlNavButton');
    const buttonArray = Array.from(buttonCollection);
    buttonArray.forEach(e=>{e.addEventListener('click', hostPlusUrl)});
}

//Button "Open in legacy CRM"
function handleToLegacyInterfaceButton(urlString) {
    if (urlString) {
        let button = <HTMLButtonElement> document.getElementById('CME_toLegacyInterfaceButton');
        if (button && checkIfUrlIsCorrect(urlString)) {
            button.addEventListener('click', openOldInterface);
        } else {
            button.disabled = true;
            button.innerText = "Not a unified interfaceurl";
            button.classList.add("disabled");
        }
    }
}

function checkIfUrlIsCorrect(url) {
    if (url.indexOf("appid=") == -1) {
        if(allowLogging)console.log("Couldn't find appid in url");
        return false
    }
    return true;
}

function openOldInterface() {
    var urlString = window.location.href;
    let url = new URL(urlString);
    let params = new URLSearchParams(url.search.slice(1));
    params.delete("appid");
    params.delete("forceUCI");
    let openUrl = "https://" + url.host.toString() + url.pathname.toString() + "?app=d365default&forceUCI=0&" + params.toString();
    window.open(openUrl);
}


//ToSolutionsButton 
function hostPlusUrl() {
    var toUrl = this?.dataset.url;
    if (!toUrl) return;
    var urlString = window.location.href;
    let url = new URL(urlString);
    let openUrl = "https://" 
    + url.host.toString() 
    + toUrl;
    window.open(openUrl);
}