var omexLib;
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   COMMISSION_FACTOR: () => (/* binding */ COMMISSION_FACTOR),
/* harmony export */   ETF_LIST: () => (/* binding */ ETF_LIST),
/* harmony export */   QueueScenario: () => (/* binding */ QueueScenario),
/* harmony export */   TAX_FREE_SYMBOLS: () => (/* binding */ TAX_FREE_SYMBOLS),
/* harmony export */   calcAveragePriceByExecutedOrders: () => (/* binding */ calcAveragePriceByExecutedOrders),
/* harmony export */   calculateExerciseCost: () => (/* binding */ calculateExerciseCost),
/* harmony export */   calculateOptionMargin: () => (/* binding */ calculateOptionMargin),
/* harmony export */   configs: () => (/* binding */ configs),
/* harmony export */   createDeferredPromise: () => (/* binding */ createDeferredPromise),
/* harmony export */   getCommissionFactor: () => (/* binding */ getCommissionFactor),
/* harmony export */   getNearSettlementPrice: () => (/* binding */ getNearSettlementPrice),
/* harmony export */   getReservedMarginOfEstimationQuantity: () => (/* binding */ getReservedMarginOfEstimationQuantity),
/* harmony export */   hasBreakevenExecutedPriceDiffIssue: () => (/* binding */ hasBreakevenExecutedPriceDiffIssue),
/* harmony export */   hasGreaterRatio: () => (/* binding */ hasGreaterRatio),
/* harmony export */   isBuyQueue: () => (/* binding */ isBuyQueue),
/* harmony export */   isETF: () => (/* binding */ isETF),
/* harmony export */   isHourMinGreaterThan: () => (/* binding */ isHourMinGreaterThan),
/* harmony export */   isSellQueue: () => (/* binding */ isSellQueue),
/* harmony export */   isTaxFree: () => (/* binding */ isTaxFree),
/* harmony export */   mainTotalOffsetGainCalculator: () => (/* binding */ mainTotalOffsetGainCalculator),
/* harmony export */   profitPercentCalculator: () => (/* binding */ profitPercentCalculator),
/* harmony export */   settlementGainCalculator: () => (/* binding */ settlementGainCalculator),
/* harmony export */   settlementProfitCalculator: () => (/* binding */ settlementProfitCalculator),
/* harmony export */   showNotification: () => (/* binding */ showNotification),
/* harmony export */   silentNotificationForMoment: () => (/* binding */ silentNotificationForMoment),
/* harmony export */   someOfNokoolGainCalculator: () => (/* binding */ someOfNokoolGainCalculator),
/* harmony export */   startMarketCountdown: () => (/* binding */ startMarketCountdown),
/* harmony export */   takeScreenshot: () => (/* binding */ takeScreenshot),
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
  stockPriceAdjustFactor: 1.001,
  jarimehNokoolFactor : 0.01
}


let lastNotifTime = {};


let silentNotificationForMomentTimeoutID,_isSilentNotificationModeActive;


const silentNotificationForMoment = (millisecond=160000) => {

    clearTimeout(silentNotificationForMomentTimeoutID);

    _isSilentNotificationModeActive = true;


    silentNotificationForMomentTimeoutID = setTimeout(() => {
        _isSilentNotificationModeActive = false;
    }
        , millisecond);

}
let notificationPermission = null;

async function ensureNotificationPermission() {
    if (notificationPermission !== null) {
        return notificationPermission;
    }
    
    if (Notification.permission === 'granted') {
        notificationPermission = 'granted';
        return notificationPermission;
    }
    
    if (Notification.permission === 'denied') {
        notificationPermission = 'denied';
        return notificationPermission;
    }
    
    // فقط در حالت 'default' درخواست می‌کنیم
    const permission = await Notification.requestPermission();
    notificationPermission = permission;
    return permission;
}

// اصلاح گارد با قفل (lock)
const notificationLocks = {};

const showNotification = async ({ title, body, tag, requireInteraction ,copyToClipboardText}) => {
    if (_isSilentNotificationModeActive) return;
    
    // گارد اول: بررسی زمان
    const now = Date.now();
    if (lastNotifTime[tag] && (now - lastNotifTime[tag]) < 5000) return;
    
    // گارد دوم: قفل برای جلوگیری از همزمانی
    if (notificationLocks[tag]) return;
    notificationLocks[tag] = true;
    
    try {
        const permission = await ensureNotificationPermission();
        if (permission !== "granted") return;
        if (!document.hidden) return;
        
        // ست کردن زمان قبل از ایجاد نوتیف
        lastNotifTime[tag] = Date.now();
        
        const notification = new Notification(title, {
            body,
            renotify: !!tag,
            tag,
            requireInteraction
        });
        
        notification.onclick = async function () {

            window.parent.parent.focus();
            await new Promise(resolve => setTimeout(resolve, 500));

            if (copyToClipboardText != null) {
                await navigator.clipboard.writeText(copyToClipboardText);
            }
        };
        
        // پاک کردن لاگ بعد از ۵ ثانیه
        setTimeout(() => {
            delete notificationLocks[tag];
        }, 5000);
        
    } catch (error) {
        console.error('Notification error:', error);
    } finally {
        // در صورت خطا، قفل رو آزاد کن
        setTimeout(() => {
            delete notificationLocks[tag];
        }, 1000);
    }
};




const isBaseInstrumentETF = (strategyPosition)=>{

 return TAX_FREE_SYMBOLS.some(etfSymbol => strategyPosition.instrumentName.includes(etfSymbol))

}


const isTaxFree = (_strategyPosition) => {

  return TAX_FREE_SYMBOLS.some(taxFreeName => _strategyPosition.instrumentName.includes(taxFreeName))

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

  // totalCost = totalCost < 0 ? Math.floor(totalCost) : Math.ceil(totalCost);

  return totalCost
}




const isHourMinGreaterThan = ({houre,minutes})=>{

    return ((new Date()).getHours() > houre || ((new Date()).getHours() === houre && (new Date()).getMinutes() >= minutes))
}

