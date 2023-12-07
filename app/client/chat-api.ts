import {useAccessStore, useChatStore} from "@/app/store";
import {ChatOptions, getBackendApiHeaders, LangchainRelevantDocsSearchOptions} from "@/app/client/api";
import {DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS, REQUEST_TIMEOUT_MS} from "@/app/constant";
import {prettyObject} from "@/app/utils/format";
import Locale from "@/app/locales";
import {StartupMaskRequestVO} from "@/app/trypes/model-vo";
import {handleServerResponse} from "@/app/common-api";
import {ChatCompletionRequestVO, ContextDoc} from "@/app/trypes/chat";
import {
    EventStreamContentType,
    fetchEventSource,
} from "@fortaine/fetch-event-source";

export class ChatApi {
    path(path: string): string {
        let openaiUrl = useAccessStore.getState().openaiUrl;
        // console.log("openaiUrl:" + openaiUrl)
        return [openaiUrl, path].join("/");
    }

    extractMessage(res: any) {
        return res.choices?.at(0)?.message?.content ?? "";
    }

    async chat(options: ChatOptions) {
        const currentSession = useChatStore.getState().currentSession();
        const mask = currentSession.mask;
        const maskModelConfig = mask.modelConfig;
        const messages = options.messages.map((v) => ({
            role: v.role,
            content: v.content,
        }));

        const requestPayload = {
            // TODO history_messages
            query: messages.at(-1)?.content ?? "",
            context_docs: options.contextDocs ?? [],
            startup_mask_request: {
                is_chinese_text: mask?.isChineseText ?? true,
                prompt_id: mask?.promptId ?? "",
                have_context: mask?.haveContext ?? false,
                prompt_serialized_type: "chat_prompt",
                llm_type: maskModelConfig.model,
                model_config: {
                    temperature: maskModelConfig.temperature,
                    top_p: maskModelConfig.topP,
                    streaming: maskModelConfig.streaming,
                    max_tokens: maskModelConfig.maxTokens,
                    repetition_penalty: maskModelConfig.frequencyPenalty,
                },
            } as StartupMaskRequestVO
        } as ChatCompletionRequestVO;

        console.log("[Request] langchain backend payload: ", requestPayload);

        const shouldStream = !!options.config.stream;
        const controller = new AbortController();
        options.onController?.(controller);

        try {
            const chatPath = this.path("llm-backend/v1/chat-stream/completions");
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
        const currentSession = useChatStore.getState().currentSession();
        const mask = currentSession.mask;
        const maskModelConfig = mask.modelConfig;

        const payload = {
            ...DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS,
            ...options,
            startupMaskRequest: {
                prompt_serialized_type: "chat_prompt",
                prompt_id: mask?.promptId ?? "",
                is_chinese_text: mask?.isChineseText ?? true,
                have_context: mask?.haveContext ?? false,
                llm_type: maskModelConfig.model,
                model_config: {
                    temperature: maskModelConfig.temperature,
                    top_p: maskModelConfig.topP,
                    streaming: maskModelConfig.streaming,
                    max_tokens: maskModelConfig.maxTokens,
                    repetition_penalty: maskModelConfig.frequencyPenalty,
                },
            } as StartupMaskRequestVO
        };

        const res = await fetch(this.path("llm-backend/v1/search-relevant-documents"), {
            method: "POST",
            body: JSON.stringify(payload),
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }

        return handleServerResponse<ContextDoc[]>(await res.json());
    }
}