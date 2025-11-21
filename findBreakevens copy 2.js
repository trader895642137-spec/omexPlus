function intrinsic(option, S) {
  const { isCall, strikePrice } = option;
  if (isCall) return Math.max(0, S - strikePrice);
  return Math.max(0, strikePrice - S); // put
}

function optionPL(option, S, multiplier = 1,getPrice) {
  const q = option.getQuantity() ?? 1;
  const intr = intrinsic(option, S);
  // For long: payoff = intrinsic - premium
  // For short: payoff = premium - intrinsic
  const base = option.isBuy  ? (intr - getPrice(option) ) : (getPrice(option)  - intr);
  return base * q * multiplier;
}

function totalPL(positions, S, multiplier = 1,getPrice) {
  return positions.reduce((sum, pos) => sum + optionPL(pos, S, multiplier,getPrice), 0);
}

/**
 * findBreakevenList:
 * - positions: array of positions
 * - opts: { multiplier, sMin, sMax, tol, maxIter }
 *
 * Strategy:
 * - جمع همه strikePrice ها -> نقاط شکست (breakpoints)
 * - اضافه کردن یک حد پایین (sMin) و بالا (sMax)
 * - در هر بازه بین دو breakpoint، تابع P/L خطی است؛ اگر علامت مقادیر سرِ دو سر متفاوت باشه،
 *   از بای‌سکشن برای پیدا کردن ریشه استفاده می‌کنیم.
 *
 * Returns: array of numeric breakeven prices (sorted, ممکنه خالی باشه)
 */
export function findBreakevenList({positions,getPrice, opts = {}}) {
  const multiplier = opts.multiplier ?? 1;
  const tol = opts.tol ?? 1e-6;
  const maxIter = opts.maxIter ?? 100;
  const Ks = positions.map(p => p.strikePrice).filter(k => Number.isFinite(k));
  const minK = Ks.length ? Math.min(...Ks) : 0;
  const maxK = Ks.length ? Math.max(...Ks) : 1000;

  const sMin = (opts.sMin !== undefined) ? opts.sMin : Math.max(0, minK - (maxK - minK) * 2 - 1000);
  const sMax = (opts.sMax !== undefined) ? opts.sMax : maxK + (maxK - minK) * 2 + 1000;

  // breakpoints: sorted unique [sMin, ...Ks..., sMax]
  const uniq = Array.from(new Set([sMin, ...Ks, sMax])).sort((a, b) => a - b);

  const values = (s) => totalPL(positions, s, multiplier,getPrice);

  const roots = new Set();

  // Check exact zeros at breakpoints (useful if exactly zero at strikePrice)
  for (const s of uniq) {
    const v = values(s);
    if (Math.abs(v) <= tol) roots.add(Number(s.toFixed(8)));
  }

  // For each interval between successive breakpoints, look for sign changes
  for (let i = 0; i < uniq.length - 1; i++) {
    let a = uniq[i], b = uniq[i + 1];
    let fa = values(a), fb = values(b);

    // if either endpoint is exactly zero we've already added it
    if (Math.abs(fa) <= tol || Math.abs(fb) <= tol) continue;

    if (fa * fb > 0) {
      // no sign change -> skip (no root inside by continuity & piecewise-linearity)
      continue;
    }

    // Bisection (fa and fb have opposite signs)
    let left = a, right = b;
    let fl = fa, fr = fb;
    let mid, fm;
    let iter = 0;
    while (iter < maxIter && (right - left) > tol) {
      mid = (left + right) / 2;
      fm = values(mid);
      if (Math.abs(fm) <= tol) {
        roots.add(Number(mid.toFixed(8)));
        break;
      }
      // decide side
      if (fl * fm < 0) {
        right = mid; fr = fm;
      } else {
        left = mid; fl = fm;
      }
      iter++;
    }
    if (iter >= maxIter) {
      // if we didn't converge but last mid exists, add approx
      if (mid !== undefined) roots.add(Number(((left + right) / 2).toFixed(8)));
    } else if (mid !== undefined) {
      roots.add(Number(mid.toFixed(8)));
    }
  }

  // return sorted array
  return Array.from(roots).sort((a, b) => a - b);
}

/* ------------------ مثال استفاده ------------------ */
// const examplePositions = [
//   {isCall:true, isBuy: true, strikePrice: 34000, getPrice:()=> 844 , getQuantity:()=> 0.97 },
//   {isCall:true, isBuy: false, strikePrice: 13000, getPrice:()=> 14910 , getQuantity:()=> 0.97  },
//   { isPut:true,  isBuy: false, strikePrice: 34000, getPrice:()=> 6760, getQuantity:()=> 1 }
// ];


// findBreakevenList({positions:examplePositions, opts:{ multiplier: 1 } , getPrice:(position)=>position.getPrice()})

// console.log('P/L at S=1900:', totalPL(examplePositions, 1900));
// console.log('P/L at S=2100:', totalPL(examplePositions, 2100));
// console.log('Breakevens:', findBreakevenList(examplePositions, { multiplier: 1 }));