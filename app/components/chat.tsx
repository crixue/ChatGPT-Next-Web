import {useDebouncedCallback} from "use-debounce";
import React, {Fragment, useEffect, useMemo, useRef, useState,} from "react";
import EditIcon from "../icons/rename.svg";
import ReturnIcon from "../icons/return.svg";
import CopyIcon from "../icons/copy.svg";
import LoadingIcon from "../icons/three-dots.svg";
import MaskIcon from "../icons/mask.svg";
import ResetIcon from "../icons/reload.svg";
import BreakIcon from "../icons/break.svg";
import SettingsIcon from "../icons/chat-settings.svg";
import DeleteIcon from "../icons/clear.svg";
import ConfirmIcon from "../icons/confirm.svg";
import CancelIcon from "../icons/cancel.svg";
import BottomIcon from "../icons/bottom.svg";
import StopIcon from "../icons/pause.svg";

import {
    BOT_HELLO,
    ChatMessage,
    createMessage,
    DEFAULT_MASK_AVATAR,
    DEFAULT_TOPIC,
    Mask,
    ModelType,
    useAccessStore,
    useAppConfig,
    useChatStore,
    useMaskStore,
} from "../store";

import {autoGrowTextArea, copyToClipboard, selectOrCopy, useMobileScreen,} from "../utils";

import dynamic from "next/dynamic";

import {ChatControllerPool} from "../client/controller";
import {Prompt, usePromptStore} from "../store/prompt";
import Locale from "../locales";

import {IconButton} from "./button";
import styles from "./chat.module.scss";

import {CustomListItem, CustomModal, Selector, showPrompt, showToast,} from "./ui-lib";
import {useNavigate} from "react-router-dom";
import {
    CHAT_PAGE_SIZE,
    LAST_INPUT_KEY,
    Path,
    REQUEST_TIMEOUT_MS,
    SubmitKey,
    Theme,
    UNFINISHED_INPUT,
} from "../constant";
import {ContextPrompts, MaskConfig} from "./mask";
import {ChatCommandPrefix, useChatCommand, useCommand} from "../command";
import {prettyObject} from "../utils/format";
import {getClientConfig} from "../config/client";
import {Button, Drawer, List, Modal, notification} from "antd";
import {ContextDoc} from "@/app/types/chat";
import {validateMask} from "@/app/utils/mask";
import {RocketOutlined, SendOutlined} from "@ant-design/icons";
import {useInitSupportedFunctions} from "@/app/components/plugins";
import {UserUsageApi} from "@/app/client/user-usage-api";
import {NotHaveEnoughMoneyException} from "@/app/exceptions/not-have-enough-money-exception";
import {useAuthStore} from "@/app/store/auth";
import {AssistantAvatar, UserAvatar} from "@/app/components/avtars";

const Markdown = dynamic(async () => (await import("./markdown")).Markdown, {
    loading: () => <LoadingIcon/>,
});

export function SessionConfigModel(props: { onClose: () => void }) {
    const maskStore = useMaskStore();
    const chatStore = useChatStore();
    const session = chatStore.currentSession();
    const [notify, contextHolder] = notification.useNotification();
    const navigate = useNavigate();
    const [isOpenMakingLocalVSModal, setIsOpenMakingLocalVSModal] = useState(false);

    const handleOnApplyMask = (mask: Mask) => {
        const applyMask = {...mask};
        // console.log("CurrentMask:"+JSON.stringify(applyMask));
        try {
            validateMask(applyMask);
        } catch (e: any) {
            console.log("validate mask failed", e);
            maskStore.setShowUserPromptError(true);
            notify['error']({
                message: e.message,
                duration: 10,
            });
            return;
        }
        chatStore.updateCurrentSession((item) => (item.mask = applyMask));
        // console.log("[Mask] apply mask", JSON.stringify(session.mask));
        props.onClose();
    }

    return (
        <div className="modal-mask">
            {contextHolder}
            <CustomModal
                title={Locale.Context.Edit}
                onClose={() => props.onClose()}
                actions={[
                    <Button
                        type={"primary"}
                        icon={<RocketOutlined/>}
                        onClick={() => handleOnApplyMask(session.mask)}
                    >{Locale.Mask.Config.ApplyMask}</Button>,
                    // <Button
                    //     icon={<ResetIcon/>}
                    //     onClick={async () => {
                    //         if (await showConfirm(Locale.Memory.ResetConfirm)) {
                    //             chatStore.updateCurrentSession(
                    //                 (session) => (session.memoryPrompt = ""),
                    //             );
                    //         }
                    //     }}
                    // >
                    //     {Locale.Chat.Config.Reset}
                    // </Button>
                ]}
            >
                <MaskConfig
                    mask={session.mask}
                    updateMask={(updater) => {
                        const mask = {...session.mask};
                        updater(mask);
                        chatStore.updateCurrentSession((session) => {
                            session.mask = mask;
                            session.topic = mask.name;
                        });
                    }}
                    onGoToMakeLocalVS={(val) => setIsOpenMakingLocalVSModal(val)}
                    shouldSyncFromGlobal
                />
            </CustomModal>
            <Modal title={Locale.Settings.MakingLocalVS.Title}
                   open={isOpenMakingLocalVSModal}
                   onOk={() => navigate(Path.MakeLocalVSStore)}
                   okText={Locale.Settings.MakingLocalVS.ButtonContent}
                   onCancel={() => setIsOpenMakingLocalVSModal(false)}
                   cancelText={Locale.Settings.MakingLocalVS.CancelButtonContent}
            >
                <p>{Locale.Settings.MakingLocalVS.GoToMakeLocalVS}</p>
            </Modal>
        </div>
    );
}

