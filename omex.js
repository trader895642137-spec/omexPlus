
import { COMMISSION_FACTOR,isTaxFree,getCommissionFactor,mainTotalOffsetGainCalculator,getNearSettlementPrice,totalCostCalculator ,
    profitPercentCalculator,totalCostCalculatorForPriceTypes,
    settlementProfitCalculator,
    getReservedMarginOfEstimationQuantity,
    showNotification,
    createDeferredPromise,
    waitForElement,
    takeScreenshot,
    isETF,
    hasBreakevenExecutedPriceDiffIssue,
    hasGreaterRatio,
    QueueScenario,
    startMarketCountdown,
    calculateExerciseCost,
    hasSignificantPriceMismatch} from './common.js';
import { isInstrumentNameOfOption,  OMEXApi } from './omexApi.js';


export   {OMEXApi} from './omexApi.js'

export { configs } from './common.js';

import './desktopNotificationCheck.js'
import { createIntervalLogger } from './createIntervalLogger.js';
import { showStrategyExerciseCostSummary } from './strategyExerciseCostSummary.js';

export {silentNotificationForMoment} from './common.js'; 



export let groupLogger,portfolioLogger;


const defaultCSize = 1000;
const defaultDaysLeftToSettlement = 30;

const initLoggers = () => {

    try {

        groupLogger = createIntervalLogger({
            key: "strategyGroups",
            interval: 30 * 60 * 1000,
            sync: OMEXApi.getGroups
        });
        portfolioLogger = createIntervalLogger({
            key: "optionPortfolio",
            interval: 30 * 60 * 1000,
            sync: OMEXApi.getOptionPortfolioList
        });

        
    } catch (error) { }

}


export const doJob=()=>{
    console.log('DON')

}

// FIXME:expectedProfitPerMonth is factor but minExpectedProfitOfStrategy is percent
export let expectedProfit = {
    expectedProfitPerMonth: 1.04,
    minExpectedProfitOfStrategy: 0.4,
    defaultCurrentPositions: 0.9,
    // strategy:3
}




const createStatusCnt = () => {
    let statusCnt = domContextWindow.document.createElement('div');
    statusCnt.classList.add('status-cnt');
    statusCnt.style.cssText += `
        padding: 0 10px;
        width: 100%;
        background: #FFF;
        display: flex;
        column-gap: 21px;
        font-size: 20px;
    `;

    statusCnt.addEventListener('click', function(event) {
        doubleCheckProfitByExactDecimalPricesOfPortFolio({strategyPositions,isForce:true})
    });
    domContextWindow.document.querySelector('client-option-layout-action-bar').append(statusCnt)
    return statusCnt
}

const getStatusCnt = () => {

    let statusCnt = domContextWindow.document.querySelector('client-option-layout-action-bar .status-cnt') || createStatusCnt()

    return statusCnt

}

const createDeleteAllOrdersButton = () => {
    let removeAllOrderButton = domContextWindow.document.createElement('button');
    removeAllOrderButton.classList.add('remove-all-order-button');
    removeAllOrderButton.textContent = 'حذف همه سفارشات';
    removeAllOrderButton.style.cssText += `
        margin-right: auto;
        `;
    removeAllOrderButton.addEventListener('click', async function(event) {
        OMEXApi.deleteAllOpenOrders();
        await new Promise(resolve => setTimeout(resolve, 500));
        OMEXApi.deleteAllOpenOrders();
    });
    
    domContextWindow.document.querySelector('client-option-reports-actions').append(removeAllOrderButton)
    return removeAllOrderButton
}

const stopPropagationForDraggingModal = (e)=>{
        e.stopPropagation();
}

const stopDraggingWrongOfOrdersModals =()=>{

    strategyPositions.forEach(strategyPosition => {
        strategyPosition.ordersModal.querySelector('client-instrument-favorites-item-main')?.removeEventListener("mousedown", stopPropagationForDraggingModal);
        strategyPosition.ordersModal.querySelector('client-instrument-favorites-item-main')?.addEventListener("mousedown", stopPropagationForDraggingModal);
    });

}

const createStrategyExpectedProfitCnt = () => {
    let parent = domContextWindow.document.createElement('div');
    let cnt = domContextWindow.document.createElement('div');
    cnt.classList.add('status-cnt');
    parent.style.cssText += `
            position:absolute;
            width: 205px;
            padding: 0 10px;
            background: #FFF;
            display: flex;
            flex-direction: column;
            column-gap: 21px;
            font-size: 20px;
            left: 50%;
            z-index: 500;
            top: -8px;
            transform: translateX(-50%);
        `;
    let currentStockPriceInput = domContextWindow.document.createElement('input');
    currentStockPriceInput.classList.add('current-stock-price');
    currentStockPriceInput.setAttribute('placeholder','قیمت سهم');
    currentStockPriceInput.style.cssText += `border: 1px solid #EEE;min-width: 0;flex-basis: 150%;`;

    let nokoolOrNoRequestFactorInput = domContextWindow.document.createElement('input');
    nokoolOrNoRequestFactorInput.classList.add('nokool-or-no-request-factor');
    nokoolOrNoRequestFactorInput.setAttribute('placeholder','عدم‌اعمال');
    nokoolOrNoRequestFactorInput.style.cssText += `border: 1px solid #EEE;min-width: 0;`;
    nokoolOrNoRequestFactorInput.value = 0;


    let inputsCnt = domContextWindow.document.createElement('div');
    inputsCnt.style.cssText += `
            width: 100%;
            display: flex;
        `;


    inputsCnt.append(currentStockPriceInput);
    inputsCnt.append(nokoolOrNoRequestFactorInput);
    parent.append(inputsCnt);
    parent.append(cnt);

    domContextWindow.document.querySelector('client-option-strategy-estimation-main .o-footer').style.cssText += `
            position: relative;
        `;
    domContextWindow.document.querySelector('client-option-strategy-estimation-main .o-footer').append(parent)
    return cnt
}

const getStrategyExpectedProfitCnt = () => {

    let cnt = domContextWindow.document.querySelector('client-option-strategy-estimation-main .o-footer .status-cnt') || createStrategyExpectedProfitCnt()
    return cnt

}





const settlementCommissionFactor = (_strategyPosition) => {

    const commissionFactorObj = _strategyPosition.isOption ? COMMISSION_FACTOR.OPTION.SETTLEMENT : COMMISSION_FACTOR.STOCK;

    let commissionFactor;

    const sellCommissionFactor = isTaxFree(_strategyPosition) ? commissionFactorObj.TAX_FREE_SELL : commissionFactorObj.SELL;

    if (_strategyPosition.isCall) {
        commissionFactor = _strategyPosition.isBuy ? commissionFactorObj.BUY : sellCommissionFactor;
    } else if (_strategyPosition.isPut) {
        commissionFactor = _strategyPosition.isBuy ? sellCommissionFactor : commissionFactorObj.BUY;
    } else {
        // is stock
        commissionFactor = _strategyPosition.isBuy ? sellCommissionFactor : commissionFactorObj.BUY;
    }

    return commissionFactor
}





const totalOffsetGainNearSettlementOfEstimationPanel = ({ strategyPositions , stockPrice=getBaseInstrumentPriceOfOption() }) => {

    const getBestPriceCbNormalQueue = (_strategyPosition) => getNearSettlementPrice({strategyPositions,strategyPosition: _strategyPosition, stockPrice ,scenario : QueueScenario.normal});
    const getBestPriceCbBuyQueue = (_strategyPosition) => getNearSettlementPrice({strategyPositions,strategyPosition: _strategyPosition, stockPrice ,scenario : QueueScenario.buyQueue});

    
    return {

        defaultQueue: mainTotalOffsetGainCalculator({
            strategyPositions,
            getBestPriceCb: getBestPriceCbNormalQueue,
            getReservedMargin: _strategyPosition => {
                return getReservedMarginOfEstimationQuantity(_strategyPosition)
            }
        }),
        buyQueue: mainTotalOffsetGainCalculator({
            strategyPositions,
            getBestPriceCb: getBestPriceCbBuyQueue,
            getReservedMargin: _strategyPosition => {
                return getReservedMarginOfEstimationQuantity(_strategyPosition)
            }
        }),
       

    }

}

const sumOfQuantityOfSamePosition = (position,strategyPositions)=>{

    return strategyPositions.filter(_position => _position.instrumentName === position.instrumentName).reduce((_sumOfQuantityInEstimationPanel, position) => _sumOfQuantityInEstimationPanel + position.getQuantity(), 0);

}

const totalOffsetGainOfCurrentPositionsCalculator = ({ strategyPositions,stockPrice=getBaseInstrumentPriceOfOption() }) => {



    const getReservedMargin = (position, __strategyPositions) => {

        return getQuantityOfCurrentPosition(position, __strategyPositions) * position.getRequiredMargin()

    }

    const getQuantityOfCurrentPosition = (position, __strategyPositions) => {

        const sumOfQuantityInEstimationPanel = sumOfQuantityOfSamePosition(position,__strategyPositions);


        const quantityInEstimationPanel = position.getQuantity();

        const quantityFactor = quantityInEstimationPanel / sumOfQuantityInEstimationPanel;


        return position.getCurrentPositionQuantity() * quantityFactor
    }

    const totalOffsetGainByOffsetOrderPrices = mainTotalOffsetGainCalculator({
        strategyPositions,
        getBestPriceCb: (_strategyPosition) => _strategyPosition.getBestOffsetPrice(),
        getQuantity: getQuantityOfCurrentPosition,
        getReservedMargin
    });

    const totalOffsetGainByOpenMoreOrderPrices = mainTotalOffsetGainCalculator({
        strategyPositions,
        getBestPriceCb: (_strategyPosition) => _strategyPosition.getBestOpenMorePrice(),
        getQuantity: getQuantityOfCurrentPosition,
        getReservedMargin
    });

    const totalOffsetGainByInsertedPrices = mainTotalOffsetGainCalculator({
        strategyPositions,
        getBestPriceCb: (_strategyPosition) => _strategyPosition.getInsertedPrice(),
        getQuantity: getQuantityOfCurrentPosition,
        getReservedMargin
    });

    const totalOffsetGainNearSettlement =totalOffsetGainNearSettlementOfEstimationPanel({
            strategyPositions,
            stockPrice
    });

    return {
        byOffsetOrderPrices: totalOffsetGainByOffsetOrderPrices,
        byOpenMoreOrderPrices: totalOffsetGainByOpenMoreOrderPrices,
        byInsertedPrices: totalOffsetGainByInsertedPrices,
        byNearSettlementPrices: totalOffsetGainNearSettlement,
    }
}




const totalOffsetGainOfChunkOfEstimationQuantityCalculator = ({ strategyPositions }) => {



    const getReservedMargin = (position, __strategyPositions) => {
        return getReservedMarginOfEstimationQuantity(position)
    }


    const totalOffsetGainByOffsetOrderPrices = mainTotalOffsetGainCalculator({
        strategyPositions,
        getBestPriceCb: (_strategyPosition) => _strategyPosition.getBestOffsetPrice(),
        getReservedMargin
    });

    const totalOffsetGainByOpenMoreOrderPrices = mainTotalOffsetGainCalculator({
        strategyPositions,
        getBestPriceCb: (_strategyPosition) => _strategyPosition.getBestOpenMorePrice(),
        getReservedMargin
    });

    const totalOffsetGainByInsertedPrices = mainTotalOffsetGainCalculator({
        strategyPositions,
        getBestPriceCb: (_strategyPosition) => _strategyPosition.getInsertedPrice(),
        getReservedMargin
    });

    return {
        byOffsetOrderPrices: totalOffsetGainByOffsetOrderPrices,
        byOpenMoreOrderPrices: totalOffsetGainByOpenMoreOrderPrices,
        byInsertedPrices: totalOffsetGainByInsertedPrices,
    }
}







const MARGIN_CALC_TYPE = {
    BY_CURRENT_POSITION: "BY_CURRENT_POSITION",
    BY_GIVEN_PRICE: "BY_GIVEN_PRICE"
}

const lastCheckProfitByExactDecimalPricesOfPortFolio={
};


const calcProfitLossByExactDecimalPricesOfPortFolio = async (_strategyPositions)=>{

    const portfolioList = await OMEXApi.getOptionPortfolioList();
    const stockPortfolioList  = await OMEXApi.getStockPortfolioList();
    lastCheckProfitByExactDecimalPricesOfPortFolio.portfolioList = portfolioList;
    lastCheckProfitByExactDecimalPricesOfPortFolio.stockPortfolioList = stockPortfolioList;

    showToast('پرتفوی دریافت شد');


    const currentPortfolioPositions = _strategyPositions.map(({instrumentId,instrumentName})=>{
        const positionInPortfolio = findPositionInfoByGivenPortfolio({instrumentId,instrumentName}, [...lastCheckProfitByExactDecimalPricesOfPortFolio.portfolioList, ...lastCheckProfitByExactDecimalPricesOfPortFolio.stockPortfolioList]);
        return {
            ...positionInPortfolio,
            instrumentName
        }
    }).map(({instrumentName,executedPrice,breakEvenPrice})=>({instrumentName,executedPrice,breakEvenPrice})) ;

    lastCheckProfitByExactDecimalPricesOfPortFolio.currentPortfolioPositions = currentPortfolioPositions;
    console.log(currentPortfolioPositions);
    

    const totalCostOfChunkOfEstimationQuantity = totalCostCalculatorForPriceTypes(_strategyPositions).totalCostOfChunkOfEstimationQuantity;

    const totalOffsetGainOfChunkOfEstimation = totalOffsetGainOfChunkOfEstimationQuantityCalculator({
        strategyPositions: _strategyPositions
    });
    let profitLossByOffsetOrdersPercent = profitPercentCalculator({
        costWithSign: totalCostOfChunkOfEstimationQuantity,
        gainWithSign: totalOffsetGainOfChunkOfEstimation.byOffsetOrderPrices
    });

    return {
        totalOffsetGainOfChunkOfEstimation,
        profitLossByOffsetOrdersPercent,
        totalCostOfChunkOfEstimationQuantity
    }

}


