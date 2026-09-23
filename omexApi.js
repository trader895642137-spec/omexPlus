import { isETF, waitForElement ,COMMISSION_FACTOR, calcAveragePriceByExecutedOrders, calcAveragePriceByExecutedOrdersByInstrument} from "./common"

// https://khobregan.tsetab.ir
const origin = window.location.origin;
const redOrigin = origin.replace('.tsetab','-red.tsetab');
const deltaOrigin = origin.replace('.tsetab','-delta.tsetab');

// TODO: // https://khobregan-red.tsetab.ir

export const isAutomaticFreeETF = (instrumentId)=> instrumentId==='IRT3KMDF0001';


export const getWalletInfo = async () => {

    

    const walletInfo = await fetch(`${redOrigin}/api/Customers/wallet-info`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9,ar;q=0.8,ur;q=0.7,da;q=0.6,fa;q=0.5,ne;q=0.4",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "ngsw-bypass": "",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Google Chrome\";v=\"141\", \"Not?A_Brand\";v=\"8\", \"Chromium\";v=\"141\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": `${origin}/`,
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
    }).then(response => response.json()).then(res => res.response?.data[0])

    return walletInfo

}


export const getOptionPortfolioList = async () => {


    const list = await fetch(`${redOrigin}/api/optionOpenPositions/get`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9,ar;q=0.8,ur;q=0.7,da;q=0.6,fa;q=0.5,ne;q=0.4",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "ngsw-bypass": "",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Google Chrome\";v=\"141\", \"Not?A_Brand\";v=\"8\", \"Chromium\";v=\"141\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": `${origin}/`,
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
    }).then(response => response.json()).then(res => res.response.data);

    return list

}

export const getStockPortfolioList = async () => {

    let stocks = await fetch(`${deltaOrigin}/api/assets/portfolio-info`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-GB,en;q=0.9,fa-IR;q=0.8,fa;q=0.7,en-US;q=0.6",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "ngsw-bypass": "",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Chromium\";v=\"142\", \"Google Chrome\";v=\"142\", \"Not_A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": `${origin}/`,
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
    }).then(response => response.json()).then(res => res.response?.data?.items);

    const stockInfos = await getStockInfos(stocks.map(stock=>stock.instrumentId));

    stocks = stocks.map(stock=>({...stock,instrumentName:stockInfos.find(stockInfo=>stockInfo.instrumentId===stock.instrumentId)?.lVal18AFC}))


    return stocks
}

export const GetBaseDerivativeInstruments = async () => {

    // https://khobregan-red.tsetab.ir/api/PublicMessages/GetBaseDerivativeInstruments
    const list = await fetch(`${redOrigin}/api/PublicMessages/GetBaseDerivativeInstruments`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-GB,en;q=0.9,fa-IR;q=0.8,fa;q=0.7,en-US;q=0.6",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "ngsw-bypass": "",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Chromium\";v=\"142\", \"Google Chrome\";v=\"142\", \"Not_A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": `${origin}/`,
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
    }).then(response => response.json()).then(res => res.response?.data);

    return list
}




function formatDateToYyyymmdd(date) {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
}

const getTodayOpenOrders = async () => {
    // ?historyDate=20251026
    return fetch(`${redOrigin}/api/Orders/GetOrders?historyDate=${formatDateToYyyymmdd(new Date())}`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9,ar;q=0.8,ur;q=0.7,da;q=0.6,fa;q=0.5,ne;q=0.4",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "ngsw-bypass": "",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Google Chrome\";v=\"141\", \"Not?A_Brand\";v=\"8\", \"Chromium\";v=\"141\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": `${origin}/`,
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
    }).then(response => response.json()).then(res => {
        const orders = res.response.data;
        return orders.filter(order=>order.orderStatus==="InQueue" || order.orderStatus==="PartlySettled")

    });


}

