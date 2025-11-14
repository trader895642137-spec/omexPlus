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
        deleteOrder({orderId,id});
    }

}


const getGroups =()=>{
    fetch("https://khobregan-red.tsetab.ir/api/AssetGrouping/GetGroups", {
  "headers": {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9,ar;q=0.8,ur;q=0.7,da;q=0.6,fa;q=0.5,ne;q=0.4",
    "authorization": "eyJhbGciOiJBMjU2R0NNS1ciLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwiaXYiOiJScnVmUTJTTEhqOVZIRFJ4IiwidGFnIjoiRGlNN1kyaWIyemNSNWVTWTRNRTI5ZyJ9.eyXfIOIsUjhhBbrTRjQQ0YEq5QdcPG7LcbV2rAhMPllFRGqMW4QC8CP4AVdx7F_B9Vdmb5bbLCyLTL11acrdOw.KnI6975o9PtvycPft0VvOw.1sDrKoSakhJUfk6ynMPsJ819yLV6jYd9oTT0PH241LEo1Y9nNYlBwAIQ7D9qi-Q043w-jLVOddN5M9sDFtTFlbWV5NbvBTfjPfjVMnhUzle_19vmSJkP9QmsE643gCrQEVKfsMDTLpntKNrj0q7uI28NgkyiNgQSdgCLFIEQahreHpV7W_jALpPnIVwHgfJQqXnKZ34hhgeqy9ChOK6Of6X--FpN1CF-RDtti6qgcAPGGygCsFaKYWpUNU7s63khSTyesiLvMNbU0qulYAwDZIsAEK6kmDxrScVQJWTWIJ-Qjxc38TFctfeZLzl_va2jRJ8TjsbcbxxeWzrdGk7klXTzklkheCe5utfRN7fFHm9l1zJIHAnc8jiMdQ10Gjefnv65pLB5XvaeY-qsrIxw19o_au0Rj7dtVN16K_NqhomPUQU7or7MgSjIX6gFtlCHBnXgKt-4M0liz4rKaUvg3eMFQ870AajB-bS_0CpkN_e5v9eZtSQtNYupvgnEmg25yugB1jmm5Z9vocuTJN5xjBdpqua_njsmNWxCGgqvQVPzj8z6Y6HfeObH4u9FPAuLImfsUeaLD8sc9BvrcZAaXo_icAKpIkCU3UF_FW3f5dTR_CfGC36tb6Jgc_-qq-8_GIvh6RCHwtXAuzFougqiOCpX_SNnqxT4efnV4DoWuYwY8mpgnYeeCun-O7klIymXx0k1E1BvxeIluYbgOM6c9g.g2krWnWGz7gp47pkO_0zs8zBjKoLfKyepgXqPopoiJs",
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
});
}
const getCustomerOptionStrategyEstimationWithItems =()=>{
    fetch("https://khobregan-red.tsetab.ir/api/OptionStrategyEstimations/GetCustomerOptionStrategyEstimationWithItems", {
  "headers": {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9,ar;q=0.8,ur;q=0.7,da;q=0.6,fa;q=0.5,ne;q=0.4",
    "authorization": "eyJhbGciOiJBMjU2R0NNS1ciLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwiaXYiOiJScnVmUTJTTEhqOVZIRFJ4IiwidGFnIjoiRGlNN1kyaWIyemNSNWVTWTRNRTI5ZyJ9.eyXfIOIsUjhhBbrTRjQQ0YEq5QdcPG7LcbV2rAhMPllFRGqMW4QC8CP4AVdx7F_B9Vdmb5bbLCyLTL11acrdOw.KnI6975o9PtvycPft0VvOw.1sDrKoSakhJUfk6ynMPsJ819yLV6jYd9oTT0PH241LEo1Y9nNYlBwAIQ7D9qi-Q043w-jLVOddN5M9sDFtTFlbWV5NbvBTfjPfjVMnhUzle_19vmSJkP9QmsE643gCrQEVKfsMDTLpntKNrj0q7uI28NgkyiNgQSdgCLFIEQahreHpV7W_jALpPnIVwHgfJQqXnKZ34hhgeqy9ChOK6Of6X--FpN1CF-RDtti6qgcAPGGygCsFaKYWpUNU7s63khSTyesiLvMNbU0qulYAwDZIsAEK6kmDxrScVQJWTWIJ-Qjxc38TFctfeZLzl_va2jRJ8TjsbcbxxeWzrdGk7klXTzklkheCe5utfRN7fFHm9l1zJIHAnc8jiMdQ10Gjefnv65pLB5XvaeY-qsrIxw19o_au0Rj7dtVN16K_NqhomPUQU7or7MgSjIX6gFtlCHBnXgKt-4M0liz4rKaUvg3eMFQ870AajB-bS_0CpkN_e5v9eZtSQtNYupvgnEmg25yugB1jmm5Z9vocuTJN5xjBdpqua_njsmNWxCGgqvQVPzj8z6Y6HfeObH4u9FPAuLImfsUeaLD8sc9BvrcZAaXo_icAKpIkCU3UF_FW3f5dTR_CfGC36tb6Jgc_-qq-8_GIvh6RCHwtXAuzFougqiOCpX_SNnqxT4efnV4DoWuYwY8mpgnYeeCun-O7klIymXx0k1E1BvxeIluYbgOM6c9g.g2krWnWGz7gp47pkO_0zs8zBjKoLfKyepgXqPopoiJs",
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
});
}

export const OMEXApi = {
    getOptionPortfolioList,
    getOptionContractInfos,
    getOptionContractInfoBySymbol,
    deleteAllOpenOrders
}