let lastCheckSumOfMoneyAndAssetsTime;
export const checkSumOfMoneyAndAssets = async (isForce)=>{
    // const localstorageKey = 'SumOfMoneyAndAssets';
    // if(!isForce  && lastCheckSumOfMoneyAndAssetsTime && (Date.now() - lastCheckSumOfMoneyAndAssetsTime)<60000 ) return 
    // lastCheckSumOfMoneyAndAssetsTime = Date.now();


    // const prevSumOfMoneyAndAssets = localStorage.getItem(localstorageKey);


    const {sumOfMoneyAndAssets,blockedAmount,calculatedBlockedAmount}= await OMEXApi.calculateSumOfMoneyAndAssets();



    if(hasGreaterRatio({num1:blockedAmount,num2:calculatedBlockedAmount,properRatio:1.05})){
        showToast('مارجین محاسباتی با مارجین سرور تفاوت دارد',7000,'error');
    }else{

        showToast(sumOfMoneyAndAssets.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }),5000);
    }


    console.log('مارجین',  blockedAmount.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }));
    console.log('مارجین محاسباتی',  calculatedBlockedAmount.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }));
    console.log('کل',  sumOfMoneyAndAssets.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }));

    

    // if(!prevSumOfMoneyAndAssets) return 
    // const diff = sumOfMoneyAndAssets - prevSumOfMoneyAndAssets;

    // if(diff < 0 && diff < -80000000){

    // }else{
    //     localStorage.setItem(localstorageKey, sumOfMoneyAndAssets);
    // }


}


