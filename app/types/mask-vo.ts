import {Mask} from "@/app/store/mask";
import {Prompt} from "@/app/store/prompt";
import {ChatMessage} from "@/app/store";


export interface FewShotMessageVO {
    id: string;
    chatMessages: ChatMessage[];
}

export interface PromptInfoDict {
    user?: PromptInfoDict;
    system?: PromptInfoDict;
    fewShotExamples?: FewShotMessageVO[];
    template?: string;
    prefix?: string;
    examplePromptTemplate?: string;
    examples?: string[];
    suffix?: string;
}


export interface SerializeInfo {
    fileName?: string;
    promptType: "default_prompt" | "chat_prompt" | "few_shot_prompt";
    haveContext?: boolean;
    promptInfoDict?: PromptInfoDict;
}

export interface SerializePromptRequestVO {
    title?: string;
    promptFolderName?: string;
    serializeInfo?: SerializeInfo;
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

export interface MakeLocalVSConfig {
    cnChunkSize: number;
    cnChunkOverlap: number;
    enChunkSize: number;
    enChunkOverlap: number;
}
