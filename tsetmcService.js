const TSETMC_BASE_URL =
    'https://cdn.tsetmc.com/api/ClosingPrice/GetMarketWatch';

// تمام این متغیرها خصوصی و مختص همین ماژول هستند
const assetsCache = new Map();

let currentHEven = 0;
let currentRefID = 0;

let pendingRequest = null;


export const getListOfTradedAssetsFromTSETMC = async () => {

    if (pendingRequest) {
        return pendingRequest;
    }

    pendingRequest = (async () => {

        const params = new URLSearchParams({
            market: '0',
            industrialGroup: '',
            'paperTypes[0]': '1',
            'paperTypes[1]': '2',
            'paperTypes[2]': '3',
            'paperTypes[3]': '4',
            'paperTypes[4]': '5',
            'paperTypes[5]': '6',
            'paperTypes[6]': '7',
            'paperTypes[7]': '8',
            'paperTypes[8]': '9',
            showTraded: 'false',
            withBestLimits: 'true',
            hEven: String(currentHEven),
            RefID: String(currentRefID)
        });

        const response = await fetch(
            `${TSETMC_BASE_URL}?${params.toString()}`
        );

        if (!response.ok) {
            throw new Error('خطا در دریافت اطلاعات TSETMC');
        }

        const data = await response.json();

        if (!Array.isArray(data.marketwatch)) {
            throw new Error('ساختار پاسخ TSETMC معتبر نیست');
        }

        let maxHEven = currentHEven;
        let maxRefID = currentRefID;

        for (const asset of data.marketwatch) {

            maxHEven = Math.max(
                maxHEven,
                Number(asset.hEven) || 0
            );

            for (const order of asset.blDs || []) {
                maxRefID = Math.max(
                    maxRefID,
                    Number(order.rid) || 0
                );
            }

            const previousAsset = assetsCache.get(asset.insCode) || {};

            assetsCache.set(asset.insCode, {
                ...previousAsset,
                ...asset
            });
        }

        currentHEven = maxHEven;
        currentRefID = maxRefID;

        return Array.from(assetsCache.values());

    })();

    try {
        return await pendingRequest;
    } finally {
        pendingRequest = null;
    }
};