const doubleCheckProfitByExactDecimalPricesOfPortFolio  =async ({strategyPositions,isForce,profitPercentOfCurrentPositionsByNearSettlementPrices})=>{
    if(!isForce  && lastCheckProfitByExactDecimalPricesOfPortFolio.time && (Date.now() - lastCheckProfitByExactDecimalPricesOfPortFolio.time)<60000 ) return lastCheckProfitByExactDecimalPricesOfPortFolio.isGood
    lastCheckProfitByExactDecimalPricesOfPortFolio.time = Date.now();
    

    const { totalOffsetGainOfChunkOfEstimation,
        profitLossByOffsetOrdersPercent,
        totalCostOfChunkOfEstimationQuantity } = await calcProfitLossByExactDecimalPricesOfPortFolio(strategyPositions)



    if (profitPercentOfCurrentPositionsByNearSettlementPrices == null) {
        profitPercentOfCurrentPositionsByNearSettlementPrices = calcOffsetProfitOfStrategy({ strategyPositions })?.profitPercentOfCurrentPositionsByNearSettlementPrices;
    }

    const isGood = isReachedToExpectedOffsetProfit({ profitLossByOffsetOrdersPercent, profitPercentOfCurrentPositionsByNearSettlementPrices, expectedProfit })


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

const showCurrentStrategyPositionState = ({totalCurrentPositionCost,totalOffsetGainOfCurrentPositionObj,
    profitLossByOffsetOrdersPercent,profitLossByInsertedPricesPercent,unreliableTotalCostOfCurrentPositions,profitPercentOfCurrentPositionsByNearSettlementPrices})=>{


        
    let statusCnt = getStatusCnt();

    statusCnt.innerHTML = `
            
            <span style="
                display: inline-block;
                direction: ltr !important;
            ">
                ${totalOffsetGainOfCurrentPositionObj.byOffsetOrderPrices.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                })} 
            </span>

            <div style="color:${profitLossByOffsetOrdersPercent >= 0 ? 'green' : 'red'};margin-right: 10px;"> 
                ${profitLossByOffsetOrdersPercent.toLocaleString('en-US', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1
                })} 
            </div>

        



            <div style="margin-right: 200px;font-size: 85%;"> 
             آفست با کادر قیمت
                <span style="
                    display: inline-block;
                    direction: ltr !important;
                ">
                    ${totalOffsetGainOfCurrentPositionObj.byInsertedPrices.toLocaleString('en-US', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    })}
                </span>
                
                <span style="color:${profitLossByInsertedPricesPercent >= 0 ? 'green' : 'red'};margin-right: 10px;"> 
                ${profitLossByInsertedPricesPercent.toLocaleString('en-US', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1
                })}
                </span>
            </div>




            <div style="margin-right: auto;font-size: 85%;display: flex;width: auto;flex-direction: column;"> 
                <div style="
                    width: max-content;
                "> 
                    
                  ${ typeof profitPercentOfCurrentPositionsByNearSettlementPrices === 'number' && !Number.isNaN(profitPercentOfCurrentPositionsByNearSettlementPrices) ? `<span style="
                        color:${(profitPercentOfCurrentPositionsByNearSettlementPrices) >= 0 ? 'green' : 'red'};
                        display: inline-block;
                        direction: ltr !important;
                    "> ${(profitPercentOfCurrentPositionsByNearSettlementPrices).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    })}</span>`:''} 
                    <span> سرمایه درگیر</span>
                    <span style="
                        color:${(totalCurrentPositionCost || unreliableTotalCostOfCurrentPositions) >= 0 ? 'green' : ''};
                        display: inline-block;
                        direction: ltr !important;
                    ">
                        ${(totalCurrentPositionCost || unreliableTotalCostOfCurrentPositions).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    })}
                    </span>

                </div>
            </div>

        
        `;

}
const findPositionInfoByGivenPortfolio = ({instrumentId,instrumentName},portfolioList) => {
    let currentPortfolioPosition = portfolioList.find(currentPortfolioPosition => instrumentId ? currentPortfolioPosition.instrumentId === instrumentId : currentPortfolioPosition.instrumentName === instrumentName)

    return currentPortfolioPosition

}


const checkStrategyInProfit = async (_strategyPositions)=>{

    const {
        totalCurrentPositionCost,
        totalOffsetGainOfCurrentPositionObj,
        profitLossByOffsetOrdersPercent,
        profitLossByInsertedPricesPercent,
        unreliableTotalCostOfCurrentPositions, profitPercentOfCurrentPositionsByNearSettlementPrices } = calcOffsetProfitOfStrategy({strategyPositions:_strategyPositions});




    showCurrentStrategyPositionState({
        totalCurrentPositionCost, totalOffsetGainOfCurrentPositionObj,
        profitLossByOffsetOrdersPercent, profitLossByInsertedPricesPercent,
        unreliableTotalCostOfCurrentPositions, profitPercentOfCurrentPositionsByNearSettlementPrices
    });
    

    let hasProfit = await checkProfitPercentAndInform({strategyPositions:_strategyPositions,profitLossByOffsetOrdersPercent ,profitPercentOfCurrentPositionsByNearSettlementPrices});
    

    return hasProfit

}


const getRecentExactDecimalPricesOfPortFolio = ({instrumentId,instrumentName}) => {

    if (!lastCheckProfitByExactDecimalPricesOfPortFolio?.portfolioList?.length || !lastCheckProfitByExactDecimalPricesOfPortFolio.time || (Date.now() - lastCheckProfitByExactDecimalPricesOfPortFolio.time) > 60000) return null
    let currentPortfolioPosition = findPositionInfoByGivenPortfolio({instrumentId,instrumentName}, [...lastCheckProfitByExactDecimalPricesOfPortFolio.portfolioList, ...lastCheckProfitByExactDecimalPricesOfPortFolio.stockPortfolioList]);

    if (!currentPortfolioPosition) return null

   

    if(!currentPortfolioPosition.executedPrice || !currentPortfolioPosition.breakEvenPrice){
        showToast('قیمت دقیق در پرتفوی موجود نمی باشد',2000,'error');
        return null
    }

    return {
        executedPrice : currentPortfolioPosition.executedPrice,
        breakEvenPrice : currentPortfolioPosition.breakEvenPrice,
    }
}


export const calcOffsetProfitOfStrategy = ({strategyPositions,stockPrice=getBaseInstrumentPriceOfOption()}) => {


    const totalCostInfoObj = totalCostCalculatorForPriceTypes(strategyPositions);

    const totalCurrentPositionCost = totalCostInfoObj.totalCostOfCurrentPositions;
    const unreliableTotalCostOfCurrentPositions = totalCostInfoObj.unreliableTotalCostOfCurrentPositions;
    const totalCostOfChunkOfEstimationQuantity = totalCostInfoObj.totalCostOfChunkOfEstimationQuantity;

    const totalOffsetGainOfChunkOfEstimation = totalOffsetGainOfChunkOfEstimationQuantityCalculator({
        strategyPositions: strategyPositions
    });

    const totalOffsetGainOfCurrentPositionObj = totalOffsetGainOfCurrentPositionsCalculator({
        strategyPositions: strategyPositions,
        stockPrice
    });



    

    let profitLossByOffsetOrdersPercent = profitPercentCalculator({
        costWithSign: totalCostOfChunkOfEstimationQuantity,
        gainWithSign: totalOffsetGainOfChunkOfEstimation.byOffsetOrderPrices
    });

    let profitLossByInsertedPricesPercent = profitPercentCalculator({
        costWithSign: totalCostOfChunkOfEstimationQuantity,
        gainWithSign: totalOffsetGainOfChunkOfEstimation.byInsertedPrices
    });

    let profitPercentOfCurrentPositionsByNearSettlementPrices = profitPercentCalculator({
        costWithSign: totalCostOfChunkOfEstimationQuantity,
        gainWithSign: totalOffsetGainOfCurrentPositionObj?.byNearSettlementPrices?.defaultQueue
    });


    return {
        totalCurrentPositionCost,
        totalOffsetGainOfCurrentPositionObj,
        profitLossByOffsetOrdersPercent,
        profitLossByInsertedPricesPercent,
        profitPercentOfCurrentPositionsByNearSettlementPrices,
        unreliableTotalCostOfCurrentPositions,
        

    }


}

const getBreakevenExecutedPriceDiffIssueInAllPortfolioLogs = ({ strategyPositions })=>{

    const instrumentNameList = strategyPositions.map(sp => sp.instrumentName);
    const storedPortfolioLogs = portfolioLogger.getLogs();
    let issueMap = [];
    for (let [dateKey, logList] of Object.entries(storedPortfolioLogs)) {

        const hadIssuedLog =  logList.find(logObj => {
            return logObj.data.find(instrument => instrumentNameList.includes(instrument.instrumentName) && hasBreakevenExecutedPriceDiffIssue({ executedPrice: instrument.executedPrice, breakEvenPrice: instrument.breakEvenPrice }))
        });

        hadIssuedLog && issueMap.push({dateKey,hadIssuedLog})

    }

    return issueMap

}

export const isReachedToExpectedOffsetProfit = ({
    profitLossByOffsetOrdersPercent,
    profitPercentOfCurrentPositionsByNearSettlementPrices,
    expectedProfit: customExpectedProfit = expectedProfit
}) => {

    if (customExpectedProfit?.currentPositions != null) {
        return profitLossByOffsetOrdersPercent > customExpectedProfit.currentPositions;
    }

    return profitLossByOffsetOrdersPercent > 0 &&
        (
            profitLossByOffsetOrdersPercent > customExpectedProfit?.defaultCurrentPositions ||
            profitLossByOffsetOrdersPercent > (profitPercentOfCurrentPositionsByNearSettlementPrices * 0.8)
        );
};

const checkProfitPercentAndInform =async ({strategyPositions,profitLossByOffsetOrdersPercent,profitPercentOfCurrentPositionsByNearSettlementPrices})=>{

    let hasProfit=false
    if (isReachedToExpectedOffsetProfit({profitLossByOffsetOrdersPercent,profitPercentOfCurrentPositionsByNearSettlementPrices})) {
        const isDoubleCheckOk = await doubleCheckProfitByExactDecimalPricesOfPortFolio({strategyPositions,profitPercentOfCurrentPositionsByNearSettlementPrices})
        if(!isDoubleCheckOk){
            hasProfit=false;
            uninformExtremeOrderPrice(strategyPositions, 'offset');
            return hasProfit
        } 
        const breakevenExecutedPriceIssueListOfAllLogs = getBreakevenExecutedPriceDiffIssueInAllPortfolioLogs({strategyPositions});
        if(breakevenExecutedPriceIssueListOfAllLogs?.length>0){

            const issueMessage = 'قبلا میانگین و سر به سر مشکل داشته';
                
            showToast(issueMessage,50000,'error');
            console.log('قبلا مشکل میانگین داشته ' , breakevenExecutedPriceIssueListOfAllLogs);

        }
        hasProfit=true;

        informExtremeOrderPrice(strategyPositions, 'offset');

        showNotification({
            title: 'به سود رسید',
            body: `${strategyPositions.map(_strategyPosition => _strategyPosition.instrumentName).join('-')}`,
            tag: `expectedProfitForCurrentPositionsPrecent`
        });
    } else {
        hasProfit=false;
        uninformExtremeOrderPrice(strategyPositions, 'offset');
    }

    return hasProfit

}
const informExtremeOrderPrice = (_strategyPositions, type) => {

    const getOrderPriceElement = (___strategyPosition) => {
        return type === 'offset' ? ___strategyPosition.getOffsetOrderPriceElements()[0] : ___strategyPosition.getOpenMoreOrderPriceElements()[0];
    }
    _strategyPositions.forEach(_strategyPosition => {
        const orderPriceElement = getOrderPriceElement(_strategyPosition);
        orderPriceElement && orderPriceElement.parentElement.classList.remove("amin-bold", "amin-bold--light");
    }
    );


    const sortedPositionsByDiff = [..._strategyPositions].sort((positionA, positionB) => {

        const { ratio: ratioOfA, diff: diffOfA } = positionA.getBestSecondPriceRatioDiff(type);
        const { ratio: ratioOfB, diff: diffOfB } = positionB.getBestSecondPriceRatioDiff(type);

        const ratioDiffOfAB = (diffOfA / diffOfB)


        if ((ratioOfB >= ratioOfA && (ratioDiffOfAB < 1.5)) || (ratioOfA >= ratioOfB && (ratioDiffOfAB) < 0.67)) {
            return 1
        } else {
            return -1
        }

    });

    // const orderPriceElement = getOrderPriceElement(positionWithMaxDiff);


    const firstPriceElement = getOrderPriceElement(sortedPositionsByDiff[0]);
    firstPriceElement.parentElement.classList.add("amin-bold");

    if(sortedPositionsByDiff[1]){
        const secondPriceElement = getOrderPriceElement(sortedPositionsByDiff[1]);
        secondPriceElement.parentElement.classList.add("amin-bold--light");
    }

}

const uninformExtremeOrderPrice = (_strategyPositions, type) => {
    const getOrderPriceElement = (___strategyPosition) => {
        return type === 'offset' ? ___strategyPosition.getOffsetOrderPriceElements()[0] : ___strategyPosition.getOpenMoreOrderPriceElements()[0];
    }
    _strategyPositions.forEach(_strategyPosition => {
        const orderPriceElement = getOrderPriceElement(_strategyPosition);
        orderPriceElement && orderPriceElement.parentElement.classList.remove("amin-bold", "amin-bold--light");
    }
    );
}

const convertStringToInt = (stringNumber) => {
    if (!stringNumber)
        return NaN
    return parseInt(stringNumber.replaceAll(',', '').trim());
}
const convertStringToFloat = (stringNumber) => {
    if (!stringNumber)
        return NaN
    return parseFloat(stringNumber.replaceAll(',', '').trim());
}




const getBaseInstrumentPriceOfOption = () => {


    const baseInstrumentPriceInputEl = domContextWindow.document.querySelector('.current-stock-price');

    return baseInstrumentPriceInputEl && convertStringToInt(baseInstrumentPriceInputEl.value);

}
const getnokoolOrNoRequestFactor = () => {

    const nokoolOrNoRequestFactorInputEl = domContextWindow.document.querySelector('.nokool-or-no-request-factor');

    return convertStringToFloat(nokoolOrNoRequestFactorInputEl?.value) || 0;

}




const createPositionObjectArray  = (strategyItemList) => {
    return strategyItemList.map(strategyItem => {
        const isDOM = strategyItem instanceof Element;

        const instrumentName =  isDOM ? strategyItem.querySelector('.instrument-title span').innerHTML:strategyItem.portfolioAssetInfo?.instrumentName;
        let optionID = isDOM ? Array.from(domContextWindow.document.querySelectorAll('client-option-positions-main .ag-pinned-right-cols-container .ag-row'))?.find(optionNameCellEl => Array.from(optionNameCellEl.querySelectorAll('span'))?.find(span => span.innerHTML === instrumentName))?.getAttribute('row-id') : strategyItem.portfolioAssetInfo?.instrumentId;
        const isBuy = isDOM ? strategyItem.querySelector('client-option-strategy-estimation-main-ui-order-side .-isActive')?.classList?.contains('buy') : strategyItem.side==="Buy";

        const isOption = isInstrumentNameOfOption(instrumentName);

        const isPut = isOption && instrumentName && instrumentName.charAt(0) === 'ط';

        const isCall = isOption && instrumentName && instrumentName.charAt(0) === 'ض';
        let cSize = isOption ? defaultCSize : 1;
        let daysLeftToSettlement = defaultDaysLeftToSettlement;

        const ordersModal =isDOM ? Array.from(domContextWindow.document.querySelectorAll('client-option-modal-trade-layout')).find(modal => {
            return Array.from(modal.querySelectorAll('label')).find(label => label.innerHTML === instrumentName)
        }
        ):null;

        const instrumentFullTitle = isDOM?  ordersModal && ordersModal.querySelector('client-option-instruments-favorites-item-header main > span').innerHTML : strategyItem.portfolioAssetInfo?.lVal30;

        const getOffsetOrderPriceElements = () => (ordersModal && ordersModal.querySelectorAll(`client-instrument-best-limit-ui-option client-instrument-price-position-row[orderside="${isBuy ? 'Buy' : 'Sell'}"] .-is-price span`)) || [];

        const getOpenMoreOrderPriceElements = () => (ordersModal && ordersModal.querySelectorAll(`client-instrument-best-limit-ui-option client-instrument-price-position-row[orderside="${isBuy ? 'Sell' : 'Buy'}"] .-is-price span`)) || [];

        const getBestOffsetPrice = () => {
            if(!isDOM) return 
            const priceElement = getOffsetOrderPriceElements()[0];
            return priceElement && convertStringToInt(priceElement.innerHTML);
        }

        const getBestOpenMorePrice = () => {
            if(!isDOM) return 
            const priceElement = getOpenMoreOrderPriceElements()[0];
            return priceElement && convertStringToInt(priceElement.innerHTML);
        }

        const getQuantity = () => {
            const cSize = getCSize();
            const quantity = isDOM? convertStringToInt(strategyItem.querySelector('[formcontrolname="quantity"] input').value): strategyItem.quantity;
            const quantityMultiplier = isOption ? cSize : 1;
            return quantity * quantityMultiplier;
        }


        let cachedCurrentPositionQuantityElement;
        const getCSize = ()=>{
            let size;
            if(instrumentExtraDataMap[instrumentName]){
                const instrumentExtraData = instrumentExtraDataMap[instrumentName];
                size = instrumentExtraData?.cSize ;

            }else if(!isDOM){
                size =  strategyItem.portfolioAssetInfo?.cSize;
            }
            return size || cSize
        }
        const getOptionID = ()=>{
            let id;
            if(instrumentExtraDataMap[instrumentName]){
                const instrumentExtraData = instrumentExtraDataMap[instrumentName];
                id = instrumentExtraData?.optionID;
            }else if(!isDOM){
                id = strategyItem.instrumentId
            }
            return id || optionID
        }
        const getInstrumentID = ()=>{
            if(instrumentExtraDataMap[instrumentName]){
                const instrumentExtraData = instrumentExtraDataMap[instrumentName];
                return instrumentExtraData?.instrumentId;
            }else if(!isDOM){
                return strategyItem.instrumentId
            }
        }
        const getDaysLeftToSettlement= ()=>{
            if(instrumentExtraDataMap[instrumentName]){
                const instrumentExtraData = instrumentExtraDataMap[instrumentName];
                return instrumentExtraData?.daysLeftToSettlement;

            }else if(!isDOM){
                const daysLeftToSettlement = isOption ? Math.ceil((new Date(strategyItem.portfolioAssetInfo?.psDate).valueOf() - Date.now()) / (24 * 60 * 60000)): null;
                return daysLeftToSettlement

            }


        }
        const getCurrentPositionQuantity = () => {

            optionID = getOptionID();
            const cSize = getCSize();

            let currentPositionQuantity
            if(isDOM){

                cachedCurrentPositionQuantityElement = domContextWindow.document.body.contains(cachedCurrentPositionQuantityElement) ? cachedCurrentPositionQuantityElement : domContextWindow.document.querySelector(`client-option-positions-main .ag-center-cols-clipper [row-id="${optionID}"] [col-id="${isBuy ? 'buyCount' : 'sellCount'}"]`);
                if (cachedCurrentPositionQuantityElement) {
                    currentPositionQuantity = convertStringToInt(cachedCurrentPositionQuantityElement?.innerHTML);
                } else {
                    currentPositionQuantity = getOrderModalPortfolioQuantity();
                }
            }else{
                currentPositionQuantity = strategyItem.portfolioAssetInfo?.count || strategyItem.portfolioAssetInfo?.quantity;
            }


            const quantityMultiplier = isOption ? cSize : 1;
            return currentPositionQuantity * quantityMultiplier;

        }


        let cachedOrderModalPortfolioQuantityElement;
        const getOrderModalPortfolioQuantity = () => {
            if(!domContextWindow || !ordersModal) return 
            cachedOrderModalPortfolioQuantityElement = domContextWindow.document.body.contains(cachedOrderModalPortfolioQuantityElement) ? cachedOrderModalPortfolioQuantityElement : ordersModal.querySelector('.o-quantityContainer footer span');
            return convertStringToInt(cachedOrderModalPortfolioQuantityElement?.innerHTML) || 0

        }
        let cachedOrderModalQuantityFooterElement
        const getOrderModalQuantityFooterElement = () => {
            if(!domContextWindow || !ordersModal) return 
            if (!domContextWindow.document.body.contains(cachedOrderModalQuantityFooterElement)) {
                cachedOrderModalQuantityFooterElement = ordersModal.querySelector('.o-quantityContainer footer')
            }


            return cachedOrderModalQuantityFooterElement

        }

        let cachedOrderModalTradePanelElement
        const getOrderModalTradePanelElement = () => {
             if(!domContextWindow || !ordersModal) return 
            if (!domContextWindow.document.body.contains(cachedOrderModalTradePanelElement)) {
                cachedOrderModalTradePanelElement = ordersModal.querySelector('client-instrument-favorites-item-trade-panel')
            }


            return cachedOrderModalTradePanelElement

        }


        let cachedOrderModalStrategyDropdownElement;
        const getOrderModalStrategyDropdownElement = ()=>{
             if(!domContextWindow || !ordersModal) return 
            if (!domContextWindow.document.body.contains(cachedOrderModalTradePanelElement)) {
                cachedOrderModalStrategyDropdownElement = ordersModal.querySelector('client-instrument-favorites-item-trade-panel ng-select.-is-strategyDropdown');
            }


            return cachedOrderModalStrategyDropdownElement
        }


        


         let cachedOrderModalQuantityInputElement;
        const getOrderModalQuantityInputElement = ()=>{
             if(!domContextWindow || !ordersModal) return 
            if (!domContextWindow.document.body.contains(cachedOrderModalQuantityInputElement)) {
                cachedOrderModalQuantityInputElement =ordersModal.querySelector('#tabKey-optionTradeQuantityInput');
            }


            return cachedOrderModalQuantityInputElement
        }



        
         let cachedOrderModalQuantityInputArrowUpElement;
        const getOrderModalQuantityInputArrowUpElement = ()=>{
             if(!domContextWindow || !ordersModal) return 
            if (!domContextWindow.document.body.contains(cachedOrderModalQuantityInputArrowUpElement)) {
                cachedOrderModalQuantityInputArrowUpElement = ordersModal.querySelector('[iconname="arrow-up-filled"]');
            }


            return cachedOrderModalQuantityInputArrowUpElement
        }


         let cachedOrderModalPriceElement;
        const getOrderModalPriceInputElement = ()=>{
             if(!domContextWindow || !ordersModal) return 
            if (!domContextWindow.document.body.contains(cachedOrderModalPriceElement)) {
                 cachedOrderModalPriceElement =ordersModal.querySelector('#tabKey-optionTradePriceInput');
            }

            return cachedOrderModalPriceElement
        }

        const getRequiredMargin = () => {

            const isMarginRequired = isDOM ? strategyItem.querySelector('input[formcontrolname="requiredMarginIsSelected"]')?.checked: strategyItem.requiredMarginIsSelected;
            const cSize = getCSize()

            if (!isMarginRequired)
                return 0

            const requiredMargin = (isDOM? convertStringToInt(strategyItem.querySelector('[formcontrolname="requiredMargin"] input').value) : strategyItem.requiredMargin) / cSize;

            return requiredMargin
        }

        const getInsertedPrice = () => {
            if(!isDOM) return 
            const insertedPrice = convertStringToInt(strategyItem.querySelector('[formcontrolname="price"] input').value);
            return insertedPrice;
        }

        const getInsertedQuantity = () => {
            if(!isDOM) return 
            const insertedQuantity = convertStringToInt(strategyItem.querySelector('[formcontrolname="quantity"] input').value);
            return insertedQuantity;
        }

        const calcBestSecondOrderPriceRatioDiff = (priceOrderElements) => {
            if(!isDOM) return 
            if (!priceOrderElements || priceOrderElements.length < 2)
                return

            const bestPrice = convertStringToInt(priceOrderElements[0].innerHTML);
            const secondPrice = convertStringToInt(priceOrderElements[1].innerHTML);

            const bestSecondPriceRatio = Math.abs((bestPrice / secondPrice) - 1);

            let bestSecondPriceDiff = Math.abs(bestPrice - secondPrice);

            return {
                diff: bestSecondPriceDiff,
                ratio: bestSecondPriceRatio
            }

        }

        const getBestSecondPriceRatioDiff = (chooseBestPriceType) => {
            if(!isDOM) return 
            return calcBestSecondOrderPriceRatioDiff(chooseBestPriceType === 'offset' ? getOffsetOrderPriceElements() : getOpenMoreOrderPriceElements());
        }


        function getCurrentPositionAvgPrice(position)  {


            const instrumentId = (position || this).getInstrumentID();
            const instrumentName = (position || this).instrumentName;
            let executedPrice,breakEvenPrice;
            optionID = getOptionID();

            const recentExactDecimalPricesOfPortFolioObj = (instrumentId || instrumentName) && getRecentExactDecimalPricesOfPortFolio({instrumentId,instrumentName});


            const recentCalculatedAvgPrices  =  getRecentCalculatedAvgPrices({instrumentId,instrumentName});
            if(recentCalculatedAvgPrices){

                executedPrice = recentCalculatedAvgPrices.avgPrice;
                breakEvenPrice = recentCalculatedAvgPrices.avgPrice;
                showToast('استفاده از میانگین های حساب شده');

            }
            else if(recentExactDecimalPricesOfPortFolioObj){
                executedPrice = recentExactDecimalPricesOfPortFolioObj.executedPrice;
                breakEvenPrice = recentExactDecimalPricesOfPortFolioObj.breakEvenPrice;
            }else{

                if(isDOM){
                    const executedPriceSelector = `client-option-positions-main .ag-center-cols-clipper [row-id="${optionID}"] [col-id="executedPrice"]`;
                    const breakEvenPriceSelector = `client-option-positions-main .ag-center-cols-clipper [row-id="${optionID}"] [col-id="breakEvenPrice"]`;
                    executedPrice = convertStringToInt(domContextWindow.document.querySelector(executedPriceSelector)?.innerHTML);
                    breakEvenPrice = convertStringToInt(domContextWindow.document.querySelector(breakEvenPriceSelector)?.innerHTML);

                }else{

                    executedPrice = strategyItem.portfolioAssetInfo?.executedPrice;
                    breakEvenPrice = strategyItem.portfolioAssetInfo?.breakEvenPrice;

                }
            }
            if (executedPrice && breakEvenPrice && hasBreakevenExecutedPriceDiffIssue({executedPrice,breakEvenPrice})) {

                const issueMessage = 'مشکل تفاوت میانگین و سر به سر';
                console.log(issueMessage,{instrumentName,executedPrice,breakEvenPrice});
                
                showToast(issueMessage,50000,'error');
                // !domContextWindow.window.doNotNotifAvrageIssue && showNotification({
                //     title: issueMessage,
                //     body: `${instrumentName}`,
                //     tag: `CurrentPositionAvgPriceIssue`
                // });
                return breakEvenPrice
            }

            return executedPrice || getUnreliableCurrentPositionAvgPrice()

        }


        let cachedUnreliableCurrentPositionAvgPriceElement;
        const getUnreliableCurrentPositionAvgPrice = () => {
             
 
            if(!isDOM) return 

            if (!domContextWindow.document.body.contains(cachedUnreliableCurrentPositionAvgPriceElement)) {
                const labelText = 'میانگین';
                const xpath = `.//label[normalize-space(text())='${labelText}']/following-sibling::span[1]`;

                const avgPriceElement = domContextWindow.document.evaluate(
                    xpath,
                    ordersModal, // فقط در این محدوده بگرد
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue;

                cachedUnreliableCurrentPositionAvgPriceElement = avgPriceElement || null

            }

            return convertStringToInt(cachedUnreliableCurrentPositionAvgPriceElement.innerHTML) || 0

        }



       



        const getStrategyName = () => {
            return isDOM ? domContextWindow.document.querySelector('client-option-strategy-estimation-header c-k-input-text input')?.value : strategyItem.strategyTitle
        }

        const getBestOpenMorePriceWithSideSign = () => {
            const bestOpenMorePrice = getBestOpenMorePrice();
            if (!bestOpenMorePrice)
                return
            return bestOpenMorePrice * (isBuy ? -1 : 1);
        }

        const strikePrice = isDOM ? convertStringToInt(domContextWindow.document.querySelector(`client-option-positions-main .ag-center-cols-clipper [row-id="${optionID}"] [col-id="strikePrice"]`)?.innerHTML) || convertStringToInt(strategyItem.querySelectorAll('.o-item-row > div')[5].innerHTML) : strategyItem.portfolioAssetInfo?.strikePrice;
        

       

        const getStrategyType = () => {
            const strategyName = getStrategyName();
            if (!strategyName)
                return

            const strategyType = strategyName.split('@')[0];
            return 
            // return ['COVERED'].find(type => strategyType === type);
            // return ['BUCS_COLLAR', 'BUPS_COLLAR', 'BEPS_COLLAR', 'BUCS', 'BECS', 'BUPS', 'BEPS', 'BOX_BUPS_BECS', 'BOX', 'COVERED', 'GUTS', 'LongGUTS_STRANGLE', 'CALL_BUTT_CONDOR'].find(type => strategyType === type);
        }


      


        let strategyPosition = {
            optionRowEl:isDOM ?strategyItem : null,
            // TODO: is not just option meybe stock
            instrumentName,
            instrumentFullTitle,
            isBuy,
            isETF : isETF(instrumentName),
            optionID,
            isOption,
            isCall,
            isPut,
            cSize,
            getCSize,
            getOptionID,
            getInstrumentID,
            getDaysLeftToSettlement,
            getQuantity,
            getCurrentPositionQuantity,
            getOrderModalPortfolioQuantity,
            getOrderModalQuantityFooterElement,
            getOrderModalTradePanelElement,
            getOrderModalStrategyDropdownElement,
            getOrderModalQuantityInputElement,
            getOrderModalPriceInputElement,
            getOrderModalQuantityInputArrowUpElement,
            getInsertedPrice,
            getInsertedQuantity,
            getRequiredMargin,
            getCurrentPositionAvgPrice,
            getUnreliableCurrentPositionAvgPrice,
            strikePrice,
            daysLeftToSettlement,
            ordersModal,
            getOffsetOrderPriceElements,
            getOpenMoreOrderPriceElements,
            getBestOffsetPrice,
            getBestOpenMorePrice,
            getBestSecondPriceRatioDiff,
            getBestOpenMorePriceWithSideSign,
            getStrategyName,
            getStrategyType,
            observers: []
        }

        return strategyPosition
    }
    );
}

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


