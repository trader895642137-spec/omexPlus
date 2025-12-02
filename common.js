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
  stockPriceAdjustFactor: 1.001
}



const isBaseInstrumentETF = (strategyPosition)=>{
 const ETF_SYMBOLS = ['ضهرم', 'طهرم', 'ضتوان', 'طتوان', 'ضموج', 'طموج'];

 return ETF_SYMBOLS.some(etfSymbol => strategyPosition.instrumentName.includes(etfSymbol))

}


export const isTaxFree = (_strategyPosition) => {
  const TAX_FREE_NAMES = ['ضهرم', 'طهرم', 'ضتوان', 'طتوان', 'ضموج', 'طموج'];

  return TAX_FREE_NAMES.some(taxFreeName => _strategyPosition.instrumentName.includes(taxFreeName))

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

  totalCost = totalCost < 0 ? Math.floor(totalCost) : Math.ceil(totalCost);

  return totalCost
}

export const totalCostCalculatorForPriceTypes = (_strategyPositions,getAvgPrice) => {



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


export const profitPercentCalculator = ({ costWithSign, gainWithSign }) => {



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


export const settlementGainCalculator = ({ strategyPositions, stockPrice })=>{

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

export const settlementProfitCalculator = ({ strategyPositions, stockPrice }) => {

  
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


export const getNearSettlementPrice = ({ strategyPosition, stockPrice, stockPriceAdjustFactor = configs.stockPriceAdjustFactor }) => {


  const tradeFee = strategyPosition.isBuy ? COMMISSION_FACTOR.OPTION.BUY : COMMISSION_FACTOR.OPTION.SELL;
  const exerciseFee = COMMISSION_FACTOR.OPTION.SETTLEMENT.EXERCISE_FEE
  const tax = isTaxFree(strategyPosition) ? 0 : COMMISSION_FACTOR.OPTION.SETTLEMENT.SELL_TAX;
  const discounter = optionPremium => strategyPosition.isBuy ? (optionPremium - 1) : (optionPremium + 1)


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