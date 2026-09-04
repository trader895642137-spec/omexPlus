

const calcBOXStrategies = (list, {priceType, expectedProfitPerMonth,
     min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, 
     minVol=CONSTS.DEFAULTS.MIN_VOL,
     minProfitToFilter, 
     filteredList,
            optionsGroupedByStock,
     expectedProfitNotif=false, ...restConfig}) => {

   

    let enrichedList = []
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ض') )
                    return option


                const optionPrice = getPriceOfAsset({
                        asset: option,
                        priceType,
                        sideType: 'BUY'
                });

                if(optionPrice===0) return option

                const optionListWithHigherStrikePrice = optionListOfSameDate.filter(_option => _option.symbol !== option.symbol && _option.symbol.startsWith('ض')  && _option.optionDetails?.strikePrice > option.optionDetails?.strikePrice);

                let allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (_allPossibleStrategies, higherStrikeOption) => {



                    const higherStrikeOptionPrice = getPriceOfAsset({
                        asset: higherStrikeOption,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(higherStrikeOptionPrice===0) return _allPossibleStrategies


                    const sameLowStrikePut = optionListOfSameDate.find(__option => __option.symbol === option.symbol.replace('ض', 'ط')  && __option.bestBuy);
                    const sameHighStrikePut = optionListOfSameDate.find(__option => __option.symbol === higherStrikeOption.symbol.replace('ض', 'ط')  && __option.bestSell);

                  

                    if (!sameLowStrikePut || !sameHighStrikePut)
                        return _allPossibleStrategies
                   

                    const sameLowStrikePutPrice = getPriceOfAsset({
                        asset: sameLowStrikePut,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(sameLowStrikePutPrice===0) return _allPossibleStrategies



                    const sameHighStrikePutPrice = getPriceOfAsset({
                        asset: sameHighStrikePut,
                        priceType,
                        sideType: 'BUY'
                    });

                    if(sameHighStrikePutPrice===0) return _allPossibleStrategies





                    const strategyPositions = [
                        {
                            ...option,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                        {
                            ...higherStrikeOption,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                        {
                            ...sameLowStrikePut,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                        {
                            ...sameHighStrikePut,
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



                    const offsetPrice =  Math.max(...strategyPositions.map(strategyPosition=>strategyPosition.strikePrice))* 1.2;
                    
                    
                    const profit = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:offsetPrice});;
                    

                    const profitPercent = profit / Math.abs(totalCost);

                    const settlementGain =  settlementGainCalculator({strategyPositions,stockPrice: option.optionDetails?.stockSymbolDetails?.last})

                    const profitOfSettlement = totalCost + settlementGain;
                    const profitPercentOfSettlement = profitOfSettlement / Math.abs(totalCost);

                    if(profitPercentOfSettlement<-0.05) return _allPossibleStrategies
                    
                    const strategyObj = {
                        // TODO:remove option prop
                        option: {
                            ...option
                        },
                        positions:[option,higherStrikeOption, sameLowStrikePut,sameHighStrikePut],
                        strategyTypeTitle: "BOX",
                        strategyPositions,
                        currentStockPrice: option.optionDetails?.stockSymbolDetails?.last,
                        totalCost,
                        expectedProfitNotif,
                        minProfitToFilter,
                        expectedProfitPerMonth,
                        isWholeProfitable:profit>=0, 
                        settlementTimeDiff : option.settlementTimeDiff,
                        name: createStrategyName([option, higherStrikeOption]),
                        profitPercent
                    }

                    if (Number.isNaN(strategyObj.profitPercent))
                        return _allPossibleStrategies

                    return _allPossibleStrategies.concat([strategyObj])

                }
                , []);

                // allPossibleStrategies = allPossibleStrategies.sort((strategyObjA, strategyObjB) => {
                //     if (strategyObjA.profitPercent < strategyObjB.profitPercent) {
                //         return 1;
                //     } else if (strategyObjA.profitPercent > strategyObjB.profitPercent) {
                //         return -1;
                //     }
                //     // a must be equal to b
                //     return 0;
                // }
                // )

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
        strategyName: "BOX",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BOX",
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minVol
        })
    }

}


const calcBOX_BUPS_BECSStrategies = (list, {priceType, expectedProfitPerMonth,
    minProfitToFilter, 
    filteredList,
            optionsGroupedByStock,
    min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    

    let enrichedList = []
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ط'))
                    return option


                const optionPrice = getPriceOfAsset({
                        asset: option,
                        priceType,
                        sideType: 'BUY'
                });

                if(optionPrice===0) return option

                const optionListWithHigherStrikePrice = optionListOfSameDate.filter(_option => _option.symbol !== option.symbol && _option.symbol.startsWith('ط')  && _option.optionDetails?.strikePrice > option.optionDetails?.strikePrice);

                let allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (_allPossibleStrategies, higherStrikeOption) => {


                    const higherStrikeOptionPrice = getPriceOfAsset({
                        asset: higherStrikeOption,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(higherStrikeOptionPrice===0) return _allPossibleStrategies

                    const sameLowStrikeCall = optionListOfSameDate.find(__option => __option.symbol === option.symbol.replace('ط', 'ض')  && __option.bestBuy);
                    const sameHighStrikeCall = optionListOfSameDate.find(__option => __option.symbol === higherStrikeOption.symbol.replace('ط', 'ض')  && __option.bestSell);
                    
                    if (!sameLowStrikeCall || !sameHighStrikeCall)
                        return _allPossibleStrategies

                    const sameLowStrikeCallPrice = getPriceOfAsset({
                        asset: sameLowStrikeCall,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(sameLowStrikeCallPrice===0) return _allPossibleStrategies


                    const sameHighStrikeCallPrice = getPriceOfAsset({
                        asset: sameHighStrikeCall,
                        priceType,
                        sideType: 'BUY'
                    });

                    if(sameHighStrikeCallPrice===0) return _allPossibleStrategies









                    const diffOfBUPS_Strikes = higherStrikeOption.optionDetails.strikePrice - option.optionDetails.strikePrice;
                    const diffOfBECS_Strikes = sameHighStrikeCall.optionDetails.strikePrice - sameLowStrikeCall.optionDetails.strikePrice;


                    const strategyPositions = [
                        {
                            ...option,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                        {
                            ...higherStrikeOption,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin: () => diffOfBUPS_Strikes
                        },
                        {
                            ...sameLowStrikeCall,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin: () => diffOfBECS_Strikes
                        },
                        {
                            ...sameHighStrikeCall,
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
                    
                   

                    const offsetPrice = Math.max(...strategyPositions.map(strategyPosition=>strategyPosition.strikePrice))* 1.2;

                    const profit = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:offsetPrice});;
                    

                    const profitPercent = profit  /  Math.abs(totalCost);










                    const settlementGain =  settlementGainCalculator({strategyPositions,stockPrice: option.optionDetails?.stockSymbolDetails?.last})

                    const profitOfSettlement = totalCost + settlementGain;
                    const profitPercentOfSettlement = profitOfSettlement / Math.abs(totalCost);

                    if(profitPercentOfSettlement<-0.05) return _allPossibleStrategies

                    
                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, higherStrikeOption,sameHighStrikeCall,sameLowStrikeCall],
                        strategyTypeTitle: "BOX_BUPS_BECS",
                        strategyPositions,
                        currentStockPrice: option.optionDetails?.stockSymbolDetails?.last,
                        totalCost,
                        expectedProfitNotif,
                        minProfitToFilter,
                        expectedProfitPerMonth,
                        isWholeProfitable:profit>=0, 
                        name: createStrategyName([option, higherStrikeOption]),
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
        strategyName: "BOX_BUPS_BECS",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BOX_BUPS_BECS",
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minVol
        })
    }

}


const calcLongGUTS_STRANGLEStrategies = (list, {priceType, expectedProfitPerMonth, 
    minProfitToFilter,
    settlementGainChoosePriceType="MIN", strategySubName,
    filteredList,
            optionsGroupedByStock, 
    min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, 
    minStockPriceDistanceFromHigherStrikeInPercent=-Infinity, maxStockPriceDistanceFromHigherStrikeInPercent=Infinity, 
    minStockPriceToSarBeSar=0, maxStockPriceToSarBeSar=Infinity, 
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {


   

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

               
                if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ض') )
                    return option

                const putList = optionListOfSameDate.filter(_option => {

               

                    if (_option.symbol === option.symbol || !_option.symbol.startsWith('ط') )
                        return false
                   


                    return true

                }
                );

                let allPossibleStrategies = putList.reduce( (_allPossibleStrategies, _option) => {




                




                    const strategyPositions = [
                        {
                            ...option,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                        {
                            ..._option,
                            isBuy: true,
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
                    let stockPriceToHighSarBeSarPercent,stockPriceToLowSarBeSarPercent;
                    if(breakevenList?.length){
                        const lowBreakeven = Math.min(...breakevenList);
                        const highBreakeven = Math.max(...breakevenList);
                        stockPriceToLowSarBeSarPercent = (lowBreakeven / option.optionDetails.stockSymbolDetails.last) - 1;
                        stockPriceToHighSarBeSarPercent = (highBreakeven / option.optionDetails.stockSymbolDetails.last) - 1;

                    }




                    const totalCost = totalCostCalculatorCommon({
                        strategyPositions,
                        getPrice: (strategyPosition) => getPriceOfAsset({
                            asset: strategyPosition,
                            priceType,
                            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                        })
                    });

                    // const offsetPrice = (option.strikePrice + _option.strikePrice)/2;
                    const offsetPrice = _option.optionDetails?.stockSymbolDetails?.close;


                    const profit = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:offsetPrice});



                    const profitPercent = profit / Math.abs(totalCost);


                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, _option],
                        strategyTypeTitle: "LongGUTS_STRANGLE",

                        strategyPositions,
                        currentStockPrice: option.optionDetails?.stockSymbolDetails?.last,
                        totalCost,

                        expectedProfitNotif,
                        minProfitToFilter,
                        expectedProfitPerMonth,
                        isWholeProfitable : !breakevenList?.length,
                        stockPriceToLowSarBeSarPercent,
                        stockPriceToHighSarBeSarPercent,
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
        strategyName: "LongGUTS_STRANGLE",
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
            strategyName: "LongGUTS_STRANGLE",
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


const calcShortGUTSStrategies = (list, {priceType,minProfitToFilter, expectedProfitPerMonth, settlementGainChoosePriceType="MIN",
     strategySubName, callListIgnorer, min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, 
     minStockPriceToLowBreakevenPercent=0, maxStockPriceToLowBreakevenPercent=Infinity, 
     minStockPriceToHighBreakevenPercent=-Infinity, maxStockPriceToHighBreakevenPercent=0, 
     minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = item.settlementTimeDiff;
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (callListIgnorer && callListIgnorer({
                    option,
                    minVol
                }))
                    return option

                const putListWithHigherStrikePriceThanStock = optionListOfSameDate.filter(_option => {


                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false


                    if (_option.symbol === option.symbol || !_option.symbol.startsWith('ط') )
                        return false
                    if (_option.optionDetails?.strikePrice <= _option.optionDetails.stockSymbolDetails.last)
                        return false

                    
                    return true

                }
                );

                let allPossibleStrategies = putListWithHigherStrikePriceThanStock.reduce( (_allPossibleStrategies, _option) => {

                    



                    const strategyPositions = [
                        {
                            ...option,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin:()=>option.calculatedRequiredMargin/1000
                        },
                        {
                            ..._option,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin:()=>option.calculatedRequiredMargin/1000
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

                    const lowBreakeven = Math.min(...breakevenList);
                    const highBreakeven = Math.max(...breakevenList);





                    const stockPriceToLowBreakevenPercent = (option.optionDetails.stockSymbolDetails.last / lowBreakeven) - 1;
                    const stockPriceToHighBreakevenPercent = (option.optionDetails.stockSymbolDetails.last / highBreakeven) - 1;



                    if (stockPriceToLowBreakevenPercent < minStockPriceToLowBreakevenPercent || stockPriceToLowBreakevenPercent > maxStockPriceToLowBreakevenPercent)
                        return _allPossibleStrategies
                    if (stockPriceToHighBreakevenPercent < minStockPriceToHighBreakevenPercent || stockPriceToHighBreakevenPercent > maxStockPriceToHighBreakevenPercent)
                        return _allPossibleStrategies





                    const offsetPrice = (option.strikePrice + _option.strikePrice)/2;

                  


                    const profit = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:offsetPrice});


                    const profitPercent = profit / Math.abs(totalCost) ;
                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, _option],
                        strategyTypeTitle: "SHORT_GUTS",
                        expectedProfitNotif,
                        minProfitToFilter,
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
        strategyName: "SHORT_GUTS",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "SHORT_GUTS",
            strategySubName,
            priceType,
            customLabels: [
                typeof minStockPriceToLowBreakevenPercent !== 'undefined' && minStockPriceToLowBreakevenPercent !== null && minStockPriceToLowBreakevenPercent !== -Infinity && {
                    label: "minToLow",
                    value: `${((minStockPriceToLowBreakevenPercent) * 100).toFixed(0)}%`
                },
                typeof maxStockPriceToHighBreakevenPercent !== 'undefined' && maxStockPriceToHighBreakevenPercent !== null && maxStockPriceToHighBreakevenPercent !== Infinity && {
                    label: "maxToHigh",
                    value: `${((maxStockPriceToHighBreakevenPercent) * 100).toFixed(0)}%`
                },].filter(Boolean),
            min_time_to_settlement,
            max_time_to_settlement,
            minVol
        })
    }

}
const calcShortSTRANGLEStrategies = (list, {priceType,minProfitToFilter, expectedProfitPerMonth, settlementGainChoosePriceType="MIN", 
    strategySubName, callListIgnorer, min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, 
    minStockPriceToLowBreakevenPercent=0, maxStockPriceToLowBreakevenPercent=Infinity, 
    minStockPriceToHighBreakevenPercent=-Infinity, maxStockPriceToHighBreakevenPercent=0, 
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = item.settlementTimeDiff;
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (callListIgnorer && callListIgnorer({
                    option,
                    minVol
                }))
                    return option

                const putList = optionListOfSameDate.filter(_option => {

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    if (_option.symbol === option.symbol || !_option.symbol.startsWith('ط') )
                        return false
                    if (_option.optionDetails?.strikePrice >= _option.optionDetails.stockSymbolDetails.last)
                        return false

                    

                    return true

                }
                );

                let allPossibleStrategies = putList.reduce( (_allPossibleStrategies, _option) => {



                     const strategyPositions = [
                        {
                            ...option,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin:()=>option.calculatedRequiredMargin/1000
                        },
                        {
                            ..._option,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin:()=>option.calculatedRequiredMargin/1000
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

                    const lowBreakeven = Math.min(...breakevenList);
                    const highBreakeven = Math.max(...breakevenList);





                    const stockPriceToLowBreakevenPercent = (option.optionDetails.stockSymbolDetails.last / lowBreakeven) - 1;
                    const stockPriceToHighBreakevenPercent = (option.optionDetails.stockSymbolDetails.last / highBreakeven) - 1;



                    if (stockPriceToLowBreakevenPercent < minStockPriceToLowBreakevenPercent || stockPriceToLowBreakevenPercent > maxStockPriceToLowBreakevenPercent)
                        return _allPossibleStrategies
                    if (stockPriceToHighBreakevenPercent < minStockPriceToHighBreakevenPercent || stockPriceToHighBreakevenPercent > maxStockPriceToHighBreakevenPercent)
                        return _allPossibleStrategies


                    const offsetPrice = (option.strikePrice + _option.strikePrice)/2



                    const profit = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:offsetPrice});
                 


                    const profitPercent = profit / Math.abs(totalCost);
                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, _option],
                        strategyTypeTitle: "SHORT_STRANGLE",
                        expectedProfitNotif,
                        minProfitToFilter,
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
        strategyName: "SHORT_STRANGLE",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "SHORT_STRANGLE",
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

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "BUCS",
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

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "BUPS",
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




const calcSyntheticCoveredCallStrategies = (list, 
    {priceType, strategySubName, 
        minProfitToFilter,
        filteredList,
            optionsGroupedByStock,
        minStockPriceToSarBeSar=-Infinity,
        maxStockPriceToSarBeSar=Infinity,
        BUCSSOptionListIgnorer=generalConfig.BUCSSOptionListIgnorer, min_time_to_settlement=-Infinity, 
        max_time_to_settlement=generalConfig.max_time_to_settlement, 
        minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

   

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(buyingCall => {

                if (!buyingCall.optionDetails?.stockSymbolDetails || !buyingCall.isCall )
                return buyingCall

               


                const buyingCallPrice = getPriceOfAsset({
                    asset: buyingCall,
                    priceType,
                    sideType: 'BUY'
                });
                if(buyingCallPrice===0) return buyingCall


                const sameStrikePut = optionListOfSameDate.find(__option => __option.symbol === buyingCall.symbol.replace('ض', 'ط') );
                if(!sameStrikePut) return buyingCall
                const sameStrikePutPrice = getPriceOfAsset({
                    asset: sameStrikePut,
                    priceType,
                    sideType: 'SELL'
                });
                if(sameStrikePutPrice===0) return buyingCall


                const sellingCallList = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingCall.symbol || !_option.isCall )
                        return false

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    return true

                }
                );

                let allPossibleStrategies = sellingCallList.reduce( (_allPossibleStrategies, sellingCall) => {

                    
                    const sellingCallPrice = getPriceOfAsset({
                        asset: sellingCall,
                        priceType,
                        sideType: 'SELL'
                    });
                    if(sellingCallPrice===0) return _allPossibleStrategies



                    const strategyPositions = [
                        {
                            ...buyingCall,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin: () => 0
                        },
                        {
                            ...sameStrikePut,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin: () => {
                                return (calculateOptionMargin({
                                    priceSpot: sameStrikePut.optionDetails.stockSymbolDetails.last,
                                    strikePrice: sameStrikePut.optionDetails.strikePrice,
                                    contractSize: 1000,
                                    optionPremium: sameStrikePut.last,
                                    optionType: sameStrikePut.isCall ? "call" : "put"
                                })?.required || 0) / 1000;
                            }
                        },
                        {
                            ...sellingCall,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin: () => {

                                if(sellingCall.optionDetails.strikePrice > buyingCall.optionDetails.strikePrice) return 0

                                return (buyingCall.optionDetails.strikePrice - sellingCall.optionDetails.strikePrice);
                               
                            }
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


                    if(!sellingCall?.optionDetails?.stockSymbolDetails?.last) return _allPossibleStrategies


                    const stockPriceToSarBeSarPercent = (breakeven /sellingCall.optionDetails.stockSymbolDetails.last ) - 1;
                    



                    if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSar || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSar)
                        return _allPossibleStrategies



                    const totalCost = totalCostCalculatorCommon({
                        strategyPositions,
                        getPrice: (strategyPosition) => getPriceOfAsset({
                            asset: strategyPosition,
                            priceType,
                            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                        })
                    });






                    const priceThatCauseMaxProfit = Math.max(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) * 1.3;



                    const maxProfit = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: priceThatCauseMaxProfit });



                    const profitPercent = maxProfit / Math.abs(totalCost);


                    const strategyObj ={
                        option: {
                            ...buyingCall
                        },
                        positions: [buyingCall, sameStrikePut, sellingCall],
                        strategyTypeTitle: "SYNTHETIC_COVERED_CALL",

                        strategyPositions,
                        currentStockPrice: buyingCall.optionDetails?.stockSymbolDetails?.last,
                        totalCost,
                        expectedProfitNotif,
                        minProfitToFilter,
                        stockPriceToSarBeSarPercent,
                        isWholeProfitable:!breakeven,
                        name: createStrategyName([buyingCall, sameStrikePut, sellingCall]),
                        profitPercent: profitPercent,
                        // percentToShow: stockPriceToSarBeSarPercent
                    }

                    

                    if(!isProfitEnough({strategy:strategyObj,profitPercent:profitPercent})) return _allPossibleStrategies

                    return _allPossibleStrategies.concat([strategyObj])


                }
                , []);

                return {
                    ...buyingCall,
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
        strategyName: "SYNTHETIC_COVERED_CALL",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceToSarBeSar,
        maxStockPriceToSarBeSar,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        
        htmlTitle: configsToHtmlTitle({
            strategyName: "SYNTHETIC_COVERED_CALL",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceToSarBeSar,
            maxStockPriceToSarBeSar,
            minVol,
            customLabels: [
                maxStockPriceToSarBeSar !== Infinity && {
                    label: "maxToSar",
                    value: `${((maxStockPriceToSarBeSar) * 100).toFixed(0)}%`
                }
            ].filter(Boolean),
        })
    }

}




const calcCALL_BUTT_CONDORStrategies = (list, {
    minProfitToFilter,
    priceType, settlementGainChoosePriceType="MIN", strategySubName, 
    isProfitEnoughFn,
    filteredList,
    optionsGroupedByStock,
    BUCSSOptionListIgnorer=generalConfig.BUCSSOptionListIgnorer, 
    min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, minStockPriceDistanceFromHigherStrikeInPercent=-Infinity, maxStockPriceDistanceFromHigherStrikeInPercent=Infinity, minStockPriceToSarBeSar=-Infinity, maxStockPriceToSarBeSar=Infinity, MIN_BUCS_BECS_diffStrikesRatio=0, MAX_BUCS_BECS_diffStrikesRatio=Infinity, minStockStrike4DistanceInPercent=-Infinity, maxStockStrike4DistanceInPercent=Infinity, minStockMiddleDistanceInPercent=-Infinity, maxStockMiddleDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, minProfitLossRatio=.7, expectedProfitNotif=false, ...restConfig}) => {

   

    

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


                const priceOfOptionWithLowStrike = getPriceOfAsset({
                    asset: option,
                    priceType,
                    sideType: 'BUY'
                });

                if(priceOfOptionWithLowStrike===0) return option

                const optionListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                    if (_option.symbol === option.symbol || !_option.symbol.startsWith('ض') )
                        return false
                    if (_option.optionDetails?.strikePrice < option.optionDetails?.strikePrice)
                        return false

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceHigherStrikeRatio > minStockPriceDistanceFromHigherStrikeInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceFromHigherStrikeInPercent) {} else {
                        return false
                    }

                    
                    const highStrikePrice = getPriceOfAsset({
                        asset: _option,
                        priceType,
                        sideType: 'SELL'
                    });
                    

                     // TODO: use breakeven function 

                    const sarBeSar = option.optionDetails?.strikePrice + (priceOfOptionWithLowStrike - highStrikePrice);

                    

                    const stockPriceSarBeSarRatio = (_option.optionDetails.stockSymbolDetails.last / sarBeSar) - 1;

                    if (stockPriceSarBeSarRatio > minStockPriceToSarBeSar && stockPriceSarBeSarRatio < maxStockPriceToSarBeSar) {} else {
                        return false
                    }

                    return true

                }
                );

                let allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (_allPossibleStrategies, option2) => {


                    const option2Price = getPriceOfAsset({
                        asset: option2,
                        priceType,
                        sideType: 'SELL'
                    });
                    if(option2Price===0) return _allPossibleStrategies


                    

                    let __allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (___allPossibleStrategies, option3) => {

                        const option3Price = getPriceOfAsset({
                            asset: option3,
                            priceType,
                            sideType: 'SELL'
                        });
                        if(option3Price===0) return ___allPossibleStrategies

                        const optionListWithHigherStrikePriceThanO3 = optionListWithHigherStrikePrice.filter(o => {
                            if (o.symbol === option2.symbol || o.symbol === option3.symbol)
                                return false

                            if (o.optionDetails?.strikePrice <= option3.optionDetails?.strikePrice)
                                return false

                            return true

                        }
                        );
                        let strategies = optionListWithHigherStrikePriceThanO3.reduce( (___allPossibleStrategies, option4) => {

                           


                            const option4Price = getPriceOfAsset({
                                asset: option4,
                                priceType,
                                sideType: 'BUY'
                            });
                            if(option4Price===0) return ___allPossibleStrategies
                            const middlePrice = option2.optionDetails?.strikePrice === option3.optionDetails?.strikePrice ? option2.optionDetails?.strikePrice : (option3.optionDetails?.strikePrice + option2.optionDetails?.strikePrice) / 2;

                            const stockPriceMiddleRatio = (option4.optionDetails.stockSymbolDetails.last / middlePrice) - 1;
                            if (stockPriceMiddleRatio > maxStockMiddleDistanceInPercent || stockPriceMiddleRatio < minStockMiddleDistanceInPercent)
                                return ___allPossibleStrategies

                            const stockPriceStrike4Ratio = (option4.optionDetails.stockSymbolDetails.last / option4.optionDetails?.strikePrice) - 1;

                            if (stockPriceStrike4Ratio > maxStockStrike4DistanceInPercent || stockPriceStrike4Ratio < minStockStrike4DistanceInPercent)
                                return ___allPossibleStrategies

                            // if (option.optionDetails.stockSymbolDetails.last  > option4.optionDetails?.strikePrice) return ___allPossibleStrategies
                            if (option4.optionDetails?.strikePrice < option2.optionDetails?.strikePrice)
                                return ___allPossibleStrategies


                            const diffOfBUCS_Strikes = option2.optionDetails?.strikePrice - option.optionDetails?.strikePrice;
                            const diffOfBECS_Strikes = option4.optionDetails?.strikePrice - option3.optionDetails?.strikePrice;

                            const BUCS_BECS_diffStrikesRatio = diffOfBUCS_Strikes / diffOfBECS_Strikes;

                            if (BUCS_BECS_diffStrikesRatio < MIN_BUCS_BECS_diffStrikesRatio || BUCS_BECS_diffStrikesRatio > MAX_BUCS_BECS_diffStrikesRatio)
                                return ___allPossibleStrategies

                            const isButterFly = diffOfBUCS_Strikes === diffOfBECS_Strikes &&  option2.optionDetails?.strikePrice === option3.optionDetails?.strikePrice;
                            const strategyPositions = [
                                {
                                    ...option,
                                    isBuy: true,
                                    getQuantity: () => baseQuantity,
                                    getRequiredMargin() { }
                                },
                                {
                                    ...option2,
                                    isSell: true,
                                    getQuantity: () => baseQuantity,
                                    getRequiredMargin() { }
                                },
                                {
                                    ...option3,
                                    isSell: true,
                                    getQuantity: () => baseQuantity * BUCS_BECS_diffStrikesRatio,
                                    getRequiredMargin: () => isButterFly ? 0 : diffOfBECS_Strikes
                                },
                                {
                                    ...option4,
                                    isBuy: true,
                                    getQuantity: () => baseQuantity * BUCS_BECS_diffStrikesRatio,
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




                          

                            const priceThatCauseMaxLoss = Math.max(...strategyPositions.map(strategyPosition=>strategyPosition.strikePrice))* 1.2;



                            const minProfitLossOfButterfly = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:priceThatCauseMaxLoss});



                            let priceThatCauseMaxProfit
                            if (BUCS_BECS_diffStrikesRatio > 1) {
                                priceThatCauseMaxProfit = option3.optionDetails?.strikePrice;

                            } else {
                                priceThatCauseMaxProfit = option2.optionDetails?.strikePrice;
                            }
                            let maxGainOfButterfly = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:priceThatCauseMaxProfit});

                            let profitLossRatio

                            if (minProfitLossOfButterfly > 0) {
                                profitLossRatio = 1
                            } else {

                                profitLossRatio = Math.abs(maxGainOfButterfly) / (Math.abs(maxGainOfButterfly) + Math.abs(minProfitLossOfButterfly))
                            }
                            if (profitLossRatio < minProfitLossRatio)
                                return ___allPossibleStrategies


                            const minProfitPercent = minProfitLossOfButterfly/Math.abs(totalCost);

                            const maxStrike = Math.max(...strategyPositions.map(strategyPosition=>strategyPosition.strikePrice));
                            const stockPrice = option.optionDetails.stockSymbolDetails.last;


                          

                            const strategyObj = {
                                option: {
                                    ...option
                                },
                                positions:[option, option2, option3, option4],
                                strategyTypeTitle: "CALL_BUTT_CONDOR",
                                expectedProfitNotif,
                                minProfitToFilter,
                                isWholeProfitable: minProfitLossOfButterfly >= 0,
                                name: createStrategyName([option, option2, option3, option4]),
                                isProfitEnough : isProfitEnoughFn && isProfitEnoughFn({minProfitPercent,profitLossRatio}),
                                isButterFly,
                                // profitPercent: totalCost>=0 ? 1 : minProfitPercent
                                profitPercent:  minProfitPercent
                            }

                            return ___allPossibleStrategies.concat([strategyObj])

                        }
                        , []);

                        return ___allPossibleStrategies.concat(strategies)

                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

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
        strategyName: "CALL_BUTT_CONDOR",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceFromHigherStrikeInPercent,
        maxStockPriceDistanceFromHigherStrikeInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "CALL_BUTT_CONDOR",
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


















const IRON_BUTTERFLY_CONDOR_BUCS_strategyObjCreator = (option, option2, option3, option4,
    { minStockMiddleDistanceInPercent, maxStockMiddleDistanceInPercent,
        minProfitToFilter,
        minStockPriceDistanceFromOption4StrikeInPercent, maxStockPriceDistanceFromOption4StrikeInPercent,
        MIN_BUCS_BEPS_diffStrikesRatio, MAX_BUCS_BEPS_diffStrikesRatio, expectedProfitNotif, priceType, 
        minProfitLossRatio,
        isProfitEnoughFn,
        BUCS_BEPS_COST_notProperRatio=15,
        strategyTypeTitle="IRON_BUT_CONDOR_BUCS"
    }) => {

    if (!option?.optionDetails || !option2?.optionDetails || !option3?.optionDetails || !option4?.optionDetails) {
        return
    }






    const middlePrice = option2.optionDetails?.strikePrice === option3.optionDetails?.strikePrice ? option2.optionDetails?.strikePrice : (option3.optionDetails?.strikePrice + option2.optionDetails?.strikePrice) / 2;

    const stockPriceMiddleRatio = (option4.optionDetails.stockSymbolDetails.last / middlePrice) - 1;
    if (stockPriceMiddleRatio > maxStockMiddleDistanceInPercent || stockPriceMiddleRatio < minStockMiddleDistanceInPercent)
        return 

    const stockPriceStrike4Ratio = (option4.optionDetails.stockSymbolDetails.last / option4.optionDetails?.strikePrice) - 1;

    if (stockPriceStrike4Ratio > maxStockPriceDistanceFromOption4StrikeInPercent || stockPriceStrike4Ratio < minStockPriceDistanceFromOption4StrikeInPercent)
        return 

    // if (option.optionDetails.stockSymbolDetails.last  > option4.optionDetails?.strikePrice) return 
    if (option4.optionDetails?.strikePrice < option2.optionDetails?.strikePrice)
        return 

 

    const diffOfBUCS_Strikes = option2.optionDetails?.strikePrice - option.optionDetails?.strikePrice;
    const diffOfBEPS_Strikes = option4.optionDetails?.strikePrice - option3.optionDetails?.strikePrice;

    const BUCS_BEPS_diffStrikesRatio = diffOfBUCS_Strikes / diffOfBEPS_Strikes;

    if (BUCS_BEPS_diffStrikesRatio < MIN_BUCS_BEPS_diffStrikesRatio || BUCS_BEPS_diffStrikesRatio > MAX_BUCS_BEPS_diffStrikesRatio)
        return 



    const strategyPositionsBUCS = [
        {
            ...option,
            isBuy: true,
            getQuantity: () => baseQuantity,
            getRequiredMargin() { }
        },
        {
            ...option2,
            isSell: true,
            getQuantity: () => baseQuantity,
            getRequiredMargin() { }
        },
        
    ]


    const strategyPositionsBEPS = [
        {
            ...option3,
            isSell: true,
            getQuantity: () => baseQuantity,
            getRequiredMargin() { }
        },
        {
            ...option4,
            isBuy: true,
            getQuantity: () => baseQuantity,
            getRequiredMargin() { }
        }
        
    ]



    const strategyPositions = [
        {
            ...option,
            isBuy: true,
            getQuantity: () => baseQuantity,
            getRequiredMargin() { }
        },
        {
            ...option2,
            isSell: true,
            getQuantity: () => baseQuantity,
            getRequiredMargin() { }
        },
        {
            ...option3,
            isSell: true,
            getQuantity: () => baseQuantity * BUCS_BEPS_diffStrikesRatio,
            getRequiredMargin() { }
        },
        {
            ...option4,
            isBuy: true,
            getQuantity: () => baseQuantity * BUCS_BEPS_diffStrikesRatio,
            getRequiredMargin() { }
        }
    ]


    const totalCostBUCS = totalCostCalculatorCommon({
        strategyPositions:strategyPositionsBUCS,
        getPrice: (strategyPosition) => getPriceOfAsset({
            asset: strategyPosition,
            priceType,
            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
        })
    });
    const totalCostBEPS = totalCostCalculatorCommon({
        strategyPositions:strategyPositionsBEPS,
        getPrice: (strategyPosition) => getPriceOfAsset({
            asset: strategyPosition,
            priceType,
            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
        })
    });

    const totalCost = totalCostCalculatorCommon({
        strategyPositions,
        getPrice: (strategyPosition) => getPriceOfAsset({
            asset: strategyPosition,
            priceType,
            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
        })
    });

    const priceThatCauseMaxLoss = Math.max(...strategyPositions.map(strategyPosition=>strategyPosition.strikePrice))* 1.2;


    const minProfitLossOfButterfly = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:priceThatCauseMaxLoss});

    

    const minProfitPercent = minProfitLossOfButterfly/Math.abs(totalCost);





    // TODO:if is possible to use isProfitEnoughFn
    if(hasGreaterRatio({num1:totalCostBUCS,num2:totalCostBEPS,properRatio:BUCS_BEPS_COST_notProperRatio}) && minProfitPercent < 0.02){
        return 
    }




    let priceThatCauseMaxProfit
    if (diffOfBUCS_Strikes > diffOfBEPS_Strikes) {
        priceThatCauseMaxProfit = option3.optionDetails?.strikePrice;

    } else {
        priceThatCauseMaxProfit = option2.optionDetails?.strikePrice;

    }
    let maxGainOfButterfly = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:priceThatCauseMaxProfit});

    let profitLossRatio

    if (minProfitLossOfButterfly > 0) {
        profitLossRatio = 1
    } else {

        profitLossRatio = Math.abs(maxGainOfButterfly) / (Math.abs(maxGainOfButterfly) + Math.abs(minProfitLossOfButterfly))
    }

    if (profitLossRatio < minProfitLossRatio)
        return 


    

    const maxStrike = Math.max(...strategyPositions.map(strategyPosition=>strategyPosition.strikePrice));
    const stockPrice = option.optionDetails.stockSymbolDetails.last;

    if( (stockPrice > (maxStrike* 1.1)) &&    minProfitPercent<0.02){
        return
    }
    const strategyObj = {
        option: {
            ...option
        },
        positions: [option, option2, option3, option4],
        strategyTypeTitle,
        minProfitToFilter,
        expectedProfitNotif,
        isWholeProfitable: minProfitLossOfButterfly >= 0,
        name: createStrategyName([option, option2, option3, option4]),
        isProfitEnough : isProfitEnoughFn && isProfitEnoughFn({minProfitPercent,profitLossRatio}),
        profitPercent: totalCost>=0 ? 1 : minProfitPercent
    }



    return strategyObj

}











const calcIRON_BUTT_CONDOR_BUCS_Strategies = (list, {priceType, settlementGainChoosePriceType="MIN", showLeftRightProfitType="LEFT&RIGHT", strategySubName,
    isProfitEnoughFn,
    minProfitToFilter,
     BUCSSOptionListIgnorer, min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, 
     minStockPriceDistanceFromHigherStrikeInPercent=-Infinity, maxStockPriceDistanceFromHigherStrikeInPercent=Infinity, 
     minStockPriceToSarBeSar=-Infinity, maxStockPriceToSarBeSar=Infinity,
     minStockPriceDistanceFromOption2StrikeInPercent=-Infinity, maxStockPriceDistanceFromOption2StrikeInPercent=Infinity, 
     minStockPriceDistanceFromOption3StrikeInPercent=-Infinity, maxStockPriceDistanceFromOption3StrikeInPercent=Infinity, 
     minStockPriceDistanceFromOption4StrikeInPercent=-Infinity, 
     maxStockPriceDistanceFromOption4StrikeInPercent=Infinity, 
     minStockMiddleDistanceInPercent=-Infinity, maxStockMiddleDistanceInPercent=Infinity, 
     MIN_BUCS_BEPS_diffStrikesRatio=0, MAX_BUCS_BEPS_diffStrikesRatio=Infinity, 
     BUCS_BEPS_COST_notProperRatio,
     minProfitLossRatio=.7, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = item.settlementTimeDiff;
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

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


                const priceOfOptionWithLowStrike = getPriceOfAsset({
                    asset: option,
                    priceType,
                    sideType: 'BUY'
                });

                if(priceOfOptionWithLowStrike===0) return option

                const callListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                    if (_option.symbol === option.symbol || !_option.symbol.startsWith('ض') )
                        return false
                    if (_option.optionDetails?.strikePrice <= option.optionDetails?.strikePrice)
                        return false

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceHigherStrikeRatio > minStockPriceDistanceFromOption2StrikeInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceFromOption2StrikeInPercent) {} else {
                        return false
                    }

                    return true

                }
                );

                let allPossibleStrategies = callListWithHigherStrikePrice.reduce( (_allPossibleStrategies, option2) => {


                    const option2Price = getPriceOfAsset({
                        asset: option2,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(option2Price===0) return _allPossibleStrategies

                    

                    // TODO: create lower/higher strike price filter function in utils to reuse 

                    const putListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                        if ( _option.isCall)
                            return false
                        if (_option.optionDetails?.strikePrice <= option.optionDetails?.strikePrice)
                            return false

                        if (!_option.optionDetails?.stockSymbolDetails?.last)
                            return false

                        

                        return true

                    }
                    );

                    let __allPossibleStrategies = putListWithHigherStrikePrice.reduce( (___allPossibleStrategies, option3) => {


                        const option3Price = getPriceOfAsset({
                            asset: option3,
                            priceType,
                            sideType: 'SELL'
                        });
                        if(option3Price===0) return ___allPossibleStrategies


                        const stockPricePut1StrikeRatio = (option3.optionDetails.stockSymbolDetails.last / option3.optionDetails?.strikePrice) - 1;

                        if (stockPricePut1StrikeRatio < minStockPriceDistanceFromOption3StrikeInPercent || stockPricePut1StrikeRatio > maxStockPriceDistanceFromOption3StrikeInPercent) {
                            return ___allPossibleStrategies
                        }

                        const optionListWithHigherStrikePriceThanO3 = putListWithHigherStrikePrice.filter(o => {
                            // if (o.symbol === option2.symbol || o.symbol === option3.symbol)
                            //     return false
                            // if (o.optionDetails?.strikePrice === option2.optionDetails?.strikePrice)
                            //     return false

                            if (o.optionDetails?.strikePrice <= option3.optionDetails?.strikePrice)
                                return false

                            return true

                        }
                        );




                       

                        let strategies = optionListWithHigherStrikePriceThanO3.reduce( (___allPossibleStrategies, option4) => {

                           


                            const option4Price = getPriceOfAsset({
                                asset: option4,
                                priceType,
                                sideType: 'BUY'
                            });
                            if(option4Price===0) return ___allPossibleStrategies
                            const strategyObj = IRON_BUTTERFLY_CONDOR_BUCS_strategyObjCreator(option, option2, option3, option4, {
                                minStockMiddleDistanceInPercent, maxStockMiddleDistanceInPercent,
                                isProfitEnoughFn,
                                minProfitToFilter,
                                minStockPriceDistanceFromOption4StrikeInPercent, maxStockPriceDistanceFromOption4StrikeInPercent,
                                MIN_BUCS_BEPS_diffStrikesRatio, MAX_BUCS_BEPS_diffStrikesRatio, expectedProfitNotif, priceType, minProfitLossRatio,
                                BUCS_BEPS_COST_notProperRatio,
                                strategyTypeTitle:"IRON_BUTT_CONDOR_BUCS"
                            });

                            
                            return ___allPossibleStrategies.concat([strategyObj])

                        }
                        , []);

                        return ___allPossibleStrategies.concat(strategies)

                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

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
        strategyName: "IRON_BUTT_CONDOR_BUCS",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceFromHigherStrikeInPercent,
        maxStockPriceDistanceFromHigherStrikeInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "IRON_BUTT_CONDOR_BUCS",
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















const calcIRON_BUTT_CONDOR_BUPS_Strategies = (list, {priceType, 
    isProfitEnoughFn,
    minProfitToFilter,
    settlementGainChoosePriceType="MIN", showLeftRightProfitType="LEFT&RIGHT", strategySubName,
     BUCSSOptionListIgnorer, min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, 
     minStockPriceDistanceFromHigherStrikeInPercent=-Infinity, maxStockPriceDistanceFromHigherStrikeInPercent=Infinity, 
     minStockPriceToSarBeSar=-Infinity, maxStockPriceToSarBeSar=Infinity,
     minStockPriceDistanceFromOption2StrikeInPercent=-Infinity, maxStockPriceDistanceFromOption2StrikeInPercent=Infinity, 
     minStockPriceDistanceFromOption3StrikeInPercent=-Infinity, maxStockPriceDistanceFromOption3StrikeInPercent=Infinity, 
     minStockPriceDistanceFromOption4StrikeInPercent=-Infinity, maxStockPriceDistanceFromOption4StrikeInPercent=Infinity, minStockMiddleDistanceInPercent=-Infinity, maxStockMiddleDistanceInPercent=Infinity, MIN_BUPS_BECS_diffStrikesRatio=0, MAX_BUPS_BECS_diffStrikesRatio=Infinity, minProfitLossRatio=.7, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = item.settlementTimeDiff;
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                // if (BUCSSOptionListIgnorer({
                //     option,
                //     minVol
                // }))
                //     return option

                if (!option.optionDetails?.stockSymbolDetails || !option.isPut )
                    return option

                const priceOfOptionWithLowStrike = getPriceOfAsset({
                    asset: option,
                    priceType,
                    sideType: 'BUY'
                });

                if(priceOfOptionWithLowStrike===0) return option

                const putListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                    if (_option.symbol === option.symbol || !_option.isPut )
                        return false
                    if (_option.optionDetails?.strikePrice <= option.optionDetails?.strikePrice)
                        return false

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceHigherStrikeRatio > minStockPriceDistanceFromOption2StrikeInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceFromOption2StrikeInPercent) {} else {
                        return false
                    }

                    return true

                }
                );

                let allPossibleStrategies = putListWithHigherStrikePrice.reduce( (_allPossibleStrategies, option2) => {


                    const option2Price = getPriceOfAsset({
                        asset: option2,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(option2Price===0) return _allPossibleStrategies

                    

                    // TODO: create lower/higher strike price filter function in utils to reuse 

                    const callListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                        if ( _option.isPut)
                            return false
                        if (_option.optionDetails?.strikePrice <= option.optionDetails?.strikePrice)
                            return false

                        if (!_option.optionDetails?.stockSymbolDetails?.last)
                            return false

                        

                        return true

                    }
                    );

                    let __allPossibleStrategies = callListWithHigherStrikePrice.reduce( (___allPossibleStrategies, option3) => {


                        const option3Price = getPriceOfAsset({
                            asset: option3,
                            priceType,
                            sideType: 'SELL'
                        });
                        if(option3Price===0) return ___allPossibleStrategies


                        const stockPricePut1StrikeRatio = (option3.optionDetails.stockSymbolDetails.last / option3.optionDetails?.strikePrice) - 1;

                        if (stockPricePut1StrikeRatio < minStockPriceDistanceFromOption3StrikeInPercent || stockPricePut1StrikeRatio > maxStockPriceDistanceFromOption3StrikeInPercent) {
                            return ___allPossibleStrategies
                        }

                        const optionListWithHigherStrikePriceThanO3 = callListWithHigherStrikePrice.filter(o => {
                            // if (o.symbol === option2.symbol || o.symbol === option3.symbol)
                            //     return false
                            // if (o.optionDetails?.strikePrice === option2.optionDetails?.strikePrice)
                            //     return false

                            if (o.optionDetails?.strikePrice <= option3.optionDetails?.strikePrice)
                                return false

                            return true

                        }
                        );




                       

                        let strategies = optionListWithHigherStrikePriceThanO3.reduce( (___allPossibleStrategies, option4) => {

                           


                            const option4Price = getPriceOfAsset({
                                asset: option4,
                                priceType,
                                sideType: 'BUY'
                            });
                            if(option4Price===0) return ___allPossibleStrategies
                            const middlePrice = option2.optionDetails?.strikePrice === option3.optionDetails?.strikePrice ? option2.optionDetails?.strikePrice : (option3.optionDetails?.strikePrice + option2.optionDetails?.strikePrice) / 2;

                            const stockPriceMiddleRatio = (option4.optionDetails.stockSymbolDetails.last / middlePrice) - 1;
                            if (stockPriceMiddleRatio > maxStockMiddleDistanceInPercent || stockPriceMiddleRatio < minStockMiddleDistanceInPercent)
                                return ___allPossibleStrategies

                            const stockPriceStrike4Ratio = (option4.optionDetails.stockSymbolDetails.last / option4.optionDetails?.strikePrice) - 1;

                            if (stockPriceStrike4Ratio > maxStockPriceDistanceFromOption4StrikeInPercent || stockPriceStrike4Ratio < minStockPriceDistanceFromOption4StrikeInPercent)
                                return ___allPossibleStrategies

                            // if (option.optionDetails.stockSymbolDetails.last  > option4.optionDetails?.strikePrice) return ___allPossibleStrategies
                            if (option4.optionDetails?.strikePrice < option2.optionDetails?.strikePrice)
                                return ___allPossibleStrategies

                        

                            const diffOfBUPS_Strikes = option2.optionDetails?.strikePrice - option.optionDetails?.strikePrice;
                            const diffOfBECS_Strikes = option4.optionDetails?.strikePrice - option3.optionDetails?.strikePrice;

                            const BUPS_BECS_diffStrikesRatio = diffOfBUPS_Strikes / diffOfBECS_Strikes;

                            if (BUPS_BECS_diffStrikesRatio < MIN_BUPS_BECS_diffStrikesRatio || BUPS_BECS_diffStrikesRatio > MAX_BUPS_BECS_diffStrikesRatio)
                                return ___allPossibleStrategies





                            const strategyPositions = [
                                {
                                    ...option,
                                    isBuy: true,
                                    getQuantity: () => baseQuantity,
                                    getRequiredMargin() { }
                                },
                                {
                                    ...option2,
                                    isSell: true,
                                    getQuantity: () => baseQuantity,
                                    getRequiredMargin: () => diffOfBUPS_Strikes
                                },
                                {
                                    ...option3,
                                    isSell: true,
                                    getQuantity: () => baseQuantity * BUPS_BECS_diffStrikesRatio,
                                    getRequiredMargin: () => diffOfBECS_Strikes
                                },
                                {
                                    ...option4,
                                    isBuy: true,
                                    getQuantity: () => baseQuantity * BUPS_BECS_diffStrikesRatio,
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

                            const priceThatCauseMaxLoss = Math.max(...strategyPositions.map(strategyPosition=>strategyPosition.strikePrice))* 1.2;


                            const minProfitLossOfButterfly = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:priceThatCauseMaxLoss});

                            let priceThatCauseMaxProfit
                            if (diffOfBUPS_Strikes > diffOfBECS_Strikes) {
                                priceThatCauseMaxProfit = option3.optionDetails?.strikePrice;

                            } else {
                                priceThatCauseMaxProfit = option2.optionDetails?.strikePrice;
                            }
                            let maxGainOfButterfly = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:priceThatCauseMaxProfit});

                            let profitLossRatio

                            if (minProfitLossOfButterfly > 0) {
                                profitLossRatio = 1
                            } else {

                                profitLossRatio = Math.abs(maxGainOfButterfly) / (Math.abs(maxGainOfButterfly) + Math.abs(minProfitLossOfButterfly))
                            }

                             const minProfitPercent = minProfitLossOfButterfly/Math.abs(totalCost);

                            if (profitLossRatio < minProfitLossRatio)
                                return ___allPossibleStrategies
                            const strategyObj = {
                                option: {
                                    ...option
                                },
                                minProfitToFilter,
                                positions:[option, option2, option3, option4],
                                strategyTypeTitle: "IRON_BUTT_CONDOR_BUPS",
                                expectedProfitNotif,
                                isWholeProfitable: minProfitLossOfButterfly>=0, 
                                name: createStrategyName([option, option2, option3, option4]),
                                isProfitEnough : isProfitEnoughFn && isProfitEnoughFn({minProfitPercent,profitLossRatio}),
                                profitPercent: totalCost>=0 ? 1 : minProfitPercent
                            }

                            return ___allPossibleStrategies.concat([strategyObj])

                        }
                        , []);

                        return ___allPossibleStrategies.concat(strategies)

                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

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
        strategyName: "IRON_BUTT_CONDOR_BUPS",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceFromHigherStrikeInPercent,
        maxStockPriceDistanceFromHigherStrikeInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "IRON_BUTT_CONDOR_BUPS",
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




const calcPUT_BUTT_CONDORStrategies = (list, {priceType, 
    settlementGainChoosePriceType="MIN", strategySubName, BUCSSOptionListIgnorer=generalConfig.BUCSSOptionListIgnorer, 
    isProfitEnoughFn,
    minProfitToFilter,
    filteredList,
    optionsGroupedByStock,
    min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, 
    minStockPriceDistanceFromHigherStrikeInPercent=-Infinity, maxStockPriceDistanceFromHigherStrikeInPercent=Infinity, 
    minStockPriceToSarBeSar=-Infinity, maxStockPriceToSarBeSar=Infinity, 
    MIN_BUPS_BEPS_diffStrikesRatio=0, MAX_BUPS_BEPS_diffStrikesRatio=Infinity, 
    minStockStrike4DistanceInPercent=-Infinity, maxStockStrike4DistanceInPercent=Infinity, 
    minStockMiddleDistanceInPercent=-Infinity, maxStockMiddleDistanceInPercent=Infinity, 
    minVol=CONSTS.DEFAULTS.MIN_VOL, minProfitLossRatio=.7, expectedProfitNotif=false, ...restConfig}) => {


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

                const optionPrice = getPriceOfAsset({
                        asset: option,
                        priceType,
                        sideType: 'BUY'
                });

                if(optionPrice===0) return option

                const optionListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                    if (_option.symbol === option.symbol || !_option.symbol.startsWith('ط') )
                        return false
                    if (_option.optionDetails?.strikePrice < option.optionDetails?.strikePrice)
                        return false

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceHigherStrikeRatio > minStockPriceDistanceFromHigherStrikeInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceFromHigherStrikeInPercent) {} else {
                        return false
                    }

                    const lowStrikePrice = getPriceOfAsset({
                        asset: option,
                        priceType,
                        sideType: 'BUY'
                    });
                    const highStrikePrice = getPriceOfAsset({
                        asset: _option,
                        priceType,
                        sideType: 'SELL'
                    });

                     // TODO: use breakeven function 
                    const sarBeSar = option.optionDetails?.strikePrice + (lowStrikePrice - highStrikePrice);

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceSarBeSarRatio = (_option.optionDetails.stockSymbolDetails.last / sarBeSar) - 1;

                    if (stockPriceSarBeSarRatio > minStockPriceToSarBeSar && stockPriceSarBeSarRatio < maxStockPriceToSarBeSar) {} else {
                        return false
                    }

                    return true

                }
                );

                let allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (_allPossibleStrategies, option2) => {


                    const option2Price = getPriceOfAsset({
                        asset: option2,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(option2Price===0) return _allPossibleStrategies
                    

                    

                    let __allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (___allPossibleStrategies, option3) => {


                        const option3Price = getPriceOfAsset({
                            asset: option3,
                            priceType,
                            sideType: 'SELL'
                        });

                        if(option3Price===0) return ___allPossibleStrategies

                        const optionListWithHigherStrikePriceThanO3 = optionListWithHigherStrikePrice.filter(o => {
                            if (o.symbol === option2.symbol || o.symbol === option3.symbol)
                                return false

                            if (o.optionDetails?.strikePrice <= option3.optionDetails?.strikePrice)
                                return false

                            return true

                        }
                        );
                        let strategies = optionListWithHigherStrikePriceThanO3.reduce( (___allPossibleStrategies, option4) => {

                            const option4Price = getPriceOfAsset({
                                asset: option4,
                                priceType,
                                sideType: 'BUY'
                            });

                            if(option4Price===0) return ___allPossibleStrategies

                            const middlePrice = option2.optionDetails?.strikePrice === option3.optionDetails?.strikePrice ? option2.optionDetails?.strikePrice : (option3.optionDetails?.strikePrice + option2.optionDetails?.strikePrice) / 2;

                            const stockPriceMiddleRatio = (option4.optionDetails.stockSymbolDetails.last / middlePrice) - 1;
                            if (stockPriceMiddleRatio > maxStockMiddleDistanceInPercent || stockPriceMiddleRatio < minStockMiddleDistanceInPercent)
                                return ___allPossibleStrategies

                            const stockPriceStrike4Ratio = (option4.optionDetails.stockSymbolDetails.last / option4.optionDetails?.strikePrice) - 1;

                            if (stockPriceStrike4Ratio > maxStockStrike4DistanceInPercent || stockPriceStrike4Ratio < minStockStrike4DistanceInPercent)
                                return ___allPossibleStrategies

                            // if (option.optionDetails.stockSymbolDetails.last  > option4.optionDetails?.strikePrice) return ___allPossibleStrategies
                            if (option4.optionDetails?.strikePrice < option2.optionDetails?.strikePrice)
                                return ___allPossibleStrategies



                            const diffOfBUPS_Strikes = option2.optionDetails?.strikePrice - option.optionDetails?.strikePrice;
                            const diffOfBEPS_Strikes = option4.optionDetails?.strikePrice - option3.optionDetails?.strikePrice;

                            const BUPS_BEPS_diffStrikesRatio = diffOfBUPS_Strikes / diffOfBEPS_Strikes;

                            if (BUPS_BEPS_diffStrikesRatio < MIN_BUPS_BEPS_diffStrikesRatio || BUPS_BEPS_diffStrikesRatio > MAX_BUPS_BEPS_diffStrikesRatio)
                                return ___allPossibleStrategies



                            const isButterFly = diffOfBUPS_Strikes === diffOfBEPS_Strikes &&  option2.optionDetails?.strikePrice === option3.optionDetails?.strikePrice
                            


                            const strategyPositions = [
                                {
                                    ...option,
                                    isBuy: true,
                                    getQuantity: () => baseQuantity,
                                    getRequiredMargin() { }
                                },
                                {
                                    ...option2,
                                    isSell: true,
                                    getQuantity: () => baseQuantity,
                                    getRequiredMargin: () => isButterFly ? 0 : diffOfBUPS_Strikes
                                },
                                {
                                    ...option3,
                                    isSell: true,
                                    getQuantity: () =>  baseQuantity * BUPS_BEPS_diffStrikesRatio,
                                    getRequiredMargin() { }
                                },
                                {
                                    ...option4,
                                    isBuy: true,
                                    getQuantity: () => baseQuantity * BUPS_BEPS_diffStrikesRatio,
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







                            
                            const priceThatCauseMaxLoss = Math.min(...strategyPositions.map(strategyPosition=>strategyPosition.strikePrice))/ 1.2;



                            const minProfitLossOfButterfly = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:priceThatCauseMaxLoss});


                            const minProfitPercent = minProfitLossOfButterfly/Math.abs(totalCost);

                           

                            

                            if(option2.symbol!==option3.symbol  && minProfitPercent <0.02){
                                return ___allPossibleStrategies
                            }
                            if(option2.symbol===option3.symbol && BUPS_BEPS_diffStrikesRatio!==1  && minProfitPercent <0.02){
                                return ___allPossibleStrategies
                            }

                            let priceThatCauseMaxProfit
                            if (BUPS_BEPS_diffStrikesRatio > 1) {
                                priceThatCauseMaxProfit = option3.optionDetails?.strikePrice;

                            } else {
                                priceThatCauseMaxProfit = option2.optionDetails?.strikePrice;

                            }
                            let maxGainOfButterfly = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:priceThatCauseMaxProfit});

                            let profitLossRatio

                            if (minProfitLossOfButterfly > 0) {
                                profitLossRatio = 1
                            } else {

                                profitLossRatio = Math.abs(maxGainOfButterfly) / (Math.abs(maxGainOfButterfly) + Math.abs(minProfitLossOfButterfly))
                            }

                            if (profitLossRatio < minProfitLossRatio)
                                return ___allPossibleStrategies

                           
                            const strategyObj = {
                                option: {
                                    ...option
                                },
                                positions:[option, option2, option3, option4],
                                strategyTypeTitle: "PUT_BUTT_CONDOR",
                                expectedProfitNotif,
                                minProfitToFilter,
                                isButterFly,
                                isWholeProfitable: minProfitLossOfButterfly,
                                name: createStrategyName([option, option2, option3, option4]),
                                isProfitEnough : isProfitEnoughFn && isProfitEnoughFn({minProfitPercent,profitLossRatio}),
                                // profitPercent: totalCost>=0 ? 1 : minProfitPercent
                                profitPercent: totalCost>=0 ? 1 : minProfitPercent
                            }

                            return ___allPossibleStrategies.concat([strategyObj])

                        }
                        , []);

                        return ___allPossibleStrategies.concat(strategies)

                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

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
        strategyName: "PUT_BUTT_CONDOR",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceFromHigherStrikeInPercent,
        maxStockPriceDistanceFromHigherStrikeInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "PUT_BUTT_CONDOR",
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

const calcBUCSRatioStrategies = (list, {priceType, strategySubName, minQuantityFactorOfBUCS=0.6,  
    maxQuantityFactorOfBUCS=3, 
    BUCSSOptionListIgnorer=generalConfig.BUCSSOptionListIgnorer, 
    minProfitToFilter,
    isProfitEnoughFn,
    filteredList,
            optionsGroupedByStock,
    min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, 
    minStockPriceToSarBeSar=-Infinity,maxStockPriceToSarBeSar=Infinity,
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

   

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(buyingCall => {

                if (BUCSSOptionListIgnorer({
                    option:buyingCall,
                    minVol
                }))
                    return buyingCall


                const buyingCallPrice = getPriceOfAsset({
                    asset: buyingCall,
                    priceType,
                    sideType: 'BUY'
                });
                if(buyingCallPrice===0) return buyingCall

                const optionListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingCall.symbol || !_option.isCall )
                        return false
                    if (_option.optionDetails?.strikePrice <= buyingCall.optionDetails?.strikePrice)
                        return false


                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false


                    return true
                    

                }
                );

                let allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (_allPossibleStrategies, sellingCall) => {



                    
                    const sellingCallPrice = getPriceOfAsset({
                        asset: sellingCall,
                        priceType,
                        sideType: 'SELL'
                    });
                    if(sellingCallPrice===0) return _allPossibleStrategies



                    let __allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (___allPossibleStrategies, anotherSellingCall) => {


                        const anotherSellingCallPrice = getPriceOfAsset({
                            asset: anotherSellingCall,
                            priceType,
                            sideType: 'SELL'
                        });
                        if(anotherSellingCallPrice===0) return ___allPossibleStrategies



                        const maxProfitOfSellingCall = anotherSellingCallPrice;

                        const strategyPositionsOfBUCS = [
                            {
                                ...buyingCall,
                                isBuy: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingCall,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                        ]
                        const totalCostOfBUCS = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBUCS,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMaxLossOfBUCS = Math.min(...strategyPositionsOfBUCS.map(strategyPosition=>strategyPosition.strikePrice))/ 1.2;
                        const priceThatCauseMaxPofitOfBUCS = Math.max(...strategyPositionsOfBUCS.map(strategyPosition=>strategyPosition.strikePrice))* 1.2;



                        const maxLossOfBUCS = totalCostOfBUCS + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBUCS, stockPrice:priceThatCauseMaxLossOfBUCS});
                        const maxProfitOfBUCS = totalCostOfBUCS + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBUCS, stockPrice:priceThatCauseMaxPofitOfBUCS});



                        const quantityFactorOfBUCS = Math.abs(maxProfitOfSellingCall/maxLossOfBUCS);


                        if (quantityFactorOfBUCS < minQuantityFactorOfBUCS  || quantityFactorOfBUCS > maxQuantityFactorOfBUCS)
                            return ___allPossibleStrategies




                        const strategyPositionsOfBUCS_RATIO = [
                            {
                                ...buyingCall,
                                isBuy: true,
                                getQuantity: () => 1*quantityFactorOfBUCS/1.3,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingCall,
                                isSell: true,
                                getQuantity: () => 1*quantityFactorOfBUCS/1.3,
                                getRequiredMargin() { }
                            },
                            {
                                ...anotherSellingCall,
                                isSell: true,
                                getQuantity: () => 1,

                                getRequiredMargin: () => {
                                    return (calculateOptionMargin({
                                        priceSpot: anotherSellingCall.optionDetails.stockSymbolDetails.last,
                                        strikePrice: anotherSellingCall.optionDetails.strikePrice,
                                        contractSize: 1000,
                                        optionPremium: anotherSellingCall.last,
                                        optionType: anotherSellingCall.isCall ? "call" : "put"
                                    })?.required || 0) / 1000;
                                }
                            },
                        ]


                        const totalCostOfBUCS_RATIO = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBUCS_RATIO,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMaxLossOfBUCS_RATIO = Math.max(...strategyPositionsOfBUCS_RATIO.map(strategyPosition=>strategyPosition.strikePrice)) * 1.3;
                        const priceThatCauseMaxProfitOfBUCS_RATIO = anotherSellingCall.optionDetails.strikePrice;
                        const priceThatCauseMinProfitOfBUCS_RATIO = Math.min(...strategyPositionsOfBUCS_RATIO.map(strategyPosition=>strategyPosition.strikePrice)) / 1.3;



                        

                      

                        const maxLossOfBUCS_RATIO = totalCostOfBUCS_RATIO + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBUCS_RATIO, stockPrice:priceThatCauseMaxLossOfBUCS_RATIO});
                        const maxProfitOfBUCS_RATIO = totalCostOfBUCS_RATIO + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBUCS_RATIO, stockPrice:priceThatCauseMaxProfitOfBUCS_RATIO});
                        const minProfitOfBUCS_RATIO = totalCostOfBUCS_RATIO + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBUCS_RATIO, stockPrice:priceThatCauseMinProfitOfBUCS_RATIO});


                        const maxProfitPercentOfBUCS_RATIO = maxProfitOfBUCS_RATIO / Math.abs(totalCostOfBUCS_RATIO);
                        const minProfitPercentOfBUCS_RATIO = minProfitOfBUCS_RATIO / Math.abs(totalCostOfBUCS_RATIO);

                        const breakevenList = findBreakevenList({
                            positions:strategyPositionsOfBUCS_RATIO, 
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const breakeven = breakevenList[0];


                        let isFullBodyProfitable,stockPriceToSarBeSarPercent;
                        if(!breakeven && maxLossOfBUCS_RATIO>0){
                            isFullBodyProfitable = true;
                        }else if(!breakeven){
                            return _allPossibleStrategies
                        }else{
                            if(!anotherSellingCall?.optionDetails?.stockSymbolDetails?.last) return _allPossibleStrategies

                            stockPriceToSarBeSarPercent = (breakeven /anotherSellingCall.optionDetails.stockSymbolDetails.last ) - 1;

                        
                            if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSar || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSar)
                                return _allPossibleStrategies
                        }

                        

                        return ___allPossibleStrategies.concat([{
                            option: {
                                ...buyingCall
                            },
                            positions:[buyingCall, sellingCall, anotherSellingCall],
                            strategyTypeTitle: "BUCS_RATIO",
                            expectedProfitNotif,
                            minProfitToFilter,
                            stockPriceToSarBeSarPercent,
                            isWholeProfitable:isFullBodyProfitable,
                            isProfitEnough : isProfitEnoughFn && isProfitEnoughFn(minProfitPercentOfBUCS_RATIO),
                            name: createStrategyName([buyingCall, sellingCall, anotherSellingCall]),
                            // profitPercent: isFullBodyProfitable ? 1: -stockPriceToSarBeSarPercent 
                            profitPercent: isFullBodyProfitable ? 10: minProfitPercentOfBUCS_RATIO 
                        }])
                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

                }
                , []);

                return {
                    ...buyingCall,
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
        strategyName: "BUCS_RATIO",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceToSarBeSar,
        maxStockPriceToSarBeSar,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BUCS_RATIO",
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




const calcBUPSRatioStrategies = (list, {priceType, strategySubName, minQuantityFactorOfBUPS=0.6, 
    minStockPriceToSarBeSar=-Infinity,
    maxStockPriceToSarBeSar=Infinity,
    minProfitToFilter,
    isProfitEnoughFn,
    filteredList,
            optionsGroupedByStock,
    min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, 
    minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {
    

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(buyingPut => {
                if (!buyingPut.optionDetails?.stockSymbolDetails || !buyingPut.isPut){
                    return buyingPut
                }

                const buyingPutPrice = getPriceOfAsset({
                    asset: buyingPut,
                    priceType,
                    sideType: 'BUY'
                });
                if(buyingPutPrice===0) return buyingPut


              
                const putListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingPut.symbol || !_option.isPut )
                        return
                    if (_option.optionDetails?.strikePrice < buyingPut.optionDetails?.strikePrice)
                        return


                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    return stockPriceHigherStrikeRatio > minStockPriceDistanceInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceInPercent

                }
                );

                const callListHigherStrikeThanBuyingPut = optionListOfSameDate.filter(_option => {
                    if (!_option.isCall )
                        return false
                    if (_option.optionDetails?.strikePrice < buyingPut.optionDetails?.strikePrice)
                        return false


                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    return true

                }
                );

                let allPossibleStrategies = putListWithHigherStrikePrice.reduce( (_allPossibleStrategies, sellingPut) => {



                  

                    const sellingPutPrice = getPriceOfAsset({
                        asset: sellingPut,
                        priceType,
                        sideType: 'SELL'
                    });
                    if(sellingPutPrice===0) return _allPossibleStrategies
                   


                    let __allPossibleStrategies = callListHigherStrikeThanBuyingPut.reduce( (___allPossibleStrategies, sellingCall) => {


                     


                        const sellingCallPrice = getPriceOfAsset({
                            asset: sellingCall,
                            priceType,
                            sideType: 'SELL'
                        });
                        if (sellingCallPrice === 0) return ___allPossibleStrategies


                        const maxProfitOfSellingCall = sellingCallPrice;


                        const diffOfBUPS_Strikes = sellingPut.optionDetails?.strikePrice - buyingPut.optionDetails?.strikePrice;
                        const strategyPositionsOfBUPS = [
                            {
                                ...buyingPut,
                                isBuy: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingPut,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin: () => diffOfBUPS_Strikes
                            },
                        ]



                        const totalCostOfBUPS = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBUPS,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMaxLossOfBUPS = Math.min(...strategyPositionsOfBUPS.map(strategyPosition=>strategyPosition.strikePrice))/ 1.2;



                        const maxLossOfBUPS = totalCostOfBUPS + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBUPS, stockPrice:priceThatCauseMaxLossOfBUPS});



                        const quantityFactorOfBUPS = Math.abs(maxProfitOfSellingCall/maxLossOfBUPS);


                        if (quantityFactorOfBUPS < minQuantityFactorOfBUPS)
                            return ___allPossibleStrategies


                        // TODO: sellingCall margin
                        const strategyPositionsOfBUPS_RATIO = [
                            {
                                ...buyingPut,
                                isBuy: true,
                                getQuantity: () => 1*quantityFactorOfBUPS/1.3,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingPut,
                                isSell: true,
                                getQuantity: () => 1*quantityFactorOfBUPS/1.3,
                                getRequiredMargin: () => diffOfBUPS_Strikes
                            },
                            {
                                ...sellingCall,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin: () => {
                                    return (calculateOptionMargin({
                                        priceSpot: sellingCall.optionDetails.stockSymbolDetails.last,
                                        strikePrice: sellingCall.optionDetails.strikePrice,
                                        contractSize: 1000,
                                        optionPremium: sellingCall.last,
                                        optionType: sellingCall.isCall ? "call" : "put"
                                    })?.required || 0) / 1000;
                                }
                            },
                        ]

                        const totalCostOfBUPS_RATIO = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBUPS_RATIO,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMaxLossOfBUPS_RATIO = Math.max(...strategyPositionsOfBUPS_RATIO.map(strategyPosition=>strategyPosition.strikePrice)) * 1.3;
                        const priceThatCauseMaxProfitOfBUPS_RATIO = sellingCall.optionDetails.strikePrice;
                        const priceThatCauseMinProfitOfBUPS_RATIO = Math.min(...strategyPositionsOfBUPS_RATIO.map(strategyPosition=>strategyPosition.strikePrice)) / 1.3;


                        const maxLossOfBUPS_RATIO = totalCostOfBUPS_RATIO + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBUPS_RATIO, stockPrice:priceThatCauseMaxLossOfBUPS_RATIO});
                        const maxProfitOfBUPS_RATIO = totalCostOfBUPS_RATIO + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBUPS_RATIO, stockPrice:priceThatCauseMaxProfitOfBUPS_RATIO});
                        const minProfitOfBUPS_RATIO = totalCostOfBUPS_RATIO + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBUPS_RATIO, stockPrice:priceThatCauseMinProfitOfBUPS_RATIO});

                        const maxProfitPercentOfBUPS_RATIO = maxProfitOfBUPS_RATIO / Math.abs(totalCostOfBUPS_RATIO);
                        const minProfitPercentOfBUPS_RATIO = minProfitOfBUPS_RATIO / Math.abs(totalCostOfBUPS_RATIO);

                        const breakevenList = findBreakevenList({
                            positions:strategyPositionsOfBUPS_RATIO, 
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const breakeven = breakevenList[0];


                        let isFullBodyProfitable,stockPriceToSarBeSarPercent;
                        if(!breakeven && maxLossOfBUPS_RATIO>0){
                            isFullBodyProfitable = true;
                        }else if(!breakeven){
                            return _allPossibleStrategies
                        }else{
                            if(!sellingCall?.optionDetails?.stockSymbolDetails?.last) return _allPossibleStrategies

                            stockPriceToSarBeSarPercent = (breakeven /sellingCall.optionDetails.stockSymbolDetails.last ) - 1;

                        
                            if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSar || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSar)
                                return _allPossibleStrategies
                        }


                        return ___allPossibleStrategies.concat([{
                            option: {
                                ...buyingPut
                            },
                            positions:[buyingPut, sellingPut, sellingCall],
                            strategyTypeTitle: "BUPS_Ratio",
                            expectedProfitNotif,
                            minProfitToFilter,
                            stockPriceToSarBeSarPercent,
                            isWholeProfitable:isFullBodyProfitable,
                            isProfitEnough : isProfitEnoughFn && isProfitEnoughFn(minProfitPercentOfBUPS_RATIO),
                            name: createStrategyName([buyingPut, sellingPut, sellingCall]),
                            profitPercent: isFullBodyProfitable ? 10 : minProfitPercentOfBUPS_RATIO
                            // profitPercent: isFullBodyProfitable ? 1 : -stockPriceToSarBeSarPercent
                        }])
                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

                }
                , []);

                return {
                    ...buyingPut,
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
        strategyName: "BUPS_Ratio",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceInPercent,
        maxStockPriceDistanceInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BUPS_Ratio",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceInPercent,
            maxStockPriceDistanceInPercent,
            minVol
        })
    }

}



