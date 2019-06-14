var chrome = chrome || browser;

var defaultEnabled = false;
var default_loadRun = true;
var default_timerRun = true;
var default_timerInterval = 300;
var default_timerCount = 20;
var default_timerStopOnFound = true;

var tabSettings = new Array();
var hostSettings = new Array();

function displayCounterForTabID(tabID)
{    
    var tabCount = 0;
    if (tabSettings[tabID])
        tabCount = tabSettings[tabID].count;

    if (tabCount == 0)    
        chrome.browserAction.setBadgeText({text: ""});    
    else    
        chrome.browserAction.setBadgeText({text: tabCount.toString()});    
}
function setIconForTabID(tabID)
{
    var isenabled = defaultEnabled;
    if (tabSettings[tabID])
        isenabled = tabSettings[tabID].enabled;

    setIcon(isenabled);
}
function setIcon(isenabled)
{
    if (isenabled)
    {
        chrome.browserAction.setIcon({
            path: {
                "32": "images/jalousie_open.svg"
            }   
        });
    }
    else
    {
        chrome.browserAction.setIcon({
            path: {
                "32": "images/jalousie_closed.svg"
            }   
        });
    }
}
function toggleOverlay(tabID)
{      
    var isenabled = defaultEnabled;
    if (tabSettings[tabID])
        isenabled = tabSettings[tabID].enabled;
    else
        tabSettings[tabID] = { enabled: isenabled, count: 0 };

    isenabled = !isenabled;
    tabSettings[tabID].enabled = isenabled;

    setIcon(isenabled);

    chrome.tabs.sendMessage(tabID, { hideOverlays: isenabled }); 
}

function loadSettings() 
{
    chrome.storage.local.get({
        "defaultEnabled": false, 
        "defaultLoadRun": true,
        "defaultTimerRun": true,
        "defaultTimerCount": 20,
        "defaultTimerInterval": 300,
        "defaultTimerStopOnFound": true,
        "hostSettings": new Array()
    }, function(result)
    {
        defaultEnabled = result.defaultEnabled;
        default_loadRun = result.defaultLoadRun;
        default_timerRun = result.defaultTimerRun;
        default_timerCount = result.defaultTimerCount;
        default_timerInterval = result.defaultTimerInterval;
        default_timerStopOnFound = result.defaultTimerStopOnFound;
        
        if (result.hostSettings != undefined)
            hostSettings = result.hostSettings; 
    });
}

function getDefaultSettings()
{
    return {
        isEnabled: defaultEnabled, 
        loadRun: default_loadRun, 
        timerRun: default_timerRun, 
        timerCount: default_timerCount, 
        timerInterval: default_timerInterval,
        timerStopOnFound: default_timerStopOnFound
    };
}


chrome.browserAction.setBadgeBackgroundColor({color: "#666666"});
try { chrome.browserAction.setBadgeTextColor({color: "white"}); }
catch(err) {  }

chrome.tabs.onActivated.addListener(
    (activeInfo) => {
        var tabID = activeInfo.tabId;
        if (tabSettings[tabID] == undefined)                
            tabSettings[tabID] = { enabled: defaultEnabled, count: 0 };        
        displayCounterForTabID(tabID);
        setIconForTabID(tabID);
    }
);

chrome.tabs.onUpdated.addListener(
    function (tabID, changeInfo, tab)
    {
        if (changeInfo.url) 
        {
            var isenabled = defaultEnabled;
            var hostname = changeInfo.url.split("/")[2];
            if (hostSettings[hostname] != undefined)            
                isenabled = hostSettings[hostname].isEnabled;   

            tabSettings[tabID] = { enabled: isenabled, count: 0 };        
            displayCounterForTabID(tabID);
            setIconForTabID(tabID);
        }
    }
);
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) 
    {
       /* console.log("message received");
        console.log(request);
        console.log(sender);*/

        if (request.removeCount != undefined)
        {
            var tabID = sender.tab.id;
            if (tabSettings[tabID])
                tabSettings[tabID].count = request.removeCount;
            else
                tabSettings[tabID] = { enabled: defaultEnabled, count: request.removeCount };
            displayCounterForTabID(tabID);
        }
        if (request.readyToRun)
        {
            var hostname = sender.tab.url.split("/")[2];
            if (hostSettings[hostname] != undefined)
                sendResponse(hostSettings[hostname]);              
            else
            {
                var defaultSettings = getDefaultSettings();
                sendResponse(defaultSettings);
            } 
        }
        if (request.getPopupSettings != undefined)
        {                
            var hostname = request.getPopupSettings;    
            if (hostSettings[hostname] != undefined)
                sendResponse(hostSettings[hostname]);              
            else
            {
                var defaultSettings = getDefaultSettings();
                sendResponse(defaultSettings);
            }
        }
        if (request.getDefaultSettings != undefined)
        {                
            var defaultSettings = getDefaultSettings();
            sendResponse(defaultSettings);            
        }
        if (request.setHostSettings != undefined)
        {                
            var hostname = request.setHostSettings;  
            var tabID = request.tabID;

            hostSettings[hostname] = {
                isEnabled: request.isEnabled,
                loadRun: request.loadRun, 
                timerRun: request.timerRun, 
                timerCount: request.timerCount, 
                timerInterval: request.timerInterval,
                timerStopOnFound: request.timerStopOnFound
            };
            
            chrome.tabs.sendMessage(tabID, { setSettings: hostSettings[hostname] });

            if (tabSettings[tabID] == undefined)                
                tabSettings[tabID] = { enabled: defaultEnabled, count: 0 };

            if (hostSettings[hostname].isEnabled != tabSettings[tabID].enabled)            
                toggleOverlay(tabID);

            if (hostSettings[hostname].isEnabled == defaultEnabled &&
                hostSettings[hostname].loadRun == default_loadRun &&
                hostSettings[hostname].timerRun == default_timerRun &&
                hostSettings[hostname].timerCount == default_timerCount &&
                hostSettings[hostname].timerInterval == default_timerInterval &&
                hostSettings[hostname].timerStopOnFound == default_timerStopOnFound)
            {
                delete hostSettings[hostname];             
            }
            chrome.storage.local.set({
                hostSettings: hostSettings
            });
        }

        if (request.defaultsChanged == true)
        {
            loadSettings();
        }        
    }
);

loadSettings();