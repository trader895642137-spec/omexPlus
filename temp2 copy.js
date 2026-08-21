const calcBUCS_BEPS_LongPutStrategies = ({ filteredBusList, priceType, strategySubName,
    minProfitToFilter,
    isProfitEnoughFn,
    min_time_to_settlement = -Infinity, max_time_to_settlement = Infinity,
    minStockPriceToSarBeSar = -Infinity, maxStockPriceToSarBeSar = Infinity,
    minVol = CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif = false, ...restConfig }) => {

    const enrichedList = filteredBusList.map(bus => {


        const { optionListOfSameDate, strategyPositions, maxProfit: maxProfitOfBUS, positions: busPositions } = bus;

        if(!optionListOfSameDate){
            console.log(24234);
            
        }
        const strikes = strategyPositions.map(strategyPosition => strategyPosition.strikePrice);
        const uniqueStrikes = [...new Set(strikes)];
        const maxStrikePrice = Math.max(...uniqueStrikes);

        const higherStrikePuts = optionListOfSameDate.filter(_option => {
            if (!_option.isPut)
                return false
            if (_option.optionDetails?.strikePrice < maxStrikePrice)
                return false

            if (!_option.optionDetails.stockSymbolDetails) return false

            return true
        }
        );


        const allPossibleStrategies = higherStrikePuts.reduce((_allPossibleStrategies, buyingPut) => {
            const buyingPutPrice = getPriceOfAsset({
                asset: buyingPut,
                priceType,
                sideType: 'BUY'
            });

            if (buyingPutPrice === 0) return _allPossibleStrategies

            const quantityFactorOfBuyingPut = Math.abs(maxProfitOfBUS / buyingPutPrice);

            const strategyPositionsOfBUCS_BEPS_LongPut = [
                ...strategyPositions,
                {
                    ...buyingPut,
                    isBuy: true,
                    getQuantity: () => 1 * quantityFactorOfBuyingPut / 1.3,
                    getRequiredMargin() { }
                },
            ]


            const totalCost = totalCostCalculatorCommon({
                strategyPositions:strategyPositionsOfBUCS_BEPS_LongPut,
                getPrice: (strategyPosition) => getPriceOfAsset({
                    asset: strategyPosition,
                    priceType,
                    sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                })
            });

            const breakevenList = findBreakevenList({
                positions: strategyPositionsOfBUCS_BEPS_LongPut,
                getPrice: (strategyPosition) => getPriceOfAsset({
                    asset: strategyPosition,
                    priceType,
                    sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                })
            });

            const breakeven = breakevenList.length ? Math.max(...breakevenList) : null;

            const priceThatCauseMinProfit = Math.max(...strategyPositionsOfBUCS_BEPS_LongPut.map(strategyPosition => strategyPosition.strikePrice)) * 1.2;
            const minProfit = totalCost + calcOffsetGainOfPositions({ strategyPositions:strategyPositionsOfBUCS_BEPS_LongPut, stockPrice: priceThatCauseMinProfit });
            const minProfitPercent = minProfit / Math.abs(totalCost);

            let isFullBodyProfitable, stockPriceToSarBeSarPercent;
            if (!breakeven && quantityFactorOfBuyingPut > 0) {
                isFullBodyProfitable = true;
            } else if (!breakeven) {
                return _allPossibleStrategies
            }
            else {
                if (!buyingPut?.optionDetails?.stockSymbolDetails?.last) return _allPossibleStrategies

                stockPriceToSarBeSarPercent = (breakeven / buyingPut.optionDetails.stockSymbolDetails.last) - 1;
                if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSar || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSar)
                    return _allPossibleStrategies
            }



            return _allPossibleStrategies.concat([{
                option: {
                    ...buyingPut
                },
                positions: [...busPositions, buyingPut],
                strategyTypeTitle: "BUCS_BEPS_LongPut",
                expectedProfitNotif,
                minProfitToFilter,
                stockPriceToSarBeSarPercent,
                isWholeProfitable: isFullBodyProfitable,
                isProfitEnough: isProfitEnoughFn && isProfitEnoughFn(minProfitPercent),
                name: createStrategyName([...busPositions, buyingPut],),
                // profitPercent: isFullBodyProfitable ? 1: -stockPriceToSarBeSarPercent 
                profitPercent: minProfitPercent
            }])




        }, []);

        return {
            ...strategyPositions[0],
            allPossibleStrategies
        }


    })

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "BUCS_BEPS_LongPut",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceToSarBeSar,
        maxStockPriceToSarBeSar,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BUCS_BEPS_LongPut",
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