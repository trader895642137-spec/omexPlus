const calcBUCSStrategies = (list, {priceType,minProfitToFilter, expectedProfitPerMonth, settlementGainChoosePriceType="MIN", strategySubName, BUCSSOptionListIgnorer=generalConfig.BUCSSOptionListIgnorer, 
    min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement,
    filteredList, 
    optionsGroupedByStock,
    minStockPriceDistanceFromHigherStrikeInPercent=-Infinity, maxStockPriceDistanceFromHigherStrikeInPercent=Infinity, 
    minStockPriceToSarBeSar=-Infinity, maxStockPriceToSarBeSar=Infinity, 
    
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

   

    
    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (BUCSSOptionListIgnorer({
                    option,
                    minVol
                }))
                    return option

                const optionListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    if (_option.symbol === option.symbol || !_option.symbol.startsWith('ض') )
                        return false
                    if (_option.optionDetails?.strikePrice < option.optionDetails?.strikePrice)
                        return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceHigherStrikeRatio > minStockPriceDistanceFromHigherStrikeInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceFromHigherStrikeInPercent) {} else {
                        return false
                    }

                    
                    
                    return true

                }
                );

                let allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (_allPossibleStrategies, _option) => {

                    const strategyPositions = [
                        {
                            ...option,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                        {
                            ..._option,
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



                    const stockPriceToSarBeSarPercent = (breakeven / option.optionDetails.stockSymbolDetails.last) - 1;

                    if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSar || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSar) {
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

                    

                   


                    const settlementOn = settlementGainChoosePriceType === 'MIN' ? (_option.strikePrice < _option.optionDetails.stockSymbolDetails.last ? "OPTION" : "STOCK") : settlementGainChoosePriceType === 'MAX' ? (_option.strikePrice > _option.optionDetails.stockSymbolDetails.last ? "OPTION" : "STOCK") : "OPTION"
                    const offsetPrice = settlementOn === "OPTION" ? _option.strikePrice*1.2 : _option.optionDetails.stockSymbolDetails.last;



                    const priceThatCauseMaxProfit = Math.max(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) * 1.3;
                    const priceThatCauseMaxLoss = Math.min(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) / 1.3;



                    const maxProfit = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: priceThatCauseMaxProfit });
                    const maxLoss = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: priceThatCauseMaxLoss });


                    const profitLossRatio = maxProfit / (maxProfit - maxLoss);

                   

                    const profitPercent = profitPercentCalculator(
                        {
                            costWithSign:totalCost, 
                            gainWithSign:calcOffsetGainOfPositions({ strategyPositions, stockPrice: offsetPrice })
                        }) / 100



                
                    
                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, _option],
                        strategyTypeTitle: "BUCS",
                        strategyPositions,
                        currentStockPrice: option.optionDetails?.stockSymbolDetails?.last,
                        totalCost,
                        expectedProfitNotif,
                        minProfitToFilter,
                        expectedProfitPerMonth,
                        stockPriceToSarBeSarPercent,
                        isWholeProfitable:!breakeven,
                        profitLossRatio,
                        settlementTimeDiff : option.settlementTimeDiff,
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

    

    return {
        
        allStrategies: enrichedList.flatMap(_option => _option.allPossibleStrategies).filter(Boolean),
        strategyName: "BUCS",
        strategyDirection: STRATEGY_DIRECTION.BULLISH,
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceFromHigherStrikeInPercent,
        maxStockPriceDistanceFromHigherStrikeInPercent,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BUCS",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && minStockPriceDistanceFromHigherStrikeInPercent !== null && minStockPriceDistanceFromHigherStrikeInPercent !== -Infinity && {
                label: "minToHigh",
                value: `${((minStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && maxStockPriceDistanceFromHigherStrikeInPercent !== null && maxStockPriceDistanceFromHigherStrikeInPercent !== Infinity && {
                label: "maxToHigh",
                value: `${((maxStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof minStockPriceToSarBeSar !== 'undefined' && minStockPriceToSarBeSar !== null && minStockPriceToSarBeSar !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceToSarBeSar) * 100).toFixed(0)}%`
            }, typeof maxStockPriceToSarBeSar !== 'undefined' && maxStockPriceToSarBeSar !== null && maxStockPriceToSarBeSar !== Infinity && {
                label: "maxToSar",
                value: `${((maxStockPriceToSarBeSar) * 100).toFixed(0)}%`
            }, ].filter(Boolean),
            minVol
        })
    }

}


const calcBUPSStrategies = (list, {priceType,minProfitToFilter, expectedProfitPerMonth, settlementGainChoosePriceType="MIN", 
    strategySubName, BUPSOptionListIgnorer=generalConfig.BUPSOptionListIgnorer, 
    filteredList,
    optionsGroupedByStock,
    min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, 
    minStockPriceToSarBeSar=-Infinity, maxStockPriceToSarBeSar=Infinity, 
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {


    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (BUPSOptionListIgnorer({
                    option,
                    minVol
                }))
                    return option


                const optionPrice = getPriceOfAsset({
                    asset: option,
                    priceType,
                    sideType: 'BUY'
                });

                if(optionPrice===0) return option
               

                const optionListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === option.symbol || !_option.symbol.startsWith('ط'))
                        return false
                    if (_option.optionDetails?.strikePrice < option.optionDetails?.strikePrice)
                        return false
                    
                    return true

                }
                );

                let allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (_allPossibleStrategies, _option) => {




                    const _optionPrice = getPriceOfAsset({
                        asset: _option,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(_optionPrice===0) return _allPossibleStrategies




                    





                    const diffOfBUPS_Strikes = _option.optionDetails.strikePrice - option.optionDetails.strikePrice



                    const strategyPositions = [
                        {
                            ...option,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                        {
                            ..._option,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin: () => diffOfBUPS_Strikes
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



                    const stockPriceToSarBeSarPercent = (breakeven /option.optionDetails.stockSymbolDetails.last ) - 1;

                    if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSar || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSar) {
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


                    const settlementOn = settlementGainChoosePriceType === 'MIN' ? (_option.strikePrice < _option.optionDetails.stockSymbolDetails.last ? "OPTION" : "STOCK") : settlementGainChoosePriceType === 'MAX' ? (_option.strikePrice > _option.optionDetails.stockSymbolDetails.last ? "OPTION" : "STOCK") : "OPTION"
                    const offsetPrice = settlementOn === "OPTION" ? _option.strikePrice*1.2 : _option.optionDetails.stockSymbolDetails.last;



                    const priceThatCauseMaxProfit = Math.max(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) * 1.3;
                    const priceThatCauseMaxLoss = Math.min(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) / 1.3;



                    const maxProfit = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: priceThatCauseMaxProfit });
                    const maxLoss = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: priceThatCauseMaxLoss });


                    const profitLossRatio = maxProfit / (maxProfit - maxLoss);




                     const profitPercent = profitPercentCalculator(
                        {
                            costWithSign: totalCost, 
                            gainWithSign: calcOffsetGainOfPositions({ strategyPositions, stockPrice: offsetPrice })
                        }) / 100




                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, _option],
                        strategyTypeTitle: "BUPS",
                        strategyPositions,
                        currentStockPrice: option.optionDetails?.stockSymbolDetails?.last,
                        totalCost,
                        expectedProfitNotif,
                        minProfitToFilter,
                        expectedProfitPerMonth,
                        stockPriceToSarBeSarPercent,
                        isWholeProfitable:!breakeven,
                        profitLossRatio,
                        settlementTimeDiff : option.settlementTimeDiff,
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

    

    return {
        
        allStrategies: enrichedList.flatMap(_option => _option.allPossibleStrategies).filter(Boolean),
        strategyName: "BUPS",
        strategyDirection: STRATEGY_DIRECTION.BULLISH,
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceToSarBeSar,
        maxStockPriceToSarBeSar,
        
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BUPS",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceToSarBeSar,
            maxStockPriceToSarBeSar,
            minVol
        })
    }

}