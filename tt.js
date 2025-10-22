const IRON_BUTTERFLY_BUPS_strategyObjCreator = (option, option2, option3, option4,
    { minStockMiddleDistanceInPercent, maxStockMiddleDistanceInPercent,
        minStockPriceDistanceFromOption4StrikeInPercent, maxStockPriceDistanceFromOption4StrikeInPercent,
        MIN_BUPS_BECS_diffStrikesRatio, MAX_BUPS_BECS_diffStrikesRatio, expectedProfitNotif, priceType, minProfitLossRatio
    }) => {

        if(!option?.optionDetails ||  !option2?.optionDetails || !option3?.optionDetails || !option4?.optionDetails){
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


  

    const diffOfBUPS_Strikes = option2.optionDetails?.strikePrice - option.optionDetails?.strikePrice;
    const diffOfBECS_Strikes = option4.optionDetails?.strikePrice - option3.optionDetails?.strikePrice;

    const BUPS_BECS_diffStrikesRatio = diffOfBUPS_Strikes / diffOfBECS_Strikes;

    if (BUPS_BECS_diffStrikesRatio < MIN_BUPS_BECS_diffStrikesRatio || BUPS_BECS_diffStrikesRatio > MAX_BUPS_BECS_diffStrikesRatio)
        return




    


    const strategyPositions = [
        {
            ...option,
            isBuy: true,
            getQuantity: () => baseQuantity,
            getRequiredMargin() { }
        },
        {
            ...option2,
            isSell:true,
            getQuantity:()=> baseQuantity,
            getRequiredMargin:()=>diffOfBUPS_Strikes
        },
        {
            ...option3,
            isSell:true,
            getQuantity:()=> baseQuantity * BUPS_BECS_diffStrikesRatio ,
            getRequiredMargin:()=>diffOfBECS_Strikes
        },
        {
            ...option4,
            isBuy:true,
            getQuantity:()=> baseQuantity * BUPS_BECS_diffStrikesRatio,
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
    if (diffOfBUPS_Strikes > diffOfBECS_Strikes) {
        priceThatCauseMaxProfit = option3.optionDetails?.strikePrice;

    } else {

        priceThatCauseMaxProfit = option2.optionDetails?.strikePrice;

    }
    let maxGainOfButterfly = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:priceThatCauseMaxProfit});
    let profitLossPresent

    if (minProfitLossOfButterfly > 0) {
        profitLossPresent = 1
    } else {

        profitLossPresent = Math.abs(maxGainOfButterfly) / (Math.abs(maxGainOfButterfly) + Math.abs(minProfitLossOfButterfly))
    }

    if (profitLossPresent < minProfitLossRatio)
        return

    const strategyObj = {
        option: {
            ...option
        },
        positions: [option, option2, option3, option4],
        strategyTypeTitle: "IRON_BUTTERFLY_BUPS",
        expectedProfitNotif,
        name: createStrategyName([option, option2, option3, option4]),
        profitPercent: profitLossPresent
    }

    return strategyObj

}