const prepareStrategyForExport = ({
    strategyPositions,
    strategyName = getStrategyName() ,
    stockPrice = getBaseInstrumentPriceOfOption(),
    nokoolOrNoRequestFactor = getnokoolOrNoRequestFactor()})=>{

    const strategyPositionsForExport = strategyPositions.map(sp => {

        let spForExport = {...sp};

        for (const key in spForExport) {
            if (typeof spForExport[key] === 'function') {
                const value = spForExport[key]();
                spForExport[key] = () => value;
            }
        }

        return spForExport

    });
    return {
        positionsPrepareForSerialization: strategyPositionsForExport.map(
            prepareForSerialization
        ),
        strategyName,
        expectedProfit,
        stockPrice,
        nokoolOrNoRequestFactor
    }

}


export const getStrategyInfoForExport = ()=>{
    
    return prepareStrategyForExport({strategyPositions})

}


export const openStrategyExerciseCostSummaryModal = async ()=>{
    const  groupStrategyInfoList = await enrichGroupByStrategyInfo();
    console.log(groupStrategyInfoList);
    
    showStrategyExerciseCostSummary(groupStrategyInfoList.map(groupStrategyInfo=>groupStrategyInfo.strategy).filter(Boolean));
}

export const getAllGroupStrategyListForExport = async ()=>{
 try {

    const  groupStrategyInfoList = await enrichGroupByStrategyInfo();


    const groupStrategyInfoListPrepareForExport =groupStrategyInfoList.map(groupStrategyInfo=>{
        if(!groupStrategyInfo?.strategy?.strategyPositions) return null
        return prepareStrategyForExport({
            strategyPositions:groupStrategyInfo.strategy.strategyPositions,
            strategyName: groupStrategyInfo.strategy.title,
            stockPrice : groupStrategyInfo.strategy.stockPrice
        });
    }).filter(Boolean);

    return groupStrategyInfoListPrepareForExport
    } catch (error) {

        console.error(
            '[getAllGroupStrategyListForExport] خطا:',
            error
        );

         showToast(`خطای getAllGroupStrategyListForExport`);

    }
}



const orderModalInputCheckAndInformer = () => {

    setTimeout(() => {
        
        quantityUnbalanceInformer({
            orderModalQuantityGetter: (strategyPosition) => convertStringToInt(strategyPosition.getOrderModalQuantityInputElement()?.value),
            informer: (strategyPosition) => { 
                if(!strategyPosition.getOrderModalQuantityInputElement()) return 
                const quantityInput = strategyPosition.getOrderModalQuantityInputElement();
                if (quantityInput) {
                    quantityInput.classList.add('inserted-quantity-unbalance-error'); 
                }
            },
            informCleaner: (strategyPosition) => { 
                if(!strategyPosition.getOrderModalQuantityInputElement()) return 

                const quantityInput = strategyPosition.getOrderModalQuantityInputElement();
                if (quantityInput) {
                    quantityInput.classList.remove('inserted-quantity-unbalance-error'); 
                }
            }
        });
        highSumValueOfInsertedOrderInformer({
            orderModalQuantityGetter: (strategyPosition) => convertStringToInt(strategyPosition.getOrderModalQuantityInputElement()?.value),
            orderModalPriceGetter: (strategyPosition) => convertStringToInt(strategyPosition.getOrderModalPriceInputElement()?.value),
            informer: (strategyPosition) => { 
                if(!strategyPosition.ordersModal) return 

                const inModalWrapper = strategyPosition.ordersModal.querySelector('.o-inModalWrapper');
                if (inModalWrapper) {
                    inModalWrapper.classList.add('inserted-high-sum-value-error'); 
                }
            },
            informCleaner: (strategyPosition) => { 
                if(!strategyPosition.ordersModal) return 

                const inModalWrapper = strategyPosition.ordersModal.querySelector('.o-inModalWrapper');
                if (inModalWrapper) {
                    inModalWrapper.classList.remove('inserted-high-sum-value-error'); 
                }
            }
        });

        higherQuantityOfInsertedOrderInformer({
            orderModalQuantityGetter: (strategyPosition) => convertStringToInt(strategyPosition.getOrderModalQuantityInputElement()?.value),
            informer: (strategyPosition) => {
                if (!strategyPosition.ordersModal) return

                const footer = strategyPosition.ordersModal.querySelector('.o-quantityContainer footer');
                if (footer) {
                    footer.classList.add('higher-than-portfolio'); 
                }

                const issueMessage = 'تعداد بیشتر از دارایی است';
                showToast(issueMessage, 3000, 'error');
            },
            informCleaner: (strategyPosition) => {
                if (!strategyPosition.ordersModal) return

                const footer = strategyPosition.ordersModal.querySelector('.o-quantityContainer footer');
                if (footer) {
                    footer.classList.remove('higher-than-portfolio'); 
                }
            }
        });


        
    }, 100);
    

}
const observeInputQuantityOfOrderModal = () => {


    return strategyPositions.map(strategyPositionObj => {

        strategyPositionObj.observers.filter(observerInfoObj => ['inputQuantityOfOrderModal'].includes(observerInfoObj.key)).forEach(observerInfoObj => observerInfoObj.observer.disconnect())

        const inputQuantityOfOrderModal = strategyPositionObj.getOrderModalQuantityInputElement();
        const ordersModal = strategyPositionObj.ordersModal;

        const eventNames = ['input', 'change', 'click'];
        eventNames.forEach(eventName => inputQuantityOfOrderModal.removeEventListener(eventName, orderModalInputCheckAndInformer));
        eventNames.forEach(eventName => inputQuantityOfOrderModal.addEventListener(eventName, orderModalInputCheckAndInformer));


        const eventNamesOnOrderModal =['click','mousedown','mouseup']

        eventNamesOnOrderModal.forEach(eventName => ordersModal.removeEventListener(eventName, orderModalInputCheckAndInformer));
        eventNamesOnOrderModal.forEach(eventName => ordersModal.addEventListener(eventName, orderModalInputCheckAndInformer));
        

        let lastClickTime = 0;
        const minInterval = 300;
        const mousemoveEventHandler = () => {
            const currentTime = new Date().getTime();
            if ((currentTime - lastClickTime) < minInterval)
                return
            lastClickTime = currentTime;
            orderModalInputCheckAndInformer();

        }

        // TODO:FIXME: refactor this name and persist event handler code
        
        strategyPositionObj.mouseMoveOnOrderModalEventHandler && ordersModal.addEventListener('mousemove', strategyPositionObj.mouseMoveOnOrderModalEventHandler);
        ordersModal.addEventListener('mousemove', mousemoveEventHandler);
        strategyPositionObj.mouseMoveOnOrderModalEventHandler = mousemoveEventHandler;

        const inputObserver = {
            disconnect() {
                eventNames.forEach(eventName => inputQuantityOfOrderModal.removeEventListener(eventName, orderModalInputCheckAndInformer));
                ordersModal.removeEventListener('click', orderModalInputCheckAndInformer)
                ordersModal.removeEventListener('mousemove ', mousemoveEventHandler)
            }
        }

        let observers = strategyPositionObj.observers.filter(observerInfoObj => !['inputQuantityOfOrderModal'].includes(observerInfoObj.key));

        observers.push({
            key: 'inputQuantityOfOrderModal',
            observer: inputObserver
        });

        return {
            ...strategyPositionObj,
            observers
        }
    }
    )

}

