const CONFIG_TYPE_EXPANSIONS = {
    BUS: [
        { type: 'SyntheticBuy' },
        { type: 'BUCS' },
        {
            type: 'SellPut',
            modify: config => ({
                ...config,
                name: config.name ? config.name.replace(/^ض/, 'ط') : null,
                breakeven: config.breakeven
                    ? {
                        ...config.breakeven,
                        max: config.breakeven.max / 1.04,
                    }
                    : null,
            }),
        },
        { type: 'BUCS_LONG_PUT' },
        { type: 'BUCS_BEPS_LongPut' },
        { type: 'SYNTHETIC_COVERED_CALL',  
            modify: config => ({
                ...config,
                breakeven: config.breakeven
                    ? {
                        ...config.breakeven,
                        max: config.breakeven.max / 1.04,
                    }
                    : null,
            })
        },
        {
            type: 'COVERED',
            modify: config => ({
                ...config,
                breakeven: config.breakeven
                    ? {
                        ...config.breakeven,
                        max: config.breakeven.max * 1.04,
                    }
                    : null,
            }),
        },
        {
            type: 'COVERED_BUY_PUT',
            modify: config => ({
                ...config,
                breakeven: config.breakeven
                    ? {
                        ...config.breakeven,
                        max: config.breakeven.max * 1.04,
                    }
                    : null,
            }),
        },
        { type: 'BECS_Ratio' },
        { type: 'BESRatio_BUCS' },
        {
            type: 'BESRatio_BUPS',
            modify: config => ({
                ...config,
                name: config.name ? config.name.replace(/^ض/, 'ط') : null
            }),
        },
        {
            type: 'BEPS_Ratio', modify: config => ({
                ...config,
                name: config.name ? config.name.replace(/^ض/, 'ط') : null
            }),
        },
        {
            type: 'BUPS', modify: config => ({
                ...config,
                name: config.name ? config.name.replace(/^ض/, 'ط') : null
            }),
        },
        {
            type: 'BUPS_LONG_PUT', modify: config => ({
                ...config,
                name: config.name ? config.name.replace(/^ض/, 'ط') : null
            }),
        },
        {
            type: 'BUS_With_BUCS_BEPS',
            modify: config => ({
                ...config,
                breakeven: config.breakeven
                    ? {
                        ...config.breakeven,
                        max: config.breakeven.max * 1.04,
                    }
                    : null,
            }),
        },
        {
            type: 'BUS_With_BUPS_BECS',
            modify: config => ({
                ...config,
                breakeven: config.breakeven
                    ? {
                        ...config.breakeven,
                        max: config.breakeven.max * 1.04,
                    }
                    : null,
                name: config.name ? config.name.replace(/^ض/, 'ط') : null
            }),
        },
    ],
    BES: [
        {
            type: 'SellCall',
            modify: config => ({
                ...config,
                breakeven: config.breakeven
                    ? {
                        ...config.breakeven,
                        min: config.breakeven.min * 1.04,
                    }
                    : null,
            }),
        },
        { type: 'SyntheticSell' },
        {
            type: 'BECS',
        },
        {
            type: 'BECS_LONG_CALL',
        },
        {
            type: 'BUCS_RATIO',
        },
        {
            type: 'BEPS_LONG_CALL',
            modify: config => ({
                ...config,
                name: config.name ? config.name.replace(/^ض/, 'ط') : null
            }),
        },
        {
            type: 'BEPS',
            modify: config => ({
                ...config,
                name: config.name ? config.name.replace(/^ض/, 'ط') : null
            }),
        },
        {
            type: 'BUPS_Ratio',
            modify: config => ({
                ...config,
                name: config.name ? config.name.replace(/^ض/, 'ط') : null
            }),
        },
        {
            type: 'BES_With_BUCS_BEPS',
            modify: config => ({
                ...config,
                breakeven: config.breakeven
                    ? {
                        ...config.breakeven,
                        min: config.breakeven.min / 1.04,
                    }
                    : null,
            }),
        },
        {
            type: 'BES_With_BUPS_BECS',
            modify: config => ({
                ...config,
                breakeven: config.breakeven
                    ? {
                        ...config.breakeven,
                        min: config.breakeven.min / 1.04,
                    }
                    : null,
                name: config.name ? config.name.replace(/^ض/, 'ط') : null
            }),
        },
    ],
};


