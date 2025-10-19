
import { COMMISSION_FACTOR,isTaxFree,getCommissionFactor,mainTotalOffsetGainCalculator,getNearSettlementPrice } from './common.js';


export { configs } from './common.js';



try {
    if (typeof strategyPositions !== 'undefined') {
        strategyPositions.forEach(strategyPosition => {
            strategyPosition.observers.map(observerInfoObj => observerInfoObj?.observer.disconnect());

        }
        );
    }
} catch (error) { }

// FIXME:expectedProfitPerMonth is factor but minExpectedProfitOfStrategy is percent
export let expectedProfit = {
    expectedProfitPerMonth: 1.05,
    minExpectedProfitOfStrategy: 3.9,
    currentPositions: 1
}


const createStatusCnt = () => {
    let statusCnt = document.createElement('div');
    statusCnt.classList.add('status-cnt');
    statusCnt.style.cssText += `
    padding: 0 10px;
    width: 100%;
    background: #FFF;
    display: flex;
    column-gap: 21px;
    font-size: 20px;
`;
    document.querySelector('client-option-layout-action-bar').append(statusCnt)
    return statusCnt
}

const getStatusCnt = () => {

    let statusCnt = document.querySelector('client-option-layout-action-bar .status-cnt') || createStatusCnt()

    return statusCnt

}

const createStrategyExpectedProfitCnt = () => {
    let parent = document.createElement('div');
    let cnt = document.createElement('div');
    cnt.classList.add('status-cnt');
    parent.style.cssText += `
            position:absolute;
            width: 169px;
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
    let currentStockPriceInput = document.createElement('input');
    currentStockPriceInput.classList.add('current-stock-price');

    currentStockPriceInput.style.cssText += `border: 1px solid #EEE;`
    parent.append(currentStockPriceInput)
    parent.append(cnt)

    document.querySelector('client-option-strategy-estimation-main .o-footer').style.cssText += `
            position: relative;
        `;
    document.querySelector('client-option-strategy-estimation-main .o-footer').append(parent)
    return cnt
}

const getStrategyExpectedProfitCnt = () => {

    let cnt = document.querySelector('client-option-strategy-estimation-main .o-footer .status-cnt') || createStrategyExpectedProfitCnt()
    return cnt

}

let lastNotifTime = {};

