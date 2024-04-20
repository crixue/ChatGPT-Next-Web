import {useAccessStore} from "@/app/store";
import {getBackendApiHeaders} from "@/app/client/api";
import {handleServerResponse} from "@/app/common-api";
import qs from "qs";
import {BaseApiClient} from "@/app/client/base-client";


export class UploadApi extends BaseApiClient{
    path(path: string): string {
        let openaiUrl = useAccessStore.getState().backendCoreApiUrl;

        return [openaiUrl, path].join("");
    }

    /**
     *
     * @param file
     * @param folderId
     * @returns 返回的string是文件上传后保存的路径
     */
    async upload(file: File, folderId: string) {
        const backendApiHeaders = getBackendApiHeaders();
        delete backendApiHeaders["Content-Type"];

        const formData = new FormData();
        formData.append('file', file);
        const res = await super.fetchWithRedirect(this.path("/api/files/upload?folderId="+folderId), {
            method: "POST",
            body: formData,
            headers: {
                ...backendApiHeaders,
            },
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<string>(await res.json());
    }

    /**
     *
     * @param file
     * @param data
     * @returns 返回的string是创建语音识别任务的id
     */
    async uploadAVFileAndDoSpeechRecognition(file: File, data: {folderId: string, language?: string}) {
        const backendApiHeaders = getBackendApiHeaders();
        delete backendApiHeaders["Content-Type"];

        const formData = new FormData();
        formData.append('file', file);
        const res = await super.fetchWithRedirect(this.path(`/api/model-call-task/upload-av-file-to-recognize?${qs.stringify(data)}`), {
            method: "POST",
            body: formData,
            headers: {
                ...backendApiHeaders,
            },
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<string>(await res.json());
    }

    async removeUploadFile(data: {folderId: string, fileName: string, uploadType?: string, taskId?: string}) {
        const res = await super.fetchWithRedirect(this.path(
            `/api/files/delete?${qs.stringify(data)}`),
            {
                method: "DELETE",
                headers: {
                    ...getBackendApiHeaders()
                },
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<string>(await res.json());
    }

    async uploadPlainTextFile(data: {folderId: string, plainTextList: string[]}) {
        const res = await super.fetchWithRedirect(this.path(
            `/api/files/create-plain-text-file`),
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
        return handleServerResponse<string>(await res.json());
    }

}
