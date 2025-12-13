const calcBuyStockStrategies = (list, {priceType, expectedProfitPerMonth, 
    min_time_to_settlement=0, max_time_to_settlement=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, 
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

                if (!option.optionDetails?.stockSymbolDetails  || option.vol < minVol)
                    return option


                const optionPrice = getPriceOfAsset({
                        asset: option,
                        priceType,
                        sideType: option.isCall ? 'BUY' : 'SELL'
                });

                if(optionPrice===0) return option


                const exerciseFee = COMMISSION_FACTOR.OPTION.SETTLEMENT.EXERCISE_FEE;

                let calculatedSettlementStockPrice;

                if(option.isCall){

                    calculatedSettlementStockPrice =(option.optionDetails.strikePrice * (1 + exerciseFee)) + (optionPrice * (1 + COMMISSION_FACTOR.OPTION.BUY)) ;
                }else{
                    calculatedSettlementStockPrice =(option.optionDetails.strikePrice * (1 + exerciseFee)) - (optionPrice / (1 + COMMISSION_FACTOR.OPTION.SELL)) ;
                }


                const currentStockPriceRatio =   option.optionDetails?.stockSymbolDetails?.last / calculatedSettlementStockPrice

                


               


                const strategyObj = {
                        // TODO:remove option prop
                        option: {
                            ...option
                        },
                        positions:[option],
                        strategyTypeTitle: "BuyStock",
                        expectedProfitNotif,
                        expectedProfitPerMonth,
                        name: createStrategyName([option]),
                        profitPercent : currentStockPriceRatio
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
        strategyName: "BuyStock",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BuyStock",
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minVol
        })
    }

}