const observeInputBoxInRowOfStrategy = () => {

    return strategyPositions.map(strategyPositionObj => {

        strategyPositionObj.observers.filter(observerInfoObj => ['rowPriceLockTypeSelector', 'rowPriceInput'].includes(observerInfoObj.key)).forEach(observerInfoObj => observerInfoObj.observer.disconnect())

        const onChangeCb = () => {
            
            setTimeout(() => {
                calcProfitOfStrategy(strategyPositions);
                checkStrategyInProfit(strategyPositions);
            }
                , 300)

        }
        const observer = new MutationObserver((mutationList) => {
            onChangeCb();
        }
        );
        const rowInputPrice = strategyPositionObj.optionRowEl.querySelector('[formcontrolname="price"] input');
        const rowPriceLockTypeSelector = strategyPositionObj.optionRowEl.querySelector('.o-price-group client-option-strategy-estimation-main-ui-lock');

        rowInputPrice.addEventListener('input', onChangeCb)
        rowPriceLockTypeSelector.addEventListener('click', onChangeCb)

        const inputObserver = {
            disconnect() {
                rowInputPrice.removeEventListener('input', onChangeCb)
            }
        }
        const rowPriceLockTypeSelectorClickObserver = {
            disconnect() {
                rowInputPrice.removeEventListener('click', onChangeCb)
            }
        }

        observer.observe(rowPriceLockTypeSelector, {
            attributes: true,
            childList: true,
            subtree: true
        });

        let observers = strategyPositionObj.observers.filter(observerInfoObj => !['rowPriceLockTypeSelector', 'rowPriceInput'].includes(observerInfoObj.key));

        observers.push({
            key: 'rowPriceInput',
            observer: inputObserver
        });
        observers.push({
            key: 'rowPriceLockTypeSelector',
            observer
        });
        observers.push({
            key: 'rowPriceLockTypeSelectorClickObserver',
            observer : rowPriceLockTypeSelectorClickObserver
        });

        return {
            ...strategyPositionObj,
            observers
        }
    }
    )

}


let currentPositionQuantityUnbalanceInformerTimeout;
const currentPositionQuantityUnbalanceCheckAndNotif = () => {
    const hasIssue = quantityUnbalanceInformer({
        orderModalQuantityGetter: (strategyPosition) => strategyPosition.getOrderModalPortfolioQuantity(),
        informer: (strategyPosition) => {
            if (!strategyPosition?.getOrderModalQuantityFooterElement()) return

            const quantityFooter = strategyPosition.getOrderModalQuantityFooterElement();
            if (quantityFooter) {
                quantityFooter.classList.add('current-position-quantity-unbalance-error'); 
            }

        },
        informCleaner: (strategyPosition) => {
            if (!strategyPosition?.getOrderModalQuantityFooterElement()) return

            const quantityFooter = strategyPosition.getOrderModalQuantityFooterElement();
            if (quantityFooter) {
                quantityFooter.classList.remove('current-position-quantity-unbalance-error'); 
            }
        }
    }).hasIssue;


    if (hasIssue) {



        showNotification({
            title: 'تعداد بالانس نیست',
            body: `${strategyPositions[0].instrumentName}`,
            tag: `${strategyPositions[0].instrumentName}-currentPositionQuantityUnbalance`
        });

        clearTimeout(currentPositionQuantityUnbalanceInformerTimeout);
        currentPositionQuantityUnbalanceInformerTimeout = setTimeout(currentPositionQuantityUnbalanceCheckAndNotif, 40000);
    } else {
        clearTimeout(currentPositionQuantityUnbalanceInformerTimeout);
    }



}


const observePortfolioQuantityOfOrderModal = () => {
    // TODO:FIXME: use domContextWindow.document.body.contains(...)

    currentPositionQuantityUnbalanceCheckAndNotif();
    return strategyPositions.map(strategyPositionObj => {

        strategyPositionObj.observers.filter(observerInfoObj => ['PortfolioQuantity', 'PortfolioQuantityMousemove','PortfolioQuantityTabClick'].includes(observerInfoObj.key)).forEach(observerInfoObj => observerInfoObj.observer.disconnect())

        // const portfolioQuantityElement =strategyPositionObj.ordersModal.querySelector('client-instrument-favorites-item-trade-panel .o-quantityContainer footer span')


        let previousStoredPortfolioQuantity = strategyPositionObj.getOrderModalPortfolioQuantity();

        const config = {
            //attributes: true,
            childList: true,
            characterData: true,
            characterDataOldValue: true,
            subtree: true
        };

        const PortfolioQuantityCallback = (mutationList) => {
            for (const mutation of mutationList) {
                // if(mutation?.type!=="characterData") return

                // const oldValue = mutation.oldValue ? convertStringToInt(mutation.oldValue) : 0;
                const oldValue = previousStoredPortfolioQuantity >= 0 ? previousStoredPortfolioQuantity : 0;
                // const newValue = mutation.target.nodeValue ? convertStringToInt(mutation.target.nodeValue) : null;
                const newValue = strategyPositionObj.getOrderModalPortfolioQuantity() || 0;
                // if(newValue===null) return

                if(oldValue===newValue) return
                let bgColor


                if (newValue > oldValue) {
                    bgColor = '#008000a3'
                } else {
                    bgColor = '#ff00009c'
                }

                // let quantityFooter = strategyPositionObj.getOrderModalQuantityFooterElement();
                let tradePanelElement = strategyPositionObj.getOrderModalTradePanelElement();


                // quantityFooter.style.backgroundColor = bgColor;
                tradePanelElement.style.backgroundColor = bgColor;
                showNotification({
                    title: 'معامله شد',
                    body: `${strategyPositionObj.instrumentName}`,
                    tag: `${strategyPositionObj.getStrategyName()}-PortfolioQuantityChange`,
                    requireInteraction: true

                });

                previousStoredPortfolioQuantity = newValue

                setTimeout(() => {
                    tradePanelElement.style.backgroundColor = '';

                    currentPositionQuantityUnbalanceCheckAndNotif();
                }
                    , 600);



            }
        }
            ;



        const PortfolioQuantityObserver = new MutationObserver(PortfolioQuantityCallback);

        strategyPositionObj.getOrderModalQuantityFooterElement() && PortfolioQuantityObserver.observe(strategyPositionObj.getOrderModalQuantityFooterElement(), config);


        const tabClickHandler = ()=>{
             setTimeout(() => {

                    const isTradePanelVisible = domContextWindow.document.body.contains(strategyPositionObj.getOrderModalTradePanelElement());

                    if (isTradePanelVisible) {
                        removeAllListeners();
                        strategyPositions = observePortfolioQuantityOfOrderModal();
                    }
                    
                    stopDraggingWrongOfOrdersModals();

                    currentPositionQuantityUnbalanceCheckAndNotif();

                }
                    , 100)

        }


        const setupTabListeners = () => {
            
            const elements = strategyPositionObj.ordersModal.querySelectorAll(
                'client-trade-ui-tabs,[iconname="details-outlined"]'
            );
            
            elements.forEach(el => {
                el.removeEventListener('click', tabClickHandler);
                el.addEventListener('click', tabClickHandler);
            });
            
        };
       

        const removeAllListeners = ()=>{
            PortfolioQuantityObserver && PortfolioQuantityObserver.disconnect();

            mouseMoveObserver && mouseMoveObserver.disconnect();
            tabClickObserver && tabClickObserver.disconnect();
        }
        setupTabListeners();

        const tabClickObserver = {
            // TODO: remove click event listener
            disconnect() {
                const elements = strategyPositionObj.ordersModal.querySelectorAll(
                    'client-trade-ui-tabs,[iconname="details-outlined"]'
                );

                elements.forEach(el => {
                    el.removeEventListener('click', tabClickHandler);
                });
            }
        }



        let lastClickTime = 0;
        const minInterval = 1000;
        const mousemoveEventHandler = () => {
            const currentTime = new Date().getTime();
            if ((currentTime - lastClickTime) < minInterval)
                return
            lastClickTime = currentTime;
            currentPositionQuantityUnbalanceCheckAndNotif();

        }


        strategyPositionObj.orderModalMousemoveEventHandler && strategyPositionObj.ordersModal.removeEventListener('mousemove', strategyPositionObj.orderModalMousemoveEventHandler)
        strategyPositionObj.ordersModal.addEventListener('mousemove', mousemoveEventHandler);

        strategyPositionObj.orderModalMousemoveEventHandler = mousemoveEventHandler

        const mouseMoveObserver = {
            // TODO: remove click event listener
            disconnect() {
                strategyPositionObj.ordersModal.removeEventListener('mousemove', mousemoveEventHandler)
            }
        }

        let observers = strategyPositionObj.observers.filter(observerInfoObj => !['PortfolioQuantity', 'PortfolioQuantityMousemove','PortfolioQuantityTabClick'].includes(observerInfoObj.key));


        observers.push({
            key: 'PortfolioQuantityMousemove',
            observer: mouseMoveObserver
        });

        observers.push({
            key: 'PortfolioQuantity',
            observer: PortfolioQuantityObserver
        });
        observers.push({
            key: 'PortfolioQuantityTabClick',
            observer: tabClickObserver
        });

        return {
            ...strategyPositionObj,
            observers
        }
    }
    );
}





const observeMyOrderInOrdersModal = () => {
    return strategyPositions.map(strategyPositionObj => {

        strategyPositionObj.observers.filter(observerInfoObj => ['firstBuyRowChange', 'firstSellRowChange'].includes(observerInfoObj.key)).forEach(observerInfoObj => observerInfoObj.observer.disconnect())

        const config = {
            attributes: true,
            childList: true,
            subtree: true
        };

        const myOrderOnOrdersModal = (() => {
            let isInSell, isInBuy, buyTimeout, sellTimeout

            return {
                is({ isBuy } = {}) {
                    const pulseElement = strategyPositionObj.ordersModal.querySelector(`ul.${isBuy ? '-is-buy' : '-is-sell'} .c-pulse`)
                    if (!pulseElement) return

                    const pulseStyle = domContextWindow.window.getComputedStyle(pulseElement);

                    if (pulseStyle.display === 'none') return false;
                    if (pulseStyle.visibility === 'hidden') return false;
                    if (parseFloat(pulseStyle.opacity) <= 0) return false;
                },
                was({ isBuy }) {

                    return isBuy ? isInBuy : isInSell
                },
                set({ isBuy, bool }) {
                    return isBuy ? isInBuy = bool : isInSell = bool
                },
                setTimeout({ isBuy, cb }) {
                    const timeout = setTimeout(cb, 3 * 60 * 1000);
                    isBuy ? buyTimeout = timeout : sellTimeout = timeout
                },
                createTimeout({ isBuy }) {
                    isBuy ? clearTimeout(buyTimeout) : clearTimeout(sellTimeout)
                }
            }

        }
        )()

        const rowChangeCBFactory = ({ isBuy, isSell }) => (mutationList) => {
            const _isMyOrderOnOrdersModal = myOrderOnOrdersModal.is({
                isBuy,
                isSell
            });
            if (!_isMyOrderOnOrdersModal && myOrderOnOrdersModal.was({
                isBuy,
                isSell
            })) {
                showNotification({
                    title: `سفارش ${strategyPositionObj.instrumentName} از سفارشات ${isBuy ? 'خرید' : 'فروش'} خارج شد`,
                    body: `${strategyPositions.map(_strategyPosition => _strategyPosition.instrumentName).join('-')}`,
                });
                myOrderOnOrdersModal.set({
                    isBuy,
                    isSell,
                    bool: false
                });

                myOrderOnOrdersModal.createTimeout({
                    isBuy
                });
            } else if (_isMyOrderOnOrdersModal && !myOrderOnOrdersModal.was({
                isBuy,
                isSell
            })) {
                myOrderOnOrdersModal.set({
                    isBuy,
                    isSell,
                    bool: true
                });

                myOrderOnOrdersModal.setTimeout({
                    isBuy,
                    cb: () => showNotification({
                        title: `سفارش  ${isBuy ? 'خرید' : 'فروش'} ${strategyPositionObj.instrumentName}   طولانی شده`,
                        body: `${strategyPositions.map(_strategyPosition => _strategyPosition.instrumentName).join('-')}`,
                    })
                })

            }
        }
            ;

        const firstBuyRow = strategyPositionObj.ordersModal.querySelector('client-instrument-price-position-row[orderside="Buy"]');
        const firstSellRow = strategyPositionObj.ordersModal.querySelector('client-instrument-price-position-row[orderside="Sell"]');

        const firstBuyRowChangeObserver = new MutationObserver(rowChangeCBFactory({
            isBuy: true
        }));
        const firstSellRowChangeObserver = new MutationObserver(rowChangeCBFactory({
            isSell: true
        }));

        firstBuyRow && firstBuyRowChangeObserver.observe(firstBuyRow, config);
        firstSellRow && firstSellRowChangeObserver.observe(firstSellRow, config);

        strategyPositionObj.ordersModal.querySelector('[iconname="details-outlined"]').addEventListener('click', (e) => {
            setTimeout(() => {
                const isLimitOrdersVisible = Boolean(strategyPositionObj.ordersModal.querySelector('client-instrument-best-limit'));
                if (isLimitOrdersVisible) {
                    firstBuyRowChangeObserver && firstBuyRowChangeObserver.disconnect();
                    firstSellRowChangeObserver && firstSellRowChangeObserver.disconnect();
                    strategyPositions = observeMyOrderInOrdersModal();
                }
            }
                , 100)

        }
        )

        let observers = strategyPositionObj.observers.filter(observerInfoObj => !['firstBuyRowChange', 'firstSellRowChange'].includes(observerInfoObj.key));

        observers.push({
            key: 'firstBuyRowChange',
            observer: firstBuyRowChangeObserver
        });
        observers.push({
            key: 'firstSellRowChange',
            observer: firstSellRowChangeObserver
        });

        return {
            ...strategyPositionObj,
            observers
        }
    }
    );
}