// Jade Lizard
const calcBECSRatioStrategies = (list, {priceType, strategySubName, minQuantityFactorOfBECS=0.6, 
    minStockPriceToSarBeSar=-Infinity,
    maxStockPriceToSarBeSar=Infinity,
    minProfitToFilter,
    isProfitEnoughFn,
    filteredList,
            optionsGroupedByStock,
    min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, 
    minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {
    

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(buyingCall => {
                if (!buyingCall.optionDetails?.stockSymbolDetails || !buyingCall.isCall ){
                    return buyingCall
                }

                const buyingCallPrice = getPriceOfAsset({
                    asset: buyingCall,
                    priceType,
                    sideType: 'BUY'
                });
                if(buyingCallPrice===0) return buyingCall


              
                const callListWithLowerStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingCall.symbol || !_option.isCall )
                        return
                    if (_option.optionDetails?.strikePrice >= buyingCall.optionDetails?.strikePrice)
                        return


                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceLowerStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    return stockPriceLowerStrikeRatio > minStockPriceDistanceInPercent && stockPriceLowerStrikeRatio < maxStockPriceDistanceInPercent

                }
                );

                const putListLowerStrikeThanBuyingCall = optionListOfSameDate.filter(_option => {
                    if (!_option.isPut )
                        return false
                    if (_option.optionDetails?.strikePrice > buyingCall.optionDetails?.strikePrice)
                        return false


                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    return true

                }
                );

                let allPossibleStrategies = callListWithLowerStrikePrice.reduce( (_allPossibleStrategies, sellingCall) => {



                  

                    const sellingCallPrice = getPriceOfAsset({
                        asset: sellingCall,
                        priceType,
                        sideType: 'SELL'
                    });
                    if(sellingCallPrice===0) return _allPossibleStrategies
                   


                    let __allPossibleStrategies = putListLowerStrikeThanBuyingCall.reduce( (___allPossibleStrategies, sellingPut) => {


                     


                        const sellingPutPrice = getPriceOfAsset({
                            asset: sellingPut,
                            priceType,
                            sideType: 'SELL'
                        });
                        if (sellingPutPrice === 0) return ___allPossibleStrategies


                        const maxProfitOfSellingPut = sellingPutPrice;


                        const diffOfBECS_Strikes = buyingCall.optionDetails?.strikePrice - sellingCall.optionDetails?.strikePrice;
                        const strategyPositionsOfBECS = [
                            {
                                ...buyingCall,
                                isBuy: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingCall,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin: () => diffOfBECS_Strikes
                            },
                        ]



                        const totalCostOfBECS = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBECS,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMaxLossOfBECS = Math.max(...strategyPositionsOfBECS.map(strategyPosition=>strategyPosition.strikePrice))* 1.2;
                        const priceThatCauseMaxProfitOfBECS = Math.min(...strategyPositionsOfBECS.map(strategyPosition=>strategyPosition.strikePrice))/ 1.2;



                        const maxLossOfBECS = totalCostOfBECS + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBECS, stockPrice:priceThatCauseMaxLossOfBECS});
                        const maxProfitOfBECS = totalCostOfBECS + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBECS, stockPrice:priceThatCauseMaxProfitOfBECS});



                        const quantityFactorOfBECS = Math.abs(maxProfitOfSellingPut/maxLossOfBECS);


                        if (quantityFactorOfBECS < minQuantityFactorOfBECS)
                            return ___allPossibleStrategies



                        // TODO: selling put margin
                        const strategyPositionsOfBECS_RATIO = [
                            {
                                ...buyingCall,
                                isBuy: true,
                                getQuantity: () => 1*quantityFactorOfBECS/1.3,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingCall,
                                isSell: true,
                                getQuantity: () => 1*quantityFactorOfBECS/1.3,
                                getRequiredMargin: () => diffOfBECS_Strikes
                            },
                            {
                                ...sellingPut,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin: () => {
                                    return (calculateOptionMargin({
                                        priceSpot: sellingPut.optionDetails.stockSymbolDetails.last,
                                        strikePrice: sellingPut.optionDetails.strikePrice,
                                        contractSize: 1000,
                                        optionPremium: sellingPut.last,
                                        optionType: sellingPut.isCall ? "call" : "put"
                                    })?.required || 0) / 1000;
                                }
                            },
                        ]
                        


                        const breakevenList = findBreakevenList({
                            positions:strategyPositionsOfBECS_RATIO, 
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                         const totalCostOfBECS_RATIO = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBECS_RATIO,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMaxLossOfBECS_RATIO = Math.min(...strategyPositionsOfBECS_RATIO.map(strategyPosition=>strategyPosition.strikePrice)) / 1.2;
                        const priceThatCauseMaxProfitOfBECS_RATIO = sellingCall.optionDetails.strikePrice;
                        const priceThatCauseMinProfitOfBECS_RATIO = Math.max(...strategyPositionsOfBECS_RATIO.map(strategyPosition=>strategyPosition.strikePrice)) * 1.3;


                        

                        const maxLossOfBECS_RATIO = totalCostOfBECS_RATIO + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBECS_RATIO, stockPrice:priceThatCauseMaxLossOfBECS_RATIO});

                        const maxProfitOfBECS_RATIO = totalCostOfBECS_RATIO + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBECS_RATIO, stockPrice:priceThatCauseMaxProfitOfBECS_RATIO});
                        const minProfitOfBECS_RATIO = totalCostOfBECS_RATIO + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBECS_RATIO, stockPrice:priceThatCauseMinProfitOfBECS_RATIO});


                        const maxProfitPercentOfBECS_RATIO = maxProfitOfBECS_RATIO / Math.abs(totalCostOfBECS_RATIO);
                        const minProfitPercentOfBECS_RATIO = minProfitOfBECS_RATIO / Math.abs(totalCostOfBECS_RATIO);


                        const breakeven = breakevenList[0];

                        let isFullBodyProfitable,stockPriceToSarBeSarPercent;
                        if(!breakeven && maxLossOfBECS_RATIO>0){
                            isFullBodyProfitable = true;
                        }else if(!breakeven){
                            return _allPossibleStrategies
                        }else{

                            stockPriceToSarBeSarPercent = (breakeven /sellingPut.optionDetails.stockSymbolDetails.last ) - 1;
                        
                            if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSar || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSar)
                                return _allPossibleStrategies
                        }


                        return ___allPossibleStrategies.concat([{
                            option: {
                                ...buyingCall
                            },
                            positions:[buyingCall, sellingCall, sellingPut],
                            strategyTypeTitle: "BECS_Ratio",
                            minProfitToFilter,
                            expectedProfitNotif,
                            stockPriceToSarBeSarPercent,
                            isWholeProfitable:isFullBodyProfitable,
                            isProfitEnough : isProfitEnoughFn && isProfitEnoughFn(minProfitPercentOfBECS_RATIO),
                            name: createStrategyName([buyingCall, sellingCall, sellingPut]),
                            // profitPercent: isFullBodyProfitable? 1: stockPriceToSarBeSarPercent
                            profitPercent: isFullBodyProfitable? 10: minProfitPercentOfBECS_RATIO
                        }])
                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

                }
                , []);

                return {
                    ...buyingCall,
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
        strategyName: "BECS_Ratio",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceInPercent,
        maxStockPriceDistanceInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BECS_Ratio",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceInPercent,
            maxStockPriceDistanceInPercent,
            minVol
        })
    }

}


