export interface MonthlyModelUsage {
    productId: string;
    productName?: string;
    statisticalMonth?: string;
    tokenCount?: number;
    costCount?: number;
}

export interface SimpleModelUsageShownVO {
    currentMonthTotalCost: number;
    currentMonthTotalUsage: string;
    currentMonthTotalUsageInt: number;
    currentMonthTotalDuration: string;
    currentMonthTotalDurationSecondsInt: number;
    currentMonthlyModelUsageList: MonthlyModelUsage[];
    lastNMonthsModelUsageInfo: Map<string, SimpleModelUsageShownVO>;
}

export interface UserBalanceInfoVO {
    balance: number;
}


