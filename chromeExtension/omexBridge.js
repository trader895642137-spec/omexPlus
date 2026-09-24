if (!window.__omexBridgeInstalled) {
    window.__omexBridgeInstalled = true;

    window.addEventListener('message', event => {
        if (event.source !== window) {
            return;
        }

        if (event.data?.source !== 'OMEX_PAGE_TO_EXTENSION') {
            return;
        }

        chrome.runtime.sendMessage(event.data);
    });
}