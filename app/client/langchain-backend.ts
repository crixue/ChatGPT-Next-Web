import {LangchainBackendPath,} from "@/app/constant";
import {useAccessStore,} from "@/app/store";

import {getBackendApiHeaders} from "./api";
import {SupportedModelVO} from "@/app/types/model-vo";
import {handleServerResponse} from "../common-api";
import {BaseApiClient} from "@/app/client/base-client";

export class LangchainBackendApi extends BaseApiClient{

    path(path: string): string {
        let openaiUrl = useAccessStore.getState().openaiUrl;
        // console.log("openaiUrl:" + openaiUrl)
        return [openaiUrl, path].join("/");
    }

    async listAllModels() {
        const res = await super.fetchWithRedirect(this.path("llm-backend/v1/llm-list"), {
            method: "GET",
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<SupportedModelVO[]>(await res.json());
    }
}

export {LangchainBackendPath};