let isCheckingOffsetProfit = false;
let pendingOffsetProfitCheck = false;
let calcOffsetProfitOfStrategyInformUntilNotProfitTimeout;

const calcOffsetProfitOfStrategyInformUntilNotProfit = async () => {

    if (isCheckingOffsetProfit) {
        // یک درخواست جدید آمده؛ اجرای فعلی تمام شد،
        // دوباره با آخرین وضعیت بررسی کن.
        pendingOffsetProfitCheck = true;
        return;
    }

    isCheckingOffsetProfit = true;
    pendingOffsetProfitCheck = false;

    try {

        const isProfit =
            await checkStrategyInProfit(strategyPositions);

        if (isProfit) {

            clearTimeout(
                calcOffsetProfitOfStrategyInformUntilNotProfitTimeout
            );

            calcOffsetProfitOfStrategyInformUntilNotProfitTimeout =
                setTimeout(
                    calcOffsetProfitOfStrategyInformUntilNotProfit,
                    10000
                );

        } else {

            clearTimeout(
                calcOffsetProfitOfStrategyInformUntilNotProfitTimeout
            );

            calcOffsetProfitOfStrategyInformUntilNotProfitTimeout = null;
        }

    } finally {

        isCheckingOffsetProfit = false;

        if (pendingOffsetProfitCheck) {
            pendingOffsetProfitCheck = false;

            // اجرای بعدی با آخرین state/price
            calcOffsetProfitOfStrategyInformUntilNotProfit();
        }
    }
};

let calcProfitOfStrategyInformUntilNotProfitTimeout;

const calcProfitOfStrategyInformUntilNotProfit =async () => {
    const isProfit = await calcProfitOfStrategy(strategyPositions);
    if (isProfit) {
        clearTimeout(calcProfitOfStrategyInformUntilNotProfitTimeout);
        calcProfitOfStrategyInformUntilNotProfitTimeout = setTimeout(calcProfitOfStrategyInformUntilNotProfit, 10000);
    } else {
        clearTimeout(calcProfitOfStrategyInformUntilNotProfitTimeout);
    }
}

const observePriceChanges = () => {
    return strategyPositions.map(strategyPositionObj => {

        strategyPositionObj.observers.filter(observerInfoObj => ['bestOffsetOrder', 'bestOpenMoreOrder'].includes(observerInfoObj.key)).forEach(observerInfoObj => observerInfoObj.observer.disconnect())

        const config = {
            attributes: true,
            childList: true,
            subtree: true
        };

        

        const bestOffsetOrderCallback = (mutationList) => {
            for (const mutation of mutationList) {
                if (mutation?.target?.innerHTML) {
                    
                    setTimeout(() => {
                        calcProfitOfStrategyInformUntilNotProfit()
                    }
                        , 400);
                    calcOffsetProfitOfStrategyInformUntilNotProfit();
                }

            }
        }
            ;

        const bestOpenMoreOrderCallback = (mutationList) => {
            for (const mutation of mutationList) {
                if (mutation?.target?.innerHTML) {


                    setTimeout(() => {
                        calcProfitOfStrategyInformUntilNotProfit()
                    }
                        , 400);
                    calcOffsetProfitOfStrategyInformUntilNotProfit();

                }

            }
        }
            ;

        const bestOffsetOrderObserver = new MutationObserver(bestOffsetOrderCallback);
        const bestOpenMoreOrderObserver = new MutationObserver(bestOpenMoreOrderCallback);

        

        strategyPositionObj.getOffsetOrderPriceElements()[0] && bestOffsetOrderObserver.observe(strategyPositionObj.getOffsetOrderPriceElements()[0], config);
        strategyPositionObj.getOpenMoreOrderPriceElements()[0] && bestOpenMoreOrderObserver.observe(strategyPositionObj.getOpenMoreOrderPriceElements()[0], config);


        const assetDetailsIconClickHandler = ()=>{


            setTimeout(() => {
                const isLimitOrdersVisible = Boolean(strategyPositionObj.ordersModal.querySelector('client-instrument-best-limit'));

                if (isLimitOrdersVisible) {
                    bestOffsetOrderObserver && bestOffsetOrderObserver.disconnect();
                    bestOpenMoreOrderObserver && bestOpenMoreOrderObserver.disconnect();
                    strategyPositions = observePriceChanges();
                }

            }
                , 100)

        }

        const detailsButton = strategyPositionObj?.ordersModal?.querySelector('[iconname="details-outlined"]');

        strategyPositionObj.assetDetailsIconClickHandler && detailsButton && detailsButton.removeEventListener('click',strategyPositionObj.assetDetailsIconClickHandler);
        detailsButton && detailsButton.addEventListener('click', assetDetailsIconClickHandler );
        strategyPositionObj.assetDetailsIconClickHandler = assetDetailsIconClickHandler;


        let observers = strategyPositionObj.observers.filter(observerInfoObj => !['bestOffsetOrder', 'bestOpenMoreOrder'].includes(observerInfoObj.key));

        observers.push({
            key: 'bestOffsetOrder',
            observer: bestOffsetOrderObserver
        });
        observers.push({
            key: 'bestOpenMoreOrder',
            observer: bestOpenMoreOrderObserver
        });
        return {
            ...strategyPositionObj,
            observers
        }
    }
    );
}


export const isProfitEnough = ({ strategyPositions, totalProfitPercent, daysLeftToSettlement,expectedProfit }) => {
    if (typeof daysLeftToSettlement !== 'number' || Number.isNaN(daysLeftToSettlement)) {
        daysLeftToSettlement = strategyPositions.find(sp => {
            sp.daysLeftToSettlement = sp.getDaysLeftToSettlement()
            return (typeof sp.daysLeftToSettlement === 'number' && !Number.isNaN(sp.daysLeftToSettlement))
        })?.daysLeftToSettlement ?? defaultDaysLeftToSettlement;
    }

    daysLeftToSettlement = daysLeftToSettlement>=1 ? daysLeftToSettlement : 1;

    const percentPerDay = Math.pow((1 + (totalProfitPercent / 100)), 1 / daysLeftToSettlement);
    const percentPerMonth = Math.pow(percentPerDay, 30);
    if (expectedProfit?.strategy) {
        return totalProfitPercent > expectedProfit?.strategy
    }
    if (!percentPerMonth || !totalProfitPercent || totalProfitPercent <= expectedProfit.minExpectedProfitOfStrategy) return
    return percentPerMonth >= expectedProfit.expectedProfitPerMonth
}


