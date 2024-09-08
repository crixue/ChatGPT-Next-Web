import {MakeLocalVectorStoreApi} from "@/app/client/make-localvs";
import {
    ChatSession,
    ChatStore,
    Mask,
    ModelType,
    useAccessStore,
    useAppConfig,
    useChatStore,
    useMaskStore
} from "@/app/store";
import React, {useEffect, useRef, useState} from "react";
import {Button, List, Modal, notification, Progress, Upload, UploadProps} from "antd";
import {RcFile} from "antd/es/upload";
import {isAVFileType} from "@/app/utils/common-util";
import Locale from "@/app/locales";
import {CustomUploadFile, MakeLocalVSRequestVO} from "@/app/types/make-localvs-vo";
import styles from "@/app/components/chat.module.scss";
import {getBaseApiHeaders} from "@/app/client/api";
import {useNavigate} from "react-router-dom";
import {Path, SubmitKey, Theme} from "@/app/constant";
import {ChatControllerPool} from "@/app/client/controller";
import StopIcon from "@/app/icons/pause.svg";
import BottomIcon from "@/app/icons/bottom.svg";
import SettingsIcon from "@/app/icons/chat-settings.svg";
import BreakIcon from "@/app/icons/break.svg";
import AttachmentIcon from "@/app/icons/attachment.svg";
import {CustomListItem, CustomModal, Selector, showToast} from "@/app/components/ui-lib";
import {validateMask} from "@/app/utils/mask";
import {RocketOutlined} from "@ant-design/icons";
import {ContextPrompts, MaskConfig} from "@/app/components/mask";
import {Prompt} from "@/app/store/prompt";
import {IconButton} from "@/app/components/button";
import CancelIcon from "@/app/icons/cancel.svg";
import ConfirmIcon from "@/app/icons/confirm.svg";
import {UpgradePlanComponent} from "@/app/components/upgrade-plan";
import {useUpgradePlanStore} from "@/app/store/upgrade-plan";
import {checkIfIsSupportedUploadFileType} from "@/app/components/upload-utils";
import {SseClient} from "@/app/client/sse";
import {UploadChangeParam} from "antd/es/upload/interface";
import dayjs from "dayjs";


const makeLocalVectorStoreApi = new MakeLocalVectorStoreApi();

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
                        key={"apply-mask"}
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

