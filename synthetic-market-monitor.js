
/**
 * Synthetic Market Monitor
 *
 * Usage:
 *
 * import {
 *   mountSyntheticMarketButton,
 *   openSyntheticMarketModal,
 *   aggregateSyntheticMarkets
 * } from "./synthetic-market-monitor.js";
 *
 * mountSyntheticMarketButton({
 *   container: document.querySelector("#syntheticMonitorButton"),
 *   getPositions: () => [
 *     ...syntheticBuyPositions,
 *     ...syntheticSellPositions
 *   ],
 *   thresholdPercent: 5,
 *   maxAlternatives: 3
 * });
 */

const STYLE_ID = "synthetic-market-monitor-styles";

const DEFAULTS = {
    thresholdPercent: 5,
    maxAlternatives: 3,
    buttonText: "رصد مظنه‌های مصنوعی",
    title: "رصد بازار مصنوعی"
};

const numberOrNull = value => {
    if (value === null || value === undefined || value === "") return null;

    const n = Number(value);

    return Number.isFinite(n) ? n : null;
};

const getLegs = strategy =>
    Array.isArray(strategy?.strategyPositions) &&
    strategy.strategyPositions.length
        ? strategy.strategyPositions
        : Array.isArray(strategy?.positions)
            ? strategy.positions
            : [];

function getStockSymbol(strategy, legs) {
    return (
        strategy?.option?.optionDetails?.stockSymbol ??
        strategy?.option?.optionDetails?.stockSymbolDetails?.symbol ??
        legs.find(x => x?.optionDetails?.stockSymbol)
            ?.optionDetails?.stockSymbol ??
        legs.find(x => x?.optionDetails?.stockSymbolDetails?.symbol)
            ?.optionDetails?.stockSymbolDetails?.symbol ??
        null
    );
}

function getStockName(strategy, legs) {
    return (
        strategy?.option?.optionDetails?.stockSymbolDetails?.name ??
        legs.find(x => x?.optionDetails?.stockSymbolDetails?.name)
            ?.optionDetails?.stockSymbolDetails?.name ??
        getStockSymbol(strategy, legs) ??
        "نامشخص"
    );
}

function getStockPrice(strategy, legs) {
    return (
        numberOrNull(strategy?.currentStockPrice) ??
        numberOrNull(
            strategy?.option?.optionDetails?.stockSymbolDetails?.close
        ) ??
        numberOrNull(
            legs.find(x => x?.optionDetails?.stockSymbolDetails?.close)
                ?.optionDetails?.stockSymbolDetails?.close
        )
    );
}

function getStrike(strategy, legs) {
    return (
        numberOrNull(strategy?.option?.strikePrice) ??
        numberOrNull(strategy?.option?.optionDetails?.strikePrice) ??
        numberOrNull(
            legs.find(x => numberOrNull(x?.strikePrice) !== null)?.strikePrice
        ) ??
        numberOrNull(
            legs.find(x =>
                numberOrNull(x?.optionDetails?.strikePrice) !== null
            )?.optionDetails?.strikePrice
        )
    );
}

function getDirection(strategy, legs) {
    const title = String(
        strategy?.strategyTypeTitle ?? ""
    ).toLowerCase();

    if (
        title.includes("syntheticbuy") ||
        title.includes("synthetic_buy")
    ) return "buy";

    if (
        title.includes("syntheticsell") ||
        title.includes("synthetic_sell")
    ) return "sell";

    const call = legs.find(x => x?.isCall);
    const put = legs.find(x => x?.isPut);

    if (!call || !put) return null;

    if (call.isBuy === true && put.isSell === true) return "buy";

    if (call.isSell === true && put.isBuy === true) return "sell";

    return null;
}

function getSyntheticPrice(strategy, legs, direction, strike) {
    // اولویت با نقطه سر به سر محاسبه شده توسط اسکنر است.
    const existing = numberOrNull(strategy?.breakeven);

    if (existing !== null && existing > 0) {
        return existing;
    }

    const call = legs.find(x => x?.isCall);
    const put = legs.find(x => x?.isPut);

    if (!call || !put || strike === null) return null;

    const callPrice = direction === "buy"
        ? numberOrNull(call.bestSell)
        : numberOrNull(call.bestBuy);

    const putPrice = direction === "buy"
        ? numberOrNull(put.bestBuy)
        : numberOrNull(put.bestSell);

    if (
        callPrice === null ||
        putPrice === null ||
        callPrice <= 0 ||
        putPrice <= 0
    ) {
        return null;
    }

    return strike + callPrice - putPrice;
}