const informForExpectedProfitOnStrategy = ({ _strategyPositions, profitPercentByBestPrices, profitPercentByInsertedPrices,settlementProfitByBestPrices,settlementProfitByInsertedPrices }) => {

    let statusCnt = getStrategyExpectedProfitCnt();
    const maxDaysToShowQueueSenarioProfits = 4;

    let daysLeftToSettlement = _strategyPositions.find(_strategyPosition =>{
        _strategyPosition.daysLeftToSettlement = _strategyPosition.getDaysLeftToSettlement()
        return (typeof _strategyPosition.daysLeftToSettlement === 'number' && !Number.isNaN(_strategyPosition.daysLeftToSettlement))
    })?.daysLeftToSettlement ?? defaultDaysLeftToSettlement;

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
                    ${daysLeftToSettlement< maxDaysToShowQueueSenarioProfits ?`<div style="font-size: 11px;color:${profitPercentByBestPrices.buyQueue >= 0 ? 'green' : 'red'}">
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
                    ${daysLeftToSettlement< maxDaysToShowQueueSenarioProfits ?`<div style="font-size: 11px;color:${profitPercentByInsertedPrices.buyQueue >= 0 ? 'green' : 'red'}">
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



    
    
   


    let isProfitGood=false;
    if (isProfitEnough({strategyPositions:_strategyPositions, totalProfitPercent: profitPercentByBestPrices.defaultQueue, daysLeftToSettlement,expectedProfit})) {

        isProfitGood =true;
        informExtremeOrderPrice(_strategyPositions, 'openMore');
        showNotification({
            title: `سود %${profitPercentByBestPrices.defaultQueue.toFixed()}`,
            body: `${_strategyPositions.map(_strategyPosition => _strategyPosition.instrumentName).join('-')}`,
            tag: `expectedProfitPrecent`
        });
    } else {
        isProfitGood =false;
        uninformExtremeOrderPrice(_strategyPositions);
    }

    return isProfitGood;
}

export const STRATEGY_NAME_PROFIT_CALCULATOR = {

    utils: {},

   
    OTHERS({strategyPositions,stockPrice=getBaseInstrumentPriceOfOption(),nokoolOrNoRequestFactor=getnokoolOrNoRequestFactor()}) {

        const totalCostObj = totalCostCalculatorForPriceTypes(strategyPositions);


        const totalOffsetGainInfo = totalOffsetGainNearSettlementOfEstimationPanel({
            strategyPositions: strategyPositions,
            stockPrice
        });

        const profitPercentByBestPrices = {
            defaultQueue: profitPercentCalculator({
                costWithSign: totalCostObj.totalCostByBestPrices,
                gainWithSign: totalOffsetGainInfo.defaultQueue
            }),
            buyQueue: profitPercentCalculator({
                costWithSign: totalCostObj.totalCostByBestPrices,
                gainWithSign: totalOffsetGainInfo.buyQueue
            })
        } 

        const profitPercentByInsertedPrices ={
            defaultQueue: profitPercentCalculator({
                costWithSign: totalCostObj.totalCostByInsertedPrices,
                gainWithSign: totalOffsetGainInfo.defaultQueue
            }),
            buyQueue: profitPercentCalculator({
                costWithSign: totalCostObj.totalCostByInsertedPrices,
                gainWithSign: totalOffsetGainInfo.buyQueue
            })
        } 



       
        const {settlementProfitByBestPrices,settlementProfitByInsertedPrices} = settlementProfitCalculator({strategyPositions:strategyPositions,stockPrice,nokoolOrNoRequestFactor});

        return {
            profitPercentByBestPrices,
            profitPercentByInsertedPrices,
            settlementProfitByBestPrices,
            settlementProfitByInsertedPrices
            
        }

    }


}

let calcProfitOfStrategyVersion = 0;
let prevCalcProfitOfStrategyTimeout;

export const calcProfitOfStrategy = async (_strategyPositions) => {

    const version = ++calcProfitOfStrategyVersion;

    clearTimeout(prevCalcProfitOfStrategyTimeout);

    const profitCalculator =
        STRATEGY_NAME_PROFIT_CALCULATOR[
            _strategyPositions[0].getStrategyType() || 'OTHERS'
        ];

    if (!profitCalculator)
        return;

    // صبر می‌کنیم قیمت در UI بنشیند
    await new Promise(resolve => setTimeout(resolve, 200));

    // اگر در این 200ms درخواست جدیدتری آمده،
    // این اجرای قدیمی دیگر حق ادامه ندارد
    if (version !== calcProfitOfStrategyVersion)
        return;

    const {
        profitPercentByBestPrices,
        profitPercentByInsertedPrices,
        settlementProfitByBestPrices,
        settlementProfitByInsertedPrices
    } = profitCalculator({
        strategyPositions: _strategyPositions
    });

    // دوباره چک می‌کنیم، برای احتیاط
    if (version !== calcProfitOfStrategyVersion)
        return;

    const isProfitable = informForExpectedProfitOnStrategy({
        _strategyPositions,
        profitPercentByBestPrices,
        profitPercentByInsertedPrices,
        settlementProfitByBestPrices,
        settlementProfitByInsertedPrices
    });

    

    if (isProfitable) {
        prevCalcProfitOfStrategyTimeout = setTimeout(() => {
            calcProfitOfStrategy(_strategyPositions);
        }, 5000);
    }

    return isProfitable;
};


const higherQuantityOfInsertedOrderInformer = ({ orderModalQuantityGetter, informer, informCleaner })=>{
    if (!strategyPositions[0].ordersModal) return


    strategyPositions.forEach(strategyPosition=>{
        if (!strategyPosition?.ordersModal) return true

        const insertedQuantity = orderModalQuantityGetter(strategyPosition);
        const currentPortFolioQuantity = (strategyPosition.getCurrentPositionQuantity()/strategyPosition.getCSize());

        const isOrderModalInBuyingTab =  strategyPosition.ordersModal.querySelector('.-is-frontView.-is-buy');
        const isOrderModalInSellingTab =  strategyPosition.ordersModal.querySelector('.-is-frontView.-is-sell');
        
        if(!currentPortFolioQuantity){
            return informCleaner(strategyPosition);
        }

        if(strategyPosition.isBuy && isOrderModalInSellingTab && insertedQuantity>currentPortFolioQuantity){
            informer(strategyPosition);
        }else if(!strategyPosition.isBuy && isOrderModalInBuyingTab && insertedQuantity>currentPortFolioQuantity){
            informer(strategyPosition);
        }else{
            informCleaner(strategyPosition);
        }
        

    });
}


const highSumValueOfInsertedOrderInformer = ({ orderModalQuantityGetter,orderModalPriceGetter, informer, informCleaner })=>{
    if (!strategyPositions[0].ordersModal) return


    strategyPositions.forEach(strategyPosition=>{
        if (!strategyPosition?.ordersModal) return true

        const positionModalQuantity = orderModalQuantityGetter(strategyPosition);
        const positionModalPrice = orderModalPriceGetter(strategyPosition);

        const cSize = strategyPosition.getCSize()
        
        if(positionModalQuantity*positionModalPrice * cSize > 1000000000){
            informer(strategyPosition);
        }else{
            informCleaner(strategyPosition);
        }

    });
}

export const hasCurrentQuantityIssue = ({strategyPositions,currentQuantityGetter,strategyQuantityGetter})=>{


    let prevRatio;
    const hasQuantityIssue = strategyPositions.some(strategyPosition => {
        const currentQuantity = currentQuantityGetter(strategyPosition);
        const sumOfSameOptionStrategyQuantity = strategyPositions.filter(sp => sp.instrumentName === strategyPosition.instrumentName).reduce((sumOfQuantity, sp) => sumOfQuantity + strategyQuantityGetter(sp), 0);
        const ratio = currentQuantity / sumOfSameOptionStrategyQuantity;
        if(prevRatio!=null){
            return  prevRatio != ratio
        }else{
            prevRatio = ratio;
            return
        }
        
    });

    return hasQuantityIssue;

}


const quantityUnbalanceInformer = ({ orderModalQuantityGetter, informer, informCleaner }) => {


    const hasModalInsertedQuantityIssue = hasCurrentQuantityIssue({
        strategyPositions,
        currentQuantityGetter : orderModalQuantityGetter,
        strategyQuantityGetter :  (strategyPosition) => strategyPosition.getInsertedQuantity()

    });

    if (hasModalInsertedQuantityIssue) {
        strategyPositions.forEach(informer);
        return { hasIssue: true }
    } else {
        strategyPositions.forEach(informCleaner);
        return { hasIssue: false }
    }
}


const enterEvent = new KeyboardEvent("keydown", {
    key: "Enter",
    code: "Enter",
    keyCode: 13,
    // برای مرورگرهای قدیمی
    bubbles: true,
    cancelable: true
});


const observeTabClickOfOrderModal = () => {

    return strategyPositions.map(strategyPositionObj => {

        strategyPositionObj.observers.filter(observerInfoObj => ['tabClickOfOrderModal'].includes(observerInfoObj.key)).forEach(observerInfoObj => observerInfoObj.observer.disconnect())

        const tabsCntOfOrderModal = strategyPositionObj.ordersModal.querySelector('client-trade-ui-tabs');

        const tabClickOfOrderModalHandlerFactory = (ordersModal) => () => {

            


            const strategyDropdown = strategyPositionObj.getOrderModalStrategyDropdownElement();

            if (strategyDropdown && !strategyDropdown.querySelector('.ng-value-container .ng-value')) {
                strategyDropdown.dispatchEvent(enterEvent);
                strategyDropdown.dispatchEvent(enterEvent);
            }
            if (strategyPositionObj.getOrderModalQuantityInputElement().value === '') {

                setTradeModalQuantity(strategyPositionObj);
                // strategyPositionObj.getOrderModalQuantityInputArrowUpElement().click();
            }
            

        }

        const clickHandler = tabClickOfOrderModalHandlerFactory(strategyPositionObj.ordersModal)

        clickHandler();

        tabsCntOfOrderModal.addEventListener('click', clickHandler);

        const inputObserver = {
            disconnect() {
                
                tabsCntOfOrderModal.removeEventListener('click', clickHandler)
            }
        }

        let observers = strategyPositionObj.observers.filter(observerInfoObj => !['tabClickOfOrderModal'].includes(observerInfoObj.key));

        observers.push({
            key: 'tabClickOfOrderModal',
            observer: inputObserver
        });

        return {
            ...strategyPositionObj,
            observers
        }
    }
    )

}

const injectStyles = () => {

    const css = `
        
            section.-is-frontView.-is-sell client-instrument-best-limit-ui-option .-is-sell ,
            section.-is-frontView.-is-buy client-instrument-best-limit-ui-option .-is-buy {
                opacity: 0.5 !important;
            }


            client-option-strategy-estimation-layout .o-settings{
                height: 29px !important;
                min-height: 29px !important;
            }

            client-option-strategy-estimation-header{
                
                min-height: 28px !important;
            }
            .o-item-header{
                height: 27px !important;
            }

            client-option-strategy-estimation-chart > header{
                display: none !important;
            }


            .toast-bottom-left {
                bottom: 0px !important;
                left: 160px !important;
            }
            .c-toast{
                width: 201px !important;
            }

            .o-container .e-toastMessage{
                font-size: 9px !important;
            }

            .amin-bold {
                padding: 2px !important;
                border: 2px solid !important;
                background: #f7ff62;
            }
            .amin-bold--light {
                padding: 2px !important;
                border: 1px dashed !important;
                background: #c5d8ff;
            }


            client-instrument-price-position-row .-is-price .-is-clickable {
                width: 100%;
            }

            section.-is-buy  p , section.-is-sell p{
                background-color: transparent !important
            }


            client-instrument-price-position-row[orderside="Buy"] {
                background-color: rgb(160 ,218, 181,.6) !important
            }

            client-instrument-price-position-row[orderside="Sell"] {
                background-color: rgba(250, 174, 180, 0.6) !important
            }

            client-option-modal-trade-layout{
                width: 270px !important;
            }


            client-trade-ui-input-price-advance-compact #tabKey-optionTradePriceInput{
                padding-right : 9px !important;
            }

            client-option-modal-trade-layout .o-inModalWrapper{
                overflow: initial !important;
            }


            client-instrument-favorites-item-trade-panel .o-quantityContainer footer span{
                font-size: 17px !important;
            }
            client-instrument-favorites-item-trade-panel .o-priceContainer footer{
                flex-wrap: wrap !important;
            }
            client-instrument-favorites-item-trade-panel .o-priceContainer footer .-is-separator{
                display: none !important;
            }
            client-instrument-favorites-item-trade-panel  footer .e-operationModes{
                display: none !important;
            }


            client-option-reports-tabs c-k-tab-default:nth-child(3) button {
                color: green !important;
                text-shadow: 0 0 !important;
                font-size: 17px !important;
            }

            // client-trade-ui-input-quantity-advance-compact .o-rangeTooltipContainer{
            // 	display: none;
            // }

            .o-rangeTooltipContainer{
                display: none !important;
            }


            client-instrument-favorites-item-trade-panel main section div p.-is-firstCol {
                min-width: 170px !important;
            }

            .c-overlay {
                backdrop-filter: none !important;
            }

            client-option-strategy-estimation-header .e-title-input{
                width: 442px !important;
            }
            client-trade-ui-input-price-advance-compact .o-rangeButtonsContainer{
                display:none;
            }

            .higher-than-portfolio{
                border: 5px solid yellow !important;
            }
            .inserted-high-sum-value-error{
                border: 10px solid red !important;
            }
            .inserted-quantity-unbalance-error{
                border: 5px solid red !important;
            }
            .current-position-quantity-unbalance-error{
                border-bottom: 2px solid red !important;
            }
            client-option-instruments-favorites-item-header{
                background-color: #34396d !important;
            }
            client-option-instruments-favorites-item-header main{
                color: yellow !important;;
            }

            client-option-instruments-favorites-item-header  main > span{
                word-wrap: break-word !important;
                white-space: normal !important;  
                max-width: 100% !important;
                font-size: 14px !important;
                display: flex !important;
                column-gap: 20px !important;    
            }
        `;

    const style = domContextWindow.document.createElement("style");
    style.textContent = css;
    domContextWindow.document.head.appendChild(style);
}

const fillCurrentStockPriceByStrikes = (strategyPositions) => {

    const greaterThanStrikes =
        Math.max(...strategyPositions.map(sp => sp.strikePrice)) * 1.2;

    const stockPrice =
        strategyPositions
            .map(sp => instrumentExtraDataMap[sp.instrumentName]?.stockPrice)
            .find(price => price != null)
        || greaterThanStrikes;


    const baseInstrumentPriceInputEl =
        domContextWindow.document.querySelector('.current-stock-price');

    baseInstrumentPriceInputEl.value = stockPrice;
};

const  instrumentExtraDataMap = {};

const getAndSetInstrumentData = async (strategyPositions)=>{

    const strategyPositionWithInstrumentInfo = async (strategyPositions) => {

        const instIdInfoMap = await OMEXApi.getInstrumentInfoBySymbol(strategyPositions.map(stP=>stP.instrumentName));

        instIdInfoMap.forEach(instIdInfo=>{
            const strategyPosition = strategyPositions.find(stP=>stP.instrumentName===instIdInfo.instrumentName);
    
            const daysLeftToSettlement = strategyPosition.isOption ? Math.ceil((new Date(instIdInfo.psDate).valueOf() - Date.now()) / (24 * 60 * 60000)): null;
    
            instrumentExtraDataMap[instIdInfo.instrumentName] = {
                optionID : strategyPosition.isOption ?  instIdInfo.instrumentId: null,
                instrumentId: instIdInfo.instrumentId,
                cSize: strategyPosition.isOption ? instIdInfo.cSize: 1,
                stockPrice:strategyPosition.isOption ? instIdInfo.stockPrice: null,
                daysLeftToSettlement
            }

        });
        


        return strategyPositions

    }

    // const options = strategyPositions.filter(stP=>stP.isOption);


    await strategyPositionWithInstrumentInfo(strategyPositions);

    // const _strategyPositions = await Promise.all(
    //     strategyPositions.map(async (strategyPosition) => {

    //         return await strategyPositionWithInstrumentInfo(strategyPosition);
    //     })
    // );

    return strategyPositions

}

const lastCalculatedAvgPrices={}


export const calcAvgPricesByExecutenList =async ()=>{

    const requests = strategyPositions.map(async (strategyPosition) => {
        const instrumentID = strategyPosition.getInstrumentID();
        const averageInfo = await OMEXApi.calcAveragePrice(instrumentID);
        const avgPrice = averageInfo.averagePrice;
        console.log({
            [strategyPosition.instrumentName]:avgPrice,
            quantity:averageInfo.quantity
        });
        return {
            instrumentName: strategyPosition.instrumentName,
            instrumentID: instrumentID,
            quantity: averageInfo.quantity,
            avgPrice,
            strategyPosition: strategyPosition,
            
        };
    });

    const results = await Promise.all(requests);


    lastCalculatedAvgPrices.results= results;
    lastCalculatedAvgPrices.time = Date.now();
    console.log('همه نتایج:', results);
    console.log('strategyPosition:', strategyPositions);
    strategyPositions.some(strategyPosition=>{
        const foundCalcAvgPrice = results.find(result=>result.instrumentName===strategyPosition.instrumentName);

        const calcQuantity = Math.abs(foundCalcAvgPrice.quantity);
        const currentPositionQuantity = strategyPosition.getCurrentPositionQuantity()/strategyPosition.getCSize();
        if(calcQuantity!==currentPositionQuantity){
            const issueMessage = 'تعداد محاسبه شده یکی نیست'
            showToast(issueMessage,10000,'error');
        }
    });



}

export const showVariableMargin = async () => {

    const { variableMargin } = await OMEXApi.getVariableMargin();

    showToast(variableMargin.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }), 5000);
}

const getRecentCalculatedAvgPrices = ({instrumentId,instrumentName})=>{
    if (!lastCalculatedAvgPrices.results || !lastCalculatedAvgPrices.time || (Date.now() - lastCalculatedAvgPrices.time) > (60000 * 3)) return null
    if(!lastCalculatedAvgPrices.results.length) return 
    return lastCalculatedAvgPrices.results.find(avgInfo=>avgInfo.instrumentName===instrumentName)

}


const openModalOfAllPositionsRows = async (documentOfWindow=document) => {

    const _document  = documentOfWindow;

    const estimationPositionRowList = Array.from(_document.querySelectorAll('client-option-strategy-estimation-main .o-item-body'));


    for (const estimationPositionRow of estimationPositionRowList) {
        const openModalButton = estimationPositionRow.querySelector('.o-instrument-container button');
        if (!openModalButton?.click) continue;

        openModalButton.click();
        await new Promise(r => setTimeout(r, 300)); 
        
    }
   
}

const openWindowAndSelectGroup = (groupTitle,_origin=origin) => {

    const { promise, resolve, reject } = createDeferredPromise();
    const newWindow = window.open(`${_origin}/#/stock/derivative/main/strategy-estimation?GSTitle=${groupTitle}`);

    if (!newWindow) {
        alert('پنجره توسط مرورگر مسدود شد!');
        return;
    }

    newWindow.onload = function () {
        setTimeout(async function () {
            try {
                const groupTab = await waitForElement(newWindow.document,()=>newWindow.document.querySelector('c-k-tab-default:nth-child(4) button'),60000);
                groupTab.click();
                await waitForElement(newWindow.document,()=>newWindow.document.querySelector('client-option-positions-layout client-option-positions-main client-grid .ag-body-viewport div[comp-id]'),60000);
                await new Promise(r => setTimeout(r, 100));
                newWindow.document.querySelector('c-k-filter-button button').click();
                await new Promise(r => setTimeout(r, 100));

                const groupSearchBox = newWindow.document.querySelector('client-option-positions-filter-bar ng-select[placeholder="انتخاب گروه"]');
                groupSearchBox.querySelector('input').value = groupTitle;
                groupSearchBox.querySelector('input').dispatchEvent(new Event('input', { bubbles: true }));
                await new Promise(r => setTimeout(r, 100));
                groupSearchBox.querySelector('ng-dropdown-panel .ng-option:first-child').click();

                resolve(newWindow);

            } catch (e) {
                
                console.error('خطا در دسترسی به پنجره:', e);
                reject(new Error("خطایی رخ داد"));

            }
        }, 200); // تأخیر برای اطمینان از رندر شدن UI
    };

    return promise
}


