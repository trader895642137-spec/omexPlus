import {moment} from './jalali-moment.browser.js'

import './hookFetch.js'
import './desktopNotificationCheck.js'


import { COMMISSION_FACTOR,isTaxFree,getCommissionFactor,mainTotalOffsetGainCalculator,getNearSettlementPrice,totalCostCalculator as totalCostCalculatorCommon, hasGreaterRatio, calculateOptionMargin, settlementProfitCalculator, settlementGainCalculator, showNotification } from './common.js';
import { findBreakevenList } from './findBreakevens.js';






// https://github.com/turuslan/HackTimer/blob/master/HackTimer.min.js
(function(s) {
    var w, f = {}, o = window, l = console, m = Math, z = 'postMessage', x = 'HackTimer.js by turuslan: ', v = 'Initialisation failed', p = 0, r = 'hasOwnProperty', y = [].slice, b = o.Worker;
    function d() {
        do {
            p = 0x7FFFFFFF > p ? p + 1 : 0
        } while (f[r](p));
        return p
    }
    if (!/MSIE 10/i.test(navigator.userAgent)) {
        try {
            s = o.URL.createObjectURL(new Blob(["var f={},p=postMessage,r='hasOwnProperty';onmessage=function(e){var d=e.data,i=d.i,t=d[r]('t')?d.t:0;switch(d.n){case'a':f[i]=setInterval(function(){p(i)},t);break;case'b':if(f[r](i)){clearInterval(f[i]);delete f[i]}break;case'c':f[i]=setTimeout(function(){p(i);if(f[r](i))delete f[i]},t);break;case'd':if(f[r](i)){clearTimeout(f[i]);delete f[i]}break}}"]))
        } catch (e) {}
    }
    if (typeof (b) !== 'undefined') {
        try {
            w = new b(s);
            o.setInterval = function(c, t) {
                var i = d();
                f[i] = {
                    c: c,
                    p: y.call(arguments, 2)
                };
                w[z]({
                    n: 'a',
                    i: i,
                    t: t
                });
                return i
            }
            ;
            o.clearInterval = function(i) {
                if (f[r](i))
                    delete f[i],
                    w[z]({
                        n: 'b',
                        i: i
                    })
            }
            ;
            o.setTimeout = function(c, t) {
                var i = d();
                f[i] = {
                    c: c,
                    p: y.call(arguments, 2),
                    t: !0
                };
                w[z]({
                    n: 'c',
                    i: i,
                    t: t
                });
                return i
            }
            ;
            o.clearTimeout = function(i) {
                if (f[r](i))
                    delete f[i],
                    w[z]({
                        n: 'd',
                        i: i
                    })
            }
            ;
            w.onmessage = function(e) {
                var i = e.data, c, n;
                if (f[r](i)) {
                    n = f[i];
                    c = n.c;
                    if (n[r]('t'))
                        delete f[i]
                }
                if (typeof (c) == 'string')
                    try {
                        c = new Function(c)
                    } catch (k) {
                        l.log(x + 'Error parsing callback code string: ', k)
                    }
                if (typeof (c) == 'function')
                    c.apply(o, n.p)
            }
            ;
            w.onerror = function(e) {
                l.log(e)
            }
            ;
            l.log(x + 'Initialisation succeeded')
        } catch (e) {
            l.log(x + v);
            l.error(e)
        }
    } else
        l.log(x + v + ' - HTML5 Web Worker is not supported')
}
)('HackTimerWorker.min.js');

// TODO: place in CONSTS
const quantitySizeMultiplier =1000;
const baseQuantity = 10 * quantitySizeMultiplier;

const CONSTS = {

    DEFAULTS: {
        MIN_VOL: 100 * 1000 * 1000,
    },

    COMMISSION_FACTOR: {
        OPTION: {
            BUY: 0.00103,
            SELL: 0.00103,
            SETTLEMENT: {
                BUY: 0.0005,
                SELL: 0.0055,
                TAX_FREE_SELL: 0.0005,
            }
        },
        STOCK: {
            BUY: 0.003712,
            SELL: 0.0088,
            TAX_FREE_SELL: 0.0005,
        },
        ETF: {
            BUY: 0.00116,
            SELL: 0.001875
        }
    },
    PRICE_TYPE: {
        BEST_PRICE: "BEST_PRICE",
        LAST_PRICE: "LAST_PRICE",
    },
    i18n: {
        BEST_PRICE: "سرخط",
        LAST_PRICE: "آخرین"
    }
}


let notifiedStrategyList = [];
let isSilentModeActive = false;
let tempIgnoredNotifList = [];
const ETF_LIST = ['اهرم', 'توان', 'موج', 'جهش'];
const isETF = (symbol) => ETF_LIST.some(_etfName => symbol === _etfName);

let prevListSymbolMap = {};

