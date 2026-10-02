import { getOmexTab, getPortfolioOptionList, sendMessageToFilter, simpleNotifyError } from "./background.utils";


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
  const tab = await getOmexTab();

  if (!tab?.id) {
    simpleNotifyError(
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
    const tab = await getOmexTab();

    if (!tab?.id) {
      simpleNotifyError(
        new Error("تب OMEX پیدا نشد"),
        "اعلام پرتفوی به فیلتر"
      );
      return;
    }

    const portfolioOptionList = await getPortfolioOptionList(tab.id);

    if (!portfolioOptionList) return


    await sendMessageToFilter({
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
    simpleNotifyError(
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
  const tab = await getOmexTab();

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
    simpleNotifyError(
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

        await sendMessageToFilter(msg);
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

