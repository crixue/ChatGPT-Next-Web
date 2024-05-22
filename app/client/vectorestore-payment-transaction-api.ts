import {BaseApiClient} from "@/app/client/base-client";
import {useAccessStore} from "@/app/store";
import {handleServerResponse} from "@/app/common-api";
import {getBackendApiHeaders} from "@/app/client/api";
import {
    UserCurrentVectorstoreProductVO,
    VectorestoreUpgradeRequestVO,
    VectorestoreUpgradeResponseVO,
    VectorstoreUpgradeProductVO
} from "@/app/types/vectorestore-payment-txn-vo";
import {Product} from "@/app/types/product-vo";


export class VectorstorePaymentTransactionApi extends BaseApiClient {
    path(path: string): string {
        let baseUrl = useAccessStore.getState().backendPaymentOrderApiUrl;
        return [baseUrl, path].join("");
    }

    async createAnDefaultFreeVectorstoreOrder() {
        const res = await super.fetchWithRedirect(this.path(
                `/api/vectorstore-payment-txn/create-free-vectorstore-order`),
            {
                method: "POST",
                headers: {
                    ...getBackendApiHeaders()
                },
            });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<UserCurrentVectorstoreProductVO>(await res.json());
    }

    async showVectorestoreUpgradePlan() {
        const res = await super.fetchWithRedirect(this.path(
                `/api/vectorstore-payment-txn/show-vectorestore-upgrade-plan-for-user`),
            {
                method: "GET",
                headers: {
                    ...getBackendApiHeaders()
                },
            });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<Product[]>(await res.json());
    }


    async createOrder(data: VectorestoreUpgradeRequestVO) {
        const res = await super.fetchWithRedirect(this.path(
                `/api/vectorstore-payment-txn/create-order`),
            {
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    ...getBackendApiHeaders()
                },
            });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<VectorestoreUpgradeResponseVO>(await res.json());
    }


}