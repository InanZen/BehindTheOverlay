var hostname;
var tabID;
var isEnabled = false;
var loadRun = true;
var timerRun = true;
var timerInterval = 300;
var timerCount = 20;
var timerStopOnFound = true;

function initializePopup()
{
    chrome.tabs.query({active: true, currentWindow: true}, loadSettings);

    document.addEventListener("click", (event) => {
        var targetElement = event.target || event.srcElement;
        if (targetElement.id == "isEnabled")        
            toggleEnabled();        
        else if (targetElement.id == "saveSettings")
            setSettings();
        else if (targetElement.id == "resetSettings")
            resetSettings();
    });
}

function loadSettings(tabs)
{
    hostname = tabs[0].url.split("/")[2];
    tabID = tabs[0].id;

    chrome.runtime.sendMessage({ getPopupSettings: hostname }, function(response)
    {
        if (response != undefined)
        {
            isEnabled = response.isEnabled;
            loadRun = response.loadRun;
            timerRun = response.timerRun;
            timerInterval = response.timerInterval;
            timerCount = response.timerCount;
            timerStopOnFound = response.timerStopOnFound;
        }
        setForm();
    });
}

function setForm()
{
    document.querySelector("#hostname").value = hostname;
    if (isEnabled)
    {
        document.querySelector("#isEnabled").value = "Enabled";
        document.querySelector("#isEnabled").style.backgroundColor = "#88b74c";
    }
    else
    {
        document.querySelector("#isEnabled").value = "Disabled";
        document.querySelector("#isEnabled").style.backgroundColor = "";
    }
    document.querySelector("#loadRun").checked = loadRun;
    document.querySelector("#timerRun").checked = timerRun;
    document.querySelector("#timerCount").value = timerCount;
    document.querySelector("#timerInterval").value = timerInterval;
    document.querySelector("#timerStopOnFound").checked = timerStopOnFound;
}


function toggleEnabled()
{
    isEnabled = !isEnabled;
    setForm();
    setSettings();
}

function setSettings()
{
    loadRun = document.querySelector("#loadRun").checked;
    timerRun = document.querySelector("#timerRun").checked;
    timerCount = document.querySelector("#timerCount").value;
    timerInterval = document.querySelector("#timerInterval").value;
    timerStopOnFound = document.querySelector("#timerStopOnFound").checked;

    chrome.runtime.sendMessage({ 
        setHostSettings: hostname,
        tabID: tabID,
        isEnabled: isEnabled,
        loadRun: loadRun,
        timerRun: timerRun,
        timerInterval: timerInterval,
        timerCount: timerCount,
        timerStopOnFound: timerStopOnFound
    });
}

function resetSettings()
{
    chrome.runtime.sendMessage({ getDefaultSettings: true }, function(response)
    {
        if (response != undefined)
        {
            isEnabled = response.isEnabled;
            loadRun = response.loadRun;
            timerRun = response.timerRun;
            timerInterval = response.timerInterval;
            timerCount = response.timerCount;
            timerStopOnFound = response.timerStopOnFound;
        }
        setForm();
        setSettings();
    });
}

document.addEventListener("DOMContentLoaded", initializePopup);