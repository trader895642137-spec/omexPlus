const calcBUPS_Long_PutStrategies = (list, {priceType, strategySubName, 
    minProfitToFilter,
    isProfitEnoughFn,
    min_time_to_settlement=-Infinity, max_time_to_settlement=Infinity, 
    minStockPriceToSarBeSar=-Infinity,maxStockPriceToSarBeSar=Infinity,
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

            const _enrichedList = optionListOfSameDate.map(buyingPut => {

                if(!buyingPut.optionDetails?.stockSymbolDetails || !buyingPut.isPut  ) return buyingPut


                const buyingPutPrice = getPriceOfAsset({
                    asset: buyingPut,
                    priceType,
                    sideType: 'BUY'
                });
                if(buyingPutPrice===0) return buyingPut

                const optionListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingPut.symbol || !_option.isPut )
                        return false
                    if (_option.optionDetails?.strikePrice <= buyingPut.optionDetails?.strikePrice)
                        return false


                    return true
                    

                }
                );

                let allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (_allPossibleStrategies, sellingPut) => {



                    
                    const sellingPutPrice = getPriceOfAsset({
                        asset: sellingPut,
                        priceType,
                        sideType: 'SELL'
                    });
                    if(sellingPutPrice===0) return _allPossibleStrategies



                    const putListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {
                        if (!_option.isPut)
                            return false
                        if (_option.optionDetails?.strikePrice <= sellingPut.optionDetails?.strikePrice)
                            return false

                        return true

                    }
                    );


                    let __allPossibleStrategies = putListWithHigherStrikePrice.reduce( (___allPossibleStrategies, anotherBuyingPut) => {


                        const anotherBuyingPutPrice = getPriceOfAsset({
                            asset: anotherBuyingPut,
                            priceType,
                            sideType: 'BUY'
                        });
                        if(anotherBuyingPutPrice===0) return ___allPossibleStrategies


                        const strategyPositionsOfBUPS = [
                            {
                                ...buyingPut,
                                isBuy: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingPut,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                        ]
                        const totalCostOfBUPS = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBUPS,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMaxPofitOfBUPS = Math.max(...strategyPositionsOfBUPS.map(strategyPosition=>strategyPosition.strikePrice))* 1.2;



                        const maxProfitOfBUPS = totalCostOfBUPS + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBUPS, stockPrice:priceThatCauseMaxPofitOfBUPS});



                        const quantityFactorOfBuyingPut = Math.abs(maxProfitOfBUPS/anotherBuyingPutPrice);

                        const diffOfBUPS_Strikes = sellingPut.optionDetails?.strikePrice - buyingPut.optionDetails?.strikePrice;



                        const strategyPositionsOfBUPS_Long_Put = [
                            {
                                ...buyingPut,
                                isBuy: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingPut,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin: () => diffOfBUPS_Strikes
                            },
                            {
                                ...anotherBuyingPut,
                                isBuy: true,
                                getQuantity: () => 1*quantityFactorOfBuyingPut/1.3,
                                getRequiredMargin() { }
                            },
                        ]


                        const totalCostOfBUPS_Long_Put = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBUPS_Long_Put,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMinProfitOfBUPS_Long_Put = Math.max(...strategyPositionsOfBUPS_Long_Put.map(strategyPosition=>strategyPosition.strikePrice)) * 1.3;
                      

                        const minProfitOfBUPS_Long_Put = totalCostOfBUPS_Long_Put + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBUPS_Long_Put, stockPrice:priceThatCauseMinProfitOfBUPS_Long_Put});

                        const minProfitPercentOfBUPS_Long_Put = minProfitOfBUPS_Long_Put / Math.abs(totalCostOfBUPS_Long_Put);

                        const breakevenList = findBreakevenList({
                            positions:strategyPositionsOfBUPS_Long_Put, 
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const breakeven = breakevenList.length? Math.max(...breakevenList) : null;



                        let isFullBodyProfitable,stockPriceToSarBeSarPercent;
                        if(!breakeven && quantityFactorOfBuyingPut>0){
                            isFullBodyProfitable = true;
                        }else if(!breakeven){
                            return _allPossibleStrategies
                        }
                        else{
                            if(!buyingPut?.optionDetails?.stockSymbolDetails?.last) return _allPossibleStrategies

                            stockPriceToSarBeSarPercent = (breakeven /buyingPut.optionDetails.stockSymbolDetails.last ) - 1;

                        
                            if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSar || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSar)
                                return _allPossibleStrategies
                        }

                        

                        return ___allPossibleStrategies.concat([{
                            option: {
                                ...buyingPut
                            },
                            positions:[buyingPut, sellingPut, anotherBuyingPut],
                            strategyTypeTitle: "BUPS_LONG_PUT",
                            expectedProfitNotif,
                            minProfitToFilter,
                            stockPriceToSarBeSarPercent,
                            isWholeProfitable:isFullBodyProfitable,
                            isProfitEnough : isProfitEnoughFn && isProfitEnoughFn(minProfitPercentOfBUPS_Long_Put),
                            name: createStrategyName([buyingPut, sellingPut, anotherBuyingPut]),
                            // profitPercent: isFullBodyProfitable ? 1: -stockPriceToSarBeSarPercent 
                            profitPercent: isFullBodyProfitable ? 10: minProfitPercentOfBUPS_Long_Put 
                        }])
                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

                }
                , []);

                return {
                    ...buyingPut,
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
        strategyName: "BUPS_LONG_PUT",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceToSarBeSar,
        maxStockPriceToSarBeSar,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BUPS_LONG_PUT",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceToSarBeSar,
            maxStockPriceToSarBeSar,
            minVol
        })
    }

}