function PromptToast(props: {
    showToast?: boolean;
    showModal?: boolean;
    setShowModal: (_: boolean) => void;
}) {
    const chatStore = useChatStore();
    const session = chatStore.currentSession();
    const context = session.mask.context;

    return (
        <div className={styles["prompt-toast"]} key="prompt-toast">
            {/*  {props.showToast && (*/}
            {/*      <div*/}
            {/*          className={styles["prompt-toast-inner"] + " clickable"}*/}
            {/*          role="button"*/}
            {/*          onClick={() => {*/}
            {/*              props.setShowModal(true);*/}
            {/*          }}*/}
            {/*      >*/}
            {/*          <BrainIcon/>*/}
            {/*          <span className={styles["prompt-toast-content"]}>*/}
            {/*  {Locale.Context.Toast(context.length)}*/}
            {/*</span>*/}
            {/*      </div>*/}
            {/*  )}*/}
            {props.showModal && (
                <SessionConfigModel onClose={() => {
                    props.setShowModal(false);
                }}/>
            )}
        </div>
    );
}

function useSubmitHandler() {
    const config = useAppConfig();
    const submitKey = config.submitKey;
    const isComposing = useRef(false);

    useEffect(() => {
        const onCompositionStart = () => {
            isComposing.current = true;
        };
        const onCompositionEnd = () => {
            isComposing.current = false;
        };

        window.addEventListener("compositionstart", onCompositionStart);
        window.addEventListener("compositionend", onCompositionEnd);

        return () => {
            window.removeEventListener("compositionstart", onCompositionStart);
            window.removeEventListener("compositionend", onCompositionEnd);
        };
    }, []);

    const shouldSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key !== "Enter") return false;
        if (e.key === "Enter" && (e.nativeEvent.isComposing || isComposing.current))
            return false;
        return (
            (config.submitKey === SubmitKey.AltEnter && e.altKey) ||
            (config.submitKey === SubmitKey.CtrlEnter && e.ctrlKey) ||
            (config.submitKey === SubmitKey.ShiftEnter && e.shiftKey) ||
            (config.submitKey === SubmitKey.MetaEnter && e.metaKey) ||
            (config.submitKey === SubmitKey.Enter &&
                !e.altKey &&
                !e.ctrlKey &&
                !e.shiftKey &&
                !e.metaKey)
        );
    };

    return {
        submitKey,
        shouldSubmit,
    };
}

export type RenderPompt = Pick<Prompt, "title" | "content">;

export function PromptHints(props: {
    prompts: RenderPompt[];
    onPromptSelect: (prompt: RenderPompt) => void;
}) {
    const noPrompts = props.prompts.length === 0;
    const [selectIndex, setSelectIndex] = useState(0);
    const selectedRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSelectIndex(0);
    }, [props.prompts.length]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (noPrompts || e.metaKey || e.altKey || e.ctrlKey) {
                return;
            }
            // arrow up / down to select prompt
            const changeIndex = (delta: number) => {
                e.stopPropagation();
                e.preventDefault();
                const nextIndex = Math.max(
                    0,
                    Math.min(props.prompts.length - 1, selectIndex + delta),
                );
                setSelectIndex(nextIndex);
                selectedRef.current?.scrollIntoView({
                    block: "center",
                });
            };

            if (e.key === "ArrowUp") {
                changeIndex(1);
            } else if (e.key === "ArrowDown") {
                changeIndex(-1);
            } else if (e.key === "Enter") {
                const selectedPrompt = props.prompts.at(selectIndex);
                if (selectedPrompt) {
                    props.onPromptSelect(selectedPrompt);
                }
            }
        };

        window.addEventListener("keydown", onKeyDown);

        return () => window.removeEventListener("keydown", onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.prompts.length, selectIndex]);

    if (noPrompts) return null;
    return (
        <div className={styles["prompt-hints"]}>
            {props.prompts.map((prompt, i) => (
                <div
                    ref={i === selectIndex ? selectedRef : null}
                    className={
                        styles["prompt-hint"] +
                        ` ${i === selectIndex ? styles["prompt-hint-selected"] : ""}`
                    }
                    key={prompt.title + i.toString()}
                    onClick={() => props.onPromptSelect(prompt)}
                    onMouseEnter={() => setSelectIndex(i)}
                >
                    <div className={styles["hint-title"]}>{prompt.title}</div>
                    <div className={styles["hint-content"]}>{prompt.content}</div>
                </div>
            ))}
        </div>
    );
}

function ClearContextDivider() {
    const chatStore = useChatStore();

    return (
        <div
            className={styles["clear-context"]}
            onClick={() =>
                chatStore.updateCurrentSession(
                    (session) => (session.clearContextIndex = undefined),
                )
            }
        >
            <div className={styles["clear-context-tips"]}>{Locale.Context.Clear}</div>
            <div className={styles["clear-context-revert-btn"]}>
                {Locale.Context.Revert}
            </div>
        </div>
    );
}

function ChatAction(props: {
    text: string;
    icon: JSX.Element;
    onClick: () => void;
}) {
    const iconRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState({
        full: 16,
        icon: 16,
    });

    function updateWidth() {
        if (!iconRef.current || !textRef.current) return;
        const getWidth = (dom: HTMLDivElement) => dom.getBoundingClientRect().width;
        const textWidth = getWidth(textRef.current);
        const iconWidth = getWidth(iconRef.current);
        setWidth({
            full: textWidth + iconWidth,
            icon: iconWidth,
        });
    }

    return (
        <div
            className={`${styles["chat-input-action"]} clickable`}
            onClick={() => {
                props.onClick();
                setTimeout(updateWidth, 1);
            }}
            onMouseEnter={updateWidth}
            onTouchStart={updateWidth}
            style={
                {
                    "--icon-width": `${width.icon}px`,
                    "--full-width": `${width.full}px`,
                } as React.CSSProperties
            }
        >
            <div ref={iconRef} className={styles["icon"]}>
                {props.icon}
            </div>
            <div className={styles["text"]} ref={textRef}>
                {props.text}
            </div>
        </div>
    );
}