const calcBEPSRatioStrategies = (list, {priceType, strategySubName, minQuantityFactorOfBEPS=0.6, 
    minStockPriceToSarBeSar=-Infinity,
    maxStockPriceToSarBeSar=Infinity,
    minProfitToFilter,
    isProfitEnoughFn,
    filteredList,
            optionsGroupedByStock,
    min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, 
    minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {
    

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(buyingPut => {
                if (!buyingPut.optionDetails?.stockSymbolDetails || !buyingPut.isPut ){
                    return buyingPut
                }

                const buyingPutPrice = getPriceOfAsset({
                    asset: buyingPut,
                    priceType,
                    sideType: 'BUY'
                });
                if(buyingPutPrice===0) return buyingPut


              
                const putListWithLowerStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingPut.symbol || !_option.isPut )
                        return
                    if (_option.optionDetails?.strikePrice >= buyingPut.optionDetails?.strikePrice)
                        return


                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false


                    return true

                  
                }
                );

                

                let allPossibleStrategies = putListWithLowerStrikePrice.reduce( (_allPossibleStrategies, sellingPut) => {

                    const stockPriceLowerStrikeRatio = (sellingPut.optionDetails.stockSymbolDetails.last / sellingPut.optionDetails?.strikePrice) - 1;

                    if(stockPriceLowerStrikeRatio < minStockPriceDistanceInPercent || stockPriceLowerStrikeRatio > maxStockPriceDistanceInPercent){
                        return _allPossibleStrategies
                    }


                  

                    const sellingPutPrice = getPriceOfAsset({
                        asset: sellingPut,
                        priceType,
                        sideType: 'SELL'
                    });
                    if(sellingPutPrice===0) return _allPossibleStrategies
                   


                    let __allPossibleStrategies = putListWithLowerStrikePrice.reduce( (___allPossibleStrategies, anotherSellingPut) => {


                     


                        const anotherSellingPutPrice = getPriceOfAsset({
                            asset: anotherSellingPut,
                            priceType,
                            sideType: 'SELL'
                        });
                        if (anotherSellingPutPrice === 0) return ___allPossibleStrategies


                        const maxProfitOfSellingPut = anotherSellingPutPrice;


                        const diffOfBEPS_Strikes = buyingPut.optionDetails?.strikePrice - anotherSellingPut.optionDetails?.strikePrice;
                        const strategyPositionsOfBEPS = [
                            {
                                ...buyingPut,
                                isBuy: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingPut,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                        ]



                        const totalCostOfBEPS = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBEPS,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMaxLossOfBEPS = Math.max(...strategyPositionsOfBEPS.map(strategyPosition=>strategyPosition.strikePrice))* 1.2;



                        const maxLossOfBEPS = totalCostOfBEPS + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBEPS, stockPrice:priceThatCauseMaxLossOfBEPS});



                        const quantityFactorOfBEPS = Math.abs(maxProfitOfSellingPut/maxLossOfBEPS);

                         if (quantityFactorOfBEPS < minQuantityFactorOfBEPS)
                            return ___allPossibleStrategies



                        const strategyPositionsOfBEPS_RATIO = [
                            {
                                ...buyingPut,
                                isBuy: true,
                                getQuantity: () => 1*quantityFactorOfBEPS/1.3,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingPut,
                                isSell: true,
                                getQuantity: () => 1*quantityFactorOfBEPS/1.3,
                                getRequiredMargin() { }
                            },
                            {
                                ...anotherSellingPut,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin: () => {
                                    return (calculateOptionMargin({
                                        priceSpot: anotherSellingPut.optionDetails.stockSymbolDetails.last,
                                        strikePrice: anotherSellingPut.optionDetails.strikePrice,
                                        contractSize: 1000,
                                        optionPremium: anotherSellingPut.last,
                                        optionType: anotherSellingPut.isCall ? "call" : "put"
                                    })?.required || 0) / 1000;
                                }
                            },
                        ]


                       

                       


                         const totalCostOfBEPS_RATIO = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBEPS_RATIO,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMaxLossOfBEPS_RATIO = Math.min(...strategyPositionsOfBEPS_RATIO.map(strategyPosition=>strategyPosition.strikePrice)) / 1.2;
                        const priceThatCauseMaxProfitOfBEPS_RATIO = sellingPut.optionDetails.strikePrice;
                        const priceThatCauseMinProfitOfBEPS_RATIO = Math.max(...strategyPositionsOfBEPS_RATIO.map(strategyPosition=>strategyPosition.strikePrice)) * 1.3;


                        



                        const maxLossOfBEPS_RATIO = totalCostOfBEPS_RATIO + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBEPS_RATIO, stockPrice:priceThatCauseMaxLossOfBEPS_RATIO});
                        const maxProfitOfBEPS_RATIO = totalCostOfBEPS_RATIO + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBEPS_RATIO, stockPrice:priceThatCauseMaxProfitOfBEPS_RATIO});
                        const minProfitOfBEPS_RATIO = totalCostOfBEPS_RATIO + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBEPS_RATIO, stockPrice:priceThatCauseMinProfitOfBEPS_RATIO});


                        const maxProfitPercentOfBEPS_RATIO = maxProfitOfBEPS_RATIO / Math.abs(totalCostOfBEPS_RATIO);
                        const minProfitPercentOfBEPS_RATIO = minProfitOfBEPS_RATIO / Math.abs(totalCostOfBEPS_RATIO);

                        const breakevenList = findBreakevenList({
                            positions:strategyPositionsOfBEPS_RATIO, 
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const breakeven = breakevenList[0];


                        let isFullBodyProfitable,stockPriceToSarBeSarPercent;
                        if(!breakeven && maxLossOfBEPS_RATIO>0){
                            isFullBodyProfitable = true;
                        }else if(!breakeven){
                            return _allPossibleStrategies
                        }else{

                            stockPriceToSarBeSarPercent = (breakeven /anotherSellingPut.optionDetails.stockSymbolDetails.last ) - 1;

                        
                            if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSar || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSar)
                                return _allPossibleStrategies
                        }







                        return ___allPossibleStrategies.concat([{
                            option: {
                                ...buyingPut
                            },
                            positions:[buyingPut, sellingPut, anotherSellingPut],
                            strategyTypeTitle: "BEPS_Ratio",
                            expectedProfitNotif,
                            minProfitToFilter,
                            stockPriceToSarBeSarPercent,
                            isWholeProfitable:isFullBodyProfitable,
                            isProfitEnough : isProfitEnoughFn && isProfitEnoughFn(minProfitPercentOfBEPS_RATIO),
                            name: createStrategyName([buyingPut, sellingPut, anotherSellingPut]),
                            profitPercent: isFullBodyProfitable ? 10 : minProfitPercentOfBEPS_RATIO
                            // profitPercent: isFullBodyProfitable ? 1 : stockPriceToSarBeSarPercent
                        }])
                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

                }
                , []);

                return {
                    ...buyingPut,
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
        strategyName: "BEPS_Ratio",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceInPercent,
        maxStockPriceDistanceInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BEPS_Ratio",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceInPercent,
            maxStockPriceDistanceInPercent,
            minVol
        })
    }

}




