const calcBES_With_BUCS_BEPSStrategies = (list, {priceType, expectedProfitPerMonth, 
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

            const _enrichedList = optionListOfSameDate.map(buyingCall => {

                if (!buyingCall.isCall ||  buyingCall.vol < minVol)
                        return buyingCall


                const buyingCallPrice = getPriceOfAsset({
                        asset: buyingCall,
                        priceType,
                        sideType: 'BUY'
                });

                if(buyingCallPrice===0) return buyingCall
                

                const higherStrikeCalls =   optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingCall.symbol || !_option.isCall ||  _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice <= buyingCall.optionDetails?.strikePrice)
                        return false


                    return true

                }
                );
              

                let allPossibleStrategies = higherStrikeCalls.reduce( (_allPossibleStrategies, sellingCall) => {


                    const sellingCallPrice = getPriceOfAsset({
                        asset: sellingCall,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(sellingCallPrice===0) return _allPossibleStrategies


                    const buyingPutWithSameStrikeOfSellingCall = optionListOfSameDate.find(_option=> _option.isPut && _option.vol > minVol && ( _option.optionDetails?.strikePrice === sellingCall.optionDetails?.strikePrice));

                    if(!buyingPutWithSameStrikeOfSellingCall) return _allPossibleStrategies


                    const buyingPutPrice = getPriceOfAsset({
                        asset: buyingPutWithSameStrikeOfSellingCall,
                        priceType,
                        sideType: 'BUY'
                    });

                    if(buyingPutPrice===0) return _allPossibleStrategies


                    const lowerStrikePuts = optionListOfSameDate.filter(_option => {

                        if (_option.symbol === buyingPutWithSameStrikeOfSellingCall.symbol || !_option.isPut || _option.vol < minVol)
                            return false

                       
                        if (_option.optionDetails?.strikePrice >= buyingPutWithSameStrikeOfSellingCall.optionDetails?.strikePrice)
                            return false

                        if (_option.optionDetails?.strikePrice >= buyingCall.optionDetails?.strikePrice)
                            return false

                        return true

                    }
                    );

                    let allPossibleStrategies =  lowerStrikePuts.reduce((_allPossibleStrategies, sellingPut) => {


                        const sellingPutPrice = getPriceOfAsset({
                            asset: sellingPut,
                            priceType,
                            sideType: 'BUY'
                        });

                        if(sellingPutPrice===0) return _allPossibleStrategies

                        

                        const diffOfBUCS_Strikes = sellingCall.optionDetails?.strikePrice - buyingCall.optionDetails?.strikePrice;
                        const diffOfBEPS_Strikes = buyingPutWithSameStrikeOfSellingCall.optionDetails?.strikePrice - sellingPut.optionDetails?.strikePrice;

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
                                ...buyingPutWithSameStrikeOfSellingCall,
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
                                ...buyingCall
                            },
                            positions:[buyingCall,sellingCall,sellingPut,buyingPutWithSameStrikeOfSellingCall],
                            strategyTypeTitle: "BES_With_BUCS_BEPS",
                            expectedProfitNotif,
                            expectedProfitPerMonth,
                            name: createStrategyName([buyingCall,sellingCall,sellingPut,buyingPutWithSameStrikeOfSellingCall]),
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
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        minStockPriceToSarBeSarPercent,
        maxStockPriceToSarBeSarPercent,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BES_With_BUCS_BEPS",
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