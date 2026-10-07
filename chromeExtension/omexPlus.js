import {  requestScreenshot, simpleNotifyError, tellPortfolioOptionsToFilter } from "./background.utils";


document.getElementById('mainButton').addEventListener('click', () => {


    chrome.runtime.sendMessage({
        type: 'START_AVERAGE_MONITORING'
    });
    chrome.runtime.sendMessage({
        type: 'START_TELLING_LOOP_PORTFOLIO_TO_FILTER'
    });

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

        // ISOLATED
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ["omexBridge.js"]
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






const openAllGroupsInNewTabs = () => {

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

}




let holdTimer = null;
let isHolding = false;

const HOLD_TIME = 3000;

document.getElementById('openAllGroupsInNewTabs').addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // فقط کلیک چپ

    isHolding = true;

    holdTimer = setTimeout(() => {
        if (isHolding) {
            openAllGroupsInNewTabs();
        }
    }, HOLD_TIME);
});

const cancelHold = () => {
    console.log('cancelHold');
    
    isHolding = false;
    clearTimeout(holdTimer);
    holdTimer = null;
};

document.getElementById('openAllGroupsInNewTabs').addEventListener('mouseleave', cancelHold);
document.addEventListener('mouseup', cancelHold);
window.addEventListener('blur', cancelHold);



document.getElementById('createGroup').addEventListener('click', async () => {

    


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

    const results = await Promise.allSettled([
        requestScreenshot(),
        tellPortfolioOptionsToFilter()
    ]);

    const [screenshotResult, portfolioResult] = results;

    if (screenshotResult.status === 'rejected') {
        console.error("❌ خطای Screenshot:", screenshotResult.reason);

        simpleNotifyError(
            screenshotResult.reason,
            'گرفتن Screenshot'
        );
    }

    if (portfolioResult.status === 'rejected') {
        console.error("❌ خطای اعلام پرتفوی:", portfolioResult.reason);

        simpleNotifyError(
            portfolioResult.reason,
            'اعلام پرتفوی به فیلتر'
        );
    }


});




document.getElementById('findDuplicationsInGroups').addEventListener('click', () => {


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
                    window.omexLib.OMEXApi.findDuplicationsInGroups();
                },
                args: ['CREATE-GROUP'],
                world: "MAIN"
            });
        });
    });


});


document.getElementById('createFilterWatcher').addEventListener('click', () => {


    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ["build/tseOptionStrategies.bundle.js"],
            // world: "MAIN"
        }, async () => {

            // await new Promise(r => setTimeout(r, 3000)); 
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: (actionName) => {
                    window.tseOptionStrategiesLib.RUN();
                },
                args: ['CREATE-FILTER-WATCHER'],
                // world: "MAIN"
            });
        });
    });


});
document.getElementById('portfolioWatcher').addEventListener('click', () => {


    chrome.tabs.create({
        url: chrome.runtime.getURL("portfolio-watcher.html")
    });


});




document.getElementById('calculateSumOfMoneyAndAssets').addEventListener('click', () => {


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
                    window.omexLib.checkSumOfMoneyAndAssets();
                },
                args: ['CALCULATE-SUM-OF-MONEY-AND-ASSETS'],
                world: "MAIN"
            });
        });
    });


});
document.getElementById('calcAvgPricesByExecutenList').addEventListener('click', () => {


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
                    window.omexLib.calcAvgPricesByExecutenList();
                },
                args: ['GET-AVG-PRICES'],
                world: "MAIN"
            });
        });
    });


});


document.getElementById('checkCalculatedAvgPriceMismatchForAll').addEventListener('click', () => {


    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: [],
            world: "MAIN"
        }, async () => {

            // await new Promise(r => setTimeout(r, 3000)); 
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: () => {
                    window.omexLib.checkCalculatedAvgPriceMismatchForAll();
                },
                args: [],
                world: "MAIN"
            });
        });
    });


});
document.getElementById('showVariableMargin').addEventListener('click', () => {


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
                    window.omexLib.showVariableMargin();
                },
                args: ['showVariableMargin'],
                world: "MAIN"
            });
        });
    });


});

const getStrategyInfo = async (tabId) => {
    const result = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
            return window.omexLib?.getStrategyInfoForExport() || null;
        },
        world: "MAIN"
    });

    return result[0]?.result;
};




const getAllGroupsStrategyInfo = async (tabId) => {
    const result = await chrome.scripting.executeScript({
        target: { tabId },
        func: async () => {
            return await window.omexLib?.getAllGroupStrategyListForExport() || null;
        },
        world: "MAIN"
    });

    return result[0]?.result;
};




document.getElementById('addToWatcher').addEventListener('click', async () => {
    try {
        // ۱. تب فعال رو بگیر
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        const strategyInfo = await getStrategyInfo(tab.id);

        if (!strategyInfo) return


        chrome.runtime.sendMessage({
            type: "addToWatcher",
            payload: {
                strategyInfo,
                tabId: tab.id,
                url: tab.url,
                title: tab.title
            }
        }, (response) => {


            if (chrome.runtime.lastError) {
                console.error(
                    "❌ runtime.lastError:",
                    chrome.runtime.lastError.message
                );

                simpleNotifyError(
                    chrome.runtime.lastError.message,
                    'addToWatcher response'
                );

                return;
            }

            if (response?.isAdded) {

                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => {
                        window.omexLib?.showToast('به رصدگر اضافه شد');
                    },
                    world: "MAIN"
                });

            } else {

                console.error("❌ Watcher response:", response);

                simpleNotifyError(
                    response?.error || 'Watcher پاسخ نامعتبر برگرداند',
                    'addToWatcher response'
                );
            }
        });

    } catch (error) {
        console.error("❌ خطا:", error);
        simpleNotifyError(
            error,
            'addToWatcher error'
        );
    }
});




document.getElementById('addAllGroupStrategyToWatcher').addEventListener('click', async () => {
    try {
        // ۱. تب فعال رو بگیر
        
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        const allGroupsStrategyInfo = await getAllGroupsStrategyInfo(tab.id);
        
        if(!allGroupsStrategyInfo) return


        // ۳. مستقیم از popup به watcher بفرست
        chrome.runtime.sendMessage({
            type: "addAllToWatcher",
            payload: {
                allGroupsStrategyInfo,
                tabId: tab.id,
                url: tab.url,
                title: tab.title
            }
        }, () => {
            
        });

    } catch (error) {
        console.error("❌ خطا:", error);
        simpleNotifyError(
            error,
            `اضافه کردن همه گروه ها`
        );
    }
});



document.getElementById('strategyExerciseCostSummary').addEventListener('click', () => {


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
                    window.omexLib.openStrategyExerciseCostSummaryModal();
                },
                args: ['openStrategyExerciseCostSummaryModal'],
                world: "MAIN"
            });
        });
    });


});



document.getElementById('tellAllOptionPortfolioListToFilter').addEventListener('click', async () => {
    try {
        await tellPortfolioOptionsToFilter();

    } catch (error) {
        console.error("❌ خطا:", error);
        simpleNotifyError(
            error,
            `اعلام پرتفوی به فیلتر`
        );
    }
});