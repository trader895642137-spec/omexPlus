const informForExpectedProfitOnStrategy = ({ _strategyPositions, profitPercentByBestPrices, profitPercentByInsertedPrices,settlementProfitByBestPrices,settlementProfitByInsertedPrices }) => {

    let statusCnt = getStrategyExpectedProfitCnt();

    let daysLeftToSettlement = _strategyPositions.find(_strategyPosition =>{
        _strategyPosition.daysLeftToSettlement = _strategyPosition.getDaysLeftToSettlement()
        return _strategyPosition.daysLeftToSettlement
    })?.daysLeftToSettlement || defaultDaysLeftToSettlement;
    daysLeftToSettlement = daysLeftToSettlement>=1 ? daysLeftToSettlement : 1;

    

    statusCnt.innerHTML = `
        <div style="display:flex;flex-direction: column;row-gap: 13px;">
            <div style="display:flex;background: #f6faf3;border:1px solid ; padding: 3px;color:${profitPercentByBestPrices.defaultQueue >= 0 ? 'green' : 'red'}">
                <div>
                    <div>
                            سرخط ${profitPercentByBestPrices.defaultQueue.toLocaleString('en-US', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1
                        })}
                    </div>
                    ${daysLeftToSettlement< 7 ?`<div style="font-size: 11px;color:${profitPercentByBestPrices.buyQueue >= 0 ? 'green' : 'red'}">
                            ص خرید ${profitPercentByBestPrices.buyQueue.toLocaleString('en-US', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1
                        })}
                    </div>`:''}
                </div>
                ${settlementProfitByBestPrices ? `<div style="margin-right:auto;font-size: small; color:${settlementProfitByBestPrices >= 0 ? 'green' : '#db4848'}">
                        اعمال ${settlementProfitByBestPrices.toLocaleString('en-US', {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1
                    })}
                </div>`:''}
             </div>
            <div style="display:flex; font-size: 85%;color:${profitPercentByInsertedPrices.defaultQueue >= 0 ? 'green' : 'red'}">

                <div>
                    <div>
                            اینپوت ${profitPercentByInsertedPrices.defaultQueue.toLocaleString('en-US', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1
                        })}
                    </div>
                    ${daysLeftToSettlement< 7 ?`<div style="font-size: 11px;color:${profitPercentByInsertedPrices.buyQueue >= 0 ? 'green' : 'red'}">
                            ص خرید ${profitPercentByInsertedPrices.buyQueue.toLocaleString('en-US', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1
                        })}
                    </div>`:''}
                </div>
                ${settlementProfitByInsertedPrices ? `<div style="margin-right:auto;font-size: small;color:${settlementProfitByInsertedPrices >= 0 ? 'green' : '#db4848'}">
                        اعمال ${settlementProfitByInsertedPrices.toLocaleString('en-US', {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1
                    })}
                </div>`:''}
             </div>
        </div>
    `;



    
    
    const percentPerDay = Math.pow((1 + (profitPercentByBestPrices.defaultQueue / 100)), 1 / daysLeftToSettlement);
    const percentPerMonth = Math.pow(percentPerDay, 30);


    let isProfit=false;
    if (isProfitEnough({ totalProfitPercent: profitPercentByBestPrices.defaultQueue, percentPerMonth })) {

        isProfit =true;
        informExtremeOrderPrice(_strategyPositions, 'openMore');
        showNotification({
            title: `سود %${profitPercentByBestPrices.defaultQueue.toFixed()}`,
            body: `${_strategyPositions.map(_strategyPosition => _strategyPosition.instrumentName).join('-')}`,
            tag: `${_strategyPositions[0].instrumentName}-expectedProfitPrecent`
        });
    } else {
        isProfit =false;
        uninformExtremeOrderPrice(_strategyPositions);
    }

    return isProfit;
}