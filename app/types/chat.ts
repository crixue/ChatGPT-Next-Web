import {StartupMaskRequestVO} from "@/app/types/model-vo";
import {LangchainRelevantDocsSearchOptions, RequestMessage} from "@/app/client/api";
import {ChatMessage} from "@/app/store";



export interface ExampleChatPair {
    type: 'input' | 'output';
    chatMsg: ChatMessage
}

export interface RelevantDocMetadata {
    title?: string;
    url?: string;
    source?: string;
    source_type?: 'upload_files' | 'plain_text' | 'speech_recognize_transcript' | 'web_search' | 'urls';
}


export interface RelevantDocsResponseVO {
    multiQueries?: string[];
    relevantDocs?: ContextDoc[];
    searchKeywords?: string;
}

export interface ContextDoc {
    metadata?: RelevantDocMetadata;
    page_content: string;
}

export interface ChatRequestVO {
    query: string,
    is_chinese_text: boolean,
    history_messages: ChatMessage[],  //example=[{"role": "user", "content": "hello"}]
    init_model_request: StartupMaskRequestVO,
    init_retriever_request: LangchainRelevantDocsSearchOptions,
    used_functions?: string[],
}

export interface ChatCompletionResponseChoiceVO {
    index?: number;
    message: ChatMessage;
    finish_reason?: "stop" | "length" | "function_call";
}

export interface ChatResponseVO {
    model?: string;
    object?: "chat.completion" | "chat.completion.chunk";
    choices?: ChatCompletionResponseChoiceVO[];
    created?: number;
    used_function_ids?: string[];
    retriever_docs?: ContextDoc[];
    search_keywords?: string;
    type?: "content" | "addition_info";
}

export class ChatStreamResponseVO {
    id?: string;
    model?: string;
    object?: "chat.completion" | "chat.completion.chunk";
    choices?: ChatCompletionResponseChoiceVO[];
    content?: string;
    type?: "content" | "addition_info";
    created?: number;
    used_function_ids?: string[];
    retriever_docs?: ContextDoc[];
    search_keywords?: string;
}
