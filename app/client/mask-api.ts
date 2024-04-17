import {useAccessStore, useAppConfig} from "@/app/store";
import {
    FewShotMessageVO,
    MaskCreationRequestVO,
    MaskItemResponseVO,
    PromptInfoDict,
    SerializeInfo,
    SerializePromptRequestVO
} from "@/app/types/mask-vo";
import {getBackendApiHeaders, MemoryTypeName} from "@/app/client/api";
import {handleServerResponse, ServerResponse} from "@/app/common-api";
import {Mask} from "@/app/store/mask";
import {DEFAULT_CONFIG} from "@/app/constant";
import {init} from "es-module-lexer";

export function assembleSaveOrUpdateMaskRequest(mask: Mask){
    if(!mask.context || mask.context.length == 0){
        mask.context = DEFAULT_CONFIG.chatMessages;
    }
    if(!mask.fewShotContext || Object.keys(mask.fewShotContext).length == 0){
        mask.fewShotContext = {};
    }

    const chatMsgs = mask.context;
    const promptInfoDict = {system: {}, fewShotExamples: []} as PromptInfoDict;
    for(const item of chatMsgs){
        if (item.role == "system") {
            promptInfoDict["system"] = {
                template: item.content,
            }
        }
    }

    const var0: FewShotMessageVO[] = []
    Object.entries(mask.fewShotContext).forEach(([key, value]) => {
        var0.push({
            id: key,
            chatMessages: value,
        })
    });
    promptInfoDict["fewShotExamples"] = var0;
    // console.log("promptInfoDict:" + JSON.stringify(promptInfoDict));

    const serializePromptRequestVO = {
        title: mask.name + "-prompt",
        promptFolderName: "chat_prompt",  //prompt_folder_name暂时写死
        serializeInfo: {
            promptType: "chat_prompt",  // prompt_folder_name暂时写死
            haveContext: mask.haveContext,
            promptInfoDict: promptInfoDict,
        } as SerializeInfo,
    } as SerializePromptRequestVO;

    const modelName = useAppConfig.getState().defaultModel?.name ?? "";
    mask.modelConfig = {
        ...mask.modelConfig,
        model: mask.modelConfig.model == "" ? modelName: mask.modelConfig.model,
    }
    mask = {...mask,
        modelConfigJsonStr: JSON.stringify(mask.modelConfig),
        relevantSearchOptionsJsonStr: JSON.stringify(mask.relevantSearchOptions)}
    const maskCreationRequestVO = {
        mask,
        serializePromptRequest: serializePromptRequestVO,
        requiredPermIds: [632, 633]  //TODO 暂时写死
    } as MaskCreationRequestVO;
    // console.log(JSON.stringify(maskCreationRequestVO));
    return maskCreationRequestVO;
}


class ClientApi {

    path(path: string): string {
        let backendApiUrl = useAccessStore.getState().backendCoreApiUrl;
        // console.log("backendApiUrl:" + backendApiUrl)
        return [backendApiUrl, path].join("");
    }

    async createMask(request: MaskCreationRequestVO) : Promise<MaskItemResponseVO> {
        const res = await fetch(this.path("/api/mask/create"), {
            method: "POST",
            body: JSON.stringify(request),
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<MaskItemResponseVO>(await res.json());
    }

    async updateMask(request: MaskCreationRequestVO) : Promise<void> {
        const res = await fetch(this.path("/api/mask/update"), {
            method: "PUT",
            body: JSON.stringify(request),
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<void>(await res.json());
    }

    async deleteMask(maskId: string) : Promise<void> {
        const res = await fetch(this.path("/api/mask/delete?maskId=" + maskId), {
            method: "DELETE",
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<void>(await res.json());
    }

    async getAllMasks(): Promise<Mask[]> {
        const res = await fetch(this.path("/api/mask/list-all-masks"), {
            method: "GET",
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<Mask[]>(await res.json());
    }

    async getMask(maskId: string): Promise<Mask> {
        const res = await fetch(this.path("/api/mask/get?maskId=" + maskId), {
            method: "GET",
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        const maskItemResponseVO = handleServerResponse<MaskItemResponseVO>(await res.json());
        return maskItemResponseVO.mask;
    }

}

export const maskApi = new ClientApi();


