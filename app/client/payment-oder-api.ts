import {BaseApiClient} from "@/app/client/base-client";
import {useAccessStore} from "@/app/store";
import {handleServerResponse} from "@/app/common-api";
import {
    RefundableTxnResponseVO, WalletChargeTxnRequestVO,
    WalletChargeTxnTradeStatusVO,
    WalletPaymentTransaction,
    WapOrderResponseVO
} from "@/app/types/payment-order-vo";
import {getBackendApiHeaders} from "@/app/client/api";


export class PaymentOderApi extends BaseApiClient{
    path(path: string): string {
        let openaiUrl = useAccessStore.getState().backendPaymentOrderApiUrl;

        return [openaiUrl, path].join("");
    }

    async createPcPaymentOrder(walletChargeTxnRequestVO: WalletChargeTxnRequestVO) {
        const res = await super.fetchWithRedirect(this.path("/api/payment/create-pc-payment-order"), {
            method: "POST",
            body: JSON.stringify(walletChargeTxnRequestVO),
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<WapOrderResponseVO>(await res.json());
    }

    async queryWalletPaymentTransaction(txnId: string) {
        const res = await super.fetchWithRedirect(this.path(`/api/payment/query-wallet-payment-transaction/${txnId}`), {
            method: "GET",
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<WalletChargeTxnTradeStatusVO>(await res.json());
    }

    async listRefundableTxnsInfo() {
        const res = await super.fetchWithRedirect(this.path("/api/payment/list-refundable-txns-by-user-id"), {
            method: "GET",
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<RefundableTxnResponseVO>(await res.json());
    }

    async listAllTxnsByUserId(pageNum: number = 1, pageSize: number = 10) {
        const res = await super.fetchWithRedirect(this.path(`/api/payment/list-all-txns-by-user-id?pageNum=${pageNum}&pageSize=${pageSize}`), {
            method: "GET",
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<WalletPaymentTransaction[]>(await res.json());
    }

    async createRefundOrder() {
        const res = await super.fetchWithRedirect(this.path("/api/payment/create-refund-order"), {
            method: "POST",
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<void>(await res.json());
    }

    async applyReferralCode(referralCode: string) {
        const res = await super.fetchWithRedirect(this.path(`/api/referral-code/apply/${referralCode}`), {
            method: "POST",
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<string>(await res.json());
    }

}
