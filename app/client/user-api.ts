import {useAccessStore} from "@/app/store";
import {handleServerResponse} from "@/app/common-api";
import {getBackendApiHeaders} from "@/app/client/api";
import {UserFolderCreateReqVO, UserFolderUpdateReqVO, UserFolderVo} from "@/app/types/user-folder-vo";
import qs from "qs";
import {useNavigate} from "react-router-dom";
import {BaseApiClient} from "@/app/client/base-client";
import {CaptchaVerifyRequestVO, UserProfileVO} from "@/app/types/user-vo";
import {handleAuthServerResponse} from "@/app/client/util";


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

    async getUserProfile() {
        const res = await super.fetchWithRedirect(this.path("/api/user-profile/get"), {
            method: "GET",
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<UserProfileVO>(await res.json());
    }

    async saveUserProfile(userProfileVO: UserProfileVO) {
        const res = await super.fetchWithRedirect(this.path("/api/user-profile/save"), {
            method: "PUT",
            body: JSON.stringify(userProfileVO),
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<void>(await res.json());
    }

    async randomUserAvatarCdnUrl() {
        const res = await super.fetchWithRedirect(this.path("/api/user-profile/random-user-avatar-url"), {
            method: "GET",
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<string>(await res.json());
    }

    async verifyCaptchaAndSendSmsCode(request: CaptchaVerifyRequestVO) {
        const res = await super.fetchWithRedirect(this.path("/api/user/verify-captcha-and-send-sms-code"), {
            method: "POST",
            body: JSON.stringify(request),
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleAuthServerResponse<void>(await res.json());
    }

    async ableToPopupCaptchaCode(phoneNum: string) {
        const res = await super.fetchWithRedirect(this.path(`/api/user/able-to-popup-captcha-code?phoneNum=${phoneNum}`), {
            method: "GET",
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleAuthServerResponse<boolean>(await res.json());
    }

    async generateCaptchaAppId() {
        const res = await super.fetchWithRedirect(this.path("/api/user/generate-captcha-app-id"), {
            method: "GET",
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleAuthServerResponse<string>(await res.json());
    }

}