const deleteOrder = ({orderId,id}) => {
    
    return fetch( `${redOrigin}/api/Orders/OrderCancellation?orderId=${orderId}&Id=${id}`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "access-control-max-age": "3600",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "cache-control": "max-age=21600, public",
            "content-type": "application/json; charset=UTF-8",
            "ngsw-bypass": ""
        },
        //   "referrer": "https://khobregan.tsetab.ir/order-terminal-worker.6b5091bdcec9e3f3.js",
        "referrer": `${origin}/`,
        "body": null,
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    });
}



export const getStockPricesData = async (instrumentIds)=>{

    return fetch(`${redOrigin}/api/PublicMessages/InstTrades`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-GB,en;q=0.9,fa-IR;q=0.8,fa;q=0.7,en-US;q=0.6",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "content-type": "application/json",
            "ngsw-bypass": "",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": `${origin}/`,
        "body": JSON.stringify({
            instrumentIds
        }),
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    }).then(response => response.json()).then(res => {
        const stockInfos = res.response.data;
        return stockInfos
    });
}


const getStockInfos = async (instrumentIds) => {
    return fetch(`${redOrigin}/api/PublicMessages/GetInstruments`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-GB,en;q=0.9,fa-IR;q=0.8,fa;q=0.7,en-US;q=0.6",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "content-type": "application/json",
            "ngsw-bypass": "",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Chromium\";v=\"142\", \"Google Chrome\";v=\"142\", \"Not_A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": `${origin}/`,
        "body": JSON.stringify({
            instrumentIds
        }),
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    }).then(response => response.json()).then(res => {
        const stockInfos = res.response.data;
        return stockInfos
    });
}

const getOptionContractInfos = async (instrumentIds) => {

    return fetch(`${redOrigin}/api/PublicMessages/GetOptionContractInfos`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9,ar;q=0.8,ur;q=0.7,da;q=0.6,fa;q=0.5,ne;q=0.4",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "content-type": "application/json",
            "ngsw-bypass": "",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Chromium\";v=\"142\", \"Google Chrome\";v=\"142\", \"Not_A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": `${origin}/`,
        "body": JSON.stringify({
            instrumentIds
        }),
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    }).then(response => response.json()).then(res => {
        const optionContractInfos = res.response.data;
        return optionContractInfos
    });



}
const searchOptionContractInfos = async (symbol) => {
    // ?historyDate=20251026
    return fetch(`${redOrigin}/api/PublicMessages/SearchInstruments?filter=${symbol}&marketType=Stock&marketType=Option&marketType=OptionEnergy&marketType=Other`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9,ar;q=0.8,ur;q=0.7,da;q=0.6,fa;q=0.5,ne;q=0.4",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "ngsw-bypass": "",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Google Chrome\";v=\"141\", \"Not?A_Brand\";v=\"8\", \"Chromium\";v=\"141\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": `${origin}/`,
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
    }).then(response => response.json()).then(res => {
        const optionNamesObj = res.response.data;
        if(!optionNamesObj?.length) return null
        return optionNamesObj[0]
    });


}


