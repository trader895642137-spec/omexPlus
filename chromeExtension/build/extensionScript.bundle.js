/******/ var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getOmexTab: () => (/* binding */ getOmexTab),
/* harmony export */   getPortfolioOptionList: () => (/* binding */ getPortfolioOptionList),
/* harmony export */   sendMessageToFilter: () => (/* binding */ sendMessageToFilter),
/* harmony export */   simpleNotifyError: () => (/* binding */ simpleNotifyError),
/* harmony export */   takeScreenshot: () => (/* binding */ takeScreenshot),
/* harmony export */   tellPortfolioOptionsToFilter: () => (/* binding */ tellPortfolioOptionsToFilter)
/* harmony export */ });
const getPortfolioOptionList = async (tabId) => {
  const result = await chrome.scripting.executeScript({
    target: { tabId },
    func: async () => {
      return await window.omexLib?.OMEXApi?.getOptionPortfolioList() || null;
    },
    world: "MAIN"
  });

  return result[0]?.result;
};



const sendMessageToFilter = async (msg) => {
  const tabs = await chrome.tabs.query({
    url: "https://old.tsetmc.com/*"
  });

  await Promise.all(
    tabs
      .filter(tab => tab.id)
      .map(tab =>
        chrome.tabs.sendMessage(tab.id, msg).catch(error => {
          console.error(`خطا در ارسال به تب ${tab.id}:`, error);

          simpleNotifyError(
            error,
            `ارسال پیام به فیلتر (${tab.id})`
          );
        })
      )
  );
};



let omexTabId = null;

const getOmexTab = async () => {

  if (omexTabId) {
    try {
      const tab = await chrome.tabs.get(omexTabId);

      if (tab?.id) {
        const result = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          world: 'MAIN',
          func: () => !!window.omexLib
        });

        if (result?.[0]?.result) {
          return tab;
        } else {
          omexTabId = null;
        }
      }
    } catch (e) {
      omexTabId = null;
    }
  }

  // اگر cache معتبر نبود، دوباره پیدا کن
  const tabs = await chrome.tabs.query({
    url: '*://khobregan.tsetab.ir//*'
  });

  for (const tab of tabs) {
    if (!tab.id) continue;

    try {
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN',
        func: () => !!window.omexLib
      });

      if (result?.[0]?.result === true) {
        omexTabId = tab.id;
        return tab;
      }

    } catch (e) {
      // ignore
    }
  }

  return null;
};


const simpleNotifyError = (error, context = '') => {
  console.error(`[Extension Error] ${context}`, error);

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
    title: '❌ Extension Error',
    message: `${context ? context + ': ' : ''}${message}`.slice(0, 500),
  });
};



async function tellPortfolioOptionsToFilter() {
  const tab = await getOmexTab();

  if (!tab?.id) {
    throw new Error("تب OMEX پیدا نشد");
  }

  const portfolioOptionList = await getPortfolioOptionList(tab.id);

  if (!portfolioOptionList) return;

  await sendMessageToFilter({
    type: "portfolioOptionList",
    payload: {
      portfolioOptionList,
      tabId: tab.id,
      url: tab.url,
      title: tab.title
    }
  });
}


async function takeScreenshot() {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'png'
    });

    // تبدیل dataURL به Blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Clipboard
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ]);

      console.log('Screenshot copied to clipboard');
    } catch (error) {
      console.error('Clipboard error:', error);
    }

    // دانلود
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `screenshot-${Date.now()}.png`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Screenshot error:', error);
  }
}

/***/ })
/******/ ]);
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
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
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _background_utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);



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
        (0,_background_utils__WEBPACK_IMPORTED_MODULE_0__.takeScreenshot)(),
        (0,_background_utils__WEBPACK_IMPORTED_MODULE_0__.tellPortfolioOptionsToFilter)()
    ]);

    const [screenshotResult, portfolioResult] = results;

    if (screenshotResult.status === 'rejected') {
        console.error("❌ خطای Screenshot:", screenshotResult.reason);

        (0,_background_utils__WEBPACK_IMPORTED_MODULE_0__.simpleNotifyError)(
            screenshotResult.reason,
            'گرفتن Screenshot'
        );
    }

    if (portfolioResult.status === 'rejected') {
        console.error("❌ خطای اعلام پرتفوی:", portfolioResult.reason);

        (0,_background_utils__WEBPACK_IMPORTED_MODULE_0__.simpleNotifyError)(
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

                (0,_background_utils__WEBPACK_IMPORTED_MODULE_0__.simpleNotifyError)(
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

                (0,_background_utils__WEBPACK_IMPORTED_MODULE_0__.simpleNotifyError)(
                    response?.error || 'Watcher پاسخ نامعتبر برگرداند',
                    'addToWatcher response'
                );
            }
        });

    } catch (error) {
        console.error("❌ خطا:", error);
        (0,_background_utils__WEBPACK_IMPORTED_MODULE_0__.simpleNotifyError)(
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
        (0,_background_utils__WEBPACK_IMPORTED_MODULE_0__.simpleNotifyError)(
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
        await (0,_background_utils__WEBPACK_IMPORTED_MODULE_0__.tellPortfolioOptionsToFilter)();

    } catch (error) {
        console.error("❌ خطا:", error);
        (0,_background_utils__WEBPACK_IMPORTED_MODULE_0__.simpleNotifyError)(
            error,
            `اعلام پرتفوی به فیلتر`
        );
    }
});
})();

