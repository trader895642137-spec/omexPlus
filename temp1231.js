const createPositionObjectArray  = (strategyItemList) => {
    return strategyItemList.map(strategyItem => {
        const isDOM = strategyItem instanceof Element;

        const instrumentName =  isDOM ? strategyItem.querySelector('.instrument-title span').innerHTML:strategyItem.portfolioAssetInfo.instrumentName;
        let optionID = isDOM ? Array.from(domContextWindow.document.querySelectorAll('client-option-positions-main .ag-pinned-right-cols-container .ag-row'))?.find(optionNameCellEl => Array.from(optionNameCellEl.querySelectorAll('span'))?.find(span => span.innerHTML === instrumentName))?.getAttribute('row-id') : strategyItem.portfolioAssetInfo.instrumentId;
        const isBuy = isDOM ? strategyItem.querySelector('client-option-strategy-estimation-main-ui-order-side .-isActive')?.classList?.contains('buy') : strategyItem.side==="Buy";

        const isOption = isInstrumentNameOfOption(instrumentName);

        const isPut = isOption && instrumentName && instrumentName.charAt(0) === 'ط';

        const isCall = isOption && instrumentName && instrumentName.charAt(0) === 'ض';
        let cSize = isOption ? defaultCSize : 1;
        let daysLeftToSettlement = defaultDaysLeftToSettlement;

        const ordersModal =isDOM ? Array.from(domContextWindow.document.querySelectorAll('client-option-modal-trade-layout')).find(modal => {
            return Array.from(modal.querySelectorAll('label')).find(label => label.innerHTML === instrumentName)
        }
        ):null;

        const instrumentFullTitle = isDOM?  ordersModal && ordersModal.querySelector('client-option-instruments-favorites-item-header main > span').innerHTML : strategyItem.portfolioAssetInfo.lVal30;

        const getOffsetOrderPriceElements = () => (ordersModal && ordersModal.querySelectorAll(`client-instrument-best-limit-ui-option client-instrument-price-position-row[orderside="${isBuy ? 'Buy' : 'Sell'}"] .-is-price span`)) || [];

        const getOpenMoreOrderPriceElements = () => (ordersModal && ordersModal.querySelectorAll(`client-instrument-best-limit-ui-option client-instrument-price-position-row[orderside="${isBuy ? 'Sell' : 'Buy'}"] .-is-price span`)) || [];

        const getBestOffsetPrice = () => {
            const priceElement = getOffsetOrderPriceElements()[0];
            return priceElement && convertStringToInt(priceElement.innerHTML);
        }

        const getBestOpenMorePrice = () => {
            const priceElement = getOpenMoreOrderPriceElements()[0];
            return priceElement && convertStringToInt(priceElement.innerHTML);
        }

        const getQuantity = () => {
            const cSize = getCSize();
            const quantity = isDOM? convertStringToInt(strategyItem.querySelector('[formcontrolname="quantity"] input').value): strategyItem.quantity;
            const quantityMultiplier = isOption ? cSize : 1;
            return quantity * quantityMultiplier;
        }


        let cachedCurrentPositionQuantityElement;
        const getCSize = ()=>{
            if(instrumentExtraDataMap){
                const instrumentExtraData = instrumentExtraDataMap[instrumentName];
                return instrumentExtraData?.cSize || cSize;

            }else{
                return strategyItem.portfolioAssetInfo.cSize
            }
        }
        const getOptionID = ()=>{
            if(instrumentExtraDataMap){
                const instrumentExtraData = instrumentExtraDataMap[instrumentName];
                return instrumentExtraData?.optionID || optionID;

            }else{
                return strategyItem.instrumentId
            }
        }
        const getInstrumentID = ()=>{
            if(instrumentExtraDataMap){
                const instrumentExtraData = instrumentExtraDataMap[instrumentName];
                return instrumentExtraData?.instrumentId;
            }else{
                return strategyItem.instrumentId
            }
        }
        const getDaysLeftToSettlement= ()=>{
            if(instrumentExtraDataMap){
                const instrumentExtraData = instrumentExtraDataMap[instrumentName];
                return instrumentExtraData?.daysLeftToSettlement;

            }else{
                const daysLeftToSettlement = isOption ? Math.ceil((new Date(strategyItem.portfolioAssetInfo.psDate).valueOf() - Date.now()) / (24 * 60 * 60000)): null;
                return daysLeftToSettlement

            }


        }
        const getCurrentPositionQuantity = () => {

            optionID = getOptionID();
            const cSize = getCSize();

            let currentPositionQuantity
            if(isDOM){

                cachedCurrentPositionQuantityElement = domContextWindow.document.body.contains(cachedCurrentPositionQuantityElement) ? cachedCurrentPositionQuantityElement : domContextWindow.document.querySelector(`client-option-positions-main .ag-center-cols-clipper [row-id="${optionID}"] [col-id="${isBuy ? 'buyCount' : 'sellCount'}"]`);
                if (cachedCurrentPositionQuantityElement) {
                    currentPositionQuantity = convertStringToInt(cachedCurrentPositionQuantityElement?.innerHTML);
                } else {
                    currentPositionQuantity = getOrderModalPortfolioQuantity();
                }
            }else{
                currentPositionQuantity = strategyItem.portfolioAssetInfo.count;
            }


            const quantityMultiplier = isOption ? cSize : 1;
            return currentPositionQuantity * quantityMultiplier;

        }


        let cachedOrderModalPortfolioQuantityElement;
        const getOrderModalPortfolioQuantity = () => {
            cachedOrderModalPortfolioQuantityElement = domContextWindow.document.body.contains(cachedOrderModalPortfolioQuantityElement) ? cachedOrderModalPortfolioQuantityElement : ordersModal.querySelector('.o-quantityContainer footer span');
            return convertStringToInt(cachedOrderModalPortfolioQuantityElement?.innerHTML) || 0

        }
        let cachedOrderModalQuantityFooterElement
        const getOrderModalQuantityFooterElement = () => {
            if (!domContextWindow.document.body.contains(cachedOrderModalQuantityFooterElement)) {
                cachedOrderModalQuantityFooterElement = ordersModal.querySelector('.o-quantityContainer footer')
            }


            return cachedOrderModalQuantityFooterElement

        }

        let cachedOrderModalTradePanelElement
        const getOrderModalTradePanelElement = () => {
            if (!domContextWindow.document.body.contains(cachedOrderModalTradePanelElement)) {
                cachedOrderModalTradePanelElement = ordersModal.querySelector('client-instrument-favorites-item-trade-panel')
            }


            return cachedOrderModalTradePanelElement

        }


        let cachedOrderModalStrategyDropdownElement;
        const getOrderModalStrategyDropdownElement = ()=>{
            if (!domContextWindow.document.body.contains(cachedOrderModalTradePanelElement)) {
                cachedOrderModalStrategyDropdownElement = ordersModal.querySelector('client-instrument-favorites-item-trade-panel ng-select.-is-strategyDropdown');
            }


            return cachedOrderModalStrategyDropdownElement
        }


        


         let cachedOrderModalQuantityInputElement;
        const getOrderModalQuantityInputElement = ()=>{
            if (!domContextWindow.document.body.contains(cachedOrderModalQuantityInputElement)) {
                cachedOrderModalQuantityInputElement =ordersModal.querySelector('#tabKey-optionTradeQuantityInput');
            }


            return cachedOrderModalQuantityInputElement
        }



        
         let cachedOrderModalQuantityInputArrowUpElement;
        const getOrderModalQuantityInputArrowUpElement = ()=>{
            if (!domContextWindow.document.body.contains(cachedOrderModalQuantityInputArrowUpElement)) {
                cachedOrderModalQuantityInputArrowUpElement = ordersModal.querySelector('[iconname="arrow-up-filled"]');
            }


            return cachedOrderModalQuantityInputArrowUpElement
        }


         let cachedOrderModalPriceElement;
        const getOrderModalPriceInputElement = ()=>{
            if (!domContextWindow.document.body.contains(cachedOrderModalPriceElement)) {
                 cachedOrderModalPriceElement =ordersModal.querySelector('#tabKey-optionTradePriceInput');
            }

            return cachedOrderModalPriceElement
        }

        const getRequiredMargin = () => {

            const isMarginRequired = isDOM ? strategyItem.querySelector('input[formcontrolname="requiredMarginIsSelected"]')?.checked: strategyItem.requiredMarginIsSelected;
            const cSize = getCSize()

            if (!isMarginRequired)
                return 0

            const requiredMargin = (isDOM? convertStringToInt(strategyItem.querySelector('[formcontrolname="requiredMargin"] input').value) : requiredMargin.requiredMargin) / cSize;

            return requiredMargin
        }

        const getInsertedPrice = () => {
            const insertedPrice = convertStringToInt(strategyItem.querySelector('[formcontrolname="price"] input').value);
            return insertedPrice;
        }

        const getInsertedQuantity = () => {
            const insertedQuantity = convertStringToInt(strategyItem.querySelector('[formcontrolname="quantity"] input').value);
            return insertedQuantity;
        }

        const calcBestSecondOrderPriceRatioDiff = (priceOrderElements) => {
            if (!priceOrderElements || priceOrderElements.length < 2)
                return

            const bestPrice = convertStringToInt(priceOrderElements[0].innerHTML);
            const secondPrice = convertStringToInt(priceOrderElements[1].innerHTML);

            const bestSecondPriceRatio = Math.abs((bestPrice / secondPrice) - 1);

            let bestSecondPriceDiff = Math.abs(bestPrice - secondPrice);

            return {
                diff: bestSecondPriceDiff,
                ratio: bestSecondPriceRatio
            }

        }

        const getBestSecondPriceRatioDiff = (chooseBestPriceType) => {
            return calcBestSecondOrderPriceRatioDiff(chooseBestPriceType === 'offset' ? getOffsetOrderPriceElements() : getOpenMoreOrderPriceElements());
        }


        function getCurrentPositionAvgPrice(position)  {


            const instrumentId = (position || this).getInstrumentID();
            const instrumentName = (position || this).instrumentName;
            let executedPrice,breakEvenPrice;
            optionID = getOptionID();

            const recentExactDecimalPricesOfPortFolioObj = (instrumentId || instrumentName) && getRecentExactDecimalPricesOfPortFolio({instrumentId,instrumentName});


            const recentCalculatedAvgPrices  =  getRecentCalculatedAvgPrices({instrumentId,instrumentName});
            if(recentCalculatedAvgPrices){

                executedPrice = recentCalculatedAvgPrices.avgPrice;
                breakEvenPrice = recentCalculatedAvgPrices.avgPrice;
                showToast('استفاده از میانگین های حساب شده');

            }
            else if(recentExactDecimalPricesOfPortFolioObj){
                executedPrice = recentExactDecimalPricesOfPortFolioObj.executedPrice;
                breakEvenPrice = recentExactDecimalPricesOfPortFolioObj.breakEvenPrice;
            }else{

                if(isDOM){
                    const executedPriceSelector = `client-option-positions-main .ag-center-cols-clipper [row-id="${optionID}"] [col-id="executedPrice"]`;
                    const breakEvenPriceSelector = `client-option-positions-main .ag-center-cols-clipper [row-id="${optionID}"] [col-id="breakEvenPrice"]`;
                    executedPrice = convertStringToInt(domContextWindow.document.querySelector(executedPriceSelector)?.innerHTML);
                    breakEvenPrice = convertStringToInt(domContextWindow.document.querySelector(breakEvenPriceSelector)?.innerHTML);

                }else{

                    executedPrice = strategyItem.portfolioAssetInfo.executedPrice;
                    breakEvenPrice = strategyItem.portfolioAssetInfo.breakEvenPrice;

                }
            }
            if (executedPrice && breakEvenPrice && hasBreakevenExecutedPriceDiffIssue({executedPrice,breakEvenPrice})) {

                const issueMessage = 'مشکل تفاوت میانگین و سر به سر';
                console.log(issueMessage,{instrumentName,executedPrice,breakEvenPrice});
                
                showToast(issueMessage,50000,'error');
                // !domContextWindow.window.doNotNotifAvrageIssue && showNotification({
                //     title: issueMessage,
                //     body: `${instrumentName}`,
                //     tag: `CurrentPositionAvgPriceIssue`
                // });
                return breakEvenPrice
            }

            return executedPrice || getUnreliableCurrentPositionAvgPrice()

        }


        let cachedUnreliableCurrentPositionAvgPriceElement;
        const getUnreliableCurrentPositionAvgPrice = () => {
             
 

            if (!domContextWindow.document.body.contains(cachedUnreliableCurrentPositionAvgPriceElement)) {
                const labelText = 'میانگین';
                const xpath = `.//label[normalize-space(text())='${labelText}']/following-sibling::span[1]`;

                const avgPriceElement = domContextWindow.document.evaluate(
                    xpath,
                    ordersModal, // فقط در این محدوده بگرد
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue;

                cachedUnreliableCurrentPositionAvgPriceElement = avgPriceElement || null

            }

            return convertStringToInt(cachedUnreliableCurrentPositionAvgPriceElement.innerHTML) || 0

        }



       



        const getStrategyName = () => {
            return isDOM ? domContextWindow.document.querySelector('client-option-strategy-estimation-header c-k-input-text input')?.value : strategyItem.strategyTitle
        }

        const getBestOpenMorePriceWithSideSign = () => {
            const bestOpenMorePrice = getBestOpenMorePrice();
            if (!bestOpenMorePrice)
                return
            return bestOpenMorePrice * (isBuy ? -1 : 1);
        }

        const strikePrice = isDOM ? convertStringToInt(domContextWindow.document.querySelector(`client-option-positions-main .ag-center-cols-clipper [row-id="${optionID}"] [col-id="strikePrice"]`)?.innerHTML) || convertStringToInt(strategyItem.querySelectorAll('.o-item-row > div')[5].innerHTML) : strategyItem.portfolioAssetInfo.strikePrice;
        

       

        const getStrategyType = () => {
            const strategyName = getStrategyName();
            if (!strategyName)
                return

            const strategyType = strategyName.split('@')[0];
            return 
            // return ['COVERED'].find(type => strategyType === type);
            // return ['BUCS_COLLAR', 'BUPS_COLLAR', 'BEPS_COLLAR', 'BUCS', 'BECS', 'BUPS', 'BEPS', 'BOX_BUPS_BECS', 'BOX', 'COVERED', 'GUTS', 'LongGUTS_STRANGLE', 'CALL_BUTT_CONDOR'].find(type => strategyType === type);
        }


      


        let strategyPosition = {
            strategyItem,
            // TODO: is not just option meybe stock
            instrumentName,
            instrumentFullTitle,
            isBuy,
            isETF : isETF(instrumentName),
            optionID,
            isOption,
            isCall,
            isPut,
            cSize,
            getCSize,
            getOptionID,
            getInstrumentID,
            getDaysLeftToSettlement,
            getQuantity,
            getCurrentPositionQuantity,
            getOrderModalPortfolioQuantity,
            getOrderModalQuantityFooterElement,
            getOrderModalTradePanelElement,
            getOrderModalStrategyDropdownElement,
            getOrderModalQuantityInputElement,
            getOrderModalPriceInputElement,
            getOrderModalQuantityInputArrowUpElement,
            getInsertedPrice,
            getInsertedQuantity,
            getRequiredMargin,
            getCurrentPositionAvgPrice,
            getUnreliableCurrentPositionAvgPrice,
            strikePrice,
            daysLeftToSettlement,
            ordersModal,
            getOffsetOrderPriceElements,
            getOpenMoreOrderPriceElements,
            getBestOffsetPrice,
            getBestOpenMorePrice,
            getBestSecondPriceRatioDiff,
            getBestOpenMorePriceWithSideSign,
            getStrategyName,
            getStrategyType,
            observers: []
        }

        return strategyPosition
    }
    );
}
