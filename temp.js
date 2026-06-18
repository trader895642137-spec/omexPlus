const calcBuyStockByCallFromSafStrategies = (list, {priceType, expectedProfitPerMonth,
    isProfitEnoughFn, 
    minProfitToFilter,
    min_time_to_settlement=-Infinity, max_time_to_settlement=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, 
    expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

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


               
                const settlementTimeDiff = moment(option.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());


               



                const strategyObj = {
                        // TODO:remove option prop
                        option: {
                            ...option
                        },
                        positions:[option],
                        strategyTypeTitle: "BuyStockByCallFromSaf",
                        expectedProfitNotif,
                        minProfitToFilter,
                        expectedProfitPerMonth,
                        name: createStrategyName([option]),
                        isProfitEnough : isProfitEnoughFn && isProfitEnoughFn(profitPercentOfSettlement,settlementTimeDiff,option),
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
        strategyName: "BuyStockByCallFromSaf",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BuyStockByCallFromSaf",
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minVol
        })
    }

}