import {useAccessStore} from "@/app/store";
import {
    MakeFolderLocalVSTaskRecordsVO,
    MakeLocalVSRequestVO,
    PreCheckVectorestoreLimitRequestVO, PreCheckVectorestoreLimitResponseVO
} from "@/app/types/make-localvs-vo";
import qs from "qs";
import {getBackendApiHeaders} from "@/app/client/api";
import {handleServerResponse} from "@/app/common-api";
import {BaseApiClient} from "@/app/client/base-client";


export class MakeLocalVectorStoreApi extends BaseApiClient{
    path(path: string): string {
        let baseUrl = useAccessStore.getState().backendCoreApiUrl;

        return [baseUrl, path].join("");
    }

    async doMakeLocalVS(data: MakeLocalVSRequestVO[]) {
        const res = await super.fetchWithRedirect(this.path(
                `/api/local-vector-store/do-make`),
            {
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    ...getBackendApiHeaders()
                },
            });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<void>(await res.json());
    }

    async getMakeRecordsByFolderId(data: {folderId: string, pageNum?: number, pageSize?: number}) {
        const res = await super.fetchWithRedirect(this.path(
                `/api/local-vector-store/get-make-records?${qs.stringify(data)}`),
            {
                method: "GET",
                headers: {
                    ...getBackendApiHeaders()
                },
            });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<MakeFolderLocalVSTaskRecordsVO>(await res.json());
    }

    async deleteIndexInLocalVS(taskId: string) {
        const res = await super.fetchWithRedirect(this.path(
                `/api/local-vector-store/delete-index-in-local-vs?makeLocalVsTaskId=${taskId}`),
            {
                method: "DELETE",
                headers: {
                    ...getBackendApiHeaders()
                },
            });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<void>(await res.json());
    }

    async executeSpeechRecognize(data: {speechRecognizeTaskIds: string[]}) {
        const res = await super.fetchWithRedirect(this.path(
                `/api/model-call-task/execute-speech-recognize-task`),
            {
                method: "PUT",
                body: JSON.stringify(data),
                headers: {
                    ...getBackendApiHeaders()
                },
            });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<void>(await res.json());
    }

    async preCheckUserIfExceedVectorstoreLimitSize(data: PreCheckVectorestoreLimitRequestVO) {
        const res = await super.fetchWithRedirect(this.path(
                `/api/local-vector-store/pre-check-user-if-exceed-vectorstore-limit-size`),
            {
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    ...getBackendApiHeaders()
                },
            });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<PreCheckVectorestoreLimitResponseVO>(await res.json());
    }

}