import {LangchainBackendBaseLLMConfig, MemoryTypeName} from "@/app/client/api";


export interface StartUpModelRequestVO {
    llm_type: string;
    llm_model_config: LangchainBackendBaseLLMConfig;
}


export interface StartupMaskRequestVO {
    memory_type: MemoryTypeName;
    memory_additional_args: Map<string, string>;
    prompt_serialized_type: string;
    prompt_path: string;
    is_chinese_text: boolean;
    have_context: boolean;
}