const getInstrumentInfoBySymbol = async (instrumentNames) => {
    // اگر ورودی رشته باشد، به آرایه تبدیل می‌کنیم
    const names = Array.isArray(instrumentNames) ? instrumentNames : [instrumentNames];
    
    if (names.length === 0) {
        return Array.isArray(instrumentNames) ? [] : null;
    }
    
    // مرحله 1: دریافت ID همه سهم‌ها به صورت موازی
    const searchPromises = names.map(async (name) => {
        try {
            const instrumentNameObj = await searchOptionContractInfos(name);
            if (!instrumentNameObj) return null;
            
            return {
                name: name,
                instrumentId: instrumentNameObj.instrumentId,
                isOption: isInstrumentNameOfOption(name)
            };
        } catch (error) {
            console.error(`Error searching ${name}:`, error);
            return null;
        }
    });
    
    const searchResults = await Promise.all(searchPromises);
    const validResults = searchResults.filter(result => result !== null);
    
    if (validResults.length === 0) {
        return Array.isArray(instrumentNames) ? [] : null;
    }
    
    // تفکیک ID های آپشن و سهام
    const optionIds = validResults
        .filter(item => item.isOption)
        .map(item => item.instrumentId);
    
    const stockIds = validResults
        .filter(item => !item.isOption)
        .map(item => item.instrumentId);
    
    // مرحله 2: دریافت اطلاعات با یک ریکویست برای هر نوع
    const [optionInfos, stockInfos] = await Promise.all([
        optionIds.length > 0 ? getOptionContractInfos(optionIds) : [],
        stockIds.length > 0 ? getStockInfos(stockIds) : []
    ]);
    
    // ساخت مپ از id به اطلاعات برای دسترسی سریع
    const infoMap = new Map();

    const baseInstrumentId = optionInfos[0].baseInstrumentId;


    const [stockPriceInfoOfOption] = await getStockPricesData([baseInstrumentId]);
    
    optionInfos.forEach(info => {
        const searchResult = validResults.find(validResult=>validResult.instrumentId===info.instrumentId);
        const stockPrice = stockPriceInfoOfOption.pDrCotVal;
        infoMap.set(info.instrumentId, {...info,instrumentName:searchResult.name,stockPrice});
    });
    
    stockInfos.forEach(info => {
        const searchResult = validResults.find(validResult=>validResult.instrumentId===info.instrumentId);
        const stockPrice = stockPriceInfoOfOption.pDrCotVal;
        infoMap.set(info.instrumentId, {...info,instrumentName:searchResult.name,stockPrice});
    });
    
    // مرحله 3: ساخت نتیجه نهایی به ترتیب ورودی
    const results = validResults
        .map(item => infoMap.get(item.instrumentId) || null)
        .filter(info => info !== null);
    
    // اگر ورودی تکی بود، همان شیء را برگردانید
    return Array.isArray(instrumentNames) ? results : (results[0] || null);
};

const getInstrumentInfoBySymbol2 = async (instrumentName)=>{

     const instrumentNameObj = await searchOptionContractInfos(instrumentName);

     if(!instrumentNameObj) return null

     const instrumentId = instrumentNameObj.instrumentId;


     let instrumentInfos;
     if(isInstrumentNameOfOption(instrumentName)){
        instrumentInfos = await getOptionContractInfos([instrumentId]);

     }else{
        instrumentInfos = await getStockInfos([instrumentId]);
     }


     if(!instrumentInfos?.length) return null


     return instrumentInfos[0]

}


const deleteAllOpenOrders =async ()=>{


    const openOrderList = await getTodayOpenOrders();

    for (let i = 0; i < openOrderList.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 10));
        const {orderId,id}=openOrderList[i];
        await deleteOrder({orderId,id});
    }


    return

}

const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
};

const getOrders = async ({instrumentId,daysAgo = 120})=>{

    const today = new Date();
    const fromDateObj = new Date(today);
    fromDateObj.setDate(today.getDate() - daysAgo);

    const fromDate = formatDate(fromDateObj);

    return fetch(`${redOrigin}/api/Orders/GetHistoryOrders?$count=true${instrumentId!=null ? `&instrumentId=${instrumentId}` :'' }&fromDate=${fromDate}`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-GB,en;q=0.9,fa-IR;q=0.8,fa;q=0.7,en-US;q=0.6",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "ngsw-bypass": "",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Chromium\";v=\"148\", \"Google Chrome\";v=\"148\", \"Not/A)Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": "https://khobregan.tsetab.ir/",
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
    }).then(response => response.json()).then(res => {
        const orders = res.response.data;
        if (!orders?.length) return null
        return orders
    });
}

const calcAveragePrice = async (instrumentId)=>{

    const orders = await getOrders({instrumentId});

    const averageInfo  = calcAveragePriceByExecutedOrders(orders);

    return  averageInfo

}

