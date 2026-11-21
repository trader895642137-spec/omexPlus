
const origin = window.location.origin;
const redOrigin = origin.replace('.tsetab','-red.tsetab');
const deltaOrigin = origin.replace('.tsetab','-delta.tsetab');

let contractsCachePromise = null;
let commoditiesCachePromise = null;


const stockInfosCache = new Map();

const getStockInfos = async (instrumentIds) => {
    const ids = [...new Set(instrumentIds.filter(Boolean))].sort();

    if (!ids.length) return [];

    const cacheKey = JSON.stringify(ids);

    if (!stockInfosCache.has(cacheKey)) {
        const promise = fetch(`${redOrigin}/api/PublicMessages/GetInstruments`, {
            headers: {
                accept: 'application/json, text/plain, */*',
                authorization: JSON.parse(localStorage.getItem('auth')),
                'content-type': 'application/json',
                'ngsw-bypass': ''
            },
            referrer: `${origin}/`,
            body: JSON.stringify({ instrumentIds: ids }),
            method: 'POST',
            mode: 'cors',
            credentials: 'include'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('خطا در دریافت اطلاعات نمادها');
                }

                return response.json();
            })
            .then(res => res.response.data)
            .catch(error => {
                stockInfosCache.delete(cacheKey);
                throw error;
            });

        stockInfosCache.set(cacheKey, promise);
    }

    return stockInfosCache.get(cacheKey);
};

const getOptionContracts = async () => {
    if (!contractsCachePromise) {
        contractsCachePromise = fetch(
            'https://khobregan.tsetab.ir/api/gold/api/DataOperations/GetContracts?market=Option',
            {
                headers: {
                    accept: 'application/json, text/plain, */*',
                    authorization: JSON.parse(localStorage.getItem('auth')),
                    'ngsw-bypass': ''
                },
                referrer: `${window.location.origin}/`,
                method: 'GET',
                mode: 'cors',
                credentials: 'include'
            }
        )
            .then(response => {
                if (!response.ok) {
                    throw new Error('خطا در دریافت اطلاعات قراردادها');
                }

                return response.json();
            })
            .then(result => result.response.data)
            .catch(error => {
                contractsCachePromise = null;
                throw error;
            });
    }

    return contractsCachePromise;
};

const getCommodities = async () => {
    if (!commoditiesCachePromise) {
        commoditiesCachePromise = fetch(
            'https://khobregan.tsetab.ir/api/gold/api/DataOperations/GetCommodities',
            {
                headers: {
                    accept: 'application/json, text/plain, */*',
                    authorization: JSON.parse(localStorage.getItem('auth')),
                    'ngsw-bypass': ''
                },
                referrer: `${window.location.origin}/`,
                method: 'GET',
                mode: 'cors',
                credentials: 'include'
            }
        )
            .then(response => {
                if (!response.ok) {
                    throw new Error('خطا در دریافت اطلاعات کالاها');
                }

                return response.json();
            })
            .then(result => result.response.data)
            .catch(error => {
                commoditiesCachePromise = null;
                throw error;
            });
    }

    return commoditiesCachePromise;
};

export const getListOfTradedKalaAssetsFromOmex = async () => {
    const [contracts, commodities, tradedAssets] = await Promise.all([
        getOptionContracts(),
        getCommodities(),

        fetch(
            'https://khobregan.tsetab.ir/api/gold/api/FeMrkViwMes/GetFeMrkViwMes?market=Option',
            {
                headers: {
                    accept: 'application/json, text/plain, */*',
                    authorization: JSON.parse(localStorage.getItem('auth')),
                    'ngsw-bypass': ''
                },
                referrer: `${origin}/`,
                method: 'GET',
                mode: 'cors',
                credentials: 'include'
            }
        ).then(response => {
            if (!response.ok) {
                throw new Error('خطا در دریافت اطلاعات');
            }

            return response.json();
        }).then(result => result.response.data)
    ]);

    const contractsMap = new Map(
        contracts.map(contract => [contract.symbol, contract])
    );

    const commoditiesMap = new Map(
        commodities.map(commodity => [
            commodity.commodityId,
            commodity.baseInstrumentIds?.[0]?.instrumentId
        ])
    );

    // استخراج شناسه تمام نمادهای پایه
    const baseInstrumentIds = [
        ...new Set(
            [...commoditiesMap.values()].filter(Boolean)
        )
    ];

    // دریافت اطلاعات نمادهای پایه (کش‌شونده)
    const stockInfos = await getStockInfos(baseInstrumentIds);

    const stockInfosMap = new Map(
        stockInfos.map(info => [
            info.instrumentId,
            info.lVal18AFC
        ])
    );

    return tradedAssets.map(asset => {
        const contract = contractsMap.get(asset.contractSymbol);

        const baseInstrumentId = commoditiesMap.get(
            contract?.commodityId
        );

        return {
            ...contract,
            ...asset,
            baseInstrumentId,
            baseInstrumentSymbol: stockInfosMap.get(baseInstrumentId)
        };
    });
};