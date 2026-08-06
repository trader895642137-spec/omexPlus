const QueueScenario = {
    normal: "normal",
    buyQueue: "buyQueue",
    sellQueue: "sellQueue"
}
export const getNearSettlementPrice = ({ strategyPosition, stockPrice, stockPriceAdjustFactor = configs.stockPriceAdjustFactor, scenario = QueueScenario.normal }) => {


    const tradeFee = strategyPosition.isBuy ? COMMISSION_FACTOR.OPTION.BUY : COMMISSION_FACTOR.OPTION.SELL;
    const exerciseFee = COMMISSION_FACTOR.OPTION.SETTLEMENT.EXERCISE_FEE;


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