const calcAveragePriceForAll = async () => {

    const orders = await getOrders({daysAgo:120});
    console.log({orders});
    
    const stocks = await getStockPortfolioList();
    console.log({portfolioStocks:stocks});
    
    const calculatedAverageInfo = calcAveragePriceByExecutedOrdersByInstrument({orders,portfolioStocks:stocks});

    const options = await getOptionPortfolioList();
    console.log({portfolioOptions:options});


    const optionsWithAvgPrice = options.map(option => {

        return {
            instrumentId:option.instrumentId,
            symbol: option.instrumentName,
            calculatedAverageInfo: calculatedAverageInfo[option.instrumentId],
            executedPrice: option.executedPrice,
            breakEvenPrice: option.breakEvenPrice,
            count: option.orderSide==='Sell' ? -option.count : option.count,
            orderSide : option.orderSide,
        }

    });
    const stocksWithAvgPrice = stocks.map(stock => {

        return {
            instrumentId:stock.instrumentId,
            symbol: stock.instrumentName,
            calculatedAverageInfo: calculatedAverageInfo[stock.instrumentId],
            executedPrice: stock.executedPrice,
            breakEvenPrice: stock.breakEvenPrice,
            count: stock.quantity,
            orderSide : 'Buy',
        }

    });
    console.log({optionsWithAvgPrice,stocksWithAvgPrice});
    

    return {
        optionsWithAvgPrice,
        stocksWithAvgPrice
    }

}



const getGroups =async () => {
    
    return fetch(`${redOrigin}/api/AssetGrouping/GetGroups`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9,ar;q=0.8,ur;q=0.7,da;q=0.6,fa;q=0.5,ne;q=0.4",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "ngsw-bypass": "",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Chromium\";v=\"142\", \"Google Chrome\";v=\"142\", \"Not_A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": `${origin}/`,
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
    }).then(response => response.json()).then(res => {
        const groups = res.response.data;
        return groups
    });
}
export const getCustomerOptionStrategyEstimationWithItems = async () => {
    return fetch(`${redOrigin}/api/OptionStrategyEstimations/GetCustomerOptionStrategyEstimationWithItems`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9,ar;q=0.8,ur;q=0.7,da;q=0.6,fa;q=0.5,ne;q=0.4",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "ngsw-bypass": "",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Chromium\";v=\"142\", \"Google Chrome\";v=\"142\", \"Not_A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": `${origin}/`,
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
    }).then(response => response.json()).then(res => {
        const strategyEstimationList = res.response.data;
        return strategyEstimationList
    });
}



const getOptionStrategies = async () => {
    return fetch(`${redOrigin}/api/OptionStrategies/Get`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-GB,en;q=0.9,fa-IR;q=0.8,fa;q=0.7,en-US;q=0.6",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "ngsw-bypass": "",
            "sec-ch-ua": "\"Not=A?Brand\";v=\"99\", \"Google Chrome\";v=\"151\", \"Chromium\";v=\"151\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": "https://khobregan.tsetab.ir/",
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
    }).then(response => response.json()).then(res => {
        const optionStrategies = res.response.data;
        return optionStrategies
    });
}



export const findStrategyOfGroup = ({ group, strategies,optionPortfolioList,stockPortfolioList }) => {

    const groupPositions = group.instrumentIds.map(instrumentId=>{
        const foundOption = optionPortfolioList.find(option=>option.instrumentId===instrumentId);
        if(foundOption) return foundOption
        const foundStock = stockPortfolioList.find(stock=>stock.instrumentId===instrumentId);
        return foundStock || null
    });


    const foundStrategy = strategies.find(strategy => {


        strategy.rowLength = strategy.items.length;
        const strategyItems = Array.from(new Map(strategy.items.map(sItem => [sItem.instrumentId, sItem])).values());

        const hasAllInstrumentId = groupPositions.every(groupPosition => strategyItems.find(sItem => groupPosition && sItem && groupPosition.instrumentId === sItem.instrumentId && (groupPosition.orderSide==null || groupPosition.orderSide === sItem.side)));


        return hasAllInstrumentId && strategyItems.length === group.instrumentIds.length

    });

    return foundStrategy

}



