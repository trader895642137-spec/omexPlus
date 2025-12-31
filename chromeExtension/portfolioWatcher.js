// const port = chrome.runtime.connect({ name: "CHILD_PAGE" });

// port.onMessage.addListener((data) => {
//   console.log("📥 Data from parent:", data);

//   // استفاده کن
//   document.body.innerHTML = `
//     <pre>${JSON.stringify(data, null, 2)}</pre>
//   `;
// });


console.log('child')
try {
    const port = chrome.runtime.connect({ name: "CHILD_PAGE" });
    port.onMessage.addListener(data =>{
        console.log(data)
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

let strategyGroupInfoList = [];

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
  try {
    const data = JSON.parse(input.value);

    // if (!data.title || data.profit == null || data.loss == null) {
    //   throw new Error('invalid');
    // }

    if(Array.isArray(data)){

        strategyGroupInfoList = strategyGroupInfoList.concat(data)
    }else{

        strategyGroupInfoList.push(data);
    }

    renderStrategies();
    modal.style.display = 'none';

  } catch (err){
    console.err(err)
    alert('خطا');
  }
});

/* ---------- render ---------- */
function renderStrategies() {
  list.innerHTML = '';

  strategyGroupInfoList.forEach((strategyGroupInfo, index) => {
    const box = document.createElement('div');
    box.className = 'strategy-box';

    box.innerHTML = `
      <h4>${strategyGroupInfo.group.name}</h4>
      <button class="delete-btn">حذف</button>
    `;

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