function useScrollToBottom() {
    // for auto-scroll
    const scrollRef = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);

    function scrollDomToBottom() {
        const dom = scrollRef.current;
        if (dom) {
            requestAnimationFrame(() => {
                setAutoScroll(true);
                dom.scrollTo(0, dom.scrollHeight);
            });
        }
    }

    // auto scroll
    useEffect(() => {
        if (autoScroll) {
            scrollDomToBottom();
        }
    });

    return {
        scrollRef,
        autoScroll,
        setAutoScroll,
        scrollDomToBottom,
    };
}

export function ChatActions(props: {
    showPromptModal: () => void;
    scrollToBottom: () => void;
    showPromptHints: () => void;
    hitBottom: boolean;
}) {
    const config = useAppConfig();
    const navigate = useNavigate();
    const chatStore = useChatStore();

    // switch themes
    const theme = config.theme;

    function nextTheme() {
        const themes = [Theme.Auto, Theme.Light, Theme.Dark];
        const themeIndex = themes.indexOf(theme);
        const nextIndex = (themeIndex + 1) % themes.length;
        const nextTheme = themes[nextIndex];
        config.update((config) => (config.theme = nextTheme));
    }

    // stop all responses
    const couldStop = ChatControllerPool.hasPending();
    const stopAll = () => ChatControllerPool.stopAll();

    // switch model
    const models = config.supportedModels;
    const currentModel = chatStore.currentSession().mask.modelConfig.model_id;
    const [showModelSelector, setShowModelSelector] = useState(false);

    return (
        <div className={styles["chat-input-actions"]}>
            {couldStop && (
                <ChatAction
                    onClick={stopAll}
                    text={Locale.Chat.InputActions.Stop}
                    icon={<StopIcon/>}
                />
            )}
            {!props.hitBottom && (
                <ChatAction
                    onClick={props.scrollToBottom}
                    text={Locale.Chat.InputActions.ToBottom}
                    icon={<BottomIcon/>}
                />
            )}
            {props.hitBottom && (
                <ChatAction
                    onClick={props.showPromptModal}
                    text={Locale.Chat.InputActions.Settings}
                    icon={<SettingsIcon/>}
                />
            )}

            {/*<ChatAction*/}
            {/*    onClick={nextTheme}*/}
            {/*    text={Locale.Chat.InputActions.Theme[theme]}*/}
            {/*    icon={*/}
            {/*        <>*/}
            {/*            {theme === Theme.Auto ? (*/}
            {/*                <AutoIcon/>*/}
            {/*            ) : theme === Theme.Light ? (*/}
            {/*                <LightIcon/>*/}
            {/*            ) : theme === Theme.Dark ? (*/}
            {/*                <DarkIcon/>*/}
            {/*            ) : null}*/}
            {/*        </>*/}
            {/*    }*/}
            {/*/>*/}

            {/*<ChatAction*/}
            {/*    onClick={props.showPromptHints}*/}
            {/*    text={Locale.Chat.InputActions.Prompt}*/}
            {/*    icon={<PromptIcon/>}*/}
            {/*/>*/}

            <ChatAction
                onClick={() => {
                    navigate(Path.Masks);
                }}
                text={Locale.Chat.InputActions.Masks}
                icon={<MaskIcon/>}
            />

            <ChatAction
                text={Locale.Chat.InputActions.Clear}
                icon={<BreakIcon/>}
                onClick={() => {
                    chatStore.updateCurrentSession((session) => {
                        if (session.clearContextIndex === session.messages.length) {
                            session.clearContextIndex = undefined;
                        } else {
                            session.clearContextIndex = session.messages.length;
                            session.memoryPrompt = ""; // will clear memory
                        }
                    });
                }}
            />

            {/*<ChatAction*/}
            {/*    onClick={() => setShowModelSelector(true)}*/}
            {/*    text={currentModel}*/}
            {/*    icon={<RobotIcon/>}*/}
            {/*/>*/}

            {showModelSelector && (
                <Selector
                    defaultSelectedValue={currentModel}
                    items={models.map((m) => ({
                        title: m.alias,
                        value: m.name,
                    }))}
                    onClose={() => setShowModelSelector(false)}
                    onSelection={(s) => {
                        if (s.length === 0) return;
                        chatStore.updateCurrentSession((session) => {
                            session.mask.modelConfig.model_id = s[0] as ModelType;
                            session.mask.syncGlobalConfig = false;
                        });
                        showToast(s[0]);
                    }}
                />
            )}
        </div>
    );
}