// مرید پوت مصنوعی
const calcBUPS_COLLARStrategies = (list, {priceType, expectedProfitPerMonth, 
    minProfitToFilter,
    settlementGainChoosePriceType="MIN", strategySubName, 
    BUPSOptionListIgnorer=generalConfig.BUPSOptionListIgnorer, 
    justIfWholeIsPofitable=false,
    filteredList,
            optionsGroupedByStock,
    min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, 
    minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, 
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


                    const callOptionWithSameStrike = optionListOfSameDate.find(optionOfSameDate => {
                        return optionOfSameDate.isCall && optionOfSameDate.bestSell > 0 && (optionOfSameDate.optionDetails?.strikePrice === _option.optionDetails?.strikePrice)
                    }
                    );

                    if (!callOptionWithSameStrike) {
                        return _allPossibleStrategies
                    }


                    const callOptionWithSameStrikePrice = getPriceOfAsset({
                        asset: callOptionWithSameStrike,
                        priceType,
                        sideType: 'BUY'
                    });

                    if(callOptionWithSameStrikePrice===0) return _allPossibleStrategies

                    const stockPriceHigherStrikeRatio = (option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceHigherStrikeRatio < minStockPriceDistanceInPercent || stockPriceHigherStrikeRatio > maxStockPriceDistanceInPercent)
                        return _allPossibleStrategies











                    const diffOfBUPS_Strikes = _option.optionDetails?.strikePrice - option.optionDetails?.strikePrice;



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
                        {
                            ...callOptionWithSameStrike,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
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



                    const offsetPrice = Math.min(...strategyPositions.map(strategyPosition=>strategyPosition.strikePrice))/ 1.2;



                    const profit = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:offsetPrice});

                    if(justIfWholeIsPofitable && profit<0) return _allPossibleStrategies


                    const profitPercent = profit / Math.abs(totalCost);



                    const settlementGain =  settlementGainCalculator({strategyPositions,stockPrice: option.optionDetails?.stockSymbolDetails?.last})
                    const profitOfSettlement = totalCost + settlementGain;
                    const profitPercentOfSettlement = profitOfSettlement / Math.abs(totalCost);

                    if(profitPercentOfSettlement<-0.05) return _allPossibleStrategies

                     


                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, _option,callOptionWithSameStrike],
                        strategyPositions,
                        currentStockPrice:option.optionDetails?.stockSymbolDetails?.last,
                        totalCost,
                        strategyTypeTitle: "BUPS_COLLAR",
                        expectedProfitNotif,
                        minProfitToFilter,
                        expectedProfitPerMonth,
                        isWholeProfitable : profit>=0,
                        name: createStrategyName([option, _option,callOptionWithSameStrike]),
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
        strategyName: "BUPS_COLLAR",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceInPercent,
        maxStockPriceDistanceInPercent,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BUPS_COLLAR",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceInPercent,
            maxStockPriceDistanceInPercent,
            minVol
        })
    }

}

const calcBUCS_COLLAR_Strategies = (list, {priceType, expectedProfitPerMonth, strategySubName, 
    BUCSSOptionListIgnorer=generalConfig.BUCSSOptionListIgnorer, 
    minProfitToFilter,
    filteredList,
            optionsGroupedByStock,
    min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, 
    minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, 
    justIfWholeIsPofitable=false,
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
                    if (_option.symbol === option.symbol || !_option.symbol.startsWith('ض') )
                        return
                    if (_option.optionDetails?.strikePrice < option.optionDetails?.strikePrice)
                        return

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    return stockPriceHigherStrikeRatio > minStockPriceDistanceInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceInPercent

                }
                );

                let allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (_allPossibleStrategies, _option) => {

                    const putOptionWithSameStrike = optionListOfSameDate.find(optionOfSameDate => {
                        return optionOfSameDate.isPut && optionOfSameDate.bestSell > 0 && (optionOfSameDate.optionDetails?.strikePrice === _option.optionDetails?.strikePrice)
                    }
                    );

                    if (!putOptionWithSameStrike) {
                        return _allPossibleStrategies
                    }


                    
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
                        {
                            ...putOptionWithSameStrike,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
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

                    const offsetPrice = Math.max(...strategyPositions.map(strategyPosition=>strategyPosition.strikePrice))* 1.2;

                    const profit = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:offsetPrice});

                    const profitPercent = profit / Math.abs(totalCost);


                    if(justIfWholeIsPofitable && profit<0) return _allPossibleStrategies




                    const settlementGain =  settlementGainCalculator({strategyPositions,stockPrice: option.optionDetails?.stockSymbolDetails?.last})
                    const profitOfSettlement = totalCost + settlementGain;
                    const profitPercentOfSettlement = profitOfSettlement / Math.abs(totalCost);


                    if(profitPercentOfSettlement<-0.05) return _allPossibleStrategies



                    


                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, _option,putOptionWithSameStrike],

                        strategyPositions,
                        currentStockPrice:option.optionDetails?.stockSymbolDetails?.last,
                        totalCost,


                        strategyTypeTitle: "BUCS_COLLAR",
                        expectedProfitNotif,
                        minProfitToFilter,
                        expectedProfitPerMonth,
                        isWholeProfitable : profit>=0,
                        name: createStrategyName([option, _option,putOptionWithSameStrike]),
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
        strategyName: "BUCS_COLLAR",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceInPercent,
        maxStockPriceDistanceInPercent,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BUCS_COLLAR",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceInPercent,
            maxStockPriceDistanceInPercent,
            minVol
        })
    }

}


