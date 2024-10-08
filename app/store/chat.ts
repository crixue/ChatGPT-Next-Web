import {create} from "zustand";
import {persist} from "zustand/middleware";

import Locale, {getLang} from "../locales";
import {showToast} from "../components/ui-lib";
import {useAppConfig} from "./config";
import {createEmptyMask, Mask} from "./mask";
import {
    ModelConfig, StoreKey,
} from "../constant";
import {
    ChatOptionsLLMConfig,
    LangchainRelevantDocsSearchOptions,
    RequestMessage
} from "../client/api";
import {ChatControllerPool} from "../client/controller";
import {prettyObject} from "../utils/format";
import {estimateTokenLength} from "../utils/token";
import {nanoid} from "nanoid";
import {ChatApi} from "@/app/client/chat-api";
import {ChatResponseVO, ChatStreamResponseVO, ContextDoc} from "@/app/types/chat";
import {FunctionPlugin} from "@/app/types/plugins";
import {usePluginsStore} from "@/app/store/plugins";
import {CustomUploadFile, MakeLocalVSRequestVO} from "@/app/types/make-localvs-vo";

export type ChatMessage = RequestMessage & {
    date: string;
    streaming?: boolean;
    isError?: boolean;
    id: string;
    contextDocs?: ContextDoc[];
    searchKeywords?: string;
    usedPlugins?: FunctionPlugin[];
};

export function createMessage(override: Partial<ChatMessage>): ChatMessage {
    return {
        id: nanoid(),
        date: new Date().toLocaleString(),
        role: "user",
        content: "",
        ...override,
    };
}

export interface ChatStat {
    tokenCount: number;
    wordCount: number;
    charCount: number;
}

export interface ChatSingleLocalVectorStore {
    attachment: CustomUploadFile;
    taskRecord?: MakeLocalVSRequestVO;
    progress?: number;
}

export interface ChatSession {
    id: string;
    topic: string;
    memoryPrompt: string;
    messages: ChatMessage[];
    stat: ChatStat;
    lastUpdate: number;
    lastSummarizeIndex: number;
    clearContextIndex?: number;
    singleLocalVectorStore?: ChatSingleLocalVectorStore;
    mask: Mask;
}

export interface ChatOptions {
    messages: ChatMessage[];
    config: ChatOptionsLLMConfig;
    onUpdate?: (message: string, chunk?: string, resp?: ChatStreamResponseVO | ChatResponseVO) => void;
    onFinish: (message: string, resp?: ChatStreamResponseVO | ChatResponseVO) => void;
    onError?: (err: Error) => void;
    onController?: (controller: AbortController) => void;
}

// export const DEFAULT_TOPIC = Locale.Store.DefaultTopic;
export const DEFAULT_TOPIC = "新的面具"
export const BOT_HELLO: ChatMessage = createMessage({
    role: "assistant",
    // content: Locale.Store.BotHello,
    content: "有什么可以帮你的吗",
});

function createEmptySession(): ChatSession {
    return {
        id: nanoid(),
        topic: DEFAULT_TOPIC,
        memoryPrompt: "",
        messages: [],
        stat: {
            tokenCount: 0,
            wordCount: 0,
            charCount: 0,
        },
        lastUpdate: Date.now(),
        lastSummarizeIndex: 0,

        mask: createEmptyMask(),
    };
}

export interface ChatStore {
    sessions: ChatSession[];
    currentSessionIndex: number;
    clearSessions: () => void;
    moveSession: (from: number, to: number) => void;
    selectSession: (index: number) => void;
    newSession: (mask?: Mask) => void;
    deleteSession: (index: number) => void;
    currentSession: () => ChatSession;
    nextSession: (delta: number) => void;
    onNewMessage: (message: ChatMessage) => void;
    onUserInput: (content: string) => Promise<void>;
    // summarizeSession: () => void;
    updateStat: (message: ChatMessage) => void;
    updateCurrentSession: (updater: (session: ChatSession) => void) => void;
    updateMessage: (
        sessionIndex: number,
        messageIndex: number,
        updater: (message?: ChatMessage) => void,
    ) => void;
    resetSession: () => void;
    getMessagesWithMemory: () => ChatMessage[];
    getMemoryPrompt: () => ChatMessage;

