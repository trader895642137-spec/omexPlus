var omexLib;
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   COMMISSION_FACTOR: () => (/* binding */ COMMISSION_FACTOR),
/* harmony export */   calculateOptionMargin: () => (/* binding */ calculateOptionMargin),
/* harmony export */   configs: () => (/* binding */ configs),
/* harmony export */   getCommissionFactor: () => (/* binding */ getCommissionFactor),
/* harmony export */   getNearSettlementPrice: () => (/* binding */ getNearSettlementPrice),
/* harmony export */   getReservedMarginOfEstimationQuantity: () => (/* binding */ getReservedMarginOfEstimationQuantity),
/* harmony export */   hasGreaterRatio: () => (/* binding */ hasGreaterRatio),
/* harmony export */   isTaxFree: () => (/* binding */ isTaxFree),
/* harmony export */   mainTotalOffsetGainCalculator: () => (/* binding */ mainTotalOffsetGainCalculator),
/* harmony export */   profitPercentCalculator: () => (/* binding */ profitPercentCalculator),
/* harmony export */   settlementGainCalculator: () => (/* binding */ settlementGainCalculator),
/* harmony export */   settlementProfitCalculator: () => (/* binding */ settlementProfitCalculator),
/* harmony export */   showNotification: () => (/* binding */ showNotification),
/* harmony export */   totalCostCalculator: () => (/* binding */ totalCostCalculator),
/* harmony export */   totalCostCalculatorForPriceTypes: () => (/* binding */ totalCostCalculatorForPriceTypes),
/* harmony export */   waitForElement: () => (/* binding */ waitForElement)
/* harmony export */ });
const COMMISSION_FACTOR = {
  OPTION: {
    BUY: 0.00103,
    SELL: 0.00103,
    SETTLEMENT: {
      BUY: 0.0005,
      SELL: 0.0055,
      SELL_TAX: 0.005,
      EXERCISE_FEE: 0.0005,
      TAX_FREE_SELL: 0.0005,
    }
  },
  STOCK: {
    BUY: 0.003712,
    SELL: 0.0088
  },
  ETF: {
    BUY: 0.00116 * 2,
    SELL: 0.001875 * 2
  }
}

