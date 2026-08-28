const calcBESRatio_BY_BUS_BES_Strategies = ({ filteredBesList, priceType, strategySubName,
    minProfitToFilter,
    isProfitEnoughFn,
    min_time_to_settlement = -Infinity, max_time_to_settlement = Infinity,
    minStockPriceToSarBeSar = -Infinity, maxStockPriceToSarBeSar = Infinity,
    minVol = CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif = false, ...restConfig }) => {

    const enrichedList = filteredBesList.map(bes => {


        const { optionListOfSameDate, strategyPositions, maxLoss: maxLossOfBES, positions: besPositions } = bes;

        
        const strikes = strategyPositions.map(strategyPosition => strategyPosition.strikePrice);

        // شمارش تعداد تکرار هر آیتم
        const countMap = strikes.reduce((acc, item) => {
            acc[item] = (acc[item] || 0) + 1;
            return acc;
        }, {});

       // فقط آیتم‌هایی که دقیقاً یک بار ظاهر شده‌اند
        const noRepeatedStrikes = strikes.filter(item => countMap[item] === 1);
        const maxStrikePrice = Math.max(...noRepeatedStrikes);
        const maxStrikeOption = strategyPositions.find(sp=>sp.strikePrice===maxStrikePrice);


        

        








        const lowerStrikePuts = optionListOfSameDate.filter(_option => {
            if (!_option.isPut)
                return false
            if (_option.optionDetails?.strikePrice > maxStrikePrice)
                return false
            if (_option.symbol ===maxStrikeOption.symbol && maxStrikeOption.isPut && maxStrikeOption.isBuy)
                return false

            if (!_option.optionDetails.stockSymbolDetails) return false

            return true
        }
        );


        const allPossibleStrategies = lowerStrikePuts.reduce((_allPossibleStrategies, sellingPut) => {
            const sellingPutPrice = getPriceOfAsset({
                asset: sellingPut,
                priceType,
                sideType: 'SELL'
            });

            if (sellingPutPrice === 0) return _allPossibleStrategies

            const quantityFactorOfsellingPut = Math.abs(maxLossOfBES / sellingPutPrice);


            const strategyPositionsOfBESRatio_BY_BUS_BES = [
                ...strategyPositions,
                {
                    ...sellingPut,
                    isSell: true,
                    getQuantity: () => 1 * quantityFactorOfsellingPut * 1.1,
                    getRequiredMargin: () => {
                        return (calculateOptionMargin({
                            priceSpot: sellingPut.optionDetails.stockSymbolDetails.last,
                            strikePrice: sellingPut.optionDetails.strikePrice,
                            contractSize: 1000,
                            optionPremium: sellingPut.last,
                            optionType: sellingPut.isCall ? "call" : "put"
                        })?.required || 0) / 1000;
                    }
                },
            ]


            const totalCost = totalCostCalculatorCommon({
                strategyPositions:strategyPositionsOfBESRatio_BY_BUS_BES,
                getPrice: (strategyPosition) => getPriceOfAsset({
                    asset: strategyPosition,
                    priceType,
                    sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                })
            });

            const breakevenList = findBreakevenList({
                positions: strategyPositionsOfBESRatio_BY_BUS_BES,
                getPrice: (strategyPosition) => getPriceOfAsset({
                    asset: strategyPosition,
                    priceType,
                    sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                })
            });

            const breakeven = breakevenList.length ? Math.max(...breakevenList) : null;

            const priceThatCauseMinProfit = Math.max(...strategyPositionsOfBESRatio_BY_BUS_BES.map(strategyPosition => strategyPosition.strikePrice)) * 1.2;
            const minProfit = totalCost + calcOffsetGainOfPositions({ strategyPositions:strategyPositionsOfBESRatio_BY_BUS_BES, stockPrice: priceThatCauseMinProfit });
            const minProfitPercent = minProfit / Math.abs(totalCost);

            let isFullBodyProfitable, stockPriceToSarBeSarPercent;
            if (!breakeven && quantityFactorOfsellingPut > 0) {
                isFullBodyProfitable = true;
            } else if (!breakeven) {
                return _allPossibleStrategies
            }
            else {
                if (!sellingPut?.optionDetails?.stockSymbolDetails?.last) return _allPossibleStrategies

                stockPriceToSarBeSarPercent = (breakeven / sellingPut.optionDetails.stockSymbolDetails.last) - 1;
                if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSar || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSar)
                    return _allPossibleStrategies
            }



            return _allPossibleStrategies.concat([{
                option: {
                    ...sellingPut
                },
                positions: [...besPositions, sellingPut],
                strategyTypeTitle: "BESRatio_BY_BUS_BES",
                expectedProfitNotif,
                minProfitToFilter,
                stockPriceToSarBeSarPercent,
                isWholeProfitable: isFullBodyProfitable,
                isProfitEnough: isProfitEnoughFn && isProfitEnoughFn(minProfitPercent),
                name: createStrategyName([...besPositions, sellingPut],),
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
        strategyName: "BESRatio_BY_BUS_BES",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceToSarBeSar,
        maxStockPriceToSarBeSar,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BESRatio_BY_BUS_BES",
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