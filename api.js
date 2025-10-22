import { OMEXApi } from "./omexApi"

export const getOptionPortfolioListForFilterListIgnore = async ()=>{
   const portfolioList = await OMEXApi.getOptionPortfolioList();

   console.log(portfolioList.map(instrumentInfo=>`ALL@${instrumentInfo.instrumentName}`).join(' '));

}


export const Api={
    getOptionPortfolioListForFilterListIgnore
}