const COMMON_CONFIG_TYPE_EXPANSIONS = [
    {
        type: 'SHORT_STRANGLE',
        sources: ['BUS', 'BES'],
    },
    {
        type: 'SHORT_GUTS',
        sources: ['BUS', 'BES'],
    },
];

const RULE_NAME_MAP = {
    sar: 'breakeven',
    LSar: 'lowBreakeven',
    HSar: 'highBreakeven',

    p: 'profitPercent',
    profit: 'profitPercent',

    // سازگاری با تنظیمات قدیمی
    toSar: 'toBreakeven',
    toLSar: 'toLowBreakeven',
    toHSar: 'toHighBreakeven',
};

const parseRuleConfigs = (configs) => {
    return configs.reduce((result, config) => {
        const equalIndex = config.indexOf('=');

        if (equalIndex === -1) {
            result.val = Number(config);
            return result;
        }

        const key = config.slice(0, equalIndex);
        const value = config.slice(equalIndex + 1);

        result[key] = Number(value);

        return result;
    }, {});
};


const parseIgnoreStrategy = (ignoreStrategyName) => {
    const result = {
        type: null,
        name: null,

        profitPercent: null,

        breakeven: null,
        lowBreakeven: null,
        highBreakeven: null,

        toBreakeven: null,
        toLowBreakeven: null,
        toHighBreakeven: null,

        allProfit: null,
    };

    const [type, ...parts] = ignoreStrategyName.split('@');

    result.type = type;

    parts.forEach(part => {
        if (part === 'allProfit') {
            result.allProfit = true;
            return;
        }

        const colonIndex = part.indexOf(':');

        if (colonIndex === -1) {
            result.name = part;
            return;
        }

        const ruleName = part.slice(0, colonIndex);
        const configs = part.slice(colonIndex + 1).split(':');

        const resultKey = RULE_NAME_MAP[ruleName];

        if (resultKey) {
            result[resultKey] = parseRuleConfigs(configs);
        }
    });

    return result;
};




// const removeDuplicateConfigs = (configs) => {
//     const configMap = new Map();

//     configs.forEach(config => {
//         const key = `${config.type}@${config.name ?? ''}`;

//         configMap.set(key, config);
//     });

//     return [...configMap.values()];
// };


const isSameConfigTarget = (generatedConfig, userConfig) => {
     return (
        ((generatedConfig.type === userConfig.type)) 
        && 
        (generatedConfig.name === userConfig.name || userConfig.name==null)
    );
};

const mergeConfig = (generatedConfig, userConfig) => {


    const hasUserConfig = Object.entries(userConfig).some(
        ([key, value]) =>
            !['type', 'name'].includes(key) &&
            value !== null
    );

    // هیچ تنظیمی توسط کاربر تعیین نشده
    if (!hasUserConfig) {
        return {
            ...userConfig,
        };
    }


    const result = {
        ...generatedConfig,
    };


   Object.entries(userConfig).forEach(([key, userValue]) => {
        if (userValue === null) {
            return;
        }

        if (
            typeof userValue === 'object' &&
            !Array.isArray(userValue)
        ) {
            result[key] = {
                ...(generatedConfig[key] || {}),
                ...userValue,
            };
        } else {
            result[key] = userValue;
        }
    });

    return result;
};

