const isIgnored = ()=>{


    
        let hasProfitFilter=false;
        if(ignoreStrategyObj.profitPercent != null){
            hasProfitFilter = true;
        }

        const isProfitFilterPass = ()=> strategy.profitPercent >= ignoreStrategyObj.profitPercent

        if(hasProfitFilter && !isProfitFilterPass()) return true


        let hasToSarBeSarFilter=false;
        if(ignoreStrategyObj.toSarBeSar !=null) {
            hasToSarBeSarFilter = true;
        }

        const isToSarBeSarFilterPass = () => {
            if (strategy.stockPriceToSarBeSarPercent == null) return true

            if (ignoreStrategyObj.toSarBeSar < 0) {

                return strategy.stockPriceToSarBeSarPercent <= ignoreStrategyObj.toSarBeSar
            } else {
                return strategy.stockPriceToSarBeSarPercent >= ignoreStrategyObj.toSarBeSar
            }

        }

        if(hasToSarBeSarFilter && !isToSarBeSarFilterPass()) return true
        
        const hasAnyFilter  = hasProfitFilter || hasToSarBeSarFilter;

        if(hasAnyFilter) {
            return false

        }else {
            return true
        }

}