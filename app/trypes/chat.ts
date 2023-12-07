import {StartupMaskRequestVO} from "@/app/trypes/model-vo";


export interface RelevantDocMetadata {
    title: string;
    url: string;
    source: string;
}

export interface ContextDoc {
    metadata: RelevantDocMetadata;
    page_content: string;
}

export interface ChatCompletionRequestVO {
    history_messages?: Record<string, string>[],  //example=[{"role": "user", "content": "hello"}]
    query: string,
    startup_mask_request: StartupMaskRequestVO,
    context_docs?: ContextDoc[]
}