const calcBEPS_COLLAR_Strategies = (list, {priceType, expectedProfitPerMonth, 
    strategySubName, min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, 
    minProfitToFilter,
    filteredList,
            optionsGroupedByStock,
    minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, 
    justIfWholeIsPofitable=false,
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

   

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (!option.isPut )
                    return option


                const optionPrice = getPriceOfAsset({
                    asset: option,
                    priceType,
                    sideType: 'SELL'
                });

                if(optionPrice===0) return option

                const putListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === option.symbol || !_option.isPut )
                        return
                    if (_option.optionDetails?.strikePrice <= option.optionDetails?.strikePrice)
                        return

                    if(!_option.optionDetails?.stockSymbolDetails) return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    return stockPriceHigherStrikeRatio > minStockPriceDistanceInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceInPercent

                }
                );

                let allPossibleStrategies = putListWithHigherStrikePrice.reduce( (_allPossibleStrategies, buyingPut) => {

                    const buyingPutPrice = getPriceOfAsset({
                        asset: buyingPut,
                        priceType,
                        sideType: 'BUY'
                    });

                    if(buyingPutPrice===0) return _allPossibleStrategies

                    const callWithSameStrikeOfSellingPut = optionListOfSameDate.find(optionOfSameDate => {
                        return optionOfSameDate.isCall && optionOfSameDate.bestSell > 0 && (optionOfSameDate.optionDetails?.strikePrice === option.optionDetails?.strikePrice)
                    }
                    );

                    if (!callWithSameStrikeOfSellingPut) {
                        return _allPossibleStrategies
                    }

                    const callWithSameStrikeOfSellingPutPrice = getPriceOfAsset({
                        asset: callWithSameStrikeOfSellingPut,
                        priceType,
                        sideType: 'BUY'
                    });

                    if(callWithSameStrikeOfSellingPutPrice===0) return _allPossibleStrategies



                    const strategyPositions = [
                        {
                            ...buyingPut,
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
                        {
                            ...callWithSameStrikeOfSellingPut,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
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



                    const offsetPrice = Math.min(...strategyPositions.map(strategyPosition=>strategyPosition.strikePrice))/ 1.2;



                    const profit = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:offsetPrice});


                    const profitPercent = profit / Math.abs(totalCost);



                    if(justIfWholeIsPofitable && profit<0) return _allPossibleStrategies






                    const settlementGain =  settlementGainCalculator({strategyPositions,stockPrice: option.optionDetails?.stockSymbolDetails?.last})
                    const profitOfSettlement = totalCost + settlementGain;
                    const profitPercentOfSettlement = profitOfSettlement / Math.abs(totalCost);

                    if(profitPercentOfSettlement<-0.05) return _allPossibleStrategies


                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, buyingPut,callWithSameStrikeOfSellingPut],
                        strategyPositions,
                        currentStockPrice:option.optionDetails?.stockSymbolDetails?.last,
                        totalCost,
                        strategyTypeTitle: "BEPS_COLLAR",
                        expectedProfitNotif,
                        minProfitToFilter,
                        expectedProfitPerMonth,
                        isWholeProfitable : profit>=0,
                        name: createStrategyName([option, buyingPut,callWithSameStrikeOfSellingPut]),
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
        strategyName: "BEPS_COLLAR",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceInPercent,
        maxStockPriceDistanceInPercent,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BEPS_COLLAR",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceInPercent,
            maxStockPriceDistanceInPercent,
            minVol
        })
    }

}




const calcBECS_COLLAR_Strategies = (list, {priceType, expectedProfitPerMonth, 
    strategySubName, min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, 
    minProfitToFilter,
    filteredList,
            optionsGroupedByStock,
    minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, 
    justIfWholeIsPofitable=false,
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

  

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (!option.isCall )
                    return option


                const optionPrice = getPriceOfAsset({
                    asset: option,
                    priceType,
                    sideType: 'SELL'
                });

                if(optionPrice===0) return option

                const callListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === option.symbol || !_option.isCall )
                        return
                    if (_option.optionDetails?.strikePrice <= option.optionDetails?.strikePrice)
                        return

                    if(!_option.optionDetails?.stockSymbolDetails) return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    return stockPriceHigherStrikeRatio > minStockPriceDistanceInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceInPercent

                }
                );

                let allPossibleStrategies = callListWithHigherStrikePrice.reduce( (_allPossibleStrategies, buyingCall) => {

                    const buyingCallPrice = getPriceOfAsset({
                        asset: buyingCall,
                        priceType,
                        sideType: 'BUY'
                    });

                    if(buyingCallPrice===0) return _allPossibleStrategies

                    const putWithSameStrikeOfSellingCall = optionListOfSameDate.find(optionOfSameDate => {
                        return optionOfSameDate.isPut && optionOfSameDate.bestSell > 0 && (optionOfSameDate.optionDetails?.strikePrice === option.optionDetails?.strikePrice)
                    }
                    );

                    if (!putWithSameStrikeOfSellingCall) {
                        return _allPossibleStrategies
                    }

                    const putWithSameStrikeOfSellingCallPrice = getPriceOfAsset({
                        asset: putWithSameStrikeOfSellingCall,
                        priceType,
                        sideType: 'BUY'
                    });

                    if(putWithSameStrikeOfSellingCallPrice===0) return _allPossibleStrategies




                     const diffOfBECS_Strikes = buyingCall.optionDetails?.strikePrice - option.optionDetails?.strikePrice;
                    const strategyPositions = [
                        {
                            ...buyingCall,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                        {
                            ...option,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin:()=>diffOfBECS_Strikes
                        },
                        {
                            ...putWithSameStrikeOfSellingCall,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
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



                    const offsetPrice = Math.max(...strategyPositions.map(strategyPosition=>strategyPosition.strikePrice))* 1.2;



                    const profit = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:offsetPrice});


                    const profitPercent = profit / Math.abs(totalCost);



                    if(justIfWholeIsPofitable && profit<0) return _allPossibleStrategies






                    const settlementGain =  settlementGainCalculator({strategyPositions,stockPrice: option.optionDetails?.stockSymbolDetails?.last})
                    const profitOfSettlement = totalCost + settlementGain;
                    const profitPercentOfSettlement = profitOfSettlement / Math.abs(totalCost);

                    if(profitPercentOfSettlement<-0.05) return _allPossibleStrategies


                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, buyingCall,putWithSameStrikeOfSellingCall],
                        strategyPositions,
                        currentStockPrice:option.optionDetails?.stockSymbolDetails?.last,
                        totalCost,
                        strategyTypeTitle: "BECS_COLLAR",
                        expectedProfitNotif,
                        minProfitToFilter,
                        expectedProfitPerMonth,
                        isWholeProfitable: profit>=0,
                        name: createStrategyName([option, buyingCall,putWithSameStrikeOfSellingCall]),
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
        strategyName: "BECS_COLLAR",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceInPercent,
        maxStockPriceDistanceInPercent,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BECS_COLLAR",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceInPercent,
            maxStockPriceDistanceInPercent,
            minVol
        })
    }

}



const calcCOVEREDStrategies = (list, {priceType, expectedProfitPerMonth, 
    min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, 
    minProfitToFilter,
    filteredList,
            optionsGroupedByStock,
    minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, 
    minStockPriceToSarBeSar=-Infinity, maxStockPriceToSarBeSar=Infinity, 
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

   

    let enrichedList = [];
    for (let[stockSymbol,optionListOfStock] of Object.entries(optionsGroupedByStock)) {

        const _enrichedList = optionListOfStock.map(option => {

            if (!option.optionDetails?.stockSymbolDetails)
                return option

            if (!option.symbol.startsWith('ض'))
                return option

            const sellingOptionPrice = getPriceOfAsset({
                asset: option,
                priceType,
                sideType: 'SELL'
            });

            if (sellingOptionPrice === 0) return option

            if(!option.optionDetails?.stockSymbolDetails?.bestSell) return option

            if(isBuyQueue(option.optionDetails?.stockSymbolDetails)) return option


            const breakeven = option.optionDetails.stockSymbolDetails.last - sellingOptionPrice;
            const stockPriceToSarBeSarPercent = (breakeven /option.optionDetails.stockSymbolDetails.last ) - 1;


            if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSar || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSar) {
                return option
            }

            const totalCostWithSign = totalCostCalculator({
                buyStocks: [option.optionDetails?.stockSymbolDetails],
                buyOptions: [],
                sellOptions: [option],
                priceType
            });
            const totalOffsetGainWithSign = totalSettlementGain([{
                option,
                positionSide: "SELL",
                choosePriceType: "MIN"
            }, ]);

            const profit = totalCostWithSign + totalOffsetGainWithSign;

            const profitPercent = profit / Math.abs(totalCostWithSign);

            


           

            const strategyObj = {
                option: {
                    ...option
                },
                positions:[option.optionDetails?.stockSymbolDetails, option],
                strategyTypeTitle: "COVERED",
                minProfitToFilter,
                expectedProfitNotif,
                expectedProfitPerMonth,
                stockPriceToSarBeSarPercent,
                settlementTimeDiff : option.settlementTimeDiff,
                name: createStrategyName([option.optionDetails?.stockSymbolDetails, option]),
                profitPercent
            }

            return {
                ...option,
                allPossibleStrategies: [strategyObj]
            }

        }
        );

        enrichedList = enrichedList.concat(_enrichedList)

    }

    return {
        enrichedList,
        allStrategiesSorted: getAllPossibleStrategiesSorted(enrichedList),
        strategyName: "COVERED",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceInPercent,
        maxStockPriceDistanceInPercent,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "COVERED",
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceInPercent,
            maxStockPriceDistanceInPercent,
            minVol
        })
    }

}

const calcCOVERED_CONVERSION_Strategies = (list, {priceType, 
    minProfitToFilter,
    expectedProfitPerMonth, min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = item.settlementTimeDiff;
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionListOfStock] of Object.entries(optionsGroupedByStock)) {

        const _enrichedList = optionListOfStock.map(option => {

            if (!option.optionDetails?.stockSymbolDetails)
                return option


            const sellingOptionPrice = getPriceOfAsset({
                asset: option,
                priceType,
                sideType: 'SELL'
            });

            if (sellingOptionPrice === 0) return option

            if(!option.optionDetails?.stockSymbolDetails?.bestSell) return option

            if(isBuyQueue(option.optionDetails?.stockSymbolDetails)) return option

            const stockPriceStrikeRatio = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;

            if (!option.symbol.startsWith('ض')  || stockPriceStrikeRatio < minStockPriceDistanceInPercent || stockPriceStrikeRatio > maxStockPriceDistanceInPercent)
                return option

            const putOptionWithSameStrike = optionListOfStock.find(optionOfStock => {
                return optionOfStock.isPut && optionOfStock.optionDetails.date === option.optionDetails.date && optionOfStock.bestSell > 0 && (optionOfStock.optionDetails?.strikePrice === option.optionDetails?.strikePrice)
            }
            );

            

            if (!putOptionWithSameStrike) {
                return {
                    ...option,
                    allPossibleStrategies: []
                }
            }

            const buyingPutOptionPrice = getPriceOfAsset({
                asset: putOptionWithSameStrike,
                priceType,
                sideType: 'BUY'
            });

            if (buyingPutOptionPrice === 0) return option

            

            const totalCostWithSign = totalCostCalculator({
                buyStocks: [option.optionDetails?.stockSymbolDetails],
                buyOptions: [putOptionWithSameStrike],
                sellOptions: [option],
                priceType
            });
            const totalOffsetGainWithSign = totalSettlementGain([{
                option,
                positionSide: "SELL"
            }, ]);

            const profit = totalCostWithSign + totalOffsetGainWithSign;

            const profitPercent = profit / Math.abs(totalCostWithSign);
            const strategyObj = {
                option: {
                    ...option
                },
                minProfitToFilter,
                positions:[option.optionDetails?.stockSymbolDetails, option,putOptionWithSameStrike],
                strategyTypeTitle: "CONVERSION",
                expectedProfitNotif,
                expectedProfitPerMonth,
                isWholeProfitable : profit>=0,
                name: createStrategyName([option.optionDetails?.stockSymbolDetails, option]),
                profitPercent
            }

            return {
                ...option,
                allPossibleStrategies: [strategyObj]
            }

        }
        );

        enrichedList = enrichedList.concat(_enrichedList)

    }

    return {
        enrichedList,
        allStrategiesSorted: getAllPossibleStrategiesSorted(enrichedList),
        strategyName: "CONVERSION",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceInPercent,
        maxStockPriceDistanceInPercent,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "CONVERSION",
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceInPercent,
            maxStockPriceDistanceInPercent,
            minVol
        })
    }

}

const calcCOVERED_COLLAR_Strategies = (list, {priceType, 
    minProfitToFilter,
    expectedProfitPerMonth, min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = item.settlementTimeDiff;
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionListOfStock] of Object.entries(optionsGroupedByStock)) {

        const _enrichedList = optionListOfStock.map(option => {

            if (!option.optionDetails?.stockSymbolDetails)
                return option


            const sellingOptionPrice = getPriceOfAsset({
                asset: option,
                priceType,
                sideType: 'SELL'
            });

            if (sellingOptionPrice === 0) return option

            if(!option.optionDetails?.stockSymbolDetails?.bestSell) return option

            if(isBuyQueue(option.optionDetails?.stockSymbolDetails)) return option

            const stockPriceStrikeRatio = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;

            if (!option.symbol.startsWith('ض')  || stockPriceStrikeRatio < minStockPriceDistanceInPercent || stockPriceStrikeRatio > maxStockPriceDistanceInPercent)
                return option




            const putOptionListWithLowerStrike = optionListOfStock.filter(optionOfStock => {
                return optionOfStock.isPut && optionOfStock.optionDetails.date === option.optionDetails.date && optionOfStock.bestSell > 0 && (optionOfStock.optionDetails?.strikePrice < option.optionDetails?.strikePrice)
            }
            );

            if (!putOptionListWithLowerStrike.length) {
                return {
                    ...option,
                    allPossibleStrategies: []
                }
            }

            const allPossibleStrategies = putOptionListWithLowerStrike.map(putOptionWithLowerStrike => {


                

                const buyingPutOptionWithLowerStrikePrice = getPriceOfAsset({
                        asset: putOptionWithLowerStrike,
                        priceType,
                        sideType: 'BUY'
                });

                if(buyingPutOptionWithLowerStrikePrice===0) return putOptionWithLowerStrike


                


                const totalCostWithSign = totalCostCalculator({
                    buyStocks: [option.optionDetails?.stockSymbolDetails],
                    buyOptions: [putOptionWithLowerStrike],
                    sellOptions: [option],
                    priceType
                });
                const totalOffsetGainWithSign = totalSettlementGain([{
                    option,
                    positionSide: "SELL",
                    choosePriceType: "MIN"
                }, ]);
                const minOffsetGainWithSign = totalSettlementGain([{
                    option: putOptionWithLowerStrike,
                    positionSide: "BUY"
                }, ]);

                const profit = totalCostWithSign + totalOffsetGainWithSign;
                const minProfit = totalCostWithSign + minOffsetGainWithSign;

                const profitPercent = profit / Math.abs(totalCostWithSign);
                const minProfitPercent = minProfit / Math.abs(totalCostWithSign);
                return strategyObj = {
                    option: {
                        ...option
                    },
                    positions:[option.optionDetails?.stockSymbolDetails, option, putOptionWithLowerStrike],
                    strategyTypeTitle: "COVERED_COLLAR",
                    expectedProfitNotif,
                    minProfitToFilter,
                    expectedProfitPerMonth,
                    isWholeProfitable : minProfit>=0,
                    name: createStrategyName([option.optionDetails?.stockSymbolDetails, option, putOptionWithLowerStrike]),
                    profitPercent: minProfitPercent
                }

            }
            )

            return {
                ...option,
                allPossibleStrategies
            }

        }
        );

        enrichedList = enrichedList.concat(_enrichedList)

    }

    return {
        enrichedList,
        allStrategiesSorted: getAllPossibleStrategiesSorted(enrichedList),
        strategyName: "COVERED_COLLAR",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceInPercent,
        maxStockPriceDistanceInPercent,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "COVERED_COLLAR",
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceInPercent,
            maxStockPriceDistanceInPercent,
            minVol
        })
    }

}

const calcBEPSStrategies = (list, {priceType, expectedProfitPerMonth, 
    minProfitToFilter,
    settlementGainChoosePriceType="MAX",
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

                if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ط') ) {
                    return option
                }
                const stockPriceLowerStrikeRatio = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;

                if (stockPriceLowerStrikeRatio < minStockPriceToSarBeSar || stockPriceLowerStrikeRatio > maxStockPriceToSarBeSar) {
                    return option
                }

                const optionListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === option.symbol || !_option.symbol.startsWith('ط'))
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




                    const settlementOn = settlementGainChoosePriceType === 'MIN' ? (option.strikePrice < option.optionDetails.stockSymbolDetails.last ? "OPTION" : "STOCK") : settlementGainChoosePriceType === 'MAX' ? (option.strikePrice > option.optionDetails.stockSymbolDetails.last ? "OPTION" : "STOCK") : "OPTION"
                    const offsetPrice = settlementOn === "OPTION" ? option.strikePrice/1.2 : option.optionDetails.stockSymbolDetails.last;




                    const priceThatCauseMaxProfit = Math.min(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) / 1.3;
                    const priceThatCauseMaxLoss = Math.max(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) * 1.3;



                    const maxProfit = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: priceThatCauseMaxProfit });
                    const maxLoss = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: priceThatCauseMaxLoss });


                    const profitLossRatio = maxProfit / (maxProfit - maxLoss);




                    const profitPercent = profitPercentCalculator(
                        {
                            costWithSign: totalCost, 
                            gainWithSign: calcOffsetGainOfPositions({strategyPositions, stockPrice:offsetPrice})
                        }) / 100



                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, _option],
                        strategyTypeTitle: "BEPS",
                        strategyPositions,
                        currentStockPrice: option.optionDetails?.stockSymbolDetails?.last,
                        totalCost,
                        minProfitToFilter,
                        expectedProfitNotif,
                        expectedProfitPerMonth,
                        isWholeProfitable: !breakeven,
                        stockPriceToSarBeSarPercent,
                        profitLossRatio,
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
        minStockPriceToSarBeSar,
        maxStockPriceToSarBeSar,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BEPS",
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceToSarBeSar,
            maxStockPriceToSarBeSar,
            minVol
        })
    }

}

const calcBECSStrategies = (list, {priceType, expectedProfitPerMonth, settlementGainChoosePriceType="MAX", 
    minProfitToFilter,
    strategySubName, BECSSOptionListIgnorer=generalConfig.BECSSOptionListIgnorer, 
    filteredList,
            optionsGroupedByStock,
    min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, 
    minStockPriceToSarBeSar=-Infinity,  maxStockPriceToSarBeSar=Infinity, 
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

   

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (BECSSOptionListIgnorer({
                    option,
                    minVol
                }))
                    return option


              

                const optionListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === option.symbol || !_option.symbol.startsWith('ض'))
                        return false
                    if (_option.optionDetails?.strikePrice < option.optionDetails?.strikePrice)
                        return false
                   
                    return true

                }
                );

                let allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (_allPossibleStrategies, _option) => {


                    const diffOfBECS_Strikes = _option.optionDetails?.strikePrice - option.optionDetails?.strikePrice;

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
                            getRequiredMargin: () => diffOfBECS_Strikes
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


                    let stockPriceToSarBeSarPercent;
                    if (breakeven) {

                        stockPriceToSarBeSarPercent = (breakeven / option.optionDetails.stockSymbolDetails.last) - 1;

                        if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSar || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSar) {
                            return _allPossibleStrategies
                        }
                    } else {

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


                     const priceThatCauseMaxProfit = Math.min(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) / 1.3;
                    const priceThatCauseMaxLoss = Math.max(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) * 1.3;



                    const maxProfit = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: priceThatCauseMaxProfit });
                    const maxLoss = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: priceThatCauseMaxLoss });


                    const profitLossRatio = maxProfit / (maxProfit - maxLoss);





                     const profitPercent = profitPercentCalculator(
                        {
                            costWithSign:totalCost, 
                            gainWithSign: calcOffsetGainOfPositions({strategyPositions, stockPrice:offsetPrice})
                        }) / 100


                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, _option],
                        minProfitToFilter,
                        strategyTypeTitle: "BECS",
                        strategyPositions,
                        currentStockPrice: option.optionDetails?.stockSymbolDetails?.last,
                        totalCost,
                        expectedProfitNotif,
                        expectedProfitPerMonth,
                        stockPriceToSarBeSarPercent,
                        profitLossRatio,
                        isWholeProfitable: !breakeven,
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
        strategyName: "BECS",
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
            strategyName: "BECS",
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
















const createAndCalcBUS_BES_Strategy = ({ buyingCall, sellingCall, buyingPut, sellingPut ,priceType,
    minStockPriceToSarBeSar,maxStockPriceToSarBeSar,
    priceThatCauseMaxProfitFn,priceThatCauseMaxLossFn}) => {




    const diffOfPuts_Strikes = sellingPut.optionDetails?.strikePrice - buyingPut.optionDetails?.strikePrice;
    const diffOfCalls_Strikes = buyingCall.optionDetails?.strikePrice - sellingCall.optionDetails?.strikePrice;
    const isBUCS = diffOfCalls_Strikes<0;

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
    const priceThatCauseMaxLoss = priceThatCauseMaxLossFn(strategyPositions);
    const maxProfit = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: priceThatCauseMaxProfit });
    const maxLoss = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: priceThatCauseMaxLoss });


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
        strategyPositions,
        positions: isBUCS ? [ buyingCall, sellingCall,buyingPut, sellingPut]:[buyingPut, sellingPut,buyingCall, sellingCall],
        isWholeProfitable: !breakeven,
        stockPriceToSarBeSarPercent,
        
        maxProfit,
        maxLoss,
        name: createStrategyName(isBUCS ? [ buyingCall, sellingCall,buyingPut, sellingPut]:[buyingPut, sellingPut,buyingCall, sellingCall]),
        profitPercent
    }

    return strategyObj

}



