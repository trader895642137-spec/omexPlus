const calcBEPSStrategies = (list, {priceType, expectedProfitPerMonth, 
    settlementGainChoosePriceType="MAX",
    min_time_to_settlement=-Infinity, max_time_to_settlement=Infinity, 
    minStockPriceDistanceFromSarBeSarInPercent=-Infinity, maxStockPriceDistanceFromSarBeSarInPercent=Infinity, 
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ط') || option.vol < minVol || option.optionDetails.stockSymbolDetails.last > option.optionDetails.strikePrice) {
                    return option
                }
                const stockPriceLowerStrikeRatio = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;

                if (stockPriceLowerStrikeRatio < minStockPriceDistanceFromSarBeSarInPercent || stockPriceLowerStrikeRatio > maxStockPriceDistanceFromSarBeSarInPercent) {
                    return option
                }

                const optionListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === option.symbol || !_option.symbol.startsWith('ط') || _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice < option.optionDetails?.strikePrice)
                        return false

                    return true

                }
                );

                let allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (_allPossibleStrategies, _option) => {



                    const strategyPositions = [
                        {
                            ..._option,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                        {
                            ...option,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                       
                    ]


                    const breakevenList = findBreakevenList({
                        positions: strategyPositions,
                        getPrice: (strategyPosition) => getPriceOfAsset({
                            asset: strategyPosition,
                            priceType,
                            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                        })
                    });

                    const breakeven = breakevenList[0];



                    const stockPriceToSarBeSarPercent = (option.optionDetails.stockSymbolDetails.last / breakeven) - 1;

                    if (stockPriceToSarBeSarPercent < minStockPriceDistanceFromSarBeSarInPercent || stockPriceToSarBeSarPercent > maxStockPriceDistanceFromSarBeSarInPercent) {
                        return _allPossibleStrategies
                    }



                    const totalCost = totalCostCalculatorCommon({
                        strategyPositions,
                        getPrice: (strategyPosition) => getPriceOfAsset({
                            asset: strategyPosition,
                            priceType,
                            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                        })
                    });




                    const settlementOn = settlementGainChoosePriceType === 'MIN' ? (option.strikePrice < option.optionDetails.stockSymbolDetails.last ? "OPTION" : "STOCK") : settlementGainChoosePriceType === 'MAX' ? (option.strikePrice > option.optionDetails.stockSymbolDetails.last ? "OPTION" : "STOCK") : "OPTION"
                    const offsetPrice = settlementOn === "OPTION" ? option.strikePrice/1.2 : option.optionDetails.stockSymbolDetails.last;




                    const profit = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:offsetPrice});


                    const profitPercent = profit / Math.abs(totalCost);
                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, _option],
                        strategyTypeTitle: "BEPS",
                        expectedProfitNotif,
                        expectedProfitPerMonth,
                        name: createStrategyName([option, _option]),
                        profitPercent
                    }

                    if (Number.isNaN(strategyObj.profitPercent))
                        return _allPossibleStrategies

                    return _allPossibleStrategies.concat([strategyObj])

                }
                , []);

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

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "BEPS",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceFromSarBeSarInPercent,
        maxStockPriceDistanceFromSarBeSarInPercent,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BEPS",
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceFromSarBeSarInPercent,
            maxStockPriceDistanceFromSarBeSarInPercent,
            minVol
        })
    }

}