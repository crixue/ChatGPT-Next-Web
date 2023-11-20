import {create} from "zustand";
import {persist} from "zustand/middleware";
import {ConversationMemoryType, LLMModel, MemoryTypeName} from "../client/api";
import {getClientConfig} from "../config/client";
import {DEFAULT_INPUT_TEMPLATE, DEFAULT_MEMORY_TYPES, DEFAULT_MODELS, StoreKey} from "../constant";
import Locale, { AllLangs, ALL_LANG_OPTIONS, Lang } from "../locales";

export type ModelType = (typeof DEFAULT_MODELS)[number]["name"];

export enum SubmitKey {
    Enter = "Enter",
    CtrlEnter = "Ctrl + Enter",
    ShiftEnter = "Shift + Enter",
    AltEnter = "Alt + Enter",
    MetaEnter = "Meta + Enter",
}

export enum Theme {
    Auto = "auto",
    Dark = "dark",
    Light = "light",
}

export const DEFAULT_CONFIG = {
    submitKey: SubmitKey.CtrlEnter as SubmitKey,
    avatar: "1f603",
    fontSize: 14,
    theme: Theme.Auto as Theme,
    tightBorder: !!getClientConfig()?.isApp,
    sendPreviewBubble: true,
    enableAutoGenerateTitle: true,
    sidebarWidth: 300,

    disablePromptHint: false,

    dontShowMaskSplashScreen: false, // dont show splash screen when create chat
    hideBuiltinMasks: false, // dont add builtin masks

    customModels: "",
    models: DEFAULT_MODELS as any as LLMModel[],
    memoryTypes: DEFAULT_MEMORY_TYPES as any as ConversationMemoryType[],

    modelConfig: {
        model: "chatglm2-6b" as ModelType,
        temperature: 0.8,
        topP: 0.9,
        maxTokens: 2000,
        // presence_penalty: 0,
        frequencyPenalty: 1.2,
        haveContext: true,
        memoryType: {
            name: "ConversationBufferWindowMemory" as MemoryTypeName,
            available: true
        },
        sendMemory: true,
        historyMessageCount: 4,
        compressMessageLengthThreshold: 2000,
        // enableInjectSystemPrompts: true,
        template: DEFAULT_INPUT_TEMPLATE,
    },
};

export const DEFAULT_SETUP_MODEL_CONFIG = {
    llm_type: "chatglm2-6b",
    llm_model_config: {
        temperature: 0.8,
        streaming: true,
        max_token: 10000,
        top_p: 0.9,
    },
    memory_type: "ConversationBufferWindowMemory",
    memory_additional_args: {
        memory_key: "chat_history",
        windows_k: 5,
        max_token_limit: 500,
    },
    prompt_serialized_type: "default",
    prompt_path: "/mnt/l/temp/prompt_templates/default/guest0/test_default_chat_prompts/default_chat_prompts.json",
    is_chinese_text: true,
    have_context: true,
}

export const DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS = {
    retriever_type:"web_search",
    local_vs_folder_name:"web_search",
    use_multi_query_assist:false,
    // retriever_type: "local_vector_stores",
    // local_vs_folder_name: "guest007/test_txt_file0",
    search_type: "similarity",
    search_top_k: 4,
    use_embedding_filter_assist: false,
    use_reorder_assist: false,
}

export type ChatConfig = typeof DEFAULT_CONFIG;

export type ChatConfigStore = ChatConfig & {
    reset: () => void;
    update: (updater: (config: ChatConfig) => void) => void;
    mergeModels: (newModels: LLMModel[]) => void;
    allModels: () => LLMModel[];
    allConversationMemoryTypes: () => ConversationMemoryType[];
};

export type ModelConfig = ChatConfig["modelConfig"];

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

export const useAppConfig = create<ChatConfigStore>()(
    persist(
        (set, get) => ({
            ...DEFAULT_CONFIG,

            reset() {
                set(() => ({...DEFAULT_CONFIG}));
            },

            update(updater) {
                const config = {...get()};
                updater(config);
                set(() => config);
            },

            mergeModels(newModels) {
                if (!newModels || newModels.length === 0) {
                    return;
                }

                const oldModels = get().models;
                const modelMap: Record<string, LLMModel> = {};

                for (const model of oldModels) {
                    model.available = false;
                    modelMap[model.name] = model;
                }

                for (const model of newModels) {
                    model.available = true;
                    modelMap[model.name] = model;
                }

                set(() => ({
                    models: Object.values(modelMap),
                }));
            },

            allModels() {
                const customModels = get()
                    .customModels.split(",")
                    .filter((v) => !!v && v.length > 0)
                    .map((m) => ({name: m, available: true}));

                const models = get().models.concat(customModels);
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
