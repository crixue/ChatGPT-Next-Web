import {ChatMessage} from "../store";
import {ChatResponseVO, ChatStreamResponseVO} from "@/app/types/chat";
import {useAuthStore} from "@/app/store/auth";

export const ROLES = ["system", "user", "assistant"] as const;
export type MessageRole = (typeof ROLES)[number];

export interface RequestMessage {
    role?: MessageRole;
    content: string;
}

export interface ChatOptionsLLMConfig {
    model?: string;
    temperature?: number;
    top_p?: number;
    stream?: boolean;
    presence_penalty?: number;
    frequency_penalty?: number;
}

export interface ChatOptions {
    messages: ChatMessage[];
    config: ChatOptionsLLMConfig;
    onUpdate?: (message: string, chunk?: string, resp?: ChatStreamResponseVO | ChatResponseVO) => void;
    onFinish: (message: string, resp?: ChatStreamResponseVO | ChatResponseVO) => void;
    onError?: (err: Error) => void;
    onController?: (controller: AbortController) => void;
}

export interface LangchainBackendBaseLLMConfig {
    model_id?: string;
    temperature: number;
    streaming: boolean;
    max_tokens: number;
    top_p: number;
    repetition_penalty: number;
    historyMessageCount?: number;
    checkedPluginIds?: string[];
}

export type MemoryTypeName =
    "ConversationBufferMemory"
    | "ConversationBufferWindowMemory"
    | "ConversationSummaryBufferMemory"

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

export function getBackendApiHeaders() {
    const authStore = useAuthStore.getState();
    let headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-requested-with": "XMLHttpRequest",
    };
    const token = authStore.token;
    if(token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    // headers["userid"] = "yr8zsNIV"; //TODO mock a user id

    return headers;
}
