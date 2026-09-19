import { calculateExerciseCost, isBuyQueue, isSellQueue, showNotification, totalCostCalculatorForPriceTypes } from "../common";
import { calcOffsetProfitOfStrategy, hasCurrentQuantityIssue, isProfitEnough, isReachedToExpectedOffsetProfit, STRATEGY_NAME_PROFIT_CALCULATOR } from "../omex";

let lastDataReceivedAt = Date.now();
const DATA_TIMEOUT = 10_000; // 10 seconds

const notifyError = (error, context = '') => {
  console.error(`[WATCHER ERROR] ${context}`, error);

  const message =
    error instanceof Error
      ? `${error.message}\n${error.stack || ''}`
      : String(error);

  showNotification({
    title: '❌ خطا در Watcher',
    body: `${context ? context + ': ' : ''}${message}`.slice(0, 500),
    tag: `watcher-error`
  });
};


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

const deserializeStrategyPositions = (obj) => {


    const result = { ...obj };

    for (const [key, value] of Object.entries(result)) {
        if (value && value.__isFunction) {
            // بازسازی تابع
            const returnValue = value.__returnValue;
            result[key] = function () { return returnValue; };
        }
    }

    return result;
}



window.addEventListener('error', (event) => {
  notifyError(
    event.error || event.message,
    `خطا در ${event.filename || 'Watcher'}:${event.lineno || ''}`
  );
});

window.addEventListener('unhandledrejection', (event) => {
  notifyError(
    event.reason,
    'Unhandled Promise Rejection'
  );
});

const enrichStrategyGroupInfoListByInstrumentPrices = (strategyGroupInfoList,tradedInstrumentList)=>{
  if(!strategyGroupInfoList?.length || !tradedInstrumentList?.length) return strategyGroupInfoList

  strategyGroupInfoList = strategyGroupInfoList.map(strategyGroupInfo=>{

    strategyGroupInfo.strategyPositions = strategyGroupInfo.strategyPositions.map(strategyPosition=>{

      const tradedInstrument = tradedInstrumentList.find(tradedInstrument=>tradedInstrument.instrumentName.replaceAll('ي', 'ی') === strategyPosition.instrumentName.replaceAll('ي', 'ی'));

      
      strategyPosition.getBestOffsetPrice = () => {
        if (!strategyPosition.isOption) {
          const isOffsetDirectionQueue = strategyPosition.isBuy
            ? isSellQueue(tradedInstrument)
            : isBuyQueue(tradedInstrument);

          if (isOffsetDirectionQueue) {
            return NaN;
          }
        }

        return (
          strategyPosition.isBuy
            ? tradedInstrument?.bestBuy
            : tradedInstrument?.bestSell
        ) || NaN;
      };



      strategyPosition.getBestOpenMorePrice = () => {
        if (!strategyPosition.isOption) {
          const isSameDirectionQueue = strategyPosition.isBuy
            ? isBuyQueue(tradedInstrument)
            : isSellQueue(tradedInstrument);

          if (isSameDirectionQueue) {
            return NaN;
          }
        }

        return (
          strategyPosition.isBuy
            ? tradedInstrument?.bestSell
            : tradedInstrument?.bestBuy
        ) || NaN;
      };



      return strategyPosition

    });

    

    

    

    try {
      strategyGroupInfo.daysLeftToSettlement = strategyGroupInfo.strategyPositions.find(sp => sp.getDaysLeftToSettlement() !== null)?.getDaysLeftToSettlement();


      strategyGroupInfo.exerciseCost = calculateExerciseCost({strategyPositions:strategyGroupInfo.strategyPositions,stockPrice:strategyGroupInfo.stockPrice});

      strategyGroupInfo.openPositionProfitInfo = STRATEGY_NAME_PROFIT_CALCULATOR.OTHERS({
        strategyPositions: strategyGroupInfo.strategyPositions,
        stockPrice: strategyGroupInfo.stockPrice,
        nokoolOrNoRequestFactor: strategyGroupInfo.nokoolOrNoRequestFactor
      });
      
      strategyGroupInfo.offsetProfitOfStrategy = calcOffsetProfitOfStrategy({strategyPositions: strategyGroupInfo.strategyPositions, stockPrice: strategyGroupInfo.stockPrice});
    } catch (error) {
      console.error(error, strategyGroupInfo);
      notifyError(
        error,
        `محاسبه سود استراتژی ${strategyGroupInfo?.strategyName || ''}`
      );
    }


    return strategyGroupInfo


  });

  return strategyGroupInfoList

}