export function EditMessageModal(props: { onClose: () => void }) {
    const chatStore = useChatStore();
    const session = chatStore.currentSession();
    const mask = session.mask;
    const [context, setContext] = useState(mask.context ?? []);
    const [fewShotMessages, setFewShotMessages] = useState(mask.fewShotContext);

    return (
        <div className="modal-mask">
            <CustomModal
                title={Locale.Chat.EditMessage.Title}
                onClose={props.onClose}
                actions={[
                    <IconButton
                        text={Locale.UI.Cancel}
                        icon={<CancelIcon/>}
                        key="cancel"
                        onClick={() => {
                            props.onClose();
                        }}
                    />,
                    <IconButton
                        type="primary"
                        text={Locale.UI.Confirm}
                        icon={<ConfirmIcon/>}
                        key="ok"
                        onClick={() => {
                            chatStore.updateCurrentSession(
                                (session) => {
                                    session.messages = context;
                                },
                            );
                            props.onClose();
                        }}
                    />,
                ]}
            >
                <List>
                    <CustomListItem
                        title={Locale.Chat.EditMessage.Topic.Title}
                        subTitle={Locale.Chat.EditMessage.Topic.SubTitle}
                    >
                        <input
                            type="text"
                            value={session.topic}
                            onInput={(e) =>
                                chatStore.updateCurrentSession(
                                    (session) => (
                                        session.topic = e.currentTarget.value
                                    ),
                                )
                            }
                        ></input>
                    </CustomListItem>
                </List>
                <ContextPrompts
                    context={context}
                    updateContext={(updater) => {
                        const newMessages = context.slice();
                        updater(newMessages);
                        setContext(newMessages);
                    }}
                    fewShotMessages={fewShotMessages}
                    updateFewShotMessages={(updater) => {
                        const newFewShotMessages = {...fewShotMessages};
                        updater(newFewShotMessages);
                        setFewShotMessages(newFewShotMessages);
                    }}
                />
            </CustomModal>
        </div>
    );
}

const userUsageApi = new UserUsageApi();

