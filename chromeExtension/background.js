console.log('background')

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

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "FROM_FILTER_TAB") {
    
    for (const port of childPortsByTab.values()) {
      port.postMessage(msg.payload);
    }
  }
  if (msg.type === "CHECK_JOB") {
    const tabId = msg.tabId;

    chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: () => {
        window.omexLib.doJob();
      }
    });
    
  }

});