const checkAndInform = ({ strategyGroupInfoList }) => {


  

  for (let i = 0; i < strategyGroupInfoList.length; i++) {
    const strategyGroupInfo = strategyGroupInfoList[i];
    if(strategyGroupInfo.isSilentModeActive) continue;
    const strategyPositions = strategyGroupInfo.strategyPositions;
    const expectedProfit = strategyGroupInfo.expectedProfit;
    const profitPercentByBestPrices = strategyGroupInfo?.openPositionProfitInfo?.profitPercentByBestPrices?.defaultQueue;
    const {profitPercentOfCurrentPositionsByNearSettlementPrices} =  strategyGroupInfo?.offsetProfitOfStrategy ?? {};



    const hasQuantityIssue = hasCurrentQuantityIssue({
      strategyPositions,
      currentQuantityGetter : (sp)=> sp.getCurrentPositionQuantity(),
      strategyQuantityGetter : (sp)=> sp.getQuantity(),
    });
    

    if(hasQuantityIssue){
      !isSilentAllActive && showNotification({
        title: 'تعداد بالانس نیست',
        body: `${strategyPositions.map(_strategyPosition => _strategyPosition.instrumentName).join('-')}`,
        tag: `currentPositionQuantityUnbalance`
      });

    }

    let hasAlarmProfit = false;
    
    if (isReachedToExpectedOffsetProfit({
      profitLossByOffsetOrdersPercent: strategyGroupInfo.offsetProfitOfStrategy.profitLossByOffsetOrdersPercent,
      profitPercentOfCurrentPositionsByNearSettlementPrices,
      expectedProfit
    })) {

      hasAlarmProfit = true;

      !isSilentAllActive && showNotification({
        title: 'به سود رسید',
        body: `${strategyPositions.map(_strategyPosition => _strategyPosition.instrumentName).join('-')}`,
        tag: `expectedProfitForCurrentPositionsPrecent`
      });
    }

    if (isProfitEnough({
      strategyPositions,
      totalProfitPercent: profitPercentByBestPrices,
      expectedProfit
    })) {


      hasAlarmProfit = true;
      !isSilentAllActive && showNotification({
        title: `سود %${profitPercentByBestPrices.toFixed()}`,
        body: `${strategyPositions.map(_strategyPosition => _strategyPosition.instrumentName).join('-')}`,
        tag: `expectedProfitPrecent`
      });


    }

    strategyGroupInfo.hasAlarmProfit = hasAlarmProfit;
    strategyGroupInfo.hasQuantityIssue = hasQuantityIssue;

  }


  
}


let strategyGroupInfoList = [];
try {
    const port = chrome.runtime.connect({ name: "receiver" });

    port.onMessage.addListener(({list}) =>{

      try {

        lastDataReceivedAt = Date.now();
        strategyGroupInfoList = enrichStrategyGroupInfoListByInstrumentPrices(strategyGroupInfoList, list);
        renderStrategies();
        checkAndInform({ strategyGroupInfoList })
      } catch (error) {
        notifyError(error, 'Watcher - دریافت قیمت‌ها');
      }

    } );

    setInterval(() => {

        const elapsed = Date.now() - lastDataReceivedAt;

        if (elapsed > DATA_TIMEOUT ) {
            
            notifyError(new Error(), `دریافت قیمت‌ها بیش از ${DATA_TIMEOUT / 1000} ثانیه متوقف شده`);
        }

    }, 5000);


} catch(err) {
    console.error("Cannot connect to background:", err);
     notifyError(err, 'Cannot connect to background');
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {

    if (message.type === "addToWatcher") {
      console.log("📨 پیام دریافت شد از:", sender.tab?.url || "اکستنشن");
      const strategyInfo = deserializeStrategyInfo(message.payload.strategyInfo);

      strategyGroupInfoList = strategyGroupInfoList.filter(
        item => item.strategyName !== strategyInfo.strategyName
      );



      strategyGroupInfoList.push({ ...strategyInfo });

      renderStrategies();

    }

    if (message.type === "addAllToWatcher") {

      const allGroupsStrategyInfo = message.payload.allGroupsStrategyInfo;


      allGroupsStrategyInfo.map(serializedStrategyInfo => {

        const strategyInfo = deserializeStrategyInfo(serializedStrategyInfo);

        strategyGroupInfoList = strategyGroupInfoList.filter(
          item => item.strategyName !== strategyInfo.strategyName
        );



        strategyGroupInfoList.push({ ...strategyInfo });

      });

      renderStrategies();

    }


  } catch (error) {
    notifyError(error, 'Watcher - دریافت استراتژی');
  }
});





