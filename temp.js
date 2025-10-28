const calcBEPSRatioStrategies = (list, {priceType, strategySubName, minQuantityFactorOfBEPS=0.6, 
    minStockPriceToSarBeSarPercent=0.25,
    min_time_to_settlement=0, max_time_to_settlement=Infinity, 
    minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {
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
                if (!buyingPut.optionDetails?.stockSymbolDetails || !buyingPut.isPut || buyingPut.vol < minVol){
                    return buyingPut
                }

                const buyingPutPrice = getPriceOfAsset({
                    asset: buyingPut,
                    priceType,
                    sideType: 'BUY'
                });
                if(buyingPutPrice===0) return buyingPut


              
                const putListWithLowerStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingPut.symbol || !_option.isPut || _option.vol < minVol)
                        return
                    if (_option.optionDetails?.strikePrice >= buyingPut.optionDetails?.strikePrice)
                        return


                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false


                    return true

                  
                }
                );

                

                let allPossibleStrategies = putListWithLowerStrikePrice.reduce( (_allPossibleStrategies, sellingPut) => {

                    const stockPriceLowerStrikeRatio = (sellingPut.optionDetails.stockSymbolDetails.last / sellingPut.optionDetails?.strikePrice) - 1;

                    if(stockPriceLowerStrikeRatio < minStockPriceDistanceInPercent || stockPriceLowerStrikeRatio > maxStockPriceDistanceInPercent){
                        return _allPossibleStrategies
                    }


                  

                    const sellingPutPrice = getPriceOfAsset({
                        asset: sellingPut,
                        priceType,
                        sideType: 'SELL'
                    });
                    if(sellingPutPrice===0) return _allPossibleStrategies
                   


                    let __allPossibleStrategies = putListWithLowerStrikePrice.reduce( (___allPossibleStrategies, anotherSellingPut) => {


                     


                        const anotherSellingPutPrice = getPriceOfAsset({
                            asset: anotherSellingPut,
                            priceType,
                            sideType: 'SELL'
                        });
                        if (anotherSellingPutPrice === 0) return ___allPossibleStrategies


                        const maxProfitOfSellingPut = anotherSellingPutPrice;


                        const diffOfBEPS_Strikes = buyingPut.optionDetails?.strikePrice - anotherSellingPut.optionDetails?.strikePrice;
                        const strategyPositionsOfBEPS = [
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
                                getRequiredMargin: () => diffOfBEPS_Strikes
                            },
                        ]



                        const totalCostOfBEPS = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBEPS,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMaxLossOfBEPS = Math.max(...strategyPositionsOfBEPS.map(strategyPosition=>strategyPosition.strikePrice))* 1.2;



                        const maxLossOfBEPS = totalCostOfBEPS + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBEPS, stockPrice:priceThatCauseMaxLossOfBEPS});



                        const quantityFactorOfBEPS = Math.abs(maxProfitOfSellingPut/maxLossOfBEPS);


                        const strategyPositionsOfBEPS_RATIO = [
                            {
                                ...buyingPut,
                                isBuy: true,
                                getQuantity: () => 1*quantityFactorOfBEPS,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingPut,
                                isSell: true,
                                getQuantity: () => 1*quantityFactorOfBEPS,
                                getRequiredMargin: () => diffOfBEPS_Strikes
                            },
                            {
                                ...anotherSellingPut,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin: () => 0
                            },
                        ]


                        // if(buyingPut.symbol==='ضفزر1010' &&  sellingPut.symbol==='ضفزر1008' && sellingPut.symbol==='طفزر1010' ){
                        //     console.log(34324)
                        // }


                        if (quantityFactorOfBEPS < minQuantityFactorOfBEPS)
                            return ___allPossibleStrategies



                        const breakevenList = findBreakevenList({
                            positions:strategyPositionsOfBEPS_RATIO, 
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const breakeven = breakevenList[0];


                        const stockPriceToSarBeSarPercent = -((breakeven/ sellingPut.optionDetails.stockSymbolDetails.last) -1);



                        if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSarPercent)
                                return ___allPossibleStrategies

                        return ___allPossibleStrategies.concat([{
                            option: {
                                ...buyingPut
                            },
                            positions:[buyingPut, sellingPut, anotherSellingPut],
                            strategyTypeTitle: "BEPS_Ratio",
                            expectedProfitNotif,
                            name: createStrategyName([buyingPut, sellingPut, anotherSellingPut]),
                            profitPercent: stockPriceToSarBeSarPercent
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
        strategyName: "BEPS_Ratio",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceInPercent,
        maxStockPriceDistanceInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BEPS_Ratio",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceInPercent,
            maxStockPriceDistanceInPercent,
            minVol
        })
    }

}