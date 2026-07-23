const calcSyntheticCoveredCallStrategies = (list, 
    {priceType, strategySubName,minQuantityFactorOfBUCS=0.6, 
        minProfitToFilter,
        minStockPriceToSarBeSar=-Infinity,
        maxStockPriceToSarBeSar=Infinity,
        BUCSSOptionListIgnorer=generalConfig.BUCSSOptionListIgnorer, min_time_to_settlement=-Infinity, 
        max_time_to_settlement=Infinity, 
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

                if (!buyingCall.optionDetails?.stockSymbolDetails || !buyingCall.isCall || buyingCall.vol < minVol)
                return buyingCall

               


                const buyingCallPrice = getPriceOfAsset({
                    asset: buyingCall,
                    priceType,
                    sideType: 'BUY'
                });
                if(buyingCallPrice===0) return buyingCall


                const sameStrikePut = optionListOfSameDate.find(__option => __option.symbol === buyingCall.symbol.replace('ض', 'ط') && (__option.last > 10 ? __option.vol > minVol : true));
                if(!sameStrikePut) return buyingCall
                const sameStrikePutPrice = getPriceOfAsset({
                    asset: sameStrikePut,
                    priceType,
                    sideType: 'SELL'
                });
                if(sameStrikePutPrice===0) return buyingCall


                const sellingCallList = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingCall.symbol || !_option.isCall || _option.vol < minVol)
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
                        expectedProfitNotif,
                        minProfitToFilter,
                        stockPriceToSarBeSarPercent,
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
