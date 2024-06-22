import {useAccessStore} from "@/app/store";
import {UserLoginParamVO, UserRegisterFiledCheckParamVO, UserRegisterParamVO, UserShownVO} from "@/app/types/user-vo";
import {handleAuthServerResponse} from "@/app/client/util";

export class AuthApi {

    path(path: string): string {
        let openaiUrl = useAccessStore.getState().backendUserApiUrl;

        return [openaiUrl, path].join("");
    }
    getAuthRequestHeaders() {
        let headers: Record<string, string> = {
            "Content-Type": "application/json",
            "x-requested-with": "XMLHttpRequest",
        }
        return headers;
    }

    async userLogin(request: UserLoginParamVO) {
        const res = await fetch(this.path("/api/user/login"), {
            method: "POST",
            body: JSON.stringify(request),
            headers: this.getAuthRequestHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleAuthServerResponse<UserShownVO>(await res.json());
    }

    async userRegister(request: UserRegisterParamVO) {
        const res = await fetch(this.path("/api/user/register"), {
            method: "PUT",
            body: JSON.stringify(request),
            headers: this.getAuthRequestHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleAuthServerResponse<UserShownVO>(await res.json());
    }

    async refreshToken(oldToken: string) {
        const res = await fetch(this.path("/api/user/refresh-token?oldToken=" + oldToken), {
            method: "POST",
            headers: this.getAuthRequestHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleAuthServerResponse<UserShownVO>(await res.json());
    }

    async validateTokenIsExpired(token: string) {
        const res = await fetch(this.path("/api/user/validate-token-is-expired?token=" + token), {
            method: "GET",
            headers: this.getAuthRequestHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleAuthServerResponse<boolean>(await res.json());
    }

    async checkRegisterFieldExists(request: UserRegisterFiledCheckParamVO) {
        const res = await fetch(this.path("/api/user/check-register-field-if-exist"), {
            method: "POST",
            body: JSON.stringify(request),
            headers: this.getAuthRequestHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleAuthServerResponse<boolean>(await res.json());
    }

}
