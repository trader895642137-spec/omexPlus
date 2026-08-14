













const calcBUS_With_BUPS_BECSStrategies = (list, {priceType, expectedProfitPerMonth, 
    minProfitToFilter,
    settlementGainChoosePriceType="MIN", strategySubName,  
    min_time_to_settlement=-Infinity, max_time_to_settlement=Infinity, 
    minStockPriceToSarBeSar=-Infinity, maxStockPriceToSarBeSar=Infinity, 
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

                        const strategyObj = createAndCalcBusStrategy({
                            buyingPut,
                            sellingPut,
                            buyingCall,
                            sellingCall:sellingCallWithSameStrikeOfBuyingPut,
                            priceType,
                            minStockPriceToSarBeSar,maxStockPriceToSarBeSar
                        });

                        if (!strategyObj || Number.isNaN(strategyObj.profitPercent))
                            return _allPossibleStrategies

                        return _allPossibleStrategies.concat([{
                            ...strategyObj,
                            strategyTypeTitle: "BUS_With_BUCS_BEPS",
                            expectedProfitNotif,
                            minProfitToFilter,
                            expectedProfitPerMonth,
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

                        const strategyObj = createAndCalcBusStrategy({
                            buyingPut,
                            sellingPut,
                            buyingCall:buyingCallWithSameStrikeOfSellingPut,
                            sellingCall,
                            priceType,
                            minStockPriceToSarBeSar,maxStockPriceToSarBeSar                        });

                        if (!strategyObj || Number.isNaN(strategyObj.profitPercent))
                            return _allPossibleStrategies

                        return _allPossibleStrategies.concat([{
                            ...strategyObj,
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