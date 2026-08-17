const calcSellCallNokoolGainStrategies = (list, { priceType, expectedProfitPerMonth,
    minProfitToFilter,
    min_time_to_settlement = -Infinity, max_time_to_settlement = Infinity,
    minVol = CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif = false, ...restConfig }) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({ optionDetails }) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let [stockSymbol, optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({ optionDetails }) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap(([date, optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (!option.optionDetails?.stockSymbolDetails || !option.isCall) {
                    return option
                }

                if (!isBuyQueue(option.optionDetails?.stockSymbolDetails)) return option


                const marginPerQuantity = option.calculatedRequiredMargin / 1000;

                const strategyPositions = [
                    {
                        ...option,
                        isBuy: false,
                        getQuantity: () => baseQuantity,
                        getRequiredMargin: () => marginPerQuantity
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

                const stockPrice = option.optionDetails.stockSymbolDetails.last;

                const sumOfNokoool = someOfNokoolGainCalculator({ nokoolQuantity: baseQuantity, stockPrice, strikePrice = option.optionDetails?.strikePrice });

                const emalGains = (marginPerQuantity * baseQuantity) - sumOfNokoool;


                const profitPercent = profitPercentCalculator(
                    {
                        costWithSign: totalCost,
                        gainWithSign: emalGains
                    }) / 100



                const strategyObj = {
                    option: {
                        ...option
                    },
                    positions: [option,],
                    strategyTypeTitle: "SellCallNokoolGain",
                    minProfitToFilter,
                    expectedProfitNotif,
                    expectedProfitPerMonth,
                    name: createStrategyName([option]),
                    profitPercent
                }

                if (Number.isNaN(strategyObj.profitPercent))
                    return option


                let allPossibleStrategies = [strategyObj]

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
        strategyName: "SellCallNokoolGain",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "SellCallNokoolGain",
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minVol
        })
    }

}