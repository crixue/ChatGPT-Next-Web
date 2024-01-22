import {ACCESS_CODE_PREFIX} from "../constant";
import {ChatMessage, ModelType, useAccessStore} from "../store";
import {ChatResponseVO, ChatStreamResponseVO, ContextDoc} from "@/app/types/chat";
import {FunctionPlugin} from "@/app/types/plugins";

export const ROLES = ["system", "user", "assistant"] as const;
export type MessageRole = (typeof ROLES)[number];

export const Models = ["gpt-3.5-turbo", "gpt-4"] as const;
export type ChatModel = ModelType;

export interface RequestMessage {
    role?: MessageRole;
    content: string;
}

export interface LLMConfig {
    model: string;
    temperature?: number;
    top_p?: number;
    stream?: boolean;
    presence_penalty?: number;
    frequency_penalty?: number;
}

export interface ChatOptions {
    messages: ChatMessage[];
    config: LLMConfig;
    onUpdate?: (message: string, chunk?: string, resp?: ChatStreamResponseVO | ChatResponseVO) => void;
    onFinish: (message: string, resp?: ChatStreamResponseVO | ChatResponseVO) => void;
    onError?: (err: Error) => void;
    onController?: (controller: AbortController) => void;
}

export interface LLMUsage {
    used: number;
    total: number;
}

export interface LLMModel {
    name: string;
    available: boolean;
    alias: string;
}

export interface LangchainBackendBaseLLMConfig {
    temperature: number;
    streaming: boolean;
    max_tokens: number;
    top_p: number;
    repetition_penalty: number;
}

export type MemoryTypeName =
    "ConversationBufferMemory"
    | "ConversationBufferWindowMemory"
    | "ConversationSummaryBufferMemory"

export interface ConversationMemoryType {
    name: MemoryTypeName;
    label?: string;
    available: boolean;
}


type RetrieverType = "local_vector_stores" | "web_search" | "fixed"

export interface LangchainRelevantDocsSearchOptions {
    query?: string;
    retriever_type: RetrieverType;
    user_folder_id: string,
    local_vs_folder_name: string;
    search_type: "similarity" | "mmr";
    search_top_k: number;
    web_search_results_count?: number;
    use_multi_query_assist: boolean;
    use_embedding_filter_assist: boolean;
    use_reorder_assist: boolean;
    cn_chunk_size?: number;
    cn_chunk_overlap?: number;
    en_chunk_size?: number;
    en_chunk_overlap?: number;
}


type ProviderName = "openai" | "azure" | "claude" | "palm";

interface Model {
    name: string;
    provider: ProviderName;
    ctxlen: number;
}

interface ChatProvider {
    name: ProviderName;
    apiConfig: {
        baseUrl: string;
        apiKey: string;
        summaryModel: Model;
    };
    models: Model[];

    chat: () => void;
    usage: () => void;
}

export function getHeaders() {
    const accessStore = useAccessStore.getState();
    let headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-requested-with": "XMLHttpRequest",
    };

    const makeBearer = (token: string) => `Bearer ${token.trim()}`;
    const validString = (x: string) => x && x.length > 0;

    // use user's api key first
    if (validString(accessStore.token)) {
        headers.Authorization = makeBearer(accessStore.token);
    } else if (
        accessStore.enabledAccessControl() &&
        validString(accessStore.accessCode)
    ) {
        headers.Authorization = makeBearer(
            ACCESS_CODE_PREFIX + accessStore.accessCode,
        );
    }

    return headers;
}

export function getBackendApiHeaders() {
    const accessStore = useAccessStore.getState();
    let headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-requested-with": "XMLHttpRequest",
    };
    //
    // const makeBearer = (token: string) => `Bearer ${token.trim()}`;
    // const validString = (x: string) => x && x.length > 0;
    //
    // // use user's api key first
    // if (validString(accessStore.token)) {
    //   headers.Authorization = makeBearer(accessStore.token);
    // } else if (
    //     accessStore.enabledAccessControl() &&
    //     validString(accessStore.accessCode)
    // ) {
    //   headers.Authorization = makeBearer(
    //       ACCESS_CODE_PREFIX + accessStore.accessCode,
    //   );
    // }

    //TODO mock a user id
    headers["GATEWAY-REQUEST-USER-ID"] = "jOMBSR9l";

    return headers;
}
