var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
//debug Variables
var allowLogging = true;
//Main function
window.onload = function () {
    //Killswitch for non CRM pages
    var urlString = window.location.href;
    if (!top_CheckIfDynamicsUrl(urlString)) {
        if (allowLogging)
            console.log("Not dynamics url. Aborting contentscript");
        return;
    }
    if (allowLogging)
        console.log("Running");
    //listeners
    chrome.runtime.onMessage.addListener(messageHandler);
};
function top_CheckIfDynamicsUrl(urlString) {
    if (urlString.indexOf("dynamics.com") == -1) {
        return false;
    }
    return true;
}
function messageHandler(message) {
    if (allowLogging)
        console.log("received:", message.text);
    switch (message.text) {
        case "test":
            console.log("Test scenario triggered!");
            break;
        case "logAllFields":
            consoleLogAllFieldValues();
            break;
    }
}
//Read all Fields function:
const consoleLogAllFieldValues = () => __awaiter(this, void 0, void 0, function* () {
    var entityNameIdPack = fetchUrl();
    if (entityNameIdPack === null) {
        return;
    }
    var entityName = entityNameIdPack[0];
    var entityId = entityNameIdPack[1];
    console.log(entityName, "    ", entityId);
    var req = createFetchRequest(entityName, entityId);
    let data = null;
    req.onreadystatechange = function () {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.readyState === 4) {
                req.onreadystatechange = null;
                if (this.status === 200) {
                    var result = JSON.parse(this.response);
                    data = result;
                    console.log("Data::: ", data);
                }
                else {
                    console.warn(this.statusText);
                }
            }
        });
    };
    yield req.send();
    //Step-6 show return result values
    if (!data) {
        console.log("Data was null");
        return;
    }
    var entityFetched = data.value[0];
    console.log(entityFetched);
    let structuredFields = createStructuredFields(entityFetched);
});
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
    return [entityName, entityId];
};
const createFetchRequest = (entityName, entityId) => {
    var fetchXml = `
        <fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>
            <entity name='${entityName}'>
                <filter type='and'>
                    <condition attribute='${entityName}id' operator='like' value='${entityId}' />
                </filter>
            </entity>
        </fetch>
        `;
    var encodedFetchXML = encodeURI(fetchXml);
    var query = `/api/data/v8.0/${entityName}s?fetchXml=` + encodedFetchXML;
    var finalpathwithquery = "https://" + window.location.hostname + query;
    var isAsync = false;
    var req = null;
    if (window.XMLHttpRequest) {
        req = new XMLHttpRequest();
    }
    req.open("GET", finalpathwithquery, isAsync);
    req.setRequestHeader("OData-MaxVersion", "4.0");
    req.setRequestHeader("OData-Version", "4.0");
    req.setRequestHeader("Accept", "application/json");
    req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    req.setRequestHeader("Prefer", "odata.include-annotations=\"*\"");
    return req;
};
const createStructuredFields = (entityFetched) => {
    var _a, _b, _c;
    let mainFields = {};
    let fieldAtValues = {};
    for (let key in entityFetched) {
        var keyContainsAtSymbol = key.indexOf("@") !== -1;
        //console.log("| ", key , " |", keyContainsAtSymbol );
        if (!keyContainsAtSymbol) {
            mainFields[key] = entityFetched[key];
        }
        else {
            fieldAtValues[key] = entityFetched[key];
        }
    }
    //console.log("FIELDS:::", fields);
    //console.log("@Values:::", fieldAtValues);
    //console.log(Object.keys(entityFetched).length,"|",Object.keys(fields).length,"|",Object.keys(fieldAtValues).length,"|");
    let FieldSubTypes = {
        formattedValue: "OData.Community.Display.V1.FormattedValue",
        lookupName: "Microsoft.Dynamics.CRM.lookuplogicalname",
        navProperty: "Microsoft.Dynamics.CRM.associatednavigationproperty"
    };
    let structuredFields = {};
    for (let key in mainFields) {
        let formattedValue = (_a = fieldAtValues[key + "@" + FieldSubTypes.formattedValue]) !== null && _a !== void 0 ? _a : null;
        let lookupName = (_b = fieldAtValues[key + "@" + FieldSubTypes.lookupName]) !== null && _b !== void 0 ? _b : null;
        let navProperty = (_c = fieldAtValues[key + "@" + FieldSubTypes.navProperty]) !== null && _c !== void 0 ? _c : null;
        structuredFields[key] = {
            value: mainFields[key],
            formattedValue: formattedValue,
            lookupName: lookupName,
            navProperty: navProperty,
        };
    }
    console.log("Structured Fields:", structuredFields);
};
