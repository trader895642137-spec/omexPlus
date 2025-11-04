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


const deleteAllOpenOrders =async ()=>{


    const openOrderList = await getTodayOpenOrders();

    for (let i = 0; i < openOrderList.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 150));
        const {orderId,id}=openOrderList[i];
        deleteOrder({orderId,id});
    }

}

export const OMEXApi = {
    getOptionPortfolioList,
    deleteAllOpenOrders
}