const selectStrategy =async ({documentOfWindow=document,groups,optionPortfolioList,strategies}={})=>{
    const _document  = documentOfWindow || document;
    const selectedGroupTitle = _document.querySelector('client-option-positions-filter-bar .-is-group ng-select .u-ff-number').innerHTML;

    groups ??= await getGroups();

    let selectedGroup = groups.find(group=>selectedGroupTitle.includes(group.name));

    optionPortfolioList ??= await getOptionPortfolioList();

    strategies ??= await getCustomerOptionStrategyEstimationWithItems();


    const foundStrategy  = findStrategyOfGroup({group:selectedGroup,strategies,optionPortfolioList});

    if(!foundStrategy) return



    const  estimationListButton = _document.querySelector('client-option-strategy-estimation-header button[label="لیست برآوردها"]');


    estimationListButton.click();
    await new Promise(r => setTimeout(r, 200));

    const estimationListSearchInput = _document.querySelector('client-option-strategy-estimation-list c-k-input-search input');
    estimationListSearchInput.value=  foundStrategy.title;
    estimationListSearchInput.dispatchEvent(new Event('input', { bubbles: true }));




    const searchResultElementList = _document.querySelectorAll('client-option-strategy-estimation-list .o-items-container .o-item');

    await new Promise(r => setTimeout(r, 200));


    Array.from(searchResultElementList).find(searchResultElement=>searchResultElement.querySelector('span').innerHTML===foundStrategy.title)?.click()

    // console.log(foundStrategy);

    return {
        strategyTitle:foundStrategy.title,
        _document,
        strategyRowLength:foundStrategy.rowLength}
    

}

export const getSumOfPositionsOfGroups = async ()=>{
    const groups = await getGroups();
    let portfolioList = await getOptionPortfolioList();
    const sum  = groups.reduce((sum,g)=>sum+=(g.instrumentIds.length),0);

    const instrumentIdsOfGroups = groups.flatMap(group=>group.instrumentIds);


    const areNotInGroups = portfolioList.reduce((areNotInGroups,position)=>{

        if(!instrumentIdsOfGroups.find(instrumentId=>instrumentId===position.instrumentId)){
            areNotInGroups.push(position.instrumentName) 
        }
        return areNotInGroups
    },[])
    
    console.log(sum,areNotInGroups)

    return {
        sum,
        areNotInGroups
    }
    
}


const calculateBlockedAmount =(optionPortfolioList)=>{

    return optionPortfolioList.map(op=>op.blockedAmount).filter(Boolean).reduce((sum,current)=>sum+current,0)

}


export const getBlockedAmount = ()=>{

    getOptionPortfolioList().then(list=>{
        console.log(calculateBlockedAmount(list))
    })
}




export const fillEstimationPanelByStrategyName=async ()=>{

    const strategyName = document.querySelector('client-option-strategy-estimation-header .e-title-input input').value;
    if(!strategyName) return 

    const optionSymbolList = strategyName.split('@')[1].split('-');

    const addNewRowButton = document.querySelector('client-option-strategy-estimation-main .o-footer button');

    const searchAndSelectOption = async (optionSymbol)=>{
        const getEmptyRow = ()=>{
            const row = document.querySelector('client-option-strategy-estimation-main .o-items .o-item-body:last-child');
            const searchInput = row?.querySelector('client-option-strategy-estimation-main-ui-instrument-search input');

            return searchInput &&  {
                searchInput,
                row
            }
        }

        let {searchInput,row} = getEmptyRow() || {};

        const estimationPanelElement = document.querySelector('client-option-strategy-estimation-main .o-items');
        
        if(!searchInput){

            addNewRowButton.click();
            const result = await waitForElement(estimationPanelElement,getEmptyRow);
            searchInput = result.searchInput;
            row = result.row;
        }

        searchInput.value = optionSymbol;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));

        try {
            const resultBodyElement = await waitForElement(row,()=>row.querySelector('client-option-strategy-estimation-main-ui-instrument-search ng-dropdown-panel .ng-dropdown-panel-items .ng-option:first-child .c-resultBody'));
            resultBodyElement.click();
        } catch (err) {
            console.error("Error:", err.message);
        }

        const quantityInput = row.querySelector('c-k-input-number[formcontrolname=quantity] input');
        quantityInput.value='10';
        quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
        const linkPriceButton = row.querySelector('.o-price-group client-option-strategy-estimation-main-ui-lock button')
        linkPriceButton.click();
        
    }

    for (const optionSymbol of optionSymbolList) {

        await searchAndSelectOption(optionSymbol)

    }
   
}


