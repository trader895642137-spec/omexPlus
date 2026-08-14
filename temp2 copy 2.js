const createAndCalcBusStrategy = ({ buyingCall, sellingCall, buyingPut, sellingPut ,priceType,minStockPriceToSarBeSar,maxStockPriceToSarBeSar,priceThatCauseMaxProfitFn}) => {




    const diffOfPuts_Strikes = sellingPut.optionDetails?.strikePrice - buyingPut.optionDetails?.strikePrice;
    const diffOfCalls_Strikes = buyingCall.optionDetails?.strikePrice - sellingCall.optionDetails?.strikePrice

    const strategyPositions = [
        {
            ...buyingPut,
            isBuy: true,
            getQuantity: () => baseQuantity,
            getRequiredMargin() { }
        },
        {
            ...sellingPut,
            isSell: true,
            getQuantity: () => baseQuantity,
            getRequiredMargin: () => diffOfPuts_Strikes > 0 ? diffOfPuts_Strikes : 0
        },
        {
            ...sellingCall,
            isSell: true,
            getQuantity: () => baseQuantity,
            getRequiredMargin: () => diffOfCalls_Strikes > 0 ? diffOfCalls_Strikes : 0
        },
        {
            ...buyingCall,
            isBuy: true,
            getQuantity: () => baseQuantity,
            getRequiredMargin() { }
        }
    ]



    const totalCost = totalCostCalculatorCommon({
        strategyPositions,
        getPrice: (strategyPosition) => getPriceOfAsset({
            asset: strategyPosition,
            priceType,
            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
        })
    });

    const breakevenList = findBreakevenList({
        positions: strategyPositions,
        getPrice: (strategyPosition) => getPriceOfAsset({
            asset: strategyPosition,
            priceType,
            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
        })
    });

    const breakeven = breakevenList[0];

    const priceThatCauseMaxProfit = priceThatCauseMaxProfitFn(strategyPositions);
    const maxProfit = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: priceThatCauseMaxProfit });


    const currentPriceProfit = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: buyingPut.optionDetails.stockSymbolDetails.last });
    let profitPercent;


    if (maxProfit <= 0) return null


    let stockPriceToSarBeSarPercent;
    if (breakeven) {

        stockPriceToSarBeSarPercent = (breakeven / buyingPut.optionDetails.stockSymbolDetails.last) - 1;

        if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSar || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSar)
            return null

        profitPercent = maxProfit / Math.abs(totalCost);
    } else {

        profitPercent = currentPriceProfit / Math.abs(totalCost);
    }







    const strategyObj = {
        option: {
            ...buyingCall
        },
        positions: [buyingPut, sellingPut, buyingCall, sellingCall],
        isWholeProfitable: !breakeven,
        stockPriceToSarBeSarPercent,
        name: createStrategyName([buyingPut, sellingPut, buyingCall, sellingCall]),
        profitPercent
    }

    return strategyObj

}