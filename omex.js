
import { COMMISSION_FACTOR,isTaxFree,getCommissionFactor,mainTotalOffsetGainCalculator,getNearSettlementPrice,totalCostCalculator ,
    profitPercentCalculator,totalCostCalculatorForPriceTypes,
    settlementProfitCalculator,
    getReservedMarginOfEstimationQuantity,
    showNotification,
    createDeferredPromise,
    waitForElement,
    takeScreenshot,
    isETF} from './common.js';
import { isInstrumentNameOfOption,  OMEXApi } from './omexApi.js';


export   {OMEXApi} from './omexApi.js'

export { configs } from './common.js';

import './desktopNotificationCheck.js'
import { createIntervalLogger } from './createIntervalLogger.js';

export {silentNotificationForMoment} from './common.js'; 



let strategyLogger,portfolioLogger;




const initLoggers = () => {

    try {

        strategyLogger = createIntervalLogger({
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

// FIXME:expectedProfitPerMonth is factor but minExpectedProfitOfStrategy is percent
export let expectedProfit = {
    expectedProfitPerMonth: 1.04,
    minExpectedProfitOfStrategy: 3.9,
    currentPositions: 1.4
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
        doubleCheckProfitByExactDecimalPricesOfPortFolio(strategyPositions,true)
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

const stopDraggingWrongOfOrdersModals =()=>{

    strategyPositions.forEach(strategyPosition => {

        strategyPosition.ordersModal.querySelector('client-instrument-favorites-item-main').addEventListener("mousedown", (e) => {
            e.stopPropagation();
        });

    })



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

    currentStockPriceInput.style.cssText += `border: 1px solid #EEE;`
    parent.append(currentStockPriceInput)
    parent.append(cnt)

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





const totalOffsetGainNearSettlementOfEstimationPanel = ({ strategyPositions }) => {

    const getBestPriceCb = (_strategyPosition) => getNearSettlementPrice({strategyPosition: _strategyPosition, stockPrice:_strategyPosition.getBaseInstrumentPriceOfOption()});

    const totalOffsetGainNearSettlement = mainTotalOffsetGainCalculator({
        strategyPositions,
        getBestPriceCb,
        getReservedMargin: _strategyPosition => {
            return getReservedMarginOfEstimationQuantity(_strategyPosition)
        }
    });

    return totalOffsetGainNearSettlement
}

const sumOfQuantityOfSamePosition = (position,strategyPositions)=>{

    return strategyPositions.filter(_position => _position.instrumentName === position.instrumentName).reduce((_sumOfQuantityInEstimationPanel, position) => _sumOfQuantityInEstimationPanel + position.getQuantity(), 0);

}

const totalOffsetGainOfCurrentPositionsCalculator = ({ strategyPositions }) => {



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

    return {
        byOffsetOrderPrices: totalOffsetGainByOffsetOrderPrices,
        byOpenMoreOrderPrices: totalOffsetGainByOpenMoreOrderPrices,
        byInsertedPrices: totalOffsetGainByInsertedPrices,
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



const totalSettlementGainByEstimationQuantity = (_strategyPositions, stock, sellType) => {

    const totalSettlementGainCalculator = (__strategyPositions, stock, stockPrice, sellType) => {
        return __strategyPositions.reduce((sum, _position) => {

            const strikePrice = _position.strikePrice;

            let gain;

            let commissionFactor;
            if (_position.isBuy || !stockPrice) {
                gain = strikePrice;
                commissionFactor = settlementCommissionFactor(_position);
            } else if (stockPrice && sellType === 'MIN') {

                if (strikePrice <= stockPrice) {
                    gain = strikePrice;
                    commissionFactor = settlementCommissionFactor(_position);
                } else {
                    gain = stockPrice;
                    commissionFactor = settlementCommissionFactor(stock);
                }
            } else if (stockPrice && sellType === 'MAX') {
                if (strikePrice >= stockPrice) {
                    gain = strikePrice;
                    commissionFactor = settlementCommissionFactor(_position);
                } else {
                    gain = stockPrice;
                    commissionFactor = settlementCommissionFactor(stock);
                }
            }

            const isBuy = _position.isBuy;
            const quantity = _position.getQuantity();
            const sign = isBuy ? _position.isCall ? -1 : 1 : _position.isCall ? 1 : -1;

            const gainWithSideSign = gain * sign;

            const reservedMargin = getReservedMarginOfEstimationQuantity(_position);

            const _totalGain = (gainWithSideSign * quantity) + reservedMargin - (gain * quantity * commissionFactor);
            return sum + _totalGain
        }
            , 0);
    }

    const totalGainByBestPrices = totalSettlementGainCalculator(_strategyPositions, stock, stock ? (stock.getBestOffsetPrice() || stock.getBestOpenMorePrice() || stock.getInsertedPrice()) : null, sellType)
    const totalGainByInsertedPrices = totalSettlementGainCalculator(_strategyPositions, stock, stock ? (stock.getBestOffsetPrice() || stock.getBestOpenMorePrice() || stock.getInsertedPrice()) : null, sellType)

    return {
        totalGainByBestPrices: Math.floor(totalGainByBestPrices),
        totalGainByInsertedPrices: Math.floor(totalGainByInsertedPrices)
    }

}



const MARGIN_CALC_TYPE = {
    BY_CURRENT_POSITION: "BY_CURRENT_POSITION",
    BY_GIVEN_PRICE: "BY_GIVEN_PRICE"
}

let lastCheckProfitByExactDecimalPricesOfPortFolio={
};


const calcProfitLossByExactDecimalPricesOfPortFolio = async (_strategyPositions)=>{

    const portfolioList = await OMEXApi.getOptionPortfolioList();
    const stockPortfolioList  = await OMEXApi.getStockPortfolioList();
    lastCheckProfitByExactDecimalPricesOfPortFolio.portfolioList = portfolioList;
    lastCheckProfitByExactDecimalPricesOfPortFolio.stockPortfolioList = stockPortfolioList;
    const getAvgPrice =(position)=>{

        let currentPortfolioPosition= findPositionInfoByGivenPortfolio(position,[...portfolioList,...stockPortfolioList]);

        if(!currentPortfolioPosition) return null

        return currentPortfolioPosition.executedPrice
        
    }



    const totalCostOfChunkOfEstimationQuantity = totalCostCalculatorForPriceTypes(_strategyPositions,getAvgPrice).totalCostOfChunkOfEstimationQuantity;

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


const doubleCheckProfitByExactDecimalPricesOfPortFolio  =async (_strategyPositions,isForce)=>{
    if(!isForce  && lastCheckProfitByExactDecimalPricesOfPortFolio.time && (Date.now() - lastCheckProfitByExactDecimalPricesOfPortFolio.time)<60000 ) return lastCheckProfitByExactDecimalPricesOfPortFolio.isGood
    lastCheckProfitByExactDecimalPricesOfPortFolio.time = Date.now();
    

    const {totalOffsetGainOfChunkOfEstimation,
        profitLossByOffsetOrdersPercent,
        totalCostOfChunkOfEstimationQuantity} = await calcProfitLossByExactDecimalPricesOfPortFolio(_strategyPositions)

    const isGood = profitLossByOffsetOrdersPercent > (expectedProfit?.currentPositions || 1);


    lastCheckProfitByExactDecimalPricesOfPortFolio.isGood =isGood;

    if(!isGood){

        showNotification({
                title: 'مشکل با محاسبه قیمت میانگین',
                body: `${strategyPositions.map(_strategyPosition => _strategyPosition.instrumentName).join('-')}`,
                tag: `${strategyPositions[0].instrumentName}-doubleCheckProfitByExactDecimalPricesOfPortFolio`
        });
    }

    

    checkStrategyInProfit(_strategyPositions)

    return isGood

}

const showCurrentStrategyPositionState = ({totalCurrentPositionCost,totalOffsetGainOfCurrentPositionObj,
    profitLossByOffsetOrdersPercent,profitLossByInsertedPricesPercent,unreliableTotalCostOfCurrentPositions})=>{


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
const findPositionInfoByGivenPortfolio = (position,portfolioList) => {
    let currentPortfolioPosition = portfolioList.find(currentPortfolioPosition => position.instrumentId ? currentPortfolioPosition.instrumentId === position.instrumentId : currentPortfolioPosition.instrumentName === position.instrumentName)

    return currentPortfolioPosition

}


const checkStrategyInProfit = async (_strategyPositions)=>{

    const {
        totalCurrentPositionCost,
        totalOffsetGainOfCurrentPositionObj,
        profitLossByOffsetOrdersPercent,
        profitLossByInsertedPricesPercent,
        unreliableTotalCostOfCurrentPositions } = calcOffsetProfitOfStrategy(_strategyPositions);

       
        

    showCurrentStrategyPositionState({
        totalCurrentPositionCost,totalOffsetGainOfCurrentPositionObj,
        profitLossByOffsetOrdersPercent,profitLossByInsertedPricesPercent,
        unreliableTotalCostOfCurrentPositions});
    

    let hasProfit = await checkProfitPercentAndInform({strategyPositions:_strategyPositions,profitLossByOffsetOrdersPercent});
    

    return hasProfit

}
export const calcOffsetProfitOfStrategy = (_strategyPositions) => {


    let getAvgPrice;
    if(lastCheckProfitByExactDecimalPricesOfPortFolio?.portfolioList?.length &&   lastCheckProfitByExactDecimalPricesOfPortFolio.time && (Date.now() - lastCheckProfitByExactDecimalPricesOfPortFolio.time)<60000 ){
        getAvgPrice =(position)=>{

            let currentPortfolioPosition= findPositionInfoByGivenPortfolio(position,[...lastCheckProfitByExactDecimalPricesOfPortFolio.portfolioList,...lastCheckProfitByExactDecimalPricesOfPortFolio.stockPortfolioList]);

            if(!currentPortfolioPosition) return null

            return currentPortfolioPosition.executedPrice
        
        }
    }

    const totalCostInfoObj = totalCostCalculatorForPriceTypes(_strategyPositions,getAvgPrice);

    const totalCurrentPositionCost = totalCostInfoObj.totalCostOfCurrentPositions;
    const unreliableTotalCostOfCurrentPositions = totalCostInfoObj.unreliableTotalCostOfCurrentPositions;
    const totalCostOfChunkOfEstimationQuantity = totalCostInfoObj.totalCostOfChunkOfEstimationQuantity;

    const totalOffsetGainOfChunkOfEstimation = totalOffsetGainOfChunkOfEstimationQuantityCalculator({
        strategyPositions: _strategyPositions
    });

    const totalOffsetGainOfCurrentPositionObj = totalOffsetGainOfCurrentPositionsCalculator({
        strategyPositions: _strategyPositions
    });



    

    let profitLossByOffsetOrdersPercent = profitPercentCalculator({
        costWithSign: totalCostOfChunkOfEstimationQuantity,
        gainWithSign: totalOffsetGainOfChunkOfEstimation.byOffsetOrderPrices
    });

    let profitLossByInsertedPricesPercent = profitPercentCalculator({
        costWithSign: totalCostOfChunkOfEstimationQuantity,
        gainWithSign: totalOffsetGainOfChunkOfEstimation.byInsertedPrices
    });


    return {
        totalCurrentPositionCost,
        totalOffsetGainOfCurrentPositionObj,
        profitLossByOffsetOrdersPercent,
        profitLossByInsertedPricesPercent,
        unreliableTotalCostOfCurrentPositions

    }


}

const checkProfitPercentAndInform =async ({strategyPositions,profitLossByOffsetOrdersPercent})=>{

    let hasProfit=false
    if (profitLossByOffsetOrdersPercent > (expectedProfit?.currentPositions || 1)) {
        const isDoubleCheckOk = await doubleCheckProfitByExactDecimalPricesOfPortFolio(strategyPositions)
        if(!isDoubleCheckOk){
            hasProfit=false;
            uninformExtremeOrderPrice(strategyPositions, 'offset');
            return hasProfit
        } 

        hasProfit=true;

        informExtremeOrderPrice(strategyPositions, 'offset');

        showNotification({
            title: 'به سود رسید',
            body: `${strategyPositions.map(_strategyPosition => _strategyPosition.instrumentName).join('-')}`,
            tag: `${strategyPositions[0].instrumentName}-expectedProfitForCurrentPositionsPrecent`
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

const createPositionObjectArrayByElementRowArray = (assetRowLementList) => {
    return assetRowLementList.map(optionRowEl => {

        const instrumentName = optionRowEl.querySelector('.instrument-title span').innerHTML;
        let optionID = Array.from(domContextWindow.document.querySelectorAll('client-option-positions-main .ag-pinned-right-cols-container .ag-row'))?.find(optionNameCellEl => Array.from(optionNameCellEl.querySelectorAll('span'))?.find(span => span.innerHTML === instrumentName))?.getAttribute('row-id');
        const isBuy = optionRowEl.querySelector('client-option-strategy-estimation-main-ui-order-side .-isActive')?.classList?.contains('buy');

        const isOption = isInstrumentNameOfOption(instrumentName);

        const isPut = isOption && instrumentName && instrumentName.charAt(0) === 'ط';

        const isCall = isOption && instrumentName && instrumentName.charAt(0) === 'ض';
        let cSize = 1000;
        let daysLeftToSettlement =30;

        const ordersModal = Array.from(domContextWindow.document.querySelectorAll('client-option-modal-trade-layout')).find(modal => {
            return Array.from(modal.querySelectorAll('label')).find(label => label.innerHTML === instrumentName)
        }
        );

        const instrumentFullTitle = ordersModal && ordersModal.querySelector('client-option-instruments-favorites-item-header main > span').innerHTML;

        const getOffsetOrderPriceElements = () => (ordersModal && ordersModal.querySelectorAll(`client-instrument-best-limit-ui-option client-instrument-price-position-row[orderside="${isBuy ? 'Buy' : 'Sell'}"] .-is-price span`)) || [];

        const getOpenMoreOrderPriceElements = () => (ordersModal && ordersModal.querySelectorAll(`client-instrument-best-limit-ui-option client-instrument-price-position-row[orderside="${isBuy ? 'Sell' : 'Buy'}"] .-is-price span`)) || [];

        const getBestOffsetPrice = () => {
            const priceElement = getOffsetOrderPriceElements()[0];
            return priceElement && convertStringToInt(priceElement.innerHTML);
        }

        const getBestOpenMorePrice = () => {
            const priceElement = getOpenMoreOrderPriceElements()[0];
            return priceElement && convertStringToInt(priceElement.innerHTML);
        }

        const getQuantity = () => {
            const quantity = convertStringToInt(optionRowEl.querySelector('[formcontrolname="quantity"] input').value);
            const quantityMultiplier = isOption ? cSize : 1;
            return quantity * quantityMultiplier;
        }


        let cachedCurrentPositionQuantityElement;
        const getCurrentPositionQuantity = () => {

            cachedCurrentPositionQuantityElement = domContextWindow.document.body.contains(cachedCurrentPositionQuantityElement) ? cachedCurrentPositionQuantityElement : domContextWindow.document.querySelector(`client-option-positions-main .ag-center-cols-clipper [row-id="${optionID}"] [col-id="${isBuy ? 'buyCount' : 'sellCount'}"]`);

            let currentPositionQuantity
            if (cachedCurrentPositionQuantityElement) {
                currentPositionQuantity = convertStringToInt(cachedCurrentPositionQuantityElement?.innerHTML);
            } else {
                currentPositionQuantity = getOrderModalPortfolioQuantity();
            }

            const quantityMultiplier = isOption ? cSize : 1;
            return currentPositionQuantity * quantityMultiplier;

        }


        let cachedOrderModalPortfolioQuantityElement;
        const getOrderModalPortfolioQuantity = () => {
            cachedOrderModalPortfolioQuantityElement = domContextWindow.document.body.contains(cachedOrderModalPortfolioQuantityElement) ? cachedOrderModalPortfolioQuantityElement : ordersModal.querySelector('.o-quantityContainer footer span');
            return convertStringToInt(cachedOrderModalPortfolioQuantityElement?.innerHTML) || 0

        }
        let cachedOrderModalQuantityFooterElement
        const getOrderModalQuantityFooterElement = () => {
            if (!domContextWindow.document.body.contains(cachedOrderModalQuantityFooterElement)) {
                cachedOrderModalQuantityFooterElement = ordersModal.querySelector('.o-quantityContainer footer')
            }


            return cachedOrderModalQuantityFooterElement

        }

        let cachedOrderModalTradePanelElement
        const getOrderModalTradePanelElement = () => {
            if (!domContextWindow.document.body.contains(cachedOrderModalTradePanelElement)) {
                cachedOrderModalTradePanelElement = ordersModal.querySelector('client-instrument-favorites-item-trade-panel')
            }


            return cachedOrderModalTradePanelElement

        }


        let cachedOrderModalStrategyDropdownElement;
        const getOrderModalStrategyDropdownElement = ()=>{
            if (!domContextWindow.document.body.contains(cachedOrderModalTradePanelElement)) {
                cachedOrderModalStrategyDropdownElement = ordersModal.querySelector('client-instrument-favorites-item-trade-panel ng-select.-is-strategyDropdown');
            }


            return cachedOrderModalStrategyDropdownElement
        }


        


         let cachedOrderModalQuantityInputElement;
        const getOrderModalQuantityInputElement = ()=>{
            if (!domContextWindow.document.body.contains(cachedOrderModalQuantityInputElement)) {
                cachedOrderModalQuantityInputElement =ordersModal.querySelector('#tabKey-optionTradeQuantityInput');
            }


            return cachedOrderModalQuantityInputElement
        }



        
         let cachedOrderModalQuantityInputArrowUpElement;
        const getOrderModalQuantityInputArrowUpElement = ()=>{
            if (!domContextWindow.document.body.contains(cachedOrderModalQuantityInputArrowUpElement)) {
                cachedOrderModalQuantityInputArrowUpElement = ordersModal.querySelector('[iconname="arrow-up-filled"]');
            }


            return cachedOrderModalQuantityInputArrowUpElement
        }


         let cachedOrderModalPriceElement;
        const getOrderModalPriceInputElement = ()=>{
            if (!domContextWindow.document.body.contains(cachedOrderModalPriceElement)) {
                 cachedOrderModalPriceElement =ordersModal.querySelector('#tabKey-optionTradePriceInput');
            }

            return cachedOrderModalPriceElement
        }

        const getRequiredMargin = () => {

            const isMarginRequired = optionRowEl.querySelector('input[formcontrolname="requiredMarginIsSelected"]')?.checked;

            if (!isMarginRequired)
                return 0

            const requiredMargin = convertStringToInt(optionRowEl.querySelector('[formcontrolname="requiredMargin"] input').value) / cSize;

            return requiredMargin
        }

        const getInsertedPrice = () => {
            const insertedPrice = convertStringToInt(optionRowEl.querySelector('[formcontrolname="price"] input').value);
            return insertedPrice;
        }

        const getInsertedQuantity = () => {
            const insertedQuantity = convertStringToInt(optionRowEl.querySelector('[formcontrolname="quantity"] input').value);
            return insertedQuantity;
        }

        const calcBestSecondOrderPriceRatioDiff = (priceOrderElements) => {
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
            return calcBestSecondOrderPriceRatioDiff(chooseBestPriceType === 'offset' ? getOffsetOrderPriceElements() : getOpenMoreOrderPriceElements());
        }




        const getCurrentPositionAvgPrice = () => {
            const executedPriceSelector = `client-option-positions-main .ag-center-cols-clipper [row-id="${optionID}"] [col-id="executedPrice"]`;
            const breakEvenPriceSelector = `client-option-positions-main .ag-center-cols-clipper [row-id="${optionID}"] [col-id="breakEvenPrice"]`;
            const executedPrice = convertStringToInt(domContextWindow.document.querySelector(executedPriceSelector)?.innerHTML);
            const breakEvenPrice = convertStringToInt(domContextWindow.document.querySelector(breakEvenPriceSelector)?.innerHTML);
            const diffPrices = Math.abs(breakEvenPrice - executedPrice);
            const breakEvenPriceNumLength = breakEvenPrice.toString().length;
            const hasIssue = () => {
                if ((breakEvenPriceNumLength > 3) && ((diffPrices / executedPrice) > 0.03)) {
                    return true
                } else if ((breakEvenPriceNumLength < 3) && (diffPrices > 1)) {
                    return true
                }
                return false
            }
            if (executedPrice && breakEvenPrice && hasIssue()) {
                !domContextWindow.window.doNotNotifAvrageIssue && showNotification({
                    title: 'مشکل میانگین',
                    body: `${instrumentName}`,
                    tag: `${instrumentName}-CurrentPositionAvgPriceIssue`
                });
                return breakEvenPrice
            }

            return executedPrice || getUnreliableCurrentPositionAvgPrice()

        }


        let cachedUnreliableCurrentPositionAvgPriceElement;
        const getUnreliableCurrentPositionAvgPrice = () => {

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
            return domContextWindow.document.querySelector('client-option-strategy-estimation-header c-k-input-text input')?.value
        }

        const getBestOpenMorePriceWithSideSign = () => {
            const bestOpenMorePrice = getBestOpenMorePrice();
            if (!bestOpenMorePrice)
                return
            return bestOpenMorePrice * (isBuy ? -1 : 1);
        }

        const strikePrice = convertStringToInt(domContextWindow.document.querySelector(`client-option-positions-main .ag-center-cols-clipper [row-id="${optionID}"] [col-id="strikePrice"]`)?.innerHTML) || convertStringToInt(optionRowEl.querySelectorAll('.o-item-row > div')[5].innerHTML);
        

       

        const getStrategyType = () => {
            const strategyName = getStrategyName();
            if (!strategyName)
                return

            const strategyType = strategyName.split('@')[0];
            return 
            // return ['COVERED'].find(type => strategyType === type);
            // return ['BUCS_COLLAR', 'BUPS_COLLAR', 'BEPS_COLLAR', 'BUCS', 'BECS', 'BUPS', 'BEPS', 'BOX_BUPS_BECS', 'BOX', 'COVERED', 'GUTS', 'LongGUTS_STRANGLE', 'CALL_BUTT_CONDOR'].find(type => strategyType === type);
        }


        const getBaseInstrumentPriceOfOption = () => {


            const baseInstrumentPriceInputEl = domContextWindow.document.querySelector('.current-stock-price');

            return baseInstrumentPriceInputEl && convertStringToInt(baseInstrumentPriceInputEl.value);

        }

      


        let strategyPosition = {
            optionRowEl,
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
            getBaseInstrumentPriceOfOption,
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




const orderModalInputQuantityUnbalanceInformer = () => {


    setTimeout(() => {
        
        quantityUnbalanceInformer({
            orderModalQuantityGetter: (strategyPosition) => convertStringToInt(strategyPosition.getOrderModalQuantityInputElement()?.value),
            informer: (strategyPosition) => { 
                if(!strategyPosition.getOrderModalQuantityInputElement()) return 
                strategyPosition.getOrderModalQuantityInputElement().style.cssText = "border: 5px solid red" 
            },
            informCleaner: (strategyPosition) => { 
                if(!strategyPosition.getOrderModalQuantityInputElement()) return 
                strategyPosition.getOrderModalQuantityInputElement().style.border = '' 
            }
        });
        highSumValueOfInsertedOrderInformer({
            orderModalQuantityGetter: (strategyPosition) => convertStringToInt(strategyPosition.getOrderModalQuantityInputElement()?.value),
            orderModalPriceGetter: (strategyPosition) => convertStringToInt(strategyPosition.getOrderModalPriceInputElement()?.value),
            informer: (strategyPosition) => { 
                if(!strategyPosition.ordersModal) return 
                strategyPosition.ordersModal.querySelector('.o-inModalWrapper').style.border='10px solid red';
            },
            informCleaner: (strategyPosition) => { 
                if(!strategyPosition.ordersModal) return 
                strategyPosition.ordersModal.querySelector('.o-inModalWrapper').style.border='';
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
        eventNames.forEach(eventName => inputQuantityOfOrderModal.removeEventListener(eventName, orderModalInputQuantityUnbalanceInformer));
        eventNames.forEach(eventName => inputQuantityOfOrderModal.addEventListener(eventName, orderModalInputQuantityUnbalanceInformer));


        const eventNamesOnOrderModal =['click','mousedown','mouseup']

        eventNamesOnOrderModal.forEach(eventName => ordersModal.removeEventListener(eventName, orderModalInputQuantityUnbalanceInformer));
        eventNamesOnOrderModal.forEach(eventName => ordersModal.addEventListener(eventName, orderModalInputQuantityUnbalanceInformer));
        

        let lastClickTime = 0;
        const minInterval = 300;
        const mousemoveEventHandler = () => {
            const currentTime = new Date().getTime();
            if ((currentTime - lastClickTime) < minInterval)
                return
            lastClickTime = currentTime;
            orderModalInputQuantityUnbalanceInformer();

        }

        // TODO:FIXME: refactor this name and persist event handler code
        
        strategyPositionObj.mouseMoveOnOrderModalEventHandler && ordersModal.addEventListener('mousemove', strategyPositionObj.mouseMoveOnOrderModalEventHandler);
        ordersModal.addEventListener('mousemove', mousemoveEventHandler);
        strategyPositionObj.mouseMoveOnOrderModalEventHandler = mousemoveEventHandler;

        const inputObserver = {
            disconnect() {
                eventNames.forEach(eventName => inputQuantityOfOrderModal.removeEventListener(eventName, orderModalInputQuantityUnbalanceInformer));
                ordersModal.removeEventListener('click', orderModalInputQuantityUnbalanceInformer)
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
                calcProfitOfStrategy(strategyPositions, unChekcedPositions);
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

        const inputObserver = {
            disconnect() {
                rowInputPrice.removeEventListener('input', onChangeCb)
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

        return {
            ...strategyPositionObj,
            observers
        }
    }
    )

}


const observePortfolioQuantityOfOrderModal = () => {
    // TODO:FIXME: use domContextWindow.document.body.contains(...)


    let currentPositionQuantityUnbalanceInformerTimeout;
    

    const currentPositionQuantityUnbalanceInformer = () => {
        const hasIssue = quantityUnbalanceInformer({
            orderModalQuantityGetter: (strategyPosition) => strategyPosition.getOrderModalPortfolioQuantity(),
            informer: (strategyPosition) => {
                if(!strategyPosition?.getOrderModalQuantityFooterElement()) return  
                strategyPosition.getOrderModalQuantityFooterElement().style.cssText = "border-bottom: 2px solid red";

            },
            informCleaner: (strategyPosition) => {
                if(!strategyPosition?.getOrderModalQuantityFooterElement()) return  
                strategyPosition.getOrderModalQuantityFooterElement().style.cssText = ''
            }
        }).hasIssue;


        if (hasIssue) {
            showNotification({
                title: 'تعداد بالانس نیست',
                body: `${strategyPositions[0].instrumentName}`,
                tag: `${strategyPositions[0].instrumentName}-currentPositionQuantityUnbalance`
            });
            
            clearTimeout(currentPositionQuantityUnbalanceInformerTimeout);
            currentPositionQuantityUnbalanceInformerTimeout = setTimeout(currentPositionQuantityUnbalanceInformer, 40000);
        } else {
            clearTimeout(currentPositionQuantityUnbalanceInformerTimeout);
        }

        

    }


    return strategyPositions.map(strategyPositionObj => {

        strategyPositionObj.observers.filter(observerInfoObj => ['PortfolioQuantity', 'PortfolioQuantityMousemove'].includes(observerInfoObj.key)).forEach(observerInfoObj => observerInfoObj.observer.disconnect())

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
                    tag: `${strategyPositionObj.instrumentName}-PortfolioQuantityChange`,
                    requireInteraction: true

                });

                previousStoredPortfolioQuantity = newValue

                setTimeout(() => {
                    tradePanelElement.style.backgroundColor = '';

                    currentPositionQuantityUnbalanceInformer();
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
                        PortfolioQuantityObserver && PortfolioQuantityObserver.disconnect();
                        strategyPositions = observePortfolioQuantityOfOrderModal();
                    }

                    currentPositionQuantityUnbalanceInformer();

                }
                    , 100)

        }
        strategyPositionObj.ordersModal.querySelectorAll('client-trade-ui-tabs,[iconname="details-outlined"]').forEach(el => {
            strategyPositionObj.tabClickHandler && el.removeEventListener('click',strategyPositionObj.tabClickHandler )
            el.addEventListener('click',tabClickHandler );

            strategyPositionObj.tabClickHandler = tabClickHandler;
        });


        let lastClickTime = 0;
        const minInterval = 1000;
        const mousemoveEventHandler = () => {
            const currentTime = new Date().getTime();
            if ((currentTime - lastClickTime) < minInterval)
                return
            lastClickTime = currentTime;
            currentPositionQuantityUnbalanceInformer();

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

        let observers = strategyPositionObj.observers.filter(observerInfoObj => !['PortfolioQuantity', 'PortfolioQuantityMousemove'].includes(observerInfoObj.key));


        observers.push({
            key: 'PortfolioQuantityMousemove',
            observer: mouseMoveObserver
        });

        observers.push({
            key: 'PortfolioQuantity',
            observer: PortfolioQuantityObserver
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


let calcOffsetProfitOfStrategyInformUntilNotProfitTimeout;

const calcOffsetProfitOfStrategyInformUntilNotProfit = async () => {
    const isProfit = await checkStrategyInProfit(strategyPositions);
    if (isProfit) {
        clearTimeout(calcOffsetProfitOfStrategyInformUntilNotProfitTimeout);
        calcOffsetProfitOfStrategyInformUntilNotProfitTimeout = setTimeout(calcOffsetProfitOfStrategyInformUntilNotProfit, 10000);
    } else {
        clearTimeout(calcOffsetProfitOfStrategyInformUntilNotProfitTimeout);
    }
}

let calcProfitOfStrategyInformUntilNotProfitTimeout;

const calcProfitOfStrategyInformUntilNotProfit =async () => {
    const isProfit = await calcProfitOfStrategy(strategyPositions, unChekcedPositions);
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

const isProfitEnough = ({ totalProfitPercent, percentPerMonth }) => {
    if (expectedProfit?.strategy) {
        return totalProfitPercent > expectedProfit?.strategy
    }
    if (!percentPerMonth || !totalProfitPercent || totalProfitPercent <= expectedProfit.minExpectedProfitOfStrategy) return
    return percentPerMonth >= expectedProfit.expectedProfitPerMonth
}


const informForExpectedProfitOnStrategy = ({ _strategyPositions, profitPercentByBestPrices, profitPercentByInsertedPrices,settlementProfitByBestPrices,settlementProfitByInsertedPrices }) => {

    let statusCnt = getStrategyExpectedProfitCnt();

    statusCnt.innerHTML = `
        <div style="display:flex;flex-direction: column;row-gap: 13px;">
            <div style="display:flex;background: #f6faf3;border:1px solid ; padding: 3px;color:${profitPercentByBestPrices >= 0 ? 'green' : 'red'}">
                <div>
                            سرخط ${profitPercentByBestPrices.toLocaleString('en-US', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1
                        })}
                </div>
                ${settlementProfitByBestPrices ? `<div style="margin-right:auto;font-size: small; color:${settlementProfitByBestPrices >= 0 ? 'green' : '#db4848'}">
                        اعمال ${settlementProfitByBestPrices.toLocaleString('en-US', {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1
                    })}
                </div>`:''}
             </div>
            <div style="display:flex; font-size: 85%;color:${profitPercentByInsertedPrices >= 0 ? 'green' : 'red'}">

                <div>
                        اینپوت ${profitPercentByInsertedPrices.toLocaleString('en-US', {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1
                    })}
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



    const daysLeftToSettlement = _strategyPositions.find(_strategyPosition => _strategyPosition.daysLeftToSettlement)?.daysLeftToSettlement
    const percentPerDay = Math.pow((1 + (profitPercentByBestPrices / 100)), 1 / daysLeftToSettlement);
    const percentPerMonth = Math.pow(percentPerDay, 30);


    let isProfit=false;
    if (isProfitEnough({ totalProfitPercent: profitPercentByBestPrices, percentPerMonth })) {

        isProfit =true;
        informExtremeOrderPrice(_strategyPositions, 'openMore');
        showNotification({
            title: `سود %${profitPercentByBestPrices.toFixed()}`,
            body: `${_strategyPositions.map(_strategyPosition => _strategyPosition.instrumentName).join('-')}`,
            tag: `${_strategyPositions[0].instrumentName}-expectedProfitPrecent`
        });
    } else {
        isProfit =false;
        uninformExtremeOrderPrice(_strategyPositions);
    }

    return isProfit;
}

export const STRATEGY_NAME_PROFIT_CALCULATOR = {

    utils: {},

    BUCS(_strategyPositions, _unChekcedPositions) {

        const totalCostObj = totalCostCalculatorForPriceTypes(_strategyPositions);

        const stocks = _unChekcedPositions.filter(_unChekcedPosition => !_unChekcedPosition.isOption);
        if (stocks.length > 1)
            return 0
        const stock = stocks[0];

        const totalSettlementGainObj = totalSettlementGainByEstimationQuantity(_strategyPositions.filter(strategyPosition => !strategyPosition.getRequiredMargin()), stock, "MIN");

        const additionalSellPositions = _strategyPositions.filter(strategyPosition => strategyPosition.getRequiredMargin());

        const totalOffsetGainObjOfAdditionalSellPositions = totalOffsetGainNearSettlementOfEstimationPanel({
            strategyPositions: additionalSellPositions
        });

        const profitPercentByBestPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalSettlementGainObj.totalGainByBestPrices + totalOffsetGainObjOfAdditionalSellPositions
        });
        const profitPercentByInsertedPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByInsertedPrices,
            gainWithSign: totalSettlementGainObj.totalGainByInsertedPrices + totalOffsetGainObjOfAdditionalSellPositions
        });

        return {
            profitPercentByBestPrices,
            profitPercentByInsertedPrices
        }
    },
    BUCS_COLLAR(_strategyPositions, _unChekcedPositions) {

        const totalCostObj = totalCostCalculatorForPriceTypes(_strategyPositions);

        const buyOptions = _strategyPositions.filter(_strategyPosition => _strategyPosition.isBuy);

        const totalSettlementGainObj = totalSettlementGainByEstimationQuantity(buyOptions);



        const profitPercentByBestPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalSettlementGainObj.totalGainByBestPrices
        });
        const profitPercentByInsertedPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByInsertedPrices,
            gainWithSign: totalSettlementGainObj.totalGainByInsertedPrices
        });

        return {
            profitPercentByBestPrices,
            profitPercentByInsertedPrices
        }
    },
    BUPS_COLLAR(_strategyPositions, _unChekcedPositions) {

        const totalCostObj = totalCostCalculatorForPriceTypes(_strategyPositions);

        const puts = _strategyPositions.filter(_strategyPosition => _strategyPosition.isPut);

        const totalSettlementGainObj = totalSettlementGainByEstimationQuantity(puts);



        const profitPercentByBestPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalSettlementGainObj.totalGainByBestPrices
        });
        const profitPercentByInsertedPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByInsertedPrices,
            gainWithSign: totalSettlementGainObj.totalGainByInsertedPrices
        });

        return {
            profitPercentByBestPrices,
            profitPercentByInsertedPrices
        }
    },
    BEPS_COLLAR(_strategyPositions, _unChekcedPositions) {

        const totalCostObj = totalCostCalculatorForPriceTypes(_strategyPositions);

        const buyOptions = _strategyPositions.filter(_strategyPosition => _strategyPosition.isBuy);

        const totalSettlementGainObj = totalSettlementGainByEstimationQuantity(buyOptions);



        const profitPercentByBestPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalSettlementGainObj.totalGainByBestPrices
        });
        const profitPercentByInsertedPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByInsertedPrices,
            gainWithSign: totalSettlementGainObj.totalGainByInsertedPrices
        });

        return {
            profitPercentByBestPrices,
            profitPercentByInsertedPrices
        }
    },
    BECS(_strategyPositions) {
        const totalCostObj = totalCostCalculatorForPriceTypes(_strategyPositions);
        const totalOffsetGainNearSettlement = totalOffsetGainNearSettlementOfEstimationPanel({
            strategyPositions: _strategyPositions
        });

        const profitPercentByBestPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalOffsetGainNearSettlement
        });
        const profitPercentByInsertedPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByInsertedPrices,
            gainWithSign: totalOffsetGainNearSettlement
        });

        return {
            profitPercentByBestPrices,
            profitPercentByInsertedPrices
        }

    },
    BUPS(_strategyPositions) {
        const totalCostObj = totalCostCalculatorForPriceTypes(_strategyPositions);
        const totalOffsetGainNearSettlement = totalOffsetGainNearSettlementOfEstimationPanel({
            strategyPositions: _strategyPositions
        });

        const profitPercentByBestPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalOffsetGainNearSettlement
        });
        const profitPercentByInsertedPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByInsertedPrices,
            gainWithSign: totalOffsetGainNearSettlement
        });

        return {
            profitPercentByBestPrices,
            profitPercentByInsertedPrices
        }

    },
    BEPS(_strategyPositions) {

        const totalCostObj = totalCostCalculatorForPriceTypes(_strategyPositions);
        const totalGainObj = totalSettlementGainByEstimationQuantity(_strategyPositions);

        const profitPercentByBestPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalGainObj.totalGainByBestPrices
        });
        const profitPercentByInsertedPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByInsertedPrices,
            gainWithSign: totalGainObj.totalGainByInsertedPrices
        });

        return {
            profitPercentByBestPrices,
            profitPercentByInsertedPrices
        }
    },
    BOX(_strategyPositions) {

        const calOptions = _strategyPositions.filter(_strategyPosition => _strategyPosition.isCall);

        const totalCostObj = totalCostCalculatorForPriceTypes(_strategyPositions);
        const totalGainObj = totalSettlementGainByEstimationQuantity(calOptions);

        const profitPercentByBestPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalGainObj.totalGainByBestPrices
        });
        const profitPercentByInsertedPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByInsertedPrices,
            gainWithSign: totalGainObj.totalGainByInsertedPrices
        });

        return {
            profitPercentByBestPrices,
            profitPercentByInsertedPrices
        }

    },
    BOX_BUPS_BECS(_strategyPositions) {
        const calOptions = _strategyPositions.filter(_strategyPosition => _strategyPosition.isCall);
        const totalCostObj = totalCostCalculatorForPriceTypes(_strategyPositions);

        const totalGainObj = totalSettlementGainByEstimationQuantity(calOptions);

        const sellPosition = _strategyPositions.find(_strategyPosition => !_strategyPosition.isBuy)
        const reservedMarginOfOtherSell = getReservedMarginOfEstimationQuantity(sellPosition);


        const profitPercentByBestPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalGainObj.totalGainByBestPrices + reservedMarginOfOtherSell
        });
        const profitPercentByInsertedPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByInsertedPrices,
            gainWithSign: totalGainObj.totalGainByInsertedPrices + reservedMarginOfOtherSell
        });

        return {
            profitPercentByBestPrices,
            profitPercentByInsertedPrices
        }





    },
    COVERED(_strategyPositions) {
        const calOptions = _strategyPositions.filter(_strategyPosition => _strategyPosition.isCall);
        const putOptions = _strategyPositions.filter(_strategyPosition => _strategyPosition.isPut);

        const stocks = _strategyPositions.filter(_strategyPosition => !_strategyPosition.isOption);
        if (!stocks || stocks.length > 1)
            return 0
        const stock = stocks[0];

        const totalCostObj = totalCostCalculatorForPriceTypes(calOptions.concat(putOptions).concat([stock]));
        const totalGainObj = totalSettlementGainByEstimationQuantity(calOptions, stock, "MIN");

        const profitPercentByBestPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalGainObj.totalGainByBestPrices
        });
        const profitPercentByInsertedPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByInsertedPrices,
            gainWithSign: totalGainObj.totalGainByInsertedPrices
        });

        return {
            profitPercentByBestPrices,
            profitPercentByInsertedPrices
        }

    },

    GUTS(_strategyPositions, _unChekcedPositions) {

        const totalCostObj = totalCostCalculatorForPriceTypes(_strategyPositions);


        const totalSettlementGainObj = totalSettlementGainByEstimationQuantity(_strategyPositions);


        const profitPercentByBestPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalSettlementGainObj.totalGainByBestPrices
        });
        const profitPercentByInsertedPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByInsertedPrices,
            gainWithSign: totalSettlementGainObj.totalGainByInsertedPrices
        });

        return {
            profitPercentByBestPrices,
            profitPercentByInsertedPrices
        }
    },
    // same as GUTS!!!
    LongGUTS_STRANGLE(_strategyPositions, _unChekcedPositions) {

        const totalCostObj = totalCostCalculatorForPriceTypes(_strategyPositions);


        const totalSettlementGainObj = totalSettlementGainByEstimationQuantity(_strategyPositions);


        const profitPercentByBestPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalSettlementGainObj.totalGainByBestPrices
        });
        const profitPercentByInsertedPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByInsertedPrices,
            gainWithSign: totalSettlementGainObj.totalGainByInsertedPrices
        });

        return {
            profitPercentByBestPrices,
            profitPercentByInsertedPrices
        }
    },


    CALL_BUTT_CONDOR(_strategyPositions, _unChekcedPositions) {

        const totalCostObj = totalCostCalculatorForPriceTypes(_strategyPositions);


        const totalOffsetGain = totalOffsetGainNearSettlementOfEstimationPanel({
            strategyPositions: _strategyPositions
        });

        const profitPercentByBestPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalOffsetGain
        });
        const profitPercentByInsertedPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByInsertedPrices,
            gainWithSign: totalOffsetGain
        });

        return {
            profitPercentByBestPrices,
            profitPercentByInsertedPrices
        }
    },
    OTHERS(_strategyPositions) {

        const totalCostObj = totalCostCalculatorForPriceTypes(_strategyPositions);


        const totalOffsetGain = totalOffsetGainNearSettlementOfEstimationPanel({
            strategyPositions: _strategyPositions
        });

        const profitPercentByBestPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalOffsetGain
        });
        const profitPercentByInsertedPrices = profitPercentCalculator({
            costWithSign: totalCostObj.totalCostByInsertedPrices,
            gainWithSign: totalOffsetGain
        });



        const stockPrice =   _strategyPositions[0].getBaseInstrumentPriceOfOption()
        const {settlementProfitByBestPrices,settlementProfitByInsertedPrices} = settlementProfitCalculator({strategyPositions:_strategyPositions,stockPrice});

        return {
            profitPercentByBestPrices,
            profitPercentByInsertedPrices,
            settlementProfitByBestPrices,
            settlementProfitByInsertedPrices
            
        }

    }


}

let prevCalcProfitOfStrategyTimeout;

export const calcProfitOfStrategy = async (_strategyPositions, _unChekcedPositions) => {
    // getStrategyName

    clearTimeout(prevCalcProfitOfStrategyTimeout)

    const profitCalculator = STRATEGY_NAME_PROFIT_CALCULATOR[_strategyPositions[0].getStrategyType() || 'OTHERS'];
    if (!profitCalculator)
        return

    await new Promise(resolve => setTimeout(resolve, 200));

    const { profitPercentByBestPrices, profitPercentByInsertedPrices,settlementProfitByBestPrices,settlementProfitByInsertedPrices } = profitCalculator(_strategyPositions, _unChekcedPositions);

    const isProfitable = informForExpectedProfitOnStrategy({
        _strategyPositions,
        profitPercentByBestPrices,
        profitPercentByInsertedPrices,
        settlementProfitByBestPrices,
        settlementProfitByInsertedPrices
    });

    if(isProfitable){
        prevCalcProfitOfStrategyTimeout = setTimeout(() => {
            calcProfitOfStrategy(_strategyPositions,_unChekcedPositions);

            
        }, 5000);
    }
 
    return isProfitable
}

const highSumValueOfInsertedOrderInformer = ({ orderModalQuantityGetter,orderModalPriceGetter, informer, informCleaner })=>{
    if (!strategyPositions[0].ordersModal) return


    strategyPositions.forEach(strategyPosition=>{
        if (!strategyPosition?.ordersModal) return true

        const positionModalQuantity = orderModalQuantityGetter(strategyPosition);
        const positionModalPrice = orderModalPriceGetter(strategyPosition);
        if(positionModalQuantity*positionModalPrice*strategyPosition.cSize > 500000000){
            informer(strategyPosition);
        }else{
            informCleaner(strategyPosition);
        }

    });
}


const quantityUnbalanceInformer = ({ orderModalQuantityGetter, informer, informCleaner }) => {

    if (!strategyPositions[0].ordersModal) return

    const position1ModalQuantity = orderModalQuantityGetter(strategyPositions[0]);
    const position1InsertedQuantity = strategyPositions[0].getInsertedQuantity();
    const p1Ratio = position1ModalQuantity / position1InsertedQuantity;


    const hasModalInsertedQuantityIssue = strategyPositions.some(strategyPosition => {
        if (!strategyPosition?.ordersModal) return true
        const positionModalQuantity = orderModalQuantityGetter(strategyPosition);
        const sumOfSameOptionInsertedQuantity = strategyPositions.filter(_position => _position.instrumentName === strategyPosition.instrumentName).reduce((sumOfQuantity, _position) => sumOfQuantity + _position.getInsertedQuantity(), 0);

        const positionInsertedQuantity = sumOfSameOptionInsertedQuantity;
        const ratio = positionModalQuantity / positionInsertedQuantity;
        return p1Ratio != ratio
    })


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
        `;

    const style = domContextWindow.document.createElement("style");
    style.textContent = css;
    domContextWindow.document.head.appendChild(style);
}

const fillCurrentStockPriceByStrikes = (strategyPositions)=>{

    const greaterThanStrikes = Math.max(...strategyPositions.map(sp=>sp.strikePrice)) * 1.2;


    const baseInstrumentPriceInputEl = domContextWindow.document.querySelector('.current-stock-price');


    baseInstrumentPriceInputEl.value = greaterThanStrikes



}

const getAndSetInstrumentData = async (strategyPositions)=>{

    const strategyPositionWithInstrumentInfo = async (strategyPosition) => {

        const instrumentInfo = await OMEXApi.getInstrumentInfoBySymbol(strategyPosition.instrumentName);
        strategyPosition.optionID = instrumentInfo.instrumentId;
        strategyPosition.instrumentId = instrumentInfo.instrumentId;
        strategyPosition.cSize = instrumentInfo.cSize

        strategyPosition.daysLeftToSettlement = Math.ceil((new Date(instrumentInfo.psDate).valueOf() - Date.now()) / (24 * 60 * 60000))

        return strategyPosition

    }

    const _strategyPositions = await Promise.all(
        strategyPositions.map(async (strategyPosition) => {

            return await strategyPositionWithInstrumentInfo(strategyPosition);
        })
    );

    return _strategyPositions

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
    const newWindow = window.open(`${_origin}/#/stock/derivative/main/strategy-estimation`);

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


const setTradeModalUiPositions = () => {

    let left = 1200;
    const top = 55;
    Array.from(document.querySelectorAll('client-modal-main client-option-modal-trade-layout')).forEach((tradeModal,i) => {
        tradeModal.style.left =`${left}px`;
        tradeModal.style.top =`${top}px`;

        left-= (tradeModal.offsetWidth + 1);

        i===1 &&  (left-=350)

    });
}



export const openGroupInNewTab = async (groupName,_origin) => {


    const childWindow = await openWindowAndSelectGroup(groupName,_origin);
    

    const { strategyRowLength } = await OMEXApi.selectStrategy(childWindow.document);


    await waitForElement(childWindow.document, () => {
        const openModalButtnList = childWindow.document.querySelectorAll('client-option-strategy-estimation-main .o-item-body .o-instrument-container button:first-child');
        return strategyRowLength ? (openModalButtnList.length === strategyRowLength) : openModalButtnList

    }, 60000);

    // await new Promise(r => setTimeout(r, 10000));


    await openModalOfAllPositionsRows(childWindow.document);


    childWindow.document.querySelector('c-k-filter-button button').click();

    setTradeModalUiPositions();

    return childWindow

    // await new Promise(r => setTimeout(r, 1000));

    // Run(childWindow)

}

export const openAllGroupsInNewTabs = async ()=>{

    const groups = await OMEXApi.getGroups();

    // for (const group of groups.slice(0, 1)) {
    for (const group of groups) {

        openGroupInNewTab(group.name);
        await new Promise(r => setTimeout(r, 100));
        
    }

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

export const createGroupOfCurrentStrategy = ()=>{
    OMEXApi.createGroup({
        name: getSummaryNameOfStrategy(),
        instrumentIds: strategyPositions.map(strategyPosition=>strategyPosition.instrumentId)
    }).then(()=>{

        showToast('گروه ایجاد شد');
    });
    takeScreenshot();
    strategyLogger?.saveLogs && strategyLogger.saveLogs(true)
}

export function showToast(message, duration = 2000) {
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

  toast.textContent = message;
  toast.style.display = 'block';

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.display = 'none';
  }, duration);
}

export let strategyPositions;
export let unChekcedPositions;


let domContextWindow = window;

const setTradeModalQuantityOfAllTradeModals = () => {

    for (const strategyPosition of strategyPositions) {

        setTradeModalQuantity(strategyPosition)

    }

}
const setTradeModalQuantity = (strategyPosition) => {

    const quantity = sumOfQuantityOfSamePosition(strategyPosition,strategyPositions) / strategyPosition.cSize;
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
    
    strategyPositions = createPositionObjectArrayByElementRowArray(Array.from(domContextWindow.document.querySelectorAll('client-option-strategy-estimation-main .o-items .o-item-body')).filter(rowEl => rowEl.querySelector('c-k-input-checkbox input').checked));
    unChekcedPositions  = createPositionObjectArrayByElementRowArray(Array.from(domContextWindow.document.querySelectorAll('client-option-strategy-estimation-main .o-items .o-item-body')).filter(rowEl => !rowEl.querySelector('c-k-input-checkbox input').checked));


    injectStyles()

    strategyPositions = observePriceChanges();
    strategyPositions = observeMyOrderInOrdersModal();
    strategyPositions = observeInputBoxInRowOfStrategy();
    strategyPositions = observeInputQuantityOfOrderModal();
    strategyPositions = observeTabClickOfOrderModal();
    strategyPositions = observePortfolioQuantityOfOrderModal();

    calcProfitOfStrategy(strategyPositions, unChekcedPositions);


    calcOffsetProfitOfStrategyInformUntilNotProfit()



    getStrategyExpectedProfitCnt();
    createDeleteAllOrdersButton();

    stopDraggingWrongOfOrdersModals();

    fillCurrentStockPriceByStrikes(strategyPositions);

    setTradeModalQuantityOfAllTradeModals();

    setTradeModalUiPositions();
    setDaysFromToday();

    strategyPositions = await getAndSetInstrumentData(strategyPositions);

    initLoggers();
    
    console.log(strategyPositions)

}

// Run();