const configs = {
  stockPriceAdjustFactor: 1.001
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



const isBaseInstrumentETF = (strategyPosition)=>{
 const ETF_SYMBOLS = ['ضهرم', 'طهرم', 'ضتوان', 'طتوان', 'ضموج', 'طموج'];

 return ETF_SYMBOLS.some(etfSymbol => strategyPosition.instrumentName.includes(etfSymbol))

}


const isTaxFree = (_strategyPosition) => {
  const TAX_FREE_NAMES = ['ضهرم', 'طهرم', 'ضتوان', 'طتوان', 'ضموج', 'طموج'];

  return TAX_FREE_NAMES.some(taxFreeName => _strategyPosition.instrumentName.includes(taxFreeName))

}
const getCommissionFactor = (_strategyPosition) => {
  if (_strategyPosition.isOption) {
    return COMMISSION_FACTOR.OPTION
  }

  if (_strategyPosition.isETF) {
    return COMMISSION_FACTOR.ETF
  }

  return COMMISSION_FACTOR.STOCK
}


const getReservedMarginOfEstimationQuantity = (strategyPosition) => {

  const requiredMargin = strategyPosition.getRequiredMargin();

  const quantity = strategyPosition.getQuantity();

  const marginOfEstimation = requiredMargin ? (requiredMargin * quantity) : 0

  return marginOfEstimation

}




const totalCostCalculator = ({ strategyPositions, getPrice, getQuantity } = {}) => {
  let totalCost = strategyPositions.reduce((sum, _strategyPosition) => {
    const price = getPrice(_strategyPosition);
    if (!price)
      return NaN

    const isBuy = _strategyPosition.isBuy;

    const priceWithSideSign = price * (isBuy ? -1 : 1);

    const quantity = getQuantity ? getQuantity(_strategyPosition, strategyPositions) : _strategyPosition.getQuantity();

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

const totalCostCalculatorForPriceTypes = (_strategyPositions,getAvgPrice) => {



    const quantityCalculatorOfCurrentPosition = (position,__strategyPositions)=>{
            const sumOfQuantityInEstimationPanel = __strategyPositions.filter(_position => _position.instrumentName === position.instrumentName).reduce((_sumOfQuantityInEstimationPanel, position) => _sumOfQuantityInEstimationPanel + position.getQuantity(), 0);


            const quantityInEstimationPanel = position.getQuantity();

            const quantityFactor = quantityInEstimationPanel / sumOfQuantityInEstimationPanel;


            return position.getCurrentPositionQuantity() * quantityFactor
    }


    let totalCostOfChunkOfEstimationQuantity = totalCostCalculator({
        strategyPositions: _strategyPositions,
        getPrice: (position) => getAvgPrice? getAvgPrice(position): position.getCurrentPositionAvgPrice()
    });

    let totalCostOfCurrentPositions = totalCostCalculator({
        strategyPositions: _strategyPositions,
        getQuantity: (position, __strategyPositions) => {
            return quantityCalculatorOfCurrentPosition(position, __strategyPositions);
        },
        getPrice: (position) => getAvgPrice? getAvgPrice(position): position.getCurrentPositionAvgPrice()
    });
    let unreliableTotalCostOfCurrentPositions = totalCostCalculator({
        strategyPositions: _strategyPositions,
        getQuantity: (position, __strategyPositions) => {
            return quantityCalculatorOfCurrentPosition(position, __strategyPositions);
        },
        getPrice: (position) => getAvgPrice? getAvgPrice(position): (position.getCurrentPositionAvgPrice() || position.getUnreliableCurrentPositionAvgPrice())
    });



    let totalCostByBestPrices = totalCostCalculator({
        strategyPositions: _strategyPositions,
        getPrice: (position) => position.getBestOpenMorePrice()
    });

    let totalCostByInsertedPrices = totalCostCalculator({
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


const settlementGainCalculator = ({ strategyPositions, stockPrice })=>{

  const exerciseFee = COMMISSION_FACTOR.OPTION.SETTLEMENT.EXERCISE_FEE;


  if(strategyPositions.some(sp=>sp.strikePrice===stockPrice)){
    stockPrice+=1;
  }

  const valuablePositions = strategyPositions.filter(strategyPosition => strategyPosition.isCall ? strategyPosition.strikePrice < stockPrice : strategyPosition.strikePrice > stockPrice );

  const notValuablePositionReservedMargins = strategyPositions.filter(strategyPosition => strategyPosition.isCall ? strategyPosition.strikePrice > stockPrice : strategyPosition.strikePrice < stockPrice).reduce((notValuablePositionReservedMargins, notValuablePosition) => {
    const reservedMargin = getReservedMarginOfEstimationQuantity(notValuablePosition);
    notValuablePositionReservedMargins += reservedMargin;
    return notValuablePositionReservedMargins
  }, 0) || 0;


  const sumSettlementGainsInfo = valuablePositions.reduce((sumSettlementGainsInfo, valuablePosition) => {

    const tax = isTaxFree(valuablePosition) ? 0 : COMMISSION_FACTOR.OPTION.SETTLEMENT.SELL_TAX;
    const quantity = valuablePosition.getQuantity();
    const reservedMargin = getReservedMarginOfEstimationQuantity(valuablePosition);

    const isBuyStock = (valuablePosition.isCall && valuablePosition.isBuy) || (valuablePosition.isPut && !valuablePosition.isBuy);

    if (isBuyStock) {

      sumSettlementGainsInfo.sumOfGains -= (quantity * (valuablePosition.strikePrice + (valuablePosition.strikePrice * exerciseFee)))
      sumSettlementGainsInfo.remainedQuantity+=quantity;
    } else {

      // is sell stock
      sumSettlementGainsInfo.sumOfGains += (quantity * (valuablePosition.strikePrice - (valuablePosition.strikePrice * exerciseFee) - (valuablePosition.strikePrice * tax)))
      sumSettlementGainsInfo.remainedQuantity-=quantity;

    }

    sumSettlementGainsInfo.sumOfGains += reservedMargin;


    return sumSettlementGainsInfo;

  }, {sumOfGains:0,remainedQuantity:0});


  if(sumSettlementGainsInfo && sumSettlementGainsInfo.remainedQuantity>0){
    const sellStockFee = isTaxFree(valuablePositions[0]) ? COMMISSION_FACTOR.ETF.SELL : COMMISSION_FACTOR.STOCK.SELL

    sumSettlementGainsInfo.sumOfGains += (sumSettlementGainsInfo.remainedQuantity * (stockPrice -  (stockPrice * sellStockFee)))
    sumSettlementGainsInfo.remainedQuantity = 0;
  }


  if(notValuablePositionReservedMargins){
    sumSettlementGainsInfo.sumOfGains +=notValuablePositionReservedMargins;
  }


  return sumSettlementGainsInfo.sumOfGains

}

const settlementProfitCalculator = ({ strategyPositions, stockPrice }) => {

  
  const sumOfGains = settlementGainCalculator({ strategyPositions, stockPrice })


  const totalCostObj = totalCostCalculatorForPriceTypes(strategyPositions);


  const settlementProfitByBestPrices = profitPercentCalculator({
    costWithSign: totalCostObj.totalCostByBestPrices,
    gainWithSign: sumOfGains
  });
  const settlementProfitByInsertedPrices = profitPercentCalculator({
    costWithSign: totalCostObj.totalCostByInsertedPrices,
    gainWithSign: sumOfGains
  });


  return {
    settlementProfitByBestPrices,
    settlementProfitByInsertedPrices
  }




}





const mainTotalOffsetGainCalculator = ({ strategyPositions, getBestPriceCb, getQuantity, getReservedMargin }) => {
  return strategyPositions.reduce((sum, _strategyPosition, index) => {
    const price = getBestPriceCb(_strategyPosition);

    const isBuy = _strategyPosition.isBuy;
    const quantity = getQuantity ? getQuantity(_strategyPosition, strategyPositions) : _strategyPosition.getQuantity();

    const commissionFactor = getCommissionFactor(_strategyPosition)[isBuy ? 'SELL' : 'BUY'];

    const priceWithSideSign = price * (isBuy ? 1 : -1);

    const reservedMargin = getReservedMargin(_strategyPosition, strategyPositions);

    const _totalOffsetGain = (priceWithSideSign * quantity) + reservedMargin - (price * quantity * commissionFactor);
    return sum + _totalOffsetGain
  }
    , 0);
}


const getNearSettlementPrice = ({ strategyPosition, stockPrice, stockPriceAdjustFactor = configs.stockPriceAdjustFactor }) => {


  const tradeFee = strategyPosition.isBuy ? COMMISSION_FACTOR.OPTION.BUY : COMMISSION_FACTOR.OPTION.SELL;
  const exerciseFee = COMMISSION_FACTOR.OPTION.SETTLEMENT.EXERCISE_FEE
  const tax = isTaxFree(strategyPosition) ? 0 : COMMISSION_FACTOR.OPTION.SETTLEMENT.SELL_TAX;
  const discounter = optionPremium => strategyPosition.isBuy ? (optionPremium - 0.7) : (optionPremium + 0.7)


  function calculateCallPrice(stockPrice, strikePrice) {
    if (stockPrice <= strikePrice) return 0

    const adjustedStockPrice = stockPrice / stockPriceAdjustFactor;
    let optionPremium = (adjustedStockPrice - (strikePrice * (1 + exerciseFee))) / (1 + tradeFee);

    return discounter(optionPremium)
  }

  function calculatePutPrice(stockPrice, strikePrice) {
    if (stockPrice >= strikePrice) return 0
    const adjustedStockPrice = stockPrice * stockPriceAdjustFactor;
    let optionPremium = (strikePrice * (1 - exerciseFee) - adjustedStockPrice) / (1 + tradeFee);
    return discounter(optionPremium)
    //  return (strikePrice * (1 - tax - exerciseFee) - adjustedStockPrice) / (1 + tradeFee);
  }

  const price = strategyPosition.isCall ? calculateCallPrice(stockPrice, strategyPosition.strikePrice) : calculatePutPrice(stockPrice, strategyPosition.strikePrice)
  return price > 0 ? price : 0
}




const hasGreaterRatio=({num1,num2,properRatio=100})=> {
    if (num2 === 0) {
        return true
    }
    const absNum1 = Math.abs(num1);
    const absNum2 = Math.abs(num2);
    const ratio = absNum1>absNum2 ? (absNum1 / absNum2) : (absNum2 / absNum1);

    return ratio>=properRatio
}


const calculateOptionMargin=({ priceSpot, // قیمت پایانی دارایی پایه (ریال)
    strikePrice, // قیمت اعمال (ریال)
    contractSize, // اندازه قرارداد
    optionPremium, // قیمت فروش اختیار (ریال)
    A = 0.2, // ضریب A
    B = 0.1, // ضریب B
    optionType = "call"// "call" یا "put"
})=> {

    function roundUpTo({ margin, multiplier }) {
        return Math.ceil(margin / multiplier) * multiplier

    }
    // محاسبه مقدار در زیان بودن
    let intrinsicLoss = 0;
    if (optionType === "call") {
        intrinsicLoss = Math.max(0, strikePrice - priceSpot) * contractSize;
    } else if (optionType === "put") {
        intrinsicLoss = Math.max(0, priceSpot - strikePrice) * contractSize;
    }

    // مرحله ۱
    const marginStep1 = (priceSpot * A * contractSize) - intrinsicLoss;

    // مرحله ۲
    const marginStep2 = strikePrice * B * contractSize;

    // مرحله ۳: بیشینه مرحله ۱ و ۲ و گرد کردن
    const maxBaseMargin = Math.max(marginStep1, marginStep2);
    const roundedMargin = roundUpTo({
        margin: maxBaseMargin,
        multiplier: 10000
    });

    // مرحله ۴: افزودن قیمت فروش اختیار × اندازه قرارداد
    const finalMargin = roundedMargin + (optionPremium * contractSize);

    return {
        initila: roundedMargin,
        required: finalMargin
    }

}


const waitForElement = (parent,checkerFn, timeout = 4000) =>{
  return new Promise((resolve, reject) => {
    
    const result = checkerFn();
    if (result) return resolve(result);

    const observer = new MutationObserver(() => {
      const result = checkerFn();
      if (result) {
        clearTimeout(timer);
        observer.disconnect();
        resolve(result);
      }
    });

    observer.observe(parent, {
      childList: true,
      subtree: true,
    });

    // اگر بعد از timeout میلی‌ثانیه پیدا نشد → خطا بده
    const timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element "${selector}" not found within ${timeout} ms`));
    }, timeout);
  });
}

/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   OMEXApi: () => (/* binding */ OMEXApi),
/* harmony export */   fillEstimationPanelByStrategyName: () => (/* binding */ fillEstimationPanelByStrategyName),
/* harmony export */   getBlockedAmount: () => (/* binding */ getBlockedAmount),
/* harmony export */   isInstrumentNameOfOption: () => (/* binding */ isInstrumentNameOfOption),
/* harmony export */   logSumOfPositionsOfGroups: () => (/* binding */ logSumOfPositionsOfGroups)
/* harmony export */ });
/* harmony import */ var _common__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);


// https://khobregan.tsetab.ir
const origin = window.location.origin
const redOrigin = origin.replace('.tsetab','-red.tsetab')

const getOptionPortfolioList = async () => {

    

    const list = await fetch(`${redOrigin}/api/optionOpenPositions/get`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9,ar;q=0.8,ur;q=0.7,da;q=0.6,fa;q=0.5,ne;q=0.4",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "ngsw-bypass": "",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Google Chrome\";v=\"141\", \"Not?A_Brand\";v=\"8\", \"Chromium\";v=\"141\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": `${origin}/`,
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
    }).then(response => response.json()).then(res => res.response.data)

    return list

}


function formatDateToYyyymmdd(date) {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
}

const getTodayOpenOrders = async () => {
    // ?historyDate=20251026
    return fetch(`${redOrigin}/api/Orders/GetOrders?historyDate=${formatDateToYyyymmdd(new Date())}`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9,ar;q=0.8,ur;q=0.7,da;q=0.6,fa;q=0.5,ne;q=0.4",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "ngsw-bypass": "",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Google Chrome\";v=\"141\", \"Not?A_Brand\";v=\"8\", \"Chromium\";v=\"141\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": `${origin}/`,
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
    }).then(response => response.json()).then(res => {
        const orders = res.response.data;
        return orders.filter(order=>order.orderStatus==="InQueue" || order.orderStatus==="PartlySettled")

    });


}

const deleteOrder = ({orderId,id}) => {
    
    return fetch( `${redOrigin}/api/Orders/OrderCancellation?orderId=${orderId}&Id=${id}`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "access-control-max-age": "3600",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "cache-control": "max-age=21600, public",
            "content-type": "application/json; charset=UTF-8",
            "ngsw-bypass": ""
        },
        //   "referrer": "https://khobregan.tsetab.ir/order-terminal-worker.6b5091bdcec9e3f3.js",
        "referrer": `${origin}/`,
        "body": null,
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    });
}




const getStockInfos = async (instrumentIds) => {
    return fetch(`${redOrigin}/api/PublicMessages/GetInstruments`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-GB,en;q=0.9,fa-IR;q=0.8,fa;q=0.7,en-US;q=0.6",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "content-type": "application/json",
            "ngsw-bypass": "",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Chromium\";v=\"142\", \"Google Chrome\";v=\"142\", \"Not_A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": `${origin}/`,
        "body": JSON.stringify({
            instrumentIds
        }),
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    }).then(response => response.json()).then(res => {
        const stockInfos = res.response.data;
        return stockInfos
    });
}

const getOptionContractInfos = async (instrumentIds) => {

    return fetch(`${redOrigin}/api/PublicMessages/GetOptionContractInfos`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9,ar;q=0.8,ur;q=0.7,da;q=0.6,fa;q=0.5,ne;q=0.4",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "content-type": "application/json",
            "ngsw-bypass": "",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Chromium\";v=\"142\", \"Google Chrome\";v=\"142\", \"Not_A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": `${origin}/`,
        "body": JSON.stringify({
            instrumentIds
        }),
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    }).then(response => response.json()).then(res => {
        const optionContractInfos = res.response.data;
        return optionContractInfos
    });



}
const searchOptionContractInfos = async (symbol) => {
    // ?historyDate=20251026
    return fetch(`${redOrigin}/api/PublicMessages/SearchInstruments?filter=${symbol}&marketType=Stock&marketType=Option&marketType=OptionEnergy&marketType=Other`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9,ar;q=0.8,ur;q=0.7,da;q=0.6,fa;q=0.5,ne;q=0.4",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "ngsw-bypass": "",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Google Chrome\";v=\"141\", \"Not?A_Brand\";v=\"8\", \"Chromium\";v=\"141\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": `${origin}/`,
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
    }).then(response => response.json()).then(res => {
        const optionNamesObj = res.response.data;
        if(!optionNamesObj?.length) return null
        return optionNamesObj[0]
    });


}

const getInstrumentInfoBySymbol = async (instrumentName)=>{

     const instrumentNameObj = await searchOptionContractInfos(instrumentName);

     if(!instrumentNameObj) return null

     const instrumentId = instrumentNameObj.instrumentId;


     let instrumentInfos;
     if(isInstrumentNameOfOption(instrumentName)){
        instrumentInfos = await getOptionContractInfos([instrumentId]);

     }else{
        instrumentInfos = await getStockInfos([instrumentId]);
     }


     if(!instrumentInfos?.length) return null


     return instrumentInfos[0]

}


const deleteAllOpenOrders =async ()=>{


    const openOrderList = await getTodayOpenOrders();

    for (let i = 0; i < openOrderList.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 10));
        const {orderId,id}=openOrderList[i];
        await deleteOrder({orderId,id});
    }


    return

}


const getGroups =async () => {
    return fetch(`${redOrigin}/api/AssetGrouping/GetGroups`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9,ar;q=0.8,ur;q=0.7,da;q=0.6,fa;q=0.5,ne;q=0.4",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "ngsw-bypass": "",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Chromium\";v=\"142\", \"Google Chrome\";v=\"142\", \"Not_A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": `${origin}/`,
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
    }).then(response => response.json()).then(res => {
        const groups = res.response.data;
        return groups
    });
}
const getCustomerOptionStrategyEstimationWithItems = async () => {
    return fetch(`${redOrigin}/api/OptionStrategyEstimations/GetCustomerOptionStrategyEstimationWithItems`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9,ar;q=0.8,ur;q=0.7,da;q=0.6,fa;q=0.5,ne;q=0.4",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "ngsw-bypass": "",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Chromium\";v=\"142\", \"Google Chrome\";v=\"142\", \"Not_A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": `${origin}/`,
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
    }).then(response => response.json()).then(res => {
        const strategyEstimationList = res.response.data;
        return strategyEstimationList
    });
}



const selectStrategy =async ()=>{
    const selectedGroupTitle = document.querySelector('client-option-positions-filter-bar .-is-group ng-select .u-ff-number').innerHTML;

    const groups = await getGroups();

    let selectedGroup = groups.find(group=>selectedGroupTitle.includes(group.name));

    const portfolioList = await getOptionPortfolioList();

    selectedGroup.positions = selectedGroup.instrumentIds.map(instrumentId=>portfolioList.find(position=>position.instrumentId===instrumentId))



    const strategies = await getCustomerOptionStrategyEstimationWithItems();

    const foundStrategies = strategies.filter(strategy=> {


        strategy.items = Array.from(new Map(strategy.items.map(sItem => [sItem.instrumentId, sItem])).values());

        const hasAllInstrumentId =  selectedGroup.positions.every(groupPosition=> strategy.items.find(sItem=>groupPosition.instrumentId===sItem.instrumentId && groupPosition.orderSide===sItem.side));

        return hasAllInstrumentId && strategy.items.length===selectedGroup.instrumentIds.length

    });



    const  estimationListButton = document.querySelector('client-option-strategy-estimation-header button[label="لیست برآوردها"]');


    estimationListButton.click();
    await new Promise(r => setTimeout(r, 200));

    const estimationListSearchInput = document.querySelector('client-option-strategy-estimation-list c-k-input-search input');
    estimationListSearchInput.value=  foundStrategies[0].title;
    estimationListSearchInput.dispatchEvent(new Event('input', { bubbles: true }));




    const searchResultElement = document.querySelector('client-option-strategy-estimation-list .o-items-container .o-item');

    await new Promise(r => setTimeout(r, 200));


    searchResultElement.click()

    console.log(foundStrategies);
    

}

const logSumOfPositionsOfGroups = async ()=>{
    const groups = await getGroups();
    let portfolioList = await getOptionPortfolioList();
    const sum  = groups.reduce((sum,g)=>sum+=(g.instrumentIds.length),0);

    const instrumentIdsOfGroups = groups.flatMap(group=>group.instrumentIds);


    const areNotInGroups = portfolioList.reduce((areNotInGroups,position)=>{

        if(!instrumentIdsOfGroups.find(instrumentId=>instrumentId===position.instrumentId)){
            areNotInGroups.push(position.instrumentName) 
        }
        return areNotInGroups
    },[])
    
    console.log(sum,areNotInGroups)
    
}


const getBlockedAmount = ()=>{

    getOptionPortfolioList().then(list=>{
        console.log(list.map(op=>op.blockedAmount).filter(Boolean).reduce((sum,current)=>sum+current,0))
    })
}


const fillEstimationPanelByStrategyName=async ()=>{

    const strategyName = document.querySelector('client-option-strategy-estimation-header .e-title-input input').value;
    if(!strategyName) return 

    const optionSymbolList = strategyName.split('@')[1].split('-');

    const addNewRowButton = document.querySelector('client-option-strategy-estimation-main .o-footer button');

    const searchAndSelectOption = async (optionSymbol)=>{
        const getEmptyRow = ()=>{
            const row = document.querySelector('client-option-strategy-estimation-main .o-items .o-item-body:last-child');
            const searchInput = row?.querySelector('client-instrument-search input');

            return searchInput &&  {
                searchInput,
                row
            }
        }

        let {searchInput,row} = getEmptyRow() || {};

        const estimationPanelElement = document.querySelector('client-option-strategy-estimation-main .o-items');
        
        if(!searchInput){

            addNewRowButton.click();
            const result = await (0,_common__WEBPACK_IMPORTED_MODULE_0__.waitForElement)(estimationPanelElement,getEmptyRow);
            searchInput = result.searchInput;
            row = result.row;
        }

        searchInput.value = optionSymbol;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));

        try {
            const resultBodyElement = await (0,_common__WEBPACK_IMPORTED_MODULE_0__.waitForElement)(row,()=>row.querySelector('client-instrument-search ng-dropdown-panel .ng-dropdown-panel-items .ng-option:first-child .c-resultBody'));
            resultBodyElement.click();
        } catch (err) {
            console.error("Error:", err.message);
        }

        const quantityInput = row.querySelector('c-k-input-number[formcontrolname=quantity] input');
        quantityInput.value='10';
        quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
        const linkPriceButton = row.querySelector('.o-price-group client-option-strategy-estimation-main-ui-lock button')
        linkPriceButton.click();
        
    }

    for (const optionSymbol of optionSymbolList) {

        await searchAndSelectOption(optionSymbol)

    }
   
}

const isInstrumentNameOfOption = (instrumentName)=> ['ض', 'ط'].some(optionChar => instrumentName && instrumentName.charAt(0) === optionChar);

const OMEXApi = {
    getOptionPortfolioList,
    getOptionContractInfos,
    getInstrumentInfoBySymbol,
    deleteAllOpenOrders,
    selectStrategy,
    logSumOfPositionsOfGroups,
    getBlockedAmount,
    fillEstimationPanelByStrategyName
}

/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Api: () => (/* binding */ Api),
/* harmony export */   getOptionPortfolioListForFilterListIgnore: () => (/* binding */ getOptionPortfolioListForFilterListIgnore)
/* harmony export */ });
/* harmony import */ var _omexApi__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2);


const getOptionPortfolioListForFilterListIgnore = async ()=>{
   const portfolioList = await _omexApi__WEBPACK_IMPORTED_MODULE_0__.OMEXApi.getOptionPortfolioList();

   console.log(portfolioList.map(instrumentInfo=>`ALL@${instrumentInfo.instrumentName}`).join(' '));

}


const Api={
    getOptionPortfolioListForFilterListIgnore
}

/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _flashTitle__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);


 (() => {
  // 1) اگر مرورگر نوتیفیکیشن را پشتیبانی نمی‌کند
  if (!("Notification" in window)) {

    (0,_flashTitle__WEBPACK_IMPORTED_MODULE_0__.flashTitle)("⚠️ این مرورگر نوتیفیکیشن را پشتیبانی نمی‌کند!");
    
    return;
  }

  // 2) اگر قبلاً اجازه داده شده
  if (Notification.permission === "granted") {
    console.log("نوتیفیکیشن قبلاً مجاز شده");
    return;
  }

  // 3) اگر نه مجاز است نه بلاک شده → از کاربر اجازه می‌گیریم
  if (Notification.permission === "default") {
    Notification.requestPermission().then(result => {
      if (result === "granted") {
        console.log("کاربر اجازه داد");
      } else {
        console.log("کاربر اجازه نداد");
      }
    });
  }


  if (Notification.permission === "denied") {
    (0,_flashTitle__WEBPACK_IMPORTED_MODULE_0__.flashTitle)("⚠️ دسکتاپ نوتیفیکیشن غیر فعال است!");
    return;
  }



  
  // 4) اگر permission = denied بود، نمی‌توانی دوباره درخواست بدهی
  // فقط باید کاربر خودش از تنظیمات مرورگر اصلاح کند
})()

/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   flashTitle: () => (/* binding */ flashTitle)
/* harmony export */ });
let flashing = false;
let intervalId;

function flashTitle(message = "🔔 توجه!") {
  if (flashing) return;
  flashing = true;

  const original = document.title;

  intervalId = setInterval(() => {
    document.title = document.title === original ? message : original;
  }, 700);

  return () => {
    clearInterval(intervalId);
    document.title = original;
    flashing = false;
  };
}


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Api: () => (/* reexport safe */ _api_js__WEBPACK_IMPORTED_MODULE_2__.Api),
/* harmony export */   OMEXApi: () => (/* reexport safe */ _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi),
/* harmony export */   Run: () => (/* binding */ Run),
/* harmony export */   calcProfitOfStrategy: () => (/* binding */ calcProfitOfStrategy),
/* harmony export */   configs: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_0__.configs),
/* harmony export */   expectedProfit: () => (/* binding */ expectedProfit),
/* harmony export */   strategyPositions: () => (/* binding */ strategyPositions),
/* harmony export */   unChekcedPositions: () => (/* binding */ unChekcedPositions)
/* harmony export */ });
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var _omexApi_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2);
/* harmony import */ var _api_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3);
/* harmony import */ var _desktopNotificationCheck_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(4);









;



try {
    if (typeof strategyPositions !== 'undefined') {
        strategyPositions.forEach(strategyPosition => {
            strategyPosition.observers.map(observerInfoObj => observerInfoObj?.observer.disconnect());

        }
        );
    }
} catch (error) { }

// FIXME:expectedProfitPerMonth is factor but minExpectedProfitOfStrategy is percent
let expectedProfit = {
    expectedProfitPerMonth: 1.04,
    minExpectedProfitOfStrategy: 3.9,
    currentPositions: 1.4
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

    statusCnt.addEventListener('click', function(event) {
        doubleCheckProfitByExactDecimalPricesOfPortFolio(strategyPositions,true)
    });
    document.querySelector('client-option-layout-action-bar').append(statusCnt)
    return statusCnt
}

const getStatusCnt = () => {

    let statusCnt = document.querySelector('client-option-layout-action-bar .status-cnt') || createStatusCnt()

    return statusCnt

}

const createDeleteAllOrdersButton = () => {
    let removeAllOrderButton = document.createElement('button');
    removeAllOrderButton.classList.add('remove-all-order-button');
    removeAllOrderButton.textContent = 'حذف همه سفارشات';
    removeAllOrderButton.style.cssText += `
        margin-right: auto;
        `;
    removeAllOrderButton.addEventListener('click', async function(event) {
        _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi.deleteAllOpenOrders();
        await new Promise(resolve => setTimeout(resolve, 500));
        _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi.deleteAllOpenOrders();
    });
    
    document.querySelector('client-option-reports-actions').append(removeAllOrderButton)
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
    let parent = document.createElement('div');
    let cnt = document.createElement('div');
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





const settlementCommissionFactor = (_strategyPosition) => {

    const commissionFactorObj = _strategyPosition.isOption ? _common_js__WEBPACK_IMPORTED_MODULE_0__.COMMISSION_FACTOR.OPTION.SETTLEMENT : _common_js__WEBPACK_IMPORTED_MODULE_0__.COMMISSION_FACTOR.STOCK;

    let commissionFactor;

    const sellCommissionFactor = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.isTaxFree)(_strategyPosition) ? commissionFactorObj.TAX_FREE_SELL : commissionFactorObj.SELL;

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

    const getBestPriceCb = (_strategyPosition) => (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.getNearSettlementPrice)({strategyPosition: _strategyPosition, stockPrice:_strategyPosition.getBaseInstrumentPriceOfOption()});

    const totalOffsetGainNearSettlement = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.mainTotalOffsetGainCalculator)({
        strategyPositions,
        getBestPriceCb,
        getReservedMargin: _strategyPosition => {
            return (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.getReservedMarginOfEstimationQuantity)(_strategyPosition)
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

    const totalOffsetGainByOffsetOrderPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.mainTotalOffsetGainCalculator)({
        strategyPositions,
        getBestPriceCb: (_strategyPosition) => _strategyPosition.getBestOffsetPrice(),
        getQuantity: getQuantityOfCurrentPosition,
        getReservedMargin
    });

    const totalOffsetGainByOpenMoreOrderPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.mainTotalOffsetGainCalculator)({
        strategyPositions,
        getBestPriceCb: (_strategyPosition) => _strategyPosition.getBestOpenMorePrice(),
        getQuantity: getQuantityOfCurrentPosition,
        getReservedMargin
    });

    const totalOffsetGainByInsertedPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.mainTotalOffsetGainCalculator)({
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
        return (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.getReservedMarginOfEstimationQuantity)(position)
    }


    const totalOffsetGainByOffsetOrderPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.mainTotalOffsetGainCalculator)({
        strategyPositions,
        getBestPriceCb: (_strategyPosition) => _strategyPosition.getBestOffsetPrice(),
        getReservedMargin
    });

    const totalOffsetGainByOpenMoreOrderPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.mainTotalOffsetGainCalculator)({
        strategyPositions,
        getBestPriceCb: (_strategyPosition) => _strategyPosition.getBestOpenMorePrice(),
        getReservedMargin
    });

    const totalOffsetGainByInsertedPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.mainTotalOffsetGainCalculator)({
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

            const reservedMargin = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.getReservedMarginOfEstimationQuantity)(_position);

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

    const portfolioList = await _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi.getOptionPortfolioList();
    lastCheckProfitByExactDecimalPricesOfPortFolio.portfolioList = portfolioList;
    const getAvgPrice =(position)=>{

        const currentPortfolioPosition= portfolioList.find(currentPortfolioPosition=>currentPortfolioPosition.instrumentName===position.instrumentName)

        if(!currentPortfolioPosition) return null

        return currentPortfolioPosition.executedPrice
        
    }



    const totalCostOfChunkOfEstimationQuantity = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.totalCostCalculatorForPriceTypes)(_strategyPositions,getAvgPrice).totalCostOfChunkOfEstimationQuantity;

    const totalOffsetGainOfChunkOfEstimation = totalOffsetGainOfChunkOfEstimationQuantityCalculator({
        strategyPositions: _strategyPositions
    });
    let profitLossByOffsetOrdersPercent = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
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

        (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.showNotification)({
                title: 'مشکل با محاسبه قیمت میانگین',
                body: `${strategyPositions.map(_strategyPosition => _strategyPosition.instrumentName).join('-')}`,
                tag: `${strategyPositions[0].instrumentName}-doubleCheckProfitByExactDecimalPricesOfPortFolio`
        });
    }

    calcOffsetProfitOfStrategy(_strategyPositions)

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
const calcOffsetProfitOfStrategy = async (_strategyPositions) => {


    let getAvgPrice;
    if(lastCheckProfitByExactDecimalPricesOfPortFolio?.portfolioList?.length &&   lastCheckProfitByExactDecimalPricesOfPortFolio.time && (Date.now() - lastCheckProfitByExactDecimalPricesOfPortFolio.time)<60000 ){
        getAvgPrice =(position)=>{

            const currentPortfolioPosition= lastCheckProfitByExactDecimalPricesOfPortFolio.portfolioList.find(currentPortfolioPosition=>currentPortfolioPosition.instrumentName===position.instrumentName)

            if(!currentPortfolioPosition) return null

            return currentPortfolioPosition.executedPrice
        
        }
    }

    const totalCostInfoObj = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.totalCostCalculatorForPriceTypes)(_strategyPositions,getAvgPrice);

    const totalCurrentPositionCost = totalCostInfoObj.totalCostOfCurrentPositions;
    const unreliableTotalCostOfCurrentPositions = totalCostInfoObj.unreliableTotalCostOfCurrentPositions;
    const totalCostOfChunkOfEstimationQuantity = totalCostInfoObj.totalCostOfChunkOfEstimationQuantity;

    const totalOffsetGainOfChunkOfEstimation = totalOffsetGainOfChunkOfEstimationQuantityCalculator({
        strategyPositions: _strategyPositions
    });

    const totalOffsetGainOfCurrentPositionObj = totalOffsetGainOfCurrentPositionsCalculator({
        strategyPositions: _strategyPositions
    });



    

    let profitLossByOffsetOrdersPercent = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
        costWithSign: totalCostOfChunkOfEstimationQuantity,
        gainWithSign: totalOffsetGainOfChunkOfEstimation.byOffsetOrderPrices
    });

    let profitLossByInsertedPricesPercent = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
        costWithSign: totalCostOfChunkOfEstimationQuantity,
        gainWithSign: totalOffsetGainOfChunkOfEstimation.byInsertedPrices
    });



    showCurrentStrategyPositionState({
        totalCurrentPositionCost,totalOffsetGainOfCurrentPositionObj,
        profitLossByOffsetOrdersPercent,profitLossByInsertedPricesPercent,
        unreliableTotalCostOfCurrentPositions});
    

    let hasProfit = await checkProfitPercentAndInform({strategyPositions:_strategyPositions,profitLossByOffsetOrdersPercent});
    

    return hasProfit

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

        (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.showNotification)({
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
        let optionID = Array.from(document.querySelectorAll('client-option-positions-main .ag-pinned-right-cols-container .ag-row'))?.find(optionNameCellEl => Array.from(optionNameCellEl.querySelectorAll('span'))?.find(span => span.innerHTML === instrumentName))?.getAttribute('row-id');
        const isBuy = optionRowEl.querySelector('client-option-strategy-estimation-main-ui-order-side .-isActive')?.classList?.contains('buy');

        const isOption = (0,_omexApi_js__WEBPACK_IMPORTED_MODULE_1__.isInstrumentNameOfOption)(instrumentName);

        const isPut = isOption && instrumentName && instrumentName.charAt(0) === 'ط';

        const isCall = isOption && instrumentName && instrumentName.charAt(0) === 'ض';
        let cSize = 1000;
        let daysLeftToSettlement =30;
        const instrumentInfo = (async ()=>{

            const instrumentInfo = await _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi.getInstrumentInfoBySymbol(instrumentName);
            optionID = instrumentInfo.instrumentId;
            cSize = instrumentInfo.cSize


            daysLeftToSettlement = Math.ceil((new Date(instrumentInfo.psDate).valueOf() - Date.now())/(24*60*60000))


            return instrumentInfo

        })()

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
            const quantityMultiplier = isOption ? cSize : 1;
            return quantity * quantityMultiplier;
        }


        let cachedCurrentPositionQuantityElement;
        const getCurrentPositionQuantity = () => {

            cachedCurrentPositionQuantityElement = document.body.contains(cachedCurrentPositionQuantityElement) ? cachedCurrentPositionQuantityElement : document.querySelector(`client-option-positions-main .ag-center-cols-clipper [row-id="${optionID}"] [col-id="${isBuy ? 'buyCount' : 'sellCount'}"]`);

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


         let cachedOrderModalPriceElement;
        const getOrderModalPriceInputElement = ()=>{
            if (!document.body.contains(cachedOrderModalPriceElement)) {
                 cachedOrderModalPriceElement =ordersModal.querySelector('#tabKey-optionTradePriceInput');
            }

            return cachedOrderModalPriceElement
        }

        const getRequiredMargin = () => {

            const isMarginRequired = optionRowEl.querySelector('input[formcontrolname="requiredMarginIsSelected"]')?.checked;

            if (!isMarginRequired)
                0

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
            if (executedPrice && breakEvenPrice && hasIssue()) {
                !window.doNotNotifAvrageIssue && (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.showNotification)({
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
            return ['COVERED'].find(type => strategyType === type);
            // return ['BUCS_COLLAR', 'BUPS_COLLAR', 'BEPS_COLLAR', 'BUCS', 'BECS', 'BUPS', 'BEPS', 'BOX_BUPS_BECS', 'BOX', 'COVERED', 'GUTS', 'LongGUTS_STRANGLE', 'CALL_BUTT_CONDOR'].find(type => strategyType === type);
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
            (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.showNotification)({
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
                (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.showNotification)({
                    title: 'معامله شد',
                    body: `${strategyPositionObj.instrumentName}`,
                    tag: `${strategyPositionObj.instrumentName}-PortfolioQuantityChange`
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
                (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.showNotification)({
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
                    cb: () => (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.showNotification)({
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
    const isProfit = await calcOffsetProfitOfStrategy(strategyPositions);
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
        (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.showNotification)({
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

const STRATEGY_NAME_PROFIT_CALCULATOR = {

    utils: {},

    BUCS(_strategyPositions, _unChekcedPositions) {

        const totalCostObj = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.totalCostCalculatorForPriceTypes)(_strategyPositions);

        const stocks = _unChekcedPositions.filter(_unChekcedPosition => !_unChekcedPosition.isOption);
        if (stocks.length > 1)
            return 0
        const stock = stocks[0];

        const totalSettlementGainObj = totalSettlementGainByEstimationQuantity(_strategyPositions.filter(strategyPosition => !strategyPosition.getRequiredMargin()), stock, "MIN");

        const additionalSellPositions = _strategyPositions.filter(strategyPosition => strategyPosition.getRequiredMargin());

        const totalOffsetGainObjOfAdditionalSellPositions = totalOffsetGainNearSettlementOfEstimationPanel({
            strategyPositions: additionalSellPositions
        });

        const profitPercentByBestPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalSettlementGainObj.totalGainByBestPrices + totalOffsetGainObjOfAdditionalSellPositions
        });
        const profitPercentByInsertedPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
            costWithSign: totalCostObj.totalCostByInsertedPrices,
            gainWithSign: totalSettlementGainObj.totalGainByInsertedPrices + totalOffsetGainObjOfAdditionalSellPositions
        });

        return {
            profitPercentByBestPrices,
            profitPercentByInsertedPrices
        }
    },
    BUCS_COLLAR(_strategyPositions, _unChekcedPositions) {

        const totalCostObj = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.totalCostCalculatorForPriceTypes)(_strategyPositions);

        const buyOptions = _strategyPositions.filter(_strategyPosition => _strategyPosition.isBuy);

        const totalSettlementGainObj = totalSettlementGainByEstimationQuantity(buyOptions);



        const profitPercentByBestPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalSettlementGainObj.totalGainByBestPrices
        });
        const profitPercentByInsertedPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
            costWithSign: totalCostObj.totalCostByInsertedPrices,
            gainWithSign: totalSettlementGainObj.totalGainByInsertedPrices
        });

        return {
            profitPercentByBestPrices,
            profitPercentByInsertedPrices
        }
    },
    BUPS_COLLAR(_strategyPositions, _unChekcedPositions) {

        const totalCostObj = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.totalCostCalculatorForPriceTypes)(_strategyPositions);

        const puts = _strategyPositions.filter(_strategyPosition => _strategyPosition.isPut);

        const totalSettlementGainObj = totalSettlementGainByEstimationQuantity(puts);



        const profitPercentByBestPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalSettlementGainObj.totalGainByBestPrices
        });
        const profitPercentByInsertedPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
            costWithSign: totalCostObj.totalCostByInsertedPrices,
            gainWithSign: totalSettlementGainObj.totalGainByInsertedPrices
        });

        return {
            profitPercentByBestPrices,
            profitPercentByInsertedPrices
        }
    },
    BEPS_COLLAR(_strategyPositions, _unChekcedPositions) {

        const totalCostObj = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.totalCostCalculatorForPriceTypes)(_strategyPositions);

        const buyOptions = _strategyPositions.filter(_strategyPosition => _strategyPosition.isBuy);

        const totalSettlementGainObj = totalSettlementGainByEstimationQuantity(buyOptions);



        const profitPercentByBestPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalSettlementGainObj.totalGainByBestPrices
        });
        const profitPercentByInsertedPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
            costWithSign: totalCostObj.totalCostByInsertedPrices,
            gainWithSign: totalSettlementGainObj.totalGainByInsertedPrices
        });

        return {
            profitPercentByBestPrices,
            profitPercentByInsertedPrices
        }
    },
    BECS(_strategyPositions) {
        const totalCostObj = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.totalCostCalculatorForPriceTypes)(_strategyPositions);
        const totalOffsetGainNearSettlement = totalOffsetGainNearSettlementOfEstimationPanel({
            strategyPositions: _strategyPositions
        });

        const profitPercentByBestPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalOffsetGainNearSettlement
        });
        const profitPercentByInsertedPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
            costWithSign: totalCostObj.totalCostByInsertedPrices,
            gainWithSign: totalOffsetGainNearSettlement
        });

        return {
            profitPercentByBestPrices,
            profitPercentByInsertedPrices
        }

    },
    BUPS(_strategyPositions) {
        const totalCostObj = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.totalCostCalculatorForPriceTypes)(_strategyPositions);
        const totalOffsetGainNearSettlement = totalOffsetGainNearSettlementOfEstimationPanel({
            strategyPositions: _strategyPositions
        });

        const profitPercentByBestPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalOffsetGainNearSettlement
        });
        const profitPercentByInsertedPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
            costWithSign: totalCostObj.totalCostByInsertedPrices,
            gainWithSign: totalOffsetGainNearSettlement
        });

        return {
            profitPercentByBestPrices,
            profitPercentByInsertedPrices
        }

    },
    BEPS(_strategyPositions) {

        const totalCostObj = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.totalCostCalculatorForPriceTypes)(_strategyPositions);
        const totalGainObj = totalSettlementGainByEstimationQuantity(_strategyPositions);

        const profitPercentByBestPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalGainObj.totalGainByBestPrices
        });
        const profitPercentByInsertedPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
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

        const totalCostObj = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.totalCostCalculatorForPriceTypes)(_strategyPositions);
        const totalGainObj = totalSettlementGainByEstimationQuantity(calOptions);

        const profitPercentByBestPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalGainObj.totalGainByBestPrices
        });
        const profitPercentByInsertedPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
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
        const totalCostObj = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.totalCostCalculatorForPriceTypes)(_strategyPositions);

        const totalGainObj = totalSettlementGainByEstimationQuantity(calOptions);

        const sellPosition = _strategyPositions.find(_strategyPosition => !_strategyPosition.isBuy)
        const reservedMarginOfOtherSell = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.getReservedMarginOfEstimationQuantity)(sellPosition);


        const profitPercentByBestPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalGainObj.totalGainByBestPrices + reservedMarginOfOtherSell
        });
        const profitPercentByInsertedPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
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

        const totalCostObj = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.totalCostCalculatorForPriceTypes)(calOptions.concat(putOptions).concat([stock]));
        const totalGainObj = totalSettlementGainByEstimationQuantity(calOptions, stock, "MIN");

        const profitPercentByBestPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalGainObj.totalGainByBestPrices
        });
        const profitPercentByInsertedPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
            costWithSign: totalCostObj.totalCostByInsertedPrices,
            gainWithSign: totalGainObj.totalGainByInsertedPrices
        });

        return {
            profitPercentByBestPrices,
            profitPercentByInsertedPrices
        }

    },

    GUTS(_strategyPositions, _unChekcedPositions) {

        const totalCostObj = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.totalCostCalculatorForPriceTypes)(_strategyPositions);


        const totalSettlementGainObj = totalSettlementGainByEstimationQuantity(_strategyPositions);


        const profitPercentByBestPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalSettlementGainObj.totalGainByBestPrices
        });
        const profitPercentByInsertedPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
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

        const totalCostObj = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.totalCostCalculatorForPriceTypes)(_strategyPositions);


        const totalSettlementGainObj = totalSettlementGainByEstimationQuantity(_strategyPositions);


        const profitPercentByBestPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalSettlementGainObj.totalGainByBestPrices
        });
        const profitPercentByInsertedPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
            costWithSign: totalCostObj.totalCostByInsertedPrices,
            gainWithSign: totalSettlementGainObj.totalGainByInsertedPrices
        });

        return {
            profitPercentByBestPrices,
            profitPercentByInsertedPrices
        }
    },


    CALL_BUTT_CONDOR(_strategyPositions, _unChekcedPositions) {

        const totalCostObj = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.totalCostCalculatorForPriceTypes)(_strategyPositions);


        const totalOffsetGain = totalOffsetGainNearSettlementOfEstimationPanel({
            strategyPositions: _strategyPositions
        });

        const profitPercentByBestPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalOffsetGain
        });
        const profitPercentByInsertedPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
            costWithSign: totalCostObj.totalCostByInsertedPrices,
            gainWithSign: totalOffsetGain
        });

        return {
            profitPercentByBestPrices,
            profitPercentByInsertedPrices
        }
    },
    OTHERS(_strategyPositions) {

        const totalCostObj = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.totalCostCalculatorForPriceTypes)(_strategyPositions);


        const totalOffsetGain = totalOffsetGainNearSettlementOfEstimationPanel({
            strategyPositions: _strategyPositions
        });

        const profitPercentByBestPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
            costWithSign: totalCostObj.totalCostByBestPrices,
            gainWithSign: totalOffsetGain
        });
        const profitPercentByInsertedPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
            costWithSign: totalCostObj.totalCostByInsertedPrices,
            gainWithSign: totalOffsetGain
        });



        const stockPrice =   _strategyPositions[0].getBaseInstrumentPriceOfOption()
        const {settlementProfitByBestPrices,settlementProfitByInsertedPrices} = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.settlementProfitCalculator)({strategyPositions:_strategyPositions,stockPrice});

        return {
            profitPercentByBestPrices,
            profitPercentByInsertedPrices,
            settlementProfitByBestPrices,
            settlementProfitByInsertedPrices
            
        }

    }


}

let prevCalcProfitOfStrategyTimeout;

const calcProfitOfStrategy = async (_strategyPositions, _unChekcedPositions) => {
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

const fillCurrentStockPriceByStrikes = (strategyPositions)=>{

    const greaterThanStrikes = Math.max(...strategyPositions.map(sp=>sp.strikePrice)) * 1.2;


    const baseInstrumentPriceInputEl = document.querySelector('.current-stock-price');


    baseInstrumentPriceInputEl.value = greaterThanStrikes



}

let strategyPositions;
let unChekcedPositions;
const Run = () => {


    
    strategyPositions = createPositionObjectArrayByElementRowArray(Array.from(document.querySelectorAll('client-option-strategy-estimation-main .o-items .o-item-body')).filter(rowEl => rowEl.querySelector('c-k-input-checkbox input').checked));
    unChekcedPositions  = createPositionObjectArrayByElementRowArray(Array.from(document.querySelectorAll('client-option-strategy-estimation-main .o-items .o-item-body')).filter(rowEl => !rowEl.querySelector('c-k-input-checkbox input').checked));


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
    createDeleteAllOrdersButton();

    stopDraggingWrongOfOrdersModals()

    fillCurrentStockPriceByStrikes(strategyPositions)

}

// Run();









})();

omexLib = __webpack_exports__;
/******/ })()
;