const deserializeStrategyInfo = (strategyInfo) => {

  const deserialized = {...strategyInfo};

  deserialized.strategyPositions = deserialized.positionsPrepareForSerialization.map(position => {
    return deserializeStrategyPositions(position);
  });

  return deserialized

}









// const addBtn = document.getElementById('addStrategyBtn');
const saveBtn = document.getElementById('saveGroupsBtn');
const loadBtn = document.getElementById('loadGroupsBtn');
const silentAllBtn = document.getElementById('silentAllBtn');
// const modal = document.getElementById('modalBackdrop');
// const input = document.getElementById('strategyJsonInput');
// const confirmBtn = document.getElementById('confirmBtn');
// const cancelBtn = document.getElementById('cancelBtn');
const list = document.getElementById('strategyList');


const cacheKey = "strategyGroupInfoList";

let silentAllButtonTimeoutID,isSilentAllActive;
silentAllBtn.addEventListener('click', () => {

  clearTimeout(silentAllButtonTimeoutID);

  isSilentAllActive = true;

  silentAllButtonTimeoutID = setTimeout(() => {
    isSilentAllActive = false;
  }
    , 160000);



});


saveBtn.addEventListener('click', () => {
   try {
      localStorage.setItem(cacheKey, JSON.stringify(strategyGroupInfoList));
    } catch (error) {
      console.error('خطا در ذخیره‌سازی:', error);
      notifyError(error, 'ذخیره‌سازی استراتژی‌ها');
    }
});

loadBtn.addEventListener('click', () => {
  try {
      const data = localStorage.getItem(cacheKey);
      strategyGroupInfoList =  data ? JSON.parse(data) : null;
      strategyGroupInfoList = strategyGroupInfoList.map(deserializeStrategyInfo);
      renderStrategies();
    } catch (error) {
      console.error('خطا در بازیابی:', error);
      notifyError(error, 'بازیابی استراتژی‌ها');

    }
});






/* ---------- modal ---------- */
// addBtn.addEventListener('click', () => {
//   input.value = '';
//   modal.style.display = 'flex';
// });

// cancelBtn.addEventListener('click', () => {
//   modal.style.display = 'none';
// });

/* ---------- add strategy ---------- */
// confirmBtn.addEventListener('click', () => {
//   let data;
//   try {
//     data = JSON.parse(input.value);

//   } catch (err) {
//     console.error(err)
//     alert('خطا');
//   }

//   modal.style.display = 'none';

//   if (Array.isArray(data)) {

//     strategyGroupInfoList = strategyGroupInfoList.concat(data)
//   } else {

//     strategyGroupInfoList.push(data);
//   }

  
//   renderStrategies();


// });

const openOmexStrategyTab = ({strategyName}) => {
  const baseURL = 'https://khobregan.tsetab.ir/#/stock/derivative/main/strategy-estimation';
  const params = new URLSearchParams({
    GSTitle: strategyName,
  });

  const fullURL = baseURL + '?' + params.toString();
  window.open(fullURL);
}




const sortList = (list) => {
    const sortType = document.querySelector(
        'input[name="sortType"]:checked'
    )?.value;

    if (sortType === 'positionCost') {
        list.sort((a, b) => {
            const costA = Math.abs(
                a.offsetProfitOfStrategy?.totalCurrentPositionCost ?? 0
            );

            const costB = Math.abs(
                b.offsetProfitOfStrategy?.totalCurrentPositionCost ?? 0
            );

            return costB - costA;
        });
    }

    if (sortType === 'daysLeft') {

        
        list.sort((a, b) => {
            return (
                (a.daysLeftToSettlement ?? Infinity) -
                (b.daysLeftToSettlement ?? Infinity)
            );
        });

        
    }

    return list;
};



const getUniquePositions = ({ strategyGroupInfoList }) => {

  const uniqueInstruments = new Set();

  strategyGroupInfoList.forEach(strategy => {
    strategy.strategyPositions.forEach(pos => {
      uniqueInstruments.add(pos.instrumentName);
    });
  });

  return uniqueInstruments.size

}



