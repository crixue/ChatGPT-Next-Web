import {getClientConfig} from "@/app/config/client";
import {ConversationMemoryType, LLMModel, MemoryTypeName} from "@/app/client/api";
import {nanoid} from "nanoid";
import {ChatMessage} from "@/app/store";
import {extraPromptPlaceHolders} from "@/app/utils/common-util";
import Locales from "./locales";
import {PluginsPage} from "@/app/components/plugins";

export const OWNER = "Yidadaa";
export const REPO = "ChatGPT-Next-Web";
export const REPO_URL = `https://github.com/${OWNER}/${REPO}`;
export const ISSUE_URL = `https://github.com/${OWNER}/${REPO}/issues`;
export const UPDATE_URL = `${REPO_URL}#keep-updated`;
export const RELEASE_URL = `${REPO_URL}/releases`;
export const FETCH_COMMIT_URL = `https://api.github.com/repos/${OWNER}/${REPO}/commits?per_page=1`;
export const FETCH_TAG_URL = `https://api.github.com/repos/${OWNER}/${REPO}/tags?per_page=1`;
export const RUNTIME_CONFIG_DOM = "danger-runtime-config";
export const DEFAULT_API_HOST = "https://chatgpt1.nextweb.fun/api/proxy";

export enum Path {
    Home = "/",
    Chat = "/chat",
    Settings = "/settings",
    NewChat = "/new-chat",
    Masks = "/masks",
    Auth = "/auth",
    MakeLocalVSStore = "/make-local-vector-store",
    ManageLocalVectorStore = "/manage-local-vector-store",
    Plugins= "/plugins",
}

export enum SlotID {
    AppBody = "app-body",
}

export enum FileName {
    Masks = "masks.json",
    Prompts = "prompts.json",
}

export enum StoreKey {
    Chat = "chat-next-web-store",
    Access = "access-control",
    Config = "app-config",
    Mask = "mask-store",
    Prompt = "prompt-store",
    Update = "chat-update",
    Sync = "sync",
}

export const MAX_SIDEBAR_WIDTH = 500;
export const MIN_SIDEBAR_WIDTH = 230;
export const NARROW_SIDEBAR_WIDTH = 100;

export const ACCESS_CODE_PREFIX = "nk-";

export const LAST_INPUT_KEY = "last-input";
export const UNFINISHED_INPUT = (id: string) => "unfinished-input-" + id;

export const REQUEST_TIMEOUT_MS = 180000;

export const EXPORT_MESSAGE_CLASS_NAME = "export-markdown";

export const LangchainBackendPath = {
    UsagePath: "dashboard/billing/usage",
    SubsPath: "dashboard/billing/subscription",
}

export const OpenaiPath = {
    UsagePath: "dashboard/billing/usage",
    SubsPath: "dashboard/billing/subscription",
    ListModelPath: "v1/models",
};

export const DEFAULT_INPUT_TEMPLATE = `{{input}}`; // input / time / model / lang
export const DEFAULT_SYSTEM_TEMPLATE = `
You are a helpful assistant.`;

export const SUMMARIZE_MODEL = "gpt-3.5-turbo";

export const DEFAULT_MODELS = [];
// export const DEFAULT_MODELS = useAppConfig.getState().supportedModels as LLMModel[];

export const DEFAULT_MEMORY_TYPES = [
    {
        name: "ConversationBufferWindowMemory",
        available: true,
    },
    {
        name: "ConversationBufferMemory",
        available: true,
    },
    {
        name: "ConversationSummaryBufferMemory",
        available: true,
    }
] as const;


export const CHAT_PAGE_SIZE = 15;
export const MAX_RENDER_MSG_COUNT = 45;


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
        model: "" ,
        temperature: 0.5,
        topP: 0.9,
        maxTokens: 2000,
        // presence_penalty: 0,
        frequencyPenalty: 1.2,
        haveContext: true,
        streaming: true,
        historyMessageCount: 0,
        checkedPluginIds: [] as string[],
        // memoryType: {
        //     name: "ConversationBufferWindowMemory" as MemoryTypeName,
        //     available: true
        // },
        // sendMemory: true,
        // compressMessageLengthThreshold: 2000,
        // enableInjectSystemPrompts: true,
        // template: DEFAULT_INPUT_TEMPLATE,
    },
    chatMessages: [
        {
            id: nanoid(),
            date: Date.now(),
            role: "system",
            content: "你是一个乐于助人的AI帮手，请回答用户的问题，如果你不知道答案，请不要编造答案",
        },
        {
            id: nanoid(),
            date: Date.now(),
            role: "user",
            content: "The following is the source: {context}. \n The user input is: {query}.",
        }
    ] as any as ChatMessage[],
};

export function transformToPromptTemplate(systemInput: string, userInput: string) {
    return {
        system: {
            _type: "prompt",
            input_variables: [],
            template: systemInput,
        },
        user: {
            _type: "prompt",
            input_variables: extraPromptPlaceHolders(userInput),
            // input_variables: [],
            template: userInput,
        },
    }
}

export const DEFAULT_PROMPT_TEMPLATE = transformToPromptTemplate(
    DEFAULT_CONFIG.chatMessages.filter((v) => v.role == "system")[0].content,
    DEFAULT_CONFIG.chatMessages.filter((v) => v.role == "user")[0].content)

export type PromptTemplate = typeof DEFAULT_PROMPT_TEMPLATE;

export const DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS = {
    retriever_type:"web_search",
    local_vs_folder_name:"web_search",
    search_type: "similarity",
    search_top_k: 4,
    web_search_results_count: 5,
    use_multi_query_assist:false,
    use_embedding_filter_assist: false,
    use_reorder_assist: true,
}

export type ChatConfig = typeof DEFAULT_CONFIG;

export type SearchContextSourceConfig = typeof DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS & {
    user_folder_id?: string;
};

export type ChatConfigStore = ChatConfig & {
    supportedModels: LLMModel[];
    defaultModel?:  LLMModel;
    reset: () => void;
    update: (updater: (config: ChatConfig) => void) => void;
    allModels: () => Promise<LLMModel[]>;
};

export type ModelConfig = ChatConfig["modelConfig"];