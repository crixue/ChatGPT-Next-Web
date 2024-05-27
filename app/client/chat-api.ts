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
import {StartupMaskRequestVO} from "@/app/types/model-vo";
import {handleServerResponse} from "@/app/common-api";
import {
    ChatRequestVO,
    RelevantDocsResponseVO,
    ChatStreamResponseVO, ChatResponseVO
} from "@/app/types/chat";
import {
    EventStreamContentType,
    fetchEventSource,
} from "@fortaine/fetch-event-source";
import {filterHistoryMessages} from "@/app/utils/chat";
import {usePluginsStore} from "@/app/store/plugins";
import {BaseApiClient} from "@/app/client/base-client";

export class ChatApi extends BaseApiClient{
    path(path: string): string {
        let openaiUrl = useAccessStore.getState().openaiUrl;
        // console.log("openaiUrl:" + openaiUrl)
        return [openaiUrl, path].join("/");
    }

    extractMessage(res: ChatResponseVO) {
        return res.choices?.at(0)?.message?.content ?? "";
    }

    async chat(options: ChatOptions, initRetrieverRequest: LangchainRelevantDocsSearchOptions) {
        const currentSession: ChatSession = useChatStore.getState().currentSession();
        const pluginStore = usePluginsStore.getState();
        const mask: Mask = currentSession.mask;
        const maskModelConfig = mask.modelConfig;
        const historyMsgCount = maskModelConfig.historyMessageCount ?? 4;
        const fewShotContext = mask.fewShotContext ?? {};
        const messages = options.messages;
        let promptTemplate: string | undefined;
        const streamingMode = !!options.config.stream;

        let historyMessages: RequestMessage[] = [];
        const systemMessage = messages.at(0) ?? {
            role: "system",
            content: DEFAULT_CONFIG.chatMessages[0].content
        } as RequestMessage;
        historyMessages.push(systemMessage);  // 添加系统消息
        for (const [key, value] of Object.entries(fewShotContext)) {  // 添加 few shot examples 到 historyMessages中
            historyMessages.push(value[0]);
            historyMessages.push(value[1]);
        }
        const userLastQuery = messages.at(-1)?.content ?? "";
        if(historyMsgCount > 0){
            messages.pop()  // 移除由用户发送的最后一条消息
            const filteredHistoryMessages = filterHistoryMessages(messages, historyMsgCount);
            historyMessages = historyMessages.concat(filteredHistoryMessages);
        }

        // const context = (mask.context ?? []).slice(0, 2);  //目前只支持system 和 一个user role 的 prompt
        // // console.log("context:"+JSON.stringify(context))
        // promptTemplate = context.filter(msg => msg.role === "user")[0].content;

        let modelName = maskModelConfig.model ?? 'default';
        if(!modelName || modelName === ""){
            modelName = "default";  //TODO 暂时没有可以选择的类型，所以先写死
        }
        const requestPayload = {
            query: userLastQuery,
            is_chinese_text: mask?.isChineseText ?? true,
            history_messages: historyMessages,
            init_model_request: {
                is_chinese_text: mask?.isChineseText ?? true,
                prompt_id: mask?.promptId ?? "",
                have_context: mask?.haveContext ?? false,
                prompt_serialized_type: "chat_prompt",
                llm_id: mask?.llmId,
                model_config: {
                    temperature: maskModelConfig.temperature,
                    top_p: maskModelConfig.top_p,
                    streaming: maskModelConfig.streaming,
                    max_tokens: maskModelConfig.max_tokens,
                    repetition_penalty: maskModelConfig.repetition_penalty,
                },
            } as StartupMaskRequestVO,
            init_retriever_request: initRetrieverRequest,
            used_functions: maskModelConfig.checkedPluginIds ?? [].length > 0 ? maskModelConfig.checkedPluginIds : pluginStore.defaultShownPluginIds,
        } as ChatRequestVO;
        // console.log("[Request] langchain backend payload: ", requestPayload);

        const controller = new AbortController();
        options.onController?.(controller);

        try {
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

            if (streamingMode) {  // Streaming mode!
                const chatPath = this.path("llm-backend/v1/chat-stream/completions");

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

                        if (!res.ok ||
                            !res.headers.get("content-type")
                            ?.startsWith(EventStreamContentType) ||res.status !== 200) {
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
                            let resp: ChatStreamResponseVO = Object.assign(new ChatStreamResponseVO(), json);
                            if (resp.type === "content") {
                                const delta = resp.content;
                                if (delta) {
                                    responseText += delta;
                                    options.onUpdate?.(responseText, delta, resp);
                                }
                            } else if (resp.type === "addition_info") {
                                options.onUpdate?.(responseText, undefined, resp);
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
            } else {  // Not Streaming mode!
                const chatPath = this.path("llm-backend/v1/chat/completions");

                const res = await super.fetchWithRedirect(chatPath, chatPayload);
                if (!res.ok) {
                    throw new Error("Request failed, Please contact admin to check the backend service.");
                }
                clearTimeout(requestTimeoutId);

                const resp = handleServerResponse<ChatResponseVO>(await res.json());
                const message = this.extractMessage(resp);
                // const usedPlugins = extractUsedPlugins(resp);
                options.onFinish(message, resp);
            }
        } catch (e) {
            console.log("[Request] failed to make a chat request", e);
            options.onError?.(e as Error);
        }
    }

}