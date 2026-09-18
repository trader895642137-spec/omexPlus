/******/ // The require scope
/******/ var __webpack_require__ = {};
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   simpleNotifyError: () => (/* binding */ simpleNotifyError)
/* harmony export */ });

const simpleNotifyError = (error, context = '') => {
    console.error(`[POPUP ERROR] ${context}`, error);

    let message;

    if (error instanceof Error) {
        message = `${error.message}\n${error.stack || ''}`;
    } else if (typeof error === 'object' && error !== null) {
        try {
            message = JSON.stringify(error, null, 2);
        } catch {
            message = String(error);
        }
    } else {
        message = String(error);
    }

    chrome.notifications.create(`notification-${Date.now()}`, {
        type: 'basic',
        iconUrl: 'icon.png',
        title: '❌ خطا در popup',
        message: `${context ? context + ': ' : ''}${message}`.slice(0, 500),
    });
};
document.getElementById('mainButton').addEventListener('click', () => {


    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ["build/omex.bundle.js"],
            world: "MAIN"
        }, async () => {

            chrome.runtime.sendMessage({
                type: "CHECK_JOB",
                tabId: tabs[0].id
            });

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
        
        if(!strategyInfo) return


        // ۳. مستقیم از popup به watcher بفرست
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
                console.error("❌ خطا:", chrome.runtime.lastError);
            } else {
                console.log("✅ پیام ارسال شد:", response);
            }
        });
        
    } catch (error) {
        console.error("❌ خطا:", error);
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
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("❌ خطا:", chrome.runtime.lastError);
                simpleNotifyError(
                    chrome.runtime.lastError,
                    'addAllToWatcher response'
                );
            } else {
                console.log("✅ پیام ارسال شد:", response);
            }
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
