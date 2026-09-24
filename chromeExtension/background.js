
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

async function waitForOmexLib(tabId, timeout = 10000) {

    const start = Date.now();

    while (Date.now() - start < timeout) {

        const result = await chrome.scripting.executeScript({
            target: { tabId },
            world: 'MAIN',
            func: () => {
                return !!window.omexLib
            }
        });

        if (result?.[0]?.result === true) {
            return true;
        }

        await new Promise(resolve => setTimeout(resolve, 200));
    }

    return false;
}

async function findOmexTab(timeout = 10000) {
    const start = Date.now();

    while (Date.now() - start < timeout) {

        const tabs = await chrome.tabs.query({
            url: '*://khobregan.tsetab.ir//*'
        });

        for (const tab of tabs) {
            if (!tab.id) continue;

            try {
                const result = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    world: 'MAIN',
                    func: () => {
                        return !!window?.omexLib;
                    }
                });

                if (result?.[0]?.result === true) {
                    return tab;
                }
            } catch (e) {
                // ignore
            }
        }

        await new Promise(resolve => setTimeout(resolve, 200));
    }

    return null;
}

async function checkOMEXCalculatedAvgPriceMismatchForAll() {
  const tab = await findOmexTab();

  if (!tab?.id) {
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

async function showOmexNotification({
  title,
  body,
  requireInteraction,
  tag
}) {
  const tab = await findOmexTab();

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

  if (alarm.name !== AVERAGE_ALARM) {
    return;
  }



  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();

  const start = 8 * 60;       // 08:00
  const end = 12 * 60 + 30;   // 12:30

  if (minutes < start || minutes > end) {
    await chrome.alarms.clear(AVERAGE_ALARM);
    return;
  }

  
  await checkOMEXCalculatedAvgPriceMismatchForAll();
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

    } catch (error) {

      await showOmexNotification({
        title: 'OMEX Background Error',
        body: error?.message || String(error),
        requireInteraction: true,
        tag: 'background-error'
      });

    }
  })();

  return true;
});

