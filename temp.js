const calcCALL_BUTTERFLYStrategies = (list, {
    priceType, settlementGainChoosePriceType="MIN", strategySubName,
    isProfitEnoughFn, 
    BUCSSOptionListIgnorer=generalConfig.BUCSSOptionListIgnorer, 
    min_time_to_settlement=-Infinity, 
    max_time_to_settlement=Infinity, 
    minStockPriceDistanceFromHigherStrikeInPercent=-Infinity, 
    maxStockPriceDistanceFromHigherStrikeInPercent=Infinity, 
    minStockPriceDistanceFromSarBeSarInPercent=-Infinity, maxStockPriceDistanceFromSarBeSarInPercent=Infinity, 
    MIN_BUCS_BECS_diffStrikesRatio=0, MAX_BUCS_BECS_diffStrikesRatio=Infinity, 
    minStockStrike4DistanceInPercent=-Infinity, maxStockStrike4DistanceInPercent=Infinity, 
    minStockMiddleDistanceInPercent=-Infinity, maxStockMiddleDistanceInPercent=Infinity, 
    minVol=CONSTS.DEFAULTS.MIN_VOL, minProfitLossRatio=.7, expectedProfitNotif=false, ...restConfig}) => {

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

                if (BUCSSOptionListIgnorer({
                    option,
                    minVol
                }))
                    return option


                const priceOfOptionWithLowStrike = getPriceOfAsset({
                    asset: option,
                    priceType,
                    sideType: 'BUY'
                });

                if(priceOfOptionWithLowStrike===0) return option

                const callListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                    if (_option.symbol === option.symbol || !_option.isCall || _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice < option.optionDetails?.strikePrice)
                        return false

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    
                    const highStrikePrice = getPriceOfAsset({
                        asset: _option,
                        priceType,
                        sideType: 'SELL'
                    });
                    

                     // TODO: use breakeven function 

                    const sarBeSar = option.optionDetails?.strikePrice + (priceOfOptionWithLowStrike - highStrikePrice);


                    const stockPriceSarBeSarRatio = (_option.optionDetails.stockSymbolDetails.last / sarBeSar) - 1;

                    if (stockPriceSarBeSarRatio > minStockPriceDistanceFromSarBeSarInPercent && stockPriceSarBeSarRatio < maxStockPriceDistanceFromSarBeSarInPercent) {} else {
                        return false
                    }

                    return true

                }
                );

                let allPossibleStrategies = callListWithHigherStrikePrice.reduce( (_allPossibleStrategies, option2) => {


                    const option2Price = getPriceOfAsset({
                        asset: option2,
                        priceType,
                        sideType: 'SELL'
                    });
                    if(option2Price===0) return _allPossibleStrategies

                    

                    

                    let option3 = option2;


                    const callListWithHigherStrikePriceThanO3 = callListWithHigherStrikePrice.filter(o => {
                            if (o.symbol === option2.symbol || o.symbol === option3.symbol)
                                return false

                            if (o.optionDetails?.strikePrice <= option3.optionDetails?.strikePrice)
                                return false

                            return true

                        }
                        );
                    let strategies = callListWithHigherStrikePriceThanO3.reduce( (___allPossibleStrategies, option4) => {

                        


                        const option4Price = getPriceOfAsset({
                            asset: option4,
                            priceType,
                            sideType: 'BUY'
                        });
                        if(option4Price===0) return ___allPossibleStrategies
                        const middlePrice = option2.optionDetails?.strikePrice === option3.optionDetails?.strikePrice ? option2.optionDetails?.strikePrice : (option3.optionDetails?.strikePrice + option2.optionDetails?.strikePrice) / 2;

                        const stockPriceMiddleRatio = (option4.optionDetails.stockSymbolDetails.last / middlePrice) - 1;
                        if (stockPriceMiddleRatio > maxStockMiddleDistanceInPercent || stockPriceMiddleRatio < minStockMiddleDistanceInPercent)
                            return ___allPossibleStrategies

                        const stockPriceStrike4Ratio = (option4.optionDetails.stockSymbolDetails.last / option4.optionDetails?.strikePrice) - 1;

                        if (stockPriceStrike4Ratio > maxStockStrike4DistanceInPercent || stockPriceStrike4Ratio < minStockStrike4DistanceInPercent)
                            return ___allPossibleStrategies

                        // if (option.optionDetails.stockSymbolDetails.last  > option4.optionDetails?.strikePrice) return ___allPossibleStrategies
                        if (option4.optionDetails?.strikePrice < option2.optionDetails?.strikePrice)
                            return ___allPossibleStrategies



                        const diffOfBUCS_Strikes = option2.optionDetails?.strikePrice - option.optionDetails?.strikePrice;
                        const diffOfBECS_Strikes = option4.optionDetails?.strikePrice - option3.optionDetails?.strikePrice;

                        const BUCS_BECS_diffStrikesRatio = diffOfBUCS_Strikes / diffOfBECS_Strikes;

                        if (BUCS_BECS_diffStrikesRatio < MIN_BUCS_BECS_diffStrikesRatio || BUCS_BECS_diffStrikesRatio > MAX_BUCS_BECS_diffStrikesRatio)
                            return ___allPossibleStrategies

                        const isButterFly = diffOfBUCS_Strikes === diffOfBECS_Strikes &&  option2.optionDetails?.strikePrice === option3.optionDetails?.strikePrice;
                        const strategyPositions = [
                            {
                                ...option,
                                isBuy: true,
                                getQuantity: () => baseQuantity,
                                getRequiredMargin() { }
                            },
                            {
                                ...option2,
                                isSell: true,
                                getQuantity: () => baseQuantity,
                                getRequiredMargin() { }
                            },
                            {
                                ...option3,
                                isSell: true,
                                getQuantity: () => baseQuantity * BUCS_BECS_diffStrikesRatio,
                                getRequiredMargin: () => isButterFly ? 0 : diffOfBECS_Strikes
                            },
                            {
                                ...option4,
                                isBuy: true,
                                getQuantity: () => baseQuantity * BUCS_BECS_diffStrikesRatio,
                                getRequiredMargin() { }
                            }
                        ]



                        const totalCost = totalCostCalculatorCommon({
                            strategyPositions,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });









                       
                         const priceThatCauseMaxLoss = Math.max(...strategyPositions.map(strategyPosition=>strategyPosition.strikePrice))* 1.2;



                        const minProfitLossOfButterfly = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:priceThatCauseMaxLoss});



                        let priceThatCauseMaxProfit
                        if (BUCS_BECS_diffStrikesRatio > 1) {
                            priceThatCauseMaxProfit = option3.optionDetails?.strikePrice;

                        } else {
                            priceThatCauseMaxProfit = option2.optionDetails?.strikePrice;

                        }
                        let maxGainOfButterfly = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:priceThatCauseMaxProfit});

                        let profitLossRatio

                        if (minProfitLossOfButterfly > 0) {
                            profitLossRatio = 1
                        } else {

                            profitLossRatio = Math.abs(maxGainOfButterfly) / (Math.abs(maxGainOfButterfly) + Math.abs(minProfitLossOfButterfly))
                        }

                        if (profitLossRatio < minProfitLossRatio)
                            return ___allPossibleStrategies


                        const minProfitPercent = minProfitLossOfButterfly/Math.abs(totalCost);


                        

                        const strategyObj = {
                            option: {
                                ...option
                            },
                            positions:[option, option2, option3, option4],
                            strategyTypeTitle: "CALL_BUTTERFLY",
                            expectedProfitNotif,
                            name: createStrategyName([option, option2, option3, option4]),
                            isProfitEnough : isProfitEnoughFn && isProfitEnoughFn({minProfitPercent,profitLossRatio}),
                            profitPercent: totalCost>=0 ? 1 : minProfitPercent
                        }

                        return ___allPossibleStrategies.concat([strategyObj])

                    }
                    , []);

                  

                    return _allPossibleStrategies.concat(strategies)

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
        strategyName: "CALL_BUTTERFLY",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceFromHigherStrikeInPercent,
        maxStockPriceDistanceFromHigherStrikeInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "CALL_BUTTERFLY",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && minStockPriceDistanceFromHigherStrikeInPercent !== null && minStockPriceDistanceFromHigherStrikeInPercent !== -Infinity && {
                label: "minToHigh",
                value: `${((minStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && maxStockPriceDistanceFromHigherStrikeInPercent !== null && maxStockPriceDistanceFromHigherStrikeInPercent !== Infinity && {
                label: "maxToHigh",
                value: `${((maxStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof minStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && minStockPriceDistanceFromSarBeSarInPercent !== null && minStockPriceDistanceFromSarBeSarInPercent !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && maxStockPriceDistanceFromSarBeSarInPercent !== null && maxStockPriceDistanceFromSarBeSarInPercent !== Infinity && {
                label: "maxToSar",
                value: `${((maxStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, ].filter(Boolean),
            minVol
        })
    }

}