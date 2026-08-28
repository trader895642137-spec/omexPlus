import { showNotification, totalCostCalculatorForPriceTypes } from "../common";
import { calcOffsetProfitOfStrategy, isProfitEnough, STRATEGY_NAME_PROFIT_CALCULATOR } from "../omex";

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


const enrichStrategyGroupInfoListByInstrumentPrices = (strategyGroupInfoList,tradedInstrumentList)=>{
  if(!strategyGroupInfoList?.length || !tradedInstrumentList?.length) return strategyGroupInfoList

  strategyGroupInfoList = strategyGroupInfoList.map(strategyGroupInfo=>{

    


    try {
      strategyGroupInfo.openPositionProfitInfo = STRATEGY_NAME_PROFIT_CALCULATOR.OTHERS({
        strategyPositions: strategyGroupInfo.strategyPositions,
        stockPrice: strategyGroupInfo.stockPrice,
        nokoolOrNoRequestFactor: strategyGroupInfo.nokoolOrNoRequestFactor
      });
      
      strategyGroupInfo.offsetProfitOfStrategy = calcOffsetProfitOfStrategy(strategyGroupInfo.strategyPositions);
    } catch (error) {
      console.error(error, strategyGroupInfo)
    }


    return strategyGroupInfo


  });

  return strategyGroupInfoList

}


const checkProfitPercentAndInform = ({ strategyGroupInfoList }) => {


  if(isSilentAllActive) return 

  for (let i = 0; i < strategyGroupInfoList.length; i++) {
    const strategyGroupInfo = strategyGroupInfoList[i];
    if(strategyGroupInfo.isSilentModeActive) continue;
    const strategyPositions = strategyGroupInfo.strategyPositions;
    const expectedProfit = strategyGroupInfo.expectedProfit;
    const profitPercentByBestPrices = strategyGroupInfo?.openPositionProfitInfo?.profitPercentByBestPrices?.defaultQueue;
    // strategyName

    if (strategyGroupInfo.offsetProfitOfStrategy.profitLossByOffsetOrdersPercent > (expectedProfit?.currentPositions || 1)) {

      showNotification({
        title: 'به سود رسید',
        body: `${strategyPositions.map(_strategyPosition => _strategyPosition.instrumentName).join('-')}`,
        tag: `${strategyPositions[0].instrumentName}-expectedProfitForCurrentPositionsPrecent`
      });
    }

    if (isProfitEnough({
      strategyPositions,
      totalProfitPercent: profitPercentByBestPrices,
      expectedProfit
    })) {

      showNotification({
        title: `سود %${profitPercentByBestPrices.toFixed()}`,
        body: `${strategyPositions.map(_strategyPosition => _strategyPosition.instrumentName).join('-')}`,
        tag: `${strategyPositions[0].instrumentName}-expectedProfitPrecent`
      });


    }

  }


  
}


let strategyGroupInfoList = [];
try {
    const port = chrome.runtime.connect({ name: "receiver" });

    port.onMessage.addListener(({list}) =>{

        strategyGroupInfoList = enrichStrategyGroupInfoListByInstrumentPrices(strategyGroupInfoList,list);
        renderStrategies();
        checkProfitPercentAndInform({strategyGroupInfoList})

    } );
} catch(err) {
    console.error("Cannot connect to background:", err);
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  console.log(totalCostCalculatorForPriceTypes);

  if (message.type === "addToWatcher") {
    console.log("📨 پیام دریافت شد از:", sender.tab?.url || "اکستنشن");

    const strategyInfo = deserializeStrategyInfo(message.payload.strategyInfo);

    strategyGroupInfoList.push({ ...strategyInfo });

  }
});





const deserializeStrategyInfo = (strategyInfo) => {

  const deserialized = {...strategyInfo};

  deserialized.strategyPositions = deserialized.positionsPrepareForSerialization.map(position => {
    return deserializeStrategyPositions(position);
  });

  return deserialized

}









const addBtn = document.getElementById('addStrategyBtn');
const saveBtn = document.getElementById('saveGroupsBtn');
const loadBtn = document.getElementById('loadGroupsBtn');
const silentAllBtn = document.getElementById('silentAllBtn');
const modal = document.getElementById('modalBackdrop');
const input = document.getElementById('strategyJsonInput');
const confirmBtn = document.getElementById('confirmBtn');
const cancelBtn = document.getElementById('cancelBtn');
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
    }
});

loadBtn.addEventListener('click', () => {
  try {
      const data = localStorage.getItem(cacheKey);
      strategyGroupInfoList =  data ? JSON.parse(data) : null;
      strategyGroupInfoList = strategyGroupInfoList.map(deserializeStrategyInfo);
    } catch (error) {
      console.error('خطا در بازیابی:', error);

    }
});


/* ---------- modal ---------- */
addBtn.addEventListener('click', () => {
  input.value = '';
  modal.style.display = 'flex';
});

cancelBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

/* ---------- add strategy ---------- */
confirmBtn.addEventListener('click', () => {
  let data;
  try {
    data = JSON.parse(input.value);

  } catch (err) {
    console.error(err)
    alert('خطا');
  }

  modal.style.display = 'none';

  if (Array.isArray(data)) {

    strategyGroupInfoList = strategyGroupInfoList.concat(data)
  } else {

    strategyGroupInfoList.push(data);
  }

  
  renderStrategies();


});

const openOmexStrategyTab = ({strategyName}) => {
  const baseURL = 'https://khobregan.tsetab.ir/#/stock/derivative/main/strategy-estimation';
  const params = new URLSearchParams({
    GSTitle: strategyName,
  });

  const fullURL = baseURL + '?' + params.toString();
  window.open(fullURL);
}

/* ---------- render ---------- */
function renderStrategies() {
  list.innerHTML = '';

  strategyGroupInfoList.forEach((strategyGroupInfo, index) => {
    const box = document.createElement('div');
    box.className = 'strategy-box';

    const profitPercentByBestPrices = strategyGroupInfo?.openPositionProfitInfo?.profitPercentByBestPrices?.defaultQueue;

    box.innerHTML = `
      <h4 class="title">${strategyGroupInfo?.strategyName}</h4>

      ${strategyGroupInfo.offsetProfitOfStrategy ? `<div style="color:${strategyGroupInfo?.offsetProfitOfStrategy?.profitLossByOffsetOrdersPercent >= 0 ? 'green' : 'red'};margin-right: 10px;"> 
                ${strategyGroupInfo.offsetProfitOfStrategy.profitLossByOffsetOrdersPercent.toLocaleString('en-US', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1
                })}
      </div>`:``}
      ----
      ${profitPercentByBestPrices ?`<div style="color:${profitPercentByBestPrices >= 0 ? 'green' : 'red'};margin-right: 10px;"> 
                ${profitPercentByBestPrices.toLocaleString('en-US', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1
                })}
      </div>`:``}
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
