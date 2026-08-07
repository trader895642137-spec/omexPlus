const RULE_NAME_MAP = {
    toSar: 'toSarBeSar',
    toLSar: 'toLowSarBeSar',
    toHSar: 'toHighSarBeSar',
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
        raw: ignoreStrategyName
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





export const parseIgnoreStrategies = (text) => {
    return text
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(parseIgnoreStrategy);
};