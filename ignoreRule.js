const CONFIG_TYPE_EXPANSIONS = {
    BUS: [
        { type: 'BUCS' },
        { type: 'BUCS_LONG_PUT' },
        { type: 'BUCS_BEPS_LongPut' },
        { type: 'SYNTHETIC_COVERED_CALL' },
        {
            type: 'COVERED',
            modify: config => ({
                ...config,
                toSarBeSar: config.toSarBeSar
                    ? {
                        ...config.toSarBeSar,
                        max: config.toSarBeSar.max / 1.15,
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
                toSarBeSar: config.toSarBeSar
                    ? {
                        ...config.toSarBeSar,
                        max: config.toSarBeSar.max / 1.2,
                    }
                    : null,
            }),
        },
        {
            type: 'BUS_With_BUPS_BECS',
            modify: config => ({
                ...config,
                toSarBeSar: config.toSarBeSar
                    ? {
                        ...config.toSarBeSar,
                        max: config.toSarBeSar.max / 1.2,
                    }
                    : null,
                name: config.name ? config.name.replace(/^ض/, 'ط') : null
            }),
        },
    ],
    BES: [
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
        },
        {
            type: 'BES_With_BUPS_BECS',
            modify: config => ({
                ...config,
                toSarBeSar: config.toSarBeSar
                    ? {
                        ...config.toSarBeSar,
                        min: config.toSarBeSar.min / 1.2,
                    }
                    : null,
                name: config.name ? config.name.replace(/^ض/, 'ط') : null
            }),
        },
    ],
};

const RULE_NAME_MAP = {
    toSar: 'toSarBeSar',
    toLSar: 'toLowSarBeSar',
    toHSar: 'toHighSarBeSar',
    p: 'profitPercent',
    profit: 'profitPercent',
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
        toSarBeSar: null,
        toLowSarBeSar: null,
        toHighSarBeSar: null,
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
    return {
        ...generatedConfig,

        profitPercent:
            userConfig.profitPercent !== null
                ? userConfig.profitPercent
                : generatedConfig.profitPercent,

        toSarBeSar: userConfig.toSarBeSar
            ? {
                ...generatedConfig.toSarBeSar,
                ...userConfig.toSarBeSar,
            }
            : generatedConfig.toSarBeSar,

        toLowSarBeSar: userConfig.toLowSarBeSar
            ? {
                ...generatedConfig.toLowSarBeSar,
                ...userConfig.toLowSarBeSar,
            }
            : generatedConfig.toLowSarBeSar,

        toHighSarBeSar: userConfig.toHighSarBeSar
            ? {
                ...generatedConfig.toHighSarBeSar,
                ...userConfig.toHighSarBeSar,
            }
            : generatedConfig.toHighSarBeSar,

        allProfit:
            userConfig.allProfit !== null
                ? userConfig.allProfit
                : generatedConfig.allProfit,
    };
};

