const calcMARRIED_PUTStrategies = (list, {priceType, expectedProfitPerMonth, 
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
    for (let[stockSymbol,optionListOfStock] of Object.entries(optionsGroupedByStock)) {

        const _enrichedList = optionListOfStock.map(option => {

            if (!option.optionDetails?.stockSymbolDetails)
                return option


            if (!option.isPut || option.vol < minVol)
                return option


            const optionPrice = getPriceOfAsset({
                asset: option,
                priceType,
                sideType: 'BUY'
            });

            if (optionPrice === 0) return option


            const strategyPositions = [
                {
                    ...option.optionDetails?.stockSymbolDetails,
                    isBuy: true,
                    getQuantity: () => baseQuantity,
                    getRequiredMargin() { }
                },
                {
                    ...option,
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

            const profit = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: option.optionDetails?.stockSymbolDetails?.last });

            const profitPercent = profit / Math.abs(totalCost);
            const strategyObj = {
                option: {
                    ...option
                },
                positions:[option.optionDetails?.stockSymbolDetails, option],
                strategyTypeTitle: "MARRIED_PUT",
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
        strategyName: "MARRIED_PUT",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "MARRIED_PUT",
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minVol
        })
    }

}