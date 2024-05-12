import {useAccessStore} from "@/app/store";
import {handleServerResponse} from "@/app/common-api";
import {getBackendApiHeaders} from "@/app/client/api";
import {UserFolderCreateReqVO, UserFolderUpdateReqVO, UserFolderVo} from "@/app/types/user-folder-vo";
import qs from "qs";
import {useNavigate} from "react-router-dom";
import {BaseApiClient} from "@/app/client/base-client";


export class UserApiClient extends BaseApiClient {

    path(path: string): string {
        let openaiUrl = useAccessStore.getState().backendUserApiUrl;

        return [openaiUrl, path].join("");
    }

    async getUserCreatedFolders(folderType: 'LOCAL_VECTOR_STORE_FOLDER' | 'PROMPT_FOLDER', userId?: string) {
        const res = await super.fetchWithRedirect(this.path("/api/user-folder/list-user-created-folders?folderTypeEnum="+folderType), {
            method: "GET",
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<UserFolderVo[]>(await res.json());
    }

    async createFolder(request: UserFolderCreateReqVO) {
        const res = await super.fetchWithRedirect(this.path("/api/user-folder/create-user-folder"), {
            method: "PUT",
            body: JSON.stringify(request),
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<UserFolderVo>(await res.json());
    }

    async updateFolder(request: UserFolderUpdateReqVO) {
        const res = await super.fetchWithRedirect(this.path("/api/user-folder/update-user-folder"), {
            method: "POST",
            body: JSON.stringify(request),
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<UserFolderVo>(await res.json());
    }

    async deleteUserFolder(data: {userFolderId: string}) {
        const res = await super.fetchWithRedirect(this.path(
                `/api/user-folder/delete-user-folder?${qs.stringify(data)}`),
            {
                method: "DELETE",
                headers: {
                    ...getBackendApiHeaders()
                }
            });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<void>(await res.json());
    }

}
