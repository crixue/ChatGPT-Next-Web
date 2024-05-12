import {create} from "zustand";
import {persist} from "zustand/middleware";
import { DEFAULT_MODELS, StoreKey} from "../constant";
import {getBackendApiHeaders,} from "../client/api";
import {getClientConfig} from "../config/client";

export interface AccessControlStore {
    accessCode: string;
    token: string;

    needCode: boolean;
    hideUserApiKey: boolean;
    hideBalanceQuery: boolean;
    disableGPT4: boolean;

    openaiUrl: string;
    backendCoreApiUrl: string;
    backendUserApiUrl: string;
    backendPaymentOrderApiUrl: string;
}


export const useAccessStore = create<AccessControlStore>()(
        (set, get) => ({
            token: "",
            accessCode: "",
            needCode: true,
            hideUserApiKey: true,
            hideBalanceQuery: false,
            disableGPT4: false,

            openaiUrl: getClientConfig()?.defaultOpenAiUrl ?? "http://localhost:3000",
            backendCoreApiUrl:  getClientConfig()?.backendCoreApiUrl ?? "http://localhost:3000",
            backendUserApiUrl:  getClientConfig()?.backendUserApiUrl ?? "http://localhost:3000",
            backendPaymentOrderApiUrl:  getClientConfig()?.backendPaymentOrderApiUrl ?? "http://localhost:3000",
        }),
);
