import {DEFAULT_MODELS, LangchainBackendPath, REQUEST_TIMEOUT_MS,} from "@/app/constant";
import {
    DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS,
    DEFAULT_SETUP_MODEL_CONFIG,
    useAccessStore,
    useAppConfig,
    useChatStore
} from "@/app/store";

import {
    ChatOptions,
    getBackendApiHeaders,
    getHeaders,
    LangchainRelevantDocsSearchOptions,
    LLMModel,
    LLMUsage
} from "../api";
import Locale from "../../locales";
import {EventStreamContentType, fetchEventSource,} from "@fortaine/fetch-event-source";
import {prettyObject} from "@/app/utils/format";
import {StartupMaskRequestVO, StartUpModelRequestVO} from "@/app/trypes/model-vo";

export interface OpenAIListModelResponse {
    object: string;
    data: Array<{
        id: string;
        object: string;
        root: string;
    }>;
}

export class LangchainBackendApi {
    private disableListModels = true;

    path(path: string): string {
        let openaiUrl = useAccessStore.getState().openaiUrl;
        // console.log("openaiUrl:" + openaiUrl)
        return [openaiUrl, path].join("/");
    }

    extractMessage(res: any) {
        return res.choices?.at(0)?.message?.content ?? "";
    }

    async startUpModel(request: StartUpModelRequestVO) {
        const res = await fetch(this.path(LangchainBackendPath.SetupModelPath), {
            method: "POST",
            body: JSON.stringify(request),
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
    }

    async startUpMask(request: StartupMaskRequestVO) {
        const res = await fetch(this.path(LangchainBackendPath.StartupMaskPath), {
            method: "POST",
            body: JSON.stringify(request),
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
    }

    async chat(options: ChatOptions) {
        const messages = options.messages.map((v) => ({
            role: v.role,
            content: v.content,
        }));

        const modelConfig = {
            ...useAppConfig.getState().modelConfig,
            ...useChatStore.getState().currentSession().mask.modelConfig,
            ...{
                model: options.config.model,
            },
        };

        const requestPayload = {
            query: messages.at(-1)?.content ?? "",
            context_docs: options.contextDocs,
        };

        console.log("[Request] langchain backend payload: ", requestPayload);

        const shouldStream = !!options.config.stream;
        const controller = new AbortController();
        options.onController?.(controller);

        try {
            const chatPath = this.path(LangchainBackendPath.ChatPath);
            const chatPayload = {
                method: "POST",
                body: JSON.stringify(requestPayload),
                signal: controller.signal,
                headers: getBackendApiHeaders(),
            };

            // make a fetch request
            const requestTimeoutId = setTimeout(
                () => controller.abort(),
                REQUEST_TIMEOUT_MS,
            );

            if (shouldStream) {
                let responseText = "";
                let finished = false;

                const finish = () => {
                    if (!finished) {
                        options.onFinish(responseText);
                        finished = true;
                    }
                };

                controller.signal.onabort = finish;

                fetchEventSource(chatPath, {
                    ...chatPayload,
                    async onopen(res) {
                        clearTimeout(requestTimeoutId);
                        const contentType = res.headers.get("content-type");
                        console.log(
                            "[OpenAI] request response content type: ",
                            contentType,
                        );

                        if (contentType?.startsWith("text/plain")) {
                            responseText = await res.clone().text();
                            return finish();
                        }

                        if (
                            !res.ok ||
                            !res.headers
                                .get("content-type")
                                ?.startsWith(EventStreamContentType) ||
                            res.status !== 200
                        ) {
                            const responseTexts = [responseText];
                            let extraInfo = await res.clone().text();
                            try {
                                const resJson = await res.clone().json();
                                extraInfo = prettyObject(resJson);
                            } catch {
                            }

                            if (res.status === 401) {
                                responseTexts.push(Locale.Error.Unauthorized);
                            }

                            if (extraInfo) {
                                responseTexts.push(extraInfo);
                            }

                            responseText = responseTexts.join("\n\n");

                            return finish();
                        }
                    },
                    onmessage(msg) {
                        if (msg.data === "[DONE]" || finished) {
                            return finish();
                        }
                        const text = msg.data;
                        try {
                            const json = JSON.parse(text);
                            const delta = json.content;
                            if (delta) {
                                responseText += delta;
                                options.onUpdate?.(responseText, delta);
                            }
                        } catch (e) {
                            console.error("[Request] parse error", text, msg);
                        }
                    },
                    onclose() {
                        finish();
                    },
                    onerror(e) {
                        options.onError?.(e);
                        throw e;
                    },
                    openWhenHidden: true,
                });
            } else {
                const res = await fetch(chatPath, chatPayload);
                clearTimeout(requestTimeoutId);

                const resJson = await res.json();
                const message = this.extractMessage(resJson);
                options.onFinish(message);
            }
        } catch (e) {
            console.log("[Request] failed to make a chat request", e);
            options.onError?.(e as Error);
        }
    }

    async searchRelevantDocs(options: LangchainRelevantDocsSearchOptions) {
        const payload = {
            ...DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS,
            ...options,
        };

        const res = await fetch(this.path(LangchainBackendPath.SearchRelevantDocsPath), {
            method: "POST",
            body: JSON.stringify(payload),
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }

        return await res.json();
    }

    async usage() {
        const formatDate = (d: Date) =>
            `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
                .getDate()
                .toString()
                .padStart(2, "0")}`;
        const ONE_DAY = 1 * 24 * 60 * 60 * 1000;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startDate = formatDate(startOfMonth);
        const endDate = formatDate(new Date(Date.now() + ONE_DAY));

        const [used, subs] = await Promise.all([
            fetch(
                this.path(
                    `${LangchainBackendPath.UsagePath}?start_date=${startDate}&end_date=${endDate}`,
                ),
                {
                    method: "GET",
                    headers: getHeaders(),
                },
            ),
            fetch(this.path(LangchainBackendPath.SubsPath), {
                method: "GET",
                headers: getHeaders(),
            }),
        ]);

        if (used.status === 401) {
            throw new Error(Locale.Error.Unauthorized);
        }

        if (!used.ok || !subs.ok) {
            throw new Error("Failed to query usage from openai");
        }

        const response = (await used.json()) as {
            total_usage?: number;
            error?: {
                type: string;
                message: string;
            };
        };

        const total = (await subs.json()) as {
            hard_limit_usd?: number;
        };

        if (response.error && response.error.type) {
            throw Error(response.error.message);
        }

        if (response.total_usage) {
            response.total_usage = Math.round(response.total_usage) / 100;
        }

        if (total.hard_limit_usd) {
            total.hard_limit_usd = Math.round(total.hard_limit_usd * 100) / 100;
        }

        return {
            used: response.total_usage,
            total: total.hard_limit_usd,
        } as LLMUsage;
    }

    async models(): Promise<LLMModel[]> {
        if (this.disableListModels) {
            return DEFAULT_MODELS.slice();
        }

        const res = await fetch(this.path(LangchainBackendPath.ListModelPath), {
            method: "GET",
            headers: {
                ...getHeaders(),
            },
        });

        const resJson = (await res.json()) as OpenAIListModelResponse;
        const chatModels = resJson.data?.filter((m) => m.id.startsWith("gpt-"));
        console.log("[Models]", chatModels);

        if (!chatModels) {
            return [];
        }

        return chatModels.map((m) => ({
            name: m.id,
            available: true,
        }));
    }
}

export {LangchainBackendPath};
