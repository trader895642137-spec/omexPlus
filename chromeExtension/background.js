console.log('background')

const childPortsByTab = new Map();

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "CHILD_PAGE") {
    const tabId = port.sender.tab.id;

    childPortsByTab.set(tabId, port);

    port.onDisconnect.addListener(() => {
      childPortsByTab.delete(tabId);
    });
  }
});

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "FROM_FILTER_TAB") {
    
    for (const port of childPortsByTab.values()) {
      port.postMessage(msg.payload);
    }
  }
});

