import {useAccessStore} from "@/app/store";
import {ServerResponse} from "@/app/common-api";
import {UserLoginParamVO, UserRegisterFiledCheckParamVO, UserRegisterParamVO, UserShownVO} from "@/app/types/user-vo";
import {AuthException} from "@/app/exceptions/auth-exception";
import Locale from "@/app/locales";

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

    handleAuthServerResponse = <T>(response: ServerResponse<T>) => {
        if (response.code !== 0) {
            console.log("[handleAuthServerResponse] response code:" + response.code);
            let showMsg = response.msg;
            switch (response.code) {
                case 60001:
                    showMsg = Locale.ShownAlertMsg.UserValidateFailed;
                    break;
                case 60002:
                    showMsg = Locale.ShownAlertMsg.AccountHasBeenRegistered;
                    break;
                case 60005:
                    showMsg = Locale.ShownAlertMsg.UserNameOrPwdIncorrect;
                    break;
                case 60006:
                    showMsg = Locale.ShownAlertMsg.UsernameLengthExceed;
                    break;
                case 60013:
                    showMsg = Locale.ShownAlertMsg.UserPasswordShouldNotBeEmpty;
                    break;
                case 60014:
                    showMsg = Locale.ShownAlertMsg.NotValidRegisterType;
                    break;
            }
            throw new AuthException(showMsg);
        }
        return response.data;
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
        return this.handleAuthServerResponse<UserShownVO>(await res.json());
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
        return this.handleAuthServerResponse<UserShownVO>(await res.json());
    }

    async refreshToken(oldToken: string) {
        const res = await fetch(this.path("/api/user/refresh-token?oldToken=" + oldToken), {
            method: "POST",
            headers: this.getAuthRequestHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return this.handleAuthServerResponse<UserShownVO>(await res.json());
    }

    async validateTokenIsExpired(token: string) {
        const res = await fetch(this.path("/api/user/validate-token-is-expired?token=" + token), {
            method: "GET",
            headers: this.getAuthRequestHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return this.handleAuthServerResponse<boolean>(await res.json());
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
        return this.handleAuthServerResponse<boolean>(await res.json());
    }

}
