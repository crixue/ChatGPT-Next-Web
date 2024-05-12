export enum PaymentToolEnum {
    UNKNOWN = -999,
    ALI_PAY = 1,
    WECHAT_PAY = 2
}

export enum PaymentToolDescEnum {
    UNKNOWN = "UNKNOWN",
    ALI_PAY = "ALI_PAY",
    WECHAT_PAY = "WECHAT_PAY"
}

export enum ChargeTradeStatusEnum {
    UNKNOWN = -999,
    INTERNAL_ERROR = -100,
    TRADE_CLOSED = -1,
    WAIT_BUYER_PAY = 0,
    TRADE_FINISHED = 2,
    TRADE_SUCCESS = 1
}

export interface WalletChargeTxnRequestVO {
    orderAmount: number;
    paymentTool: PaymentToolDescEnum;
}

export interface WapOrderResponseVO {
    txnId: string;
    expireMinutes: number;
    expireTime: string;
    aliPayRedirectUrl?: string;
}

export interface WalletChargeTxnTradeStatusVO {
    txnId: string;
    chargeTradeStatus: number;
}

export interface RefundableTxnDetailBO {
    txnId: string;
    orderTime: Date;
    refundableAmount: number;
    chargeAmount: number;
    paymentTool: PaymentToolDescEnum;
}

export interface RefundableTxnResponseVO {
    refundableTotalAmount: number;
    freezeAmount: number;
    refundableTxnDetails: RefundableTxnDetailBO[];
}

export interface WalletPaymentTransaction {
    id: string;
    productId: string;
    productName?: string;
    tradeStatus: number;
    orderTime: Date;
    orderExpireTime?: Date;
    orderAmount: number;
    detail?: string;
    thirdPartyId?: string;
    type: number;
    paymentTools: PaymentToolEnum;
    relatedId?: string;
    hasRefundBefore: boolean;
}
