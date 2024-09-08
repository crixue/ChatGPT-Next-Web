import {nanoid} from "nanoid";
import {ChatMessage} from "@/app/store";
import {extraPromptPlaceHolders} from "@/app/utils/common-util";
import {SupportedModelVO} from "@/app/types/model-vo";
import Locale from "@/app/locales";
import {MakeLocalVSConfig} from "@/app/types/mask-vo";

export const OWNER = "RawJayXx";
export const REPO = "ChatGPT-Next-Web";
export const REPO_URL = `https://github.com/${OWNER}/${REPO}`;
export const UPDATE_URL = `${REPO_URL}#keep-updated`;
export const RELEASE_URL = `${REPO_URL}/releases`;

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
    Wallet = "/wallet",
    Usage = "/usage",
    Personal = "/personal",
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
    Config = "app-config",
    Mask = "mask-store",
    Prompt = "prompt-store",
    Auth = "auth-storage",
    Plugin = "plugin-store",
}

export const MENU_MAX_SIDEBAR_WIDTH = 240;
export const MENU_MIN_SIDEBAR_WIDTH = 180;
export const MENU_NARROW_SIDEBAR_WIDTH = 80;

export const LAST_INPUT_KEY = "last-input";
export const UNFINISHED_INPUT = (id: string) => "unfinished-input-" + id;

export const REQUEST_TIMEOUT_MS = 75000;

export const LangchainBackendPath = {
    UsagePath: "dashboard/billing/usage",
    SubsPath: "dashboard/billing/subscription",
}

export const DEFAULT_MODELS = [];

export const CHAT_PAGE_SIZE = 15;

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

export enum RequestStatusEnum {
    isLoading = "loading",
    isDone = "done",
    isError = "error",
    isSuccess = "success",
}

//默认的面具配置
export const DEFAULT_CONFIG = {
    submitKey: SubmitKey.Enter as SubmitKey,
    avatar: "1f603",
    fontSize: 14,
    theme: Theme.Auto as Theme,
    tightBorder: true,
    sendPreviewBubble: true,
    enableAutoGenerateTitle: true,
    sidebarWidth: 300,

    shouldNarrowSidebar: false,

    disablePromptHint: false,

    dontShowMaskSplashScreen: false, // dont show splash screen when create chat
    hideBuiltinMasks: false, // dont add builtin masks

    customModels: "",
    models: DEFAULT_MODELS as any as SupportedModelVO[],

    modelConfig: {
        model_id: 'MODEL-0002' ,
        temperature: 0.5,
        top_p: 0.9,
        max_tokens: 2000,
        // presence_penalty: 0,
        repetition_penalty: 1.2,
        streaming: true,
        historyMessageCount: 5,
        checkedPluginIds: [] as string[],
    },
    chatMessages: [
        {
            id: nanoid(8),
            date: Date.now().toLocaleString(),
            role: "system",
            content: "你是一个AI对话助手，请回复用户的问题。",
        },
        {
            id: nanoid(8),
            date: Date.now().toLocaleString(),
            role: "user",
            content: "The following is the source: {context}. \n The user input is: {query}.",
        }
    ]  as ChatMessage[],
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
    search_top_k: 5,
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
    supportedModels: SupportedModelVO[];
    defaultModel?:  SupportedModelVO;
    reset: () => void;
    update: (updater: (config: ChatConfig) => void) => void;
    allModels: () => Promise<SupportedModelVO[]>;
};

export type ModelConfig = ChatConfig["modelConfig"];

export const DEFAULT_MAKE_LOCAL_VS_CONFIG: MakeLocalVSConfig = {
    cnChunkSize: 400,
    cnChunkOverlap: 100,
    enChunkSize: 600,
    enChunkOverlap: 150,
}
