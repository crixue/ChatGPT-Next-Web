import {StartupMaskRequestVO} from "@/app/trypes/model-vo";
import {RequestMessage} from "@/app/client/api";
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

export interface ChatCompletionRequestVO {
    history_messages?: RequestMessage[],  //example=[{"role": "user", "content": "hello"}]
    query: string,
    startup_mask_request: StartupMaskRequestVO,
    context_docs?: ContextDoc[]
    prompt_template_str?: string,
}

