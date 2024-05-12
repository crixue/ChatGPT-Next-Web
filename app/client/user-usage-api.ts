import {BaseApiClient} from "@/app/client/base-client";
import {useAccessStore} from "@/app/store";
import {handleServerResponse} from "@/app/common-api";
import {getBackendApiHeaders} from "@/app/client/api";
import {SimpleModelUsageShownVO, UserBalanceInfoVO} from "@/app/types/user-usage-vo";
import {NotHaveEnoughMoneyException} from "@/app/exceptions/not-have-enough-money-exception";

export class UserUsageApi extends BaseApiClient{
    path(path: string): string {
        let openaiUrl = useAccessStore.getState().backendPaymentOrderApiUrl;

        return [openaiUrl, path].join("");
    }

    async simpleShowUserBalance() {
        const res = await super.fetchWithRedirect(this.path("/api/user-usage-info/show-user-balance"), {
            method: "GET",
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<UserBalanceInfoVO>(await res.json());
    }

    async hasEnoughMoney() {
        const res = await super.fetchWithRedirect(this.path("/api/user-usage-info/has-enough-money"), {
            method: "GET",
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        const hasEnoughMoney = handleServerResponse<boolean>(await res.json());
        if (!hasEnoughMoney) {
            throw new NotHaveEnoughMoneyException("Not enough money");
        }
        return;
    }

    async simpleShowTokenUsage(lastNMonth: number = 0) {
        const res = await super.fetchWithRedirect(this.path("/api/user-usage-info/simple-show-token-usage?lastNMonth="+lastNMonth), {
            method: "GET",
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<SimpleModelUsageShownVO>(await res.json());
    }

}