const totalCostCalculatorForPriceTypes = (_strategyPositions) => {



    const quantityCalculatorOfCurrentPosition = (position,__strategyPositions)=>{
            const sumOfQuantityInEstimationPanel = __strategyPositions.filter(_position => _position.instrumentName === position.instrumentName).reduce((_sumOfQuantityInEstimationPanel, position) => _sumOfQuantityInEstimationPanel + position.getQuantity(), 0);


            const quantityInEstimationPanel = position.getQuantity();

            const quantityFactor = quantityInEstimationPanel / sumOfQuantityInEstimationPanel;


            return position.getCurrentPositionQuantity() * quantityFactor
    }


    let totalCostOfChunkOfEstimationQuantity = totalCostCalculator({
        strategyPositions: _strategyPositions,
        getPrice: (position) =>  position.getCurrentPositionAvgPrice(position)
    });

    let totalCostOfCurrentPositions = totalCostCalculator({
        strategyPositions: _strategyPositions,
        getQuantity: (position, __strategyPositions) => {
            return quantityCalculatorOfCurrentPosition(position, __strategyPositions);
        },
        getPrice: (position) => {
          return  position.getCurrentPositionAvgPrice(position);
        }
    });
    let unreliableTotalCostOfCurrentPositions = totalCostCalculator({
        strategyPositions: _strategyPositions,
        getQuantity: (position, __strategyPositions) => {
            return quantityCalculatorOfCurrentPosition(position, __strategyPositions);
        },
        getPrice: (position) =>  position.getCurrentPositionAvgPrice(position)
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
        return (totalProfit / costWithSign) * 100
    }

    return (totalProfit / Math.abs(costWithSign)) * 100
}

const someOfNokoolGainCalculator = ({nokoolQuantity=1,stockPrice , strikePrice})=>{

  const nokool = stockPrice > strikePrice ?  (nokoolQuantity * (stockPrice - strikePrice)) : 0;
  const jarimehNokool = nokoolQuantity * stockPrice * configs.jarimehNokoolFactor;

  return nokool + jarimehNokool
}


const settlementGainCalculator = ({ strategyPositions, stockPrice,nokoolOrNoRequestFactor=0 })=>{

  const exerciseFee = COMMISSION_FACTOR.OPTION.SETTLEMENT.EXERCISE_FEE;



  if(strategyPositions.some(sp=>sp.strikePrice===stockPrice)){
    stockPrice+=1;
  }

  const valuablePositions = strategyPositions.filter(strategyPosition => strategyPosition.isCall ? strategyPosition.strikePrice < stockPrice : strategyPosition.strikePrice > stockPrice );
  const stocks = strategyPositions.filter(strategyPosition => !strategyPosition.isOption );

  const totalStockQuantity = stocks.reduce((totalStockQuantity, stock) => {
    return totalStockQuantity + stock.getQuantity();
  }, 0) || 0;


  const buyStockValuablePositions = valuablePositions.filter(valuablePosition=>(valuablePosition.isCall && valuablePosition.isBuy) || (valuablePosition.isPut && !valuablePosition.isBuy));
 
    let sellStockValuablePositions = valuablePositions.filter(
        valuablePosition =>
            (valuablePosition.isCall && !valuablePosition.isBuy) ||
            (valuablePosition.isPut && valuablePosition.isBuy)
    );

    sellStockValuablePositions.sort((posA, posB) => {

        // کال‌ها (فروش) اول، پوت‌ها (خرید) آخر
        if (posA.isCall !== posB.isCall) {
            return posA.isCall ? -1 : 1;
        }

        // مرتب‌سازی داخل هر گروه
        return posA.isCall
            ? posA.strikePrice - posB.strikePrice  // کال: صعودی
            : posB.strikePrice - posA.strikePrice; // پوت: نزولی
    });


  const totalMargins = strategyPositions.reduce((totalMargins, position) => {
    const reservedMargin = getReservedMarginOfEstimationQuantity(position);
    totalMargins += reservedMargin;
    return totalMargins
  }, 0) || 0;



  const sumSettlementBuyStockCostInfo = buyStockValuablePositions.reduce((sumSettlementBuyStockCostInfo, valuablePosition) => {

    let quantity = valuablePosition.getQuantity();
    let nokoolQuantity = 0 ;

    if(valuablePosition.isBuy){
      nokoolQuantity = quantity * nokoolOrNoRequestFactor;
    }

    quantity = quantity* (1- nokoolOrNoRequestFactor);



    sumSettlementBuyStockCostInfo.sumOfCost += (quantity * (valuablePosition.strikePrice + (valuablePosition.strikePrice * exerciseFee)))
    sumSettlementBuyStockCostInfo.quantity += quantity;

    if(nokoolQuantity>0){

      sumSettlementBuyStockCostInfo.sumOfCost -= someOfNokoolGainCalculator({nokoolQuantity,stockPrice,strikePrice:valuablePosition.strikePrice});

    }

    return sumSettlementBuyStockCostInfo;

  }, { sumOfCost: 0, quantity: 0 });


  let sellLimitQuantity = sumSettlementBuyStockCostInfo.quantity + totalStockQuantity;


  const sumSettlementSellStockGainInfo = sellStockValuablePositions.reduce((sumSettlementSellStockGainInfo, valuablePosition) => {

    const tax = isTaxFree(valuablePosition) ? 0 : COMMISSION_FACTOR.OPTION.SETTLEMENT.SELL_TAX;
    let quantity = valuablePosition.getQuantity();

    let sellQuantity=0;
    let notEnoughStockQuantity=0;

    if(quantity<=sellLimitQuantity){

      sellQuantity = quantity;
      
    }else{
      sellQuantity = sellLimitQuantity;
      notEnoughStockQuantity = quantity-sellLimitQuantity;
    }

    sumSettlementSellStockGainInfo.sumOfGains += (sellQuantity * (valuablePosition.strikePrice - (valuablePosition.strikePrice * exerciseFee) - (valuablePosition.strikePrice * tax)))
    sumSettlementSellStockGainInfo.quantity += sellQuantity;
    sellLimitQuantity-=sellQuantity;

    if(notEnoughStockQuantity>0){
      if(valuablePosition.isBuy) return sumSettlementSellStockGainInfo

      const someOfNokoolGain = someOfNokoolGainCalculator({nokoolQuantity:notEnoughStockQuantity,stockPrice,strikePrice:valuablePosition.strikePrice});
      const exerciseFeeOfNokool = notEnoughStockQuantity * valuablePosition.strikePrice * exerciseFee;
      sumSettlementSellStockGainInfo.sumOfGains -= (someOfNokoolGain + exerciseFeeOfNokool);


    }



    return sumSettlementSellStockGainInfo;

  }, { sumOfGains: 0,quantity:0 });



  const remainedStockQuantity = sumSettlementBuyStockCostInfo.quantity - sumSettlementSellStockGainInfo.quantity;

  let sumOfGain =  sumSettlementSellStockGainInfo.sumOfGains - sumSettlementBuyStockCostInfo.sumOfCost;

  if (remainedStockQuantity > 0) {
    const optionPosition =  strategyPositions.find(sp=>sp.isOption);
    const sellStockFee = isTaxFree(optionPosition) ? COMMISSION_FACTOR.ETF.SELL : COMMISSION_FACTOR.STOCK.SELL;
    sumOfGain += (remainedStockQuantity * (stockPrice - (stockPrice * sellStockFee)))
  } 


  if(totalMargins){
    sumOfGain +=totalMargins;
  }

  return sumOfGain

}

const settlementProfitCalculator = ({ strategyPositions, stockPrice,nokoolOrNoRequestFactor=0 }) => {

  
  const sumOfGains = settlementGainCalculator({ strategyPositions, stockPrice,nokoolOrNoRequestFactor })


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


const QueueScenario = {
    normal: "normal",
    buyQueue: "buyQueue",
    sellQueue: "sellQueue"
}
const getNearSettlementPrice = ({strategyPositions, strategyPosition, stockPrice, stockPriceAdjustFactor = configs.stockPriceAdjustFactor, scenario = QueueScenario.normal }) => {


    const tradeFee = strategyPosition.isBuy ? COMMISSION_FACTOR.OPTION.BUY : COMMISSION_FACTOR.OPTION.SELL;
    const exerciseFee = COMMISSION_FACTOR.OPTION.SETTLEMENT.EXERCISE_FEE;

    if(strategyPositions.length>2){
       stockPriceAdjustFactor =stockPriceAdjustFactor-1;
       stockPriceAdjustFactor = (stockPriceAdjustFactor/2)  + 1
    }


    // const tax = isTaxFree(strategyPosition) ? 0 : COMMISSION_FACTOR.OPTION.SETTLEMENT.SELL_TAX;

    const isBuy = strategyPosition.isBuy;

    const calculatePremiumAfterFees = (isCall, adjustedStockPrice, strikePrice) => {
        if (isCall) {
            return (adjustedStockPrice - (strikePrice * (1 + exerciseFee))) / (1 + tradeFee);

        } else {
            return (strikePrice * (1 - exerciseFee) - adjustedStockPrice) / (1 + tradeFee);

        }

    }

    function calculateConservativeCallPremium(stockPrice, strikePrice) {

        const adjustedStockPrice = isBuy ? stockPrice / stockPriceAdjustFactor : stockPrice * stockPriceAdjustFactor;
        if (adjustedStockPrice <= strikePrice) return 0

        let optionPremium = calculatePremiumAfterFees(true, adjustedStockPrice, strikePrice);

        return optionPremium;
    }

    function calculateBuyQueueCallPremium(stockPrice, strikePrice) {
        let optionPremium = calculatePremiumAfterFees(true, stockPrice, strikePrice);
        return optionPremium + (stockPrice * configs.jarimehNokoolFactor)

    }
    function calculateBuyQueuePutPremium(stockPrice, strikePrice) {
        const adjustedStockPrice = stockPrice * 1.1;
        let optionPremium = calculatePremiumAfterFees(false, adjustedStockPrice, strikePrice);
        return optionPremium

    }

    function calculateConservativePutPrice(stockPrice, strikePrice) {


        const adjustedStockPrice = isBuy ? stockPrice * stockPriceAdjustFactor : stockPrice / stockPriceAdjustFactor;
        if (adjustedStockPrice >= strikePrice) return 0


        let optionPremium = calculatePremiumAfterFees(false, adjustedStockPrice, strikePrice);

        return optionPremium;
        //  return (strikePrice * (1 - tax - exerciseFee) - adjustedStockPrice) / (1 + tradeFee);
    }


    const calculateConservativePremium = (stockPrice, strategyPosition) => {
        if (strategyPosition.isCall) {
            return calculateConservativeCallPremium(stockPrice, strategyPosition.strikePrice)
        } else {
            return calculateConservativePutPrice(stockPrice, strategyPosition.strikePrice)
        }

    }
    const calculateBuyQueuePremium = (stockPrice, strategyPosition) => {
        if (strategyPosition.isCall) {
            return calculateBuyQueueCallPremium(stockPrice, strategyPosition.strikePrice)
        } else {
            return calculateBuyQueuePutPremium(stockPrice, strategyPosition.strikePrice)
        }

    }

    let price


    const calculators = {
        [QueueScenario.normal]: calculateConservativePremium,
        [QueueScenario.buyQueue]: calculateBuyQueuePremium,
    };

    if (strategyPosition.isOption) {
        price = calculators[scenario](stockPrice, strategyPosition);



    } else {
        price = stockPrice;
    }



    price = isBuy
        ? Math.floor(price)
        : Math.ceil(price);

    return Math.max(price, 0);
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
      reject(new Error(`Element "${checkerFn}" not found within ${timeout} ms`));
    }, timeout);
  });
}


