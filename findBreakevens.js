export function findBreakevenList({ positions, getPrice }) {
  if (!Array.isArray(positions) || !positions.length) return [];

  const getPositionQuantity = p =>
    p.getQuantity ? p.getQuantity() : (p.quantity ?? 1);

  const getPositionPrice = p =>
    getPrice ? getPrice(p) : (p.premium ?? 0);

  function totalPL(price) {
    let total = 0;

    for (const p of positions) {
      const qty = getPositionQuantity(p);
      const entryPrice = getPositionPrice(p);

      if (!Number.isFinite(qty) || !Number.isFinite(entryPrice)) {
        continue;
      }

      // پوزیشن سهم
      if (!p.isCall && !p.isPut) {
        total += (p.isBuy ? 1 : -1) * (price - entryPrice) * qty;
        continue;
      }

      // پوزیشن اختیار معامله
      const premiumTotal = entryPrice * qty;

      let intrinsic = 0;

      if (p.isCall) {
        intrinsic = Math.max(0, price - p.strikePrice) * qty;
      } else if (p.isPut) {
        intrinsic = Math.max(0, p.strikePrice - price) * qty;
      }

      total += p.isBuy
        ? intrinsic - premiumTotal
        : premiumTotal - intrinsic;
    }

    return total;
  }

  // فقط Strikeهای اختیار معامله؛ سهم Strike ندارد.
  const strikes = [
    ...new Set(
      positions
        .filter(p => p.isCall || p.isPut)
        .map(p => p.strikePrice)
        .filter(Number.isFinite)
    )
  ].sort((a, b) => a - b);

  if (!strikes.length) return [];

  const roots = new Set();
  const tol = 1e-9;

  const addRoot = price => {
    if (Number.isFinite(price)) {
      roots.add(Number(price.toFixed(8)));
    }
  };

  // بررسی نقاط شکست و بازه‌های بین Strikeها
  for (const strike of strikes) {
    if (Math.abs(totalPL(strike)) <= tol) {
      addRoot(strike);
    }
  }

  for (let i = 0; i < strikes.length - 1; i++) {
    const x1 = strikes[i];
    const x2 = strikes[i + 1];

    const y1 = totalPL(x1);
    const y2 = totalPL(x2);

    if (Math.abs(y1) <= tol) addRoot(x1);
    if (Math.abs(y2) <= tol) addRoot(x2);

    if ((y1 < 0 && y2 > 0) || (y1 > 0 && y2 < 0)) {
      const root = x1 - (y1 * (x2 - x1)) / (y2 - y1);
      addRoot(root);
    }
  }

  // بررسی Tail چپ: قیمت کمتر از کمترین Strike
  {
    const minStrike = strikes[0];

    const x1 = minStrike - 1;
    const x2 = minStrike - 2;

    const y1 = totalPL(x1);
    const y2 = totalPL(x2);

    const slope = (y2 - y1) / (x2 - x1);

    if (Math.abs(slope) > tol) {
      const root = x1 - y1 / slope;

      if (root < minStrike) {
        addRoot(root);
      }
    }
  }

  // بررسی Tail راست: قیمت بیشتر از بیشترین Strike
  {
    const maxStrike = strikes[strikes.length - 1];

    const x1 = maxStrike + 1;
    const x2 = maxStrike + 2;

    const y1 = totalPL(x1);
    const y2 = totalPL(x2);

    const slope = (y2 - y1) / (x2 - x1);

    if (Math.abs(slope) > tol) {
      const root = x1 - y1 / slope;

      if (root > maxStrike) {
        addRoot(root);
      }
    }
  }

  return Array.from(roots).sort((a, b) => a - b);
}