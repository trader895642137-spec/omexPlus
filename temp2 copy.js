const calcBUPS_Long_Put_BESStrategies = (list, { priceType, expectedProfitPerMonth,
    min_time_to_settlement = -Infinity, max_time_to_settlement = generalConfig.max_time_to_settlement,
    minProfitToFilter,
    BUPS_Long_PutStrategies,
    optionsGroupedByStock,
    minStockPriceDistanceInPercent = -Infinity, maxStockPriceDistanceInPercent = Infinity,
    minStockPriceToSarBeSar = -Infinity, maxStockPriceToSarBeSar = Infinity,
    minVol = CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif = false, ...restConfig }) => {



    

    const enrichedList = BUPS_Long_PutStrategies.map(BUPS_Long_PutStrategy => {

        if(BUPS_Long_PutStrategy.profitPercent<=0) return BUPS_Long_PutStrategy.option


        const allStockOptions = optionsGroupedByStock[BUPS_Long_PutStrategy.option.optionDetails.stockSymbol] || [];


        const buyingPut = Math.max(...BUPS_Long_PutStrategy.strategyPositions.optionDetails.strikePrice);
        const otherPuts = BUPS_Long_PutStrategy.strategyPositions.filter(sp=>sp.symbol!==buyingPut.symbol);

        const buyingPutPrice = getPriceOfAsset({
            asset: buyingPut,
            priceType,
            sideType: 'BUY'
        });


        const otherPutsSymbols = otherPuts.map(put=>put.symbol);
        

        const putsLowerStrikePrice = allStockOptions.filter(_option => {
            if (_option.settlementTimeDiff !== BUPS_Long_PutStrategy.settlementTimeDiff) return false
            if (!_option.isPut)
                return false
            if (_option.optionDetails?.strikePrice >= buyingPut.optionDetails?.strikePrice)
                return false

            if(otherPutsSymbols.includes(_option.symbol)) return false

            const sellingPutPrice = getPriceOfAsset({
                asset: _option,
                priceType,
                sideType: 'SELL'
            });
            if(sellingPutPrice===0) return false

            if (
                hasGreaterRatio({
                    num1: buyingPutPrice,
                    num2: sellingPutPrice,
                    properRatio: 20
                })
            ) {
                return false
            }

            return true
        }
        );


        
        
       


        const allPossibleStrategies = putsLowerStrikePrice.reduce((_allPossibleStrategies, sellingPut) => {


            const strategyPositions = [
                ...BUPS_Long_PutStrategy.strategyPositions,
                {
                    ...sellingPut,
                    isBuy: false,
                    getQuantity: () => buyingPut.getQuantity(),
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

            
            const profit = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:sellingPut.optionDetails.stockSymbolDetails.last});;

            const profitPercent = profit / Math.abs(totalCost);

            const breakevenList = findBreakevenList({
                positions: strategyPositions,
                getPrice: (strategyPosition) => getPriceOfAsset({
                    asset: strategyPosition,
                    priceType,
                    sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                })
            });

            const breakeven = breakevenList[0];



            const strategyObj = {
                // TODO:remove option prop
                option: {
                    ...sellingPut
                },
                positions: [...strategyPositions],
                strategyTypeTitle: "BUPS_Long_Put_BES",
                strategyPositions,
                currentStockPrice: sellingPut.optionDetails?.stockSymbolDetails?.last,
                totalCost,
                expectedProfitNotif,
                minProfitToFilter,
                expectedProfitPerMonth,
                breakeven,
                isWholeProfitable: !breakeven,
                settlementTimeDiff: sellingPut.settlementTimeDiff,
                name: createStrategyName([...strategyPositions]),
                profitPercent
            }

            return _allPossibleStrategies.concat([strategyObj])



        }, []);

        return {
            ...BUPS_Long_PutStrategy.option,
            allPossibleStrategies
        }


    });




    return {

        allStrategies: enrichedList.flatMap(_option => _option.allPossibleStrategies).filter(Boolean),
        strategyName: "BUPS_Long_Put_BES",
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
            strategyName: "BUPS_Long_Put_BES",
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceInPercent,
            maxStockPriceDistanceInPercent,
            minVol
        })
    }

}