export function PromptToast(props: {
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

export function useSubmitHandler() {
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

export function ClearContextDivider() {
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


export function useScrollToBottom() {
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
            <UploadChatAction
                text={Locale.Chat.InputActions.UploadFile}
                icon={<AttachmentIcon/>}
                chatStore={chatStore}
            />

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

export function ChatAction(props: {
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

const sseClient = new SseClient();

export function UploadChatAction(props: {
    text: string;
    icon: JSX.Element;
    chatStore: ChatStore;
}) {
    const iconRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState({
        full: 16,
        icon: 16,
    });
    const [notify, contextHolder] = notification.useNotification();
    const upgradePlanStore = useUpgradePlanStore();
    const chatStore = props.chatStore;
    const currentSession: ChatSession = chatStore.currentSession();
    const singleLocalVectorStoreItem = currentSession.singleLocalVectorStore;
    console.log("singleLocalVectorStoreItem:", singleLocalVectorStoreItem);
    const [fileList, setFileList] =
        useState<CustomUploadFile[]>(singleLocalVectorStoreItem?.attachment ? [singleLocalVectorStoreItem?.attachment] : []);
    const [showLoading, setShowLoading] = useState<boolean>(false);
    const [singleMakeLocalVSProgress, setSingleMakeLocalVSProgress] =
        useState<number>(singleLocalVectorStoreItem?.progress ?? 0);
    // console.log("singleMakeLocalVSProgress:", singleMakeLocalVSProgress + ",now:", dayjs().format("YYYY-MM-DD HH:mm:ss"));

    const handleUpload: UploadProps['customRequest'] = async (option) => {
        const file = option.file as RcFile;
        const uid = (fileList.length + 1).toString();

        let uploadItem = {
            uid: uid,
            name: file.name,
            fileName: file.name,
            status: 'uploading',
            originFileObj: file,
        } as CustomUploadFile;
        const fileSizeInBytes = file.size;
        const isAvFile = isAVFileType(file.type);
        try {
            const preCheckVectorestoreLimitResponseVO = await makeLocalVectorStoreApi
                .preCheckUserIfExceedVectorstoreLimitSize({
                    fileSizeInBytes,
                    fileType: isAvFile ? 'AUDIO_OR_VIDEO' : 'DEFAULT',
                });

            if (preCheckVectorestoreLimitResponseVO.haveExceededLimit) {
                setFileList([]);
                upgradePlanStore.setUpgradeProducts(preCheckVectorestoreLimitResponseVO.upgradeProducts);
                upgradePlanStore.setUpgradeModelVisible(true);
                // 移除所有上传文件
                // @ts-ignore
                option.onError(Locale.MakeLocalVSStore.Upload.UploadFileFailed, file);
                return;
            } else {
                upgradePlanStore.setUpgradeProducts([]);
                upgradePlanStore.setUpgradeModelVisible(false);
            }
        } catch (e) {
            console.error('preCheckUserIfExceedVectorstoreLimitSize:', e);
        } finally {
            setShowLoading(false);
        }
        setSingleMakeLocalVSProgress(20);
        makeLocalVectorStoreApi.singleFileUploadAndMakeLocalVectorStore({
            chatSessionId: currentSession.id,
            isChineseText: currentSession.mask.isChineseText ?? true,
            file,
        }).then((taskId) => {
            // @ts-ignore
            option.onSuccess(taskId, uploadItem);
            setSingleMakeLocalVSProgress(50);
            uploadItem = {...uploadItem, 'status': 'done', taskId, 'percent': 100};
            chatStore.updateCurrentSession((session) => {
                session.singleLocalVectorStore = {
                    attachment: uploadItem,
                    taskId,
                    progress: 50,
                }
            });
            setFileList([uploadItem]);
            sseClient.makeLocalVSProgress(taskId, {
                onUpdate: (process: number) => {
                    setSingleMakeLocalVSProgress(process);
                    chatStore.updateCurrentSession((session) => {
                        session.singleLocalVectorStore = {
                            attachment: uploadItem,
                            taskId,
                            progress: process,
                        }
                    });
                },
                onDone: (taskId: string, process?: number) => {
                    setSingleMakeLocalVSProgress(process!);
                    chatStore.updateCurrentSession((session) => {
                        session.singleLocalVectorStore = {
                            attachment: uploadItem,
                            taskId,
                            progress: process!,
                        }
                    });
                }
            });
        }).catch((error) => {
            // @ts-ignore
            option.onError(Locale.MakeLocalVSStore.Upload.UploadFileFailed, file);
            notify['error']({
                message: `${file.name} ${Locale.MakeLocalVSStore.Upload.UploadFileFailed}`,
            });
        }).finally(() => {
        });
    }

    const updateWidth = () => {
        if (!iconRef.current || !textRef.current) return;
        const getWidth = (dom: HTMLDivElement) => dom.getBoundingClientRect().width;
        const textWidth = getWidth(textRef.current);
        const iconWidth = getWidth(iconRef.current);
        setWidth({
            full: textWidth + iconWidth,
            icon: iconWidth,
        });
    }

    const handleOnChange = (info: UploadChangeParam) => {
        if (info.file.status === 'error') {
            // console.log(`${info.file.name} file upload failed.`);
        } else if (info.file.status === 'removed') {
            sseClient.closeEvent();
            setFileList([]);
            setSingleMakeLocalVSProgress(0);
            chatStore.updateCurrentSession((session) => {
                const taskId = session.singleLocalVectorStore?.taskId;
                if(taskId)
                    makeLocalVectorStoreApi.deleteSingleFileAndIndex({makeLocalVsTaskId: taskId});
                session.singleLocalVectorStore = undefined;
            });
        }
    }

    const beforeUpload = (file: RcFile) => {
        const ifIsSupportedUploadFileType = checkIfIsSupportedUploadFileType(file);
        if (!ifIsSupportedUploadFileType) {
            const fileExt = file.name.split('.').pop();
            notify.error({
                message: <div>
                    <p>
                        暂不支持 .{fileExt} 的文件类型文件的上传
                    </p>
                    <p>
                        请 <a
                        type={"link"}
                        target={"_blank"}
                        href={"https://docs.openai.com/zh-cn/docs/using-the-api/accepted-file-types"}  /*TODO 真实文档的地址*/
                    >点击查看</a> 支持的文件类型
                    </p>
                </div>,
                duration: 5,
            });
        }
        return ifIsSupportedUploadFileType || Upload.LIST_IGNORE;
    }

    const showProgressName = (progress: number) => {
        if(progress >= 0 && progress < 50) {
            return '文件上传中';
        } else if(progress >= 50 && progress < 100) {
            return '知识库构建中';
        } else if(progress < 0) {
            return '制作失败，请稍后重试！';
        } else {
            return '构建完成';
        }
    }

    return (
        <div className={styles["upload-chat-container"]}>
            {contextHolder}
            <UpgradePlanComponent/>
            <Upload
                className={styles["upload-chat-action"]}
                style={{display: "flex", flexDirection: "row", alignItems: "center"}}
                defaultFileList={fileList}
                headers={{...getBaseApiHeaders(),}}
                onChange={handleOnChange}
                customRequest={handleUpload}
                maxCount={1}
                beforeUpload={beforeUpload}
            >
                <div
                    className={`${styles["chat-input-action"]} clickable`}
                    onMouseEnter={updateWidth}
                    onTouchStart={updateWidth}
                    style={
                        {
                            "--icon-width": `${width.icon}px`,
                            "--full-width": `${width.full}px`,
                        } as React.CSSProperties
                    }
                >
                    <div
                        style={{display: "flex", flexDirection: "row", alignItems: "center"}}
                    >
                        <div ref={iconRef} className={styles["icon"]}>
                            {props.icon}
                        </div>
                        <div className={styles["text"]} ref={textRef}>
                            {props.text}
                        </div>
                    </div>
                </div>
                {fileList && fileList.length > 0 && (
                    <div className={`${styles["single-local-vs-progress"]}`}>
                        <Progress
                            type="circle"
                            percent={Math.abs(singleMakeLocalVSProgress)}
                            status={singleMakeLocalVSProgress < 0 ? "exception" : undefined}
                            strokeWidth={20}
                            size={16}
                            format={(number) => `${Math.abs(singleMakeLocalVSProgress)}%`}
                        />
                        <span style={{marginLeft: "8px"}}>{showProgressName(singleMakeLocalVSProgress)}</span>
                    </div>
                )}
            </Upload>
        </div>
    );
}