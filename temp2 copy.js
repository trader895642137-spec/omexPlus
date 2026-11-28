const calcShortStraddleStrategies = (list, { priceType, minProfitToFilter, expectedProfitPerMonth, settlementGainChoosePriceType = "MIN",
    strategySubName,  min_time_to_settlement = -Infinity, max_time_to_settlement = generalConfig.max_time_to_settlement,
    toLowBreakevenPercent = -Infinity, maxStockPriceToLowBreakevenPercent = Infinity,
    filteredList,
    optionsGroupedByStock,
    minStockPriceToHighBreakevenPercent = -Infinity, maxStockPriceToHighBreakevenPercent = 0,
    minVol = CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif = false, ...restConfig }) => {


    let enrichedList = [];
    for (let [stockSymbol, optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({ optionDetails }) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap(([date, optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(sellingCall => {


                if (!sellingCall.isCall) return sellingCall


                const sellingCallPrice = getPriceOfAsset({
                    asset: sellingCall,
                    priceType,
                    sideType: 'SELL'
                });

                if (sellingCallPrice === 0) return sellingCall

                const putList = optionListOfSameDate.filter(_option =>
                    _option.isPut &&
                    _option.optionDetails?.strikePrice === sellingCall.optionDetails?.strikePrice
                );

                let allPossibleStrategies = putList.reduce((_allPossibleStrategies, sellingPut) => {

                    const sellingPutPrice = getPriceOfAsset({
                        asset: sellingPut,
                        priceType,
                        sideType: 'SELL'
                    });

                    if (sellingPutPrice === 0) return _allPossibleStrategies


                    const strategyPositions = [
                        {
                            ...sellingCall,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin: () => sellingCall.calculatedRequiredMargin / 1000
                        },
                        {
                            ...sellingPut,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin: () => sellingPut.calculatedRequiredMargin / 1000
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

                    let stockPriceToLowSarBeSarPercent, stockPriceToHighSarBeSarPercent, lowBreakeven, highBreakeven;


                    const stockPrice = sellingCall.optionDetails.stockSymbolDetails.last;
                    if (breakevenList?.length) {
                        lowBreakeven = Math.min(...breakevenList);
                        highBreakeven = Math.max(...breakevenList);
                        stockPriceToLowSarBeSarPercent = (lowBreakeven / stockPrice) - 1;
                        stockPriceToHighSarBeSarPercent = (highBreakeven / stockPrice) - 1;

                    }

                    const profit = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: stockPrice });



                    const profitPercent = profit / Math.abs(totalCost);
                    const strategyObj = {
                        option: {
                            ...sellingCall
                        },
                        positions: [sellingCall, sellingPut],
                        strategyTypeTitle: "SHORT_STRADDLE",
                        expectedProfitNotif,
                        strategyPositions,
                        currentStockPrice: stockPrice,
                        totalCost,
                        settlementTimeDiff: sellingCall.settlementTimeDiff,
                        minProfitToFilter,
                        stockPriceToLowSarBeSarPercent,
                        stockPriceToHighSarBeSarPercent,
                        lowBreakeven,
                        highBreakeven,
                        expectedProfitPerMonth,
                        name: createStrategyName([sellingCall, sellingPut]),
                        profitPercent
                    }

                    if (Number.isNaN(strategyObj.profitPercent))
                        return _allPossibleStrategies

                    return _allPossibleStrategies.concat([strategyObj])

                }
                    , []);

                return {
                    ...sellingCall,
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
        strategyName: "SHORT_STRADDLE",
        strategyDirection: STRATEGY_DIRECTION.NEUTRAL,
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "SHORT_STRADDLE",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [
                typeof minStockPriceToLowBreakevenPercent !== 'undefined' && minStockPriceToLowBreakevenPercent !== null && minStockPriceToLowBreakevenPercent !== -Infinity && {
                    label: "minToLow",
                    value: `${((minStockPriceToLowBreakevenPercent) * 100).toFixed(0)}%`
                },
                typeof maxStockPriceToHighBreakevenPercent !== 'undefined' && maxStockPriceToHighBreakevenPercent !== null && maxStockPriceToHighBreakevenPercent !== Infinity && {
                    label: "maxToHigh",
                    value: `${((maxStockPriceToHighBreakevenPercent) * 100).toFixed(0)}%`
                },].filter(Boolean),
            minVol
        })
    }

}