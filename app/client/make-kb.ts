import {useAccessStore} from "@/app/store";
import {
    MakeFolderLocalVSTaskRecordsVO, MakeLocalVectorstoreTaskRecords,
    MakeLocalVSRequestVO,
    PreCheckVectorestoreLimitRequestVO, PreCheckVectorestoreLimitResponseVO
} from "@/app/types/make-localvs-vo";
import qs from "qs";
import {getBackendApiHeaders, getBaseApiHeaders} from "@/app/client/api";
import {handleServerResponse} from "@/app/common-api";
import {BaseApiClient} from "@/app/client/base-client";


export class MakeKnowledgeBaseStoreApi extends BaseApiClient {
    path(path: string): string {
        let baseUrl = useAccessStore.getState().backendCoreApiUrl;

        return [baseUrl, path].join("");
    }

    async doMakeLocalVS(makeTool: 'LOCAL_VECTOR_STORE' | 'GRAPH_DB', data: MakeLocalVSRequestVO[]) {
        const res = await super.fetchWithRedirect(this.path(
                `/api/knowledge-base/do-make?makeTool=${makeTool}`),
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

    async getMakeRecordsByFolderId(data: { folderId: string, pageNum?: number, pageSize?: number }) {
        const res = await super.fetchWithRedirect(this.path(
                `/api/knowledge-base/get-make-records?${qs.stringify(data)}`),
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
                `/api/knowledge-base/delete-index-in-local-vs?makeLocalVsTaskId=${taskId}`),
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

    async dropAllKnowledgeBase(data: { userFolderId: string }) {
        const res = await super.fetchWithRedirect(this.path(
                `/api/knowledge-base/drop-all-knowledge-base?${qs.stringify(data)}`),
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

    async executeSpeechRecognize(data: { speechRecognizeTaskIds: string[] }) {
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
                `/api/knowledge-base/pre-check-user-if-exceed-vectorstore-limit-size`),
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

    async getSpeechRecognizeResult(data: { makeLocalVSId: string }) {
        const res = await super.fetchWithRedirect(this.path(
                `/api/knowledge-base/get-speech-recognize-result?${qs.stringify(data)}`),
            {
                method: "GET",
                headers: {
                    ...getBackendApiHeaders()
                },
            });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        let respData = await res.arrayBuffer();
        if (!respData) {
            return "";
        }
        // 创建一个Blob对象
        let blob = new Blob([respData], {type: "application/octet-stream"});
        // 创建一个指向Blob的URL
        let url = URL.createObjectURL(blob);
        return url;
    }

    async getSomeRecordDetail(data: { makeLocalVsTaskId: string }) {
        const res = await super.fetchWithRedirect(this.path(
                `/api/knowledge-base/get-some-record-detail?${qs.stringify(data)}`),
            {
                method: "GET",
                headers: {
                    ...getBackendApiHeaders()
                },
            });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<MakeLocalVectorstoreTaskRecords>(await res.json());
    }

    async singleFileUploadAndMakeLocalVectorStore(data: { chatSessionId: string, isChineseText: boolean, file: File }) {
        const backendApiHeaders = getBaseApiHeaders();

        const formData = new FormData();
        formData.append('file', data.file);
        const res = await super.fetchWithRedirect(
            this.path(`/api/knowledge-base/single-file-upload-and-make?${qs.stringify(data)}`), {
            method: "POST",
            body: formData,
            headers: {
                ...backendApiHeaders,
            },
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<MakeLocalVSRequestVO>(await res.json());
    }

    async deleteSingleFileAndIndex(data: { makeLocalVsTaskId: string }) {
        const res = await super.fetchWithRedirect(this.path(
                `/api/knowledge-base/delete-single-file-and-index?${qs.stringify(data)}`),
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

}