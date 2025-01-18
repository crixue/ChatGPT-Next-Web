import {useAuthStore} from "@/app/store/auth";
import {Record} from "immutable";

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

type RetrieverType = "local_vector_stores" | "web_search" | "fixed" | "knowledge_graph"

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
    let headers = getBaseApiHeaders();
    headers["Content-Type"] = "application/json";
    headers["x-requested-with"] = "XMLHttpRequest";
    return headers;
}

export function getBaseApiHeaders() {
    const authStore = useAuthStore.getState();
    // @ts-ignore
    let headers: Record<string, string> = {
    };
    const token = authStore.token;
    if(token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    headers["userid"] = "92040b49"; //TODO mock a user user_folder_id,仅用于测试！

    return headers;
}
