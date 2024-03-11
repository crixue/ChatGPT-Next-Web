import {LangchainBackendBaseLLMConfig, MemoryTypeName} from "@/app/client/api";


export interface StartUpModelRequestVO {
    llm_type: string;
    llm_model_config: LangchainBackendBaseLLMConfig;
}


export interface StartupMaskRequestVO {
    max_tokens_limit: number;
    memory_type: MemoryTypeName;
    memory_additional_args?: Map<string, string>;
    prompt_serialized_type: string;
    prompt_id: string;
    is_chinese_text: boolean;
    have_context: boolean;
    llm_type: string;
    model_config: LangchainBackendBaseLLMConfig;
}


export interface SupportedModelVO {
    name: string;
    alias: string;
    sequence_length: number;
    context_tokens_limit: number;
    available: boolean;
}