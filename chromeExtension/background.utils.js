export const getPortfolioOptionList = async (tabId) => {
  const result = await chrome.scripting.executeScript({
    target: { tabId },
    func: async () => {
      return await window.omexLib?.OMEXApi?.getOptionPortfolioList() || null;
    },
    world: "MAIN"
  });

  return result[0]?.result;
};



export const sendMessageToFilter = async (msg) => {
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

export const getOmexTab = async () => {

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


export const simpleNotifyError = (error, context = '') => {
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



export async function tellPortfolioOptionsToFilter() {
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


export async function takeScreenshot() {
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