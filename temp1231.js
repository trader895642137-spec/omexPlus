const createList2 = async ()=>{

    return normalizeAssets(await getAssetsFromService());
    const tradedAssetList = await getListOfTradedAssets();
    if(!tradedAssetList?.length) return []

    let allStockSymbolDetailsMap = {};

    let list = tradedAssetList.map(tradedAsset => {

        const symbolID = tradedAsset.nc;
        // const cells = document.querySelectorAll(`[id='${symbolID}'] >div`)

        const name = tradedAsset.cn;
        const quantityOfTrades = tradedAsset.nt;
        const isOption = ['اختیارخ', 'اختیارف'].some(optionTypeName => name.includes(optionTypeName));

        const symbol = tradedAsset.sf;

        const prevRecordObj = prevListSymbolMap[symbol];

        const lastTradedTime = ( () => {
            if (!prevRecordObj || !prevRecordObj.quantityOfTrades || (quantityOfTrades > prevRecordObj.quantityOfTrades)) {
                return Date.now();
            }
            return prevRecordObj.lastTradedTime

        }
        )();
        const isCall = isOption && symbol.startsWith('ض');
        const isPut = isOption && symbol.startsWith('ط');
        let optionDetails,strikePrice;
        if (isOption) {
            let date = name.split('-').pop();
            let dateArray = date.split('/');
            if(dateArray[0].length===2){
                dateArray[0] = '14' + dateArray[0];
                date = dateArray.join('/')
            }
            strikePrice = convertStringToInt(name.split('-')[1]);
            const stockSymbol = name.split('-')[0].replace('اختيارخ', '').replace('اختيارف', '').replace('اختیارخ', '').replace('اختیارف', '').trim();

            optionDetails = {
                date,
                stockSymbol,
                strikePrice
            }
        }

        prevListSymbolMap[symbol] = {
            quantityOfTrades,
            lastTradedTime
        }

        const assetInfo ={
            instrumentName:symbol,
            isOption,
            isCall,
            lastTradedTime,
            isPut,
            isETF: isETF(symbol),
            strikePrice,
            optionDetails,
        }
        return assetInfo
    }
    );

    list = list.map(listItem => {

        if (!listItem.isOption)
            return listItem
        allStockSymbolDetailsMap[listItem.optionDetails.stockSymbol] = allStockSymbolDetailsMap[listItem.optionDetails.stockSymbol] || list.find(_item => _item.symbol === listItem.optionDetails.stockSymbol);
        const stockSymbolDetails = allStockSymbolDetailsMap[listItem.optionDetails.stockSymbol]
        listItem.optionDetails.stockSymbolDetails = stockSymbolDetails


        if(listItem.optionDetails.stockSymbolDetails){

            const calculatedRequiredMargin = calculateOptionMargin({
                priceSpot: listItem.optionDetails.stockSymbolDetails.last,
                strikePrice: listItem.optionDetails.strikePrice,
                contractSize: 1000,
                optionPremium: listItem.last,
                optionType: listItem.isCall ? "call" : "put"
            })?.required || 0;
    
            listItem.calculatedRequiredMargin = calculatedRequiredMargin
        }


        return listItem
    }
    );

    return list

}