const showNotification = ({ title, body, tag }) => {

    if (lastNotifTime[tag] && (Date.now() - lastNotifTime[tag]) < 5000)
        return

    Notification.requestPermission().then(function (permission) {
        const notifTime = Date.now();
        lastNotifTime[tag] = notifTime

        if (permission !== "granted" || !document.hidden)
            return
        let notification = new Notification(title, {
            body,
            renotify: tag ? true : false,
            tag
        });

        console.log(body)

        notification.onclick = function () {
            window.parent.parent.focus();
        }
            ;
    })
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

const totalCostCalculator = _strategyPositions => {

    const _totalCostCalculator = ({ strategyPositions, getPrice, getQuantity } = {}) => {
        let totalCost = strategyPositions.reduce((sum, _strategyPosition) => {
            const price = getPrice(_strategyPosition);
            if (!price)
                return NaN

            const isBuy = _strategyPosition.isBuy;

            const priceWithSideSign = price * (isBuy ? -1 : 1);

            const quantity = getQuantity ? getQuantity(_strategyPosition, _strategyPositions) : _strategyPosition.getQuantity();

            const commissionFactor = getCommissionFactor(_strategyPosition)[isBuy ? 'BUY' : 'SELL'];

            const requiredMargin = _strategyPosition.getRequiredMargin();

            const reservedMargin = requiredMargin ? (requiredMargin * quantity) : 0;

            const _totalCost = (priceWithSideSign * quantity) - reservedMargin - (price * quantity * commissionFactor);
            return sum + _totalCost
        }
            , 0);

        totalCost = totalCost < 0 ? Math.floor(totalCost) : Math.ceil(totalCost);

        return totalCost
    }

    let totalCostOfChunkOfEstimationQuantity = _totalCostCalculator({
        strategyPositions: _strategyPositions,
        getPrice: (position) => position.getCurrentPositionAvgPrice()
    });

    let totalCostOfCurrentPositions = _totalCostCalculator({
        strategyPositions: _strategyPositions,
        getQuantity: (position, __strategyPositions) => {

            const sumOfQuantityInEstimationPanel = __strategyPositions.filter(_position => _position.instrumentName === position.instrumentName).reduce((_sumOfQuantityInEstimationPanel, position) => _sumOfQuantityInEstimationPanel + position.getQuantity(), 0);


            const quantityInEstimationPanel = position.getQuantity();

            const quantityFactor = quantityInEstimationPanel / sumOfQuantityInEstimationPanel;


            return position.getCurrentPositionQuantity() * quantityFactor
        },
        getPrice: (position) => position.getCurrentPositionAvgPrice()
    });
    let unreliableTotalCostOfCurrentPositions = _totalCostCalculator({
        strategyPositions: _strategyPositions,
        getQuantity: (position, __strategyPositions) => {

            const sumOfQuantityInEstimationPanel = __strategyPositions.filter(_position => _position.instrumentName === position.instrumentName).reduce((_sumOfQuantityInEstimationPanel, position) => _sumOfQuantityInEstimationPanel + position.getQuantity(), 0);


            const quantityInEstimationPanel = position.getQuantity();

            const quantityFactor = quantityInEstimationPanel / sumOfQuantityInEstimationPanel;


            return position.getCurrentPositionQuantity() * quantityFactor
        },
        getPrice: (position) => position.getCurrentPositionAvgPrice() || position.getUnreliableCurrentPositionAvgPrice()
    });
    let totalCostByBestPrices = _totalCostCalculator({
        strategyPositions: _strategyPositions,
        getPrice: (position) => position.getBestOpenMorePrice()
    });

    let totalCostByInsertedPrices = _totalCostCalculator({
        strategyPositions: _strategyPositions,
        getPrice: (position) => position.getInsertedPrice()
    });

    return {
        totalCostOfCurrentPositions,
        unreliableTotalCostOfCurrentPositions,
        totalCostOfChunkOfEstimationQuantity,
        totalCostByBestPrices,
        totalCostByInsertedPrices
    }
}



const totalOffsetGainNearSettlementOfEstimationPanel = ({ strategyPositions }) => {

    const getBestPriceCb = (_strategyPosition) => getNearSettlementPrice(_strategyPosition);

    const totalOffsetGainNearSettlement = mainTotalOffsetGainCalculator({
        strategyPositions,
        getBestPriceCb,
        getReservedMargin: _strategyPosition => {
            return _strategyPosition.getReservedMarginOfEstimationQuantity()
        }
    });

    return totalOffsetGainNearSettlement
}

const totalOffsetGainOfCurrentPositionsCalculator = ({ strategyPositions }) => {



    const getReservedMargin = (position, __strategyPositions) => {

        return getQuantityOfCurrentPosition(position, __strategyPositions) * position.getRequiredMargin()

    }

    const getQuantityOfCurrentPosition = (position, __strategyPositions) => {

        const sumOfQuantityInEstimationPanel = __strategyPositions.filter(_position => _position.instrumentName === position.instrumentName).reduce((_sumOfQuantityInEstimationPanel, position) => _sumOfQuantityInEstimationPanel + position.getQuantity(), 0);


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
        return position.getReservedMarginOfEstimationQuantity()
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

            const reservedMargin = _position.getReservedMarginOfEstimationQuantity();

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

const profitPercentCalculator = ({ costWithSign, gainWithSign }) => {



    if (costWithSign === Infinity) return NaN
    const totalProfit = gainWithSign + costWithSign;
    if (costWithSign > 0 && totalProfit > 0) {
        return 100 + (totalProfit / costWithSign) * 100
    }
    if (costWithSign > 0 && totalProfit < 0) {
        return -Infinity
    }

    return (totalProfit / Math.abs(costWithSign)) * 100
}

const MARGIN_CALC_TYPE = {
    BY_CURRENT_POSITION: "BY_CURRENT_POSITION",
    BY_GIVEN_PRICE: "BY_GIVEN_PRICE"
}
const calcOffsetProfitOfStrategy = (_strategyPositions) => {
    const totalCostInfoObj = totalCostCalculator(_strategyPositions);

    const totalCurrentPositionCost = totalCostInfoObj.totalCostOfCurrentPositions;
    const unreliableTotalCostOfCurrentPositions = totalCostInfoObj.unreliableTotalCostOfCurrentPositions;
    const totalCostOfChunkOfEstimationQuantity = totalCostCalculator(_strategyPositions).totalCostOfChunkOfEstimationQuantity;

    const totalOffsetGainOfChunkOfEstimation = totalOffsetGainOfChunkOfEstimationQuantityCalculator({
        strategyPositions: _strategyPositions
    });

    const totalOffsetGainOfCurrentPositionObj = totalOffsetGainOfCurrentPositionsCalculator({
        strategyPositions: _strategyPositions
    });



    let statusCnt = getStatusCnt();

    let profitLossByOffsetOrdersPercent = profitPercentCalculator({
        costWithSign: totalCostOfChunkOfEstimationQuantity,
        gainWithSign: totalOffsetGainOfChunkOfEstimation.byOffsetOrderPrices
    });

    let profitLossByInsertedPricesPercent = profitPercentCalculator({
        costWithSign: totalCostOfChunkOfEstimationQuantity,
        gainWithSign: totalOffsetGainOfChunkOfEstimation.byInsertedPrices
    });

    statusCnt.innerHTML = `
            <span style="
                display: inline-block;
                direction: ltr !important;
            ">
            ${totalCurrentPositionCost.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    })}
            </span>
            
            __ 
            
            <span style="
                display: inline-block;
                direction: ltr !important;
            ">
            ${totalOffsetGainOfCurrentPositionObj.byOffsetOrderPrices.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    })} 
            </span>

            <div style="color:${profitLossByOffsetOrdersPercent >= 0 ? 'green' : 'red'};margin-right: 10px;"> ${profitLossByOffsetOrdersPercent.toLocaleString('en-US', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    })} </div>

        



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
                
                <span style="color:${profitLossByInsertedPricesPercent >= 0 ? 'green' : 'red'};margin-right: 10px;"> ${profitLossByInsertedPricesPercent.toLocaleString('en-US', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    })}</span>
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
    if (profitLossByOffsetOrdersPercent > (expectedProfit?.currentPositions || 1)) {

        informExtremeOrderPrice(_strategyPositions, 'offset');

        showNotification({
            title: 'به سود رسید',
            body: `${_strategyPositions.map(_strategyPosition => _strategyPosition.instrumentName).join('-')}`,
            tag: `${_strategyPositions[0].instrumentName}-expectedProfitForCurrentPositionsPrecent`
        });
    } else {
        uninformExtremeOrderPrice(_strategyPositions, 'offset');
    }

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
    const secondPriceElement = getOrderPriceElement(sortedPositionsByDiff[1]);
    firstPriceElement.parentElement.classList.add("amin-bold");
    secondPriceElement.parentElement.classList.add("amin-bold--light");

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
        const optionID = Array.from(document.querySelectorAll('client-option-positions-main .ag-pinned-right-cols-container .ag-row'))?.find(optionNameCellEl => Array.from(optionNameCellEl.querySelectorAll('span'))?.find(span => span.innerHTML === instrumentName))?.getAttribute('row-id');
        const isBuy = optionRowEl.querySelector('client-option-strategy-estimation-main-ui-order-side .-isActive')?.classList?.contains('buy');

        const isOption = ['ض', 'ط'].some(optionChar => instrumentName && instrumentName.charAt(0) === optionChar);

        const isPut = isOption && instrumentName && instrumentName.charAt(0) === 'ط';

        const isCall = isOption && instrumentName && instrumentName.charAt(0) === 'ض';

        const ordersModal = Array.from(document.querySelectorAll('client-option-instrument-favorites-item-layout-modal')).find(modal => {
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
            const quantityMultiplier = isOption ? 1000 : 1;
            return quantity * quantityMultiplier;
        }

        const getCurrentPositionQuantity = () => {

            let currentPositionQuantity
            if (optionID) {
                const currentPositionQuantityEml = `client-option-positions-main .ag-center-cols-clipper [row-id="${optionID}"] [col-id="${isBuy ? 'buyCount' : 'sellCount'}"]`;
                currentPositionQuantity = convertStringToInt(document.querySelector(currentPositionQuantityEml)?.innerHTML);
            } else {
                currentPositionQuantity = getOrderModalPortfolioQuantity();
            }

            const quantityMultiplier = isOption ? 1000 : 1;
            return currentPositionQuantity * quantityMultiplier;

        }


        let cachedOrderModalPortfolioQuantityElement;
        const getOrderModalPortfolioQuantity = () => {
            cachedOrderModalPortfolioQuantityElement = document.body.contains(cachedOrderModalPortfolioQuantityElement) ? cachedOrderModalPortfolioQuantityElement : ordersModal.querySelector('.o-quantityContainer footer span');
            return convertStringToInt(cachedOrderModalPortfolioQuantityElement?.innerHTML) || 0

        }
        let cachedOrderModalQuantityFooterElement
        const getOrderModalQuantityFooterElement = () => {
            if (!document.body.contains(cachedOrderModalQuantityFooterElement)) {
                cachedOrderModalQuantityFooterElement = ordersModal.querySelector('.o-quantityContainer footer')
            }


            return cachedOrderModalQuantityFooterElement

        }

        let cachedOrderModalTradePanelElement
        const getOrderModalTradePanelElement = () => {
            if (!document.body.contains(cachedOrderModalTradePanelElement)) {
                cachedOrderModalTradePanelElement = ordersModal.querySelector('client-instrument-favorites-item-trade-panel')
            }


            return cachedOrderModalTradePanelElement

        }


        let cachedOrderModalStrategyDropdownElement;
        const getOrderModalStrategyDropdownElement = ()=>{
            if (!document.body.contains(cachedOrderModalTradePanelElement)) {
                cachedOrderModalStrategyDropdownElement = ordersModal.querySelector('client-instrument-favorites-item-trade-panel ng-select.-is-strategyDropdown');
            }


            return cachedOrderModalStrategyDropdownElement
        }


        


         let cachedOrderModalQuantityInputElement;
        const getOrderModalQuantityInputElement = ()=>{
            if (!document.body.contains(cachedOrderModalQuantityInputElement)) {
                cachedOrderModalQuantityInputElement =ordersModal.querySelector('#tabKey-optionTradeQuantityInput');
            }


            return cachedOrderModalQuantityInputElement
        }



        
         let cachedOrderModalQuantityInputArrowUpElement;
        const getOrderModalQuantityInputArrowUpElement = ()=>{
            if (!document.body.contains(cachedOrderModalQuantityInputArrowUpElement)) {
                cachedOrderModalQuantityInputArrowUpElement = ordersModal.querySelector('[iconname="arrow-up-filled"]');
            }


            return cachedOrderModalQuantityInputArrowUpElement
        }

        const getRequiredMargin = () => {

            const isMarginRequired = optionRowEl.querySelector('input[formcontrolname="requiredMarginIsSelected"]')?.checked;

            if (!isMarginRequired)
                0

            const requiredMargin = convertStringToInt(optionRowEl.querySelector('[formcontrolname="requiredMargin"] input').value) / 1000;

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
            const executedPrice = convertStringToInt(document.querySelector(executedPriceSelector)?.innerHTML);
            const breakEvenPrice = convertStringToInt(document.querySelector(breakEvenPriceSelector)?.innerHTML);
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
            if (hasIssue()) {
                !window.doNotNotifAvrageIssue && showNotification({
                    title: 'مشکل میانگین',
                    body: `${instrumentName}`,
                    tag: `${instrumentName}-CurrentPositionAvgPriceIssue`
                });
                return breakEvenPrice
            }

            return executedPrice

        }


        let cachedUnreliableCurrentPositionAvgPriceElement;
        const getUnreliableCurrentPositionAvgPrice = () => {

            if (!document.body.contains(cachedUnreliableCurrentPositionAvgPriceElement)) {
                const labelText = 'میانگین';
                const xpath = `.//label[normalize-space(text())='${labelText}']/following-sibling::span[1]`;

                const avgPriceElement = document.evaluate(
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



        const getReservedMarginOfEstimationQuantity = () => {

            const requiredMargin = getRequiredMargin();

            const quantity = getQuantity();

            const marginOfEstimation = requiredMargin ? (requiredMargin * quantity) : 0

            return marginOfEstimation

        }



        const getStrategyName = () => {
            return document.querySelector('client-option-strategy-estimation-header c-k-input-text input')?.value
        }

        const getBestOpenMorePriceWithSideSign = () => {
            const bestOpenMorePrice = getBestOpenMorePrice();
            if (!bestOpenMorePrice)
                return
            return bestOpenMorePrice * (isBuy ? -1 : 1);
        }

        const strikePrice = convertStringToInt(document.querySelector(`client-option-positions-main .ag-center-cols-clipper [row-id="${optionID}"] [col-id="strikePrice"]`)?.innerHTML) || convertStringToInt(optionRowEl.querySelectorAll('.o-item-row > div')[5].innerHTML);
        const daysLeftToSettlement = convertStringToInt(optionRowEl.querySelectorAll('.o-item-row > div')[7].innerHTML);

        const getStrikePriceWithSideSign = () => {
            const buySellFactor = isBuy ? -1 : 1;
            const callPutFactor = isCall ? 1 : isPut ? -1 : 1;

            const factor = buySellFactor * callPutFactor;

            return strikePrice * factor;
        }

        const getStrategyType = () => {
            const strategyName = getStrategyName();
            if (!strategyName)
                return

            const strategyType = strategyName.split('@')[0];
            return ['BUCS_COLLAR', 'BUPS_COLLAR', 'BEPS_COLLAR', 'BUCS', 'BECS', 'BUPS', 'BEPS', 'BOX_BUPS_BECS', 'BOX', 'COVERED', 'GUTS', 'LongGUTS_STRANGLE', 'CALL_BUTT_CONDOR'].find(type => strategyType === type);
        }


        const getBaseInstrumentPriceOfOption = () => {


            const baseInstrumentPriceInputEl = document.querySelector('.current-stock-price');

            return baseInstrumentPriceInputEl && convertStringToInt(baseInstrumentPriceInputEl.value);

        }

      

        const ETF_LIST = ['اهرم', 'توان', 'موج', 'جهش'];
        const isETF = ETF_LIST.some(_etfName => instrumentName === _etfName);

        let strategyPosition = {
            optionRowEl,
            // TODO: is not just option meybe stock
            instrumentName,
            instrumentFullTitle,
            isBuy,
            isETF,
            optionID,
            isOption,
            isCall,
            isPut,
            getBaseInstrumentPriceOfOption,
            getQuantity,
            getCurrentPositionQuantity,
            getOrderModalPortfolioQuantity,
            getOrderModalQuantityFooterElement,
            getOrderModalTradePanelElement,
            getOrderModalStrategyDropdownElement,
            getOrderModalQuantityInputElement,
            getOrderModalQuantityInputArrowUpElement,
            getInsertedPrice,
            getInsertedQuantity,
            getRequiredMargin,
            getReservedMarginOfEstimationQuantity,
            getCurrentPositionAvgPrice,
            getUnreliableCurrentPositionAvgPrice,
            strikePrice,
            daysLeftToSettlement,
            getStrikePriceWithSideSign,
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

export let strategyPositions = createPositionObjectArrayByElementRowArray(Array.from(document.querySelectorAll('client-option-strategy-estimation-main .o-items .o-item-body')).filter(rowEl => rowEl.querySelector('c-k-input-checkbox input').checked));
export let unChekcedPositions  = createPositionObjectArrayByElementRowArray(Array.from(document.querySelectorAll('client-option-strategy-estimation-main .o-items .o-item-body')).filter(rowEl => !rowEl.querySelector('c-k-input-checkbox input').checked));




const observeInputQuantityOfOrderModal = () => {

    const orderModalInputQuantityUnbalanceInformer = () => {

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


        

    }

    return strategyPositions.map(strategyPositionObj => {

        strategyPositionObj.observers.filter(observerInfoObj => ['inputQuantityOfOrderModal'].includes(observerInfoObj.key)).forEach(observerInfoObj => observerInfoObj.observer.disconnect())

        const inputQuantityOfOrderModal = strategyPositionObj.getOrderModalQuantityInputElement();
        const ordersModal = strategyPositionObj.ordersModal;

        const eventNames = ['input', 'change', 'click'];
        eventNames.forEach(eventName => inputQuantityOfOrderModal.removeEventListener(eventName, orderModalInputQuantityUnbalanceInformer));
        eventNames.forEach(eventName => inputQuantityOfOrderModal.addEventListener(eventName, orderModalInputQuantityUnbalanceInformer));
        ordersModal.removeEventListener('click', orderModalInputQuantityUnbalanceInformer);
        ordersModal.addEventListener('click', orderModalInputQuantityUnbalanceInformer);

        let lastClickTime = 0;
        const minInterval = 1000;
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
                calcOffsetProfitOfStrategy(strategyPositions);
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
    // TODO:FIXME: use document.body.contains(...)


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
            currentPositionQuantityUnbalanceInformerTimeout = setTimeout(currentPositionQuantityUnbalanceInformer, 20000);
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
                const newValue = strategyPositionObj.getOrderModalPortfolioQuantity();
                // if(newValue===null) return
                if (!newValue) return
                let bgColor


                if (newValue > oldValue) {
                    bgColor = '#008000a3'
                } else {
                    bgColor = '#ff00009c'
                }

                let quantityFooter = strategyPositionObj.getOrderModalQuantityFooterElement();


                quantityFooter.style.backgroundColor = bgColor;
                showNotification({
                    title: 'معامله شد',
                    body: `${strategyPositionObj.instrumentName}`,
                    tag: `${strategyPositionObj.instrumentName}-PortfolioQuantityChange`
                });

                previousStoredPortfolioQuantity = newValue

                setTimeout(() => {
                    quantityFooter.style.backgroundColor = '';

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

                    const isTradePanelVisible = document.body.contains(strategyPositionObj.getOrderModalTradePanelElement());

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

                    const pulseStyle = window.getComputedStyle(pulseElement);

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
                    calcProfitOfStrategy(strategyPositions, unChekcedPositions);
                    setTimeout(() => {
                        calcProfitOfStrategy(strategyPositions, unChekcedPositions);
                    }
                        , 100);
                    calcOffsetProfitOfStrategy(strategyPositions);
                }

            }
        }
            ;

        const bestOpenMoreOrderCallback = (mutationList) => {
            for (const mutation of mutationList) {
                if (mutation?.target?.innerHTML) {

                    calcProfitOfStrategy(strategyPositions, unChekcedPositions);
                    setTimeout(() => {
                        calcProfitOfStrategy(strategyPositions, unChekcedPositions);
                    }
                        , 100);
                    calcOffsetProfitOfStrategy(strategyPositions)

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

        strategyPositionObj.assetDetailsIconClickHandler && strategyPositionObj.ordersModal.querySelector('[iconname="details-outlined"]').removeEventListener('click',strategyPositionObj.assetDetailsIconClickHandler);
        strategyPositionObj.ordersModal.querySelector('[iconname="details-outlined"]').addEventListener('click', assetDetailsIconClickHandler );
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

const informForExpectedProfitOnStrategy = ({ _strategyPositions, profitPercentByBestPrices, profitPercentByInsertedPrices }) => {

    let statusCnt = getStrategyExpectedProfitCnt();

    statusCnt.innerHTML = `
        <div style="display:flex;flex-direction: column;row-gap: 13px;">
            <div style="background: #f6faf3;border:1px solid ; padding: 3px;color:${profitPercentByBestPrices >= 0 ? 'green' : 'red'}"> با سرخط ${profitPercentByBestPrices.toLocaleString('en-US', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    })} </div>
            <div style="font-size: 85%;color:${profitPercentByInsertedPrices >= 0 ? 'green' : 'red'}"> با کادر قیمت ${profitPercentByInsertedPrices.toLocaleString('en-US', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    })} </div>
        </div>
    `;



    const daysLeftToSettlement = _strategyPositions.find(_strategyPosition => _strategyPosition.daysLeftToSettlement)?.daysLeftToSettlement
    const percentPerDay = Math.pow((1 + (profitPercentByBestPrices / 100)), 1 / daysLeftToSettlement);
    const percentPerMonth = Math.pow(percentPerDay, 30);

    if (isProfitEnough({ totalProfitPercent: profitPercentByBestPrices, percentPerMonth })) {

        informExtremeOrderPrice(_strategyPositions, 'openMore');
        showNotification({
            title: `سود %${profitPercentByBestPrices.toFixed()}`,
            body: `${_strategyPositions.map(_strategyPosition => _strategyPosition.instrumentName).join('-')}`,
            tag: `${_strategyPositions[0].instrumentName}-expectedProfitPrecent`
        });
    } else {
        uninformExtremeOrderPrice(_strategyPositions);
    }
}

const STRATEGY_NAME_PROFIT_CALCULATOR = {

    utils: {},

    BUCS(_strategyPositions, _unChekcedPositions) {

        const totalCostObj = totalCostCalculator(_strategyPositions);

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

        const totalCostObj = totalCostCalculator(_strategyPositions);

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

        const totalCostObj = totalCostCalculator(_strategyPositions);

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

        const totalCostObj = totalCostCalculator(_strategyPositions);

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
        const totalCostObj = totalCostCalculator(_strategyPositions);
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
        const totalCostObj = totalCostCalculator(_strategyPositions);
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

        const totalCostObj = totalCostCalculator(_strategyPositions);
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

        const totalCostObj = totalCostCalculator(_strategyPositions);
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
        const totalCostObj = totalCostCalculator(_strategyPositions);

        const totalGainObj = totalSettlementGainByEstimationQuantity(calOptions);
        const reservedMarginOfOtherSell = _strategyPositions.find(_strategyPosition => !_strategyPosition.isBuy).getReservedMarginOfEstimationQuantity();


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

        const totalCostObj = totalCostCalculator(calOptions.concat(putOptions).concat([stock]));
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

        const totalCostObj = totalCostCalculator(_strategyPositions);


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

        const totalCostObj = totalCostCalculator(_strategyPositions);


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

        const totalCostObj = totalCostCalculator(_strategyPositions);


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

        const totalCostObj = totalCostCalculator(_strategyPositions);


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

    }


}

export const calcProfitOfStrategy = async (_strategyPositions, _unChekcedPositions) => {
    // getStrategyName

    const profitCalculator = STRATEGY_NAME_PROFIT_CALCULATOR[_strategyPositions[0].getStrategyType() || 'OTHERS'];
    if (!profitCalculator)
        return

    await new Promise(resolve => setTimeout(resolve, 200));

    const { profitPercentByBestPrices, profitPercentByInsertedPrices } = profitCalculator(_strategyPositions, _unChekcedPositions);

    informForExpectedProfitOnStrategy({
        _strategyPositions,
        profitPercentByBestPrices,
        profitPercentByInsertedPrices
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
                strategyPositionObj.getOrderModalQuantityInputArrowUpElement().click()
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
            }
            .amin-bold--light {
                padding: 2px !important;
                border: 1px dashed !important;
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

            client-option-instrument-favorites-item-layout-modal{
                width: 270px !important;
            }


            client-trade-ui-input-price-advance-compact #tabKey-optionTradePriceInput{
                padding-right : 9px !important;
            }

            client-option-instrument-favorites-item-layout-modal .o-inModalWrapper{
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
        `;

    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
}

const Run = () => {

    injectStyles()

    strategyPositions = observePriceChanges();
    strategyPositions = observeMyOrderInOrdersModal();
    strategyPositions = observeInputBoxInRowOfStrategy();
    strategyPositions = observeInputQuantityOfOrderModal();
    strategyPositions = observeTabClickOfOrderModal();
    strategyPositions = observePortfolioQuantityOfOrderModal();

    calcProfitOfStrategy(strategyPositions, unChekcedPositions);

    calcOffsetProfitOfStrategy(strategyPositions);



    getStrategyExpectedProfitCnt();


}

Run();








