const calcCOVEREDStrategies = (list, {priceType, expectedProfitPerMonth, 
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
    for (let[stockSymbol,optionListOfStock] of Object.entries(optionsGroupedByStock)) {

        const _enrichedList = optionListOfStock.map(option => {

            if (!option.optionDetails?.stockSymbolDetails)
                return option

            const stockPriceStrikeRatio = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;

            if (!option.symbol.startsWith('ض') || option.vol < minVol || stockPriceStrikeRatio < minStockPriceDistanceInPercent || stockPriceStrikeRatio > maxStockPriceDistanceInPercent)
                return option

            const totalCostWithSign = totalCostCalculator({
                buyStocks: [option.optionDetails?.stockSymbolDetails],
                buyOptions: [],
                sellOptions: [option],
                priceType
            });
            const totalOffsetGainWithSign = totalSettlementGain([{
                option,
                positionSide: "SELL",
                choosePriceType: "MIN"
            }, ]);

            const profit = totalCostWithSign + totalOffsetGainWithSign;

            const profitPercent = profit / Math.abs(totalCostWithSign);
            const strategyObj = {
                option: {
                    ...option
                },
                positions:[option.optionDetails?.stockSymbolDetails, option],
                strategyTypeTitle: "COVERED",
                expectedProfitNotif,
                expectedProfitPerMonth,
                name: createStrategyName([option.optionDetails?.stockSymbolDetails, option]),
                profitPercent
            }

            return {
                ...option,
                allPossibleStrategies: [strategyObj]
            }

        }
        );

        enrichedList = enrichedList.concat(_enrichedList)

    }

    return {
        enrichedList,
        allStrategiesSorted: getAllPossibleStrategiesSorted(enrichedList),
        strategyName: "COVERED",
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
            strategyName: "COVERED",
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceInPercent,
            maxStockPriceDistanceInPercent,
            minVol
        })
    }

}