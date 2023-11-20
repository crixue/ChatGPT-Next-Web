import {ChatMessage, useAccessStore} from "@/app/store";
import {MaskCreationRequestVO, MaskItemResponseVO} from "@/app/trypes/mask-vo";
import {getBackendApiHeaders} from "@/app/client/api";
import {handleServerResponse, ServerResponse} from "@/app/common-api";
import {Mask} from "@/app/store/mask";

class ClientApi {

    path(path: string): string {
        let backendApiUrl = useAccessStore.getState().backendCoreApiUrl;

        return [backendApiUrl, path].join("");
    }

    async createMask(request: MaskCreationRequestVO) : Promise<MaskItemResponseVO> {
        const res = await fetch(this.path("/api/mask/create"), {
            method: "POST",
            body: JSON.stringify(request),
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<MaskItemResponseVO>(await res.json());
    }

    async updateMask(request: MaskCreationRequestVO) : Promise<void> {
        const res = await fetch(this.path("/api/mask/update"), {
            method: "PUT",
            body: JSON.stringify(request),
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<void>(await res.json());
    }

    async deleteMask(maskId: string) : Promise<void> {
        const res = await fetch(this.path("/api/mask/delete?maskId=" + maskId), {
            method: "DELETE",
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<void>(await res.json());
    }

    async getAllMasks(): Promise<Mask[]> {
        const res = await fetch(this.path("/api/mask/list-all-masks"), {
            method: "GET",
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<Mask[]>(await res.json());
    }

}

export const maskApi = new ClientApi();


