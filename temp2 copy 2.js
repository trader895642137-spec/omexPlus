const calcSyntheticBuyStrategies = (list, {
    priceType,
    minProfitToFilter,
    expectedProfitPerMonth,
    settlementGainChoosePriceType = "MIN",
    strategySubName,
    BUCSSOptionListIgnorer = generalConfig.BUCSSOptionListIgnorer,
    min_time_to_settlement = -Infinity,
    max_time_to_settlement = generalConfig.max_time_to_settlement,
    filteredList,
    optionsGroupedByStock,
    minStockPriceDistanceFromHigherStrikeInPercent = -Infinity,
    maxStockPriceDistanceFromHigherStrikeInPercent = Infinity,
    minStockPriceToSarBeSar = -Infinity,
    maxStockPriceToSarBeSar = Infinity,
    minVol = CONSTS.DEFAULTS.MIN_VOL,
    expectedProfitNotif = false,
    ...restConfig
}) => {
    const enrichedList = [];

    for (const [stockSymbol, optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(
            optionList,
            ({ optionDetails }) => optionDetails.date
        );

        for (const [date, optionListOfSameDate] of Object.entries(optionsGroupedByDate)) {
            const callList = optionListOfSameDate.filter(option =>
                option.isCall &&
                Number.isFinite(option.optionDetails?.stockSymbolDetails?.last) &&
                option.optionDetails.stockSymbolDetails.last > 0
            );

            const enrichedListOfDate = callList.map(call => {
                if (BUCSSOptionListIgnorer({ option: call, minVol })) {
                    return call;
                }

                const callPrice = getPriceOfAsset({
                    asset: call,
                    priceType,
                    sideType: 'BUY'
                });

                if (!Number.isFinite(callPrice) || callPrice <= 0) {
                    return call;
                }

                const sameStrikePut = optionListOfSameDate.find(
                    option => option.symbol === call.symbol.replace('ض', 'ط')
                );

                if (!sameStrikePut || sameStrikePut.isCall) {
                    return call;
                }

                const sameStrikePutPrice = getPriceOfAsset({
                    asset: sameStrikePut,
                    priceType,
                    sideType: 'SELL'
                });

                if (!Number.isFinite(sameStrikePutPrice) || sameStrikePutPrice < 0) {
                    return call;
                }

                const strategyPositions = [
                    {
                        ...call,
                        isBuy: true,
                        getQuantity: () => baseQuantity,
                        getRequiredMargin() { }
                    },
                    {
                        ...sameStrikePut,
                        isSell: true,
                        getQuantity: () => baseQuantity,
                        getRequiredMargin() { }
                    }
                ];

                const getPositionPrice = strategyPosition =>
                    getPriceOfAsset({
                        asset: strategyPosition,
                        priceType,
                        sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                    });

                const breakevenList = findBreakevenList({
                    positions: strategyPositions,
                    getPrice: getPositionPrice
                });

                const breakeven = breakevenList?.[0];
                const currentStockPrice = call.optionDetails.stockSymbolDetails.last;

                // مثل BUCS: اگر breakeven نبود، استراتژی حذف نمی‌شود (isWholeProfitable)
                const stockPriceToSarBeSarPercent = Number.isFinite(breakeven)
                    ? (breakeven / currentStockPrice) - 1
                    : NaN;

                if (
                    Number.isFinite(stockPriceToSarBeSarPercent) &&
                    (stockPriceToSarBeSarPercent < minStockPriceToSarBeSar ||
                        stockPriceToSarBeSarPercent > maxStockPriceToSarBeSar)
                ) {
                    return call;
                }

                const totalCost = totalCostCalculatorCommon({
                    strategyPositions,
                    getPrice: getPositionPrice
                });

                if (!Number.isFinite(totalCost) || totalCost === 0) {
                    return call;
                }

                const distanceCurrentPrice = (currentStockPrice / breakeven)-1;
             

                const strategyObj = {
                    option: { ...call },
                    positions: [call, sameStrikePut],
                    strategyTypeTitle: "SyntheticBuy",
                    strategyPositions,
                    currentStockPrice,
                    totalCost,
                    expectedProfitNotif,
                    minProfitToFilter,
                    expectedProfitPerMonth,
                    stockPriceToSarBeSarPercent,
                    settlementTimeDiff: call.settlementTimeDiff,
                    name: createStrategyName([call, sameStrikePut]),
                    isProfitEnough : isProfitEnoughFn && isProfitEnoughFn(option),
                    profitPercent : distanceCurrentPrice
                };

                return {
                    ...call,
                    allPossibleStrategies: [strategyObj]
                };
            });

            enrichedList.push(...enrichedListOfDate);
        }
    }

    return {
        allStrategies: enrichedList
            .flatMap(option => option.allPossibleStrategies ?? [])
            .filter(Boolean),

        strategyName: "SyntheticBuy",
        strategyDirection: STRATEGY_DIRECTION.BULLISH,
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceFromHigherStrikeInPercent,
        maxStockPriceDistanceFromHigherStrikeInPercent,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,

        htmlTitle: configsToHtmlTitle({
            strategyName: "SyntheticBuy",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [
                minStockPriceDistanceFromHigherStrikeInPercent !== -Infinity && {
                    label: "minToHigh",
                    value: `${(minStockPriceDistanceFromHigherStrikeInPercent * 100).toFixed(0)}%`
                },
                maxStockPriceDistanceFromHigherStrikeInPercent !== Infinity && {
                    label: "maxToHigh",
                    value: `${(maxStockPriceDistanceFromHigherStrikeInPercent * 100).toFixed(0)}%`
                },
                minStockPriceToSarBeSar !== -Infinity && minStockPriceToSarBeSar !== 0 && {
                    label: "minToSar",
                    value: `${(minStockPriceToSarBeSar * 100).toFixed(0)}%`
                },
                maxStockPriceToSarBeSar !== Infinity && {
                    label: "maxToSar",
                    value: `${(maxStockPriceToSarBeSar * 100).toFixed(0)}%`
                }
            ].filter(Boolean),
            minVol
        })
    };
};