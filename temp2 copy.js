export const calcAveragePriceByExecutedOrders = (orders)=>{

    let position = 0; // تعداد سهام در پوزیشن (مثبت: خرید، منفی: فروش)
    let totalCost = 0; // ارزش کل خریدها
    let averagePrice = 0;
    
    // فیلتر کردن سفارشات معتبر (فقط سفارشات انجام شده با مقدار و قیمت معتبر)
    const validOrders = orders.filter(order => 
        order.orderStatus === "CompletelySettled" && 
        order.executedQuantity > 0 
        
    );
    
    // مرتب‌سازی بر اساس تاریخ
    const sortedOrders = [...validOrders].sort((a, b) => 
        new Date(a.createdDate) - new Date(b.createdDate)
    );
    
    
    for (const order of sortedOrders) {
        const quantity = order.executedQuantity;
        const price = order.executedPrice;
        const isBuy = order.orderSide === "Buy";
        
        if (isBuy) {
            if (position >= 0) {
                // در موقعیت خرید یا خنثی
                totalCost += quantity * price;
                position += quantity;
                averagePrice = totalCost / position;
            } else {
                // در موقعیت فروش
                const remainingShort = -position;
                
                if (quantity <= remainingShort) {
                    position += quantity;
                } else {
                    const coveringQuantity = remainingShort;
                    const newBuyQuantity = quantity - coveringQuantity;
                    position = 0;
                    
                    totalCost = newBuyQuantity * price;
                    position = newBuyQuantity;
                    averagePrice = price;
                }
            }
        } else { // Sell
            if (position <= 0) {
                // در موقعیت فروش یا خنثی
                const shortPosition = -position;
                const newShortValue = (shortPosition * averagePrice) + (quantity * price);
                position -= quantity;
                averagePrice = newShortValue / (-position);
            } else {
                // در موقعیت خرید
                const remainingLong = position;
                
                if (quantity <= remainingLong) {
                    totalCost -= quantity * averagePrice;
                    position -= quantity;
                    
                    if (position > 0) {
                        averagePrice = totalCost / position;
                    }
                } else {
                    const coveringQuantity = remainingLong;
                    const newSellQuantity = quantity - coveringQuantity;
                    
                    position = 0;
                    totalCost = 0;
                    
                    position = -newSellQuantity;
                    averagePrice = price;
                }
            }
        }
    }
    
    // تابع برای نمایش با 3 رقم اعشار (بدون گرد کردن)
    const to3Decimal = (num) => {
        if (isNaN(num) || num === 0) return 0;
        return Math.floor(num * 1000) / 1000;
    };
    
    return {
        quantity: position,
        averagePrice: to3Decimal(averagePrice),
        totalValue: to3Decimal(Math.abs(position) * averagePrice),
        side: position > 0 ? "Long" : (position < 0 ? "Short" : "Neutral")
    };

}