function createDeferredPromise() {
  let resolve, reject;
  
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  
  return { promise, resolve, reject };
}




async function takeScreenshot() {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: false,
    preferCurrentTab: true,
    selfBrowserSurface: "include",
  });

  const video = document.createElement('video');
  video.srcObject = stream;
  await video.play();

  // کمی صبر برای آماده شدن فریم
  await new Promise(r => setTimeout(r, 200));

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  canvas.getContext('2d').drawImage(video, 0, 0);

  // خیلی مهم: استریم رو ببند
  stream.getTracks().forEach(t => t.stop());

  // تبدیل به blob
  const blob = await new Promise(res =>
    canvas.toBlob(res, 'image/png')
  );


  try {
    // نوشتن در clipboard
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
    console.log('Screenshot copied to clipboard');
    
  } catch (error) {
    
  }
  

   // 👇 شروع دانلود
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `screenshot-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  
}

const ETF_LIST = ['اهرم', 'توان', 'موج', 'جهش','هم تراز','آساس','شتاب'];
const TAX_FREE_SYMBOLS = ['ضهرم', 'طهرم', 'ضتوان', 'طتوان', 'ضموج', 'طموج','ضجهش','طجهش','ضراز','طراز',];


const isETF = (instrumentName)=>{
  const isETF = ETF_LIST.some(_etfName => instrumentName === _etfName);

  return isETF
}



const hasBreakevenExecutedPriceDiffIssue =({executedPrice,breakEvenPrice})=>{


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

  return hasIssue()
  
}


const calcAveragePriceByExecutedOrders = (orders)=>{

    let position = 0; // تعداد سهام در پوزیشن (مثبت: خرید، منفی: فروش)
    let totalCost = 0; // ارزش کل خریدها
    let averagePrice = 0;
    
    // فیلتر کردن سفارشات معتبر (فقط سفارشات انجام شده با مقدار و قیمت معتبر)
    const validOrders = orders.filter(order => 
        order.orderStatus === "CompletelySettled" && 
        order.executedQuantity > 0 
    );
    
    // مرتب‌سازی بر اساس تاریخ
    const sortedOrders = [...validOrders].sort((a, b) => 
        new Date(a.createdDate) - new Date(b.createdDate)
    );
    
    
    for (const order of sortedOrders) {
        const quantity = order.executedQuantity;
        const price = order.executedPrice;
        const isBuy = order.orderSide === "Buy";
        
        if (isBuy) {
            if (position >= 0) {
                // در موقعیت خرید یا خنثی
                totalCost += quantity * price;
                position += quantity;
                averagePrice = totalCost / position;
            } else {
                // در موقعیت فروش
                const remainingShort = -position;
                
                if (quantity <= remainingShort) {
                    position += quantity;
                } else {
                    const coveringQuantity = remainingShort;
                    const newBuyQuantity = quantity - coveringQuantity;
                    position = 0;
                    
                    totalCost = newBuyQuantity * price;
                    position = newBuyQuantity;
                    averagePrice = price;
                }
            }
        } else { // Sell
            if (position <= 0) {
                // در موقعیت فروش یا خنثی
                const shortPosition = -position;
                const newShortValue = (shortPosition * averagePrice) + (quantity * price);
                position -= quantity;
                averagePrice = newShortValue / (-position);
            } else {
                // در موقعیت خرید
                const remainingLong = position;
                
                if (quantity <= remainingLong) {
                    totalCost -= quantity * averagePrice;
                    position -= quantity;
                    
                    if (position > 0) {
                        averagePrice = totalCost / position;
                    }
                } else {
                    const coveringQuantity = remainingLong;
                    const newSellQuantity = quantity - coveringQuantity;
                    
                    position = 0;
                    totalCost = 0;
                    
                    position = -newSellQuantity;
                    averagePrice = price;
                }
            }
        }
    }
    
    // تابع برای نمایش با 3 رقم اعشار (بدون گرد کردن)
    const to3Decimal = (num) => {
        if (isNaN(num) || num === 0) return 0;
        return Math.floor(num * 1000) / 1000;
    };
    
    return {
        quantity: position,
        averagePrice: to3Decimal(averagePrice),
        totalValue: to3Decimal(Math.abs(position) * averagePrice),
        side: position > 0 ? "Long" : (position < 0 ? "Short" : "Neutral")
    };

}



const isBuyQueue = (stock) => {
  if(!stock?.bestBuy || !stock.beforeTodayPrice || !stock.bestBuyQ) return 
  const isPriceNearCeil = stock.bestBuy / stock.beforeTodayPrice > 1.026;
  const isQueue = (stock.bestBuyQ * stock.bestBuy) > 100000000000;
  return isPriceNearCeil && isQueue

}
const isSellQueue = (stock) => {
  if(!stock?.bestSell || !stock.beforeTodayPrice || !stock.bestSellQ) return 
  const isPriceNearFloor = stock.bestSell / stock.beforeTodayPrice < 0.974;
  const isQueue = (stock.bestSellQ * stock.bestSell) > 100000000000;
  return isPriceNearFloor && isQueue

}


const  startMarketCountdown = ({
    targetHour = 12,
    targetMinute = 30,
    showFromSeconds = 60,
    warningSeconds = 15,
    containerId = 'market-countdown'
} = {}) => {

    let container = document.getElementById(containerId);
    let timer;

    if (!container) {
        container = document.createElement('div');
        container.id = containerId;

        Object.assign(container.style, {
            position: 'fixed',
            bottom: '2px',
            left: '2px',
            zIndex: '999999',
            padding: '5px 5px',
            borderRadius: '10px',
            background: '#111',
            color: '#fff',
            fontSize: '22px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            boxShadow: '0 4px 15px rgba(0,0,0,.3)',
            display: 'none',
            transition: 'all .15s'
        });

        document.body.appendChild(container);
    }

    // CSS مربوط به حالت هشدار
    if (!document.getElementById('market-countdown-style')) {
        const style = document.createElement('style');
        style.id = 'market-countdown-style';

        style.textContent = `
            @keyframes marketCountdownBlink {
                0%, 100% {
                    opacity: 1;
                    transform: scale(1);
                }
                50% {
                    opacity: .45;
                    transform: scale(1.08);
                }
            }

            #market-countdown.warning {
                background: #d50000 !important;
                color: #fff !important;
                animation: marketCountdownBlink .5s infinite;
                box-shadow: 0 0 20px rgba(255, 0, 0, .8);
            }
        `;

        document.head.appendChild(style);
    }

    function update() {
        const now = new Date();

        const target = new Date(now);
        target.setHours(targetHour, targetMinute, 0, 0);

        const diff = target - now;

        // هنوز زمان نمایش نرسیده
        if (diff > showFromSeconds * 1000) {
            container.style.display = 'none';
            container.classList.remove('warning');
            return;
        }

        // پایان بازار
        if (diff <= 0) {
            container.textContent = '⏰ پایان بازار';
            container.style.display = 'none';
            container.classList.remove('warning');

            clearInterval(timer);
            return;
        }

        const totalSeconds = Math.ceil(diff / 1000);

        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        container.textContent =
            `⏳ پایان بازار: ${minutes}:${String(seconds).padStart(2, '0')}`;

        container.style.display = 'block';

        // 15 ثانیه آخر
        if (totalSeconds <= warningSeconds) {
            container.classList.add('warning');
        } else {
            container.classList.remove('warning');
        }
    }

    update();

    timer = setInterval(update, 250);
}


const calculateExerciseCost =({strategyPositions, stockPrice}) => {
    let total = 0;

    for (const item of strategyPositions) {
        const isCallBuyInMoney = item.isCall && item.isBuy && item.strikePrice < stockPrice;
        const isPutSellInMoney = item.isPut && !item.isBuy && item.strikePrice > stockPrice;

        if (isCallBuyInMoney || isPutSellInMoney) {
            const qty = item.getCurrentPositionQuantity();
            total += item.strikePrice * qty ;
        }
    }

    return total;
}

/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   OMEXApi: () => (/* binding */ OMEXApi),
/* harmony export */   cacheItemsTemporarily: () => (/* binding */ cacheItemsTemporarily),
/* harmony export */   calculateSumOfMoneyAndAssets: () => (/* binding */ calculateSumOfMoneyAndAssets),
/* harmony export */   createGroup: () => (/* binding */ createGroup),
/* harmony export */   createStrategyListForAllGroups: () => (/* binding */ createStrategyListForAllGroups),
/* harmony export */   fillEstimationPanelByStrategyName: () => (/* binding */ fillEstimationPanelByStrategyName),
/* harmony export */   findDuplicationsInGroups: () => (/* binding */ findDuplicationsInGroups),
/* harmony export */   findStrategyOfGroup: () => (/* binding */ findStrategyOfGroup),
/* harmony export */   getBlockedAmount: () => (/* binding */ getBlockedAmount),
/* harmony export */   getCustomerOptionStrategyEstimationWithItems: () => (/* binding */ getCustomerOptionStrategyEstimationWithItems),
/* harmony export */   getOptionPortfolioList: () => (/* binding */ getOptionPortfolioList),
/* harmony export */   getStockPortfolioList: () => (/* binding */ getStockPortfolioList),
/* harmony export */   getStockPricesData: () => (/* binding */ getStockPricesData),
/* harmony export */   getSumOfPositionsOfGroups: () => (/* binding */ getSumOfPositionsOfGroups),
/* harmony export */   getWalletInfo: () => (/* binding */ getWalletInfo),
/* harmony export */   isInstrumentNameOfOption: () => (/* binding */ isInstrumentNameOfOption)
/* harmony export */ });
/* harmony import */ var _common__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);


// https://khobregan.tsetab.ir
const origin = window.location.origin;
const redOrigin = origin.replace('.tsetab','-red.tsetab');
const deltaOrigin = origin.replace('.tsetab','-delta.tsetab');



const getWalletInfo = async () => {

    

    const walletInfo = await fetch(`${redOrigin}/api/Customers/wallet-info`, {
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
    }).then(response => response.json()).then(res => res.response?.data[0])

    return walletInfo

}


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

const getStockPortfolioList = async () => {

    const list = await fetch(`${deltaOrigin}/api/assets/portfolio-info`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-GB,en;q=0.9,fa-IR;q=0.8,fa;q=0.7,en-US;q=0.6",
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
    }).then(response => response.json()).then(res => res.response?.data?.items);

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



const getStockPricesData = async (instrumentIds)=>{

    return fetch(`${redOrigin}/api/PublicMessages/InstTrades`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-GB,en;q=0.9,fa-IR;q=0.8,fa;q=0.7,en-US;q=0.6",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "content-type": "application/json",
            "ngsw-bypass": "",
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


const getInstrumentInfoBySymbol = async (instrumentNames) => {
    // اگر ورودی رشته باشد، به آرایه تبدیل می‌کنیم
    const names = Array.isArray(instrumentNames) ? instrumentNames : [instrumentNames];
    
    if (names.length === 0) {
        return Array.isArray(instrumentNames) ? [] : null;
    }
    
    // مرحله 1: دریافت ID همه سهم‌ها به صورت موازی
    const searchPromises = names.map(async (name) => {
        try {
            const instrumentNameObj = await searchOptionContractInfos(name);
            if (!instrumentNameObj) return null;
            
            return {
                name: name,
                instrumentId: instrumentNameObj.instrumentId,
                isOption: isInstrumentNameOfOption(name)
            };
        } catch (error) {
            console.error(`Error searching ${name}:`, error);
            return null;
        }
    });
    
    const searchResults = await Promise.all(searchPromises);
    const validResults = searchResults.filter(result => result !== null);
    
    if (validResults.length === 0) {
        return Array.isArray(instrumentNames) ? [] : null;
    }
    
    // تفکیک ID های آپشن و سهام
    const optionIds = validResults
        .filter(item => item.isOption)
        .map(item => item.instrumentId);
    
    const stockIds = validResults
        .filter(item => !item.isOption)
        .map(item => item.instrumentId);
    
    // مرحله 2: دریافت اطلاعات با یک ریکویست برای هر نوع
    const [optionInfos, stockInfos] = await Promise.all([
        optionIds.length > 0 ? getOptionContractInfos(optionIds) : [],
        stockIds.length > 0 ? getStockInfos(stockIds) : []
    ]);
    
    // ساخت مپ از id به اطلاعات برای دسترسی سریع
    const infoMap = new Map();

    const baseInstrumentId = optionInfos[0].baseInstrumentId;


    const [stockPriceInfoOfOption] = await getStockPricesData([baseInstrumentId]);
    
    optionInfos.forEach(info => {
        const searchResult = validResults.find(validResult=>validResult.instrumentId===info.instrumentId);
        const stockPrice = stockPriceInfoOfOption.pDrCotVal;
        infoMap.set(info.instrumentId, {...info,instrumentName:searchResult.name,stockPrice});
    });
    
    stockInfos.forEach(info => {
        const searchResult = validResults.find(validResult=>validResult.instrumentId===info.instrumentId);
        const stockPrice = stockPriceInfoOfOption.pDrCotVal;
        infoMap.set(info.instrumentId, {...info,instrumentName:searchResult.name,stockPrice});
    });
    
    // مرحله 3: ساخت نتیجه نهایی به ترتیب ورودی
    const results = validResults
        .map(item => infoMap.get(item.instrumentId) || null)
        .filter(info => info !== null);
    
    // اگر ورودی تکی بود، همان شیء را برگردانید
    return Array.isArray(instrumentNames) ? results : (results[0] || null);
};

const getInstrumentInfoBySymbol2 = async (instrumentName)=>{

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

const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
};

const getOrders = async (instrumentId,daysAgo = 120)=>{

    const today = new Date();
    const fromDateObj = new Date(today);
    fromDateObj.setDate(today.getDate() - daysAgo);

    const fromDate = formatDate(fromDateObj);

    return fetch(`${redOrigin}/api/Orders/GetHistoryOrders?$count=true&instrumentId=${instrumentId}&fromDate=${fromDate}`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-GB,en;q=0.9,fa-IR;q=0.8,fa;q=0.7,en-US;q=0.6",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "ngsw-bypass": "",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Chromium\";v=\"148\", \"Google Chrome\";v=\"148\", \"Not/A)Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": "https://khobregan.tsetab.ir/",
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
    }).then(response => response.json()).then(res => {
        const orders = res.response.data;
        if (!orders?.length) return null
        return orders
    });
}

const calcAveragePrice = async (instrumentId)=>{

    const orders = await getOrders(instrumentId);

    const averageInfo  = (0,_common__WEBPACK_IMPORTED_MODULE_0__.calcAveragePriceByExecutedOrders)(orders);

    return  averageInfo

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



const getOptionStrategies = async () => {
    return fetch(`${redOrigin}/api/OptionStrategies/Get`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-GB,en;q=0.9,fa-IR;q=0.8,fa;q=0.7,en-US;q=0.6",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "ngsw-bypass": "",
            "sec-ch-ua": "\"Not=A?Brand\";v=\"99\", \"Google Chrome\";v=\"151\", \"Chromium\";v=\"151\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": "https://khobregan.tsetab.ir/",
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
    }).then(response => response.json()).then(res => {
        const optionStrategies = res.response.data;
        return optionStrategies
    });
}



const findStrategyOfGroup = ({ group, strategies,portfolioList }) => {

    const groupPositions = group.instrumentIds.map(instrumentId=>portfolioList.find(position=>position.instrumentId===instrumentId));

    const foundStrategy = strategies.find(strategy => {


        strategy.rowLength = strategy.items.length;
        const strategyItems = Array.from(new Map(strategy.items.map(sItem => [sItem.instrumentId, sItem])).values());

        const hasAllInstrumentId = groupPositions.every(groupPosition => strategyItems.find(sItem => groupPosition && sItem && groupPosition.instrumentId === sItem.instrumentId && groupPosition.orderSide === sItem.side));


        return hasAllInstrumentId && strategyItems.length === group.instrumentIds.length

    });

    return foundStrategy

}



const selectStrategy =async ({documentOfWindow=document,groups,portfolioList,strategies}={})=>{
    const _document  = documentOfWindow || document;
    const selectedGroupTitle = _document.querySelector('client-option-positions-filter-bar .-is-group ng-select .u-ff-number').innerHTML;

    groups ??= await getGroups();

    let selectedGroup = groups.find(group=>selectedGroupTitle.includes(group.name));

    portfolioList ??= await getOptionPortfolioList();

    strategies ??= await getCustomerOptionStrategyEstimationWithItems();


    const foundStrategy  = findStrategyOfGroup({group:selectedGroup,strategies,portfolioList});

    if(!foundStrategy) return



    const  estimationListButton = _document.querySelector('client-option-strategy-estimation-header button[label="لیست برآوردها"]');


    estimationListButton.click();
    await new Promise(r => setTimeout(r, 200));

    const estimationListSearchInput = _document.querySelector('client-option-strategy-estimation-list c-k-input-search input');
    estimationListSearchInput.value=  foundStrategy.title;
    estimationListSearchInput.dispatchEvent(new Event('input', { bubbles: true }));




    const searchResultElementList = _document.querySelectorAll('client-option-strategy-estimation-list .o-items-container .o-item');

    await new Promise(r => setTimeout(r, 200));


    Array.from(searchResultElementList).find(searchResultElement=>searchResultElement.querySelector('span').innerHTML===foundStrategy.title)?.click()

    // console.log(foundStrategy);

    return {
        strategyTitle:foundStrategy.title,
        _document,
        strategyRowLength:foundStrategy.rowLength}
    

}

const getSumOfPositionsOfGroups = async ()=>{
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

    return {
        sum,
        areNotInGroups
    }
    
}


const calculateBlockedAmount =(optionPortfolioList)=>{

    return optionPortfolioList.map(op=>op.blockedAmount).filter(Boolean).reduce((sum,current)=>sum+current,0)

}


const getBlockedAmount = ()=>{

    getOptionPortfolioList().then(list=>{
        console.log(calculateBlockedAmount(list))
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
            const searchInput = row?.querySelector('client-option-strategy-estimation-main-ui-instrument-search input');

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
            const resultBodyElement = await (0,_common__WEBPACK_IMPORTED_MODULE_0__.waitForElement)(row,()=>row.querySelector('client-option-strategy-estimation-main-ui-instrument-search ng-dropdown-panel .ng-dropdown-panel-items .ng-option:first-child .c-resultBody'));
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


const createGroup = ({ name, instrumentIds }) => {

    return fetch(`${redOrigin}/api/AssetGrouping/Create`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-GB,en;q=0.9,fa-IR;q=0.8,fa;q=0.7,en-US;q=0.6",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "content-type": "application/json",
            "ngsw-bypass": "",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Google Chrome\";v=\"143\", \"Chromium\";v=\"143\", \"Not A(Brand\";v=\"24\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": `${origin}/`,
        "body": JSON.stringify({
            name,
            "assetGroupingTypeId": "OpenPosition",
            instrumentIds
        }),
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    });

}



const createStrategyListForAllGroups = async ()=>{


    const groups = await getGroups();


    const portfolioList = await getOptionPortfolioList();


    const strategies = await getCustomerOptionStrategyEstimationWithItems();



    const strategyListForAllGroups = groups.map(group=>{
        const positions = group.instrumentIds.map(instrumentId=>portfolioList.find(position=>position.instrumentId===instrumentId))
        const strategy  = findStrategyOfGroup({group,strategies,portfolioList});;


        if(!strategy?.items) {
            console.log(group);
            return null
        }

        const strategyPositions = strategy.items.map(strategyItem=>{

            const portfolioPosition = positions.find(pos=>pos.instrumentId===strategyItem.instrumentId)

            const instrumentName = portfolioPosition.instrumentName;
           
            return {
                instrumentName,
                isBuy: strategyItem.side === 'Buy',
                isETF: (0,_common__WEBPACK_IMPORTED_MODULE_0__.isETF)(instrumentName),
                isOption: isInstrumentNameOfOption(instrumentName),
                isCall: portfolioPosition.optionSide==="Call",
                isPut: portfolioPosition.optionSide==="Put",
                cSize: portfolioPosition.cSize,
                // getBaseInstrumentPriceOfOption,


                quantityOfEstimationPositionRow: strategyItem.quantity,
                // getQuantity:()=>strategyItem.quantity,
                portfolioPositionQuantity:portfolioPosition.blockedStrategyQuantity,
                // getCurrentPositionQuantity:()=>portfolioPosition.blockedStrategyQuantity,


                requiredMargin : strategyItem.requiredMargin / portfolioPosition.cSize,
                // getRequiredMargin : strategyItem.requiredMargin / portfolioPosition.cSize,
                currentPositionAvgPrice: portfolioPosition.executedPrice,
                strikePrice : portfolioPosition.strikePrice,
                daysLeftToSettlement : portfolioPosition.remainCsDateDays,
                // getBestOffsetPrice,
                // getBestOpenMorePrice,
                // getBestOpenMorePriceWithSideSign,
                // getStrategyName,
                // getStrategyType,

            }
        })

        return {group,strategy,strategyPositions}

       

        
    }).filter(Boolean)



    console.log(strategyListForAllGroups);
    




}

const isInstrumentNameOfOption = (instrumentName)=> ['ض', 'ط'].some(optionChar => instrumentName && instrumentName.charAt(0) === optionChar);




const calculateSumOfMoneyAndAssets  = async ()=>{


    const [optionPortfolioList,assetPortfolioList,walletInfo] = await Promise.all(
        [
            getOptionPortfolioList(),
            getStockPortfolioList(),
            getWalletInfo()
        ]
    )


    // const blockedAmount = await calculateBlockedAmount(optionPortfolioList);

    const sumCostWithoutMarginOfOptions = optionPortfolioList.reduce((sumCostWithoutMarginOfOptions,option)=>{

        const {orderSide,cSize,count,executedPrice} = option;
        const sumOfExecutedValue =  orderSide==='Buy' ? cSize * count * executedPrice * (1 + _common__WEBPACK_IMPORTED_MODULE_0__.COMMISSION_FACTOR.OPTION.BUY) : (cSize * count * executedPrice)/(1+_common__WEBPACK_IMPORTED_MODULE_0__.COMMISSION_FACTOR.OPTION.SELL);

        sumCostWithoutMarginOfOptions += orderSide==='Buy' ? sumOfExecutedValue : - sumOfExecutedValue;

        return sumCostWithoutMarginOfOptions

    },0);


    let isThereFreeRiskETF=false;
    const sumCostOfAssetsWithoutFreeRiskETF = assetPortfolioList.reduce((sumCostOfAssetsWithoutFreeRiskETF,asset)=>{

        const {quantity,executedPrice,instrumentId} = asset;
        if(instrumentId==='IRT3KMDF0001'){
            isThereFreeRiskETF=true;
            return sumCostOfAssetsWithoutFreeRiskETF
        }
        const sumOfExecutedValue =   quantity * executedPrice *  (1 + _common__WEBPACK_IMPORTED_MODULE_0__.COMMISSION_FACTOR.STOCK.BUY);
        sumCostOfAssetsWithoutFreeRiskETF += sumOfExecutedValue;

        return sumCostOfAssetsWithoutFreeRiskETF

    },0);



    const {customerOptionPurchasePowerT2,blockedAmount} = walletInfo;



    const sumOfMoneyAndAssets = sumCostWithoutMarginOfOptions + customerOptionPurchasePowerT2 + blockedAmount + sumCostOfAssetsWithoutFreeRiskETF;
    console.log(sumOfMoneyAndAssets.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }));


    const calculatedBlockedAmount = optionPortfolioList.filter(position=>position.blockedAmount).reduce((sum,position)=>sum+position.blockedAmount,0);



    return {
        sumOfMoneyAndAssets,
        sumCostWithoutMarginOfOptions,
        blockedAmount,
        calculatedBlockedAmount,
        customerOptionPurchasePowerT2,
        sumCostOfAssetsWithoutFreeRiskETF
    }

    
}

const cacheItemsTemporarily = async (item)=>{
    localStorage.setItem(
        'tempCachedItems',
        JSON.stringify(item)
    );
}


const findDuplicationsInGroups = async ()=>{
    const groups = await getGroups();
    const optionPortfolioList = await getOptionPortfolioList();


    cacheItemsTemporarily({groups,optionPortfolioList});


    const duplicateMap = new Map();

    for (const group of groups) {
        for (const instrumentId of group.instrumentIds) {
            if (!duplicateMap.has(instrumentId)) {
                duplicateMap.set(instrumentId, {
                    count: 0,
                    groups: []
                });
            }

            const item = duplicateMap.get(instrumentId);
            item.count++;
            item.groups.push({
                id: group.id,
                name: group.name
            });
        }
    }

    const instrumentNameMap = new Map(
        optionPortfolioList.map(item => [
            item.instrumentId,
            item.instrumentName
        ])
    );

    const duplicates = [...duplicateMap.entries()]
        .filter(([_, value]) => value.count > 1)
        .map(([instrumentId, value]) => ({
            instrumentId,
            instrumentName: instrumentNameMap.get(instrumentId) ?? 'نامشخص',
            count: value.count,
            groups: value.groups
        }));

    console.log(duplicates);

    duplicates.forEach(item => {
        console.log(
            `${item.instrumentName} (${item.instrumentId}) در ${item.count} گروه استفاده شده:`,
            item.groups.map(group => group.name).join("، ")
        );
    });
}

const FIXED_MARGIN_STRATEGIES = new Set([
  "BearCallSpread",
  "BullPutSpread",
]);




const calculateFixedMargin = async () => {


    const positions = await getOptionPortfolioList();
    const strategies = await getOptionStrategies();
    const positionMap = new Map(
        positions.map(p => [p.instrumentId, p])
    );

    let totalFixedDMargin = 0;

    const details = [];

    for (const strategy of strategies) {

        // فعلاً Butterfly را جداگانه مدیریت می‌کنیم
        if (!FIXED_MARGIN_STRATEGIES.has(strategy.type)) {
            continue;
        }

        const p1 = positionMap.get(strategy.baseStrategyInstrumentId);
        const p2 = positionMap.get(strategy.strategyInstrumentId);

        if (!p1 || !p2) {
            console.warn(
                "Position not found for strategy:",
                strategy.type,
                strategy.id,
                strategy.baseStrategyInstrumentName,
                strategy.strategyInstrumentName
            );

            continue;
        }

        const strike1 = Number(p1.strikePrice);
        const strike2 = Number(p2.strikePrice);

        const contractSize = Number(p1.cSize);

        // تعداد واقعی Spread
        const quantity = Number(
            strategy.quantity
        );

        const strikeDifference = Math.abs(strike1 - strike2);

        const margin =
            strikeDifference *
            contractSize *
            quantity;

        totalFixedDMargin += margin;

        details.push({
            strategyId: strategy.id,
            type: strategy.type,

            instrument1: p1.instrumentName,
            instrument2: p2.instrumentName,

            strike1,
            strike2,
            strikeDifference,

            contractSize,
            quantity,

            margin
        });
    }

    console.log({ totalFixedDMargin, details });


    return {
        totalFixedDMargin,
        details
    };
}


const getVariableMargin = async()=>{

    const {totalFixedDMargin} = await calculateFixedMargin();
    const {calculatedBlockedAmount} = await calculateSumOfMoneyAndAssets();
    const variableMargin = calculatedBlockedAmount - totalFixedDMargin;

    console.log({calculatedBlockedAmount,totalFixedDMargin,variableMargin})


    return {
        calculatedBlockedAmount,
        totalFixedDMargin,
        variableMargin
    }

}




const OMEXApi = {
    getGroups,
    getOptionPortfolioList,
    getStockPortfolioList,
    getOptionContractInfos,
    getInstrumentInfoBySymbol,
    deleteAllOpenOrders,
    selectStrategy,
    getSumOfPositionsOfGroups,
    getBlockedAmount,
    fillEstimationPanelByStrategyName,
    createGroup,
    createStrategyListForAllGroups,
    calculateSumOfMoneyAndAssets,
    calcAveragePrice,
    findDuplicationsInGroups,
    getVariableMargin,
    getCustomerOptionStrategyEstimationWithItems,
    findStrategyOfGroup,
    getStockPricesData
}

/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _flashTitle__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(4);


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
/* 4 */
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


/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createIntervalLogger: () => (/* binding */ createIntervalLogger)
/* harmony export */ });

// TODO: use in extension for multiple tabs
function createIntervalLogger({ key, interval, sync }) {
  if (!key || !interval || typeof sync !== "function") {
    throw new Error("Invalid logger configuration");
  }

  function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function loadLogs() {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveLogs(logs) {
    try {
      const keys = Object.keys(logs).sort().reverse();
      const trimmed = {};

      for (let i = 0; i < Math.min(3, keys.length); i++) {
        trimmed[keys[i]] = logs[keys[i]];
      }

      localStorage.setItem(key, JSON.stringify(trimmed));
    } catch {}
  }

  function canCollect(logs) {
    const today = getTodayKey();
    const todayLogs = logs[today];
    if (!todayLogs || todayLogs.length === 0) return true;

    const lastLog = todayLogs[todayLogs.length - 1];
    return Date.now() - lastLog.timestamp >= interval;
  }

  async function collect({isForce}={}) {
    try {
      const logs = loadLogs();

      // ⛔ قبل از sync

      if (!isForce && !canCollect(logs)) return;

      const data = await sync();

      const today = getTodayKey();
      const nowTs = Date.now();

      if (!logs[today]) logs[today] = [];

      logs[today].push({
        time: new Date(nowTs).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestamp: nowTs,
        data,
      });

      saveLogs(logs);

    } catch (err) {
      console.error(`Logger [${key}] error:`, err);
    }
  }

  // اجراها
  collect();
  const timer = setInterval(collect, interval);

  // API خروجی
  return {
    stop() {
      clearInterval(timer);
    },
    collect,
    getLogs() {
      return loadLogs();
    },
    clear() {
      localStorage.removeItem(key);
    }
  };
}

/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   showStrategyExerciseCostSummary: () => (/* binding */ showStrategyExerciseCostSummary)
/* harmony export */ });
// strategySummary.js

const STYLE_ID = "strategy-summary-style";
const MODAL_ID = "strategy-summary-modal";

// ===== تزریق CSS فقط یک بار =====
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .ss-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      animation: ss-fade 0.2s ease;
    }
    @keyframes ss-fade {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    .ss-modal {
      background: #fff;
      border-radius: 14px;
      padding: 20px;
      width: 90%;
      max-width: 560px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 10px 40px rgba(0,0,0,0.25);
      font-family: Tahoma, sans-serif;
      direction: rtl;
      animation: ss-slide 0.2s ease;
    }
    @keyframes ss-slide {
      from { transform: translateY(-10px); opacity: 0; }
      to   { transform: translateY(0);     opacity: 1; }
    }
    .ss-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .ss-header h2 {
      margin: 0;
      font-size: 17px;
      color: #111827;
    }
    .ss-close {
      background: none;
      border: none;
      font-size: 22px;
      color: #9ca3af;
      cursor: pointer;
      line-height: 1;
    }
    .ss-close:hover { color: #374151; }

    .ss-group {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 12px;
      background: #f9fafb;
    }
    .ss-group-title {
      font-weight: bold;
      color: #1d4ed8;
      margin-bottom: 10px;
      font-size: 15px;
    }
    .ss-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      font-size: 13px;
    }
    .ss-label { color: #6b7280; margin-bottom: 4px; }
    .ss-value { font-weight: bold; color: #111827; }

    .ss-empty {
      text-align: center;
      color: #9ca3af;
      padding: 20px;
    }
  `;
  document.head.appendChild(style);
}

