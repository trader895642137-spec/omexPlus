export const getNearSettlementPrice = ({ strategyPosition, stockPrice, stockPriceAdjustFactor = configs.stockPriceAdjustFactor }) => {


  const tradeFee = strategyPosition.isBuy ? COMMISSION_FACTOR.OPTION.BUY : COMMISSION_FACTOR.OPTION.SELL;
  const exerciseFee = COMMISSION_FACTOR.OPTION.SETTLEMENT.EXERCISE_FEE
  // const tax = isTaxFree(strategyPosition) ? 0 : COMMISSION_FACTOR.OPTION.SETTLEMENT.SELL_TAX;

  const isBuy = strategyPosition.isBuy;

  function calculateCallPrice(stockPrice, strikePrice) {
    
    
    const adjustedStockPrice = isBuy ?  stockPrice / stockPriceAdjustFactor : stockPrice * stockPriceAdjustFactor;
    if (adjustedStockPrice <= strikePrice) return 0
    
    let optionPremium = (adjustedStockPrice - (strikePrice * (1 + exerciseFee))) / (1 + tradeFee);

    return optionPremium;
  }

  function calculatePutPrice(stockPrice, strikePrice) {
    
    
    const adjustedStockPrice = isBuy? stockPrice * stockPriceAdjustFactor : stockPrice / stockPriceAdjustFactor;
    if (adjustedStockPrice >= strikePrice) return 0
   
  
    let optionPremium = (strikePrice * (1 - exerciseFee) - adjustedStockPrice) / (1 + tradeFee);
    return optionPremium;
    //  return (strikePrice * (1 - tax - exerciseFee) - adjustedStockPrice) / (1 + tradeFee);
  }

  let price = strategyPosition.isOption?  strategyPosition.isCall ? calculateCallPrice(stockPrice, strategyPosition.strikePrice) : calculatePutPrice(stockPrice, strategyPosition.strikePrice) : stockPrice;


  price = isBuy
    ? Math.floor(price)
    : Math.ceil(price);

  return Math.max(price, 0);
}