/* ---------- render ---------- */
function renderStrategies() {

  
  strategyGroupInfoList= strategyGroupInfoList.map(strategyGroupInfo=>({...strategyGroupInfo,daysLeftToSettlement:strategyGroupInfo.strategyPositions.find(sp => sp.getDaysLeftToSettlement() !== null)?.getDaysLeftToSettlement()}))

  strategyGroupInfoList = sortList(strategyGroupInfoList);
  list.innerHTML = '';

  const uniquePositionsCount = getUniquePositions({strategyGroupInfoList});


  document.querySelector('#totalPositionsCount').innerHTML = uniquePositionsCount;

  strategyGroupInfoList.forEach((strategyGroupInfo, index) => {
    const box = document.createElement('div');
    box.className = 'strategy-box';

    strategyGroupInfo.hasAlarmProfit &&  box.classList.add('has-alarm-profit');
    strategyGroupInfo.hasQuantityIssue &&  box.classList.add('has-error');

    const profitPercentByBestPrices = strategyGroupInfo?.openPositionProfitInfo?.profitPercentByBestPrices?.defaultQueue;
    const {
        totalCurrentPositionCost,
        totalOffsetGainOfCurrentPositionObj,
        profitLossByOffsetOrdersPercent,
        unreliableTotalCostOfCurrentPositions, profitPercentOfCurrentPositionsByNearSettlementPrices }  = strategyGroupInfo?.offsetProfitOfStrategy ?? {};

    box.innerHTML = `
      <h4 class="title">${strategyGroupInfo?.strategyName}</h4>


      <div >
        <label>تا سررسید: </label>
        <span >${strategyGroupInfo.daysLeftToSettlement}
        </span>
      </div>


      


      

      <div >
        <label>سرمایه درگیر: </label>
        <span style="color:${totalCurrentPositionCost >= 0 ? 'green' : 'red'};">${totalCurrentPositionCost?.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        })}
        </span>
      </div>

      <div >
        <label>سود بالقوه: </label>
        <span style="color:${profitPercentOfCurrentPositionsByNearSettlementPrices >= 0 ? 'green' : 'red'};">${profitPercentOfCurrentPositionsByNearSettlementPrices?.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        })}
        </span>
      </div>


      ${profitLossByOffsetOrdersPercent!=null ? `<div >
      <label>موقعیت باز: </label>
      <span style="color:${profitLossByOffsetOrdersPercent >= 0 ? 'green' : 'red'};">${profitLossByOffsetOrdersPercent.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                })}</span>
                
      </div>`:``}
      ${profitPercentByBestPrices ?`<div > 
        <label>موقعیت جدید: </label>
        <span style="color:${profitPercentByBestPrices >= 0 ? 'green' : 'red'};"> 
          ${profitPercentByBestPrices.toLocaleString('en-US', {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1
                  })}
        </span>
               
      </div>`:``}


      <div >
        <label>هزینه اعمال: </label>
        <span >${strategyGroupInfo?.exerciseCost?.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        })}
        </span>
      </div>


      <button class="delete-btn">حذف</button>
      <button class="silent-btn">سکوت</button>
    `;

    box.querySelector('.title').addEventListener('click',async ()=>{
      openOmexStrategyTab({strategyName:strategyGroupInfo?.strategyName});
      strategyGroupInfoList = strategyGroupInfoList.filter(_strategyGroupInfo=>_strategyGroupInfo.strategyName!==strategyGroupInfo?.strategyName)
      
    });

    setUpSilentGroup({element:box.querySelector('.silent-btn'),strategyGroupInfo});
    setupHoldToDelete(box.querySelector('.delete-btn'), index);
    list.appendChild(box);
  });
}

const setUpSilentGroup = ({ element, strategyGroupInfo }) => {


  element.addEventListener('click', (event) => {
    clearTimeout(strategyGroupInfo.silentButtonTimeoutID);

    strategyGroupInfo.isSilentModeActive = true;

    strategyGroupInfo.silentButtonTimeoutID = setTimeout(() => {
      strategyGroupInfo.isSilentModeActive = false;
    }
      , 160000);


  });
}

/* ---------- hold to delete (3s) ---------- */
function setupHoldToDelete(btn, index) {
  let timer = null;

  const start = () => {
    timer = setTimeout(() => {
      strategyGroupInfoList.splice(index, 1);
      renderStrategies();
    }, 3000);
  };

  const cancel = () => {
    clearTimeout(timer);
    timer = null;
  };

  btn.addEventListener('mousedown', start);
  btn.addEventListener('touchstart', start);

  btn.addEventListener('mouseup', cancel);
  btn.addEventListener('mouseleave', cancel);
  btn.addEventListener('touchend', cancel);
}


const radios = document.querySelectorAll('input[name="sortType"]');
  
  radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      renderStrategies()
    });
  });