// ===== گروه‌بندی داده‌ها =====
function groupByDays(data) {
  const map = new Map();

  data.forEach(item => {
    const key = item.daysLeftToSettlement;
    if (!map.has(key)) {
      map.set(key, {
        daysLeftToSettlement: key,
        totalExerciseCost: 0,
        totalPositions: 0,
        strategyCount: 0
      });
    }
    const g = map.get(key);
    g.totalExerciseCost += item.exerciseCost || 0;
    g.totalPositions += (item.strategyPositions || []).length;
    g.strategyCount += 1;
  });

  return Array.from(map.values()).sort(
    (a, b) => a.daysLeftToSettlement - b.daysLeftToSettlement
  );
}

// ===== ساخت HTML مودال =====
function buildModalHTML() {
  return `
    <div class="ss-overlay" id="${MODAL_ID}">
      <div class="ss-modal">
        <div class="ss-header">
          <h2>خلاصه بر اساس روز تا تسویه</h2>
          <button class="ss-close" data-ss-close>&times;</button>
        </div>
        <div class="ss-content"></div>
      </div>
    </div>
  `;
}

// ===== پر کردن محتوا =====
function renderContent(modal, strategies) {
  const content = modal.querySelector(".ss-content");
  const grouped = groupByDays(strategies);

  if (grouped.length === 0) {
    content.innerHTML = '<div class="ss-empty">داده‌ای موجود نیست</div>';
    return;
  }

  content.innerHTML = grouped.map(g => `
    <div class="ss-group">
      <div class="ss-group-title">${g.daysLeftToSettlement} روز تا تسویه</div>
      <div class="ss-grid">
        <div>
          <div class="ss-label">مجموع هزینه اعمال</div>
          <div class="ss-value">${g.totalExerciseCost.toLocaleString("fa-IR")}</div>
        </div>
        <div>
          <div class="ss-label">تعداد پوزیشن‌ها</div>
          <div class="ss-value">${g.totalPositions}</div>
        </div>
        <div>
          <div class="ss-label">تعداد استراتژی‌ها</div>
          <div class="ss-value">${g.strategyCount}</div>
        </div>
      </div>
    </div>
  `).join("");
}

