import {create} from "zustand";
import {persist} from "zustand/middleware";
import {
    ChatConfigStore,
    DEFAULT_CONFIG,
    DEFAULT_MODELS,
    StoreKey
} from "../constant";
import {LangchainBackendApi} from "@/app/client/langchain-backend";
import {SupportedModelVO} from "@/app/types/model-vo";

export type ModelType = (typeof DEFAULT_MODELS)[number]["name"];


export function limitNumber(
    x: number,
    min: number,
    max: number,
    defaultValue: number,
) {
    if (typeof x !== "number" || isNaN(x)) {
        return defaultValue;
    }

    return Math.min(max, Math.max(min, x));
}

export const ModalConfigValidator = {
    model(x: string) {
        return x as ModelType;
    },
    maxTokens(x: number) {
        return limitNumber(x, 0, 4000, 2000);
    },
    presence_penalty(x: number) {
        return limitNumber(x, -2, 2, 0);
    },
    frequencyPenalty(x: number) {
        return limitNumber(x, -2, 2, 1.1);
    },
    temperature(x: number) {
        return limitNumber(x, 0, 1, 0.5);
    },
    top_p(x: number) {
        return limitNumber(x, 0, 1, 0.9);
    },
    historyMessageCount(x: number) {
        return limitNumber(x, 0, 20, 5);
    },
};

const langChainBackendService = new LangchainBackendApi();

export const useAppConfig = create<ChatConfigStore>()(
    persist(
        (set, get) => ({
            ...DEFAULT_CONFIG,
            supportedModels: [],
            defaultModel: undefined,
            reset() {
                set(() => ({...DEFAULT_CONFIG}));
            },
            update(updater) {
                const config = {...get()};
                updater(config);
                set(() => config);
            },

            async allModels() {
                const config = {...get()};
                const models = await langChainBackendService.listAllModels();
                for (const model of models) {
                    if (model.default) {
                        config.defaultModel = model;
                        config.modelConfig.model_id = model.id;
                        break;
                    }
                }
                config.supportedModels = models;
                set(() => config);
                return models;
            },

        }),
        {
            name: StoreKey.Config,
        },
    ),
);
