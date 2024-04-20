import {Path} from "@/app/constant";
import {useAuthStore} from "@/app/store/auth";

export class BaseApiClient {
    async fetchWithRedirect(input: RequestInfo, init?: RequestInit) {

        const response = await fetch(input, init);

        if (response.status === 403) {
            console.log("Token is invalid now, redirecting to /auth to re-login.");
            useAuthStore.getState().logout();
        }

        return response;
    }
}
