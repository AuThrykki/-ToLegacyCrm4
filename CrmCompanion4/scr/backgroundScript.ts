chrome.tabs.onActivated.addListener(function (activeInfo) {
    console.log("active tab changed, sending update.");
    chrome.tabs.sendMessage(activeInfo.tabId,{text:"AppStateUpdate"});
});
