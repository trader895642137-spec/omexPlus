var tseOptionStrategiesLib;
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   COMMISSION_FACTOR: () => (/* binding */ COMMISSION_FACTOR),
/* harmony export */   configs: () => (/* binding */ configs),
/* harmony export */   getCommissionFactor: () => (/* binding */ getCommissionFactor),
/* harmony export */   getNearSettlementPrice: () => (/* binding */ getNearSettlementPrice),
/* harmony export */   hasGreaterRatio: () => (/* binding */ hasGreaterRatio),
/* harmony export */   isTaxFree: () => (/* binding */ isTaxFree),
/* harmony export */   mainTotalOffsetGainCalculator: () => (/* binding */ mainTotalOffsetGainCalculator),
/* harmony export */   totalCostCalculator: () => (/* binding */ totalCostCalculator)
/* harmony export */ });
const COMMISSION_FACTOR = {
  OPTION: {
    BUY: 0.00103,
    SELL: 0.00103,
    SETTLEMENT: {
      BUY: 0.0005,
      SELL: 0.0055,
      SELL_TAX: 0.005,
      EXERCISE_FEE: 0.0005,
      TAX_FREE_SELL: 0.0005,
    }
  },
  STOCK: {
    BUY: 0.003712,
    SELL: 0.0088
  },
  ETF: {
    BUY: 0.00116,
    SELL: 0.001875
  }
}

const configs = {
  stockPriceForCallFactor: 0.98,
  stockPriceForPutFactor: 0.98
}




const isTaxFree = (_strategyPosition) => {
  const TAX_FREE_NAMES = ['ضهرم', 'طهرم', 'ضتوان', 'طتوان', 'ضموج', 'طموج'];

  return TAX_FREE_NAMES.some(taxFreeName => _strategyPosition.instrumentName.includes(taxFreeName))

}
const getCommissionFactor = (_strategyPosition) => {
  if (_strategyPosition.isOption) {
    return COMMISSION_FACTOR.OPTION
  }

  if (_strategyPosition.isETF) {
    return COMMISSION_FACTOR.ETF
  }

  return COMMISSION_FACTOR.STOCK
}




const totalCostCalculator = ({ strategyPositions, getPrice, getQuantity } = {}) => {
  let totalCost = strategyPositions.reduce((sum, _strategyPosition) => {
    const price = getPrice(_strategyPosition);
    if (!price)
      return NaN

    const isBuy = _strategyPosition.isBuy;

    const priceWithSideSign = price * (isBuy ? -1 : 1);

    const quantity = getQuantity ? getQuantity(_strategyPosition, strategyPositions) : _strategyPosition.getQuantity();

    const commissionFactor = getCommissionFactor(_strategyPosition)[isBuy ? 'BUY' : 'SELL'];

    const requiredMargin = _strategyPosition.getRequiredMargin();

    const reservedMargin = requiredMargin ? (requiredMargin * quantity) : 0;

    const _totalCost = (priceWithSideSign * quantity) - reservedMargin - (price * quantity * commissionFactor);
    return sum + _totalCost
  }
    , 0);

  totalCost = totalCost < 0 ? Math.floor(totalCost) : Math.ceil(totalCost);

  return totalCost
}





const mainTotalOffsetGainCalculator = ({ strategyPositions, getBestPriceCb, getQuantity, getReservedMargin }) => {
  return strategyPositions.reduce((sum, _strategyPosition, index) => {
    const price = getBestPriceCb(_strategyPosition);

    const isBuy = _strategyPosition.isBuy;
    const quantity = getQuantity ? getQuantity(_strategyPosition, strategyPositions) : _strategyPosition.getQuantity();

    const commissionFactor = getCommissionFactor(_strategyPosition)[isBuy ? 'SELL' : 'BUY'];

    const priceWithSideSign = price * (isBuy ? 1 : -1);

    const reservedMargin = getReservedMargin(_strategyPosition, strategyPositions);

    const _totalOffsetGain = (priceWithSideSign * quantity) + reservedMargin - (price * quantity * commissionFactor);
    return sum + _totalOffsetGain
  }
    , 0);
}


const getNearSettlementPrice = ({strategyPosition,stockPrice}) => {

  const tradeFee = strategyPosition.isBuy ? COMMISSION_FACTOR.OPTION.BUY : COMMISSION_FACTOR.OPTION.SELL;
  const exerciseFee = COMMISSION_FACTOR.OPTION.SETTLEMENT.EXERCISE_FEE
  const tax = isTaxFree(strategyPosition) ? 0 : COMMISSION_FACTOR.OPTION.SETTLEMENT.SELL_TAX;


  function calculateCallPrice(stockPrice, strikePrice) {
    if (stockPrice <= strikePrice) return 0
    return ((stockPrice * configs.stockPriceForCallFactor) - (stockPrice * tax) - (strikePrice * (1 + exerciseFee))) / (1 + tradeFee);
  }

  function calculatePutPrice(stockPrice, strikePrice) {
    if (stockPrice >= strikePrice) return 0
    return (strikePrice * (1 - tax - exerciseFee) - (stockPrice / configs.stockPriceForPutFactor)) / (1 + tradeFee);
  }

  const price = strategyPosition.isCall ? calculateCallPrice(stockPrice, strategyPosition.strikePrice) : calculatePutPrice(stockPrice, strategyPosition.strikePrice)
  return price > 0 ? price : 0
}




const hasGreaterRatio=({num1,num2,properRatio=100})=> {
    if (num2 === 0) {
        return true
    }
    const absNum1 = Math.abs(num1);
    const absNum2 = Math.abs(num2);
    const ratio = absNum1>absNum2 ? (absNum1 / absNum2) : (absNum2 / absNum1);

    return ratio>=properRatio
}

/***/ }),
/* 2 */,
/* 3 */,
/* 4 */,
/* 5 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   moment: () => (/* binding */ moment)
/* harmony export */ });
const  moment = function(e) {
    var t = {};
    function a(n) {
        if (t[n])
            return t[n].exports;
        var s = t[n] = {
            i: n,
            l: !1,
            exports: {}
        };
        return e[n].call(s.exports, s, s.exports, a),
        s.l = !0,
        s.exports
    }
    return a.m = e,
    a.c = t,
    a.d = function(e, t, n) {
        a.o(e, t) || Object.defineProperty(e, t, {
            enumerable: !0,
            get: n
        })
    }
    ,
    a.r = function(e) {
        "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, {
            value: "Module"
        }),
        Object.defineProperty(e, "__esModule", {
            value: !0
        })
    }
    ,
    a.t = function(e, t) {
        if (1 & t && (e = a(e)),
        8 & t)
            return e;
        if (4 & t && "object" == typeof e && e && e.__esModule)
            return e;
        var n = Object.create(null);
        if (a.r(n),
        Object.defineProperty(n, "default", {
            enumerable: !0,
            value: e
        }),
        2 & t && "string" != typeof e)
            for (var s in e)
                a.d(n, s, function(t) {
                    return e[t]
                }
                .bind(null, s));
        return n
    }
    ,
    a.n = function(e) {
        var t = e && e.__esModule ? function() {
            return e.default
        }
        : function() {
            return e
        }
        ;
        return a.d(t, "a", t),
        t
    }
    ,
    a.o = function(e, t) {
        return Object.prototype.hasOwnProperty.call(e, t)
    }
    ,
    a.p = "",
    a(a.s = 124)
}([function(e, t, a) {
    (function(e) {
        e.exports = function() {
            "use strict";
            var t, n;
            function s() {
                return t.apply(null, arguments)
            }
            function r(e) {
                return e instanceof Array || "[object Array]" === Object.prototype.toString.call(e)
            }
            function i(e) {
                return null != e && "[object Object]" === Object.prototype.toString.call(e)
            }
            function d(e) {
                return void 0 === e
            }
            function _(e) {
                return "number" == typeof e || "[object Number]" === Object.prototype.toString.call(e)
            }
            function o(e) {
                return e instanceof Date || "[object Date]" === Object.prototype.toString.call(e)
            }
            function u(e, t) {
                var a, n = [];
                for (a = 0; a < e.length; ++a)
                    n.push(t(e[a], a));
                return n
            }
            function m(e, t) {
                return Object.prototype.hasOwnProperty.call(e, t)
            }
            function l(e, t) {
                for (var a in t)
                    m(t, a) && (e[a] = t[a]);
                return m(t, "toString") && (e.toString = t.toString),
                m(t, "valueOf") && (e.valueOf = t.valueOf),
                e
            }
            function c(e, t, a, n) {
                return bt(e, t, a, n, !0).utc()
            }
            function h(e) {
                return null == e._pf && (e._pf = {
                    empty: !1,
                    unusedTokens: [],
                    unusedInput: [],
                    overflow: -2,
                    charsLeftOver: 0,
                    nullInput: !1,
                    invalidMonth: null,
                    invalidFormat: !1,
                    userInvalidated: !1,
                    iso: !1,
                    parsedDateParts: [],
                    meridiem: null,
                    rfc2822: !1,
                    weekdayMismatch: !1
                }),
                e._pf
            }
            function M(e) {
                if (null == e._isValid) {
                    var t = h(e)
                      , a = n.call(t.parsedDateParts, function(e) {
                        return null != e
                    })
                      , s = !isNaN(e._d.getTime()) && t.overflow < 0 && !t.empty && !t.invalidMonth && !t.invalidWeekday && !t.weekdayMismatch && !t.nullInput && !t.invalidFormat && !t.userInvalidated && (!t.meridiem || t.meridiem && a);
                    if (e._strict && (s = s && 0 === t.charsLeftOver && 0 === t.unusedTokens.length && void 0 === t.bigHour),
                    null != Object.isFrozen && Object.isFrozen(e))
                        return s;
                    e._isValid = s
                }
                return e._isValid
            }
            function L(e) {
                var t = c(NaN);
                return null != e ? l(h(t), e) : h(t).userInvalidated = !0,
                t
            }
            n = Array.prototype.some ? Array.prototype.some : function(e) {
                for (var t = Object(this), a = t.length >>> 0, n = 0; n < a; n++)
                    if (n in t && e.call(this, t[n], n, t))
                        return !0;
                return !1
            }
            ;
            var Y = s.momentProperties = [];
            function y(e, t) {
                var a, n, s;
                if (d(t._isAMomentObject) || (e._isAMomentObject = t._isAMomentObject),
                d(t._i) || (e._i = t._i),
                d(t._f) || (e._f = t._f),
                d(t._l) || (e._l = t._l),
                d(t._strict) || (e._strict = t._strict),
                d(t._tzm) || (e._tzm = t._tzm),
                d(t._isUTC) || (e._isUTC = t._isUTC),
                d(t._offset) || (e._offset = t._offset),
                d(t._pf) || (e._pf = h(t)),
                d(t._locale) || (e._locale = t._locale),
                Y.length > 0)
                    for (a = 0; a < Y.length; a++)
                        n = Y[a],
                        d(s = t[n]) || (e[n] = s);
                return e
            }
            var f = !1;
            function p(e) {
                y(this, e),
                this._d = new Date(null != e._d ? e._d.getTime() : NaN),
                this.isValid() || (this._d = new Date(NaN)),
                !1 === f && (f = !0,
                s.updateOffset(this),
                f = !1)
            }
            function D(e) {
                return e instanceof p || null != e && null != e._isAMomentObject
            }
            function k(e) {
                return e < 0 ? Math.ceil(e) || 0 : Math.floor(e)
            }
            function T(e) {
                var t = +e
                  , a = 0;
                return 0 !== t && isFinite(t) && (a = k(t)),
                a
            }
            function g(e, t, a) {
                var n, s = Math.min(e.length, t.length), r = Math.abs(e.length - t.length), i = 0;
                for (n = 0; n < s; n++)
                    (a && e[n] !== t[n] || !a && T(e[n]) !== T(t[n])) && i++;
                return i + r
            }
            function w(e) {
                !1 === s.suppressDeprecationWarnings && "undefined" != typeof console && console.warn && console.warn("Deprecation warning: " + e)
            }
            function v(e, t) {
                var a = !0;
                return l(function() {
                    if (null != s.deprecationHandler && s.deprecationHandler(null, e),
                    a) {
                        for (var n, r = [], i = 0; i < arguments.length; i++) {
                            if (n = "",
                            "object" == typeof arguments[i]) {
                                for (var d in n += "\n[" + i + "] ",
                                arguments[0])
                                    n += d + ": " + arguments[0][d] + ", ";
                                n = n.slice(0, -2)
                            } else
                                n = arguments[i];
                            r.push(n)
                        }
                        w(e + "\nArguments: " + Array.prototype.slice.call(r).join("") + "\n" + (new Error).stack),
                        a = !1
                    }
                    return t.apply(this, arguments)
                }, t)
            }
            var j, S = {};
            function H(e, t) {
                null != s.deprecationHandler && s.deprecationHandler(e, t),
                S[e] || (w(t),
                S[e] = !0)
            }
            function b(e) {
                return e instanceof Function || "[object Function]" === Object.prototype.toString.call(e)
            }
            function x(e, t) {
                var a, n = l({}, e);
                for (a in t)
                    m(t, a) && (i(e[a]) && i(t[a]) ? (n[a] = {},
                    l(n[a], e[a]),
                    l(n[a], t[a])) : null != t[a] ? n[a] = t[a] : delete n[a]);
                for (a in e)
                    m(e, a) && !m(t, a) && i(e[a]) && (n[a] = l({}, n[a]));
                return n
            }
            function O(e) {
                null != e && this.set(e)
            }
            s.suppressDeprecationWarnings = !1,
            s.deprecationHandler = null,
            j = Object.keys ? Object.keys : function(e) {
                var t, a = [];
                for (t in e)
                    m(e, t) && a.push(t);
                return a
            }
            ;
            var P = {};
            function W(e, t) {
                var a = e.toLowerCase();
                P[a] = P[a + "s"] = P[t] = e
            }
            function E(e) {
                return "string" == typeof e ? P[e] || P[e.toLowerCase()] : void 0
            }
            function A(e) {
                var t, a, n = {};
                for (a in e)
                    m(e, a) && (t = E(a)) && (n[t] = e[a]);
                return n
            }
            var F = {};
            function z(e, t) {
                F[e] = t
            }
            function J(e, t, a) {
                var n = "" + Math.abs(e)
                  , s = t - n.length
                  , r = e >= 0;
                return (r ? a ? "+" : "" : "-") + Math.pow(10, Math.max(0, s)).toString().substr(1) + n
            }
            var N = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g
              , I = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g
              , C = {}
              , R = {};
            function U(e, t, a, n) {
                var s = n;
                "string" == typeof n && (s = function() {
                    return this[n]()
                }
                ),
                e && (R[e] = s),
                t && (R[t[0]] = function() {
                    return J(s.apply(this, arguments), t[1], t[2])
                }
                ),
                a && (R[a] = function() {
                    return this.localeData().ordinal(s.apply(this, arguments), e)
                }
                )
            }
            function G(e) {
                return e.match(/\[[\s\S]/) ? e.replace(/^\[|\]$/g, "") : e.replace(/\\/g, "")
            }
            function V(e, t) {
                return e.isValid() ? (t = Z(t, e.localeData()),
                C[t] = C[t] || function(e) {
                    var t, a, n = e.match(N);
                    for (t = 0,
                    a = n.length; t < a; t++)
                        R[n[t]] ? n[t] = R[n[t]] : n[t] = G(n[t]);
                    return function(t) {
                        var s, r = "";
                        for (s = 0; s < a; s++)
                            r += b(n[s]) ? n[s].call(t, e) : n[s];
                        return r
                    }
                }(t),
                C[t](e)) : e.localeData().invalidDate()
            }
            function Z(e, t) {
                var a = 5;
                function n(e) {
                    return t.longDateFormat(e) || e
                }
                for (I.lastIndex = 0; a >= 0 && I.test(e); )
                    e = e.replace(I, n),
                    I.lastIndex = 0,
                    a -= 1;
                return e
            }
            var B = /\d/
              , K = /\d\d/
              , $ = /\d{3}/
              , q = /\d{4}/
              , Q = /[+-]?\d{6}/
              , X = /\d\d?/
              , ee = /\d\d\d\d?/
              , te = /\d\d\d\d\d\d?/
              , ae = /\d{1,3}/
              , ne = /\d{1,4}/
              , se = /[+-]?\d{1,6}/
              , re = /\d+/
              , ie = /[+-]?\d+/
              , de = /Z|[+-]\d\d:?\d\d/gi
              , _e = /Z|[+-]\d\d(?::?\d\d)?/gi
              , oe = /[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i
              , ue = {};
            function me(e, t, a) {
                ue[e] = b(t) ? t : function(e, n) {
                    return e && a ? a : t
                }
            }
            function le(e, t) {
                return m(ue, e) ? ue[e](t._strict, t._locale) : new RegExp(function(e) {
                    return ce(e.replace("\\", "").replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function(e, t, a, n, s) {
                        return t || a || n || s
                    }))
                }(e))
            }
            function ce(e) {
                return e.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")
            }
            var he = {};
            function Me(e, t) {
                var a, n = t;
                for ("string" == typeof e && (e = [e]),
                _(t) && (n = function(e, a) {
                    a[t] = T(e)
                }
                ),
                a = 0; a < e.length; a++)
                    he[e[a]] = n
            }
            function Le(e, t) {
                Me(e, function(e, a, n, s) {
                    n._w = n._w || {},
                    t(e, n._w, n, s)
                })
            }
            function Ye(e, t, a) {
                null != t && m(he, e) && he[e](t, a._a, a, e)
            }
            var ye = 0
              , fe = 1
              , pe = 2
              , De = 3
              , ke = 4
              , Te = 5
              , ge = 6
              , we = 7
              , ve = 8;
            function je(e) {
                return Se(e) ? 366 : 365
            }
            function Se(e) {
                return e % 4 == 0 && e % 100 != 0 || e % 400 == 0
            }
            U("Y", 0, 0, function() {
                var e = this.year();
                return e <= 9999 ? "" + e : "+" + e
            }),
            U(0, ["YY", 2], 0, function() {
                return this.year() % 100
            }),
            U(0, ["YYYY", 4], 0, "year"),
            U(0, ["YYYYY", 5], 0, "year"),
            U(0, ["YYYYYY", 6, !0], 0, "year"),
            W("year", "y"),
            z("year", 1),
            me("Y", ie),
            me("YY", X, K),
            me("YYYY", ne, q),
            me("YYYYY", se, Q),
            me("YYYYYY", se, Q),
            Me(["YYYYY", "YYYYYY"], ye),
            Me("YYYY", function(e, t) {
                t[ye] = 2 === e.length ? s.parseTwoDigitYear(e) : T(e)
            }),
            Me("YY", function(e, t) {
                t[ye] = s.parseTwoDigitYear(e)
            }),
            Me("Y", function(e, t) {
                t[ye] = parseInt(e, 10)
            }),
            s.parseTwoDigitYear = function(e) {
                return T(e) + (T(e) > 68 ? 1900 : 2e3)
            }
            ;
            var He, be = xe("FullYear", !0);
            function xe(e, t) {
                return function(a) {
                    return null != a ? (Pe(this, e, a),
                    s.updateOffset(this, t),
                    this) : Oe(this, e)
                }
            }
            function Oe(e, t) {
                return e.isValid() ? e._d["get" + (e._isUTC ? "UTC" : "") + t]() : NaN
            }
            function Pe(e, t, a) {
                e.isValid() && !isNaN(a) && ("FullYear" === t && Se(e.year()) && 1 === e.month() && 29 === e.date() ? e._d["set" + (e._isUTC ? "UTC" : "") + t](a, e.month(), We(a, e.month())) : e._d["set" + (e._isUTC ? "UTC" : "") + t](a))
            }
            function We(e, t) {
                if (isNaN(e) || isNaN(t))
                    return NaN;
                var a = function(e, t) {
                    return (e % t + t) % t
                }(t, 12);
                return e += (t - a) / 12,
                1 === a ? Se(e) ? 29 : 28 : 31 - a % 7 % 2
            }
            He = Array.prototype.indexOf ? Array.prototype.indexOf : function(e) {
                var t;
                for (t = 0; t < this.length; ++t)
                    if (this[t] === e)
                        return t;
                return -1
            }
            ,
            U("M", ["MM", 2], "Mo", function() {
                return this.month() + 1
            }),
            U("MMM", 0, 0, function(e) {
                return this.localeData().monthsShort(this, e)
            }),
            U("MMMM", 0, 0, function(e) {
                return this.localeData().months(this, e)
            }),
            W("month", "M"),
            z("month", 8),
            me("M", X),
            me("MM", X, K),
            me("MMM", function(e, t) {
                return t.monthsShortRegex(e)
            }),
            me("MMMM", function(e, t) {
                return t.monthsRegex(e)
            }),
            Me(["M", "MM"], function(e, t) {
                t[fe] = T(e) - 1
            }),
            Me(["MMM", "MMMM"], function(e, t, a, n) {
                var s = a._locale.monthsParse(e, n, a._strict);
                null != s ? t[fe] = s : h(a).invalidMonth = e
            });
            var Ee = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/
              , Ae = "January_February_March_April_May_June_July_August_September_October_November_December".split("_")
              , Fe = "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_");
            function ze(e, t) {
                var a;
                if (!e.isValid())
                    return e;
                if ("string" == typeof t)
                    if (/^\d+$/.test(t))
                        t = T(t);
                    else if (!_(t = e.localeData().monthsParse(t)))
                        return e;
                return a = Math.min(e.date(), We(e.year(), t)),
                e._d["set" + (e._isUTC ? "UTC" : "") + "Month"](t, a),
                e
            }
            function Je(e) {
                return null != e ? (ze(this, e),
                s.updateOffset(this, !0),
                this) : Oe(this, "Month")
            }
            var Ne = oe
              , Ie = oe;
            function Ce() {
                function e(e, t) {
                    return t.length - e.length
                }
                var t, a, n = [], s = [], r = [];
                for (t = 0; t < 12; t++)
                    a = c([2e3, t]),
                    n.push(this.monthsShort(a, "")),
                    s.push(this.months(a, "")),
                    r.push(this.months(a, "")),
                    r.push(this.monthsShort(a, ""));
                for (n.sort(e),
                s.sort(e),
                r.sort(e),
                t = 0; t < 12; t++)
                    n[t] = ce(n[t]),
                    s[t] = ce(s[t]);
                for (t = 0; t < 24; t++)
                    r[t] = ce(r[t]);
                this._monthsRegex = new RegExp("^(" + r.join("|") + ")","i"),
                this._monthsShortRegex = this._monthsRegex,
                this._monthsStrictRegex = new RegExp("^(" + s.join("|") + ")","i"),
                this._monthsShortStrictRegex = new RegExp("^(" + n.join("|") + ")","i")
            }
            function Re(e) {
                var t = new Date(Date.UTC.apply(null, arguments));
                return e < 100 && e >= 0 && isFinite(t.getUTCFullYear()) && t.setUTCFullYear(e),
                t
            }
            function Ue(e, t, a) {
                var n = 7 + t - a
                  , s = (7 + Re(e, 0, n).getUTCDay() - t) % 7;
                return -s + n - 1
            }
            function Ge(e, t, a, n, s) {
                var r, i, d = (7 + a - n) % 7, _ = Ue(e, n, s), o = 1 + 7 * (t - 1) + d + _;
                return o <= 0 ? i = je(r = e - 1) + o : o > je(e) ? (r = e + 1,
                i = o - je(e)) : (r = e,
                i = o),
                {
                    year: r,
                    dayOfYear: i
                }
            }
            function Ve(e, t, a) {
                var n, s, r = Ue(e.year(), t, a), i = Math.floor((e.dayOfYear() - r - 1) / 7) + 1;
                return i < 1 ? (s = e.year() - 1,
                n = i + Ze(s, t, a)) : i > Ze(e.year(), t, a) ? (n = i - Ze(e.year(), t, a),
                s = e.year() + 1) : (s = e.year(),
                n = i),
                {
                    week: n,
                    year: s
                }
            }
            function Ze(e, t, a) {
                var n = Ue(e, t, a)
                  , s = Ue(e + 1, t, a);
                return (je(e) - n + s) / 7
            }
            U("w", ["ww", 2], "wo", "week"),
            U("W", ["WW", 2], "Wo", "isoWeek"),
            W("week", "w"),
            W("isoWeek", "W"),
            z("week", 5),
            z("isoWeek", 5),
            me("w", X),
            me("ww", X, K),
            me("W", X),
            me("WW", X, K),
            Le(["w", "ww", "W", "WW"], function(e, t, a, n) {
                t[n.substr(0, 1)] = T(e)
            }),
            U("d", 0, "do", "day"),
            U("dd", 0, 0, function(e) {
                return this.localeData().weekdaysMin(this, e)
            }),
            U("ddd", 0, 0, function(e) {
                return this.localeData().weekdaysShort(this, e)
            }),
            U("dddd", 0, 0, function(e) {
                return this.localeData().weekdays(this, e)
            }),
            U("e", 0, 0, "weekday"),
            U("E", 0, 0, "isoWeekday"),
            W("day", "d"),
            W("weekday", "e"),
            W("isoWeekday", "E"),
            z("day", 11),
            z("weekday", 11),
            z("isoWeekday", 11),
            me("d", X),
            me("e", X),
            me("E", X),
            me("dd", function(e, t) {
                return t.weekdaysMinRegex(e)
            }),
            me("ddd", function(e, t) {
                return t.weekdaysShortRegex(e)
            }),
            me("dddd", function(e, t) {
                return t.weekdaysRegex(e)
            }),
            Le(["dd", "ddd", "dddd"], function(e, t, a, n) {
                var s = a._locale.weekdaysParse(e, n, a._strict);
                null != s ? t.d = s : h(a).invalidWeekday = e
            }),
            Le(["d", "e", "E"], function(e, t, a, n) {
                t[n] = T(e)
            });
            var Be = "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_")
              , Ke = "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_")
              , $e = "Su_Mo_Tu_We_Th_Fr_Sa".split("_")
              , qe = oe
              , Qe = oe
              , Xe = oe;
            function et() {
                function e(e, t) {
                    return t.length - e.length
                }
                var t, a, n, s, r, i = [], d = [], _ = [], o = [];
                for (t = 0; t < 7; t++)
                    a = c([2e3, 1]).day(t),
                    n = this.weekdaysMin(a, ""),
                    s = this.weekdaysShort(a, ""),
                    r = this.weekdays(a, ""),
                    i.push(n),
                    d.push(s),
                    _.push(r),
                    o.push(n),
                    o.push(s),
                    o.push(r);
                for (i.sort(e),
                d.sort(e),
                _.sort(e),
                o.sort(e),
                t = 0; t < 7; t++)
                    d[t] = ce(d[t]),
                    _[t] = ce(_[t]),
                    o[t] = ce(o[t]);
                this._weekdaysRegex = new RegExp("^(" + o.join("|") + ")","i"),
                this._weekdaysShortRegex = this._weekdaysRegex,
                this._weekdaysMinRegex = this._weekdaysRegex,
                this._weekdaysStrictRegex = new RegExp("^(" + _.join("|") + ")","i"),
                this._weekdaysShortStrictRegex = new RegExp("^(" + d.join("|") + ")","i"),
                this._weekdaysMinStrictRegex = new RegExp("^(" + i.join("|") + ")","i")
            }
            function tt() {
                return this.hours() % 12 || 12
            }
            function at(e, t) {
                U(e, 0, 0, function() {
                    return this.localeData().meridiem(this.hours(), this.minutes(), t)
                })
            }
            function nt(e, t) {
                return t._meridiemParse
            }
            U("H", ["HH", 2], 0, "hour"),
            U("h", ["hh", 2], 0, tt),
            U("k", ["kk", 2], 0, function() {
                return this.hours() || 24
            }),
            U("hmm", 0, 0, function() {
                return "" + tt.apply(this) + J(this.minutes(), 2)
            }),
            U("hmmss", 0, 0, function() {
                return "" + tt.apply(this) + J(this.minutes(), 2) + J(this.seconds(), 2)
            }),
            U("Hmm", 0, 0, function() {
                return "" + this.hours() + J(this.minutes(), 2)
            }),
            U("Hmmss", 0, 0, function() {
                return "" + this.hours() + J(this.minutes(), 2) + J(this.seconds(), 2)
            }),
            at("a", !0),
            at("A", !1),
            W("hour", "h"),
            z("hour", 13),
            me("a", nt),
            me("A", nt),
            me("H", X),
            me("h", X),
            me("k", X),
            me("HH", X, K),
            me("hh", X, K),
            me("kk", X, K),
            me("hmm", ee),
            me("hmmss", te),
            me("Hmm", ee),
            me("Hmmss", te),
            Me(["H", "HH"], De),
            Me(["k", "kk"], function(e, t, a) {
                var n = T(e);
                t[De] = 24 === n ? 0 : n
            }),
            Me(["a", "A"], function(e, t, a) {
                a._isPm = a._locale.isPM(e),
                a._meridiem = e
            }),
            Me(["h", "hh"], function(e, t, a) {
                t[De] = T(e),
                h(a).bigHour = !0
            }),
            Me("hmm", function(e, t, a) {
                var n = e.length - 2;
                t[De] = T(e.substr(0, n)),
                t[ke] = T(e.substr(n)),
                h(a).bigHour = !0
            }),
            Me("hmmss", function(e, t, a) {
                var n = e.length - 4
                  , s = e.length - 2;
                t[De] = T(e.substr(0, n)),
                t[ke] = T(e.substr(n, 2)),
                t[Te] = T(e.substr(s)),
                h(a).bigHour = !0
            }),
            Me("Hmm", function(e, t, a) {
                var n = e.length - 2;
                t[De] = T(e.substr(0, n)),
                t[ke] = T(e.substr(n))
            }),
            Me("Hmmss", function(e, t, a) {
                var n = e.length - 4
                  , s = e.length - 2;
                t[De] = T(e.substr(0, n)),
                t[ke] = T(e.substr(n, 2)),
                t[Te] = T(e.substr(s))
            });
            var st, rt = xe("Hours", !0), it = {
                calendar: {
                    sameDay: "[Today at] LT",
                    nextDay: "[Tomorrow at] LT",
                    nextWeek: "dddd [at] LT",
                    lastDay: "[Yesterday at] LT",
                    lastWeek: "[Last] dddd [at] LT",
                    sameElse: "L"
                },
                longDateFormat: {
                    LTS: "h:mm:ss A",
                    LT: "h:mm A",
                    L: "MM/DD/YYYY",
                    LL: "MMMM D, YYYY",
                    LLL: "MMMM D, YYYY h:mm A",
                    LLLL: "dddd, MMMM D, YYYY h:mm A"
                },
                invalidDate: "Invalid date",
                ordinal: "%d",
                dayOfMonthOrdinalParse: /\d{1,2}/,
                relativeTime: {
                    future: "in %s",
                    past: "%s ago",
                    s: "a few seconds",
                    ss: "%d seconds",
                    m: "a minute",
                    mm: "%d minutes",
                    h: "an hour",
                    hh: "%d hours",
                    d: "a day",
                    dd: "%d days",
                    M: "a month",
                    MM: "%d months",
                    y: "a year",
                    yy: "%d years"
                },
                months: Ae,
                monthsShort: Fe,
                week: {
                    dow: 0,
                    doy: 6
                },
                weekdays: Be,
                weekdaysMin: $e,
                weekdaysShort: Ke,
                meridiemParse: /[ap]\.?m?\.?/i
            }, dt = {}, _t = {};
            function ot(e) {
                return e ? e.toLowerCase().replace("_", "-") : e
            }
            function ut(t) {
                var n = null;
                if (!dt[t] && void 0 !== e && e && e.exports)
                    try {
                        n = st._abbr,
                        a(126)("./" + t),
                        mt(n)
                    } catch (e) {}
                return dt[t]
            }
            function mt(e, t) {
                var a;
                return e && ((a = d(t) ? ct(e) : lt(e, t)) ? st = a : "undefined" != typeof console && console.warn && console.warn("Locale " + e + " not found. Did you forget to load it?")),
                st._abbr
            }
            function lt(e, t) {
                if (null !== t) {
                    var a, n = it;
                    if (t.abbr = e,
                    null != dt[e])
                        H("defineLocaleOverride", "use moment.updateLocale(localeName, config) to change an existing locale. moment.defineLocale(localeName, config) should only be used for creating a new locale See http://momentjs.com/guides/#/warnings/define-locale/ for more info."),
                        n = dt[e]._config;
                    else if (null != t.parentLocale)
                        if (null != dt[t.parentLocale])
                            n = dt[t.parentLocale]._config;
                        else {
                            if (null == (a = ut(t.parentLocale)))
                                return _t[t.parentLocale] || (_t[t.parentLocale] = []),
                                _t[t.parentLocale].push({
                                    name: e,
                                    config: t
                                }),
                                null;
                            n = a._config
                        }
                    return dt[e] = new O(x(n, t)),
                    _t[e] && _t[e].forEach(function(e) {
                        lt(e.name, e.config)
                    }),
                    mt(e),
                    dt[e]
                }
                return delete dt[e],
                null
            }
            function ct(e) {
                var t;
                if (e && e._locale && e._locale._abbr && (e = e._locale._abbr),
                !e)
                    return st;
                if (!r(e)) {
                    if (t = ut(e))
                        return t;
                    e = [e]
                }
                return function(e) {
                    for (var t, a, n, s, r = 0; r < e.length; ) {
                        for (s = ot(e[r]).split("-"),
                        t = s.length,
                        a = (a = ot(e[r + 1])) ? a.split("-") : null; t > 0; ) {
                            if (n = ut(s.slice(0, t).join("-")))
                                return n;
                            if (a && a.length >= t && g(s, a, !0) >= t - 1)
                                break;
                            t--
                        }
                        r++
                    }
                    return st
                }(e)
            }
            function ht(e) {
                var t, a = e._a;
                return a && -2 === h(e).overflow && (t = a[fe] < 0 || a[fe] > 11 ? fe : a[pe] < 1 || a[pe] > We(a[ye], a[fe]) ? pe : a[De] < 0 || a[De] > 24 || 24 === a[De] && (0 !== a[ke] || 0 !== a[Te] || 0 !== a[ge]) ? De : a[ke] < 0 || a[ke] > 59 ? ke : a[Te] < 0 || a[Te] > 59 ? Te : a[ge] < 0 || a[ge] > 999 ? ge : -1,
                h(e)._overflowDayOfYear && (t < ye || t > pe) && (t = pe),
                h(e)._overflowWeeks && -1 === t && (t = we),
                h(e)._overflowWeekday && -1 === t && (t = ve),
                h(e).overflow = t),
                e
            }
            function Mt(e, t, a) {
                return null != e ? e : null != t ? t : a
            }
            function Lt(e) {
                var t, a, n, r, i, d = [];
                if (!e._d) {
                    for (n = function(e) {
                        var t = new Date(s.now());
                        return e._useUTC ? [t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()] : [t.getFullYear(), t.getMonth(), t.getDate()]
                    }(e),
                    e._w && null == e._a[pe] && null == e._a[fe] && function(e) {
                        var t, a, n, s, r, i, d, _;
                        if (null != (t = e._w).GG || null != t.W || null != t.E)
                            r = 1,
                            i = 4,
                            a = Mt(t.GG, e._a[ye], Ve(xt(), 1, 4).year),
                            n = Mt(t.W, 1),
                            ((s = Mt(t.E, 1)) < 1 || s > 7) && (_ = !0);
                        else {
                            r = e._locale._week.dow,
                            i = e._locale._week.doy;
                            var o = Ve(xt(), r, i);
                            a = Mt(t.gg, e._a[ye], o.year),
                            n = Mt(t.w, o.week),
                            null != t.d ? ((s = t.d) < 0 || s > 6) && (_ = !0) : null != t.e ? (s = t.e + r,
                            (t.e < 0 || t.e > 6) && (_ = !0)) : s = r
                        }
                        n < 1 || n > Ze(a, r, i) ? h(e)._overflowWeeks = !0 : null != _ ? h(e)._overflowWeekday = !0 : (d = Ge(a, n, s, r, i),
                        e._a[ye] = d.year,
                        e._dayOfYear = d.dayOfYear)
                    }(e),
                    null != e._dayOfYear && (i = Mt(e._a[ye], n[ye]),
                    (e._dayOfYear > je(i) || 0 === e._dayOfYear) && (h(e)._overflowDayOfYear = !0),
                    a = Re(i, 0, e._dayOfYear),
                    e._a[fe] = a.getUTCMonth(),
                    e._a[pe] = a.getUTCDate()),
                    t = 0; t < 3 && null == e._a[t]; ++t)
                        e._a[t] = d[t] = n[t];
                    for (; t < 7; t++)
                        e._a[t] = d[t] = null == e._a[t] ? 2 === t ? 1 : 0 : e._a[t];
                    24 === e._a[De] && 0 === e._a[ke] && 0 === e._a[Te] && 0 === e._a[ge] && (e._nextDay = !0,
                    e._a[De] = 0),
                    e._d = (e._useUTC ? Re : function(e, t, a, n, s, r, i) {
                        var d = new Date(e,t,a,n,s,r,i);
                        return e < 100 && e >= 0 && isFinite(d.getFullYear()) && d.setFullYear(e),
                        d
                    }
                    ).apply(null, d),
                    r = e._useUTC ? e._d.getUTCDay() : e._d.getDay(),
                    null != e._tzm && e._d.setUTCMinutes(e._d.getUTCMinutes() - e._tzm),
                    e._nextDay && (e._a[De] = 24),
                    e._w && void 0 !== e._w.d && e._w.d !== r && (h(e).weekdayMismatch = !0)
                }
            }
            var Yt = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/
              , yt = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/
              , ft = /Z|[+-]\d\d(?::?\d\d)?/
              , pt = [["YYYYYY-MM-DD", /[+-]\d{6}-\d\d-\d\d/], ["YYYY-MM-DD", /\d{4}-\d\d-\d\d/], ["GGGG-[W]WW-E", /\d{4}-W\d\d-\d/], ["GGGG-[W]WW", /\d{4}-W\d\d/, !1], ["YYYY-DDD", /\d{4}-\d{3}/], ["YYYY-MM", /\d{4}-\d\d/, !1], ["YYYYYYMMDD", /[+-]\d{10}/], ["YYYYMMDD", /\d{8}/], ["GGGG[W]WWE", /\d{4}W\d{3}/], ["GGGG[W]WW", /\d{4}W\d{2}/, !1], ["YYYYDDD", /\d{7}/]]
              , Dt = [["HH:mm:ss.SSSS", /\d\d:\d\d:\d\d\.\d+/], ["HH:mm:ss,SSSS", /\d\d:\d\d:\d\d,\d+/], ["HH:mm:ss", /\d\d:\d\d:\d\d/], ["HH:mm", /\d\d:\d\d/], ["HHmmss.SSSS", /\d\d\d\d\d\d\.\d+/], ["HHmmss,SSSS", /\d\d\d\d\d\d,\d+/], ["HHmmss", /\d\d\d\d\d\d/], ["HHmm", /\d\d\d\d/], ["HH", /\d\d/]]
              , kt = /^\/?Date\((\-?\d+)/i;
            function Tt(e) {
                var t, a, n, s, r, i, d = e._i, _ = Yt.exec(d) || yt.exec(d);
                if (_) {
                    for (h(e).iso = !0,
                    t = 0,
                    a = pt.length; t < a; t++)
                        if (pt[t][1].exec(_[1])) {
                            s = pt[t][0],
                            n = !1 !== pt[t][2];
                            break
                        }
                    if (null == s)
                        return void (e._isValid = !1);
                    if (_[3]) {
                        for (t = 0,
                        a = Dt.length; t < a; t++)
                            if (Dt[t][1].exec(_[3])) {
                                r = (_[2] || " ") + Dt[t][0];
                                break
                            }
                        if (null == r)
                            return void (e._isValid = !1)
                    }
                    if (!n && null != r)
                        return void (e._isValid = !1);
                    if (_[4]) {
                        if (!ft.exec(_[4]))
                            return void (e._isValid = !1);
                        i = "Z"
                    }
                    e._f = s + (r || "") + (i || ""),
                    St(e)
                } else
                    e._isValid = !1
            }
            var gt = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/;
            function wt(e, t, a, n, s, r) {
                var i = [function(e) {
                    var t = parseInt(e, 10);
                    return t <= 49 ? 2e3 + t : t <= 999 ? 1900 + t : t
                }(e), Fe.indexOf(t), parseInt(a, 10), parseInt(n, 10), parseInt(s, 10)];
                return r && i.push(parseInt(r, 10)),
                i
            }
            var vt = {
                UT: 0,
                GMT: 0,
                EDT: -240,
                EST: -300,
                CDT: -300,
                CST: -360,
                MDT: -360,
                MST: -420,
                PDT: -420,
                PST: -480
            };
            function jt(e) {
                var t = gt.exec(function(e) {
                    return e.replace(/\([^)]*\)|[\n\t]/g, " ").replace(/(\s\s+)/g, " ").replace(/^\s\s*/, "").replace(/\s\s*$/, "")
                }(e._i));
                if (t) {
                    var a = wt(t[4], t[3], t[2], t[5], t[6], t[7]);
                    if (!function(e, t, a) {
                        if (e) {
                            var n = Ke.indexOf(e)
                              , s = new Date(t[0],t[1],t[2]).getDay();
                            if (n !== s)
                                return h(a).weekdayMismatch = !0,
                                a._isValid = !1,
                                !1
                        }
                        return !0
                    }(t[1], a, e))
                        return;
                    e._a = a,
                    e._tzm = function(e, t, a) {
                        if (e)
                            return vt[e];
                        if (t)
                            return 0;
                        var n = parseInt(a, 10)
                          , s = n % 100
                          , r = (n - s) / 100;
                        return 60 * r + s
                    }(t[8], t[9], t[10]),
                    e._d = Re.apply(null, e._a),
                    e._d.setUTCMinutes(e._d.getUTCMinutes() - e._tzm),
                    h(e).rfc2822 = !0
                } else
                    e._isValid = !1
            }
            function St(e) {
                if (e._f !== s.ISO_8601)
                    if (e._f !== s.RFC_2822) {
                        e._a = [],
                        h(e).empty = !0;
                        var t, a, n, r, i, d = "" + e._i, _ = d.length, o = 0;
                        for (n = Z(e._f, e._locale).match(N) || [],
                        t = 0; t < n.length; t++)
                            r = n[t],
                            (a = (d.match(le(r, e)) || [])[0]) && ((i = d.substr(0, d.indexOf(a))).length > 0 && h(e).unusedInput.push(i),
                            d = d.slice(d.indexOf(a) + a.length),
                            o += a.length),
                            R[r] ? (a ? h(e).empty = !1 : h(e).unusedTokens.push(r),
                            Ye(r, a, e)) : e._strict && !a && h(e).unusedTokens.push(r);
                        h(e).charsLeftOver = _ - o,
                        d.length > 0 && h(e).unusedInput.push(d),
                        e._a[De] <= 12 && !0 === h(e).bigHour && e._a[De] > 0 && (h(e).bigHour = void 0),
                        h(e).parsedDateParts = e._a.slice(0),
                        h(e).meridiem = e._meridiem,
                        e._a[De] = function(e, t, a) {
                            var n;
                            return null == a ? t : null != e.meridiemHour ? e.meridiemHour(t, a) : null != e.isPM ? ((n = e.isPM(a)) && t < 12 && (t += 12),
                            n || 12 !== t || (t = 0),
                            t) : t
                        }(e._locale, e._a[De], e._meridiem),
                        Lt(e),
                        ht(e)
                    } else
                        jt(e);
                else
                    Tt(e)
            }
            function Ht(e) {
                var t = e._i
                  , a = e._f;
                return e._locale = e._locale || ct(e._l),
                null === t || void 0 === a && "" === t ? L({
                    nullInput: !0
                }) : ("string" == typeof t && (e._i = t = e._locale.preparse(t)),
                D(t) ? new p(ht(t)) : (o(t) ? e._d = t : r(a) ? function(e) {
                    var t, a, n, s, r;
                    if (0 === e._f.length)
                        return h(e).invalidFormat = !0,
                        void (e._d = new Date(NaN));
                    for (s = 0; s < e._f.length; s++)
                        r = 0,
                        t = y({}, e),
                        null != e._useUTC && (t._useUTC = e._useUTC),
                        t._f = e._f[s],
                        St(t),
                        M(t) && (r += h(t).charsLeftOver,
                        r += 10 * h(t).unusedTokens.length,
                        h(t).score = r,
                        (null == n || r < n) && (n = r,
                        a = t));
                    l(e, a || t)
                }(e) : a ? St(e) : function(e) {
                    var t = e._i;
                    d(t) ? e._d = new Date(s.now()) : o(t) ? e._d = new Date(t.valueOf()) : "string" == typeof t ? function(e) {
                        var t = kt.exec(e._i);
                        null === t ? (Tt(e),
                        !1 === e._isValid && (delete e._isValid,
                        jt(e),
                        !1 === e._isValid && (delete e._isValid,
                        s.createFromInputFallback(e)))) : e._d = new Date(+t[1])
                    }(e) : r(t) ? (e._a = u(t.slice(0), function(e) {
                        return parseInt(e, 10)
                    }),
                    Lt(e)) : i(t) ? function(e) {
                        if (!e._d) {
                            var t = A(e._i);
                            e._a = u([t.year, t.month, t.day || t.date, t.hour, t.minute, t.second, t.millisecond], function(e) {
                                return e && parseInt(e, 10)
                            }),
                            Lt(e)
                        }
                    }(e) : _(t) ? e._d = new Date(t) : s.createFromInputFallback(e)
                }(e),
                M(e) || (e._d = null),
                e))
            }
            function bt(e, t, a, n, s) {
                var d = {};
                return !0 !== a && !1 !== a || (n = a,
                a = void 0),
                (i(e) && function(e) {
                    if (Object.getOwnPropertyNames)
                        return 0 === Object.getOwnPropertyNames(e).length;
                    var t;
                    for (t in e)
                        if (e.hasOwnProperty(t))
                            return !1;
                    return !0
                }(e) || r(e) && 0 === e.length) && (e = void 0),
                d._isAMomentObject = !0,
                d._useUTC = d._isUTC = s,
                d._l = a,
                d._i = e,
                d._f = t,
                d._strict = n,
                function(e) {
                    var t = new p(ht(Ht(e)));
                    return t._nextDay && (t.add(1, "d"),
                    t._nextDay = void 0),
                    t
                }(d)
            }
            function xt(e, t, a, n) {
                return bt(e, t, a, n, !1)
            }
            s.createFromInputFallback = v("value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are discouraged and will be removed in an upcoming major release. Please refer to http://momentjs.com/guides/#/warnings/js-date/ for more info.", function(e) {
                e._d = new Date(e._i + (e._useUTC ? " UTC" : ""))
            }),
            s.ISO_8601 = function() {}
            ,
            s.RFC_2822 = function() {}
            ;
            var Ot = v("moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/", function() {
                var e = xt.apply(null, arguments);
                return this.isValid() && e.isValid() ? e < this ? this : e : L()
            })
              , Pt = v("moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/", function() {
                var e = xt.apply(null, arguments);
                return this.isValid() && e.isValid() ? e > this ? this : e : L()
            });
            function Wt(e, t) {
                var a, n;
                if (1 === t.length && r(t[0]) && (t = t[0]),
                !t.length)
                    return xt();
                for (a = t[0],
                n = 1; n < t.length; ++n)
                    t[n].isValid() && !t[n][e](a) || (a = t[n]);
                return a
            }
            var Et = ["year", "quarter", "month", "week", "day", "hour", "minute", "second", "millisecond"];
            function At(e) {
                var t = A(e)
                  , a = t.year || 0
                  , n = t.quarter || 0
                  , s = t.month || 0
                  , r = t.week || 0
                  , i = t.day || 0
                  , d = t.hour || 0
                  , _ = t.minute || 0
                  , o = t.second || 0
                  , u = t.millisecond || 0;
                this._isValid = function(e) {
                    for (var t in e)
                        if (-1 === He.call(Et, t) || null != e[t] && isNaN(e[t]))
                            return !1;
                    for (var a = !1, n = 0; n < Et.length; ++n)
                        if (e[Et[n]]) {
                            if (a)
                                return !1;
                            parseFloat(e[Et[n]]) !== T(e[Et[n]]) && (a = !0)
                        }
                    return !0
                }(t),
                this._milliseconds = +u + 1e3 * o + 6e4 * _ + 1e3 * d * 60 * 60,
                this._days = +i + 7 * r,
                this._months = +s + 3 * n + 12 * a,
                this._data = {},
                this._locale = ct(),
                this._bubble()
            }
            function Ft(e) {
                return e instanceof At
            }
            function zt(e) {
                return e < 0 ? -1 * Math.round(-1 * e) : Math.round(e)
            }
            function Jt(e, t) {
                U(e, 0, 0, function() {
                    var e = this.utcOffset()
                      , a = "+";
                    return e < 0 && (e = -e,
                    a = "-"),
                    a + J(~~(e / 60), 2) + t + J(~~e % 60, 2)
                })
            }
            Jt("Z", ":"),
            Jt("ZZ", ""),
            me("Z", _e),
            me("ZZ", _e),
            Me(["Z", "ZZ"], function(e, t, a) {
                a._useUTC = !0,
                a._tzm = It(_e, e)
            });
            var Nt = /([\+\-]|\d\d)/gi;
            function It(e, t) {
                var a = (t || "").match(e);
                if (null === a)
                    return null;
                var n = a[a.length - 1] || []
                  , s = (n + "").match(Nt) || ["-", 0, 0]
                  , r = 60 * s[1] + T(s[2]);
                return 0 === r ? 0 : "+" === s[0] ? r : -r
            }
            function Ct(e, t) {
                var a, n;
                return t._isUTC ? (a = t.clone(),
                n = (D(e) || o(e) ? e.valueOf() : xt(e).valueOf()) - a.valueOf(),
                a._d.setTime(a._d.valueOf() + n),
                s.updateOffset(a, !1),
                a) : xt(e).local()
            }
            function Rt(e) {
                return 15 * -Math.round(e._d.getTimezoneOffset() / 15)
            }
            function Ut() {
                return !!this.isValid() && this._isUTC && 0 === this._offset
            }
            s.updateOffset = function() {}
            ;
            var Gt = /^(\-|\+)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/
              , Vt = /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;
            function Zt(e, t) {
                var a, n, s, r = e, i = null;
                return Ft(e) ? r = {
                    ms: e._milliseconds,
                    d: e._days,
                    M: e._months
                } : _(e) ? (r = {},
                t ? r[t] = e : r.milliseconds = e) : (i = Gt.exec(e)) ? (a = "-" === i[1] ? -1 : 1,
                r = {
                    y: 0,
                    d: T(i[pe]) * a,
                    h: T(i[De]) * a,
                    m: T(i[ke]) * a,
                    s: T(i[Te]) * a,
                    ms: T(zt(1e3 * i[ge])) * a
                }) : (i = Vt.exec(e)) ? (a = "-" === i[1] ? -1 : (i[1],
                1),
                r = {
                    y: Bt(i[2], a),
                    M: Bt(i[3], a),
                    w: Bt(i[4], a),
                    d: Bt(i[5], a),
                    h: Bt(i[6], a),
                    m: Bt(i[7], a),
                    s: Bt(i[8], a)
                }) : null == r ? r = {} : "object" == typeof r && ("from"in r || "to"in r) && (s = function(e, t) {
                    var a;
                    return e.isValid() && t.isValid() ? (t = Ct(t, e),
                    e.isBefore(t) ? a = Kt(e, t) : ((a = Kt(t, e)).milliseconds = -a.milliseconds,
                    a.months = -a.months),
                    a) : {
                        milliseconds: 0,
                        months: 0
                    }
                }(xt(r.from), xt(r.to)),
                (r = {}).ms = s.milliseconds,
                r.M = s.months),
                n = new At(r),
                Ft(e) && m(e, "_locale") && (n._locale = e._locale),
                n
            }
            function Bt(e, t) {
                var a = e && parseFloat(e.replace(",", "."));
                return (isNaN(a) ? 0 : a) * t
            }
            function Kt(e, t) {
                var a = {
                    milliseconds: 0,
                    months: 0
                };
                return a.months = t.month() - e.month() + 12 * (t.year() - e.year()),
                e.clone().add(a.months, "M").isAfter(t) && --a.months,
                a.milliseconds = +t - +e.clone().add(a.months, "M"),
                a
            }
            function $t(e, t) {
                return function(a, n) {
                    var s;
                    return null === n || isNaN(+n) || (H(t, "moment()." + t + "(period, number) is deprecated. Please use moment()." + t + "(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info."),
                    s = a,
                    a = n,
                    n = s),
                    qt(this, Zt(a = "string" == typeof a ? +a : a, n), e),
                    this
                }
            }
            function qt(e, t, a, n) {
                var r = t._milliseconds
                  , i = zt(t._days)
                  , d = zt(t._months);
                e.isValid() && (n = null == n || n,
                d && ze(e, Oe(e, "Month") + d * a),
                i && Pe(e, "Date", Oe(e, "Date") + i * a),
                r && e._d.setTime(e._d.valueOf() + r * a),
                n && s.updateOffset(e, i || d))
            }
            Zt.fn = At.prototype,
            Zt.invalid = function() {
                return Zt(NaN)
            }
            ;
            var Qt = $t(1, "add")
              , Xt = $t(-1, "subtract");
            function ea(e, t) {
                var a, n, s = 12 * (t.year() - e.year()) + (t.month() - e.month()), r = e.clone().add(s, "months");
                return t - r < 0 ? (a = e.clone().add(s - 1, "months"),
                n = (t - r) / (r - a)) : (a = e.clone().add(s + 1, "months"),
                n = (t - r) / (a - r)),
                -(s + n) || 0
            }
            function ta(e) {
                var t;
                return void 0 === e ? this._locale._abbr : (null != (t = ct(e)) && (this._locale = t),
                this)
            }
            s.defaultFormat = "YYYY-MM-DDTHH:mm:ssZ",
            s.defaultFormatUtc = "YYYY-MM-DDTHH:mm:ss[Z]";
            var aa = v("moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.", function(e) {
                return void 0 === e ? this.localeData() : this.locale(e)
            });
            function na() {
                return this._locale
            }
            function sa(e, t) {
                U(0, [e, e.length], 0, t)
            }
            function ra(e, t, a, n, s) {
                var r;
                return null == e ? Ve(this, n, s).year : (r = Ze(e, n, s),
                t > r && (t = r),
                function(e, t, a, n, s) {
                    var r = Ge(e, t, a, n, s)
                      , i = Re(r.year, 0, r.dayOfYear);
                    return this.year(i.getUTCFullYear()),
                    this.month(i.getUTCMonth()),
                    this.date(i.getUTCDate()),
                    this
                }
                .call(this, e, t, a, n, s))
            }
            U(0, ["gg", 2], 0, function() {
                return this.weekYear() % 100
            }),
            U(0, ["GG", 2], 0, function() {
                return this.isoWeekYear() % 100
            }),
            sa("gggg", "weekYear"),
            sa("ggggg", "weekYear"),
            sa("GGGG", "isoWeekYear"),
            sa("GGGGG", "isoWeekYear"),
            W("weekYear", "gg"),
            W("isoWeekYear", "GG"),
            z("weekYear", 1),
            z("isoWeekYear", 1),
            me("G", ie),
            me("g", ie),
            me("GG", X, K),
            me("gg", X, K),
            me("GGGG", ne, q),
            me("gggg", ne, q),
            me("GGGGG", se, Q),
            me("ggggg", se, Q),
            Le(["gggg", "ggggg", "GGGG", "GGGGG"], function(e, t, a, n) {
                t[n.substr(0, 2)] = T(e)
            }),
            Le(["gg", "GG"], function(e, t, a, n) {
                t[n] = s.parseTwoDigitYear(e)
            }),
            U("Q", 0, "Qo", "quarter"),
            W("quarter", "Q"),
            z("quarter", 7),
            me("Q", B),
            Me("Q", function(e, t) {
                t[fe] = 3 * (T(e) - 1)
            }),
            U("D", ["DD", 2], "Do", "date"),
            W("date", "D"),
            z("date", 9),
            me("D", X),
            me("DD", X, K),
            me("Do", function(e, t) {
                return e ? t._dayOfMonthOrdinalParse || t._ordinalParse : t._dayOfMonthOrdinalParseLenient
            }),
            Me(["D", "DD"], pe),
            Me("Do", function(e, t) {
                t[pe] = T(e.match(X)[0])
            });
            var ia = xe("Date", !0);
            U("DDD", ["DDDD", 3], "DDDo", "dayOfYear"),
            W("dayOfYear", "DDD"),
            z("dayOfYear", 4),
            me("DDD", ae),
            me("DDDD", $),
            Me(["DDD", "DDDD"], function(e, t, a) {
                a._dayOfYear = T(e)
            }),
            U("m", ["mm", 2], 0, "minute"),
            W("minute", "m"),
            z("minute", 14),
            me("m", X),
            me("mm", X, K),
            Me(["m", "mm"], ke);
            var da = xe("Minutes", !1);
            U("s", ["ss", 2], 0, "second"),
            W("second", "s"),
            z("second", 15),
            me("s", X),
            me("ss", X, K),
            Me(["s", "ss"], Te);
            var _a, oa = xe("Seconds", !1);
            for (U("S", 0, 0, function() {
                return ~~(this.millisecond() / 100)
            }),
            U(0, ["SS", 2], 0, function() {
                return ~~(this.millisecond() / 10)
            }),
            U(0, ["SSS", 3], 0, "millisecond"),
            U(0, ["SSSS", 4], 0, function() {
                return 10 * this.millisecond()
            }),
            U(0, ["SSSSS", 5], 0, function() {
                return 100 * this.millisecond()
            }),
            U(0, ["SSSSSS", 6], 0, function() {
                return 1e3 * this.millisecond()
            }),
            U(0, ["SSSSSSS", 7], 0, function() {
                return 1e4 * this.millisecond()
            }),
            U(0, ["SSSSSSSS", 8], 0, function() {
                return 1e5 * this.millisecond()
            }),
            U(0, ["SSSSSSSSS", 9], 0, function() {
                return 1e6 * this.millisecond()
            }),
            W("millisecond", "ms"),
            z("millisecond", 16),
            me("S", ae, B),
            me("SS", ae, K),
            me("SSS", ae, $),
            _a = "SSSS"; _a.length <= 9; _a += "S")
                me(_a, re);
            function ua(e, t) {
                t[ge] = T(1e3 * ("0." + e))
            }
            for (_a = "S"; _a.length <= 9; _a += "S")
                Me(_a, ua);
            var ma = xe("Milliseconds", !1);
            U("z", 0, 0, "zoneAbbr"),
            U("zz", 0, 0, "zoneName");
            var la = p.prototype;
            function ca(e) {
                return e
            }
            la.add = Qt,
            la.calendar = function(e, t) {
                var a = e || xt()
                  , n = Ct(a, this).startOf("day")
                  , r = s.calendarFormat(this, n) || "sameElse"
                  , i = t && (b(t[r]) ? t[r].call(this, a) : t[r]);
                return this.format(i || this.localeData().calendar(r, this, xt(a)))
            }
            ,
            la.clone = function() {
                return new p(this)
            }
            ,
            la.diff = function(e, t, a) {
                var n, s, r;
                if (!this.isValid())
                    return NaN;
                if (!(n = Ct(e, this)).isValid())
                    return NaN;
                switch (s = 6e4 * (n.utcOffset() - this.utcOffset()),
                t = E(t)) {
                case "year":
                    r = ea(this, n) / 12;
                    break;
                case "month":
                    r = ea(this, n);
                    break;
                case "quarter":
                    r = ea(this, n) / 3;
                    break;
                case "second":
                    r = (this - n) / 1e3;
                    break;
                case "minute":
                    r = (this - n) / 6e4;
                    break;
                case "hour":
                    r = (this - n) / 36e5;
                    break;
                case "day":
                    r = (this - n - s) / 864e5;
                    break;
                case "week":
                    r = (this - n - s) / 6048e5;
                    break;
                default:
                    r = this - n
                }
                return a ? r : k(r)
            }
            ,
            la.endOf = function(e) {
                return void 0 === (e = E(e)) || "millisecond" === e ? this : ("date" === e && (e = "day"),
                this.startOf(e).add(1, "isoWeek" === e ? "week" : e).subtract(1, "ms"))
            }
            ,
            la.format = function(e) {
                e || (e = this.isUtc() ? s.defaultFormatUtc : s.defaultFormat);
                var t = V(this, e);
                return this.localeData().postformat(t)
            }
            ,
            la.from = function(e, t) {
                return this.isValid() && (D(e) && e.isValid() || xt(e).isValid()) ? Zt({
                    to: this,
                    from: e
                }).locale(this.locale()).humanize(!t) : this.localeData().invalidDate()
            }
            ,
            la.fromNow = function(e) {
                return this.from(xt(), e)
            }
            ,
            la.to = function(e, t) {
                return this.isValid() && (D(e) && e.isValid() || xt(e).isValid()) ? Zt({
                    from: this,
                    to: e
                }).locale(this.locale()).humanize(!t) : this.localeData().invalidDate()
            }
            ,
            la.toNow = function(e) {
                return this.to(xt(), e)
            }
            ,
            la.get = function(e) {
                return b(this[e = E(e)]) ? this[e]() : this
            }
            ,
            la.invalidAt = function() {
                return h(this).overflow
            }
            ,
            la.isAfter = function(e, t) {
                var a = D(e) ? e : xt(e);
                return !(!this.isValid() || !a.isValid()) && ("millisecond" === (t = E(d(t) ? "millisecond" : t)) ? this.valueOf() > a.valueOf() : a.valueOf() < this.clone().startOf(t).valueOf())
            }
            ,
            la.isBefore = function(e, t) {
                var a = D(e) ? e : xt(e);
                return !(!this.isValid() || !a.isValid()) && ("millisecond" === (t = E(d(t) ? "millisecond" : t)) ? this.valueOf() < a.valueOf() : this.clone().endOf(t).valueOf() < a.valueOf())
            }
            ,
            la.isBetween = function(e, t, a, n) {
                return ("(" === (n = n || "()")[0] ? this.isAfter(e, a) : !this.isBefore(e, a)) && (")" === n[1] ? this.isBefore(t, a) : !this.isAfter(t, a))
            }
            ,
            la.isSame = function(e, t) {
                var a, n = D(e) ? e : xt(e);
                return !(!this.isValid() || !n.isValid()) && ("millisecond" === (t = E(t || "millisecond")) ? this.valueOf() === n.valueOf() : (a = n.valueOf(),
                this.clone().startOf(t).valueOf() <= a && a <= this.clone().endOf(t).valueOf()))
            }
            ,
            la.isSameOrAfter = function(e, t) {
                return this.isSame(e, t) || this.isAfter(e, t)
            }
            ,
            la.isSameOrBefore = function(e, t) {
                return this.isSame(e, t) || this.isBefore(e, t)
            }
            ,
            la.isValid = function() {
                return M(this)
            }
            ,
            la.lang = aa,
            la.locale = ta,
            la.localeData = na,
            la.max = Pt,
            la.min = Ot,
            la.parsingFlags = function() {
                return l({}, h(this))
            }
            ,
            la.set = function(e, t) {
                if ("object" == typeof e)
                    for (var a = function(e) {
                        var t = [];
                        for (var a in e)
                            t.push({
                                unit: a,
                                priority: F[a]
                            });
                        return t.sort(function(e, t) {
                            return e.priority - t.priority
                        }),
                        t
                    }(e = A(e)), n = 0; n < a.length; n++)
                        this[a[n].unit](e[a[n].unit]);
                else if (b(this[e = E(e)]))
                    return this[e](t);
                return this
            }
            ,
            la.startOf = function(e) {
                switch (e = E(e)) {
                case "year":
                    this.month(0);
                case "quarter":
                case "month":
                    this.date(1);
                case "week":
                case "isoWeek":
                case "day":
                case "date":
                    this.hours(0);
                case "hour":
                    this.minutes(0);
                case "minute":
                    this.seconds(0);
                case "second":
                    this.milliseconds(0)
                }
                return "week" === e && this.weekday(0),
                "isoWeek" === e && this.isoWeekday(1),
                "quarter" === e && this.month(3 * Math.floor(this.month() / 3)),
                this
            }
            ,
            la.subtract = Xt,
            la.toArray = function() {
                var e = this;
                return [e.year(), e.month(), e.date(), e.hour(), e.minute(), e.second(), e.millisecond()]
            }
            ,
            la.toObject = function() {
                var e = this;
                return {
                    years: e.year(),
                    months: e.month(),
                    date: e.date(),
                    hours: e.hours(),
                    minutes: e.minutes(),
                    seconds: e.seconds(),
                    milliseconds: e.milliseconds()
                }
            }
            ,
            la.toDate = function() {
                return new Date(this.valueOf())
            }
            ,
            la.toISOString = function(e) {
                if (!this.isValid())
                    return null;
                var t = !0 !== e
                  , a = t ? this.clone().utc() : this;
                return a.year() < 0 || a.year() > 9999 ? V(a, t ? "YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]" : "YYYYYY-MM-DD[T]HH:mm:ss.SSSZ") : b(Date.prototype.toISOString) ? t ? this.toDate().toISOString() : new Date(this.valueOf() + 60 * this.utcOffset() * 1e3).toISOString().replace("Z", V(a, "Z")) : V(a, t ? "YYYY-MM-DD[T]HH:mm:ss.SSS[Z]" : "YYYY-MM-DD[T]HH:mm:ss.SSSZ")
            }
            ,
            la.inspect = function() {
                if (!this.isValid())
                    return "moment.invalid(/* " + this._i + " */)";
                var e = "moment"
                  , t = "";
                this.isLocal() || (e = 0 === this.utcOffset() ? "moment.utc" : "moment.parseZone",
                t = "Z");
                var a = "[" + e + '("]'
                  , n = 0 <= this.year() && this.year() <= 9999 ? "YYYY" : "YYYYYY"
                  , s = t + '[")]';
                return this.format(a + n + "-MM-DD[T]HH:mm:ss.SSS" + s)
            }
            ,
            la.toJSON = function() {
                return this.isValid() ? this.toISOString() : null
            }
            ,
            la.toString = function() {
                return this.clone().locale("en").format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ")
            }
            ,
            la.unix = function() {
                return Math.floor(this.valueOf() / 1e3)
            }
            ,
            la.valueOf = function() {
                return this._d.valueOf() - 6e4 * (this._offset || 0)
            }
            ,
            la.creationData = function() {
                return {
                    input: this._i,
                    format: this._f,
                    locale: this._locale,
                    isUTC: this._isUTC,
                    strict: this._strict
                }
            }
            ,
            la.year = be,
            la.isLeapYear = function() {
                return Se(this.year())
            }
            ,
            la.weekYear = function(e) {
                return ra.call(this, e, this.week(), this.weekday(), this.localeData()._week.dow, this.localeData()._week.doy)
            }
            ,
            la.isoWeekYear = function(e) {
                return ra.call(this, e, this.isoWeek(), this.isoWeekday(), 1, 4)
            }
            ,
            la.quarter = la.quarters = function(e) {
                return null == e ? Math.ceil((this.month() + 1) / 3) : this.month(3 * (e - 1) + this.month() % 3)
            }
            ,
            la.month = Je,
            la.daysInMonth = function() {
                return We(this.year(), this.month())
            }
            ,
            la.week = la.weeks = function(e) {
                var t = this.localeData().week(this);
                return null == e ? t : this.add(7 * (e - t), "d")
            }
            ,
            la.isoWeek = la.isoWeeks = function(e) {
                var t = Ve(this, 1, 4).week;
                return null == e ? t : this.add(7 * (e - t), "d")
            }
            ,
            la.weeksInYear = function() {
                var e = this.localeData()._week;
                return Ze(this.year(), e.dow, e.doy)
            }
            ,
            la.isoWeeksInYear = function() {
                return Ze(this.year(), 1, 4)
            }
            ,
            la.date = ia,
            la.day = la.days = function(e) {
                if (!this.isValid())
                    return null != e ? this : NaN;
                var t = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
                return null != e ? (e = function(e, t) {
                    return "string" != typeof e ? e : isNaN(e) ? "number" == typeof (e = t.weekdaysParse(e)) ? e : null : parseInt(e, 10)
                }(e, this.localeData()),
                this.add(e - t, "d")) : t
            }
            ,
            la.weekday = function(e) {
                if (!this.isValid())
                    return null != e ? this : NaN;
                var t = (this.day() + 7 - this.localeData()._week.dow) % 7;
                return null == e ? t : this.add(e - t, "d")
            }
            ,
            la.isoWeekday = function(e) {
                if (!this.isValid())
                    return null != e ? this : NaN;
                if (null != e) {
                    var t = function(e, t) {
                        return "string" == typeof e ? t.weekdaysParse(e) % 7 || 7 : isNaN(e) ? null : e
                    }(e, this.localeData());
                    return this.day(this.day() % 7 ? t : t - 7)
                }
                return this.day() || 7
            }
            ,
            la.dayOfYear = function(e) {
                var t = Math.round((this.clone().startOf("day") - this.clone().startOf("year")) / 864e5) + 1;
                return null == e ? t : this.add(e - t, "d")
            }
            ,
            la.hour = la.hours = rt,
            la.minute = la.minutes = da,
            la.second = la.seconds = oa,
            la.millisecond = la.milliseconds = ma,
            la.utcOffset = function(e, t, a) {
                var n, r = this._offset || 0;
                if (!this.isValid())
                    return null != e ? this : NaN;
                if (null != e) {
                    if ("string" == typeof e) {
                        if (null === (e = It(_e, e)))
                            return this
                    } else
                        Math.abs(e) < 16 && !a && (e *= 60);
                    return !this._isUTC && t && (n = Rt(this)),
                    this._offset = e,
                    this._isUTC = !0,
                    null != n && this.add(n, "m"),
                    r !== e && (!t || this._changeInProgress ? qt(this, Zt(e - r, "m"), 1, !1) : this._changeInProgress || (this._changeInProgress = !0,
                    s.updateOffset(this, !0),
                    this._changeInProgress = null)),
                    this
                }
                return this._isUTC ? r : Rt(this)
            }
            ,
            la.utc = function(e) {
                return this.utcOffset(0, e)
            }
            ,
            la.local = function(e) {
                return this._isUTC && (this.utcOffset(0, e),
                this._isUTC = !1,
                e && this.subtract(Rt(this), "m")),
                this
            }
            ,
            la.parseZone = function() {
                if (null != this._tzm)
                    this.utcOffset(this._tzm, !1, !0);
                else if ("string" == typeof this._i) {
                    var e = It(de, this._i);
                    null != e ? this.utcOffset(e) : this.utcOffset(0, !0)
                }
                return this
            }
            ,
            la.hasAlignedHourOffset = function(e) {
                return !!this.isValid() && (e = e ? xt(e).utcOffset() : 0,
                (this.utcOffset() - e) % 60 == 0)
            }
            ,
            la.isDST = function() {
                return this.utcOffset() > this.clone().month(0).utcOffset() || this.utcOffset() > this.clone().month(5).utcOffset()
            }
            ,
            la.isLocal = function() {
                return !!this.isValid() && !this._isUTC
            }
            ,
            la.isUtcOffset = function() {
                return !!this.isValid() && this._isUTC
            }
            ,
            la.isUtc = Ut,
            la.isUTC = Ut,
            la.zoneAbbr = function() {
                return this._isUTC ? "UTC" : ""
            }
            ,
            la.zoneName = function() {
                return this._isUTC ? "Coordinated Universal Time" : ""
            }
            ,
            la.dates = v("dates accessor is deprecated. Use date instead.", ia),
            la.months = v("months accessor is deprecated. Use month instead", Je),
            la.years = v("years accessor is deprecated. Use year instead", be),
            la.zone = v("moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/", function(e, t) {
                return null != e ? ("string" != typeof e && (e = -e),
                this.utcOffset(e, t),
                this) : -this.utcOffset()
            }),
            la.isDSTShifted = v("isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information", function() {
                if (!d(this._isDSTShifted))
                    return this._isDSTShifted;
                var e = {};
                if (y(e, this),
                (e = Ht(e))._a) {
                    var t = e._isUTC ? c(e._a) : xt(e._a);
                    this._isDSTShifted = this.isValid() && g(e._a, t.toArray()) > 0
                } else
                    this._isDSTShifted = !1;
                return this._isDSTShifted
            });
            var ha = O.prototype;
            function Ma(e, t, a, n) {
                var s = ct()
                  , r = c().set(n, t);
                return s[a](r, e)
            }
            function La(e, t, a) {
                if (_(e) && (t = e,
                e = void 0),
                e = e || "",
                null != t)
                    return Ma(e, t, a, "month");
                var n, s = [];
                for (n = 0; n < 12; n++)
                    s[n] = Ma(e, n, a, "month");
                return s
            }
            function Ya(e, t, a, n) {
                "boolean" == typeof e ? (_(t) && (a = t,
                t = void 0),
                t = t || "") : (a = t = e,
                e = !1,
                _(t) && (a = t,
                t = void 0),
                t = t || "");
                var s, r = ct(), i = e ? r._week.dow : 0;
                if (null != a)
                    return Ma(t, (a + i) % 7, n, "day");
                var d = [];
                for (s = 0; s < 7; s++)
                    d[s] = Ma(t, (s + i) % 7, n, "day");
                return d
            }
            ha.calendar = function(e, t, a) {
                var n = this._calendar[e] || this._calendar.sameElse;
                return b(n) ? n.call(t, a) : n
            }
            ,
            ha.longDateFormat = function(e) {
                var t = this._longDateFormat[e]
                  , a = this._longDateFormat[e.toUpperCase()];
                return t || !a ? t : (this._longDateFormat[e] = a.replace(/MMMM|MM|DD|dddd/g, function(e) {
                    return e.slice(1)
                }),
                this._longDateFormat[e])
            }
            ,
            ha.invalidDate = function() {
                return this._invalidDate
            }
            ,
            ha.ordinal = function(e) {
                return this._ordinal.replace("%d", e)
            }
            ,
            ha.preparse = ca,
            ha.postformat = ca,
            ha.relativeTime = function(e, t, a, n) {
                var s = this._relativeTime[a];
                return b(s) ? s(e, t, a, n) : s.replace(/%d/i, e)
            }
            ,
            ha.pastFuture = function(e, t) {
                var a = this._relativeTime[e > 0 ? "future" : "past"];
                return b(a) ? a(t) : a.replace(/%s/i, t)
            }
            ,
            ha.set = function(e) {
                var t, a;
                for (a in e)
                    b(t = e[a]) ? this[a] = t : this["_" + a] = t;
                this._config = e,
                this._dayOfMonthOrdinalParseLenient = new RegExp((this._dayOfMonthOrdinalParse.source || this._ordinalParse.source) + "|" + /\d{1,2}/.source)
            }
            ,
            ha.months = function(e, t) {
                return e ? r(this._months) ? this._months[e.month()] : this._months[(this._months.isFormat || Ee).test(t) ? "format" : "standalone"][e.month()] : r(this._months) ? this._months : this._months.standalone
            }
            ,
            ha.monthsShort = function(e, t) {
                return e ? r(this._monthsShort) ? this._monthsShort[e.month()] : this._monthsShort[Ee.test(t) ? "format" : "standalone"][e.month()] : r(this._monthsShort) ? this._monthsShort : this._monthsShort.standalone
            }
            ,
            ha.monthsParse = function(e, t, a) {
                var n, s, r;
                if (this._monthsParseExact)
                    return function(e, t, a) {
                        var n, s, r, i = e.toLocaleLowerCase();
                        if (!this._monthsParse)
                            for (this._monthsParse = [],
                            this._longMonthsParse = [],
                            this._shortMonthsParse = [],
                            n = 0; n < 12; ++n)
                                r = c([2e3, n]),
                                this._shortMonthsParse[n] = this.monthsShort(r, "").toLocaleLowerCase(),
                                this._longMonthsParse[n] = this.months(r, "").toLocaleLowerCase();
                        return a ? "MMM" === t ? -1 !== (s = He.call(this._shortMonthsParse, i)) ? s : null : -1 !== (s = He.call(this._longMonthsParse, i)) ? s : null : "MMM" === t ? -1 !== (s = He.call(this._shortMonthsParse, i)) ? s : -1 !== (s = He.call(this._longMonthsParse, i)) ? s : null : -1 !== (s = He.call(this._longMonthsParse, i)) ? s : -1 !== (s = He.call(this._shortMonthsParse, i)) ? s : null
                    }
                    .call(this, e, t, a);
                for (this._monthsParse || (this._monthsParse = [],
                this._longMonthsParse = [],
                this._shortMonthsParse = []),
                n = 0; n < 12; n++) {
                    if (s = c([2e3, n]),
                    a && !this._longMonthsParse[n] && (this._longMonthsParse[n] = new RegExp("^" + this.months(s, "").replace(".", "") + "$","i"),
                    this._shortMonthsParse[n] = new RegExp("^" + this.monthsShort(s, "").replace(".", "") + "$","i")),
                    a || this._monthsParse[n] || (r = "^" + this.months(s, "") + "|^" + this.monthsShort(s, ""),
                    this._monthsParse[n] = new RegExp(r.replace(".", ""),"i")),
                    a && "MMMM" === t && this._longMonthsParse[n].test(e))
                        return n;
                    if (a && "MMM" === t && this._shortMonthsParse[n].test(e))
                        return n;
                    if (!a && this._monthsParse[n].test(e))
                        return n
                }
            }
            ,
            ha.monthsRegex = function(e) {
                return this._monthsParseExact ? (m(this, "_monthsRegex") || Ce.call(this),
                e ? this._monthsStrictRegex : this._monthsRegex) : (m(this, "_monthsRegex") || (this._monthsRegex = Ie),
                this._monthsStrictRegex && e ? this._monthsStrictRegex : this._monthsRegex)
            }
            ,
            ha.monthsShortRegex = function(e) {
                return this._monthsParseExact ? (m(this, "_monthsRegex") || Ce.call(this),
                e ? this._monthsShortStrictRegex : this._monthsShortRegex) : (m(this, "_monthsShortRegex") || (this._monthsShortRegex = Ne),
                this._monthsShortStrictRegex && e ? this._monthsShortStrictRegex : this._monthsShortRegex)
            }
            ,
            ha.week = function(e) {
                return Ve(e, this._week.dow, this._week.doy).week
            }
            ,
            ha.firstDayOfYear = function() {
                return this._week.doy
            }
            ,
            ha.firstDayOfWeek = function() {
                return this._week.dow
            }
            ,
            ha.weekdays = function(e, t) {
                return e ? r(this._weekdays) ? this._weekdays[e.day()] : this._weekdays[this._weekdays.isFormat.test(t) ? "format" : "standalone"][e.day()] : r(this._weekdays) ? this._weekdays : this._weekdays.standalone
            }
            ,
            ha.weekdaysMin = function(e) {
                return e ? this._weekdaysMin[e.day()] : this._weekdaysMin
            }
            ,
            ha.weekdaysShort = function(e) {
                return e ? this._weekdaysShort[e.day()] : this._weekdaysShort
            }
            ,
            ha.weekdaysParse = function(e, t, a) {
                var n, s, r;
                if (this._weekdaysParseExact)
                    return function(e, t, a) {
                        var n, s, r, i = e.toLocaleLowerCase();
                        if (!this._weekdaysParse)
                            for (this._weekdaysParse = [],
                            this._shortWeekdaysParse = [],
                            this._minWeekdaysParse = [],
                            n = 0; n < 7; ++n)
                                r = c([2e3, 1]).day(n),
                                this._minWeekdaysParse[n] = this.weekdaysMin(r, "").toLocaleLowerCase(),
                                this._shortWeekdaysParse[n] = this.weekdaysShort(r, "").toLocaleLowerCase(),
                                this._weekdaysParse[n] = this.weekdays(r, "").toLocaleLowerCase();
                        return a ? "dddd" === t ? -1 !== (s = He.call(this._weekdaysParse, i)) ? s : null : "ddd" === t ? -1 !== (s = He.call(this._shortWeekdaysParse, i)) ? s : null : -1 !== (s = He.call(this._minWeekdaysParse, i)) ? s : null : "dddd" === t ? -1 !== (s = He.call(this._weekdaysParse, i)) ? s : -1 !== (s = He.call(this._shortWeekdaysParse, i)) ? s : -1 !== (s = He.call(this._minWeekdaysParse, i)) ? s : null : "ddd" === t ? -1 !== (s = He.call(this._shortWeekdaysParse, i)) ? s : -1 !== (s = He.call(this._weekdaysParse, i)) ? s : -1 !== (s = He.call(this._minWeekdaysParse, i)) ? s : null : -1 !== (s = He.call(this._minWeekdaysParse, i)) ? s : -1 !== (s = He.call(this._weekdaysParse, i)) ? s : -1 !== (s = He.call(this._shortWeekdaysParse, i)) ? s : null
                    }
                    .call(this, e, t, a);
                for (this._weekdaysParse || (this._weekdaysParse = [],
                this._minWeekdaysParse = [],
                this._shortWeekdaysParse = [],
                this._fullWeekdaysParse = []),
                n = 0; n < 7; n++) {
                    if (s = c([2e3, 1]).day(n),
                    a && !this._fullWeekdaysParse[n] && (this._fullWeekdaysParse[n] = new RegExp("^" + this.weekdays(s, "").replace(".", "\\.?") + "$","i"),
                    this._shortWeekdaysParse[n] = new RegExp("^" + this.weekdaysShort(s, "").replace(".", "\\.?") + "$","i"),
                    this._minWeekdaysParse[n] = new RegExp("^" + this.weekdaysMin(s, "").replace(".", "\\.?") + "$","i")),
                    this._weekdaysParse[n] || (r = "^" + this.weekdays(s, "") + "|^" + this.weekdaysShort(s, "") + "|^" + this.weekdaysMin(s, ""),
                    this._weekdaysParse[n] = new RegExp(r.replace(".", ""),"i")),
                    a && "dddd" === t && this._fullWeekdaysParse[n].test(e))
                        return n;
                    if (a && "ddd" === t && this._shortWeekdaysParse[n].test(e))
                        return n;
                    if (a && "dd" === t && this._minWeekdaysParse[n].test(e))
                        return n;
                    if (!a && this._weekdaysParse[n].test(e))
                        return n
                }
            }
            ,
            ha.weekdaysRegex = function(e) {
                return this._weekdaysParseExact ? (m(this, "_weekdaysRegex") || et.call(this),
                e ? this._weekdaysStrictRegex : this._weekdaysRegex) : (m(this, "_weekdaysRegex") || (this._weekdaysRegex = qe),
                this._weekdaysStrictRegex && e ? this._weekdaysStrictRegex : this._weekdaysRegex)
            }
            ,
            ha.weekdaysShortRegex = function(e) {
                return this._weekdaysParseExact ? (m(this, "_weekdaysRegex") || et.call(this),
                e ? this._weekdaysShortStrictRegex : this._weekdaysShortRegex) : (m(this, "_weekdaysShortRegex") || (this._weekdaysShortRegex = Qe),
                this._weekdaysShortStrictRegex && e ? this._weekdaysShortStrictRegex : this._weekdaysShortRegex)
            }
            ,
            ha.weekdaysMinRegex = function(e) {
                return this._weekdaysParseExact ? (m(this, "_weekdaysRegex") || et.call(this),
                e ? this._weekdaysMinStrictRegex : this._weekdaysMinRegex) : (m(this, "_weekdaysMinRegex") || (this._weekdaysMinRegex = Xe),
                this._weekdaysMinStrictRegex && e ? this._weekdaysMinStrictRegex : this._weekdaysMinRegex)
            }
            ,
            ha.isPM = function(e) {
                return "p" === (e + "").toLowerCase().charAt(0)
            }
            ,
            ha.meridiem = function(e, t, a) {
                return e > 11 ? a ? "pm" : "PM" : a ? "am" : "AM"
            }
            ,
            mt("en", {
                dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
                ordinal: function(e) {
                    var t = e % 10
                      , a = 1 === T(e % 100 / 10) ? "th" : 1 === t ? "st" : 2 === t ? "nd" : 3 === t ? "rd" : "th";
                    return e + a
                }
            }),
            s.lang = v("moment.lang is deprecated. Use moment.locale instead.", mt),
            s.langData = v("moment.langData is deprecated. Use moment.localeData instead.", ct);
            var ya = Math.abs;
            function fa(e, t, a, n) {
                var s = Zt(t, a);
                return e._milliseconds += n * s._milliseconds,
                e._days += n * s._days,
                e._months += n * s._months,
                e._bubble()
            }
            function pa(e) {
                return e < 0 ? Math.floor(e) : Math.ceil(e)
            }
            function Da(e) {
                return 4800 * e / 146097
            }
            function ka(e) {
                return 146097 * e / 4800
            }
            function Ta(e) {
                return function() {
                    return this.as(e)
                }
            }
            var ga = Ta("ms")
              , wa = Ta("s")
              , va = Ta("m")
              , ja = Ta("h")
              , Sa = Ta("d")
              , Ha = Ta("w")
              , ba = Ta("M")
              , xa = Ta("y");
            function Oa(e) {
                return function() {
                    return this.isValid() ? this._data[e] : NaN
                }
            }
            var Pa = Oa("milliseconds")
              , Wa = Oa("seconds")
              , Ea = Oa("minutes")
              , Aa = Oa("hours")
              , Fa = Oa("days")
              , za = Oa("months")
              , Ja = Oa("years")
              , Na = Math.round
              , Ia = {
                ss: 44,
                s: 45,
                m: 45,
                h: 22,
                d: 26,
                M: 11
            }
              , Ca = Math.abs;
            function Ra(e) {
                return (e > 0) - (e < 0) || +e
            }
            function Ua() {
                if (!this.isValid())
                    return this.localeData().invalidDate();
                var e, t, a = Ca(this._milliseconds) / 1e3, n = Ca(this._days), s = Ca(this._months);
                e = k(a / 60),
                t = k(e / 60),
                a %= 60,
                e %= 60;
                var r = k(s / 12)
                  , i = s %= 12
                  , d = n
                  , _ = t
                  , o = e
                  , u = a ? a.toFixed(3).replace(/\.?0+$/, "") : ""
                  , m = this.asSeconds();
                if (!m)
                    return "P0D";
                var l = m < 0 ? "-" : ""
                  , c = Ra(this._months) !== Ra(m) ? "-" : ""
                  , h = Ra(this._days) !== Ra(m) ? "-" : ""
                  , M = Ra(this._milliseconds) !== Ra(m) ? "-" : "";
                return l + "P" + (r ? c + r + "Y" : "") + (i ? c + i + "M" : "") + (d ? h + d + "D" : "") + (_ || o || u ? "T" : "") + (_ ? M + _ + "H" : "") + (o ? M + o + "M" : "") + (u ? M + u + "S" : "")
            }
            var Ga = At.prototype;
            return Ga.isValid = function() {
                return this._isValid
            }
            ,
            Ga.abs = function() {
                var e = this._data;
                return this._milliseconds = ya(this._milliseconds),
                this._days = ya(this._days),
                this._months = ya(this._months),
                e.milliseconds = ya(e.milliseconds),
                e.seconds = ya(e.seconds),
                e.minutes = ya(e.minutes),
                e.hours = ya(e.hours),
                e.months = ya(e.months),
                e.years = ya(e.years),
                this
            }
            ,
            Ga.add = function(e, t) {
                return fa(this, e, t, 1)
            }
            ,
            Ga.subtract = function(e, t) {
                return fa(this, e, t, -1)
            }
            ,
            Ga.as = function(e) {
                if (!this.isValid())
                    return NaN;
                var t, a, n = this._milliseconds;
                if ("month" === (e = E(e)) || "year" === e)
                    return t = this._days + n / 864e5,
                    a = this._months + Da(t),
                    "month" === e ? a : a / 12;
                switch (t = this._days + Math.round(ka(this._months)),
                e) {
                case "week":
                    return t / 7 + n / 6048e5;
                case "day":
                    return t + n / 864e5;
                case "hour":
                    return 24 * t + n / 36e5;
                case "minute":
                    return 1440 * t + n / 6e4;
                case "second":
                    return 86400 * t + n / 1e3;
                case "millisecond":
                    return Math.floor(864e5 * t) + n;
                default:
                    throw new Error("Unknown unit " + e)
                }
            }
            ,
            Ga.asMilliseconds = ga,
            Ga.asSeconds = wa,
            Ga.asMinutes = va,
            Ga.asHours = ja,
            Ga.asDays = Sa,
            Ga.asWeeks = Ha,
            Ga.asMonths = ba,
            Ga.asYears = xa,
            Ga.valueOf = function() {
                return this.isValid() ? this._milliseconds + 864e5 * this._days + this._months % 12 * 2592e6 + 31536e6 * T(this._months / 12) : NaN
            }
            ,
            Ga._bubble = function() {
                var e, t, a, n, s, r = this._milliseconds, i = this._days, d = this._months, _ = this._data;
                return r >= 0 && i >= 0 && d >= 0 || r <= 0 && i <= 0 && d <= 0 || (r += 864e5 * pa(ka(d) + i),
                i = 0,
                d = 0),
                _.milliseconds = r % 1e3,
                e = k(r / 1e3),
                _.seconds = e % 60,
                t = k(e / 60),
                _.minutes = t % 60,
                a = k(t / 60),
                _.hours = a % 24,
                i += k(a / 24),
                s = k(Da(i)),
                d += s,
                i -= pa(ka(s)),
                n = k(d / 12),
                d %= 12,
                _.days = i,
                _.months = d,
                _.years = n,
                this
            }
            ,
            Ga.clone = function() {
                return Zt(this)
            }
            ,
            Ga.get = function(e) {
                return e = E(e),
                this.isValid() ? this[e + "s"]() : NaN
            }
            ,
            Ga.milliseconds = Pa,
            Ga.seconds = Wa,
            Ga.minutes = Ea,
            Ga.hours = Aa,
            Ga.days = Fa,
            Ga.weeks = function() {
                return k(this.days() / 7)
            }
            ,
            Ga.months = za,
            Ga.years = Ja,
            Ga.humanize = function(e) {
                if (!this.isValid())
                    return this.localeData().invalidDate();
                var t = this.localeData()
                  , a = function(e, t, a) {
                    var n = Zt(e).abs()
                      , s = Na(n.as("s"))
                      , r = Na(n.as("m"))
                      , i = Na(n.as("h"))
                      , d = Na(n.as("d"))
                      , _ = Na(n.as("M"))
                      , o = Na(n.as("y"))
                      , u = s <= Ia.ss && ["s", s] || s < Ia.s && ["ss", s] || r <= 1 && ["m"] || r < Ia.m && ["mm", r] || i <= 1 && ["h"] || i < Ia.h && ["hh", i] || d <= 1 && ["d"] || d < Ia.d && ["dd", d] || _ <= 1 && ["M"] || _ < Ia.M && ["MM", _] || o <= 1 && ["y"] || ["yy", o];
                    return u[2] = t,
                    u[3] = +e > 0,
                    u[4] = a,
                    function(e, t, a, n, s) {
                        return s.relativeTime(t || 1, !!a, e, n)
                    }
                    .apply(null, u)
                }(this, !e, t);
                return e && (a = t.pastFuture(+this, a)),
                t.postformat(a)
            }
            ,
            Ga.toISOString = Ua,
            Ga.toString = Ua,
            Ga.toJSON = Ua,
            Ga.locale = ta,
            Ga.localeData = na,
            Ga.toIsoString = v("toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)", Ua),
            Ga.lang = aa,
            U("X", 0, 0, "unix"),
            U("x", 0, 0, "valueOf"),
            me("x", ie),
            me("X", /[+-]?\d+(\.\d{1,3})?/),
            Me("X", function(e, t, a) {
                a._d = new Date(1e3 * parseFloat(e, 10))
            }),
            Me("x", function(e, t, a) {
                a._d = new Date(T(e))
            }),
            s.version = "2.22.2",
            function(e) {
                t = e
            }(xt),
            s.fn = la,
            s.min = function() {
                return Wt("isBefore", [].slice.call(arguments, 0))
            }
            ,
            s.max = function() {
                return Wt("isAfter", [].slice.call(arguments, 0))
            }
            ,
            s.now = function() {
                return Date.now ? Date.now() : +new Date
            }
            ,
            s.utc = c,
            s.unix = function(e) {
                return xt(1e3 * e)
            }
            ,
            s.months = function(e, t) {
                return La(e, t, "months")
            }
            ,
            s.isDate = o,
            s.locale = mt,
            s.invalid = L,
            s.duration = Zt,
            s.isMoment = D,
            s.weekdays = function(e, t, a) {
                return Ya(e, t, a, "weekdays")
            }
            ,
            s.parseZone = function() {
                return xt.apply(null, arguments).parseZone()
            }
            ,
            s.localeData = ct,
            s.isDuration = Ft,
            s.monthsShort = function(e, t) {
                return La(e, t, "monthsShort")
            }
            ,
            s.weekdaysMin = function(e, t, a) {
                return Ya(e, t, a, "weekdaysMin")
            }
            ,
            s.defineLocale = lt,
            s.updateLocale = function(e, t) {
                if (null != t) {
                    var a, n, s = it;
                    null != (n = ut(e)) && (s = n._config),
                    t = x(s, t),
                    (a = new O(t)).parentLocale = dt[e],
                    dt[e] = a,
                    mt(e)
                } else
                    null != dt[e] && (null != dt[e].parentLocale ? dt[e] = dt[e].parentLocale : null != dt[e] && delete dt[e]);
                return dt[e]
            }
            ,
            s.locales = function() {
                return j(dt)
            }
            ,
            s.weekdaysShort = function(e, t, a) {
                return Ya(e, t, a, "weekdaysShort")
            }
            ,
            s.normalizeUnits = E,
            s.relativeTimeRounding = function(e) {
                return void 0 === e ? Na : "function" == typeof e && (Na = e,
                !0)
            }
            ,
            s.relativeTimeThreshold = function(e, t) {
                return void 0 !== Ia[e] && (void 0 === t ? Ia[e] : (Ia[e] = t,
                "s" === e && (Ia.ss = t - 1),
                !0))
            }
            ,
            s.calendarFormat = function(e, t) {
                var a = e.diff(t, "days", !0);
                return a < -6 ? "sameElse" : a < -1 ? "lastWeek" : a < 0 ? "lastDay" : a < 1 ? "sameDay" : a < 2 ? "nextDay" : a < 7 ? "nextWeek" : "sameElse"
            }
            ,
            s.prototype = la,
            s.HTML5_FMT = {
                DATETIME_LOCAL: "YYYY-MM-DDTHH:mm",
                DATETIME_LOCAL_SECONDS: "YYYY-MM-DDTHH:mm:ss",
                DATETIME_LOCAL_MS: "YYYY-MM-DDTHH:mm:ss.SSS",
                DATE: "YYYY-MM-DD",
                TIME: "HH:mm",
                TIME_SECONDS: "HH:mm:ss",
                TIME_MS: "HH:mm:ss.SSS",
                WEEK: "YYYY-[W]WW",
                MONTH: "YYYY-MM"
            },
            s
        }()
    }
    ).call(this, a(125)(e))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("af", {
            months: "Januarie_Februarie_Maart_April_Mei_Junie_Julie_Augustus_September_Oktober_November_Desember".split("_"),
            monthsShort: "Jan_Feb_Mrt_Apr_Mei_Jun_Jul_Aug_Sep_Okt_Nov_Des".split("_"),
            weekdays: "Sondag_Maandag_Dinsdag_Woensdag_Donderdag_Vrydag_Saterdag".split("_"),
            weekdaysShort: "Son_Maa_Din_Woe_Don_Vry_Sat".split("_"),
            weekdaysMin: "So_Ma_Di_Wo_Do_Vr_Sa".split("_"),
            meridiemParse: /vm|nm/i,
            isPM: function(e) {
                return /^nm$/i.test(e)
            },
            meridiem: function(e, t, a) {
                return e < 12 ? a ? "vm" : "VM" : a ? "nm" : "NM"
            },
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd, D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[Vandag om] LT",
                nextDay: "[Môre om] LT",
                nextWeek: "dddd [om] LT",
                lastDay: "[Gister om] LT",
                lastWeek: "[Laas] dddd [om] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "oor %s",
                past: "%s gelede",
                s: "'n paar sekondes",
                ss: "%d sekondes",
                m: "'n minuut",
                mm: "%d minute",
                h: "'n uur",
                hh: "%d ure",
                d: "'n dag",
                dd: "%d dae",
                M: "'n maand",
                MM: "%d maande",
                y: "'n jaar",
                yy: "%d jaar"
            },
            dayOfMonthOrdinalParse: /\d{1,2}(ste|de)/,
            ordinal: function(e) {
                return e + (1 === e || 8 === e || e >= 20 ? "ste" : "de")
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = {
            1: "١",
            2: "٢",
            3: "٣",
            4: "٤",
            5: "٥",
            6: "٦",
            7: "٧",
            8: "٨",
            9: "٩",
            0: "٠"
        }
          , a = {
            "١": "1",
            "٢": "2",
            "٣": "3",
            "٤": "4",
            "٥": "5",
            "٦": "6",
            "٧": "7",
            "٨": "8",
            "٩": "9",
            "٠": "0"
        }
          , n = function(e) {
            return 0 === e ? 0 : 1 === e ? 1 : 2 === e ? 2 : e % 100 >= 3 && e % 100 <= 10 ? 3 : e % 100 >= 11 ? 4 : 5
        }
          , s = {
            s: ["أقل من ثانية", "ثانية واحدة", ["ثانيتان", "ثانيتين"], "%d ثوان", "%d ثانية", "%d ثانية"],
            m: ["أقل من دقيقة", "دقيقة واحدة", ["دقيقتان", "دقيقتين"], "%d دقائق", "%d دقيقة", "%d دقيقة"],
            h: ["أقل من ساعة", "ساعة واحدة", ["ساعتان", "ساعتين"], "%d ساعات", "%d ساعة", "%d ساعة"],
            d: ["أقل من يوم", "يوم واحد", ["يومان", "يومين"], "%d أيام", "%d يومًا", "%d يوم"],
            M: ["أقل من شهر", "شهر واحد", ["شهران", "شهرين"], "%d أشهر", "%d شهرا", "%d شهر"],
            y: ["أقل من عام", "عام واحد", ["عامان", "عامين"], "%d أعوام", "%d عامًا", "%d عام"]
        }
          , r = function(e) {
            return function(t, a, r, i) {
                var d = n(t)
                  , _ = s[e][n(t)];
                return 2 === d && (_ = _[a ? 0 : 1]),
                _.replace(/%d/i, t)
            }
        }
          , i = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
        e.defineLocale("ar", {
            months: i,
            monthsShort: i,
            weekdays: "الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت".split("_"),
            weekdaysShort: "أحد_إثنين_ثلاثاء_أربعاء_خميس_جمعة_سبت".split("_"),
            weekdaysMin: "ح_ن_ث_ر_خ_ج_س".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "D/‏M/‏YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd D MMMM YYYY HH:mm"
            },
            meridiemParse: /ص|م/,
            isPM: function(e) {
                return "م" === e
            },
            meridiem: function(e, t, a) {
                return e < 12 ? "ص" : "م"
            },
            calendar: {
                sameDay: "[اليوم عند الساعة] LT",
                nextDay: "[غدًا عند الساعة] LT",
                nextWeek: "dddd [عند الساعة] LT",
                lastDay: "[أمس عند الساعة] LT",
                lastWeek: "dddd [عند الساعة] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "بعد %s",
                past: "منذ %s",
                s: r("s"),
                ss: r("s"),
                m: r("m"),
                mm: r("m"),
                h: r("h"),
                hh: r("h"),
                d: r("d"),
                dd: r("d"),
                M: r("M"),
                MM: r("M"),
                y: r("y"),
                yy: r("y")
            },
            preparse: function(e) {
                return e.replace(/[١٢٣٤٥٦٧٨٩٠]/g, function(e) {
                    return a[e]
                }).replace(/،/g, ",")
            },
            postformat: function(e) {
                return e.replace(/\d/g, function(e) {
                    return t[e]
                }).replace(/,/g, "،")
            },
            week: {
                dow: 6,
                doy: 12
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("ar-dz", {
            months: "جانفي_فيفري_مارس_أفريل_ماي_جوان_جويلية_أوت_سبتمبر_أكتوبر_نوفمبر_ديسمبر".split("_"),
            monthsShort: "جانفي_فيفري_مارس_أفريل_ماي_جوان_جويلية_أوت_سبتمبر_أكتوبر_نوفمبر_ديسمبر".split("_"),
            weekdays: "الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت".split("_"),
            weekdaysShort: "احد_اثنين_ثلاثاء_اربعاء_خميس_جمعة_سبت".split("_"),
            weekdaysMin: "أح_إث_ثلا_أر_خم_جم_سب".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[اليوم على الساعة] LT",
                nextDay: "[غدا على الساعة] LT",
                nextWeek: "dddd [على الساعة] LT",
                lastDay: "[أمس على الساعة] LT",
                lastWeek: "dddd [على الساعة] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "في %s",
                past: "منذ %s",
                s: "ثوان",
                ss: "%d ثانية",
                m: "دقيقة",
                mm: "%d دقائق",
                h: "ساعة",
                hh: "%d ساعات",
                d: "يوم",
                dd: "%d أيام",
                M: "شهر",
                MM: "%d أشهر",
                y: "سنة",
                yy: "%d سنوات"
            },
            week: {
                dow: 0,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("ar-kw", {
            months: "يناير_فبراير_مارس_أبريل_ماي_يونيو_يوليوز_غشت_شتنبر_أكتوبر_نونبر_دجنبر".split("_"),
            monthsShort: "يناير_فبراير_مارس_أبريل_ماي_يونيو_يوليوز_غشت_شتنبر_أكتوبر_نونبر_دجنبر".split("_"),
            weekdays: "الأحد_الإتنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت".split("_"),
            weekdaysShort: "احد_اتنين_ثلاثاء_اربعاء_خميس_جمعة_سبت".split("_"),
            weekdaysMin: "ح_ن_ث_ر_خ_ج_س".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[اليوم على الساعة] LT",
                nextDay: "[غدا على الساعة] LT",
                nextWeek: "dddd [على الساعة] LT",
                lastDay: "[أمس على الساعة] LT",
                lastWeek: "dddd [على الساعة] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "في %s",
                past: "منذ %s",
                s: "ثوان",
                ss: "%d ثانية",
                m: "دقيقة",
                mm: "%d دقائق",
                h: "ساعة",
                hh: "%d ساعات",
                d: "يوم",
                dd: "%d أيام",
                M: "شهر",
                MM: "%d أشهر",
                y: "سنة",
                yy: "%d سنوات"
            },
            week: {
                dow: 0,
                doy: 12
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = {
            1: "1",
            2: "2",
            3: "3",
            4: "4",
            5: "5",
            6: "6",
            7: "7",
            8: "8",
            9: "9",
            0: "0"
        }
          , a = function(e) {
            return 0 === e ? 0 : 1 === e ? 1 : 2 === e ? 2 : e % 100 >= 3 && e % 100 <= 10 ? 3 : e % 100 >= 11 ? 4 : 5
        }
          , n = {
            s: ["أقل من ثانية", "ثانية واحدة", ["ثانيتان", "ثانيتين"], "%d ثوان", "%d ثانية", "%d ثانية"],
            m: ["أقل من دقيقة", "دقيقة واحدة", ["دقيقتان", "دقيقتين"], "%d دقائق", "%d دقيقة", "%d دقيقة"],
            h: ["أقل من ساعة", "ساعة واحدة", ["ساعتان", "ساعتين"], "%d ساعات", "%d ساعة", "%d ساعة"],
            d: ["أقل من يوم", "يوم واحد", ["يومان", "يومين"], "%d أيام", "%d يومًا", "%d يوم"],
            M: ["أقل من شهر", "شهر واحد", ["شهران", "شهرين"], "%d أشهر", "%d شهرا", "%d شهر"],
            y: ["أقل من عام", "عام واحد", ["عامان", "عامين"], "%d أعوام", "%d عامًا", "%d عام"]
        }
          , s = function(e) {
            return function(t, s, r, i) {
                var d = a(t)
                  , _ = n[e][a(t)];
                return 2 === d && (_ = _[s ? 0 : 1]),
                _.replace(/%d/i, t)
            }
        }
          , r = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
        e.defineLocale("ar-ly", {
            months: r,
            monthsShort: r,
            weekdays: "الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت".split("_"),
            weekdaysShort: "أحد_إثنين_ثلاثاء_أربعاء_خميس_جمعة_سبت".split("_"),
            weekdaysMin: "ح_ن_ث_ر_خ_ج_س".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "D/‏M/‏YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd D MMMM YYYY HH:mm"
            },
            meridiemParse: /ص|م/,
            isPM: function(e) {
                return "م" === e
            },
            meridiem: function(e, t, a) {
                return e < 12 ? "ص" : "م"
            },
            calendar: {
                sameDay: "[اليوم عند الساعة] LT",
                nextDay: "[غدًا عند الساعة] LT",
                nextWeek: "dddd [عند الساعة] LT",
                lastDay: "[أمس عند الساعة] LT",
                lastWeek: "dddd [عند الساعة] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "بعد %s",
                past: "منذ %s",
                s: s("s"),
                ss: s("s"),
                m: s("m"),
                mm: s("m"),
                h: s("h"),
                hh: s("h"),
                d: s("d"),
                dd: s("d"),
                M: s("M"),
                MM: s("M"),
                y: s("y"),
                yy: s("y")
            },
            preparse: function(e) {
                return e.replace(/،/g, ",")
            },
            postformat: function(e) {
                return e.replace(/\d/g, function(e) {
                    return t[e]
                }).replace(/,/g, "،")
            },
            week: {
                dow: 6,
                doy: 12
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("ar-ma", {
            months: "يناير_فبراير_مارس_أبريل_ماي_يونيو_يوليوز_غشت_شتنبر_أكتوبر_نونبر_دجنبر".split("_"),
            monthsShort: "يناير_فبراير_مارس_أبريل_ماي_يونيو_يوليوز_غشت_شتنبر_أكتوبر_نونبر_دجنبر".split("_"),
            weekdays: "الأحد_الإتنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت".split("_"),
            weekdaysShort: "احد_اتنين_ثلاثاء_اربعاء_خميس_جمعة_سبت".split("_"),
            weekdaysMin: "ح_ن_ث_ر_خ_ج_س".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[اليوم على الساعة] LT",
                nextDay: "[غدا على الساعة] LT",
                nextWeek: "dddd [على الساعة] LT",
                lastDay: "[أمس على الساعة] LT",
                lastWeek: "dddd [على الساعة] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "في %s",
                past: "منذ %s",
                s: "ثوان",
                ss: "%d ثانية",
                m: "دقيقة",
                mm: "%d دقائق",
                h: "ساعة",
                hh: "%d ساعات",
                d: "يوم",
                dd: "%d أيام",
                M: "شهر",
                MM: "%d أشهر",
                y: "سنة",
                yy: "%d سنوات"
            },
            week: {
                dow: 6,
                doy: 12
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = {
            1: "١",
            2: "٢",
            3: "٣",
            4: "٤",
            5: "٥",
            6: "٦",
            7: "٧",
            8: "٨",
            9: "٩",
            0: "٠"
        }
          , a = {
            "١": "1",
            "٢": "2",
            "٣": "3",
            "٤": "4",
            "٥": "5",
            "٦": "6",
            "٧": "7",
            "٨": "8",
            "٩": "9",
            "٠": "0"
        };
        e.defineLocale("ar-sa", {
            months: "يناير_فبراير_مارس_أبريل_مايو_يونيو_يوليو_أغسطس_سبتمبر_أكتوبر_نوفمبر_ديسمبر".split("_"),
            monthsShort: "يناير_فبراير_مارس_أبريل_مايو_يونيو_يوليو_أغسطس_سبتمبر_أكتوبر_نوفمبر_ديسمبر".split("_"),
            weekdays: "الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت".split("_"),
            weekdaysShort: "أحد_إثنين_ثلاثاء_أربعاء_خميس_جمعة_سبت".split("_"),
            weekdaysMin: "ح_ن_ث_ر_خ_ج_س".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd D MMMM YYYY HH:mm"
            },
            meridiemParse: /ص|م/,
            isPM: function(e) {
                return "م" === e
            },
            meridiem: function(e, t, a) {
                return e < 12 ? "ص" : "م"
            },
            calendar: {
                sameDay: "[اليوم على الساعة] LT",
                nextDay: "[غدا على الساعة] LT",
                nextWeek: "dddd [على الساعة] LT",
                lastDay: "[أمس على الساعة] LT",
                lastWeek: "dddd [على الساعة] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "في %s",
                past: "منذ %s",
                s: "ثوان",
                ss: "%d ثانية",
                m: "دقيقة",
                mm: "%d دقائق",
                h: "ساعة",
                hh: "%d ساعات",
                d: "يوم",
                dd: "%d أيام",
                M: "شهر",
                MM: "%d أشهر",
                y: "سنة",
                yy: "%d سنوات"
            },
            preparse: function(e) {
                return e.replace(/[١٢٣٤٥٦٧٨٩٠]/g, function(e) {
                    return a[e]
                }).replace(/،/g, ",")
            },
            postformat: function(e) {
                return e.replace(/\d/g, function(e) {
                    return t[e]
                }).replace(/,/g, "،")
            },
            week: {
                dow: 0,
                doy: 6
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("ar-tn", {
            months: "جانفي_فيفري_مارس_أفريل_ماي_جوان_جويلية_أوت_سبتمبر_أكتوبر_نوفمبر_ديسمبر".split("_"),
            monthsShort: "جانفي_فيفري_مارس_أفريل_ماي_جوان_جويلية_أوت_سبتمبر_أكتوبر_نوفمبر_ديسمبر".split("_"),
            weekdays: "الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت".split("_"),
            weekdaysShort: "أحد_إثنين_ثلاثاء_أربعاء_خميس_جمعة_سبت".split("_"),
            weekdaysMin: "ح_ن_ث_ر_خ_ج_س".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[اليوم على الساعة] LT",
                nextDay: "[غدا على الساعة] LT",
                nextWeek: "dddd [على الساعة] LT",
                lastDay: "[أمس على الساعة] LT",
                lastWeek: "dddd [على الساعة] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "في %s",
                past: "منذ %s",
                s: "ثوان",
                ss: "%d ثانية",
                m: "دقيقة",
                mm: "%d دقائق",
                h: "ساعة",
                hh: "%d ساعات",
                d: "يوم",
                dd: "%d أيام",
                M: "شهر",
                MM: "%d أشهر",
                y: "سنة",
                yy: "%d سنوات"
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = {
            1: "-inci",
            5: "-inci",
            8: "-inci",
            70: "-inci",
            80: "-inci",
            2: "-nci",
            7: "-nci",
            20: "-nci",
            50: "-nci",
            3: "-üncü",
            4: "-üncü",
            100: "-üncü",
            6: "-ncı",
            9: "-uncu",
            10: "-uncu",
            30: "-uncu",
            60: "-ıncı",
            90: "-ıncı"
        };
        e.defineLocale("az", {
            months: "yanvar_fevral_mart_aprel_may_iyun_iyul_avqust_sentyabr_oktyabr_noyabr_dekabr".split("_"),
            monthsShort: "yan_fev_mar_apr_may_iyn_iyl_avq_sen_okt_noy_dek".split("_"),
            weekdays: "Bazar_Bazar ertəsi_Çərşənbə axşamı_Çərşənbə_Cümə axşamı_Cümə_Şənbə".split("_"),
            weekdaysShort: "Baz_BzE_ÇAx_Çər_CAx_Cüm_Şən".split("_"),
            weekdaysMin: "Bz_BE_ÇA_Çə_CA_Cü_Şə".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd, D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[bugün saat] LT",
                nextDay: "[sabah saat] LT",
                nextWeek: "[gələn həftə] dddd [saat] LT",
                lastDay: "[dünən] LT",
                lastWeek: "[keçən həftə] dddd [saat] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%s sonra",
                past: "%s əvvəl",
                s: "birneçə saniyə",
                ss: "%d saniyə",
                m: "bir dəqiqə",
                mm: "%d dəqiqə",
                h: "bir saat",
                hh: "%d saat",
                d: "bir gün",
                dd: "%d gün",
                M: "bir ay",
                MM: "%d ay",
                y: "bir il",
                yy: "%d il"
            },
            meridiemParse: /gecə|səhər|gündüz|axşam/,
            isPM: function(e) {
                return /^(gündüz|axşam)$/.test(e)
            },
            meridiem: function(e, t, a) {
                return e < 4 ? "gecə" : e < 12 ? "səhər" : e < 17 ? "gündüz" : "axşam"
            },
            dayOfMonthOrdinalParse: /\d{1,2}-(ıncı|inci|nci|üncü|ncı|uncu)/,
            ordinal: function(e) {
                if (0 === e)
                    return e + "-ıncı";
                var a = e % 10
                  , n = e % 100 - a
                  , s = e >= 100 ? 100 : null;
                return e + (t[a] || t[n] || t[s])
            },
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        function t(e, t, a) {
            var n = {
                ss: t ? "секунда_секунды_секунд" : "секунду_секунды_секунд",
                mm: t ? "хвіліна_хвіліны_хвілін" : "хвіліну_хвіліны_хвілін",
                hh: t ? "гадзіна_гадзіны_гадзін" : "гадзіну_гадзіны_гадзін",
                dd: "дзень_дні_дзён",
                MM: "месяц_месяцы_месяцаў",
                yy: "год_гады_гадоў"
            };
            return "m" === a ? t ? "хвіліна" : "хвіліну" : "h" === a ? t ? "гадзіна" : "гадзіну" : e + " " + function(e, t) {
                var a = e.split("_");
                return t % 10 == 1 && t % 100 != 11 ? a[0] : t % 10 >= 2 && t % 10 <= 4 && (t % 100 < 10 || t % 100 >= 20) ? a[1] : a[2]
            }(n[a], +e)
        }
        e.defineLocale("be", {
            months: {
                format: "студзеня_лютага_сакавіка_красавіка_траўня_чэрвеня_ліпеня_жніўня_верасня_кастрычніка_лістапада_снежня".split("_"),
                standalone: "студзень_люты_сакавік_красавік_травень_чэрвень_ліпень_жнівень_верасень_кастрычнік_лістапад_снежань".split("_")
            },
            monthsShort: "студ_лют_сак_крас_трав_чэрв_ліп_жнів_вер_каст_ліст_снеж".split("_"),
            weekdays: {
                format: "нядзелю_панядзелак_аўторак_сераду_чацвер_пятніцу_суботу".split("_"),
                standalone: "нядзеля_панядзелак_аўторак_серада_чацвер_пятніца_субота".split("_"),
                isFormat: /\[ ?[Ууў] ?(?:мінулую|наступную)? ?\] ?dddd/
            },
            weekdaysShort: "нд_пн_ат_ср_чц_пт_сб".split("_"),
            weekdaysMin: "нд_пн_ат_ср_чц_пт_сб".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D MMMM YYYY г.",
                LLL: "D MMMM YYYY г., HH:mm",
                LLLL: "dddd, D MMMM YYYY г., HH:mm"
            },
            calendar: {
                sameDay: "[Сёння ў] LT",
                nextDay: "[Заўтра ў] LT",
                lastDay: "[Учора ў] LT",
                nextWeek: function() {
                    return "[У] dddd [ў] LT"
                },
                lastWeek: function() {
                    switch (this.day()) {
                    case 0:
                    case 3:
                    case 5:
                    case 6:
                        return "[У мінулую] dddd [ў] LT";
                    case 1:
                    case 2:
                    case 4:
                        return "[У мінулы] dddd [ў] LT"
                    }
                },
                sameElse: "L"
            },
            relativeTime: {
                future: "праз %s",
                past: "%s таму",
                s: "некалькі секунд",
                m: t,
                mm: t,
                h: t,
                hh: t,
                d: "дзень",
                dd: t,
                M: "месяц",
                MM: t,
                y: "год",
                yy: t
            },
            meridiemParse: /ночы|раніцы|дня|вечара/,
            isPM: function(e) {
                return /^(дня|вечара)$/.test(e)
            },
            meridiem: function(e, t, a) {
                return e < 4 ? "ночы" : e < 12 ? "раніцы" : e < 17 ? "дня" : "вечара"
            },
            dayOfMonthOrdinalParse: /\d{1,2}-(і|ы|га)/,
            ordinal: function(e, t) {
                switch (t) {
                case "M":
                case "d":
                case "DDD":
                case "w":
                case "W":
                    return e % 10 != 2 && e % 10 != 3 || e % 100 == 12 || e % 100 == 13 ? e + "-ы" : e + "-і";
                case "D":
                    return e + "-га";
                default:
                    return e
                }
            },
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("bg", {
            months: "януари_февруари_март_април_май_юни_юли_август_септември_октомври_ноември_декември".split("_"),
            monthsShort: "янр_фев_мар_апр_май_юни_юли_авг_сеп_окт_ное_дек".split("_"),
            weekdays: "неделя_понеделник_вторник_сряда_четвъртък_петък_събота".split("_"),
            weekdaysShort: "нед_пон_вто_сря_чет_пет_съб".split("_"),
            weekdaysMin: "нд_пн_вт_ср_чт_пт_сб".split("_"),
            longDateFormat: {
                LT: "H:mm",
                LTS: "H:mm:ss",
                L: "D.MM.YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY H:mm",
                LLLL: "dddd, D MMMM YYYY H:mm"
            },
            calendar: {
                sameDay: "[Днес в] LT",
                nextDay: "[Утре в] LT",
                nextWeek: "dddd [в] LT",
                lastDay: "[Вчера в] LT",
                lastWeek: function() {
                    switch (this.day()) {
                    case 0:
                    case 3:
                    case 6:
                        return "[В изминалата] dddd [в] LT";
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return "[В изминалия] dddd [в] LT"
                    }
                },
                sameElse: "L"
            },
            relativeTime: {
                future: "след %s",
                past: "преди %s",
                s: "няколко секунди",
                ss: "%d секунди",
                m: "минута",
                mm: "%d минути",
                h: "час",
                hh: "%d часа",
                d: "ден",
                dd: "%d дни",
                M: "месец",
                MM: "%d месеца",
                y: "година",
                yy: "%d години"
            },
            dayOfMonthOrdinalParse: /\d{1,2}-(ев|ен|ти|ви|ри|ми)/,
            ordinal: function(e) {
                var t = e % 10
                  , a = e % 100;
                return 0 === e ? e + "-ев" : 0 === a ? e + "-ен" : a > 10 && a < 20 ? e + "-ти" : 1 === t ? e + "-ви" : 2 === t ? e + "-ри" : 7 === t || 8 === t ? e + "-ми" : e + "-ти"
            },
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("bm", {
            months: "Zanwuyekalo_Fewuruyekalo_Marisikalo_Awirilikalo_Mɛkalo_Zuwɛnkalo_Zuluyekalo_Utikalo_Sɛtanburukalo_ɔkutɔburukalo_Nowanburukalo_Desanburukalo".split("_"),
            monthsShort: "Zan_Few_Mar_Awi_Mɛ_Zuw_Zul_Uti_Sɛt_ɔku_Now_Des".split("_"),
            weekdays: "Kari_Ntɛnɛn_Tarata_Araba_Alamisa_Juma_Sibiri".split("_"),
            weekdaysShort: "Kar_Ntɛ_Tar_Ara_Ala_Jum_Sib".split("_"),
            weekdaysMin: "Ka_Nt_Ta_Ar_Al_Ju_Si".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "MMMM [tile] D [san] YYYY",
                LLL: "MMMM [tile] D [san] YYYY [lɛrɛ] HH:mm",
                LLLL: "dddd MMMM [tile] D [san] YYYY [lɛrɛ] HH:mm"
            },
            calendar: {
                sameDay: "[Bi lɛrɛ] LT",
                nextDay: "[Sini lɛrɛ] LT",
                nextWeek: "dddd [don lɛrɛ] LT",
                lastDay: "[Kunu lɛrɛ] LT",
                lastWeek: "dddd [tɛmɛnen lɛrɛ] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%s kɔnɔ",
                past: "a bɛ %s bɔ",
                s: "sanga dama dama",
                ss: "sekondi %d",
                m: "miniti kelen",
                mm: "miniti %d",
                h: "lɛrɛ kelen",
                hh: "lɛrɛ %d",
                d: "tile kelen",
                dd: "tile %d",
                M: "kalo kelen",
                MM: "kalo %d",
                y: "san kelen",
                yy: "san %d"
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = {
            1: "১",
            2: "২",
            3: "৩",
            4: "৪",
            5: "৫",
            6: "৬",
            7: "৭",
            8: "৮",
            9: "৯",
            0: "০"
        }
          , a = {
            "১": "1",
            "২": "2",
            "৩": "3",
            "৪": "4",
            "৫": "5",
            "৬": "6",
            "৭": "7",
            "৮": "8",
            "৯": "9",
            "০": "0"
        };
        e.defineLocale("bn", {
            months: "জানুয়ারী_ফেব্রুয়ারি_মার্চ_এপ্রিল_মে_জুন_জুলাই_আগস্ট_সেপ্টেম্বর_অক্টোবর_নভেম্বর_ডিসেম্বর".split("_"),
            monthsShort: "জানু_ফেব_মার্চ_এপ্র_মে_জুন_জুল_আগ_সেপ্ট_অক্টো_নভে_ডিসে".split("_"),
            weekdays: "রবিবার_সোমবার_মঙ্গলবার_বুধবার_বৃহস্পতিবার_শুক্রবার_শনিবার".split("_"),
            weekdaysShort: "রবি_সোম_মঙ্গল_বুধ_বৃহস্পতি_শুক্র_শনি".split("_"),
            weekdaysMin: "রবি_সোম_মঙ্গ_বুধ_বৃহঃ_শুক্র_শনি".split("_"),
            longDateFormat: {
                LT: "A h:mm সময়",
                LTS: "A h:mm:ss সময়",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY, A h:mm সময়",
                LLLL: "dddd, D MMMM YYYY, A h:mm সময়"
            },
            calendar: {
                sameDay: "[আজ] LT",
                nextDay: "[আগামীকাল] LT",
                nextWeek: "dddd, LT",
                lastDay: "[গতকাল] LT",
                lastWeek: "[গত] dddd, LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%s পরে",
                past: "%s আগে",
                s: "কয়েক সেকেন্ড",
                ss: "%d সেকেন্ড",
                m: "এক মিনিট",
                mm: "%d মিনিট",
                h: "এক ঘন্টা",
                hh: "%d ঘন্টা",
                d: "এক দিন",
                dd: "%d দিন",
                M: "এক মাস",
                MM: "%d মাস",
                y: "এক বছর",
                yy: "%d বছর"
            },
            preparse: function(e) {
                return e.replace(/[১২৩৪৫৬৭৮৯০]/g, function(e) {
                    return a[e]
                })
            },
            postformat: function(e) {
                return e.replace(/\d/g, function(e) {
                    return t[e]
                })
            },
            meridiemParse: /রাত|সকাল|দুপুর|বিকাল|রাত/,
            meridiemHour: function(e, t) {
                return 12 === e && (e = 0),
                "রাত" === t && e >= 4 || "দুপুর" === t && e < 5 || "বিকাল" === t ? e + 12 : e
            },
            meridiem: function(e, t, a) {
                return e < 4 ? "রাত" : e < 10 ? "সকাল" : e < 17 ? "দুপুর" : e < 20 ? "বিকাল" : "রাত"
            },
            week: {
                dow: 0,
                doy: 6
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = {
            1: "༡",
            2: "༢",
            3: "༣",
            4: "༤",
            5: "༥",
            6: "༦",
            7: "༧",
            8: "༨",
            9: "༩",
            0: "༠"
        }
          , a = {
            "༡": "1",
            "༢": "2",
            "༣": "3",
            "༤": "4",
            "༥": "5",
            "༦": "6",
            "༧": "7",
            "༨": "8",
            "༩": "9",
            "༠": "0"
        };
        e.defineLocale("bo", {
            months: "ཟླ་བ་དང་པོ_ཟླ་བ་གཉིས་པ_ཟླ་བ་གསུམ་པ_ཟླ་བ་བཞི་པ_ཟླ་བ་ལྔ་པ_ཟླ་བ་དྲུག་པ_ཟླ་བ་བདུན་པ_ཟླ་བ་བརྒྱད་པ_ཟླ་བ་དགུ་པ_ཟླ་བ་བཅུ་པ_ཟླ་བ་བཅུ་གཅིག་པ_ཟླ་བ་བཅུ་གཉིས་པ".split("_"),
            monthsShort: "ཟླ་བ་དང་པོ_ཟླ་བ་གཉིས་པ_ཟླ་བ་གསུམ་པ_ཟླ་བ་བཞི་པ_ཟླ་བ་ལྔ་པ_ཟླ་བ་དྲུག་པ_ཟླ་བ་བདུན་པ_ཟླ་བ་བརྒྱད་པ_ཟླ་བ་དགུ་པ_ཟླ་བ་བཅུ་པ_ཟླ་བ་བཅུ་གཅིག་པ_ཟླ་བ་བཅུ་གཉིས་པ".split("_"),
            weekdays: "གཟའ་ཉི་མ་_གཟའ་ཟླ་བ་_གཟའ་མིག་དམར་_གཟའ་ལྷག་པ་_གཟའ་ཕུར་བུ_གཟའ་པ་སངས་_གཟའ་སྤེན་པ་".split("_"),
            weekdaysShort: "ཉི་མ་_ཟླ་བ་_མིག་དམར་_ལྷག་པ་_ཕུར་བུ_པ་སངས་_སྤེན་པ་".split("_"),
            weekdaysMin: "ཉི་མ་_ཟླ་བ་_མིག་དམར་_ལྷག་པ་_ཕུར་བུ_པ་སངས་_སྤེན་པ་".split("_"),
            longDateFormat: {
                LT: "A h:mm",
                LTS: "A h:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY, A h:mm",
                LLLL: "dddd, D MMMM YYYY, A h:mm"
            },
            calendar: {
                sameDay: "[དི་རིང] LT",
                nextDay: "[སང་ཉིན] LT",
                nextWeek: "[བདུན་ཕྲག་རྗེས་མ], LT",
                lastDay: "[ཁ་སང] LT",
                lastWeek: "[བདུན་ཕྲག་མཐའ་མ] dddd, LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%s ལ་",
                past: "%s སྔན་ལ",
                s: "ལམ་སང",
                ss: "%d སྐར་ཆ།",
                m: "སྐར་མ་གཅིག",
                mm: "%d སྐར་མ",
                h: "ཆུ་ཚོད་གཅིག",
                hh: "%d ཆུ་ཚོད",
                d: "ཉིན་གཅིག",
                dd: "%d ཉིན་",
                M: "ཟླ་བ་གཅིག",
                MM: "%d ཟླ་བ",
                y: "ལོ་གཅིག",
                yy: "%d ལོ"
            },
            preparse: function(e) {
                return e.replace(/[༡༢༣༤༥༦༧༨༩༠]/g, function(e) {
                    return a[e]
                })
            },
            postformat: function(e) {
                return e.replace(/\d/g, function(e) {
                    return t[e]
                })
            },
            meridiemParse: /མཚན་མོ|ཞོགས་ཀས|ཉིན་གུང|དགོང་དག|མཚན་མོ/,
            meridiemHour: function(e, t) {
                return 12 === e && (e = 0),
                "མཚན་མོ" === t && e >= 4 || "ཉིན་གུང" === t && e < 5 || "དགོང་དག" === t ? e + 12 : e
            },
            meridiem: function(e, t, a) {
                return e < 4 ? "མཚན་མོ" : e < 10 ? "ཞོགས་ཀས" : e < 17 ? "ཉིན་གུང" : e < 20 ? "དགོང་དག" : "མཚན་མོ"
            },
            week: {
                dow: 0,
                doy: 6
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        function t(e, t, a) {
            return e + " " + function(e, t) {
                return 2 === t ? function(e) {
                    var t = {
                        m: "v",
                        b: "v",
                        d: "z"
                    };
                    return void 0 === t[e.charAt(0)] ? e : t[e.charAt(0)] + e.substring(1)
                }(e) : e
            }({
                mm: "munutenn",
                MM: "miz",
                dd: "devezh"
            }[a], e)
        }
        e.defineLocale("br", {
            months: "Genver_C'hwevrer_Meurzh_Ebrel_Mae_Mezheven_Gouere_Eost_Gwengolo_Here_Du_Kerzu".split("_"),
            monthsShort: "Gen_C'hwe_Meu_Ebr_Mae_Eve_Gou_Eos_Gwe_Her_Du_Ker".split("_"),
            weekdays: "Sul_Lun_Meurzh_Merc'her_Yaou_Gwener_Sadorn".split("_"),
            weekdaysShort: "Sul_Lun_Meu_Mer_Yao_Gwe_Sad".split("_"),
            weekdaysMin: "Su_Lu_Me_Mer_Ya_Gw_Sa".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "h[e]mm A",
                LTS: "h[e]mm:ss A",
                L: "DD/MM/YYYY",
                LL: "D [a viz] MMMM YYYY",
                LLL: "D [a viz] MMMM YYYY h[e]mm A",
                LLLL: "dddd, D [a viz] MMMM YYYY h[e]mm A"
            },
            calendar: {
                sameDay: "[Hiziv da] LT",
                nextDay: "[Warc'hoazh da] LT",
                nextWeek: "dddd [da] LT",
                lastDay: "[Dec'h da] LT",
                lastWeek: "dddd [paset da] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "a-benn %s",
                past: "%s 'zo",
                s: "un nebeud segondennoù",
                ss: "%d eilenn",
                m: "ur vunutenn",
                mm: t,
                h: "un eur",
                hh: "%d eur",
                d: "un devezh",
                dd: t,
                M: "ur miz",
                MM: t,
                y: "ur bloaz",
                yy: function(e) {
                    switch (function e(t) {
                        return t > 9 ? e(t % 10) : t
                    }(e)) {
                    case 1:
                    case 3:
                    case 4:
                    case 5:
                    case 9:
                        return e + " bloaz";
                    default:
                        return e + " vloaz"
                    }
                }
            },
            dayOfMonthOrdinalParse: /\d{1,2}(añ|vet)/,
            ordinal: function(e) {
                var t = 1 === e ? "añ" : "vet";
                return e + t
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        function t(e, t, a) {
            var n = e + " ";
            switch (a) {
            case "ss":
                return n += 1 === e ? "sekunda" : 2 === e || 3 === e || 4 === e ? "sekunde" : "sekundi";
            case "m":
                return t ? "jedna minuta" : "jedne minute";
            case "mm":
                return n += 1 === e ? "minuta" : 2 === e || 3 === e || 4 === e ? "minute" : "minuta";
            case "h":
                return t ? "jedan sat" : "jednog sata";
            case "hh":
                return n += 1 === e ? "sat" : 2 === e || 3 === e || 4 === e ? "sata" : "sati";
            case "dd":
                return n += 1 === e ? "dan" : "dana";
            case "MM":
                return n += 1 === e ? "mjesec" : 2 === e || 3 === e || 4 === e ? "mjeseca" : "mjeseci";
            case "yy":
                return n += 1 === e ? "godina" : 2 === e || 3 === e || 4 === e ? "godine" : "godina"
            }
        }
        e.defineLocale("bs", {
            months: "januar_februar_mart_april_maj_juni_juli_august_septembar_oktobar_novembar_decembar".split("_"),
            monthsShort: "jan._feb._mar._apr._maj._jun._jul._aug._sep._okt._nov._dec.".split("_"),
            monthsParseExact: !0,
            weekdays: "nedjelja_ponedjeljak_utorak_srijeda_četvrtak_petak_subota".split("_"),
            weekdaysShort: "ned._pon._uto._sri._čet._pet._sub.".split("_"),
            weekdaysMin: "ne_po_ut_sr_če_pe_su".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "H:mm",
                LTS: "H:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D. MMMM YYYY",
                LLL: "D. MMMM YYYY H:mm",
                LLLL: "dddd, D. MMMM YYYY H:mm"
            },
            calendar: {
                sameDay: "[danas u] LT",
                nextDay: "[sutra u] LT",
                nextWeek: function() {
                    switch (this.day()) {
                    case 0:
                        return "[u] [nedjelju] [u] LT";
                    case 3:
                        return "[u] [srijedu] [u] LT";
                    case 6:
                        return "[u] [subotu] [u] LT";
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return "[u] dddd [u] LT"
                    }
                },
                lastDay: "[jučer u] LT",
                lastWeek: function() {
                    switch (this.day()) {
                    case 0:
                    case 3:
                        return "[prošlu] dddd [u] LT";
                    case 6:
                        return "[prošle] [subote] [u] LT";
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return "[prošli] dddd [u] LT"
                    }
                },
                sameElse: "L"
            },
            relativeTime: {
                future: "za %s",
                past: "prije %s",
                s: "par sekundi",
                ss: t,
                m: t,
                mm: t,
                h: t,
                hh: t,
                d: "dan",
                dd: t,
                M: "mjesec",
                MM: t,
                y: "godinu",
                yy: t
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("ca", {
            months: {
                standalone: "gener_febrer_març_abril_maig_juny_juliol_agost_setembre_octubre_novembre_desembre".split("_"),
                format: "de gener_de febrer_de març_d'abril_de maig_de juny_de juliol_d'agost_de setembre_d'octubre_de novembre_de desembre".split("_"),
                isFormat: /D[oD]?(\s)+MMMM/
            },
            monthsShort: "gen._febr._març_abr._maig_juny_jul._ag._set._oct._nov._des.".split("_"),
            monthsParseExact: !0,
            weekdays: "diumenge_dilluns_dimarts_dimecres_dijous_divendres_dissabte".split("_"),
            weekdaysShort: "dg._dl._dt._dc._dj._dv._ds.".split("_"),
            weekdaysMin: "dg_dl_dt_dc_dj_dv_ds".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "H:mm",
                LTS: "H:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM [de] YYYY",
                ll: "D MMM YYYY",
                LLL: "D MMMM [de] YYYY [a les] H:mm",
                lll: "D MMM YYYY, H:mm",
                LLLL: "dddd D MMMM [de] YYYY [a les] H:mm",
                llll: "ddd D MMM YYYY, H:mm"
            },
            calendar: {
                sameDay: function() {
                    return "[avui a " + (1 !== this.hours() ? "les" : "la") + "] LT"
                },
                nextDay: function() {
                    return "[demà a " + (1 !== this.hours() ? "les" : "la") + "] LT"
                },
                nextWeek: function() {
                    return "dddd [a " + (1 !== this.hours() ? "les" : "la") + "] LT"
                },
                lastDay: function() {
                    return "[ahir a " + (1 !== this.hours() ? "les" : "la") + "] LT"
                },
                lastWeek: function() {
                    return "[el] dddd [passat a " + (1 !== this.hours() ? "les" : "la") + "] LT"
                },
                sameElse: "L"
            },
            relativeTime: {
                future: "d'aquí %s",
                past: "fa %s",
                s: "uns segons",
                ss: "%d segons",
                m: "un minut",
                mm: "%d minuts",
                h: "una hora",
                hh: "%d hores",
                d: "un dia",
                dd: "%d dies",
                M: "un mes",
                MM: "%d mesos",
                y: "un any",
                yy: "%d anys"
            },
            dayOfMonthOrdinalParse: /\d{1,2}(r|n|t|è|a)/,
            ordinal: function(e, t) {
                var a = 1 === e ? "r" : 2 === e ? "n" : 3 === e ? "r" : 4 === e ? "t" : "è";
                return "w" !== t && "W" !== t || (a = "a"),
                e + a
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = "leden_únor_březen_duben_květen_červen_červenec_srpen_září_říjen_listopad_prosinec".split("_")
          , a = "led_úno_bře_dub_kvě_čvn_čvc_srp_zář_říj_lis_pro".split("_");
        function n(e) {
            return e > 1 && e < 5 && 1 != ~~(e / 10)
        }
        function s(e, t, a, s) {
            var r = e + " ";
            switch (a) {
            case "s":
                return t || s ? "pár sekund" : "pár sekundami";
            case "ss":
                return t || s ? r + (n(e) ? "sekundy" : "sekund") : r + "sekundami";
            case "m":
                return t ? "minuta" : s ? "minutu" : "minutou";
            case "mm":
                return t || s ? r + (n(e) ? "minuty" : "minut") : r + "minutami";
            case "h":
                return t ? "hodina" : s ? "hodinu" : "hodinou";
            case "hh":
                return t || s ? r + (n(e) ? "hodiny" : "hodin") : r + "hodinami";
            case "d":
                return t || s ? "den" : "dnem";
            case "dd":
                return t || s ? r + (n(e) ? "dny" : "dní") : r + "dny";
            case "M":
                return t || s ? "měsíc" : "měsícem";
            case "MM":
                return t || s ? r + (n(e) ? "měsíce" : "měsíců") : r + "měsíci";
            case "y":
                return t || s ? "rok" : "rokem";
            case "yy":
                return t || s ? r + (n(e) ? "roky" : "let") : r + "lety"
            }
        }
        e.defineLocale("cs", {
            months: t,
            monthsShort: a,
            monthsParse: function(e, t) {
                var a, n = [];
                for (a = 0; a < 12; a++)
                    n[a] = new RegExp("^" + e[a] + "$|^" + t[a] + "$","i");
                return n
            }(t, a),
            shortMonthsParse: function(e) {
                var t, a = [];
                for (t = 0; t < 12; t++)
                    a[t] = new RegExp("^" + e[t] + "$","i");
                return a
            }(a),
            longMonthsParse: function(e) {
                var t, a = [];
                for (t = 0; t < 12; t++)
                    a[t] = new RegExp("^" + e[t] + "$","i");
                return a
            }(t),
            weekdays: "neděle_pondělí_úterý_středa_čtvrtek_pátek_sobota".split("_"),
            weekdaysShort: "ne_po_út_st_čt_pá_so".split("_"),
            weekdaysMin: "ne_po_út_st_čt_pá_so".split("_"),
            longDateFormat: {
                LT: "H:mm",
                LTS: "H:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D. MMMM YYYY",
                LLL: "D. MMMM YYYY H:mm",
                LLLL: "dddd D. MMMM YYYY H:mm",
                l: "D. M. YYYY"
            },
            calendar: {
                sameDay: "[dnes v] LT",
                nextDay: "[zítra v] LT",
                nextWeek: function() {
                    switch (this.day()) {
                    case 0:
                        return "[v neděli v] LT";
                    case 1:
                    case 2:
                        return "[v] dddd [v] LT";
                    case 3:
                        return "[ve středu v] LT";
                    case 4:
                        return "[ve čtvrtek v] LT";
                    case 5:
                        return "[v pátek v] LT";
                    case 6:
                        return "[v sobotu v] LT"
                    }
                },
                lastDay: "[včera v] LT",
                lastWeek: function() {
                    switch (this.day()) {
                    case 0:
                        return "[minulou neděli v] LT";
                    case 1:
                    case 2:
                        return "[minulé] dddd [v] LT";
                    case 3:
                        return "[minulou středu v] LT";
                    case 4:
                    case 5:
                        return "[minulý] dddd [v] LT";
                    case 6:
                        return "[minulou sobotu v] LT"
                    }
                },
                sameElse: "L"
            },
            relativeTime: {
                future: "za %s",
                past: "před %s",
                s: s,
                ss: s,
                m: s,
                mm: s,
                h: s,
                hh: s,
                d: s,
                dd: s,
                M: s,
                MM: s,
                y: s,
                yy: s
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("cv", {
            months: "кӑрлач_нарӑс_пуш_ака_май_ҫӗртме_утӑ_ҫурла_авӑн_юпа_чӳк_раштав".split("_"),
            monthsShort: "кӑр_нар_пуш_ака_май_ҫӗр_утӑ_ҫур_авн_юпа_чӳк_раш".split("_"),
            weekdays: "вырсарникун_тунтикун_ытларикун_юнкун_кӗҫнерникун_эрнекун_шӑматкун".split("_"),
            weekdaysShort: "выр_тун_ытл_юн_кӗҫ_эрн_шӑм".split("_"),
            weekdaysMin: "вр_тн_ыт_юн_кҫ_эр_шм".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD-MM-YYYY",
                LL: "YYYY [ҫулхи] MMMM [уйӑхӗн] D[-мӗшӗ]",
                LLL: "YYYY [ҫулхи] MMMM [уйӑхӗн] D[-мӗшӗ], HH:mm",
                LLLL: "dddd, YYYY [ҫулхи] MMMM [уйӑхӗн] D[-мӗшӗ], HH:mm"
            },
            calendar: {
                sameDay: "[Паян] LT [сехетре]",
                nextDay: "[Ыран] LT [сехетре]",
                lastDay: "[Ӗнер] LT [сехетре]",
                nextWeek: "[Ҫитес] dddd LT [сехетре]",
                lastWeek: "[Иртнӗ] dddd LT [сехетре]",
                sameElse: "L"
            },
            relativeTime: {
                future: function(e) {
                    var t = /сехет$/i.exec(e) ? "рен" : /ҫул$/i.exec(e) ? "тан" : "ран";
                    return e + t
                },
                past: "%s каялла",
                s: "пӗр-ик ҫеккунт",
                ss: "%d ҫеккунт",
                m: "пӗр минут",
                mm: "%d минут",
                h: "пӗр сехет",
                hh: "%d сехет",
                d: "пӗр кун",
                dd: "%d кун",
                M: "пӗр уйӑх",
                MM: "%d уйӑх",
                y: "пӗр ҫул",
                yy: "%d ҫул"
            },
            dayOfMonthOrdinalParse: /\d{1,2}-мӗш/,
            ordinal: "%d-мӗш",
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("cy", {
            months: "Ionawr_Chwefror_Mawrth_Ebrill_Mai_Mehefin_Gorffennaf_Awst_Medi_Hydref_Tachwedd_Rhagfyr".split("_"),
            monthsShort: "Ion_Chwe_Maw_Ebr_Mai_Meh_Gor_Aws_Med_Hyd_Tach_Rhag".split("_"),
            weekdays: "Dydd Sul_Dydd Llun_Dydd Mawrth_Dydd Mercher_Dydd Iau_Dydd Gwener_Dydd Sadwrn".split("_"),
            weekdaysShort: "Sul_Llun_Maw_Mer_Iau_Gwe_Sad".split("_"),
            weekdaysMin: "Su_Ll_Ma_Me_Ia_Gw_Sa".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd, D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[Heddiw am] LT",
                nextDay: "[Yfory am] LT",
                nextWeek: "dddd [am] LT",
                lastDay: "[Ddoe am] LT",
                lastWeek: "dddd [diwethaf am] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "mewn %s",
                past: "%s yn ôl",
                s: "ychydig eiliadau",
                ss: "%d eiliad",
                m: "munud",
                mm: "%d munud",
                h: "awr",
                hh: "%d awr",
                d: "diwrnod",
                dd: "%d diwrnod",
                M: "mis",
                MM: "%d mis",
                y: "blwyddyn",
                yy: "%d flynedd"
            },
            dayOfMonthOrdinalParse: /\d{1,2}(fed|ain|af|il|ydd|ed|eg)/,
            ordinal: function(e) {
                var t = e
                  , a = "";
                return t > 20 ? a = 40 === t || 50 === t || 60 === t || 80 === t || 100 === t ? "fed" : "ain" : t > 0 && (a = ["", "af", "il", "ydd", "ydd", "ed", "ed", "ed", "fed", "fed", "fed", "eg", "fed", "eg", "eg", "fed", "eg", "eg", "fed", "eg", "fed"][t]),
                e + a
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("da", {
            months: "januar_februar_marts_april_maj_juni_juli_august_september_oktober_november_december".split("_"),
            monthsShort: "jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec".split("_"),
            weekdays: "søndag_mandag_tirsdag_onsdag_torsdag_fredag_lørdag".split("_"),
            weekdaysShort: "søn_man_tir_ons_tor_fre_lør".split("_"),
            weekdaysMin: "sø_ma_ti_on_to_fr_lø".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D. MMMM YYYY",
                LLL: "D. MMMM YYYY HH:mm",
                LLLL: "dddd [d.] D. MMMM YYYY [kl.] HH:mm"
            },
            calendar: {
                sameDay: "[i dag kl.] LT",
                nextDay: "[i morgen kl.] LT",
                nextWeek: "på dddd [kl.] LT",
                lastDay: "[i går kl.] LT",
                lastWeek: "[i] dddd[s kl.] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "om %s",
                past: "%s siden",
                s: "få sekunder",
                ss: "%d sekunder",
                m: "et minut",
                mm: "%d minutter",
                h: "en time",
                hh: "%d timer",
                d: "en dag",
                dd: "%d dage",
                M: "en måned",
                MM: "%d måneder",
                y: "et år",
                yy: "%d år"
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        function t(e, t, a, n) {
            var s = {
                m: ["eine Minute", "einer Minute"],
                h: ["eine Stunde", "einer Stunde"],
                d: ["ein Tag", "einem Tag"],
                dd: [e + " Tage", e + " Tagen"],
                M: ["ein Monat", "einem Monat"],
                MM: [e + " Monate", e + " Monaten"],
                y: ["ein Jahr", "einem Jahr"],
                yy: [e + " Jahre", e + " Jahren"]
            };
            return t ? s[a][0] : s[a][1]
        }
        e.defineLocale("de", {
            months: "Januar_Februar_März_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember".split("_"),
            monthsShort: "Jan._Feb._März_Apr._Mai_Juni_Juli_Aug._Sep._Okt._Nov._Dez.".split("_"),
            monthsParseExact: !0,
            weekdays: "Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag".split("_"),
            weekdaysShort: "So._Mo._Di._Mi._Do._Fr._Sa.".split("_"),
            weekdaysMin: "So_Mo_Di_Mi_Do_Fr_Sa".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D. MMMM YYYY",
                LLL: "D. MMMM YYYY HH:mm",
                LLLL: "dddd, D. MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[heute um] LT [Uhr]",
                sameElse: "L",
                nextDay: "[morgen um] LT [Uhr]",
                nextWeek: "dddd [um] LT [Uhr]",
                lastDay: "[gestern um] LT [Uhr]",
                lastWeek: "[letzten] dddd [um] LT [Uhr]"
            },
            relativeTime: {
                future: "in %s",
                past: "vor %s",
                s: "ein paar Sekunden",
                ss: "%d Sekunden",
                m: t,
                mm: "%d Minuten",
                h: t,
                hh: "%d Stunden",
                d: t,
                dd: t,
                M: t,
                MM: t,
                y: t,
                yy: t
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        function t(e, t, a, n) {
            var s = {
                m: ["eine Minute", "einer Minute"],
                h: ["eine Stunde", "einer Stunde"],
                d: ["ein Tag", "einem Tag"],
                dd: [e + " Tage", e + " Tagen"],
                M: ["ein Monat", "einem Monat"],
                MM: [e + " Monate", e + " Monaten"],
                y: ["ein Jahr", "einem Jahr"],
                yy: [e + " Jahre", e + " Jahren"]
            };
            return t ? s[a][0] : s[a][1]
        }
        e.defineLocale("de-at", {
            months: "Jänner_Februar_März_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember".split("_"),
            monthsShort: "Jän._Feb._März_Apr._Mai_Juni_Juli_Aug._Sep._Okt._Nov._Dez.".split("_"),
            monthsParseExact: !0,
            weekdays: "Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag".split("_"),
            weekdaysShort: "So._Mo._Di._Mi._Do._Fr._Sa.".split("_"),
            weekdaysMin: "So_Mo_Di_Mi_Do_Fr_Sa".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D. MMMM YYYY",
                LLL: "D. MMMM YYYY HH:mm",
                LLLL: "dddd, D. MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[heute um] LT [Uhr]",
                sameElse: "L",
                nextDay: "[morgen um] LT [Uhr]",
                nextWeek: "dddd [um] LT [Uhr]",
                lastDay: "[gestern um] LT [Uhr]",
                lastWeek: "[letzten] dddd [um] LT [Uhr]"
            },
            relativeTime: {
                future: "in %s",
                past: "vor %s",
                s: "ein paar Sekunden",
                ss: "%d Sekunden",
                m: t,
                mm: "%d Minuten",
                h: t,
                hh: "%d Stunden",
                d: t,
                dd: t,
                M: t,
                MM: t,
                y: t,
                yy: t
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        function t(e, t, a, n) {
            var s = {
                m: ["eine Minute", "einer Minute"],
                h: ["eine Stunde", "einer Stunde"],
                d: ["ein Tag", "einem Tag"],
                dd: [e + " Tage", e + " Tagen"],
                M: ["ein Monat", "einem Monat"],
                MM: [e + " Monate", e + " Monaten"],
                y: ["ein Jahr", "einem Jahr"],
                yy: [e + " Jahre", e + " Jahren"]
            };
            return t ? s[a][0] : s[a][1]
        }
        e.defineLocale("de-ch", {
            months: "Januar_Februar_März_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember".split("_"),
            monthsShort: "Jan._Feb._März_Apr._Mai_Juni_Juli_Aug._Sep._Okt._Nov._Dez.".split("_"),
            monthsParseExact: !0,
            weekdays: "Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag".split("_"),
            weekdaysShort: "So_Mo_Di_Mi_Do_Fr_Sa".split("_"),
            weekdaysMin: "So_Mo_Di_Mi_Do_Fr_Sa".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D. MMMM YYYY",
                LLL: "D. MMMM YYYY HH:mm",
                LLLL: "dddd, D. MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[heute um] LT [Uhr]",
                sameElse: "L",
                nextDay: "[morgen um] LT [Uhr]",
                nextWeek: "dddd [um] LT [Uhr]",
                lastDay: "[gestern um] LT [Uhr]",
                lastWeek: "[letzten] dddd [um] LT [Uhr]"
            },
            relativeTime: {
                future: "in %s",
                past: "vor %s",
                s: "ein paar Sekunden",
                ss: "%d Sekunden",
                m: t,
                mm: "%d Minuten",
                h: t,
                hh: "%d Stunden",
                d: t,
                dd: t,
                M: t,
                MM: t,
                y: t,
                yy: t
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = ["ޖެނުއަރީ", "ފެބްރުއަރީ", "މާރިޗު", "އޭޕްރީލު", "މޭ", "ޖޫން", "ޖުލައި", "އޯގަސްޓު", "ސެޕްޓެމްބަރު", "އޮކްޓޯބަރު", "ނޮވެމްބަރު", "ޑިސެމްބަރު"]
          , a = ["އާދިއްތަ", "ހޯމަ", "އަންގާރަ", "ބުދަ", "ބުރާސްފަތި", "ހުކުރު", "ހޮނިހިރު"];
        e.defineLocale("dv", {
            months: t,
            monthsShort: t,
            weekdays: a,
            weekdaysShort: a,
            weekdaysMin: "އާދި_ހޯމަ_އަން_ބުދަ_ބުރާ_ހުކު_ހޮނި".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "D/M/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd D MMMM YYYY HH:mm"
            },
            meridiemParse: /މކ|މފ/,
            isPM: function(e) {
                return "މފ" === e
            },
            meridiem: function(e, t, a) {
                return e < 12 ? "މކ" : "މފ"
            },
            calendar: {
                sameDay: "[މިއަދު] LT",
                nextDay: "[މާދަމާ] LT",
                nextWeek: "dddd LT",
                lastDay: "[އިއްޔެ] LT",
                lastWeek: "[ފާއިތުވި] dddd LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "ތެރޭގައި %s",
                past: "ކުރިން %s",
                s: "ސިކުންތުކޮޅެއް",
                ss: "d% ސިކުންތު",
                m: "މިނިޓެއް",
                mm: "މިނިޓު %d",
                h: "ގަޑިއިރެއް",
                hh: "ގަޑިއިރު %d",
                d: "ދުވަހެއް",
                dd: "ދުވަސް %d",
                M: "މަހެއް",
                MM: "މަސް %d",
                y: "އަހަރެއް",
                yy: "އަހަރު %d"
            },
            preparse: function(e) {
                return e.replace(/،/g, ",")
            },
            postformat: function(e) {
                return e.replace(/,/g, "،")
            },
            week: {
                dow: 7,
                doy: 12
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("el", {
            monthsNominativeEl: "Ιανουάριος_Φεβρουάριος_Μάρτιος_Απρίλιος_Μάιος_Ιούνιος_Ιούλιος_Αύγουστος_Σεπτέμβριος_Οκτώβριος_Νοέμβριος_Δεκέμβριος".split("_"),
            monthsGenitiveEl: "Ιανουαρίου_Φεβρουαρίου_Μαρτίου_Απριλίου_Μαΐου_Ιουνίου_Ιουλίου_Αυγούστου_Σεπτεμβρίου_Οκτωβρίου_Νοεμβρίου_Δεκεμβρίου".split("_"),
            months: function(e, t) {
                return e ? "string" == typeof t && /D/.test(t.substring(0, t.indexOf("MMMM"))) ? this._monthsGenitiveEl[e.month()] : this._monthsNominativeEl[e.month()] : this._monthsNominativeEl
            },
            monthsShort: "Ιαν_Φεβ_Μαρ_Απρ_Μαϊ_Ιουν_Ιουλ_Αυγ_Σεπ_Οκτ_Νοε_Δεκ".split("_"),
            weekdays: "Κυριακή_Δευτέρα_Τρίτη_Τετάρτη_Πέμπτη_Παρασκευή_Σάββατο".split("_"),
            weekdaysShort: "Κυρ_Δευ_Τρι_Τετ_Πεμ_Παρ_Σαβ".split("_"),
            weekdaysMin: "Κυ_Δε_Τρ_Τε_Πε_Πα_Σα".split("_"),
            meridiem: function(e, t, a) {
                return e > 11 ? a ? "μμ" : "ΜΜ" : a ? "πμ" : "ΠΜ"
            },
            isPM: function(e) {
                return "μ" === (e + "").toLowerCase()[0]
            },
            meridiemParse: /[ΠΜ]\.?Μ?\.?/i,
            longDateFormat: {
                LT: "h:mm A",
                LTS: "h:mm:ss A",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY h:mm A",
                LLLL: "dddd, D MMMM YYYY h:mm A"
            },
            calendarEl: {
                sameDay: "[Σήμερα {}] LT",
                nextDay: "[Αύριο {}] LT",
                nextWeek: "dddd [{}] LT",
                lastDay: "[Χθες {}] LT",
                lastWeek: function() {
                    switch (this.day()) {
                    case 6:
                        return "[το προηγούμενο] dddd [{}] LT";
                    default:
                        return "[την προηγούμενη] dddd [{}] LT"
                    }
                },
                sameElse: "L"
            },
            calendar: function(e, t) {
                var a = this._calendarEl[e]
                  , n = t && t.hours();
                return function(e) {
                    return e instanceof Function || "[object Function]" === Object.prototype.toString.call(e)
                }(a) && (a = a.apply(t)),
                a.replace("{}", n % 12 == 1 ? "στη" : "στις")
            },
            relativeTime: {
                future: "σε %s",
                past: "%s πριν",
                s: "λίγα δευτερόλεπτα",
                ss: "%d δευτερόλεπτα",
                m: "ένα λεπτό",
                mm: "%d λεπτά",
                h: "μία ώρα",
                hh: "%d ώρες",
                d: "μία μέρα",
                dd: "%d μέρες",
                M: "ένας μήνας",
                MM: "%d μήνες",
                y: "ένας χρόνος",
                yy: "%d χρόνια"
            },
            dayOfMonthOrdinalParse: /\d{1,2}η/,
            ordinal: "%dη",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("en-au", {
            months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
            monthsShort: "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
            weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
            weekdaysShort: "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
            weekdaysMin: "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
            longDateFormat: {
                LT: "h:mm A",
                LTS: "h:mm:ss A",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY h:mm A",
                LLLL: "dddd, D MMMM YYYY h:mm A"
            },
            calendar: {
                sameDay: "[Today at] LT",
                nextDay: "[Tomorrow at] LT",
                nextWeek: "dddd [at] LT",
                lastDay: "[Yesterday at] LT",
                lastWeek: "[Last] dddd [at] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "in %s",
                past: "%s ago",
                s: "a few seconds",
                ss: "%d seconds",
                m: "a minute",
                mm: "%d minutes",
                h: "an hour",
                hh: "%d hours",
                d: "a day",
                dd: "%d days",
                M: "a month",
                MM: "%d months",
                y: "a year",
                yy: "%d years"
            },
            dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
            ordinal: function(e) {
                var t = e % 10
                  , a = 1 == ~~(e % 100 / 10) ? "th" : 1 === t ? "st" : 2 === t ? "nd" : 3 === t ? "rd" : "th";
                return e + a
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("en-ca", {
            months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
            monthsShort: "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
            weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
            weekdaysShort: "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
            weekdaysMin: "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
            longDateFormat: {
                LT: "h:mm A",
                LTS: "h:mm:ss A",
                L: "YYYY-MM-DD",
                LL: "MMMM D, YYYY",
                LLL: "MMMM D, YYYY h:mm A",
                LLLL: "dddd, MMMM D, YYYY h:mm A"
            },
            calendar: {
                sameDay: "[Today at] LT",
                nextDay: "[Tomorrow at] LT",
                nextWeek: "dddd [at] LT",
                lastDay: "[Yesterday at] LT",
                lastWeek: "[Last] dddd [at] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "in %s",
                past: "%s ago",
                s: "a few seconds",
                ss: "%d seconds",
                m: "a minute",
                mm: "%d minutes",
                h: "an hour",
                hh: "%d hours",
                d: "a day",
                dd: "%d days",
                M: "a month",
                MM: "%d months",
                y: "a year",
                yy: "%d years"
            },
            dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
            ordinal: function(e) {
                var t = e % 10
                  , a = 1 == ~~(e % 100 / 10) ? "th" : 1 === t ? "st" : 2 === t ? "nd" : 3 === t ? "rd" : "th";
                return e + a
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("en-gb", {
            months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
            monthsShort: "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
            weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
            weekdaysShort: "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
            weekdaysMin: "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd, D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[Today at] LT",
                nextDay: "[Tomorrow at] LT",
                nextWeek: "dddd [at] LT",
                lastDay: "[Yesterday at] LT",
                lastWeek: "[Last] dddd [at] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "in %s",
                past: "%s ago",
                s: "a few seconds",
                ss: "%d seconds",
                m: "a minute",
                mm: "%d minutes",
                h: "an hour",
                hh: "%d hours",
                d: "a day",
                dd: "%d days",
                M: "a month",
                MM: "%d months",
                y: "a year",
                yy: "%d years"
            },
            dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
            ordinal: function(e) {
                var t = e % 10
                  , a = 1 == ~~(e % 100 / 10) ? "th" : 1 === t ? "st" : 2 === t ? "nd" : 3 === t ? "rd" : "th";
                return e + a
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("en-ie", {
            months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
            monthsShort: "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
            weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
            weekdaysShort: "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
            weekdaysMin: "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD-MM-YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[Today at] LT",
                nextDay: "[Tomorrow at] LT",
                nextWeek: "dddd [at] LT",
                lastDay: "[Yesterday at] LT",
                lastWeek: "[Last] dddd [at] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "in %s",
                past: "%s ago",
                s: "a few seconds",
                ss: "%d seconds",
                m: "a minute",
                mm: "%d minutes",
                h: "an hour",
                hh: "%d hours",
                d: "a day",
                dd: "%d days",
                M: "a month",
                MM: "%d months",
                y: "a year",
                yy: "%d years"
            },
            dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
            ordinal: function(e) {
                var t = e % 10
                  , a = 1 == ~~(e % 100 / 10) ? "th" : 1 === t ? "st" : 2 === t ? "nd" : 3 === t ? "rd" : "th";
                return e + a
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("en-il", {
            months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
            monthsShort: "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
            weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
            weekdaysShort: "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
            weekdaysMin: "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd, D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[Today at] LT",
                nextDay: "[Tomorrow at] LT",
                nextWeek: "dddd [at] LT",
                lastDay: "[Yesterday at] LT",
                lastWeek: "[Last] dddd [at] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "in %s",
                past: "%s ago",
                s: "a few seconds",
                m: "a minute",
                mm: "%d minutes",
                h: "an hour",
                hh: "%d hours",
                d: "a day",
                dd: "%d days",
                M: "a month",
                MM: "%d months",
                y: "a year",
                yy: "%d years"
            },
            dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
            ordinal: function(e) {
                var t = e % 10
                  , a = 1 == ~~(e % 100 / 10) ? "th" : 1 === t ? "st" : 2 === t ? "nd" : 3 === t ? "rd" : "th";
                return e + a
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("en-nz", {
            months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
            monthsShort: "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
            weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
            weekdaysShort: "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
            weekdaysMin: "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
            longDateFormat: {
                LT: "h:mm A",
                LTS: "h:mm:ss A",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY h:mm A",
                LLLL: "dddd, D MMMM YYYY h:mm A"
            },
            calendar: {
                sameDay: "[Today at] LT",
                nextDay: "[Tomorrow at] LT",
                nextWeek: "dddd [at] LT",
                lastDay: "[Yesterday at] LT",
                lastWeek: "[Last] dddd [at] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "in %s",
                past: "%s ago",
                s: "a few seconds",
                ss: "%d seconds",
                m: "a minute",
                mm: "%d minutes",
                h: "an hour",
                hh: "%d hours",
                d: "a day",
                dd: "%d days",
                M: "a month",
                MM: "%d months",
                y: "a year",
                yy: "%d years"
            },
            dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
            ordinal: function(e) {
                var t = e % 10
                  , a = 1 == ~~(e % 100 / 10) ? "th" : 1 === t ? "st" : 2 === t ? "nd" : 3 === t ? "rd" : "th";
                return e + a
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("eo", {
            months: "januaro_februaro_marto_aprilo_majo_junio_julio_aŭgusto_septembro_oktobro_novembro_decembro".split("_"),
            monthsShort: "jan_feb_mar_apr_maj_jun_jul_aŭg_sep_okt_nov_dec".split("_"),
            weekdays: "dimanĉo_lundo_mardo_merkredo_ĵaŭdo_vendredo_sabato".split("_"),
            weekdaysShort: "dim_lun_mard_merk_ĵaŭ_ven_sab".split("_"),
            weekdaysMin: "di_lu_ma_me_ĵa_ve_sa".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "YYYY-MM-DD",
                LL: "D[-a de] MMMM, YYYY",
                LLL: "D[-a de] MMMM, YYYY HH:mm",
                LLLL: "dddd, [la] D[-a de] MMMM, YYYY HH:mm"
            },
            meridiemParse: /[ap]\.t\.m/i,
            isPM: function(e) {
                return "p" === e.charAt(0).toLowerCase()
            },
            meridiem: function(e, t, a) {
                return e > 11 ? a ? "p.t.m." : "P.T.M." : a ? "a.t.m." : "A.T.M."
            },
            calendar: {
                sameDay: "[Hodiaŭ je] LT",
                nextDay: "[Morgaŭ je] LT",
                nextWeek: "dddd [je] LT",
                lastDay: "[Hieraŭ je] LT",
                lastWeek: "[pasinta] dddd [je] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "post %s",
                past: "antaŭ %s",
                s: "sekundoj",
                ss: "%d sekundoj",
                m: "minuto",
                mm: "%d minutoj",
                h: "horo",
                hh: "%d horoj",
                d: "tago",
                dd: "%d tagoj",
                M: "monato",
                MM: "%d monatoj",
                y: "jaro",
                yy: "%d jaroj"
            },
            dayOfMonthOrdinalParse: /\d{1,2}a/,
            ordinal: "%da",
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = "ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.".split("_")
          , a = "ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic".split("_")
          , n = [/^ene/i, /^feb/i, /^mar/i, /^abr/i, /^may/i, /^jun/i, /^jul/i, /^ago/i, /^sep/i, /^oct/i, /^nov/i, /^dic/i]
          , s = /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i;
        e.defineLocale("es", {
            months: "enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre".split("_"),
            monthsShort: function(e, n) {
                return e ? /-MMM-/.test(n) ? a[e.month()] : t[e.month()] : t
            },
            monthsRegex: s,
            monthsShortRegex: s,
            monthsStrictRegex: /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
            monthsShortStrictRegex: /^(ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i,
            monthsParse: n,
            longMonthsParse: n,
            shortMonthsParse: n,
            weekdays: "domingo_lunes_martes_miércoles_jueves_viernes_sábado".split("_"),
            weekdaysShort: "dom._lun._mar._mié._jue._vie._sáb.".split("_"),
            weekdaysMin: "do_lu_ma_mi_ju_vi_sá".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "H:mm",
                LTS: "H:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D [de] MMMM [de] YYYY",
                LLL: "D [de] MMMM [de] YYYY H:mm",
                LLLL: "dddd, D [de] MMMM [de] YYYY H:mm"
            },
            calendar: {
                sameDay: function() {
                    return "[hoy a la" + (1 !== this.hours() ? "s" : "") + "] LT"
                },
                nextDay: function() {
                    return "[mañana a la" + (1 !== this.hours() ? "s" : "") + "] LT"
                },
                nextWeek: function() {
                    return "dddd [a la" + (1 !== this.hours() ? "s" : "") + "] LT"
                },
                lastDay: function() {
                    return "[ayer a la" + (1 !== this.hours() ? "s" : "") + "] LT"
                },
                lastWeek: function() {
                    return "[el] dddd [pasado a la" + (1 !== this.hours() ? "s" : "") + "] LT"
                },
                sameElse: "L"
            },
            relativeTime: {
                future: "en %s",
                past: "hace %s",
                s: "unos segundos",
                ss: "%d segundos",
                m: "un minuto",
                mm: "%d minutos",
                h: "una hora",
                hh: "%d horas",
                d: "un día",
                dd: "%d días",
                M: "un mes",
                MM: "%d meses",
                y: "un año",
                yy: "%d años"
            },
            dayOfMonthOrdinalParse: /\d{1,2}º/,
            ordinal: "%dº",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = "ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.".split("_")
          , a = "ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic".split("_")
          , n = [/^ene/i, /^feb/i, /^mar/i, /^abr/i, /^may/i, /^jun/i, /^jul/i, /^ago/i, /^sep/i, /^oct/i, /^nov/i, /^dic/i]
          , s = /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i;
        e.defineLocale("es-do", {
            months: "enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre".split("_"),
            monthsShort: function(e, n) {
                return e ? /-MMM-/.test(n) ? a[e.month()] : t[e.month()] : t
            },
            monthsRegex: s,
            monthsShortRegex: s,
            monthsStrictRegex: /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
            monthsShortStrictRegex: /^(ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i,
            monthsParse: n,
            longMonthsParse: n,
            shortMonthsParse: n,
            weekdays: "domingo_lunes_martes_miércoles_jueves_viernes_sábado".split("_"),
            weekdaysShort: "dom._lun._mar._mié._jue._vie._sáb.".split("_"),
            weekdaysMin: "do_lu_ma_mi_ju_vi_sá".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "h:mm A",
                LTS: "h:mm:ss A",
                L: "DD/MM/YYYY",
                LL: "D [de] MMMM [de] YYYY",
                LLL: "D [de] MMMM [de] YYYY h:mm A",
                LLLL: "dddd, D [de] MMMM [de] YYYY h:mm A"
            },
            calendar: {
                sameDay: function() {
                    return "[hoy a la" + (1 !== this.hours() ? "s" : "") + "] LT"
                },
                nextDay: function() {
                    return "[mañana a la" + (1 !== this.hours() ? "s" : "") + "] LT"
                },
                nextWeek: function() {
                    return "dddd [a la" + (1 !== this.hours() ? "s" : "") + "] LT"
                },
                lastDay: function() {
                    return "[ayer a la" + (1 !== this.hours() ? "s" : "") + "] LT"
                },
                lastWeek: function() {
                    return "[el] dddd [pasado a la" + (1 !== this.hours() ? "s" : "") + "] LT"
                },
                sameElse: "L"
            },
            relativeTime: {
                future: "en %s",
                past: "hace %s",
                s: "unos segundos",
                ss: "%d segundos",
                m: "un minuto",
                mm: "%d minutos",
                h: "una hora",
                hh: "%d horas",
                d: "un día",
                dd: "%d días",
                M: "un mes",
                MM: "%d meses",
                y: "un año",
                yy: "%d años"
            },
            dayOfMonthOrdinalParse: /\d{1,2}º/,
            ordinal: "%dº",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = "ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.".split("_")
          , a = "ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic".split("_");
        e.defineLocale("es-us", {
            months: "enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre".split("_"),
            monthsShort: function(e, n) {
                return e ? /-MMM-/.test(n) ? a[e.month()] : t[e.month()] : t
            },
            monthsParseExact: !0,
            weekdays: "domingo_lunes_martes_miércoles_jueves_viernes_sábado".split("_"),
            weekdaysShort: "dom._lun._mar._mié._jue._vie._sáb.".split("_"),
            weekdaysMin: "do_lu_ma_mi_ju_vi_sá".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "h:mm A",
                LTS: "h:mm:ss A",
                L: "MM/DD/YYYY",
                LL: "MMMM [de] D [de] YYYY",
                LLL: "MMMM [de] D [de] YYYY h:mm A",
                LLLL: "dddd, MMMM [de] D [de] YYYY h:mm A"
            },
            calendar: {
                sameDay: function() {
                    return "[hoy a la" + (1 !== this.hours() ? "s" : "") + "] LT"
                },
                nextDay: function() {
                    return "[mañana a la" + (1 !== this.hours() ? "s" : "") + "] LT"
                },
                nextWeek: function() {
                    return "dddd [a la" + (1 !== this.hours() ? "s" : "") + "] LT"
                },
                lastDay: function() {
                    return "[ayer a la" + (1 !== this.hours() ? "s" : "") + "] LT"
                },
                lastWeek: function() {
                    return "[el] dddd [pasado a la" + (1 !== this.hours() ? "s" : "") + "] LT"
                },
                sameElse: "L"
            },
            relativeTime: {
                future: "en %s",
                past: "hace %s",
                s: "unos segundos",
                ss: "%d segundos",
                m: "un minuto",
                mm: "%d minutos",
                h: "una hora",
                hh: "%d horas",
                d: "un día",
                dd: "%d días",
                M: "un mes",
                MM: "%d meses",
                y: "un año",
                yy: "%d años"
            },
            dayOfMonthOrdinalParse: /\d{1,2}º/,
            ordinal: "%dº",
            week: {
                dow: 0,
                doy: 6
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        function t(e, t, a, n) {
            var s = {
                s: ["mõne sekundi", "mõni sekund", "paar sekundit"],
                ss: [e + "sekundi", e + "sekundit"],
                m: ["ühe minuti", "üks minut"],
                mm: [e + " minuti", e + " minutit"],
                h: ["ühe tunni", "tund aega", "üks tund"],
                hh: [e + " tunni", e + " tundi"],
                d: ["ühe päeva", "üks päev"],
                M: ["kuu aja", "kuu aega", "üks kuu"],
                MM: [e + " kuu", e + " kuud"],
                y: ["ühe aasta", "aasta", "üks aasta"],
                yy: [e + " aasta", e + " aastat"]
            };
            return t ? s[a][2] ? s[a][2] : s[a][1] : n ? s[a][0] : s[a][1]
        }
        e.defineLocale("et", {
            months: "jaanuar_veebruar_märts_aprill_mai_juuni_juuli_august_september_oktoober_november_detsember".split("_"),
            monthsShort: "jaan_veebr_märts_apr_mai_juuni_juuli_aug_sept_okt_nov_dets".split("_"),
            weekdays: "pühapäev_esmaspäev_teisipäev_kolmapäev_neljapäev_reede_laupäev".split("_"),
            weekdaysShort: "P_E_T_K_N_R_L".split("_"),
            weekdaysMin: "P_E_T_K_N_R_L".split("_"),
            longDateFormat: {
                LT: "H:mm",
                LTS: "H:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D. MMMM YYYY",
                LLL: "D. MMMM YYYY H:mm",
                LLLL: "dddd, D. MMMM YYYY H:mm"
            },
            calendar: {
                sameDay: "[Täna,] LT",
                nextDay: "[Homme,] LT",
                nextWeek: "[Järgmine] dddd LT",
                lastDay: "[Eile,] LT",
                lastWeek: "[Eelmine] dddd LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%s pärast",
                past: "%s tagasi",
                s: t,
                ss: t,
                m: t,
                mm: t,
                h: t,
                hh: t,
                d: t,
                dd: "%d päeva",
                M: t,
                MM: t,
                y: t,
                yy: t
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("eu", {
            months: "urtarrila_otsaila_martxoa_apirila_maiatza_ekaina_uztaila_abuztua_iraila_urria_azaroa_abendua".split("_"),
            monthsShort: "urt._ots._mar._api._mai._eka._uzt._abu._ira._urr._aza._abe.".split("_"),
            monthsParseExact: !0,
            weekdays: "igandea_astelehena_asteartea_asteazkena_osteguna_ostirala_larunbata".split("_"),
            weekdaysShort: "ig._al._ar._az._og._ol._lr.".split("_"),
            weekdaysMin: "ig_al_ar_az_og_ol_lr".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "YYYY-MM-DD",
                LL: "YYYY[ko] MMMM[ren] D[a]",
                LLL: "YYYY[ko] MMMM[ren] D[a] HH:mm",
                LLLL: "dddd, YYYY[ko] MMMM[ren] D[a] HH:mm",
                l: "YYYY-M-D",
                ll: "YYYY[ko] MMM D[a]",
                lll: "YYYY[ko] MMM D[a] HH:mm",
                llll: "ddd, YYYY[ko] MMM D[a] HH:mm"
            },
            calendar: {
                sameDay: "[gaur] LT[etan]",
                nextDay: "[bihar] LT[etan]",
                nextWeek: "dddd LT[etan]",
                lastDay: "[atzo] LT[etan]",
                lastWeek: "[aurreko] dddd LT[etan]",
                sameElse: "L"
            },
            relativeTime: {
                future: "%s barru",
                past: "duela %s",
                s: "segundo batzuk",
                ss: "%d segundo",
                m: "minutu bat",
                mm: "%d minutu",
                h: "ordu bat",
                hh: "%d ordu",
                d: "egun bat",
                dd: "%d egun",
                M: "hilabete bat",
                MM: "%d hilabete",
                y: "urte bat",
                yy: "%d urte"
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = {
            1: "۱",
            2: "۲",
            3: "۳",
            4: "۴",
            5: "۵",
            6: "۶",
            7: "۷",
            8: "۸",
            9: "۹",
            0: "۰"
        }
          , a = {
            "۱": "1",
            "۲": "2",
            "۳": "3",
            "۴": "4",
            "۵": "5",
            "۶": "6",
            "۷": "7",
            "۸": "8",
            "۹": "9",
            "۰": "0"
        };
        e.defineLocale("fa", {
            months: "ژانویه_فوریه_مارس_آوریل_مه_ژوئن_ژوئیه_اوت_سپتامبر_اکتبر_نوامبر_دسامبر".split("_"),
            monthsShort: "ژانویه_فوریه_مارس_آوریل_مه_ژوئن_ژوئیه_اوت_سپتامبر_اکتبر_نوامبر_دسامبر".split("_"),
            weekdays: "یک‌شنبه_دوشنبه_سه‌شنبه_چهارشنبه_پنج‌شنبه_جمعه_شنبه".split("_"),
            weekdaysShort: "یک‌شنبه_دوشنبه_سه‌شنبه_چهارشنبه_پنج‌شنبه_جمعه_شنبه".split("_"),
            weekdaysMin: "ی_د_س_چ_پ_ج_ش".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd, D MMMM YYYY HH:mm"
            },
            meridiemParse: /قبل از ظهر|بعد از ظهر/,
            isPM: function(e) {
                return /بعد از ظهر/.test(e)
            },
            meridiem: function(e, t, a) {
                return e < 12 ? "قبل از ظهر" : "بعد از ظهر"
            },
            calendar: {
                sameDay: "[امروز ساعت] LT",
                nextDay: "[فردا ساعت] LT",
                nextWeek: "dddd [ساعت] LT",
                lastDay: "[دیروز ساعت] LT",
                lastWeek: "dddd [پیش] [ساعت] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "در %s",
                past: "%s پیش",
                s: "چند ثانیه",
                ss: "ثانیه d%",
                m: "یک دقیقه",
                mm: "%d دقیقه",
                h: "یک ساعت",
                hh: "%d ساعت",
                d: "یک روز",
                dd: "%d روز",
                M: "یک ماه",
                MM: "%d ماه",
                y: "یک سال",
                yy: "%d سال"
            },
            preparse: function(e) {
                return e.replace(/[۰-۹]/g, function(e) {
                    return a[e]
                }).replace(/،/g, ",")
            },
            postformat: function(e) {
                return e.replace(/\d/g, function(e) {
                    return t[e]
                }).replace(/,/g, "،")
            },
            dayOfMonthOrdinalParse: /\d{1,2}م/,
            ordinal: "%dم",
            week: {
                dow: 6,
                doy: 12
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = "nolla yksi kaksi kolme neljä viisi kuusi seitsemän kahdeksan yhdeksän".split(" ")
          , a = ["nolla", "yhden", "kahden", "kolmen", "neljän", "viiden", "kuuden", t[7], t[8], t[9]];
        function n(e, n, s, r) {
            var i = "";
            switch (s) {
            case "s":
                return r ? "muutaman sekunnin" : "muutama sekunti";
            case "ss":
                return r ? "sekunnin" : "sekuntia";
            case "m":
                return r ? "minuutin" : "minuutti";
            case "mm":
                i = r ? "minuutin" : "minuuttia";
                break;
            case "h":
                return r ? "tunnin" : "tunti";
            case "hh":
                i = r ? "tunnin" : "tuntia";
                break;
            case "d":
                return r ? "päivän" : "päivä";
            case "dd":
                i = r ? "päivän" : "päivää";
                break;
            case "M":
                return r ? "kuukauden" : "kuukausi";
            case "MM":
                i = r ? "kuukauden" : "kuukautta";
                break;
            case "y":
                return r ? "vuoden" : "vuosi";
            case "yy":
                i = r ? "vuoden" : "vuotta"
            }
            return i = function(e, n) {
                return e < 10 ? n ? a[e] : t[e] : e
            }(e, r) + " " + i
        }
        e.defineLocale("fi", {
            months: "tammikuu_helmikuu_maaliskuu_huhtikuu_toukokuu_kesäkuu_heinäkuu_elokuu_syyskuu_lokakuu_marraskuu_joulukuu".split("_"),
            monthsShort: "tammi_helmi_maalis_huhti_touko_kesä_heinä_elo_syys_loka_marras_joulu".split("_"),
            weekdays: "sunnuntai_maanantai_tiistai_keskiviikko_torstai_perjantai_lauantai".split("_"),
            weekdaysShort: "su_ma_ti_ke_to_pe_la".split("_"),
            weekdaysMin: "su_ma_ti_ke_to_pe_la".split("_"),
            longDateFormat: {
                LT: "HH.mm",
                LTS: "HH.mm.ss",
                L: "DD.MM.YYYY",
                LL: "Do MMMM[ta] YYYY",
                LLL: "Do MMMM[ta] YYYY, [klo] HH.mm",
                LLLL: "dddd, Do MMMM[ta] YYYY, [klo] HH.mm",
                l: "D.M.YYYY",
                ll: "Do MMM YYYY",
                lll: "Do MMM YYYY, [klo] HH.mm",
                llll: "ddd, Do MMM YYYY, [klo] HH.mm"
            },
            calendar: {
                sameDay: "[tänään] [klo] LT",
                nextDay: "[huomenna] [klo] LT",
                nextWeek: "dddd [klo] LT",
                lastDay: "[eilen] [klo] LT",
                lastWeek: "[viime] dddd[na] [klo] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%s päästä",
                past: "%s sitten",
                s: n,
                ss: n,
                m: n,
                mm: n,
                h: n,
                hh: n,
                d: n,
                dd: n,
                M: n,
                MM: n,
                y: n,
                yy: n
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("fo", {
            months: "januar_februar_mars_apríl_mai_juni_juli_august_september_oktober_november_desember".split("_"),
            monthsShort: "jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des".split("_"),
            weekdays: "sunnudagur_mánadagur_týsdagur_mikudagur_hósdagur_fríggjadagur_leygardagur".split("_"),
            weekdaysShort: "sun_mán_týs_mik_hós_frí_ley".split("_"),
            weekdaysMin: "su_má_tý_mi_hó_fr_le".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd D. MMMM, YYYY HH:mm"
            },
            calendar: {
                sameDay: "[Í dag kl.] LT",
                nextDay: "[Í morgin kl.] LT",
                nextWeek: "dddd [kl.] LT",
                lastDay: "[Í gjár kl.] LT",
                lastWeek: "[síðstu] dddd [kl] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "um %s",
                past: "%s síðani",
                s: "fá sekund",
                ss: "%d sekundir",
                m: "ein minutt",
                mm: "%d minuttir",
                h: "ein tími",
                hh: "%d tímar",
                d: "ein dagur",
                dd: "%d dagar",
                M: "ein mánaði",
                MM: "%d mánaðir",
                y: "eitt ár",
                yy: "%d ár"
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("fr", {
            months: "janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre".split("_"),
            monthsShort: "janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.".split("_"),
            monthsParseExact: !0,
            weekdays: "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"),
            weekdaysShort: "dim._lun._mar._mer._jeu._ven._sam.".split("_"),
            weekdaysMin: "di_lu_ma_me_je_ve_sa".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[Aujourd’hui à] LT",
                nextDay: "[Demain à] LT",
                nextWeek: "dddd [à] LT",
                lastDay: "[Hier à] LT",
                lastWeek: "dddd [dernier à] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "dans %s",
                past: "il y a %s",
                s: "quelques secondes",
                ss: "%d secondes",
                m: "une minute",
                mm: "%d minutes",
                h: "une heure",
                hh: "%d heures",
                d: "un jour",
                dd: "%d jours",
                M: "un mois",
                MM: "%d mois",
                y: "un an",
                yy: "%d ans"
            },
            dayOfMonthOrdinalParse: /\d{1,2}(er|)/,
            ordinal: function(e, t) {
                switch (t) {
                case "D":
                    return e + (1 === e ? "er" : "");
                default:
                case "M":
                case "Q":
                case "DDD":
                case "d":
                    return e + (1 === e ? "er" : "e");
                case "w":
                case "W":
                    return e + (1 === e ? "re" : "e")
                }
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("fr-ca", {
            months: "janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre".split("_"),
            monthsShort: "janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.".split("_"),
            monthsParseExact: !0,
            weekdays: "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"),
            weekdaysShort: "dim._lun._mar._mer._jeu._ven._sam.".split("_"),
            weekdaysMin: "di_lu_ma_me_je_ve_sa".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "YYYY-MM-DD",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[Aujourd’hui à] LT",
                nextDay: "[Demain à] LT",
                nextWeek: "dddd [à] LT",
                lastDay: "[Hier à] LT",
                lastWeek: "dddd [dernier à] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "dans %s",
                past: "il y a %s",
                s: "quelques secondes",
                ss: "%d secondes",
                m: "une minute",
                mm: "%d minutes",
                h: "une heure",
                hh: "%d heures",
                d: "un jour",
                dd: "%d jours",
                M: "un mois",
                MM: "%d mois",
                y: "un an",
                yy: "%d ans"
            },
            dayOfMonthOrdinalParse: /\d{1,2}(er|e)/,
            ordinal: function(e, t) {
                switch (t) {
                default:
                case "M":
                case "Q":
                case "D":
                case "DDD":
                case "d":
                    return e + (1 === e ? "er" : "e");
                case "w":
                case "W":
                    return e + (1 === e ? "re" : "e")
                }
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("fr-ch", {
            months: "janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre".split("_"),
            monthsShort: "janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.".split("_"),
            monthsParseExact: !0,
            weekdays: "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"),
            weekdaysShort: "dim._lun._mar._mer._jeu._ven._sam.".split("_"),
            weekdaysMin: "di_lu_ma_me_je_ve_sa".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[Aujourd’hui à] LT",
                nextDay: "[Demain à] LT",
                nextWeek: "dddd [à] LT",
                lastDay: "[Hier à] LT",
                lastWeek: "dddd [dernier à] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "dans %s",
                past: "il y a %s",
                s: "quelques secondes",
                ss: "%d secondes",
                m: "une minute",
                mm: "%d minutes",
                h: "une heure",
                hh: "%d heures",
                d: "un jour",
                dd: "%d jours",
                M: "un mois",
                MM: "%d mois",
                y: "un an",
                yy: "%d ans"
            },
            dayOfMonthOrdinalParse: /\d{1,2}(er|e)/,
            ordinal: function(e, t) {
                switch (t) {
                default:
                case "M":
                case "Q":
                case "D":
                case "DDD":
                case "d":
                    return e + (1 === e ? "er" : "e");
                case "w":
                case "W":
                    return e + (1 === e ? "re" : "e")
                }
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = "jan._feb._mrt._apr._mai_jun._jul._aug._sep._okt._nov._des.".split("_")
          , a = "jan_feb_mrt_apr_mai_jun_jul_aug_sep_okt_nov_des".split("_");
        e.defineLocale("fy", {
            months: "jannewaris_febrewaris_maart_april_maaie_juny_july_augustus_septimber_oktober_novimber_desimber".split("_"),
            monthsShort: function(e, n) {
                return e ? /-MMM-/.test(n) ? a[e.month()] : t[e.month()] : t
            },
            monthsParseExact: !0,
            weekdays: "snein_moandei_tiisdei_woansdei_tongersdei_freed_sneon".split("_"),
            weekdaysShort: "si._mo._ti._wo._to._fr._so.".split("_"),
            weekdaysMin: "Si_Mo_Ti_Wo_To_Fr_So".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD-MM-YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[hjoed om] LT",
                nextDay: "[moarn om] LT",
                nextWeek: "dddd [om] LT",
                lastDay: "[juster om] LT",
                lastWeek: "[ôfrûne] dddd [om] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "oer %s",
                past: "%s lyn",
                s: "in pear sekonden",
                ss: "%d sekonden",
                m: "ien minút",
                mm: "%d minuten",
                h: "ien oere",
                hh: "%d oeren",
                d: "ien dei",
                dd: "%d dagen",
                M: "ien moanne",
                MM: "%d moannen",
                y: "ien jier",
                yy: "%d jierren"
            },
            dayOfMonthOrdinalParse: /\d{1,2}(ste|de)/,
            ordinal: function(e) {
                return e + (1 === e || 8 === e || e >= 20 ? "ste" : "de")
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("gd", {
            months: ["Am Faoilleach", "An Gearran", "Am Màrt", "An Giblean", "An Cèitean", "An t-Ògmhios", "An t-Iuchar", "An Lùnastal", "An t-Sultain", "An Dàmhair", "An t-Samhain", "An Dùbhlachd"],
            monthsShort: ["Faoi", "Gear", "Màrt", "Gibl", "Cèit", "Ògmh", "Iuch", "Lùn", "Sult", "Dàmh", "Samh", "Dùbh"],
            monthsParseExact: !0,
            weekdays: ["Didòmhnaich", "Diluain", "Dimàirt", "Diciadain", "Diardaoin", "Dihaoine", "Disathairne"],
            weekdaysShort: ["Did", "Dil", "Dim", "Dic", "Dia", "Dih", "Dis"],
            weekdaysMin: ["Dò", "Lu", "Mà", "Ci", "Ar", "Ha", "Sa"],
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd, D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[An-diugh aig] LT",
                nextDay: "[A-màireach aig] LT",
                nextWeek: "dddd [aig] LT",
                lastDay: "[An-dè aig] LT",
                lastWeek: "dddd [seo chaidh] [aig] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "ann an %s",
                past: "bho chionn %s",
                s: "beagan diogan",
                ss: "%d diogan",
                m: "mionaid",
                mm: "%d mionaidean",
                h: "uair",
                hh: "%d uairean",
                d: "latha",
                dd: "%d latha",
                M: "mìos",
                MM: "%d mìosan",
                y: "bliadhna",
                yy: "%d bliadhna"
            },
            dayOfMonthOrdinalParse: /\d{1,2}(d|na|mh)/,
            ordinal: function(e) {
                var t = 1 === e ? "d" : e % 10 == 2 ? "na" : "mh";
                return e + t
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("gl", {
            months: "xaneiro_febreiro_marzo_abril_maio_xuño_xullo_agosto_setembro_outubro_novembro_decembro".split("_"),
            monthsShort: "xan._feb._mar._abr._mai._xuñ._xul._ago._set._out._nov._dec.".split("_"),
            monthsParseExact: !0,
            weekdays: "domingo_luns_martes_mércores_xoves_venres_sábado".split("_"),
            weekdaysShort: "dom._lun._mar._mér._xov._ven._sáb.".split("_"),
            weekdaysMin: "do_lu_ma_mé_xo_ve_sá".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "H:mm",
                LTS: "H:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D [de] MMMM [de] YYYY",
                LLL: "D [de] MMMM [de] YYYY H:mm",
                LLLL: "dddd, D [de] MMMM [de] YYYY H:mm"
            },
            calendar: {
                sameDay: function() {
                    return "[hoxe " + (1 !== this.hours() ? "ás" : "á") + "] LT"
                },
                nextDay: function() {
                    return "[mañá " + (1 !== this.hours() ? "ás" : "á") + "] LT"
                },
                nextWeek: function() {
                    return "dddd [" + (1 !== this.hours() ? "ás" : "a") + "] LT"
                },
                lastDay: function() {
                    return "[onte " + (1 !== this.hours() ? "á" : "a") + "] LT"
                },
                lastWeek: function() {
                    return "[o] dddd [pasado " + (1 !== this.hours() ? "ás" : "a") + "] LT"
                },
                sameElse: "L"
            },
            relativeTime: {
                future: function(e) {
                    return 0 === e.indexOf("un") ? "n" + e : "en " + e
                },
                past: "hai %s",
                s: "uns segundos",
                ss: "%d segundos",
                m: "un minuto",
                mm: "%d minutos",
                h: "unha hora",
                hh: "%d horas",
                d: "un día",
                dd: "%d días",
                M: "un mes",
                MM: "%d meses",
                y: "un ano",
                yy: "%d anos"
            },
            dayOfMonthOrdinalParse: /\d{1,2}º/,
            ordinal: "%dº",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        function t(e, t, a, n) {
            var s = {
                s: ["thodde secondanim", "thodde second"],
                ss: [e + " secondanim", e + " second"],
                m: ["eka mintan", "ek minute"],
                mm: [e + " mintanim", e + " mintam"],
                h: ["eka horan", "ek hor"],
                hh: [e + " horanim", e + " horam"],
                d: ["eka disan", "ek dis"],
                dd: [e + " disanim", e + " dis"],
                M: ["eka mhoinean", "ek mhoino"],
                MM: [e + " mhoineanim", e + " mhoine"],
                y: ["eka vorsan", "ek voros"],
                yy: [e + " vorsanim", e + " vorsam"]
            };
            return t ? s[a][0] : s[a][1]
        }
        e.defineLocale("gom-latn", {
            months: "Janer_Febrer_Mars_Abril_Mai_Jun_Julai_Agost_Setembr_Otubr_Novembr_Dezembr".split("_"),
            monthsShort: "Jan._Feb._Mars_Abr._Mai_Jun_Jul._Ago._Set._Otu._Nov._Dez.".split("_"),
            monthsParseExact: !0,
            weekdays: "Aitar_Somar_Mongllar_Budvar_Brestar_Sukrar_Son'var".split("_"),
            weekdaysShort: "Ait._Som._Mon._Bud._Bre._Suk._Son.".split("_"),
            weekdaysMin: "Ai_Sm_Mo_Bu_Br_Su_Sn".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "A h:mm [vazta]",
                LTS: "A h:mm:ss [vazta]",
                L: "DD-MM-YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY A h:mm [vazta]",
                LLLL: "dddd, MMMM[achea] Do, YYYY, A h:mm [vazta]",
                llll: "ddd, D MMM YYYY, A h:mm [vazta]"
            },
            calendar: {
                sameDay: "[Aiz] LT",
                nextDay: "[Faleam] LT",
                nextWeek: "[Ieta to] dddd[,] LT",
                lastDay: "[Kal] LT",
                lastWeek: "[Fatlo] dddd[,] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%s",
                past: "%s adim",
                s: t,
                ss: t,
                m: t,
                mm: t,
                h: t,
                hh: t,
                d: t,
                dd: t,
                M: t,
                MM: t,
                y: t,
                yy: t
            },
            dayOfMonthOrdinalParse: /\d{1,2}(er)/,
            ordinal: function(e, t) {
                switch (t) {
                case "D":
                    return e + "er";
                default:
                case "M":
                case "Q":
                case "DDD":
                case "d":
                case "w":
                case "W":
                    return e
                }
            },
            week: {
                dow: 1,
                doy: 4
            },
            meridiemParse: /rati|sokalli|donparam|sanje/,
            meridiemHour: function(e, t) {
                return 12 === e && (e = 0),
                "rati" === t ? e < 4 ? e : e + 12 : "sokalli" === t ? e : "donparam" === t ? e > 12 ? e : e + 12 : "sanje" === t ? e + 12 : void 0
            },
            meridiem: function(e, t, a) {
                return e < 4 ? "rati" : e < 12 ? "sokalli" : e < 16 ? "donparam" : e < 20 ? "sanje" : "rati"
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = {
            1: "૧",
            2: "૨",
            3: "૩",
            4: "૪",
            5: "૫",
            6: "૬",
            7: "૭",
            8: "૮",
            9: "૯",
            0: "૦"
        }
          , a = {
            "૧": "1",
            "૨": "2",
            "૩": "3",
            "૪": "4",
            "૫": "5",
            "૬": "6",
            "૭": "7",
            "૮": "8",
            "૯": "9",
            "૦": "0"
        };
        e.defineLocale("gu", {
            months: "જાન્યુઆરી_ફેબ્રુઆરી_માર્ચ_એપ્રિલ_મે_જૂન_જુલાઈ_ઑગસ્ટ_સપ્ટેમ્બર_ઑક્ટ્બર_નવેમ્બર_ડિસેમ્બર".split("_"),
            monthsShort: "જાન્યુ._ફેબ્રુ._માર્ચ_એપ્રિ._મે_જૂન_જુલા._ઑગ._સપ્ટે._ઑક્ટ્._નવે._ડિસે.".split("_"),
            monthsParseExact: !0,
            weekdays: "રવિવાર_સોમવાર_મંગળવાર_બુધ્વાર_ગુરુવાર_શુક્રવાર_શનિવાર".split("_"),
            weekdaysShort: "રવિ_સોમ_મંગળ_બુધ્_ગુરુ_શુક્ર_શનિ".split("_"),
            weekdaysMin: "ર_સો_મં_બુ_ગુ_શુ_શ".split("_"),
            longDateFormat: {
                LT: "A h:mm વાગ્યે",
                LTS: "A h:mm:ss વાગ્યે",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY, A h:mm વાગ્યે",
                LLLL: "dddd, D MMMM YYYY, A h:mm વાગ્યે"
            },
            calendar: {
                sameDay: "[આજ] LT",
                nextDay: "[કાલે] LT",
                nextWeek: "dddd, LT",
                lastDay: "[ગઇકાલે] LT",
                lastWeek: "[પાછલા] dddd, LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%s મા",
                past: "%s પેહલા",
                s: "અમુક પળો",
                ss: "%d સેકંડ",
                m: "એક મિનિટ",
                mm: "%d મિનિટ",
                h: "એક કલાક",
                hh: "%d કલાક",
                d: "એક દિવસ",
                dd: "%d દિવસ",
                M: "એક મહિનો",
                MM: "%d મહિનો",
                y: "એક વર્ષ",
                yy: "%d વર્ષ"
            },
            preparse: function(e) {
                return e.replace(/[૧૨૩૪૫૬૭૮૯૦]/g, function(e) {
                    return a[e]
                })
            },
            postformat: function(e) {
                return e.replace(/\d/g, function(e) {
                    return t[e]
                })
            },
            meridiemParse: /રાત|બપોર|સવાર|સાંજ/,
            meridiemHour: function(e, t) {
                return 12 === e && (e = 0),
                "રાત" === t ? e < 4 ? e : e + 12 : "સવાર" === t ? e : "બપોર" === t ? e >= 10 ? e : e + 12 : "સાંજ" === t ? e + 12 : void 0
            },
            meridiem: function(e, t, a) {
                return e < 4 ? "રાત" : e < 10 ? "સવાર" : e < 17 ? "બપોર" : e < 20 ? "સાંજ" : "રાત"
            },
            week: {
                dow: 0,
                doy: 6
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("he", {
            months: "ינואר_פברואר_מרץ_אפריל_מאי_יוני_יולי_אוגוסט_ספטמבר_אוקטובר_נובמבר_דצמבר".split("_"),
            monthsShort: "ינו׳_פבר׳_מרץ_אפר׳_מאי_יוני_יולי_אוג׳_ספט׳_אוק׳_נוב׳_דצמ׳".split("_"),
            weekdays: "ראשון_שני_שלישי_רביעי_חמישי_שישי_שבת".split("_"),
            weekdaysShort: "א׳_ב׳_ג׳_ד׳_ה׳_ו׳_ש׳".split("_"),
            weekdaysMin: "א_ב_ג_ד_ה_ו_ש".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D [ב]MMMM YYYY",
                LLL: "D [ב]MMMM YYYY HH:mm",
                LLLL: "dddd, D [ב]MMMM YYYY HH:mm",
                l: "D/M/YYYY",
                ll: "D MMM YYYY",
                lll: "D MMM YYYY HH:mm",
                llll: "ddd, D MMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[היום ב־]LT",
                nextDay: "[מחר ב־]LT",
                nextWeek: "dddd [בשעה] LT",
                lastDay: "[אתמול ב־]LT",
                lastWeek: "[ביום] dddd [האחרון בשעה] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "בעוד %s",
                past: "לפני %s",
                s: "מספר שניות",
                ss: "%d שניות",
                m: "דקה",
                mm: "%d דקות",
                h: "שעה",
                hh: function(e) {
                    return 2 === e ? "שעתיים" : e + " שעות"
                },
                d: "יום",
                dd: function(e) {
                    return 2 === e ? "יומיים" : e + " ימים"
                },
                M: "חודש",
                MM: function(e) {
                    return 2 === e ? "חודשיים" : e + " חודשים"
                },
                y: "שנה",
                yy: function(e) {
                    return 2 === e ? "שנתיים" : e % 10 == 0 && 10 !== e ? e + " שנה" : e + " שנים"
                }
            },
            meridiemParse: /אחה"צ|לפנה"צ|אחרי הצהריים|לפני הצהריים|לפנות בוקר|בבוקר|בערב/i,
            isPM: function(e) {
                return /^(אחה"צ|אחרי הצהריים|בערב)$/.test(e)
            },
            meridiem: function(e, t, a) {
                return e < 5 ? "לפנות בוקר" : e < 10 ? "בבוקר" : e < 12 ? a ? 'לפנה"צ' : "לפני הצהריים" : e < 18 ? a ? 'אחה"צ' : "אחרי הצהריים" : "בערב"
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = {
            1: "१",
            2: "२",
            3: "३",
            4: "४",
            5: "५",
            6: "६",
            7: "७",
            8: "८",
            9: "९",
            0: "०"
        }
          , a = {
            "१": "1",
            "२": "2",
            "३": "3",
            "४": "4",
            "५": "5",
            "६": "6",
            "७": "7",
            "८": "8",
            "९": "9",
            "०": "0"
        };
        e.defineLocale("hi", {
            months: "जनवरी_फ़रवरी_मार्च_अप्रैल_मई_जून_जुलाई_अगस्त_सितम्बर_अक्टूबर_नवम्बर_दिसम्बर".split("_"),
            monthsShort: "जन._फ़र._मार्च_अप्रै._मई_जून_जुल._अग._सित._अक्टू._नव._दिस.".split("_"),
            monthsParseExact: !0,
            weekdays: "रविवार_सोमवार_मंगलवार_बुधवार_गुरूवार_शुक्रवार_शनिवार".split("_"),
            weekdaysShort: "रवि_सोम_मंगल_बुध_गुरू_शुक्र_शनि".split("_"),
            weekdaysMin: "र_सो_मं_बु_गु_शु_श".split("_"),
            longDateFormat: {
                LT: "A h:mm बजे",
                LTS: "A h:mm:ss बजे",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY, A h:mm बजे",
                LLLL: "dddd, D MMMM YYYY, A h:mm बजे"
            },
            calendar: {
                sameDay: "[आज] LT",
                nextDay: "[कल] LT",
                nextWeek: "dddd, LT",
                lastDay: "[कल] LT",
                lastWeek: "[पिछले] dddd, LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%s में",
                past: "%s पहले",
                s: "कुछ ही क्षण",
                ss: "%d सेकंड",
                m: "एक मिनट",
                mm: "%d मिनट",
                h: "एक घंटा",
                hh: "%d घंटे",
                d: "एक दिन",
                dd: "%d दिन",
                M: "एक महीने",
                MM: "%d महीने",
                y: "एक वर्ष",
                yy: "%d वर्ष"
            },
            preparse: function(e) {
                return e.replace(/[१२३४५६७८९०]/g, function(e) {
                    return a[e]
                })
            },
            postformat: function(e) {
                return e.replace(/\d/g, function(e) {
                    return t[e]
                })
            },
            meridiemParse: /रात|सुबह|दोपहर|शाम/,
            meridiemHour: function(e, t) {
                return 12 === e && (e = 0),
                "रात" === t ? e < 4 ? e : e + 12 : "सुबह" === t ? e : "दोपहर" === t ? e >= 10 ? e : e + 12 : "शाम" === t ? e + 12 : void 0
            },
            meridiem: function(e, t, a) {
                return e < 4 ? "रात" : e < 10 ? "सुबह" : e < 17 ? "दोपहर" : e < 20 ? "शाम" : "रात"
            },
            week: {
                dow: 0,
                doy: 6
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        function t(e, t, a) {
            var n = e + " ";
            switch (a) {
            case "ss":
                return n += 1 === e ? "sekunda" : 2 === e || 3 === e || 4 === e ? "sekunde" : "sekundi";
            case "m":
                return t ? "jedna minuta" : "jedne minute";
            case "mm":
                return n += 1 === e ? "minuta" : 2 === e || 3 === e || 4 === e ? "minute" : "minuta";
            case "h":
                return t ? "jedan sat" : "jednog sata";
            case "hh":
                return n += 1 === e ? "sat" : 2 === e || 3 === e || 4 === e ? "sata" : "sati";
            case "dd":
                return n += 1 === e ? "dan" : "dana";
            case "MM":
                return n += 1 === e ? "mjesec" : 2 === e || 3 === e || 4 === e ? "mjeseca" : "mjeseci";
            case "yy":
                return n += 1 === e ? "godina" : 2 === e || 3 === e || 4 === e ? "godine" : "godina"
            }
        }
        e.defineLocale("hr", {
            months: {
                format: "siječnja_veljače_ožujka_travnja_svibnja_lipnja_srpnja_kolovoza_rujna_listopada_studenoga_prosinca".split("_"),
                standalone: "siječanj_veljača_ožujak_travanj_svibanj_lipanj_srpanj_kolovoz_rujan_listopad_studeni_prosinac".split("_")
            },
            monthsShort: "sij._velj._ožu._tra._svi._lip._srp._kol._ruj._lis._stu._pro.".split("_"),
            monthsParseExact: !0,
            weekdays: "nedjelja_ponedjeljak_utorak_srijeda_četvrtak_petak_subota".split("_"),
            weekdaysShort: "ned._pon._uto._sri._čet._pet._sub.".split("_"),
            weekdaysMin: "ne_po_ut_sr_če_pe_su".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "H:mm",
                LTS: "H:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D. MMMM YYYY",
                LLL: "D. MMMM YYYY H:mm",
                LLLL: "dddd, D. MMMM YYYY H:mm"
            },
            calendar: {
                sameDay: "[danas u] LT",
                nextDay: "[sutra u] LT",
                nextWeek: function() {
                    switch (this.day()) {
                    case 0:
                        return "[u] [nedjelju] [u] LT";
                    case 3:
                        return "[u] [srijedu] [u] LT";
                    case 6:
                        return "[u] [subotu] [u] LT";
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return "[u] dddd [u] LT"
                    }
                },
                lastDay: "[jučer u] LT",
                lastWeek: function() {
                    switch (this.day()) {
                    case 0:
                    case 3:
                        return "[prošlu] dddd [u] LT";
                    case 6:
                        return "[prošle] [subote] [u] LT";
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return "[prošli] dddd [u] LT"
                    }
                },
                sameElse: "L"
            },
            relativeTime: {
                future: "za %s",
                past: "prije %s",
                s: "par sekundi",
                ss: t,
                m: t,
                mm: t,
                h: t,
                hh: t,
                d: "dan",
                dd: t,
                M: "mjesec",
                MM: t,
                y: "godinu",
                yy: t
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = "vasárnap hétfőn kedden szerdán csütörtökön pénteken szombaton".split(" ");
        function a(e, t, a, n) {
            var s = e;
            switch (a) {
            case "s":
                return n || t ? "néhány másodperc" : "néhány másodperce";
            case "ss":
                return s + (n || t) ? " másodperc" : " másodperce";
            case "m":
                return "egy" + (n || t ? " perc" : " perce");
            case "mm":
                return s + (n || t ? " perc" : " perce");
            case "h":
                return "egy" + (n || t ? " óra" : " órája");
            case "hh":
                return s + (n || t ? " óra" : " órája");
            case "d":
                return "egy" + (n || t ? " nap" : " napja");
            case "dd":
                return s + (n || t ? " nap" : " napja");
            case "M":
                return "egy" + (n || t ? " hónap" : " hónapja");
            case "MM":
                return s + (n || t ? " hónap" : " hónapja");
            case "y":
                return "egy" + (n || t ? " év" : " éve");
            case "yy":
                return s + (n || t ? " év" : " éve")
            }
            return ""
        }
        function n(e) {
            return (e ? "" : "[múlt] ") + "[" + t[this.day()] + "] LT[-kor]"
        }
        e.defineLocale("hu", {
            months: "január_február_március_április_május_június_július_augusztus_szeptember_október_november_december".split("_"),
            monthsShort: "jan_feb_márc_ápr_máj_jún_júl_aug_szept_okt_nov_dec".split("_"),
            weekdays: "vasárnap_hétfő_kedd_szerda_csütörtök_péntek_szombat".split("_"),
            weekdaysShort: "vas_hét_kedd_sze_csüt_pén_szo".split("_"),
            weekdaysMin: "v_h_k_sze_cs_p_szo".split("_"),
            longDateFormat: {
                LT: "H:mm",
                LTS: "H:mm:ss",
                L: "YYYY.MM.DD.",
                LL: "YYYY. MMMM D.",
                LLL: "YYYY. MMMM D. H:mm",
                LLLL: "YYYY. MMMM D., dddd H:mm"
            },
            meridiemParse: /de|du/i,
            isPM: function(e) {
                return "u" === e.charAt(1).toLowerCase()
            },
            meridiem: function(e, t, a) {
                return e < 12 ? !0 === a ? "de" : "DE" : !0 === a ? "du" : "DU"
            },
            calendar: {
                sameDay: "[ma] LT[-kor]",
                nextDay: "[holnap] LT[-kor]",
                nextWeek: function() {
                    return n.call(this, !0)
                },
                lastDay: "[tegnap] LT[-kor]",
                lastWeek: function() {
                    return n.call(this, !1)
                },
                sameElse: "L"
            },
            relativeTime: {
                future: "%s múlva",
                past: "%s",
                s: a,
                ss: a,
                m: a,
                mm: a,
                h: a,
                hh: a,
                d: a,
                dd: a,
                M: a,
                MM: a,
                y: a,
                yy: a
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("hy-am", {
            months: {
                format: "հունվարի_փետրվարի_մարտի_ապրիլի_մայիսի_հունիսի_հուլիսի_օգոստոսի_սեպտեմբերի_հոկտեմբերի_նոյեմբերի_դեկտեմբերի".split("_"),
                standalone: "հունվար_փետրվար_մարտ_ապրիլ_մայիս_հունիս_հուլիս_օգոստոս_սեպտեմբեր_հոկտեմբեր_նոյեմբեր_դեկտեմբեր".split("_")
            },
            monthsShort: "հնվ_փտր_մրտ_ապր_մյս_հնս_հլս_օգս_սպտ_հկտ_նմբ_դկտ".split("_"),
            weekdays: "կիրակի_երկուշաբթի_երեքշաբթի_չորեքշաբթի_հինգշաբթի_ուրբաթ_շաբաթ".split("_"),
            weekdaysShort: "կրկ_երկ_երք_չրք_հնգ_ուրբ_շբթ".split("_"),
            weekdaysMin: "կրկ_երկ_երք_չրք_հնգ_ուրբ_շբթ".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D MMMM YYYY թ.",
                LLL: "D MMMM YYYY թ., HH:mm",
                LLLL: "dddd, D MMMM YYYY թ., HH:mm"
            },
            calendar: {
                sameDay: "[այսօր] LT",
                nextDay: "[վաղը] LT",
                lastDay: "[երեկ] LT",
                nextWeek: function() {
                    return "dddd [օրը ժամը] LT"
                },
                lastWeek: function() {
                    return "[անցած] dddd [օրը ժամը] LT"
                },
                sameElse: "L"
            },
            relativeTime: {
                future: "%s հետո",
                past: "%s առաջ",
                s: "մի քանի վայրկյան",
                ss: "%d վայրկյան",
                m: "րոպե",
                mm: "%d րոպե",
                h: "ժամ",
                hh: "%d ժամ",
                d: "օր",
                dd: "%d օր",
                M: "ամիս",
                MM: "%d ամիս",
                y: "տարի",
                yy: "%d տարի"
            },
            meridiemParse: /գիշերվա|առավոտվա|ցերեկվա|երեկոյան/,
            isPM: function(e) {
                return /^(ցերեկվա|երեկոյան)$/.test(e)
            },
            meridiem: function(e) {
                return e < 4 ? "գիշերվա" : e < 12 ? "առավոտվա" : e < 17 ? "ցերեկվա" : "երեկոյան"
            },
            dayOfMonthOrdinalParse: /\d{1,2}|\d{1,2}-(ին|րդ)/,
            ordinal: function(e, t) {
                switch (t) {
                case "DDD":
                case "w":
                case "W":
                case "DDDo":
                    return 1 === e ? e + "-ին" : e + "-րդ";
                default:
                    return e
                }
            },
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("id", {
            months: "Januari_Februari_Maret_April_Mei_Juni_Juli_Agustus_September_Oktober_November_Desember".split("_"),
            monthsShort: "Jan_Feb_Mar_Apr_Mei_Jun_Jul_Agt_Sep_Okt_Nov_Des".split("_"),
            weekdays: "Minggu_Senin_Selasa_Rabu_Kamis_Jumat_Sabtu".split("_"),
            weekdaysShort: "Min_Sen_Sel_Rab_Kam_Jum_Sab".split("_"),
            weekdaysMin: "Mg_Sn_Sl_Rb_Km_Jm_Sb".split("_"),
            longDateFormat: {
                LT: "HH.mm",
                LTS: "HH.mm.ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY [pukul] HH.mm",
                LLLL: "dddd, D MMMM YYYY [pukul] HH.mm"
            },
            meridiemParse: /pagi|siang|sore|malam/,
            meridiemHour: function(e, t) {
                return 12 === e && (e = 0),
                "pagi" === t ? e : "siang" === t ? e >= 11 ? e : e + 12 : "sore" === t || "malam" === t ? e + 12 : void 0
            },
            meridiem: function(e, t, a) {
                return e < 11 ? "pagi" : e < 15 ? "siang" : e < 19 ? "sore" : "malam"
            },
            calendar: {
                sameDay: "[Hari ini pukul] LT",
                nextDay: "[Besok pukul] LT",
                nextWeek: "dddd [pukul] LT",
                lastDay: "[Kemarin pukul] LT",
                lastWeek: "dddd [lalu pukul] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "dalam %s",
                past: "%s yang lalu",
                s: "beberapa detik",
                ss: "%d detik",
                m: "semenit",
                mm: "%d menit",
                h: "sejam",
                hh: "%d jam",
                d: "sehari",
                dd: "%d hari",
                M: "sebulan",
                MM: "%d bulan",
                y: "setahun",
                yy: "%d tahun"
            },
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        function t(e) {
            return e % 100 == 11 || e % 10 != 1
        }
        function a(e, a, n, s) {
            var r = e + " ";
            switch (n) {
            case "s":
                return a || s ? "nokkrar sekúndur" : "nokkrum sekúndum";
            case "ss":
                return t(e) ? r + (a || s ? "sekúndur" : "sekúndum") : r + "sekúnda";
            case "m":
                return a ? "mínúta" : "mínútu";
            case "mm":
                return t(e) ? r + (a || s ? "mínútur" : "mínútum") : a ? r + "mínúta" : r + "mínútu";
            case "hh":
                return t(e) ? r + (a || s ? "klukkustundir" : "klukkustundum") : r + "klukkustund";
            case "d":
                return a ? "dagur" : s ? "dag" : "degi";
            case "dd":
                return t(e) ? a ? r + "dagar" : r + (s ? "daga" : "dögum") : a ? r + "dagur" : r + (s ? "dag" : "degi");
            case "M":
                return a ? "mánuður" : s ? "mánuð" : "mánuði";
            case "MM":
                return t(e) ? a ? r + "mánuðir" : r + (s ? "mánuði" : "mánuðum") : a ? r + "mánuður" : r + (s ? "mánuð" : "mánuði");
            case "y":
                return a || s ? "ár" : "ári";
            case "yy":
                return t(e) ? r + (a || s ? "ár" : "árum") : r + (a || s ? "ár" : "ári")
            }
        }
        e.defineLocale("is", {
            months: "janúar_febrúar_mars_apríl_maí_júní_júlí_ágúst_september_október_nóvember_desember".split("_"),
            monthsShort: "jan_feb_mar_apr_maí_jún_júl_ágú_sep_okt_nóv_des".split("_"),
            weekdays: "sunnudagur_mánudagur_þriðjudagur_miðvikudagur_fimmtudagur_föstudagur_laugardagur".split("_"),
            weekdaysShort: "sun_mán_þri_mið_fim_fös_lau".split("_"),
            weekdaysMin: "Su_Má_Þr_Mi_Fi_Fö_La".split("_"),
            longDateFormat: {
                LT: "H:mm",
                LTS: "H:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D. MMMM YYYY",
                LLL: "D. MMMM YYYY [kl.] H:mm",
                LLLL: "dddd, D. MMMM YYYY [kl.] H:mm"
            },
            calendar: {
                sameDay: "[í dag kl.] LT",
                nextDay: "[á morgun kl.] LT",
                nextWeek: "dddd [kl.] LT",
                lastDay: "[í gær kl.] LT",
                lastWeek: "[síðasta] dddd [kl.] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "eftir %s",
                past: "fyrir %s síðan",
                s: a,
                ss: a,
                m: a,
                mm: a,
                h: "klukkustund",
                hh: a,
                d: a,
                dd: a,
                M: a,
                MM: a,
                y: a,
                yy: a
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("it", {
            months: "gennaio_febbraio_marzo_aprile_maggio_giugno_luglio_agosto_settembre_ottobre_novembre_dicembre".split("_"),
            monthsShort: "gen_feb_mar_apr_mag_giu_lug_ago_set_ott_nov_dic".split("_"),
            weekdays: "domenica_lunedì_martedì_mercoledì_giovedì_venerdì_sabato".split("_"),
            weekdaysShort: "dom_lun_mar_mer_gio_ven_sab".split("_"),
            weekdaysMin: "do_lu_ma_me_gi_ve_sa".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[Oggi alle] LT",
                nextDay: "[Domani alle] LT",
                nextWeek: "dddd [alle] LT",
                lastDay: "[Ieri alle] LT",
                lastWeek: function() {
                    switch (this.day()) {
                    case 0:
                        return "[la scorsa] dddd [alle] LT";
                    default:
                        return "[lo scorso] dddd [alle] LT"
                    }
                },
                sameElse: "L"
            },
            relativeTime: {
                future: function(e) {
                    return (/^[0-9].+$/.test(e) ? "tra" : "in") + " " + e
                },
                past: "%s fa",
                s: "alcuni secondi",
                ss: "%d secondi",
                m: "un minuto",
                mm: "%d minuti",
                h: "un'ora",
                hh: "%d ore",
                d: "un giorno",
                dd: "%d giorni",
                M: "un mese",
                MM: "%d mesi",
                y: "un anno",
                yy: "%d anni"
            },
            dayOfMonthOrdinalParse: /\d{1,2}º/,
            ordinal: "%dº",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("ja", {
            months: "1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"),
            monthsShort: "1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"),
            weekdays: "日曜日_月曜日_火曜日_水曜日_木曜日_金曜日_土曜日".split("_"),
            weekdaysShort: "日_月_火_水_木_金_土".split("_"),
            weekdaysMin: "日_月_火_水_木_金_土".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "YYYY/MM/DD",
                LL: "YYYY年M月D日",
                LLL: "YYYY年M月D日 HH:mm",
                LLLL: "YYYY年M月D日 dddd HH:mm",
                l: "YYYY/MM/DD",
                ll: "YYYY年M月D日",
                lll: "YYYY年M月D日 HH:mm",
                llll: "YYYY年M月D日(ddd) HH:mm"
            },
            meridiemParse: /午前|午後/i,
            isPM: function(e) {
                return "午後" === e
            },
            meridiem: function(e, t, a) {
                return e < 12 ? "午前" : "午後"
            },
            calendar: {
                sameDay: "[今日] LT",
                nextDay: "[明日] LT",
                nextWeek: function(e) {
                    return e.week() < this.week() ? "[来週]dddd LT" : "dddd LT"
                },
                lastDay: "[昨日] LT",
                lastWeek: function(e) {
                    return this.week() < e.week() ? "[先週]dddd LT" : "dddd LT"
                },
                sameElse: "L"
            },
            dayOfMonthOrdinalParse: /\d{1,2}日/,
            ordinal: function(e, t) {
                switch (t) {
                case "d":
                case "D":
                case "DDD":
                    return e + "日";
                default:
                    return e
                }
            },
            relativeTime: {
                future: "%s後",
                past: "%s前",
                s: "数秒",
                ss: "%d秒",
                m: "1分",
                mm: "%d分",
                h: "1時間",
                hh: "%d時間",
                d: "1日",
                dd: "%d日",
                M: "1ヶ月",
                MM: "%dヶ月",
                y: "1年",
                yy: "%d年"
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("jv", {
            months: "Januari_Februari_Maret_April_Mei_Juni_Juli_Agustus_September_Oktober_Nopember_Desember".split("_"),
            monthsShort: "Jan_Feb_Mar_Apr_Mei_Jun_Jul_Ags_Sep_Okt_Nop_Des".split("_"),
            weekdays: "Minggu_Senen_Seloso_Rebu_Kemis_Jemuwah_Septu".split("_"),
            weekdaysShort: "Min_Sen_Sel_Reb_Kem_Jem_Sep".split("_"),
            weekdaysMin: "Mg_Sn_Sl_Rb_Km_Jm_Sp".split("_"),
            longDateFormat: {
                LT: "HH.mm",
                LTS: "HH.mm.ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY [pukul] HH.mm",
                LLLL: "dddd, D MMMM YYYY [pukul] HH.mm"
            },
            meridiemParse: /enjing|siyang|sonten|ndalu/,
            meridiemHour: function(e, t) {
                return 12 === e && (e = 0),
                "enjing" === t ? e : "siyang" === t ? e >= 11 ? e : e + 12 : "sonten" === t || "ndalu" === t ? e + 12 : void 0
            },
            meridiem: function(e, t, a) {
                return e < 11 ? "enjing" : e < 15 ? "siyang" : e < 19 ? "sonten" : "ndalu"
            },
            calendar: {
                sameDay: "[Dinten puniko pukul] LT",
                nextDay: "[Mbenjang pukul] LT",
                nextWeek: "dddd [pukul] LT",
                lastDay: "[Kala wingi pukul] LT",
                lastWeek: "dddd [kepengker pukul] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "wonten ing %s",
                past: "%s ingkang kepengker",
                s: "sawetawis detik",
                ss: "%d detik",
                m: "setunggal menit",
                mm: "%d menit",
                h: "setunggal jam",
                hh: "%d jam",
                d: "sedinten",
                dd: "%d dinten",
                M: "sewulan",
                MM: "%d wulan",
                y: "setaun",
                yy: "%d taun"
            },
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("ka", {
            months: {
                standalone: "იანვარი_თებერვალი_მარტი_აპრილი_მაისი_ივნისი_ივლისი_აგვისტო_სექტემბერი_ოქტომბერი_ნოემბერი_დეკემბერი".split("_"),
                format: "იანვარს_თებერვალს_მარტს_აპრილის_მაისს_ივნისს_ივლისს_აგვისტს_სექტემბერს_ოქტომბერს_ნოემბერს_დეკემბერს".split("_")
            },
            monthsShort: "იან_თებ_მარ_აპრ_მაი_ივნ_ივლ_აგვ_სექ_ოქტ_ნოე_დეკ".split("_"),
            weekdays: {
                standalone: "კვირა_ორშაბათი_სამშაბათი_ოთხშაბათი_ხუთშაბათი_პარასკევი_შაბათი".split("_"),
                format: "კვირას_ორშაბათს_სამშაბათს_ოთხშაბათს_ხუთშაბათს_პარასკევს_შაბათს".split("_"),
                isFormat: /(წინა|შემდეგ)/
            },
            weekdaysShort: "კვი_ორშ_სამ_ოთხ_ხუთ_პარ_შაბ".split("_"),
            weekdaysMin: "კვ_ორ_სა_ოთ_ხუ_პა_შა".split("_"),
            longDateFormat: {
                LT: "h:mm A",
                LTS: "h:mm:ss A",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY h:mm A",
                LLLL: "dddd, D MMMM YYYY h:mm A"
            },
            calendar: {
                sameDay: "[დღეს] LT[-ზე]",
                nextDay: "[ხვალ] LT[-ზე]",
                lastDay: "[გუშინ] LT[-ზე]",
                nextWeek: "[შემდეგ] dddd LT[-ზე]",
                lastWeek: "[წინა] dddd LT-ზე",
                sameElse: "L"
            },
            relativeTime: {
                future: function(e) {
                    return /(წამი|წუთი|საათი|წელი)/.test(e) ? e.replace(/ი$/, "ში") : e + "ში"
                },
                past: function(e) {
                    return /(წამი|წუთი|საათი|დღე|თვე)/.test(e) ? e.replace(/(ი|ე)$/, "ის წინ") : /წელი/.test(e) ? e.replace(/წელი$/, "წლის წინ") : void 0
                },
                s: "რამდენიმე წამი",
                ss: "%d წამი",
                m: "წუთი",
                mm: "%d წუთი",
                h: "საათი",
                hh: "%d საათი",
                d: "დღე",
                dd: "%d დღე",
                M: "თვე",
                MM: "%d თვე",
                y: "წელი",
                yy: "%d წელი"
            },
            dayOfMonthOrdinalParse: /0|1-ლი|მე-\d{1,2}|\d{1,2}-ე/,
            ordinal: function(e) {
                return 0 === e ? e : 1 === e ? e + "-ლი" : e < 20 || e <= 100 && e % 20 == 0 || e % 100 == 0 ? "მე-" + e : e + "-ე"
            },
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = {
            0: "-ші",
            1: "-ші",
            2: "-ші",
            3: "-ші",
            4: "-ші",
            5: "-ші",
            6: "-шы",
            7: "-ші",
            8: "-ші",
            9: "-шы",
            10: "-шы",
            20: "-шы",
            30: "-шы",
            40: "-шы",
            50: "-ші",
            60: "-шы",
            70: "-ші",
            80: "-ші",
            90: "-шы",
            100: "-ші"
        };
        e.defineLocale("kk", {
            months: "қаңтар_ақпан_наурыз_сәуір_мамыр_маусым_шілде_тамыз_қыркүйек_қазан_қараша_желтоқсан".split("_"),
            monthsShort: "қаң_ақп_нау_сәу_мам_мау_шіл_там_қыр_қаз_қар_жел".split("_"),
            weekdays: "жексенбі_дүйсенбі_сейсенбі_сәрсенбі_бейсенбі_жұма_сенбі".split("_"),
            weekdaysShort: "жек_дүй_сей_сәр_бей_жұм_сен".split("_"),
            weekdaysMin: "жк_дй_сй_ср_бй_жм_сн".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd, D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[Бүгін сағат] LT",
                nextDay: "[Ертең сағат] LT",
                nextWeek: "dddd [сағат] LT",
                lastDay: "[Кеше сағат] LT",
                lastWeek: "[Өткен аптаның] dddd [сағат] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%s ішінде",
                past: "%s бұрын",
                s: "бірнеше секунд",
                ss: "%d секунд",
                m: "бір минут",
                mm: "%d минут",
                h: "бір сағат",
                hh: "%d сағат",
                d: "бір күн",
                dd: "%d күн",
                M: "бір ай",
                MM: "%d ай",
                y: "бір жыл",
                yy: "%d жыл"
            },
            dayOfMonthOrdinalParse: /\d{1,2}-(ші|шы)/,
            ordinal: function(e) {
                var a = e % 10
                  , n = e >= 100 ? 100 : null;
                return e + (t[e] || t[a] || t[n])
            },
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = {
            1: "១",
            2: "២",
            3: "៣",
            4: "៤",
            5: "៥",
            6: "៦",
            7: "៧",
            8: "៨",
            9: "៩",
            0: "០"
        }
          , a = {
            "១": "1",
            "២": "2",
            "៣": "3",
            "៤": "4",
            "៥": "5",
            "៦": "6",
            "៧": "7",
            "៨": "8",
            "៩": "9",
            "០": "0"
        };
        e.defineLocale("km", {
            months: "មករា_កុម្ភៈ_មីនា_មេសា_ឧសភា_មិថុនា_កក្កដា_សីហា_កញ្ញា_តុលា_វិច្ឆិកា_ធ្នូ".split("_"),
            monthsShort: "មករា_កុម្ភៈ_មីនា_មេសា_ឧសភា_មិថុនា_កក្កដា_សីហា_កញ្ញា_តុលា_វិច្ឆិកា_ធ្នូ".split("_"),
            weekdays: "អាទិត្យ_ច័ន្ទ_អង្គារ_ពុធ_ព្រហស្បតិ៍_សុក្រ_សៅរ៍".split("_"),
            weekdaysShort: "អា_ច_អ_ព_ព្រ_សុ_ស".split("_"),
            weekdaysMin: "អា_ច_អ_ព_ព្រ_សុ_ស".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd, D MMMM YYYY HH:mm"
            },
            meridiemParse: /ព្រឹក|ល្ងាច/,
            isPM: function(e) {
                return "ល្ងាច" === e
            },
            meridiem: function(e, t, a) {
                return e < 12 ? "ព្រឹក" : "ល្ងាច"
            },
            calendar: {
                sameDay: "[ថ្ងៃនេះ ម៉ោង] LT",
                nextDay: "[ស្អែក ម៉ោង] LT",
                nextWeek: "dddd [ម៉ោង] LT",
                lastDay: "[ម្សិលមិញ ម៉ោង] LT",
                lastWeek: "dddd [សប្តាហ៍មុន] [ម៉ោង] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%sទៀត",
                past: "%sមុន",
                s: "ប៉ុន្មានវិនាទី",
                ss: "%d វិនាទី",
                m: "មួយនាទី",
                mm: "%d នាទី",
                h: "មួយម៉ោង",
                hh: "%d ម៉ោង",
                d: "មួយថ្ងៃ",
                dd: "%d ថ្ងៃ",
                M: "មួយខែ",
                MM: "%d ខែ",
                y: "មួយឆ្នាំ",
                yy: "%d ឆ្នាំ"
            },
            dayOfMonthOrdinalParse: /ទី\d{1,2}/,
            ordinal: "ទី%d",
            preparse: function(e) {
                return e.replace(/[១២៣៤៥៦៧៨៩០]/g, function(e) {
                    return a[e]
                })
            },
            postformat: function(e) {
                return e.replace(/\d/g, function(e) {
                    return t[e]
                })
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = {
            1: "೧",
            2: "೨",
            3: "೩",
            4: "೪",
            5: "೫",
            6: "೬",
            7: "೭",
            8: "೮",
            9: "೯",
            0: "೦"
        }
          , a = {
            "೧": "1",
            "೨": "2",
            "೩": "3",
            "೪": "4",
            "೫": "5",
            "೬": "6",
            "೭": "7",
            "೮": "8",
            "೯": "9",
            "೦": "0"
        };
        e.defineLocale("kn", {
            months: "ಜನವರಿ_ಫೆಬ್ರವರಿ_ಮಾರ್ಚ್_ಏಪ್ರಿಲ್_ಮೇ_ಜೂನ್_ಜುಲೈ_ಆಗಸ್ಟ್_ಸೆಪ್ಟೆಂಬರ್_ಅಕ್ಟೋಬರ್_ನವೆಂಬರ್_ಡಿಸೆಂಬರ್".split("_"),
            monthsShort: "ಜನ_ಫೆಬ್ರ_ಮಾರ್ಚ್_ಏಪ್ರಿಲ್_ಮೇ_ಜೂನ್_ಜುಲೈ_ಆಗಸ್ಟ್_ಸೆಪ್ಟೆಂ_ಅಕ್ಟೋ_ನವೆಂ_ಡಿಸೆಂ".split("_"),
            monthsParseExact: !0,
            weekdays: "ಭಾನುವಾರ_ಸೋಮವಾರ_ಮಂಗಳವಾರ_ಬುಧವಾರ_ಗುರುವಾರ_ಶುಕ್ರವಾರ_ಶನಿವಾರ".split("_"),
            weekdaysShort: "ಭಾನು_ಸೋಮ_ಮಂಗಳ_ಬುಧ_ಗುರು_ಶುಕ್ರ_ಶನಿ".split("_"),
            weekdaysMin: "ಭಾ_ಸೋ_ಮಂ_ಬು_ಗು_ಶು_ಶ".split("_"),
            longDateFormat: {
                LT: "A h:mm",
                LTS: "A h:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY, A h:mm",
                LLLL: "dddd, D MMMM YYYY, A h:mm"
            },
            calendar: {
                sameDay: "[ಇಂದು] LT",
                nextDay: "[ನಾಳೆ] LT",
                nextWeek: "dddd, LT",
                lastDay: "[ನಿನ್ನೆ] LT",
                lastWeek: "[ಕೊನೆಯ] dddd, LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%s ನಂತರ",
                past: "%s ಹಿಂದೆ",
                s: "ಕೆಲವು ಕ್ಷಣಗಳು",
                ss: "%d ಸೆಕೆಂಡುಗಳು",
                m: "ಒಂದು ನಿಮಿಷ",
                mm: "%d ನಿಮಿಷ",
                h: "ಒಂದು ಗಂಟೆ",
                hh: "%d ಗಂಟೆ",
                d: "ಒಂದು ದಿನ",
                dd: "%d ದಿನ",
                M: "ಒಂದು ತಿಂಗಳು",
                MM: "%d ತಿಂಗಳು",
                y: "ಒಂದು ವರ್ಷ",
                yy: "%d ವರ್ಷ"
            },
            preparse: function(e) {
                return e.replace(/[೧೨೩೪೫೬೭೮೯೦]/g, function(e) {
                    return a[e]
                })
            },
            postformat: function(e) {
                return e.replace(/\d/g, function(e) {
                    return t[e]
                })
            },
            meridiemParse: /ರಾತ್ರಿ|ಬೆಳಿಗ್ಗೆ|ಮಧ್ಯಾಹ್ನ|ಸಂಜೆ/,
            meridiemHour: function(e, t) {
                return 12 === e && (e = 0),
                "ರಾತ್ರಿ" === t ? e < 4 ? e : e + 12 : "ಬೆಳಿಗ್ಗೆ" === t ? e : "ಮಧ್ಯಾಹ್ನ" === t ? e >= 10 ? e : e + 12 : "ಸಂಜೆ" === t ? e + 12 : void 0
            },
            meridiem: function(e, t, a) {
                return e < 4 ? "ರಾತ್ರಿ" : e < 10 ? "ಬೆಳಿಗ್ಗೆ" : e < 17 ? "ಮಧ್ಯಾಹ್ನ" : e < 20 ? "ಸಂಜೆ" : "ರಾತ್ರಿ"
            },
            dayOfMonthOrdinalParse: /\d{1,2}(ನೇ)/,
            ordinal: function(e) {
                return e + "ನೇ"
            },
            week: {
                dow: 0,
                doy: 6
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("ko", {
            months: "1월_2월_3월_4월_5월_6월_7월_8월_9월_10월_11월_12월".split("_"),
            monthsShort: "1월_2월_3월_4월_5월_6월_7월_8월_9월_10월_11월_12월".split("_"),
            weekdays: "일요일_월요일_화요일_수요일_목요일_금요일_토요일".split("_"),
            weekdaysShort: "일_월_화_수_목_금_토".split("_"),
            weekdaysMin: "일_월_화_수_목_금_토".split("_"),
            longDateFormat: {
                LT: "A h:mm",
                LTS: "A h:mm:ss",
                L: "YYYY.MM.DD.",
                LL: "YYYY년 MMMM D일",
                LLL: "YYYY년 MMMM D일 A h:mm",
                LLLL: "YYYY년 MMMM D일 dddd A h:mm",
                l: "YYYY.MM.DD.",
                ll: "YYYY년 MMMM D일",
                lll: "YYYY년 MMMM D일 A h:mm",
                llll: "YYYY년 MMMM D일 dddd A h:mm"
            },
            calendar: {
                sameDay: "오늘 LT",
                nextDay: "내일 LT",
                nextWeek: "dddd LT",
                lastDay: "어제 LT",
                lastWeek: "지난주 dddd LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%s 후",
                past: "%s 전",
                s: "몇 초",
                ss: "%d초",
                m: "1분",
                mm: "%d분",
                h: "한 시간",
                hh: "%d시간",
                d: "하루",
                dd: "%d일",
                M: "한 달",
                MM: "%d달",
                y: "일 년",
                yy: "%d년"
            },
            dayOfMonthOrdinalParse: /\d{1,2}(일|월|주)/,
            ordinal: function(e, t) {
                switch (t) {
                case "d":
                case "D":
                case "DDD":
                    return e + "일";
                case "M":
                    return e + "월";
                case "w":
                case "W":
                    return e + "주";
                default:
                    return e
                }
            },
            meridiemParse: /오전|오후/,
            isPM: function(e) {
                return "오후" === e
            },
            meridiem: function(e, t, a) {
                return e < 12 ? "오전" : "오후"
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = {
            0: "-чү",
            1: "-чи",
            2: "-чи",
            3: "-чү",
            4: "-чү",
            5: "-чи",
            6: "-чы",
            7: "-чи",
            8: "-чи",
            9: "-чу",
            10: "-чу",
            20: "-чы",
            30: "-чу",
            40: "-чы",
            50: "-чү",
            60: "-чы",
            70: "-чи",
            80: "-чи",
            90: "-чу",
            100: "-чү"
        };
        e.defineLocale("ky", {
            months: "январь_февраль_март_апрель_май_июнь_июль_август_сентябрь_октябрь_ноябрь_декабрь".split("_"),
            monthsShort: "янв_фев_март_апр_май_июнь_июль_авг_сен_окт_ноя_дек".split("_"),
            weekdays: "Жекшемби_Дүйшөмбү_Шейшемби_Шаршемби_Бейшемби_Жума_Ишемби".split("_"),
            weekdaysShort: "Жек_Дүй_Шей_Шар_Бей_Жум_Ише".split("_"),
            weekdaysMin: "Жк_Дй_Шй_Шр_Бй_Жм_Иш".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd, D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[Бүгүн саат] LT",
                nextDay: "[Эртең саат] LT",
                nextWeek: "dddd [саат] LT",
                lastDay: "[Кече саат] LT",
                lastWeek: "[Өткен аптанын] dddd [күнү] [саат] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%s ичинде",
                past: "%s мурун",
                s: "бирнече секунд",
                ss: "%d секунд",
                m: "бир мүнөт",
                mm: "%d мүнөт",
                h: "бир саат",
                hh: "%d саат",
                d: "бир күн",
                dd: "%d күн",
                M: "бир ай",
                MM: "%d ай",
                y: "бир жыл",
                yy: "%d жыл"
            },
            dayOfMonthOrdinalParse: /\d{1,2}-(чи|чы|чү|чу)/,
            ordinal: function(e) {
                var a = e % 10
                  , n = e >= 100 ? 100 : null;
                return e + (t[e] || t[a] || t[n])
            },
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        function t(e, t, a, n) {
            var s = {
                m: ["eng Minutt", "enger Minutt"],
                h: ["eng Stonn", "enger Stonn"],
                d: ["een Dag", "engem Dag"],
                M: ["ee Mount", "engem Mount"],
                y: ["ee Joer", "engem Joer"]
            };
            return t ? s[a][0] : s[a][1]
        }
        function a(e) {
            if (e = parseInt(e, 10),
            isNaN(e))
                return !1;
            if (e < 0)
                return !0;
            if (e < 10)
                return 4 <= e && e <= 7;
            if (e < 100) {
                var t = e % 10
                  , n = e / 10;
                return a(0 === t ? n : t)
            }
            if (e < 1e4) {
                for (; e >= 10; )
                    e /= 10;
                return a(e)
            }
            return a(e /= 1e3)
        }
        e.defineLocale("lb", {
            months: "Januar_Februar_Mäerz_Abrëll_Mee_Juni_Juli_August_September_Oktober_November_Dezember".split("_"),
            monthsShort: "Jan._Febr._Mrz._Abr._Mee_Jun._Jul._Aug._Sept._Okt._Nov._Dez.".split("_"),
            monthsParseExact: !0,
            weekdays: "Sonndeg_Méindeg_Dënschdeg_Mëttwoch_Donneschdeg_Freideg_Samschdeg".split("_"),
            weekdaysShort: "So._Mé._Dë._Më._Do._Fr._Sa.".split("_"),
            weekdaysMin: "So_Mé_Dë_Më_Do_Fr_Sa".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "H:mm [Auer]",
                LTS: "H:mm:ss [Auer]",
                L: "DD.MM.YYYY",
                LL: "D. MMMM YYYY",
                LLL: "D. MMMM YYYY H:mm [Auer]",
                LLLL: "dddd, D. MMMM YYYY H:mm [Auer]"
            },
            calendar: {
                sameDay: "[Haut um] LT",
                sameElse: "L",
                nextDay: "[Muer um] LT",
                nextWeek: "dddd [um] LT",
                lastDay: "[Gëschter um] LT",
                lastWeek: function() {
                    switch (this.day()) {
                    case 2:
                    case 4:
                        return "[Leschten] dddd [um] LT";
                    default:
                        return "[Leschte] dddd [um] LT"
                    }
                }
            },
            relativeTime: {
                future: function(e) {
                    return a(e.substr(0, e.indexOf(" "))) ? "a " + e : "an " + e
                },
                past: function(e) {
                    return a(e.substr(0, e.indexOf(" "))) ? "viru " + e : "virun " + e
                },
                s: "e puer Sekonnen",
                ss: "%d Sekonnen",
                m: t,
                mm: "%d Minutten",
                h: t,
                hh: "%d Stonnen",
                d: t,
                dd: "%d Deeg",
                M: t,
                MM: "%d Méint",
                y: t,
                yy: "%d Joer"
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("lo", {
            months: "ມັງກອນ_ກຸມພາ_ມີນາ_ເມສາ_ພຶດສະພາ_ມິຖຸນາ_ກໍລະກົດ_ສິງຫາ_ກັນຍາ_ຕຸລາ_ພະຈິກ_ທັນວາ".split("_"),
            monthsShort: "ມັງກອນ_ກຸມພາ_ມີນາ_ເມສາ_ພຶດສະພາ_ມິຖຸນາ_ກໍລະກົດ_ສິງຫາ_ກັນຍາ_ຕຸລາ_ພະຈິກ_ທັນວາ".split("_"),
            weekdays: "ອາທິດ_ຈັນ_ອັງຄານ_ພຸດ_ພະຫັດ_ສຸກ_ເສົາ".split("_"),
            weekdaysShort: "ທິດ_ຈັນ_ອັງຄານ_ພຸດ_ພະຫັດ_ສຸກ_ເສົາ".split("_"),
            weekdaysMin: "ທ_ຈ_ອຄ_ພ_ພຫ_ສກ_ສ".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "ວັນdddd D MMMM YYYY HH:mm"
            },
            meridiemParse: /ຕອນເຊົ້າ|ຕອນແລງ/,
            isPM: function(e) {
                return "ຕອນແລງ" === e
            },
            meridiem: function(e, t, a) {
                return e < 12 ? "ຕອນເຊົ້າ" : "ຕອນແລງ"
            },
            calendar: {
                sameDay: "[ມື້ນີ້ເວລາ] LT",
                nextDay: "[ມື້ອື່ນເວລາ] LT",
                nextWeek: "[ວັນ]dddd[ໜ້າເວລາ] LT",
                lastDay: "[ມື້ວານນີ້ເວລາ] LT",
                lastWeek: "[ວັນ]dddd[ແລ້ວນີ້ເວລາ] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "ອີກ %s",
                past: "%sຜ່ານມາ",
                s: "ບໍ່ເທົ່າໃດວິນາທີ",
                ss: "%d ວິນາທີ",
                m: "1 ນາທີ",
                mm: "%d ນາທີ",
                h: "1 ຊົ່ວໂມງ",
                hh: "%d ຊົ່ວໂມງ",
                d: "1 ມື້",
                dd: "%d ມື້",
                M: "1 ເດືອນ",
                MM: "%d ເດືອນ",
                y: "1 ປີ",
                yy: "%d ປີ"
            },
            dayOfMonthOrdinalParse: /(ທີ່)\d{1,2}/,
            ordinal: function(e) {
                return "ທີ່" + e
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = {
            ss: "sekundė_sekundžių_sekundes",
            m: "minutė_minutės_minutę",
            mm: "minutės_minučių_minutes",
            h: "valanda_valandos_valandą",
            hh: "valandos_valandų_valandas",
            d: "diena_dienos_dieną",
            dd: "dienos_dienų_dienas",
            M: "mėnuo_mėnesio_mėnesį",
            MM: "mėnesiai_mėnesių_mėnesius",
            y: "metai_metų_metus",
            yy: "metai_metų_metus"
        };
        function a(e, t, a, n) {
            return t ? s(a)[0] : n ? s(a)[1] : s(a)[2]
        }
        function n(e) {
            return e % 10 == 0 || e > 10 && e < 20
        }
        function s(e) {
            return t[e].split("_")
        }
        function r(e, t, r, i) {
            var d = e + " ";
            return 1 === e ? d + a(0, t, r[0], i) : t ? d + (n(e) ? s(r)[1] : s(r)[0]) : i ? d + s(r)[1] : d + (n(e) ? s(r)[1] : s(r)[2])
        }
        e.defineLocale("lt", {
            months: {
                format: "sausio_vasario_kovo_balandžio_gegužės_birželio_liepos_rugpjūčio_rugsėjo_spalio_lapkričio_gruodžio".split("_"),
                standalone: "sausis_vasaris_kovas_balandis_gegužė_birželis_liepa_rugpjūtis_rugsėjis_spalis_lapkritis_gruodis".split("_"),
                isFormat: /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?|MMMM?(\[[^\[\]]*\]|\s)+D[oD]?/
            },
            monthsShort: "sau_vas_kov_bal_geg_bir_lie_rgp_rgs_spa_lap_grd".split("_"),
            weekdays: {
                format: "sekmadienį_pirmadienį_antradienį_trečiadienį_ketvirtadienį_penktadienį_šeštadienį".split("_"),
                standalone: "sekmadienis_pirmadienis_antradienis_trečiadienis_ketvirtadienis_penktadienis_šeštadienis".split("_"),
                isFormat: /dddd HH:mm/
            },
            weekdaysShort: "Sek_Pir_Ant_Tre_Ket_Pen_Šeš".split("_"),
            weekdaysMin: "S_P_A_T_K_Pn_Š".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "YYYY-MM-DD",
                LL: "YYYY [m.] MMMM D [d.]",
                LLL: "YYYY [m.] MMMM D [d.], HH:mm [val.]",
                LLLL: "YYYY [m.] MMMM D [d.], dddd, HH:mm [val.]",
                l: "YYYY-MM-DD",
                ll: "YYYY [m.] MMMM D [d.]",
                lll: "YYYY [m.] MMMM D [d.], HH:mm [val.]",
                llll: "YYYY [m.] MMMM D [d.], ddd, HH:mm [val.]"
            },
            calendar: {
                sameDay: "[Šiandien] LT",
                nextDay: "[Rytoj] LT",
                nextWeek: "dddd LT",
                lastDay: "[Vakar] LT",
                lastWeek: "[Praėjusį] dddd LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "po %s",
                past: "prieš %s",
                s: function(e, t, a, n) {
                    return t ? "kelios sekundės" : n ? "kelių sekundžių" : "kelias sekundes"
                },
                ss: r,
                m: a,
                mm: r,
                h: a,
                hh: r,
                d: a,
                dd: r,
                M: a,
                MM: r,
                y: a,
                yy: r
            },
            dayOfMonthOrdinalParse: /\d{1,2}-oji/,
            ordinal: function(e) {
                return e + "-oji"
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = {
            ss: "sekundes_sekundēm_sekunde_sekundes".split("_"),
            m: "minūtes_minūtēm_minūte_minūtes".split("_"),
            mm: "minūtes_minūtēm_minūte_minūtes".split("_"),
            h: "stundas_stundām_stunda_stundas".split("_"),
            hh: "stundas_stundām_stunda_stundas".split("_"),
            d: "dienas_dienām_diena_dienas".split("_"),
            dd: "dienas_dienām_diena_dienas".split("_"),
            M: "mēneša_mēnešiem_mēnesis_mēneši".split("_"),
            MM: "mēneša_mēnešiem_mēnesis_mēneši".split("_"),
            y: "gada_gadiem_gads_gadi".split("_"),
            yy: "gada_gadiem_gads_gadi".split("_")
        };
        function a(e, t, a) {
            return a ? t % 10 == 1 && t % 100 != 11 ? e[2] : e[3] : t % 10 == 1 && t % 100 != 11 ? e[0] : e[1]
        }
        function n(e, n, s) {
            return e + " " + a(t[s], e, n)
        }
        function s(e, n, s) {
            return a(t[s], e, n)
        }
        e.defineLocale("lv", {
            months: "janvāris_februāris_marts_aprīlis_maijs_jūnijs_jūlijs_augusts_septembris_oktobris_novembris_decembris".split("_"),
            monthsShort: "jan_feb_mar_apr_mai_jūn_jūl_aug_sep_okt_nov_dec".split("_"),
            weekdays: "svētdiena_pirmdiena_otrdiena_trešdiena_ceturtdiena_piektdiena_sestdiena".split("_"),
            weekdaysShort: "Sv_P_O_T_C_Pk_S".split("_"),
            weekdaysMin: "Sv_P_O_T_C_Pk_S".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD.MM.YYYY.",
                LL: "YYYY. [gada] D. MMMM",
                LLL: "YYYY. [gada] D. MMMM, HH:mm",
                LLLL: "YYYY. [gada] D. MMMM, dddd, HH:mm"
            },
            calendar: {
                sameDay: "[Šodien pulksten] LT",
                nextDay: "[Rīt pulksten] LT",
                nextWeek: "dddd [pulksten] LT",
                lastDay: "[Vakar pulksten] LT",
                lastWeek: "[Pagājušā] dddd [pulksten] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "pēc %s",
                past: "pirms %s",
                s: function(e, t) {
                    return t ? "dažas sekundes" : "dažām sekundēm"
                },
                ss: n,
                m: s,
                mm: n,
                h: s,
                hh: n,
                d: s,
                dd: n,
                M: s,
                MM: n,
                y: s,
                yy: n
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = {
            words: {
                ss: ["sekund", "sekunda", "sekundi"],
                m: ["jedan minut", "jednog minuta"],
                mm: ["minut", "minuta", "minuta"],
                h: ["jedan sat", "jednog sata"],
                hh: ["sat", "sata", "sati"],
                dd: ["dan", "dana", "dana"],
                MM: ["mjesec", "mjeseca", "mjeseci"],
                yy: ["godina", "godine", "godina"]
            },
            correctGrammaticalCase: function(e, t) {
                return 1 === e ? t[0] : e >= 2 && e <= 4 ? t[1] : t[2]
            },
            translate: function(e, a, n) {
                var s = t.words[n];
                return 1 === n.length ? a ? s[0] : s[1] : e + " " + t.correctGrammaticalCase(e, s)
            }
        };
        e.defineLocale("me", {
            months: "januar_februar_mart_april_maj_jun_jul_avgust_septembar_oktobar_novembar_decembar".split("_"),
            monthsShort: "jan._feb._mar._apr._maj_jun_jul_avg._sep._okt._nov._dec.".split("_"),
            monthsParseExact: !0,
            weekdays: "nedjelja_ponedjeljak_utorak_srijeda_četvrtak_petak_subota".split("_"),
            weekdaysShort: "ned._pon._uto._sri._čet._pet._sub.".split("_"),
            weekdaysMin: "ne_po_ut_sr_če_pe_su".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "H:mm",
                LTS: "H:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D. MMMM YYYY",
                LLL: "D. MMMM YYYY H:mm",
                LLLL: "dddd, D. MMMM YYYY H:mm"
            },
            calendar: {
                sameDay: "[danas u] LT",
                nextDay: "[sjutra u] LT",
                nextWeek: function() {
                    switch (this.day()) {
                    case 0:
                        return "[u] [nedjelju] [u] LT";
                    case 3:
                        return "[u] [srijedu] [u] LT";
                    case 6:
                        return "[u] [subotu] [u] LT";
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return "[u] dddd [u] LT"
                    }
                },
                lastDay: "[juče u] LT",
                lastWeek: function() {
                    return ["[prošle] [nedjelje] [u] LT", "[prošlog] [ponedjeljka] [u] LT", "[prošlog] [utorka] [u] LT", "[prošle] [srijede] [u] LT", "[prošlog] [četvrtka] [u] LT", "[prošlog] [petka] [u] LT", "[prošle] [subote] [u] LT"][this.day()]
                },
                sameElse: "L"
            },
            relativeTime: {
                future: "za %s",
                past: "prije %s",
                s: "nekoliko sekundi",
                ss: t.translate,
                m: t.translate,
                mm: t.translate,
                h: t.translate,
                hh: t.translate,
                d: "dan",
                dd: t.translate,
                M: "mjesec",
                MM: t.translate,
                y: "godinu",
                yy: t.translate
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("mi", {
            months: "Kohi-tāte_Hui-tanguru_Poutū-te-rangi_Paenga-whāwhā_Haratua_Pipiri_Hōngoingoi_Here-turi-kōkā_Mahuru_Whiringa-ā-nuku_Whiringa-ā-rangi_Hakihea".split("_"),
            monthsShort: "Kohi_Hui_Pou_Pae_Hara_Pipi_Hōngoi_Here_Mahu_Whi-nu_Whi-ra_Haki".split("_"),
            monthsRegex: /(?:['a-z\u0101\u014D\u016B]+\-?){1,3}/i,
            monthsStrictRegex: /(?:['a-z\u0101\u014D\u016B]+\-?){1,3}/i,
            monthsShortRegex: /(?:['a-z\u0101\u014D\u016B]+\-?){1,3}/i,
            monthsShortStrictRegex: /(?:['a-z\u0101\u014D\u016B]+\-?){1,2}/i,
            weekdays: "Rātapu_Mane_Tūrei_Wenerei_Tāite_Paraire_Hātarei".split("_"),
            weekdaysShort: "Ta_Ma_Tū_We_Tāi_Pa_Hā".split("_"),
            weekdaysMin: "Ta_Ma_Tū_We_Tāi_Pa_Hā".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY [i] HH:mm",
                LLLL: "dddd, D MMMM YYYY [i] HH:mm"
            },
            calendar: {
                sameDay: "[i teie mahana, i] LT",
                nextDay: "[apopo i] LT",
                nextWeek: "dddd [i] LT",
                lastDay: "[inanahi i] LT",
                lastWeek: "dddd [whakamutunga i] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "i roto i %s",
                past: "%s i mua",
                s: "te hēkona ruarua",
                ss: "%d hēkona",
                m: "he meneti",
                mm: "%d meneti",
                h: "te haora",
                hh: "%d haora",
                d: "he ra",
                dd: "%d ra",
                M: "he marama",
                MM: "%d marama",
                y: "he tau",
                yy: "%d tau"
            },
            dayOfMonthOrdinalParse: /\d{1,2}º/,
            ordinal: "%dº",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("mk", {
            months: "јануари_февруари_март_април_мај_јуни_јули_август_септември_октомври_ноември_декември".split("_"),
            monthsShort: "јан_фев_мар_апр_мај_јун_јул_авг_сеп_окт_ное_дек".split("_"),
            weekdays: "недела_понеделник_вторник_среда_четврток_петок_сабота".split("_"),
            weekdaysShort: "нед_пон_вто_сре_чет_пет_саб".split("_"),
            weekdaysMin: "нe_пo_вт_ср_че_пе_сa".split("_"),
            longDateFormat: {
                LT: "H:mm",
                LTS: "H:mm:ss",
                L: "D.MM.YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY H:mm",
                LLLL: "dddd, D MMMM YYYY H:mm"
            },
            calendar: {
                sameDay: "[Денес во] LT",
                nextDay: "[Утре во] LT",
                nextWeek: "[Во] dddd [во] LT",
                lastDay: "[Вчера во] LT",
                lastWeek: function() {
                    switch (this.day()) {
                    case 0:
                    case 3:
                    case 6:
                        return "[Изминатата] dddd [во] LT";
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return "[Изминатиот] dddd [во] LT"
                    }
                },
                sameElse: "L"
            },
            relativeTime: {
                future: "после %s",
                past: "пред %s",
                s: "неколку секунди",
                ss: "%d секунди",
                m: "минута",
                mm: "%d минути",
                h: "час",
                hh: "%d часа",
                d: "ден",
                dd: "%d дена",
                M: "месец",
                MM: "%d месеци",
                y: "година",
                yy: "%d години"
            },
            dayOfMonthOrdinalParse: /\d{1,2}-(ев|ен|ти|ви|ри|ми)/,
            ordinal: function(e) {
                var t = e % 10
                  , a = e % 100;
                return 0 === e ? e + "-ев" : 0 === a ? e + "-ен" : a > 10 && a < 20 ? e + "-ти" : 1 === t ? e + "-ви" : 2 === t ? e + "-ри" : 7 === t || 8 === t ? e + "-ми" : e + "-ти"
            },
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("ml", {
            months: "ജനുവരി_ഫെബ്രുവരി_മാർച്ച്_ഏപ്രിൽ_മേയ്_ജൂൺ_ജൂലൈ_ഓഗസ്റ്റ്_സെപ്റ്റംബർ_ഒക്ടോബർ_നവംബർ_ഡിസംബർ".split("_"),
            monthsShort: "ജനു._ഫെബ്രു._മാർ._ഏപ്രി._മേയ്_ജൂൺ_ജൂലൈ._ഓഗ._സെപ്റ്റ._ഒക്ടോ._നവം._ഡിസം.".split("_"),
            monthsParseExact: !0,
            weekdays: "ഞായറാഴ്ച_തിങ്കളാഴ്ച_ചൊവ്വാഴ്ച_ബുധനാഴ്ച_വ്യാഴാഴ്ച_വെള്ളിയാഴ്ച_ശനിയാഴ്ച".split("_"),
            weekdaysShort: "ഞായർ_തിങ്കൾ_ചൊവ്വ_ബുധൻ_വ്യാഴം_വെള്ളി_ശനി".split("_"),
            weekdaysMin: "ഞാ_തി_ചൊ_ബു_വ്യാ_വെ_ശ".split("_"),
            longDateFormat: {
                LT: "A h:mm -നു",
                LTS: "A h:mm:ss -നു",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY, A h:mm -നു",
                LLLL: "dddd, D MMMM YYYY, A h:mm -നു"
            },
            calendar: {
                sameDay: "[ഇന്ന്] LT",
                nextDay: "[നാളെ] LT",
                nextWeek: "dddd, LT",
                lastDay: "[ഇന്നലെ] LT",
                lastWeek: "[കഴിഞ്ഞ] dddd, LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%s കഴിഞ്ഞ്",
                past: "%s മുൻപ്",
                s: "അൽപ നിമിഷങ്ങൾ",
                ss: "%d സെക്കൻഡ്",
                m: "ഒരു മിനിറ്റ്",
                mm: "%d മിനിറ്റ്",
                h: "ഒരു മണിക്കൂർ",
                hh: "%d മണിക്കൂർ",
                d: "ഒരു ദിവസം",
                dd: "%d ദിവസം",
                M: "ഒരു മാസം",
                MM: "%d മാസം",
                y: "ഒരു വർഷം",
                yy: "%d വർഷം"
            },
            meridiemParse: /രാത്രി|രാവിലെ|ഉച്ച കഴിഞ്ഞ്|വൈകുന്നേരം|രാത്രി/i,
            meridiemHour: function(e, t) {
                return 12 === e && (e = 0),
                "രാത്രി" === t && e >= 4 || "ഉച്ച കഴിഞ്ഞ്" === t || "വൈകുന്നേരം" === t ? e + 12 : e
            },
            meridiem: function(e, t, a) {
                return e < 4 ? "രാത്രി" : e < 12 ? "രാവിലെ" : e < 17 ? "ഉച്ച കഴിഞ്ഞ്" : e < 20 ? "വൈകുന്നേരം" : "രാത്രി"
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        function t(e, t, a, n) {
            switch (a) {
            case "s":
                return t ? "хэдхэн секунд" : "хэдхэн секундын";
            case "ss":
                return e + (t ? " секунд" : " секундын");
            case "m":
            case "mm":
                return e + (t ? " минут" : " минутын");
            case "h":
            case "hh":
                return e + (t ? " цаг" : " цагийн");
            case "d":
            case "dd":
                return e + (t ? " өдөр" : " өдрийн");
            case "M":
            case "MM":
                return e + (t ? " сар" : " сарын");
            case "y":
            case "yy":
                return e + (t ? " жил" : " жилийн");
            default:
                return e
            }
        }
        e.defineLocale("mn", {
            months: "Нэгдүгээр сар_Хоёрдугаар сар_Гуравдугаар сар_Дөрөвдүгээр сар_Тавдугаар сар_Зургадугаар сар_Долдугаар сар_Наймдугаар сар_Есдүгээр сар_Аравдугаар сар_Арван нэгдүгээр сар_Арван хоёрдугаар сар".split("_"),
            monthsShort: "1 сар_2 сар_3 сар_4 сар_5 сар_6 сар_7 сар_8 сар_9 сар_10 сар_11 сар_12 сар".split("_"),
            monthsParseExact: !0,
            weekdays: "Ням_Даваа_Мягмар_Лхагва_Пүрэв_Баасан_Бямба".split("_"),
            weekdaysShort: "Ням_Дав_Мяг_Лха_Пүр_Баа_Бям".split("_"),
            weekdaysMin: "Ня_Да_Мя_Лх_Пү_Ба_Бя".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "YYYY-MM-DD",
                LL: "YYYY оны MMMMын D",
                LLL: "YYYY оны MMMMын D HH:mm",
                LLLL: "dddd, YYYY оны MMMMын D HH:mm"
            },
            meridiemParse: /ҮӨ|ҮХ/i,
            isPM: function(e) {
                return "ҮХ" === e
            },
            meridiem: function(e, t, a) {
                return e < 12 ? "ҮӨ" : "ҮХ"
            },
            calendar: {
                sameDay: "[Өнөөдөр] LT",
                nextDay: "[Маргааш] LT",
                nextWeek: "[Ирэх] dddd LT",
                lastDay: "[Өчигдөр] LT",
                lastWeek: "[Өнгөрсөн] dddd LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%s дараа",
                past: "%s өмнө",
                s: t,
                ss: t,
                m: t,
                mm: t,
                h: t,
                hh: t,
                d: t,
                dd: t,
                M: t,
                MM: t,
                y: t,
                yy: t
            },
            dayOfMonthOrdinalParse: /\d{1,2} өдөр/,
            ordinal: function(e, t) {
                switch (t) {
                case "d":
                case "D":
                case "DDD":
                    return e + " өдөр";
                default:
                    return e
                }
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = {
            1: "१",
            2: "२",
            3: "३",
            4: "४",
            5: "५",
            6: "६",
            7: "७",
            8: "८",
            9: "९",
            0: "०"
        }
          , a = {
            "१": "1",
            "२": "2",
            "३": "3",
            "४": "4",
            "५": "5",
            "६": "6",
            "७": "7",
            "८": "8",
            "९": "9",
            "०": "0"
        };
        function n(e, t, a, n) {
            var s = "";
            if (t)
                switch (a) {
                case "s":
                    s = "काही सेकंद";
                    break;
                case "ss":
                    s = "%d सेकंद";
                    break;
                case "m":
                    s = "एक मिनिट";
                    break;
                case "mm":
                    s = "%d मिनिटे";
                    break;
                case "h":
                    s = "एक तास";
                    break;
                case "hh":
                    s = "%d तास";
                    break;
                case "d":
                    s = "एक दिवस";
                    break;
                case "dd":
                    s = "%d दिवस";
                    break;
                case "M":
                    s = "एक महिना";
                    break;
                case "MM":
                    s = "%d महिने";
                    break;
                case "y":
                    s = "एक वर्ष";
                    break;
                case "yy":
                    s = "%d वर्षे"
                }
            else
                switch (a) {
                case "s":
                    s = "काही सेकंदां";
                    break;
                case "ss":
                    s = "%d सेकंदां";
                    break;
                case "m":
                    s = "एका मिनिटा";
                    break;
                case "mm":
                    s = "%d मिनिटां";
                    break;
                case "h":
                    s = "एका तासा";
                    break;
                case "hh":
                    s = "%d तासां";
                    break;
                case "d":
                    s = "एका दिवसा";
                    break;
                case "dd":
                    s = "%d दिवसां";
                    break;
                case "M":
                    s = "एका महिन्या";
                    break;
                case "MM":
                    s = "%d महिन्यां";
                    break;
                case "y":
                    s = "एका वर्षा";
                    break;
                case "yy":
                    s = "%d वर्षां"
                }
            return s.replace(/%d/i, e)
        }
        e.defineLocale("mr", {
            months: "जानेवारी_फेब्रुवारी_मार्च_एप्रिल_मे_जून_जुलै_ऑगस्ट_सप्टेंबर_ऑक्टोबर_नोव्हेंबर_डिसेंबर".split("_"),
            monthsShort: "जाने._फेब्रु._मार्च._एप्रि._मे._जून._जुलै._ऑग._सप्टें._ऑक्टो._नोव्हें._डिसें.".split("_"),
            monthsParseExact: !0,
            weekdays: "रविवार_सोमवार_मंगळवार_बुधवार_गुरूवार_शुक्रवार_शनिवार".split("_"),
            weekdaysShort: "रवि_सोम_मंगळ_बुध_गुरू_शुक्र_शनि".split("_"),
            weekdaysMin: "र_सो_मं_बु_गु_शु_श".split("_"),
            longDateFormat: {
                LT: "A h:mm वाजता",
                LTS: "A h:mm:ss वाजता",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY, A h:mm वाजता",
                LLLL: "dddd, D MMMM YYYY, A h:mm वाजता"
            },
            calendar: {
                sameDay: "[आज] LT",
                nextDay: "[उद्या] LT",
                nextWeek: "dddd, LT",
                lastDay: "[काल] LT",
                lastWeek: "[मागील] dddd, LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%sमध्ये",
                past: "%sपूर्वी",
                s: n,
                ss: n,
                m: n,
                mm: n,
                h: n,
                hh: n,
                d: n,
                dd: n,
                M: n,
                MM: n,
                y: n,
                yy: n
            },
            preparse: function(e) {
                return e.replace(/[१२३४५६७८९०]/g, function(e) {
                    return a[e]
                })
            },
            postformat: function(e) {
                return e.replace(/\d/g, function(e) {
                    return t[e]
                })
            },
            meridiemParse: /रात्री|सकाळी|दुपारी|सायंकाळी/,
            meridiemHour: function(e, t) {
                return 12 === e && (e = 0),
                "रात्री" === t ? e < 4 ? e : e + 12 : "सकाळी" === t ? e : "दुपारी" === t ? e >= 10 ? e : e + 12 : "सायंकाळी" === t ? e + 12 : void 0
            },
            meridiem: function(e, t, a) {
                return e < 4 ? "रात्री" : e < 10 ? "सकाळी" : e < 17 ? "दुपारी" : e < 20 ? "सायंकाळी" : "रात्री"
            },
            week: {
                dow: 0,
                doy: 6
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("ms", {
            months: "Januari_Februari_Mac_April_Mei_Jun_Julai_Ogos_September_Oktober_November_Disember".split("_"),
            monthsShort: "Jan_Feb_Mac_Apr_Mei_Jun_Jul_Ogs_Sep_Okt_Nov_Dis".split("_"),
            weekdays: "Ahad_Isnin_Selasa_Rabu_Khamis_Jumaat_Sabtu".split("_"),
            weekdaysShort: "Ahd_Isn_Sel_Rab_Kha_Jum_Sab".split("_"),
            weekdaysMin: "Ah_Is_Sl_Rb_Km_Jm_Sb".split("_"),
            longDateFormat: {
                LT: "HH.mm",
                LTS: "HH.mm.ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY [pukul] HH.mm",
                LLLL: "dddd, D MMMM YYYY [pukul] HH.mm"
            },
            meridiemParse: /pagi|tengahari|petang|malam/,
            meridiemHour: function(e, t) {
                return 12 === e && (e = 0),
                "pagi" === t ? e : "tengahari" === t ? e >= 11 ? e : e + 12 : "petang" === t || "malam" === t ? e + 12 : void 0
            },
            meridiem: function(e, t, a) {
                return e < 11 ? "pagi" : e < 15 ? "tengahari" : e < 19 ? "petang" : "malam"
            },
            calendar: {
                sameDay: "[Hari ini pukul] LT",
                nextDay: "[Esok pukul] LT",
                nextWeek: "dddd [pukul] LT",
                lastDay: "[Kelmarin pukul] LT",
                lastWeek: "dddd [lepas pukul] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "dalam %s",
                past: "%s yang lepas",
                s: "beberapa saat",
                ss: "%d saat",
                m: "seminit",
                mm: "%d minit",
                h: "sejam",
                hh: "%d jam",
                d: "sehari",
                dd: "%d hari",
                M: "sebulan",
                MM: "%d bulan",
                y: "setahun",
                yy: "%d tahun"
            },
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("ms-my", {
            months: "Januari_Februari_Mac_April_Mei_Jun_Julai_Ogos_September_Oktober_November_Disember".split("_"),
            monthsShort: "Jan_Feb_Mac_Apr_Mei_Jun_Jul_Ogs_Sep_Okt_Nov_Dis".split("_"),
            weekdays: "Ahad_Isnin_Selasa_Rabu_Khamis_Jumaat_Sabtu".split("_"),
            weekdaysShort: "Ahd_Isn_Sel_Rab_Kha_Jum_Sab".split("_"),
            weekdaysMin: "Ah_Is_Sl_Rb_Km_Jm_Sb".split("_"),
            longDateFormat: {
                LT: "HH.mm",
                LTS: "HH.mm.ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY [pukul] HH.mm",
                LLLL: "dddd, D MMMM YYYY [pukul] HH.mm"
            },
            meridiemParse: /pagi|tengahari|petang|malam/,
            meridiemHour: function(e, t) {
                return 12 === e && (e = 0),
                "pagi" === t ? e : "tengahari" === t ? e >= 11 ? e : e + 12 : "petang" === t || "malam" === t ? e + 12 : void 0
            },
            meridiem: function(e, t, a) {
                return e < 11 ? "pagi" : e < 15 ? "tengahari" : e < 19 ? "petang" : "malam"
            },
            calendar: {
                sameDay: "[Hari ini pukul] LT",
                nextDay: "[Esok pukul] LT",
                nextWeek: "dddd [pukul] LT",
                lastDay: "[Kelmarin pukul] LT",
                lastWeek: "dddd [lepas pukul] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "dalam %s",
                past: "%s yang lepas",
                s: "beberapa saat",
                ss: "%d saat",
                m: "seminit",
                mm: "%d minit",
                h: "sejam",
                hh: "%d jam",
                d: "sehari",
                dd: "%d hari",
                M: "sebulan",
                MM: "%d bulan",
                y: "setahun",
                yy: "%d tahun"
            },
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("mt", {
            months: "Jannar_Frar_Marzu_April_Mejju_Ġunju_Lulju_Awwissu_Settembru_Ottubru_Novembru_Diċembru".split("_"),
            monthsShort: "Jan_Fra_Mar_Apr_Mej_Ġun_Lul_Aww_Set_Ott_Nov_Diċ".split("_"),
            weekdays: "Il-Ħadd_It-Tnejn_It-Tlieta_L-Erbgħa_Il-Ħamis_Il-Ġimgħa_Is-Sibt".split("_"),
            weekdaysShort: "Ħad_Tne_Tli_Erb_Ħam_Ġim_Sib".split("_"),
            weekdaysMin: "Ħa_Tn_Tl_Er_Ħa_Ġi_Si".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd, D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[Illum fil-]LT",
                nextDay: "[Għada fil-]LT",
                nextWeek: "dddd [fil-]LT",
                lastDay: "[Il-bieraħ fil-]LT",
                lastWeek: "dddd [li għadda] [fil-]LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "f’ %s",
                past: "%s ilu",
                s: "ftit sekondi",
                ss: "%d sekondi",
                m: "minuta",
                mm: "%d minuti",
                h: "siegħa",
                hh: "%d siegħat",
                d: "ġurnata",
                dd: "%d ġranet",
                M: "xahar",
                MM: "%d xhur",
                y: "sena",
                yy: "%d sni"
            },
            dayOfMonthOrdinalParse: /\d{1,2}º/,
            ordinal: "%dº",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = {
            1: "၁",
            2: "၂",
            3: "၃",
            4: "၄",
            5: "၅",
            6: "၆",
            7: "၇",
            8: "၈",
            9: "၉",
            0: "၀"
        }
          , a = {
            "၁": "1",
            "၂": "2",
            "၃": "3",
            "၄": "4",
            "၅": "5",
            "၆": "6",
            "၇": "7",
            "၈": "8",
            "၉": "9",
            "၀": "0"
        };
        e.defineLocale("my", {
            months: "ဇန်နဝါရီ_ဖေဖော်ဝါရီ_မတ်_ဧပြီ_မေ_ဇွန်_ဇူလိုင်_သြဂုတ်_စက်တင်ဘာ_အောက်တိုဘာ_နိုဝင်ဘာ_ဒီဇင်ဘာ".split("_"),
            monthsShort: "ဇန်_ဖေ_မတ်_ပြီ_မေ_ဇွန်_လိုင်_သြ_စက်_အောက်_နို_ဒီ".split("_"),
            weekdays: "တနင်္ဂနွေ_တနင်္လာ_အင်္ဂါ_ဗုဒ္ဓဟူး_ကြာသပတေး_သောကြာ_စနေ".split("_"),
            weekdaysShort: "နွေ_လာ_ဂါ_ဟူး_ကြာ_သော_နေ".split("_"),
            weekdaysMin: "နွေ_လာ_ဂါ_ဟူး_ကြာ_သော_နေ".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[ယနေ.] LT [မှာ]",
                nextDay: "[မနက်ဖြန်] LT [မှာ]",
                nextWeek: "dddd LT [မှာ]",
                lastDay: "[မနေ.က] LT [မှာ]",
                lastWeek: "[ပြီးခဲ့သော] dddd LT [မှာ]",
                sameElse: "L"
            },
            relativeTime: {
                future: "လာမည့် %s မှာ",
                past: "လွန်ခဲ့သော %s က",
                s: "စက္ကန်.အနည်းငယ်",
                ss: "%d စက္ကန့်",
                m: "တစ်မိနစ်",
                mm: "%d မိနစ်",
                h: "တစ်နာရီ",
                hh: "%d နာရီ",
                d: "တစ်ရက်",
                dd: "%d ရက်",
                M: "တစ်လ",
                MM: "%d လ",
                y: "တစ်နှစ်",
                yy: "%d နှစ်"
            },
            preparse: function(e) {
                return e.replace(/[၁၂၃၄၅၆၇၈၉၀]/g, function(e) {
                    return a[e]
                })
            },
            postformat: function(e) {
                return e.replace(/\d/g, function(e) {
                    return t[e]
                })
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("nb", {
            months: "januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember".split("_"),
            monthsShort: "jan._feb._mars_april_mai_juni_juli_aug._sep._okt._nov._des.".split("_"),
            monthsParseExact: !0,
            weekdays: "søndag_mandag_tirsdag_onsdag_torsdag_fredag_lørdag".split("_"),
            weekdaysShort: "sø._ma._ti._on._to._fr._lø.".split("_"),
            weekdaysMin: "sø_ma_ti_on_to_fr_lø".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D. MMMM YYYY",
                LLL: "D. MMMM YYYY [kl.] HH:mm",
                LLLL: "dddd D. MMMM YYYY [kl.] HH:mm"
            },
            calendar: {
                sameDay: "[i dag kl.] LT",
                nextDay: "[i morgen kl.] LT",
                nextWeek: "dddd [kl.] LT",
                lastDay: "[i går kl.] LT",
                lastWeek: "[forrige] dddd [kl.] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "om %s",
                past: "%s siden",
                s: "noen sekunder",
                ss: "%d sekunder",
                m: "ett minutt",
                mm: "%d minutter",
                h: "en time",
                hh: "%d timer",
                d: "en dag",
                dd: "%d dager",
                M: "en måned",
                MM: "%d måneder",
                y: "ett år",
                yy: "%d år"
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = {
            1: "१",
            2: "२",
            3: "३",
            4: "४",
            5: "५",
            6: "६",
            7: "७",
            8: "८",
            9: "९",
            0: "०"
        }
          , a = {
            "१": "1",
            "२": "2",
            "३": "3",
            "४": "4",
            "५": "5",
            "६": "6",
            "७": "7",
            "८": "8",
            "९": "9",
            "०": "0"
        };
        e.defineLocale("ne", {
            months: "जनवरी_फेब्रुवरी_मार्च_अप्रिल_मई_जुन_जुलाई_अगष्ट_सेप्टेम्बर_अक्टोबर_नोभेम्बर_डिसेम्बर".split("_"),
            monthsShort: "जन._फेब्रु._मार्च_अप्रि._मई_जुन_जुलाई._अग._सेप्ट._अक्टो._नोभे._डिसे.".split("_"),
            monthsParseExact: !0,
            weekdays: "आइतबार_सोमबार_मङ्गलबार_बुधबार_बिहिबार_शुक्रबार_शनिबार".split("_"),
            weekdaysShort: "आइत._सोम._मङ्गल._बुध._बिहि._शुक्र._शनि.".split("_"),
            weekdaysMin: "आ._सो._मं._बु._बि._शु._श.".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "Aको h:mm बजे",
                LTS: "Aको h:mm:ss बजे",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY, Aको h:mm बजे",
                LLLL: "dddd, D MMMM YYYY, Aको h:mm बजे"
            },
            preparse: function(e) {
                return e.replace(/[१२३४५६७८९०]/g, function(e) {
                    return a[e]
                })
            },
            postformat: function(e) {
                return e.replace(/\d/g, function(e) {
                    return t[e]
                })
            },
            meridiemParse: /राति|बिहान|दिउँसो|साँझ/,
            meridiemHour: function(e, t) {
                return 12 === e && (e = 0),
                "राति" === t ? e < 4 ? e : e + 12 : "बिहान" === t ? e : "दिउँसो" === t ? e >= 10 ? e : e + 12 : "साँझ" === t ? e + 12 : void 0
            },
            meridiem: function(e, t, a) {
                return e < 3 ? "राति" : e < 12 ? "बिहान" : e < 16 ? "दिउँसो" : e < 20 ? "साँझ" : "राति"
            },
            calendar: {
                sameDay: "[आज] LT",
                nextDay: "[भोलि] LT",
                nextWeek: "[आउँदो] dddd[,] LT",
                lastDay: "[हिजो] LT",
                lastWeek: "[गएको] dddd[,] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%sमा",
                past: "%s अगाडि",
                s: "केही क्षण",
                ss: "%d सेकेण्ड",
                m: "एक मिनेट",
                mm: "%d मिनेट",
                h: "एक घण्टा",
                hh: "%d घण्टा",
                d: "एक दिन",
                dd: "%d दिन",
                M: "एक महिना",
                MM: "%d महिना",
                y: "एक बर्ष",
                yy: "%d बर्ष"
            },
            week: {
                dow: 0,
                doy: 6
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = "jan._feb._mrt._apr._mei_jun._jul._aug._sep._okt._nov._dec.".split("_")
          , a = "jan_feb_mrt_apr_mei_jun_jul_aug_sep_okt_nov_dec".split("_")
          , n = [/^jan/i, /^feb/i, /^maart|mrt.?$/i, /^apr/i, /^mei$/i, /^jun[i.]?$/i, /^jul[i.]?$/i, /^aug/i, /^sep/i, /^okt/i, /^nov/i, /^dec/i]
          , s = /^(januari|februari|maart|april|mei|april|ju[nl]i|augustus|september|oktober|november|december|jan\.?|feb\.?|mrt\.?|apr\.?|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i;
        e.defineLocale("nl", {
            months: "januari_februari_maart_april_mei_juni_juli_augustus_september_oktober_november_december".split("_"),
            monthsShort: function(e, n) {
                return e ? /-MMM-/.test(n) ? a[e.month()] : t[e.month()] : t
            },
            monthsRegex: s,
            monthsShortRegex: s,
            monthsStrictRegex: /^(januari|februari|maart|mei|ju[nl]i|april|augustus|september|oktober|november|december)/i,
            monthsShortStrictRegex: /^(jan\.?|feb\.?|mrt\.?|apr\.?|mei|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i,
            monthsParse: n,
            longMonthsParse: n,
            shortMonthsParse: n,
            weekdays: "zondag_maandag_dinsdag_woensdag_donderdag_vrijdag_zaterdag".split("_"),
            weekdaysShort: "zo._ma._di._wo._do._vr._za.".split("_"),
            weekdaysMin: "zo_ma_di_wo_do_vr_za".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD-MM-YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[vandaag om] LT",
                nextDay: "[morgen om] LT",
                nextWeek: "dddd [om] LT",
                lastDay: "[gisteren om] LT",
                lastWeek: "[afgelopen] dddd [om] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "over %s",
                past: "%s geleden",
                s: "een paar seconden",
                ss: "%d seconden",
                m: "één minuut",
                mm: "%d minuten",
                h: "één uur",
                hh: "%d uur",
                d: "één dag",
                dd: "%d dagen",
                M: "één maand",
                MM: "%d maanden",
                y: "één jaar",
                yy: "%d jaar"
            },
            dayOfMonthOrdinalParse: /\d{1,2}(ste|de)/,
            ordinal: function(e) {
                return e + (1 === e || 8 === e || e >= 20 ? "ste" : "de")
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = "jan._feb._mrt._apr._mei_jun._jul._aug._sep._okt._nov._dec.".split("_")
          , a = "jan_feb_mrt_apr_mei_jun_jul_aug_sep_okt_nov_dec".split("_")
          , n = [/^jan/i, /^feb/i, /^maart|mrt.?$/i, /^apr/i, /^mei$/i, /^jun[i.]?$/i, /^jul[i.]?$/i, /^aug/i, /^sep/i, /^okt/i, /^nov/i, /^dec/i]
          , s = /^(januari|februari|maart|april|mei|april|ju[nl]i|augustus|september|oktober|november|december|jan\.?|feb\.?|mrt\.?|apr\.?|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i;
        e.defineLocale("nl-be", {
            months: "januari_februari_maart_april_mei_juni_juli_augustus_september_oktober_november_december".split("_"),
            monthsShort: function(e, n) {
                return e ? /-MMM-/.test(n) ? a[e.month()] : t[e.month()] : t
            },
            monthsRegex: s,
            monthsShortRegex: s,
            monthsStrictRegex: /^(januari|februari|maart|mei|ju[nl]i|april|augustus|september|oktober|november|december)/i,
            monthsShortStrictRegex: /^(jan\.?|feb\.?|mrt\.?|apr\.?|mei|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i,
            monthsParse: n,
            longMonthsParse: n,
            shortMonthsParse: n,
            weekdays: "zondag_maandag_dinsdag_woensdag_donderdag_vrijdag_zaterdag".split("_"),
            weekdaysShort: "zo._ma._di._wo._do._vr._za.".split("_"),
            weekdaysMin: "zo_ma_di_wo_do_vr_za".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[vandaag om] LT",
                nextDay: "[morgen om] LT",
                nextWeek: "dddd [om] LT",
                lastDay: "[gisteren om] LT",
                lastWeek: "[afgelopen] dddd [om] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "over %s",
                past: "%s geleden",
                s: "een paar seconden",
                ss: "%d seconden",
                m: "één minuut",
                mm: "%d minuten",
                h: "één uur",
                hh: "%d uur",
                d: "één dag",
                dd: "%d dagen",
                M: "één maand",
                MM: "%d maanden",
                y: "één jaar",
                yy: "%d jaar"
            },
            dayOfMonthOrdinalParse: /\d{1,2}(ste|de)/,
            ordinal: function(e) {
                return e + (1 === e || 8 === e || e >= 20 ? "ste" : "de")
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("nn", {
            months: "januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember".split("_"),
            monthsShort: "jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des".split("_"),
            weekdays: "sundag_måndag_tysdag_onsdag_torsdag_fredag_laurdag".split("_"),
            weekdaysShort: "sun_mån_tys_ons_tor_fre_lau".split("_"),
            weekdaysMin: "su_må_ty_on_to_fr_lø".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D. MMMM YYYY",
                LLL: "D. MMMM YYYY [kl.] H:mm",
                LLLL: "dddd D. MMMM YYYY [kl.] HH:mm"
            },
            calendar: {
                sameDay: "[I dag klokka] LT",
                nextDay: "[I morgon klokka] LT",
                nextWeek: "dddd [klokka] LT",
                lastDay: "[I går klokka] LT",
                lastWeek: "[Føregåande] dddd [klokka] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "om %s",
                past: "%s sidan",
                s: "nokre sekund",
                ss: "%d sekund",
                m: "eit minutt",
                mm: "%d minutt",
                h: "ein time",
                hh: "%d timar",
                d: "ein dag",
                dd: "%d dagar",
                M: "ein månad",
                MM: "%d månader",
                y: "eit år",
                yy: "%d år"
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = {
            1: "੧",
            2: "੨",
            3: "੩",
            4: "੪",
            5: "੫",
            6: "੬",
            7: "੭",
            8: "੮",
            9: "੯",
            0: "੦"
        }
          , a = {
            "੧": "1",
            "੨": "2",
            "੩": "3",
            "੪": "4",
            "੫": "5",
            "੬": "6",
            "੭": "7",
            "੮": "8",
            "੯": "9",
            "੦": "0"
        };
        e.defineLocale("pa-in", {
            months: "ਜਨਵਰੀ_ਫ਼ਰਵਰੀ_ਮਾਰਚ_ਅਪ੍ਰੈਲ_ਮਈ_ਜੂਨ_ਜੁਲਾਈ_ਅਗਸਤ_ਸਤੰਬਰ_ਅਕਤੂਬਰ_ਨਵੰਬਰ_ਦਸੰਬਰ".split("_"),
            monthsShort: "ਜਨਵਰੀ_ਫ਼ਰਵਰੀ_ਮਾਰਚ_ਅਪ੍ਰੈਲ_ਮਈ_ਜੂਨ_ਜੁਲਾਈ_ਅਗਸਤ_ਸਤੰਬਰ_ਅਕਤੂਬਰ_ਨਵੰਬਰ_ਦਸੰਬਰ".split("_"),
            weekdays: "ਐਤਵਾਰ_ਸੋਮਵਾਰ_ਮੰਗਲਵਾਰ_ਬੁਧਵਾਰ_ਵੀਰਵਾਰ_ਸ਼ੁੱਕਰਵਾਰ_ਸ਼ਨੀਚਰਵਾਰ".split("_"),
            weekdaysShort: "ਐਤ_ਸੋਮ_ਮੰਗਲ_ਬੁਧ_ਵੀਰ_ਸ਼ੁਕਰ_ਸ਼ਨੀ".split("_"),
            weekdaysMin: "ਐਤ_ਸੋਮ_ਮੰਗਲ_ਬੁਧ_ਵੀਰ_ਸ਼ੁਕਰ_ਸ਼ਨੀ".split("_"),
            longDateFormat: {
                LT: "A h:mm ਵਜੇ",
                LTS: "A h:mm:ss ਵਜੇ",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY, A h:mm ਵਜੇ",
                LLLL: "dddd, D MMMM YYYY, A h:mm ਵਜੇ"
            },
            calendar: {
                sameDay: "[ਅਜ] LT",
                nextDay: "[ਕਲ] LT",
                nextWeek: "[ਅਗਲਾ] dddd, LT",
                lastDay: "[ਕਲ] LT",
                lastWeek: "[ਪਿਛਲੇ] dddd, LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%s ਵਿੱਚ",
                past: "%s ਪਿਛਲੇ",
                s: "ਕੁਝ ਸਕਿੰਟ",
                ss: "%d ਸਕਿੰਟ",
                m: "ਇਕ ਮਿੰਟ",
                mm: "%d ਮਿੰਟ",
                h: "ਇੱਕ ਘੰਟਾ",
                hh: "%d ਘੰਟੇ",
                d: "ਇੱਕ ਦਿਨ",
                dd: "%d ਦਿਨ",
                M: "ਇੱਕ ਮਹੀਨਾ",
                MM: "%d ਮਹੀਨੇ",
                y: "ਇੱਕ ਸਾਲ",
                yy: "%d ਸਾਲ"
            },
            preparse: function(e) {
                return e.replace(/[੧੨੩੪੫੬੭੮੯੦]/g, function(e) {
                    return a[e]
                })
            },
            postformat: function(e) {
                return e.replace(/\d/g, function(e) {
                    return t[e]
                })
            },
            meridiemParse: /ਰਾਤ|ਸਵੇਰ|ਦੁਪਹਿਰ|ਸ਼ਾਮ/,
            meridiemHour: function(e, t) {
                return 12 === e && (e = 0),
                "ਰਾਤ" === t ? e < 4 ? e : e + 12 : "ਸਵੇਰ" === t ? e : "ਦੁਪਹਿਰ" === t ? e >= 10 ? e : e + 12 : "ਸ਼ਾਮ" === t ? e + 12 : void 0
            },
            meridiem: function(e, t, a) {
                return e < 4 ? "ਰਾਤ" : e < 10 ? "ਸਵੇਰ" : e < 17 ? "ਦੁਪਹਿਰ" : e < 20 ? "ਸ਼ਾਮ" : "ਰਾਤ"
            },
            week: {
                dow: 0,
                doy: 6
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = "styczeń_luty_marzec_kwiecień_maj_czerwiec_lipiec_sierpień_wrzesień_październik_listopad_grudzień".split("_")
          , a = "stycznia_lutego_marca_kwietnia_maja_czerwca_lipca_sierpnia_września_października_listopada_grudnia".split("_");
        function n(e) {
            return e % 10 < 5 && e % 10 > 1 && ~~(e / 10) % 10 != 1
        }
        function s(e, t, a) {
            var s = e + " ";
            switch (a) {
            case "ss":
                return s + (n(e) ? "sekundy" : "sekund");
            case "m":
                return t ? "minuta" : "minutę";
            case "mm":
                return s + (n(e) ? "minuty" : "minut");
            case "h":
                return t ? "godzina" : "godzinę";
            case "hh":
                return s + (n(e) ? "godziny" : "godzin");
            case "MM":
                return s + (n(e) ? "miesiące" : "miesięcy");
            case "yy":
                return s + (n(e) ? "lata" : "lat")
            }
        }
        e.defineLocale("pl", {
            months: function(e, n) {
                return e ? "" === n ? "(" + a[e.month()] + "|" + t[e.month()] + ")" : /D MMMM/.test(n) ? a[e.month()] : t[e.month()] : t
            },
            monthsShort: "sty_lut_mar_kwi_maj_cze_lip_sie_wrz_paź_lis_gru".split("_"),
            weekdays: "niedziela_poniedziałek_wtorek_środa_czwartek_piątek_sobota".split("_"),
            weekdaysShort: "ndz_pon_wt_śr_czw_pt_sob".split("_"),
            weekdaysMin: "Nd_Pn_Wt_Śr_Cz_Pt_So".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd, D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[Dziś o] LT",
                nextDay: "[Jutro o] LT",
                nextWeek: function() {
                    switch (this.day()) {
                    case 0:
                        return "[W niedzielę o] LT";
                    case 2:
                        return "[We wtorek o] LT";
                    case 3:
                        return "[W środę o] LT";
                    case 6:
                        return "[W sobotę o] LT";
                    default:
                        return "[W] dddd [o] LT"
                    }
                },
                lastDay: "[Wczoraj o] LT",
                lastWeek: function() {
                    switch (this.day()) {
                    case 0:
                        return "[W zeszłą niedzielę o] LT";
                    case 3:
                        return "[W zeszłą środę o] LT";
                    case 6:
                        return "[W zeszłą sobotę o] LT";
                    default:
                        return "[W zeszły] dddd [o] LT"
                    }
                },
                sameElse: "L"
            },
            relativeTime: {
                future: "za %s",
                past: "%s temu",
                s: "kilka sekund",
                ss: s,
                m: s,
                mm: s,
                h: s,
                hh: s,
                d: "1 dzień",
                dd: "%d dni",
                M: "miesiąc",
                MM: s,
                y: "rok",
                yy: s
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("pt", {
            months: "janeiro_fevereiro_março_abril_maio_junho_julho_agosto_setembro_outubro_novembro_dezembro".split("_"),
            monthsShort: "jan_fev_mar_abr_mai_jun_jul_ago_set_out_nov_dez".split("_"),
            weekdays: "Domingo_Segunda-feira_Terça-feira_Quarta-feira_Quinta-feira_Sexta-feira_Sábado".split("_"),
            weekdaysShort: "Dom_Seg_Ter_Qua_Qui_Sex_Sáb".split("_"),
            weekdaysMin: "Do_2ª_3ª_4ª_5ª_6ª_Sá".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D [de] MMMM [de] YYYY",
                LLL: "D [de] MMMM [de] YYYY HH:mm",
                LLLL: "dddd, D [de] MMMM [de] YYYY HH:mm"
            },
            calendar: {
                sameDay: "[Hoje às] LT",
                nextDay: "[Amanhã às] LT",
                nextWeek: "dddd [às] LT",
                lastDay: "[Ontem às] LT",
                lastWeek: function() {
                    return 0 === this.day() || 6 === this.day() ? "[Último] dddd [às] LT" : "[Última] dddd [às] LT"
                },
                sameElse: "L"
            },
            relativeTime: {
                future: "em %s",
                past: "há %s",
                s: "segundos",
                ss: "%d segundos",
                m: "um minuto",
                mm: "%d minutos",
                h: "uma hora",
                hh: "%d horas",
                d: "um dia",
                dd: "%d dias",
                M: "um mês",
                MM: "%d meses",
                y: "um ano",
                yy: "%d anos"
            },
            dayOfMonthOrdinalParse: /\d{1,2}º/,
            ordinal: "%dº",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("pt-br", {
            months: "janeiro_fevereiro_março_abril_maio_junho_julho_agosto_setembro_outubro_novembro_dezembro".split("_"),
            monthsShort: "jan_fev_mar_abr_mai_jun_jul_ago_set_out_nov_dez".split("_"),
            weekdays: "Domingo_Segunda-feira_Terça-feira_Quarta-feira_Quinta-feira_Sexta-feira_Sábado".split("_"),
            weekdaysShort: "Dom_Seg_Ter_Qua_Qui_Sex_Sáb".split("_"),
            weekdaysMin: "Do_2ª_3ª_4ª_5ª_6ª_Sá".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D [de] MMMM [de] YYYY",
                LLL: "D [de] MMMM [de] YYYY [às] HH:mm",
                LLLL: "dddd, D [de] MMMM [de] YYYY [às] HH:mm"
            },
            calendar: {
                sameDay: "[Hoje às] LT",
                nextDay: "[Amanhã às] LT",
                nextWeek: "dddd [às] LT",
                lastDay: "[Ontem às] LT",
                lastWeek: function() {
                    return 0 === this.day() || 6 === this.day() ? "[Último] dddd [às] LT" : "[Última] dddd [às] LT"
                },
                sameElse: "L"
            },
            relativeTime: {
                future: "em %s",
                past: "há %s",
                s: "poucos segundos",
                ss: "%d segundos",
                m: "um minuto",
                mm: "%d minutos",
                h: "uma hora",
                hh: "%d horas",
                d: "um dia",
                dd: "%d dias",
                M: "um mês",
                MM: "%d meses",
                y: "um ano",
                yy: "%d anos"
            },
            dayOfMonthOrdinalParse: /\d{1,2}º/,
            ordinal: "%dº"
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        function t(e, t, a) {
            var n = " ";
            return (e % 100 >= 20 || e >= 100 && e % 100 == 0) && (n = " de "),
            e + n + {
                ss: "secunde",
                mm: "minute",
                hh: "ore",
                dd: "zile",
                MM: "luni",
                yy: "ani"
            }[a]
        }
        e.defineLocale("ro", {
            months: "ianuarie_februarie_martie_aprilie_mai_iunie_iulie_august_septembrie_octombrie_noiembrie_decembrie".split("_"),
            monthsShort: "ian._febr._mart._apr._mai_iun._iul._aug._sept._oct._nov._dec.".split("_"),
            monthsParseExact: !0,
            weekdays: "duminică_luni_marți_miercuri_joi_vineri_sâmbătă".split("_"),
            weekdaysShort: "Dum_Lun_Mar_Mie_Joi_Vin_Sâm".split("_"),
            weekdaysMin: "Du_Lu_Ma_Mi_Jo_Vi_Sâ".split("_"),
            longDateFormat: {
                LT: "H:mm",
                LTS: "H:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY H:mm",
                LLLL: "dddd, D MMMM YYYY H:mm"
            },
            calendar: {
                sameDay: "[azi la] LT",
                nextDay: "[mâine la] LT",
                nextWeek: "dddd [la] LT",
                lastDay: "[ieri la] LT",
                lastWeek: "[fosta] dddd [la] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "peste %s",
                past: "%s în urmă",
                s: "câteva secunde",
                ss: t,
                m: "un minut",
                mm: t,
                h: "o oră",
                hh: t,
                d: "o zi",
                dd: t,
                M: "o lună",
                MM: t,
                y: "un an",
                yy: t
            },
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        function t(e, t, a) {
            var n = {
                ss: t ? "секунда_секунды_секунд" : "секунду_секунды_секунд",
                mm: t ? "минута_минуты_минут" : "минуту_минуты_минут",
                hh: "час_часа_часов",
                dd: "день_дня_дней",
                MM: "месяц_месяца_месяцев",
                yy: "год_года_лет"
            };
            return "m" === a ? t ? "минута" : "минуту" : e + " " + function(e, t) {
                var a = e.split("_");
                return t % 10 == 1 && t % 100 != 11 ? a[0] : t % 10 >= 2 && t % 10 <= 4 && (t % 100 < 10 || t % 100 >= 20) ? a[1] : a[2]
            }(n[a], +e)
        }
        var a = [/^янв/i, /^фев/i, /^мар/i, /^апр/i, /^ма[йя]/i, /^июн/i, /^июл/i, /^авг/i, /^сен/i, /^окт/i, /^ноя/i, /^дек/i];
        e.defineLocale("ru", {
            months: {
                format: "января_февраля_марта_апреля_мая_июня_июля_августа_сентября_октября_ноября_декабря".split("_"),
                standalone: "январь_февраль_март_апрель_май_июнь_июль_август_сентябрь_октябрь_ноябрь_декабрь".split("_")
            },
            monthsShort: {
                format: "янв._февр._мар._апр._мая_июня_июля_авг._сент._окт._нояб._дек.".split("_"),
                standalone: "янв._февр._март_апр._май_июнь_июль_авг._сент._окт._нояб._дек.".split("_")
            },
            weekdays: {
                standalone: "воскресенье_понедельник_вторник_среда_четверг_пятница_суббота".split("_"),
                format: "воскресенье_понедельник_вторник_среду_четверг_пятницу_субботу".split("_"),
                isFormat: /\[ ?[Вв] ?(?:прошлую|следующую|эту)? ?\] ?dddd/
            },
            weekdaysShort: "вс_пн_вт_ср_чт_пт_сб".split("_"),
            weekdaysMin: "вс_пн_вт_ср_чт_пт_сб".split("_"),
            monthsParse: a,
            longMonthsParse: a,
            shortMonthsParse: a,
            monthsRegex: /^(январ[ья]|янв\.?|феврал[ья]|февр?\.?|марта?|мар\.?|апрел[ья]|апр\.?|ма[йя]|июн[ья]|июн\.?|июл[ья]|июл\.?|августа?|авг\.?|сентябр[ья]|сент?\.?|октябр[ья]|окт\.?|ноябр[ья]|нояб?\.?|декабр[ья]|дек\.?)/i,
            monthsShortRegex: /^(январ[ья]|янв\.?|феврал[ья]|февр?\.?|марта?|мар\.?|апрел[ья]|апр\.?|ма[йя]|июн[ья]|июн\.?|июл[ья]|июл\.?|августа?|авг\.?|сентябр[ья]|сент?\.?|октябр[ья]|окт\.?|ноябр[ья]|нояб?\.?|декабр[ья]|дек\.?)/i,
            monthsStrictRegex: /^(январ[яь]|феврал[яь]|марта?|апрел[яь]|ма[яй]|июн[яь]|июл[яь]|августа?|сентябр[яь]|октябр[яь]|ноябр[яь]|декабр[яь])/i,
            monthsShortStrictRegex: /^(янв\.|февр?\.|мар[т.]|апр\.|ма[яй]|июн[ья.]|июл[ья.]|авг\.|сент?\.|окт\.|нояб?\.|дек\.)/i,
            longDateFormat: {
                LT: "H:mm",
                LTS: "H:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D MMMM YYYY г.",
                LLL: "D MMMM YYYY г., H:mm",
                LLLL: "dddd, D MMMM YYYY г., H:mm"
            },
            calendar: {
                sameDay: "[Сегодня, в] LT",
                nextDay: "[Завтра, в] LT",
                lastDay: "[Вчера, в] LT",
                nextWeek: function(e) {
                    if (e.week() === this.week())
                        return 2 === this.day() ? "[Во] dddd, [в] LT" : "[В] dddd, [в] LT";
                    switch (this.day()) {
                    case 0:
                        return "[В следующее] dddd, [в] LT";
                    case 1:
                    case 2:
                    case 4:
                        return "[В следующий] dddd, [в] LT";
                    case 3:
                    case 5:
                    case 6:
                        return "[В следующую] dddd, [в] LT"
                    }
                },
                lastWeek: function(e) {
                    if (e.week() === this.week())
                        return 2 === this.day() ? "[Во] dddd, [в] LT" : "[В] dddd, [в] LT";
                    switch (this.day()) {
                    case 0:
                        return "[В прошлое] dddd, [в] LT";
                    case 1:
                    case 2:
                    case 4:
                        return "[В прошлый] dddd, [в] LT";
                    case 3:
                    case 5:
                    case 6:
                        return "[В прошлую] dddd, [в] LT"
                    }
                },
                sameElse: "L"
            },
            relativeTime: {
                future: "через %s",
                past: "%s назад",
                s: "несколько секунд",
                ss: t,
                m: t,
                mm: t,
                h: "час",
                hh: t,
                d: "день",
                dd: t,
                M: "месяц",
                MM: t,
                y: "год",
                yy: t
            },
            meridiemParse: /ночи|утра|дня|вечера/i,
            isPM: function(e) {
                return /^(дня|вечера)$/.test(e)
            },
            meridiem: function(e, t, a) {
                return e < 4 ? "ночи" : e < 12 ? "утра" : e < 17 ? "дня" : "вечера"
            },
            dayOfMonthOrdinalParse: /\d{1,2}-(й|го|я)/,
            ordinal: function(e, t) {
                switch (t) {
                case "M":
                case "d":
                case "DDD":
                    return e + "-й";
                case "D":
                    return e + "-го";
                case "w":
                case "W":
                    return e + "-я";
                default:
                    return e
                }
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = ["جنوري", "فيبروري", "مارچ", "اپريل", "مئي", "جون", "جولاءِ", "آگسٽ", "سيپٽمبر", "آڪٽوبر", "نومبر", "ڊسمبر"]
          , a = ["آچر", "سومر", "اڱارو", "اربع", "خميس", "جمع", "ڇنڇر"];
        e.defineLocale("sd", {
            months: t,
            monthsShort: t,
            weekdays: a,
            weekdaysShort: a,
            weekdaysMin: a,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd، D MMMM YYYY HH:mm"
            },
            meridiemParse: /صبح|شام/,
            isPM: function(e) {
                return "شام" === e
            },
            meridiem: function(e, t, a) {
                return e < 12 ? "صبح" : "شام"
            },
            calendar: {
                sameDay: "[اڄ] LT",
                nextDay: "[سڀاڻي] LT",
                nextWeek: "dddd [اڳين هفتي تي] LT",
                lastDay: "[ڪالهه] LT",
                lastWeek: "[گزريل هفتي] dddd [تي] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%s پوء",
                past: "%s اڳ",
                s: "چند سيڪنڊ",
                ss: "%d سيڪنڊ",
                m: "هڪ منٽ",
                mm: "%d منٽ",
                h: "هڪ ڪلاڪ",
                hh: "%d ڪلاڪ",
                d: "هڪ ڏينهن",
                dd: "%d ڏينهن",
                M: "هڪ مهينو",
                MM: "%d مهينا",
                y: "هڪ سال",
                yy: "%d سال"
            },
            preparse: function(e) {
                return e.replace(/،/g, ",")
            },
            postformat: function(e) {
                return e.replace(/,/g, "،")
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("se", {
            months: "ođđajagemánnu_guovvamánnu_njukčamánnu_cuoŋománnu_miessemánnu_geassemánnu_suoidnemánnu_borgemánnu_čakčamánnu_golggotmánnu_skábmamánnu_juovlamánnu".split("_"),
            monthsShort: "ođđj_guov_njuk_cuo_mies_geas_suoi_borg_čakč_golg_skáb_juov".split("_"),
            weekdays: "sotnabeaivi_vuossárga_maŋŋebárga_gaskavahkku_duorastat_bearjadat_lávvardat".split("_"),
            weekdaysShort: "sotn_vuos_maŋ_gask_duor_bear_láv".split("_"),
            weekdaysMin: "s_v_m_g_d_b_L".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD.MM.YYYY",
                LL: "MMMM D. [b.] YYYY",
                LLL: "MMMM D. [b.] YYYY [ti.] HH:mm",
                LLLL: "dddd, MMMM D. [b.] YYYY [ti.] HH:mm"
            },
            calendar: {
                sameDay: "[otne ti] LT",
                nextDay: "[ihttin ti] LT",
                nextWeek: "dddd [ti] LT",
                lastDay: "[ikte ti] LT",
                lastWeek: "[ovddit] dddd [ti] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%s geažes",
                past: "maŋit %s",
                s: "moadde sekunddat",
                ss: "%d sekunddat",
                m: "okta minuhta",
                mm: "%d minuhtat",
                h: "okta diimmu",
                hh: "%d diimmut",
                d: "okta beaivi",
                dd: "%d beaivvit",
                M: "okta mánnu",
                MM: "%d mánut",
                y: "okta jahki",
                yy: "%d jagit"
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("si", {
            months: "ජනවාරි_පෙබරවාරි_මාර්තු_අප්‍රේල්_මැයි_ජූනි_ජූලි_අගෝස්තු_සැප්තැම්බර්_ඔක්තෝබර්_නොවැම්බර්_දෙසැම්බර්".split("_"),
            monthsShort: "ජන_පෙබ_මාර්_අප්_මැයි_ජූනි_ජූලි_අගෝ_සැප්_ඔක්_නොවැ_දෙසැ".split("_"),
            weekdays: "ඉරිදා_සඳුදා_අඟහරුවාදා_බදාදා_බ්‍රහස්පතින්දා_සිකුරාදා_සෙනසුරාදා".split("_"),
            weekdaysShort: "ඉරි_සඳු_අඟ_බදා_බ්‍රහ_සිකු_සෙන".split("_"),
            weekdaysMin: "ඉ_ස_අ_බ_බ්‍ර_සි_සෙ".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "a h:mm",
                LTS: "a h:mm:ss",
                L: "YYYY/MM/DD",
                LL: "YYYY MMMM D",
                LLL: "YYYY MMMM D, a h:mm",
                LLLL: "YYYY MMMM D [වැනි] dddd, a h:mm:ss"
            },
            calendar: {
                sameDay: "[අද] LT[ට]",
                nextDay: "[හෙට] LT[ට]",
                nextWeek: "dddd LT[ට]",
                lastDay: "[ඊයේ] LT[ට]",
                lastWeek: "[පසුගිය] dddd LT[ට]",
                sameElse: "L"
            },
            relativeTime: {
                future: "%sකින්",
                past: "%sකට පෙර",
                s: "තත්පර කිහිපය",
                ss: "තත්පර %d",
                m: "මිනිත්තුව",
                mm: "මිනිත්තු %d",
                h: "පැය",
                hh: "පැය %d",
                d: "දිනය",
                dd: "දින %d",
                M: "මාසය",
                MM: "මාස %d",
                y: "වසර",
                yy: "වසර %d"
            },
            dayOfMonthOrdinalParse: /\d{1,2} වැනි/,
            ordinal: function(e) {
                return e + " වැනි"
            },
            meridiemParse: /පෙර වරු|පස් වරු|පෙ.ව|ප.ව./,
            isPM: function(e) {
                return "ප.ව." === e || "පස් වරු" === e
            },
            meridiem: function(e, t, a) {
                return e > 11 ? a ? "ප.ව." : "පස් වරු" : a ? "පෙ.ව." : "පෙර වරු"
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = "január_február_marec_apríl_máj_jún_júl_august_september_október_november_december".split("_")
          , a = "jan_feb_mar_apr_máj_jún_júl_aug_sep_okt_nov_dec".split("_");
        function n(e) {
            return e > 1 && e < 5
        }
        function s(e, t, a, s) {
            var r = e + " ";
            switch (a) {
            case "s":
                return t || s ? "pár sekúnd" : "pár sekundami";
            case "ss":
                return t || s ? r + (n(e) ? "sekundy" : "sekúnd") : r + "sekundami";
            case "m":
                return t ? "minúta" : s ? "minútu" : "minútou";
            case "mm":
                return t || s ? r + (n(e) ? "minúty" : "minút") : r + "minútami";
            case "h":
                return t ? "hodina" : s ? "hodinu" : "hodinou";
            case "hh":
                return t || s ? r + (n(e) ? "hodiny" : "hodín") : r + "hodinami";
            case "d":
                return t || s ? "deň" : "dňom";
            case "dd":
                return t || s ? r + (n(e) ? "dni" : "dní") : r + "dňami";
            case "M":
                return t || s ? "mesiac" : "mesiacom";
            case "MM":
                return t || s ? r + (n(e) ? "mesiace" : "mesiacov") : r + "mesiacmi";
            case "y":
                return t || s ? "rok" : "rokom";
            case "yy":
                return t || s ? r + (n(e) ? "roky" : "rokov") : r + "rokmi"
            }
        }
        e.defineLocale("sk", {
            months: t,
            monthsShort: a,
            weekdays: "nedeľa_pondelok_utorok_streda_štvrtok_piatok_sobota".split("_"),
            weekdaysShort: "ne_po_ut_st_št_pi_so".split("_"),
            weekdaysMin: "ne_po_ut_st_št_pi_so".split("_"),
            longDateFormat: {
                LT: "H:mm",
                LTS: "H:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D. MMMM YYYY",
                LLL: "D. MMMM YYYY H:mm",
                LLLL: "dddd D. MMMM YYYY H:mm"
            },
            calendar: {
                sameDay: "[dnes o] LT",
                nextDay: "[zajtra o] LT",
                nextWeek: function() {
                    switch (this.day()) {
                    case 0:
                        return "[v nedeľu o] LT";
                    case 1:
                    case 2:
                        return "[v] dddd [o] LT";
                    case 3:
                        return "[v stredu o] LT";
                    case 4:
                        return "[vo štvrtok o] LT";
                    case 5:
                        return "[v piatok o] LT";
                    case 6:
                        return "[v sobotu o] LT"
                    }
                },
                lastDay: "[včera o] LT",
                lastWeek: function() {
                    switch (this.day()) {
                    case 0:
                        return "[minulú nedeľu o] LT";
                    case 1:
                    case 2:
                        return "[minulý] dddd [o] LT";
                    case 3:
                        return "[minulú stredu o] LT";
                    case 4:
                    case 5:
                        return "[minulý] dddd [o] LT";
                    case 6:
                        return "[minulú sobotu o] LT"
                    }
                },
                sameElse: "L"
            },
            relativeTime: {
                future: "za %s",
                past: "pred %s",
                s: s,
                ss: s,
                m: s,
                mm: s,
                h: s,
                hh: s,
                d: s,
                dd: s,
                M: s,
                MM: s,
                y: s,
                yy: s
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        function t(e, t, a, n) {
            var s = e + " ";
            switch (a) {
            case "s":
                return t || n ? "nekaj sekund" : "nekaj sekundami";
            case "ss":
                return s += 1 === e ? t ? "sekundo" : "sekundi" : 2 === e ? t || n ? "sekundi" : "sekundah" : e < 5 ? t || n ? "sekunde" : "sekundah" : "sekund";
            case "m":
                return t ? "ena minuta" : "eno minuto";
            case "mm":
                return s += 1 === e ? t ? "minuta" : "minuto" : 2 === e ? t || n ? "minuti" : "minutama" : e < 5 ? t || n ? "minute" : "minutami" : t || n ? "minut" : "minutami";
            case "h":
                return t ? "ena ura" : "eno uro";
            case "hh":
                return s += 1 === e ? t ? "ura" : "uro" : 2 === e ? t || n ? "uri" : "urama" : e < 5 ? t || n ? "ure" : "urami" : t || n ? "ur" : "urami";
            case "d":
                return t || n ? "en dan" : "enim dnem";
            case "dd":
                return s += 1 === e ? t || n ? "dan" : "dnem" : 2 === e ? t || n ? "dni" : "dnevoma" : t || n ? "dni" : "dnevi";
            case "M":
                return t || n ? "en mesec" : "enim mesecem";
            case "MM":
                return s += 1 === e ? t || n ? "mesec" : "mesecem" : 2 === e ? t || n ? "meseca" : "mesecema" : e < 5 ? t || n ? "mesece" : "meseci" : t || n ? "mesecev" : "meseci";
            case "y":
                return t || n ? "eno leto" : "enim letom";
            case "yy":
                return s += 1 === e ? t || n ? "leto" : "letom" : 2 === e ? t || n ? "leti" : "letoma" : e < 5 ? t || n ? "leta" : "leti" : t || n ? "let" : "leti"
            }
        }
        e.defineLocale("sl", {
            months: "januar_februar_marec_april_maj_junij_julij_avgust_september_oktober_november_december".split("_"),
            monthsShort: "jan._feb._mar._apr._maj._jun._jul._avg._sep._okt._nov._dec.".split("_"),
            monthsParseExact: !0,
            weekdays: "nedelja_ponedeljek_torek_sreda_četrtek_petek_sobota".split("_"),
            weekdaysShort: "ned._pon._tor._sre._čet._pet._sob.".split("_"),
            weekdaysMin: "ne_po_to_sr_če_pe_so".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "H:mm",
                LTS: "H:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D. MMMM YYYY",
                LLL: "D. MMMM YYYY H:mm",
                LLLL: "dddd, D. MMMM YYYY H:mm"
            },
            calendar: {
                sameDay: "[danes ob] LT",
                nextDay: "[jutri ob] LT",
                nextWeek: function() {
                    switch (this.day()) {
                    case 0:
                        return "[v] [nedeljo] [ob] LT";
                    case 3:
                        return "[v] [sredo] [ob] LT";
                    case 6:
                        return "[v] [soboto] [ob] LT";
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return "[v] dddd [ob] LT"
                    }
                },
                lastDay: "[včeraj ob] LT",
                lastWeek: function() {
                    switch (this.day()) {
                    case 0:
                        return "[prejšnjo] [nedeljo] [ob] LT";
                    case 3:
                        return "[prejšnjo] [sredo] [ob] LT";
                    case 6:
                        return "[prejšnjo] [soboto] [ob] LT";
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return "[prejšnji] dddd [ob] LT"
                    }
                },
                sameElse: "L"
            },
            relativeTime: {
                future: "čez %s",
                past: "pred %s",
                s: t,
                ss: t,
                m: t,
                mm: t,
                h: t,
                hh: t,
                d: t,
                dd: t,
                M: t,
                MM: t,
                y: t,
                yy: t
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("sq", {
            months: "Janar_Shkurt_Mars_Prill_Maj_Qershor_Korrik_Gusht_Shtator_Tetor_Nëntor_Dhjetor".split("_"),
            monthsShort: "Jan_Shk_Mar_Pri_Maj_Qer_Kor_Gus_Sht_Tet_Nën_Dhj".split("_"),
            weekdays: "E Diel_E Hënë_E Martë_E Mërkurë_E Enjte_E Premte_E Shtunë".split("_"),
            weekdaysShort: "Die_Hën_Mar_Mër_Enj_Pre_Sht".split("_"),
            weekdaysMin: "D_H_Ma_Më_E_P_Sh".split("_"),
            weekdaysParseExact: !0,
            meridiemParse: /PD|MD/,
            isPM: function(e) {
                return "M" === e.charAt(0)
            },
            meridiem: function(e, t, a) {
                return e < 12 ? "PD" : "MD"
            },
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd, D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[Sot në] LT",
                nextDay: "[Nesër në] LT",
                nextWeek: "dddd [në] LT",
                lastDay: "[Dje në] LT",
                lastWeek: "dddd [e kaluar në] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "në %s",
                past: "%s më parë",
                s: "disa sekonda",
                ss: "%d sekonda",
                m: "një minutë",
                mm: "%d minuta",
                h: "një orë",
                hh: "%d orë",
                d: "një ditë",
                dd: "%d ditë",
                M: "një muaj",
                MM: "%d muaj",
                y: "një vit",
                yy: "%d vite"
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = {
            words: {
                ss: ["sekunda", "sekunde", "sekundi"],
                m: ["jedan minut", "jedne minute"],
                mm: ["minut", "minute", "minuta"],
                h: ["jedan sat", "jednog sata"],
                hh: ["sat", "sata", "sati"],
                dd: ["dan", "dana", "dana"],
                MM: ["mesec", "meseca", "meseci"],
                yy: ["godina", "godine", "godina"]
            },
            correctGrammaticalCase: function(e, t) {
                return 1 === e ? t[0] : e >= 2 && e <= 4 ? t[1] : t[2]
            },
            translate: function(e, a, n) {
                var s = t.words[n];
                return 1 === n.length ? a ? s[0] : s[1] : e + " " + t.correctGrammaticalCase(e, s)
            }
        };
        e.defineLocale("sr", {
            months: "januar_februar_mart_april_maj_jun_jul_avgust_septembar_oktobar_novembar_decembar".split("_"),
            monthsShort: "jan._feb._mar._apr._maj_jun_jul_avg._sep._okt._nov._dec.".split("_"),
            monthsParseExact: !0,
            weekdays: "nedelja_ponedeljak_utorak_sreda_četvrtak_petak_subota".split("_"),
            weekdaysShort: "ned._pon._uto._sre._čet._pet._sub.".split("_"),
            weekdaysMin: "ne_po_ut_sr_če_pe_su".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "H:mm",
                LTS: "H:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D. MMMM YYYY",
                LLL: "D. MMMM YYYY H:mm",
                LLLL: "dddd, D. MMMM YYYY H:mm"
            },
            calendar: {
                sameDay: "[danas u] LT",
                nextDay: "[sutra u] LT",
                nextWeek: function() {
                    switch (this.day()) {
                    case 0:
                        return "[u] [nedelju] [u] LT";
                    case 3:
                        return "[u] [sredu] [u] LT";
                    case 6:
                        return "[u] [subotu] [u] LT";
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return "[u] dddd [u] LT"
                    }
                },
                lastDay: "[juče u] LT",
                lastWeek: function() {
                    return ["[prošle] [nedelje] [u] LT", "[prošlog] [ponedeljka] [u] LT", "[prošlog] [utorka] [u] LT", "[prošle] [srede] [u] LT", "[prošlog] [četvrtka] [u] LT", "[prošlog] [petka] [u] LT", "[prošle] [subote] [u] LT"][this.day()]
                },
                sameElse: "L"
            },
            relativeTime: {
                future: "za %s",
                past: "pre %s",
                s: "nekoliko sekundi",
                ss: t.translate,
                m: t.translate,
                mm: t.translate,
                h: t.translate,
                hh: t.translate,
                d: "dan",
                dd: t.translate,
                M: "mesec",
                MM: t.translate,
                y: "godinu",
                yy: t.translate
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = {
            words: {
                ss: ["секунда", "секунде", "секунди"],
                m: ["један минут", "једне минуте"],
                mm: ["минут", "минуте", "минута"],
                h: ["један сат", "једног сата"],
                hh: ["сат", "сата", "сати"],
                dd: ["дан", "дана", "дана"],
                MM: ["месец", "месеца", "месеци"],
                yy: ["година", "године", "година"]
            },
            correctGrammaticalCase: function(e, t) {
                return 1 === e ? t[0] : e >= 2 && e <= 4 ? t[1] : t[2]
            },
            translate: function(e, a, n) {
                var s = t.words[n];
                return 1 === n.length ? a ? s[0] : s[1] : e + " " + t.correctGrammaticalCase(e, s)
            }
        };
        e.defineLocale("sr-cyrl", {
            months: "јануар_фебруар_март_април_мај_јун_јул_август_септембар_октобар_новембар_децембар".split("_"),
            monthsShort: "јан._феб._мар._апр._мај_јун_јул_авг._сеп._окт._нов._дец.".split("_"),
            monthsParseExact: !0,
            weekdays: "недеља_понедељак_уторак_среда_четвртак_петак_субота".split("_"),
            weekdaysShort: "нед._пон._уто._сре._чет._пет._суб.".split("_"),
            weekdaysMin: "не_по_ут_ср_че_пе_су".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "H:mm",
                LTS: "H:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D. MMMM YYYY",
                LLL: "D. MMMM YYYY H:mm",
                LLLL: "dddd, D. MMMM YYYY H:mm"
            },
            calendar: {
                sameDay: "[данас у] LT",
                nextDay: "[сутра у] LT",
                nextWeek: function() {
                    switch (this.day()) {
                    case 0:
                        return "[у] [недељу] [у] LT";
                    case 3:
                        return "[у] [среду] [у] LT";
                    case 6:
                        return "[у] [суботу] [у] LT";
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return "[у] dddd [у] LT"
                    }
                },
                lastDay: "[јуче у] LT",
                lastWeek: function() {
                    return ["[прошле] [недеље] [у] LT", "[прошлог] [понедељка] [у] LT", "[прошлог] [уторка] [у] LT", "[прошле] [среде] [у] LT", "[прошлог] [четвртка] [у] LT", "[прошлог] [петка] [у] LT", "[прошле] [суботе] [у] LT"][this.day()]
                },
                sameElse: "L"
            },
            relativeTime: {
                future: "за %s",
                past: "пре %s",
                s: "неколико секунди",
                ss: t.translate,
                m: t.translate,
                mm: t.translate,
                h: t.translate,
                hh: t.translate,
                d: "дан",
                dd: t.translate,
                M: "месец",
                MM: t.translate,
                y: "годину",
                yy: t.translate
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("ss", {
            months: "Bhimbidvwane_Indlovana_Indlov'lenkhulu_Mabasa_Inkhwekhweti_Inhlaba_Kholwane_Ingci_Inyoni_Imphala_Lweti_Ingongoni".split("_"),
            monthsShort: "Bhi_Ina_Inu_Mab_Ink_Inh_Kho_Igc_Iny_Imp_Lwe_Igo".split("_"),
            weekdays: "Lisontfo_Umsombuluko_Lesibili_Lesitsatfu_Lesine_Lesihlanu_Umgcibelo".split("_"),
            weekdaysShort: "Lis_Umb_Lsb_Les_Lsi_Lsh_Umg".split("_"),
            weekdaysMin: "Li_Us_Lb_Lt_Ls_Lh_Ug".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "h:mm A",
                LTS: "h:mm:ss A",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY h:mm A",
                LLLL: "dddd, D MMMM YYYY h:mm A"
            },
            calendar: {
                sameDay: "[Namuhla nga] LT",
                nextDay: "[Kusasa nga] LT",
                nextWeek: "dddd [nga] LT",
                lastDay: "[Itolo nga] LT",
                lastWeek: "dddd [leliphelile] [nga] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "nga %s",
                past: "wenteka nga %s",
                s: "emizuzwana lomcane",
                ss: "%d mzuzwana",
                m: "umzuzu",
                mm: "%d emizuzu",
                h: "lihora",
                hh: "%d emahora",
                d: "lilanga",
                dd: "%d emalanga",
                M: "inyanga",
                MM: "%d tinyanga",
                y: "umnyaka",
                yy: "%d iminyaka"
            },
            meridiemParse: /ekuseni|emini|entsambama|ebusuku/,
            meridiem: function(e, t, a) {
                return e < 11 ? "ekuseni" : e < 15 ? "emini" : e < 19 ? "entsambama" : "ebusuku"
            },
            meridiemHour: function(e, t) {
                return 12 === e && (e = 0),
                "ekuseni" === t ? e : "emini" === t ? e >= 11 ? e : e + 12 : "entsambama" === t || "ebusuku" === t ? 0 === e ? 0 : e + 12 : void 0
            },
            dayOfMonthOrdinalParse: /\d{1,2}/,
            ordinal: "%d",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("sv", {
            months: "januari_februari_mars_april_maj_juni_juli_augusti_september_oktober_november_december".split("_"),
            monthsShort: "jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec".split("_"),
            weekdays: "söndag_måndag_tisdag_onsdag_torsdag_fredag_lördag".split("_"),
            weekdaysShort: "sön_mån_tis_ons_tor_fre_lör".split("_"),
            weekdaysMin: "sö_må_ti_on_to_fr_lö".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "YYYY-MM-DD",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY [kl.] HH:mm",
                LLLL: "dddd D MMMM YYYY [kl.] HH:mm",
                lll: "D MMM YYYY HH:mm",
                llll: "ddd D MMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[Idag] LT",
                nextDay: "[Imorgon] LT",
                lastDay: "[Igår] LT",
                nextWeek: "[På] dddd LT",
                lastWeek: "[I] dddd[s] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "om %s",
                past: "för %s sedan",
                s: "några sekunder",
                ss: "%d sekunder",
                m: "en minut",
                mm: "%d minuter",
                h: "en timme",
                hh: "%d timmar",
                d: "en dag",
                dd: "%d dagar",
                M: "en månad",
                MM: "%d månader",
                y: "ett år",
                yy: "%d år"
            },
            dayOfMonthOrdinalParse: /\d{1,2}(e|a)/,
            ordinal: function(e) {
                var t = e % 10
                  , a = 1 == ~~(e % 100 / 10) ? "e" : 1 === t ? "a" : 2 === t ? "a" : "e";
                return e + a
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("sw", {
            months: "Januari_Februari_Machi_Aprili_Mei_Juni_Julai_Agosti_Septemba_Oktoba_Novemba_Desemba".split("_"),
            monthsShort: "Jan_Feb_Mac_Apr_Mei_Jun_Jul_Ago_Sep_Okt_Nov_Des".split("_"),
            weekdays: "Jumapili_Jumatatu_Jumanne_Jumatano_Alhamisi_Ijumaa_Jumamosi".split("_"),
            weekdaysShort: "Jpl_Jtat_Jnne_Jtan_Alh_Ijm_Jmos".split("_"),
            weekdaysMin: "J2_J3_J4_J5_Al_Ij_J1".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd, D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[leo saa] LT",
                nextDay: "[kesho saa] LT",
                nextWeek: "[wiki ijayo] dddd [saat] LT",
                lastDay: "[jana] LT",
                lastWeek: "[wiki iliyopita] dddd [saat] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%s baadaye",
                past: "tokea %s",
                s: "hivi punde",
                ss: "sekunde %d",
                m: "dakika moja",
                mm: "dakika %d",
                h: "saa limoja",
                hh: "masaa %d",
                d: "siku moja",
                dd: "masiku %d",
                M: "mwezi mmoja",
                MM: "miezi %d",
                y: "mwaka mmoja",
                yy: "miaka %d"
            },
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = {
            1: "௧",
            2: "௨",
            3: "௩",
            4: "௪",
            5: "௫",
            6: "௬",
            7: "௭",
            8: "௮",
            9: "௯",
            0: "௦"
        }
          , a = {
            "௧": "1",
            "௨": "2",
            "௩": "3",
            "௪": "4",
            "௫": "5",
            "௬": "6",
            "௭": "7",
            "௮": "8",
            "௯": "9",
            "௦": "0"
        };
        e.defineLocale("ta", {
            months: "ஜனவரி_பிப்ரவரி_மார்ச்_ஏப்ரல்_மே_ஜூன்_ஜூலை_ஆகஸ்ட்_செப்டெம்பர்_அக்டோபர்_நவம்பர்_டிசம்பர்".split("_"),
            monthsShort: "ஜனவரி_பிப்ரவரி_மார்ச்_ஏப்ரல்_மே_ஜூன்_ஜூலை_ஆகஸ்ட்_செப்டெம்பர்_அக்டோபர்_நவம்பர்_டிசம்பர்".split("_"),
            weekdays: "ஞாயிற்றுக்கிழமை_திங்கட்கிழமை_செவ்வாய்கிழமை_புதன்கிழமை_வியாழக்கிழமை_வெள்ளிக்கிழமை_சனிக்கிழமை".split("_"),
            weekdaysShort: "ஞாயிறு_திங்கள்_செவ்வாய்_புதன்_வியாழன்_வெள்ளி_சனி".split("_"),
            weekdaysMin: "ஞா_தி_செ_பு_வி_வெ_ச".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY, HH:mm",
                LLLL: "dddd, D MMMM YYYY, HH:mm"
            },
            calendar: {
                sameDay: "[இன்று] LT",
                nextDay: "[நாளை] LT",
                nextWeek: "dddd, LT",
                lastDay: "[நேற்று] LT",
                lastWeek: "[கடந்த வாரம்] dddd, LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%s இல்",
                past: "%s முன்",
                s: "ஒரு சில விநாடிகள்",
                ss: "%d விநாடிகள்",
                m: "ஒரு நிமிடம்",
                mm: "%d நிமிடங்கள்",
                h: "ஒரு மணி நேரம்",
                hh: "%d மணி நேரம்",
                d: "ஒரு நாள்",
                dd: "%d நாட்கள்",
                M: "ஒரு மாதம்",
                MM: "%d மாதங்கள்",
                y: "ஒரு வருடம்",
                yy: "%d ஆண்டுகள்"
            },
            dayOfMonthOrdinalParse: /\d{1,2}வது/,
            ordinal: function(e) {
                return e + "வது"
            },
            preparse: function(e) {
                return e.replace(/[௧௨௩௪௫௬௭௮௯௦]/g, function(e) {
                    return a[e]
                })
            },
            postformat: function(e) {
                return e.replace(/\d/g, function(e) {
                    return t[e]
                })
            },
            meridiemParse: /யாமம்|வைகறை|காலை|நண்பகல்|எற்பாடு|மாலை/,
            meridiem: function(e, t, a) {
                return e < 2 ? " யாமம்" : e < 6 ? " வைகறை" : e < 10 ? " காலை" : e < 14 ? " நண்பகல்" : e < 18 ? " எற்பாடு" : e < 22 ? " மாலை" : " யாமம்"
            },
            meridiemHour: function(e, t) {
                return 12 === e && (e = 0),
                "யாமம்" === t ? e < 2 ? e : e + 12 : "வைகறை" === t || "காலை" === t ? e : "நண்பகல்" === t && e >= 10 ? e : e + 12
            },
            week: {
                dow: 0,
                doy: 6
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("te", {
            months: "జనవరి_ఫిబ్రవరి_మార్చి_ఏప్రిల్_మే_జూన్_జూలై_ఆగస్టు_సెప్టెంబర్_అక్టోబర్_నవంబర్_డిసెంబర్".split("_"),
            monthsShort: "జన._ఫిబ్ర._మార్చి_ఏప్రి._మే_జూన్_జూలై_ఆగ._సెప్._అక్టో._నవ._డిసె.".split("_"),
            monthsParseExact: !0,
            weekdays: "ఆదివారం_సోమవారం_మంగళవారం_బుధవారం_గురువారం_శుక్రవారం_శనివారం".split("_"),
            weekdaysShort: "ఆది_సోమ_మంగళ_బుధ_గురు_శుక్ర_శని".split("_"),
            weekdaysMin: "ఆ_సో_మం_బు_గు_శు_శ".split("_"),
            longDateFormat: {
                LT: "A h:mm",
                LTS: "A h:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY, A h:mm",
                LLLL: "dddd, D MMMM YYYY, A h:mm"
            },
            calendar: {
                sameDay: "[నేడు] LT",
                nextDay: "[రేపు] LT",
                nextWeek: "dddd, LT",
                lastDay: "[నిన్న] LT",
                lastWeek: "[గత] dddd, LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%s లో",
                past: "%s క్రితం",
                s: "కొన్ని క్షణాలు",
                ss: "%d సెకన్లు",
                m: "ఒక నిమిషం",
                mm: "%d నిమిషాలు",
                h: "ఒక గంట",
                hh: "%d గంటలు",
                d: "ఒక రోజు",
                dd: "%d రోజులు",
                M: "ఒక నెల",
                MM: "%d నెలలు",
                y: "ఒక సంవత్సరం",
                yy: "%d సంవత్సరాలు"
            },
            dayOfMonthOrdinalParse: /\d{1,2}వ/,
            ordinal: "%dవ",
            meridiemParse: /రాత్రి|ఉదయం|మధ్యాహ్నం|సాయంత్రం/,
            meridiemHour: function(e, t) {
                return 12 === e && (e = 0),
                "రాత్రి" === t ? e < 4 ? e : e + 12 : "ఉదయం" === t ? e : "మధ్యాహ్నం" === t ? e >= 10 ? e : e + 12 : "సాయంత్రం" === t ? e + 12 : void 0
            },
            meridiem: function(e, t, a) {
                return e < 4 ? "రాత్రి" : e < 10 ? "ఉదయం" : e < 17 ? "మధ్యాహ్నం" : e < 20 ? "సాయంత్రం" : "రాత్రి"
            },
            week: {
                dow: 0,
                doy: 6
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("tet", {
            months: "Janeiru_Fevereiru_Marsu_Abril_Maiu_Juñu_Jullu_Agustu_Setembru_Outubru_Novembru_Dezembru".split("_"),
            monthsShort: "Jan_Fev_Mar_Abr_Mai_Jun_Jul_Ago_Set_Out_Nov_Dez".split("_"),
            weekdays: "Domingu_Segunda_Tersa_Kuarta_Kinta_Sesta_Sabadu".split("_"),
            weekdaysShort: "Dom_Seg_Ters_Kua_Kint_Sest_Sab".split("_"),
            weekdaysMin: "Do_Seg_Te_Ku_Ki_Ses_Sa".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd, D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[Ohin iha] LT",
                nextDay: "[Aban iha] LT",
                nextWeek: "dddd [iha] LT",
                lastDay: "[Horiseik iha] LT",
                lastWeek: "dddd [semana kotuk] [iha] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "iha %s",
                past: "%s liuba",
                s: "minutu balun",
                ss: "minutu %d",
                m: "minutu ida",
                mm: "minutu %d",
                h: "oras ida",
                hh: "oras %d",
                d: "loron ida",
                dd: "loron %d",
                M: "fulan ida",
                MM: "fulan %d",
                y: "tinan ida",
                yy: "tinan %d"
            },
            dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
            ordinal: function(e) {
                var t = e % 10
                  , a = 1 == ~~(e % 100 / 10) ? "th" : 1 === t ? "st" : 2 === t ? "nd" : 3 === t ? "rd" : "th";
                return e + a
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = {
            0: "-ум",
            1: "-ум",
            2: "-юм",
            3: "-юм",
            4: "-ум",
            5: "-ум",
            6: "-ум",
            7: "-ум",
            8: "-ум",
            9: "-ум",
            10: "-ум",
            12: "-ум",
            13: "-ум",
            20: "-ум",
            30: "-юм",
            40: "-ум",
            50: "-ум",
            60: "-ум",
            70: "-ум",
            80: "-ум",
            90: "-ум",
            100: "-ум"
        };
        e.defineLocale("tg", {
            months: "январ_феврал_март_апрел_май_июн_июл_август_сентябр_октябр_ноябр_декабр".split("_"),
            monthsShort: "янв_фев_мар_апр_май_июн_июл_авг_сен_окт_ноя_дек".split("_"),
            weekdays: "якшанбе_душанбе_сешанбе_чоршанбе_панҷшанбе_ҷумъа_шанбе".split("_"),
            weekdaysShort: "яшб_дшб_сшб_чшб_пшб_ҷум_шнб".split("_"),
            weekdaysMin: "яш_дш_сш_чш_пш_ҷм_шб".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd, D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[Имрӯз соати] LT",
                nextDay: "[Пагоҳ соати] LT",
                lastDay: "[Дирӯз соати] LT",
                nextWeek: "dddd[и] [ҳафтаи оянда соати] LT",
                lastWeek: "dddd[и] [ҳафтаи гузашта соати] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "баъди %s",
                past: "%s пеш",
                s: "якчанд сония",
                m: "як дақиқа",
                mm: "%d дақиқа",
                h: "як соат",
                hh: "%d соат",
                d: "як рӯз",
                dd: "%d рӯз",
                M: "як моҳ",
                MM: "%d моҳ",
                y: "як сол",
                yy: "%d сол"
            },
            meridiemParse: /шаб|субҳ|рӯз|бегоҳ/,
            meridiemHour: function(e, t) {
                return 12 === e && (e = 0),
                "шаб" === t ? e < 4 ? e : e + 12 : "субҳ" === t ? e : "рӯз" === t ? e >= 11 ? e : e + 12 : "бегоҳ" === t ? e + 12 : void 0
            },
            meridiem: function(e, t, a) {
                return e < 4 ? "шаб" : e < 11 ? "субҳ" : e < 16 ? "рӯз" : e < 19 ? "бегоҳ" : "шаб"
            },
            dayOfMonthOrdinalParse: /\d{1,2}-(ум|юм)/,
            ordinal: function(e) {
                var a = e % 10
                  , n = e >= 100 ? 100 : null;
                return e + (t[e] || t[a] || t[n])
            },
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("th", {
            months: "มกราคม_กุมภาพันธ์_มีนาคม_เมษายน_พฤษภาคม_มิถุนายน_กรกฎาคม_สิงหาคม_กันยายน_ตุลาคม_พฤศจิกายน_ธันวาคม".split("_"),
            monthsShort: "ม.ค._ก.พ._มี.ค._เม.ย._พ.ค._มิ.ย._ก.ค._ส.ค._ก.ย._ต.ค._พ.ย._ธ.ค.".split("_"),
            monthsParseExact: !0,
            weekdays: "อาทิตย์_จันทร์_อังคาร_พุธ_พฤหัสบดี_ศุกร์_เสาร์".split("_"),
            weekdaysShort: "อาทิตย์_จันทร์_อังคาร_พุธ_พฤหัส_ศุกร์_เสาร์".split("_"),
            weekdaysMin: "อา._จ._อ._พ._พฤ._ศ._ส.".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "H:mm",
                LTS: "H:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY เวลา H:mm",
                LLLL: "วันddddที่ D MMMM YYYY เวลา H:mm"
            },
            meridiemParse: /ก่อนเที่ยง|หลังเที่ยง/,
            isPM: function(e) {
                return "หลังเที่ยง" === e
            },
            meridiem: function(e, t, a) {
                return e < 12 ? "ก่อนเที่ยง" : "หลังเที่ยง"
            },
            calendar: {
                sameDay: "[วันนี้ เวลา] LT",
                nextDay: "[พรุ่งนี้ เวลา] LT",
                nextWeek: "dddd[หน้า เวลา] LT",
                lastDay: "[เมื่อวานนี้ เวลา] LT",
                lastWeek: "[วัน]dddd[ที่แล้ว เวลา] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "อีก %s",
                past: "%sที่แล้ว",
                s: "ไม่กี่วินาที",
                ss: "%d วินาที",
                m: "1 นาที",
                mm: "%d นาที",
                h: "1 ชั่วโมง",
                hh: "%d ชั่วโมง",
                d: "1 วัน",
                dd: "%d วัน",
                M: "1 เดือน",
                MM: "%d เดือน",
                y: "1 ปี",
                yy: "%d ปี"
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("tl-ph", {
            months: "Enero_Pebrero_Marso_Abril_Mayo_Hunyo_Hulyo_Agosto_Setyembre_Oktubre_Nobyembre_Disyembre".split("_"),
            monthsShort: "Ene_Peb_Mar_Abr_May_Hun_Hul_Ago_Set_Okt_Nob_Dis".split("_"),
            weekdays: "Linggo_Lunes_Martes_Miyerkules_Huwebes_Biyernes_Sabado".split("_"),
            weekdaysShort: "Lin_Lun_Mar_Miy_Huw_Biy_Sab".split("_"),
            weekdaysMin: "Li_Lu_Ma_Mi_Hu_Bi_Sab".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "MM/D/YYYY",
                LL: "MMMM D, YYYY",
                LLL: "MMMM D, YYYY HH:mm",
                LLLL: "dddd, MMMM DD, YYYY HH:mm"
            },
            calendar: {
                sameDay: "LT [ngayong araw]",
                nextDay: "[Bukas ng] LT",
                nextWeek: "LT [sa susunod na] dddd",
                lastDay: "LT [kahapon]",
                lastWeek: "LT [noong nakaraang] dddd",
                sameElse: "L"
            },
            relativeTime: {
                future: "sa loob ng %s",
                past: "%s ang nakalipas",
                s: "ilang segundo",
                ss: "%d segundo",
                m: "isang minuto",
                mm: "%d minuto",
                h: "isang oras",
                hh: "%d oras",
                d: "isang araw",
                dd: "%d araw",
                M: "isang buwan",
                MM: "%d buwan",
                y: "isang taon",
                yy: "%d taon"
            },
            dayOfMonthOrdinalParse: /\d{1,2}/,
            ordinal: function(e) {
                return e
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = "pagh_wa’_cha’_wej_loS_vagh_jav_Soch_chorgh_Hut".split("_");
        function a(e, a, n, s) {
            var r = function(e) {
                var a = Math.floor(e % 1e3 / 100)
                  , n = Math.floor(e % 100 / 10)
                  , s = e % 10
                  , r = "";
                return a > 0 && (r += t[a] + "vatlh"),
                n > 0 && (r += ("" !== r ? " " : "") + t[n] + "maH"),
                s > 0 && (r += ("" !== r ? " " : "") + t[s]),
                "" === r ? "pagh" : r
            }(e);
            switch (n) {
            case "ss":
                return r + " lup";
            case "mm":
                return r + " tup";
            case "hh":
                return r + " rep";
            case "dd":
                return r + " jaj";
            case "MM":
                return r + " jar";
            case "yy":
                return r + " DIS"
            }
        }
        e.defineLocale("tlh", {
            months: "tera’ jar wa’_tera’ jar cha’_tera’ jar wej_tera’ jar loS_tera’ jar vagh_tera’ jar jav_tera’ jar Soch_tera’ jar chorgh_tera’ jar Hut_tera’ jar wa’maH_tera’ jar wa’maH wa’_tera’ jar wa’maH cha’".split("_"),
            monthsShort: "jar wa’_jar cha’_jar wej_jar loS_jar vagh_jar jav_jar Soch_jar chorgh_jar Hut_jar wa’maH_jar wa’maH wa’_jar wa’maH cha’".split("_"),
            monthsParseExact: !0,
            weekdays: "lojmItjaj_DaSjaj_povjaj_ghItlhjaj_loghjaj_buqjaj_ghInjaj".split("_"),
            weekdaysShort: "lojmItjaj_DaSjaj_povjaj_ghItlhjaj_loghjaj_buqjaj_ghInjaj".split("_"),
            weekdaysMin: "lojmItjaj_DaSjaj_povjaj_ghItlhjaj_loghjaj_buqjaj_ghInjaj".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd, D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[DaHjaj] LT",
                nextDay: "[wa’leS] LT",
                nextWeek: "LLL",
                lastDay: "[wa’Hu’] LT",
                lastWeek: "LLL",
                sameElse: "L"
            },
            relativeTime: {
                future: function(e) {
                    var t = e;
                    return t = -1 !== e.indexOf("jaj") ? t.slice(0, -3) + "leS" : -1 !== e.indexOf("jar") ? t.slice(0, -3) + "waQ" : -1 !== e.indexOf("DIS") ? t.slice(0, -3) + "nem" : t + " pIq"
                },
                past: function(e) {
                    var t = e;
                    return t = -1 !== e.indexOf("jaj") ? t.slice(0, -3) + "Hu’" : -1 !== e.indexOf("jar") ? t.slice(0, -3) + "wen" : -1 !== e.indexOf("DIS") ? t.slice(0, -3) + "ben" : t + " ret"
                },
                s: "puS lup",
                ss: a,
                m: "wa’ tup",
                mm: a,
                h: "wa’ rep",
                hh: a,
                d: "wa’ jaj",
                dd: a,
                M: "wa’ jar",
                MM: a,
                y: "wa’ DIS",
                yy: a
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = {
            1: "'inci",
            5: "'inci",
            8: "'inci",
            70: "'inci",
            80: "'inci",
            2: "'nci",
            7: "'nci",
            20: "'nci",
            50: "'nci",
            3: "'üncü",
            4: "'üncü",
            100: "'üncü",
            6: "'ncı",
            9: "'uncu",
            10: "'uncu",
            30: "'uncu",
            60: "'ıncı",
            90: "'ıncı"
        };
        e.defineLocale("tr", {
            months: "Ocak_Şubat_Mart_Nisan_Mayıs_Haziran_Temmuz_Ağustos_Eylül_Ekim_Kasım_Aralık".split("_"),
            monthsShort: "Oca_Şub_Mar_Nis_May_Haz_Tem_Ağu_Eyl_Eki_Kas_Ara".split("_"),
            weekdays: "Pazar_Pazartesi_Salı_Çarşamba_Perşembe_Cuma_Cumartesi".split("_"),
            weekdaysShort: "Paz_Pts_Sal_Çar_Per_Cum_Cts".split("_"),
            weekdaysMin: "Pz_Pt_Sa_Ça_Pe_Cu_Ct".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd, D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[bugün saat] LT",
                nextDay: "[yarın saat] LT",
                nextWeek: "[gelecek] dddd [saat] LT",
                lastDay: "[dün] LT",
                lastWeek: "[geçen] dddd [saat] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%s sonra",
                past: "%s önce",
                s: "birkaç saniye",
                ss: "%d saniye",
                m: "bir dakika",
                mm: "%d dakika",
                h: "bir saat",
                hh: "%d saat",
                d: "bir gün",
                dd: "%d gün",
                M: "bir ay",
                MM: "%d ay",
                y: "bir yıl",
                yy: "%d yıl"
            },
            ordinal: function(e, a) {
                switch (a) {
                case "d":
                case "D":
                case "Do":
                case "DD":
                    return e;
                default:
                    if (0 === e)
                        return e + "'ıncı";
                    var n = e % 10
                      , s = e % 100 - n
                      , r = e >= 100 ? 100 : null;
                    return e + (t[n] || t[s] || t[r])
                }
            },
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        function t(e, t, a, n) {
            var s = {
                s: ["viensas secunds", "'iensas secunds"],
                ss: [e + " secunds", e + " secunds"],
                m: ["'n míut", "'iens míut"],
                mm: [e + " míuts", e + " míuts"],
                h: ["'n þora", "'iensa þora"],
                hh: [e + " þoras", e + " þoras"],
                d: ["'n ziua", "'iensa ziua"],
                dd: [e + " ziuas", e + " ziuas"],
                M: ["'n mes", "'iens mes"],
                MM: [e + " mesen", e + " mesen"],
                y: ["'n ar", "'iens ar"],
                yy: [e + " ars", e + " ars"]
            };
            return n ? s[a][0] : t ? s[a][0] : s[a][1]
        }
        e.defineLocale("tzl", {
            months: "Januar_Fevraglh_Març_Avrïu_Mai_Gün_Julia_Guscht_Setemvar_Listopäts_Noemvar_Zecemvar".split("_"),
            monthsShort: "Jan_Fev_Mar_Avr_Mai_Gün_Jul_Gus_Set_Lis_Noe_Zec".split("_"),
            weekdays: "Súladi_Lúneçi_Maitzi_Márcuri_Xhúadi_Viénerçi_Sáturi".split("_"),
            weekdaysShort: "Súl_Lún_Mai_Már_Xhú_Vié_Sát".split("_"),
            weekdaysMin: "Sú_Lú_Ma_Má_Xh_Vi_Sá".split("_"),
            longDateFormat: {
                LT: "HH.mm",
                LTS: "HH.mm.ss",
                L: "DD.MM.YYYY",
                LL: "D. MMMM [dallas] YYYY",
                LLL: "D. MMMM [dallas] YYYY HH.mm",
                LLLL: "dddd, [li] D. MMMM [dallas] YYYY HH.mm"
            },
            meridiemParse: /d\'o|d\'a/i,
            isPM: function(e) {
                return "d'o" === e.toLowerCase()
            },
            meridiem: function(e, t, a) {
                return e > 11 ? a ? "d'o" : "D'O" : a ? "d'a" : "D'A"
            },
            calendar: {
                sameDay: "[oxhi à] LT",
                nextDay: "[demà à] LT",
                nextWeek: "dddd [à] LT",
                lastDay: "[ieiri à] LT",
                lastWeek: "[sür el] dddd [lasteu à] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "osprei %s",
                past: "ja%s",
                s: t,
                ss: t,
                m: t,
                mm: t,
                h: t,
                hh: t,
                d: t,
                dd: t,
                M: t,
                MM: t,
                y: t,
                yy: t
            },
            dayOfMonthOrdinalParse: /\d{1,2}\./,
            ordinal: "%d.",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("tzm", {
            months: "ⵉⵏⵏⴰⵢⵔ_ⴱⵕⴰⵢⵕ_ⵎⴰⵕⵚ_ⵉⴱⵔⵉⵔ_ⵎⴰⵢⵢⵓ_ⵢⵓⵏⵢⵓ_ⵢⵓⵍⵢⵓⵣ_ⵖⵓⵛⵜ_ⵛⵓⵜⴰⵏⴱⵉⵔ_ⴽⵟⵓⴱⵕ_ⵏⵓⵡⴰⵏⴱⵉⵔ_ⴷⵓⵊⵏⴱⵉⵔ".split("_"),
            monthsShort: "ⵉⵏⵏⴰⵢⵔ_ⴱⵕⴰⵢⵕ_ⵎⴰⵕⵚ_ⵉⴱⵔⵉⵔ_ⵎⴰⵢⵢⵓ_ⵢⵓⵏⵢⵓ_ⵢⵓⵍⵢⵓⵣ_ⵖⵓⵛⵜ_ⵛⵓⵜⴰⵏⴱⵉⵔ_ⴽⵟⵓⴱⵕ_ⵏⵓⵡⴰⵏⴱⵉⵔ_ⴷⵓⵊⵏⴱⵉⵔ".split("_"),
            weekdays: "ⴰⵙⴰⵎⴰⵙ_ⴰⵢⵏⴰⵙ_ⴰⵙⵉⵏⴰⵙ_ⴰⴽⵔⴰⵙ_ⴰⴽⵡⴰⵙ_ⴰⵙⵉⵎⵡⴰⵙ_ⴰⵙⵉⴹⵢⴰⵙ".split("_"),
            weekdaysShort: "ⴰⵙⴰⵎⴰⵙ_ⴰⵢⵏⴰⵙ_ⴰⵙⵉⵏⴰⵙ_ⴰⴽⵔⴰⵙ_ⴰⴽⵡⴰⵙ_ⴰⵙⵉⵎⵡⴰⵙ_ⴰⵙⵉⴹⵢⴰⵙ".split("_"),
            weekdaysMin: "ⴰⵙⴰⵎⴰⵙ_ⴰⵢⵏⴰⵙ_ⴰⵙⵉⵏⴰⵙ_ⴰⴽⵔⴰⵙ_ⴰⴽⵡⴰⵙ_ⴰⵙⵉⵎⵡⴰⵙ_ⴰⵙⵉⴹⵢⴰⵙ".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[ⴰⵙⴷⵅ ⴴ] LT",
                nextDay: "[ⴰⵙⴽⴰ ⴴ] LT",
                nextWeek: "dddd [ⴴ] LT",
                lastDay: "[ⴰⵚⴰⵏⵜ ⴴ] LT",
                lastWeek: "dddd [ⴴ] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "ⴷⴰⴷⵅ ⵙ ⵢⴰⵏ %s",
                past: "ⵢⴰⵏ %s",
                s: "ⵉⵎⵉⴽ",
                ss: "%d ⵉⵎⵉⴽ",
                m: "ⵎⵉⵏⵓⴺ",
                mm: "%d ⵎⵉⵏⵓⴺ",
                h: "ⵙⴰⵄⴰ",
                hh: "%d ⵜⴰⵙⵙⴰⵄⵉⵏ",
                d: "ⴰⵙⵙ",
                dd: "%d oⵙⵙⴰⵏ",
                M: "ⴰⵢoⵓⵔ",
                MM: "%d ⵉⵢⵢⵉⵔⵏ",
                y: "ⴰⵙⴳⴰⵙ",
                yy: "%d ⵉⵙⴳⴰⵙⵏ"
            },
            week: {
                dow: 6,
                doy: 12
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("tzm-latn", {
            months: "innayr_brˤayrˤ_marˤsˤ_ibrir_mayyw_ywnyw_ywlywz_ɣwšt_šwtanbir_ktˤwbrˤ_nwwanbir_dwjnbir".split("_"),
            monthsShort: "innayr_brˤayrˤ_marˤsˤ_ibrir_mayyw_ywnyw_ywlywz_ɣwšt_šwtanbir_ktˤwbrˤ_nwwanbir_dwjnbir".split("_"),
            weekdays: "asamas_aynas_asinas_akras_akwas_asimwas_asiḍyas".split("_"),
            weekdaysShort: "asamas_aynas_asinas_akras_akwas_asimwas_asiḍyas".split("_"),
            weekdaysMin: "asamas_aynas_asinas_akras_akwas_asimwas_asiḍyas".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[asdkh g] LT",
                nextDay: "[aska g] LT",
                nextWeek: "dddd [g] LT",
                lastDay: "[assant g] LT",
                lastWeek: "dddd [g] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "dadkh s yan %s",
                past: "yan %s",
                s: "imik",
                ss: "%d imik",
                m: "minuḍ",
                mm: "%d minuḍ",
                h: "saɛa",
                hh: "%d tassaɛin",
                d: "ass",
                dd: "%d ossan",
                M: "ayowr",
                MM: "%d iyyirn",
                y: "asgas",
                yy: "%d isgasn"
            },
            week: {
                dow: 6,
                doy: 12
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("ug-cn", {
            months: "يانۋار_فېۋرال_مارت_ئاپرېل_ماي_ئىيۇن_ئىيۇل_ئاۋغۇست_سېنتەبىر_ئۆكتەبىر_نويابىر_دېكابىر".split("_"),
            monthsShort: "يانۋار_فېۋرال_مارت_ئاپرېل_ماي_ئىيۇن_ئىيۇل_ئاۋغۇست_سېنتەبىر_ئۆكتەبىر_نويابىر_دېكابىر".split("_"),
            weekdays: "يەكشەنبە_دۈشەنبە_سەيشەنبە_چارشەنبە_پەيشەنبە_جۈمە_شەنبە".split("_"),
            weekdaysShort: "يە_دۈ_سە_چا_پە_جۈ_شە".split("_"),
            weekdaysMin: "يە_دۈ_سە_چا_پە_جۈ_شە".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "YYYY-MM-DD",
                LL: "YYYY-يىلىM-ئاينىڭD-كۈنى",
                LLL: "YYYY-يىلىM-ئاينىڭD-كۈنى، HH:mm",
                LLLL: "dddd، YYYY-يىلىM-ئاينىڭD-كۈنى، HH:mm"
            },
            meridiemParse: /يېرىم كېچە|سەھەر|چۈشتىن بۇرۇن|چۈش|چۈشتىن كېيىن|كەچ/,
            meridiemHour: function(e, t) {
                return 12 === e && (e = 0),
                "يېرىم كېچە" === t || "سەھەر" === t || "چۈشتىن بۇرۇن" === t ? e : "چۈشتىن كېيىن" === t || "كەچ" === t ? e + 12 : e >= 11 ? e : e + 12
            },
            meridiem: function(e, t, a) {
                var n = 100 * e + t;
                return n < 600 ? "يېرىم كېچە" : n < 900 ? "سەھەر" : n < 1130 ? "چۈشتىن بۇرۇن" : n < 1230 ? "چۈش" : n < 1800 ? "چۈشتىن كېيىن" : "كەچ"
            },
            calendar: {
                sameDay: "[بۈگۈن سائەت] LT",
                nextDay: "[ئەتە سائەت] LT",
                nextWeek: "[كېلەركى] dddd [سائەت] LT",
                lastDay: "[تۆنۈگۈن] LT",
                lastWeek: "[ئالدىنقى] dddd [سائەت] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%s كېيىن",
                past: "%s بۇرۇن",
                s: "نەچچە سېكونت",
                ss: "%d سېكونت",
                m: "بىر مىنۇت",
                mm: "%d مىنۇت",
                h: "بىر سائەت",
                hh: "%d سائەت",
                d: "بىر كۈن",
                dd: "%d كۈن",
                M: "بىر ئاي",
                MM: "%d ئاي",
                y: "بىر يىل",
                yy: "%d يىل"
            },
            dayOfMonthOrdinalParse: /\d{1,2}(-كۈنى|-ئاي|-ھەپتە)/,
            ordinal: function(e, t) {
                switch (t) {
                case "d":
                case "D":
                case "DDD":
                    return e + "-كۈنى";
                case "w":
                case "W":
                    return e + "-ھەپتە";
                default:
                    return e
                }
            },
            preparse: function(e) {
                return e.replace(/،/g, ",")
            },
            postformat: function(e) {
                return e.replace(/,/g, "،")
            },
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        function t(e, t, a) {
            var n = {
                ss: t ? "секунда_секунди_секунд" : "секунду_секунди_секунд",
                mm: t ? "хвилина_хвилини_хвилин" : "хвилину_хвилини_хвилин",
                hh: t ? "година_години_годин" : "годину_години_годин",
                dd: "день_дні_днів",
                MM: "місяць_місяці_місяців",
                yy: "рік_роки_років"
            };
            return "m" === a ? t ? "хвилина" : "хвилину" : "h" === a ? t ? "година" : "годину" : e + " " + function(e, t) {
                var a = e.split("_");
                return t % 10 == 1 && t % 100 != 11 ? a[0] : t % 10 >= 2 && t % 10 <= 4 && (t % 100 < 10 || t % 100 >= 20) ? a[1] : a[2]
            }(n[a], +e)
        }
        function a(e) {
            return function() {
                return e + "о" + (11 === this.hours() ? "б" : "") + "] LT"
            }
        }
        e.defineLocale("uk", {
            months: {
                format: "січня_лютого_березня_квітня_травня_червня_липня_серпня_вересня_жовтня_листопада_грудня".split("_"),
                standalone: "січень_лютий_березень_квітень_травень_червень_липень_серпень_вересень_жовтень_листопад_грудень".split("_")
            },
            monthsShort: "січ_лют_бер_квіт_трав_черв_лип_серп_вер_жовт_лист_груд".split("_"),
            weekdays: function(e, t) {
                var a = {
                    nominative: "неділя_понеділок_вівторок_середа_четвер_п’ятниця_субота".split("_"),
                    accusative: "неділю_понеділок_вівторок_середу_четвер_п’ятницю_суботу".split("_"),
                    genitive: "неділі_понеділка_вівторка_середи_четверга_п’ятниці_суботи".split("_")
                };
                if (!e)
                    return a.nominative;
                var n = /(\[[ВвУу]\]) ?dddd/.test(t) ? "accusative" : /\[?(?:минулої|наступної)? ?\] ?dddd/.test(t) ? "genitive" : "nominative";
                return a[n][e.day()]
            },
            weekdaysShort: "нд_пн_вт_ср_чт_пт_сб".split("_"),
            weekdaysMin: "нд_пн_вт_ср_чт_пт_сб".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD.MM.YYYY",
                LL: "D MMMM YYYY р.",
                LLL: "D MMMM YYYY р., HH:mm",
                LLLL: "dddd, D MMMM YYYY р., HH:mm"
            },
            calendar: {
                sameDay: a("[Сьогодні "),
                nextDay: a("[Завтра "),
                lastDay: a("[Вчора "),
                nextWeek: a("[У] dddd ["),
                lastWeek: function() {
                    switch (this.day()) {
                    case 0:
                    case 3:
                    case 5:
                    case 6:
                        return a("[Минулої] dddd [").call(this);
                    case 1:
                    case 2:
                    case 4:
                        return a("[Минулого] dddd [").call(this)
                    }
                },
                sameElse: "L"
            },
            relativeTime: {
                future: "за %s",
                past: "%s тому",
                s: "декілька секунд",
                ss: t,
                m: t,
                mm: t,
                h: "годину",
                hh: t,
                d: "день",
                dd: t,
                M: "місяць",
                MM: t,
                y: "рік",
                yy: t
            },
            meridiemParse: /ночі|ранку|дня|вечора/,
            isPM: function(e) {
                return /^(дня|вечора)$/.test(e)
            },
            meridiem: function(e, t, a) {
                return e < 4 ? "ночі" : e < 12 ? "ранку" : e < 17 ? "дня" : "вечора"
            },
            dayOfMonthOrdinalParse: /\d{1,2}-(й|го)/,
            ordinal: function(e, t) {
                switch (t) {
                case "M":
                case "d":
                case "DDD":
                case "w":
                case "W":
                    return e + "-й";
                case "D":
                    return e + "-го";
                default:
                    return e
                }
            },
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        var t = ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"]
          , a = ["اتوار", "پیر", "منگل", "بدھ", "جمعرات", "جمعہ", "ہفتہ"];
        e.defineLocale("ur", {
            months: t,
            monthsShort: t,
            weekdays: a,
            weekdaysShort: a,
            weekdaysMin: a,
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd، D MMMM YYYY HH:mm"
            },
            meridiemParse: /صبح|شام/,
            isPM: function(e) {
                return "شام" === e
            },
            meridiem: function(e, t, a) {
                return e < 12 ? "صبح" : "شام"
            },
            calendar: {
                sameDay: "[آج بوقت] LT",
                nextDay: "[کل بوقت] LT",
                nextWeek: "dddd [بوقت] LT",
                lastDay: "[گذشتہ روز بوقت] LT",
                lastWeek: "[گذشتہ] dddd [بوقت] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%s بعد",
                past: "%s قبل",
                s: "چند سیکنڈ",
                ss: "%d سیکنڈ",
                m: "ایک منٹ",
                mm: "%d منٹ",
                h: "ایک گھنٹہ",
                hh: "%d گھنٹے",
                d: "ایک دن",
                dd: "%d دن",
                M: "ایک ماہ",
                MM: "%d ماہ",
                y: "ایک سال",
                yy: "%d سال"
            },
            preparse: function(e) {
                return e.replace(/،/g, ",")
            },
            postformat: function(e) {
                return e.replace(/,/g, "،")
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("uz", {
            months: "январ_феврал_март_апрел_май_июн_июл_август_сентябр_октябр_ноябр_декабр".split("_"),
            monthsShort: "янв_фев_мар_апр_май_июн_июл_авг_сен_окт_ноя_дек".split("_"),
            weekdays: "Якшанба_Душанба_Сешанба_Чоршанба_Пайшанба_Жума_Шанба".split("_"),
            weekdaysShort: "Якш_Душ_Сеш_Чор_Пай_Жум_Шан".split("_"),
            weekdaysMin: "Як_Ду_Се_Чо_Па_Жу_Ша".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "D MMMM YYYY, dddd HH:mm"
            },
            calendar: {
                sameDay: "[Бугун соат] LT [да]",
                nextDay: "[Эртага] LT [да]",
                nextWeek: "dddd [куни соат] LT [да]",
                lastDay: "[Кеча соат] LT [да]",
                lastWeek: "[Утган] dddd [куни соат] LT [да]",
                sameElse: "L"
            },
            relativeTime: {
                future: "Якин %s ичида",
                past: "Бир неча %s олдин",
                s: "фурсат",
                ss: "%d фурсат",
                m: "бир дакика",
                mm: "%d дакика",
                h: "бир соат",
                hh: "%d соат",
                d: "бир кун",
                dd: "%d кун",
                M: "бир ой",
                MM: "%d ой",
                y: "бир йил",
                yy: "%d йил"
            },
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("uz-latn", {
            months: "Yanvar_Fevral_Mart_Aprel_May_Iyun_Iyul_Avgust_Sentabr_Oktabr_Noyabr_Dekabr".split("_"),
            monthsShort: "Yan_Fev_Mar_Apr_May_Iyun_Iyul_Avg_Sen_Okt_Noy_Dek".split("_"),
            weekdays: "Yakshanba_Dushanba_Seshanba_Chorshanba_Payshanba_Juma_Shanba".split("_"),
            weekdaysShort: "Yak_Dush_Sesh_Chor_Pay_Jum_Shan".split("_"),
            weekdaysMin: "Ya_Du_Se_Cho_Pa_Ju_Sha".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "D MMMM YYYY, dddd HH:mm"
            },
            calendar: {
                sameDay: "[Bugun soat] LT [da]",
                nextDay: "[Ertaga] LT [da]",
                nextWeek: "dddd [kuni soat] LT [da]",
                lastDay: "[Kecha soat] LT [da]",
                lastWeek: "[O'tgan] dddd [kuni soat] LT [da]",
                sameElse: "L"
            },
            relativeTime: {
                future: "Yaqin %s ichida",
                past: "Bir necha %s oldin",
                s: "soniya",
                ss: "%d soniya",
                m: "bir daqiqa",
                mm: "%d daqiqa",
                h: "bir soat",
                hh: "%d soat",
                d: "bir kun",
                dd: "%d kun",
                M: "bir oy",
                MM: "%d oy",
                y: "bir yil",
                yy: "%d yil"
            },
            week: {
                dow: 1,
                doy: 7
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("vi", {
            months: "tháng 1_tháng 2_tháng 3_tháng 4_tháng 5_tháng 6_tháng 7_tháng 8_tháng 9_tháng 10_tháng 11_tháng 12".split("_"),
            monthsShort: "Th01_Th02_Th03_Th04_Th05_Th06_Th07_Th08_Th09_Th10_Th11_Th12".split("_"),
            monthsParseExact: !0,
            weekdays: "chủ nhật_thứ hai_thứ ba_thứ tư_thứ năm_thứ sáu_thứ bảy".split("_"),
            weekdaysShort: "CN_T2_T3_T4_T5_T6_T7".split("_"),
            weekdaysMin: "CN_T2_T3_T4_T5_T6_T7".split("_"),
            weekdaysParseExact: !0,
            meridiemParse: /sa|ch/i,
            isPM: function(e) {
                return /^ch$/i.test(e)
            },
            meridiem: function(e, t, a) {
                return e < 12 ? a ? "sa" : "SA" : a ? "ch" : "CH"
            },
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "DD/MM/YYYY",
                LL: "D MMMM [năm] YYYY",
                LLL: "D MMMM [năm] YYYY HH:mm",
                LLLL: "dddd, D MMMM [năm] YYYY HH:mm",
                l: "DD/M/YYYY",
                ll: "D MMM YYYY",
                lll: "D MMM YYYY HH:mm",
                llll: "ddd, D MMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[Hôm nay lúc] LT",
                nextDay: "[Ngày mai lúc] LT",
                nextWeek: "dddd [tuần tới lúc] LT",
                lastDay: "[Hôm qua lúc] LT",
                lastWeek: "dddd [tuần rồi lúc] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "%s tới",
                past: "%s trước",
                s: "vài giây",
                ss: "%d giây",
                m: "một phút",
                mm: "%d phút",
                h: "một giờ",
                hh: "%d giờ",
                d: "một ngày",
                dd: "%d ngày",
                M: "một tháng",
                MM: "%d tháng",
                y: "một năm",
                yy: "%d năm"
            },
            dayOfMonthOrdinalParse: /\d{1,2}/,
            ordinal: function(e) {
                return e
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("x-pseudo", {
            months: "J~áñúá~rý_F~ébrú~árý_~Márc~h_Áp~ríl_~Máý_~Júñé~_Júl~ý_Áú~gúst~_Sép~témb~ér_Ó~ctób~ér_Ñ~óvém~bér_~Décé~mbér".split("_"),
            monthsShort: "J~áñ_~Féb_~Már_~Ápr_~Máý_~Júñ_~Júl_~Áúg_~Sép_~Óct_~Ñóv_~Déc".split("_"),
            monthsParseExact: !0,
            weekdays: "S~úñdá~ý_Mó~ñdáý~_Túé~sdáý~_Wéd~ñésd~áý_T~húrs~dáý_~Fríd~áý_S~átúr~dáý".split("_"),
            weekdaysShort: "S~úñ_~Móñ_~Túé_~Wéd_~Thú_~Frí_~Sát".split("_"),
            weekdaysMin: "S~ú_Mó~_Tú_~Wé_T~h_Fr~_Sá".split("_"),
            weekdaysParseExact: !0,
            longDateFormat: {
                LT: "HH:mm",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY HH:mm",
                LLLL: "dddd, D MMMM YYYY HH:mm"
            },
            calendar: {
                sameDay: "[T~ódá~ý át] LT",
                nextDay: "[T~ómó~rró~w át] LT",
                nextWeek: "dddd [át] LT",
                lastDay: "[Ý~ést~érdá~ý át] LT",
                lastWeek: "[L~ást] dddd [át] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "í~ñ %s",
                past: "%s á~gó",
                s: "á ~féw ~sécó~ñds",
                ss: "%d s~écóñ~ds",
                m: "á ~míñ~úté",
                mm: "%d m~íñú~tés",
                h: "á~ñ hó~úr",
                hh: "%d h~óúrs",
                d: "á ~dáý",
                dd: "%d d~áýs",
                M: "á ~móñ~th",
                MM: "%d m~óñt~hs",
                y: "á ~ýéár",
                yy: "%d ý~éárs"
            },
            dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
            ordinal: function(e) {
                var t = e % 10
                  , a = 1 == ~~(e % 100 / 10) ? "th" : 1 === t ? "st" : 2 === t ? "nd" : 3 === t ? "rd" : "th";
                return e + a
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("yo", {
            months: "Sẹ́rẹ́_Èrèlè_Ẹrẹ̀nà_Ìgbé_Èbibi_Òkùdu_Agẹmo_Ògún_Owewe_Ọ̀wàrà_Bélú_Ọ̀pẹ̀̀".split("_"),
            monthsShort: "Sẹ́r_Èrl_Ẹrn_Ìgb_Èbi_Òkù_Agẹ_Ògú_Owe_Ọ̀wà_Bél_Ọ̀pẹ̀̀".split("_"),
            weekdays: "Àìkú_Ajé_Ìsẹ́gun_Ọjọ́rú_Ọjọ́bọ_Ẹtì_Àbámẹ́ta".split("_"),
            weekdaysShort: "Àìk_Ajé_Ìsẹ́_Ọjr_Ọjb_Ẹtì_Àbá".split("_"),
            weekdaysMin: "Àì_Aj_Ìs_Ọr_Ọb_Ẹt_Àb".split("_"),
            longDateFormat: {
                LT: "h:mm A",
                LTS: "h:mm:ss A",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY h:mm A",
                LLLL: "dddd, D MMMM YYYY h:mm A"
            },
            calendar: {
                sameDay: "[Ònì ni] LT",
                nextDay: "[Ọ̀la ni] LT",
                nextWeek: "dddd [Ọsẹ̀ tón'bọ] [ni] LT",
                lastDay: "[Àna ni] LT",
                lastWeek: "dddd [Ọsẹ̀ tólọ́] [ni] LT",
                sameElse: "L"
            },
            relativeTime: {
                future: "ní %s",
                past: "%s kọjá",
                s: "ìsẹjú aayá die",
                ss: "aayá %d",
                m: "ìsẹjú kan",
                mm: "ìsẹjú %d",
                h: "wákati kan",
                hh: "wákati %d",
                d: "ọjọ́ kan",
                dd: "ọjọ́ %d",
                M: "osù kan",
                MM: "osù %d",
                y: "ọdún kan",
                yy: "ọdún %d"
            },
            dayOfMonthOrdinalParse: /ọjọ́\s\d{1,2}/,
            ordinal: "ọjọ́ %d",
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("zh-cn", {
            months: "一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月".split("_"),
            monthsShort: "1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"),
            weekdays: "星期日_星期一_星期二_星期三_星期四_星期五_星期六".split("_"),
            weekdaysShort: "周日_周一_周二_周三_周四_周五_周六".split("_"),
            weekdaysMin: "日_一_二_三_四_五_六".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "YYYY/MM/DD",
                LL: "YYYY年M月D日",
                LLL: "YYYY年M月D日Ah点mm分",
                LLLL: "YYYY年M月D日ddddAh点mm分",
                l: "YYYY/M/D",
                ll: "YYYY年M月D日",
                lll: "YYYY年M月D日 HH:mm",
                llll: "YYYY年M月D日dddd HH:mm"
            },
            meridiemParse: /凌晨|早上|上午|中午|下午|晚上/,
            meridiemHour: function(e, t) {
                return 12 === e && (e = 0),
                "凌晨" === t || "早上" === t || "上午" === t ? e : "下午" === t || "晚上" === t ? e + 12 : e >= 11 ? e : e + 12
            },
            meridiem: function(e, t, a) {
                var n = 100 * e + t;
                return n < 600 ? "凌晨" : n < 900 ? "早上" : n < 1130 ? "上午" : n < 1230 ? "中午" : n < 1800 ? "下午" : "晚上"
            },
            calendar: {
                sameDay: "[今天]LT",
                nextDay: "[明天]LT",
                nextWeek: "[下]ddddLT",
                lastDay: "[昨天]LT",
                lastWeek: "[上]ddddLT",
                sameElse: "L"
            },
            dayOfMonthOrdinalParse: /\d{1,2}(日|月|周)/,
            ordinal: function(e, t) {
                switch (t) {
                case "d":
                case "D":
                case "DDD":
                    return e + "日";
                case "M":
                    return e + "月";
                case "w":
                case "W":
                    return e + "周";
                default:
                    return e
                }
            },
            relativeTime: {
                future: "%s内",
                past: "%s前",
                s: "几秒",
                ss: "%d 秒",
                m: "1 分钟",
                mm: "%d 分钟",
                h: "1 小时",
                hh: "%d 小时",
                d: "1 天",
                dd: "%d 天",
                M: "1 个月",
                MM: "%d 个月",
                y: "1 年",
                yy: "%d 年"
            },
            week: {
                dow: 1,
                doy: 4
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("zh-hk", {
            months: "一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月".split("_"),
            monthsShort: "1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"),
            weekdays: "星期日_星期一_星期二_星期三_星期四_星期五_星期六".split("_"),
            weekdaysShort: "週日_週一_週二_週三_週四_週五_週六".split("_"),
            weekdaysMin: "日_一_二_三_四_五_六".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "YYYY/MM/DD",
                LL: "YYYY年M月D日",
                LLL: "YYYY年M月D日 HH:mm",
                LLLL: "YYYY年M月D日dddd HH:mm",
                l: "YYYY/M/D",
                ll: "YYYY年M月D日",
                lll: "YYYY年M月D日 HH:mm",
                llll: "YYYY年M月D日dddd HH:mm"
            },
            meridiemParse: /凌晨|早上|上午|中午|下午|晚上/,
            meridiemHour: function(e, t) {
                return 12 === e && (e = 0),
                "凌晨" === t || "早上" === t || "上午" === t ? e : "中午" === t ? e >= 11 ? e : e + 12 : "下午" === t || "晚上" === t ? e + 12 : void 0
            },
            meridiem: function(e, t, a) {
                var n = 100 * e + t;
                return n < 600 ? "凌晨" : n < 900 ? "早上" : n < 1130 ? "上午" : n < 1230 ? "中午" : n < 1800 ? "下午" : "晚上"
            },
            calendar: {
                sameDay: "[今天]LT",
                nextDay: "[明天]LT",
                nextWeek: "[下]ddddLT",
                lastDay: "[昨天]LT",
                lastWeek: "[上]ddddLT",
                sameElse: "L"
            },
            dayOfMonthOrdinalParse: /\d{1,2}(日|月|週)/,
            ordinal: function(e, t) {
                switch (t) {
                case "d":
                case "D":
                case "DDD":
                    return e + "日";
                case "M":
                    return e + "月";
                case "w":
                case "W":
                    return e + "週";
                default:
                    return e
                }
            },
            relativeTime: {
                future: "%s內",
                past: "%s前",
                s: "幾秒",
                ss: "%d 秒",
                m: "1 分鐘",
                mm: "%d 分鐘",
                h: "1 小時",
                hh: "%d 小時",
                d: "1 天",
                dd: "%d 天",
                M: "1 個月",
                MM: "%d 個月",
                y: "1 年",
                yy: "%d 年"
            }
        })
    }(a(0))
}
, function(e, t, a) {
    !function(e) {
        "use strict";
        e.defineLocale("zh-tw", {
            months: "一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月".split("_"),
            monthsShort: "1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"),
            weekdays: "星期日_星期一_星期二_星期三_星期四_星期五_星期六".split("_"),
            weekdaysShort: "週日_週一_週二_週三_週四_週五_週六".split("_"),
            weekdaysMin: "日_一_二_三_四_五_六".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                LTS: "HH:mm:ss",
                L: "YYYY/MM/DD",
                LL: "YYYY年M月D日",
                LLL: "YYYY年M月D日 HH:mm",
                LLLL: "YYYY年M月D日dddd HH:mm",
                l: "YYYY/M/D",
                ll: "YYYY年M月D日",
                lll: "YYYY年M月D日 HH:mm",
                llll: "YYYY年M月D日dddd HH:mm"
            },
            meridiemParse: /凌晨|早上|上午|中午|下午|晚上/,
            meridiemHour: function(e, t) {
                return 12 === e && (e = 0),
                "凌晨" === t || "早上" === t || "上午" === t ? e : "中午" === t ? e >= 11 ? e : e + 12 : "下午" === t || "晚上" === t ? e + 12 : void 0
            },
            meridiem: function(e, t, a) {
                var n = 100 * e + t;
                return n < 600 ? "凌晨" : n < 900 ? "早上" : n < 1130 ? "上午" : n < 1230 ? "中午" : n < 1800 ? "下午" : "晚上"
            },
            calendar: {
                sameDay: "[今天] LT",
                nextDay: "[明天] LT",
                nextWeek: "[下]dddd LT",
                lastDay: "[昨天] LT",
                lastWeek: "[上]dddd LT",
                sameElse: "L"
            },
            dayOfMonthOrdinalParse: /\d{1,2}(日|月|週)/,
            ordinal: function(e, t) {
                switch (t) {
                case "d":
                case "D":
                case "DDD":
                    return e + "日";
                case "M":
                    return e + "月";
                case "w":
                case "W":
                    return e + "週";
                default:
                    return e
                }
            },
            relativeTime: {
                future: "%s內",
                past: "%s前",
                s: "幾秒",
                ss: "%d 秒",
                m: "1 分鐘",
                mm: "%d 分鐘",
                h: "1 小時",
                hh: "%d 小時",
                d: "1 天",
                dd: "%d 天",
                M: "1 個月",
                MM: "%d 個月",
                y: "1 年",
                yy: "%d 年"
            }
        })
    }(a(0))
}
, function(e, t, a) {
    e.exports = W;
    var n = a(0)
      , s = /(\[[^\[]*\])|(\\)?j(Mo|MM?M?M?|Do|DDDo|DD?D?D?|w[o|w]?|YYYYY|YYYY|YY|gg(ggg?)?|)|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|SS?S?|X|zz?|ZZ?|.)/g
      , r = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g
      , i = /\d\d?/
      , d = /\d{1,3}/
      , _ = /\d{3}/
      , o = /\d{1,4}/
      , u = /[+\-]?\d{1,6}/
      , m = /[0-9]*["a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i
      , l = /Z|[\+\-]\d\d:?\d\d/i
      , c = /T/i
      , h = /[\+\-]?\d+(\.\d{1,3})?/
      , M = {
        jm: "jmonth",
        jmonths: "jmonth",
        jy: "jyear",
        jyears: "jyear"
    }
      , L = {}
      , Y = "DDD w M D".split(" ")
      , y = "M D w".split(" ")
      , f = {
        jM: function() {
            return this.jMonth() + 1
        },
        jMMM: function(e) {
            return this.localeData().jMonthsShort(this, e)
        },
        jMMMM: function(e) {
            return this.localeData().jMonths(this, e)
        },
        jD: function() {
            return this.jDate()
        },
        jDDD: function() {
            return this.jDayOfYear()
        },
        jw: function() {
            return this.jWeek()
        },
        jYY: function() {
            return T(this.jYear() % 100, 2)
        },
        jYYYY: function() {
            return T(this.jYear(), 4)
        },
        jYYYYY: function() {
            return T(this.jYear(), 5)
        },
        jgg: function() {
            return T(this.jWeekYear() % 100, 2)
        },
        jgggg: function() {
            return this.jWeekYear()
        },
        jggggg: function() {
            return T(this.jWeekYear(), 5)
        }
    };
    function p(e, t) {
        return function(a) {
            return T(e.call(this, a), t)
        }
    }
    function D(e, t) {
        return function(a) {
            return this.localeData().ordinal(e.call(this, a), t)
        }
    }
    function k(e, t) {
        var a;
        for (a in t)
            t.hasOwnProperty(a) && (e[a] = t[a]);
        return e
    }
    function T(e, t) {
        for (var a = e + ""; a.length < t; )
            a = "0" + a;
        return a
    }
    function g(e) {
        for (var t = 0; t < e.length; t++)
            (!t || "j" !== e[t - 1] && e[t - 1] !== e[t]) && ("Y" !== e[t] && "M" !== e[t] && "D" !== e[t] && "g" !== e[t] || (e = e.slice(0, t) + "j" + e.slice(t)));
        return e
    }
    function w(e, t) {
        if (F(t) && (e = function(e) {
            switch (e) {
            case "year":
                return "jYear";
            case "month":
                return "jMonth";
            case "months":
                return "jMonths";
            case "monthName":
            case "monthsShort":
                return "jMonthsShort"
            }
            return e
        }(e)),
        e) {
            var a = e.toLowerCase();
            e = M[a] || a
        }
        return "jday" === e ? e = "day" : "jd" === e && (e = "d"),
        e
    }
    function v(e, t, a, n) {
        var s = e._d;
        e._isUTC ? e._d = new Date(Date.UTC(t, a, n, s.getUTCHours(), s.getUTCMinutes(), s.getUTCSeconds(), s.getUTCMilliseconds())) : e._d = new Date(t,a,n,s.getHours(),s.getMinutes(),s.getSeconds(),s.getMilliseconds())
    }
    function j(e) {
        function t() {}
        return t.prototype = e,
        new t
    }
    function S(e, t) {
        switch (e) {
        case "jDDDD":
            return _;
        case "jYYYY":
            return o;
        case "jYYYYY":
            return u;
        case "jDDD":
            return d;
        case "jMMM":
        case "jMMMM":
            return m;
        case "jMM":
        case "jDD":
        case "jYY":
        case "jM":
        case "jD":
            return i;
        case "DDDD":
            return _;
        case "YYYY":
            return o;
        case "YYYYY":
            return u;
        case "S":
        case "SS":
        case "SSS":
        case "DDD":
            return d;
        case "MMM":
        case "MMMM":
        case "dd":
        case "ddd":
        case "dddd":
            return m;
        case "a":
        case "A":
            return n.localeData(t._l)._meridiemParse;
        case "X":
            return h;
        case "Z":
        case "ZZ":
            return l;
        case "T":
            return c;
        case "MM":
        case "DD":
        case "YY":
        case "HH":
        case "hh":
        case "mm":
        case "ss":
        case "M":
        case "D":
        case "d":
        case "H":
        case "h":
        case "m":
        case "s":
            return i;
        default:
            return new RegExp(e.replace("\\", ""))
        }
    }
    function H(e) {
        return null === e || void 0 === e
    }
    function b(e, t, a) {
        var s, r = a._a;
        switch (e) {
        case "jM":
        case "jMM":
            r[1] = H(t) ? 0 : ~~t - 1;
            break;
        case "jMMM":
        case "jMMMM":
            H(s = n.localeData(a._l).jMonthsParse(t)) ? a._isValid = !1 : r[1] = s;
            break;
        case "jD":
        case "jDD":
        case "jDDD":
        case "jDDDD":
            H(t) || (r[2] = ~~t);
            break;
        case "jYY":
            r[0] = ~~t + (~~t > 47 ? 1300 : 1400);
            break;
        case "jYYYY":
        case "jYYYYY":
            r[0] = ~~t
        }
        H(t) && (a._isValid = !1)
    }
    function x(e) {
        var t, a, n, r = e._f.match(s), i = e._i + "", d = r.length;
        for (e._a = [],
        t = 0; t < d; t += 1)
            (n = (S(a = r[t], e).exec(i) || [])[0]) && (i = i.slice(i.indexOf(n) + n.length)),
            f[a] && b(a, n, e);
        return i && (e._il = i),
        function(e) {
            var t, a, n = e._a[0], s = e._a[1], r = e._a[2];
            return H(n) && H(s) && H(r) ? [0, 0, 1] : (n = H(n) ? 0 : n,
            s = H(s) ? 0 : s,
            ((r = H(r) ? 1 : r) < 1 || r > W.jDaysInMonth(n, s) || s < 0 || s > 11) && (e._isValid = !1),
            a = z((t = J(n, s, r)).gy, t.gm, t.gd),
            e._jDiff = 0,
            ~~a.jy !== n && (e._jDiff += 1),
            ~~a.jm !== s && (e._jDiff += 1),
            ~~a.jd !== r && (e._jDiff += 1),
            [t.gy, t.gm, t.gd])
        }(e)
    }
    function O(e, t, a) {
        var n, s = a - t, r = a - e.day();
        return r > s && (r -= 7),
        r < s - 7 && (r += 7),
        n = W(e).add(r, "d"),
        {
            week: Math.ceil(n.jDayOfYear() / 7),
            year: n.jYear()
        }
    }
    function P(e, t, a, r, i) {
        "boolean" == typeof a && (i = r,
        r = a,
        a = void 0);
        var d = F(this);
        e && "string" == typeof e && !t && d && (e = e.replace(/\//g, "-"),
        /\d{4}\-\d{2}\-\d{2}/.test(e) ? t = "jYYYY-jMM-jDD" : /\d{4}\-\d{2}\-\d{1}/.test(e) ? t = "jYYYY-jMM-jD" : /\d{4}\-\d{1}\-\d{1}/.test(e) ? t = "jYYYY-jM-jD" : /\d{4}\-\d{1}\-\d{2}/.test(e) ? t = "jYYYY-jM-jDD" : /\d{4}\-W\d{2}\-\d{2}/.test(e) ? t = "jYYYY-jW-jDD" : /\d{4}\-\d{3}/.test(e) ? t = "jYYYY-jDDD" : /\d{8}/.test(e) ? t = "jYYYYjMMjDD" : /\d{4}W\d{2}\d{1}/.test(e) ? t = "jYYYYjWWjD" : /\d{4}W\d{2}/.test(e) ? t = "jYYYYjWW" : /\d{4}\d{3}/.test(e) && (t = "jYYYYjDDD")),
        t && d && (t = g(t)),
        t && "string" == typeof t && (t = E(t, n));
        var _, o, u, m = {
            _i: e,
            _f: t,
            _l: a,
            _strict: r,
            _isUTC: i
        }, l = e, c = t;
        if (t) {
            if (function(e) {
                return "[object Array]" === Object.prototype.toString.call(e)
            }(t))
                return function(e, t) {
                    var a, n, s, r, i, d, _ = e._f.length;
                    if (0 === _)
                        return P(new Date(NaN));
                    for (a = 0; a < _; a += 1)
                        n = e._f[a],
                        i = 0,
                        (s = P(e._i, n, e._l, e._strict, t)).isValid() && (i += s._jDiff,
                        s._il && (i += s._il.length),
                        (H(d) || i < d) && (d = i,
                        r = s));
                    return r
                }(m, i);
            _ = x(m),
            function(e) {
                var t, a, n, r = e._i + "", i = "", d = "", _ = e._f.match(s), o = _.length;
                for (t = 0; t < o; t += 1)
                    (n = (S(a = _[t], e).exec(r) || [])[0]) && (r = r.slice(r.indexOf(n) + n.length)),
                    f[a]instanceof Function || (d += a,
                    n && (i += n));
                e._i = i,
                e._f = d
            }(m),
            t = "YYYY-MM-DD-" + m._f,
            e = T(_[0], 4) + "-" + T(_[1] + 1, 2) + "-" + T(_[2], 2) + "-" + m._i
        }
        return o = i ? n.utc(e, t, a, r) : n(e, t, a, r),
        (!1 === m._isValid || e && e._isAMomentObject && !e._isValid) && (o._isValid = !1),
        o._jDiff = m._jDiff || 0,
        k(u = j(W.fn), o),
        r && u.isValid() && (u._isValid = u.format(c) === l),
        e && e.calSystem && (u.calSystem = e.calSystem),
        u
    }
    function W(e, t, a, n) {
        return P(e, t, a, n, !1)
    }
    function E(e, t) {
        for (var a = 5, n = function(e) {
            return t.localeData().longDateFormat(e) || e
        }; a > 0 && r.test(e); )
            a -= 1,
            e = e.replace(r, n);
        return e
    }
    function A(e) {
        var t = e._d;
        return e._isUTC ? z(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()) : z(t.getFullYear(), t.getMonth(), t.getDate())
    }
    function F(e) {
        return 1 === e.calSystem || n.justUseJalali && 2 !== e.calSystem
    }
    function z(e, t, a) {
        var n = function(e, t, a) {
            "[object Date]" === Object.prototype.toString.call(e) && (a = e.getDate(),
            t = e.getMonth() + 1,
            e = e.getFullYear());
            return function(e) {
                var t, a, n, s = G(e).gy, r = s - 621, i = R(r), d = U(s, 3, i.march);
                if ((n = e - d) >= 0) {
                    if (n <= 185)
                        return a = 1 + N(n, 31),
                        t = I(n, 31) + 1,
                        {
                            jy: r,
                            jm: a,
                            jd: t
                        };
                    n -= 186
                } else
                    r -= 1,
                    n += 179,
                    1 === i.leap && (n += 1);
                return a = 7 + N(n, 30),
                t = I(n, 30) + 1,
                {
                    jy: r,
                    jm: a,
                    jd: t
                }
            }(U(e, t, a))
        }(e, t + 1, a);
        return n.jm -= 1,
        n
    }
    function J(e, t, a) {
        var n = function(e, t, a) {
            return G(function(e, t, a) {
                var n = R(e);
                return U(n.gy, 3, n.march) + 31 * (t - 1) - N(t, 7) * (t - 7) + a - 1
            }(e, t, a))
        }(e, t + 1, a);
        return n.gm -= 1,
        n
    }
    function N(e, t) {
        return ~~(e / t)
    }
    function I(e, t) {
        return e - ~~(e / t) * t
    }
    function C(e) {
        return 0 === R(e).leap
    }
    function R(e) {
        var t, a, n, s, r, i, d = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178], _ = d.length, o = e + 621, u = -14, m = d[0];
        if (e < m || e >= d[_ - 1])
            throw new Error("Invalid Jalali year " + e);
        for (i = 1; i < _ && (a = (t = d[i]) - m,
        !(e < t)); i += 1)
            u = u + 8 * N(a, 33) + N(I(a, 33), 4),
            m = t;
        return u = u + 8 * N(r = e - m, 33) + N(I(r, 33) + 3, 4),
        4 === I(a, 33) && a - r == 4 && (u += 1),
        s = 20 + u - (N(o, 4) - N(3 * (N(o, 100) + 1), 4) - 150),
        a - r < 6 && (r = r - a + 33 * N(a + 4, 33)),
        -1 === (n = I(I(r + 1, 33) - 1, 4)) && (n = 4),
        {
            leap: n,
            gy: o,
            march: s
        }
    }
    function U(e, t, a) {
        var n = N(1461 * (e + N(t - 8, 6) + 100100), 4) + N(153 * I(t + 9, 12) + 2, 5) + a - 34840408;
        return n = n - N(3 * N(e + 100100 + N(t - 8, 6), 100), 4) + 752
    }
    function G(e) {
        var t, a, n, s;
        return n = N(I(a = 5 * N(I(t = (t = 4 * e + 139361631) + 4 * N(3 * N(4 * e + 183187720, 146097), 4) - 3908, 1461), 4) + 308, 153), 5) + 1,
        s = I(N(a, 153), 12) + 1,
        {
            gy: N(t, 1461) - 100100 + N(8 - s, 6),
            gm: s,
            gd: n
        }
    }
    !function() {
        for (var e; Y.length; )
            e = Y.pop(),
            f["j" + e + "o"] = D(f["j" + e], e);
        for (; y.length; )
            e = y.pop(),
            f["j" + e + e] = p(f["j" + e], 2);
        f.jDDDD = p(f.jDDD, 3)
    }(),
    k(function(e) {
        return Object.getPrototypeOf ? Object.getPrototypeOf(e) : "".__proto__ ? e.__proto__ : e.constructor.prototype
    }(n.localeData()), {
        _jMonths: ["Farvardin", "Ordibehesht", "Khordaad", "Tir", "Mordaad", "Shahrivar", "Mehr", "Aabaan", "Aazar", "Dey", "Bahman", "Esfand"],
        jMonths: function(e) {
            return e ? this._jMonths[e.jMonth()] : this._jMonths
        },
        _jMonthsShort: ["Far", "Ord", "Kho", "Tir", "Amo", "Sha", "Meh", "Aab", "Aaz", "Dey", "Bah", "Esf"],
        jMonthsShort: function(e) {
            return e ? this._jMonthsShort[e.jMonth()] : this._jMonthsShort
        },
        jMonthsParse: function(e) {
            var t, a, n;
            for (this._jMonthsParse || (this._jMonthsParse = []),
            t = 0; t < 12; t += 1)
                if (this._jMonthsParse[t] || (a = W([2e3, (2 + t) % 12, 25]),
                n = "^" + this.jMonths(a, "") + "|^" + this.jMonthsShort(a, ""),
                this._jMonthsParse[t] = new RegExp(n.replace(".", ""),"i")),
                this._jMonthsParse[t].test(e))
                    return t
        }
    }),
    k(W, n),
    W.fn = j(n.fn),
    W.utc = function(e, t, a, n) {
        return P(e, t, a, n, !0)
    }
    ,
    W.unix = function(e) {
        return P(1e3 * e)
    }
    ,
    W.fn.format = function(e) {
        return e && (F(this) && (e = g(e)),
        e = E(e, this),
        L[e] || (L[e] = function(e) {
            var t, a = e.match(s), n = a.length;
            for (t = 0; t < n; t += 1)
                f[a[t]] && (a[t] = f[a[t]]);
            return function(s) {
                var r = "";
                for (t = 0; t < n; t += 1)
                    r += a[t]instanceof Function ? "[" + a[t].call(s, e) + "]" : a[t];
                return r
            }
        }(e)),
        e = L[e](this)),
        n.fn.format.call(this, e)
    }
    ,
    W.fn.year = function(e) {
        return F(this) ? W.fn.jYear.call(this, e) : n.fn.year.call(this, e)
    }
    ,
    W.fn.jYear = function(e) {
        var t, a, s;
        return "number" == typeof e ? (a = A(this),
        t = Math.min(a.jd, W.jDaysInMonth(e, a.jm)),
        v(this, (s = J(e, a.jm, t)).gy, s.gm, s.gd),
        n.updateOffset(this),
        this) : A(this).jy
    }
    ,
    W.fn.month = function(e) {
        return F(this) ? W.fn.jMonth.call(this, e) : n.fn.month.call(this, e)
    }
    ,
    W.fn.jMonth = function(e) {
        var t, a, s;
        return H(e) ? A(this).jm : "string" == typeof e && "number" != typeof (e = this.localeData().jMonthsParse(e)) ? this : (a = A(this),
        t = Math.min(a.jd, W.jDaysInMonth(a.jy, e)),
        this.jYear(a.jy + N(e, 12)),
        (e = I(e, 12)) < 0 && (e += 12,
        this.jYear(this.jYear() - 1)),
        v(this, (s = J(this.jYear(), e, t)).gy, s.gm, s.gd),
        n.updateOffset(this),
        this)
    }
    ,
    W.fn.date = function(e) {
        return F(this) ? W.fn.jDate.call(this, e) : n.fn.date.call(this, e)
    }
    ,
    W.fn.jDate = function(e) {
        var t, a;
        return "number" == typeof e ? (v(this, (a = J((t = A(this)).jy, t.jm, e)).gy, a.gm, a.gd),
        n.updateOffset(this),
        this) : A(this).jd
    }
    ,
    W.fn.jDay = function(e) {
        return "number" == typeof e ? n.fn.day.call(this, e - 1) : (n.fn.day.call(this) + 1) % 7
    }
    ,
    W.fn.dayOfYear = function(e) {
        return F(this) ? W.fn.jDayOfYear.call(this, e) : n.fn.dayOfYear.call(this, e)
    }
    ,
    W.fn.jDayOfYear = function(e) {
        var t = Math.round((W(this).startOf("day") - W(this).startOf("jYear")) / 864e5) + 1;
        return H(e) ? t : this.add(e - t, "d")
    }
    ,
    W.fn.week = function(e) {
        return F(this) ? W.fn.jWeek.call(this, e) : n.fn.week.call(this, e)
    }
    ,
    W.fn.jWeek = function(e) {
        var t = O(this, 6, 12).week;
        return H(e) ? t : this.add(7 * (e - t), "d")
    }
    ,
    W.fn.weekYear = function(e) {
        return F(this) ? W.fn.jWeekYear.call(this, e) : n.fn.weekYear.call(this, e)
    }
    ,
    W.fn.jWeekYear = function(e) {
        var t = O(this, 6, 12).year;
        return H(e) ? t : this.add(e - t, "jyear")
    }
    ,
    W.fn.add = function(e, t) {
        var a;
        return H(t) || isNaN(+t) || (a = e,
        e = t,
        t = a),
        "jyear" === (t = w(t, this)) ? this.jYear(this.jYear() + e) : "jmonth" === t ? this.jMonth(this.jMonth() + e) : n.fn.add.call(this, e, t),
        this
    }
    ,
    W.fn.subtract = function(e, t) {
        var a;
        return H(t) || isNaN(+t) || (a = e,
        e = t,
        t = a),
        "jyear" === (t = w(t, this)) ? this.jYear(this.jYear() - e) : "jmonth" === t ? this.jMonth(this.jMonth() - e) : n.fn.subtract.call(this, e, t),
        this
    }
    ,
    W.fn.startOf = function(e) {
        return "jweek" === (e = w(e, this)) ? this.startOf("day").subtract(this.jDay(), "day") : "jyear" === e || "jmonth" === e ? ("jyear" === e && this.jMonth(0),
        this.jDate(1),
        this.hours(0),
        this.minutes(0),
        this.seconds(0),
        this.milliseconds(0),
        this) : n.fn.startOf.call(this, e)
    }
    ,
    W.fn.endOf = function(e) {
        return void 0 === (e = w(e, this)) || "milisecond" === e ? this : this.startOf(e).add(1, "isoweek" === e ? "week" : e).subtract(1, "ms")
    }
    ,
    W.fn.isSame = function(e, t) {
        return "jyear" === (t = w(t, this)) || "jmonth" === t ? n.fn.isSame.call(this.clone().startOf(t), e.clone().startOf(t)) : n.fn.isSame.call(this, e, t)
    }
    ,
    W.fn.isBefore = function(e, t) {
        return "jyear" === (t = w(t, this)) || "jmonth" === t ? n.fn.isBefore.call(this.clone().startOf(t), e.clone().startOf(t)) : n.fn.isBefore.call(this, e, t)
    }
    ,
    W.fn.isAfter = function(e, t) {
        return "jyear" === (t = w(t, this)) || "jmonth" === t ? n.fn.isAfter.call(this.clone().startOf(t), e.clone().startOf(t)) : n.fn.isAfter.call(this, e, t)
    }
    ,
    W.fn.clone = function() {
        return W(this)
    }
    ,
    W.fn.doAsJalali = function() {
        return this.calSystem = 1,
        this
    }
    ,
    W.fn.doAsGregorian = function() {
        return this.calSystem = 2,
        this
    }
    ,
    W.fn.jYears = W.fn.jYear,
    W.fn.jMonths = W.fn.jMonth,
    W.fn.jDates = W.fn.jDate,
    W.fn.jWeeks = W.fn.jWeek,
    W.fn.daysInMonth = function() {
        return F(this) ? this.jDaysInMonth() : n.fn.daysInMonth.call(this)
    }
    ,
    W.fn.jDaysInMonth = function() {
        var e = this.jMonth()
          , t = this.jYear();
        return e < 6 ? 31 : e < 11 ? 30 : W.jIsLeapYear(t) ? 30 : 29
    }
    ,
    W.fn.isLeapYear = function() {
        return F(this) ? this.jIsLeapYear() : n.fn.isLeapYear.call(this)
    }
    ,
    W.fn.jIsLeapYear = function() {
        return C(this.jYear())
    }
    ,
    W.fn.locale = function(e) {
        return e && n.changeCalendarSystemByItsLocale && ("fa" === e ? this.doAsJalali() : this.doAsGregorian()),
        n.fn.locale.call(this, e)
    }
    ,
    W.locale = function(e) {
        return e && n.changeCalendarSystemByItsLocale && ("fa" === e ? this.useJalaliSystemPrimarily() : this.useJalaliSystemSecondary()),
        n.locale.call(this, e)
    }
    ,
    W.from = function(e, t, a) {
        var n = W.locale();
        W.locale(t);
        var s = W(e, a);
        return s.locale(n),
        W.locale(n),
        s
    }
    ,
    W.bindCalendarSystemAndLocale = function() {
        n.changeCalendarSystemByItsLocale = !0
    }
    ,
    W.unBindCalendarSystemAndLocale = function() {
        n.changeCalendarSystemByItsLocale = !1
    }
    ,
    W.useJalaliSystemPrimarily = function() {
        n.justUseJalali = !0
    }
    ,
    W.useJalaliSystemSecondary = function() {
        n.justUseJalali = !1
    }
    ,
    W.jDaysInMonth = function(e, t) {
        return e += N(t, 12),
        (t = I(t, 12)) < 0 && (t += 12,
        e -= 1),
        t < 6 ? 31 : t < 11 ? 30 : W.jIsLeapYear(e) ? 30 : 29
    }
    ,
    W.jIsLeapYear = C,
    n.defineLocale("fa", {
        months: "ژانویه_فوریه_مارس_آوریل_مه_ژوئن_ژوئیه_اوت_سپتامبر_اکتبر_نوامبر_دسامبر".split("_"),
        monthsShort: "ژانویه_فوریه_مارس_آوریل_مه_ژوئن_ژوئیه_اوت_سپتامبر_اکتبر_نوامبر_دسامبر".split("_"),
        weekdays: "یک‌شنبه_دوشنبه_سه‌شنبه_چهارشنبه_پنج‌شنبه_جمعه_شنبه".split("_"),
        weekdaysShort: "یک‌شنبه_دوشنبه_سه‌شنبه_چهارشنبه_پنج‌شنبه_جمعه_شنبه".split("_"),
        weekdaysMin: "ی_د_س_چ_پ_ج_ش".split("_"),
        longDateFormat: {
            LT: "HH:mm",
            L: "jYYYY/jMM/jDD",
            LL: "jD jMMMM jYYYY",
            LLL: "jD jMMMM jYYYY LT",
            LLLL: "dddd، jD jMMMM jYYYY LT"
        },
        calendar: {
            sameDay: "[امروز ساعت] LT",
            nextDay: "[فردا ساعت] LT",
            nextWeek: "dddd [ساعت] LT",
            lastDay: "[دیروز ساعت] LT",
            lastWeek: "dddd [ی پیش ساعت] LT",
            sameElse: "L"
        },
        relativeTime: {
            future: "در %s",
            past: "%s پیش",
            s: "چند ثانیه",
            m: "1 دقیقه",
            mm: "%d دقیقه",
            h: "1 ساعت",
            hh: "%d ساعت",
            d: "1 روز",
            dd: "%d روز",
            M: "1 ماه",
            MM: "%d ماه",
            y: "1 سال",
            yy: "%d سال"
        },
        ordinal: "%dم",
        week: {
            dow: 6,
            doy: 12
        },
        meridiem: function(e) {
            return e < 12 ? "ق.ظ" : "ب.ظ"
        },
        jMonths: "فروردین_اردیبهشت_خرداد_تیر_مرداد_شهریور_مهر_آبان_آذر_دی_بهمن_اسفند".split("_"),
        jMonthsShort: "فروردین_اردیبهشت_خرداد_تیر_مرداد_شهریور_مهر_آبان_آذر_دی_بهمن_اسفند".split("_")
    }),
    W.bindCalendarSystemAndLocale(),
    n.locale("en"),
    W.jConvert = {
        toJalali: z,
        toGregorian: J
    }
}
, function(e, t) {
    e.exports = function(e) {
        return e.webpackPolyfill || (e.deprecate = function() {}
        ,
        e.paths = [],
        e.children || (e.children = []),
        Object.defineProperty(e, "loaded", {
            enumerable: !0,
            get: function() {
                return e.l
            }
        }),
        Object.defineProperty(e, "id", {
            enumerable: !0,
            get: function() {
                return e.i
            }
        }),
        e.webpackPolyfill = 1),
        e
    }
}
, function(e, t, a) {
    var n = {
        "./af": 1,
        "./af.js": 1,
        "./ar": 2,
        "./ar-dz": 3,
        "./ar-dz.js": 3,
        "./ar-kw": 4,
        "./ar-kw.js": 4,
        "./ar-ly": 5,
        "./ar-ly.js": 5,
        "./ar-ma": 6,
        "./ar-ma.js": 6,
        "./ar-sa": 7,
        "./ar-sa.js": 7,
        "./ar-tn": 8,
        "./ar-tn.js": 8,
        "./ar.js": 2,
        "./az": 9,
        "./az.js": 9,
        "./be": 10,
        "./be.js": 10,
        "./bg": 11,
        "./bg.js": 11,
        "./bm": 12,
        "./bm.js": 12,
        "./bn": 13,
        "./bn.js": 13,
        "./bo": 14,
        "./bo.js": 14,
        "./br": 15,
        "./br.js": 15,
        "./bs": 16,
        "./bs.js": 16,
        "./ca": 17,
        "./ca.js": 17,
        "./cs": 18,
        "./cs.js": 18,
        "./cv": 19,
        "./cv.js": 19,
        "./cy": 20,
        "./cy.js": 20,
        "./da": 21,
        "./da.js": 21,
        "./de": 22,
        "./de-at": 23,
        "./de-at.js": 23,
        "./de-ch": 24,
        "./de-ch.js": 24,
        "./de.js": 22,
        "./dv": 25,
        "./dv.js": 25,
        "./el": 26,
        "./el.js": 26,
        "./en-au": 27,
        "./en-au.js": 27,
        "./en-ca": 28,
        "./en-ca.js": 28,
        "./en-gb": 29,
        "./en-gb.js": 29,
        "./en-ie": 30,
        "./en-ie.js": 30,
        "./en-il": 31,
        "./en-il.js": 31,
        "./en-nz": 32,
        "./en-nz.js": 32,
        "./eo": 33,
        "./eo.js": 33,
        "./es": 34,
        "./es-do": 35,
        "./es-do.js": 35,
        "./es-us": 36,
        "./es-us.js": 36,
        "./es.js": 34,
        "./et": 37,
        "./et.js": 37,
        "./eu": 38,
        "./eu.js": 38,
        "./fa": 39,
        "./fa.js": 39,
        "./fi": 40,
        "./fi.js": 40,
        "./fo": 41,
        "./fo.js": 41,
        "./fr": 42,
        "./fr-ca": 43,
        "./fr-ca.js": 43,
        "./fr-ch": 44,
        "./fr-ch.js": 44,
        "./fr.js": 42,
        "./fy": 45,
        "./fy.js": 45,
        "./gd": 46,
        "./gd.js": 46,
        "./gl": 47,
        "./gl.js": 47,
        "./gom-latn": 48,
        "./gom-latn.js": 48,
        "./gu": 49,
        "./gu.js": 49,
        "./he": 50,
        "./he.js": 50,
        "./hi": 51,
        "./hi.js": 51,
        "./hr": 52,
        "./hr.js": 52,
        "./hu": 53,
        "./hu.js": 53,
        "./hy-am": 54,
        "./hy-am.js": 54,
        "./id": 55,
        "./id.js": 55,
        "./is": 56,
        "./is.js": 56,
        "./it": 57,
        "./it.js": 57,
        "./ja": 58,
        "./ja.js": 58,
        "./jv": 59,
        "./jv.js": 59,
        "./ka": 60,
        "./ka.js": 60,
        "./kk": 61,
        "./kk.js": 61,
        "./km": 62,
        "./km.js": 62,
        "./kn": 63,
        "./kn.js": 63,
        "./ko": 64,
        "./ko.js": 64,
        "./ky": 65,
        "./ky.js": 65,
        "./lb": 66,
        "./lb.js": 66,
        "./lo": 67,
        "./lo.js": 67,
        "./lt": 68,
        "./lt.js": 68,
        "./lv": 69,
        "./lv.js": 69,
        "./me": 70,
        "./me.js": 70,
        "./mi": 71,
        "./mi.js": 71,
        "./mk": 72,
        "./mk.js": 72,
        "./ml": 73,
        "./ml.js": 73,
        "./mn": 74,
        "./mn.js": 74,
        "./mr": 75,
        "./mr.js": 75,
        "./ms": 76,
        "./ms-my": 77,
        "./ms-my.js": 77,
        "./ms.js": 76,
        "./mt": 78,
        "./mt.js": 78,
        "./my": 79,
        "./my.js": 79,
        "./nb": 80,
        "./nb.js": 80,
        "./ne": 81,
        "./ne.js": 81,
        "./nl": 82,
        "./nl-be": 83,
        "./nl-be.js": 83,
        "./nl.js": 82,
        "./nn": 84,
        "./nn.js": 84,
        "./pa-in": 85,
        "./pa-in.js": 85,
        "./pl": 86,
        "./pl.js": 86,
        "./pt": 87,
        "./pt-br": 88,
        "./pt-br.js": 88,
        "./pt.js": 87,
        "./ro": 89,
        "./ro.js": 89,
        "./ru": 90,
        "./ru.js": 90,
        "./sd": 91,
        "./sd.js": 91,
        "./se": 92,
        "./se.js": 92,
        "./si": 93,
        "./si.js": 93,
        "./sk": 94,
        "./sk.js": 94,
        "./sl": 95,
        "./sl.js": 95,
        "./sq": 96,
        "./sq.js": 96,
        "./sr": 97,
        "./sr-cyrl": 98,
        "./sr-cyrl.js": 98,
        "./sr.js": 97,
        "./ss": 99,
        "./ss.js": 99,
        "./sv": 100,
        "./sv.js": 100,
        "./sw": 101,
        "./sw.js": 101,
        "./ta": 102,
        "./ta.js": 102,
        "./te": 103,
        "./te.js": 103,
        "./tet": 104,
        "./tet.js": 104,
        "./tg": 105,
        "./tg.js": 105,
        "./th": 106,
        "./th.js": 106,
        "./tl-ph": 107,
        "./tl-ph.js": 107,
        "./tlh": 108,
        "./tlh.js": 108,
        "./tr": 109,
        "./tr.js": 109,
        "./tzl": 110,
        "./tzl.js": 110,
        "./tzm": 111,
        "./tzm-latn": 112,
        "./tzm-latn.js": 112,
        "./tzm.js": 111,
        "./ug-cn": 113,
        "./ug-cn.js": 113,
        "./uk": 114,
        "./uk.js": 114,
        "./ur": 115,
        "./ur.js": 115,
        "./uz": 116,
        "./uz-latn": 117,
        "./uz-latn.js": 117,
        "./uz.js": 116,
        "./vi": 118,
        "./vi.js": 118,
        "./x-pseudo": 119,
        "./x-pseudo.js": 119,
        "./yo": 120,
        "./yo.js": 120,
        "./zh-cn": 121,
        "./zh-cn.js": 121,
        "./zh-hk": 122,
        "./zh-hk.js": 122,
        "./zh-tw": 123,
        "./zh-tw.js": 123
    };
    function s(e) {
        var t = r(e);
        return a(t)
    }
    function r(e) {
        var t = n[e];
        if (!(t + 1)) {
            var a = new Error("Cannot find module '" + e + "'");
            throw a.code = "MODULE_NOT_FOUND",
            a
        }
        return t
    }
    s.keys = function() {
        return Object.keys(n)
    }
    ,
    s.resolve = r,
    e.exports = s,
    s.id = 126
}
]);



/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   findBreakevenList: () => (/* binding */ findBreakevenList)
/* harmony export */ });
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
function findBreakevenList({positions,getPrice, opts = {}}) {
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

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(1);
/* harmony import */ var _findBreakevens_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(6);












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

function calculateOptionMargin({ priceSpot, // قیمت پایانی دارایی پایه (ریال)
    strikePrice, // قیمت اعمال (ریال)
    contractSize, // اندازه قرارداد
    optionPremium, // قیمت فروش اختیار (ریال)
    A = 0.2, // ضریب A
    B = 0.1, // ضریب B
    optionType = "call"// "call" یا "put"
}) {

    function roundUpTo({ margin, multiplier }) {
        return Math.ceil(margin / multiplier) * multiplier

    }
    // محاسبه مقدار در زیان بودن
    let intrinsicLoss = 0;
    if (optionType === "call") {
        intrinsicLoss = Math.max(0, strikePrice - priceSpot) * contractSize;
    } else if (optionType === "put") {
        intrinsicLoss = Math.max(0, priceSpot - strikePrice) * contractSize;
    }

    // مرحله ۱
    const marginStep1 = (priceSpot * A * contractSize) - intrinsicLoss;

    // مرحله ۲
    const marginStep2 = strikePrice * B * contractSize;

    // مرحله ۳: بیشینه مرحله ۱ و ۲ و گرد کردن
    const maxBaseMargin = Math.max(marginStep1, marginStep2);
    const roundedMargin = roundUpTo({
        margin: maxBaseMargin,
        multiplier: 10000
    });

    // مرحله ۴: افزودن قیمت فروش اختیار × اندازه قرارداد
    const finalMargin = roundedMargin + (optionPremium * contractSize);

    return {
        initila: roundedMargin,
        required: finalMargin
    }

}



const isStrategyIgnored = (strategy,ignoreStrategyList) => {

    
    if (!ignoreStrategyList?.length) return
    const strategySymbols = strategy.positions.map(pos => pos.symbol);

    return ignoreStrategyList.find(ignoreStrategyObj => {

        if (ignoreStrategyObj.type !== 'ALL' && ignoreStrategyObj.type !== strategy.strategyTypeTitle)
            return false

        const strategyFullSymbolNames = strategy.positions.map(opt => opt.symbol).join('-');

        if (!ignoreStrategyObj.name && ignoreStrategyObj.type === strategy.strategyTypeTitle) return true

        if (ignoreStrategyObj.name === strategyFullSymbolNames) return true
        if (strategySymbols.some(symbol => symbol.includes(ignoreStrategyObj.name)))
            return true

    }
    )

}




const calcSumOfMargins = (options) => {
    return options.reduce( (_sum, option) => {
        return _sum + (option.calculatedRequiredMargin || 0)
    }
    , 0)

}


const calcOffsetGainOfPositions = ({ strategyPositions, stockPrice }) => {
    return (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.mainTotalOffsetGainCalculator)({
        strategyPositions,
        getBestPriceCb: (_strategyPosition) => (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.getNearSettlementPrice)({ strategyPosition: _strategyPosition, stockPrice }),
        getReservedMargin: _strategyPosition => {
            return (_strategyPosition.getRequiredMargin ? (_strategyPosition.getRequiredMargin() * _strategyPosition.getQuantity()):0) || 0;
        }
    });
}



const showNotification = ({title, body, tag}) => {

    Notification.requestPermission().then(function(permission) {
        const notifTime = Date.now();

        if (permission !== "granted" || !document.hidden)
            return
        let notification = new Notification(title,{
            body,
            renotify: tag ? true : false,
            tag
        });

        console.log(body)

        notification.onclick = function() {
            window.parent.parent.focus();
        }
        ;
    })
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
                    border: ${expectedProfitNotif && strategyList?.length ? '4px solid green' : '1px solid'};
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
        return _totalBuyCost + ((price) * (1 + (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.getCommissionFactor)(asset).BUY));
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

        return _totalSellCost + (price / (1 + (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.getCommissionFactor)(asset).SELL));
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
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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



                    const totalCost = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
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
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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



                    const totalCost = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
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
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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



                    const totalCost = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
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

const calcShortGUTSStrategies = (list, {priceType, expectedProfitPerMonth, settlementGainChoosePriceType="MIN", strategySubName, callListIgnorer, min_time_to_settlement=0, max_time_to_settlement=Infinity, minStockPriceDistanceFromOption2StrikeInPercent=-Infinity, maxStockPriceDistanceFromOption2StrikeInPercent=Infinity, minStockPriceDistanceFromSarBeSarInPercent=0, maxStockPriceDistanceFromSarBeSarInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceHigherStrikeRatio > minStockPriceDistanceFromOption2StrikeInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceFromOption2StrikeInPercent) {} else {
                        return false
                    }

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



                    const totalCost = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
                        strategyPositions,
                        getPrice: (strategyPosition) => getPriceOfAsset({
                            asset: strategyPosition,
                            priceType,
                            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                        })
                    });


                    const offsetPrice = (option.strikePrice + _option.strikePrice)/2



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
        minStockPriceDistanceFromOption2StrikeInPercent,
        maxStockPriceDistanceFromOption2StrikeInPercent,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "SHORT_GUTS",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceDistanceFromOption2StrikeInPercent !== 'undefined' && minStockPriceDistanceFromOption2StrikeInPercent !== null && minStockPriceDistanceFromOption2StrikeInPercent !== -Infinity && {
                label: "minToHigh",
                value: `${((minStockPriceDistanceFromOption2StrikeInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromOption2StrikeInPercent !== 'undefined' && maxStockPriceDistanceFromOption2StrikeInPercent !== null && maxStockPriceDistanceFromOption2StrikeInPercent !== Infinity && {
                label: "maxToHigh",
                value: `${((maxStockPriceDistanceFromOption2StrikeInPercent) * 100).toFixed(0)}%`
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

const calcShortSTRANGLEStrategies = (list, {priceType, expectedProfitPerMonth, settlementGainChoosePriceType="MIN", strategySubName, callListIgnorer, min_time_to_settlement=0, max_time_to_settlement=Infinity, minStockPriceDistanceFromPutStrikeInPercent=-Infinity, maxStockPriceDistanceFromPutStrikeInPercent=Infinity, minStockPriceDistanceFromSarBeSarInPercent=0, maxStockPriceDistanceFromSarBeSarInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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

                    const stockPricePutStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPricePutStrikeRatio > minStockPriceDistanceFromPutStrikeInPercent && stockPricePutStrikeRatio < maxStockPriceDistanceFromPutStrikeInPercent) {} else {
                        return false
                    }

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



                    const totalCost = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
                        strategyPositions,
                        getPrice: (strategyPosition) => getPriceOfAsset({
                            asset: strategyPosition,
                            priceType,
                            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                        })
                    });


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
        minStockPriceDistanceFromPutStrikeInPercent,
        maxStockPriceDistanceFromPutStrikeInPercent,
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
            customLabels: [typeof minStockPriceDistanceFromPutStrikeInPercent !== 'undefined' && minStockPriceDistanceFromPutStrikeInPercent !== null && minStockPriceDistanceFromPutStrikeInPercent !== -Infinity && {
                label: "minToLow",
                value: `${((minStockPriceDistanceFromPutStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromPutStrikeInPercent !== 'undefined' && maxStockPriceDistanceFromPutStrikeInPercent !== null && maxStockPriceDistanceFromPutStrikeInPercent !== Infinity && {
                label: "minToLow",
                value: `${((maxStockPriceDistanceFromPutStrikeInPercent) * 100).toFixed(0)}%`
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

const calcBUCSStrategies = (list, {priceType, expectedProfitPerMonth, settlementGainChoosePriceType="MIN", strategySubName, BUCSSOptionListIgnorer=generalConfig.BUCSSOptionListIgnorer, min_time_to_settlement=0, max_time_to_settlement=Infinity, minStockPriceDistanceFromHigherStrikeInPercent=-Infinity, maxStockPriceDistanceFromHigherStrikeInPercent=Infinity, minStockPriceDistanceFromSarBeSarInPercent=0, maxStockPriceDistanceFromSarBeSarInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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



                    const totalCost = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
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
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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



                    const totalCost = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
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


const calcBUPS_COLLARStrategies = (list, {priceType, expectedProfitPerMonth, settlementGainChoosePriceType="MIN", strategySubName, BUPSOptionListIgnorer=generalConfig.BUPSOptionListIgnorer, min_time_to_settlement=0, max_time_to_settlement=Infinity, minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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



                    const totalCost = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
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
                        positions:[option, _option,callOptionWithSameStrike],
                        strategyTypeTitle: "BUPS_COLLAR",
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
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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
                                    getRequiredMargin: () => diffOfBUCS_Strikes
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



                            const totalCost = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
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
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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
                                getRequiredMargin: () => diffOfBUCS_Strikes
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



                        const totalCost = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
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
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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
                                    getRequiredMargin: () => diffOfBUCS_Strikes
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

                            const totalCost = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
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
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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



                        const totalCost = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
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
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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



                            const totalCost = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
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
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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


    const totalCostBUCS = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
        strategyPositions:strategyPositionsBUCS,
        getPrice: (strategyPosition) => getPriceOfAsset({
            asset: strategyPosition,
            priceType,
            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
        })
    });
    const totalCostBEPS = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
        strategyPositions:strategyPositionsBEPS,
        getPrice: (strategyPosition) => getPriceOfAsset({
            asset: strategyPosition,
            priceType,
            sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
        })
    });

    const totalCost = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
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






    if((0,_common_js__WEBPACK_IMPORTED_MODULE_1__.hasGreaterRatio)({num1:totalCostBUCS,num2:totalCostBEPS,properRatio:BUCS_BEPS_COST_notProperRatio}) && minProfitPercent <2){
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
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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



    const totalCost = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
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
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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








                            const totalCost = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
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
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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



                            const totalCost = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
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
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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



                            const totalCost = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
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

const calcBUCSRatioStrategies = (list, {priceType, strategySubName,minQuantityFactorOfBUCS=0.6, maxBUCSCostSellOptionRatio=2, BUCSSOptionListIgnorer=generalConfig.BUCSSOptionListIgnorer, min_time_to_settlement=0, max_time_to_settlement=Infinity, minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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



                    const stockPriceHigherStrikeRatio = (sellingCall.optionDetails.stockSymbolDetails.last / sellingCall.optionDetails?.strikePrice) - 1;

                    if(stockPriceHigherStrikeRatio < minStockPriceDistanceInPercent || stockPriceHigherStrikeRatio > maxStockPriceDistanceInPercent){
                        return _allPossibleStrategies
                    }
                    
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
                        const totalCostOfBUCS = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
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


                        if (quantityFactorOfBUCS < minQuantityFactorOfBUCS)
                            return ___allPossibleStrategies


                        const sarBeSar =  anotherSellingCall.optionDetails?.strikePrice +  anotherSellingCallPrice + maxProfitOfBUCS * quantityFactorOfBUCS;


                        const stockPriceToSarBeSarPercent = (sarBeSar/ anotherSellingCall.optionDetails.stockSymbolDetails.last) -1



                        return ___allPossibleStrategies.concat([{
                            option: {
                                ...buyingCall
                            },
                            positions:[buyingCall, sellingCall, anotherSellingCall],
                            strategyTypeTitle: "BUCS_RATIO",
                            expectedProfitNotif,
                            name: createStrategyName([buyingCall, sellingCall, anotherSellingCall]),
                            profitPercent: stockPriceToSarBeSarPercent 
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
        minStockPriceDistanceInPercent,
        maxStockPriceDistanceInPercent,
        minVol,
        expectedProfitNotif,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BUCS_RATIO",
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




const calcBUPSRatioStrategies = (list, {priceType, strategySubName, minQuantityFactorOfBUPS=0.6, 
    minStockPriceToSarBeSarPercent=0.25,
    min_time_to_settlement=0, max_time_to_settlement=Infinity, 
    minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {
    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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



                        const totalCostOfBUPS = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
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



                        const sarBeSar =  sellingCall.optionDetails?.strikePrice +  sellingCallPrice + (sellingPutPrice -  buyingPutPrice) * quantityFactorOfBUPS;


                        const stockPriceToSarBeSarPercent = (sarBeSar/ sellingCall.optionDetails.stockSymbolDetails.last) -1



                        if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSarPercent)
                                return ___allPossibleStrategies

                        return ___allPossibleStrategies.concat([{
                            option: {
                                ...buyingPut
                            },
                            positions:[buyingPut, sellingPut, sellingCall],
                            strategyTypeTitle: "BUPS_Ratio",
                            expectedProfitNotif,
                            name: createStrategyName([buyingPut, sellingPut, sellingCall]),
                            profitPercent: stockPriceToSarBeSarPercent
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
    minStockPriceToSarBeSarPercent=0.25,
    min_time_to_settlement=0, max_time_to_settlement=Infinity, 
    minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {
    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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



                        const totalCostOfBECS = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
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


                        // if(buyingCall.symbol==='ضفزر1010' &&  sellingCall.symbol==='ضفزر1008' && sellingPut.symbol==='طفزر1010' ){
                        //     console.log(34324)
                        // }


                        if (quantityFactorOfBECS < minQuantityFactorOfBECS)
                            return ___allPossibleStrategies



                        const breakevenList = (0,_findBreakevens_js__WEBPACK_IMPORTED_MODULE_2__.findBreakevenList)({
                            positions:strategyPositionsOfBECS_RATIO, 
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const breakeven = breakevenList[0];


                        const stockPriceToSarBeSarPercent = -((breakeven/ sellingCall.optionDetails.stockSymbolDetails.last) -1);



                        if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSarPercent)
                                return ___allPossibleStrategies

                        return ___allPossibleStrategies.concat([{
                            option: {
                                ...buyingCall
                            },
                            positions:[buyingCall, sellingCall, sellingPut],
                            strategyTypeTitle: "BECS_Ratio",
                            expectedProfitNotif,
                            name: createStrategyName([buyingCall, sellingCall, sellingPut]),
                            profitPercent: stockPriceToSarBeSarPercent
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
    minStockPriceToSarBeSarPercent=0.25,
    min_time_to_settlement=0, max_time_to_settlement=Infinity, 
    minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {
    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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



                        const totalCostOfBEPS = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
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


                        // if(buyingPut.symbol==='ضفزر1010' &&  sellingPut.symbol==='ضفزر1008' && sellingPut.symbol==='طفزر1010' ){
                        //     console.log(34324)
                        // }


                        if (quantityFactorOfBEPS < minQuantityFactorOfBEPS)
                            return ___allPossibleStrategies



                        const breakevenList = (0,_findBreakevens_js__WEBPACK_IMPORTED_MODULE_2__.findBreakevenList)({
                            positions:strategyPositionsOfBEPS_RATIO, 
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                        const breakeven = breakevenList[0];


                        const stockPriceToSarBeSarPercent = -((breakeven/ sellingPut.optionDetails.stockSymbolDetails.last) -1);



                        if (stockPriceToSarBeSarPercent < minStockPriceToSarBeSarPercent)
                                return ___allPossibleStrategies

                        return ___allPossibleStrategies.concat([{
                            option: {
                                ...buyingPut
                            },
                            positions:[buyingPut, sellingPut, anotherSellingPut],
                            strategyTypeTitle: "BEPS_Ratio",
                            expectedProfitNotif,
                            name: createStrategyName([buyingPut, sellingPut, anotherSellingPut]),
                            profitPercent: stockPriceToSarBeSarPercent
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


const calcBUCS_COLLAR_Strategies = (list, {priceType, expectedProfitPerMonth, strategySubName, BUCSSOptionListIgnorer=generalConfig.BUCSSOptionListIgnorer, min_time_to_settlement=0, max_time_to_settlement=Infinity, minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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



                    const totalCost = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
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
                    const strategyObj = {
                        option: {
                            ...option
                        },
                        positions:[option, _option,putOptionWithSameStrike],
                        strategyTypeTitle: "BUCS_COLLAR",
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


const calcBEPS_COLLAR_Strategies = (list, {priceType, expectedProfitPerMonth, strategySubName, min_time_to_settlement=0, max_time_to_settlement=Infinity, minStockPriceDistanceInPercent=-Infinity, maxStockPriceDistanceInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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



                    const totalCost = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
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
                        positions:[option, buyingPut,callWithSameStrikeOfSellingPut],
                        strategyTypeTitle: "BEPS_COLLAR",
                        expectedProfitNotif,
                        expectedProfitPerMonth,
                        name: createStrategyName([option, buyingPut,callWithSameStrikeOfSellingPut]),
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
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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



                    const totalCost = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
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
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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



                    const totalCost = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
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




const calcBUS_With_BUCS_BEPSStrategies = (list, {priceType, expectedProfitPerMonth, settlementGainChoosePriceType="MIN", strategySubName,  min_time_to_settlement=0, max_time_to_settlement=Infinity, minStockPriceDistanceFromHigherStrikeInPercent=-Infinity, maxStockPriceDistanceFromHigherStrikeInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceHigherStrikeRatio > minStockPriceDistanceFromHigherStrikeInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceFromHigherStrikeInPercent)  {
                        isEligible = true
                    }else{
                        isEligible = false;
                    }

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



                        const totalCost = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
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
                        const strategyObj = {
                            option: {
                                ...buyingCall
                            },
                            positions:[buyingCall,sellingCallWithSameStrikeOfBuyingPut,buyingPut,sellingPut],
                            strategyTypeTitle: "BUS_With_BUCS_BEPS",
                            expectedProfitNotif,
                            expectedProfitPerMonth,
                            name: createStrategyName([buyingCall,sellingCallWithSameStrikeOfBuyingPut,buyingPut,sellingPut]),
                            profitPercent
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
        minStockPriceDistanceFromHigherStrikeInPercent,
        maxStockPriceDistanceFromHigherStrikeInPercent,
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
            customLabels: [typeof minStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && minStockPriceDistanceFromHigherStrikeInPercent !== null && minStockPriceDistanceFromHigherStrikeInPercent !== -Infinity && {
                label: "minToHigh",
                value: `${((minStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && maxStockPriceDistanceFromHigherStrikeInPercent !== null && maxStockPriceDistanceFromHigherStrikeInPercent !== Infinity && {
                label: "maxToHigh",
                value: `${((maxStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }].filter(Boolean),
            minVol
        })
    }

}


const calcBUS_With_BUPS_BECSStrategies = (list, {priceType, expectedProfitPerMonth, settlementGainChoosePriceType="MIN", strategySubName,  min_time_to_settlement=0, max_time_to_settlement=Infinity, minStockPriceDistanceFromHigherStrikeInPercent=-Infinity, maxStockPriceDistanceFromHigherStrikeInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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

                    const stockPriceHigherStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceHigherStrikeRatio > minStockPriceDistanceFromHigherStrikeInPercent && stockPriceHigherStrikeRatio < maxStockPriceDistanceFromHigherStrikeInPercent)  {
                        isEligible = true
                    }else{
                        isEligible = false;
                    }

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



                        const totalCost = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
                            strategyPositions,
                            getPrice: (strategyPosition) => getPriceOfAsset({
                                asset: strategyPosition,
                                priceType,
                                sideType: strategyPosition.isBuy ? 'BUY' : 'SELL'
                            })
                        });

                     
                        
                        const offsetPrice = Math.max(...strategyPositions.map(strategyPosition=>strategyPosition.strikePrice))* 1.2;



                        const profit = totalCost + calcOffsetGainOfPositions({strategyPositions, stockPrice:offsetPrice});


                        const profitPercent = profit  / Math.abs(totalCost);
                        const strategyObj = {
                            option: {
                                ...buyingCall
                            },
                            positions:[buyingPut,sellingPutWithSameStrikeOfBuyingCall,buyingCall,sellingCall],
                            strategyTypeTitle: "BUS_With_BUPS_BECS",
                            expectedProfitNotif,
                            expectedProfitPerMonth,
                            name: createStrategyName([buyingPut,sellingPutWithSameStrikeOfBuyingCall,buyingCall,sellingCall]),
                            profitPercent
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
        minStockPriceDistanceFromHigherStrikeInPercent,
        maxStockPriceDistanceFromHigherStrikeInPercent,
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
            customLabels: [typeof minStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && minStockPriceDistanceFromHigherStrikeInPercent !== null && minStockPriceDistanceFromHigherStrikeInPercent !== -Infinity && {
                label: "minToHigh",
                value: `${((minStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromHigherStrikeInPercent !== 'undefined' && maxStockPriceDistanceFromHigherStrikeInPercent !== null && maxStockPriceDistanceFromHigherStrikeInPercent !== Infinity && {
                label: "maxToHigh",
                value: `${((maxStockPriceDistanceFromHigherStrikeInPercent) * 100).toFixed(0)}%`
            }].filter(Boolean),
            minVol
        })
    }

}


const calcBES_With_BUCS_BEPSStrategies = (list, {priceType, expectedProfitPerMonth, settlementGainChoosePriceType="MIN", strategySubName,  min_time_to_settlement=0, max_time_to_settlement=Infinity, minStockPriceDistanceFromLowerStrikeInPercent=-Infinity, maxStockPriceDistanceFromLowerStrikeInPercent=Infinity, minVol=CONSTS.DEFAULTS.MIN_VOL, expectedProfitNotif=false, ...restConfig}) => {

    const filteredList = list.filter(item => {
        if (!item.isOption)
            return
        const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(item.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
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
                    if (_option.optionDetails?.strikePrice >= buyingCall.optionDetails?.strikePrice)
                        return false

                    if(!_option.optionDetails.stockSymbolDetails) return false

                    const stockPriceLowerStrikeRatio = (_option.optionDetails.stockSymbolDetails.last / _option.optionDetails?.strikePrice) - 1;

                    if (stockPriceLowerStrikeRatio > minStockPriceDistanceFromLowerStrikeInPercent && stockPriceLowerStrikeRatio < maxStockPriceDistanceFromLowerStrikeInPercent)  {
                        isEligible = true
                    }else{
                        isEligible = false;
                    }

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
                        if (_option.optionDetails?.strikePrice <= sellingPut.optionDetails?.strikePrice || (_option.optionDetails?.strikePrice <= buyingCall.optionDetails?.strikePrice))
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



                        const totalCost = (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.totalCostCalculator)({
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
                                ...buyingCall
                            },
                            positions:[buyingCall,sellingCallWithSameStrikeOfBuyingPut,buyingPut,sellingPut],
                            strategyTypeTitle: "BES_With_BUCS_BEPS",
                            expectedProfitNotif,
                            expectedProfitPerMonth,
                            name: createStrategyName([buyingCall,sellingCallWithSameStrikeOfBuyingPut,buyingPut,sellingPut]),
                            profitPercent
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
        minStockPriceDistanceFromLowerStrikeInPercent,
        maxStockPriceDistanceFromLowerStrikeInPercent,
        minVol,
        expectedProfitNotif,
        expectedProfitPerMonth,
        ...restConfig,
        htmlTitle: configsToHtmlTitle({
            strategyName: "BES_With_BUCS_BEPS",
            strategySubName,
            priceType,
            min_time_to_settlement,
            max_time_to_settlement,
            customLabels: [typeof minStockPriceDistanceFromLowerStrikeInPercent !== 'undefined' && minStockPriceDistanceFromLowerStrikeInPercent !== null && minStockPriceDistanceFromLowerStrikeInPercent !== -Infinity && {
                label: "minToHigh",
                value: `${((minStockPriceDistanceFromLowerStrikeInPercent) * 100).toFixed(0)}%`
            }, typeof maxStockPriceDistanceFromLowerStrikeInPercent !== 'undefined' && maxStockPriceDistanceFromLowerStrikeInPercent !== null && maxStockPriceDistanceFromLowerStrikeInPercent !== Infinity && {
                label: "maxToHigh",
                value: `${((maxStockPriceDistanceFromLowerStrikeInPercent) * 100).toFixed(0)}%`
            }].filter(Boolean),
            minVol
        })
    }

}

const createListFilterContetnByList=(list)=>{

       let htmlContent = '';

    const strategyMapList = [
    calcLongGUTS_STRANGLEStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,

        // min_time_to_settlement: 15 * 24 * 3600000,
        // max_time_to_settlement: 40 * 24 * 3600000,
        // minVol: 1000 * 1000 * 1000,
        // minStockPriceDistanceFromHigherStrikeInPercent: .22,
        expectedProfitNotif: true
    }), calcShortGUTSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        callListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ض') || option.vol < minVol || option.optionDetails?.strikePrice >= option.optionDetails.stockSymbolDetails.last)
                return true
            const stockStrikeDistanceInPercent = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;
            if (stockStrikeDistanceInPercent > .12)
                return true
            // if (stockStrikeDistanceInPercent > .15) return true
            return false
        }
        ,
        // min_time_to_settlement: 15 * 24 * 3600000,
        // max_time_to_settlement: 40 * 24 * 3600000,
        // minVol: 1000 * 1000 * 1000,
        maxStockPriceDistanceFromOption2StrikeInPercent: -.15,
        // expectedProfitNotif: true
    }), calcShortSTRANGLEStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        callListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ض') || option.vol < minVol || option.optionDetails?.strikePrice <= option.optionDetails.stockSymbolDetails.last)
                return true
            const stockStrikeDistanceInPercent = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;
            if (stockStrikeDistanceInPercent > -.15)
                return true
            // if (stockStrikeDistanceInPercent > .15) return true
            return false
        }
        ,
        // min_time_to_settlement: 15 * 24 * 3600000,
        // max_time_to_settlement: 40 * 24 * 3600000,
        // minVol: 1000 * 1000 * 1000,
        minStockPriceDistanceFromPutStrikeInPercent: .15,
        // expectedProfitNotif: true
    })
    , calcCALL_BUTTERFLYStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 1 * 24 * 3600000,
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
        min_time_to_settlement: 1 * 24 * 3600000,
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
        min_time_to_settlement: 1 * 24 * 3600000,
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
        min_time_to_settlement: 1 * 24 * 3600000,
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
        min_time_to_settlement: 1 * 24 * 3600000,
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
        min_time_to_settlement: 1 * 24 * 3600000,
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
        min_time_to_settlement: 1 * 24 * 3600000,
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
        min_time_to_settlement: 1 * 24 * 3600000,
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
        min_time_to_settlement: 1 * 24 * 3600000,
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
        min_time_to_settlement: 1 * 24 * 3600000,
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
        min_time_to_settlement: 1 * 24 * 3600000,
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
        min_time_to_settlement: 1 * 24 * 3600000,
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
        min_time_to_settlement: 3 * 24 * 3600000,
        minStockPriceDistanceFromHigherStrikeInPercent: .01,
    }),

    calcBUS_With_BUCS_BEPSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 3 * 24 * 3600000,
        minStockPriceDistanceFromHigherStrikeInPercent: .12,
        // expectedProfitNotif: true,
    }),


    calcBUS_With_BUPS_BECSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 3 * 24 * 3600000,
        minStockPriceDistanceFromHigherStrikeInPercent: .01,
    }),

    calcBUS_With_BUPS_BECSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 3 * 24 * 3600000,
        minStockPriceDistanceFromHigherStrikeInPercent: .12,
        // expectedProfitNotif: true,
    }),



    

     calcBES_With_BUCS_BEPSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 3 * 24 * 3600000,
        maxStockPriceDistanceFromLowerStrikeInPercent: -.01,
    }),
    calcBES_With_BUCS_BEPSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 3 * 24 * 3600000,
        maxStockPriceDistanceFromLowerStrikeInPercent: -.12,
        expectedProfitNotif: true,
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
    
    
    , calcBUCS_COLLAR_Strategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        expectedProfitNotif: true // priceType: CONSTS.PRICE_TYPE.LAST_PRICE ,
    })
    , calcBEPS_COLLAR_Strategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        expectedProfitNotif: true // priceType: CONSTS.PRICE_TYPE.LAST_PRICE ,
    })
    
    
    , calcBUCSRatioStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        // maxBUCSCostSellOptionRatio: 1.1,
        BUCSSOptionListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ض') || option.vol < minVol)
                return true
            const stockStrikeDistanceInPercent = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;
            if (stockStrikeDistanceInPercent < -.09)
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
        // maxBUCSCostSellOptionRatio: 1.1,
        BUCSSOptionListIgnorer: ({option, minVol}) => {
            if (!option.optionDetails?.stockSymbolDetails || !option.symbol.startsWith('ض') || option.vol < minVol)
                return true
            const stockStrikeDistanceInPercent = (option.optionDetails.stockSymbolDetails.last / option.optionDetails?.strikePrice) - 1;
            if (stockStrikeDistanceInPercent < -.09)
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
        // maxBUCSCostSellOptionRatio: 1.1,
        // maxStockPriceDistanceInPercent: .2,
        // min_time_to_settlement: 15 * 24 * 3600000,
        max_time_to_settlement: 39 * 24 * 3600000,
    })
    , calcBECSRatioStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        // maxBUCSCostSellOptionRatio: 1.1,
        // maxStockPriceDistanceInPercent: .2,
        // min_time_to_settlement: 15 * 24 * 3600000,
        max_time_to_settlement: 39 * 24 * 3600000,
    })
    , calcBEPSRatioStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        // maxBUCSCostSellOptionRatio: 1.1,
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
        min_time_to_settlement: 2 * 24 * 3600000,
        expectedProfitPerMonth: 1.02,
        expectedProfitNotif: true,
    }), 
    
    calcBOXStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0,
        max_time_to_settlement: 2 * 24 * 3600000,
        expectedProfitPerMonth: 1.02,
        expectedProfitNotif: true,
    }),
    
    
    calcBOX_BUPS_BECSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 2 * 24 * 3600000,
        expectedProfitPerMonth: 1.02,
        expectedProfitNotif: true,
    }), 
    calcBOX_BUPS_BECSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 0,
        max_time_to_settlement: 2 * 24 * 3600000,
        expectedProfitPerMonth: 1.02,
        expectedProfitNotif: true,
    }), calcBECSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 38 * 24 * 3600000,
        max_time_to_settlement: 55 * 24 * 3600000,
        maxStockPriceDistanceInPercent: -.22
    }), calcBECSStrategies(list, {
        priceType: CONSTS.PRICE_TYPE.BEST_PRICE,
        min_time_to_settlement: 2 * 24 * 3600000,
        max_time_to_settlement: 38 * 24 * 3600000,
        maxStockPriceDistanceInPercent: -.15,
        expectedProfitNotif: true
    }), calcCOVEREDStrategies(list, {
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
        min_time_to_settlement: 2 * 24 * 3600000,
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
        min_time_to_settlement: 1 * 24 * 3600000,
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
        let filteredStrategies = allStrategiesSorted.filter(strategy => {
            if (strategy.profitPercent < 0)
                return false
        

            if (strategy.profitPercent <  generalConfig.minProfitToFilter)
                return false
            
            const minDiffTimeOflastTrade = 6 * 60 * 1000;
            if ((Date.now() - strategy.option.lastTrackedChangeTime) > minDiffTimeOflastTrade) {
                return false
            }

            const settlementTimeDiff = (0,_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment)(strategy.option.optionDetails.date, 'jYYYY/jMM/jDD').diff(Date.now());
            const daysToSettlement = Math.floor(settlementTimeDiff / (24 * 3600000));
            const percentPerDay = Math.pow((1 + strategy.profitPercent), 1 / daysToSettlement);
            const percentPerMonth = Math.pow(percentPerDay, 30);
   
            return percentPerMonth > ((strategy.expectedProfitPerMonth !== undefined && strategy.expectedProfitPerMonth !== null) ? strategy.expectedProfitPerMonth : generalConfig.expectedProfitPerMonth)
        }
        );

        
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


        const lastTrackedChangeTime = ( () => {
            if (!prevRecordObj || !prevRecordObj.quantityOfTrades || (quantityOfTrades > prevRecordObj.quantityOfTrades)) {
                return Date.now();
            }
            return prevRecordObj.lastTrackedChangeTime

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
            lastTrackedChangeTime
        }


        

        const assetInfo ={
            symbol,
            name,
            instrumentName:symbol,
            isOption,
            isCall,
            quantityOfTrades,
            lastTrackedChangeTime,
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
            name: strategyTypeAndName[1]
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

const interval = () => {
    const list = createList();
    if(list?.length>0){
        createListFilterContetnByList(list);
        
        newTabList.forEach(childWindowTab=>{
            const  generalIgnoreText = getGeneralIgnoreText();
            if(childWindowTab.document.readyState === "complete"){
                //notifiedStrategyList=[]
                childWindowTab.postMessage({ 
                    list ,
                    generalIgnoreText ,
                    $tempIgnoredNotifList: tempIgnoredNotifList,
                    $notifiedStrategyList :notifiedStrategyList
                }, "*");
            }
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

    if (!_jalali_moment_browser_js__WEBPACK_IMPORTED_MODULE_0__.moment) alert('moment  error');


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







})();

tseOptionStrategiesLib = __webpack_exports__;
/******/ })()
;