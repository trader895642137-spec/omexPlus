
const enrichStrategyGroupInfoListByInstrumentPrices = (strategyGroupInfoList,tradedInstrumentList)=>{
  if(!strategyGroupInfoList?.length || !tradedInstrumentList?.length) return strategyGroupInfoList

  strategyGroupInfoList = strategyGroupInfoList.map(strategyGroupInfo=>{

    strategyGroupInfo.strategyPositions = strategyGroupInfo.strategyPositions.map(strategyPosition=>{

      const tradedInstrument = tradedInstrumentList.find(tradedInstrument=>tradedInstrument.instrumentName === strategyPosition.instrumentName);

      strategyPosition.getQuantity = ()=>strategyPosition.quantityOfEstimationPositionRow;
      strategyPosition.getCurrentPositionQuantity = ()=>strategyPosition.portfolioPositionQuantity;

      strategyPosition.getCurrentPositionAvgPrice = ()=> strategyPosition.currentPositionAvgPrice,

      
      strategyPosition.getBestOffsetPrice = ()=> (strategyPosition.isBuy ? tradedInstrument?.bestBuy : tradedInstrument?.bestSell) || NaN
      strategyPosition.getBaseInstrumentPriceOfOption  = ()=> tradedInstrument?.optionDetails?.stockSymbolDetails?.last
      strategyPosition.getRequiredMargin = ()=> strategyPosition.requiredMargin;
      strategyPosition.getInsertedPrice = ()=> NaN;
 

      strategyPosition.getBestOpenMorePrice = ()=>(strategyPosition.isBuy ? tradedInstrument?.bestSell : tradedInstrument?.bestBuy) || NaN;
      strategyPosition.getStrategyType = ()=>NaN;
      strategyPosition.getStrategyName = ()=>NaN;


      return strategyPosition

    });


    try {
      
      strategyGroupInfo.openPositionProfitInfo =  omexLib && omexLib.STRATEGY_NAME_PROFIT_CALCULATOR.OTHERS(strategyGroupInfo.strategyPositions);
      strategyGroupInfo.offsetProfitOfStrategy =  omexLib && omexLib.calcOffsetProfitOfStrategy(strategyGroupInfo.strategyPositions);
    } catch (error) {
      console.error(error,strategyGroupInfo)
    }


    return strategyGroupInfo


  });

  return strategyGroupInfoList

}


let strategyGroupInfoList = [];
try {
    const port = chrome.runtime.connect({ name: "CHILD_PAGE" });
    port.onMessage.addListener(({list}) =>{

        strategyGroupInfoList = enrichStrategyGroupInfoListByInstrumentPrices(strategyGroupInfoList,list);
        renderStrategies();
        console.log(strategyGroupInfoList)
//         {
//     "symbol": "مهرمام",
//     "name": "مهرمام ميهن",
//     "instrumentName": "مهرمام",
//     "isOption": false,
//     "isCall": false,
//     "quantityOfTrades": 1614,
//     "lastTradedTime": 1767258197354,
//     "isPut": false,
//     "isETF": false,
//     "vol": 37995000000,
//     "last": 4581,
//     "bestBuyQ": 265684,
//     "bestBuy": 4581,
//     "bestSell": 4601,
//     "bestSellQ": 260
// }
    } );
} catch(err) {
    console.error("Cannot connect to background:", err);
}
















const addBtn = document.getElementById('addStrategyBtn');
const modal = document.getElementById('modalBackdrop');
const input = document.getElementById('strategyJsonInput');
const confirmBtn = document.getElementById('confirmBtn');
const cancelBtn = document.getElementById('cancelBtn');
const list = document.getElementById('strategyList');



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

/* ---------- render ---------- */
function renderStrategies() {
  list.innerHTML = '';

  strategyGroupInfoList.forEach((strategyGroupInfo, index) => {
    const box = document.createElement('div');
    box.className = 'strategy-box';

    box.innerHTML = `
      <h4 class="title">${strategyGroupInfo.group.name}</h4>

      ${strategyGroupInfo.offsetProfitOfStrategy ? `<div style="color:${strategyGroupInfo.offsetProfitOfStrategy.profitLossByOffsetOrdersPercent >= 0 ? 'green' : 'red'};margin-right: 10px;"> 
                ${strategyGroupInfo.offsetProfitOfStrategy.profitLossByOffsetOrdersPercent.toLocaleString('en-US', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1
                })}
      </div>`:``}
      ----
      ${strategyGroupInfo.offsetProfitOfStrategy ?`<div style="color:${strategyGroupInfo.openPositionProfitInfo.profitPercentByBestPrices >= 0 ? 'green' : 'red'};margin-right: 10px;"> 
                ${strategyGroupInfo.openPositionProfitInfo.profitPercentByBestPrices.toLocaleString('en-US', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1
                })}
      </div>`:``}
      <button class="delete-btn">حذف</button>
    `;

    box.querySelector('.title').addEventListener('click',async ()=>{
      const groupWindow = await (omexLib && omexLib.openGroupInNewTab(strategyGroupInfo?.group?.name,'https://khobregan.tsetab.ir'));



    })

    setupHoldToDelete(box.querySelector('.delete-btn'), index);
    list.appendChild(box);
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
