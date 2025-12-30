import { isETF, waitForElement } from "./common"

// https://khobregan.tsetab.ir
const origin = window.location.origin
const redOrigin = origin.replace('.tsetab','-red.tsetab')
const deltaOrigin = origin.replace('.tsetab','-delta.tsetab')

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
    }).then(response => response.json()).then(res => res.response.data)

    return list

}

export const getStockPortfolioList = async () => {

    const list = await fetch(`${deltaOrigin}/api/assets/portfolio-info`, {
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

const getInstrumentInfoBySymbol = async (instrumentName)=>{

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
const getCustomerOptionStrategyEstimationWithItems = async () => {
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



const findStrategyOfGroup = ({ group, strategies,portfolioList }) => {

    const groupPositions = group.instrumentIds.map(instrumentId=>portfolioList.find(position=>position.instrumentId===instrumentId));

    const foundStrategy = strategies.find(strategy => {


        strategy.rowLength = strategy.items.length;
        strategy.items = Array.from(new Map(strategy.items.map(sItem => [sItem.instrumentId, sItem])).values());

        const hasAllInstrumentId = groupPositions.every(groupPosition => strategy.items.find(sItem => groupPosition && sItem && groupPosition.instrumentId === sItem.instrumentId && groupPosition.orderSide === sItem.side));


        return hasAllInstrumentId && strategy.items.length === group.instrumentIds.length

    });

    return foundStrategy

}



const selectStrategy =async (documentOfWindow)=>{
    const _document  = documentOfWindow || document;
    const selectedGroupTitle = _document.querySelector('client-option-positions-filter-bar .-is-group ng-select .u-ff-number').innerHTML;

    const groups = await getGroups();

    let selectedGroup = groups.find(group=>selectedGroupTitle.includes(group.name));

    const portfolioList = await getOptionPortfolioList();


    const strategies = await getCustomerOptionStrategyEstimationWithItems();


    const foundStrategy  = findStrategyOfGroup({group:selectedGroup,strategies,portfolioList});

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

    return {_document,strategyRowLength:foundStrategy.rowLength}
    

}

export const logSumOfPositionsOfGroups = async ()=>{
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
    
}


export const getBlockedAmount = ()=>{

    getOptionPortfolioList().then(list=>{
        console.log(list.map(op=>op.blockedAmount).filter(Boolean).reduce((sum,current)=>sum+current,0))
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
            const searchInput = row?.querySelector('client-instrument-search input');

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
            const resultBodyElement = await waitForElement(row,()=>row.querySelector('client-instrument-search ng-dropdown-panel .ng-dropdown-panel-items .ng-option:first-child .c-resultBody'));
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



export const createStrategyListForAllGroups = async ()=>{


    const groups = await getGroups();


    const portfolioList = await getOptionPortfolioList();


    const strategies = await getCustomerOptionStrategyEstimationWithItems();



    const strategyListForAllGroups = groups.map(group=>{
        const positions = group.instrumentIds.map(instrumentId=>portfolioList.find(position=>position.instrumentId===instrumentId))
        const strategy  = findStrategyOfGroup({group,strategies,portfolioList});;


        if(!strategy?.items) {
            console.log(group);
            return null
        }

        const strategyPositions = strategy.items.map(strategyItem=>{

            const portfolioPosition = positions.find(pos=>pos.instrumentId===strategyItem.instrumentId)

            const instrumentName = portfolioPosition.instrumentName;
           
            return {
                instrumentName,
                isBuy: strategyItem.side === 'Buy',
                isETF: isETF(instrumentName),
                isOption: isInstrumentNameOfOption(instrumentName),
                isCall: portfolioPosition.optionSide==="Call",
                isPut: portfolioPosition.optionSide==="Put",
                cSize: portfolioPosition.cSize,
                // getBaseInstrumentPriceOfOption,
                getQuantity:()=>strategyItem.quantity,
                getCurrentPositionQuantity:()=>portfolioPosition.blockedStrategyQuantity,
                getRequiredMargin : strategyItem.requiredMargin / portfolioPosition.cSize,
                getCurrentPositionAvgPrice: portfolioPosition.executedPrice,
                strikePrice : portfolioPosition.strikePrice,
                daysLeftToSettlement : portfolioPosition.remainCsDateDays,
                // getBestOffsetPrice,
                // getBestOpenMorePrice,
                // getBestOpenMorePriceWithSideSign,
                // getStrategyName,
                // getStrategyType,

            }
        })

        return {group,strategy,strategyPositions}

       

        
    }).filter(Boolean)



    console.log(strategyListForAllGroups);
    




}

export const isInstrumentNameOfOption = (instrumentName)=> ['ض', 'ط'].some(optionChar => instrumentName && instrumentName.charAt(0) === optionChar);




export const OMEXApi = {
    getGroups,
    getOptionPortfolioList,
    getStockPortfolioList,
    getOptionContractInfos,
    getInstrumentInfoBySymbol,
    deleteAllOpenOrders,
    selectStrategy,
    logSumOfPositionsOfGroups,
    getBlockedAmount,
    fillEstimationPanelByStrategyName,
    createGroup,
    createStrategyListForAllGroups
}