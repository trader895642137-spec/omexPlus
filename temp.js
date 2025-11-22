const calcBECS_COLLAR_Strategies = (list, {priceType, expectedProfitPerMonth, strategySubName, 
    min_time_to_settlement=0, max_time_to_settlement=Infinity, 
    minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, 
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
                    if (_option.symbol === option.symbol || !_option.isPut || _option.vol < minVol)
                        return
                    if (_option.optionDetails?.strikePrice <= option.optionDetails?.strikePrice)
                        return

                    if(!_option.optionDetails?.stockSymbolDetails) return false

                    return true

                }
                );

                let allPossibleStrategies = callListWithHigherStrikePrice.reduce( (_allPossibleStrategies, buyingCall) => {

                    const buyingCallPrice = getPriceOfAsset({
                        asset: buyingCall,
                        priceType,
                        sideType: 'BUY'
                    });

                    if(buyingCallPrice===0) return _allPossibleStrategies

                    const putWithSameStrikeOfBuyingCall = optionListOfSameDate.find(optionOfSameDate => {
                        return optionOfSameDate.isPut && optionOfSameDate.bestSell > 0 && (optionOfSameDate.optionDetails?.strikePrice === buyingCall.optionDetails?.strikePrice)
                    }
                    );

                    if (!putWithSameStrikeOfBuyingCall) {
                        return _allPossibleStrategies
                    }

                    const putWithSameStrikeOfBuyingCallPrice = getPriceOfAsset({
                        asset: putWithSameStrikeOfBuyingCall,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(putWithSameStrikeOfBuyingCallPrice===0) return _allPossibleStrategies



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
                            getRequiredMargin() { }
                        },
                        {
                            ...putWithSameStrikeOfBuyingCall,
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
                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, buyingCall,putWithSameStrikeOfBuyingCall],
                        strategyTypeTitle: "BEPS_COLLAR",
                        expectedProfitNotif,
                        expectedProfitPerMonth,
                        name: createStrategyName([option, buyingCall,putWithSameStrikeOfBuyingCall]),
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