let generalConfig = {
    expectedProfitPerMonth: 1.04,
    minProfitToFilter: 0.035,
    minProfitUnder2Days:0.02,
    BUCSSOptionListIgnorer: ({option, minVol}) => {
        return (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ض') || option.vol < minVol || option.optionDetails.stockSymbolDetails.last < option.optionDetails.strikePrice)
    }
    ,
    BECSSOptionListIgnorer: ({option, minVol}) => {
        return (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ض') || option.vol < minVol || option.optionDetails.stockSymbolDetails.last > option.optionDetails.strikePrice)
    },
    BUPSOptionListIgnorer: ({option, minVol}) => {
        return (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ط') || option.vol < minVol || option.optionDetails.stockSymbolDetails.last < option.optionDetails.strikePrice)
    }
}




const isStrategyIgnored = (strategy,ignoreStrategyList) => {

    
    if (!ignoreStrategyList?.length) return
    const strategySymbols = strategy.positions.map(pos => pos.symbol);

    return ignoreStrategyList.find(ignoreStrategyObj => {


        if (ignoreStrategyObj.type !== 'ALL' && ignoreStrategyObj.type !== strategy.strategyTypeTitle)
            return false

        const strategyFullSymbolNames = strategy.positions.map(opt => opt.symbol).join('-').replaceAll('ي','ی');

        const isRequestedProfitEnough = ignoreStrategyObj.profitPercent && (strategy.profitPercent >= ignoreStrategyObj.profitPercent);

        if (!ignoreStrategyObj.name && !isRequestedProfitEnough && ignoreStrategyObj.type === strategy.strategyTypeTitle) return true

        if (ignoreStrategyObj.name === strategyFullSymbolNames && !isRequestedProfitEnough) return true
        if (strategySymbols.some(symbol => symbol.includes(ignoreStrategyObj.name)))
            return true

    }
    )

}




const isProfitEnough = ({strategy,profitPercent})=>{

    if (profitPercent < 0)
        return false

    const settlementTimeDiff = moment(strategy.option.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
    const daysToSettlement = Math.floor(settlementTimeDiff / (24 * 3600000));

    if(strategy.isProfitEnough) return true

    if (daysToSettlement >= 2 && (profitPercent < generalConfig.minProfitToFilter))
        return false
    if (daysToSettlement < 2 && (profitPercent < generalConfig.minProfitUnder2Days))
        return false

    // const minDiffTimeOflastTrade = 6 * 60 * 1000;
    // if ((Date.now() - strategy.option.lastTradedTime) > minDiffTimeOflastTrade) {
    //     return false
    // }

    const percentPerDay = Math.pow((1 + profitPercent), 1 / daysToSettlement);
    const percentPerMonth = Math.pow(percentPerDay, 30);

    return percentPerMonth > ((strategy.expectedProfitPerMonth !== undefined && strategy.expectedProfitPerMonth !== null) ? strategy.expectedProfitPerMonth : generalConfig.expectedProfitPerMonth)

}





const calcOffsetGainOfPositions = ({ strategyPositions, stockPrice }) => {
    return mainTotalOffsetGainCalculator({
        strategyPositions,
        getBestPriceCb: (_strategyPosition) => getNearSettlementPrice({ strategyPosition: _strategyPosition, stockPrice }),
        getReservedMargin: _strategyPosition => {
            return (_strategyPosition.getRequiredMargin ? (_strategyPosition.getRequiredMargin() * _strategyPosition.getQuantity()):0) || 0;
        }
    });
}







const checkProfitsAnNotif = ({sortedStrategies}) => {

    if(isSilentModeActive){
        return 
    }

    const foundStrategy = sortedStrategies.find(strategy => strategy.expectedProfitNotif && strategy.profitPercent > 0);

    if (!foundStrategy)
        return

    const filterSymbolList = getFilterSymbols();

    const ignoreStrategyList = getIgnoreStrategyNames();

    const opportunities = sortedStrategies.filter(strategy => {
         if (!strategy.expectedProfitNotif)
            return

        if (tempIgnoredNotifList.find(_strategyName => _strategyName === strategy.name))
            return
        if (strategy.profitPercent <= 0)
            return
        if (filterSymbolList.length && !filterSymbolList.find(filteredSymbol => strategy.name.includes(filteredSymbol)))
            return

        
        if (isStrategyIgnored(strategy,ignoreStrategyList))
            return false
        return true
    }
    );

    if (!opportunities.length)
        return


    notifiedStrategyList = [].concat(opportunities);

    showNotification({
        title: `سود ${foundStrategy.strategyTypeTitle} بالای ${((foundStrategy.profitPercent) * 100).toFixed()} درصد`,
        body: `${foundStrategy.strategyTypeTitle} ${foundStrategy.name}`,
        tag: `profit`
    })

}



const configsToHtmlTitle = ({strategyName, strategySubName, priceType, min_time_to_settlement, max_time_to_settlement, minStockPriceDistanceInPercent, maxStockPriceDistanceInPercent, minVol, customLabels}) => {

    const _priceType = CONSTS.i18n[priceType];
    const minToSettlement = min_time_to_settlement && ("minD:" + (min_time_to_settlement / 3600000 / 24).toFixed(0));
    const maxToSettlement = max_time_to_settlement && max_time_to_settlement !== Infinity && ("maxD:" + (max_time_to_settlement / 3600000 / 24).toFixed(0));
    const _minStockPriceDistanceInPercent = typeof minStockPriceDistanceInPercent !== 'undefined' && minStockPriceDistanceInPercent !== null && minStockPriceDistanceInPercent !== -Infinity && `coverMin:${((minStockPriceDistanceInPercent) * 100).toFixed(0)}%`;
    const _maxStockPriceDistanceInPercent = maxStockPriceDistanceInPercent && maxStockPriceDistanceInPercent !== Infinity && `coverMax:${((maxStockPriceDistanceInPercent) * 100).toFixed(0)}%`;

    return `
        <h5 style="margin:2px">${strategyName} ${strategySubName ? strategySubName : ''} ${_priceType}</h5> 
        <div  style="font-size: 12px;">${[_minStockPriceDistanceInPercent, _maxStockPriceDistanceInPercent].filter(Boolean).join(" - ")} ${customLabels?.length ? customLabels.map(labelInfo => labelInfo.label + ':' + labelInfo.value).join(" - ") : ''}</div>
        <div  style="font-size: 12px;">${[minToSettlement, maxToSettlement].filter(Boolean).join(" - ")}</div>`

}

const htmlStrategyListCreator = ({strategyList, title, expectedProfitNotif}) => {

    return `<div class="strategy-filter-list-cnt" data-base-strategy-type="${strategyList[0]?.strategyTypeTitle}" >
                <div style="padding:5px;padding-right:10px;padding-left:10px; height: 50px;flex-shrink: 0;${expectedProfitNotif ? 'color:green' : ''}">
                    ${title}
                </div>
                <div style="
                    display: flex;
                    flex-direction: column;
                    row-gap: 10px;
                    overflow: auto;
                    padding: 5px;
                    border: ${expectedProfitNotif && strategyList?.length ? '7px solid #00d820' : '1px solid'};
                    flex-grow: 1;
                    ${expectedProfitNotif ? 'background: #f4fdf4;' : ''}
                    
                ">
                ${strategyList.map(_strategyObj => {
                    const  strategyFullSymbolNames = _strategyObj.positions.map(opt=>opt.symbol).join('-'); 
                    
        return `
                    <div style="display:flex;column-gap: 5px;    font-size: 16px;">
                        <span class="strategy-name" data-base-strategy-type="${_strategyObj.strategyTypeTitle}" 
                            data-base-strategy-full-symbol-names="${strategyFullSymbolNames}" >${_strategyObj.name}</span> 
                        <span style="margin-right:auto ;color:${_strategyObj.profitPercent > 0 ? '#005d00' : 'red'}">%${(_strategyObj.profitPercent * 100).toFixed(1)}</span>
                    </div>
                            
                    `
    }
    ).join('')}
            </div>
        
    </div>`

}
const parseStringToNumber = (str) => {
    let number = parseFloat(str);
    // ابتدا عدد را استخراج می‌کنیم
    if (str.endsWith('M') || str.endsWith('m')) {
        number *= 1e6;
        // در صورتی که با M ختم شود، به میلیون تبدیل می‌کنیم
    } else if (str.endsWith('B') || str.endsWith('b')) {
        number *= 1e9;
        // در صورتی که با B ختم شود، به میلیارد تبدیل می‌کنیم
    }
    return number;
}

const convertStringToInt = (stringNumber) => {
    if (!stringNumber)
        return NaN
    return parseInt(stringNumber.replaceAll(',', '').trim());
}

const createStrategyName = (options) => {
    let prevOptionSymBolWithoutDigits;
    return `${options.map(_option => {
        const symbolWithoutDigits = _option.symbol.replace(/[0-9]/g, '');
        if (prevOptionSymBolWithoutDigits === symbolWithoutDigits) {
            return _option.symbol.replace(symbolWithoutDigits, '');
        } else {
            prevOptionSymBolWithoutDigits = symbolWithoutDigits;
            return _option.symbol
        }
    }
    ).join('-')}`
}

const getAllPossibleStrategiesSorted = (_enrichedList) => {
    let allPossibleStrategies = _enrichedList.flatMap(_option => _option.allPossibleStrategies).filter(Boolean);

    allPossibleStrategies = allPossibleStrategies.sort( (strategyObjA, strategyObjB) => {
        if (strategyObjA.profitPercent < strategyObjB.profitPercent) {
            return 1;
        } else if (strategyObjA.profitPercent > strategyObjB.profitPercent) {
            return -1;
        }
        // a must be equal to b
        return 0;
    }
    )

    return allPossibleStrategies;

}

const isTaxFreeStock = (option) => {
    return ['اهرم', 'توان', 'موج', 'جهش', 'آساس'].some(taxFreeSymbol => option.optionDetails.stockSymbolDetails.symbol === taxFreeSymbol)
}

const getSettlementCommission = ({option, positionSide, settlementOn}) => {

    // settlementOn STOCK|OPTION

    if (option.isCall) {

        if (positionSide === 'BUY') {
            return settlementOn === 'OPTION' ? CONSTS.COMMISSION_FACTOR.OPTION.SETTLEMENT.BUY : CONSTS.COMMISSION_FACTOR.STOCK.BUY;
        } else if (positionSide === 'SELL') {
            const settlementOnOption = isTaxFreeStock(option) ? CONSTS.COMMISSION_FACTOR.OPTION.SETTLEMENT.TAX_FREE_SELL : CONSTS.COMMISSION_FACTOR.OPTION.SETTLEMENT.SELL;
            return settlementOn === 'OPTION' ? settlementOnOption : isETF(option.optionDetails.stockSymbolDetails.symbol) ? CONSTS.COMMISSION_FACTOR.ETF.SELL : CONSTS.COMMISSION_FACTOR.STOCK.SELL;
        }

    }

    if (option.isPut) {
        if (positionSide === 'BUY') {
            const settlementOnOption = isTaxFreeStock(option) ? CONSTS.COMMISSION_FACTOR.OPTION.SETTLEMENT.TAX_FREE_SELL : CONSTS.COMMISSION_FACTOR.OPTION.SETTLEMENT.SELL;
            return settlementOn === 'OPTION' ? settlementOnOption : CONSTS.COMMISSION_FACTOR.STOCK.SELL;

        } else if (positionSide === 'SELL') {
            return settlementOn === 'OPTION' ? CONSTS.COMMISSION_FACTOR.OPTION.SETTLEMENT.BUY : CONSTS.COMMISSION_FACTOR.STOCK.BUY;

        }

    }

}

// const getSettlementCommission = (option, positionSide) => {

//     if (option.isCall) {
//         return positionSide === 'BUY' ? CONSTS.COMMISSION_FACTOR.OPTION.SETTLEMENT.BUY : isTaxFreeStock(option) ? CONSTS.COMMISSION_FACTOR.OPTION.SETTLEMENT.TAX_FREE_SELL : CONSTS.COMMISSION_FACTOR.OPTION.SETTLEMENT.SELL
//     }

//     if (option.isPut) {
//         return positionSide === 'SELL' ? CONSTS.COMMISSION_FACTOR.STOCK.BUY : isTaxFreeStock(option) ? CONSTS.COMMISSION_FACTOR.OPTION.SETTLEMENT.TAX_FREE_SELL : CONSTS.COMMISSION_FACTOR.OPTION.SETTLEMENT.SELL
//     }

// }

const getPriceOfAsset = ({asset, priceType, sideType}) => {
   
    return priceType === CONSTS.PRICE_TYPE.LAST_PRICE ? asset.last : priceType === CONSTS.PRICE_TYPE.BEST_PRICE ? sideType === 'BUY' ? asset.bestSell : asset.bestBuy : 0;
}

const totalCostCalculator = ({buyOptions, buyStocks, sellOptions, priceType}) => {


    const totalBuyCost = [buyOptions, buyStocks].filter(Boolean).flatMap(list => list).reduce( (_totalBuyCost, asset) => {

        const price = getPriceOfAsset({
            asset,
            priceType,
            sideType: 'BUY'
        });

        if (!price)
            return (_totalBuyCost + Infinity)
        return _totalBuyCost + ((price) * (1 + getCommissionFactor(asset).BUY));
    }
    , 0);

    const totalSellCost = sellOptions.reduce( (_totalSellCost, asset) => {

        const price = getPriceOfAsset({
            asset,
            priceType,
            sideType: 'SELL'
        });

        if (!price)
            return (_totalSellCost + Infinity)

        return _totalSellCost + (price / (1 + getCommissionFactor(asset).SELL));
    }
    , 0);
    return totalSellCost - totalBuyCost
}

const totalSettlementGain = (positionInfoList) => {

    return positionInfoList.reduce( (_totalSettlementGain, positionInfo) => {

        const option = positionInfo.option;
        const positionSide = positionInfo.positionSide;
        const choosePriceType = positionInfo.choosePriceType;
        const strikePrice = option.optionDetails.strikePrice;
        const stockPrice = option.optionDetails.stockSymbolDetails.last;

        const settlementOn = choosePriceType === 'MIN' ? (strikePrice < stockPrice ? "OPTION" : "STOCK") : choosePriceType === 'MAX' ? (strikePrice > stockPrice ? "OPTION" : "STOCK") : "OPTION"
        const settlementPrice = settlementOn === "OPTION" ? strikePrice : stockPrice;
        const _getCommissionFactor = (_positionSide) => (1 + getSettlementCommission({
            option,
            positionSide: _positionSide,
            settlementOn
        }))

        if (option.isCall) {

            if (positionSide === 'BUY') {

                const commissionFactor = _getCommissionFactor(positionSide);

                return _totalSettlementGain - (settlementPrice * commissionFactor);

            } else if (positionSide === 'SELL') {

                const commissionFactor = _getCommissionFactor(positionSide);

                return _totalSettlementGain + (settlementPrice / commissionFactor)
            }
        } else if (option.isPut) {
            if (positionSide === 'BUY') {

                const commissionFactor = _getCommissionFactor(positionSide);

                return _totalSettlementGain + (settlementPrice / commissionFactor);

            } else if (positionSide === 'SELL') {

                const commissionFactor = _getCommissionFactor(positionSide);

                return _totalSettlementGain - (settlementPrice * commissionFactor)
            }

        }

    }
    , 0)

}

// const totalSettlementGain = ({ buyOption, sellOption, choosePriceType }) => {

//     if ((!buyOption || buyOption.isCall) && (!sellOption || sellOption.isCall)) {

//         const sellPrice = choosePriceType === 'MIN' ? Math.min(sellOption.optionDetails.strikePrice, sellOption.optionDetails.stockSymbolDetails.last) : sellOption.optionDetails.strikePrice;
//         const sellGainWithCommission = (sellPrice / (1 + getSettlementCommission({option:sellOption, positionSide:'SELL', settlementOn:"OPTION"})))

//         return sellGainWithCommission - (buyOption ? (buyOption.optionDetails.strikePrice * (1 + getSettlementCommission({option:buyOption, positionSide:'BUY', settlementOn:"OPTION"}))) : 0);

//     } else if ((!buyOption || buyOption.isPut) && (!sellOption || sellOption.isPut)) {
//         const buyPrice = choosePriceType === 'MAX' ? Math.max(sellOption.optionDetails.strikePrice, sellOption.optionDetails.stockSymbolDetails.last) : sellOption.optionDetails.strikePrice;

//         const buyCostWithCommission = buyPrice * (1 + getSettlementCommission({option:sellOption, positionSide:'SELL', settlementOn:"OPTION"}));
//         return (buyOption ? (buyOption.optionDetails.strikePrice * (1 + getSettlementCommission({option:buyOption, positionSide:'BUY', settlementOn:"OPTION"}))) : 0) - buyCostWithCommission

//     }

// }




const calcBOXStrategies = (list, {priceType, expectedProfitPerMonth, min_time_to_settlement=0, max_time_to_settlement=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = []
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ض') || option.vol < minVol)
                    return option


                const optionPrice = getPriceOfAsset({
                        asset: option,
                        priceType,
                        sideType: 'BUY'
                });

                if(optionPrice===0) return option

                const optionListWithHigherStrikePrice = optionListOfSameDate.filter(_option => _option.symbol !== option.symbol && _option.symbol.startsWith('ض') && _option.vol > minVol && _option.optionDetails?.strikePrice > option.optionDetails?.strikePrice);

                let allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (_allPossibleStrategies, higherStrikeOption) => {



                    const higherStrikeOptionPrice = getPriceOfAsset({
                        asset: higherStrikeOption,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(higherStrikeOptionPrice===0) return _allPossibleStrategies


                    const sameLowStrikePut = optionListOfSameDate.find(__option => __option.symbol === option.symbol.replace('ض', 'ط') && (__option.last > 10 ? __option.vol > minVol : true) && __option.bestBuy);
                    const sameHighStrikePut = optionListOfSameDate.find(__option => __option.symbol === higherStrikeOption.symbol.replace('ض', 'ط') && (__option.last > 10 ? __option.vol > minVol : true) && __option.bestSell);

                    if (!sameLowStrikePut || !sameHighStrikePut)
                        return _allPossibleStrategies


                    const sameLowStrikePutPrice = getPriceOfAsset({
                        asset: sameLowStrikePut,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(sameLowStrikePutPrice===0) return _allPossibleStrategies



                    const sameHighStrikePutPrice = getPriceOfAsset({
                        asset: sameHighStrikePut,
                        priceType,
                        sideType: 'BUY'
                    });

                    if(sameHighStrikePutPrice===0) return _allPossibleStrategies





                    const strategyPositions = [
                        {
                            ...option,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                        {
                            ...higherStrikeOption,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                        {
                            ...sameLowStrikePut,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                        {
                            ...sameHighStrikePut,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
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



                    const offsetPrice =  Math.max(...strategyPositions.map(strategyPosition=>strategyPosition.strikePrice))* 1.2;
                    
                    
                    const profit = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:offsetPrice});;
                    

                    const profitPercent = profit / Math.abs(totalCost);

                    const settlementGain =  settlementGainCalculator({strategyPositions,stockPrice: option.optionDetails?.stockSymbolDetails?.last})


                    const profitPercentOfSettlement = settlementGain / Math.abs(totalCost);

                    if(profitPercentOfSettlement<0.998) return _allPossibleStrategies
                    
                    const strategyObj = {
                        // TODO:remove option prop
                        option: {
                            ...option
                        },
                        positions:[option,higherStrikeOption, sameLowStrikePut,sameHighStrikePut],
                        strategyTypeTitle: "BOX",
                        expectedProfitNotif,
                        expectedProfitPerMonth,
                        name: createStrategyName([option, higherStrikeOption]),
                        profitPercent
                    }

                    if (Number.isNaN(strategyObj.profitPercent))
                        return _allPossibleStrategies

                    return _allPossibleStrategies.concat([strategyObj])

                }
                , []);

                // allPossibleStrategies = allPossibleStrategies.sort((strategyObjA, strategyObjB) => {
                //     if (strategyObjA.profitPercent < strategyObjB.profitPercent) {
                //         return 1;
                //     } else if (strategyObjA.profitPercent > strategyObjB.profitPercent) {
                //         return -1;
                //     }
                //     // a must be equal to b
                //     return 0;
                // }
                // )

                return {
                    ...option,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }
    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "BOX",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BOX",
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minVol
        })
    }

}


const calcBOX_BUPS_BECSStrategies = (list, {priceType, expectedProfitPerMonth, min_time_to_settlement=0, max_time_to_settlement=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = []
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ط') || option.vol < minVol)
                    return option


                const optionPrice = getPriceOfAsset({
                        asset: option,
                        priceType,
                        sideType: 'BUY'
                });

                if(optionPrice===0) return option

                const optionListWithHigherStrikePrice = optionListOfSameDate.filter(_option => _option.symbol !== option.symbol && _option.symbol.startsWith('ط') && _option.vol > minVol && _option.optionDetails?.strikePrice > option.optionDetails?.strikePrice);

                let allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (_allPossibleStrategies, higherStrikeOption) => {


                    const higherStrikeOptionPrice = getPriceOfAsset({
                        asset: higherStrikeOption,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(higherStrikeOptionPrice===0) return _allPossibleStrategies

                    const sameLowStrikeCall = optionListOfSameDate.find(__option => __option.symbol === option.symbol.replace('ط', 'ض') && (__option.last > 10 ? __option.vol > minVol : true) && __option.bestBuy);
                    const sameHighStrikeCall = optionListOfSameDate.find(__option => __option.symbol === higherStrikeOption.symbol.replace('ط', 'ض') && (__option.last > 10 ? __option.vol > minVol : true) && __option.bestSell);
                    
                    if (!sameLowStrikeCall || !sameHighStrikeCall)
                        return _allPossibleStrategies

                    const sameLowStrikeCallPrice = getPriceOfAsset({
                        asset: sameLowStrikeCall,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(sameLowStrikeCallPrice===0) return _allPossibleStrategies


                    const sameHighStrikeCallPrice = getPriceOfAsset({
                        asset: sameHighStrikeCall,
                        priceType,
                        sideType: 'BUY'
                    });

                    if(sameHighStrikeCallPrice===0) return _allPossibleStrategies









                    const diffOfBUPS_Strikes = higherStrikeOption.optionDetails.strikePrice - option.optionDetails.strikePrice;
                    const diffOfBECS_Strikes = sameHighStrikeCall.optionDetails.strikePrice - sameLowStrikeCall.optionDetails.strikePrice;


                    const strategyPositions = [
                        {
                            ...option,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                        {
                            ...higherStrikeOption,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin: () => diffOfBUPS_Strikes
                        },
                        {
                            ...sameLowStrikeCall,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin: () => diffOfBECS_Strikes
                        },
                        {
                            ...sameHighStrikeCall,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
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
                    
                   

                    const offsetPrice = Math.max(...strategyPositions.map(strategyPosition=>strategyPosition.strikePrice))* 1.2;

                    const profit = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:offsetPrice});;
                    

                    const profitPercent = profit  /  Math.abs(totalCost);










                    const settlementGain =  settlementGainCalculator({strategyPositions,stockPrice: option.optionDetails?.stockSymbolDetails?.last})


                    const profitPercentOfSettlement = settlementGain / Math.abs(totalCost);

                    if(profitPercentOfSettlement<0.998) return _allPossibleStrategies

                    
                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, higherStrikeOption,sameHighStrikeCall,sameLowStrikeCall],
                        strategyTypeTitle: "BOX_BUPS_BECS",
                        expectedProfitNotif,
                        expectedProfitPerMonth,
                        name: createStrategyName([option, higherStrikeOption]),
                        profitPercent
                    }

                    if (Number.isNaN(strategyObj.profitPercent))
                        return _allPossibleStrategies

                    return _allPossibleStrategies.concat([strategyObj])

                }
                , []);

              

                return {
                    ...option,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }
    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "BOX_BUPS_BECS",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BOX_BUPS_BECS",
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minVol
        })
    }

}


const calcLongGUTS_STRANGLEStrategies = (list, {priceType, expectedProfitPerMonth, settlementGainChoosePriceType="MIN", strategySubName, min_time_to_settlement=0, max_time_to_settlement=Infinity, minStockPriceDistanceFromHigherStrikeInPercent=-Infinity, maxStockPriceDistanceFromHigherStrikeInPercent=Infinity, minStockPriceDistanceFromSarBeSarInPercent=0, maxStockPriceDistanceFromSarBeSarInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ض') || option.vol < minVol || option.optionDetails?.strikePrice >= option.optionDetails.stockSymbolDetails.last)
                    return option

                const putListWithHigherStrike = optionListOfSameDate.filter(_option => {

                    if (_option.symbol === option.symbol || !_option.symbol.startsWith('ط') || _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice <= option.optionDetails?.strikePrice)
                        return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceHigherStrikeRatio > minStockPriceDistanceFromHigherStrikeInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceFromHigherStrikeInPercent) {} else {
                        return false
                    }

                    return true

                }
                );

                let allPossibleStrategies = putListWithHigherStrike.reduce( (_allPossibleStrategies, _option) => {







                    const strategyPositions = [
                        {
                            ...option,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                        {
                            ..._option,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                    ]



                    const totalCost = totalCostCalculatorCommon({
                        strategyPositions,
                        getPrice: (strategyPosition) => getPriceOfAsset({
                            asset: strategyPosition,
                            priceType,
                            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                        })
                    });

                    const offsetPrice = (option.strikePrice + _option.strikePrice)/2;



                    const profit = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:offsetPrice});



                    const profitPercent = profit / Math.abs(totalCost);
                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, _option],
                        strategyTypeTitle: "LongGUTS_STRANGLE",
                        expectedProfitNotif,
                        expectedProfitPerMonth,
                        name: createStrategyName([option, _option]),
                        profitPercent
                    }

                    if (Number.isNaN(strategyObj.profitPercent))
                        return _allPossibleStrategies

                    return _allPossibleStrategies.concat([strategyObj])

                }
                , []);

                return {
                    ...option,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "LongGUTS_STRANGLE",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceFromHigherStrikeInPercent,
        maxStockPriceDistanceFromHigherStrikeInPercent,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "LongGUTS_STRANGLE",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && minStockPriceDistanceFromHigherStrikeInPercent !== null && minStockPriceDistanceFromHigherStrikeInPercent !== -Infinity && {
                label: "minToHigh",
                value: `${((minStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && maxStockPriceDistanceFromHigherStrikeInPercent !== null && maxStockPriceDistanceFromHigherStrikeInPercent !== Infinity && {
                label: "maxToHigh",
                value: `${((maxStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof minStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && minStockPriceDistanceFromSarBeSarInPercent !== null && minStockPriceDistanceFromSarBeSarInPercent !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && maxStockPriceDistanceFromSarBeSarInPercent !== null && maxStockPriceDistanceFromSarBeSarInPercent !== Infinity && {
                label: "maxToSar",
                value: `${((maxStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, ].filter(Boolean),
            minVol
        })
    }

}

const calcShortGUTSStrategies = (list, {priceType, expectedProfitPerMonth, settlementGainChoosePriceType="MIN",
     strategySubName, callListIgnorer, min_time_to_settlement=0, max_time_to_settlement=Infinity, 
     minStockPriceToLowBreakevenPercent=0, maxStockPriceToLowBreakevenPercent=Infinity, 
     minStockPriceToHighBreakevenPercent=-Infinity, maxStockPriceToHighBreakevenPercent=0, 
     minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (callListIgnorer && callListIgnorer({
                    option,
                    minVol
                }))
                    return option

                const putListWithHigherStrikePriceThanStock = optionListOfSameDate.filter(_option => {


                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false


                    if (_option.symbol === option.symbol || !_option.symbol.startsWith('ط') || _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice <= _option.optionDetails.stockSymbolDetails.last)
                        return false

                    
                    return true

                }
                );

                let allPossibleStrategies = putListWithHigherStrikePriceThanStock.reduce( (_allPossibleStrategies, _option) => {

                    



                    const strategyPositions = [
                        {
                            ...option,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin:()=>option.calculatedRequiredMargin/1000
                        },
                        {
                            ..._option,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin:()=>option.calculatedRequiredMargin/1000
                        },
                      
                    ]



                    const totalCost = totalCostCalculatorCommon({
                        strategyPositions,
                        getPrice: (strategyPosition) => getPriceOfAsset({
                            asset: strategyPosition,
                            priceType,
                            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                        })
                    });


                    const breakevenList = findBreakevenList({
                        positions: strategyPositions,
                        getPrice: (strategyPosition) => getPriceOfAsset({
                            asset: strategyPosition,
                            priceType,
                            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                        })
                    });

                    const lowBreakeven = Math.min(...breakevenList);
                    const highBreakeven = Math.max(...breakevenList);





                    const stockPriceToLowBreakevenPercent = (option.optionDetails.stockSymbolDetails.last / lowBreakeven) - 1;
                    const stockPriceToHighBreakevenPercent = (option.optionDetails.stockSymbolDetails.last / highBreakeven) - 1;



                    if (stockPriceToLowBreakevenPercent < minStockPriceToLowBreakevenPercent || stockPriceToLowBreakevenPercent > maxStockPriceToLowBreakevenPercent)
                        return _allPossibleStrategies
                    if (stockPriceToHighBreakevenPercent < minStockPriceToHighBreakevenPercent || stockPriceToHighBreakevenPercent > maxStockPriceToHighBreakevenPercent)
                        return _allPossibleStrategies





                    const offsetPrice = (option.strikePrice + _option.strikePrice)/2;

                  


                    const profit = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:offsetPrice});


                    const profitPercent = profit / Math.abs(totalCost) ;
                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, _option],
                        strategyTypeTitle: "SHORT_GUTS",
                        expectedProfitNotif,
                        expectedProfitPerMonth,
                        name: createStrategyName([option, _option]),
                        profitPercent
                    }

                    if (Number.isNaN(strategyObj.profitPercent))
                        return _allPossibleStrategies

                    return _allPossibleStrategies.concat([strategyObj])

                }
                , []);

                return {
                    ...option,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "SHORT_GUTS",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "SHORT_GUTS",
            strategySubName,
            priceType,
            customLabels: [
                typeof minStockPriceToLowBreakevenPercent !== 'undefined' && minStockPriceToLowBreakevenPercent !== null && minStockPriceToLowBreakevenPercent !== -Infinity && {
                    label: "minToLow",
                    value: `${((minStockPriceToLowBreakevenPercent) * 100).toFixed(0)}%`
                },
                typeof maxStockPriceToHighBreakevenPercent !== 'undefined' && maxStockPriceToHighBreakevenPercent !== null && maxStockPriceToHighBreakevenPercent !== Infinity && {
                    label: "maxToHigh",
                    value: `${((maxStockPriceToHighBreakevenPercent) * 100).toFixed(0)}%`
                },].filter(Boolean),
            min_time_to_settlement,
            max_time_to_settlement,
            minVol
        })
    }

}
const calcShortSTRANGLEStrategies = (list, {priceType, expectedProfitPerMonth, settlementGainChoosePriceType="MIN", 
    strategySubName, callListIgnorer, min_time_to_settlement=0, max_time_to_settlement=Infinity, 
    minStockPriceToLowBreakevenPercent=0, maxStockPriceToLowBreakevenPercent=Infinity, 
    minStockPriceToHighBreakevenPercent=-Infinity, maxStockPriceToHighBreakevenPercent=0, 
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (callListIgnorer && callListIgnorer({
                    option,
                    minVol
                }))
                    return option

                const putList = optionListOfSameDate.filter(_option => {

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    if (_option.symbol === option.symbol || !_option.symbol.startsWith('ط') || _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice >= _option.optionDetails.stockSymbolDetails.last)
                        return false

                    

                    return true

                }
                );

                let allPossibleStrategies = putList.reduce( (_allPossibleStrategies, _option) => {



                     const strategyPositions = [
                        {
                            ...option,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin:()=>option.calculatedRequiredMargin/1000
                        },
                        {
                            ..._option,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin:()=>option.calculatedRequiredMargin/1000
                        },
                      
                    ]



                    const totalCost = totalCostCalculatorCommon({
                        strategyPositions,
                        getPrice: (strategyPosition) => getPriceOfAsset({
                            asset: strategyPosition,
                            priceType,
                            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                        })
                    });


                    const breakevenList = findBreakevenList({
                        positions: strategyPositions,
                        getPrice: (strategyPosition) => getPriceOfAsset({
                            asset: strategyPosition,
                            priceType,
                            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                        })
                    });

                    const lowBreakeven = Math.min(...breakevenList);
                    const highBreakeven = Math.max(...breakevenList);





                    const stockPriceToLowBreakevenPercent = (option.optionDetails.stockSymbolDetails.last / lowBreakeven) - 1;
                    const stockPriceToHighBreakevenPercent = (option.optionDetails.stockSymbolDetails.last / highBreakeven) - 1;



                    if (stockPriceToLowBreakevenPercent < minStockPriceToLowBreakevenPercent || stockPriceToLowBreakevenPercent > maxStockPriceToLowBreakevenPercent)
                        return _allPossibleStrategies
                    if (stockPriceToHighBreakevenPercent < minStockPriceToHighBreakevenPercent || stockPriceToHighBreakevenPercent > maxStockPriceToHighBreakevenPercent)
                        return _allPossibleStrategies


                    const offsetPrice = (option.strikePrice + _option.strikePrice)/2



                    const profit = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:offsetPrice});
                 


                    const profitPercent = profit / Math.abs(totalCost);
                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, _option],
                        strategyTypeTitle: "SHORT_STRANGLE",
                        expectedProfitNotif,
                        expectedProfitPerMonth,
                        name: createStrategyName([option, _option]),
                        profitPercent
                    }

                    if (Number.isNaN(strategyObj.profitPercent))
                        return _allPossibleStrategies

                    return _allPossibleStrategies.concat([strategyObj])

                }
                , []);

                return {
                    ...option,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);





    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "SHORT_STRANGLE",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "SHORT_STRANGLE",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [
                typeof minStockPriceToLowBreakevenPercent !== 'undefined' && minStockPriceToLowBreakevenPercent !== null && minStockPriceToLowBreakevenPercent !== -Infinity && {
                    label: "minToLow",
                    value: `${((minStockPriceToLowBreakevenPercent) * 100).toFixed(0)}%`
                },
                typeof maxStockPriceToHighBreakevenPercent !== 'undefined' && maxStockPriceToHighBreakevenPercent !== null && maxStockPriceToHighBreakevenPercent !== Infinity && {
                    label: "maxToHigh",
                    value: `${((maxStockPriceToHighBreakevenPercent) * 100).toFixed(0)}%`
                },].filter(Boolean),
            minVol
        })
    }

}

const calcBUCSStrategies = (list, {priceType, expectedProfitPerMonth, settlementGainChoosePriceType="MIN", strategySubName, BUCSSOptionListIgnorer=generalConfig.BUCSSOptionListIgnorer, min_time_to_settlement=0, max_time_to_settlement=Infinity, minStockPriceDistanceFromHigherStrikeInPercent=-Infinity, maxStockPriceDistanceFromHigherStrikeInPercent=Infinity, minStockPriceDistanceFromSarBeSarInPercent=0, maxStockPriceDistanceFromSarBeSarInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (BUCSSOptionListIgnorer({
                    option,
                    minVol
                }))
                    return option

                const optionListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    if (_option.symbol === option.symbol || !_option.symbol.startsWith('ض') || _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice < option.optionDetails?.strikePrice)
                        return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceHigherStrikeRatio > minStockPriceDistanceFromHigherStrikeInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceFromHigherStrikeInPercent) {} else {
                        return false
                    }

                    const lowStrikePrice = getPriceOfAsset({
                        asset: option,
                        priceType,
                        sideType: 'BUY'
                    });
                    const highStrikePrice = getPriceOfAsset({
                        asset: _option,
                        priceType,
                        sideType: 'SELL'
                    });
                    // TODO: use breakeven function 
                    const sarBeSar = option.optionDetails?.strikePrice + (lowStrikePrice - highStrikePrice);

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceSarBeSarRatio = (_option.optionDetails.stockSymbolDetails.last / sarBeSar) - 1;

                    if (stockPriceSarBeSarRatio > minStockPriceDistanceFromSarBeSarInPercent && stockPriceSarBeSarRatio < maxStockPriceDistanceFromSarBeSarInPercent) {} else {
                        return false
                    }

                    return true

                }
                );

                let allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (_allPossibleStrategies, _option) => {

                    const strategyPositions = [
                        {
                            ...option,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                        {
                            ..._option,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                     
                    ]



                    const totalCost = totalCostCalculatorCommon({
                        strategyPositions,
                        getPrice: (strategyPosition) => getPriceOfAsset({
                            asset: strategyPosition,
                            priceType,
                            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                        })
                    });




                    const settlementOn = settlementGainChoosePriceType === 'MIN' ? (_option.strikePrice < _option.optionDetails.stockSymbolDetails.last ? "OPTION" : "STOCK") : settlementGainChoosePriceType === 'MAX' ? (_option.strikePrice > _option.optionDetails.stockSymbolDetails.last ? "OPTION" : "STOCK") : "OPTION"
                    const offsetPrice = settlementOn === "OPTION" ? _option.strikePrice*1.2 : _option.optionDetails.stockSymbolDetails.last;

                    const profit = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: offsetPrice });


                    const profitPercent = profit / Math.abs(totalCost);


                    // if(option.symbol==='ضخود1151' && _option.symbol==='ضخود1152'){
                    //     profitPercent>0 && console.log(profitPercent);

                    // }
                    
                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, _option],
                        strategyTypeTitle: "BUCS",
                        expectedProfitNotif,
                        expectedProfitPerMonth,
                        name: createStrategyName([option, _option]),
                        profitPercent
                    }

                    if (Number.isNaN(strategyObj.profitPercent))
                        return _allPossibleStrategies

                    return _allPossibleStrategies.concat([strategyObj])

                }
                , []);

                return {
                    ...option,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "BUCS",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceFromHigherStrikeInPercent,
        maxStockPriceDistanceFromHigherStrikeInPercent,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BUCS",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && minStockPriceDistanceFromHigherStrikeInPercent !== null && minStockPriceDistanceFromHigherStrikeInPercent !== -Infinity && {
                label: "minToHigh",
                value: `${((minStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && maxStockPriceDistanceFromHigherStrikeInPercent !== null && maxStockPriceDistanceFromHigherStrikeInPercent !== Infinity && {
                label: "maxToHigh",
                value: `${((maxStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof minStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && minStockPriceDistanceFromSarBeSarInPercent !== null && minStockPriceDistanceFromSarBeSarInPercent !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && maxStockPriceDistanceFromSarBeSarInPercent !== null && maxStockPriceDistanceFromSarBeSarInPercent !== Infinity && {
                label: "maxToSar",
                value: `${((maxStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, ].filter(Boolean),
            minVol
        })
    }

}


const calcBUPSStrategies = (list, {priceType, expectedProfitPerMonth, settlementGainChoosePriceType="MIN", strategySubName, BUPSOptionListIgnorer=generalConfig.BUPSOptionListIgnorer, min_time_to_settlement=0, max_time_to_settlement=Infinity, minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (BUPSOptionListIgnorer({
                    option,
                    minVol
                }))
                    return option


                const optionPrice = getPriceOfAsset({
                    asset: option,
                    priceType,
                    sideType: 'BUY'
                });

                if(optionPrice===0) return option
               

                const optionListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === option.symbol || !_option.symbol.startsWith('ط'))
                        return false
                    if (_option.optionDetails?.strikePrice < option.optionDetails?.strikePrice)
                        return false
                    if (_option.vol < minVol)
                        return false
                    return true

                }
                );

                let allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (_allPossibleStrategies, _option) => {




                    const _optionPrice = getPriceOfAsset({
                        asset: _option,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(_optionPrice===0) return _allPossibleStrategies


                    const stockPriceHigherStrikeRatio = (option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceHigherStrikeRatio < minStockPriceDistanceInPercent || stockPriceHigherStrikeRatio > maxStockPriceDistanceInPercent)
                        return _allPossibleStrategies








                    const diffOfBUPS_Strikes = _option.optionDetails.strikePrice - option.optionDetails.strikePrice



                    const strategyPositions = [
                        {
                            ...option,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                        {
                            ..._option,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin: () => diffOfBUPS_Strikes
                        },
                       
                    ]



                    const totalCost = totalCostCalculatorCommon({
                        strategyPositions,
                        getPrice: (strategyPosition) => getPriceOfAsset({
                            asset: strategyPosition,
                            priceType,
                            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                        })
                    });


                    const offsetPrice = Math.max(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) * 1.2;



                    const profit = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: offsetPrice });


                    const profitPercent = profit / Math.abs(totalCost);
                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, _option],
                        strategyTypeTitle: "BUPS",
                        expectedProfitNotif,
                        expectedProfitPerMonth,
                        name: createStrategyName([option, _option]),
                        profitPercent
                    }

                    if (Number.isNaN(strategyObj.profitPercent))
                        return _allPossibleStrategies

                    return _allPossibleStrategies.concat([strategyObj])

                }
                , []);

                return {
                    ...option,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "BUPS",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceInPercent,
        maxStockPriceDistanceInPercent,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BUPS",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceInPercent,
            maxStockPriceDistanceInPercent,
            minVol
        })
    }

}



const calcSyntheticCoveredCallStrategies = (list, 
    {priceType, strategySubName,minQuantityFactorOfBUCS=0.6, 
        minStockPriceToSarBeSarPercent=-Infinity,
        maxStockPriceToSarBeSarPercent=Infinity,
        BUCSSOptionListIgnorer=generalConfig.BUCSSOptionListIgnorer, min_time_to_settlement=0, 
        max_time_to_settlement=Infinity, 
        minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(buyingCall => {

                if (!buyingCall.optionDetails?.stockSymbolDetails || !buyingCall.isCall || buyingCall.vol < minVol)
                return buyingCall

               


                const buyingCallPrice = getPriceOfAsset({
                    asset: buyingCall,
                    priceType,
                    sideType: 'BUY'
                });
                if(buyingCallPrice===0) return buyingCall


                const sameStrikePut = optionListOfSameDate.find(__option => __option.symbol === buyingCall.symbol.replace('ض', 'ط') && (__option.last > 10 ? __option.vol > minVol : true));
                if(!sameStrikePut) return buyingCall
                const sameStrikePutPrice = getPriceOfAsset({
                    asset: sameStrikePut,
                    priceType,
                    sideType: 'SELL'
                });
                if(sameStrikePutPrice===0) return buyingCall


                const sellingCallList = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingCall.symbol || !_option.isCall || _option.vol < minVol)
                        return false

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    return true

                }
                );

                let allPossibleStrategies = sellingCallList.reduce( (_allPossibleStrategies, sellingCall) => {

                    
                    const sellingCallPrice = getPriceOfAsset({
                        asset: sellingCall,
                        priceType,
                        sideType: 'SELL'
                    });
                    if(sellingCallPrice===0) return _allPossibleStrategies



                    const strategyPositions = [
                        {
                            ...buyingCall,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin: () => 0
                        },
                        {
                            ...sameStrikePut,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin: () => {
                                return (calculateOptionMargin({
                                    priceSpot: sameStrikePut.optionDetails.stockSymbolDetails.last,
                                    strikePrice: sameStrikePut.optionDetails.strikePrice,
                                    contractSize: 1000,
                                    optionPremium: sameStrikePut.last,
                                    optionType: sameStrikePut.isCall ? "call" : "put"
                                })?.required || 0) / 1000;
                            }
                        },
                        {
                            ...sellingCall,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin: () => {

                                if(sellingCall.optionDetails.strikePrice > buyingCall.optionDetails.strikePrice) return 0

                                return (buyingCall.optionDetails.strikePrice - sellingCall.optionDetails.strikePrice);
                               
                            }
                        },
                    ]



                    const breakevenList = findBreakevenList({
                        positions: strategyPositions,
                        getPrice: (strategyPosition) => getPriceOfAsset({
                            asset: strategyPosition,
                            priceType,
                            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                        })
                    });

                    const breakeven = breakevenList[0];


                    const stockPriceToSarBeSarPercent = (sellingCall.optionDetails.stockSymbolDetails.last/breakeven) - 1;



                    if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSarPercent || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSarPercent)
                        return _allPossibleStrategies



                    const totalCost = totalCostCalculatorCommon({
                        strategyPositions,
                        getPrice: (strategyPosition) => getPriceOfAsset({
                            asset: strategyPosition,
                            priceType,
                            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                        })
                    });






                    const priceThatCauseMaxProfit = Math.max(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) * 1.3;



                    const maxProfit = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: priceThatCauseMaxProfit });



                    const profitPercent = maxProfit / Math.abs(totalCost);


                    const strategyObj ={
                        option: {
                            ...buyingCall
                        },
                        positions: [buyingCall, sameStrikePut, sellingCall],
                        strategyTypeTitle: "SYNTHETIC_COVERED_CALL",
                        expectedProfitNotif,
                        name: createStrategyName([buyingCall, sameStrikePut, sellingCall]),
                        profitPercent: stockPriceToSarBeSarPercent,
                        // percentToShow: stockPriceToSarBeSarPercent
                    }

                    

                    if(!isProfitEnough({strategy:strategyObj,profitPercent:profitPercent})) return _allPossibleStrategies

                    return _allPossibleStrategies.concat([strategyObj])


                }
                , []);

                return {
                    ...buyingCall,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "SYNTHETIC_COVERED_CALL",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceToSarBeSarPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        
        htmlTitle: configsToHtmlTitle({
            strategyName: "SYNTHETIC_COVERED_CALL",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceToSarBeSarPercent,
            minVol,
            customLabels: [
            typeof minStockPriceToSarBeSarPercent !== 'undefined' && minStockPriceToSarBeSarPercent !== null && minStockPriceToSarBeSarPercent !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceToSarBeSarPercent) * 100).toFixed(0)}%`
            }].filter(Boolean),
        })
    }

}

// مرید پوت مصنوعی
const calcBUPS_COLLARStrategies = (list, {priceType, expectedProfitPerMonth, 
    settlementGainChoosePriceType="MIN", strategySubName, 
    BUPSOptionListIgnorer=generalConfig.BUPSOptionListIgnorer, 
    justIfWholeIsPofitable=false,
    min_time_to_settlement=0, max_time_to_settlement=Infinity, 
    minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, 
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (BUPSOptionListIgnorer({
                    option,
                    minVol
                }))
                    return option

                const optionPrice = getPriceOfAsset({
                    asset: option,
                    priceType,
                    sideType: 'BUY'
                });

                if(optionPrice===0) return option
               

                const optionListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === option.symbol || !_option.symbol.startsWith('ط'))
                        return false
                    if (_option.optionDetails?.strikePrice < option.optionDetails?.strikePrice)
                        return false
                    if (_option.vol < minVol)
                        return false
                    return true

                }
                );

                let allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (_allPossibleStrategies, _option) => {

                    const _optionPrice = getPriceOfAsset({
                        asset: _option,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(_optionPrice===0) return _allPossibleStrategies


                    const callOptionWithSameStrike = optionListOfSameDate.find(optionOfSameDate => {
                        return optionOfSameDate.isCall && optionOfSameDate.bestSell > 0 && (optionOfSameDate.optionDetails?.strikePrice === _option.optionDetails?.strikePrice)
                    }
                    );

                    if (!callOptionWithSameStrike) {
                        return _allPossibleStrategies
                    }


                    const callOptionWithSameStrikePrice = getPriceOfAsset({
                        asset: callOptionWithSameStrike,
                        priceType,
                        sideType: 'BUY'
                    });

                    if(callOptionWithSameStrikePrice===0) return _allPossibleStrategies

                    const stockPriceHigherStrikeRatio = (option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceHigherStrikeRatio < minStockPriceDistanceInPercent || stockPriceHigherStrikeRatio > maxStockPriceDistanceInPercent)
                        return _allPossibleStrategies











                    const diffOfBUPS_Strikes = _option.optionDetails?.strikePrice - option.optionDetails?.strikePrice;



                    const strategyPositions = [
                        {
                            ...option,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                        {
                            ..._option,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin: () => diffOfBUPS_Strikes
                        },
                        {
                            ...callOptionWithSameStrike,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                       
                    ]



                    const totalCost = totalCostCalculatorCommon({
                        strategyPositions,
                        getPrice: (strategyPosition) => getPriceOfAsset({
                            asset: strategyPosition,
                            priceType,
                            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                        })
                    });



                    const offsetPrice = Math.min(...strategyPositions.map(strategyPosition=>strategyPosition.strikePrice))/ 1.2;



                    const profit = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:offsetPrice});


                    const profitPercent = profit / Math.abs(totalCost);



                    const settlementGain =  settlementGainCalculator({strategyPositions,stockPrice: option.optionDetails?.stockSymbolDetails?.last})


                    const profitPercentOfSettlement = settlementGain / Math.abs(totalCost);

                    if(profitPercentOfSettlement<0.998) return _allPossibleStrategies


                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, _option,callOptionWithSameStrike],
                        strategyTypeTitle: "BUPS_COLLAR",
                        expectedProfitNotif,
                        expectedProfitPerMonth,
                        name: createStrategyName([option, _option,callOptionWithSameStrike]),
                        profitPercent : justIfWholeIsPofitable ? profit>=0 ? 1 :0:profitPercent
                    }

                    if (Number.isNaN(strategyObj.profitPercent))
                        return _allPossibleStrategies

                    return _allPossibleStrategies.concat([strategyObj])

                }
                , []);

                return {
                    ...option,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "BUPS_COLLAR",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceInPercent,
        maxStockPriceDistanceInPercent,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BUPS_COLLAR",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceInPercent,
            maxStockPriceDistanceInPercent,
            minVol
        })
    }

}


const calcCALL_BUTT_CONDORStrategies = (list, {priceType, settlementGainChoosePriceType="MIN", strategySubName, BUCSSOptionListIgnorer=generalConfig.BUCSSOptionListIgnorer, min_time_to_settlement=0, max_time_to_settlement=Infinity, minStockPriceDistanceFromHigherStrikeInPercent=-Infinity, maxStockPriceDistanceFromHigherStrikeInPercent=Infinity, minStockPriceDistanceFromSarBeSarInPercent=-Infinity, maxStockPriceDistanceFromSarBeSarInPercent=Infinity, MIN_BUCS_BECS_diffStrikesRatio=0, MAX_BUCS_BECS_diffStrikesRatio=Infinity, minStockStrike4DistanceInPercent=-Infinity, maxStockStrike4DistanceInPercent=Infinity, minStockMiddleDistanceInPercent=-Infinity, maxStockMiddleDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, minProfitLossRatio=.7, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (BUCSSOptionListIgnorer({
                    option,
                    minVol
                }))
                    return option


                const priceOfOptionWithLowStrike = getPriceOfAsset({
                    asset: option,
                    priceType,
                    sideType: 'BUY'
                });

                if(priceOfOptionWithLowStrike===0) return option

                const optionListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                    if (_option.symbol === option.symbol || !_option.symbol.startsWith('ض') || _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice < option.optionDetails?.strikePrice)
                        return false

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceHigherStrikeRatio > minStockPriceDistanceFromHigherStrikeInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceFromHigherStrikeInPercent) {} else {
                        return false
                    }

                    
                    const highStrikePrice = getPriceOfAsset({
                        asset: _option,
                        priceType,
                        sideType: 'SELL'
                    });
                    

                     // TODO: use breakeven function 

                    const sarBeSar = option.optionDetails?.strikePrice + (priceOfOptionWithLowStrike - highStrikePrice);

                    

                    const stockPriceSarBeSarRatio = (_option.optionDetails.stockSymbolDetails.last / sarBeSar) - 1;

                    if (stockPriceSarBeSarRatio > minStockPriceDistanceFromSarBeSarInPercent && stockPriceSarBeSarRatio < maxStockPriceDistanceFromSarBeSarInPercent) {} else {
                        return false
                    }

                    return true

                }
                );

                let allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (_allPossibleStrategies, option2) => {


                    const option2Price = getPriceOfAsset({
                        asset: option2,
                        priceType,
                        sideType: 'SELL'
                    });
                    if(option2Price===0) return _allPossibleStrategies


                    

                    let __allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (___allPossibleStrategies, option3) => {

                        const option3Price = getPriceOfAsset({
                            asset: option3,
                            priceType,
                            sideType: 'SELL'
                        });
                        if(option3Price===0) return ___allPossibleStrategies

                        const optionListWithHigherStrikePriceThanO3 = optionListWithHigherStrikePrice.filter(o => {
                            if (o.symbol === option2.symbol || o.symbol === option3.symbol)
                                return false

                            if (o.optionDetails?.strikePrice <= option3.optionDetails?.strikePrice)
                                return false

                            return true

                        }
                        );
                        let strategies = optionListWithHigherStrikePriceThanO3.reduce( (___allPossibleStrategies, option4) => {

                           


                            const option4Price = getPriceOfAsset({
                                asset: option4,
                                priceType,
                                sideType: 'BUY'
                            });
                            if(option4Price===0) return ___allPossibleStrategies
                            const middlePrice = option2.optionDetails?.strikePrice === option3.optionDetails?.strikePrice ? option2.optionDetails?.strikePrice : (option3.optionDetails?.strikePrice + option2.optionDetails?.strikePrice) / 2;

                            const stockPriceMiddleRatio = (option4.optionDetails.stockSymbolDetails.last / middlePrice) - 1;
                            if (stockPriceMiddleRatio > maxStockMiddleDistanceInPercent || stockPriceMiddleRatio < minStockMiddleDistanceInPercent)
                                return ___allPossibleStrategies

                            const stockPriceStrike4Ratio = (option4.optionDetails.stockSymbolDetails.last / option4.optionDetails?.strikePrice) - 1;

                            if (stockPriceStrike4Ratio > maxStockStrike4DistanceInPercent || stockPriceStrike4Ratio < minStockStrike4DistanceInPercent)
                                return ___allPossibleStrategies

                            // if (option.optionDetails.stockSymbolDetails.last  > option4.optionDetails?.strikePrice) return ___allPossibleStrategies
                            if (option4.optionDetails?.strikePrice < option2.optionDetails?.strikePrice)
                                return ___allPossibleStrategies


                            const diffOfBUCS_Strikes = option2.optionDetails?.strikePrice - option.optionDetails?.strikePrice;
                            const diffOfBECS_Strikes = option4.optionDetails?.strikePrice - option3.optionDetails?.strikePrice;

                            const BUCS_BECS_diffStrikesRatio = diffOfBUCS_Strikes / diffOfBECS_Strikes;

                            if (BUCS_BECS_diffStrikesRatio < MIN_BUCS_BECS_diffStrikesRatio || BUCS_BECS_diffStrikesRatio > MAX_BUCS_BECS_diffStrikesRatio)
                                return ___allPossibleStrategies


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
                                    getQuantity: () => baseQuantity * BUCS_BECS_diffStrikesRatio,
                                    getRequiredMargin: () => diffOfBECS_Strikes
                                },
                                {
                                    ...option4,
                                    isBuy: true,
                                    getQuantity: () => baseQuantity * BUCS_BECS_diffStrikesRatio,
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
                            if (BUCS_BECS_diffStrikesRatio > 1) {
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
                                return ___allPossibleStrategies


                            const minProfitPercent = (minProfitLossOfButterfly/Math.abs(totalCost))*100;

                            const maxStrike = Math.max(...strategyPositions.map(strategyPosition=>strategyPosition.strikePrice));
                            const stockPrice = option.optionDetails.stockSymbolDetails.last;

                            if( (stockPrice > (maxStrike* 1.1)) &&    minProfitPercent<2){
                                return ___allPossibleStrategies
                            }

                            const strategyObj = {
                                option: {
                                    ...option
                                },
                                positions:[option, option2, option3, option4],
                                strategyTypeTitle: "CALL_BUTT_CONDOR",
                                expectedProfitNotif,
                                name: createStrategyName([option, option2, option3, option4]),
                                profitPercent: profitLossPresent
                            }

                            return ___allPossibleStrategies.concat([strategyObj])

                        }
                        , []);

                        return ___allPossibleStrategies.concat(strategies)

                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

                }
                , []);

                return {
                    ...option,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "CALL_BUTT_CONDOR",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceFromHigherStrikeInPercent,
        maxStockPriceDistanceFromHigherStrikeInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "CALL_BUTT_CONDOR",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && minStockPriceDistanceFromHigherStrikeInPercent !== null && minStockPriceDistanceFromHigherStrikeInPercent !== -Infinity && {
                label: "minToHigh",
                value: `${((minStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && maxStockPriceDistanceFromHigherStrikeInPercent !== null && maxStockPriceDistanceFromHigherStrikeInPercent !== Infinity && {
                label: "maxToHigh",
                value: `${((maxStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof minStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && minStockPriceDistanceFromSarBeSarInPercent !== null && minStockPriceDistanceFromSarBeSarInPercent !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && maxStockPriceDistanceFromSarBeSarInPercent !== null && maxStockPriceDistanceFromSarBeSarInPercent !== Infinity && {
                label: "maxToSar",
                value: `${((maxStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, ].filter(Boolean),
            minVol
        })
    }

}


const calcCALL_BUTTERFLYStrategies = (list, {priceType, settlementGainChoosePriceType="MIN", strategySubName, BUCSSOptionListIgnorer=generalConfig.BUCSSOptionListIgnorer, min_time_to_settlement=0, max_time_to_settlement=Infinity, minStockPriceDistanceFromHigherStrikeInPercent=-Infinity, maxStockPriceDistanceFromHigherStrikeInPercent=Infinity, minStockPriceDistanceFromSarBeSarInPercent=-Infinity, maxStockPriceDistanceFromSarBeSarInPercent=Infinity, MIN_BUCS_BECS_diffStrikesRatio=0, MAX_BUCS_BECS_diffStrikesRatio=Infinity, minStockStrike4DistanceInPercent=-Infinity, maxStockStrike4DistanceInPercent=Infinity, minStockMiddleDistanceInPercent=-Infinity, maxStockMiddleDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, minProfitLossRatio=.7, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (BUCSSOptionListIgnorer({
                    option,
                    minVol
                }))
                    return option


                const priceOfOptionWithLowStrike = getPriceOfAsset({
                    asset: option,
                    priceType,
                    sideType: 'BUY'
                });

                if(priceOfOptionWithLowStrike===0) return option

                const callListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                    if (_option.symbol === option.symbol || !_option.isCall || _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice < option.optionDetails?.strikePrice)
                        return false

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceHigherStrikeRatio > minStockPriceDistanceFromHigherStrikeInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceFromHigherStrikeInPercent) {} else {
                        return false
                    }

                    
                    const highStrikePrice = getPriceOfAsset({
                        asset: _option,
                        priceType,
                        sideType: 'SELL'
                    });
                    

                     // TODO: use breakeven function 

                    const sarBeSar = option.optionDetails?.strikePrice + (priceOfOptionWithLowStrike - highStrikePrice);

                    

                    const stockPriceSarBeSarRatio = (_option.optionDetails.stockSymbolDetails.last / sarBeSar) - 1;

                    if (stockPriceSarBeSarRatio > minStockPriceDistanceFromSarBeSarInPercent && stockPriceSarBeSarRatio < maxStockPriceDistanceFromSarBeSarInPercent) {} else {
                        return false
                    }

                    return true

                }
                );

                let allPossibleStrategies = callListWithHigherStrikePrice.reduce( (_allPossibleStrategies, option2) => {


                    const option2Price = getPriceOfAsset({
                        asset: option2,
                        priceType,
                        sideType: 'SELL'
                    });
                    if(option2Price===0) return _allPossibleStrategies

                    

                    

                    let option3 = option2;


                    const callListWithHigherStrikePriceThanO3 = callListWithHigherStrikePrice.filter(o => {
                            if (o.symbol === option2.symbol || o.symbol === option3.symbol)
                                return false

                            if (o.optionDetails?.strikePrice <= option3.optionDetails?.strikePrice)
                                return false

                            return true

                        }
                        );
                    let strategies = callListWithHigherStrikePriceThanO3.reduce( (___allPossibleStrategies, option4) => {

                        


                        const option4Price = getPriceOfAsset({
                            asset: option4,
                            priceType,
                            sideType: 'BUY'
                        });
                        if(option4Price===0) return ___allPossibleStrategies
                        const middlePrice = option2.optionDetails?.strikePrice === option3.optionDetails?.strikePrice ? option2.optionDetails?.strikePrice : (option3.optionDetails?.strikePrice + option2.optionDetails?.strikePrice) / 2;

                        const stockPriceMiddleRatio = (option4.optionDetails.stockSymbolDetails.last / middlePrice) - 1;
                        if (stockPriceMiddleRatio > maxStockMiddleDistanceInPercent || stockPriceMiddleRatio < minStockMiddleDistanceInPercent)
                            return ___allPossibleStrategies

                        const stockPriceStrike4Ratio = (option4.optionDetails.stockSymbolDetails.last / option4.optionDetails?.strikePrice) - 1;

                        if (stockPriceStrike4Ratio > maxStockStrike4DistanceInPercent || stockPriceStrike4Ratio < minStockStrike4DistanceInPercent)
                            return ___allPossibleStrategies

                        // if (option.optionDetails.stockSymbolDetails.last  > option4.optionDetails?.strikePrice) return ___allPossibleStrategies
                        if (option4.optionDetails?.strikePrice < option2.optionDetails?.strikePrice)
                            return ___allPossibleStrategies



                        const diffOfBUCS_Strikes = option2.optionDetails?.strikePrice - option.optionDetails?.strikePrice;
                        const diffOfBECS_Strikes = option4.optionDetails?.strikePrice - option3.optionDetails?.strikePrice;

                        const BUCS_BECS_diffStrikesRatio = diffOfBUCS_Strikes / diffOfBECS_Strikes;

                        if (BUCS_BECS_diffStrikesRatio < MIN_BUCS_BECS_diffStrikesRatio || BUCS_BECS_diffStrikesRatio > MAX_BUCS_BECS_diffStrikesRatio)
                            return ___allPossibleStrategies


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
                                getQuantity: () => baseQuantity * BUCS_BECS_diffStrikesRatio,
                                getRequiredMargin: () => diffOfBECS_Strikes
                            },
                            {
                                ...option4,
                                isBuy: true,
                                getQuantity: () => baseQuantity * BUCS_BECS_diffStrikesRatio,
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
                        if (BUCS_BECS_diffStrikesRatio > 1) {
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
                            return ___allPossibleStrategies



                        

                        const strategyObj = {
                            option: {
                                ...option
                            },
                            positions:[option, option2, option3, option4],
                            strategyTypeTitle: "CALL_BUTTERFLY",
                            expectedProfitNotif,
                            name: createStrategyName([option, option2, option3, option4]),
                            profitPercent: profitLossPresent
                        }

                        return ___allPossibleStrategies.concat([strategyObj])

                    }
                    , []);

                  

                    return _allPossibleStrategies.concat(strategies)

                }
                , []);

                return {
                    ...option,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "CALL_BUTTERFLY",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceFromHigherStrikeInPercent,
        maxStockPriceDistanceFromHigherStrikeInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "CALL_BUTTERFLY",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && minStockPriceDistanceFromHigherStrikeInPercent !== null && minStockPriceDistanceFromHigherStrikeInPercent !== -Infinity && {
                label: "minToHigh",
                value: `${((minStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && maxStockPriceDistanceFromHigherStrikeInPercent !== null && maxStockPriceDistanceFromHigherStrikeInPercent !== Infinity && {
                label: "maxToHigh",
                value: `${((maxStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof minStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && minStockPriceDistanceFromSarBeSarInPercent !== null && minStockPriceDistanceFromSarBeSarInPercent !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && maxStockPriceDistanceFromSarBeSarInPercent !== null && maxStockPriceDistanceFromSarBeSarInPercent !== Infinity && {
                label: "maxToSar",
                value: `${((maxStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, ].filter(Boolean),
            minVol
        })
    }

}



const calcCALL_CONDORStrategies = (list, {priceType, settlementGainChoosePriceType="MIN", strategySubName, BUCSSOptionListIgnorer=generalConfig.BUCSSOptionListIgnorer, min_time_to_settlement=0, max_time_to_settlement=Infinity, minStockPriceDistanceFromHigherStrikeInPercent=-Infinity, maxStockPriceDistanceFromHigherStrikeInPercent=Infinity, minStockPriceDistanceFromSarBeSarInPercent=-Infinity, maxStockPriceDistanceFromSarBeSarInPercent=Infinity, MIN_BUCS_BECS_diffStrikesRatio=0, MAX_BUCS_BECS_diffStrikesRatio=Infinity, minStockStrike4DistanceInPercent=-Infinity, maxStockStrike4DistanceInPercent=Infinity, minStockMiddleDistanceInPercent=-Infinity, maxStockMiddleDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, minProfitLossRatio=.7, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (BUCSSOptionListIgnorer({
                    option,
                    minVol
                }))
                    return option


                const priceOfOptionWithLowStrike = getPriceOfAsset({
                    asset: option,
                    priceType,
                    sideType: 'BUY'
                });

                if(priceOfOptionWithLowStrike===0) return option

                const callListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                    if (_option.symbol === option.symbol || !_option.isCall || _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice < option.optionDetails?.strikePrice)
                        return false

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceHigherStrikeRatio > minStockPriceDistanceFromHigherStrikeInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceFromHigherStrikeInPercent) {} else {
                        return false
                    }

                    
                    const highStrikePrice = getPriceOfAsset({
                        asset: _option,
                        priceType,
                        sideType: 'SELL'
                    });
                    

                     // TODO: use breakeven function 
                    const sarBeSar = option.optionDetails?.strikePrice + (priceOfOptionWithLowStrike - highStrikePrice);

                    

                    const stockPriceSarBeSarRatio = (_option.optionDetails.stockSymbolDetails.last / sarBeSar) - 1;

                    if (stockPriceSarBeSarRatio > minStockPriceDistanceFromSarBeSarInPercent && stockPriceSarBeSarRatio < maxStockPriceDistanceFromSarBeSarInPercent) {} else {
                        return false
                    }

                    return true

                }
                );

                let allPossibleStrategies = callListWithHigherStrikePrice.reduce( (_allPossibleStrategies, option2) => {


                    const option2Price = getPriceOfAsset({
                        asset: option2,
                        priceType,
                        sideType: 'SELL'
                    });
                    if(option2Price===0) return _allPossibleStrategies

                    

                    let __allPossibleStrategies = callListWithHigherStrikePrice.reduce( (___allPossibleStrategies, option3) => {

                        if(option3.symbol===option2.symbol) return ___allPossibleStrategies

                        const option3Price = getPriceOfAsset({
                            asset: option3,
                            priceType,
                            sideType: 'SELL'
                        });
                        if(option3Price===0) return ___allPossibleStrategies

                        const callListWithHigherStrikePriceThanO3 = callListWithHigherStrikePrice.filter(o => {
                            if (o.symbol === option2.symbol || o.symbol === option3.symbol)
                                return false

                            if (o.optionDetails?.strikePrice <= option3.optionDetails?.strikePrice)
                                return false

                            return true

                        }
                        );
                        let strategies = callListWithHigherStrikePriceThanO3.reduce( (___allPossibleStrategies, option4) => {

                           


                            const option4Price = getPriceOfAsset({
                                asset: option4,
                                priceType,
                                sideType: 'BUY'
                            });
                            if(option4Price===0) return ___allPossibleStrategies
                            const middlePrice = option2.optionDetails?.strikePrice === option3.optionDetails?.strikePrice ? option2.optionDetails?.strikePrice : (option3.optionDetails?.strikePrice + option2.optionDetails?.strikePrice) / 2;

                            const stockPriceMiddleRatio = (option4.optionDetails.stockSymbolDetails.last / middlePrice) - 1;
                            if (stockPriceMiddleRatio > maxStockMiddleDistanceInPercent || stockPriceMiddleRatio < minStockMiddleDistanceInPercent)
                                return ___allPossibleStrategies

                            const stockPriceStrike4Ratio = (option4.optionDetails.stockSymbolDetails.last / option4.optionDetails?.strikePrice) - 1;

                            if (stockPriceStrike4Ratio > maxStockStrike4DistanceInPercent || stockPriceStrike4Ratio < minStockStrike4DistanceInPercent)
                                return ___allPossibleStrategies

                            // if (option.optionDetails.stockSymbolDetails.last  > option4.optionDetails?.strikePrice) return ___allPossibleStrategies
                            if (option4.optionDetails?.strikePrice < option2.optionDetails?.strikePrice)
                                return ___allPossibleStrategies



                           

                            const diffOfBUCS_Strikes = option2.optionDetails?.strikePrice - option.optionDetails?.strikePrice;
                            const diffOfBECS_Strikes = option4.optionDetails?.strikePrice - option3.optionDetails?.strikePrice;

                            const BUCS_BECS_diffStrikesRatio = diffOfBUCS_Strikes / diffOfBECS_Strikes;

                            if (BUCS_BECS_diffStrikesRatio < MIN_BUCS_BECS_diffStrikesRatio || BUCS_BECS_diffStrikesRatio > MAX_BUCS_BECS_diffStrikesRatio)
                                return ___allPossibleStrategies




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
                                    getQuantity: () => baseQuantity * BUCS_BECS_diffStrikesRatio,
                                    getRequiredMargin: () => diffOfBECS_Strikes
                                },
                                {
                                    ...option4,
                                    isBuy: true,
                                    getQuantity: () => baseQuantity * BUCS_BECS_diffStrikesRatio,
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
                            if (BUCS_BECS_diffStrikesRatio > 1) {
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
                                return ___allPossibleStrategies

                            const strategyObj = {
                                option: {
                                    ...option
                                },
                                positions:[option, option2, option3, option4],
                                strategyTypeTitle: "CALL_CONDOR",
                                expectedProfitNotif,
                                name: createStrategyName([option, option2, option3, option4]),
                                profitPercent: profitLossPresent
                            }

                            return ___allPossibleStrategies.concat([strategyObj])

                        }
                        , []);

                        return ___allPossibleStrategies.concat(strategies)

                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

                }
                , []);

                return {
                    ...option,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "CALL_CONDOR",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceFromHigherStrikeInPercent,
        maxStockPriceDistanceFromHigherStrikeInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "CALL_CONDOR",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && minStockPriceDistanceFromHigherStrikeInPercent !== null && minStockPriceDistanceFromHigherStrikeInPercent !== -Infinity && {
                label: "minToHigh",
                value: `${((minStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && maxStockPriceDistanceFromHigherStrikeInPercent !== null && maxStockPriceDistanceFromHigherStrikeInPercent !== Infinity && {
                label: "maxToHigh",
                value: `${((maxStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof minStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && minStockPriceDistanceFromSarBeSarInPercent !== null && minStockPriceDistanceFromSarBeSarInPercent !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && maxStockPriceDistanceFromSarBeSarInPercent !== null && maxStockPriceDistanceFromSarBeSarInPercent !== Infinity && {
                label: "maxToSar",
                value: `${((maxStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, ].filter(Boolean),
            minVol
        })
    }

}



const calcPUT_BUTTERFLYStrategies = (list, {priceType, settlementGainChoosePriceType="MIN", strategySubName, BUCSSOptionListIgnorer=generalConfig.BUCSSOptionListIgnorer, min_time_to_settlement=0, max_time_to_settlement=Infinity, minStockPriceDistanceFromHigherStrikeInPercent=-Infinity, maxStockPriceDistanceFromHigherStrikeInPercent=Infinity, minStockPriceDistanceFromSarBeSarInPercent=-Infinity, maxStockPriceDistanceFromSarBeSarInPercent=Infinity, MIN_BUPS_BEPS_diffStrikesRatio=0, MAX_BUPS_BEPS_diffStrikesRatio=Infinity, minStockStrike4DistanceInPercent=-Infinity, maxStockStrike4DistanceInPercent=Infinity, minStockMiddleDistanceInPercent=-Infinity, maxStockMiddleDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, minProfitLossRatio=.7, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (BUCSSOptionListIgnorer({
                    option,
                    minVol
                }))
                    return option

                const optionPrice = getPriceOfAsset({
                        asset: option,
                        priceType,
                        sideType: 'BUY'
                });

                if(optionPrice===0) return option

                const putListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                    if (_option.symbol === option.symbol || !_option.isPut || _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice < option.optionDetails?.strikePrice)
                        return false

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceHigherStrikeRatio > minStockPriceDistanceFromHigherStrikeInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceFromHigherStrikeInPercent) {} else {
                        return false
                    }

                    const lowStrikePrice = getPriceOfAsset({
                        asset: option,
                        priceType,
                        sideType: 'BUY'
                    });
                    const highStrikePrice = getPriceOfAsset({
                        asset: _option,
                        priceType,
                        sideType: 'SELL'
                    });

                     // TODO: use breakeven function 
                    const sarBeSar = option.optionDetails?.strikePrice + (lowStrikePrice - highStrikePrice);

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceSarBeSarRatio = (_option.optionDetails.stockSymbolDetails.last / sarBeSar) - 1;

                    if (stockPriceSarBeSarRatio > minStockPriceDistanceFromSarBeSarInPercent && stockPriceSarBeSarRatio < maxStockPriceDistanceFromSarBeSarInPercent) {} else {
                        return false
                    }

                    return true

                }
                );

                let allPossibleStrategies = putListWithHigherStrikePrice.reduce( (_allPossibleStrategies, option2) => {


                    const option2Price = getPriceOfAsset({
                        asset: option2,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(option2Price===0) return _allPossibleStrategies
                    

                    

                    let option3 = option2;

                    const putListWithHigherStrikePriceThanO3 = putListWithHigherStrikePrice.filter(o => {
                        if (o.symbol === option2.symbol || o.symbol === option3.symbol)
                            return false

                        if (o.optionDetails?.strikePrice <= option3.optionDetails?.strikePrice)
                            return false

                        return true

                    }
                    );

                    let strategies = putListWithHigherStrikePriceThanO3.reduce( (___allPossibleStrategies, option4) => {

                        const option4Price = getPriceOfAsset({
                            asset: option4,
                            priceType,
                            sideType: 'BUY'
                        });

                        if(option4Price===0) return ___allPossibleStrategies

                        const middlePrice = option2.optionDetails?.strikePrice === option3.optionDetails?.strikePrice ? option2.optionDetails?.strikePrice : (option3.optionDetails?.strikePrice + option2.optionDetails?.strikePrice) / 2;

                        const stockPriceMiddleRatio = (option4.optionDetails.stockSymbolDetails.last / middlePrice) - 1;
                        if (stockPriceMiddleRatio > maxStockMiddleDistanceInPercent || stockPriceMiddleRatio < minStockMiddleDistanceInPercent)
                            return ___allPossibleStrategies

                        const stockPriceStrike4Ratio = (option4.optionDetails.stockSymbolDetails.last / option4.optionDetails?.strikePrice) - 1;

                        if (stockPriceStrike4Ratio > maxStockStrike4DistanceInPercent || stockPriceStrike4Ratio < minStockStrike4DistanceInPercent)
                            return ___allPossibleStrategies

                        // if (option.optionDetails.stockSymbolDetails.last  > option4.optionDetails?.strikePrice) return ___allPossibleStrategies
                        if (option4.optionDetails?.strikePrice < option2.optionDetails?.strikePrice)
                            return ___allPossibleStrategies



                        const diffOfBUPS_Strikes = option2.optionDetails?.strikePrice - option.optionDetails?.strikePrice;
                        const diffOfBEPS_Strikes = option4.optionDetails?.strikePrice - option3.optionDetails?.strikePrice;

                        const BUPS_BEPS_diffStrikesRatio = diffOfBUPS_Strikes / diffOfBEPS_Strikes;

                        if (BUPS_BEPS_diffStrikesRatio < MIN_BUPS_BEPS_diffStrikesRatio || BUPS_BEPS_diffStrikesRatio > MAX_BUPS_BEPS_diffStrikesRatio)
                            return ___allPossibleStrategies



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
                                getRequiredMargin: () => diffOfBUPS_Strikes
                            },
                            {
                                ...option3,
                                isSell: true,
                                getQuantity: () => baseQuantity * BUPS_BEPS_diffStrikesRatio,
                                getRequiredMargin() { }
                            },
                            {
                                ...option4,
                                isBuy: true,
                                getQuantity: () => baseQuantity * BUPS_BEPS_diffStrikesRatio,
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


                        const priceThatCauseMaxLoss = Math.max(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) * 1.2;


                        const minProfitLossOfButterfly = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: priceThatCauseMaxLoss });

                        


                        let priceThatCauseMaxProfit
                        if (BUPS_BEPS_diffStrikesRatio > 1) {
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
                            return ___allPossibleStrategies

                        const strategyObj = {
                            option: {
                                ...option
                            },
                            positions:[option, option2, option3, option4],
                            strategyTypeTitle: "PUT_BUTTERFLY",
                            expectedProfitNotif,
                            name: createStrategyName([option, option2, option3, option4]),
                            profitPercent: profitLossPresent
                        }

                        return ___allPossibleStrategies.concat([strategyObj])

                    }
                    , []);

                    return _allPossibleStrategies.concat(strategies)


                }
                , []);

                return {
                    ...option,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "PUT_BUTTERFLY",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceFromHigherStrikeInPercent,
        maxStockPriceDistanceFromHigherStrikeInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "PUT_BUTTERFLY",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && minStockPriceDistanceFromHigherStrikeInPercent !== null && minStockPriceDistanceFromHigherStrikeInPercent !== -Infinity && {
                label: "minToHigh",
                value: `${((minStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && maxStockPriceDistanceFromHigherStrikeInPercent !== null && maxStockPriceDistanceFromHigherStrikeInPercent !== Infinity && {
                label: "maxToHigh",
                value: `${((maxStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof minStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && minStockPriceDistanceFromSarBeSarInPercent !== null && minStockPriceDistanceFromSarBeSarInPercent !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && maxStockPriceDistanceFromSarBeSarInPercent !== null && maxStockPriceDistanceFromSarBeSarInPercent !== Infinity && {
                label: "maxToSar",
                value: `${((maxStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, ].filter(Boolean),
            minVol
        })
    }

}


const calcPUT_CONDORStrategies = (list, {priceType, settlementGainChoosePriceType="MIN", strategySubName, BUCSSOptionListIgnorer=generalConfig.BUCSSOptionListIgnorer, min_time_to_settlement=0, max_time_to_settlement=Infinity, minStockPriceDistanceFromHigherStrikeInPercent=-Infinity, maxStockPriceDistanceFromHigherStrikeInPercent=Infinity, minStockPriceDistanceFromSarBeSarInPercent=-Infinity, maxStockPriceDistanceFromSarBeSarInPercent=Infinity, MIN_BUPS_BEPS_diffStrikesRatio=0, MAX_BUPS_BEPS_diffStrikesRatio=Infinity, minStockStrike4DistanceInPercent=-Infinity, maxStockStrike4DistanceInPercent=Infinity, minStockMiddleDistanceInPercent=-Infinity, maxStockMiddleDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, minProfitLossRatio=.7, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (BUCSSOptionListIgnorer({
                    option,
                    minVol
                }))
                    return option

                const optionPrice = getPriceOfAsset({
                        asset: option,
                        priceType,
                        sideType: 'BUY'
                });

                if(optionPrice===0) return option

                const putListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                    if (_option.symbol === option.symbol || !_option.isPut || _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice < option.optionDetails?.strikePrice)
                        return false

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceHigherStrikeRatio > minStockPriceDistanceFromHigherStrikeInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceFromHigherStrikeInPercent) {} else {
                        return false
                    }

                    const lowStrikePrice = getPriceOfAsset({
                        asset: option,
                        priceType,
                        sideType: 'BUY'
                    });
                    const highStrikePrice = getPriceOfAsset({
                        asset: _option,
                        priceType,
                        sideType: 'SELL'
                    });

                     // TODO: use breakeven function 
                    const sarBeSar = option.optionDetails?.strikePrice + (lowStrikePrice - highStrikePrice);

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceSarBeSarRatio = (_option.optionDetails.stockSymbolDetails.last / sarBeSar) - 1;

                    if (stockPriceSarBeSarRatio > minStockPriceDistanceFromSarBeSarInPercent && stockPriceSarBeSarRatio < maxStockPriceDistanceFromSarBeSarInPercent) {} else {
                        return false
                    }

                    return true

                }
                );

                let allPossibleStrategies = putListWithHigherStrikePrice.reduce( (_allPossibleStrategies, option2) => {


                    const option2Price = getPriceOfAsset({
                        asset: option2,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(option2Price===0) return _allPossibleStrategies
                    

                    

                    let __allPossibleStrategies = putListWithHigherStrikePrice.reduce( (___allPossibleStrategies, option3) => {

                        if(option3.symbol===option2.symbol) return ___allPossibleStrategies

                        const option3Price = getPriceOfAsset({
                            asset: option3,
                            priceType,
                            sideType: 'SELL'
                        });

                        if(option3Price===0) return ___allPossibleStrategies

                        const putListWithHigherStrikePriceThanO3 = putListWithHigherStrikePrice.filter(o => {
                            if (o.symbol === option2.symbol || o.symbol === option3.symbol)
                                return false

                            if (o.optionDetails?.strikePrice <= option3.optionDetails?.strikePrice)
                                return false

                            return true

                        }
                        );
                        let strategies = putListWithHigherStrikePriceThanO3.reduce( (___allPossibleStrategies, option4) => {

                            const option4Price = getPriceOfAsset({
                                asset: option4,
                                priceType,
                                sideType: 'BUY'
                            });

                            if(option4Price===0) return ___allPossibleStrategies

                            const middlePrice = option2.optionDetails?.strikePrice === option3.optionDetails?.strikePrice ? option2.optionDetails?.strikePrice : (option3.optionDetails?.strikePrice + option2.optionDetails?.strikePrice) / 2;

                            const stockPriceMiddleRatio = (option4.optionDetails.stockSymbolDetails.last / middlePrice) - 1;
                            if (stockPriceMiddleRatio > maxStockMiddleDistanceInPercent || stockPriceMiddleRatio < minStockMiddleDistanceInPercent)
                                return ___allPossibleStrategies

                            const stockPriceStrike4Ratio = (option4.optionDetails.stockSymbolDetails.last / option4.optionDetails?.strikePrice) - 1;

                            if (stockPriceStrike4Ratio > maxStockStrike4DistanceInPercent || stockPriceStrike4Ratio < minStockStrike4DistanceInPercent)
                                return ___allPossibleStrategies

                            // if (option.optionDetails.stockSymbolDetails.last  > option4.optionDetails?.strikePrice) return ___allPossibleStrategies
                            if (option4.optionDetails?.strikePrice < option2.optionDetails?.strikePrice)
                                return ___allPossibleStrategies


                            

                            const diffOfBUPS_Strikes = option2.optionDetails?.strikePrice - option.optionDetails?.strikePrice;
                            const diffOfBEPS_Strikes = option4.optionDetails?.strikePrice - option3.optionDetails?.strikePrice;

                            const BUPS_BEPS_diffStrikesRatio = diffOfBUPS_Strikes / diffOfBEPS_Strikes;

                            if (BUPS_BEPS_diffStrikesRatio < MIN_BUPS_BEPS_diffStrikesRatio || BUPS_BEPS_diffStrikesRatio > MAX_BUPS_BEPS_diffStrikesRatio)
                                return ___allPossibleStrategies



                            
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
                                    getRequiredMargin: () => diffOfBUPS_Strikes
                                },
                                {
                                    ...option3,
                                    isSell: true,
                                    getQuantity: () => baseQuantity * BUPS_BEPS_diffStrikesRatio,
                                    getRequiredMargin() { }
                                },
                                {
                                    ...option4,
                                    isBuy: true,
                                    getQuantity: () => baseQuantity * BUPS_BEPS_diffStrikesRatio,
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
                            if (BUPS_BEPS_diffStrikesRatio > 1) {
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
                                return ___allPossibleStrategies

                            const strategyObj = {
                                option: {
                                    ...option
                                },
                                positions:[option, option2, option3, option4],
                                strategyTypeTitle: "PUT_CONDOR",
                                expectedProfitNotif,
                                name: createStrategyName([option, option2, option3, option4]),
                                profitPercent: profitLossPresent
                            }

                            return ___allPossibleStrategies.concat([strategyObj])

                        }
                        , []);

                        return ___allPossibleStrategies.concat(strategies)

                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

                }
                , []);

                return {
                    ...option,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "PUT_CONDOR",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceFromHigherStrikeInPercent,
        maxStockPriceDistanceFromHigherStrikeInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "PUT_CONDOR",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && minStockPriceDistanceFromHigherStrikeInPercent !== null && minStockPriceDistanceFromHigherStrikeInPercent !== -Infinity && {
                label: "minToHigh",
                value: `${((minStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && maxStockPriceDistanceFromHigherStrikeInPercent !== null && maxStockPriceDistanceFromHigherStrikeInPercent !== Infinity && {
                label: "maxToHigh",
                value: `${((maxStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof minStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && minStockPriceDistanceFromSarBeSarInPercent !== null && minStockPriceDistanceFromSarBeSarInPercent !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && maxStockPriceDistanceFromSarBeSarInPercent !== null && maxStockPriceDistanceFromSarBeSarInPercent !== Infinity && {
                label: "maxToSar",
                value: `${((maxStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, ].filter(Boolean),
            minVol
        })
    }

}



const calcREVERSE_IRON_BUTTERFLYStrategies = (list, {priceType, settlementGainChoosePriceType="MIN", showLeftRightProfitType="LEFT&RIGHT", strategySubName, BUCSSOptionListIgnorer, min_time_to_settlement=0, max_time_to_settlement=Infinity, minStockPriceDistanceFromHigherStrikeInPercent=-Infinity, maxStockPriceDistanceFromHigherStrikeInPercent=Infinity, minStockPriceDistanceFromSarBeSarInPercent=-Infinity, maxStockPriceDistanceFromSarBeSarInPercent=Infinity, minStockPriceDistanceFromLowerStrikeInPercent=-Infinity, maxStockPriceDistanceFromLowerStrikeInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (BUCSSOptionListIgnorer({
                    option,
                    minVol
                }))
                    return option

                const callListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                    if (_option.symbol === option.symbol || !_option.symbol.startsWith('ض') || _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice < option.optionDetails?.strikePrice)
                        return false

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceHigherStrikeRatio > minStockPriceDistanceFromHigherStrikeInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceFromHigherStrikeInPercent) {} else {
                        return false
                    }

                    return true

                }
                );

                let allPossibleStrategies = callListWithHigherStrikePrice.reduce( (_allPossibleStrategies, option2) => {

                    const totalBUCS_CostWithSign = totalCostCalculator({
                        buyOptions: [option],
                        sellOptions: [option2],
                        priceType
                    });

                    const totalBUCS_SettlementGainWithSign = totalSettlementGain([{
                        option,
                        positionSide: "BUY"
                    }, {
                        option: option2,
                        positionSide: "SELL"
                    }, ]);

                    const putWithSameStrikeOfOption1 = optionListOfSameDate.find(_option => _option.isPut && (_option.optionDetails?.strikePrice === option.optionDetails?.strikePrice));

                    if (!putWithSameStrikeOfOption1)
                        return _allPossibleStrategies

                    // TODO: create lower/higher strike price filter function in utils to reuse 

                    const putListWithLowerStrikePrice = optionListOfSameDate.filter(_option => {

                        if (_option.symbol === putWithSameStrikeOfOption1.symbol || _option.isCall || _option.vol < minVol)
                            return false
                        if (_option.optionDetails?.strikePrice > putWithSameStrikeOfOption1.optionDetails?.strikePrice)
                            return false

                        if (!_option.optionDetails?.stockSymbolDetails?.last)
                            return false

                        const stockPriceLowerStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                        if (stockPriceLowerStrikeRatio < minStockPriceDistanceFromLowerStrikeInPercent || stockPriceLowerStrikeRatio > maxStockPriceDistanceFromLowerStrikeInPercent) {
                            return false
                        }

                        return true

                    }
                    );

                    let __allPossibleStrategies = putListWithLowerStrikePrice.reduce( (___allPossibleStrategies, put2) => {

                        const totalBEPS_CostWithSign = totalCostCalculator({
                            buyOptions: [putWithSameStrikeOfOption1],
                            sellOptions: [put2],
                            priceType
                        });

                        const totalBEPS_SettlementGainWithSign = totalSettlementGain([{
                            option: putWithSameStrikeOfOption1,
                            positionSide: "BUY"
                        }, {
                            option: put2,
                            positionSide: "SELL"
                        }, ]);

                        const maxRightProfit = totalBUCS_SettlementGainWithSign + totalBUCS_CostWithSign + totalBEPS_CostWithSign;
                        const maxLeftProfit = totalBEPS_CostWithSign + totalBEPS_SettlementGainWithSign + totalBUCS_CostWithSign;

                        const totalCost = totalBUCS_CostWithSign + totalBEPS_CostWithSign

                        if (showLeftRightProfitType === "LEFT&RIGHT") {
                            if (maxRightProfit < 0 || maxLeftProfit < 0) {
                                return ___allPossibleStrategies
                            }

                            profitLossPresent = Math.min(maxLeftProfit, maxRightProfit) / Math.abs(totalCost)

                        }
                        if (showLeftRightProfitType === "LEFT") {
                           
                            if (maxLeftProfit < 0) {
                                return ___allPossibleStrategies
                            }

                            profitLossPresent = maxLeftProfit / Math.abs(totalCost)

                        }
                        if (showLeftRightProfitType === "RIGHT") {
                            if (maxLeftProfit < 0) {
                                return ___allPossibleStrategies
                            }

                            profitLossPresent = maxRightProfit / Math.abs(totalCost)

                        }

                        const strategyObj = {
                            option: {
                                ...option
                            },
                            positions:[option, option2, putWithSameStrikeOfOption1, put2],
                            strategyTypeTitle: "REVERSE_IRON_BUTTERFLY",
                            expectedProfitNotif,
                            name: createStrategyName([option, option2, putWithSameStrikeOfOption1, put2]),
                            profitPercent: profitLossPresent
                        }

                        return ___allPossibleStrategies.concat([strategyObj])

                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

                }
                , []);

                return {
                    ...option,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "REVERSE_IRON_BUTTERFLY",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceFromHigherStrikeInPercent,
        maxStockPriceDistanceFromHigherStrikeInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "REVERSE_IRON_BUTTERFLY",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && minStockPriceDistanceFromHigherStrikeInPercent !== null && minStockPriceDistanceFromHigherStrikeInPercent !== -Infinity && {
                label: "minToHigh",
                value: `${((minStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && maxStockPriceDistanceFromHigherStrikeInPercent !== null && maxStockPriceDistanceFromHigherStrikeInPercent !== Infinity && {
                label: "maxToHigh",
                value: `${((maxStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof minStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && minStockPriceDistanceFromSarBeSarInPercent !== null && minStockPriceDistanceFromSarBeSarInPercent !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && maxStockPriceDistanceFromSarBeSarInPercent !== null && maxStockPriceDistanceFromSarBeSarInPercent !== Infinity && {
                label: "maxToSar",
                value: `${((maxStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, ].filter(Boolean),
            minVol
        })
    }

}


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

    let profitLossPresent

    if (minProfitLossOfButterfly > 0) {
        profitLossPresent = 1
    } else {

        profitLossPresent = Math.abs(maxGainOfButterfly) / (Math.abs(maxGainOfButterfly) + Math.abs(minProfitLossOfButterfly))
    }

    if (profitLossPresent < minProfitLossRatio)
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
        profitPercent: profitLossPresent
    }



    return strategyObj

}




const calcIRON_BUTTERFLY_BUCS_Strategies = (list, {priceType, settlementGainChoosePriceType="MIN", showLeftRightProfitType="LEFT&RIGHT", strategySubName,
     BUCSSOptionListIgnorer, min_time_to_settlement=0, max_time_to_settlement=Infinity, 
     minStockPriceDistanceFromHigherStrikeInPercent=-Infinity, maxStockPriceDistanceFromHigherStrikeInPercent=Infinity, 
     minStockPriceDistanceFromSarBeSarInPercent=-Infinity, maxStockPriceDistanceFromSarBeSarInPercent=Infinity,
     minStockPriceDistanceFromOption2StrikeInPercent=-Infinity, maxStockPriceDistanceFromOption2StrikeInPercent=Infinity, 
     minStockPriceDistanceFromOption3StrikeInPercent=-Infinity, maxStockPriceDistanceFromOption3StrikeInPercent=Infinity, 
     minStockPriceDistanceFromOption4StrikeInPercent=-Infinity, maxStockPriceDistanceFromOption4StrikeInPercent=Infinity, 
     minStockMiddleDistanceInPercent=-Infinity, maxStockMiddleDistanceInPercent=Infinity, 
     MIN_BUCS_BEPS_diffStrikesRatio=0, MAX_BUCS_BEPS_diffStrikesRatio=Infinity, minProfitLossRatio=.7, 
     BUCS_BEPS_COST_notProperRatio=15,
     minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (BUCSSOptionListIgnorer({
                    option,
                    minVol
                }))
                    return option


                const priceOfOptionWithLowStrike = getPriceOfAsset({
                    asset: option,
                    priceType,
                    sideType: 'BUY'
                });

                if(priceOfOptionWithLowStrike===0) return option

                const callListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                    if (_option.symbol === option.symbol || !_option.isCall || _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice <= option.optionDetails?.strikePrice)
                        return false

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceHigherStrikeRatio > minStockPriceDistanceFromOption2StrikeInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceFromOption2StrikeInPercent) {} else {
                        return false
                    }

                    return true

                }
                );

                let allPossibleStrategies = callListWithHigherStrikePrice.reduce( (_allPossibleStrategies, option2) => {


                    const option2Price = getPriceOfAsset({
                        asset: option2,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(option2Price===0) return _allPossibleStrategies

                    

                    // TODO: create lower/higher strike price filter function in utils to reuse 

                    const putListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                        if ( !_option.isPut || _option.vol < minVol)
                            return false
                        if (_option.optionDetails?.strikePrice <= option.optionDetails?.strikePrice)
                            return false

                        if (!_option.optionDetails?.stockSymbolDetails?.last)
                            return false

                        

                        return true

                    }
                    );



                    const optionListBetweenO1AndO2StrikePrice = putListWithHigherStrikePrice.filter(o => {
                        if (o.optionDetails?.strikePrice > option2.optionDetails?.strikePrice)
                            return false

                        return true

                    }
                    );



                     let strategies = optionListBetweenO1AndO2StrikePrice.reduce((__allPossibleStrategies, option3) => {

                        const option3Price = getPriceOfAsset({
                            asset: option3,
                            priceType,
                            sideType: 'SELL'
                        });
                        if(option3Price===0) return __allPossibleStrategies


                        const stockPricePut1StrikeRatio = (option3.optionDetails.stockSymbolDetails.last / option3.optionDetails?.strikePrice) - 1;

                        if (stockPricePut1StrikeRatio < minStockPriceDistanceFromOption3StrikeInPercent || stockPricePut1StrikeRatio > maxStockPriceDistanceFromOption3StrikeInPercent) {
                            return __allPossibleStrategies
                        }

                        if (option3.optionDetails?.strikePrice < option2.optionDetails?.strikePrice) {
                            let option4 = putListWithHigherStrikePrice.find(put => put.optionDetails?.strikePrice === option2.optionDetails?.strikePrice);
                            if(!option4) return __allPossibleStrategies
                            const option4Price = getPriceOfAsset({
                                asset: option4,
                                priceType,
                                sideType: 'BUY'
                            });
                            if (option4Price === 0) return __allPossibleStrategies

                            const strategyObj = IRON_BUTTERFLY_CONDOR_BUCS_strategyObjCreator(option, option2, option3, option4, {
                                minStockMiddleDistanceInPercent, maxStockMiddleDistanceInPercent,
                                minStockPriceDistanceFromOption4StrikeInPercent, maxStockPriceDistanceFromOption4StrikeInPercent,
                                MIN_BUCS_BEPS_diffStrikesRatio, MAX_BUCS_BEPS_diffStrikesRatio, expectedProfitNotif, priceType, 
                                minProfitLossRatio,BUCS_BEPS_COST_notProperRatio,
                                strategyTypeTitle:"IRON_BUTTERFLY_BUCS"
                            });

                            if (strategyObj) {

                                return __allPossibleStrategies.concat([strategyObj])
                            }else{
                                return __allPossibleStrategies
                            }

                        } else if (option3.optionDetails?.strikePrice === option2.optionDetails?.strikePrice) {
                            const optionListWithHigherStrikePriceThanO3 = putListWithHigherStrikePrice.filter(o => {
                                if (o.symbol === option2.symbol || o.symbol === option3.symbol)
                                    return false
                                if (o.optionDetails?.strikePrice === option2.optionDetails?.strikePrice)
                                    return false

                                if (o.optionDetails?.strikePrice <= option3.optionDetails?.strikePrice)
                                    return false

                                return true

                            }
                            );



                            let strategies = optionListWithHigherStrikePriceThanO3.reduce((___allPossibleStrategies, option4) => {




                                const option4Price = getPriceOfAsset({
                                    asset: option4,
                                    priceType,
                                    sideType: 'BUY'
                                });
                                if (option4Price === 0) return ___allPossibleStrategies


                                const strategyObj = IRON_BUTTERFLY_CONDOR_BUCS_strategyObjCreator(option, option2, option3, option4, {
                                    minStockMiddleDistanceInPercent, maxStockMiddleDistanceInPercent,
                                    minStockPriceDistanceFromOption4StrikeInPercent, maxStockPriceDistanceFromOption4StrikeInPercent,
                                    MIN_BUCS_BEPS_diffStrikesRatio, MAX_BUCS_BEPS_diffStrikesRatio, 
                                    expectedProfitNotif, priceType, minProfitLossRatio,BUCS_BEPS_COST_notProperRatio,
                                    strategyTypeTitle:"IRON_BUTTERFLY_BUCS"
                                });
                                if (strategyObj) {

                                    return ___allPossibleStrategies.concat([strategyObj])
                                }else{
                                    return ___allPossibleStrategies
                                }


                            }
                                , []);


                            return __allPossibleStrategies.concat(strategies)

                        } else {
                            return __allPossibleStrategies
                        }




                    }, [])


                  


                    return _allPossibleStrategies.concat(strategies)



                }
                , []);

                return {
                    ...option,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "IRON_BUTTERFLY_BUCS",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceFromHigherStrikeInPercent,
        maxStockPriceDistanceFromHigherStrikeInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "IRON_BUTTERFLY_BUCS",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && minStockPriceDistanceFromHigherStrikeInPercent !== null && minStockPriceDistanceFromHigherStrikeInPercent !== -Infinity && {
                label: "minToHigh",
                value: `${((minStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && maxStockPriceDistanceFromHigherStrikeInPercent !== null && maxStockPriceDistanceFromHigherStrikeInPercent !== Infinity && {
                label: "maxToHigh",
                value: `${((maxStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof minStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && minStockPriceDistanceFromSarBeSarInPercent !== null && minStockPriceDistanceFromSarBeSarInPercent !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && maxStockPriceDistanceFromSarBeSarInPercent !== null && maxStockPriceDistanceFromSarBeSarInPercent !== Infinity && {
                label: "maxToSar",
                value: `${((maxStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, ].filter(Boolean),
            minVol
        })
    }

}


const calcIRON_CONDOR_BUCS_Strategies = (list, {priceType, settlementGainChoosePriceType="MIN", showLeftRightProfitType="LEFT&RIGHT", strategySubName,
     BUCSSOptionListIgnorer, min_time_to_settlement=0, max_time_to_settlement=Infinity, 
     minStockPriceDistanceFromHigherStrikeInPercent=-Infinity, maxStockPriceDistanceFromHigherStrikeInPercent=Infinity, 
     minStockPriceDistanceFromSarBeSarInPercent=-Infinity, maxStockPriceDistanceFromSarBeSarInPercent=Infinity,
     minStockPriceDistanceFromOption2StrikeInPercent=-Infinity, maxStockPriceDistanceFromOption2StrikeInPercent=Infinity, 
     minStockPriceDistanceFromOption3StrikeInPercent=-Infinity, maxStockPriceDistanceFromOption3StrikeInPercent=Infinity, 
     minStockPriceDistanceFromOption4StrikeInPercent=-Infinity, maxStockPriceDistanceFromOption4StrikeInPercent=Infinity, 
     minStockMiddleDistanceInPercent=-Infinity, maxStockMiddleDistanceInPercent=Infinity, 
     MIN_BUCS_BEPS_diffStrikesRatio=0, MAX_BUCS_BEPS_diffStrikesRatio=Infinity, 
     BUCS_BEPS_COST_notProperRatio=15,
     minProfitLossRatio=.7, minVol=CONSTS.DEFAULTS.MIN_VOL, 
     expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (BUCSSOptionListIgnorer({
                    option,
                    minVol
                }))
                    return option


                const priceOfOptionWithLowStrike = getPriceOfAsset({
                    asset: option,
                    priceType,
                    sideType: 'BUY'
                });

                if(priceOfOptionWithLowStrike===0) return option

                const callListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                    if (_option.symbol === option.symbol || !_option.symbol.startsWith('ض') || _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice <= option.optionDetails?.strikePrice)
                        return false

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceHigherStrikeRatio > minStockPriceDistanceFromOption2StrikeInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceFromOption2StrikeInPercent) {} else {
                        return false
                    }

                    return true

                }
                );

                let allPossibleStrategies = callListWithHigherStrikePrice.reduce( (_allPossibleStrategies, option2) => {


                    const option2Price = getPriceOfAsset({
                        asset: option2,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(option2Price===0) return _allPossibleStrategies

                    

                    // TODO: create lower/higher strike price filter function in utils to reuse 

                    const putListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                        if ( _option.isCall || _option.vol < minVol)
                            return false
                        if (_option.optionDetails?.strikePrice <= option.optionDetails?.strikePrice)
                            return false

                        if (!_option.optionDetails?.stockSymbolDetails?.last)
                            return false

                        

                        return true

                    }
                    );

                    let __allPossibleStrategies = putListWithHigherStrikePrice.reduce( (___allPossibleStrategies, option3) => {

                        if(option3.optionDetails?.strikePrice===option2.optionDetails?.strikePrice) return ___allPossibleStrategies

                        const option3Price = getPriceOfAsset({
                            asset: option3,
                            priceType,
                            sideType: 'SELL'
                        });
                        if(option3Price===0) return ___allPossibleStrategies


                        const stockPricePut1StrikeRatio = (option3.optionDetails.stockSymbolDetails.last / option3.optionDetails?.strikePrice) - 1;

                        if (stockPricePut1StrikeRatio < minStockPriceDistanceFromOption3StrikeInPercent || stockPricePut1StrikeRatio > maxStockPriceDistanceFromOption3StrikeInPercent) {
                            return ___allPossibleStrategies
                        }

                        const optionListWithHigherStrikePriceThanO3 = putListWithHigherStrikePrice.filter(o => {
                            if (o.symbol === option2.symbol || o.symbol === option3.symbol)
                                return false
                            if (o.optionDetails?.strikePrice === option2.optionDetails?.strikePrice)
                                return false

                            if (o.optionDetails?.strikePrice <= option3.optionDetails?.strikePrice)
                                return false

                            return true

                        }
                        );




                       

                        let strategies = optionListWithHigherStrikePriceThanO3.reduce( (___allPossibleStrategies, option4) => {

                           


                            const option4Price = getPriceOfAsset({
                                asset: option4,
                                priceType,
                                sideType: 'BUY'
                            });
                            if(option4Price===0) return ___allPossibleStrategies
                           

                            const strategyObj = IRON_BUTTERFLY_CONDOR_BUCS_strategyObjCreator(option, option2, option3, option4, {
                                minStockMiddleDistanceInPercent, maxStockMiddleDistanceInPercent,
                                minStockPriceDistanceFromOption4StrikeInPercent, maxStockPriceDistanceFromOption4StrikeInPercent,
                                MIN_BUCS_BEPS_diffStrikesRatio, MAX_BUCS_BEPS_diffStrikesRatio, 
                                expectedProfitNotif, priceType, minProfitLossRatio,BUCS_BEPS_COST_notProperRatio,
                                strategyTypeTitle:"IRON_CONDOR_BUCS"
                            });

                            if (strategyObj) {

                                return ___allPossibleStrategies.concat([strategyObj])
                            }else{
                                return ___allPossibleStrategies
                            }



                        }
                        , []);

                        return ___allPossibleStrategies.concat(strategies)

                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

                }
                , []);

                return {
                    ...option,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "IRON_CONDOR_BUCS",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceFromHigherStrikeInPercent,
        maxStockPriceDistanceFromHigherStrikeInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "IRON_CONDOR_BUCS",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && minStockPriceDistanceFromHigherStrikeInPercent !== null && minStockPriceDistanceFromHigherStrikeInPercent !== -Infinity && {
                label: "minToHigh",
                value: `${((minStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && maxStockPriceDistanceFromHigherStrikeInPercent !== null && maxStockPriceDistanceFromHigherStrikeInPercent !== Infinity && {
                label: "maxToHigh",
                value: `${((maxStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof minStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && minStockPriceDistanceFromSarBeSarInPercent !== null && minStockPriceDistanceFromSarBeSarInPercent !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && maxStockPriceDistanceFromSarBeSarInPercent !== null && maxStockPriceDistanceFromSarBeSarInPercent !== Infinity && {
                label: "maxToSar",
                value: `${((maxStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, ].filter(Boolean),
            minVol
        })
    }

}



const calcIRON_BUTT_CONDOR_BUCS_Strategies = (list, {priceType, settlementGainChoosePriceType="MIN", showLeftRightProfitType="LEFT&RIGHT", strategySubName,
     BUCSSOptionListIgnorer, min_time_to_settlement=0, max_time_to_settlement=Infinity, 
     minStockPriceDistanceFromHigherStrikeInPercent=-Infinity, maxStockPriceDistanceFromHigherStrikeInPercent=Infinity, 
     minStockPriceDistanceFromSarBeSarInPercent=-Infinity, maxStockPriceDistanceFromSarBeSarInPercent=Infinity,
     minStockPriceDistanceFromOption2StrikeInPercent=-Infinity, maxStockPriceDistanceFromOption2StrikeInPercent=Infinity, 
     minStockPriceDistanceFromOption3StrikeInPercent=-Infinity, maxStockPriceDistanceFromOption3StrikeInPercent=Infinity, 
     minStockPriceDistanceFromOption4StrikeInPercent=-Infinity, 
     maxStockPriceDistanceFromOption4StrikeInPercent=Infinity, 
     minStockMiddleDistanceInPercent=-Infinity, maxStockMiddleDistanceInPercent=Infinity, 
     MIN_BUCS_BEPS_diffStrikesRatio=0, MAX_BUCS_BEPS_diffStrikesRatio=Infinity, 
     BUCS_BEPS_COST_notProperRatio,
     minProfitLossRatio=.7, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (BUCSSOptionListIgnorer({
                    option,
                    minVol
                }))
                    return option


                const priceOfOptionWithLowStrike = getPriceOfAsset({
                    asset: option,
                    priceType,
                    sideType: 'BUY'
                });

                if(priceOfOptionWithLowStrike===0) return option

                const callListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                    if (_option.symbol === option.symbol || !_option.symbol.startsWith('ض') || _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice <= option.optionDetails?.strikePrice)
                        return false

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceHigherStrikeRatio > minStockPriceDistanceFromOption2StrikeInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceFromOption2StrikeInPercent) {} else {
                        return false
                    }

                    return true

                }
                );

                let allPossibleStrategies = callListWithHigherStrikePrice.reduce( (_allPossibleStrategies, option2) => {


                    const option2Price = getPriceOfAsset({
                        asset: option2,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(option2Price===0) return _allPossibleStrategies

                    

                    // TODO: create lower/higher strike price filter function in utils to reuse 

                    const putListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                        if ( _option.isCall || _option.vol < minVol)
                            return false
                        if (_option.optionDetails?.strikePrice <= option.optionDetails?.strikePrice)
                            return false

                        if (!_option.optionDetails?.stockSymbolDetails?.last)
                            return false

                        

                        return true

                    }
                    );

                    let __allPossibleStrategies = putListWithHigherStrikePrice.reduce( (___allPossibleStrategies, option3) => {


                        const option3Price = getPriceOfAsset({
                            asset: option3,
                            priceType,
                            sideType: 'SELL'
                        });
                        if(option3Price===0) return ___allPossibleStrategies


                        const stockPricePut1StrikeRatio = (option3.optionDetails.stockSymbolDetails.last / option3.optionDetails?.strikePrice) - 1;

                        if (stockPricePut1StrikeRatio < minStockPriceDistanceFromOption3StrikeInPercent || stockPricePut1StrikeRatio > maxStockPriceDistanceFromOption3StrikeInPercent) {
                            return ___allPossibleStrategies
                        }

                        const optionListWithHigherStrikePriceThanO3 = putListWithHigherStrikePrice.filter(o => {
                            // if (o.symbol === option2.symbol || o.symbol === option3.symbol)
                            //     return false
                            // if (o.optionDetails?.strikePrice === option2.optionDetails?.strikePrice)
                            //     return false

                            if (o.optionDetails?.strikePrice <= option3.optionDetails?.strikePrice)
                                return false

                            return true

                        }
                        );




                       

                        let strategies = optionListWithHigherStrikePriceThanO3.reduce( (___allPossibleStrategies, option4) => {

                           


                            const option4Price = getPriceOfAsset({
                                asset: option4,
                                priceType,
                                sideType: 'BUY'
                            });
                            if(option4Price===0) return ___allPossibleStrategies
                            const strategyObj = IRON_BUTTERFLY_CONDOR_BUCS_strategyObjCreator(option, option2, option3, option4, {
                                minStockMiddleDistanceInPercent, maxStockMiddleDistanceInPercent,
                                minStockPriceDistanceFromOption4StrikeInPercent, maxStockPriceDistanceFromOption4StrikeInPercent,
                                MIN_BUCS_BEPS_diffStrikesRatio, MAX_BUCS_BEPS_diffStrikesRatio, expectedProfitNotif, priceType, minProfitLossRatio,
                                BUCS_BEPS_COST_notProperRatio,
                                strategyTypeTitle:"IRON_BUTT_CONDOR_BUCS"
                            });

                            
                            return ___allPossibleStrategies.concat([strategyObj])

                        }
                        , []);

                        return ___allPossibleStrategies.concat(strategies)

                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

                }
                , []);

                return {
                    ...option,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "IRON_BUTT_CONDOR_BUCS",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceFromHigherStrikeInPercent,
        maxStockPriceDistanceFromHigherStrikeInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "IRON_BUTT_CONDOR_BUCS",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && minStockPriceDistanceFromHigherStrikeInPercent !== null && minStockPriceDistanceFromHigherStrikeInPercent !== -Infinity && {
                label: "minToHigh",
                value: `${((minStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && maxStockPriceDistanceFromHigherStrikeInPercent !== null && maxStockPriceDistanceFromHigherStrikeInPercent !== Infinity && {
                label: "maxToHigh",
                value: `${((maxStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof minStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && minStockPriceDistanceFromSarBeSarInPercent !== null && minStockPriceDistanceFromSarBeSarInPercent !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && maxStockPriceDistanceFromSarBeSarInPercent !== null && maxStockPriceDistanceFromSarBeSarInPercent !== Infinity && {
                label: "maxToSar",
                value: `${((maxStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, ].filter(Boolean),
            minVol
        })
    }

}





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
    let maxGainOfButterfly = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:priceThatCauseMaxProfit})
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



const calcIRON_BUTTERFLY_BUPS_Strategies = (list, { priceType, settlementGainChoosePriceType = "MIN", showLeftRightProfitType = "LEFT&RIGHT", strategySubName,
    BUCSSOptionListIgnorer, min_time_to_settlement = 0, max_time_to_settlement = Infinity,
    minStockPriceDistanceFromHigherStrikeInPercent = -Infinity, maxStockPriceDistanceFromHigherStrikeInPercent = Infinity,
    minStockPriceDistanceFromSarBeSarInPercent = -Infinity, maxStockPriceDistanceFromSarBeSarInPercent = Infinity,
    minStockPriceDistanceFromOption2StrikeInPercent = -Infinity, maxStockPriceDistanceFromOption2StrikeInPercent = Infinity,
    minStockPriceDistanceFromOption3StrikeInPercent = -Infinity, maxStockPriceDistanceFromOption3StrikeInPercent = Infinity,
    minStockPriceDistanceFromOption4StrikeInPercent = -Infinity, maxStockPriceDistanceFromOption4StrikeInPercent = Infinity, minStockMiddleDistanceInPercent = -Infinity, maxStockMiddleDistanceInPercent = Infinity, MIN_BUPS_BECS_diffStrikesRatio = 0, MAX_BUPS_BECS_diffStrikesRatio = Infinity, minProfitLossRatio = .7, minVol = CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif = false, ...restConfig }) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({ optionDetails }) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let [stockSymbol, optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({ optionDetails }) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap(([date, optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                // if (BUCSSOptionListIgnorer({
                //     option,
                //     minVol
                // }))
                //     return option

                if (!option.optionDetails?.stockSymbolDetails || !option.isPut || option.vol < minVol)
                    return option

                const priceOfOptionWithLowStrike = getPriceOfAsset({
                    asset: option,
                    priceType,
                    sideType: 'BUY'
                });

                if (priceOfOptionWithLowStrike === 0) return option

                const putListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                    if (_option.symbol === option.symbol || !_option.isPut || _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice <= option.optionDetails?.strikePrice)
                        return false

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceHigherStrikeRatio > minStockPriceDistanceFromOption2StrikeInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceFromOption2StrikeInPercent) { } else {
                        return false
                    }

                    return true

                }
                );

                let allPossibleStrategies = putListWithHigherStrikePrice.reduce((_allPossibleStrategies, option2) => {


                    const option2Price = getPriceOfAsset({
                        asset: option2,
                        priceType,
                        sideType: 'SELL'
                    });

                    if (option2Price === 0) return _allPossibleStrategies



                    // TODO: create lower/higher strike price filter function in utils to reuse 

                    const callListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                        if (_option.isPut || _option.vol < minVol)
                            return false
                        if (_option.optionDetails?.strikePrice <= option.optionDetails?.strikePrice)
                            return false

                        if (!_option.optionDetails?.stockSymbolDetails?.last)
                            return false



                        return true

                    }
                    );


                    const optionListBetweenO1AndO2StrikePrice = callListWithHigherStrikePrice.filter(o => {
                        if (o.optionDetails?.strikePrice > option2.optionDetails?.strikePrice)
                            return false

                        return true

                    }
                    );

                    let strategies = optionListBetweenO1AndO2StrikePrice.reduce((__allPossibleStrategies, option3) => {

                        const option3Price = getPriceOfAsset({
                            asset: option3,
                            priceType,
                            sideType: 'SELL'
                        });
                        if (option3Price === 0) return __allPossibleStrategies

                        const stockPricePut1StrikeRatio = (option3.optionDetails.stockSymbolDetails.last / option3.optionDetails?.strikePrice) - 1;

                        if (stockPricePut1StrikeRatio < minStockPriceDistanceFromOption3StrikeInPercent || stockPricePut1StrikeRatio > maxStockPriceDistanceFromOption3StrikeInPercent) {
                            return __allPossibleStrategies
                        }

                        if (option3.optionDetails?.strikePrice < option2.optionDetails?.strikePrice) {
                            let option4 = callListWithHigherStrikePrice.find(call => call.optionDetails?.strikePrice === option2.optionDetails?.strikePrice);
                            if(!option4) return __allPossibleStrategies
                            const option4Price = getPriceOfAsset({
                                asset: option4,
                                priceType,
                                sideType: 'BUY'
                            });
                            if (option4Price === 0) return __allPossibleStrategies

                            const strategyObj = IRON_BUTTERFLY_BUPS_strategyObjCreator(option, option2, option3, option4, {
                                minStockMiddleDistanceInPercent, maxStockMiddleDistanceInPercent,
                                minStockPriceDistanceFromOption4StrikeInPercent, maxStockPriceDistanceFromOption4StrikeInPercent,
                                MIN_BUPS_BECS_diffStrikesRatio, MAX_BUPS_BECS_diffStrikesRatio, expectedProfitNotif, priceType, minProfitLossRatio
                            });

                            if (strategyObj) {

                                return __allPossibleStrategies.concat([strategyObj])
                            }else{
                                return __allPossibleStrategies
                            }

                        } else if (option3.optionDetails?.strikePrice === option2.optionDetails?.strikePrice) {
                            const optionListWithHigherStrikePriceThanO3 = callListWithHigherStrikePrice.filter(o => {
                                if (o.symbol === option2.symbol || o.symbol === option3.symbol)
                                    return false
                                if (o.optionDetails?.strikePrice === option2.optionDetails?.strikePrice)
                                    return false

                                if (o.optionDetails?.strikePrice <= option3.optionDetails?.strikePrice)
                                    return false

                                return true

                            }
                            );



                            let strategies = optionListWithHigherStrikePriceThanO3.reduce((___allPossibleStrategies, option4) => {




                                const option4Price = getPriceOfAsset({
                                    asset: option4,
                                    priceType,
                                    sideType: 'BUY'
                                });
                                if (option4Price === 0) return ___allPossibleStrategies



                                const strategyObj = IRON_BUTTERFLY_BUPS_strategyObjCreator(option, option2, option3, option4, {
                                    minStockMiddleDistanceInPercent, maxStockMiddleDistanceInPercent,
                                    minStockPriceDistanceFromOption4StrikeInPercent, maxStockPriceDistanceFromOption4StrikeInPercent,
                                    MIN_BUPS_BECS_diffStrikesRatio, MAX_BUPS_BECS_diffStrikesRatio, expectedProfitNotif, priceType, minProfitLossRatio
                                });
                                if(strategyObj){

                                    return ___allPossibleStrategies.concat([strategyObj])
                                }else{
                                    return ___allPossibleStrategies
                                }


                            }
                                , []);


                            return __allPossibleStrategies.concat(strategies)

                        } else {
                            return __allPossibleStrategies
                        }








                    }, [])










                    return _allPossibleStrategies.concat(strategies)


                }
                    , []);

                return {
                    ...option,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "IRON_BUTTERFLY_BUPS",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceFromHigherStrikeInPercent,
        maxStockPriceDistanceFromHigherStrikeInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "IRON_BUTTERFLY_BUPS",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && minStockPriceDistanceFromHigherStrikeInPercent !== null && minStockPriceDistanceFromHigherStrikeInPercent !== -Infinity && {
                label: "minToHigh",
                value: `${((minStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && maxStockPriceDistanceFromHigherStrikeInPercent !== null && maxStockPriceDistanceFromHigherStrikeInPercent !== Infinity && {
                label: "maxToHigh",
                value: `${((maxStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof minStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && minStockPriceDistanceFromSarBeSarInPercent !== null && minStockPriceDistanceFromSarBeSarInPercent !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && maxStockPriceDistanceFromSarBeSarInPercent !== null && maxStockPriceDistanceFromSarBeSarInPercent !== Infinity && {
                label: "maxToSar",
                value: `${((maxStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            },].filter(Boolean),
            minVol
        })
    }

}



const calcIRON_CONDOR_BUPS_Strategies = (list, {priceType, settlementGainChoosePriceType="MIN", showLeftRightProfitType="LEFT&RIGHT", strategySubName,
     BUCSSOptionListIgnorer, min_time_to_settlement=0, max_time_to_settlement=Infinity, 
     minStockPriceDistanceFromHigherStrikeInPercent=-Infinity, maxStockPriceDistanceFromHigherStrikeInPercent=Infinity, 
     minStockPriceDistanceFromSarBeSarInPercent=-Infinity, maxStockPriceDistanceFromSarBeSarInPercent=Infinity,
     minStockPriceDistanceFromOption2StrikeInPercent=-Infinity, maxStockPriceDistanceFromOption2StrikeInPercent=Infinity, 
     minStockPriceDistanceFromOption3StrikeInPercent=-Infinity, maxStockPriceDistanceFromOption3StrikeInPercent=Infinity, 
     minStockPriceDistanceFromOption4StrikeInPercent=-Infinity, maxStockPriceDistanceFromOption4StrikeInPercent=Infinity, minStockMiddleDistanceInPercent=-Infinity, maxStockMiddleDistanceInPercent=Infinity, MIN_BUPS_BECS_diffStrikesRatio=0, MAX_BUPS_BECS_diffStrikesRatio=Infinity, minProfitLossRatio=.7, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                // if (BUCSSOptionListIgnorer({
                //     option,
                //     minVol
                // }))
                //     return option

                if (!option.optionDetails?.stockSymbolDetails || !option.isPut || option.vol < minVol)
                    return option

                const priceOfOptionWithLowStrike = getPriceOfAsset({
                    asset: option,
                    priceType,
                    sideType: 'BUY'
                });

                if(priceOfOptionWithLowStrike===0) return option

                const putListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                    if (_option.symbol === option.symbol || !_option.isPut || _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice <= option.optionDetails?.strikePrice)
                        return false

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceHigherStrikeRatio > minStockPriceDistanceFromOption2StrikeInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceFromOption2StrikeInPercent) {} else {
                        return false
                    }

                    return true

                }
                );

                let allPossibleStrategies = putListWithHigherStrikePrice.reduce( (_allPossibleStrategies, option2) => {


                    const option2Price = getPriceOfAsset({
                        asset: option2,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(option2Price===0) return _allPossibleStrategies

                    

                    // TODO: create lower/higher strike price filter function in utils to reuse 

                    const callListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                        if ( _option.isPut || _option.vol < minVol)
                            return false
                        if (_option.optionDetails?.strikePrice <= option.optionDetails?.strikePrice)
                            return false

                        if (!_option.optionDetails?.stockSymbolDetails?.last)
                            return false

                        

                        return true

                    }
                    );

                    let __allPossibleStrategies = callListWithHigherStrikePrice.reduce( (___allPossibleStrategies, option3) => {

                        if(option3.optionDetails?.strikePrice === option2.optionDetails?.strikePrice) return ___allPossibleStrategies

                        const option3Price = getPriceOfAsset({
                            asset: option3,
                            priceType,
                            sideType: 'SELL'
                        });
                        if(option3Price===0) return ___allPossibleStrategies


                        const stockPricePut1StrikeRatio = (option3.optionDetails.stockSymbolDetails.last / option3.optionDetails?.strikePrice) - 1;

                        if (stockPricePut1StrikeRatio < minStockPriceDistanceFromOption3StrikeInPercent || stockPricePut1StrikeRatio > maxStockPriceDistanceFromOption3StrikeInPercent) {
                            return ___allPossibleStrategies
                        }

                        const optionListWithHigherStrikePriceThanO3 = callListWithHigherStrikePrice.filter(o => {
                            if (o.symbol === option2.symbol || o.symbol === option3.symbol)
                                return false
                            if (o.optionDetails?.strikePrice === option2.optionDetails?.strikePrice)
                                return false

                            if (o.optionDetails?.strikePrice <= option3.optionDetails?.strikePrice)
                                return false

                            return true

                        }
                        );




                       

                        let strategies = optionListWithHigherStrikePriceThanO3.reduce( (___allPossibleStrategies, option4) => {

                           


                            const option4Price = getPriceOfAsset({
                                asset: option4,
                                priceType,
                                sideType: 'BUY'
                            });
                            if(option4Price===0) return ___allPossibleStrategies
                            const middlePrice = option2.optionDetails?.strikePrice === option3.optionDetails?.strikePrice ? option2.optionDetails?.strikePrice : (option3.optionDetails?.strikePrice + option2.optionDetails?.strikePrice) / 2;

                            const stockPriceMiddleRatio = (option4.optionDetails.stockSymbolDetails.last / middlePrice) - 1;
                            if (stockPriceMiddleRatio > maxStockMiddleDistanceInPercent || stockPriceMiddleRatio < minStockMiddleDistanceInPercent)
                                return ___allPossibleStrategies

                            const stockPriceStrike4Ratio = (option4.optionDetails.stockSymbolDetails.last / option4.optionDetails?.strikePrice) - 1;

                            if (stockPriceStrike4Ratio > maxStockPriceDistanceFromOption4StrikeInPercent || stockPriceStrike4Ratio < minStockPriceDistanceFromOption4StrikeInPercent)
                                return ___allPossibleStrategies

                            // if (option.optionDetails.stockSymbolDetails.last  > option4.optionDetails?.strikePrice) return ___allPossibleStrategies
                            if (option4.optionDetails?.strikePrice < option2.optionDetails?.strikePrice)
                                return ___allPossibleStrategies


                            

                            const diffOfBUPS_Strikes = option2.optionDetails?.strikePrice - option.optionDetails?.strikePrice;
                            const diffOfBECS_Strikes = option4.optionDetails?.strikePrice - option3.optionDetails?.strikePrice;

                            const BUPS_BECS_diffStrikesRatio = diffOfBUPS_Strikes / diffOfBECS_Strikes;

                            if (BUPS_BECS_diffStrikesRatio < MIN_BUPS_BECS_diffStrikesRatio || BUPS_BECS_diffStrikesRatio > MAX_BUPS_BECS_diffStrikesRatio)
                                return ___allPossibleStrategies


                           

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
                                    getRequiredMargin: () => diffOfBUPS_Strikes
                                },
                                {
                                    ...option3,
                                    isSell: true,
                                    getQuantity: () => baseQuantity * BUPS_BECS_diffStrikesRatio,
                                    getRequiredMargin: () => diffOfBECS_Strikes
                                },
                                {
                                    ...option4,
                                    isBuy: true,
                                    getQuantity: () => baseQuantity * BUPS_BECS_diffStrikesRatio,
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










                            const priceThatCauseMaxLoss = Math.max(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) * 1.2;



                            const minProfitLossOfButterfly = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: priceThatCauseMaxLoss });

                            let priceThatCauseMaxProfit;
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
                                return ___allPossibleStrategies

                            const strategyObj = {
                                option: {
                                    ...option
                                },
                                positions:[option, option2, option3, option4],
                                strategyTypeTitle: "IRON_CONDOR_BUPS",
                                expectedProfitNotif,
                                name: createStrategyName([option, option2, option3, option4]),
                                profitPercent: profitLossPresent
                            }

                            return ___allPossibleStrategies.concat([strategyObj])

                        }
                        , []);

                        return ___allPossibleStrategies.concat(strategies)

                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

                }
                , []);

                return {
                    ...option,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "IRON_CONDOR_BUPS",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceFromHigherStrikeInPercent,
        maxStockPriceDistanceFromHigherStrikeInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "IRON_CONDOR_BUPS",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && minStockPriceDistanceFromHigherStrikeInPercent !== null && minStockPriceDistanceFromHigherStrikeInPercent !== -Infinity && {
                label: "minToHigh",
                value: `${((minStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && maxStockPriceDistanceFromHigherStrikeInPercent !== null && maxStockPriceDistanceFromHigherStrikeInPercent !== Infinity && {
                label: "maxToHigh",
                value: `${((maxStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof minStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && minStockPriceDistanceFromSarBeSarInPercent !== null && minStockPriceDistanceFromSarBeSarInPercent !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && maxStockPriceDistanceFromSarBeSarInPercent !== null && maxStockPriceDistanceFromSarBeSarInPercent !== Infinity && {
                label: "maxToSar",
                value: `${((maxStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, ].filter(Boolean),
            minVol
        })
    }

}

const calcIRON_BUTT_CONDOR_BUPS_Strategies = (list, {priceType, settlementGainChoosePriceType="MIN", showLeftRightProfitType="LEFT&RIGHT", strategySubName,
     BUCSSOptionListIgnorer, min_time_to_settlement=0, max_time_to_settlement=Infinity, 
     minStockPriceDistanceFromHigherStrikeInPercent=-Infinity, maxStockPriceDistanceFromHigherStrikeInPercent=Infinity, 
     minStockPriceDistanceFromSarBeSarInPercent=-Infinity, maxStockPriceDistanceFromSarBeSarInPercent=Infinity,
     minStockPriceDistanceFromOption2StrikeInPercent=-Infinity, maxStockPriceDistanceFromOption2StrikeInPercent=Infinity, 
     minStockPriceDistanceFromOption3StrikeInPercent=-Infinity, maxStockPriceDistanceFromOption3StrikeInPercent=Infinity, 
     minStockPriceDistanceFromOption4StrikeInPercent=-Infinity, maxStockPriceDistanceFromOption4StrikeInPercent=Infinity, minStockMiddleDistanceInPercent=-Infinity, maxStockMiddleDistanceInPercent=Infinity, MIN_BUPS_BECS_diffStrikesRatio=0, MAX_BUPS_BECS_diffStrikesRatio=Infinity, minProfitLossRatio=.7, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                // if (BUCSSOptionListIgnorer({
                //     option,
                //     minVol
                // }))
                //     return option

                if (!option.optionDetails?.stockSymbolDetails || !option.isPut || option.vol < minVol)
                    return option

                const priceOfOptionWithLowStrike = getPriceOfAsset({
                    asset: option,
                    priceType,
                    sideType: 'BUY'
                });

                if(priceOfOptionWithLowStrike===0) return option

                const putListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                    if (_option.symbol === option.symbol || !_option.isPut || _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice <= option.optionDetails?.strikePrice)
                        return false

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceHigherStrikeRatio > minStockPriceDistanceFromOption2StrikeInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceFromOption2StrikeInPercent) {} else {
                        return false
                    }

                    return true

                }
                );

                let allPossibleStrategies = putListWithHigherStrikePrice.reduce( (_allPossibleStrategies, option2) => {


                    const option2Price = getPriceOfAsset({
                        asset: option2,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(option2Price===0) return _allPossibleStrategies

                    

                    // TODO: create lower/higher strike price filter function in utils to reuse 

                    const callListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                        if ( _option.isPut || _option.vol < minVol)
                            return false
                        if (_option.optionDetails?.strikePrice <= option.optionDetails?.strikePrice)
                            return false

                        if (!_option.optionDetails?.stockSymbolDetails?.last)
                            return false

                        

                        return true

                    }
                    );

                    let __allPossibleStrategies = callListWithHigherStrikePrice.reduce( (___allPossibleStrategies, option3) => {


                        const option3Price = getPriceOfAsset({
                            asset: option3,
                            priceType,
                            sideType: 'SELL'
                        });
                        if(option3Price===0) return ___allPossibleStrategies


                        const stockPricePut1StrikeRatio = (option3.optionDetails.stockSymbolDetails.last / option3.optionDetails?.strikePrice) - 1;

                        if (stockPricePut1StrikeRatio < minStockPriceDistanceFromOption3StrikeInPercent || stockPricePut1StrikeRatio > maxStockPriceDistanceFromOption3StrikeInPercent) {
                            return ___allPossibleStrategies
                        }

                        const optionListWithHigherStrikePriceThanO3 = callListWithHigherStrikePrice.filter(o => {
                            // if (o.symbol === option2.symbol || o.symbol === option3.symbol)
                            //     return false
                            // if (o.optionDetails?.strikePrice === option2.optionDetails?.strikePrice)
                            //     return false

                            if (o.optionDetails?.strikePrice <= option3.optionDetails?.strikePrice)
                                return false

                            return true

                        }
                        );




                       

                        let strategies = optionListWithHigherStrikePriceThanO3.reduce( (___allPossibleStrategies, option4) => {

                           


                            const option4Price = getPriceOfAsset({
                                asset: option4,
                                priceType,
                                sideType: 'BUY'
                            });
                            if(option4Price===0) return ___allPossibleStrategies
                            const middlePrice = option2.optionDetails?.strikePrice === option3.optionDetails?.strikePrice ? option2.optionDetails?.strikePrice : (option3.optionDetails?.strikePrice + option2.optionDetails?.strikePrice) / 2;

                            const stockPriceMiddleRatio = (option4.optionDetails.stockSymbolDetails.last / middlePrice) - 1;
                            if (stockPriceMiddleRatio > maxStockMiddleDistanceInPercent || stockPriceMiddleRatio < minStockMiddleDistanceInPercent)
                                return ___allPossibleStrategies

                            const stockPriceStrike4Ratio = (option4.optionDetails.stockSymbolDetails.last / option4.optionDetails?.strikePrice) - 1;

                            if (stockPriceStrike4Ratio > maxStockPriceDistanceFromOption4StrikeInPercent || stockPriceStrike4Ratio < minStockPriceDistanceFromOption4StrikeInPercent)
                                return ___allPossibleStrategies

                            // if (option.optionDetails.stockSymbolDetails.last  > option4.optionDetails?.strikePrice) return ___allPossibleStrategies
                            if (option4.optionDetails?.strikePrice < option2.optionDetails?.strikePrice)
                                return ___allPossibleStrategies

                        

                            const diffOfBUPS_Strikes = option2.optionDetails?.strikePrice - option.optionDetails?.strikePrice;
                            const diffOfBECS_Strikes = option4.optionDetails?.strikePrice - option3.optionDetails?.strikePrice;

                            const BUPS_BECS_diffStrikesRatio = diffOfBUPS_Strikes / diffOfBECS_Strikes;

                            if (BUPS_BECS_diffStrikesRatio < MIN_BUPS_BECS_diffStrikesRatio || BUPS_BECS_diffStrikesRatio > MAX_BUPS_BECS_diffStrikesRatio)
                                return ___allPossibleStrategies






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
                                    getRequiredMargin: () => diffOfBUPS_Strikes
                                },
                                {
                                    ...option3,
                                    isSell: true,
                                    getQuantity: () => baseQuantity * BUPS_BECS_diffStrikesRatio,
                                    getRequiredMargin: () => diffOfBECS_Strikes
                                },
                                {
                                    ...option4,
                                    isBuy: true,
                                    getQuantity: () => baseQuantity * BUPS_BECS_diffStrikesRatio,
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
                                return ___allPossibleStrategies

                            const strategyObj = {
                                option: {
                                    ...option
                                },
                                positions:[option, option2, option3, option4],
                                strategyTypeTitle: "IRON_BUTT_CONDOR_BUPS",
                                expectedProfitNotif,
                                name: createStrategyName([option, option2, option3, option4]),
                                profitPercent: profitLossPresent
                            }

                            return ___allPossibleStrategies.concat([strategyObj])

                        }
                        , []);

                        return ___allPossibleStrategies.concat(strategies)

                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

                }
                , []);

                return {
                    ...option,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "IRON_BUTT_CONDOR_BUPS",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceFromHigherStrikeInPercent,
        maxStockPriceDistanceFromHigherStrikeInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "IRON_BUTT_CONDOR_BUPS",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && minStockPriceDistanceFromHigherStrikeInPercent !== null && minStockPriceDistanceFromHigherStrikeInPercent !== -Infinity && {
                label: "minToHigh",
                value: `${((minStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && maxStockPriceDistanceFromHigherStrikeInPercent !== null && maxStockPriceDistanceFromHigherStrikeInPercent !== Infinity && {
                label: "maxToHigh",
                value: `${((maxStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof minStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && minStockPriceDistanceFromSarBeSarInPercent !== null && minStockPriceDistanceFromSarBeSarInPercent !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && maxStockPriceDistanceFromSarBeSarInPercent !== null && maxStockPriceDistanceFromSarBeSarInPercent !== Infinity && {
                label: "maxToSar",
                value: `${((maxStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, ].filter(Boolean),
            minVol
        })
    }

}



const calcPUT_BUTT_CONDORStrategies = (list, {priceType, settlementGainChoosePriceType="MIN", strategySubName, BUCSSOptionListIgnorer=generalConfig.BUCSSOptionListIgnorer, min_time_to_settlement=0, max_time_to_settlement=Infinity, minStockPriceDistanceFromHigherStrikeInPercent=-Infinity, maxStockPriceDistanceFromHigherStrikeInPercent=Infinity, minStockPriceDistanceFromSarBeSarInPercent=-Infinity, maxStockPriceDistanceFromSarBeSarInPercent=Infinity, MIN_BUPS_BEPS_diffStrikesRatio=0, MAX_BUPS_BEPS_diffStrikesRatio=Infinity, minStockStrike4DistanceInPercent=-Infinity, maxStockStrike4DistanceInPercent=Infinity, minStockMiddleDistanceInPercent=-Infinity, maxStockMiddleDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, minProfitLossRatio=.7, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (BUCSSOptionListIgnorer({
                    option,
                    minVol
                }))
                    return option

                const optionPrice = getPriceOfAsset({
                        asset: option,
                        priceType,
                        sideType: 'BUY'
                });

                if(optionPrice===0) return option

                const optionListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {

                    if (_option.symbol === option.symbol || !_option.symbol.startsWith('ط') || _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice < option.optionDetails?.strikePrice)
                        return false

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceHigherStrikeRatio > minStockPriceDistanceFromHigherStrikeInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceFromHigherStrikeInPercent) {} else {
                        return false
                    }

                    const lowStrikePrice = getPriceOfAsset({
                        asset: option,
                        priceType,
                        sideType: 'BUY'
                    });
                    const highStrikePrice = getPriceOfAsset({
                        asset: _option,
                        priceType,
                        sideType: 'SELL'
                    });

                     // TODO: use breakeven function 
                    const sarBeSar = option.optionDetails?.strikePrice + (lowStrikePrice - highStrikePrice);

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceSarBeSarRatio = (_option.optionDetails.stockSymbolDetails.last / sarBeSar) - 1;

                    if (stockPriceSarBeSarRatio > minStockPriceDistanceFromSarBeSarInPercent && stockPriceSarBeSarRatio < maxStockPriceDistanceFromSarBeSarInPercent) {} else {
                        return false
                    }

                    return true

                }
                );

                let allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (_allPossibleStrategies, option2) => {


                    const option2Price = getPriceOfAsset({
                        asset: option2,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(option2Price===0) return _allPossibleStrategies
                    

                    

                    let __allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (___allPossibleStrategies, option3) => {


                        const option3Price = getPriceOfAsset({
                            asset: option3,
                            priceType,
                            sideType: 'SELL'
                        });

                        if(option3Price===0) return ___allPossibleStrategies

                        const optionListWithHigherStrikePriceThanO3 = optionListWithHigherStrikePrice.filter(o => {
                            if (o.symbol === option2.symbol || o.symbol === option3.symbol)
                                return false

                            if (o.optionDetails?.strikePrice <= option3.optionDetails?.strikePrice)
                                return false

                            return true

                        }
                        );
                        let strategies = optionListWithHigherStrikePriceThanO3.reduce( (___allPossibleStrategies, option4) => {

                            const option4Price = getPriceOfAsset({
                                asset: option4,
                                priceType,
                                sideType: 'BUY'
                            });

                            if(option4Price===0) return ___allPossibleStrategies

                            const middlePrice = option2.optionDetails?.strikePrice === option3.optionDetails?.strikePrice ? option2.optionDetails?.strikePrice : (option3.optionDetails?.strikePrice + option2.optionDetails?.strikePrice) / 2;

                            const stockPriceMiddleRatio = (option4.optionDetails.stockSymbolDetails.last / middlePrice) - 1;
                            if (stockPriceMiddleRatio > maxStockMiddleDistanceInPercent || stockPriceMiddleRatio < minStockMiddleDistanceInPercent)
                                return ___allPossibleStrategies

                            const stockPriceStrike4Ratio = (option4.optionDetails.stockSymbolDetails.last / option4.optionDetails?.strikePrice) - 1;

                            if (stockPriceStrike4Ratio > maxStockStrike4DistanceInPercent || stockPriceStrike4Ratio < minStockStrike4DistanceInPercent)
                                return ___allPossibleStrategies

                            // if (option.optionDetails.stockSymbolDetails.last  > option4.optionDetails?.strikePrice) return ___allPossibleStrategies
                            if (option4.optionDetails?.strikePrice < option2.optionDetails?.strikePrice)
                                return ___allPossibleStrategies



                            const diffOfBUPS_Strikes = option2.optionDetails?.strikePrice - option.optionDetails?.strikePrice;
                            const diffOfBEPS_Strikes = option4.optionDetails?.strikePrice - option3.optionDetails?.strikePrice;

                            const BUPS_BEPS_diffStrikesRatio = diffOfBUPS_Strikes / diffOfBEPS_Strikes;

                            if (BUPS_BEPS_diffStrikesRatio < MIN_BUPS_BEPS_diffStrikesRatio || BUPS_BEPS_diffStrikesRatio > MAX_BUPS_BEPS_diffStrikesRatio)
                                return ___allPossibleStrategies



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
                                    getRequiredMargin: () => diffOfBUPS_Strikes
                                },
                                {
                                    ...option3,
                                    isSell: true,
                                    getQuantity: () => baseQuantity * BUPS_BEPS_diffStrikesRatio,
                                    getRequiredMargin() { }
                                },
                                {
                                    ...option4,
                                    isBuy: true,
                                    getQuantity: () => baseQuantity * BUPS_BEPS_diffStrikesRatio,
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


                            const minProfitPercent = (minProfitLossOfButterfly/Math.abs(totalCost))*100;

                            

                            if(option2.symbol!==option3.symbol  && minProfitPercent <2){
                                return ___allPossibleStrategies
                            }
                            if(option2.symbol===option3.symbol && BUPS_BEPS_diffStrikesRatio!==1  && minProfitPercent <2){
                                return ___allPossibleStrategies
                            }

                            let priceThatCauseMaxProfit
                            if (BUPS_BEPS_diffStrikesRatio > 1) {
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
                                return ___allPossibleStrategies

                            const strategyObj = {
                                option: {
                                    ...option
                                },
                                positions:[option, option2, option3, option4],
                                strategyTypeTitle: "PUT_BUTT_CONDOR",
                                expectedProfitNotif,
                                name: createStrategyName([option, option2, option3, option4]),
                                profitPercent: profitLossPresent
                            }

                            return ___allPossibleStrategies.concat([strategyObj])

                        }
                        , []);

                        return ___allPossibleStrategies.concat(strategies)

                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

                }
                , []);

                return {
                    ...option,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "PUT_BUTT_CONDOR",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceFromHigherStrikeInPercent,
        maxStockPriceDistanceFromHigherStrikeInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "PUT_BUTT_CONDOR",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && minStockPriceDistanceFromHigherStrikeInPercent !== null && minStockPriceDistanceFromHigherStrikeInPercent !== -Infinity && {
                label: "minToHigh",
                value: `${((minStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && maxStockPriceDistanceFromHigherStrikeInPercent !== null && maxStockPriceDistanceFromHigherStrikeInPercent !== Infinity && {
                label: "maxToHigh",
                value: `${((maxStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof minStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && minStockPriceDistanceFromSarBeSarInPercent !== null && minStockPriceDistanceFromSarBeSarInPercent !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromSarBeSarInPercent !== 'undefined' && maxStockPriceDistanceFromSarBeSarInPercent !== null && maxStockPriceDistanceFromSarBeSarInPercent !== Infinity && {
                label: "maxToSar",
                value: `${((maxStockPriceDistanceFromSarBeSarInPercent) * 100).toFixed(0)}%`
            }, ].filter(Boolean),
            minVol
        })
    }

}

const calcBUCSRatioStrategies = (list, {priceType, strategySubName,minQuantityFactorOfBUCS=0.6, 
    maxQuantityFactorOfBUCS=2, BUCSSOptionListIgnorer=generalConfig.BUCSSOptionListIgnorer, 
    min_time_to_settlement=0, max_time_to_settlement=Infinity, 
    minStockPriceToSarBeSarPercent=-Infinity,maxStockPriceToSarBeSarPercent=-.15,
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(buyingCall => {

                if (BUCSSOptionListIgnorer({
                    option:buyingCall,
                    minVol
                }))
                    return buyingCall


                const buyingCallPrice = getPriceOfAsset({
                    asset: buyingCall,
                    priceType,
                    sideType: 'BUY'
                });
                if(buyingCallPrice===0) return buyingCall

                const optionListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingCall.symbol || !_option.isCall || _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice <= buyingCall.optionDetails?.strikePrice)
                        return false


                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false


                    return true
                    

                }
                );

                let allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (_allPossibleStrategies, sellingCall) => {



                    
                    const sellingCallPrice = getPriceOfAsset({
                        asset: sellingCall,
                        priceType,
                        sideType: 'SELL'
                    });
                    if(sellingCallPrice===0) return _allPossibleStrategies



                    let __allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (___allPossibleStrategies, anotherSellingCall) => {


                        const anotherSellingCallPrice = getPriceOfAsset({
                            asset: anotherSellingCall,
                            priceType,
                            sideType: 'SELL'
                        });
                        if(anotherSellingCallPrice===0) return ___allPossibleStrategies



                        const maxProfitOfSellingCall = anotherSellingCallPrice;

                        const strategyPositionsOfBUCS = [
                            {
                                ...buyingCall,
                                isBuy: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingCall,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                        ]
                        const totalCostOfBUCS = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBUCS,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMaxLossOfBUCS = Math.min(...strategyPositionsOfBUCS.map(strategyPosition=>strategyPosition.strikePrice))/ 1.2;
                        const priceThatCauseMaxPofitOfBUCS = Math.max(...strategyPositionsOfBUCS.map(strategyPosition=>strategyPosition.strikePrice))* 1.2;



                        const maxLossOfBUCS = totalCostOfBUCS + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBUCS, stockPrice:priceThatCauseMaxLossOfBUCS});
                        const maxProfitOfBUCS = totalCostOfBUCS + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBUCS, stockPrice:priceThatCauseMaxPofitOfBUCS});



                        const quantityFactorOfBUCS = Math.abs(maxProfitOfSellingCall/maxLossOfBUCS);


                        if (quantityFactorOfBUCS < minQuantityFactorOfBUCS  || quantityFactorOfBUCS > maxQuantityFactorOfBUCS)
                            return ___allPossibleStrategies



                        const strategyPositionsOfBUCS_RATIO = [
                            {
                                ...buyingCall,
                                isBuy: true,
                                getQuantity: () => 1*quantityFactorOfBUCS,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingCall,
                                isSell: true,
                                getQuantity: () => 1*quantityFactorOfBUCS,
                                getRequiredMargin() { }
                            },
                            {
                                ...anotherSellingCall,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                        ]

                        const totalCostOfBUCS_RATIO = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBUCS_RATIO,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMaxLossOfBUCS_RATIO = Math.max(...strategyPositionsOfBUCS_RATIO.map(strategyPosition=>strategyPosition.strikePrice)) * 1.3;



                        const maxLossOfBUCS_RATIO = totalCostOfBUCS_RATIO + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBUCS_RATIO, stockPrice:priceThatCauseMaxLossOfBUCS_RATIO});


                        const breakevenList = findBreakevenList({
                            positions:strategyPositionsOfBUCS_RATIO, 
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const breakeven = breakevenList[0];


                        let isFullBodyProfitable,stockPriceToSarBeSarPercent;
                        if(!breakeven && maxLossOfBUCS_RATIO>0){
                            isFullBodyProfitable = true;
                        }else if(!breakeven){
                            return _allPossibleStrategies
                        }else{

                            stockPriceToSarBeSarPercent = (anotherSellingCall.optionDetails.stockSymbolDetails.last/breakeven) -1

                        
                            if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSarPercent || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSarPercent)
                                return _allPossibleStrategies
                        }

                        

                        return ___allPossibleStrategies.concat([{
                            option: {
                                ...buyingCall
                            },
                            positions:[buyingCall, sellingCall, anotherSellingCall],
                            strategyTypeTitle: "BUCS_RATIO",
                            expectedProfitNotif,
                            name: createStrategyName([buyingCall, sellingCall, anotherSellingCall]),
                            profitPercent: isFullBodyProfitable ? 1: -stockPriceToSarBeSarPercent 
                        }])
                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

                }
                , []);

                return {
                    ...buyingCall,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "BUCS_RATIO",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceToSarBeSarPercent,
        maxStockPriceToSarBeSarPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BUCS_RATIO",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceToSarBeSarPercent,
            maxStockPriceToSarBeSarPercent,
            minVol
        })
    }

}




const calcBUPSRatioStrategies = (list, {priceType, strategySubName, minQuantityFactorOfBUPS=0.6, 
    minStockPriceToSarBeSarPercent=-Infinity,
    maxStockPriceToSarBeSarPercent=-.15,
    min_time_to_settlement=0, max_time_to_settlement=Infinity, 
    minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {
    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(buyingPut => {
                if (!buyingPut.optionDetails?.stockSymbolDetails || !buyingPut.isPut || buyingPut.vol < minVol){
                    return buyingPut
                }

                const buyingPutPrice = getPriceOfAsset({
                    asset: buyingPut,
                    priceType,
                    sideType: 'BUY'
                });
                if(buyingPutPrice===0) return buyingPut


              
                const putListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingPut.symbol || !_option.isPut || _option.vol < minVol)
                        return
                    if (_option.optionDetails?.strikePrice < buyingPut.optionDetails?.strikePrice)
                        return


                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    return stockPriceHigherStrikeRatio > minStockPriceDistanceInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceInPercent

                }
                );

                const callListHigherStrikeThanBuyingPut = optionListOfSameDate.filter(_option => {
                    if (!_option.isCall || _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice < buyingPut.optionDetails?.strikePrice)
                        return false


                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    return true

                }
                );

                let allPossibleStrategies = putListWithHigherStrikePrice.reduce( (_allPossibleStrategies, sellingPut) => {



                  

                    const sellingPutPrice = getPriceOfAsset({
                        asset: sellingPut,
                        priceType,
                        sideType: 'SELL'
                    });
                    if(sellingPutPrice===0) return _allPossibleStrategies
                   


                    let __allPossibleStrategies = callListHigherStrikeThanBuyingPut.reduce( (___allPossibleStrategies, sellingCall) => {


                     


                        const sellingCallPrice = getPriceOfAsset({
                            asset: sellingCall,
                            priceType,
                            sideType: 'SELL'
                        });
                        if (sellingCallPrice === 0) return ___allPossibleStrategies


                        const maxProfitOfSellingCall = sellingCallPrice;


                        const diffOfBUPS_Strikes = sellingPut.optionDetails?.strikePrice - buyingPut.optionDetails?.strikePrice;
                        const strategyPositionsOfBUPS = [
                            {
                                ...buyingPut,
                                isBuy: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingPut,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin: () => diffOfBUPS_Strikes
                            },
                        ]



                        const totalCostOfBUPS = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBUPS,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMaxLossOfBUPS = Math.min(...strategyPositionsOfBUPS.map(strategyPosition=>strategyPosition.strikePrice))/ 1.2;



                        const maxLossOfBUPS = totalCostOfBUPS + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBUPS, stockPrice:priceThatCauseMaxLossOfBUPS});



                        const quantityFactorOfBUPS = Math.abs(maxProfitOfSellingCall/maxLossOfBUPS);


                        if (quantityFactorOfBUPS < minQuantityFactorOfBUPS)
                            return ___allPossibleStrategies


                        // TODO: sellingCall margin
                        const strategyPositionsOfBUPS_RATIO = [
                            {
                                ...buyingPut,
                                isBuy: true,
                                getQuantity: () => 1*quantityFactorOfBUPS,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingPut,
                                isSell: true,
                                getQuantity: () => 1*quantityFactorOfBUPS,
                                getRequiredMargin: () => diffOfBUPS_Strikes
                            },
                            {
                                ...sellingCall,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                        ]

                        const totalCostOfBUPS_RATIO = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBUPS_RATIO,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMaxLossOfBUPS_RATIO = Math.max(...strategyPositionsOfBUPS_RATIO.map(strategyPosition=>strategyPosition.strikePrice)) * 1.3;



                        const maxLossOfBUPS_RATIO = totalCostOfBUPS_RATIO + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBUPS_RATIO, stockPrice:priceThatCauseMaxLossOfBUPS_RATIO});


                        const breakevenList = findBreakevenList({
                            positions:strategyPositionsOfBUPS_RATIO, 
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const breakeven = breakevenList[0];


                        let isFullBodyProfitable,stockPriceToSarBeSarPercent;
                        if(!breakeven && maxLossOfBUPS_RATIO>0){
                            isFullBodyProfitable = true;
                        }else if(!breakeven){
                            return _allPossibleStrategies
                        }else{

                            stockPriceToSarBeSarPercent = (sellingCall.optionDetails.stockSymbolDetails.last/breakeven) -1

                        
                            if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSarPercent || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSarPercent)
                                return _allPossibleStrategies
                        }


                        return ___allPossibleStrategies.concat([{
                            option: {
                                ...buyingPut
                            },
                            positions:[buyingPut, sellingPut, sellingCall],
                            strategyTypeTitle: "BUPS_Ratio",
                            expectedProfitNotif,
                            name: createStrategyName([buyingPut, sellingPut, sellingCall]),
                            profitPercent: isFullBodyProfitable ? 1 : -stockPriceToSarBeSarPercent
                        }])
                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

                }
                , []);

                return {
                    ...buyingPut,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "BUPS_Ratio",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceInPercent,
        maxStockPriceDistanceInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BUPS_Ratio",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceInPercent,
            maxStockPriceDistanceInPercent,
            minVol
        })
    }

}



// Jade Lizard
const calcBECSRatioStrategies = (list, {priceType, strategySubName, minQuantityFactorOfBECS=0.6, 
    minStockPriceToSarBeSarPercent=0.2,
    maxStockPriceToSarBeSarPercent=Infinity,
    min_time_to_settlement=0, max_time_to_settlement=Infinity, 
    minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {
    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(buyingCall => {
                if (!buyingCall.optionDetails?.stockSymbolDetails || !buyingCall.isCall || buyingCall.vol < minVol){
                    return buyingCall
                }

                const buyingCallPrice = getPriceOfAsset({
                    asset: buyingCall,
                    priceType,
                    sideType: 'BUY'
                });
                if(buyingCallPrice===0) return buyingCall


              
                const callListWithLowerStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingCall.symbol || !_option.isCall || _option.vol < minVol)
                        return
                    if (_option.optionDetails?.strikePrice >= buyingCall.optionDetails?.strikePrice)
                        return


                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceLowerStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    return stockPriceLowerStrikeRatio > minStockPriceDistanceInPercent && stockPriceLowerStrikeRatio < maxStockPriceDistanceInPercent

                }
                );

                const putListLowerStrikeThanBuyingCall = optionListOfSameDate.filter(_option => {
                    if (!_option.isPut || _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice > buyingCall.optionDetails?.strikePrice)
                        return false


                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    return true

                }
                );

                let allPossibleStrategies = callListWithLowerStrikePrice.reduce( (_allPossibleStrategies, sellingCall) => {



                  

                    const sellingCallPrice = getPriceOfAsset({
                        asset: sellingCall,
                        priceType,
                        sideType: 'SELL'
                    });
                    if(sellingCallPrice===0) return _allPossibleStrategies
                   


                    let __allPossibleStrategies = putListLowerStrikeThanBuyingCall.reduce( (___allPossibleStrategies, sellingPut) => {


                     


                        const sellingPutPrice = getPriceOfAsset({
                            asset: sellingPut,
                            priceType,
                            sideType: 'SELL'
                        });
                        if (sellingPutPrice === 0) return ___allPossibleStrategies


                        const maxProfitOfSellingPut = sellingPutPrice;


                        const diffOfBECS_Strikes = buyingCall.optionDetails?.strikePrice - sellingCall.optionDetails?.strikePrice;
                        const strategyPositionsOfBECS = [
                            {
                                ...buyingCall,
                                isBuy: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingCall,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin: () => diffOfBECS_Strikes
                            },
                        ]



                        const totalCostOfBECS = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBECS,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMaxLossOfBECS = Math.max(...strategyPositionsOfBECS.map(strategyPosition=>strategyPosition.strikePrice))* 1.2;
                        const priceThatCauseMaxProfitOfBECS = Math.min(...strategyPositionsOfBECS.map(strategyPosition=>strategyPosition.strikePrice))/ 1.2;



                        const maxLossOfBECS = totalCostOfBECS + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBECS, stockPrice:priceThatCauseMaxLossOfBECS});
                        const maxProfitOfBECS = totalCostOfBECS + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBECS, stockPrice:priceThatCauseMaxProfitOfBECS});



                        const quantityFactorOfBECS = Math.abs(maxProfitOfSellingPut/maxLossOfBECS);


                        if (quantityFactorOfBECS < minQuantityFactorOfBECS)
                            return ___allPossibleStrategies



                        // TODO: selling put margin
                        const strategyPositionsOfBECS_RATIO = [
                            {
                                ...buyingCall,
                                isBuy: true,
                                getQuantity: () => 1*quantityFactorOfBECS,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingCall,
                                isSell: true,
                                getQuantity: () => 1*quantityFactorOfBECS,
                                getRequiredMargin: () => diffOfBECS_Strikes
                            },
                            {
                                ...sellingPut,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin: () => 0
                            },
                        ]
                        


                        const breakevenList = findBreakevenList({
                            positions:strategyPositionsOfBECS_RATIO, 
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                         const totalCostOfBECS_RATIO = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBECS_RATIO,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMaxLossOfBECS_RATIO = Math.min(...strategyPositionsOfBECS_RATIO.map(strategyPosition=>strategyPosition.strikePrice)) / 1.2;



                        const maxLossOfBECS_RATIO = totalCostOfBECS_RATIO + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBECS_RATIO, stockPrice:priceThatCauseMaxLossOfBECS_RATIO});


                        const breakeven = breakevenList[0];

                        let isFullBodyProfitable,stockPriceToSarBeSarPercent;
                        if(!breakeven && maxLossOfBECS_RATIO>0){
                            isFullBodyProfitable = true;
                        }else if(!breakeven){
                            return _allPossibleStrategies
                        }else{

                            stockPriceToSarBeSarPercent = (sellingPut.optionDetails.stockSymbolDetails.last/breakeven) -1
                        
                            if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSarPercent || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSarPercent)
                                return _allPossibleStrategies
                        }


                        return ___allPossibleStrategies.concat([{
                            option: {
                                ...buyingCall
                            },
                            positions:[buyingCall, sellingCall, sellingPut],
                            strategyTypeTitle: "BECS_Ratio",
                            expectedProfitNotif,
                            name: createStrategyName([buyingCall, sellingCall, sellingPut]),
                            profitPercent: isFullBodyProfitable? 1: stockPriceToSarBeSarPercent
                        }])
                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

                }
                , []);

                return {
                    ...buyingCall,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "BECS_Ratio",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceInPercent,
        maxStockPriceDistanceInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BECS_Ratio",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceInPercent,
            maxStockPriceDistanceInPercent,
            minVol
        })
    }

}


const calcBEPSRatioStrategies = (list, {priceType, strategySubName, minQuantityFactorOfBEPS=0.6, 
    minStockPriceToSarBeSarPercent=0.2,
    maxStockPriceToSarBeSarPercent=Infinity,
    min_time_to_settlement=0, max_time_to_settlement=Infinity, 
    minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {
    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(buyingPut => {
                if (!buyingPut.optionDetails?.stockSymbolDetails || !buyingPut.isPut || buyingPut.vol < minVol){
                    return buyingPut
                }

                const buyingPutPrice = getPriceOfAsset({
                    asset: buyingPut,
                    priceType,
                    sideType: 'BUY'
                });
                if(buyingPutPrice===0) return buyingPut


              
                const putListWithLowerStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingPut.symbol || !_option.isPut || _option.vol < minVol)
                        return
                    if (_option.optionDetails?.strikePrice >= buyingPut.optionDetails?.strikePrice)
                        return


                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false


                    return true

                  
                }
                );

                

                let allPossibleStrategies = putListWithLowerStrikePrice.reduce( (_allPossibleStrategies, sellingPut) => {

                    const stockPriceLowerStrikeRatio = (sellingPut.optionDetails.stockSymbolDetails.last / sellingPut.optionDetails?.strikePrice) - 1;

                    if(stockPriceLowerStrikeRatio < minStockPriceDistanceInPercent || stockPriceLowerStrikeRatio > maxStockPriceDistanceInPercent){
                        return _allPossibleStrategies
                    }


                  

                    const sellingPutPrice = getPriceOfAsset({
                        asset: sellingPut,
                        priceType,
                        sideType: 'SELL'
                    });
                    if(sellingPutPrice===0) return _allPossibleStrategies
                   


                    let __allPossibleStrategies = putListWithLowerStrikePrice.reduce( (___allPossibleStrategies, anotherSellingPut) => {


                     


                        const anotherSellingPutPrice = getPriceOfAsset({
                            asset: anotherSellingPut,
                            priceType,
                            sideType: 'SELL'
                        });
                        if (anotherSellingPutPrice === 0) return ___allPossibleStrategies


                        const maxProfitOfSellingPut = anotherSellingPutPrice;


                        const diffOfBEPS_Strikes = buyingPut.optionDetails?.strikePrice - anotherSellingPut.optionDetails?.strikePrice;
                        const strategyPositionsOfBEPS = [
                            {
                                ...buyingPut,
                                isBuy: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingPut,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin() { }
                            },
                        ]



                        const totalCostOfBEPS = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBEPS,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMaxLossOfBEPS = Math.max(...strategyPositionsOfBEPS.map(strategyPosition=>strategyPosition.strikePrice))* 1.2;



                        const maxLossOfBEPS = totalCostOfBEPS + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBEPS, stockPrice:priceThatCauseMaxLossOfBEPS});



                        const quantityFactorOfBEPS = Math.abs(maxProfitOfSellingPut/maxLossOfBEPS);

                         if (quantityFactorOfBEPS < minQuantityFactorOfBEPS)
                            return ___allPossibleStrategies



                        const strategyPositionsOfBEPS_RATIO = [
                            {
                                ...buyingPut,
                                isBuy: true,
                                getQuantity: () => 1*quantityFactorOfBEPS,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingPut,
                                isSell: true,
                                getQuantity: () => 1*quantityFactorOfBEPS,
                                getRequiredMargin() { }
                            },
                            {
                                ...anotherSellingPut,
                                isSell: true,
                                getQuantity: () => 1,
                                getRequiredMargin: () => 0
                            },
                        ]


                       

                       


                         const totalCostOfBEPS_RATIO = totalCostCalculatorCommon({
                            strategyPositions: strategyPositionsOfBEPS_RATIO,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const priceThatCauseMaxLossOfBEPS_RATIO = Math.min(...strategyPositionsOfBEPS_RATIO.map(strategyPosition=>strategyPosition.strikePrice)) / 1.2;



                        const maxLossOfBEPS_RATIO = totalCostOfBEPS_RATIO + calcOffsetGainOfPositions({strategyPositions:strategyPositionsOfBEPS_RATIO, stockPrice:priceThatCauseMaxLossOfBEPS_RATIO});


                        const breakevenList = findBreakevenList({
                            positions:strategyPositionsOfBEPS_RATIO, 
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const breakeven = breakevenList[0];


                        let isFullBodyProfitable,stockPriceToSarBeSarPercent;
                        if(!breakeven && maxLossOfBEPS_RATIO>0){
                            isFullBodyProfitable = true;
                        }else if(!breakeven){
                            return _allPossibleStrategies
                        }else{

                            stockPriceToSarBeSarPercent = (anotherSellingPut.optionDetails.stockSymbolDetails.last/breakeven) -1

                        
                            if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSarPercent || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSarPercent)
                                return _allPossibleStrategies
                        }







                        return ___allPossibleStrategies.concat([{
                            option: {
                                ...buyingPut
                            },
                            positions:[buyingPut, sellingPut, anotherSellingPut],
                            strategyTypeTitle: "BEPS_Ratio",
                            expectedProfitNotif,
                            name: createStrategyName([buyingPut, sellingPut, anotherSellingPut]),
                            profitPercent: isFullBodyProfitable ? 1 : stockPriceToSarBeSarPercent
                        }])
                    }
                    , []);

                    return _allPossibleStrategies.concat(__allPossibleStrategies)

                }
                , []);

                return {
                    ...buyingPut,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "BEPS_Ratio",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceInPercent,
        maxStockPriceDistanceInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BEPS_Ratio",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceInPercent,
            maxStockPriceDistanceInPercent,
            minVol
        })
    }

}


const calcBUCS_COLLAR_Strategies = (list, {priceType, expectedProfitPerMonth, strategySubName, 
    BUCSSOptionListIgnorer=generalConfig.BUCSSOptionListIgnorer, 
    min_time_to_settlement=0, max_time_to_settlement=Infinity, 
    minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, 
    justIfWholeIsPofitable=false,
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (BUCSSOptionListIgnorer({
                    option,
                    minVol
                }))
                    return option

                const optionListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === option.symbol || !_option.symbol.startsWith('ض') || _option.vol < minVol)
                        return
                    if (_option.optionDetails?.strikePrice < option.optionDetails?.strikePrice)
                        return

                    if (!_option.optionDetails?.stockSymbolDetails?.last)
                        return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    return stockPriceHigherStrikeRatio > minStockPriceDistanceInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceInPercent

                }
                );

                let allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (_allPossibleStrategies, _option) => {

                    const putOptionWithSameStrike = optionListOfSameDate.find(optionOfSameDate => {
                        return optionOfSameDate.isPut && optionOfSameDate.bestSell > 0 && (optionOfSameDate.optionDetails?.strikePrice === _option.optionDetails?.strikePrice)
                    }
                    );

                    if (!putOptionWithSameStrike) {
                        return _allPossibleStrategies
                    }


                    
                    const strategyPositions = [
                        {
                            ...option,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                        {
                            ..._option,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                        {
                            ...putOptionWithSameStrike,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                       
                    ]



                    const totalCost = totalCostCalculatorCommon({
                        strategyPositions,
                        getPrice: (strategyPosition) => getPriceOfAsset({
                            asset: strategyPosition,
                            priceType,
                            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                        })
                    });

                    const offsetPrice = Math.max(...strategyPositions.map(strategyPosition=>strategyPosition.strikePrice))* 1.2;

                    const profit = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:offsetPrice});

                    const profitPercent = profit / Math.abs(totalCost);






                    const settlementGain =  settlementGainCalculator({strategyPositions,stockPrice: option.optionDetails?.stockSymbolDetails?.last})


                    const profitPercentOfSettlement = settlementGain / Math.abs(totalCost);

                    if(profitPercentOfSettlement<0.998) return _allPossibleStrategies




                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, _option,putOptionWithSameStrike],
                        strategyTypeTitle: "BUCS_COLLAR",
                        expectedProfitNotif,
                        expectedProfitPerMonth,
                        name: createStrategyName([option, _option,putOptionWithSameStrike]),
                        profitPercent : justIfWholeIsPofitable ? profit>=0 ? 1 :0:profitPercent
                    }

                    if (Number.isNaN(strategyObj.profitPercent))
                        return _allPossibleStrategies

                    return _allPossibleStrategies.concat([strategyObj])

                }
                , []);

                return {
                    ...option,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "BUCS_COLLAR",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceInPercent,
        maxStockPriceDistanceInPercent,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BUCS_COLLAR",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceInPercent,
            maxStockPriceDistanceInPercent,
            minVol
        })
    }

}


const calcBEPS_COLLAR_Strategies = (list, {priceType, expectedProfitPerMonth, 
    strategySubName, min_time_to_settlement=0, max_time_to_settlement=Infinity, 
    minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, 
    justIfWholeIsPofitable=false,
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (!option.isPut || option.vol < minVol)
                    return option


                const optionPrice = getPriceOfAsset({
                    asset: option,
                    priceType,
                    sideType: 'SELL'
                });

                if(optionPrice===0) return option

                const putListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === option.symbol || !_option.isPut || _option.vol < minVol)
                        return
                    if (_option.optionDetails?.strikePrice <= option.optionDetails?.strikePrice)
                        return

                    if(!_option.optionDetails?.stockSymbolDetails) return false

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    return stockPriceHigherStrikeRatio > minStockPriceDistanceInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceInPercent

                }
                );

                let allPossibleStrategies = putListWithHigherStrikePrice.reduce( (_allPossibleStrategies, buyingPut) => {

                    const buyingPutPrice = getPriceOfAsset({
                        asset: buyingPut,
                        priceType,
                        sideType: 'BUY'
                    });

                    if(buyingPutPrice===0) return _allPossibleStrategies

                    const callWithSameStrikeOfSellingPut = optionListOfSameDate.find(optionOfSameDate => {
                        return optionOfSameDate.isCall && optionOfSameDate.bestSell > 0 && (optionOfSameDate.optionDetails?.strikePrice === option.optionDetails?.strikePrice)
                    }
                    );

                    if (!callWithSameStrikeOfSellingPut) {
                        return _allPossibleStrategies
                    }

                    const callWithSameStrikeOfSellingPutPrice = getPriceOfAsset({
                        asset: callWithSameStrikeOfSellingPut,
                        priceType,
                        sideType: 'BUY'
                    });

                    if(callWithSameStrikeOfSellingPutPrice===0) return _allPossibleStrategies



                    const strategyPositions = [
                        {
                            ...buyingPut,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                        {
                            ...option,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                        {
                            ...callWithSameStrikeOfSellingPut,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                       
                    ]



                    const totalCost = totalCostCalculatorCommon({
                        strategyPositions,
                        getPrice: (strategyPosition) => getPriceOfAsset({
                            asset: strategyPosition,
                            priceType,
                            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                        })
                    });



                    const offsetPrice = Math.min(...strategyPositions.map(strategyPosition=>strategyPosition.strikePrice))/ 1.2;



                    const profit = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:offsetPrice});


                    const profitPercent = profit / Math.abs(totalCost);








                    const settlementGain =  settlementGainCalculator({strategyPositions,stockPrice: option.optionDetails?.stockSymbolDetails?.last})


                    const profitPercentOfSettlement = settlementGain / Math.abs(totalCost);

                    if(profitPercentOfSettlement<0.998) return _allPossibleStrategies


                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, buyingPut,callWithSameStrikeOfSellingPut],
                        strategyTypeTitle: "BEPS_COLLAR",
                        expectedProfitNotif,
                        expectedProfitPerMonth,
                        name: createStrategyName([option, buyingPut,callWithSameStrikeOfSellingPut]),
                        profitPercent : justIfWholeIsPofitable ? profit>=0 ? 1 :0:profitPercent
                    }

                    if (Number.isNaN(strategyObj.profitPercent))
                        return _allPossibleStrategies

                    return _allPossibleStrategies.concat([strategyObj])

                }
                , []);

                return {
                    ...option,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "BEPS_COLLAR",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceInPercent,
        maxStockPriceDistanceInPercent,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BEPS_COLLAR",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceInPercent,
            maxStockPriceDistanceInPercent,
            minVol
        })
    }

}



const calcCOVEREDStrategies = (list, {priceType, expectedProfitPerMonth, min_time_to_settlement=0, max_time_to_settlement=Infinity, minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionListOfStock] of Object.entries(optionsGroupedByStock)) {

        const _enrichedList = optionListOfStock.map(option => {

            if (!option.optionDetails?.stockSymbolDetails)
                return option

            const stockPriceStrikeRatio = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;

            if (!option.symbol.startsWith('ض') || option.vol < minVol || stockPriceStrikeRatio < minStockPriceDistanceInPercent || stockPriceStrikeRatio > maxStockPriceDistanceInPercent)
                return option

            const totalCostWithSign = totalCostCalculator({
                buyStocks: [option.optionDetails?.stockSymbolDetails],
                buyOptions: [],
                sellOptions: [option],
                priceType
            });
            const totalOffsetGainWithSign = totalSettlementGain([{
                option,
                positionSide: "SELL",
                choosePriceType: "MIN"
            }, ]);

            const profit = totalCostWithSign + totalOffsetGainWithSign;

            const profitPercent = profit / Math.abs(totalCostWithSign);
            const strategyObj = {
                option: {
                    ...option
                },
                positions:[option.optionDetails?.stockSymbolDetails, option],
                strategyTypeTitle: "COVERED",
                expectedProfitNotif,
                expectedProfitPerMonth,
                name: createStrategyName([option.optionDetails?.stockSymbolDetails, option]),
                profitPercent
            }

            return {
                ...option,
                allPossibleStrategies: [strategyObj]
            }

        }
        );

        enrichedList = enrichedList.concat(_enrichedList)

    }

    return {
        enrichedList,
        allStrategiesSorted: getAllPossibleStrategiesSorted(enrichedList),
        strategyName: "COVERED",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceInPercent,
        maxStockPriceDistanceInPercent,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "COVERED",
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceInPercent,
            maxStockPriceDistanceInPercent,
            minVol
        })
    }

}

const calcCOVERED_CONVERSION_Strategies = (list, {priceType, expectedProfitPerMonth, min_time_to_settlement=0, max_time_to_settlement=Infinity, minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionListOfStock] of Object.entries(optionsGroupedByStock)) {

        const _enrichedList = optionListOfStock.map(option => {

            if (!option.optionDetails?.stockSymbolDetails)
                return option

            const stockPriceStrikeRatio = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;

            if (!option.symbol.startsWith('ض') || option.vol < minVol || stockPriceStrikeRatio < minStockPriceDistanceInPercent || stockPriceStrikeRatio > maxStockPriceDistanceInPercent)
                return option

            const putOptionWithSameStrike = optionListOfStock.find(optionOfStock => {
                return optionOfStock.isPut && optionOfStock.optionDetails.date === option.optionDetails.date && optionOfStock.bestSell > 0 && (optionOfStock.optionDetails?.strikePrice === option.optionDetails?.strikePrice)
            }
            );

            if (!putOptionWithSameStrike) {
                return {
                    ...option,
                    allPossibleStrategies: []
                }
            }

            const totalCostWithSign = totalCostCalculator({
                buyStocks: [option.optionDetails?.stockSymbolDetails],
                buyOptions: [putOptionWithSameStrike],
                sellOptions: [option],
                priceType
            });
            const totalOffsetGainWithSign = totalSettlementGain([{
                option,
                positionSide: "SELL"
            }, ]);

            const profit = totalCostWithSign + totalOffsetGainWithSign;

            const profitPercent = profit / Math.abs(totalCostWithSign);
            const strategyObj = {
                option: {
                    ...option
                },
                positions:[option.optionDetails?.stockSymbolDetails, option,putOptionWithSameStrike],
                strategyTypeTitle: "CONVERSION",
                expectedProfitNotif,
                expectedProfitPerMonth,
                name: createStrategyName([option.optionDetails?.stockSymbolDetails, option]),
                profitPercent
            }

            return {
                ...option,
                allPossibleStrategies: [strategyObj]
            }

        }
        );

        enrichedList = enrichedList.concat(_enrichedList)

    }

    return {
        enrichedList,
        allStrategiesSorted: getAllPossibleStrategiesSorted(enrichedList),
        strategyName: "CONVERSION",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceInPercent,
        maxStockPriceDistanceInPercent,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "CONVERSION",
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceInPercent,
            maxStockPriceDistanceInPercent,
            minVol
        })
    }

}

const calcCOVERED_COLLAR_Strategies = (list, {priceType, expectedProfitPerMonth, min_time_to_settlement=0, max_time_to_settlement=Infinity, minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionListOfStock] of Object.entries(optionsGroupedByStock)) {

        const _enrichedList = optionListOfStock.map(option => {

            if (!option.optionDetails?.stockSymbolDetails)
                return option

            const stockPriceStrikeRatio = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;

            if (!option.symbol.startsWith('ض') || option.vol < minVol || stockPriceStrikeRatio < minStockPriceDistanceInPercent || stockPriceStrikeRatio > maxStockPriceDistanceInPercent)
                return option

            const putOptionListWithLowerStrike = optionListOfStock.filter(optionOfStock => {
                return optionOfStock.isPut && optionOfStock.optionDetails.date === option.optionDetails.date && optionOfStock.bestSell > 0 && (optionOfStock.optionDetails?.strikePrice < option.optionDetails?.strikePrice)
            }
            );

            if (!putOptionListWithLowerStrike.length) {
                return {
                    ...option,
                    allPossibleStrategies: []
                }
            }

            const allPossibleStrategies = putOptionListWithLowerStrike.map(putOptionWithLowerStrike => {

                const totalCostWithSign = totalCostCalculator({
                    buyStocks: [option.optionDetails?.stockSymbolDetails],
                    buyOptions: [putOptionWithLowerStrike],
                    sellOptions: [option],
                    priceType
                });
                const totalOffsetGainWithSign = totalSettlementGain([{
                    option,
                    positionSide: "SELL",
                    choosePriceType: "MIN"
                }, ]);
                const minOffsetGainWithSign = totalSettlementGain([{
                    option: putOptionWithLowerStrike,
                    positionSide: "BUY"
                }, ]);

                const profit = totalCostWithSign + totalOffsetGainWithSign;
                const minProfit = totalCostWithSign + minOffsetGainWithSign;

                const profitPercent = profit / Math.abs(totalCostWithSign);
                const minProfitPercent = minProfit / Math.abs(totalCostWithSign);
                return strategyObj = {
                    option: {
                        ...option
                    },
                    positions:[option.optionDetails?.stockSymbolDetails, option, putOptionWithLowerStrike],
                    strategyTypeTitle: "COVERED_COLLAR",
                    expectedProfitNotif,
                    expectedProfitPerMonth,
                    name: createStrategyName([option.optionDetails?.stockSymbolDetails, option, putOptionWithLowerStrike]),
                    profitPercent: minProfitPercent
                }

            }
            )

            return {
                ...option,
                allPossibleStrategies
            }

        }
        );

        enrichedList = enrichedList.concat(_enrichedList)

    }

    return {
        enrichedList,
        allStrategiesSorted: getAllPossibleStrategiesSorted(enrichedList),
        strategyName: "COVERED_COLLAR",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceInPercent,
        maxStockPriceDistanceInPercent,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "COVERED_COLLAR",
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceInPercent,
            maxStockPriceDistanceInPercent,
            minVol
        })
    }

}

const calcBEPSStrategies = (list, {priceType, expectedProfitPerMonth, min_time_to_settlement=0, max_time_to_settlement=Infinity, minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ط') || option.vol < minVol || option.optionDetails.stockSymbolDetails.last > option.optionDetails.strikePrice) {
                    return option
                }
                const stockPriceLowerStrikeRatio = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;

                if (stockPriceLowerStrikeRatio < minStockPriceDistanceInPercent || stockPriceLowerStrikeRatio > maxStockPriceDistanceInPercent) {
                    return option
                }

                const optionListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === option.symbol || !_option.symbol.startsWith('ط') || _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice < option.optionDetails?.strikePrice)
                        return false

                    return true

                }
                );

                let allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (_allPossibleStrategies, _option) => {



                    const strategyPositions = [
                        {
                            ..._option,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                        {
                            ...option,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                       
                    ]



                    const totalCost = totalCostCalculatorCommon({
                        strategyPositions,
                        getPrice: (strategyPosition) => getPriceOfAsset({
                            asset: strategyPosition,
                            priceType,
                            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                        })
                    });



                    const offsetPrice = Math.min(...strategyPositions.map(strategyPosition=>strategyPosition.strikePrice))/ 1.2;



                    const profit = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:offsetPrice});


                    const profitPercent = profit / Math.abs(totalCost);
                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, _option],
                        strategyTypeTitle: "BEPS",
                        expectedProfitNotif,
                        expectedProfitPerMonth,
                        name: createStrategyName([option, _option]),
                        profitPercent
                    }

                    if (Number.isNaN(strategyObj.profitPercent))
                        return _allPossibleStrategies

                    return _allPossibleStrategies.concat([strategyObj])

                }
                , []);

                return {
                    ...option,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "BEPS",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceInPercent,
        maxStockPriceDistanceInPercent,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BEPS",
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceInPercent,
            maxStockPriceDistanceInPercent,
            minVol
        })
    }

}

const calcBECSStrategies = (list, {priceType, expectedProfitPerMonth, settlementGainChoosePriceType="MIN", strategySubName, BECSSOptionListIgnorer=generalConfig.BECSSOptionListIgnorer, min_time_to_settlement=0, max_time_to_settlement=Infinity, minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (BECSSOptionListIgnorer({
                    option,
                    minVol
                }))
                    return option


                    // TODO:FIXME: LOWER STRIKE!
                const stockPriceHigherStrikeRatio = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;

                if (stockPriceHigherStrikeRatio < minStockPriceDistanceInPercent || stockPriceHigherStrikeRatio > maxStockPriceDistanceInPercent)
                    return option

                const optionListWithHigherStrikePrice = optionListOfSameDate.filter(_option => {
                    if (_option.symbol === option.symbol || !_option.symbol.startsWith('ض'))
                        return false
                    if (_option.optionDetails?.strikePrice < option.optionDetails?.strikePrice)
                        return false
                    if (_option.vol < minVol)
                        return false
                    return true

                }
                );

                let allPossibleStrategies = optionListWithHigherStrikePrice.reduce( (_allPossibleStrategies, _option) => {


                    const diffOfBECS_Strikes = _option.optionDetails?.strikePrice - option.optionDetails?.strikePrice;

                    const strategyPositions = [
                        {
                            ..._option,
                            isBuy: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin() { }
                        },
                        {
                            ...option,
                            isSell: true,
                            getQuantity: () => baseQuantity,
                            getRequiredMargin: () => diffOfBECS_Strikes
                        },
                       
                    ]



                    const totalCost = totalCostCalculatorCommon({
                        strategyPositions,
                        getPrice: (strategyPosition) => getPriceOfAsset({
                            asset: strategyPosition,
                            priceType,
                            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                        })
                    });


                    const offsetPrice = Math.min(...strategyPositions.map(strategyPosition=>strategyPosition.strikePrice))/ 1.2;



                    const profit = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:offsetPrice});



                    const profitPercent = profit / Math.abs(totalCost);
                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, _option],
                        strategyTypeTitle: "BECS",
                        expectedProfitNotif,
                        expectedProfitPerMonth,
                        name: createStrategyName([option, _option]),
                        profitPercent
                    }

                    if (Number.isNaN(strategyObj.profitPercent))
                        return _allPossibleStrategies

                    return _allPossibleStrategies.concat([strategyObj])

                }
                , []);

                return {
                    ...option,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "BECS",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceDistanceInPercent,
        maxStockPriceDistanceInPercent,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BECS",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minStockPriceDistanceInPercent,
            maxStockPriceDistanceInPercent,
            minVol
        })
    }

}




const calcBUS_With_BUCS_BEPSStrategies = (list, {priceType, expectedProfitPerMonth, 
    settlementGainChoosePriceType="MIN", strategySubName,  
    justIfWholeIsPofitable=false,
    min_time_to_settlement=0, max_time_to_settlement=Infinity, 
    minStockPriceToSarBeSarPercent=-Infinity, maxStockPriceToSarBeSarPercent=Infinity, 
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(buyingCall => {

                if (!buyingCall.isCall ||  buyingCall.vol < minVol)
                        return buyingCall


                const buyingCallPrice = getPriceOfAsset({
                        asset: buyingCall,
                        priceType,
                        sideType: 'BUY'
                });

                if(buyingCallPrice===0) return buyingCall
                

                const eligiblePutsForBEPS =   optionListOfSameDate.filter(_option => {
                    let isEligible = true;

                    if (_option.symbol === buyingCall.symbol || !_option.symbol.startsWith('ط') ||  _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice <= buyingCall.optionDetails?.strikePrice)
                        return false


                    if(!_option.optionDetails.stockSymbolDetails) return false


                    return isEligible

                }
                );
              

                let allPossibleStrategies = eligiblePutsForBEPS.reduce( (_allPossibleStrategies, sellingPut) => {


                    const sellingPutPrice = getPriceOfAsset({
                        asset: sellingPut,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(sellingPutPrice===0) return _allPossibleStrategies


                    const higherStrikePuts = optionListOfSameDate.filter(_option => {

                        if (_option.symbol === sellingPut.symbol || !_option.symbol.startsWith('ط') || _option.vol < minVol)
                            return false
                        if (_option.optionDetails?.strikePrice <= sellingPut.optionDetails?.strikePrice)
                            return false

                        return true

                    }
                    );

                    let allPossibleStrategies =  higherStrikePuts.reduce((_allPossibleStrategies, buyingPut) => {


                        const buyingPutPrice = getPriceOfAsset({
                            asset: buyingPut,
                            priceType,
                            sideType: 'BUY'
                        });

                        if(buyingPutPrice===0) return _allPossibleStrategies

                        const sellingCallWithSameStrikeOfBuyingPut = optionListOfSameDate.find(_option=> _option.isCall && _option.vol > minVol && ( _option.optionDetails?.strikePrice === buyingPut.optionDetails?.strikePrice));


                        if(!sellingCallWithSameStrikeOfBuyingPut) return _allPossibleStrategies


                        const sellingCallWithSameStrikeOfBuyingPutPrice = getPriceOfAsset({
                            asset: sellingCallWithSameStrikeOfBuyingPut,
                            priceType,
                            sideType: 'SELL'
                        });

                        if(sellingCallWithSameStrikeOfBuyingPutPrice===0) return _allPossibleStrategies


                        const diffOfBEPS_Strikes = buyingPut.optionDetails?.strikePrice - sellingPut.optionDetails?.strikePrice;


                        const strategyPositions = [
                            {
                                ...buyingCall,
                                isBuy: true,
                                getQuantity: () => baseQuantity,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingCallWithSameStrikeOfBuyingPut,
                                isSell: true,
                                getQuantity: () => baseQuantity,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingPut,
                                isSell: true,
                                getQuantity: () => baseQuantity,
                                getRequiredMargin() { }
                            },
                            {
                                ...buyingPut,
                                isBuy: true,
                                getQuantity: () => baseQuantity,
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

                        const breakevenList = findBreakevenList({
                            positions: strategyPositions,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const breakeven = breakevenList[0];



                        const priceThatCauseMaxProfit = Math.max(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) * 1.2;
                        const maxProfit = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: priceThatCauseMaxProfit });





                        if(breakeven){

                            const stockPriceToSarBeSarPercent = (buyingCall.optionDetails.stockSymbolDetails.last/breakeven) - 1;
    
                            if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSarPercent || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSarPercent)
                                return _allPossibleStrategies
                        }else if(maxProfit<=0){
                             return _allPossibleStrategies
                        }




                        const profitPercent =  maxProfit / Math.abs(totalCost);
                        
                        const strategyObj = {
                            option: {
                                ...buyingCall
                            },
                            positions:[buyingCall,sellingCallWithSameStrikeOfBuyingPut,buyingPut,sellingPut],
                            strategyTypeTitle: "BUS_With_BUCS_BEPS",
                            expectedProfitNotif,
                            expectedProfitPerMonth,
                            name: createStrategyName([buyingCall,sellingCallWithSameStrikeOfBuyingPut,buyingPut,sellingPut]),
                            profitPercent : (()=>{
                                if(justIfWholeIsPofitable){
                                    return !breakeven ? 1 :-1
                                }
                                return profitPercent

                            })()
                        }

                        if (Number.isNaN(strategyObj.profitPercent))
                            return _allPossibleStrategies

                        return _allPossibleStrategies.concat([strategyObj])


                    }, [])


                    

                    return _allPossibleStrategies.concat(allPossibleStrategies)

                }
                , []);

                return {
                    ...buyingCall,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "BUS_With_BUCS_BEPS",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceToSarBeSarPercent,
        maxStockPriceToSarBeSarPercent,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BUS_With_BUCS_BEPS",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceToSarBeSarPercent !== 'undefined' && minStockPriceToSarBeSarPercent !== null && minStockPriceToSarBeSarPercent !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceToSarBeSarPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceToSarBeSarPercent !== 'undefined' && maxStockPriceToSarBeSarPercent !== null && maxStockPriceToSarBeSarPercent !== Infinity && {
                label: "maxToSar",
                value: `${((maxStockPriceToSarBeSarPercent) * 100).toFixed(0)}%`
            },].filter(Boolean),
            minVol
        })
    }

}


const calcBUS_With_BUPS_BECSStrategies = (list, {priceType, expectedProfitPerMonth, 
    settlementGainChoosePriceType="MIN", strategySubName,
    justIfWholeIsPofitable=false,  
    min_time_to_settlement=0, max_time_to_settlement=Infinity, 
    minStockPriceToSarBeSarPercent=-Infinity, maxStockPriceToSarBeSarPercent=Infinity, 
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(buyingPut => {

                if (!buyingPut.isPut ||  buyingPut.vol < minVol)
                        return buyingPut


                const buyingPutPrice = getPriceOfAsset({
                        asset: buyingPut,
                        priceType,
                        sideType: 'BUY'
                });

                if(buyingPutPrice===0) return buyingPut
                

                const eligibleCallsForBECS =   optionListOfSameDate.filter(_option => {
                    let isEligible = true;

                    if (_option.symbol === buyingPut.symbol || !_option.isCall ||  _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice <= buyingPut.optionDetails?.strikePrice)
                        return false


                    if(!_option.optionDetails.stockSymbolDetails) return false


                    return isEligible

                }
                );
              

                let allPossibleStrategies = eligibleCallsForBECS.reduce( (_allPossibleStrategies, sellingCall) => {


                    const sellingCallPrice = getPriceOfAsset({
                        asset: sellingCall,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(sellingCallPrice===0) return _allPossibleStrategies


                    const higherStrikeCalls = optionListOfSameDate.filter(_option => {

                        if (_option.symbol === sellingCall.symbol || !_option.isCall || _option.vol < minVol)
                            return false
                        if (_option.optionDetails?.strikePrice <= sellingCall.optionDetails?.strikePrice)
                            return false

                        return true

                    }
                    );

                    let allPossibleStrategies =  higherStrikeCalls.reduce((_allPossibleStrategies, buyingCall) => {


                        const buyingCallPrice = getPriceOfAsset({
                            asset: buyingCall,
                            priceType,
                            sideType: 'BUY'
                        });

                        if(buyingCallPrice===0) return _allPossibleStrategies

                        const sellingPutWithSameStrikeOfBuyingCall = optionListOfSameDate.find(_option=> _option.isPut && _option.vol > minVol && ( _option.optionDetails?.strikePrice === buyingCall.optionDetails?.strikePrice));


                        if(!sellingPutWithSameStrikeOfBuyingCall) return _allPossibleStrategies


                        const sellingPutWithSameStrikeOfBuyingCallPrice = getPriceOfAsset({
                            asset: sellingPutWithSameStrikeOfBuyingCall,
                            priceType,
                            sideType: 'SELL'
                        });

                        if(sellingPutWithSameStrikeOfBuyingCallPrice===0) return _allPossibleStrategies


                        const diffOfBUPS_Strikes = sellingPutWithSameStrikeOfBuyingCall.optionDetails?.strikePrice - buyingPut.optionDetails?.strikePrice;
                        const diffOfBECS_Strikes = buyingCall.optionDetails?.strikePrice - sellingCall.optionDetails?.strikePrice;

                        const strategyPositions = [
                            {
                                ...buyingPut,
                                isBuy: true,
                                getQuantity: () => baseQuantity,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingPutWithSameStrikeOfBuyingCall,
                                isSell: true,
                                getQuantity: () => baseQuantity,
                                getRequiredMargin: () => diffOfBUPS_Strikes
                            },
                            {
                                ...sellingCall,
                                isSell: true,
                                getQuantity: () => baseQuantity,
                                getRequiredMargin: () => diffOfBECS_Strikes
                            },
                            {
                                ...buyingCall,
                                isBuy: true,
                                getQuantity: () => baseQuantity,
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

                        const breakevenList = findBreakevenList({
                            positions: strategyPositions,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const breakeven = breakevenList[0];

                        const priceThatCauseMaxProfit = Math.max(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) * 1.2;
                        const maxProfit = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: priceThatCauseMaxProfit });

                        if(breakeven){

                            const stockPriceToSarBeSarPercent = (buyingPut.optionDetails.stockSymbolDetails.last/breakeven) - 1;
    
                            if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSarPercent || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSarPercent)
                                return _allPossibleStrategies
                        }else if(maxProfit<=0){
                             return _allPossibleStrategies
                        }


                        const profitPercent =  maxProfit / Math.abs(totalCost);

                     
                        
                        
                        const strategyObj = {
                            option: {
                                ...buyingCall
                            },
                            positions:[buyingPut,sellingPutWithSameStrikeOfBuyingCall,buyingCall,sellingCall],
                            strategyTypeTitle: "BUS_With_BUPS_BECS",
                            expectedProfitNotif,
                            expectedProfitPerMonth,
                            name: createStrategyName([buyingPut,sellingPutWithSameStrikeOfBuyingCall,buyingCall,sellingCall]),
                            profitPercent : (()=>{
                                if(justIfWholeIsPofitable){
                                    return !breakeven ? 1 :-1
                                }
                                return profitPercent

                            })()
                        }

                        if (Number.isNaN(strategyObj.profitPercent))
                            return _allPossibleStrategies

                        return _allPossibleStrategies.concat([strategyObj])


                    }, [])


                    

                    return _allPossibleStrategies.concat(allPossibleStrategies)

                }
                , []);

                return {
                    ...buyingPut,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }

    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "BUS_With_BUPS_BECS",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minStockPriceToSarBeSarPercent,
        maxStockPriceToSarBeSarPercent,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BUS_With_BUPS_BECS",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceToSarBeSarPercent !== 'undefined' && minStockPriceToSarBeSarPercent !== null && minStockPriceToSarBeSarPercent !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceToSarBeSarPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceToSarBeSarPercent !== 'undefined' && maxStockPriceToSarBeSarPercent !== null && maxStockPriceToSarBeSarPercent !== Infinity && {
                label: "maxToSar",
                value: `${((maxStockPriceToSarBeSarPercent) * 100).toFixed(0)}%`
            },].filter(Boolean),
            minVol
        })
    }

}


const calcBES_With_BUCS_BEPSStrategies = (list, {priceType, expectedProfitPerMonth, 
    justIfWholeIsPofitable=false,
    settlementGainChoosePriceType="MIN", strategySubName,  min_time_to_settlement=0, max_time_to_settlement=Infinity, 
    minStockPriceToSarBeSarPercent=-Infinity, maxStockPriceToSarBeSarPercent=Infinity, 
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(buyingCall => {

                if (!buyingCall.isCall ||  buyingCall.vol < minVol)
                        return buyingCall


                const buyingCallPrice = getPriceOfAsset({
                        asset: buyingCall,
                        priceType,
                        sideType: 'BUY'
                });

                if(buyingCallPrice===0) return buyingCall
                

                const higherStrikeCalls =   optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingCall.symbol || !_option.isCall ||  _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice <= buyingCall.optionDetails?.strikePrice)
                        return false


                    return true

                }
                );
              

                let allPossibleStrategies = higherStrikeCalls.reduce( (_allPossibleStrategies, sellingCall) => {


                    const sellingCallPrice = getPriceOfAsset({
                        asset: sellingCall,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(sellingCallPrice===0) return _allPossibleStrategies


                    const buyingPutWithSameStrikeOfSellingCall = optionListOfSameDate.find(_option=> _option.isPut && _option.vol > minVol && ( _option.optionDetails?.strikePrice === sellingCall.optionDetails?.strikePrice));

                    if(!buyingPutWithSameStrikeOfSellingCall) return _allPossibleStrategies


                    const buyingPutPrice = getPriceOfAsset({
                        asset: buyingPutWithSameStrikeOfSellingCall,
                        priceType,
                        sideType: 'BUY'
                    });

                    if(buyingPutPrice===0) return _allPossibleStrategies


                    const lowerStrikePuts = optionListOfSameDate.filter(_option => {

                        if (_option.symbol === buyingPutWithSameStrikeOfSellingCall.symbol || !_option.isPut || _option.vol < minVol)
                            return false

                       
                        if (_option.optionDetails?.strikePrice >= buyingPutWithSameStrikeOfSellingCall.optionDetails?.strikePrice)
                            return false

                        if (_option.optionDetails?.strikePrice >= buyingCall.optionDetails?.strikePrice)
                            return false

                        return true

                    }
                    );

                    let allPossibleStrategies =  lowerStrikePuts.reduce((_allPossibleStrategies, sellingPut) => {


                        const sellingPutPrice = getPriceOfAsset({
                            asset: sellingPut,
                            priceType,
                            sideType: 'BUY'
                        });

                        if(sellingPutPrice===0) return _allPossibleStrategies

                        

                        const diffOfBUCS_Strikes = sellingCall.optionDetails?.strikePrice - buyingCall.optionDetails?.strikePrice;
                        const diffOfBEPS_Strikes = buyingPutWithSameStrikeOfSellingCall.optionDetails?.strikePrice - sellingPut.optionDetails?.strikePrice;


                       

                        const strategyPositions = [
                            {
                                ...buyingCall,
                                isBuy: true,
                                getQuantity: () => baseQuantity,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingCall,
                                isSell: true,
                                getQuantity: () => baseQuantity,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingPut,
                                isSell: true,
                                getQuantity: () => baseQuantity,
                                getRequiredMargin() { }
                            },
                            {
                                ...buyingPutWithSameStrikeOfSellingCall,
                                isBuy: true,
                                getQuantity: () => baseQuantity,
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

                        const breakevenList = findBreakevenList({
                            positions: strategyPositions,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const breakeven = breakevenList[0];

                        const priceThatCauseMaxProfit = Math.min(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) / 1.3;
                        const maxProfit = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: priceThatCauseMaxProfit });

                        if(breakeven){

                            const stockPriceToSarBeSarPercent = (sellingCall.optionDetails.stockSymbolDetails.last/breakeven) - 1;
    
                            if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSarPercent || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSarPercent)
                                return _allPossibleStrategies
                        }else if(maxProfit<=0){
                             return _allPossibleStrategies
                        }


                        const profitPercent =  maxProfit / Math.abs(totalCost);



                       
                        const strategyObj = {
                            option: {
                                ...buyingCall
                            },
                            positions:[buyingCall,sellingCall,sellingPut,buyingPutWithSameStrikeOfSellingCall],
                            strategyTypeTitle: "BES_With_BUCS_BEPS",
                            expectedProfitNotif,
                            expectedProfitPerMonth,
                            name: createStrategyName([buyingCall,sellingCall,sellingPut,buyingPutWithSameStrikeOfSellingCall]),
                            profitPercent : (()=>{
                                if(justIfWholeIsPofitable){
                                    return !breakeven ? 1 :-1
                                }
                                return profitPercent

                            })()
                        }

                        if (Number.isNaN(strategyObj.profitPercent))
                            return _allPossibleStrategies

                        return _allPossibleStrategies.concat([strategyObj])


                    }, [])


                    

                    return _allPossibleStrategies.concat(allPossibleStrategies)

                }
                , []);

                return {
                    ...buyingCall,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }
    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "BES_With_BUCS_BEPS",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        minStockPriceToSarBeSarPercent,
        maxStockPriceToSarBeSarPercent,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BES_With_BUCS_BEPS",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceToSarBeSarPercent !== 'undefined' && minStockPriceToSarBeSarPercent !== null && minStockPriceToSarBeSarPercent !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceToSarBeSarPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceToSarBeSarPercent !== 'undefined' && maxStockPriceToSarBeSarPercent !== null && maxStockPriceToSarBeSarPercent !== Infinity && {
                label: "maxToSar",
                value: `${((maxStockPriceToSarBeSarPercent) * 100).toFixed(0)}%`
            },].filter(Boolean),
            minVol
        })
    }

}



const calcBES_With_BUPS_BECSStrategies = (list, {priceType, expectedProfitPerMonth, 
    justIfWholeIsPofitable=false,
    settlementGainChoosePriceType="MIN", strategySubName,  min_time_to_settlement=0, max_time_to_settlement=Infinity, 
    minStockPriceToSarBeSarPercent=-Infinity, maxStockPriceToSarBeSarPercent=Infinity, 
    minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = [];
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(buyingPut => {

                if (!buyingPut.isPut ||  buyingPut.vol < minVol)
                        return buyingPut


                const buyingPutPrice = getPriceOfAsset({
                        asset: buyingPut,
                        priceType,
                        sideType: 'BUY'
                });

                if(buyingPutPrice===0) return buyingPut
                

                const higherStrikePuts =   optionListOfSameDate.filter(_option => {
                    if (_option.symbol === buyingPut.symbol || !_option.isPut ||  _option.vol < minVol)
                        return false
                    if (_option.optionDetails?.strikePrice <= buyingPut.optionDetails?.strikePrice)
                        return false


                    return true

                }
                );
              

                let allPossibleStrategies = higherStrikePuts.reduce( (_allPossibleStrategies, sellingPut) => {


                    const sellingPutPrice = getPriceOfAsset({
                        asset: sellingPut,
                        priceType,
                        sideType: 'SELL'
                    });

                    if(sellingPutPrice===0) return _allPossibleStrategies


                    const buyingCallWithSameStrikeOfSellingPut = optionListOfSameDate.find(_option=> _option.isCall && _option.vol > minVol && ( _option.optionDetails?.strikePrice === sellingPut.optionDetails?.strikePrice));

                    if(!buyingCallWithSameStrikeOfSellingPut) return _allPossibleStrategies


                    const buyingCallPrice = getPriceOfAsset({
                        asset: buyingCallWithSameStrikeOfSellingPut,
                        priceType,
                        sideType: 'BUY'
                    });

                    if(buyingCallPrice===0) return _allPossibleStrategies


                    const lowerStrikeCalls = optionListOfSameDate.filter(_option => {

                        if (_option.symbol === buyingCallWithSameStrikeOfSellingPut.symbol || !_option.isCall || _option.vol < minVol)
                            return false

                        
                        if (_option.optionDetails?.strikePrice >= buyingCallWithSameStrikeOfSellingPut.optionDetails?.strikePrice)
                            return false

                        if (_option.optionDetails?.strikePrice >= buyingPut.optionDetails?.strikePrice)
                            return false

                        return true

                    }
                    );

                    let allPossibleStrategies =  lowerStrikeCalls.reduce((_allPossibleStrategies, sellingCall) => {


                        const sellingCallPrice = getPriceOfAsset({
                            asset: sellingCall,
                            priceType,
                            sideType: 'BUY'
                        });

                        if(sellingCallPrice===0) return _allPossibleStrategies

                        

                        const diffOfBUPS_Strikes = sellingPut.optionDetails?.strikePrice - buyingPut.optionDetails?.strikePrice;
                        const diffOfBECS_Strikes = buyingCallWithSameStrikeOfSellingPut.optionDetails?.strikePrice - sellingCall.optionDetails?.strikePrice;

                        const strategyPositions = [
                            {
                                ...buyingPut,
                                isBuy: true,
                                getQuantity: () => baseQuantity,
                                getRequiredMargin() { }
                            },
                            {
                                ...sellingPut,
                                isSell: true,
                                getQuantity: () => baseQuantity,
                                getRequiredMargin: () => diffOfBUPS_Strikes
                            },
                            {
                                ...sellingCall,
                                isSell: true,
                                getQuantity: () => baseQuantity,
                                getRequiredMargin: () => diffOfBECS_Strikes
                            },
                            {
                                ...buyingCallWithSameStrikeOfSellingPut,
                                isBuy: true,
                                getQuantity: () => baseQuantity,
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

                        const breakevenList = findBreakevenList({
                            positions: strategyPositions,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const breakeven = breakevenList[0];

                        const priceThatCauseMaxProfit = Math.min(...strategyPositions.map(strategyPosition => strategyPosition.strikePrice)) / 1.3;
                        const maxProfit = totalCost + calcOffsetGainOfPositions({ strategyPositions, stockPrice: priceThatCauseMaxProfit });


                        
                        if(breakeven){

                            const stockPriceToSarBeSarPercent = (sellingCall.optionDetails.stockSymbolDetails.last/breakeven) - 1;
    
                            if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSarPercent || stockPriceToSarBeSarPercent > maxStockPriceToSarBeSarPercent)
                                return _allPossibleStrategies
                        }else if(maxProfit<=0){
                             return _allPossibleStrategies
                        }


                        const profitPercent =  maxProfit / Math.abs(totalCost);



                       
                        const strategyObj = {
                            option: {
                                ...buyingPut
                            },
                            positions:[buyingPut,sellingPut,sellingCall,buyingCallWithSameStrikeOfSellingPut],
                            strategyTypeTitle: "BES_With_BUPS_BECS",
                            expectedProfitNotif,
                            expectedProfitPerMonth,
                            name: createStrategyName([buyingPut,sellingPut,sellingCall,buyingCallWithSameStrikeOfSellingPut]),
                            profitPercent : (()=>{
                                if(justIfWholeIsPofitable){
                                    return !breakeven ? 1 :-1
                                }
                                return profitPercent

                            })()
                        }

                        if (Number.isNaN(strategyObj.profitPercent))
                            return _allPossibleStrategies

                        return _allPossibleStrategies.concat([strategyObj])


                    }, [])


                    

                    return _allPossibleStrategies.concat(allPossibleStrategies)

                }
                , []);

                return {
                    ...buyingPut,
                    allPossibleStrategies
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }
    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "BES_With_BUPS_BECS",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        minStockPriceToSarBeSarPercent,
        maxStockPriceToSarBeSarPercent,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BES_With_BUPS_BECS",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceToSarBeSarPercent !== 'undefined' && minStockPriceToSarBeSarPercent !== null && minStockPriceToSarBeSarPercent !== 0 && {
                label: "minToSar",
                value: `${((minStockPriceToSarBeSarPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceToSarBeSarPercent !== 'undefined' && maxStockPriceToSarBeSarPercent !== null && maxStockPriceToSarBeSarPercent !== Infinity && {
                label: "maxToSar",
                value: `${((maxStockPriceToSarBeSarPercent) * 100).toFixed(0)}%`
            },].filter(Boolean),
            minVol
        })
    }

}




const calcBuyStockStrategies = (list, {priceType, expectedProfitPerMonth,
    isProfitEnoughFn, 
    min_time_to_settlement=0, max_time_to_settlement=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, 
    expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = moment(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
        return settlementTimeDiff > min_time_to_settlement && settlementTimeDiff < max_time_to_settlement
    }
    )

    const optionsGroupedByStock = Object.groupBy(filteredList, ({optionDetails}) => optionDetails.stockSymbol);

    let enrichedList = []
    for (let[stockSymbol,optionList] of Object.entries(optionsGroupedByStock)) {
        const optionsGroupedByDate = Object.groupBy(optionList, ({optionDetails}) => optionDetails.date);

        let enrichedListOfStock = Object.entries(optionsGroupedByDate).flatMap( ([date,optionListOfSameDate]) => {

            const _enrichedList = optionListOfSameDate.map(option => {

                if (!option.optionDetails?.stockSymbolDetails  || option.vol < minVol)
                    return option

                if(option.isCall && (option.optionDetails.strikePrice > option.optionDetails.stockSymbolDetails?.last) )
                    return option
                if(option.isPut && (option.optionDetails.strikePrice < option.optionDetails.stockSymbolDetails?.last) )
                    return option


                const optionPrice = getPriceOfAsset({
                        asset: option,
                        priceType,
                        sideType: option.isCall ? 'BUY' : 'SELL'
                });

                if(optionPrice===0) return option


                const exerciseFee = COMMISSION_FACTOR.OPTION.SETTLEMENT.EXERCISE_FEE;

                let calculatedSettlementStockPrice;

                if(option.isCall){

                    calculatedSettlementStockPrice =(option.optionDetails.strikePrice * (1 + exerciseFee)) + (optionPrice * (1 + COMMISSION_FACTOR.OPTION.BUY)) ;
                }else{
                    calculatedSettlementStockPrice =(option.optionDetails.strikePrice * (1 + exerciseFee)) - (optionPrice / (1 + COMMISSION_FACTOR.OPTION.SELL)) ;
                }


                const currentStockPriceRatio =   (option.optionDetails?.stockSymbolDetails?.last / calculatedSettlementStockPrice)-1;

                


               


                const strategyObj = {
                        // TODO:remove option prop
                        option: {
                            ...option
                        },
                        positions:[option],
                        strategyTypeTitle: "BuyStock",
                        expectedProfitNotif,
                        expectedProfitPerMonth,
                        name: createStrategyName([option]),
                        isProfitEnough : isProfitEnoughFn && isProfitEnoughFn(currentStockPriceRatio),
                        profitPercent : currentStockPriceRatio
                    }

                return {
                    ...option,
                    allPossibleStrategies:[strategyObj]
                }

            }
            );

            return _enrichedList

        }
        )

        enrichedList = enrichedList.concat(enrichedListOfStock)

    }
    const sortedStrategies = getAllPossibleStrategiesSorted(enrichedList);

    return {
        enrichedList,
        allStrategiesSorted: sortedStrategies,
        strategyName: "BuyStock",
        priceType,
        min_time_to_settlement,
        max_time_to_settlement,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BuyStock",
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            minVol
        })
    }

}




const createListFilterContetnByList=(list)=>{

       let htmlContent = '';

    const strategyMapList = [
    calcBuyStockStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        max_time_to_settlement: 5 * 3600000,
        expectedProfitNotif: true,
        isProfitEnoughFn(stockPriceRatio){
            return stockPriceRatio > 0.02
        }
    }), 
    calcLongGUTS_STRANGLEStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,

        // min_time_to_settlement: 15 * 24 * 3600000,
        // max_time_to_settlement: 40 * 24 * 3600000,
        // minVol: 1000 * 1000 * 1000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
        expectedProfitNotif: true
    }), 
    calcShortGUTSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        callListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ض') || option.vol < minVol || option.optionDetails?.strikePrice >= option.optionDetails.stockSymbolDetails.last)
                return true
            return false
        }
        ,
        // min_time_to_settlement: 15 * 24 * 3600000,
        max_time_to_settlement: 35 * 24 * 3600000,
        // minVol: 1000 * 1000 * 1000,
        minStockPriceToLowBreakevenPercent: .15,
        maxStockPriceToHighBreakevenPercent: -.15
        // expectedProfitNotif: true
    }), 
    calcShortSTRANGLEStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        callListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ض') || option.vol < minVol || option.optionDetails?.strikePrice <= option.optionDetails.stockSymbolDetails.last)
                return true
            
            return false
        }
        ,
        // min_time_to_settlement: 15 * 24 * 3600000,
        max_time_to_settlement: 35 * 24 * 3600000,
        // minVol: 1000 * 1000 * 1000,
        minStockPriceToLowBreakevenPercent: .15,
        maxStockPriceToHighBreakevenPercent: -.15
        // expectedProfitNotif: true
    })
    , calcCALL_BUTTERFLYStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        max_time_to_settlement: 35 * 24 * 3600000,
        // MIN_BUCS_BECS_diffStrikesRatio:1,
        // MAX_BUCS_BECS_diffStrikesRatio:1,
        // maxStockStrike4DistanceInPercent:-0.05,
        minStockMiddleDistanceInPercent: -0.1,
        maxStockMiddleDistanceInPercent: 0.1,
        BUCSSOptionListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.isCall || option.vol < minVol)
                return true

            // const stockStrikeDistanceInPercent = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;
            // if (stockStrikeDistanceInPercent < -.04) return true
            // if (stockStrikeDistanceInPercent > .15) return true
            return false
        }
        ,
        minProfitLossRatio: .7,
        // expectedProfitNotif: true
        // minVol: 1000 * 1000 * 1000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
    })
    
    , calcCALL_BUTTERFLYStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 35 * 24 * 3600000,
        max_time_to_settlement: 63 * 24 * 3600000,
        // MIN_BUCS_BECS_diffStrikesRatio:1,
        // MAX_BUCS_BECS_diffStrikesRatio:1,
        // maxStockStrike4DistanceInPercent:-0.05,
        minStockMiddleDistanceInPercent: -0.1,
        maxStockMiddleDistanceInPercent: 0.1,
        BUCSSOptionListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.isCall || option.vol < minVol)
                return true

            // const stockStrikeDistanceInPercent = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;
            // if (stockStrikeDistanceInPercent < -.04) return true
            // if (stockStrikeDistanceInPercent > .15) return true
            return false
        }
        ,
        minProfitLossRatio: .7,
        // expectedProfitNotif: true
        // minVol: 1000 * 1000 * 1000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
    })

    , calcCALL_CONDORStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        max_time_to_settlement: 35 * 24 * 3600000,
        // MIN_BUCS_BECS_diffStrikesRatio:1,
        // MAX_BUCS_BECS_diffStrikesRatio:1,
        // maxStockStrike4DistanceInPercent:-0.05,
        minStockMiddleDistanceInPercent: -0.1,
        maxStockMiddleDistanceInPercent: 0.1,
        BUCSSOptionListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.isCall || option.vol < minVol)
                return true

            // const stockStrikeDistanceInPercent = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;
            // if (stockStrikeDistanceInPercent < -.04) return true
            // if (stockStrikeDistanceInPercent > .15) return true
            return false
        }
        ,
        minProfitLossRatio: .7,
        // expectedProfitNotif: true
        // minVol: 1000 * 1000 * 1000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
    })


    , calcCALL_CONDORStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 35 * 24 * 3600000,
        max_time_to_settlement: 63 * 24 * 3600000,
        // MIN_BUCS_BECS_diffStrikesRatio:1,
        // MAX_BUCS_BECS_diffStrikesRatio:1,
        // maxStockStrike4DistanceInPercent:-0.05,
        minStockMiddleDistanceInPercent: -0.1,
        maxStockMiddleDistanceInPercent: 0.1,
        BUCSSOptionListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.isCall || option.vol < minVol)
                return true

            // const stockStrikeDistanceInPercent = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;
            // if (stockStrikeDistanceInPercent < -.04) return true
            // if (stockStrikeDistanceInPercent > .15) return true
            return false
        }
        ,
        minProfitLossRatio: .7,
        // expectedProfitNotif: true
        // minVol: 1000 * 1000 * 1000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
    })


    , calcCALL_BUTT_CONDORStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        // max_time_to_settlement: 63 * 24 * 3600000,
        // MIN_BUCS_BECS_diffStrikesRatio:1,
        // MAX_BUCS_BECS_diffStrikesRatio:1,
        // maxStockStrike4DistanceInPercent:-0.05,
        // minStockMiddleDistanceInPercent:-0.06,
        // maxStockMiddleDistanceInPercent:0.06,
        BUCSSOptionListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ض') || option.vol < minVol)
                return true

            const stockStrikeDistanceInPercent = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;
            // if (stockStrikeDistanceInPercent < -.06) return true
            // if (stockStrikeDistanceInPercent > .15) return true
            return false
        }
        ,
        minProfitLossRatio: .99,
        expectedProfitNotif: true // minVol: 1000 * 1000 * 1000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
    })

    , calcPUT_BUTTERFLYStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        max_time_to_settlement: 35 * 24 * 3600000,
        // MIN_BUCS_BECS_diffStrikesRatio:1,
        // MAX_BUCS_BECS_diffStrikesRatio:1,
        // maxStockStrike4DistanceInPercent:-0.05,
        minStockMiddleDistanceInPercent: -0.1,
        maxStockMiddleDistanceInPercent: 0.1,
        BUCSSOptionListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ط') || option.vol < minVol)
                return true

            const stockStrikeDistanceInPercent = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;
            // if (stockStrikeDistanceInPercent < -.04) return true
            // if (stockStrikeDistanceInPercent > .15) return true
            return false
        }
        ,
        minProfitLossRatio: .7,
        // expectedProfitNotif: true
        // minVol: 1000 * 1000 * 1000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
    })

    , calcPUT_BUTTERFLYStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 35 * 24 * 3600000,
        max_time_to_settlement: 63 * 24 * 3600000,
        // MIN_BUCS_BECS_diffStrikesRatio:1,
        // MAX_BUCS_BECS_diffStrikesRatio:1,
        // maxStockStrike4DistanceInPercent:-0.05,
        minStockMiddleDistanceInPercent: -0.1,
        maxStockMiddleDistanceInPercent: 0.1,
        BUCSSOptionListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ط') || option.vol < minVol)
                return true

            const stockStrikeDistanceInPercent = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;
            // if (stockStrikeDistanceInPercent < -.04) return true
            // if (stockStrikeDistanceInPercent > .15) return true
            return false
        }
        ,
        minProfitLossRatio: .7,
        // expectedProfitNotif: true
        // minVol: 1000 * 1000 * 1000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
    })

    , calcPUT_CONDORStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        max_time_to_settlement: 35 * 24 * 3600000,
        // MIN_BUCS_BECS_diffStrikesRatio:1,
        // MAX_BUCS_BECS_diffStrikesRatio:1,
        // maxStockStrike4DistanceInPercent:-0.05,
        minStockMiddleDistanceInPercent: -0.1,
        maxStockMiddleDistanceInPercent: 0.1,
        BUCSSOptionListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ط') || option.vol < minVol)
                return true

            const stockStrikeDistanceInPercent = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;
            // if (stockStrikeDistanceInPercent < -.04) return true
            // if (stockStrikeDistanceInPercent > .15) return true
            return false
        }
        ,
        minProfitLossRatio: .7,
        // expectedProfitNotif: true
        // minVol: 1000 * 1000 * 1000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
    })
    , calcPUT_CONDORStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 35 * 24 * 3600000,
        max_time_to_settlement: 63 * 24 * 3600000,
        // MIN_BUCS_BECS_diffStrikesRatio:1,
        // MAX_BUCS_BECS_diffStrikesRatio:1,
        // maxStockStrike4DistanceInPercent:-0.05,
        minStockMiddleDistanceInPercent: -0.1,
        maxStockMiddleDistanceInPercent: 0.1,
        BUCSSOptionListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ط') || option.vol < minVol)
                return true

            const stockStrikeDistanceInPercent = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;
            // if (stockStrikeDistanceInPercent < -.04) return true
            // if (stockStrikeDistanceInPercent > .15) return true
            return false
        }
        ,
        minProfitLossRatio: .7,
        // expectedProfitNotif: true
        // minVol: 1000 * 1000 * 1000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
    })

    , calcPUT_BUTT_CONDORStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        // max_time_to_settlement: 63 * 24 * 3600000,
        // MIN_BUCS_BECS_diffStrikesRatio:1,
        // MAX_BUCS_BECS_diffStrikesRatio:1,
        // maxStockStrike4DistanceInPercent:-0.05,
        // minStockMiddleDistanceInPercent:-0.06,
        // maxStockMiddleDistanceInPercent:0.06,
        BUCSSOptionListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ط') || option.vol < minVol)
                return true

            const stockStrikeDistanceInPercent = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;
            // if (stockStrikeDistanceInPercent < -.06) return true
            // if (stockStrikeDistanceInPercent > .15) return true
            return false
        }
        ,
        minProfitLossRatio: .99,
        expectedProfitNotif: true // minVol: 1000 * 1000 * 1000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
    })
    
    , calcIRON_BUTTERFLY_BUCS_Strategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        max_time_to_settlement: 35 * 24 * 3600000,
        // MIN_BUCS_BECS_diffStrikesRatio:1,
        // MAX_BUCS_BECS_diffStrikesRatio:1,
        // maxStockStrike4DistanceInPercent:-0.05,
        minStockMiddleDistanceInPercent: -0.1,
        maxStockMiddleDistanceInPercent: 0.1,
        // TODO: ignorer of option1
        BUCSSOptionListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ض') || option.vol < minVol)
                return true

            // const stockStrikeDistanceInPercent = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;
            // if (stockStrikeDistanceInPercent < -.06) return true
            // if (stockStrikeDistanceInPercent > .15) return true
            return false
        }
        ,
        minProfitLossRatio: .7,
        BUCS_BEPS_COST_notProperRatio:15,
        // expectedProfitNotif: true
        // minVol: 1000 * 1000 * 1000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
    })
    , calcIRON_BUTTERFLY_BUCS_Strategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 35 * 24 * 3600000,
        max_time_to_settlement: 63 * 24 * 3600000,
        // MIN_BUCS_BECS_diffStrikesRatio:1,
        // MAX_BUCS_BECS_diffStrikesRatio:1,
        // maxStockStrike4DistanceInPercent:-0.05,
        minStockMiddleDistanceInPercent: -0.1,
        maxStockMiddleDistanceInPercent: 0.1,
        // TODO: ignorer of option1
        BUCSSOptionListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ض') || option.vol < minVol)
                return true

            // const stockStrikeDistanceInPercent = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;
            // if (stockStrikeDistanceInPercent < -.06) return true
            // if (stockStrikeDistanceInPercent > .15) return true
            return false
        }
        ,
        minProfitLossRatio: .7,
        BUCS_BEPS_COST_notProperRatio:15,
        // expectedProfitNotif: true
        // minVol: 1000 * 1000 * 1000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
    })

    , calcIRON_CONDOR_BUCS_Strategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        max_time_to_settlement: 35 * 24 * 3600000,
        // MIN_BUCS_BECS_diffStrikesRatio:1,
        // MAX_BUCS_BECS_diffStrikesRatio:1,
        // maxStockStrike4DistanceInPercent:-0.05,
        minStockMiddleDistanceInPercent: -0.1,
        maxStockMiddleDistanceInPercent: 0.1,
        // TODO: ignorer of option1
        BUCSSOptionListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ض') || option.vol < minVol)
                return true

            // const stockStrikeDistanceInPercent = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;
            // if (stockStrikeDistanceInPercent < -.06) return true
            // if (stockStrikeDistanceInPercent > .15) return true
            return false
        }
        ,
        minProfitLossRatio: .7,
        BUCS_BEPS_COST_notProperRatio:15,

        // expectedProfitNotif: true
        // minVol: 1000 * 1000 * 1000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
    })
    , calcIRON_CONDOR_BUCS_Strategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 35 * 24 * 3600000,
        max_time_to_settlement: 63 * 24 * 3600000,
        // MIN_BUCS_BECS_diffStrikesRatio:1,
        // MAX_BUCS_BECS_diffStrikesRatio:1,
        // maxStockStrike4DistanceInPercent:-0.05,
        minStockMiddleDistanceInPercent: -0.1,
        maxStockMiddleDistanceInPercent: 0.1,
        // TODO: ignorer of option1
        BUCSSOptionListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ض') || option.vol < minVol)
                return true

            // const stockStrikeDistanceInPercent = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;
            // if (stockStrikeDistanceInPercent < -.06) return true
            // if (stockStrikeDistanceInPercent > .15) return true
            return false
        }
        ,
        minProfitLossRatio: .7,
        BUCS_BEPS_COST_notProperRatio:15,
        // expectedProfitNotif: true
        // minVol: 1000 * 1000 * 1000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
    })
    
   , calcIRON_BUTT_CONDOR_BUCS_Strategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        // max_time_to_settlement: 63 * 24 * 3600000,
        // MIN_BUCS_BECS_diffStrikesRatio:1,
        // MAX_BUCS_BECS_diffStrikesRatio:1,
        // maxStockStrike4DistanceInPercent:-0.05,
        // minStockMiddleDistanceInPercent:-0.06,
        // maxStockMiddleDistanceInPercent:0.06,
        // TODO: ignorer of option1
        BUCSSOptionListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ض') || option.vol < minVol)
                return true

            const stockStrikeDistanceInPercent = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;
            // if (stockStrikeDistanceInPercent < -.06) return true
            // if (stockStrikeDistanceInPercent > .15) return true
            return false
        }
        ,
        minProfitLossRatio: .99,
        expectedProfitNotif: true,
        BUCS_BEPS_COST_notProperRatio:15,
         // minVol: 1000 * 1000 * 1000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
    })

    , calcIRON_BUTTERFLY_BUPS_Strategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        max_time_to_settlement: 35 * 24 * 3600000,
        // MIN_BUCS_BECS_diffStrikesRatio:1,
        // MAX_BUCS_BECS_diffStrikesRatio:1,
        // maxStockStrike4DistanceInPercent:-0.05,
        minStockMiddleDistanceInPercent: -0.1,
        maxStockMiddleDistanceInPercent: 0.1,
        minProfitLossRatio: .7,
        // expectedProfitNotif: true
        // minVol: 1000 * 1000 * 1000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
    })

    , calcIRON_BUTTERFLY_BUPS_Strategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 35 * 24 * 3600000,
        max_time_to_settlement: 63 * 24 * 3600000,
        // MIN_BUCS_BECS_diffStrikesRatio:1,
        // MAX_BUCS_BECS_diffStrikesRatio:1,
        // maxStockStrike4DistanceInPercent:-0.05,
        minStockMiddleDistanceInPercent: -0.1,
        maxStockMiddleDistanceInPercent: 0.1,
        minProfitLossRatio: .7,
        // expectedProfitNotif: true
        // minVol: 1000 * 1000 * 1000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
    })

    , calcIRON_CONDOR_BUPS_Strategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        max_time_to_settlement: 35 * 24 * 3600000,
        // MIN_BUCS_BECS_diffStrikesRatio:1,
        // MAX_BUCS_BECS_diffStrikesRatio:1,
        // maxStockStrike4DistanceInPercent:-0.05,
        minStockMiddleDistanceInPercent: -0.1,
        maxStockMiddleDistanceInPercent: 0.1,
        minProfitLossRatio: .7,
        // expectedProfitNotif: true
        // minVol: 1000 * 1000 * 1000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
    })

    , calcIRON_CONDOR_BUPS_Strategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 35 * 24 * 3600000,
        max_time_to_settlement: 63 * 24 * 3600000,
        // MIN_BUCS_BECS_diffStrikesRatio:1,
        // MAX_BUCS_BECS_diffStrikesRatio:1,
        // maxStockStrike4DistanceInPercent:-0.05,
        minStockMiddleDistanceInPercent: -0.1,
        maxStockMiddleDistanceInPercent: 0.1,
        minProfitLossRatio: .7,
        // expectedProfitNotif: true
        // minVol: 1000 * 1000 * 1000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
    })
    , calcIRON_BUTT_CONDOR_BUPS_Strategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        // MIN_BUCS_BECS_diffStrikesRatio:1,
        // MAX_BUCS_BECS_diffStrikesRatio:1,
        // maxStockStrike4DistanceInPercent:-0.05,
        // minStockMiddleDistanceInPercent:-0.06,
        // maxStockMiddleDistanceInPercent:0.06,
        minProfitLossRatio: .99,
        expectedProfitNotif: true // minVol: 1000 * 1000 * 1000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
    })
    
    
    , calcBUCSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.LAST_PRICE,
        min_time_to_settlement: 15 * 24 * 3600000,
        max_time_to_settlement: 40 * 24 * 3600000,
        // minVol: 1000 * 1000 * 1000,
        minStockPriceDistanceFromHigherStrikeInPercent: .22,
    }), calcBUCSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 15 * 24 * 3600000,
        max_time_to_settlement: 40 * 24 * 3600000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
        minStockPriceDistanceFromHigherStrikeInPercent: .15,
        expectedProfitNotif: true
    }), calcBUCSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 15 * 24 * 3600000,
        max_time_to_settlement: 40 * 24 * 3600000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
        //maxStockPriceDistanceFromHigherStrikeInPercent: .15,
        minStockPriceDistanceFromSarBeSarInPercent: 0.2,
        // maxStockPriceDistanceFromSarBeSarInPercent : 0.1
        // expectedProfitNotif: true
    }), calcBUCSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        max_time_to_settlement: 15 * 24 * 3600000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .15,
        minStockPriceDistanceFromSarBeSarInPercent: 0.12,
        expectedProfitNotif: true
    }), 
    calcBUCSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        max_time_to_settlement: 6 * 24 * 3600000,
        minStockPriceDistanceFromSarBeSarInPercent: .05,
        expectedProfitNotif: true
    }),

    calcBUS_With_BUCS_BEPSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        minStockPriceToSarBeSarPercent: .01,
    }),

    calcBUS_With_BUCS_BEPSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        minStockPriceToSarBeSarPercent: .12,
        // expectedProfitNotif: true,
    }),
    calcBUS_With_BUCS_BEPSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        justIfWholeIsPofitable:true,
        // expectedProfitNotif: true,
    }),


    calcBUS_With_BUPS_BECSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        minStockPriceToSarBeSarPercent: .01,
    }),

    calcBUS_With_BUPS_BECSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        minStockPriceToSarBeSarPercent: .12,
        // expectedProfitNotif: true,
    }),
    calcBUS_With_BUPS_BECSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        justIfWholeIsPofitable:true,
        // expectedProfitNotif: true,
    }),



    

    calcBES_With_BUCS_BEPSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        maxStockPriceToSarBeSarPercent: -.01,
    }),
    calcBES_With_BUCS_BEPSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        maxStockPriceToSarBeSarPercent: -.12,
        // expectedProfitNotif: true,
    }),
    calcBES_With_BUCS_BEPSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        justIfWholeIsPofitable:true,
        // expectedProfitNotif: true,
    }),


    calcBES_With_BUPS_BECSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        maxStockPriceToSarBeSarPercent: -.01,
    }),
    calcBES_With_BUPS_BECSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        maxStockPriceToSarBeSarPercent: -.12,
        // expectedProfitNotif: true,
    }),
    calcBES_With_BUPS_BECSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        justIfWholeIsPofitable:true,
        // expectedProfitNotif: true,
    }),

    
    
    




    , calcBUPSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.LAST_PRICE,
        min_time_to_settlement: 15 * 24 * 3600000,
        max_time_to_settlement: 40 * 24 * 3600000,
        // minVol: 1000 * 1000 * 1000,
        minStockPriceDistanceInPercent: .22,
    }), calcBUPSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 15 * 24 * 3600000,
        max_time_to_settlement: 40 * 24 * 3600000,
        // minStockPriceDistanceInPercent: .22,
        minStockPriceDistanceInPercent: .15,
        expectedProfitNotif: true
    }), calcBUPSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 15 * 24 * 3600000,
        max_time_to_settlement: 40 * 24 * 3600000,
        // minStockPriceDistanceInPercent: .22,
        //maxStockPriceDistanceFromHigherStrikeInPercent: .15,
        minStockPriceDistanceInPercent: 0.2,
        // maxStockPriceDistanceFromSarBeSarInPercent : 0.1
        // expectedProfitNotif: true
    }), calcBUPSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        max_time_to_settlement: 15 * 24 * 3600000,
        // minStockPriceDistanceInPercent: .15,
        minStockPriceDistanceInPercent: 0.12,
        expectedProfitNotif: true
    }), 
    calcBUPSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        max_time_to_settlement: 6 * 24 * 3600000,
        minStockPriceDistanceInPercent: .05,
        expectedProfitNotif: true
    })
    
    , calcBUPS_COLLARStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        expectedProfitNotif: true // priceType: CONSTS.PRICE_TYPE.LAST_PRICE ,
    }),
    , calcBUPS_COLLARStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        max_time_to_settlement: 35 * 24 * 3600000,
        justIfWholeIsPofitable:true,
    }),
    , calcBUPS_COLLARStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 35 * 24 * 3600000,
        justIfWholeIsPofitable:true,
    }),
    
    
    , calcBUCS_COLLAR_Strategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        expectedProfitNotif: true // priceType: CONSTS.PRICE_TYPE.LAST_PRICE ,
    })
    , calcBUCS_COLLAR_Strategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        max_time_to_settlement: 35 * 24 * 3600000,
        justIfWholeIsPofitable:true,
    })
    , calcBUCS_COLLAR_Strategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 35 * 24 * 3600000,
        justIfWholeIsPofitable:true,
    })
    , calcBEPS_COLLAR_Strategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        expectedProfitNotif: true // priceType: CONSTS.PRICE_TYPE.LAST_PRICE ,
    })
    , calcBEPS_COLLAR_Strategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        max_time_to_settlement: 35 * 24 * 3600000,
        justIfWholeIsPofitable:true,
    })
    , calcBEPS_COLLAR_Strategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 35 * 24 * 3600000,
        justIfWholeIsPofitable:true,
    })
    
    
    , calcBUCSRatioStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        BUCSSOptionListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ض') || option.vol < minVol)
                return true
            return false
        }
        ,
        // minStockPriceDistanceInPercent: -.2,
        // maxStockPriceDistanceInPercent: .2,
        min_time_to_settlement: 39 * 24 * 3600000,
        max_time_to_settlement: 60 * 24 * 3600000,
    }), calcBUCSRatioStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        BUCSSOptionListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ض') || option.vol < minVol)
                return true
            return false
        }
        ,
        // minStockPriceDistanceInPercent: -.2,
        // maxStockPriceDistanceInPercent: .2,
        // min_time_to_settlement: 15 * 24 * 3600000,
        max_time_to_settlement: 39 * 24 * 3600000,
    })
    , calcBUPSRatioStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        // maxStockPriceDistanceInPercent: .2,
        // min_time_to_settlement: 15 * 24 * 3600000,
        max_time_to_settlement: 39 * 24 * 3600000,
    })
    , calcBECSRatioStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        // maxStockPriceDistanceInPercent: .2,
        // min_time_to_settlement: 15 * 24 * 3600000,
        max_time_to_settlement: 39 * 24 * 3600000,
    })
    , calcBEPSRatioStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        // maxStockPriceDistanceInPercent: .2,
        // min_time_to_settlement: 15 * 24 * 3600000,
        max_time_to_settlement: 39 * 24 * 3600000,
    })
    
    
    , // calcBOXStrategies(list, {
    //     priceType: CONSTS.PRICE_TYPE.LAST_PRICE,
    //     min_time_to_settlement: 6 * 24 * 3600000,
    //     // minVol: 1000 * 1000 * 1000,
    // }), 
    calcBOXStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        expectedProfitPerMonth: 1.026,
        expectedProfitNotif: true,
    }), 
    
    calcBOXStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0,
        max_time_to_settlement: 1 * 24 * 3600000,
        expectedProfitPerMonth: 1.026,
        expectedProfitNotif: true,
    }),
    
    
    calcBOX_BUPS_BECSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        expectedProfitPerMonth: 1.026,
        expectedProfitNotif: true,
    }), 
    calcBOX_BUPS_BECSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0,
        max_time_to_settlement: 1 * 24 * 3600000,
        expectedProfitPerMonth: 1.026,
        expectedProfitNotif: true,
    }), calcBECSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 38 * 24 * 3600000,
        max_time_to_settlement: 55 * 24 * 3600000,
        maxStockPriceDistanceInPercent: -.22
    }), calcBECSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        max_time_to_settlement: 38 * 24 * 3600000,
        maxStockPriceDistanceInPercent: -.15,
        expectedProfitNotif: true
    })
    
    , calcSyntheticCoveredCallStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        // expectedProfitNotif: true,
        minStockPriceToSarBeSarPercent: .2,
        // min_time_to_settlement: 0 * 24 * 3600000,
        max_time_to_settlement: 38 * 24 * 3600000,
        // expectedProfitPerMonth: 1.04,
        expectedProfitNotif: true
    })
    
    , calcCOVEREDStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        // expectedProfitNotif: true,
        minStockPriceDistanceInPercent: .08,
        min_time_to_settlement: 38 * 24 * 3600000,
        expectedProfitPerMonth: 1.04,
        expectedProfitNotif: true
    }), calcCOVEREDStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.LAST_PRICE,
        // expectedProfitNotif: true,
        minStockPriceDistanceInPercent: .08,
        min_time_to_settlement: 0,
        max_time_to_settlement: 38 * 24 * 3600000,
        expectedProfitPerMonth: 1.04,
        // expectedProfitNotif: true
    }), calcCOVEREDStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        // expectedProfitNotif: true,
        minStockPriceDistanceInPercent: .08,
        min_time_to_settlement: 0,
        max_time_to_settlement: 38 * 24 * 3600000,
        expectedProfitPerMonth: 1.04,
        expectedProfitNotif: true
    }), calcCOVEREDStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        minStockPriceDistanceInPercent: 0,
        maxStockPriceDistanceInPercent: .08,
        min_time_to_settlement: 38 * 24 * 3600000
    }), calcCOVEREDStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        minStockPriceDistanceInPercent: 0,
        maxStockPriceDistanceInPercent: .08,
        min_time_to_settlement: 0,
        max_time_to_settlement: 38 * 24 * 3600000
    }), calcCOVEREDStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        maxStockPriceDistanceInPercent: .001,
        min_time_to_settlement: 38 * 24 * 3600000
    }), calcCOVEREDStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        maxStockPriceDistanceInPercent: .001,
        min_time_to_settlement: 0,
        max_time_to_settlement: 38 * 24 * 3600000,
    })
    , calcCOVERED_COLLAR_Strategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        expectedProfitPerMonth: 1.015,
        expectedProfitNotif: true
    })
    , calcCOVERED_CONVERSION_Strategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
    }), calcBEPSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0 * 24 * 3600000,
        maxStockPriceDistanceInPercent: -.12,
        expectedProfitNotif: true
    }), calcBUCSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        strategySubName: "MAX",
        settlementGainChoosePriceType: "OPTION",
        BUCSSOptionListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ض') || option.vol < minVol)
                return true
            const stockStrikeDistanceInPercent = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;
            if (stockStrikeDistanceInPercent < -.05)
                return true
            return false
        }
        ,
        min_time_to_settlement: 0 * 24 * 3600000,
        // max_time_to_settlement: 35 * 24 * 3600000,
        max_time_to_settlement: 55 * 24 * 3600000,
    }), calcREVERSE_IRON_BUTTERFLYStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        strategySubName: "RIGHT",
        min_time_to_settlement: 10 * 24 * 3600000,
        max_time_to_settlement: 60 * 24 * 3600000,
        // showLeftRightProfitType:"LEFT&RIGHT",
        showLeftRightProfitType: "RIGHT",
        BUCSSOptionListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ض') || option.vol < minVol)
                return true

            const stockStrikeDistanceInPercent = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;
            // if (stockStrikeDistanceInPercent < -.06) return true
            // if (stockStrikeDistanceInPercent > .15) return true
            return false
        }
        ,
        // expectedProfitNotif: true
        // minVol: 1000 * 1000 * 1000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
    }), calcREVERSE_IRON_BUTTERFLYStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        strategySubName: "LEFT",
        min_time_to_settlement: 10 * 24 * 3600000,
        max_time_to_settlement: 60 * 24 * 3600000,
        // showLeftRightProfitType:"LEFT&RIGHT",
        showLeftRightProfitType: "LEFT",
        BUCSSOptionListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ض') || option.vol < minVol)
                return true

            const stockStrikeDistanceInPercent = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;
            // if (stockStrikeDistanceInPercent < -.06) return true
            // if (stockStrikeDistanceInPercent > .15) return true
            return false
        }
        ,
        // expectedProfitNotif: true
        // minVol: 1000 * 1000 * 1000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
    }), calcREVERSE_IRON_BUTTERFLYStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        strategySubName: "LEFT&RIGHT",
        min_time_to_settlement: 10 * 24 * 3600000,
        max_time_to_settlement: 60 * 24 * 3600000,
        showLeftRightProfitType: "LEFT&RIGHT",
        // showLeftRightProfitType:"LEFT",
        BUCSSOptionListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ض') || option.vol < minVol)
                return true

            const stockStrikeDistanceInPercent = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;
            // if (stockStrikeDistanceInPercent < -.06) return true
            // if (stockStrikeDistanceInPercent > .15) return true
            return false
        }
        ,
        // expectedProfitNotif: true
        // minVol: 1000 * 1000 * 1000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
    }), ]

    

    let allStrategyListObject  = strategyMapList.map( ({allStrategiesSorted, htmlTitle, expectedProfitNotif}) => {
        let filteredStrategies = allStrategiesSorted.filter(strategy => isProfitEnough({strategy,profitPercent:strategy.profitPercent}));

        
        const filterSymbolList = getFilterSymbols();
        const ignoreStrategyList = getIgnoreStrategyNames();

        filteredStrategies = filteredStrategies.filter(strategy => {
            if (filterSymbolList.length && !filterSymbolList.find(filteredSymbol => strategy.name.includes(filteredSymbol)))
                return false
            
            if (isStrategyIgnored(strategy,ignoreStrategyList))
                return false
            return true
        }
        );

        filteredStrategies = filteredStrategies.sort( (strategyObjA, strategyObjB) => {
            if (strategyObjA.profitPercent < strategyObjB.profitPercent) {
                return 1;
            } else if (strategyObjA.profitPercent > strategyObjB.profitPercent) {
                return -1;
            }
            // a must be equal to b
            return 0;
        }
        )


        return {
            htmlContent: htmlStrategyListCreator({
                strategyList: filteredStrategies,
                title: htmlTitle,
                expectedProfitNotif
            }),
            filteredStrategies,
            expectedProfitNotif,
            htmlTitle
        }


    }
    )

    checkProfitsAnNotif({
            sortedStrategies: allStrategyListObject.flatMap(strategyObj=>strategyObj.filteredStrategies)
    });

    htmlContent +=  allStrategyListObject.map(strategyObj=>strategyObj.htmlContent).join('');

    setFiltersContent(htmlContent)

}

