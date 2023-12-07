import {create} from "zustand";
import {persist} from "zustand/middleware";
import {ConversationMemoryType, LLMModel, MemoryTypeName} from "../client/api";
import {
    ChatConfigStore,
    DEFAULT_CONFIG,
    DEFAULT_MODELS,
    StoreKey
} from "../constant";
import Locale, { AllLangs, ALL_LANG_OPTIONS, Lang } from "../locales";
import {LangchainBackendApi} from "@/app/client/platforms/langchain-backend";

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
        return limitNumber(x, 0, 100000, 2000);
    },
    presence_penalty(x: number) {
        return limitNumber(x, -2, 2, 0);
    },
    frequencyPenalty(x: number) {
        return limitNumber(x, -2, 2, 0);
    },
    temperature(x: number) {
        return limitNumber(x, 0, 1, 1);
    },
    top_p(x: number) {
        return limitNumber(x, 0, 1, 1);
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
                const customModels = await langChainBackendService.listAllModels();
                const models = customModels.map((m) => {
                    return {
                        name: m.name,
                        available: true,
                        alias: m.alias
                    }
                }) as LLMModel[];
                config.modelConfig.model = models[0].name;
                config.defaultModel = models[0];
                config.supportedModels = models;
                set(() => config);
                return models;
            },

            allConversationMemoryTypes() {
                const memoryTypes = get().memoryTypes;
                const allMemoryTypes = Object.values(Locale.Settings.ConversationMemoryType.MemoryTypes);
                memoryTypes.forEach((m) => {
                    allMemoryTypes.map((t) => {
                        if (t.name === m.name) {
                            m.label = t.label;
                        }
                    });
                    return m;
                });
                return memoryTypes;
            }
        }),
        {
            name: StoreKey.Config,
            // version: 3.7,
            // migrate(persistedState, version) {
            //     const state = persistedState as ChatConfig;
            //
            //     if (version < 3.4) {
            //         state.modelConfig.sendMemory = true;
            //         state.modelConfig.historyMessageCount = 4;
            //         state.modelConfig.compressMessageLengthThreshold = 1000;
            //         state.modelConfig.frequencyPenalty = 0;
            //         state.modelConfig.topP = 1;
            //         // state.modelConfig.template = DEFAULT_INPUT_TEMPLATE;
            //         state.dontShowMaskSplashScreen = false;
            //         state.hideBuiltinMasks = false;
            //     }
            //
            //     if (version < 3.5) {
            //         state.customModels = "claude,claude-100k";
            //     }
            //
            //     if (version < 3.6) {
            //         // state.modelConfig.enableInjectSystemPrompts = true;
            //     }
            //
            //     if (version < 3.7) {
            //         state.enableAutoGenerateTitle = true;
            //     }
            //
            //     return state as any;
            // },
        },
    ),
);