export const createGroup = ({ name, instrumentIds }) => {

    return fetch(`${redOrigin}/api/AssetGrouping/Create`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-GB,en;q=0.9,fa-IR;q=0.8,fa;q=0.7,en-US;q=0.6",
            "authorization": JSON.parse(localStorage.getItem('auth')),
            "content-type": "application/json",
            "ngsw-bypass": "",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Google Chrome\";v=\"143\", \"Chromium\";v=\"143\", \"Not A(Brand\";v=\"24\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": `${origin}/`,
        "body": JSON.stringify({
            name,
            "assetGroupingTypeId": "OpenPosition",
            instrumentIds
        }),
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    });

}




export const isInstrumentNameOfOption = (instrumentName)=> ['ض', 'ط'].some(optionChar => instrumentName && instrumentName.charAt(0) === optionChar);





export const calculateSumOfMoneyAndAssets  = async ()=>{


    const [optionPortfolioList,assetPortfolioList,walletInfo] = await Promise.all(
        [
            getOptionPortfolioList(),
            getStockPortfolioList(),
            getWalletInfo()
        ]
    )


    // const blockedAmount = await calculateBlockedAmount(optionPortfolioList);

    const sumCostWithoutMarginOfOptions = optionPortfolioList.reduce((sumCostWithoutMarginOfOptions,option)=>{

        const {orderSide,cSize,count,executedPrice} = option;
        const sumOfExecutedValue =  orderSide==='Buy' ? cSize * count * executedPrice * (1 + COMMISSION_FACTOR.OPTION.BUY) : (cSize * count * executedPrice)/(1+COMMISSION_FACTOR.OPTION.SELL);

        sumCostWithoutMarginOfOptions += orderSide==='Buy' ? sumOfExecutedValue : - sumOfExecutedValue;

        return sumCostWithoutMarginOfOptions

    },0);


    let isThereFreeRiskETF=false;
    const sumCostOfAssetsWithoutFreeRiskETF = assetPortfolioList.reduce((sumCostOfAssetsWithoutFreeRiskETF,asset)=>{

        const {quantity,executedPrice,instrumentId} = asset;
        if(isAutomaticFreeETF(instrumentId)){
            isThereFreeRiskETF=true;
            return sumCostOfAssetsWithoutFreeRiskETF
        }
        const sumOfExecutedValue =   quantity * executedPrice *  (1 + COMMISSION_FACTOR.STOCK.BUY);
        sumCostOfAssetsWithoutFreeRiskETF += sumOfExecutedValue;

        return sumCostOfAssetsWithoutFreeRiskETF

    },0);



    const {customerOptionPurchasePowerT2,blockedAmount} = walletInfo;



    const sumOfMoneyAndAssets = sumCostWithoutMarginOfOptions + customerOptionPurchasePowerT2 + blockedAmount + sumCostOfAssetsWithoutFreeRiskETF;
    console.log(sumOfMoneyAndAssets.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }));


    const calculatedBlockedAmount = optionPortfolioList.filter(position=>position.blockedAmount).reduce((sum,position)=>sum+position.blockedAmount,0);



    return {
        sumOfMoneyAndAssets,
        sumCostWithoutMarginOfOptions,
        blockedAmount,
        calculatedBlockedAmount,
        customerOptionPurchasePowerT2,
        sumCostOfAssetsWithoutFreeRiskETF
    }

    
}

export const cacheItemsTemporarily = async (item)=>{
    localStorage.setItem(
        'tempCachedItems',
        JSON.stringify(item)
    );
}


