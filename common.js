export const COMMISSION_FACTOR = {
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

export const configs = {
  stockPriceAdjustFactor: 1.001,
  jarimehNokoolFactor : 0.01
}


let lastNotifTime = {};


let silentNotificationForMomentTimeoutID,_isSilentNotificationModeActive;


export const silentNotificationForMoment = (millisecond=160000) => {

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

export const showNotification = async ({ title, body, tag, requireInteraction }) => {
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
        
        notification.onclick = function () {
            window.parent.parent.focus();
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


export const isTaxFree = (_strategyPosition) => {

  return TAX_FREE_SYMBOLS.some(taxFreeName => _strategyPosition.instrumentName.includes(taxFreeName))

}
export const getCommissionFactor = (_strategyPosition) => {
  if (_strategyPosition.isOption) {
    return COMMISSION_FACTOR.OPTION
  }

  if (_strategyPosition.isETF) {
    return COMMISSION_FACTOR.ETF
  }

  return COMMISSION_FACTOR.STOCK
}


export const getReservedMarginOfEstimationQuantity = (strategyPosition) => {

  const requiredMargin = strategyPosition.getRequiredMargin();

  const quantity = strategyPosition.getQuantity();

  const marginOfEstimation = requiredMargin ? (requiredMargin * quantity) : 0

  return marginOfEstimation

}




export const totalCostCalculator = ({ strategyPositions, getPrice, getQuantity } = {}) => {
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




export const isHourMinGreaterThan = ({houre,minutes})=>{

    return ((new Date()).getHours() > houre || ((new Date()).getHours() === houre && (new Date()).getMinutes() >= minutes))
}

export const totalCostCalculatorForPriceTypes = (_strategyPositions) => {



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


export const profitPercentCalculator = ({ costWithSign, gainWithSign }) => {



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

export const someOfNokoolGainCalculator = ({nokoolQuantity=1,stockPrice , strikePrice})=>{

  const nokool = stockPrice > strikePrice ?  (nokoolQuantity * (stockPrice - strikePrice)) : 0;
  const jarimehNokool = nokoolQuantity * stockPrice * configs.jarimehNokoolFactor;

  return nokool + jarimehNokool
}


export const settlementGainCalculator = ({ strategyPositions, stockPrice,nokoolOrNoRequestFactor=0 })=>{

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
  let sellStockValuablePositions = valuablePositions.filter(valuablePosition=>(valuablePosition.isCall && !valuablePosition.isBuy) || (valuablePosition.isPut && valuablePosition.isBuy));

  sellStockValuablePositions = sellStockValuablePositions.sort((posA, posB) => {
    if (posA.strikePrice >= posB.strikePrice) {
      return -1
    } else {
      return 1
    }
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

export const settlementProfitCalculator = ({ strategyPositions, stockPrice,nokoolOrNoRequestFactor=0 }) => {

  
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





export const mainTotalOffsetGainCalculator = ({ strategyPositions, getBestPriceCb, getQuantity, getReservedMargin }) => {
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


export const QueueScenario = {
    normal: "normal",
    buyQueue: "buyQueue",
    sellQueue: "sellQueue"
}
export const getNearSettlementPrice = ({strategyPositions, strategyPosition, stockPrice, stockPriceAdjustFactor = configs.stockPriceAdjustFactor, scenario = QueueScenario.normal }) => {


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



export const hasGreaterRatio=({num1,num2,properRatio=100})=> {
    if (num2 === 0) {
        return true
    }
    const absNum1 = Math.abs(num1);
    const absNum2 = Math.abs(num2);
    const ratio = absNum1>absNum2 ? (absNum1 / absNum2) : (absNum2 / absNum1);

    return ratio>=properRatio
}


export const calculateOptionMargin=({ priceSpot, // قیمت پایانی دارایی پایه (ریال)
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


export const waitForElement = (parent,checkerFn, timeout = 4000) =>{
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


export function createDeferredPromise() {
  let resolve, reject;
  
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  
  return { promise, resolve, reject };
}




export async function takeScreenshot() {
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

export const ETF_LIST = ['اهرم', 'توان', 'موج', 'جهش','هم تراز','آساس','شتاب'];
export const TAX_FREE_SYMBOLS = ['ضهرم', 'طهرم', 'ضتوان', 'طتوان', 'ضموج', 'طموج','ضجهش','طجهش','ضراز','طراز',];


export const isETF = (instrumentName)=>{
  const isETF = ETF_LIST.some(_etfName => instrumentName === _etfName);

  return isETF
}



export const hasBreakevenExecutedPriceDiffIssue =({executedPrice,breakEvenPrice})=>{


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


export const calcAveragePriceByExecutedOrders = (orders)=>{

    let position = 0; // تعداد سهام در پوزیشن (مثبت: خرید، منفی: فروش)
    let totalCost = 0; // ارزش کل خریدها
    let averagePrice = 0;
    
    // فیلتر کردن سفارشات معتبر (فقط سفارشات انجام شده با مقدار و قیمت معتبر)
    const validOrders = orders.filter(order => 
        order.orderStatus === "CompletelySettled" && 
        order.executedQuantity > 0 && 
        order.executedPrice > 0
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



export const isBuyQueue = (stock) => {
  if(!stock?.bestBuy || !stock.beforeTodayPrice || !stock.bestBuyQ) return 
  const isPriceNearCeil = stock.bestBuy / stock.beforeTodayPrice > 1.026;
  const isQueue = stock.bestBuyQ * stock.bestBuy > 100000000;
  return isPriceNearCeil && isQueue

}


export const  startMarketCountdown = ({
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