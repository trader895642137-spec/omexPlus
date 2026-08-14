const createAndCalcBusStrategy = ({ buyingCall, sellingCall, buyingPut, sellingPut }) => {

    const diffOfBEPS_Strikes = buyingPut.optionDetails?.strikePrice - sellingPut.optionDetails?.strikePrice;


    const strategyPositions = [
        {
            ...buyingCall,
            isBuy: true,
            getQuantity: () => baseQuantity,
            getRequiredMargin() { }
        },
        {
            ...sellingCall,
            isSell: true,
            getQuantity: () => baseQuantity,
            getRequiredMargin() { }
        },
        {
            ...sellingPut,
            isSell: true,
            getQuantity: () => baseQuantity,
            getRequiredMargin() { }
        },
        {
            ...buyingPut,
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



    const priceThatCauseMaxProfit = Math.max(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) * 1.2;
    const maxProfit = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: priceThatCauseMaxProfit });


    if (maxProfit <= 0) return null

    const currentPriceProfit = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: buyingCall.optionDetails.stockSymbolDetails.last });
    let profitPercent;



    let stockPriceToSarBeSarPercent;
    if (breakeven) {

        stockPriceToSarBeSarPercent = (breakeven / buyingCall.optionDetails.stockSymbolDetails.last) - 1;

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
        positions: [buyingCall, sellingCall, buyingPut, sellingPut],
        strategyTypeTitle: "BUS_With_BUCS_BEPS",
        expectedProfitNotif,
        minProfitToFilter,
        expectedProfitPerMonth,
        isWholeProfitable: !breakeven,
        stockPriceToSarBeSarPercent,
        name: createStrategyName([buyingCall, sellingCall, buyingPut, sellingPut]),
        profitPercent
    }
    return strategyObj

}