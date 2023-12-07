import {Mask} from "@/app/store/mask";
import {Prompt} from "@/app/store/prompt";


export interface PromptInfoDict {
    user?: PromptInfoDict;
    system?: PromptInfoDict;
    template?: string;
    prefix?: string;
    example_prompt_template?: string;
    examples?: string[];
    suffix?: string;
}


export interface SerializeInfo {
    file_name?: string;
    prompt_type: "default_prompt" | "chat_prompt" | "few_shot_prompt";
    have_context?: boolean;
    prompt_info_dict?: PromptInfoDict;
}

export interface SerializePromptRequestVO {
    title?: string;
    prompt_folder_name?: string;
    serialize_info?: SerializeInfo;
}

export interface MaskCreationRequestVO {
    mask?: Mask;
    serializePromptRequest?: SerializePromptRequestVO;
    requiredPermIds?: number[];
}

export interface MaskItemResponseVO {
    mask: Mask;
    prompt?: Prompt;
    requiredPermIds?: number[];
}