const setTradeModalUiPositions = ({strategyPositions}={}) => {

    let left = 1200;
    const top = 55;

    const setPosition = ({tradeModal,index,isOption})=>{
        tradeModal.style.left =`${left}px`;
        tradeModal.style.top =`${top}px`;
        !isOption && tradeModal.style.setProperty('width', '350px', 'important');

        left-= (tradeModal.offsetWidth + 1);

        index===1 &&  (left-=330)

    }
    if(strategyPositions){
        strategyPositions.forEach((strategyPosition,i)=>{
            setPosition({tradeModal:strategyPosition.ordersModal,index:i,isOption:strategyPosition.isOption});
        });

    }else{
        Array.from(domContextWindow.document.querySelectorAll('client-modal-main client-option-modal-trade-layout')).forEach((tradeModal,i) => {
            setPosition({tradeModal,index:i,isOption:true})
        });
    }
}

const getStrategyName = ()=>{
    return domContextWindow.document.querySelector('client-option-strategy-estimation-header c-k-input-text input')?.value
}

const setStrategyTitleOnUrl = ({strategyTitle,_window=domContextWindow}) => {
    if (!strategyTitle) return

    const hash = _window.location.hash;

    const [route, query = ''] = hash.split('?');

    const params = new URLSearchParams(query);
    params.set('GSTitle', strategyTitle);

    _window.history.replaceState(
        null,
        '',
        _window.location.pathname +
        _window.location.search +
        route +
        '?' +
        params.toString()
    );

}

const getAndSetStrategyTitleOnUrl = ()=>{

    const strategyTitle = getStrategyName();
    setStrategyTitleOnUrl({strategyTitle});
}



export const openGroupInNewTab = async ({ groupName, _origin, groups, optionPortfolioList,stockPortfolioList, strategies }) => {


    const childWindow = await openWindowAndSelectGroup(groupName,_origin);
    

    const { strategyRowLength,strategyTitle } = await OMEXApi.selectStrategy({documentOfWindow:childWindow.document,groups, optionPortfolioList,stockPortfolioList, strategies});

    setStrategyTitleOnUrl({strategyTitle,_window:childWindow});


    await waitForElement(childWindow.document, () => {
        const openModalButtnList = childWindow.document.querySelectorAll('client-option-strategy-estimation-main .o-item-body .o-instrument-container button:first-child');
        return strategyRowLength ? (openModalButtnList.length === strategyRowLength) : openModalButtnList

    }, 60000);

    // await new Promise(r => setTimeout(r, 5000));


    await openModalOfAllPositionsRows(childWindow.document);


    childWindow.document.querySelector('c-k-filter-button button').click();

    setTradeModalUiPositions();

    return childWindow

    // await new Promise(r => setTimeout(r, 1000));

    // Run(childWindow)

}

export const openAllGroupsInNewTabs = async ()=>{

    const groups = await OMEXApi.getGroups();

    const optionPortfolioList = await OMEXApi.getOptionPortfolioList();
    const stockPortfolioList = await OMEXApi.getStockPortfolioList();
    
    const strategies = await OMEXApi.getCustomerOptionStrategyEstimationWithItems();

    // for (const group of groups.slice(0, 10)) {
    for (const group of groups) {

        openGroupInNewTab({
            groupName:group.name, 
            groups, 
            optionPortfolioList,
            stockPortfolioList,
            strategies
        });
        await new Promise(r => setTimeout(r, 100));
        
    }

}

export const enrichGroupByStrategyInfo = async ()=>{

    const groups = await OMEXApi.getGroups();

    const optionPortfolioList = await OMEXApi.getOptionPortfolioList();
    const stockPortfolioList = await OMEXApi.getStockPortfolioList();
    
    const strategies = await OMEXApi.getCustomerOptionStrategyEstimationWithItems();

  

    const stockPriceList = await OMEXApi.getStockPricesData(optionPortfolioList.map(asset=>asset.baseInstrumentId));


    return groups.map(group=>{

        const strategy  = OMEXApi.findStrategyOfGroup({group,strategies,optionPortfolioList,stockPortfolioList});

        if(!strategy){
            showToast(`استراتژی یافت نشد`);
            console.log(`${group.name}`)
            return {...group,strategy}
        }

        strategy.items = strategy.items.map(strategyitem => {
            return {
                ...strategyitem,
                strategyTitle: strategy.title,
                portfolioAssetInfo: optionPortfolioList.find(p => p.instrumentId === strategyitem.instrumentId) || stockPortfolioList.find(p => p.instrumentId === strategyitem.instrumentId)
            }
        });
        const baseInstrumentId = strategy.items.find(
            item => item.portfolioAssetInfo?.baseInstrumentId
        )?.portfolioAssetInfo.baseInstrumentId;


        strategy.baseInstrumentId = baseInstrumentId;
        strategy.strategyPositions = createPositionObjectArray(strategy.items);
        strategy.stockPrice = stockPriceList.find(asset=>asset.instrumentId===baseInstrumentId)?.pDrCotVal;
        strategy.daysLeftToSettlement = strategy.strategyPositions.find(sp => sp.getDaysLeftToSettlement() !== null)?.getDaysLeftToSettlement();
        strategy.exerciseCost = calculateExerciseCost({strategyPositions:strategy.strategyPositions,stockPrice:strategy.stockPrice});

        return {...group,strategy}
    });

}


export const getSummaryNameOfStrategy = () => {


    const instrumentNames = strategyPositions.map(strategyPosition=>strategyPosition.instrumentName);

    const map = {};
    const noNumberItems = [];

    instrumentNames.forEach(item => {
        const match = item.match(/^(\D+)(\d+)$/);

        // اگه عدد نداشت
        if (!match) {
            noNumberItems.push(item);
            return;
        }

        const [, prefix, num] = match;

        if (!map[prefix]) {
            map[prefix] = [];
        }
        map[prefix].push(num);
    });

    const result = [
        ...Object.entries(map).map(
            ([prefix, nums]) => `${prefix}${nums.join('-')}`
        ),
        ...noNumberItems
    ].join('-');

    return result

}

export const createGroupOfCurrentStrategy = async ()=>{

    try {

        const response = await OMEXApi.createGroup({
            name: getSummaryNameOfStrategy(),
            instrumentIds: strategyPositions.map(strategyPosition=>strategyPosition.getInstrumentID())
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json(); 
        console.log('Data received:', data);

        showToast('گروه ایجاد شد');
        groupLogger?.collect && groupLogger.collect({isForce:true});

        const { sum, areNotInGroups } = await OMEXApi.getSumOfPositionsOfGroups();
        if(areNotInGroups?.length){
            const issueMessage = 'در گروه نیستن'
            showToast(issueMessage,10000,'error');
            console.log({sum,areNotInGroups});
            showNotification({
                title: issueMessage,
                body: `${areNotInGroups.map(instrumentName => instrumentName).join('-')}`,
                tag: `areNotInGroups`
            });
        }
        
    } catch (error) {
        console.error('Fetch operation failed:', error);

        console.error('Failed to fetch user data:', error);
        const issueMessage = 'خطا در درخواست ساخت گروه'
        showToast(issueMessage,10000,'error');

        showNotification({
                title: issueMessage,
                body: `${strategyPositions.map(instrumentName => instrumentName).join('-')}`,
                tag: `createGroupError`
        });
        
    }
   
    takeScreenshot();
}

export function showToast(message, duration = 2000,type ='default') {
  let toast = domContextWindow.document.getElementById('omex-plus-toast');

  if (!toast) {
    toast = domContextWindow.document.createElement('div');
    toast.id = 'omex-plus-toast';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: black;
      color: white;
      padding: 8px 12px;
      z-index: 9999;
    `;
    domContextWindow.document.body.appendChild(toast);
  }
    if (type === 'error') {
        toast.style.background = 'red';
        toast.style.top = 'auto'
        toast.style.bottom = '20px';
    } else {
        toast.style.background = 'black';
        toast.style.top = '20px';
        toast.style.bottom = 'auto';

    }


  toast.textContent = message;
  toast.style.display = 'block';

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.display = 'none';
  }, duration);
}

export let strategyPositions;


let domContextWindow = window;

const setTradeModalQuantityOfAllTradeModals = () => {

    for (const strategyPosition of strategyPositions) {

        setTradeModalQuantity(strategyPosition)

    }

}
const setTradeModalQuantity = (strategyPosition) => {

    const cSize = strategyPosition.getCSize();

    const quantity = sumOfQuantityOfSamePosition(strategyPosition,strategyPositions) / cSize;
    strategyPosition.getOrderModalQuantityInputElement().value = quantity;
    strategyPosition.getOrderModalQuantityInputElement().dispatchEvent(new Event('input', { bubbles: true }));

}


const setDaysFromToday= () => {

    const daysFromTodayInput = domContextWindow.document.querySelector('[formcontrolname="daysFromToday"] input');
    if(!daysFromTodayInput) {
        console.error('daysFromTodayInput not found!');
        return 
    }
    daysFromTodayInput.value = 100;
    daysFromTodayInput.dispatchEvent(new Event('input', { bubbles: true }));

}


const preventWhellScrollOnChart = ()=>{

    function preventWheel(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation(); // برای امنیت بیشتر
        return false;
    }
    
    
    domContextWindow.document.querySelector('client-option-strategy-estimation-chart').addEventListener('wheel', preventWheel, { passive: false, capture: true });
}
const setModalHeaders = (strategyPositions)=>{

     for (const strategyPosition of strategyPositions) {

        const headerTitleElement  = strategyPosition.ordersModal.querySelector('client-option-instruments-favorites-item-header main > span');

        if(strategyPosition.getDaysLeftToSettlement()!=null){

            headerTitleElement.innerHTML = `<span>${strategyPosition.strikePrice}</span><span>${strategyPosition.getDaysLeftToSettlement()} روز</span>`
        }

     }
}

export function sendToBackground(data) {
    window.postMessage({
        source: 'OMEX_PAGE_TO_EXTENSION',
        ...data
    }, '*');
}



export const checkCalculatedAvgPriceMismatchForAll = async ()=>{

    const {optionsWithAvgPrice:portfolioOptionsWithAvgPricesList , stocksWithAvgPrice:portfolioStocksWithAvgPrices} = await OMEXApi.calcAveragePriceForAll();

    const allCalcPortfolioList = [...portfolioOptionsWithAvgPricesList,...portfolioStocksWithAvgPrices.filter(stock=>!OMEXApi.isAutomaticFreeETF(stock.instrumentId))]
    let hasIssue = false;
    const priceMismatchIssueList =[];
    const quantityMismatchIssueList =[];

    for (let optionWithAvgInfo of allCalcPortfolioList) {
        
        const hasPriceMismatchIssue = hasSignificantPriceMismatch(optionWithAvgInfo.calculatedAverageInfo.averagePrice,optionWithAvgInfo.executedPrice);
        const hasQuantityIssue = optionWithAvgInfo.calculatedAverageInfo.quantity!== optionWithAvgInfo.count;

        if(hasPriceMismatchIssue){
            console.log('hasPriceMismatchIssue' , optionWithAvgInfo);
            priceMismatchIssueList.push(optionWithAvgInfo);
            hasIssue = true;
        }
        if(hasQuantityIssue){
            console.log('hasQuantityIssue' , optionWithAvgInfo);
            quantityMismatchIssueList.push(optionWithAvgInfo);
            hasIssue = true;
        }

    }


    if (hasIssue) {

        showNotification({
            title: 'مشکل میانگین و تعداد محاسباتی',
            body: ``,
            requireInteraction: true,
            tag: `checkCalculatedAvgPriceMismatchForAll`
        });
    }else{
        showToast('میانگین درسته');
        console.log('checkCalculatedAvgPriceMismatchForAll is ok!');
    }


    sendToBackground({
        type: "calculatedAvgPriceMismatchForAllResult",
        payload: {
            priceMismatchIssueList,
            quantityMismatchIssueList,
            hasIssue

        }
    })


}


export const Run = async (_window = window) => {

    try {
        if (typeof strategyPositions !== 'undefined') {
            strategyPositions.forEach(strategyPosition => {
                strategyPosition.observers.map(observerInfoObj => observerInfoObj?.observer.disconnect());

            }
            );
        }
    } catch (error) {

    }

    domContextWindow = _window
    
    strategyPositions = createPositionObjectArray(Array.from(domContextWindow.document.querySelectorAll('client-option-strategy-estimation-main .o-items .o-item-body')));


    injectStyles()

    strategyPositions = observePriceChanges();

    //  not needed and causes issue 
    // strategyPositions = observeMyOrderInOrdersModal();
    strategyPositions = observeInputBoxInRowOfStrategy();
    strategyPositions = observeInputQuantityOfOrderModal();
    strategyPositions = observeTabClickOfOrderModal();
    strategyPositions = observePortfolioQuantityOfOrderModal();

    calcProfitOfStrategy(strategyPositions);


    calcOffsetProfitOfStrategyInformUntilNotProfit()



    getStrategyExpectedProfitCnt();
    createDeleteAllOrdersButton();

    stopDraggingWrongOfOrdersModals();

    

    setTradeModalQuantityOfAllTradeModals();

    setTradeModalUiPositions({strategyPositions});
    setDaysFromToday();

    initLoggers();
    preventWhellScrollOnChart();
    fillCurrentStockPriceByStrikes(strategyPositions);
    strategyPositions = await getAndSetInstrumentData(strategyPositions);

    fillCurrentStockPriceByStrikes(strategyPositions);


    calcProfitOfStrategy(strategyPositions);


    startMarketCountdown();


    getAndSetStrategyTitleOnUrl();

    setModalHeaders(strategyPositions);


    
    console.log(strategyPositions);


}

// Run();








