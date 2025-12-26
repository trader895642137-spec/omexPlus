
document.getElementById('mainButton').addEventListener('click', () => {


    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ["build/omex.bundle.js"],
            world: "MAIN"
        }, async () => {

            // await new Promise(r => setTimeout(r, 3000)); 
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: (actionName) => {

                    window.omexLib.Run();
                    
                },
                args: ['MAIN'],
                world: "MAIN"
            });
        });
    });


});



document.getElementById('selectStrategyButton').addEventListener('click', () => {


    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ["build/omex.bundle.js"],
            world: "MAIN"
        }, async () => {

            // await new Promise(r => setTimeout(r, 3000)); 
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: (actionName) => {

                    window.omexLib.OMEXApi.selectStrategy();
                    
                },
                args: ['SELECT_STRATEGY'],
                world: "MAIN"
            });
        });
    });


});
document.getElementById('fillEstimationPanelByStrategyName').addEventListener('click', () => {


    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

        // TODO:Remove files: ["build/omex.bundle.js"] seems not nececerly
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ["build/omex.bundle.js"],
            world: "MAIN"
        }, async () => {

            // await new Promise(r => setTimeout(r, 3000)); 
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: (actionName) => {

                    window.omexLib.OMEXApi.fillEstimationPanelByStrategyName();
                    
                },
                args: ['FILL-ESTIMATION-PANEL-BY-STRATEGY-NAME'],
                world: "MAIN"
            });
        });
    });


});



document.getElementById('silentNotificationForMoment').addEventListener('click', () => {


    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: [],
            world: "MAIN"
        }, async () => {

            // await new Promise(r => setTimeout(r, 3000)); 
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: (actionName) => {
                    window.omexLib.silentNotificationForMoment();
                    
                },
                args: ['SILENT-NOTIFICATION-FOR-MOMENT'],
                world: "MAIN"
            });
        });
    });


});





document.getElementById('openAllGroupsInNewTabs').addEventListener('click', () => {


    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ["build/omex.bundle.js"],
            world: "MAIN"
        }, async () => {

            // await new Promise(r => setTimeout(r, 3000)); 
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: (actionName) => {
                    window.omexLib.openAllGroupsInNewTabs();
                    
                },
                args: ['OPEN-ALL-GROUPS-IN-NEW-TABS'],
                world: "MAIN"
            });
        });
    });


});




document.getElementById('createGroup').addEventListener('click', () => {


    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: [],
            world: "MAIN"
        }, async () => {

            // await new Promise(r => setTimeout(r, 3000)); 
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: (actionName) => {
                    window.omexLib.createGroupOfCurrentStrategy();
                },
                args: ['CREATE-GROUP'],
                world: "MAIN"
            });
        });
    });


});