// ===== تابع اصلی که export می‌شه =====
function showStrategyExerciseCostSummary(strategies) {
  injectStyles();

  // اگه قبلاً باز بود، پاک کن
  const existing = document.getElementById(MODAL_ID);
  if (existing) existing.remove();

  // ساخت و اضافه کردن مودال
  const wrapper = document.createElement("div");
  wrapper.innerHTML = buildModalHTML().trim();
  const modal = wrapper.firstElementChild;
  document.body.appendChild(modal);

  // رندر محتوا
  renderContent(modal, strategies);

  // بستن
  const close = () => {
    modal.remove();
    document.removeEventListener("keydown", onKey);
  };

  modal.querySelector("[data-ss-close]").addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  const onKey = (e) => {
    if (e.key === "Escape") close();
  };
  document.addEventListener("keydown", onKey);

  return close; // برگردوندن تابع بستن (اختیاری)
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
/* harmony export */   OMEXApi: () => (/* reexport safe */ _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi),
/* harmony export */   Run: () => (/* binding */ Run),
/* harmony export */   STRATEGY_NAME_PROFIT_CALCULATOR: () => (/* binding */ STRATEGY_NAME_PROFIT_CALCULATOR),
/* harmony export */   calcAvgPricesByExecutenList: () => (/* binding */ calcAvgPricesByExecutenList),
/* harmony export */   calcOffsetProfitOfStrategy: () => (/* binding */ calcOffsetProfitOfStrategy),
/* harmony export */   calcProfitOfStrategy: () => (/* binding */ calcProfitOfStrategy),
/* harmony export */   checkSumOfMoneyAndAssets: () => (/* binding */ checkSumOfMoneyAndAssets),
/* harmony export */   configs: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_0__.configs),
/* harmony export */   createGroupOfCurrentStrategy: () => (/* binding */ createGroupOfCurrentStrategy),
/* harmony export */   doJob: () => (/* binding */ doJob),
/* harmony export */   enrichGroupByStrategyInfo: () => (/* binding */ enrichGroupByStrategyInfo),
/* harmony export */   expectedProfit: () => (/* binding */ expectedProfit),
/* harmony export */   getAllGroupStrategyListForExport: () => (/* binding */ getAllGroupStrategyListForExport),
/* harmony export */   getStrategyInfoForExport: () => (/* binding */ getStrategyInfoForExport),
/* harmony export */   getSummaryNameOfStrategy: () => (/* binding */ getSummaryNameOfStrategy),
/* harmony export */   groupLogger: () => (/* binding */ groupLogger),
/* harmony export */   hasCurrentQuantityIssue: () => (/* binding */ hasCurrentQuantityIssue),
/* harmony export */   isProfitEnough: () => (/* binding */ isProfitEnough),
/* harmony export */   isReachedToExpectedOffsetProfit: () => (/* binding */ isReachedToExpectedOffsetProfit),
/* harmony export */   openAllGroupsInNewTabs: () => (/* binding */ openAllGroupsInNewTabs),
/* harmony export */   openGroupInNewTab: () => (/* binding */ openGroupInNewTab),
/* harmony export */   openStrategyExerciseCostSummaryModal: () => (/* binding */ openStrategyExerciseCostSummaryModal),
/* harmony export */   portfolioLogger: () => (/* binding */ portfolioLogger),
/* harmony export */   showToast: () => (/* binding */ showToast),
/* harmony export */   showVariableMargin: () => (/* binding */ showVariableMargin),
/* harmony export */   silentNotificationForMoment: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_0__.silentNotificationForMoment),
/* harmony export */   strategyPositions: () => (/* binding */ strategyPositions)
/* harmony export */ });
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var _omexApi_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2);
/* harmony import */ var _desktopNotificationCheck_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3);
/* harmony import */ var _createIntervalLogger_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(5);
/* harmony import */ var _strategyExerciseCostSummary_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(6);









