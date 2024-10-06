import {BaseApiClient} from "@/app/client/base-client";
import {useAccessStore} from "@/app/store";
import {MakeLocalVSOption} from "@/app/types/make-localvs-vo";
import {fetchEventSource} from "@fortaine/fetch-event-source";
import {getBaseApiHeaders} from "@/app/client/api";


export class SseClient extends BaseApiClient{
    private controller: AbortController | null = null;

    path(path: string): string {
        let baseUrl = useAccessStore.getState().backendCoreApiUrl;
        return [baseUrl, path].join("");
    }

    async listenMakeLocalVSProgress(makeLocalVSId: string, options?: MakeLocalVSOption) {
        this.controller = new AbortController();
        let eventSource: Promise<void> =  fetchEventSource(this.path(`/api/sse/make-local-vs-task-progress?makeLocalVSId=${makeLocalVSId}`), {
            signal: this.controller.signal,
            headers: getBaseApiHeaders() ,
            onmessage: (event) => {
                const data = event.data;
                // console.log("makeLocalVSProgress:" + data);
                if (data.startsWith("Progress: ")) {
                    const process = parseFloat(data.replace("Progress: ", ""));
                    options?.onUpdate?.(process);
                } else if (data === "Done") {
                    options?.onDone?.(makeLocalVSId, 100);
                } else {
                    options?.onFail?.(makeLocalVSId, data);
                }
            }
        });
    }

    closeEvent() {
        if (this.controller) {
            this.controller.abort();
            this.controller = null;
        }
    }

}