const mergeGeneratedConfigs = (existingConfig, generatedConfig) => {
    const result = { ...existingConfig };

    result._sourceTypes = [
        ...new Set([
            ...(existingConfig._sourceTypes || [existingConfig._sourceType]),
            ...(generatedConfig._sourceTypes || [generatedConfig._sourceType]),
        ].filter(Boolean)),
    ];

    Object.entries(generatedConfig).forEach(([key, value]) => {
        if (
            value === null ||
            value === undefined ||
            key === '_sourceType' ||
            key === '_sourceTypes'
        ) {
            return;
        }

        if (
            typeof value === 'object' &&
            !Array.isArray(value)
        ) {
            result[key] = {
                ...(result[key] || {}),
                ...value,
            };
        } else {
            result[key] = value;
        }
    });

    delete result._sourceType;

    return result;
};

const resolveGeneratedConfigOverrides = ({
    generatedConfigs,
    userConfigs,
}) => {
    const mergedGeneratedConfigs = [];

    for (const generatedConfig of generatedConfigs) {
        // کانفیگ تولیدشده با هدف یکسان را پیدا کن
        const existingConfig = mergedGeneratedConfigs.find(
            config =>
                isSameConfigTarget(config, generatedConfig) &&
                isSameConfigTarget(generatedConfig, config)
        );

        if (!existingConfig) {
            mergedGeneratedConfigs.push({ ...generatedConfig });
            continue;
        }

        // فیلدهای کانفیگ جدید را روی قبلی ادغام کن
        const mergedConfig = mergeGeneratedConfigs(
            existingConfig,
            generatedConfig
        );

        Object.assign(existingConfig, mergedConfig);
    }

    // اعمال تنظیمات کاربر روی کانفیگ‌های ادغام‌شده
    const resolvedGeneratedConfigs = mergedGeneratedConfigs.map(
        generatedConfig => {
            const matchingUserConfigs = userConfigs.filter(
                userConfig =>
                    isSameConfigTarget(
                        generatedConfig,
                        userConfig
                    )
            );

            return matchingUserConfigs.reduce(
                (result, userConfig) =>
                    mergeConfig(result, userConfig),
                generatedConfig
            );
        }
    );

    const unmatchedUserConfigs = userConfigs.filter(
        userConfig =>
            !mergedGeneratedConfigs.some(generatedConfig =>
                isSameConfigTarget(
                    generatedConfig,
                    userConfig
                )
            )
    );

    return [
        ...unmatchedUserConfigs,
        ...resolvedGeneratedConfigs,
    ];
};



export const parseIgnoreStrategies = (text) => {
    return text
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(parseIgnoreStrategy);
};

export const generateObjConfigByText = (text) => {

    const configs = parseIgnoreStrategies(text);

    // const uniqueUserConfigs = removeDuplicateConfigs(configs);

    const expandedConfigs = expandIgnoreStrategies(configs);

    const resolvedGeneratedConfigs = resolveGeneratedConfigOverrides({generatedConfigs:expandedConfigs.filter(c=>c._generated), userConfigs : expandedConfigs.filter(c=>!c._generated)});


    return resolvedGeneratedConfigs
}



const expandIgnoreStrategy = config => {
    const specificExpansions =
        CONFIG_TYPE_EXPANSIONS[config.type] || [];

    const commonExpansions =
        COMMON_CONFIG_TYPE_EXPANSIONS.filter(
            expansion => expansion.sources.includes(config.type)
        );

    const expansions = [
        ...specificExpansions,
        ...commonExpansions,
    ];

    if (!expansions.length) {
        return [config];
    }

    return expansions.map(({ type, modify }) => {
        const expandedConfig = {
            ...config,
            type,
            _generated: true,
            _sourceType: config.type,
        };

        // منطق عمومی استراتژی‌های خنثی
        const isCommonExpansion = commonExpansions.some(
            expansion => expansion.type === type
        );

        let result = { ...expandedConfig };

        if (isCommonExpansion) {
            const { breakeven, ...rest } = result;

            result = {
                ...rest,
                ...(breakeven != null
                    ? config.type === 'BUS'
                        ? { lowBreakeven: breakeven }
                        : { highBreakeven: breakeven }
                    : {}),
            };
        }

        // تغییرات اختصاصی، فقط در صورت نیاز
        return modify ? modify(result) : result;
    });
};

