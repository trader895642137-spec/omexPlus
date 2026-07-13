const calcBUCSRatioStrategies = (list, {priceType, strategySubName,
    minQuantityFactorOfBUCS=0.6,  maxQuantityFactorOfBUCS=2.1, 
    BUCSSOptionListIgnorer=generalConfig.BUCSSOptionListIgnorer, 
    minProfitToFilter,
    min_time_to_settlement=-Infinity, max_time_to_settlement=Infinity, 
    minStockPriceToSarBeSarPercent=-Infinity,maxStockPriceToSarBeSarPercent=-.15,
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

            const _enrichedList = optionListOfSameDate.map(buyingCall => {

                if (BUCSSOptionListIgnorer({
                    option:buyingCall,
                    minVol
                }))
                    return buyingCall


                const buyingCallPrice = getPriceOfAsset({
                    asset: buyingCall,
                    priceType,
                    sideType: 'BUY'
                });
                if(buyingCallPrice===0) return buyingCall

                const optionListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingCall.symbol || !_option.isCall || _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice <= buyingCall.optionDetails?.strikePrice)
                        return false


                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false


                    return true
                    

                }
                );

                let allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (_allPossibleStrategies, sellingCall) => {



                    
                    const sellingCallPrice = getPriceOfAsset({
                        asset: sellingCall,
                        priceType,
                        sideType: 'SELL'
                    });
                    if(sellingCallPrice===0) return _allPossibleStrategies



                    let __allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (___allPossibleStrategies, anotherSellingCall) => {


                        const anotherSellingCallPrice = getPriceOfAsset({
                            asset: anotherSellingCall,
                            priceType,
                            sideType: 'SELL'
                        });
                        if(anotherSellingCallPrice===0) return ___allPossibleStrategies



                        const maxProfitOfSellingCall = anotherSellingCallPrice;

                        const strategyPositionsOfBUCS = [
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
                                getRequiredMargin() { }
                            },
                        ]
                        const totalCostOfBUCS = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBUCS,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMaxLossOfBUCS = Math.min(...strategyPositionsOfBUCS.map(strategyPosition=>strategyPosition.strikePrice))/ 1.2;
                        const priceThatCauseMaxPofitOfBUCS = Math.max(...strategyPositionsOfBUCS.map(strategyPosition=>strategyPosition.strikePrice))* 1.2;



                        const maxLossOfBUCS = totalCostOfBUCS + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBUCS, stockPrice:priceThatCauseMaxLossOfBUCS});
                        const maxProfitOfBUCS = totalCostOfBUCS + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBUCS, stockPrice:priceThatCauseMaxPofitOfBUCS});



                        const quantityFactorOfBUCS = Math.abs(maxProfitOfSellingCall/maxLossOfBUCS);


                        if (quantityFactorOfBUCS < minQuantityFactorOfBUCS  || quantityFactorOfBUCS > maxQuantityFactorOfBUCS)
                            return ___allPossibleStrategies



                        const strategyPositionsOfBUCS_RATIO = [
                            {
                                ...buyingCall,
                                isBuy: true,
                                getQuantity: () => 1*quantityFactorOfBUCS/1.2,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingCall,
                                isSell: true,
                                getQuantity: () => 1*quantityFactorOfBUCS/1.2,
                                getRequiredMargin() { }
                            },
                            {
                                ...anotherSellingCall,
                                isSell: true,
                                getQuantity: () => 1,

                                getRequiredMargin: () => {
                                    return (calculateOptionMargin({
                                        priceSpot: anotherSellingCall.optionDetails.stockSymbolDetails.last,
                                        strikePrice: anotherSellingCall.optionDetails.strikePrice,
                                        contractSize: 1000,
                                        optionPremium: anotherSellingCall.last,
                                        optionType: anotherSellingCall.isCall ? "call" : "put"
                                    })?.required || 0) / 1000;
                                }
                            },
                        ]


                        const totalCostOfBUCS_RATIO = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBUCS_RATIO,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMaxLossOfBUCS_RATIO = Math.max(...strategyPositionsOfBUCS_RATIO.map(strategyPosition=>strategyPosition.strikePrice)) * 1.3;
                        const priceThatCauseMaxProfitOfBUCS_RATIO = anotherSellingCall.optionDetails.strikePrice;
                        const priceThatCauseMinProfitOfBUCS_RATIO = Math.min(...strategyPositionsOfBUCS_RATIO.map(strategyPosition=>strategyPosition.strikePrice)) / 1.3;



                        if(buyingCall.symbol==='ضملي5032' && sellingCall.symbol==='ضملي5033' && anotherSellingCall.symbol==='ضملي5033'){

                            console.log(23423);
                            
                        }

                        const maxLossOfBUCS_RATIO = totalCostOfBUCS_RATIO + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBUCS_RATIO, stockPrice:priceThatCauseMaxLossOfBUCS_RATIO});
                        const maxProfitOfBUCS_RATIO = totalCostOfBUCS_RATIO + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBUCS_RATIO, stockPrice:priceThatCauseMaxProfitOfBUCS_RATIO});
                        const minProfitOfBUCS_RATIO = totalCostOfBUCS_RATIO + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBUCS_RATIO, stockPrice:priceThatCauseMinProfitOfBUCS_RATIO});


                        const maxProfitPercentOfBUCS_RATIO = maxProfitOfBUCS_RATIO / Math.abs(totalCostOfBUCS_RATIO);
                        const minProfitPercentOfBUCS_RATIO = minProfitOfBUCS_RATIO / Math.abs(totalCostOfBUCS_RATIO);

                        const breakevenList = findBreakevenList({
                            positions:strategyPositionsOfBUCS_RATIO, 
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const breakeven = breakevenList[0];


                        let isFullBodyProfitable,stockPriceToSarBeSarPercent;
                        if(!breakeven && maxLossOfBUCS_RATIO>0){
                            isFullBodyProfitable = true;
                        }else if(!breakeven){
                            return _allPossibleStrategies
                        }else{
                            if(!anotherSellingCall?.optionDetails?.stockSymbolDetails?.last) return _allPossibleStrategies

                            stockPriceToSarBeSarPercent = (anotherSellingCall.optionDetails.stockSymbolDetails.last/breakeven) -1

                        
                            if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSarPercent || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSarPercent)
                                return _allPossibleStrategies
                        }

                        

                        return ___allPossibleStrategies.concat([{
                            option: {
                                ...buyingCall
                            },
                            positions:[buyingCall, sellingCall, anotherSellingCall],
                            strategyTypeTitle: "BUCS_RATIO",
                            expectedProfitNotif,
                            minProfitToFilter,
                            stockPriceToSarBeSarPercent,
                            isWholeProfitable:isFullBodyProfitable,
                            name: createStrategyName([buyingCall, sellingCall, anotherSellingCall]),
                            // profitPercent: isFullBodyProfitable ? 1: -stockPriceToSarBeSarPercent 
                            profitPercent: isFullBodyProfitable ? 10: minProfitPercentOfBUCS_RATIO 
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
        strategyName: "BUCS_RATIO",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceToSarBeSarPercent,
        maxStockPriceToSarBeSarPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BUCS_RATIO",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceToSarBeSarPercent,
            maxStockPriceToSarBeSarPercent,
            minVol
        })
    }

}