const calcBUPS_COLLARStrategies = (list, {priceType, expectedProfitPerMonth, 
    minProfitToFilter,
    settlementGainChoosePriceType="MIN", strategySubName, 
    BUPSOptionListIgnorer=generalConfig.BUPSOptionListIgnorer, 
    justIfWholeIsPofitable=false,
    min_time_to_settlement=-Infinity, max_time_to_settlement=Infinity, 
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
                    if (_option.vol < minVol)
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



                    const priceThatCauseMaxProfit = Math.min(...strategyPositions.map(strategyPosition=>strategyPosition.strikePrice))/ 1.2;



                    const maxProfit = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:priceThatCauseMaxProfit});

                    if(justIfWholeIsPofitable && maxProfit<0) return _allPossibleStrategies


                    const profitPercent = maxProfit / Math.abs(totalCost);



                    const settlementGain =  settlementGainCalculator({strategyPositions,stockPrice: option.optionDetails?.stockSymbolDetails?.last})
                    const profitOfSettlement = totalCost + settlementGain;
                    const profitPercentOfSettlement = profitOfSettlement / Math.abs(totalCost);

                    if(profitPercentOfSettlement<0) return _allPossibleStrategies

                     


                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, _option,callOptionWithSameStrike],
                        strategyTypeTitle: "BUPS_COLLAR",
                        expectedProfitNotif,
                        minProfitToFilter,
                        expectedProfitPerMonth,
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