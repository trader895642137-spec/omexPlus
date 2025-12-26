const IRON_BUTTERFLY_CONDOR_BUCS_strategyObjCreator = (option, option2, option3, option4,
    { minStockMiddleDistanceInPercent, maxStockMiddleDistanceInPercent,
        minStockPriceDistanceFromOption4StrikeInPercent, maxStockPriceDistanceFromOption4StrikeInPercent,
        MIN_BUCS_BEPS_diffStrikesRatio, MAX_BUCS_BEPS_diffStrikesRatio, expectedProfitNotif, priceType, 
        minProfitLossRatio,
        BUCS_BEPS_COST_notProperRatio=15,
        strategyTypeTitle="IRON_BUT_CONDOR_BUCS"
    }) => {

    if (!option?.optionDetails || !option2?.optionDetails || !option3?.optionDetails || !option4?.optionDetails) {
        return
    }






    const middlePrice = option2.optionDetails?.strikePrice === option3.optionDetails?.strikePrice ? option2.optionDetails?.strikePrice : (option3.optionDetails?.strikePrice + option2.optionDetails?.strikePrice) / 2;

    const stockPriceMiddleRatio = (option4.optionDetails.stockSymbolDetails.last / middlePrice) - 1;
    if (stockPriceMiddleRatio > maxStockMiddleDistanceInPercent || stockPriceMiddleRatio < minStockMiddleDistanceInPercent)
        return 

    const stockPriceStrike4Ratio = (option4.optionDetails.stockSymbolDetails.last / option4.optionDetails?.strikePrice) - 1;

    if (stockPriceStrike4Ratio > maxStockPriceDistanceFromOption4StrikeInPercent || stockPriceStrike4Ratio < minStockPriceDistanceFromOption4StrikeInPercent)
        return 

    // if (option.optionDetails.stockSymbolDetails.last  > option4.optionDetails?.strikePrice) return 
    if (option4.optionDetails?.strikePrice < option2.optionDetails?.strikePrice)
        return 

 

    const diffOfBUCS_Strikes = option2.optionDetails?.strikePrice - option.optionDetails?.strikePrice;
    const diffOfBEPS_Strikes = option4.optionDetails?.strikePrice - option3.optionDetails?.strikePrice;

    const BUCS_BEPS_diffStrikesRatio = diffOfBUCS_Strikes / diffOfBEPS_Strikes;

    if (BUCS_BEPS_diffStrikesRatio < MIN_BUCS_BEPS_diffStrikesRatio || BUCS_BEPS_diffStrikesRatio > MAX_BUCS_BEPS_diffStrikesRatio)
        return 



    const strategyPositionsBUCS = [
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
        
    ]


    const strategyPositionsBEPS = [
        {
            ...option3,
            isSell: true,
            getQuantity: () => baseQuantity,
            getRequiredMargin() { }
        },
        {
            ...option4,
            isBuy: true,
            getQuantity: () => baseQuantity,
            getRequiredMargin() { }
        }
        
    ]



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
            getQuantity: () => baseQuantity * BUCS_BEPS_diffStrikesRatio,
            getRequiredMargin() { }
        },
        {
            ...option4,
            isBuy: true,
            getQuantity: () => baseQuantity * BUCS_BEPS_diffStrikesRatio,
            getRequiredMargin() { }
        }
    ]


    const totalCostBUCS = totalCostCalculatorCommon({
        strategyPositions:strategyPositionsBUCS,
        getPrice: (strategyPosition) => getPriceOfAsset({
            asset: strategyPosition,
            priceType,
            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
        })
    });
    const totalCostBEPS = totalCostCalculatorCommon({
        strategyPositions:strategyPositionsBEPS,
        getPrice: (strategyPosition) => getPriceOfAsset({
            asset: strategyPosition,
            priceType,
            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
        })
    });

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

    

    const minProfitPercent = (minProfitLossOfButterfly/Math.abs(totalCost))*100;






    if(hasGreaterRatio({num1:totalCostBUCS,num2:totalCostBEPS,properRatio:BUCS_BEPS_COST_notProperRatio}) && minProfitPercent <2){
        return 
    }




    let priceThatCauseMaxProfit
    if (diffOfBUCS_Strikes > diffOfBEPS_Strikes) {
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
        return 


    const maxStrike = Math.max(...strategyPositions.map(strategyPosition=>strategyPosition.strikePrice));
    const stockPrice = option.optionDetails.stockSymbolDetails.last;

    if( (stockPrice > (maxStrike* 1.1)) &&    minProfitPercent<2){
        return
    }

    const strategyObj = {
        option: {
            ...option
        },
        positions: [option, option2, option3, option4],
        strategyTypeTitle,
        expectedProfitNotif,
        name: createStrategyName([option, option2, option3, option4]),
        profitPercent: minProfitPercent
    }



    return strategyObj

}