;



 



let groupLogger,portfolioLogger;


const defaultCSize = 1000;
const defaultDaysLeftToSettlement = 30;

const initLoggers = () => {

    try {

        groupLogger = (0,_createIntervalLogger_js__WEBPACK_IMPORTED_MODULE_3__.createIntervalLogger)({
            key: "strategyGroups",
            interval: 30 * 60 * 1000,
            sync: _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi.getGroups
        });
        portfolioLogger = (0,_createIntervalLogger_js__WEBPACK_IMPORTED_MODULE_3__.createIntervalLogger)({
            key: "optionPortfolio",
            interval: 30 * 60 * 1000,
            sync: _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi.getOptionPortfolioList
        });

        
    } catch (error) { }

}


const doJob=()=>{
    console.log('DON')

}

// FIXME:expectedProfitPerMonth is factor but minExpectedProfitOfStrategy is percent
let expectedProfit = {
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
        _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi.deleteAllOpenOrders();
        await new Promise(resolve => setTimeout(resolve, 500));
        _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi.deleteAllOpenOrders();
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





const totalOffsetGainNearSettlementOfEstimationPanel = ({ strategyPositions , stockPrice=getBaseInstrumentPriceOfOption() }) => {

    const getBestPriceCbNormalQueue = (_strategyPosition) => (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.getNearSettlementPrice)({strategyPositions,strategyPosition: _strategyPosition, stockPrice ,scenario : _common_js__WEBPACK_IMPORTED_MODULE_0__.QueueScenario.normal});
    const getBestPriceCbBuyQueue = (_strategyPosition) => (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.getNearSettlementPrice)({strategyPositions,strategyPosition: _strategyPosition, stockPrice ,scenario : _common_js__WEBPACK_IMPORTED_MODULE_0__.QueueScenario.buyQueue});

    
    return {

        defaultQueue: (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.mainTotalOffsetGainCalculator)({
            strategyPositions,
            getBestPriceCb: getBestPriceCbNormalQueue,
            getReservedMargin: _strategyPosition => {
                return (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.getReservedMarginOfEstimationQuantity)(_strategyPosition)
            }
        }),
        buyQueue: (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.mainTotalOffsetGainCalculator)({
            strategyPositions,
            getBestPriceCb: getBestPriceCbBuyQueue,
            getReservedMargin: _strategyPosition => {
                return (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.getReservedMarginOfEstimationQuantity)(_strategyPosition)
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







const MARGIN_CALC_TYPE = {
    BY_CURRENT_POSITION: "BY_CURRENT_POSITION",
    BY_GIVEN_PRICE: "BY_GIVEN_PRICE"
}

const lastCheckProfitByExactDecimalPricesOfPortFolio={
};


const calcProfitLossByExactDecimalPricesOfPortFolio = async (_strategyPositions)=>{

    const portfolioList = await _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi.getOptionPortfolioList();
    const stockPortfolioList  = await _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi.getStockPortfolioList();
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
    

    const totalCostOfChunkOfEstimationQuantity = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.totalCostCalculatorForPriceTypes)(_strategyPositions).totalCostOfChunkOfEstimationQuantity;

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


let lastCheckSumOfMoneyAndAssetsTime;
const checkSumOfMoneyAndAssets = async (isForce)=>{
    // const localstorageKey = 'SumOfMoneyAndAssets';
    // if(!isForce  && lastCheckSumOfMoneyAndAssetsTime && (Date.now() - lastCheckSumOfMoneyAndAssetsTime)<60000 ) return 
    // lastCheckSumOfMoneyAndAssetsTime = Date.now();


    // const prevSumOfMoneyAndAssets = localStorage.getItem(localstorageKey);


    const {sumOfMoneyAndAssets,blockedAmount,calculatedBlockedAmount}= await _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi.calculateSumOfMoneyAndAssets();



    if((0,_common_js__WEBPACK_IMPORTED_MODULE_0__.hasGreaterRatio)({num1:blockedAmount,num2:calculatedBlockedAmount,properRatio:1.05})){
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

        (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.showNotification)({
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


const calcOffsetProfitOfStrategy = ({strategyPositions,stockPrice=getBaseInstrumentPriceOfOption()}) => {


    const totalCostInfoObj = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.totalCostCalculatorForPriceTypes)(strategyPositions);

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



    

    let profitLossByOffsetOrdersPercent = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
        costWithSign: totalCostOfChunkOfEstimationQuantity,
        gainWithSign: totalOffsetGainOfChunkOfEstimation.byOffsetOrderPrices
    });

    let profitLossByInsertedPricesPercent = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
        costWithSign: totalCostOfChunkOfEstimationQuantity,
        gainWithSign: totalOffsetGainOfChunkOfEstimation.byInsertedPrices
    });

    let profitPercentOfCurrentPositionsByNearSettlementPrices = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
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
            return logObj.data.find(instrument => instrumentNameList.includes(instrument.instrumentName) && (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.hasBreakevenExecutedPriceDiffIssue)({ executedPrice: instrument.executedPrice, breakEvenPrice: instrument.breakEvenPrice }))
        });

        hadIssuedLog && issueMap.push({dateKey,hadIssuedLog})

    }

    return issueMap

}

const isReachedToExpectedOffsetProfit = ({
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

        (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.showNotification)({
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

        const isOption = (0,_omexApi_js__WEBPACK_IMPORTED_MODULE_1__.isInstrumentNameOfOption)(instrumentName);

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
                currentPositionQuantity = strategyItem.portfolioAssetInfo?.count;
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
            if (executedPrice && breakEvenPrice && (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.hasBreakevenExecutedPriceDiffIssue)({executedPrice,breakEvenPrice})) {

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
            isETF : (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.isETF)(instrumentName),
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


const getStrategyInfoForExport = ()=>{
    
    return prepareStrategyForExport({strategyPositions})

}


const openStrategyExerciseCostSummaryModal = async ()=>{
    const  groupStrategyInfoList = await enrichGroupByStrategyInfo();
    console.log(groupStrategyInfoList);
    
    (0,_strategyExerciseCostSummary_js__WEBPACK_IMPORTED_MODULE_4__.showStrategyExerciseCostSummary)(groupStrategyInfoList.map(groupStrategyInfo=>groupStrategyInfo.strategy).filter(Boolean));
}

const getAllGroupStrategyListForExport = async ()=>{
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



        (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.showNotification)({
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
                (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.showNotification)({
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


const isProfitEnough = ({ strategyPositions, totalProfitPercent, daysLeftToSettlement,expectedProfit }) => {
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
        (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.showNotification)({
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

const STRATEGY_NAME_PROFIT_CALCULATOR = {

    utils: {},

   
    OTHERS({strategyPositions,stockPrice=getBaseInstrumentPriceOfOption(),nokoolOrNoRequestFactor=getnokoolOrNoRequestFactor()}) {

        const totalCostObj = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.totalCostCalculatorForPriceTypes)(strategyPositions);


        const totalOffsetGainInfo = totalOffsetGainNearSettlementOfEstimationPanel({
            strategyPositions: strategyPositions,
            stockPrice
        });

        const profitPercentByBestPrices = {
            defaultQueue: (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
                costWithSign: totalCostObj.totalCostByBestPrices,
                gainWithSign: totalOffsetGainInfo.defaultQueue
            }),
            buyQueue: (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
                costWithSign: totalCostObj.totalCostByBestPrices,
                gainWithSign: totalOffsetGainInfo.buyQueue
            })
        } 

        const profitPercentByInsertedPrices ={
            defaultQueue: (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
                costWithSign: totalCostObj.totalCostByInsertedPrices,
                gainWithSign: totalOffsetGainInfo.defaultQueue
            }),
            buyQueue: (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.profitPercentCalculator)({
                costWithSign: totalCostObj.totalCostByInsertedPrices,
                gainWithSign: totalOffsetGainInfo.buyQueue
            })
        } 



       
        const {settlementProfitByBestPrices,settlementProfitByInsertedPrices} = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.settlementProfitCalculator)({strategyPositions:strategyPositions,stockPrice,nokoolOrNoRequestFactor});

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

const calcProfitOfStrategy = async (_strategyPositions) => {

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

const hasCurrentQuantityIssue = ({strategyPositions,currentQuantityGetter,strategyQuantityGetter})=>{


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

const fillCurrentStockPriceByStrikes = (strategyPositions)=>{

    const greaterThanStrikes = Math.max(...strategyPositions.map(sp=>sp.strikePrice)) * 1.2;

    const stockPrice = instrumentExtraDataMap[strategyPositions[0].instrumentName]?.stockPrice || greaterThanStrikes;


    const baseInstrumentPriceInputEl = domContextWindow.document.querySelector('.current-stock-price');


    baseInstrumentPriceInputEl.value = stockPrice



}

const  instrumentExtraDataMap = {};

const getAndSetInstrumentData = async (strategyPositions)=>{

    const strategyPositionWithInstrumentInfo = async (strategyPositions) => {

        const instIdInfoMap = await _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi.getInstrumentInfoBySymbol(strategyPositions.map(stP=>stP.instrumentName));

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


const calcAvgPricesByExecutenList =async ()=>{

    const requests = strategyPositions.map(async (strategyPosition) => {
        const instrumentID = strategyPosition.getInstrumentID();
        const averageInfo = await _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi.calcAveragePrice(instrumentID);
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

const showVariableMargin = async () => {

    const { variableMargin } = await _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi.getVariableMargin();

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

    const { promise, resolve, reject } = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.createDeferredPromise)();
    const newWindow = window.open(`${_origin}/#/stock/derivative/main/strategy-estimation?GSTitle=${groupTitle}`);

    if (!newWindow) {
        alert('پنجره توسط مرورگر مسدود شد!');
        return;
    }

    newWindow.onload = function () {
        setTimeout(async function () {
            try {
                const groupTab = await (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.waitForElement)(newWindow.document,()=>newWindow.document.querySelector('c-k-tab-default:nth-child(4) button'),60000);
                groupTab.click();
                await (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.waitForElement)(newWindow.document,()=>newWindow.document.querySelector('client-option-positions-layout client-option-positions-main client-grid .ag-body-viewport div[comp-id]'),60000);
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


const setTradeModalUiPositions = ({strategyPositions}) => {

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
    console.log(strategyTitle)
    setStrategyTitleOnUrl({strategyTitle});
}



const openGroupInNewTab = async ({ groupName, _origin, groups, portfolioList, strategies }) => {


    const childWindow = await openWindowAndSelectGroup(groupName,_origin);
    

    const { strategyRowLength,strategyTitle } = await _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi.selectStrategy({documentOfWindow:childWindow.document,groups, portfolioList, strategies});

    setStrategyTitleOnUrl({strategyTitle,_window:childWindow});


    await (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.waitForElement)(childWindow.document, () => {
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

const openAllGroupsInNewTabs = async ()=>{

    const groups = await _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi.getGroups();

    const portfolioList = await _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi.getOptionPortfolioList();
    
    const strategies = await _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi.getCustomerOptionStrategyEstimationWithItems();

    // for (const group of groups.slice(0, 1)) {
    for (const group of groups) {

        openGroupInNewTab({
            groupName:group.name, 
            groups, 
            portfolioList, 
            strategies
        });
        await new Promise(r => setTimeout(r, 100));
        
    }

}

const enrichGroupByStrategyInfo = async ()=>{

    const groups = await _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi.getGroups();

    const portfolioList = await _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi.getOptionPortfolioList();
    
    const strategies = await _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi.getCustomerOptionStrategyEstimationWithItems();

  

    const stockPriceList = await _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi.getStockPricesData(portfolioList.map(asset=>asset.baseInstrumentId));


    return groups.map(group=>{

        const strategy  = _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi.findStrategyOfGroup({group,strategies,portfolioList});

        if(!strategy){
            showToast(`استراتژی یافت نشد`);
            console.log(`${group.name}`)
            return {...group,strategy}
        }

        strategy.items = strategy.items.map(strategyitem => {
            return {
                ...strategyitem,
                strategyTitle: strategy.title,
                portfolioAssetInfo: portfolioList.find(p => p.instrumentId === strategyitem.instrumentId)
            }
        });
        const baseInstrumentId = strategy.items.find(
            item => item.portfolioAssetInfo?.baseInstrumentId
        )?.portfolioAssetInfo.baseInstrumentId;


        strategy.baseInstrumentId = baseInstrumentId;
        strategy.strategyPositions = createPositionObjectArray(strategy.items);
        strategy.stockPrice = stockPriceList.find(asset=>asset.instrumentId===baseInstrumentId)?.pDrCotVal;
        strategy.daysLeftToSettlement = strategy.strategyPositions.find(sp => sp.getDaysLeftToSettlement() !== null)?.getDaysLeftToSettlement();
        strategy.exerciseCost = (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.calculateExerciseCost)({strategyPositions:strategy.strategyPositions,stockPrice:strategy.stockPrice});

        return {...group,strategy}
    });

}


const getSummaryNameOfStrategy = () => {


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

const createGroupOfCurrentStrategy = async ()=>{

    try {

        const response = await _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi.createGroup({
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

        const { sum, areNotInGroups } = await _omexApi_js__WEBPACK_IMPORTED_MODULE_1__.OMEXApi.getSumOfPositionsOfGroups();
        if(areNotInGroups?.length){
            const issueMessage = 'در گروه نیستن'
            showToast(issueMessage,10000,'error');
            console.log({sum,areNotInGroups});
            (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.showNotification)({
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

        (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.showNotification)({
                title: issueMessage,
                body: `${strategyPositions.map(instrumentName => instrumentName).join('-')}`,
                tag: `createGroupError`
        });
        
    }
   
    (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.takeScreenshot)();
}

function showToast(message, duration = 2000,type ='default') {
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

let strategyPositions;


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


const Run = async (_window = window) => {

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


    (0,_common_js__WEBPACK_IMPORTED_MODULE_0__.startMarketCountdown)();


    getAndSetStrategyTitleOnUrl();

    setModalHeaders(strategyPositions);


    
    console.log(strategyPositions);


}

// Run();









})();

omexLib = __webpack_exports__;
/******/ })()
;