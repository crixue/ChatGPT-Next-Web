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

    updateToken: (_: string) => void;
    updateCode: (_: string) => void;
    updateOpenAiUrl: (_: string) => void;
    enabledAccessControl: () => boolean;
    isAuthorized: () => boolean;
    fetch: () => void;
}

let fetchState = 0; // 0 not fetch, 1 fetching, 2 done


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
            enabledAccessControl() {
                get().fetch();

                return get().needCode;
            },
            updateCode(code: string) {
                set(() => ({accessCode: code?.trim()}));
            },
            updateToken(token: string) {
                set(() => ({token: token?.trim()}));
            },
            updateOpenAiUrl(url: string) {
                set(() => ({openaiUrl: url?.trim()}));
            },
            isAuthorized() {
                get().fetch();

                // has token or has code or disabled access control
                return (
                    !!get().token || !!get().accessCode || !get().enabledAccessControl()
                );
            },
            fetch() {
                if (fetchState > 0 || getClientConfig()?.buildMode === "export") return;
                fetchState = 1;
                fetch("/api/config", {
                    method: "post",
                    body: null,
                    headers: {
                        ...getBackendApiHeaders(),
                    },
                })
                    .then((res) => res.json())
                    .then((res: DangerConfig) => {
                        // console.log("[Config] got config from server", res);
                        set(() => ({...res}));

                        if (res.disableGPT4) {
                            DEFAULT_MODELS.forEach(
                                (m: any) => (m.available = !m.name.startsWith("gpt-4")),
                            );
                        }
                    })
                    .catch(() => {
                        console.error("[Config] failed to fetch config");
                    })
                    .finally(() => {
                        fetchState = 2;
                    });
            },
        }),
);
