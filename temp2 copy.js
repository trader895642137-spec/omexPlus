const doubleCheckProfitByExactDecimalPricesOfPortFolio  =async ({strategyPositions,isForce})=>{
    if(!isForce  && lastCheckProfitByExactDecimalPricesOfPortFolio.time && (Date.now() - lastCheckProfitByExactDecimalPricesOfPortFolio.time)<60000 ) return lastCheckProfitByExactDecimalPricesOfPortFolio.isGood
    lastCheckProfitByExactDecimalPricesOfPortFolio.time = Date.now();
    

    const {totalOffsetGainOfChunkOfEstimation,
        profitLossByOffsetOrdersPercent,
        totalCostOfChunkOfEstimationQuantity} = await calcProfitLossByExactDecimalPricesOfPortFolio(strategyPositions)



        // TODO:use isReachedToExpectedOffsetProfit
    const isGood = profitLossByOffsetOrdersPercent > (expectedProfit?.currentPositions || 1);


    lastCheckProfitByExactDecimalPricesOfPortFolio.isGood =isGood;

    if(!isGood){
        const issueMessage= 'با قیمت دقیق به سود مورد نظر نمیرسد';

        showNotification({
                title: issueMessage,
                body: `${strategyPositions.map(_strategyPosition => _strategyPosition.instrumentName).join('-')}`,
                tag: `doubleCheckProfitByExactDecimalPricesOfPortFolio`
        });

        showToast(issueMessage);
    }

    

    checkStrategyInProfit(strategyPositions)

    return isGood

}