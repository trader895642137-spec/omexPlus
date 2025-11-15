// https://khobregan.tsetab.ir
const origin = window.location.origin
const redOrigin = origin.replace('.tsetab','-red.tsetab')

const getOptionPortfolioList = async () => {

    

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

const getOptionContractInfoBySymbol = async (symbol)=>{

     const optionNameObj = await searchOptionContractInfos(symbol);

     if(!optionNameObj) return null

     const instrumentId = optionNameObj.instrumentId;



     const optionContractInfos = await getOptionContractInfos([instrumentId]);

     if(!optionContractInfos?.length) return null



     return optionContractInfos[0]

}


const deleteAllOpenOrders =async ()=>{


    const openOrderList = await getTodayOpenOrders();

    for (let i = 0; i < openOrderList.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 150));
        const {orderId,id}=openOrderList[i];
        await deleteOrder({orderId,id});
    }


    return

}


const getGroups =async () => {
    return fetch("https://khobregan-red.tsetab.ir/api/AssetGrouping/GetGroups", {
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
        "referrer": "https://khobregan.tsetab.ir/",
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
    return fetch("https://khobregan-red.tsetab.ir/api/OptionStrategyEstimations/GetCustomerOptionStrategyEstimationWithItems", {
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
        "referrer": "https://khobregan.tsetab.ir/",
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
    }).then(response => response.json()).then(res => {
        const strategyEstimationList = res.response.data;
        return strategyEstimationList
    });
}



const selectStrategy =async ()=>{
    const selectedGroupTitle = document.querySelector('client-option-positions-filter-bar .-is-group ng-select .u-ff-number').innerHTML;

    const groups = await getGroups();

    let selectedGroup = groups.find(group=>selectedGroupTitle.includes(group.name));

    const portfolioList = await getOptionPortfolioList();

    selectedGroup.positions = selectedGroup.instrumentIds.map(instrumentId=>portfolioList.find(position=>position.instrumentId===instrumentId))



    const strategies = await getCustomerOptionStrategyEstimationWithItems();

    const foundStrategies = strategies.filter(strategy=> {


        strategy.items = Array.from(new Map(strategy.items.map(sItem => [sItem.instrumentId, sItem])).values());

        const hasAllInstrumentId =  selectedGroup.positions.every(groupPosition=> strategy.items.find(sItem=>groupPosition.instrumentId===sItem.instrumentId && groupPosition.orderSide===sItem.side));

        return hasAllInstrumentId && strategy.items.length===selectedGroup.instrumentIds.length

    });



    const  estimationListButton = document.querySelector('client-option-strategy-estimation-header button[label="لیست برآوردها"]');


    estimationListButton.click();
    await new Promise(r => setTimeout(r, 200));

    const estimationListSearchInput = document.querySelector('client-option-strategy-estimation-list c-k-input-search input');
    estimationListSearchInput.value=  foundStrategies[0].title;
    estimationListSearchInput.dispatchEvent(new Event('input', { bubbles: true }));




    const searchResultElement = document.querySelector('client-option-strategy-estimation-list .o-items-container .o-item');

    await new Promise(r => setTimeout(r, 200));


    searchResultElement.click()

    console.log(foundStrategies);
    

}

export const OMEXApi = {
    getOptionPortfolioList,
    getOptionContractInfos,
    getOptionContractInfoBySymbol,
    deleteAllOpenOrders
}