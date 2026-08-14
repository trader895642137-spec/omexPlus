const calcBES_With_BUCS_BEPSStrategies = (list, {priceType, expectedProfitPerMonth, 
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

                        const strategyObj = createAndCalcBusStrategy({
                            buyingCall,
                            sellingCall,
                            buyingPut,
                            sellingPut:sellingPutWithSameStrikeOfBuyingCall,
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

                        const strategyObj = createAndCalcBusStrategy({
                            buyingCall,
                            sellingCall,
                            buyingPut:buyingPutWithSameStrikeOfSellingCall,
                            sellingPut,
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