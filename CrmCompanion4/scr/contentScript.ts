//debug Variables
var allowLogging = true;

//Main function
window.onload = function() {
    //Killswitch for non CRM pages
    var urlString = window.location.href;
    if(!top_CheckIfDynamicsUrl(urlString)) {
        if (allowLogging)console.log("Not dynamics url. Aborting contentscript"); 
        return;
    }

    if (allowLogging)console.log("Running");

    //listeners
    chrome.runtime.onMessage.addListener(messageHandler);
}

function top_CheckIfDynamicsUrl(urlString) {
    if (urlString.indexOf("dynamics.com") == -1) {
        return false
    }
    return true;
}

function messageHandler(message) {
    if (allowLogging)console.log("received:",message.text)
    switch (message.text) {
        case "test": console.log("Test scenario triggered!"); break;
        case "logAllFields": consoleLogAllFieldValues(); break;
    }
}



//Read all Fields function:
const consoleLogAllFieldValues = () => {

    var entityNameIdPack = fetchUrl();
    if (entityNameIdPack === null) { return; }

    var entityName = entityNameIdPack[0];
    var entityId = entityNameIdPack[1];
    console.log(entityName, "    ", entityId);


    var req = createFetchRequest(entityName, entityId);
    let data = null;

    req.onreadystatechange = function () {
        if (this.readyState === 4) {
            req.onreadystatechange = null;
            if (this.status === 200) {
                var result = JSON.parse(this.response);
                data = result;
                console.log("Data::: ", data)
            }
            else {
                console.warn(this.statusText);
            }
        }
    };
    req.send();

    //Step-6 show return result values
    if (data) {
        var entityFetched = data.value[0];
        console.log(entityFetched);    
    } else {
        console.log("Data was null")
    }
 
}

const fetchUrl = () => {
    let currentUrl = new URL(window.location.href);
    let currentUrlSearch = currentUrl.search;
    let urlParams = new URLSearchParams(currentUrlSearch);
    let entityName = urlParams.get("etn");
    let entityId = urlParams.get("id");

    console.log("name:", entityName, " | id: ", entityId);
    if (!entityName || !entityId) {
        console.log("Missing entity id or name, cannot continue");
        console.log("name:", entityName, " | id: ", entityId);
        return null;
    }

    console.log(Xrm);
    if (!Xrm) {
        console.log("Couldn't locate Xrm:", Xrm);
    }

    return [entityName, entityId];
}

const createFetchRequest = (entityName, entityId) => {
    //Retrieve Account Names whose Account Name Starts with word "M" using WEB API
    //Step-1 : create fetch xml in adv find and replace all double quotes with single quote inside properties to shape it as a string
    var fetchXml =
        `
        <fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>
            <entity name='${entityName}'>
                <filter type='and'>
                    <condition attribute='${entityName}id' operator='like' value='${entityId}' />
                </filter>
            </entity>
        </fetch>
        `;
    //Step-2 : encode URI : var encodedFetchXML = encodeURI(fetchxml)
    var encodedFetchXML = encodeURI(fetchXml);

    //Step-3 : create a query path with query and odata partial uurl : var query = "/api/data/v8.0/accounts?fetchXml="+encodedFetchXML ;
    var query = `/api/data/v8.0/${entityName}s?fetchXml=` + encodedFetchXML;

    //Step-4 : create complete path : var path = Xrm.Page.context.getClientUrl() + query ;
    var finalpathwithquery = Xrm.Page.context.getClientUrl() + query;

    //Step-5 : create a XmlHttpRequest to retrieve data
    var data = null;
    var isAsync = false;

    var req = null;
    if (window.XMLHttpRequest) {
        req = new XMLHttpRequest();
    }
    // else if (window.ActiveXObject) {
    //     req = new ActiveXObject("MSXML2.XMLHTTP.3.0");
    // }

    req.open("GET", finalpathwithquery, isAsync);
    req.setRequestHeader("OData-MaxVersion", "4.0");
    req.setRequestHeader("OData-Version", "4.0");
    req.setRequestHeader("Accept", "application/json");
    req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    req.setRequestHeader("Prefer", "odata.include-annotations=\"*\"");
    return req;
}