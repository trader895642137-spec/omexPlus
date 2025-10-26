const calcBECSRatioStrategies = (list, {priceType, strategySubName, minQuantityFactorOfBECS=0.6, 
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

            const _enrichedList = optionListOfSameDate.map(buyingCall => {
                if (!buyingCall.optionDetails?.stockSymbolDetails || !buyingCall.isCall || buyingCall.vol < minVol){
                    return buyingCall
                }

                const buyingCallPrice = getPriceOfAsset({
                    asset: buyingCall,
                    priceType,
                    sideType: 'BUY'
                });
                if(buyingCallPrice===0) return buyingCall


              
                const callListWithLowerStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingCall.symbol || !_option.isCall || _option.vol < minVol)
                        return
                    if (_option.optionDetails?.strikePrice >= buyingCall.optionDetails?.strikePrice)
                        return


                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceLowerStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    return stockPriceLowerStrikeRatio > minStockPriceDistanceInPercent && stockPriceLowerStrikeRatio < maxStockPriceDistanceInPercent

                }
                );

                const putListLowerStrikeThanBuyingCall = optionListOfSameDate.filter(_option => {
                    if (!_option.isPut || _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice > buyingCall.optionDetails?.strikePrice)
                        return false


                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    return true

                }
                );

                let allPossibleStrategies = callListWithLowerStrikePrice.reduce( (_allPossibleStrategies, sellingCall) => {



                  

                    const sellingCallPrice = getPriceOfAsset({
                        asset: sellingCall,
                        priceType,
                        sideType: 'SELL'
                    });
                    if(sellingCallPrice===0) return _allPossibleStrategies
                   


                    let __allPossibleStrategies = putListLowerStrikeThanBuyingCall.reduce( (___allPossibleStrategies, sellingPut) => {


                     


                        const sellingPutPrice = getPriceOfAsset({
                            asset: sellingPut,
                            priceType,
                            sideType: 'SELL'
                        });
                        if (sellingPutPrice === 0) return ___allPossibleStrategies


                        const maxProfitOfSellingPut = sellingPutPrice;


                        const diffOfBECS_Strikes = buyingCall.optionDetails?.strikePrice - sellingCall.optionDetails?.strikePrice;
                        const strategyPositionsOfBECS = [
                            {
                                ...buyingCall,
                                isBuy: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingCall,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin: () => diffOfBECS_Strikes
                            },
                        ]



                        const totalCostOfBECS = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBECS,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMaxLossOfBECS = Math.max(...strategyPositionsOfBECS.map(strategyPosition=>strategyPosition.strikePrice))* 1.2;
                        const priceThatCauseMaxProfitOfBECS = Math.min(...strategyPositionsOfBECS.map(strategyPosition=>strategyPosition.strikePrice))/ 1.2;



                        const maxLossOfBECS = totalCostOfBECS + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBECS, stockPrice:priceThatCauseMaxLossOfBECS});
                        const maxProfitOfBECS = totalCostOfBECS + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBECS, stockPrice:priceThatCauseMaxProfitOfBECS});



                        const quantityFactorOfBECS = Math.abs(maxProfitOfSellingPut/maxLossOfBECS);


                        if (quantityFactorOfBECS < minQuantityFactorOfBECS)
                            return ___allPossibleStrategies



                        const sarBeSar =  sellingPut.optionDetails?.strikePrice -  sellingPutPrice - (maxProfitOfBECS * quantityFactorOfBECS);


                        const stockPriceToSarBeSarPercent = -((sarBeSar/ sellingCall.optionDetails.stockSymbolDetails.last) -1);



                        if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSarPercent)
                                return ___allPossibleStrategies

                        return ___allPossibleStrategies.concat([{
                            option: {
                                ...buyingCall
                            },
                            positions:[buyingCall, sellingCall, sellingPut],
                            strategyTypeTitle: "BECS_Ratio",
                            expectedProfitNotif,
                            name: createStrategyName([buyingCall, sellingCall, sellingPut]),
                            profitPercent: stockPriceToSarBeSarPercent
                        }])
                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

                }
                , []);

                return {
                    ...buyingCall,
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
        strategyName: "BECS_Ratio",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceInPercent,
        maxStockPriceDistanceInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BECS_Ratio",
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