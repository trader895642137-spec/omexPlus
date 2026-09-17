document.getElementById('addToWatcher').addEventListener('click', async () => {
    try {
        // ۱. تب فعال رو بگیر
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // ۲. از تب فعلی داده‌ها رو بگیر (اگه نیاز داری)
        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {

                const strategyInfo = window.omexLib?.getStrategyInfoForExport() || null;
                if(!strategyInfo) return

                const positions = strategyInfo.strategyPositionsForExport;
                if(!positions) return


                const prepareForSerialization = (obj) => {

                    const result = { ...obj };

                    for (const [key, value] of Object.entries(result)) {
                        if (typeof value === 'function') {
                            const returnValue = value();
                            // ذخیره تابع به صورت string
                            result[key] = {
                                __isFunction: true,
                                __returnValue: returnValue,
                                __functionString: `function() { return ${JSON.stringify(returnValue)}; }`
                            };
                        }
                    }


                    return result

                }
                
                const positionsPrepareForSerialization = positions.map(position => {
                    return prepareForSerialization(position)
                });

                return {

                    ...strategyInfo,
                    positionsPrepareForSerialization

                }
               
                
            },
            world: "MAIN"
        });
        
        let strategyInfo = result[0]?.result;
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