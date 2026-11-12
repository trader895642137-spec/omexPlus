const calcCOVERED_BUY_PUT_Strategies = (list, { priceType, expectedProfitPerMonth,
    min_time_to_settlement = -Infinity, max_time_to_settlement = generalConfig.max_time_to_settlement,
    minProfitToFilter,
    coveredStrategyList,
    optionsGroupedByStock,
    minStockPriceDistanceInPercent = -Infinity, maxStockPriceDistanceInPercent = Infinity,
    minStockPriceToSarBeSar = -Infinity, maxStockPriceToSarBeSar = Infinity,
    minVol = CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif = false, ...restConfig }) => {



    const enrichedList = coveredStrategyList.map(coveredStrategy => {

        const coveredTotalCost = totalCostCalculatorCommon({
            strategyPositions: coveredStrategy.strategyPositions,
            getPrice: (strategyPosition) => getPriceOfAsset({
                asset: strategyPosition,
                priceType,
                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
            })
        });


        const coveredSettlementGain = settlementGainCalculator({ strategyPositions: coveredStrategy.strategyPositions, stockPrice: coveredStrategy.option.strikePrice * 1.2 })

        const coveredProfit = coveredTotalCost + coveredSettlementGain;

        if (coveredProfit <= 0) return coveredStrategy.option


        const allStockOptions = optionsGroupedByStock[coveredStrategy.option.optionDetails.stockSymbol] || [];


        const allPutList = allStockOptions.filter(option => option.isPut && option.settlementTimeDiff === coveredStrategy.settlementTimeDiff);



        const allPossibleStrategies = allPutList.reduce((_allPossibleStrategies, put) => {

            const buyingOptionPrice = getPriceOfAsset({
                asset: put,
                priceType,
                sideType: 'BUY'
            });

            if (buyingOptionPrice === 0) return _allPossibleStrategies



            const quantityFactorOfBuyingPut = Math.abs(coveredProfit / buyingOptionPrice) * 1.3;

            const strategyPositions = [
                ...coveredStrategy.strategyPositions,
                {
                    ...put,
                    isBuy: true,
                    getQuantity: () => quantityFactorOfBuyingPut,
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

            const settlementGain = settlementGainCalculator({ strategyPositions, stockPrice: put.optionDetails.stockSymbolDetails.last })

            const profit = totalCost + settlementGain;

            const profitPercent = profit / Math.abs(totalCost);

            const strategyObj = {
                // TODO:remove option prop
                option: {
                    ...put
                },
                positions: [coveredStrategy.option.optionDetails?.stockSymbolDetails, coveredStrategy.option, put],
                strategyTypeTitle: "COVERED_BUY_PUT",
                strategyPositions,
                currentStockPrice: put.optionDetails?.stockSymbolDetails?.last,
                totalCost,
                expectedProfitNotif,
                minProfitToFilter,
                expectedProfitPerMonth,
                isWholeProfitable: profit >= 0,
                settlementTimeDiff: put.settlementTimeDiff,
                name: createStrategyName([coveredStrategy.option.optionDetails?.stockSymbolDetails, coveredStrategy.option, put]),
                profitPercent
            }

            return _allPossibleStrategies.concat([strategyObj])



        }, []);

        return {
            ...coveredStrategy.option,
            allPossibleStrategies
        }


    });




    return {

        allStrategies: enrichedList.flatMap(_option => _option.allPossibleStrategies).filter(Boolean),
        strategyName: "COVERED_BUY_PUT",
        strategyDirection: STRATEGY_DIRECTION.BULLISH,
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
            strategyName: "COVERED_BUY_PUT",
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceInPercent,
            maxStockPriceDistanceInPercent,
            minVol
        })
    }

}