    clearAllData: () => void;
}

function countMessages(msgs: ChatMessage[]) {
    return msgs.reduce((pre, cur) => pre + estimateTokenLength(cur.content), 0);
}

export function extractUsedPlugins(res: ChatStreamResponseVO | ChatResponseVO) {
    return usePluginsStore.getState().findPluginByIdList(res.used_function_ids ?? []);
}

const chatApi = new ChatApi();

export const useChatStore = create<ChatStore>()(
    persist(
        (set, get) => ({
            sessions: [createEmptySession()],
            currentSessionIndex: 0,

            clearSessions() {
                set(() => ({
                    sessions: [createEmptySession()],
                    currentSessionIndex: 0,
                }));
            },

            selectSession(index: number) {
                set({
                    currentSessionIndex: index,
                });
            },

            moveSession(from: number, to: number) {
                set((state) => {
                    const {sessions, currentSessionIndex: oldIndex} = state;

                    // move the session
                    const newSessions = [...sessions];
                    const session = newSessions[from];
                    newSessions.splice(from, 1);
                    newSessions.splice(to, 0, session);

                    // modify current session id
                    let newIndex = oldIndex === from ? to : oldIndex;
                    if (oldIndex > from && oldIndex <= to) {
                        newIndex -= 1;
                    } else if (oldIndex < from && oldIndex >= to) {
                        newIndex += 1;
                    }

                    return {
                        currentSessionIndex: newIndex,
                        sessions: newSessions,
                    };
                });
            },

            newSession(mask) {
                const session = createEmptySession();

                if (mask) {
                    const config = useAppConfig.getState();
                    const globalModelConfig = config.modelConfig;

                    let historyMessages = mask.context;
                    if (historyMessages.length > 0) {  // Only keep System message as history messages!
                        historyMessages = [historyMessages[0]];
                        // console.log("historyMessages:"+JSON.stringify(historyMessages))
                    }

                    session.mask = {
                        ...mask,
                        modelConfig: {
                            ...globalModelConfig,
                            ...mask.modelConfig,
                        },
                        // context: historyMessages,
                    };
                    session.topic = mask.name;
                }

                // console.log("newSession:"+JSON.stringify(session))
                set((state) => ({
                    currentSessionIndex: 0,
                    sessions: [session].concat(state.sessions),
                }));
            },

            nextSession(delta) {
                const n = get().sessions.length;
                const limit = (x: number) => (x + n) % n;
                const i = get().currentSessionIndex;
                get().selectSession(limit(i + delta));
            },

            deleteSession(index) {
                const deletingLastSession = get().sessions.length === 1;
                const deletedSession = get().sessions.at(index);

                if (!deletedSession) return;

                const sessions = get().sessions.slice();
                sessions.splice(index, 1);

                const currentIndex = get().currentSessionIndex;
                let nextIndex = Math.min(
                    currentIndex - Number(index < currentIndex),
                    sessions.length - 1,
                );

                if (deletingLastSession) {
                    nextIndex = 0;
                    sessions.push(createEmptySession());
                }

                // for undo delete action
                const restoreState = {
                    currentSessionIndex: get().currentSessionIndex,
                    sessions: get().sessions.slice(),
                };

                set(() => ({
                    currentSessionIndex: nextIndex,
                    sessions,
                }));

                showToast(
                    Locale.Home.DeleteToast,
                    {
                        text: Locale.Home.Revert,
                        onClick() {
                            set(() => restoreState);
                        },
                    },
                    5000,
                );
            },

            currentSession() {
                let index = get().currentSessionIndex;
                const sessions = get().sessions;

                if (index < 0 || index >= sessions.length) {
                    index = Math.min(sessions.length - 1, Math.max(0, index));
                    set(() => ({currentSessionIndex: index}));
                }

                const session = sessions[index];

                return session;
            },

            onNewMessage(message) {
                get().updateCurrentSession((session) => {
                    session.messages = session.messages.concat();
                    session.lastUpdate = Date.now();
                });
                // get().updateStat(message);
                // get().summarizeSession();
            },

            async onUserInput(content) {
                const session = get().currentSession();
                const currentMask = session.mask;
                const modelConfig = currentMask.modelConfig;
                const relevantSearchOptions = currentMask.relevantSearchOptions;
                const haveContext = currentMask.haveContext;

                const userMessage: ChatMessage = createMessage({
                    role: "user",
                    content: content,
                });

                const botMessage: ChatMessage = createMessage({
                    role: "assistant",
                    streaming: true,
                });

                // get recent messages
                const recentMessages = get().getMessagesWithMemory();
                const sendMessages = recentMessages.concat(userMessage);
                const messageIndex = get().currentSession().messages.length + 1;

                // save user's and bot's message
                get().updateCurrentSession((session) => {
                    const savedUserMessage = {
                        ...userMessage,
                        content,
                    };
                    session.messages = session.messages.concat([
                        savedUserMessage,
                        botMessage,
                    ]);
                });

                const streamingMode = modelConfig.streaming;
                let chatOptions = {
                    messages: sendMessages,
                    config: {...modelConfig, stream: streamingMode},
                    onUpdate(message, chunk, resp) {
                        botMessage.streaming = true;
                        if (message) {
                            botMessage.content = message;
                        }
                        if(resp?.type && resp?.type == "addition_info") {   // for stream response
                            if(resp.retriever_docs && resp.retriever_docs.length > 0) {
                                botMessage.contextDocs = resp.retriever_docs;
                            }
                            if(resp.search_keywords) {
                                botMessage.searchKeywords = resp.search_keywords;
                            }
                            if(resp.used_function_ids) {
                                botMessage.usedPlugins = extractUsedPlugins(resp);
                            }
                        }
                        get().updateCurrentSession((session) => {
                            session.messages = session.messages.concat();
                        });
                    },
                    onFinish(message, resp?: ChatStreamResponseVO | ChatResponseVO) {
                        botMessage.date = new Date().toLocaleString();
                        botMessage.streaming = false;
                        if (message) {
                            botMessage.content = message;
                            get().onNewMessage(botMessage);
                        }
                        if(resp) {  // for non-stream response
                            if(resp.retriever_docs && resp.retriever_docs.length > 0) {
                                botMessage.contextDocs = resp.retriever_docs;
                            }
                            if(resp.search_keywords) {
                                botMessage.searchKeywords = resp.search_keywords;
                            }
                            if(resp.used_function_ids) {
                                botMessage.usedPlugins = extractUsedPlugins(resp);
                            }
                        }

                        ChatControllerPool.remove(session.id, botMessage.id);
                    },
                    onError(error) {
                        const isAborted = error.message.includes("aborted");
                        botMessage.content +=
                            "\n\n" +
                            prettyObject({
                                error: true,
                                message: error.message,
                            });
                        botMessage.streaming = false;
                        userMessage.isError = !isAborted;
                        botMessage.isError = !isAborted;
                        get().updateCurrentSession((session) => {
                            session.messages = session.messages.concat();
                        });
                        ChatControllerPool.remove(
                            session.id,
                            botMessage.id ?? messageIndex,
                        );

                        console.error("[Chat] failed ", error);
                    },
                    onController(controller) {
                        // collect controller for stop/retry
                        ChatControllerPool.addController(
                            session.id,
                            botMessage.id ?? messageIndex,
                            controller,
                        );
                    },
                } as ChatOptions;

                // make request
                const initRetrieverRequest = {
                    ...relevantSearchOptions,
                } as LangchainRelevantDocsSearchOptions;
                chatApi.chat(chatOptions, initRetrieverRequest);
            },

            getMemoryPrompt() {
                const session = get().currentSession();

                return {
                    role: "system",
                    content:
                        session.memoryPrompt.length > 0
                            ? Locale.Store.Prompt.History(session.memoryPrompt)
                            : "",
                    date: "",
                } as ChatMessage;
            },

            getMessagesWithMemory() {
                const session: ChatSession = get().currentSession();
                const modelConfig = session.mask.modelConfig;
                const clearContextIndex = session.clearContextIndex ?? 0;
                const messages = session.messages.slice();
                const totalMessageCount = session.messages.length;

                // in-context prompts: only need system message
                // const contextPrompts = session.mask.context.slice();
                const contextPrompts = [session.mask.context[0]];

                // system prompts, to get close to OpenAI Web ChatGPT
                // const shouldInjectSystemPrompts = modelConfig.enableInjectSystemPrompts;
                // const systemPrompts = shouldInjectSystemPrompts
                //     ? [
                //         createMessage({
                //             role: "system",
                //             content: fillTemplateWith("", {
                //                 ...modelConfig,
                //                 template: DEFAULT_SYSTEM_TEMPLATE,
                //             }),
                //         }),
                //     ]
                //     : [];
                // if (shouldInjectSystemPrompts) {
                //     console.log(
                //         "[Global System Prompt] ",
                //         systemPrompts.at(0)?.content ?? "empty",
                //     );
                // }

                // long term memory
                const shouldSendLongTermMemory =
                    session.memoryPrompt &&
                    session.memoryPrompt.length > 0 &&
                    session.lastSummarizeIndex > clearContextIndex;
                const longTermMemoryPrompts = shouldSendLongTermMemory
                    ? [get().getMemoryPrompt()]
                    : [];
                const longTermMemoryStartIndex = session.lastSummarizeIndex;

                // short term memory
                const shortTermMemoryStartIndex = Math.max(
                    0,
                    totalMessageCount - (modelConfig?.historyMessageCount ?? 0),
                );

                // lets concat send messages, including 4 parts:
                // 0. system prompt: to get close to OpenAI Web ChatGPT
                // 1. long term memory: summarized memory messages
                // 2. pre-defined in-context prompts
                // 3. short term memory: latest n messages
                // 4. newest input message
                const memoryStartIndex = shouldSendLongTermMemory
                    ? Math.min(longTermMemoryStartIndex, shortTermMemoryStartIndex)
                    : shortTermMemoryStartIndex;
                // and if user has cleared history messages, we should exclude the memory too.
                const contextStartIndex = Math.max(clearContextIndex, memoryStartIndex);
                const maxTokenThreshold = modelConfig.max_tokens ?? 2000;

                // get recent messages as much as possible
                const reversedRecentMessages = [];
                for (
                    let i = totalMessageCount - 1, tokenCount = 0;
                    i >= contextStartIndex && tokenCount < maxTokenThreshold;
                    i -= 1
                ) {
                    const msg = messages[i];
                    if (!msg || msg.isError) continue;
                    tokenCount += estimateTokenLength(msg.content);
                    reversedRecentMessages.push(msg);
                }

                // console.log("contextPrompts:"+JSON.stringify(contextPrompts))
                // console.log("reversedRecentMessages:"+JSON.stringify(reversedRecentMessages))
                // concat all messages
                // const recentMessages = [
                //     // ...systemPrompts,
                //     ...longTermMemoryPrompts,
                //     ...contextPrompts,
                //     ...reversedRecentMessages.reverse(),
                // ];

                const recentMessages = [
                    // ...systemPrompts,
                    ...contextPrompts,
                    ...reversedRecentMessages.reverse(),
                ];

                return recentMessages;
            },

            updateMessage(
                sessionIndex: number,
                messageIndex: number,
                updater: (message?: ChatMessage) => void,
            ) {
                const sessions = get().sessions;
                const session = sessions.at(sessionIndex);
                const messages = session?.messages;
                updater(messages?.at(messageIndex));
                set(() => ({sessions}));
            },

            resetSession() {
                get().updateCurrentSession((session) => {
                    session.messages = [];
                    session.memoryPrompt = "";
                });
            },

            updateStat(message) {
                get().updateCurrentSession((session) => {
                    session.stat.charCount += message.content.length;
                });
            },

            updateCurrentSession(updater) {
                const sessions = get().sessions;
                const index = get().currentSessionIndex;
                updater(sessions[index]);
                set(() => ({sessions}));
            },

            clearAllData() {
                localStorage.clear();
                location.reload();
            },
        }),
        {
            name: StoreKey.Chat,
        },
    ),
);
