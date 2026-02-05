const calcBECS_COLLAR_Strategies = (list, {priceType, expectedProfitPerMonth, 
    strategySubName, min_time_to_settlement=-Infinity, max_time_to_settlement=Infinity, 
    minProfitToFilter,
    minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, 
    justIfWholeIsPofitable=false,
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

                if (!option.isCall || option.vol < minVol)
                    return option


                const optionPrice = getPriceOfAsset({
                    asset: option,
                    priceType,
                    sideType: 'SELL'
                });

                if(optionPrice===0) return option

                const callListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === option.symbol || !_option.isCall || _option.vol < minVol)
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

                    if(profitPercentOfSettlement<0) return _allPossibleStrategies


                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, buyingCall,putWithSameStrikeOfSellingCall],
                        strategyTypeTitle: "BECS_COLLAR",
                        expectedProfitNotif,
                        minProfitToFilter,
                        expectedProfitPerMonth,
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