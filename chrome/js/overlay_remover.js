/**
 * This is a script that will remove overlay popups in the 99% of the cases.
 * It's doing that by detecting DOM elements.
 *
 */

var debug = false;

var utils = (function () {
    function hideElement(element) {
        hiddenElements.push([element, element.style.cssText]);
        styleImportant(element, 'display', 'none');
    }

    function styleImportant(element, cssProperty, cssValue) {
        element.style[cssProperty] = '';
        var cssText = element.style.cssText || '';
        if (cssText.length > 0 && cssText.slice(-1) != ';')
            cssText += ';';
        // Some pages are using !important on elements, so we must use it too
        element.style.cssText = cssText + cssProperty + ': ' + cssValue + ' !important;';
    }

    function isVisible(element) {
        return element.offsetWidth > 0 && element.offsetHeight > 0;
    }

    function getZIndex(element) {
        return parseInt(window.getComputedStyle(element).zIndex);
    }

    function isAnElement(node) {
        return node.nodeType == 1; // nodeType 1 mean element
    }

    function nodeListToArray(nodeList) {
        return Array.prototype.slice.call(nodeList);
    }

    function forEachElement(nodeList, functionToApply) {
        nodeListToArray(nodeList).filter(isAnElement).forEach(function (element) {
            functionToApply.call(this, element);
        });
    }

    function collectParrents(element, predicate) {
        var matchedElement = element && predicate(element) ? [element] : [];
        var parent = element.parentNode;

        if (parent && parent != document && parent != document.body) {
            return matchedElement.concat(collectParrents(parent, predicate));
        } else {
            return matchedElement;
        }
    }

    // Calculate the number of DOM elements inside an element
    function elementWeight(element, maxThreshold) {
        var grandTotal = 0;
        var nextElement = element;
        var nextGrandChildNodes = [];

        function calculateBreathFirst(element) {
            var total = 0;
            var nextChildElements = [];

            var childNodes = element.childNodes;
            total = childNodes.length;

            forEachElement(childNodes, function (childNode) {
                var grandChildNodes = nodeListToArray(childNode.childNodes);
                total += grandChildNodes.length;
                nextChildElements = nextChildElements.concat(grandChildNodes.filter(isAnElement));
            });
            return [total, nextChildElements];
        }

        while (nextElement) {
            var tuple_total_nextChildElements = calculateBreathFirst(nextElement);
            var total = tuple_total_nextChildElements[0];

            grandTotal += total;
            nextGrandChildNodes = nextGrandChildNodes.concat(tuple_total_nextChildElements[1]);

            if (grandTotal >= maxThreshold) {
                break;
            } else {
                nextElement = nextGrandChildNodes.pop();
            }
        }

        return grandTotal;
    }

    return {
        hideElement: hideElement,
        isVisible: isVisible,
        getZIndex: getZIndex,
        forEachElement: forEachElement,
        collectParrents: collectParrents,
        elementWeight: elementWeight,
        styleImportant: styleImportant
    }
})();

var overlayRemover = function (debug, utils) {
    var removeCount = 0;

    // Check the element in the middle of the screen
    // Search fo elements that has zIndex attribute
    function methodTwoHideElementMiddle() {
        var overlayPopup = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
        var overlayFound = utils.collectParrents(overlayPopup, function (el) {
            return utils.getZIndex(el) > 0;
        });

        if (debug)
            console.debug('Overlay found: ', overlayFound);

        if (overlayFound.length == 0)
            return false;

        var olderParent = overlayFound.pop();

        if (debug)
            console.debug('Hide parrent: ', olderParent);

        return olderParent;
    }

    function containersOverflowAuto() {
        var containers = [document.documentElement, document.body];

        containers.forEach(function (element) {
            if (window.getComputedStyle(element).overflow == 'hidden') {
                utils.styleImportant(element, 'overflow', 'auto');
            }
        })
    }

    function run() {
        removeCount = 0;
        for (var i = 0; i < 10; i++) {
            var candidate = methodTwoHideElementMiddle();
            var first = i == 0;
            if (candidate === false) {
                /*if (first)
                    alert('No overlay has been found on this website.');*/
                break;
            }
            else {
                if (!first) {
                    // Prevent to hide the actual content
                    var weightThreshold = 100;
                    var candidateWeight = utils.elementWeight(candidate, weightThreshold)
                    if (candidateWeight < weightThreshold) {
                        if (debug)
                            console.log('Element is too lightweigh, hide it', candidate);
                        utils.hideElement(candidate);
                        removeCount++;
                    }
                    else {
                        if (debug)
                            console.log("Element is too heavy, don't hide it", candidate);
                    }
                }
                else {
                    utils.hideElement(candidate);
                    removeCount++;
                    containersOverflowAuto();
                }
            }
        }
        return removeCount;
    }
    return {
        run: run
    };

};

overlayRemoverInstance = overlayRemover(debug, utils);

function overlayRemoverRun() {    
    var count = overlayRemoverInstance.run();
    chrome.runtime.sendMessage({ removeCount: hiddenElements.length });
    return count;
}

function toggleOverlays(hide)
{
    if (hide)
    {
        overlayRemoverRun();
    }
    else
    {
        clearInterval(intervalHandle); 

        for (var i = 0; i < hiddenElements.length; i++)
        {
            var element = hiddenElements[i][0];
            element.style.cssText = hiddenElements[i][1];
        }
        hiddenElements = new Array();    
        chrome.runtime.sendMessage({ removeCount: 0 });
    }
}


var hiddenElements = new Array();
var intervalHandle;
var isEnabled = false;
var loadRun = true;
var timerRun = true;
var timerInterval = 300;
var timerCount = 20;
var timerStopOnFound = true;
var runCount = 0;

function updateTimedRun()
{
    if (timerStopOnFound && hiddenElements.length > 0)
    {
        clearInterval(intervalHandle);
        return;
    }    

    overlayRemoverRun();

    runCount++;
    if (runCount >= timerCount)    
        clearInterval(intervalHandle);     
}


function readyToRun() 
{   
    chrome.runtime.sendMessage({ readyToRun: true }, function(response)
    {
        if (response != undefined)
        {            
            isEnabled = response.isEnabled;
            loadRun = response.loadRun;
            timerRun = response.timerRun;
            timerCount = response.timerCount;
            timerInterval = response.timerInterval;
            timerStopOnFound = response.timerStopOnFound;

            if (isEnabled)
            {
                if (loadRun)
                    overlayRemoverRun();
                if (timerRun)
                {
                    intervalHandle = setInterval(updateTimedRun, timerInterval);
                }
            }
        }
    });      
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) 
    {
        if (request.hideOverlays != undefined)        
            toggleOverlays(request.hideOverlays);   
        else if (request.setSettings != undefined)
        {            
            isEnabled = response.isEnabled;
            loadRun = response.loadRun;
            timerRun = response.timerRun;
            timerCount = response.timerCount;
            timerInterval = response.timerInterval;
            timerStopOnFound = response.timerStopOnFound;
        }
    }
);

window.addEventListener("load", readyToRun);