function getExpiry(strategy, legs) {
    return (
        strategy?.option?.optionDetails?.date ??
        legs.find(x => x?.optionDetails?.date)
            ?.optionDetails?.date ??
        null
    );
}

function getLiquidity(strategy, legs) {
    const call = legs.find(x => x?.isCall);
    const put = legs.find(x => x?.isPut);

    if (!call || !put) return null;

    const callQ = numberOrNull(
        call.isBuy ? call.bestSellQ : call.bestBuyQ
    );

    const putQ = numberOrNull(
        put.isBuy ? put.bestSellQ : put.bestBuyQ
    );

    if (callQ === null || putQ === null) return null;

    return Math.min(callQ, putQ);
}
function getOptionContracts(strategy) {
    const legs = strategy.strategyPositions ?? [];

    const call = legs.find(x => x?.isCall);
    const put = legs.find(x => x?.isPut);

    if (!call || !put) return [];

    return [
        {
            symbol: call.option?.symbol ?? call.symbol ?? call.name,
            action: call.isBuy ? "BUY" : "SELL"
        },
        {
            symbol: put.option?.symbol ?? put.symbol ?? put.name,
            action: put.isBuy ? "BUY" : "SELL"
        }
    ].filter(x => x.symbol);
}

function normalizeStrategy(strategy) {
    const legs = getLegs(strategy);

    const direction = getDirection(strategy, legs);
    const stockSymbol = getStockSymbol(strategy, legs);
    const stockPrice = getStockPrice(strategy, legs);
    const strike = getStrike(strategy, legs);

    if (
        !direction ||
        !stockSymbol ||
        stockPrice === null ||
        strike === null
    ) {
        return null;
    }

    const price = getSyntheticPrice(
        strategy,
        legs,
        direction,
        strike
    );

    if (price === null || price <= 0) return null;

    return {
        source: strategy,
        direction,
        stockSymbol,
        stockName: getStockName(strategy, legs),
        stockPrice,
        strike,
        price,

        // فاصله قیمت اعمال تا قیمت سهم
        strikeDistance: Math.abs(strike - stockPrice),

        // فاصله قیمت مصنوعی تا قیمت سهم
        distancePercent:
            ((price - stockPrice) / stockPrice) * 100,

        expiry: getExpiry(strategy, legs),
        liquidity: getLiquidity(strategy, legs),
        optionContracts: getOptionContracts(strategy)
    };
}

function groupByStock(rows) {
    const groups = new Map();

    for (const row of rows) {
        if (!groups.has(row.stockSymbol)) {
            groups.set(row.stockSymbol, {
                stockSymbol: row.stockSymbol,
                stockName: row.stockName,
                stockPrice: row.stockPrice,
                buy: [],
                sell: []
            });
        }

        const group = groups.get(row.stockSymbol);

        group.stockPrice = row.stockPrice;

        group[row.direction].push(row);
    }

    return [...groups.values()];
}

function compareMainCandidate(a, b) {
    // اولویت اول: نزدیک‌ترین Strike به قیمت سهم
    // اولویت دوم: حجم مظنه در صورت برابری فاصله

    return (
        a.strikeDistance - b.strikeDistance ||
        (b.liquidity ?? -1) - (a.liquidity ?? -1)
    );
}

function summarizeDirection(
    rows,
    thresholdPercent,
    maxAlternatives
) {
    if (!rows.length) {
        return {
            main: null,
            nearbyCount: 0,
            alternatives: [],
            totalCount: 0
        };
    }

    const sorted = [...rows].sort(compareMainCandidate);

    const main = sorted[0];

    const different = sorted
        .slice(1)
        .map(row => ({
            ...row,

            differenceFromMainPercent:
                Math.abs(
                    (row.price - main.price) / main.price
                ) * 100
        }))
        .filter(
            row =>
                row.differenceFromMainPercent > thresholdPercent
        )
        .sort(
            (a, b) =>
                b.differenceFromMainPercent -
                a.differenceFromMainPercent
        );

    const nearbyCount =
        rows.length - 1 - different.length;

    return {
        main,

        nearbyCount: Math.max(0, nearbyCount),

        alternatives: different.slice(0, maxAlternatives),

        totalCount: rows.length,

        omittedAlternativeCount: Math.max(
            0,
            different.length - maxAlternatives
        )
    };
}

