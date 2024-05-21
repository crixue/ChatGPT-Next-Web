import {Product} from "@/app/types/product-vo";

export interface VectorestoreUpgradeRequestVO {
    upgradeProductId: string;
    chargeMonths: number;
    isAutoRenew: boolean;
}

export interface VectorestoreUpgradeResponseVO {
    ifHaveEnoughMoney: boolean;
    userRestBalance?: number;
    recommendCharge: number;
    atLeastCharge: number;
    totalNeedPayAmount: number;
    chargeMonths: number;
    haveActiveOrder: boolean;
    activeProductId?: string;
    txnId?: string;
    expireDate?: Date;
    isAutoRenew: boolean;
}

export interface VectorstoreUpgradeProductVO {
    product: Product;
    monthlyUnitPrice: number;
}

