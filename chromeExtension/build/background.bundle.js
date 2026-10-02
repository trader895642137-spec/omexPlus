/******/ var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getOmexTab: () => (/* binding */ getOmexTab),
/* harmony export */   getPortfolioOptionList: () => (/* binding */ getPortfolioOptionList),
/* harmony export */   sendMessageToFilter: () => (/* binding */ sendMessageToFilter),
/* harmony export */   simpleNotifyError: () => (/* binding */ simpleNotifyError)
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



const childPortsByTab = new Map();

// نگهداری پورت‌های باز
let senderPort = null;
let receiverPorts = new Set();

// وقتی یک تب می‌خواد وصل بشه
chrome.runtime.onConnect.addListener((port) => {
  console.log("پورت جدید باز شد:", port.name);
  
  if (port.name === "sender") {
    // پورت فرستنده
    senderPort = port;
    
    port.onMessage.addListener((data) => {
      console.log("داده از فرستنده:", data);
      
      // ارسال به همه گیرنده‌ها
      receiverPorts.forEach(receiverPort => {
        try {
          receiverPort.postMessage(data);
        } catch (e) {
          console.log("گیرنده قطع شده");
          receiverPorts.delete(receiverPort);
        }
      });
    });
    
    port.onDisconnect.addListener(() => {
      console.log("فرستنده قطع شد");
      senderPort = null;
    });
  }
  
  if (port.name === "receiver") {
    // پورت گیرنده
    receiverPorts.add(port);
    
    port.onDisconnect.addListener(() => {
      console.log("گیرنده قطع شد");
      receiverPorts.delete(port);
    });
  }
});


const AVERAGE_ALARM = 'average-monitoring';

async function startAverageMonitoring() {

    const existingAlarm = await chrome.alarms.get(AVERAGE_ALARM);

    // اگر قبلاً از یکی از تب‌ها شروع شده، دوباره ایجاد نکن
    if (existingAlarm) {
        return;
    }

    chrome.alarms.create(AVERAGE_ALARM, {
        periodInMinutes: 30
    });
    await checkOMEXCalculatedAvgPriceMismatchForAll();
}





async function checkOMEXCalculatedAvgPriceMismatchForAll() {
  const tab = await (0,_background_utils__WEBPACK_IMPORTED_MODULE_0__.getOmexTab)();

  if (!tab?.id) {
    (0,_background_utils__WEBPACK_IMPORTED_MODULE_0__.simpleNotifyError)(
      new Error("تب OMEX پیدا نشد"),
      "بررسی مغایرت قیمت میانگین"
    );
    return;
  }


  const result = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: 'MAIN',
    func: async() => {
      return await window.omexLib?.checkCalculatedAvgPriceMismatchForAll();
    }
  });


  return result
}


const TELLING_PORTFOLIO_ALARM = 'telling-portfolio-alarm';

async function startTellingLoopPortfolioToFilter() {

    const tellingPortfolioAlarm = await chrome.alarms.get(TELLING_PORTFOLIO_ALARM);

    if (tellingPortfolioAlarm) {
        return;
    }

    chrome.alarms.create(TELLING_PORTFOLIO_ALARM, {
        periodInMinutes: 5
    });
    await tellPortfolioOptionsToFilter();
}

async function tellPortfolioOptionsToFilter() {

  try {
    const tab = await (0,_background_utils__WEBPACK_IMPORTED_MODULE_0__.getOmexTab)();

    if (!tab?.id) {
      (0,_background_utils__WEBPACK_IMPORTED_MODULE_0__.simpleNotifyError)(
        new Error("تب OMEX پیدا نشد"),
        "اعلام پرتفوی به فیلتر"
      );
      return;
    }

    const portfolioOptionList = await (0,_background_utils__WEBPACK_IMPORTED_MODULE_0__.getPortfolioOptionList)(tab.id);

    if (!portfolioOptionList) return


    await (0,_background_utils__WEBPACK_IMPORTED_MODULE_0__.sendMessageToFilter)({
      type: "portfolioOptionList",
      payload: {
        portfolioOptionList,
        tabId: tab.id,
        url: tab.url,
        title: tab.title
      }
    });


  } catch (error) {
    console.error("❌ خطا:", error);
    (0,_background_utils__WEBPACK_IMPORTED_MODULE_0__.simpleNotifyError)(
      error,
      `اعلام پرتفوی به فیلتر`
    );
  }
}


async function showOmexNotification({
  title,
  body,
  requireInteraction,
  tag
}) {
  const tab = await (0,_background_utils__WEBPACK_IMPORTED_MODULE_0__.getOmexTab)();

  if (!tab?.id) {
    return;
  }

  return await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: 'MAIN',
    func: async (notification) => {
      return await window.omexLib?.showNotification(notification);
    },
    args: [{
      title,
      body,
      requireInteraction,
      tag
    }]
  });
}




chrome.alarms.onAlarm.addListener(async alarm => {

  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();

  const isBetween8To1230 =
    minutes >= 8 * 60 &&
    minutes < 12 * 60 + 30;

  try {

    if (alarm.name === AVERAGE_ALARM) {

      if (!isBetween8To1230) {
        await chrome.alarms.clear(AVERAGE_ALARM);
        return;
      }

      await checkOMEXCalculatedAvgPriceMismatchForAll();
      return;
    }

    if (alarm.name === TELLING_PORTFOLIO_ALARM) {

      if (!isBetween8To1230) {
        await chrome.alarms.clear(TELLING_PORTFOLIO_ALARM);
        return;
      }

      await tellPortfolioOptionsToFilter();
      return;
    }

  } catch (error) {
    console.error("Alarm error:", error);
    (0,_background_utils__WEBPACK_IMPORTED_MODULE_0__.simpleNotifyError)(
      error,
      `خطا در Alarm: ${alarm.name}`
    );
  }
});

chrome.runtime.onMessage.addListener((msg, sender) => {
  (async () => {
    try {

      if (msg.type === "FROM_FILTER_TAB") {
        for (const port of childPortsByTab.values()) {
          port.postMessage(msg.payload);
        }
      }


      if (msg.type === 'START_AVERAGE_MONITORING') {
        await startAverageMonitoring();
      }
      if (msg.type === 'START_TELLING_LOOP_PORTFOLIO_TO_FILTER') {
        await startTellingLoopPortfolioToFilter();
      }

      if (msg.type === "portfolioOptionList") {

        await (0,_background_utils__WEBPACK_IMPORTED_MODULE_0__.sendMessageToFilter)(msg);
      }

      if (msg.type === "addToWatcher") {
        const {tabId} = msg.payload;
        const response = await chrome.tabs.sendMessage(
            tabId,
            msg
        );
        sendResponse(response);


      } 

    } catch (error) {

      await showOmexNotification({
        title: 'OMEX Background Error',
        body: error?.message || String(error),
        requireInteraction: true,
        tag: 'background-error'
      });

    }
  })();

});


})();

