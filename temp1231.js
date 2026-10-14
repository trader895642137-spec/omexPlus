const calcSellPutStrategies = (list, { priceType, expectedProfitPerMonth,
    minProfitToFilter,
    filteredList,
    optionsGroupedByStock,
    minStockPriceToSarBeSar=-Infinity, maxStockPriceToSarBeSar=Infinity,
    min_time_to_settlement = -Infinity, max_time_to_settlement = Infinity,
    minVol = CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif = false, ...restConfig }) => {

   

    let enrichedList = [];
    for (let [stockSymbol, optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({ optionDetails }) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap(([date, optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (!option.optionDetails?.stockSymbolDetails || !option.isPut) {
                    return option
                }


                const marginPerQuantity = option.calculatedRequiredMargin / 1000;

                const strategyPositions = [
                    {
                        ...option,
                        isBuy: false,
                        getQuantity: () => baseQuantity,
                        getRequiredMargin: () => marginPerQuantity
                    },

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



                const stockPriceToSarBeSarPercent = (breakeven / option.optionDetails.stockSymbolDetails.last) - 1;

                if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSar || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSar) {
                    return option
                }

                

                const profit = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: option.optionDetails.stockSymbolDetails.last });



               const profitPercent = profit / Math.abs(totalCost);



                const strategyObj = {
                    option: {
                        ...option
                    },
                    positions: [option],
                    strategyTypeTitle: "SellPut",
                    strategyPositions,
                    currentStockPrice: option.optionDetails?.stockSymbolDetails?.last,
                    totalCost,
                    minProfitToFilter,
                    expectedProfitNotif,
                    stockPriceToSarBeSarPercent,
                    expectedProfitPerMonth,
                    name: createStrategyName([option]),
                    profitPercent
                }

                if (Number.isNaN(strategyObj.profitPercent))
                    return option


                let allPossibleStrategies = [strategyObj]

                return {
                    ...option,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    

    return {
        
        allStrategies: enrichedList.flatMap(_option => _option.allPossibleStrategies).filter(Boolean),
        strategyName: "SellPut",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "SellPut",
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minVol
        })
    }

}