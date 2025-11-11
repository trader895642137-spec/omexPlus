const calcBES_With_BUPS_BECSStrategies = (list, {priceType, expectedProfitPerMonth, 
    notifIfWholeIsPofitable=false,
    settlementGainChoosePriceType="MIN", strategySubName,  min_time_to_settlement=0, max_time_to_settlement=Infinity, 
    minStockPriceToSarBeSarPercent=-Infinity, maxStockPriceToSarBeSarPercent=Infinity, 
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

                if (!buyingPut.isPut ||  buyingPut.vol < minVol)
                        return buyingPut


                const buyingPutPrice = getPriceOfAsset({
                        asset: buyingPut,
                        priceType,
                        sideType: 'BUY'
                });

                if(buyingPutPrice===0) return buyingPut
                

                const higherStrikePuts =   optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingPut.symbol || !_option.isPut ||  _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice <= buyingPut.optionDetails?.strikePrice)
                        return false


                    return true

                }
                );
              

                let allPossibleStrategies = higherStrikePuts.reduce( (_allPossibleStrategies, sellingPut) => {


                    const sellingPutPrice = getPriceOfAsset({
                        asset: sellingPut,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(sellingPutPrice===0) return _allPossibleStrategies


                    const buyingCallWithSameStrikeOfSellingPut = optionListOfSameDate.find(_option=> _option.isCall && _option.vol > minVol && ( _option.optionDetails?.strikePrice === sellingPut.optionDetails?.strikePrice));

                    if(!buyingCallWithSameStrikeOfSellingPut) return _allPossibleStrategies


                    const buyingCallPrice = getPriceOfAsset({
                        asset: buyingCallWithSameStrikeOfSellingPut,
                        priceType,
                        sideType: 'BUY'
                    });

                    if(buyingCallPrice===0) return _allPossibleStrategies


                    const lowerStrikeCalls = optionListOfSameDate.filter(_option => {

                        if (_option.symbol === buyingCallWithSameStrikeOfSellingPut.symbol || !_option.isCall || _option.vol < minVol)
                            return false

                        if (_option.optionDetails?.strikePrice === buyingPut.optionDetails?.strikePrice)
                            return false
                        if (_option.optionDetails?.strikePrice >= buyingCallWithSameStrikeOfSellingPut.optionDetails?.strikePrice)
                            return false

                        return true

                    }
                    );

                    let allPossibleStrategies =  lowerStrikeCalls.reduce((_allPossibleStrategies, sellingCall) => {


                        const sellingCallPrice = getPriceOfAsset({
                            asset: sellingCall,
                            priceType,
                            sideType: 'BUY'
                        });

                        if(sellingCallPrice===0) return _allPossibleStrategies

                        

                        const diffOfBUPS_Strikes = sellingPut.optionDetails?.strikePrice - buyingPut.optionDetails?.strikePrice;
                        const diffOfBECS_Strikes = buyingCallWithSameStrikeOfSellingPut.optionDetails?.strikePrice - sellingCall.optionDetails?.strikePrice;

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
                                getRequiredMargin: () => diffOfBUPS_Strikes
                            },
                            {
                                ...sellingCall,
                                isSell: true,
                                getQuantity: () => baseQuantity,
                                getRequiredMargin: () => diffOfBECS_Strikes
                            },
                            {
                                ...buyingCallWithSameStrikeOfSellingPut,
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

                        const priceThatCauseMaxProfit = Math.min(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) / 1.3;
                        const maxProfit = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: priceThatCauseMaxProfit });

                        if(breakeven){

                            const stockPriceToSarBeSarPercent = -((breakeven / sellingCall.optionDetails.stockSymbolDetails.last) - 1);
    
                            if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSarPercent)
                                return _allPossibleStrategies
                        }else if(maxProfit<=0){
                             return _allPossibleStrategies
                        }


                        const profitPercent =  maxProfit / Math.abs(totalCost);



                       
                        const strategyObj = {
                            option: {
                                ...buyingPut
                            },
                            positions:[buyingPut,sellingPut,sellingCall,buyingCallWithSameStrikeOfSellingPut],
                            strategyTypeTitle: "BES_With_BUPS_BECS",
                            expectedProfitNotif,
                            expectedProfitPerMonth,
                            name: createStrategyName([buyingPut,sellingPut,sellingCall,buyingCallWithSameStrikeOfSellingPut]),
                            profitPercent : (notifIfWholeIsPofitable &&  !breakeven) ? 1 :-1
                        }

                        if (Number.isNaN(strategyObj.profitPercent))
                            return _allPossibleStrategies

                        return _allPossibleStrategies.concat([strategyObj])


                    }, [])


                    

                    return _allPossibleStrategies.concat(allPossibleStrategies)

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
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        minStockPriceToSarBeSarPercent,
        maxStockPriceToSarBeSarPercent,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BES_With_BUPS_BECS",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceToSarBeSarPercent !== 'undefined' && minStockPriceToSarBeSarPercent !== null && minStockPriceToSarBeSarPercent !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceToSarBeSarPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceToSarBeSarPercent !== 'undefined' && maxStockPriceToSarBeSarPercent !== null && maxStockPriceToSarBeSarPercent !== Infinity && {
                label: "maxToSar",
                value: `${((maxStockPriceToSarBeSarPercent) * 100).toFixed(0)}%`
            },].filter(Boolean),
            minVol
        })
    }

}