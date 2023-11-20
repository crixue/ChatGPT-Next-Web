import {useAccessStore} from "@/app/store";
import {handleServerResponse} from "@/app/common-api";
import {getBackendApiHeaders} from "@/app/client/api";
import {UserFolderCreateReqVO, UserFolderVO} from "@/app/trypes/user-folder.vo";


export class UserApi {

    path(path: string): string {
        let openaiUrl = useAccessStore.getState().backendUserApiUrl;

        return [openaiUrl, path].join("");
    }

    async getUserCreatedFolders(folderType: 'LOCAL_VECTOR_STORE_FOLDER' | 'PROMPT_FOLDER', userId?: string) {
        const res = await fetch(this.path("/api/user-folder/list-user-created-folders?folderTypeEnum="+folderType), {
            method: "GET",
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<UserFolderVO[]>(await res.json());
    }

    async createFolder(request: UserFolderCreateReqVO) {
        const res = await fetch(this.path("/api/user-folder/create-user-folder"), {
            method: "PUT",
            body: JSON.stringify(request),
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<UserFolderVO>(await res.json());
    }

}
