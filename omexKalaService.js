let contractsCachePromise = null;

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
                // در صورت خطا اجازه بده درخواست بعدی مجدداً تلاش کند
                contractsCachePromise = null;
                throw error;
            });
    }

    return contractsCachePromise;
};


export const getListOfTradedKalaAssetsFromOmex = async () => {
    const [contracts, tradedAssets] = await Promise.all([
        getOptionContracts(),

        fetch(
            'https://khobregan.tsetab.ir/api/gold/api/FeMrkViwMes/GetFeMrkViwMes?market=Option',
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

    return tradedAssets.map(asset => ({
        ...contractsMap.get(asset.symbol),
        ...asset
    }));
};