import {ChatMessage, ChatSession, Mask, useAccessStore, useChatStore} from "@/app/store";
import {ChatOptions, getBackendApiHeaders, LangchainRelevantDocsSearchOptions, RequestMessage} from "@/app/client/api";
import {
    DEFAULT_CONFIG,
    DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS,
    PromptTemplate,
    REQUEST_TIMEOUT_MS,
    transformToPromptTemplate
} from "@/app/constant";
import {prettyObject} from "@/app/utils/format";
import Locale from "@/app/locales";
import {StartupMaskRequestVO} from "@/app/trypes/model-vo";
import {handleServerResponse} from "@/app/common-api";
import {ChatCompletionRequestVO, ContextDoc, RelevantDocsResponseVO} from "@/app/trypes/chat";
import {
    EventStreamContentType,
    fetchEventSource,
} from "@fortaine/fetch-event-source";

/**
 * 过滤历史消息，只保留用户和assistant的消息,
 * 并且保证user和assistant的消息是成对出现的，同时assistant的消息不能是错误消息
 * @param historyMessages
 * @param historyMsgCount
 */
export function filterHistoryMessages(historyMessages: ChatMessage[], historyMsgCount: number) {
    const filteredHistoryMessages = historyMessages.slice(-historyMsgCount * 2);
    const results: RequestMessage[] = [];
    for (let i = 0; i < filteredHistoryMessages.length; i++) {
        const var0 = filteredHistoryMessages[i];
        if(var0.role !== "user"){
            continue;
        }
        if (i+1 < filteredHistoryMessages.length) {
            const var1 = filteredHistoryMessages[++i];
            if(var1.role === "user" || (var1.role === "assistant" && var1.isError)){
                console.log("var1 is not assistant message")
                continue;
            }

            results.push(var0);
            results.push(var1);
        }
    }
    return results;
}

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
        const currentSession: ChatSession = useChatStore.getState().currentSession();
        const mask: Mask = currentSession.mask;
        const maskModelConfig = mask.modelConfig;
        const historyMsgCount = maskModelConfig.historyMessageCount ?? 0;
        const fewShotContext = mask.fewShotContext;
        const messages = options.messages;
        const haveContext = mask?.haveContext ?? false;
        const contextDocs = options.contextDocs ?? [];
        let promptTemplate: string | undefined;

        let historyMessages: RequestMessage[] = [];
        const systemMessage = messages.at(0) ?? {
            role: "system",
            content: DEFAULT_CONFIG.chatMessages[0].content
        } as RequestMessage;
        historyMessages.push(systemMessage);  // 添加系统消息
        for (const [key, value] of Object.entries(fewShotContext)) {
            historyMessages.push(value[0]);
            historyMessages.push(value[1]);
        }
        const userLastQuery = messages.at(-1)?.content ?? "";
        if(historyMsgCount > 0){
            messages.pop()  // 移除由用户发送的最后一条消息
            const filteredHistoryMessages = filterHistoryMessages(messages, historyMsgCount);
            historyMessages = historyMessages.concat(filteredHistoryMessages);
        }

        if (haveContext) {
            const context = (mask.context ?? []).slice(0, 2);  //目前只支持system 和 一个user role 的 prompt
            // console.log("context:"+JSON.stringify(context))
            promptTemplate = context.filter(msg => msg.role === "user")[0].content;
        }

        const requestPayload = {
            history_messages: historyMessages,
            query: userLastQuery,
            context_docs: contextDocs,
            prompt_template_str: promptTemplate ?? DEFAULT_CONFIG.chatMessages[1].content,
            startup_mask_request: {
                is_chinese_text: mask?.isChineseText ?? true,
                prompt_id: mask?.promptId ?? "",
                have_context: haveContext,
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

        // console.log("[Request] langchain backend payload: ", requestPayload);

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

                            throw new Error("Request failed, Please contact admin to check the backend service.");
                            // return finish();
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

        return handleServerResponse<RelevantDocsResponseVO>(await res.json());
    }
}