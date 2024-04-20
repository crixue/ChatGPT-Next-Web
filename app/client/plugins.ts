import {useAccessStore} from "@/app/store";
import {FunctionPlugin} from "@/app/types/plugins";
import {handleServerResponse} from "@/app/common-api";
import {getBackendApiHeaders} from "@/app/client/api";
import {BaseApiClient} from "@/app/client/base-client";


export class PluginsApi extends BaseApiClient{

    path(path: string): string {
        let openaiUrl = useAccessStore.getState().openaiUrl;

        return [openaiUrl, path].join("");
    }

    // @app.route('/plugins/v1/supported_functions', methods=['GET'])
    async getSupportedFunctions() {
        const res = await super.fetchWithRedirect(this.path(
                `/plugins/v1/supported_functions`),
            {
                method: "GET",
                headers: {
                    ...getBackendApiHeaders()
                },
            });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<FunctionPlugin[]>(await res.json());
    }
}

