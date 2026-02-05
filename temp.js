const calcBEPS_COLLAR_Strategies = (list, {priceType, expectedProfitPerMonth, 
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

                if (!option.isPut || option.vol < minVol)
                    return option


                const optionPrice = getPriceOfAsset({
                    asset: option,
                    priceType,
                    sideType: 'SELL'
                });

                if(optionPrice===0) return option

                const putListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === option.symbol || !_option.isPut || _option.vol < minVol)
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



                    const priceThatCauseMaxProfit = Math.min(...strategyPositions.map(strategyPosition=>strategyPosition.strikePrice))/ 1.2;



                    const maxProfit = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:priceThatCauseMaxProfit});


                    const profitPercent = maxProfit / Math.abs(totalCost);



                    if(justIfWholeIsPofitable && maxProfit<0) return _allPossibleStrategies






                    const settlementGain =  settlementGainCalculator({strategyPositions,stockPrice: option.optionDetails?.stockSymbolDetails?.last})
                    const profitOfSettlement = totalCost + settlementGain;
                    const profitPercentOfSettlement = profitOfSettlement / Math.abs(totalCost);

                    if(profitPercentOfSettlement<0) return _allPossibleStrategies


                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, buyingPut,callWithSameStrikeOfSellingPut],
                        strategyTypeTitle: "BEPS_COLLAR",
                        expectedProfitNotif,
                        minProfitToFilter,
                        expectedProfitPerMonth,
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