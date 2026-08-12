const calculateFixedMargin = async () => {


    const positions = await getOptionPortfolioList();
    const strategies = await getOptionStrategies();
    const positionMap = new Map(
        positions.map(p => [p.instrumentId, p])
    );

    let totalFixedDMargin = 0;

    const details = [];

    for (const strategy of strategies) {

        // فعلاً Butterfly را جداگانه مدیریت می‌کنیم
        if (!FIXED_MARGIN_STRATEGIES.has(strategy.type)) {
            continue;
        }

        const p1 = positionMap.get(strategy.baseStrategyInstrumentId);
        const p2 = positionMap.get(strategy.strategyInstrumentId);

        if (!p1 || !p2) {
            console.warn(
                "Position not found for strategy:",
                strategy.type,
                strategy.id,
                strategy.baseStrategyInstrumentName,
                strategy.strategyInstrumentName
            );

            continue;
        }

        const strike1 = Number(p1.strikePrice);
        const strike2 = Number(p2.strikePrice);

        const contractSize = Number(p1.cSize);

        // تعداد واقعی Spread
        const quantity = Number(
            strategy.quantity
        );

        const strikeDifference = Math.abs(strike1 - strike2);

        const margin =
            strikeDifference *
            contractSize *
            quantity;

        totalFixedDMargin += margin;

        details.push({
            strategyId: strategy.id,
            type: strategy.type,

            instrument1: p1.instrumentName,
            instrument2: p2.instrumentName,

            strike1,
            strike2,
            strikeDifference,

            contractSize,
            quantity,

            margin
        });
    }

    console.log({ totalFixedDMargin, details });


    return {
        totalFixedDMargin,
        details
    };
}
