export function findBreakevenList({positions,getPrice}) {
  // تابع که مجموع P/L را در قیمت مشخص حساب می‌کند
  function totalPL(price) {
    let tot = 0;
    for (const p of positions) {
      const qty = (p.getQuantity ? p.getQuantity() : (p.quantity ?? 1));
      const premiumTotal = (getPrice ? getPrice(p) : (p.premium ?? 0)) * qty;
      let intrinsic = 0;
      if (p.isCall) intrinsic = Math.max(0, price - p.strikePrice) * qty;
      else if (p.isPut) intrinsic = Math.max(0, p.strikePrice - price) * qty;

      const pnl = p.isBuy ? (intrinsic - premiumTotal) : (premiumTotal - intrinsic);
      tot += pnl;
    }
    return tot;
  }

  // breakpoints = همه strike ها (مرتب)
  const strikes = [...new Set(positions.map(p => p.strikePrice))].sort((a, b) => a - b);
  if (strikes.length === 0) return [];

  // نقاطی که بین‌شون خطی‌سازی می‌کنیم: صریحاً همه strikeها + یک نقطه پایین و بالا
  const leftExtreme = strikes[0] - 10000;   // این مقدار بزرگ انتخاب شده تا دامنهٔ سمت چپ پوشش داده شود
  const rightExtreme = strikes[strikes.length - 1] + 10000; // و همین برای سمت راست
  const points = [leftExtreme, ...strikes, rightExtreme];

  const roots = new Set();
  const tol = 1e-9;

  // برای هر بازه بین نقاط، اگر علامت P/L تغییر کنه، ریشه را با فرمول خطی محاسبه کن
  for (let i = 0; i < points.length - 1; i++) {
    const x1 = points[i], x2 = points[i + 1];
    const y1 = totalPL(x1), y2 = totalPL(x2);

    // اگر دقیقاً یکی از نقاط صفر باشه، اضافه کن
    if (Math.abs(y1) <= tol) roots.add(Number(x1.toFixed(8)));
    if (Math.abs(y2) <= tol) roots.add(Number(x2.toFixed(8)));

    // اگر علامت متفاوت باشه، ریشه داخل بازه است -> حل خطی
    if (y1 * y2 < 0) {
      const x = x1 - y1 * (x2 - x1) / (y2 - y1);
      roots.add(Number(x.toFixed(8)));
    }
  }

  // ---------- بررسی تحلیلی دم راست (S > maxStrike) ----------
  // برای S > maxStrike: put ها intrinsic = 0، call ها intrinsic = S - K
  // بنابراین totalPL(S) = aR * S + bR  (خطی). اگر aR != 0، ریشه = -bR / aR
  (function checkRightTail() {
    const maxK = strikes[strikes.length - 1];
    let aR = 0, bR = 0;
    for (const p of positions) {
      const qty = (p.getQuantity ? p.getQuantity() : (p.quantity ?? 1));
      const prem = (getPrice ? getPrice(p) : (p.premium ?? 0));
      const K = p.strikePrice;

      if (p.isCall) {
        // intrinsic = S - K
        if (p.isBuy) {
          // long call: (S-K) - prem  => +1*S + (-(K+prem))
          aR += 1 * qty;
          bR += (-(K + prem)) * qty;
        } else {
          // short call: prem - (S-K) => -1*S + (K + prem)
          aR += -1 * qty;
          bR += (K + prem) * qty;
        }
      } else {
        // put -> intrinsic = 0 in right tail
        if (p.isBuy) bR += (-prem) * qty;
        else bR += (prem) * qty;
      }
    }
    if (Math.abs(aR) > 1e-12) {
      const root = -bR / aR;
      if (root > maxK + 1e-9) roots.add(Number(root.toFixed(8)));
    }
  })();

  // ---------- بررسی تحلیلی دم چپ (S < minStrike) ----------
  // برای S < minStrike: call ها intrinsic = 0، put ها intrinsic = K - S
  // totalPL(S) = aL * S + bL
  (function checkLeftTail() {
    const minK = strikes[0];
    let aL = 0, bL = 0;
    for (const p of positions) {
      const qty = (p.getQuantity ? p.getQuantity() : (p.quantity ?? 1));
      const prem = (getPrice ? getPrice(p) : (p.premium ?? 0));
      const K = p.strikePrice;

      if (p.isPut) {
        // intrinsic = K - S  => contributes -1*S + K
        if (p.isBuy) {
          // long put: (K - S) - prem => -1*S + (K - prem)
          aL += -1 * qty;
          bL += (K - prem) * qty;
        } else {
          // short put: prem - (K - S) => +1*S + (prem - K)
          aL += 1 * qty;
          bL += (prem - K) * qty;
        }
      } else {
        // call intrinsic = 0
        if (p.isBuy) bL += (-prem) * qty;
        else bL += (prem) * qty;
      }
    }
    if (Math.abs(aL) > 1e-12) {
      const root = -bL / aL;
      if (root < minK - 1e-9) roots.add(Number(root.toFixed(8)));
    }
  })();

  // بازگرداندن آرایه مرتب از ریشه‌ها (نقاط سر به سر)
  return Array.from(roots).map(x => Number(x)).sort((a, b) => a - b);
}

// const examplePositions = [
//   { isCall: true, isBuy: true, strikePrice: 500, getPrice: () => 20, getQuantity: () => 10 },
//   { isPut: true, isBuy: false, strikePrice: 500, getPrice: () => 33, getQuantity: () => 10 },
//   { isCall: true, isBuy: false, strikePrice: 400, getPrice: () => 90, getQuantity: () => 10 },

// ];

// console.log(findBreakevenList({positions:examplePositions, getPrice:(p)=>p.getPrice()}));