export const expandIgnoreStrategies = (configs) => {
    return configs.flatMap(expandIgnoreStrategy);
};





export const isStrategyIgnored = (strategy, ignoreStrategyList) => {

    if (!ignoreStrategyList?.length) return false;

    const normalizeSymbol = symbol => symbol.replaceAll('ي', 'ی');

    const strategySymbols = strategy.positions.map(pos =>
        normalizeSymbol(pos.symbol)
    );

    const strategyFullSymbolNames = strategySymbols.join('-');

    const isSymbolNameIgnoredChecker = ({ ignoreStrategyObj }) => {

        if (!ignoreStrategyObj.name) return true;

        const ignoreStrategyName = normalizeSymbol(ignoreStrategyObj.name);

        if (ignoreStrategyName === strategyFullSymbolNames) return true;

        return strategySymbols.some(symbol =>
            symbol.includes(ignoreStrategyName)
        );
    };

    const profitFilterCheck = ({ ignoreStrategyObj, strategy }) => {

        const filter = ignoreStrategyObj.profitPercent;
        const hasFilter = filter != null;

        return {
            isPass: hasFilter
                ? strategy.profitPercent >= filter.val
                : null,
            hasFilter
        };
    };

    const breakevenFilterCheck = ({ ignoreStrategyObj, strategy }) => {

        const filters = [
            {
                filter: ignoreStrategyObj.breakeven,
                value: strategy.breakeven
            },
            {
                filter: ignoreStrategyObj.lowBreakeven,
                value: strategy.lowBreakeven
            },
            {
                filter: ignoreStrategyObj.highBreakeven,
                value: strategy.highBreakeven
            }
        ];

        const hasFilter = filters.some(({ filter }) => filter != null);

        const check = (value, filter) => {

            if (value == null) return true;

            if (filter.min != null && value < filter.min) return false;

            if (filter.max != null && value > filter.max) return false;

            return true;
        };

        const isPass = filters.every(({ filter, value }) => {

            if (filter == null) return true;

            return check(value, filter);
        });

        return {
            isPass,
            hasFilter
        };
    };

    const allProfitFilterCheck = ({ ignoreStrategyObj, strategy }) => {

        const hasFilter = ignoreStrategyObj.allProfit != null;

        return {
            isPass: hasFilter ? strategy.isWholeProfitable : null,
            hasFilter
        };
    };

    return ignoreStrategyList.find(ignoreStrategyObj => {

        const isTypeIgnored =
            ignoreStrategyObj.type === 'ALL' ||
            ignoreStrategyObj.type === strategy.strategyTypeTitle;

        if (!isTypeIgnored) return false;

        const isSymbolNameIgnored = isSymbolNameIgnoredChecker({
            ignoreStrategyObj
        });

        if (!isSymbolNameIgnored) return false;

        const {
            hasFilter: hasProfitFilter,
            isPass: isProfitPass
        } = profitFilterCheck({ ignoreStrategyObj, strategy });

        if (hasProfitFilter && !isProfitPass) return true;

        const {
            hasFilter: hasBreakevenFilter,
            isPass: isBreakevenPass
        } = breakevenFilterCheck({ ignoreStrategyObj, strategy });

        if (
            hasBreakevenFilter &&
            !isBreakevenPass &&
            !strategy.isWholeProfitable
        ) return true;

        const {
            hasFilter: hasAllProfitFilter,
            isPass: isAllProfitPass
        } = allProfitFilterCheck({ ignoreStrategyObj, strategy });

        if (hasAllProfitFilter && !isAllProfitPass) return true;

        const hasAnyFilter =
            hasProfitFilter ||
            hasBreakevenFilter ||
            hasAllProfitFilter;

        return !hasAnyFilter;
    });
};