function _Chat() {
    type RenderMessage = ChatMessage & { preview?: boolean };

    const chatStore = useChatStore();
    const session = chatStore.currentSession();
    const config = useAppConfig();
    const fontSize = config.fontSize;

    let letterLimit = 4000;
    for (const model of config.supportedModels) {
        if (session.mask.modelConfig.model_id === model.id) {
            letterLimit = model.context_tokens_limit;
            break;
        }
    }

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [userInput, setUserInput] = useState("");
    const [formattedContent, setFormattedContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const {submitKey, shouldSubmit} = useSubmitHandler();
    const {scrollRef, setAutoScroll, scrollDomToBottom} = useScrollToBottom();
    const [hitBottom, setHitBottom] = useState(true);
    const [showNotHaveEnoughMoneyAlert, setShowNotHaveEnoughMoneyAlert] = useState(false);
    const isMobileScreen = useMobileScreen();
    const navigate = useNavigate();
    const authStore = useAuthStore();

    // prompt hints
    const promptStore = usePromptStore();
    const [promptHints, setPromptHints] = useState<RenderPompt[]>([]);
    const onSearch = useDebouncedCallback(
        (text: string) => {
            const matchedPrompts = promptStore.search(text);
            setPromptHints(matchedPrompts);
        },
        100,
        {leading: true, trailing: true},
    );

    // auto grow input
    const [inputRows, setInputRows] = useState(2);
    const measure = useDebouncedCallback(
        () => {

            const rows = inputRef.current ? autoGrowTextArea(inputRef.current) : 1;
            const inputRows = Math.min(
                10,
                Math.max(2 + Number(!isMobileScreen), rows),
            );
            setInputRows(inputRows);
            if (userInput.length > letterLimit) {
                setFormattedContent(userInput.slice(0, letterLimit));
                return
            }
            setFormattedContent(userInput);
        },
        100,
        {
            leading: true,
            trailing: true,
        },
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(measure, [userInput]);
    useInitSupportedFunctions(true);

    // chat commands shortcuts
    const chatCommands = useChatCommand({
        new: () => chatStore.newSession(),
        newm: () => navigate(Path.NewChat),
        prev: () => chatStore.nextSession(-1),
        next: () => chatStore.nextSession(1),
        clear: () =>
            chatStore.updateCurrentSession(
                (session) => (session.clearContextIndex = session.messages.length),
            ),
        del: () => chatStore.deleteSession(chatStore.currentSessionIndex),
    });

    // only search prompts when user input is short
    const SEARCH_TEXT_LIMIT = 30;
    const onInput = (text: string) => {
        setUserInput(text);
        const n = text.trim().length;

        // clear search results
        if (n === 0) {
            setPromptHints([]);
        } else if (text.startsWith(ChatCommandPrefix)) {
            setPromptHints(chatCommands.search(text));
        } else if (!config.disablePromptHint && n < SEARCH_TEXT_LIMIT) {
            // check if need to trigger auto completion
            if (text.startsWith("/")) {
                let searchText = text.slice(1);
                onSearch(searchText);
            }
        }
    };

    const doSubmit = async (userInput: string) => {
        if (userInput.trim() === "") return;
        const matchCommand = chatCommands.match(userInput);
        if (matchCommand.matched) {
            setUserInput("");
            setPromptHints([]);
            matchCommand.invoke();
            return;
        }
        setIsLoading(true);
        chatStore.onUserInput(userInput).then(() => setIsLoading(false));
        localStorage.setItem(LAST_INPUT_KEY, userInput);
        setUserInput("");
        setPromptHints([]);
        if (!isMobileScreen) inputRef.current?.focus();
        setAutoScroll(true);
        try {
            await userUsageApi.hasEnoughMoney();
        } catch (e: any) {
            if (e instanceof NotHaveEnoughMoneyException) {
                setShowNotHaveEnoughMoneyAlert(true);
                return;
            }
            console.error("Call check have enough money failed:", e);
        }
    };

    const onPromptSelect = (prompt: RenderPompt) => {
        setTimeout(() => {
            setPromptHints([]);

            const matchedChatCommand = chatCommands.match(prompt.content);
            if (matchedChatCommand.matched) {
                // if user is selecting a chat command, just trigger it
                matchedChatCommand.invoke();
                setUserInput("");
            } else {
                // or fill the prompt
                setUserInput(prompt.content);
            }
            inputRef.current?.focus();
        }, 30);
    };

    // stop response
    const onUserStop = (messageId: string) => {
        ChatControllerPool.stop(session.id, messageId);
    };

    useEffect(() => {
        chatStore.updateCurrentSession((session) => {
            const stopTiming = Date.now() - REQUEST_TIMEOUT_MS;
            session.messages.forEach((m) => {
                // check if should stop all stale messages
                if (m.isError || new Date(m.date).getTime() < stopTiming) {
                    if (m.streaming) {
                        m.streaming = false;
                    }

                    if (m.content.length === 0) {
                        m.isError = true;
                        m.content = prettyObject({
                            error: true,
                            message: "empty response",
                        });
                    }
                }
            });

            // auto sync mask config from global config
            if (session.mask.syncGlobalConfig) {
                // console.log("[Mask] syncing from global, name = ", session.mask.name);
                session.mask.modelConfig = {...config.modelConfig};
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // check if should send message
    const onInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // if ArrowUp and no userInput, fill with last input
        if (
            e.key === "ArrowUp" &&
            userInput.length <= 0 &&
            !(e.metaKey || e.altKey || e.ctrlKey)
        ) {
            setUserInput(localStorage.getItem(LAST_INPUT_KEY) ?? "");
            e.preventDefault();
            return;
        }
        if (shouldSubmit(e) && promptHints.length === 0) {
            doSubmit(userInput);
            e.preventDefault();
        }
    };
    const onRightClick = (e: any, message: ChatMessage) => {
        // copy to clipboard
        if (selectOrCopy(e.currentTarget, message.content)) {
            if (userInput.length === 0) {
                setUserInput(message.content);
            }

            e.preventDefault();
        }
    };

    const deleteMessage = (msgId?: string) => {
        chatStore.updateCurrentSession(
            (session) =>
                (session.messages = session.messages.filter((m) => m.id !== msgId)),
        );
    };

    const onDelete = (msgId: string) => {
        deleteMessage(msgId);
    };

    const onResend = async (message: ChatMessage) => {
        try {
            await userUsageApi.hasEnoughMoney();
        } catch (e: any) {
            if (e instanceof NotHaveEnoughMoneyException) {
                setShowNotHaveEnoughMoneyAlert(true);
                return;
            }
            console.error("Call check have enough money failed:", e);
        }

        // when it is resending a message
        // 1. for a user's message, find the next bot response
        // 2. for a bot's message, find the last user's input
        // 3. delete original user input and bot's message
        // 4. resend the user's input

        const resendingIndex = session.messages.findIndex(
            (m) => m.id === message.id,
        );

        if (resendingIndex < 0 || resendingIndex >= session.messages.length) {
            console.error("[Chat] failed to find resending message", message);
            return;
        }

        let userMessage: ChatMessage | undefined;
        let botMessage: ChatMessage | undefined;

        if (message.role === "assistant") {
            // if it is resending a bot's message, find the user input for it
            botMessage = message;
            for (let i = resendingIndex; i >= 0; i -= 1) {
                if (session.messages[i].role === "user") {
                    userMessage = session.messages[i];
                    break;
                }
            }
        } else if (message.role === "user") {
            // if it is resending a user's input, find the bot's response
            userMessage = message;
            for (let i = resendingIndex; i < session.messages.length; i += 1) {
                if (session.messages[i].role === "assistant") {
                    console.log('current message:', session.messages[i]);
                    botMessage = session.messages[i];
                    break;
                }
            }
        }

        if (userMessage === undefined) {
            console.error("[Chat] failed to resend", message);
            return;
        }

        // delete the original messages
        deleteMessage(userMessage.id);
        deleteMessage(botMessage?.id);

        // resend the message
        setIsLoading(true);
        chatStore.onUserInput(userMessage.content).then(() => setIsLoading(false));
        inputRef.current?.focus();
    };

    const onPinMessage = (message: ChatMessage) => {
        chatStore.updateCurrentSession((session) =>
            session.mask.context.push(message),
        );

        showToast(Locale.Chat.Actions.PinToastContent, {
            text: Locale.Chat.Actions.PinToastAction,
            onClick: () => {
                setShowPromptModal(true);
            },
        });
    };

    const context: RenderMessage[] = useMemo(() => {
        const showContexts = session.mask.context.slice(0, 1);  // only show the system message context
        // console.log("showContexts", showContexts);
        return session.mask.hideContext ? [] : showContexts;
    }, [session.mask.context, session.mask.hideContext]);
    const accessStore = useAccessStore();

    if (
        context.length === 0 &&
        session.messages.at(0)?.content !== BOT_HELLO.content
    ) {
        const copiedHello = Object.assign({}, BOT_HELLO);
        context.push(copiedHello);
    }

    // preview messages
    const renderMessages = useMemo(() => {
        return context
            .concat(session.messages as RenderMessage[])
            .concat(
                isLoading
                    ? [
                        // {
                        //     ...createMessage({
                        //         role: "assistant",
                        //         content: "……",
                        //     }),
                        //     preview: false,
                        // },
                    ]
                    : [],
            )
            .concat(
                userInput.length > 0 && config.sendPreviewBubble
                    ? [
                        {
                            ...createMessage({
                                role: "user",
                                content: userInput,
                            }),
                            preview: false,
                        },
                    ]
                    : [],
            );
    }, [
        config.sendPreviewBubble,
        context,
        isLoading,
        session.messages,
        // userInput, //防止用户一边输入，一边显示输入的内容
    ]);

    const [msgRenderIndex, _setMsgRenderIndex] = useState(
        Math.max(0, renderMessages.length - CHAT_PAGE_SIZE),
    );

    function setMsgRenderIndex(newIndex: number) {
        newIndex = Math.min(renderMessages.length - CHAT_PAGE_SIZE, newIndex);
        newIndex = Math.max(0, newIndex);
        _setMsgRenderIndex(newIndex);
    }

    const messages = useMemo(() => {
        const endRenderIndex = Math.min(
            msgRenderIndex + 3 * CHAT_PAGE_SIZE,
            renderMessages.length,
        );
        return renderMessages.slice(msgRenderIndex, endRenderIndex);
    }, [msgRenderIndex, renderMessages]);

    const onChatBodyScroll = (e: HTMLElement) => {
        const bottomHeight = e.scrollTop + e.clientHeight;
        const edgeThreshold = e.clientHeight;

        const isTouchTopEdge = e.scrollTop <= edgeThreshold;
        const isTouchBottomEdge = bottomHeight >= e.scrollHeight - edgeThreshold;
        const isHitBottom =
            bottomHeight >= e.scrollHeight - (isMobileScreen ? 0 : 10);

        const prevPageMsgIndex = msgRenderIndex - CHAT_PAGE_SIZE;
        const nextPageMsgIndex = msgRenderIndex + CHAT_PAGE_SIZE;

        if (isTouchTopEdge && !isTouchBottomEdge) {
            setMsgRenderIndex(prevPageMsgIndex);
        } else if (isTouchBottomEdge) {
            setMsgRenderIndex(nextPageMsgIndex);
        }

        setHitBottom(isHitBottom);
        setAutoScroll(isHitBottom);
    };

    function scrollToBottom() {
        setMsgRenderIndex(renderMessages.length - CHAT_PAGE_SIZE);
        scrollDomToBottom();
    }

    // clear context index = context length + index in messages
    const clearContextIndex =
        (session.clearContextIndex ?? -1) >= 0
            ? session.clearContextIndex! + context.length - msgRenderIndex
            : -1;

    const [showPromptModal, setShowPromptModal] = useState(false);

    const clientConfig = useMemo(() => getClientConfig(), []);

    const autoFocus = !isMobileScreen; // wont auto focus on mobile screen

    useCommand({
        fill: setUserInput,
        submit: (text) => {
            doSubmit(text);
        },
    });

    // edit / insert message modal
    const [isEditingMessage, setIsEditingMessage] = useState(false);

    // remember unfinished input
    useEffect(() => {
        // try to load from local storage
        const key = UNFINISHED_INPUT(session.id);
        const mayBeUnfinishedInput = localStorage.getItem(key);
        if (mayBeUnfinishedInput && userInput.length === 0) {
            setUserInput(mayBeUnfinishedInput);
            localStorage.removeItem(key);
        }

        const dom = inputRef.current;
        return () => {
            localStorage.setItem(key, dom?.value ?? "");
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [openSourceDrawer, setOpenSourceDrawer] = useState(false);
    const [showedDataList, setShowedDataList] = useState([] as any[]);
    const onSourceDrawerClose = () => {
        setOpenSourceDrawer(false);
    };

    function closeChargeModal() {
        setShowNotHaveEnoughMoneyAlert(false);
    }

    function goToRecharge() {
        closeChargeModal();
        navigate(Path.Wallet);
    }

    return (
        <>
            <div className={styles.chat} key={session.id}>
                <div className="window-header" data-tauri-drag-region>
                    {isMobileScreen && (
                        <div className="window-actions">
                            <div className={"window-action-button"}>
                                <IconButton
                                    icon={<ReturnIcon/>}
                                    bordered
                                    title={Locale.Chat.Actions.ChatList}
                                    onClick={() => navigate(Path.Home)}
                                />
                            </div>
                        </div>
                    )}

                    <div className={`window-header-title ${styles["chat-body-title"]}`}>
                        <div
                            className={`window-header-main-title ${styles["chat-body-main-title"]}`}
                            // onClickCapture={() => setIsEditingMessage(true)}
                        >
                            {!session.topic ? DEFAULT_TOPIC : session.topic}
                        </div>
                        <div className="window-header-sub-title">
                            {Locale.Chat.SubTitle(session.messages.length)}
                        </div>
                    </div>

                    <PromptToast
                        showToast={!hitBottom}
                        showModal={showPromptModal}
                        setShowModal={setShowPromptModal}
                    />
                </div>

                <div
                    className={styles["chat-body"]}
                    ref={scrollRef}
                    onScroll={(e) => onChatBodyScroll(e.currentTarget)}
                    onMouseDown={() => inputRef.current?.blur()}
                    onTouchStart={() => {
                        inputRef.current?.blur();
                        setAutoScroll(false);
                    }}
                >
                    {messages.map((message, i) => {
                        // console.log("num:", i + " message:", message);
                        const isUser = message.role === "user";
                        const isAssistant = message.role === "assistant";
                        const isContext = i < context.length;
                        const showActions =
                            i > 0 &&
                            !(message.preview || message.content.length === 0) &&
                            !isContext;
                        const showTyping = (message.preview || message.streaming) && isAssistant;

                        const shouldShowClearContextDivider = i === clearContextIndex - 1;

                        const assistantAnswerHasSource = () => {
                            let hasSource = isAssistant && !isContext && !message.isError
                                && message.contextDocs && message.contextDocs.length > 0;
                            if (!hasSource) return false;
                            hasSource = false;
                            for (const item of message.contextDocs!) {
                                const metadata = item.metadata;
                                if (!metadata || !metadata.source_type) continue;
                                if (metadata.source_type === ("upload_files" || "plain_text" || "speech_recognize_transcript") && metadata.source) {
                                    const fileName = metadata.source.split("/").pop();
                                    if (fileName) {
                                        hasSource = true;
                                        break;
                                    }
                                } else if (metadata.source_type === "web_search" && metadata.url && metadata.url.trim() !== "Nan") {
                                    // console.log("metadata.url:", metadata.url);
                                    hasSource = true;
                                    break;
                                }
                            }
                            // console.log("hasSource:", hasSource);
                            return hasSource;
                        }

                        const handleOnCheckSource = (currentMessage: ChatMessage) => {
                            const messageContextDocs: ContextDoc[] = currentMessage.contextDocs ?? [];
                            let showedSourcesSet = new Set<string>();
                            const showedDataList = [];
                            for (const item of messageContextDocs) {
                                const metadata = item.metadata;
                                if (!metadata || !metadata.source_type) continue;

                                const showedData = {} as any;
                                const sourceType = metadata.source_type;
                                if (sourceType === ("upload_files" || "plain_text" || "speech_recognize_transcript") && metadata.source) {
                                    // 从完整的路径中截取文件名
                                    const fileName = metadata.source.split("/").pop();
                                    if (showedSourcesSet.has(fileName ?? "")) continue;
                                    if (fileName) showedSourcesSet.add(fileName ?? "");
                                    showedData['title'] = (<p key={"title-" + fileName}><span
                                        style={{fontWeight: "bolder"}}>{Locale.Chat.SourceText}</span>{Locale.Chat.SourceFromLocalVS}
                                    </p>);
                                    showedData['description'] = (
                                        <span key={"description-" + fileName} className={styles["source-description"]}>{fileName}</span>);
                                } else if (sourceType === "web_search" && metadata.url) {
                                    if (showedSourcesSet.has(metadata.url ?? "")) continue;
                                    if (metadata.url) showedSourcesSet.add(metadata.url ?? "");
                                    showedData['title'] = (<p key={"title-" + metadata.url}><span
                                        style={{fontWeight: "bolder"}}>{Locale.Chat.SourceText}</span>{Locale.Chat.SourceFromWebSearch}
                                    </p>);
                                    showedData['description'] = (<Button
                                        key={"description-" + metadata.url}
                                        className={styles["source-description"]}
                                                                         type={"link"}
                                                                         onClick={() => {
                                                                             window.open(metadata.url, "_blank");
                                                                         }}>{metadata.url}</Button>);
                                }
                                showedDataList.push(showedData);
                            }
                            setShowedDataList(showedDataList);
                            setOpenSourceDrawer(true);
                        }

                        return (
                            <Fragment key={"fragment-"+i}>
                                <div
                                    className={
                                        isUser ? styles["chat-message-user"] : styles["chat-message"]
                                    }
                                >
                                    <div className={styles["chat-message-container"]}>
                                        <div className={styles["chat-message-header"]}>
                                            <div className={styles["chat-message-avatar"]}>
                                                {isUser ? (
                                                    <UserAvatar avatar={authStore.user?.user.avatar}/>
                                                ) : (
                                                    <AssistantAvatar avatar={DEFAULT_MASK_AVATAR} spin={showTyping}/>
                                                )}
                                            </div>

                                            {showActions && (
                                                <div className={styles["chat-message-actions"]}>
                                                    <div className={styles["chat-input-actions"]}>
                                                        {message.streaming ? (
                                                            <ChatAction
                                                                text={Locale.Chat.Actions.Stop}
                                                                icon={<StopIcon/>}
                                                                onClick={() => onUserStop(message.id ?? i)}
                                                            />
                                                        ) : (
                                                            <>
                                                                <ChatAction
                                                                    text={Locale.Chat.Actions.Retry}
                                                                    icon={<ResetIcon/>}
                                                                    onClick={() => onResend(message)}
                                                                />

                                                                <ChatAction
                                                                    text={Locale.Chat.Actions.Delete}
                                                                    icon={<DeleteIcon/>}
                                                                    onClick={() => onDelete(message.id ?? i)}
                                                                />
                                                                {/*<ChatAction*/}
                                                                {/*    text={Locale.Chat.Actions.Pin}*/}
                                                                {/*    icon={<PinIcon/>}*/}
                                                                {/*    onClick={() => onPinMessage(message)}*/}
                                                                {/*/>*/}
                                                                <ChatAction
                                                                    text={Locale.Chat.Actions.Copy}
                                                                    icon={<CopyIcon/>}
                                                                    onClick={() => copyToClipboard(message.content)}
                                                                />
                                                                <ChatAction
                                                                    text={Locale.Chat.Actions.Edit}
                                                                    icon={<EditIcon/>}
                                                                    onClick={async () => {
                                                                        const newMessage = await showPrompt(
                                                                            Locale.Chat.Actions.Edit,
                                                                            message.content,
                                                                            10,
                                                                        );
                                                                        chatStore.updateCurrentSession((session) => {
                                                                            const m = session.mask.context
                                                                                .concat(session.messages)
                                                                                .find((m) => m.id === message.id);
                                                                            if (m) {
                                                                                m.content = newMessage;
                                                                            }
                                                                        });
                                                                    }}
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            {isAssistant && message.usedPlugins && message.usedPlugins.length > 0 && (
                                                <div className={styles["chat-message-search-keywords-container"]}>
                                                    {Locale.Chat.UsedPlugins}
                                                    <span className={styles["chat-message-search-keywords"]}>
                                                    {message.usedPlugins.map(value => value.nameAlias).join(", ")}
                                                </span>
                                                </div>
                                            )}
                                            {isAssistant && !isContext && !message.isError && message.searchKeywords && (
                                                <div className={styles["chat-message-search-keywords-container"]}>
                                                    {Locale.Chat.SearchKeywords}
                                                    <span
                                                        className={styles["chat-message-search-keywords"]}>{message.searchKeywords}</span>
                                                </div>
                                            )}
                                        </div>
                                        {showTyping && (
                                            <div className={styles["chat-message-status"]}>
                                                {Locale.Chat.Typing}
                                            </div>
                                        )}
                                        <div className={styles["chat-message-item"]}>
                                            <Markdown
                                                content={message.content}
                                                loading={
                                                    (message.preview || message.streaming) &&
                                                    message.content.length === 0 &&
                                                    !isUser
                                                }
                                                onContextMenu={(e) => onRightClick(e, message)}
                                                onDoubleClickCapture={() => {
                                                    if (!isMobileScreen) return;
                                                    setUserInput(message.content);
                                                }}
                                                fontSize={fontSize}
                                                parentRef={scrollRef}
                                                defaultShow={i >= messages.length - 6}
                                            />
                                        </div>
                                        {assistantAnswerHasSource() && (
                                            <a className={styles["chat-message-action-sources"]}
                                               onClick={() => handleOnCheckSource(messages[i])}>
                                                {Locale.Chat.SourceDetail}
                                            </a>
                                        )}
                                        {isContext && (
                                            <div className={styles["chat-message-action-date"]}>
                                                {Locale.Chat.IsContext}
                                            </div>
                                        )}
                                        {(isUser || (isAssistant && !showTyping)) && (
                                            <div className={styles["chat-message-action-date"]}>
                                                {message.date.toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <Drawer
                                    placement={"bottom"}
                                    closable={false}
                                    onClose={onSourceDrawerClose}
                                    open={openSourceDrawer}
                                    key={"chat-source-detail-drawer"}
                                >
                                    <List
                                        itemLayout={"horizontal"}
                                        dataSource={showedDataList}
                                        renderItem={(item, index) => (
                                            <List.Item>
                                                <List.Item.Meta
                                                    title={item.title}
                                                    description={item.description}
                                                />
                                            </List.Item>
                                        )}
                                    />
                                </Drawer>
                                {
                                    shouldShowClearContextDivider && <ClearContextDivider/>
                                }
                            </Fragment>
                        );
                    })}
                </div>

                <div className={styles["chat-input-panel"]}>
                    <PromptHints prompts={promptHints} onPromptSelect={onPromptSelect}/>

                    <div className={styles["chat-input-panel-inner"]}>
                    <textarea
                        ref={inputRef}
                        className={styles["chat-input"]}
                        placeholder={Locale.Chat.Input(submitKey)}
                        onInput={(e) => onInput(e.currentTarget.value)}
                        value={userInput}
                        onKeyDown={onInputKeyDown}
                        onFocus={scrollToBottom}
                        onClick={scrollToBottom}
                        rows={inputRows}
                        autoFocus={autoFocus}
                        style={{
                            fontSize: config.fontSize,
                        }}
                    />
                        <div className={styles["chat-bottom-container"]}>
                            <div className={styles["chat-bottom-actions"]}>
                                <ChatActions
                                    showPromptModal={() => setShowPromptModal(true)}
                                    scrollToBottom={scrollToBottom}
                                    hitBottom={hitBottom}
                                    showPromptHints={() => {
                                        // Click again to close
                                        if (promptHints.length > 0) {
                                            setPromptHints([]);
                                            return;
                                        }

                                        inputRef.current?.focus();
                                        setUserInput("/");
                                        onSearch("");
                                    }}
                                />
                            </div>
                            <div className={styles["bottom-controls"]}>
                                <Button
                                    className={styles["bottom-controls-btn"]}
                                    type="text"
                                    icon={<SendOutlined/>}
                                    onClick={() => doSubmit(userInput)}
                                />
                                <div
                                    className={styles["bottom-controls-letter-count"]}
                                >
                                    <span>{formattedContent.length}</span>
                                    /{letterLimit}
                                </div>
                                {/*<IconButton*/}
                                {/*    icon={<SendWhiteIcon/>}*/}
                                {/*    text={Locale.Chat.Send}*/}
                                {/*    className={styles["chat-input-send"]}*/}
                                {/*    type="primary"*/}
                                {/*    onClick={() => doSubmit(userInput)}*/}
                                {/*/>*/}
                            </div>
                        </div>
                    </div>
                </div>

                {/*{showExport && (*/}
                {/*    <ExportMessageModal onClose={() => setShowExport(false)}/>*/}
                {/*)}*/}

                {isEditingMessage && (
                    <EditMessageModal
                        onClose={() => {
                            setIsEditingMessage(false);
                        }}
                    />
                )}
            </div>
            <Modal
                title={Locale.ShownAlertMsg.Alert}
                open={showNotHaveEnoughMoneyAlert}
                okText={Locale.GoToCharge}
                onOk={goToRecharge}
                cancelText={Locale.Common.Cancel}
                onCancel={closeChargeModal}
            >
                <p>{Locale.ShownAlertMsg.NotEnoughMoneyAlertMsg}</p>
            </Modal>
        </>
    );
}

export function Chat() {
    const chatStore = useChatStore();
    const sessionIndex = chatStore.currentSessionIndex;
    return <_Chat key={sessionIndex}></_Chat>;
}