const resolveGeneratedConfigOverrides = ({
    generatedConfigs,
    userConfigs,
}) => {
    const resolvedGeneratedConfigs = generatedConfigs.map(
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
            !generatedConfigs.some(generatedConfig =>
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



const expandIgnoreStrategy = (config) => {
    const expansions = CONFIG_TYPE_EXPANSIONS[config.type];

    if (!expansions) {
        return [config];
    }

    return expansions.map(({ type, modify }) => {
        const expandedConfig = {
            ...config,
            type,
            _generated: true,
            _sourceType: config.type,
        };

        return modify
            ? modify(expandedConfig)
            : expandedConfig;
    });
};

export const expandIgnoreStrategies = (configs) => {
    return configs.flatMap(expandIgnoreStrategy);
};




export const isStrategyIgnored = (strategy, ignoreStrategyList) => {


    if (!ignoreStrategyList?.length) return false
    const strategySymbols = strategy.positions.map(pos => pos.symbol).map(symbol => symbol.replaceAll('ي', 'ی'));
    const strategyFullSymbolNames = strategy.positions.map(opt => opt.symbol).join('-').replaceAll('ي', 'ی');

    const isSymbolNameIgnoredChecker = ({ ignoreStrategyObj, strategy, strategySymbols }) => {
        if (!ignoreStrategyObj.name) return true

        const ignoreStrategyName = ignoreStrategyObj.name.replaceAll('ي', 'ی');
        if (ignoreStrategyName === strategyFullSymbolNames) return true
        if (strategySymbols.some(symbol => symbol.includes(ignoreStrategyName))) return true


    }



    const profitFilterCheck = ({ ignoreStrategyObj, strategy }) => {


        const hasFilter = ignoreStrategyObj.profitPercent != null;

        return {
            isPass: hasFilter ? strategy.profitPercent >= ignoreStrategyObj.profitPercent.val : null,
            hasFilter
        }

    }



    const sarBeSarFilterCheck = ({ ignoreStrategyObj, strategy }) => {

        const hasToSarBeSarFilter = ignoreStrategyObj.toSarBeSar != null;
        const hasToHighSarBeSarFilter = ignoreStrategyObj.toHighSarBeSar != null;
        const hasToLowSarBeSarFilter = ignoreStrategyObj.toLowSarBeSar != null;

        const hasFilter =
            hasToSarBeSarFilter ||
            hasToHighSarBeSarFilter ||
            hasToLowSarBeSarFilter;

        const check = (value, filter) => {
            if (value == null) {
                return true;
            }

            if (filter.min != null && value < filter.min) {
                return false;
            }

            if (filter.max != null && value > filter.max) {
                return false;
            }

            return true;
        };

        const isPass =
            (!hasToSarBeSarFilter ||
                check(
                    strategy.stockPriceToSarBeSarPercent,
                    ignoreStrategyObj.toSarBeSar
                )) &&
            (!hasToHighSarBeSarFilter ||
                check(
                    strategy.stockPriceToHighSarBeSarPercent,
                    ignoreStrategyObj.toHighSarBeSar
                )) &&
            (!hasToLowSarBeSarFilter ||
                check(
                    strategy.stockPriceToLowSarBeSarPercent,
                    ignoreStrategyObj.toLowSarBeSar
                ));

        return {
            isPass,
            hasFilter
        };
    };

    const allProfitFilterCheck = ({ ignoreStrategyObj, strategy }) => {

        const hasFilter = ignoreStrategyObj.allProfit != null;

        let isPass = null;
        if (hasFilter) {
            isPass = strategy.isWholeProfitable;
        }


        return {
            isPass,
            hasFilter
        }

    }




    return ignoreStrategyList.find(ignoreStrategyObj => {

        const isTypeIgnored = ignoreStrategyObj.type === 'ALL' || (ignoreStrategyObj.type === strategy.strategyTypeTitle);

        if (!isTypeIgnored) return false

        const isSymbolNameIgnored = isSymbolNameIgnoredChecker({ ignoreStrategyObj, strategy, strategySymbols });
        if (!isSymbolNameIgnored) return false



        const { hasFilter: hasProfitFilter, isPass: isProfitPass } = profitFilterCheck({ ignoreStrategyObj, strategy });
        if (hasProfitFilter && !isProfitPass) return true


        const { hasFilter: hasToSarBeSarFilter, isPass: isSarBeSarPass } = sarBeSarFilterCheck({ ignoreStrategyObj, strategy });
        if (hasToSarBeSarFilter && !isSarBeSarPass && !strategy.isWholeProfitable) return true



        const { hasFilter: hasAllProfitFilter, isPass: isAllProfitPass } = allProfitFilterCheck({ ignoreStrategyObj, strategy });
        if (hasAllProfitFilter && !isAllProfitPass) return true


        const hasAnyFilter = hasProfitFilter || hasToSarBeSarFilter || hasAllProfitFilter;

        return !hasAnyFilter

    }
    )

}