export function aggregateSyntheticMarkets(
    positions,
    {
        thresholdPercent = DEFAULTS.thresholdPercent,
        maxAlternatives = DEFAULTS.maxAlternatives
    } = {}
) {
    const rows = (
        Array.isArray(positions) ? positions : []
    )
        .map(normalizeStrategy)
        .filter(Boolean);

    return groupByStock(rows)
        .map(group => ({
            ...group,

            buy: summarizeDirection(
                group.buy,
                thresholdPercent,
                maxAlternatives
            ),

            sell: summarizeDirection(
                group.sell,
                thresholdPercent,
                maxAlternatives
            )
        }))
        .sort(
            (a, b) =>
                a.stockSymbol.localeCompare(b.stockSymbol, "fa")
        );
}

function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");

    style.id = STYLE_ID;

    style.textContent = `
        .smm-overlay {
            position: fixed;
            inset: 0;
            z-index: 2147483000;
            background: rgba(10,15,25,.58);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 18px;
            direction: rtl;
            font-family: inherit;
        }

        .smm-modal {
            width: min(980px,100%);
            max-height: min(88vh,900px);
            overflow: auto;
            background: var(--smm-bg,#fff);
            color: var(--smm-text,#18202b);
            border-radius: 14px;
            box-shadow: 0 18px 60px rgba(0,0,0,.28);
        }

        .smm-head {
            position: sticky;
            top: 0;
            background: inherit;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            border-bottom: 1px solid #e5e7eb;
        }

        .smm-head h2 {
            font-size: 17px;
            margin: 0;
            font-weight: 700;
        }

        .smm-close {
            border: 0;
            background: transparent;
            font-size: 25px;
            cursor: pointer;
            color: inherit;
            padding: 2px 8px;
        }

        .smm-toolbar {
            display: flex;
            gap: 12px;
            align-items: center;
            flex-wrap: wrap;
            padding: 12px 20px;
            color: #64748b;
            font-size: 12px;
        }

        .smm-content {
            padding: 0 16px 18px;
        }

        .smm-stock {
            border: 1px solid #e5e7eb;
            border-radius: 11px;
            margin-bottom: 12px;
            overflow: hidden;
        }

        .smm-stock-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            padding: 12px 14px;
            background: #f8fafc;
        }

        .smm-stock-title {
            font-weight: 700;
        }

        .smm-stock-price {
            font-size: 12px;
            color: #64748b;
        }

        .smm-directions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            padding: 10px;
        }

        .smm-direction {
            border: 1px solid #e5e7eb;
            border-radius: 9px;
            padding: 12px;
            min-width: 0;
        }

        .smm-direction h3 {
            font-size: 13px;
            margin: 0 0 10px;
        }

        .smm-main-price {
            font-size: 21px;
            font-weight: 750;
            direction: ltr;
            text-align: right;
        }

        .smm-distance {
            font-size: 12px;
            margin-top: 4px;
        }

        .smm-buy {
            color: #15803d;
        }

        .smm-sell {
            color: #b91c1c;
        }

        .smm-meta {
            font-size: 11px;
            color: #64748b;
            margin-top: 7px;
            line-height: 1.8;
        }

        .smm-alt {
            border-top: 1px dashed #e5e7eb;
            margin-top: 10px;
            padding-top: 9px;
        }

        .smm-alt-title {
            font-size: 11px;
            color: #64748b;
            margin-bottom: 6px;
        }

        .smm-alt-row {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            font-size: 12px;
            padding: 4px 0;
        }

        .smm-pill {
            display: inline-block;
            border-radius: 20px;
            padding: 2px 7px;
            background: #f1f5f9;
            color: #475569;
            font-size: 11px;
            white-space: nowrap;
        }

        .smm-empty {
            font-size: 12px;
            color: #94a3b8;
        }

        .smm-button {
            cursor: pointer;
            border: 0;
            border-radius: 8px;
            padding: 9px 14px;
            background: #2563eb;
            color: #fff;
            font: inherit;
            font-size: 13px;
        }

        .smm-button:hover {
            background: #1d4ed8;
        }

        @media(max-width:650px) {
            .smm-overlay {
                padding: 7px;
            }

            .smm-directions {
                grid-template-columns: 1fr;
            }

            .smm-stock-head {
                align-items: flex-start;
                flex-direction: column;
            }
        }
    `;

    document.head.appendChild(style);
}