const calcBUS_With_BUCS_BEPSStrategies = (list, {priceType, expectedProfitPerMonth, 
    minProfitToFilter,
    settlementGainChoosePriceType="MIN", strategySubName,  
    filteredList,
            optionsGroupedByStock,
    min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, 
    minStockPriceToSarBeSar=-Infinity, maxStockPriceToSarBeSar=Infinity, 
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {


   
    

    

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(buyingCall => {

                if (!buyingCall.isCall )
                        return buyingCall


                const buyingCallPrice = getPriceOfAsset({
                        asset: buyingCall,
                        priceType,
                        sideType: 'BUY'
                });

                if(buyingCallPrice===0) return buyingCall


                const eligibleSellingCalls =   optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingCall.symbol || !_option.isCall )
                        return false
                    if (_option.optionDetails?.strikePrice <= buyingCall.optionDetails?.strikePrice)
                        return false

                    if(!_option.optionDetails.stockSymbolDetails) return false

                    return true
                }
                );

                
                

                
              

                let allPossibleStrategies = eligibleSellingCalls.reduce( (_allPossibleStrategies, sellingCall) => {


                    const sellingCallPrice = getPriceOfAsset({
                        asset: sellingCall,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(sellingCallPrice===0) return _allPossibleStrategies

                    const sellingPutWithSameStrikeOfBuyingCall = optionListOfSameDate.find(_option=> _option.isPut &&  ( _option.optionDetails?.strikePrice === buyingCall.optionDetails?.strikePrice));


                    if(!sellingPutWithSameStrikeOfBuyingCall) return _allPossibleStrategies


                    const sellingPutWithSameStrikeOfBuyingCallPrice = getPriceOfAsset({
                        asset: sellingPutWithSameStrikeOfBuyingCall,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(sellingPutWithSameStrikeOfBuyingCallPrice===0) return _allPossibleStrategies


                    const higherStrikePutsLowerThanSellingCall = optionListOfSameDate.filter(_option => {
                        if ( !_option.isPut)
                            return false
                        if (_option.optionDetails?.strikePrice <= sellingPutWithSameStrikeOfBuyingCall.optionDetails?.strikePrice)
                            return false

                         if (_option.optionDetails?.strikePrice >= sellingCall.optionDetails?.strikePrice)
                            return false

                        if (!_option.optionDetails.stockSymbolDetails) return false

                        return true
                    }
                    );
                   

                    const allPossibleStrategies1 = higherStrikePutsLowerThanSellingCall.reduce((_allPossibleStrategies, buyingPut) => {


                        const buyingPutPrice = getPriceOfAsset({
                            asset: buyingPut,
                            priceType,
                            sideType: 'BUY'
                        });

                        if(buyingPutPrice===0) return _allPossibleStrategies

                        const strategyObj = createAndCalcBUS_BES_Strategy({
                            buyingCall,
                            sellingCall,
                            buyingPut,
                            sellingPut:sellingPutWithSameStrikeOfBuyingCall,
                            priceThatCauseMaxProfitFn:(strategyPositions)=>Math.max(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) * 1.2,
                            priceThatCauseMaxLossFn:(strategyPositions)=>Math.min(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) / 1.2,
                            priceType,
                            minStockPriceToSarBeSar,maxStockPriceToSarBeSar
                        });

                        if (!strategyObj || Number.isNaN(strategyObj.profitPercent))
                            return _allPossibleStrategies


                        return _allPossibleStrategies.concat([{
                            ...strategyObj,
                            optionListOfSameDate,
                            strategyTypeTitle: "BUS_With_BUCS_BEPS",
                            expectedProfitNotif,
                            minProfitToFilter,
                            expectedProfitPerMonth,
                        }])

                    },[]);



                    const buyingPutWithSameStrikeOfSellingCall = optionListOfSameDate.find(_option=> _option.isPut &&  ( _option.optionDetails?.strikePrice === sellingCall.optionDetails?.strikePrice));


                    if(!buyingPutWithSameStrikeOfSellingCall) return _allPossibleStrategies


                    const buyingPutWithSameStrikeOfSellingCallPrice = getPriceOfAsset({
                        asset: buyingPutWithSameStrikeOfSellingCall,
                        priceType,
                        sideType: 'BUY'
                    });

                    if(buyingPutWithSameStrikeOfSellingCallPrice===0) return _allPossibleStrategies


                    const lowerPutsHigherThanBuyingCall = optionListOfSameDate.filter(_option => {
                        if ( !_option.isPut)
                            return false
                        if (_option.optionDetails?.strikePrice >= buyingPutWithSameStrikeOfSellingCall.optionDetails?.strikePrice)
                            return false

                         if (_option.optionDetails?.strikePrice <= buyingCall.optionDetails?.strikePrice)
                            return false

                        if (!_option.optionDetails.stockSymbolDetails) return false

                        return true
                    }
                    );

                     const allPossibleStrategies2 = lowerPutsHigherThanBuyingCall.reduce((_allPossibleStrategies, sellingPut) => {


                        const sellingPutPrice = getPriceOfAsset({
                            asset: sellingPut,
                            priceType,
                            sideType: 'SELL'
                        });

                        if(sellingPutPrice===0) return _allPossibleStrategies

                        const strategyObj = createAndCalcBUS_BES_Strategy({
                            buyingCall,
                            sellingCall,
                            buyingPut:buyingPutWithSameStrikeOfSellingCall,
                            sellingPut,
                            priceThatCauseMaxProfitFn:(strategyPositions)=>Math.max(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) * 1.2,
                            priceThatCauseMaxLossFn:(strategyPositions)=>Math.min(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) / 1.2,
                            priceType,
                            minStockPriceToSarBeSar,maxStockPriceToSarBeSar
                        });

                        if (!strategyObj || Number.isNaN(strategyObj.profitPercent))
                            return _allPossibleStrategies

                        return _allPossibleStrategies.concat([{
                            ...strategyObj,
                            optionListOfSameDate,
                            strategyTypeTitle: "BUS_With_BUCS_BEPS",
                            expectedProfitNotif,
                            minProfitToFilter,
                            expectedProfitPerMonth,
                        }])

                    },[]);

                    

                   

                    

                    return _allPossibleStrategies.concat(allPossibleStrategies1).concat(allPossibleStrategies2)

                }
                , []);

                return {
                    ...buyingCall,
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
        strategyName: "BUS_With_BUCS_BEPS",
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
            strategyName: "BUS_With_BUCS_BEPS",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceToSarBeSar !== 'undefined' && minStockPriceToSarBeSar !== null && minStockPriceToSarBeSar !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceToSarBeSar) * 100).toFixed(0)}%`
            }, typeof maxStockPriceToSarBeSar !== 'undefined' && maxStockPriceToSarBeSar !== null && maxStockPriceToSarBeSar !== Infinity && {
                label: "maxToSar",
                value: `${((maxStockPriceToSarBeSar) * 100).toFixed(0)}%`
            },].filter(Boolean),
            minVol
        })
    }

}




const calcBUCS_BEPS_LongPutStrategies = ({ filteredBusList, priceType, strategySubName,
    minProfitToFilter,
    isProfitEnoughFn,
    min_time_to_settlement = -Infinity, max_time_to_settlement = Infinity,
    minStockPriceToSarBeSar = -Infinity, maxStockPriceToSarBeSar = Infinity,
    minVol = CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif = false, ...restConfig }) => {

    const enrichedList = filteredBusList.map(bus => {


        const { optionListOfSameDate, strategyPositions, maxProfit: maxProfitOfBUS, positions: busPositions } = bus;




        const strikes = strategyPositions.map(strategyPosition => strategyPosition.strikePrice);

        // شمارش تعداد تکرار هر آیتم
        const countMap = strikes.reduce((acc, item) => {
            acc[item] = (acc[item] || 0) + 1;
            return acc;
        }, {});

       // فقط آیتم‌هایی که دقیقاً یک بار ظاهر شده‌اند
        const noRepeatedStrikes = strikes.filter(item => countMap[item] === 1);
        
        const maxStrikePrice = Math.max(...noRepeatedStrikes);

        const higherStrikePuts = optionListOfSameDate.filter(_option => {
            if (!_option.isPut)
                return false
            if (_option.optionDetails?.strikePrice < maxStrikePrice)
                return false

            if (!_option.optionDetails.stockSymbolDetails) return false

            return true
        }
        );


        const allPossibleStrategies = higherStrikePuts.reduce((_allPossibleStrategies, buyingPut) => {
            const buyingPutPrice = getPriceOfAsset({
                asset: buyingPut,
                priceType,
                sideType: 'BUY'
            });

            if (buyingPutPrice === 0) return _allPossibleStrategies

            const quantityFactorOfBuyingPut = Math.abs(maxProfitOfBUS / buyingPutPrice);

            const strategyPositionsOfBUCS_BEPS_LongPut = [
                ...strategyPositions,
                {
                    ...buyingPut,
                    isBuy: true,
                    getQuantity: () => 1 * quantityFactorOfBuyingPut / 1.3,
                    getRequiredMargin() { }
                },
            ]


            const totalCost = totalCostCalculatorCommon({
                strategyPositions:strategyPositionsOfBUCS_BEPS_LongPut,
                getPrice: (strategyPosition) => getPriceOfAsset({
                    asset: strategyPosition,
                    priceType,
                    sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                })
            });

            const breakevenList = findBreakevenList({
                positions: strategyPositionsOfBUCS_BEPS_LongPut,
                getPrice: (strategyPosition) => getPriceOfAsset({
                    asset: strategyPosition,
                    priceType,
                    sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                })
            });

            const breakeven = breakevenList.length ? Math.max(...breakevenList) : null;

            const priceThatCauseMinProfit = Math.max(...strategyPositionsOfBUCS_BEPS_LongPut.map(strategyPosition => strategyPosition.strikePrice)) * 1.2;
            const minProfit = totalCost + calcOffsetGainOfPositions({ strategyPositions:strategyPositionsOfBUCS_BEPS_LongPut, stockPrice: priceThatCauseMinProfit });
            const minProfitPercent = minProfit / Math.abs(totalCost);

            let isFullBodyProfitable, stockPriceToSarBeSarPercent;
            if (!breakeven && quantityFactorOfBuyingPut > 0) {
                isFullBodyProfitable = true;
            } else if (!breakeven) {
                return _allPossibleStrategies
            }
            else {
                if (!buyingPut?.optionDetails?.stockSymbolDetails?.last) return _allPossibleStrategies

                stockPriceToSarBeSarPercent = (breakeven / buyingPut.optionDetails.stockSymbolDetails.last) - 1;
                if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSar || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSar)
                    return _allPossibleStrategies
            }



            return _allPossibleStrategies.concat([{
                option: {
                    ...buyingPut
                },
                positions: [...busPositions, buyingPut],
                strategyTypeTitle: "BUCS_BEPS_LongPut",
                expectedProfitNotif,
                minProfitToFilter,
                stockPriceToSarBeSarPercent,
                isWholeProfitable: isFullBodyProfitable,
                isProfitEnough: isProfitEnoughFn && isProfitEnoughFn(minProfitPercent),
                name: createStrategyName([...busPositions, buyingPut],),
                // profitPercent: isFullBodyProfitable ? 1: -stockPriceToSarBeSarPercent 
                profitPercent: minProfitPercent
            }])




        }, []);

        return {
            ...strategyPositions[0],
            allPossibleStrategies
        }


    })

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "BUCS_BEPS_LongPut",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceToSarBeSar,
        maxStockPriceToSarBeSar,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BUCS_BEPS_LongPut",
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


const calcBESRatio_BY_BUS_BES_Strategies = ({ filteredBesList, priceType, strategySubName,
    minProfitToFilter,
    isProfitEnoughFn,
    min_time_to_settlement = -Infinity, max_time_to_settlement = Infinity,
    minStockPriceToSarBeSar = -Infinity, maxStockPriceToSarBeSar = Infinity,
    minVol = CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif = false, ...restConfig }) => {

    const enrichedList = filteredBesList.map(bes => {


        const { optionListOfSameDate, strategyPositions, maxLoss: maxLossOfBES, positions: besPositions } = bes;

        
        const strikes = strategyPositions.map(strategyPosition => strategyPosition.strikePrice);

        // شمارش تعداد تکرار هر آیتم
        const countMap = strikes.reduce((acc, item) => {
            acc[item] = (acc[item] || 0) + 1;
            return acc;
        }, {});

       // فقط آیتم‌هایی که دقیقاً یک بار ظاهر شده‌اند
        const noRepeatedStrikes = strikes.filter(item => countMap[item] === 1);
        const maxStrikePrice = Math.max(...noRepeatedStrikes);
        const maxStrikeOption = strategyPositions.find(sp=>sp.strikePrice===maxStrikePrice);


        

        








        const lowerStrikePuts = optionListOfSameDate.filter(_option => {
            if (!_option.isPut)
                return false
            if (_option.optionDetails?.strikePrice > maxStrikePrice)
                return false
            if (_option.symbol ===maxStrikeOption.symbol && maxStrikeOption.isPut && maxStrikeOption.isBuy)
                return false

            if (!_option.optionDetails.stockSymbolDetails) return false

            return true
        }
        );


        const allPossibleStrategies = lowerStrikePuts.reduce((_allPossibleStrategies, sellingPut) => {
            const sellingPutPrice = getPriceOfAsset({
                asset: sellingPut,
                priceType,
                sideType: 'SELL'
            });

            if (sellingPutPrice === 0) return _allPossibleStrategies

            const quantityFactorOfsellingPut = Math.abs(maxLossOfBES / sellingPutPrice);


            const strategyPositionsOfBESRatio_BY_BUS_BES = [
                ...strategyPositions,
                {
                    ...sellingPut,
                    isSell: true,
                    getQuantity: () => 1 * quantityFactorOfsellingPut * 1.1,
                    getRequiredMargin: () => {
                        return (calculateOptionMargin({
                            priceSpot: sellingPut.optionDetails.stockSymbolDetails.last,
                            strikePrice: sellingPut.optionDetails.strikePrice,
                            contractSize: 1000,
                            optionPremium: sellingPut.last,
                            optionType: sellingPut.isCall ? "call" : "put"
                        })?.required || 0) / 1000;
                    }
                },
            ]


            const totalCost = totalCostCalculatorCommon({
                strategyPositions:strategyPositionsOfBESRatio_BY_BUS_BES,
                getPrice: (strategyPosition) => getPriceOfAsset({
                    asset: strategyPosition,
                    priceType,
                    sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                })
            });

            const breakevenList = findBreakevenList({
                positions: strategyPositionsOfBESRatio_BY_BUS_BES,
                getPrice: (strategyPosition) => getPriceOfAsset({
                    asset: strategyPosition,
                    priceType,
                    sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                })
            });

            const breakeven = breakevenList.length ? Math.max(...breakevenList) : null;

            const priceThatCauseMinProfit = Math.max(...strategyPositionsOfBESRatio_BY_BUS_BES.map(strategyPosition => strategyPosition.strikePrice)) * 1.2;
            const minProfit = totalCost + calcOffsetGainOfPositions({ strategyPositions:strategyPositionsOfBESRatio_BY_BUS_BES, stockPrice: priceThatCauseMinProfit });
            const minProfitPercent = minProfit / Math.abs(totalCost);

            let isFullBodyProfitable, stockPriceToSarBeSarPercent;
            if (!breakeven && quantityFactorOfsellingPut > 0) {
                isFullBodyProfitable = true;
            } else if (!breakeven) {
                return _allPossibleStrategies
            }
            else {
                if (!sellingPut?.optionDetails?.stockSymbolDetails?.last) return _allPossibleStrategies

                stockPriceToSarBeSarPercent = (breakeven / sellingPut.optionDetails.stockSymbolDetails.last) - 1;
                if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSar || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSar)
                    return _allPossibleStrategies
            }



            return _allPossibleStrategies.concat([{
                option: {
                    ...sellingPut
                },
                positions: [...besPositions, sellingPut],
                strategyTypeTitle: "BESRatio_BY_BUS_BES",
                expectedProfitNotif,
                minProfitToFilter,
                stockPriceToSarBeSarPercent,
                isWholeProfitable: isFullBodyProfitable,
                isProfitEnough: isProfitEnoughFn && isProfitEnoughFn(minProfitPercent),
                name: createStrategyName([...besPositions, sellingPut],),
                // profitPercent: isFullBodyProfitable ? 1: -stockPriceToSarBeSarPercent 
                profitPercent: minProfitPercent
            }])




        }, []);

        return {
            ...strategyPositions[0],
            allPossibleStrategies
        }


    })

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "BESRatio_BY_BUS_BES",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceToSarBeSar,
        maxStockPriceToSarBeSar,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BESRatio_BY_BUS_BES",
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











const calcBUS_With_BUPS_BECSStrategies = (list, {priceType, expectedProfitPerMonth, 
    minProfitToFilter,
    settlementGainChoosePriceType="MIN", strategySubName,
    filteredList,
            optionsGroupedByStock,  
    min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, 
    minStockPriceToSarBeSar=-Infinity, maxStockPriceToSarBeSar=Infinity, 
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {


   

    

   

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(buyingPut => {

                if (!buyingPut.isPut )
                        return buyingPut


                const buyingPutPrice = getPriceOfAsset({
                        asset: buyingPut,
                        priceType,
                        sideType: 'BUY'
                });

                if(buyingPutPrice===0) return buyingPut


                const eligibleSellingPuts =   optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingPut.symbol || !_option.isPut )
                        return false
                    if (_option.optionDetails?.strikePrice <= buyingPut.optionDetails?.strikePrice)
                        return false

                    if(!_option.optionDetails.stockSymbolDetails) return false

                    return true
                }
                );

                
                

                
              

                let allPossibleStrategies = eligibleSellingPuts.reduce( (_allPossibleStrategies, sellingPut) => {


                    const sellingPutPrice = getPriceOfAsset({
                        asset: sellingPut,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(sellingPutPrice===0) return _allPossibleStrategies

                    const sellingCallWithSameStrikeOfBuyingPut = optionListOfSameDate.find(_option=> _option.isCall &&  ( _option.optionDetails?.strikePrice === buyingPut.optionDetails?.strikePrice));


                    if(!sellingCallWithSameStrikeOfBuyingPut) return _allPossibleStrategies


                    const sellingCallWithSameStrikeOfBuyingPutPrice = getPriceOfAsset({
                        asset: sellingCallWithSameStrikeOfBuyingPut,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(sellingCallWithSameStrikeOfBuyingPutPrice===0) return _allPossibleStrategies


                    const higherStrikeCallsLowerThanSellingPut = optionListOfSameDate.filter(_option => {
                        if ( !_option.isCall)
                            return false
                        if (_option.optionDetails?.strikePrice <= sellingCallWithSameStrikeOfBuyingPut.optionDetails?.strikePrice)
                            return false

                         if (_option.optionDetails?.strikePrice >= sellingPut.optionDetails?.strikePrice)
                            return false

                        if (!_option.optionDetails.stockSymbolDetails) return false

                        return true
                    }
                    );
                   

                    const allPossibleStrategies1 = higherStrikeCallsLowerThanSellingPut.reduce((_allPossibleStrategies, buyingCall) => {


                        const buyingCallPrice = getPriceOfAsset({
                            asset: buyingCall,
                            priceType,
                            sideType: 'BUY'
                        });

                        if(buyingCallPrice===0) return _allPossibleStrategies

                        const strategyObj = createAndCalcBUS_BES_Strategy({
                            buyingPut,
                            sellingPut,
                            buyingCall,
                            sellingCall:sellingCallWithSameStrikeOfBuyingPut,
                            priceThatCauseMaxProfitFn:(strategyPositions)=>Math.max(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) * 1.2,
                            priceThatCauseMaxLossFn:(strategyPositions)=>Math.min(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) / 1.2,
                            priceType,
                            minStockPriceToSarBeSar,maxStockPriceToSarBeSar
                        });

                        if (!strategyObj || Number.isNaN(strategyObj.profitPercent))
                            return _allPossibleStrategies

                        return _allPossibleStrategies.concat([{
                            ...strategyObj,
                            strategyTypeTitle: "BUS_With_BUPS_BECS",
                            expectedProfitNotif,
                            minProfitToFilter,
                            expectedProfitPerMonth,
                            optionListOfSameDate
                        }])

                    },[]);



                    const buyingCallWithSameStrikeOfSellingPut = optionListOfSameDate.find(_option=> _option.isCall &&  ( _option.optionDetails?.strikePrice === sellingPut.optionDetails?.strikePrice));


                    if(!buyingCallWithSameStrikeOfSellingPut) return _allPossibleStrategies


                    const buyingCallWithSameStrikeOfSellingPutPrice = getPriceOfAsset({
                        asset: buyingCallWithSameStrikeOfSellingPut,
                        priceType,
                        sideType: 'BUY'
                    });

                    if(buyingCallWithSameStrikeOfSellingPutPrice===0) return _allPossibleStrategies


                    const lowerCallsHigherThanBuyingPut = optionListOfSameDate.filter(_option => {
                        if ( !_option.isCall)
                            return false
                        if (_option.optionDetails?.strikePrice >= buyingCallWithSameStrikeOfSellingPut.optionDetails?.strikePrice)
                            return false

                         if (_option.optionDetails?.strikePrice <= buyingPut.optionDetails?.strikePrice)
                            return false

                        if (!_option.optionDetails.stockSymbolDetails) return false

                        return true
                    }
                    );

                     const allPossibleStrategies2 = lowerCallsHigherThanBuyingPut.reduce((_allPossibleStrategies, sellingCall) => {


                        const sellingCallPrice = getPriceOfAsset({
                            asset: sellingCall,
                            priceType,
                            sideType: 'SELL'
                        });

                        if(sellingCallPrice===0) return _allPossibleStrategies

                        const strategyObj = createAndCalcBUS_BES_Strategy({
                            buyingPut,
                            sellingPut,
                            buyingCall:buyingCallWithSameStrikeOfSellingPut,
                            sellingCall,
                            priceThatCauseMaxProfitFn:(strategyPositions)=>Math.max(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) * 1.2,
                            priceThatCauseMaxLossFn:(strategyPositions)=>Math.min(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) / 1.2,
                            priceType,
                            minStockPriceToSarBeSar,maxStockPriceToSarBeSar                        });

                        if (!strategyObj || Number.isNaN(strategyObj.profitPercent))
                            return _allPossibleStrategies

                        return _allPossibleStrategies.concat([{
                            ...strategyObj,
                            strategyTypeTitle: "BUS_With_BUPS_BECS",
                            expectedProfitNotif,
                            minProfitToFilter,
                            expectedProfitPerMonth,
                            optionListOfSameDate
                        }])

                    },[]);

                    

                   

                    

                    return _allPossibleStrategies.concat(allPossibleStrategies1).concat(allPossibleStrategies2)

                }
                , []);

                return {
                    ...buyingPut,
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
        strategyName: "BUS_With_BUPS_BECS",
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
            strategyName: "BUS_With_BUPS_BECS",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceToSarBeSar !== 'undefined' && minStockPriceToSarBeSar !== null && minStockPriceToSarBeSar !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceToSarBeSar) * 100).toFixed(0)}%`
            }, typeof maxStockPriceToSarBeSar !== 'undefined' && maxStockPriceToSarBeSar !== null && maxStockPriceToSarBeSar !== Infinity && {
                label: "maxToSar",
                value: `${((maxStockPriceToSarBeSar) * 100).toFixed(0)}%`
            },].filter(Boolean),
            minVol
        })
    }

}



