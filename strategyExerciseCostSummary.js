// strategySummary.js

const STYLE_ID = "strategy-summary-style";
const MODAL_ID = "strategy-summary-modal";

// ===== تزریق CSS فقط یک بار =====
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .ss-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      animation: ss-fade 0.2s ease;
    }

    @keyframes ss-fade {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    .ss-modal {
      background: #fff;
      border-radius: 14px;
      padding: 20px;
      width: 90%;
      max-width: 560px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 10px 40px rgba(0,0,0,0.25);
      font-family: Tahoma, sans-serif;
      direction: rtl;
      animation: ss-slide 0.2s ease;
    }

    @keyframes ss-slide {
      from {
        transform: translateY(-10px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .ss-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .ss-header h2 {
      margin: 0;
      font-size: 17px;
      color: #111827;
    }

    .ss-close {
      background: none;
      border: none;
      font-size: 22px;
      color: #9ca3af;
      cursor: pointer;
      line-height: 1;
    }

    .ss-close:hover {
      color: #374151;
    }

    .ss-group {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 12px;
      background: #f9fafb;
    }

    .ss-group-title {
      font-weight: bold;
      color: #1d4ed8;
      margin-bottom: 10px;
      font-size: 15px;
    }

    .ss-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      font-size: 13px;
    }

    .ss-label {
      color: #6b7280;
      margin-bottom: 4px;
    }

    .ss-value {
      font-weight: bold;
      color: #111827;
    }

    .ss-empty {
      text-align: center;
      color: #9ca3af;
      padding: 20px;
    }
  `;

  document.head.appendChild(style);
}

// ===== ساخت HTML مودال =====
function buildModalHTML() {
  return `
    <div class="ss-overlay" id="${MODAL_ID}">
      <div class="ss-modal">
        <div class="ss-header">
          <h2>خلاصه هزینه اعمال بر اساس سررسید</h2>
          <button class="ss-close" data-ss-close>&times;</button>
        </div>

        <div class="ss-content"></div>
      </div>
    </div>
  `;
}

// ===== پر کردن محتوا =====
function renderContent(modal, exerciseCostBySettlement) {
  const content = modal.querySelector(".ss-content");

  if (!exerciseCostBySettlement?.length) {
    content.innerHTML = `
      <div class="ss-empty">
        داده‌ای موجود نیست
      </div>
    `;
    return;
  }

  const sortedData = [...exerciseCostBySettlement].sort(
    (a, b) =>
      a.daysLeftToSettlement - b.daysLeftToSettlement
  );

  content.innerHTML = sortedData.map(item => `
    <div class="ss-group">

      <div class="ss-group-title">
        ${item.daysLeftToSettlement} روز تا تسویه
      </div>

      <div class="ss-grid">

        <div>
          <div class="ss-label">
            مجموع هزینه اعمال
          </div>

          <div class="ss-value">
            ${(item.exerciseCost || 0).toLocaleString("fa-IR")}
          </div>
        </div>

        <div>
          <div class="ss-label">
            تعداد موقعیت‌ها
          </div>

          <div class="ss-value">
            ${(item.positionCount || 0).toLocaleString("fa-IR")}
          </div>
        </div>

      </div>
    </div>
  `).join("");
}

// ===== تابع اصلی =====
export function showStrategyExerciseCostSummary(
  exerciseCostBySettlement
) {
  injectStyles();

  // اگر قبلاً باز بود، پاک کن
  const existing = document.getElementById(MODAL_ID);
  if (existing) existing.remove();

  // ساخت و اضافه کردن مودال
  const wrapper = document.createElement("div");
  wrapper.innerHTML = buildModalHTML().trim();

  const modal = wrapper.firstElementChild;
  document.body.appendChild(modal);

  // رندر محتوا
  renderContent(modal, exerciseCostBySettlement);

  // بستن
  const close = () => {
    modal.remove();
    document.removeEventListener("keydown", onKey);
  };

  modal
    .querySelector("[data-ss-close]")
    .addEventListener("click", close);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  const onKey = (e) => {
    if (e.key === "Escape") close();
  };

  document.addEventListener("keydown", onKey);

  return close;
}