const formatNumber = value =>
    new Intl.NumberFormat("fa-IR", {
        maximumFractionDigits: 0
    }).format(value);

const formatPercent = value =>
    `${value > 0 ? "+" : ""}${value.toFixed(2)}٪`;

function renderDirection(title, summary, kind) {
    const colorClass =
        kind === "buy" ? "smm-buy" : "smm-sell";

    if (!summary.main) {
        return `
            <section class="smm-direction">
                <h3>${title}</h3>
                <div class="smm-empty">
                    مظنه معتبر پیدا نشد
                </div>
            </section>
        `;
    }

    const main = summary.main;

    const alternatives = summary.alternatives
        .map(row => `
            <div class="smm-alt-row">
                <span>
                    ${formatNumber(row.price)}
                    <span class="smm-pill">
                        ${row.expiry
                            ? `سررسید ${row.expiry}`
                            : "سررسید نامشخص"}
                    </span>
                </span>

                <span>
                    ${formatPercent(row.distancePercent)} از سهم
                </span>
            </div>
            <div class="smm-contracts">
                ${row.optionContracts?.map(contract => `
                    <div>
                        ${contract.action === "BUY" ? "خرید" : "فروش"}
                        ${contract.symbol}
                    </div>
                `).join("") ?? ""}
            </div>

            

            <div class="smm-meta">
                اختلاف با مظنه اصلی:
                ${row.differenceFromMainPercent.toFixed(2)}٪
                · Strike: ${formatNumber(row.strike)}
            </div>
        `)
        .join("");

    return `
        <section class="smm-direction">

            <h3>${title}</h3>

            <div class="smm-main-price ${colorClass}">
                ${formatNumber(main.price)}
            </div>

            <div class="smm-distance ${colorClass}">
                ${formatPercent(main.distancePercent)}
                نسبت به قیمت سهم
            </div>

            <div class="smm-contracts">
                ${main.optionContracts?.map(contract => `
                    <div>
                        ${contract.action === "BUY" ? "خرید" : "فروش"}
                        ${contract.symbol}
                    </div>
                `).join("") ?? ""}
            </div>

            <div class="smm-meta">
                Strike: ${formatNumber(main.strike)}
                · فاصله Strike تا سهم:
                ${formatNumber(main.strikeDistance)}

                ${main.expiry
                    ? ` · سررسید: ${main.expiry}`
                    : ""}

                ${main.liquidity !== null
                    ? ` · حجم مؤثر مظنه: ${formatNumber(main.liquidity)}`
                    : ""}
            </div>

            <div class="smm-alt">

                <div class="smm-alt-title">
                    موقعیت‌های با اختلاف بیش از آستانه
                    · ${summary.alternatives.length} مورد نمایش
                </div>

                ${alternatives ||
                    `<div class="smm-empty">
                        مورد متفاوتی وجود ندارد
                    </div>`}

                ${summary.omittedAlternativeCount
                    ? `<div class="smm-meta">
                        و ${formatNumber(summary.omittedAlternativeCount)}
                        مورد دیگر که نمایش داده نشده‌اند
                    </div>`
                    : ""}

            </div>

        </section>
    `;
}

function renderMarkets(markets) {
    if (!markets.length) {
        return `
            <div class="smm-empty"
                 style="padding:24px;text-align:center">
                موقعیت معتبر خرید یا فروش مصنوعی پیدا نشد.
            </div>
        `;
    }

    return markets
        .map(group => `
            <article class="smm-stock">

                <header class="smm-stock-head">

                    <div class="smm-stock-title">
                        ${group.stockSymbol}
                        <span class="smm-stock-price">
                            ${group.stockName}
                        </span>
                    </div>

                    <div class="smm-stock-price">
                        قیمت سهم:
                        ${formatNumber(group.stockPrice)}
                    </div>

                </header>

                <div class="smm-directions">

                    ${renderDirection(
                        "خرید مصنوعی · خرید کال / فروش پوت",
                        group.buy,
                        "buy"
                    )}

                    ${renderDirection(
                        "فروش مصنوعی · فروش کال / خرید پوت",
                        group.sell,
                        "sell"
                    )}

                </div>

            </article>
        `)
        .join("");
}


let activeSyntheticModal = null;
let syntheticMonitorButton = null;