const calcBES_With_BUCS_BEPSStrategies = (list, {priceType, expectedProfitPerMonth, 
    minProfitToFilter,
    settlementGainChoosePriceType="MIN", strategySubName,  
    filteredList,
            optionsGroupedByStock,
    min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, 
    minStockPriceToSarBeSar=-Infinity, maxStockPriceToSarBeSar=Infinity, 
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {


   
    


    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(buyingCall => {

                if (!buyingCall.isCall )
                        return buyingCall


                const buyingCallPrice = getPriceOfAsset({
                        asset: buyingCall,
                        priceType,
                        sideType: 'BUY'
                });

                if(buyingCallPrice===0) return buyingCall


                const eligibleSellingCalls =   optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingCall.symbol || !_option.isCall )
                        return false
                    if (_option.optionDetails?.strikePrice <= buyingCall.optionDetails?.strikePrice)
                        return false

                    if(!_option.optionDetails.stockSymbolDetails) return false

                    return true
                }
                );

                
                

                
              

                let allPossibleStrategies = eligibleSellingCalls.reduce( (_allPossibleStrategies, sellingCall) => {


                    const sellingCallPrice = getPriceOfAsset({
                        asset: sellingCall,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(sellingCallPrice===0) return _allPossibleStrategies

                    const sellingPutWithSameStrikeOfBuyingCall = optionListOfSameDate.find(_option=> _option.isPut &&  ( _option.optionDetails?.strikePrice === buyingCall.optionDetails?.strikePrice));


                    if(!sellingPutWithSameStrikeOfBuyingCall) return _allPossibleStrategies


                    const sellingPutWithSameStrikeOfBuyingCallPrice = getPriceOfAsset({
                        asset: sellingPutWithSameStrikeOfBuyingCall,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(sellingPutWithSameStrikeOfBuyingCallPrice===0) return _allPossibleStrategies


                    const higherStrikePutsHigherThanSellingCall = optionListOfSameDate.filter(_option => {
                        if ( !_option.isPut)
                            return false
                        if (_option.optionDetails?.strikePrice <= sellingPutWithSameStrikeOfBuyingCall.optionDetails?.strikePrice)
                            return false

                         if (_option.optionDetails?.strikePrice <= sellingCall.optionDetails?.strikePrice)
                            return false

                        if (!_option.optionDetails.stockSymbolDetails) return false

                        return true
                    }
                    );
                   

                    const allPossibleStrategies1 = higherStrikePutsHigherThanSellingCall.reduce((_allPossibleStrategies, buyingPut) => {


                        const buyingPutPrice = getPriceOfAsset({
                            asset: buyingPut,
                            priceType,
                            sideType: 'BUY'
                        });

                        if(buyingPutPrice===0) return _allPossibleStrategies

                        const strategyObj = createAndCalcBUS_BES_Strategy({
                            buyingCall,
                            sellingCall,
                            buyingPut,
                            sellingPut:sellingPutWithSameStrikeOfBuyingCall,
                            priceThatCauseMaxProfitFn:(strategyPositions)=>Math.min(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) / 1.2,
                            priceThatCauseMaxLossFn:(strategyPositions)=>Math.max(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) * 1.2,
                            priceType,
                            minStockPriceToSarBeSar,maxStockPriceToSarBeSar
                        });

                        if (!strategyObj || Number.isNaN(strategyObj.profitPercent))
                            return _allPossibleStrategies


                        return _allPossibleStrategies.concat([{
                            ...strategyObj,
                            strategyTypeTitle: "BES_With_BUCS_BEPS",
                            expectedProfitNotif,
                            minProfitToFilter,
                            expectedProfitPerMonth,
                            optionListOfSameDate,
                        }])

                    },[]);



                    const buyingPutWithSameStrikeOfSellingCall = optionListOfSameDate.find(_option=> _option.isPut &&  ( _option.optionDetails?.strikePrice === sellingCall.optionDetails?.strikePrice));


                    if(!buyingPutWithSameStrikeOfSellingCall) return _allPossibleStrategies


                    const buyingPutWithSameStrikeOfSellingCallPrice = getPriceOfAsset({
                        asset: buyingPutWithSameStrikeOfSellingCall,
                        priceType,
                        sideType: 'BUY'
                    });

                    if(buyingPutWithSameStrikeOfSellingCallPrice===0) return _allPossibleStrategies


                    const lowerPutsLowerThanBuyingCall = optionListOfSameDate.filter(_option => {
                        if ( !_option.isPut)
                            return false
                        if (_option.optionDetails?.strikePrice >= buyingPutWithSameStrikeOfSellingCall.optionDetails?.strikePrice)
                            return false

                         if (_option.optionDetails?.strikePrice >= buyingCall.optionDetails?.strikePrice)
                            return false

                        if (!_option.optionDetails.stockSymbolDetails) return false

                        return true
                    }
                    );

                     const allPossibleStrategies2 = lowerPutsLowerThanBuyingCall.reduce((_allPossibleStrategies, sellingPut) => {


                        const sellingPutPrice = getPriceOfAsset({
                            asset: sellingPut,
                            priceType,
                            sideType: 'SELL'
                        });

                        if(sellingPutPrice===0) return _allPossibleStrategies

                        const strategyObj = createAndCalcBUS_BES_Strategy({
                            buyingCall,
                            sellingCall,
                            buyingPut:buyingPutWithSameStrikeOfSellingCall,
                            sellingPut,
                            priceThatCauseMaxProfitFn:(strategyPositions)=>Math.min(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) / 1.2,
                            priceThatCauseMaxLossFn:(strategyPositions)=>Math.max(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) * 1.2,
                            priceType,
                            minStockPriceToSarBeSar,maxStockPriceToSarBeSar
                        });

                        if (!strategyObj || Number.isNaN(strategyObj.profitPercent))
                            return _allPossibleStrategies

                        return _allPossibleStrategies.concat([{
                            ...strategyObj,
                            strategyTypeTitle: "BES_With_BUCS_BEPS",
                            expectedProfitNotif,
                            minProfitToFilter,
                            expectedProfitPerMonth,
                            optionListOfSameDate,
                        }])

                    },[]);

                    

                   

                    

                    return _allPossibleStrategies.concat(allPossibleStrategies1).concat(allPossibleStrategies2)

                }
                , []);

                return {
                    ...buyingCall,
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
        strategyName: "BES_With_BUCS_BEPS",
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
            strategyName: "BES_With_BUCS_BEPS",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceToSarBeSar !== 'undefined' && minStockPriceToSarBeSar !== null && minStockPriceToSarBeSar !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceToSarBeSar) * 100).toFixed(0)}%`
            }, typeof maxStockPriceToSarBeSar !== 'undefined' && maxStockPriceToSarBeSar !== null && maxStockPriceToSarBeSar !== Infinity && {
                label: "maxToSar",
                value: `${((maxStockPriceToSarBeSar) * 100).toFixed(0)}%`
            },].filter(Boolean),
            minVol
        })
    }

}



const calcBES_With_BUPS_BECSStrategies = (list, {priceType, expectedProfitPerMonth, 
    minProfitToFilter,
    settlementGainChoosePriceType="MIN", strategySubName,  
    filteredList,
            optionsGroupedByStock,
    min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, 
    minStockPriceToSarBeSar=-Infinity, maxStockPriceToSarBeSar=Infinity, 
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {



   

    

   

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(buyingPut => {

                if (!buyingPut.isPut )
                        return buyingPut


                const buyingPutPrice = getPriceOfAsset({
                        asset: buyingPut,
                        priceType,
                        sideType: 'BUY'
                });

                if(buyingPutPrice===0) return buyingPut


                const eligibleSellingPuts =   optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingPut.symbol || !_option.isPut )
                        return false
                    if (_option.optionDetails?.strikePrice <= buyingPut.optionDetails?.strikePrice)
                        return false

                    if(!_option.optionDetails.stockSymbolDetails) return false

                    return true
                }
                );

                
                

                
              

                let allPossibleStrategies = eligibleSellingPuts.reduce( (_allPossibleStrategies, sellingPut) => {


                    const sellingPutPrice = getPriceOfAsset({
                        asset: sellingPut,
                        priceType,
                        sideType: 'SELL'
                    });
                   

                    if(sellingPutPrice===0) return _allPossibleStrategies

                    const sellingCallWithSameStrikeOfBuyingPut = optionListOfSameDate.find(_option=> _option.isCall &&  ( _option.optionDetails?.strikePrice === buyingPut.optionDetails?.strikePrice));


                  


                    if(!sellingCallWithSameStrikeOfBuyingPut) return _allPossibleStrategies


                    const sellingCallWithSameStrikeOfBuyingPutPrice = getPriceOfAsset({
                        asset: sellingCallWithSameStrikeOfBuyingPut,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(sellingCallWithSameStrikeOfBuyingPutPrice===0) return _allPossibleStrategies

                    


                    const higherStrikeCallsHigherThanSellingPut = optionListOfSameDate.filter(_option => {
                        if ( !_option.isCall)
                            return false
                        if (_option.optionDetails?.strikePrice <= sellingCallWithSameStrikeOfBuyingPut.optionDetails?.strikePrice)
                            return false

                         if (_option.optionDetails?.strikePrice <= sellingPut.optionDetails?.strikePrice)
                            return false

                        if (!_option.optionDetails.stockSymbolDetails) return false

                        return true
                    }
                    );
                   

                    const allPossibleStrategies1 = higherStrikeCallsHigherThanSellingPut.reduce((_allPossibleStrategies, buyingCall) => {


                        const buyingCallPrice = getPriceOfAsset({
                            asset: buyingCall,
                            priceType,
                            sideType: 'BUY'
                        });

                        if(buyingCallPrice===0) return _allPossibleStrategies
                       

                        const strategyObj = createAndCalcBUS_BES_Strategy({
                            buyingPut,
                            sellingPut,
                            buyingCall,
                            sellingCall:sellingCallWithSameStrikeOfBuyingPut,
                            priceThatCauseMaxProfitFn:(strategyPositions)=>Math.min(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) / 1.2,
                            priceThatCauseMaxLossFn:(strategyPositions)=>Math.max(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) * 1.2,
                            priceType,
                            minStockPriceToSarBeSar,maxStockPriceToSarBeSar
                        });

                        if (!strategyObj || Number.isNaN(strategyObj.profitPercent))
                            return _allPossibleStrategies

                        return _allPossibleStrategies.concat([{
                            ...strategyObj,
                            strategyTypeTitle: "BES_With_BUPS_BECS",
                            expectedProfitNotif,
                            minProfitToFilter,
                            expectedProfitPerMonth,
                            optionListOfSameDate,
                        }])

                    },[]);



                    const buyingCallWithSameStrikeOfSellingPut = optionListOfSameDate.find(_option=> _option.isCall &&  ( _option.optionDetails?.strikePrice === sellingPut.optionDetails?.strikePrice));


                    if(!buyingCallWithSameStrikeOfSellingPut) return _allPossibleStrategies


                    const buyingCallWithSameStrikeOfSellingPutPrice = getPriceOfAsset({
                        asset: buyingCallWithSameStrikeOfSellingPut,
                        priceType,
                        sideType: 'BUY'
                    });

                    if(buyingCallWithSameStrikeOfSellingPutPrice===0) return _allPossibleStrategies


                    const lowerCallsLowerThanBuyingPut = optionListOfSameDate.filter(_option => {
                        if ( !_option.isCall)
                            return false
                        if (_option.optionDetails?.strikePrice >= buyingCallWithSameStrikeOfSellingPut.optionDetails?.strikePrice)
                            return false

                         if (_option.optionDetails?.strikePrice >= buyingPut.optionDetails?.strikePrice)
                            return false

                        if (!_option.optionDetails.stockSymbolDetails) return false

                        return true
                    }
                    );

                     const allPossibleStrategies2 = lowerCallsLowerThanBuyingPut.reduce((_allPossibleStrategies, sellingCall) => {


                        const sellingCallPrice = getPriceOfAsset({
                            asset: sellingCall,
                            priceType,
                            sideType: 'SELL'
                        });

                        if(sellingCallPrice===0) return _allPossibleStrategies

                        const strategyObj = createAndCalcBUS_BES_Strategy({
                            buyingPut,
                            sellingPut,
                            buyingCall:buyingCallWithSameStrikeOfSellingPut,
                            sellingCall,
                            priceThatCauseMaxProfitFn:(strategyPositions)=>Math.min(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) / 1.2,
                            priceThatCauseMaxLossFn:(strategyPositions)=>Math.max(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) * 1.2,
                            priceType,
                            minStockPriceToSarBeSar,maxStockPriceToSarBeSar                        });

                        if (!strategyObj || Number.isNaN(strategyObj.profitPercent))
                            return _allPossibleStrategies

                        return _allPossibleStrategies.concat([{
                            ...strategyObj,
                            strategyTypeTitle: "BES_With_BUPS_BECS",
                            expectedProfitNotif,
                            minProfitToFilter,
                            expectedProfitPerMonth,
                            optionListOfSameDate,
                        }])

                    },[]);

                    

                   

                    

                    return _allPossibleStrategies.concat(allPossibleStrategies1).concat(allPossibleStrategies2)

                }
                , []);

                return {
                    ...buyingPut,
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
        strategyName: "BES_With_BUPS_BECS",
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
            strategyName: "BES_With_BUPS_BECS",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceToSarBeSar !== 'undefined' && minStockPriceToSarBeSar !== null && minStockPriceToSarBeSar !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceToSarBeSar) * 100).toFixed(0)}%`
            }, typeof maxStockPriceToSarBeSar !== 'undefined' && maxStockPriceToSarBeSar !== null && maxStockPriceToSarBeSar !== Infinity && {
                label: "maxToSar",
                value: `${((maxStockPriceToSarBeSar) * 100).toFixed(0)}%`
            },].filter(Boolean),
            minVol
        })
    }

}




const calcBuyByCallNokoolGainStrategies = (list, {priceType, expectedProfitPerMonth,
    isProfitEnoughFn, 
    minProfitToFilter,
    filteredList,
            optionsGroupedByStock,
    min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, minVol=CONSTS.DEFAULTS.MIN_VOL, 
    expectedProfitNotif=false, ...restConfig}) => {

    

    let enrichedList = []
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (!option.optionDetails?.stockSymbolDetails)
                    return option

                if(!option.optionDetails?.stockSymbolDetails?.close || !option.isCall) return option

                const optionPrice = getPriceOfAsset({
                        asset: option,
                        priceType,
                        sideType: option.isCall ? 'BUY' : 'SELL'
                });

                if(optionPrice===0) return option

                const buyingPriceOfStock = option.optionDetails.strikePrice + optionPrice;

                const currentStockPrice = option.optionDetails.stockSymbolDetails?.close;


                const percentDifference = ((currentStockPrice - buyingPriceOfStock) / buyingPriceOfStock) * 100

                if(percentDifference<-1 ) return option
                
                
                const strategyPositions = [
                    {
                        ...option,
                        isBuy: true,
                        getQuantity: () => 1,
                        getRequiredMargin() { }
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

                
                const someOfNokoolGain = someOfNokoolGainCalculator({nokoolQuantity:1, stockPrice:option.optionDetails.stockSymbolDetails?.close   ,strikePrice:option.optionDetails.strikePrice})


                if( (someOfNokoolGain + totalCost)<0 )
                    return option
                
              
                const profit = totalCost + someOfNokoolGain;
                const profitPercent = profit / Math.abs(totalCost);


               
               


               



                const strategyObj = {
                        // TODO:remove option prop
                        option: {
                            ...option
                        },
                        positions:[option],
                        strategyTypeTitle: "BuyByCallNokoolGain",
                        expectedProfitNotif,
                        minProfitToFilter,
                        expectedProfitPerMonth,
                        name: createStrategyName([option]),
                        isProfitEnough : isProfitEnoughFn && isProfitEnoughFn(option),
                        profitPercent : profitPercent
                    }

                return {
                    ...option,
                    allPossibleStrategies:[strategyObj]
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
        strategyName: "BuyByCallNokoolGain",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BuyByCallNokoolGain",
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minVol
        })
    }

}



const calcBuyStockByPutStrategies = (list, {priceType, expectedProfitPerMonth,
    isProfitEnoughFn, 
    minProfitToFilter,
    filteredList,
            optionsGroupedByStock,
    min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, minVol=CONSTS.DEFAULTS.MIN_VOL, 
    expectedProfitNotif=false, ...restConfig}) => {

   

    let enrichedList = []
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (!option.optionDetails?.stockSymbolDetails)
                    return option

                if(!option.optionDetails?.stockSymbolDetails?.close || !option.isPut) return option

                const optionPrice = getPriceOfAsset({
                        asset: option,
                        priceType,
                        sideType: option.isCall ? 'BUY' : 'SELL'
                });

                if(optionPrice===0) return option

                const strategyPositions = [
                    {
                        ...option,
                        isBuy: false,
                        getQuantity: () => 1,
                        getRequiredMargin: () => {}
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

                const exerciseFee = COMMISSION_FACTOR.OPTION.SETTLEMENT.EXERCISE_FEE;
                const buyStockOption = strategyPositions[0];
                const buyingCostOfStock = -(buyStockOption.strikePrice + (buyStockOption.strikePrice * exerciseFee));

                const currentStockPrice = option.optionDetails?.stockSymbolDetails?.close;
                
                const calculateBuyingPrice = Math.abs(buyingCostOfStock + totalCost);

                const distanceCurrentPrice = (currentStockPrice / calculateBuyingPrice)-1;


                if(distanceCurrentPrice<-0.05 || distanceCurrentPrice>0.05 ) return option


                
                

                const strategyObj = {
                        // TODO:remove option prop
                        option: {
                            ...option
                        },
                        positions:[option],
                        strategyTypeTitle: "BuyStockByPut",
                        expectedProfitNotif,
                        minProfitToFilter,
                        expectedProfitPerMonth,
                        stockPriceToSarBeSarPercent:distanceCurrentPrice,
                        name: createStrategyName([option]),
                        isProfitEnough : isProfitEnoughFn && isProfitEnoughFn(option),
                        profitPercent : distanceCurrentPrice
                    }

                return {
                    ...option,
                    allPossibleStrategies:[strategyObj]
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
        strategyName: "BuyStockByPut",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BuyStockByPut",
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minVol
        })
    }

}