export const findDuplicationsInGroups = async ()=>{
    const groups = await getGroups();
    const optionPortfolioList = await getOptionPortfolioList();


    cacheItemsTemporarily({groups,optionPortfolioList});


    const duplicateMap = new Map();

    for (const group of groups) {
        for (const instrumentId of group.instrumentIds) {
            if (!duplicateMap.has(instrumentId)) {
                duplicateMap.set(instrumentId, {
                    count: 0,
                    groups: []
                });
            }

            const item = duplicateMap.get(instrumentId);
            item.count++;
            item.groups.push({
                id: group.id,
                name: group.name
            });
        }
    }

    const instrumentNameMap = new Map(
        optionPortfolioList.map(item => [
            item.instrumentId,
            item.instrumentName
        ])
    );

    const duplicates = [...duplicateMap.entries()]
        .filter(([_, value]) => value.count > 1)
        .map(([instrumentId, value]) => ({
            instrumentId,
            instrumentName: instrumentNameMap.get(instrumentId) ?? 'نامشخص',
            count: value.count,
            groups: value.groups
        }));

    console.log(duplicates);

    duplicates.forEach(item => {
        console.log(
            `${item.instrumentName} (${item.instrumentId}) در ${item.count} گروه استفاده شده:`,
            item.groups.map(group => group.name).join("، ")
        );
    });
}

const FIXED_MARGIN_STRATEGIES = new Set([
  "BearCallSpread",
  "BullPutSpread",
]);




const calculateFixedMargin = async () => {


    const positions = await getOptionPortfolioList();
    const strategies = await getOptionStrategies();
    const positionMap = new Map(
        positions.map(p => [p.instrumentId, p])
    );

    let totalFixedDMargin = 0;

    const details = [];

    for (const strategy of strategies) {

        // فعلاً Butterfly را جداگانه مدیریت می‌کنیم
        if (!FIXED_MARGIN_STRATEGIES.has(strategy.type)) {
            continue;
        }

        const p1 = positionMap.get(strategy.baseStrategyInstrumentId);
        const p2 = positionMap.get(strategy.strategyInstrumentId);

        if (!p1 || !p2) {
            console.warn(
                "Position not found for strategy:",
                strategy.type,
                strategy.id,
                strategy.baseStrategyInstrumentName,
                strategy.strategyInstrumentName
            );

            continue;
        }

        const strike1 = Number(p1.strikePrice);
        const strike2 = Number(p2.strikePrice);

        const contractSize = Number(p1.cSize);

        // تعداد واقعی Spread
        const quantity = Number(
            strategy.quantity
        );

        const strikeDifference = Math.abs(strike1 - strike2);

        const margin =
            strikeDifference *
            contractSize *
            quantity;

        totalFixedDMargin += margin;

        details.push({
            strategyId: strategy.id,
            type: strategy.type,

            instrument1: p1.instrumentName,
            instrument2: p2.instrumentName,

            strike1,
            strike2,
            strikeDifference,

            contractSize,
            quantity,

            margin
        });
    }

    console.log({ totalFixedDMargin, details });


    return {
        totalFixedDMargin,
        details
    };
}


const getVariableMargin = async()=>{

    const {totalFixedDMargin} = await calculateFixedMargin();
    const {calculatedBlockedAmount} = await calculateSumOfMoneyAndAssets();
    const variableMargin = calculatedBlockedAmount - totalFixedDMargin;

    console.log({calculatedBlockedAmount,totalFixedDMargin,variableMargin})


    return {
        calculatedBlockedAmount,
        totalFixedDMargin,
        variableMargin
    }

}




export const OMEXApi = {
    getGroups,
    getOptionPortfolioList,
    getStockPortfolioList,
    getOptionContractInfos,
    getInstrumentInfoBySymbol,
    deleteAllOpenOrders,
    selectStrategy,
    getSumOfPositionsOfGroups,
    getBlockedAmount,
    fillEstimationPanelByStrategyName,
    createGroup,
    calculateSumOfMoneyAndAssets,
    calcAveragePrice,
    calcAveragePriceForAll,
    findDuplicationsInGroups,
    getVariableMargin,
    getCustomerOptionStrategyEstimationWithItems,
    findStrategyOfGroup,
    getStockPricesData,
    GetBaseDerivativeInstruments,
    isAutomaticFreeETF
}