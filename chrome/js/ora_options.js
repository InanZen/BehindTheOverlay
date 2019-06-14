function saveOptions(e)
{
    e.preventDefault();    
    chrome.storage.local.set({ 
        defaultEnabled: document.querySelector("#defaultEnabled").checked,
        defaultLoadRun: document.querySelector("#defaultLoadRun").checked,
        defaultTimerRun: document.querySelector("#defaultTimerRun").checked,
        defaultTimerCount: document.querySelector("#defaultTimerCount").value,
        defaultTimerInterval: document.querySelector("#defaultTimerInterval").value,
        defaultTimerStopOnFound: document.querySelector("#defaultTimerStopOnFound").checked
    });

    chrome.runtime.sendMessage({ 
        defaultsChanged: true
    });
}

function restoreOptions() 
{
    chrome.storage.local.get({
        "defaultEnabled": false, 
        "defaultLoadRun": true,
        "defaultTimerRun": true,
        "defaultTimerCount": 20,
        "defaultTimerInterval": 300,
        "defaultTimerStopOnFound": true
    }, function(result)
    {
        document.querySelector("#defaultEnabled").checked = result.defaultEnabled;        
        document.querySelector("#defaultLoadRun").checked = result.defaultLoadRun;
        document.querySelector("#defaultTimerRun").checked = result.defaultTimerRun;
        document.querySelector("#defaultTimerCount").value = result.defaultTimerCount;
        document.querySelector("#defaultTimerInterval").value = result.defaultTimerInterval;
        document.querySelector("#defaultTimerStopOnFound").checked = result.defaultTimerStopOnFound;
    });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);