export function openSyntheticMarketModal(
    getPositions,
    {
        thresholdPercent = 5,
        maxAlternatives = 3,
        title = "رصد بازار مصنوعی",
        refreshInterval = 2000
    } = {}
) {
    injectStyles();

    // اگر مدال قبلی باز است، ابتدا ببند.
    activeSyntheticModal?.close();

    const overlay = document.createElement("div");
    overlay.className = "smm-overlay";

    overlay.innerHTML = `
        <div class="smm-modal"
             role="dialog"
             aria-modal="true">

            <div class="smm-head">
                <h2>${title}</h2>

                <button type="button"
                        class="smm-close"
                        aria-label="بستن">
                    ×
                </button>
            </div>

            <div class="smm-toolbar">
                <span>
                    مظنه اصلی بر اساس نزدیک‌ترین Strike
                    به قیمت سهم انتخاب می‌شود.
                </span>

                <span class="smm-pill">
                    آستانه اختلاف: ${thresholdPercent}٪
                </span>

                <span class="smm-refresh-time"></span>
            </div>

            <div class="smm-content"></div>
        </div>
    `;

    document.body.appendChild(overlay);

    let closed = false;
    let intervalId = null;

    const content = overlay.querySelector(".smm-content");
    const refreshTime = overlay.querySelector(".smm-refresh-time");

    function refresh() {
        if (closed) return;

        try {
            // هر بار جدیدترین آرایه‌ها خوانده می‌شوند.
            const positions = getPositions();

            const markets = aggregateSyntheticMarkets(
                positions,
                {
                    thresholdPercent,
                    maxAlternatives
                }
            );

            content.innerHTML = renderMarkets(markets);

            refreshTime.textContent =
                `آخرین بروزرسانی: ${new Date().toLocaleTimeString("fa-IR")}`;

        } catch (error) {
            console.error("Synthetic monitor refresh error:", error);
        }
    }

    function close() {
        if (closed) return;

        closed = true;

        clearInterval(intervalId);

        document.removeEventListener("keydown", onKeyDown);

        overlay.remove();

        if (activeSyntheticModal?.overlay === overlay) {
            activeSyntheticModal = null;
        }
    }

    function onKeyDown(event) {
        if (event.key === "Escape") {
            close();
        }
    }

    overlay.addEventListener("click", event => {
        if (
            event.target === overlay ||
            event.target.closest(".smm-close")
        ) {
            close();
        }
    });

    document.addEventListener("keydown", onKeyDown);

    // اولین بروزرسانی بلافاصله انجام می‌شود.
    refresh();

    // در زمان باز بودن مدال، هر ۲ ثانیه بروزرسانی می‌شود.
    if (refreshInterval > 0) {
        intervalId = setInterval(refresh, refreshInterval);
    }

    activeSyntheticModal = {
        overlay,
        close,
        refresh
    };

    return activeSyntheticModal;
}


/**
 * فقط یک بار فراخوانی شود.
 * دکمه به صورت خودکار به body اضافه می‌شود.
 */
export function initSyntheticMarketMonitor({
    getPositions,
    thresholdPercent = 5,
    maxAlternatives = 3,
    refreshInterval = 2000,
    buttonText = "رصد مظنه‌های مصنوعی",
    title = "رصد بازار مصنوعی"
} = {}) {

    if (typeof getPositions !== "function") {
        throw new TypeError(
            "getPositions باید تابعی باشد که آخرین موقعیت‌ها را برگرداند."
        );
    }

    // جلوگیری از ساخت دکمه تکراری
    syntheticMonitorButton?.remove();

    const button = document.createElement("button");

    button.type = "button";
    button.className = "smm-button";

    button.textContent = buttonText;

    // محل قرارگیری دکمه؛ پایین سمت چپ صفحه
    Object.assign(button.style, {
        position: "fixed",
        bottom: "24px",
        left: "24px",
        zIndex: "2147482000"
    });

    button.addEventListener("click", () => {
        openSyntheticMarketModal(
            getPositions,
            {
                thresholdPercent,
                maxAlternatives,
                refreshInterval,
                title
            }
        );
    });

    document.body.appendChild(button);

    syntheticMonitorButton = button;

    return {
        button,

        destroy() {
            activeSyntheticModal?.close();

            button.remove();

            if (syntheticMonitorButton === button) {
                syntheticMonitorButton = null;
            }
        }
    };
}