const createList = ()=>{
    const allElementList = Array.from(document.querySelectorAll('#main [class="{c}"]'));
    if(!allElementList?.length) return []

    let allStockSymbolDetailsMap = {};

    let list = allElementList.map(row => {

        const symbolID = row.getAttribute('id')
        const cells = document.querySelectorAll(`[id='${symbolID}'] >div`)

        const name = cells[1].querySelector('a').innerHTML;
        const quantityOfTrades = convertStringToInt(cells[2].innerHTML);
        const isOption = ['اختيارخ', 'اختيارف'].some(optionTypeName => name.includes(optionTypeName));

        const symbol = cells[0].querySelector('a').innerHTML.trim();

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
            const date = name.split('-').pop();
            strikePrice = convertStringToInt(name.split('-')[1]);
            const stockSymbol = name.split('-')[0].replace('اختيارخ', '').replace('اختيارف', '').trim();

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
            symbol,
            name,
            instrumentName:symbol,
            isOption,
            isCall,
            quantityOfTrades,
            lastTradedTime,
            isPut,
            isETF: isETF(symbol),
            strikePrice,
            optionDetails,
            vol: parseStringToNumber(cells[4].querySelector('div').innerHTML),
            last: convertStringToInt(cells[7].innerHTML),
            bestBuyQ: convertStringToInt(cells[18].querySelector('div').innerHTML),
            bestBuy: convertStringToInt(cells[19].innerHTML),
            bestSell: convertStringToInt(cells[20].innerHTML),
            bestSellQ: convertStringToInt(cells[21].querySelector('div').innerHTML)
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


const getListOfTradedAssets = async () => {
    const list = await fetch('https://core.tadbirrlc.com//StocksHandler?%7B%22Type%22:%22ALL21%22,%22la%22:%22Fa%22%7D&jsoncallback=').then(response => {
        if (!response.ok) {
            throw new Error('خطا در دریافت اطلاعات');
            alert('خطا در دریافت اطلاعات')
        }
        return response.json(); 
    });

    return list

}



const createList2 = async ()=>{
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
            const date = name.split('-').pop();
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
            symbol,
            name,
            instrumentName:symbol,
            isOption,
            isCall,
            quantityOfTrades,
            lastTradedTime,
            isPut,
            isETF: isETF(symbol),
            strikePrice,
            optionDetails,
            vol: tradedAsset.tv,
            last: tradedAsset.ltp,
            bestBuyQ: tradedAsset.bbq,
            bestBuy: tradedAsset.bbp,
            bestSell: tradedAsset.bsp,
            bestSellQ: tradedAsset.bsq
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

const ignoreStrategyTemporary = (strategyName)=>{

    tempIgnoredNotifList.push(strategyName);


    setTimeout( () => {
        tempIgnoredNotifList = tempIgnoredNotifList.filter(_strategyName => strategyName !== _strategyName)
    }
    , 160000);

}



const getMainContainer = () => {

    const createCnt = () => {

        let mainContainer = document.createElement('div');

        mainContainer.classList.add('amin-main-cnt');

        mainContainer.style.cssText += `
            background: rgb(255, 255, 255);
            position: absolute;
            height: 100vh;
            top: 0px;
            z-index: 50000;
            overflow: auto;
            direction: rtl;
            left: 0px;
            right: 0px;
            display: flex;
            font-size: 20px;
        `;

        let contentPanel = document.createElement('div');
        let filtersCnt = document.createElement('div');

        contentPanel.classList.add('amin-status-cnt');

        contentPanel.style.cssText += `
         background: rgb(255, 255, 255);
        height: 100vh;
        width:100%;
        top: 0px;
        z-index: 50000;
        overflow: auto;
        direction: rtl;
        left: 0px;
        right: 0px;
        padding-right: 0px;
        padding-left: 0px;
        display: flex;
        font-size: 20px;
        flex-wrap: wrap;
        align-content: flex-start;
    `;

        filtersCnt.classList.add('amin-status-cnt__filters-cnt');

        filtersCnt.style.cssText += `
        display: flex;
        flex-wrap: wrap;
        align-content: flex-start;
        width:100%;
        min-height: 300vh;
    `;

        filtersCnt.addEventListener('click', (event) => {

            if (event.target.classList.contains('strategy-name')) {

                const strategyName = event.target.innerHTML;
                const strategyType = event.target.getAttribute("data-base-strategy-type");
                const strategyFullSymbolNames = event.target.getAttribute("data-base-strategy-full-symbol-names");

                navigator?.clipboard?.writeText(`${strategyType}@${strategyFullSymbolNames}`)

                ignoreStrategyTemporary(strategyName);
                
            }
        }
        )

        contentPanel.appendChild(filtersCnt);

        mainContainer.append(contentPanel);

        let silentButton = document.createElement('button');


        silentButton.style.cssText += `
                position: absolute;
                left: 7px;
                width: auto;
                cursor: pointer;
                z-index: 500000;
                height: auto;
                padding: 7px;
                font-size: large;
                font-weight: bold;
        `;

        silentButton.appendChild(document.createTextNode("سکوت موقت"))

 
        let silentButtonTimeoutID;
        silentButton.addEventListener('click', (event) => {
            clearTimeout(silentButtonTimeoutID);

            isSilentModeActive = true;

            silentButtonTimeoutID = setTimeout( () => {
                isSilentModeActive = false;
            }
            , 160000);

           
        });


        mainContainer.append(silentButton);

        return mainContainer

    }

    const mainCnt = document.querySelector('.amin-main-cnt') || createCnt();
    if (!document.querySelector('.amin-main-cnt')) {
        document.body.append(mainCnt);
    }

    return mainCnt

}

const setFiltersContent = (htmlContent) => {

    const mainContent = getMainContainer();

    const filtersCnt = mainContent.querySelector('.amin-status-cnt__filters-cnt');
    filtersCnt.innerHTML = htmlContent;
}

const getGeneralIgnoreText = ()=> document.querySelector('.amin-filter-cnt textarea.amin-ignoreList.amin-ignoreList--general').value
const setGeneralIgnoreText = (value)=> document.querySelector('.amin-filter-cnt textarea.amin-ignoreList.amin-ignoreList--general').value = value;

const getIgnoreStrategyNames = () => {
    const privateIgnoreListText = document.querySelector('.amin-filter-cnt textarea.amin-ignoreList.amin-ignoreList--private').value;
    const generalIgnoreListText = getGeneralIgnoreText();
    const ignoreListText = `${privateIgnoreListText} ${generalIgnoreListText} `
    if (!ignoreListText)
        return []

    const ignoreListTextWithoutSpaces = ignoreListText.replace(/\s+/g, '*');
    if (!ignoreListTextWithoutSpaces)
        return []
    let ignoreStrategyNames = ignoreListTextWithoutSpaces.split('*');
    if (!ignoreStrategyNames?.length)
        return []
    ignoreStrategyNames = ignoreStrategyNames.filter(Boolean);
    return ignoreStrategyNames.map(ignoreStrategyName => {
        const strategyTypeAndName = ignoreStrategyName.split('@');
        if (!strategyTypeAndName?.length)
            return {
                type: null,
                name: null
            }
        return {
            type: strategyTypeAndName[0],
            name: strategyTypeAndName[1],
            profitPercent: strategyTypeAndName[2] ?  parseFloat(strategyTypeAndName[2])/100 :  null
        }
    }
    );
}

const getFilterSymbols = () => {
    const ignoreListText = document.querySelector('.amin-filter-cnt textarea.amin-filterList').value;
    const ignoreListTextWithoutSpaces = ignoreListText.replace(/\s+/g, '*');
    let ignoreStrategyNames = ignoreListTextWithoutSpaces.split('*');
    return ignoreStrategyNames.filter(Boolean);

}

const createFilterPanel = () => {

    let mainCnt = getMainContainer();

    let cnt = document.createElement('div');

    cnt.classList.add('amin-filter-cnt');

    cnt.style.cssText += `
        width: 200px;
        height: 100vh;
        display: flex;
        flex-direction: column;
    `;

    cnt.innerHTML = `
        <textarea class="amin-ignoreList amin-ignoreList--private"  style="width: 176px; min-width: 122px; height: 299px; font-size: 12px;"></textarea>
        <textarea class="amin-ignoreList amin-ignoreList--general"  style="width: 176px; min-width: 122px; height: 299px; font-size: 12px;"></textarea>
        <textarea class="amin-filterList"  style="width: 170px; min-width: 122px; height: 53px; font-size: 12px;"></textarea>`;

        
    mainCnt.prepend(cnt);

}

const interval = async () => {


    try {

        const list = createList();
        // const list = await createList2();
        if (list?.length > 0) {
            createListFilterContetnByList(list);

            newTabList.forEach(childWindowTab => {
                const generalIgnoreText = getGeneralIgnoreText();
                if (childWindowTab.document.readyState === "complete") {
                    //notifiedStrategyList=[]
                    childWindowTab.postMessage({
                        list,
                        generalIgnoreText,
                        $tempIgnoredNotifList: tempIgnoredNotifList,
                        $notifiedStrategyList: notifiedStrategyList
                    }, "*");
                }
            });
        }
        
    } catch (error) {

        showNotification({
            title: 'خطا در interval',
            body: 'interval error',
            tag: `interval_issue`
        });
        
    }
    

    setTimeout(interval, 2000)
}

let newTabList =[];

const openNewTab = ()=>{

    const newWin = window.open("option-filter-child.html", "_blank");

    newTabList.push(newWin);

}

const injectStyles = ()=>{

    const css = `
    
        body {
            font-family: Tahoma;
        }

        @supports not selector(::-webkit-scrollbar) {
            *{
                scrollbar-width: thin;
                scrollbar-color: #939191;

            }
        }
        @supports selector(::-webkit-scrollbar) {

            ::-webkit-scrollbar-thumb {
                background-color:#939191
            }
            
            ::-webkit-scrollbar {
                width: 0.25rem;
                height: 0.25rem;
            }

            .kateb-scroll-gray::-webkit-scrollbar-thumb{
                background-color:#939191
            }
        }

        .strategy-filter-list-cnt{
            height: 38vh;
            min-width: 200px;
            display: flex;
            flex-direction: column;
        }
    `;

    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
}




const RUN = () => {
    // var momentJalaliScriptTag = document.createElement('script');
    // momentJalaliScriptTag.src = "https://cdn.jsdelivr.net/npm/jalali-moment@3.2.3/dist/jalali-moment.browser.js";
    // document.head.appendChild(momentJalaliScriptTag);

    // momentJalaliScriptTag.onload = function () {

    // console.log(moment('1403/11/3', 'jYYYY/jM/jD HH:mm').format('YYYY-M-D HH:mm:ss'))
    createFilterPanel();

    // alert('حجم')
    interval()
    // } ;

    if (!moment) alert('moment  error');


    injectStyles();

    window.addEventListener("message", (event) => {
        const { list ,generalIgnoreText='' ,$tempIgnoredNotifList=[],$notifiedStrategyList=[] } = event.data;
        if(!list?.length) return 


        const notifiedStrategyNameList = $notifiedStrategyList.map(s=>s.name);
        

        $tempIgnoredNotifList.concat(notifiedStrategyNameList).forEach(_strategyName=> !tempIgnoredNotifList.includes(_strategyName) &&  ignoreStrategyTemporary(_strategyName))


        setGeneralIgnoreText(generalIgnoreText)



        createListFilterContetnByList(list);
    });

}

RUN();






