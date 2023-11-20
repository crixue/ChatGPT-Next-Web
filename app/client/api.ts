import {getClientConfig} from "../config/client";
import {ACCESS_CODE_PREFIX} from "../constant";
import {ChatMessage, ModelType, useAccessStore} from "../store";
import {ChatGPTApi} from "./platforms/openai";
import {LangchainBackendApi} from "@/app/client/platforms/langchain-backend";

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
    messages: RequestMessage[];
    config: LLMConfig;
    contextDocs?: ContextDoc[];
    onUpdate?: (message: string, chunk: string) => void;
    onFinish: (message: string) => void;
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

export interface BaseSetupModelConfig {

}

export interface LangchainSetupModelConfig extends BaseSetupModelConfig {
    llm_type: string;
    llm_model_config: LangchainBackendBaseLLMConfig;
    memory_type: MemoryTypeName;
    memory_additional_args: Map<string, string>;
    prompt_serialized_type: string;
    prompt_path: string;
    is_chinese_text: boolean;
    have_context: boolean;
}


type RetrieverType = "local_vector_stores" | "web_search" | "fixed"

export interface LangchainRelevantDocsSearchOptions {
    query: string;
    retriever_type: RetrieverType;
    local_vs_folder_name: string;
    search_type: "similarity" | "mmr";
    search_top_k: number;
    use_multi_query_assist: boolean;
    use_embedding_filter_assist: boolean;
    use_reorder_assist: boolean;
}

export interface RelevantDocMetadata {
    title: string;
    url: string;
    source: string;
}

export interface ContextDoc {
    metadata: RelevantDocMetadata;
    page_content: string;
}

export interface RelevantDocsResponse {
    docs: ContextDoc[];
    query: string;
}


export abstract class LLMApi {
    abstract searchRelevantDocs(options: LangchainRelevantDocsSearchOptions): Promise<RelevantDocsResponse>;

    abstract chat(options: ChatOptions): Promise<void>;

    abstract usage(): Promise<LLMUsage>;

    abstract models(): Promise<LLMModel[]>;

    abstract startupModel(options: BaseSetupModelConfig): Promise<void>
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

export class ClientApi {
    public llm: LangchainBackendApi;

    constructor() {
        // this.llm = new ChatGPTApi();
        this.llm = new LangchainBackendApi();
        console.log("[ClientApi]", this.llm)
    }

    config() {
    }

    prompts() {
    }

    masks() {
    }

    async share(messages: ChatMessage[], avatarUrl: string | null = null) {
        const msgs = messages
            .map((m) => ({
                from: m.role === "user" ? "human" : "gpt",
                value: m.content,
            }))
            .concat([
                {
                    from: "human",
                    value:
                        "Share from [ChatGPT Next Web]: https://github.com/Yidadaa/ChatGPT-Next-Web",
                },
            ]);
        // 敬告二开开发者们，为了开源大模型的发展，请不要修改上述消息，此消息用于后续数据清洗使用
        // Please do not modify this message

        console.log("[Share]", messages, msgs);
        const clientConfig = getClientConfig();
        const proxyUrl = "/sharegpt";
        const rawUrl = "https://sharegpt.com/api/conversations";
        const shareUrl = clientConfig?.isApp ? rawUrl : proxyUrl;
        const res = await fetch(shareUrl, {
            body: JSON.stringify({
                avatarUrl,
                items: msgs,
            }),
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
        });

        const resJson = await res.json();
        console.log("[Share]", resJson);
        if (resJson.id) {
            return `https://shareg.pt/${resJson.id}`;
        }
    }
}

export const api = new ClientApi();

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
    headers["GATEWAY-REQUEST-USER-ID"] = "7BreKaxY";

    return headers;
}
