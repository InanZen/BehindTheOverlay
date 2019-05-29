// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var chrome = chrome || browser;
var tabSettings = new Array();
var hostSettings = new Array();

function DisplayCounterForTabID(tabID)
{    
    var tabCount = 0;
    if (tabSettings[tabID])
        tabCount = tabSettings[tabID].count;

    if (tabCount == 0)    
        chrome.browserAction.setBadgeText({text: ""});    
    else    
        chrome.browserAction.setBadgeText({text: tabCount.toString()});    
}
function SetIconForTabID(tabID)
{
    var isenabled = true;
    if (tabSettings[tabID])
        isenabled = tabSettings[tabID].enabled;

    SetIcon(isenabled);
}
function SetIcon(flag)
{
    if (flag)
    {
        chrome.browserAction.setIcon({
            path: {
                "32": "images/jalousie_open.svg"
            }   
        });
        chrome.browserAction.setTitle({title: "Enabled"});
    }
    else
    {
        chrome.browserAction.setIcon({
            path: {
                "32": "images/jalousie_closed.svg"
            }   
        });
        chrome.browserAction.setTitle({title: "Disabled"});
    }
}
function ToggleOverlay(tab)
{
    if (tab)
    {        
        var tabID = tab.id;        
        var isenabled = true;
        if (tabSettings[tabID])
            isenabled = tabSettings[tabID].enabled;
        else
            tabSettings[tabID] = { enabled: true, count: 0 };

        isenabled = !isenabled;
        tabSettings[tabID].enabled = isenabled;

        var hostname = tab.url.split("/")[2];  
        hostSettings[hostname] = isenabled;

        SetIcon(isenabled);

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { hideOverlays: isenabled });
        });
    }
}

chrome.browserAction.setBadgeBackgroundColor({color: "#666666"});
try { chrome.browserAction.setBadgeTextColor({color: "white"}); }
catch(err)   {  }
chrome.browserAction.onClicked.addListener((tab) => { ToggleOverlay(tab); });
chrome.tabs.onActivated.addListener(
    (activeInfo) => {
        DisplayCounterForTabID(activeInfo.tabId);
        SetIconForTabID(activeInfo.tabId);
    }
);
chrome.tabs.onUpdated.addListener(
    function (tabId, changeInfo, tab)
    {
        if (changeInfo.url) 
        {
            var isenabled = true;
            var hostname = changeInfo.url.split("/")[2];
            if (hostSettings[hostname] != undefined)
            {
                isenabled = hostSettings[hostname];
            }
            
            if (tabSettings[tabId])
            {
                tabSettings[tabId].enabled = isenabled;
                tabSettings[tabId].count = 0;
            } 
            else
            {
                tabSettings[tabId] = { enabled: isenabled, count: 0 };
            }
            SetIconForTabID(tabId);
        }
    }
);
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) 
    {
        if (request.removeCount != undefined)
        {
            var tabID = sender.tab.id;
            if (tabSettings[tabID])
                tabSettings[tabID].count = request.removeCount;
            else
                tabSettings[tabID] = { enabled: true, count: request.removeCount };
            DisplayCounterForTabID(tabID);
        }
        if (request.isenabled != undefined)
        {
            var tabID = sender.tab.id;
            if (tabSettings[tabID])
                tabSettings[tabID].enabled = request.isenabled;
            else
                tabSettings[tabID] = { enabled: request.isenabled, count: 0 };

            var hostname = sender.tab.url.split("/")[2];            
            hostSettings[hostname] = request.isenabled;

            SetIconForTabID(tabID);
        }
        /*if (request.readyToRun)
        {
            var hostname = sender.tab.url.split("/")[2];            
            var isenabled = hostSettings[hostname];
            if (hostSettings[hostname] == undefined)
                isenabled = true;
            sendResponse({run: isenabled});
        }*/
    }
);