const calcARBITRAGE_PUTStrategies = (list, {priceType, expectedProfitPerMonth, 
    isProfitEnoughFn,
    filteredList,
    optionsGroupedByStock,
    min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement,
    minProfitToFilter, 
    minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, 
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    

    let enrichedList = [];
    for (let[stockSymbol,optionListOfStock] of Object.entries(optionsGroupedByStock)) {

        const _enrichedList = optionListOfStock.map(option => {

            if (!option.optionDetails?.stockSymbolDetails)
                return option


            if (!option.isPut )
                return option


            const optionPrice = getPriceOfAsset({
                asset: option,
                priceType,
                sideType: 'BUY'
            });

            if (optionPrice === 0) return option


            if(!option.optionDetails?.stockSymbolDetails?.bestSell) return option
            

            if(isBuyQueue(option.optionDetails?.stockSymbolDetails)) return option


            const strategyPositions = [
                {
                    ...option.optionDetails?.stockSymbolDetails,
                    isBuy: true,
                    getQuantity: () => baseQuantity,
                    getRequiredMargin() { }
                },
                {
                    ...option,
                    isBuy: true,
                    getQuantity: () => baseQuantity,
                    getRequiredMargin() { }
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




            const settlementGain =  settlementGainCalculator({strategyPositions,stockPrice: option.optionDetails?.stockSymbolDetails?.last})

            const profit = totalCost + settlementGain;
            const profitPercentOfSettlement = profit / Math.abs(totalCost);



            const settlementTimeDiff = option.settlementTimeDiff;

           

            const strategyObj = {
                option: {
                    ...option
                },
                positions:[option.optionDetails?.stockSymbolDetails, option],
                strategyTypeTitle: "ARBITRAGE_PUT",
                expectedProfitNotif,
                expectedProfitPerMonth,
                minProfitToFilter,
                name: createStrategyName([option.optionDetails?.stockSymbolDetails, option]),
                isProfitEnough: isProfitEnoughFn && isProfitEnoughFn(profitPercentOfSettlement,settlementTimeDiff,option),
                profitPercent:profitPercentOfSettlement,
            }

            return {
                ...option,
                allPossibleStrategies: [strategyObj]
            }

        }
        );

        enrichedList = enrichedList.concat(_enrichedList)

    }

    return {
        enrichedList,
        allStrategiesSorted: getAllPossibleStrategiesSorted(enrichedList),
        strategyName: "ARBITRAGE_PUT",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "ARBITRAGE_PUT",
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minVol
        })
    }

}


const calcSellCallNokoolGainStrategies = (list, { priceType, expectedProfitPerMonth,
    minProfitToFilter,
    filteredList,
            optionsGroupedByStock,
    min_time_to_settlement = -Infinity, max_time_to_settlement = Infinity,
    minVol = CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif = false, ...restConfig }) => {

   

    let enrichedList = [];
    for (let [stockSymbol, optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({ optionDetails }) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap(([date, optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (!option.optionDetails?.stockSymbolDetails || !option.isCall) {
                    return option
                }

                if (!isBuyQueue(option.optionDetails?.stockSymbolDetails)) return option


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

                const stockPrice = option.optionDetails.stockSymbolDetails.last;

                const sumOfNokoool = someOfNokoolGainCalculator({ nokoolQuantity: baseQuantity, stockPrice, strikePrice : option.optionDetails?.strikePrice });

                const emalGains = (marginPerQuantity * baseQuantity) - sumOfNokoool;


                const profitPercent = profitPercentCalculator(
                    {
                        costWithSign: totalCost,
                        gainWithSign: emalGains
                    }) / 100



                const strategyObj = {
                    option: {
                        ...option
                    },
                    positions: [option,],
                    strategyTypeTitle: "SellCallNokoolGain",
                    minProfitToFilter,
                    expectedProfitNotif,
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

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "SellCallNokoolGain",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "SellCallNokoolGain",
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minVol
        })
    }

}



const calcBUCS_Long_PutStrategies = (list, {priceType, strategySubName, 
    minProfitToFilter,
    isProfitEnoughFn,
    filteredList,
            optionsGroupedByStock,
    min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, 
    minStockPriceToSarBeSar=-Infinity,maxStockPriceToSarBeSar=Infinity,
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

   

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(buyingCall => {

                if(!buyingCall.optionDetails?.stockSymbolDetails || !buyingCall.isCall  ) return buyingCall


                const buyingCallPrice = getPriceOfAsset({
                    asset: buyingCall,
                    priceType,
                    sideType: 'BUY'
                });
                if(buyingCallPrice===0) return buyingCall

                const optionListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingCall.symbol || !_option.isCall )
                        return false
                    if (_option.optionDetails?.strikePrice <= buyingCall.optionDetails?.strikePrice)
                        return false


                    return true
                    

                }
                );

                let allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (_allPossibleStrategies, sellingCall) => {



                    
                    const sellingCallPrice = getPriceOfAsset({
                        asset: sellingCall,
                        priceType,
                        sideType: 'SELL'
                    });
                    if(sellingCallPrice===0) return _allPossibleStrategies



                    const putListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {
                        if (!_option.isPut)
                            return false
                        if (_option.optionDetails?.strikePrice < sellingCall.optionDetails?.strikePrice)
                            return false

                        return true

                    }
                    );


                    let __allPossibleStrategies = putListWithHigherStrikePrice.reduce( (___allPossibleStrategies, buyingPut) => {


                        const buyingPutPrice = getPriceOfAsset({
                            asset: buyingPut,
                            priceType,
                            sideType: 'BUY'
                        });
                        if(buyingPutPrice===0) return ___allPossibleStrategies


                        const strategyPositionsOfBUCS = [
                            {
                                ...buyingCall,
                                isBuy: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingCall,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                        ]
                        const totalCostOfBUCS = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBUCS,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMaxPofitOfBUCS = Math.max(...strategyPositionsOfBUCS.map(strategyPosition=>strategyPosition.strikePrice))* 1.2;



                        const maxProfitOfBUCS = totalCostOfBUCS + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBUCS, stockPrice:priceThatCauseMaxPofitOfBUCS});



                        const quantityFactorOfBuyingPut = Math.abs(maxProfitOfBUCS/buyingPutPrice);


                        const strategyPositionsOfBUCS_Long_Put = [
                            {
                                ...buyingCall,
                                isBuy: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingCall,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                            {
                                ...buyingPut,
                                isBuy: true,
                                getQuantity: () => 1*quantityFactorOfBuyingPut/1.3,
                                getRequiredMargin() { }
                            },
                        ]


                        const totalCostOfBUCS_Long_Put = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBUCS_Long_Put,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMinProfitOfBUCS_Long_Put = Math.max(...strategyPositionsOfBUCS_Long_Put.map(strategyPosition=>strategyPosition.strikePrice)) * 1.3;
                      

                        const minProfitOfBUCS_Long_Put = totalCostOfBUCS_Long_Put + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBUCS_Long_Put, stockPrice:priceThatCauseMinProfitOfBUCS_Long_Put});

                        const minProfitPercentOfBUCS_Long_Put = minProfitOfBUCS_Long_Put / Math.abs(totalCostOfBUCS_Long_Put);

                        const breakevenList = findBreakevenList({
                            positions:strategyPositionsOfBUCS_Long_Put, 
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const breakeven = breakevenList.length? Math.max(...breakevenList) : null;



                        let isFullBodyProfitable,stockPriceToSarBeSarPercent;
                        if(!breakeven && quantityFactorOfBuyingPut>0){
                            isFullBodyProfitable = true;
                        }else if(!breakeven){
                            return _allPossibleStrategies
                        }
                        else{
                            if(!buyingCall?.optionDetails?.stockSymbolDetails?.last) return _allPossibleStrategies

                            stockPriceToSarBeSarPercent = (breakeven /buyingCall.optionDetails.stockSymbolDetails.last ) - 1;

                        
                            if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSar || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSar)
                                return _allPossibleStrategies
                        }

                        

                        return ___allPossibleStrategies.concat([{
                            option: {
                                ...buyingCall
                            },
                            positions:[buyingCall, sellingCall, buyingPut],
                            strategyTypeTitle: "BUCS_LONG_PUT",
                            strategyPositions: strategyPositionsOfBUCS_Long_Put,
                            currentStockPrice: buyingCall.optionDetails?.stockSymbolDetails?.last,
                            totalCost: totalCostOfBUCS_Long_Put,
                            expectedProfitNotif,
                            minProfitToFilter,
                            stockPriceToSarBeSarPercent,
                            isWholeProfitable:isFullBodyProfitable,
                            isProfitEnough : isProfitEnoughFn && isProfitEnoughFn(minProfitPercentOfBUCS_Long_Put),
                            name: createStrategyName([buyingCall, sellingCall, buyingPut]),
                            // profitPercent: isFullBodyProfitable ? 1: -stockPriceToSarBeSarPercent 
                            profitPercent: minProfitPercentOfBUCS_Long_Put 
                        }])
                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

                }
                , []);

                return {
                    ...buyingCall,
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
        strategyName: "BUCS_LONG_PUT",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceToSarBeSar,
        maxStockPriceToSarBeSar,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BUCS_LONG_PUT",
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



const calcBECS_Long_CallStrategies = (list, {priceType, strategySubName, 
    minProfitToFilter,
    isProfitEnoughFn,
    filteredList,
            optionsGroupedByStock,
    min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, 
    minStockPriceToSarBeSar=-Infinity,maxStockPriceToSarBeSar=Infinity,
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

   

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(buyingCall => {

                if(!buyingCall.optionDetails?.stockSymbolDetails || !buyingCall.isCall  ) return buyingCall


                const buyingCallPrice = getPriceOfAsset({
                    asset: buyingCall,
                    priceType,
                    sideType: 'BUY'
                });
                if(buyingCallPrice===0) return buyingCall

                const optionListWithLowerStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingCall.symbol || !_option.isCall )
                        return false
                    if (_option.optionDetails?.strikePrice >= buyingCall.optionDetails?.strikePrice)
                        return false


                    return true
                    

                }
                );

                let allPossibleStrategies = optionListWithLowerStrikePrice.reduce( (_allPossibleStrategies, sellingCall) => {



                    
                    const sellingCallPrice = getPriceOfAsset({
                        asset: sellingCall,
                        priceType,
                        sideType: 'SELL'
                    });
                    if(sellingCallPrice===0) return _allPossibleStrategies



                    const callListWithLowerStrikePrice = optionListOfSameDate.filter(_option => {
                        if (!_option.isCall)
                            return false
                        if (_option.optionDetails?.strikePrice >= sellingCall.optionDetails?.strikePrice)
                            return false

                        return true

                    }
                    );


                    let __allPossibleStrategies = callListWithLowerStrikePrice.reduce( (___allPossibleStrategies, anotherBuyingCall) => {


                        const anotherBuyingCallPrice = getPriceOfAsset({
                            asset: anotherBuyingCall,
                            priceType,
                            sideType: 'BUY'
                        });
                        if(anotherBuyingCallPrice===0) return ___allPossibleStrategies


                        const diffOfBECS_Strikes = buyingCall.optionDetails?.strikePrice - sellingCall.optionDetails?.strikePrice;


                        const strategyPositionsOfBECS = [
                            {
                                ...buyingCall,
                                isBuy: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingCall,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin: () => { }
                            },
                        ]
                        const totalCostOfBECS = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBECS,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMaxPofitOfBECS = Math.min(...strategyPositionsOfBECS.map(strategyPosition=>strategyPosition.strikePrice))/ 1.2;



                        const maxProfitOfBECS = totalCostOfBECS + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBECS, stockPrice:priceThatCauseMaxPofitOfBECS});



                        const quantityFactorOfBuyingCall = Math.abs(maxProfitOfBECS/anotherBuyingCallPrice);


                        const strategyPositionsOfBECS_Long_Call = [
                            {
                                ...buyingCall,
                                isBuy: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingCall,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin: () => diffOfBECS_Strikes
                            },
                            {
                                ...anotherBuyingCall,
                                isBuy: true,
                                getQuantity: () => 1*quantityFactorOfBuyingCall/1.3,
                                getRequiredMargin() { }
                            },
                        ]


                        const totalCostOfBECS_Long_Call = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBECS_Long_Call,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMinProfitOfBECS_Long_Call = Math.min(...strategyPositionsOfBECS_Long_Call.map(strategyPosition=>strategyPosition.strikePrice)) / 1.3;
                      

                        const minProfitOfBECS_Long_Call = totalCostOfBECS_Long_Call + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBECS_Long_Call, stockPrice:priceThatCauseMinProfitOfBECS_Long_Call});

                        const minProfitPercentOfBECS_Long_Call = minProfitOfBECS_Long_Call / Math.abs(totalCostOfBECS_Long_Call);

                        const breakevenList = findBreakevenList({
                            positions:strategyPositionsOfBECS_Long_Call, 
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const breakeven = breakevenList.length? Math.min(...breakevenList) : null;



                        let isFullBodyProfitable,stockPriceToSarBeSarPercent;
                        if(!breakeven && quantityFactorOfBuyingCall>0){
                            isFullBodyProfitable = true;
                        }else if(!breakeven){
                            return _allPossibleStrategies
                        }
                        else{
                            if(!buyingCall?.optionDetails?.stockSymbolDetails?.last) return _allPossibleStrategies

                            stockPriceToSarBeSarPercent = (breakeven /buyingCall.optionDetails.stockSymbolDetails.last ) - 1;

                        
                            if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSar || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSar)
                                return _allPossibleStrategies
                        }

                        

                        return ___allPossibleStrategies.concat([{
                            option: {
                                ...buyingCall
                            },
                            positions:[buyingCall, sellingCall, anotherBuyingCall],
                            strategyTypeTitle: "BECS_LONG_CALL",
                            strategyPositions: strategyPositionsOfBECS_Long_Call,
                            currentStockPrice: buyingCall.optionDetails?.stockSymbolDetails?.last,
                            totalCost: totalCostOfBECS_Long_Call,
                            expectedProfitNotif,
                            minProfitToFilter,
                            stockPriceToSarBeSarPercent,
                            isWholeProfitable:isFullBodyProfitable,
                            isProfitEnough : isProfitEnoughFn && isProfitEnoughFn(minProfitPercentOfBECS_Long_Call),
                            name: createStrategyName([buyingCall, sellingCall, anotherBuyingCall]),
                            // profitPercent: isFullBodyProfitable ? 1: -stockPriceToSarBeSarPercent 
                            profitPercent: minProfitPercentOfBECS_Long_Call 
                        }])
                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

                }
                , []);

                return {
                    ...buyingCall,
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
        strategyName: "BECS_LONG_CALL",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceToSarBeSar,
        maxStockPriceToSarBeSar,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BECS_LONG_CALL",
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



const calcBEPS_Long_CallStrategies = (list, {priceType, strategySubName, 
    minProfitToFilter,
    isProfitEnoughFn,
    filteredList,
            optionsGroupedByStock,
    min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, 
    minStockPriceToSarBeSar=-Infinity,maxStockPriceToSarBeSar=Infinity,
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

   

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(buyingPut => {

                if(!buyingPut.optionDetails?.stockSymbolDetails || !buyingPut.isPut  ) return buyingPut


                const buyingPutPrice = getPriceOfAsset({
                    asset: buyingPut,
                    priceType,
                    sideType: 'BUY'
                });
                if(buyingPutPrice===0) return buyingPut

                const optionListWithLowerStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingPut.symbol || !_option.isPut )
                        return false
                    if (_option.optionDetails?.strikePrice >= buyingPut.optionDetails?.strikePrice)
                        return false


                    return true
                    

                }
                );

                let allPossibleStrategies = optionListWithLowerStrikePrice.reduce( (_allPossibleStrategies, sellingPut) => {



                    
                    const sellingPutPrice = getPriceOfAsset({
                        asset: sellingPut,
                        priceType,
                        sideType: 'SELL'
                    });
                    if(sellingPutPrice===0) return _allPossibleStrategies



                    const callListWithLowerStrikePrice = optionListOfSameDate.filter(_option => {
                        if (!_option.isCall)
                            return false
                        if (_option.optionDetails?.strikePrice > buyingPut.optionDetails?.strikePrice)
                            return false

                        return true

                    }
                    );


                    let __allPossibleStrategies = callListWithLowerStrikePrice.reduce( (___allPossibleStrategies, buyingCall) => {


                        const buyingCallPrice = getPriceOfAsset({
                            asset: buyingCall,
                            priceType,
                            sideType: 'BUY'
                        });
                        if(buyingCallPrice===0) return ___allPossibleStrategies



                        const strategyPositionsOfBEPS = [
                            {
                                ...buyingPut,
                                isBuy: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingPut,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin: () => { }
                            },
                        ]
                        const totalCostOfBEPS = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBEPS,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMaxPofitOfBEPS = Math.min(...strategyPositionsOfBEPS.map(strategyPosition=>strategyPosition.strikePrice))/ 1.2;



                        const maxProfitOfBEPS = totalCostOfBEPS + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBEPS, stockPrice:priceThatCauseMaxPofitOfBEPS});



                        const quantityFactorOfBuyingCall = Math.abs(maxProfitOfBEPS/buyingCallPrice);


                        const strategyPositionsOfBEPS_Long_Call = [
                            {
                                ...buyingPut,
                                isBuy: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingPut,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                            {
                                ...buyingCall,
                                isBuy: true,
                                getQuantity: () => 1*quantityFactorOfBuyingCall/1.3,
                                getRequiredMargin() { }
                            },
                        ]


                        const totalCostOfBEPS_Long_Call = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBEPS_Long_Call,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMinProfitOfBEPS_Long_Call = Math.min(...strategyPositionsOfBEPS_Long_Call.map(strategyPosition=>strategyPosition.strikePrice)) / 1.3;
                      

                        const minProfitOfBEPS_Long_Call = totalCostOfBEPS_Long_Call + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBEPS_Long_Call, stockPrice:priceThatCauseMinProfitOfBEPS_Long_Call});

                        const minProfitPercentOfBEPS_Long_Call = minProfitOfBEPS_Long_Call / Math.abs(totalCostOfBEPS_Long_Call);

                        const breakevenList = findBreakevenList({
                            positions:strategyPositionsOfBEPS_Long_Call, 
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const breakeven = breakevenList.length? Math.min(...breakevenList) : null;



                        let isFullBodyProfitable,stockPriceToSarBeSarPercent;
                        if(!breakeven && quantityFactorOfBuyingCall>0){
                            isFullBodyProfitable = true;
                        }else if(!breakeven){
                            return _allPossibleStrategies
                        }
                        else{
                            if(!buyingPut?.optionDetails?.stockSymbolDetails?.last) return _allPossibleStrategies

                            stockPriceToSarBeSarPercent = (breakeven /buyingPut.optionDetails.stockSymbolDetails.last ) - 1;

                        
                            if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSar || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSar)
                                return _allPossibleStrategies
                        }

                        

                        return ___allPossibleStrategies.concat([{
                            option: {
                                ...buyingPut
                            },
                            positions:[buyingPut, sellingPut, buyingCall],
                            strategyTypeTitle: "BEPS_LONG_CALL",
                            strategyPositions: strategyPositionsOfBEPS_Long_Call,
                            currentStockPrice: buyingPut.optionDetails?.stockSymbolDetails?.last,
                            totalCost: totalCostOfBEPS_Long_Call,
                            expectedProfitNotif,
                            minProfitToFilter,
                            stockPriceToSarBeSarPercent,
                            isWholeProfitable:isFullBodyProfitable,
                            isProfitEnough : isProfitEnoughFn && isProfitEnoughFn(minProfitPercentOfBEPS_Long_Call),
                            name: createStrategyName([buyingPut, sellingPut, buyingCall]),
                            // profitPercent: isFullBodyProfitable ? 1: -stockPriceToSarBeSarPercent 
                            profitPercent:  minProfitPercentOfBEPS_Long_Call 
                        }])
                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

                }
                , []);

                return {
                    ...buyingPut,
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
        strategyName: "BEPS_LONG_CALL",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceToSarBeSar,
        maxStockPriceToSarBeSar,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BEPS_LONG_CALL",
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



const calcBUPS_Long_PutStrategies = (list, {priceType, strategySubName, 
    minProfitToFilter,
    isProfitEnoughFn,
    filteredList,
            optionsGroupedByStock,
    min_time_to_settlement=-Infinity, max_time_to_settlement=generalConfig.max_time_to_settlement, 
    minStockPriceToSarBeSar=-Infinity,maxStockPriceToSarBeSar=Infinity,
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(buyingPut => {

                if(!buyingPut.optionDetails?.stockSymbolDetails || !buyingPut.isPut  ) return buyingPut


                const buyingPutPrice = getPriceOfAsset({
                    asset: buyingPut,
                    priceType,
                    sideType: 'BUY'
                });
                if(buyingPutPrice===0) return buyingPut

                const optionListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingPut.symbol || !_option.isPut )
                        return false
                    if (_option.optionDetails?.strikePrice <= buyingPut.optionDetails?.strikePrice)
                        return false


                    return true
                    

                }
                );

                let allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (_allPossibleStrategies, sellingPut) => {



                    
                    const sellingPutPrice = getPriceOfAsset({
                        asset: sellingPut,
                        priceType,
                        sideType: 'SELL'
                    });
                    if(sellingPutPrice===0) return _allPossibleStrategies



                    const putListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {
                        if (!_option.isPut)
                            return false
                        if (_option.optionDetails?.strikePrice <= sellingPut.optionDetails?.strikePrice)
                            return false

                        return true

                    }
                    );


                    let __allPossibleStrategies = putListWithHigherStrikePrice.reduce( (___allPossibleStrategies, anotherBuyingPut) => {


                        const anotherBuyingPutPrice = getPriceOfAsset({
                            asset: anotherBuyingPut,
                            priceType,
                            sideType: 'BUY'
                        });
                        if(anotherBuyingPutPrice===0) return ___allPossibleStrategies


                        const strategyPositionsOfBUPS = [
                            {
                                ...buyingPut,
                                isBuy: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingPut,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                        ]
                        const totalCostOfBUPS = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBUPS,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMaxPofitOfBUPS = Math.max(...strategyPositionsOfBUPS.map(strategyPosition=>strategyPosition.strikePrice))* 1.2;



                        const maxProfitOfBUPS = totalCostOfBUPS + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBUPS, stockPrice:priceThatCauseMaxPofitOfBUPS});



                        const quantityFactorOfBuyingPut = Math.abs(maxProfitOfBUPS/anotherBuyingPutPrice);

                        const diffOfBUPS_Strikes = sellingPut.optionDetails?.strikePrice - buyingPut.optionDetails?.strikePrice;



                        const strategyPositionsOfBUPS_Long_Put = [
                            {
                                ...buyingPut,
                                isBuy: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingPut,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin: () => diffOfBUPS_Strikes
                            },
                            {
                                ...anotherBuyingPut,
                                isBuy: true,
                                getQuantity: () => 1*quantityFactorOfBuyingPut/1.3,
                                getRequiredMargin() { }
                            },
                        ]


                        const totalCostOfBUPS_Long_Put = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBUPS_Long_Put,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMinProfitOfBUPS_Long_Put = Math.max(...strategyPositionsOfBUPS_Long_Put.map(strategyPosition=>strategyPosition.strikePrice)) * 1.3;
                      

                        const minProfitOfBUPS_Long_Put = totalCostOfBUPS_Long_Put + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBUPS_Long_Put, stockPrice:priceThatCauseMinProfitOfBUPS_Long_Put});

                        const minProfitPercentOfBUPS_Long_Put = minProfitOfBUPS_Long_Put / Math.abs(totalCostOfBUPS_Long_Put);

                        const breakevenList = findBreakevenList({
                            positions:strategyPositionsOfBUPS_Long_Put, 
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const breakeven = breakevenList.length? Math.max(...breakevenList) : null;



                        let isFullBodyProfitable,stockPriceToSarBeSarPercent;
                        if(!breakeven && quantityFactorOfBuyingPut>0){
                            isFullBodyProfitable = true;
                        }else if(!breakeven){
                            return _allPossibleStrategies
                        }
                        else{
                            if(!buyingPut?.optionDetails?.stockSymbolDetails?.last) return _allPossibleStrategies

                            stockPriceToSarBeSarPercent = (breakeven /buyingPut.optionDetails.stockSymbolDetails.last ) - 1;

                        
                            if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSar || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSar)
                                return _allPossibleStrategies
                        }

                        

                        return ___allPossibleStrategies.concat([{
                            option: {
                                ...buyingPut
                            },
                            positions:[buyingPut, sellingPut, anotherBuyingPut],
                            strategyTypeTitle: "BUPS_LONG_PUT",
                            strategyPositions: strategyPositionsOfBUPS_Long_Put,
                            currentStockPrice: buyingPut.optionDetails?.stockSymbolDetails?.last,
                            totalCost: totalCostOfBUPS_Long_Put,
                            expectedProfitNotif,
                            minProfitToFilter,
                            stockPriceToSarBeSarPercent,
                            isWholeProfitable:isFullBodyProfitable,
                            isProfitEnough : isProfitEnoughFn && isProfitEnoughFn(minProfitPercentOfBUPS_Long_Put),
                            name: createStrategyName([buyingPut, sellingPut, anotherBuyingPut]),
                            // profitPercent: isFullBodyProfitable ? 1: -stockPriceToSarBeSarPercent 
                            profitPercent: minProfitPercentOfBUPS_Long_Put 
                        }])
                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

                }
                , []);

                return {
                    ...buyingPut,
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
        strategyName: "BUPS_LONG_PUT",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceToSarBeSar,
        maxStockPriceToSarBeSar,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BUPS_LONG_PUT",
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