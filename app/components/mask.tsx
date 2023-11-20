import {IconButton} from "./button";
import {ErrorBoundary} from "./error";

import styles from "./mask.module.scss";

import DownloadIcon from "../icons/download.svg";
import UploadIcon from "../icons/upload.svg";
import EditIcon from "../icons/edit.svg";
import AddIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
import DeleteIcon from "../icons/delete.svg";
import EyeIcon from "../icons/eye.svg";
import CopyIcon from "../icons/copy.svg";
import DragIcon from "../icons/drag.svg";

import {DEFAULT_MASK_AVATAR, Mask, useMaskStore} from "../store/mask";
import {
    ChatMessage,
    createMessage,
    ModelConfig,
    useAppConfig,
    useChatStore,
} from "../store";
import {api, MemoryTypeName, ROLES} from "../client/api";
import {
    List,
    ListItem,
    Popover,
    CustomSelect,
    showConfirm,
} from "./ui-lib";
import {Avatar, AvatarPicker} from "./emoji";
import Locale, {AllLangs, ALL_LANG_OPTIONS, Lang} from "../locales";
import {useNavigate} from "react-router-dom";

import chatStyle from "./chat.module.scss";
import {useEffect, useState} from "react";
import {copyToClipboard, downloadAs, readFromFile} from "../utils";
import {Updater} from "../typing";
import {ConversationMemoryConfigList, ModelConfigList} from "./model-config";
import {FileName, Path} from "../constant";
import {BUILTIN_MASK_STORE} from "../masks";
import {
    OnDragEndResponder,
} from "@hello-pangea/dnd";
import {Button, Input, Modal, notification, Radio, Switch} from "antd";
import {CheckOutlined, CloseOutlined} from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import {
    MaskCreationRequestVO,
    MaskItemResponseVO,
    PromptInfoDict,
    SerializeInfo,
    SerializePromptRequestVO
} from "@/app/trypes/mask-vo";
import {maskApi} from "@/app/client/mask/mask-api";
import {useInitMasks} from "@/app/components/home";
import {StartupMaskRequestVO} from "@/app/trypes/model-vo";
import {useGlobalSettingStore} from "@/app/store/global-setting";

// drag and drop helper function
function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
    const result = [...list];
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
}

export function MaskAvatar(props: { mask: Mask }) {
    return props.mask.avatar !== DEFAULT_MASK_AVATAR ? (
        <Avatar avatar={props.mask.avatar}/>
    ) : (
        <Avatar model={props.mask.modelConfig.model}/>
    );
}

export function MaskConfig(props: {
    mask: Mask;
    updateMask: Updater<Mask>;
    extraListItems?: JSX.Element;
    readonly?: boolean;
    shouldSyncFromGlobal?: boolean;
}) {
    const [showPicker, setShowPicker] = useState(false);

    const updateConfig = (updater: (config: ModelConfig) => void) => {
        const config = {...props.mask.modelConfig};
        console.log("update model config", config)
        updater(config);
        props.updateMask((mask) => {
            mask.modelConfig = config;
            // if user changed current session mask, it will disable auto sync
            mask.syncGlobalConfig = false;
        });
        console.log("modelConfig:" + JSON.stringify(props.mask.modelConfig));
    };

    const copyMaskLink = () => {
        const maskLink = `${location.protocol}//${location.host}/#${Path.NewChat}?mask=${props.mask.id}`;
        copyToClipboard(maskLink);
    };

    const globalConfig = useAppConfig();
    // console.log("Current mask:" + JSON.stringify(props.mask));
    return (
        <>
            <ContextPrompts
                context={props.mask.context}
                updateContext={(updater) => {
                    const context = props.mask.context.slice();
                    updater(context);
                    props.updateMask((mask) => (mask.context = context));
                }}
            />

            <List>
                <ListItem title={Locale.Mask.Config.Avatar}>
                    <Popover
                        content={
                            <AvatarPicker
                                onEmojiClick={(emoji) => {
                                    props.updateMask((mask) => (mask.avatar = emoji));
                                    setShowPicker(false);
                                }}
                            ></AvatarPicker>
                        }
                        open={showPicker}
                        onClose={() => setShowPicker(false)}
                    >
                        <div
                            onClick={() => setShowPicker(true)}
                            style={{cursor: "pointer"}}
                        >
                            <MaskAvatar mask={props.mask}/>
                        </div>
                    </Popover>
                </ListItem>
                <ListItem title={Locale.Mask.Config.Name}>
                    <Input
                        type={"text"}
                        defaultValue={props.mask.name}
                        onChange={(e) => {
                            props.updateMask((mask) => {
                                mask.name = e.currentTarget.value
                            });
                        }}/>
                </ListItem>
                <ListItem
                    title={Locale.Mask.Config.HideContext.Title}
                    subTitle={Locale.Mask.Config.HideContext.SubTitle}
                >
                    <Switch
                        checkedChildren={<CheckOutlined/>}
                        unCheckedChildren={<CloseOutlined/>}
                        defaultChecked={props.mask.hideContext}
                        onChange={(checked) => {
                            props.updateMask((mask) => {
                                mask.hideContext = checked;
                            });
                        }}/>
                </ListItem>
                <ListItem
                    title={Locale.Mask.Config.HaveContext.Title}
                    subTitle={Locale.Mask.Config.HaveContext.SubTitle}
                >
                    <Switch
                        checkedChildren={<CheckOutlined/>}
                        unCheckedChildren={<CloseOutlined/>}
                        defaultChecked={props.mask.haveContext}
                        onChange={(checked) => {
                            props.updateMask((mask) => {
                                mask.haveContext = checked;
                            });
                        }}/>
                </ListItem>
                <ListItem
                    title={Locale.Mask.Config.IsChineseText.Title}
                    subTitle={Locale.Mask.Config.IsChineseText.SubTitle}
                >
                    <Switch
                        checkedChildren={<CheckOutlined/>}
                        unCheckedChildren={<CloseOutlined/>}
                        defaultChecked={props.mask.isChineseText}
                        onChange={(checked) => {
                            props.updateMask((mask) => {
                                mask.isChineseText = checked;
                            });
                        }}/>
                </ListItem>
                <ListItem
                    title={Locale.Mask.Config.PromptId.Title}
                >
                    <Input
                        type={"text"}
                        defaultValue={props.mask.promptId ?? "无"}
                        disabled={true}
                    />
                </ListItem>
                {!props.shouldSyncFromGlobal ? (
                    <ListItem
                        title={Locale.Mask.Config.Share.Title}
                        subTitle={Locale.Mask.Config.Share.SubTitle}
                    >
                        <IconButton
                            icon={<CopyIcon/>}
                            text={Locale.Mask.Config.Share.Action}
                            onClick={copyMaskLink}
                        />
                    </ListItem>
                ) : null}

                {props.shouldSyncFromGlobal ? (
                    <ListItem
                        title={Locale.Mask.Config.Sync.Title}
                        subTitle={Locale.Mask.Config.Sync.SubTitle}
                    >
                        <Switch
                            checkedChildren={<CheckOutlined/>}
                            unCheckedChildren={<CloseOutlined/>}
                            defaultChecked={props.mask.syncGlobalConfig}
                            onChange={async (checked) => {
                                if (
                                    checked &&
                                    (await showConfirm(Locale.Mask.Config.Sync.Confirm))
                                ) {
                                    props.updateMask((mask) => {
                                        mask.syncGlobalConfig = checked;
                                        mask.modelConfig = {...globalConfig.modelConfig};
                                    });
                                } else if (!checked) {
                                    props.updateMask((mask) => {
                                        mask.syncGlobalConfig = checked;
                                    });
                                }
                            }}/>
                    </ListItem>
                ) : null}
            </List>

            <List>
                <ConversationMemoryConfigList
                    modelConfig={{...props.mask.modelConfig}}
                    updateConfig={updateConfig}
                />
                {props.extraListItems}
            </List>
        </>
    );
}

function ContextPromptItem(props: {
    index: number;
    prompt: ChatMessage;
    update: (prompt: ChatMessage) => void;
    remove: () => void;
}) {
    const [promptContent, setPromptContent] = useState(props.prompt.content);

    return (
        <div className={chatStyle["context-prompt-row"]}>
            <TextArea
                value={promptContent}
                autoSize={true}
                allowClear={true}
                onChange={(e) => {
                    const content = e.target.value as any;  //TODO update mask 未更新
                    setPromptContent(content);
                    props.update({
                        ...props.prompt,
                        content: content,
                    })
                }
                }
            />
        </div>
    );
}

export function ContextPrompts(props: {
    context: ChatMessage[];
    updateContext: (updater: (context: ChatMessage[]) => void) => void;
}) {
    const context = props.context;

    const addContextPrompt = (prompt: ChatMessage, i: number) => {
        props.updateContext((context) => context.splice(i, 0, prompt));
    };

    const removeContextPrompt = (i: number) => {
        props.updateContext((context) => context.splice(i, 1));
    };

    const updateContextPrompt = (i: number, prompt: ChatMessage) => {
        props.updateContext((context) => (context[i] = prompt));
    };

    const onDragEnd: OnDragEndResponder = (result) => {
        if (!result.destination) {
            return;
        }
        const newContext = reorder(
            context,
            result.source.index,
            result.destination.index,
        );
        props.updateContext((context) => {
            context.splice(0, context.length, ...newContext);
        });
    };

    return (
        <>
            <div className={chatStyle["context-prompt"]} style={{marginBottom: 20}}>
                {context.map((c, i) => (
                    <ContextPromptItem
                        key={i}
                        index={i}
                        prompt={c}
                        update={(prompt) => updateContextPrompt(i, prompt)}
                        remove={() => removeContextPrompt(i)}
                    />
                ))}
            </div>
        </>
    );
}

export function MaskPage() {
    useInitMasks();

    const navigate = useNavigate();

    const maskStore = useMaskStore();
    const chatStore = useChatStore();
    const globalSettingStore = useGlobalSettingStore();

    const session = chatStore.currentSession();

    const [filterLang, setFilterLang] = useState<Lang>();
    const allMasks = maskStore
        .getAll()
        .filter((m) => !filterLang || m.lang === filterLang);

    const [searchMasks, setSearchMasks] = useState<Mask[]>([]);
    const [searchText, setSearchText] = useState("");
    const masks = searchText.length > 0 ? searchMasks : allMasks;
    const [notify, contextHolder] = notification.useNotification();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMaskId, setEditingMaskId] = useState<string | undefined>();

    // simple search, will refactor later
    const onSearch = (text: string) => {
        setSearchText(text);
        if (text.length > 0) {
            const result = allMasks.filter((m) => m.name.includes(text));
            setSearchMasks(result);
        } else {
            setSearchMasks(allMasks);
        }
    };

    const editingMask =
        maskStore.get(editingMaskId) ?? BUILTIN_MASK_STORE.get(editingMaskId);

    const openMaskModal = (maskId: string) => {
        setIsModalOpen(true);
        setEditingMaskId(maskId);
    }
    const closeMaskModal = () => {
        setIsModalOpen(false);
        setEditingMaskId(undefined);
    };

    const deleteMask = (id: string) => {
        maskApi.deleteMask(id).then((res) => {
            maskStore.delete(id);
            closeMaskModal();
            notify['success']({
                message: '删除成功',
            });
        });
    }

    const assembleSaveOrUpdateMaskRequest = (mask: Mask) => {
        const context = mask.context[0];
        // console.log("context:"+context.content);
        const serializePromptRequestVO = {
            title: mask.name + "-prompt",
            prompt_folder_name: "default",  //TODO prompt_folder_name暂时写死
            serialize_info: {
                prompt_type: "default_prompt",  //TODO prompt_folder_name暂时写死
                have_context: mask.haveContext,
                prompt_info_dict: {
                    template: context.content,
                } as PromptInfoDict,
            } as SerializeInfo,
        } as SerializePromptRequestVO;
        mask.modelConfig = {
            ...mask.modelConfig,
            haveContext: mask.haveContext ?? true,
            memoryType: mask.modelConfig.memoryType ?? {
                name: "ConversationBufferWindowMemory" as MemoryTypeName,
                available: true
            },
        }
        // console.log(JSON.stringify(mask.modelConfig));
        mask = {...mask, modelConfigJsonStr: JSON.stringify(mask.modelConfig)}
        const maskCreationRequestVO = {
            mask,
            serializePromptRequest: serializePromptRequestVO,
            requiredPermIds: [632, 633]  //TODO 暂时写死
        } as MaskCreationRequestVO;
        // console.log(JSON.stringify(maskCreationRequestVO));
        return maskCreationRequestVO;
    }

    const saveMask = (mask: Mask) => {
        const maskCreationRequestVO = assembleSaveOrUpdateMaskRequest(mask);
        maskApi.createMask(maskCreationRequestVO)
            .then((res: MaskItemResponseVO) => {
                const updatedMask = res.mask;
                maskStore.update(mask.id, (mask) => {
                    mask = {...mask, ...updatedMask};
                });
                notify['success']({
                    message: '保存成功',
                });
            })
            .catch((err: Error) => {
                console.log(err);
                notify['error']({
                    message: '保存失败',
                });
            });
    }

    const updateMask = (mask: Mask) => {
        const maskUpdateRequestVO = assembleSaveOrUpdateMaskRequest(mask);
        maskApi.updateMask(maskUpdateRequestVO)
            .then((res: void) => {
                notify['success']({
                    message: '更新成功',
                });
            });
    }

    const handleOnApplyMask = (mask: Mask) => {
        // create or update mask setting
        const maskModelConfig = mask.modelConfig;
        globalSettingStore.switchShowGlobalLoading();
        // before start to chat, we should startup the model
        api.llm.startUpMask({
                memory_type: maskModelConfig.memoryType.name,
                is_chinese_text: mask?.isChineseText ?? true,
                prompt_path: mask?.promptPath ?? "",
                have_context: mask?.haveContext ?? false,
                prompt_serialized_type: "default"
            } as StartupMaskRequestVO)
        .then(() => {
            navigate(Path.Chat);
            chatStore.newSession(mask);
            setTimeout(() => {
                maskStore.create(mask);
            }, 500);
        }).finally(() => {
            globalSettingStore.switchShowGlobalLoading();
        });
    }

    const downloadAll = () => {
        downloadAs(JSON.stringify(masks), FileName.Masks);
    };

    const importFromFile = () => {
        readFromFile().then((content) => {
            try {
                const importMasks = JSON.parse(content);
                if (Array.isArray(importMasks)) {
                    for (const mask of importMasks) {
                        if (mask.name) {
                            maskStore.create(mask);
                        }
                    }
                    return;
                }
                //if the content is a single mask.
                if (importMasks.name) {
                    maskStore.create(importMasks);
                }
            } catch {
            }
        });
    };

    return (
        <ErrorBoundary>
            {contextHolder}
            <div className={styles["mask-page"]}>
                <div className="window-header">
                    <div className="window-header-title">
                        <div className="window-header-main-title">
                            {Locale.Mask.Page.Title}
                        </div>
                        <div className="window-header-submai-title">
                            {Locale.Mask.Page.SubTitle(allMasks.length)}
                        </div>
                    </div>

                    <div className="window-actions">
                        <div className="window-action-button">
                            <IconButton
                                icon={<DownloadIcon/>}
                                bordered
                                onClick={downloadAll}
                            />
                        </div>
                        <div className="window-action-button">
                            <IconButton
                                icon={<UploadIcon/>}
                                bordered
                                onClick={() => importFromFile()}
                            />
                        </div>
                        <div className="window-action-button">
                            <IconButton
                                icon={<CloseIcon/>}
                                bordered
                                onClick={() => navigate(-1)}
                            />
                        </div>
                    </div>
                </div>

                <div className={styles["mask-page-body"]}>
                    <div className={styles["mask-filter"]}>
                        <input
                            type="text"
                            className={styles["search-bar"]}
                            placeholder={Locale.Mask.Page.Search}
                            autoFocus
                            onInput={(e) => onSearch(e.currentTarget.value)}
                        />
                        <CustomSelect
                            className={styles["mask-filter-lang"]}
                            value={filterLang ?? Locale.Settings.Lang.All}
                            onChange={(e) => {
                                const value = e.currentTarget.value;
                                if (value === Locale.Settings.Lang.All) {
                                    setFilterLang(undefined);
                                } else {
                                    setFilterLang(value as Lang);
                                }
                            }}
                        >
                            <option key="all" value={Locale.Settings.Lang.All}>
                                {Locale.Settings.Lang.All}
                            </option>
                            {AllLangs.map((lang) => (
                                <option value={lang} key={lang}>
                                    {ALL_LANG_OPTIONS[lang]}
                                </option>
                            ))}
                        </CustomSelect>

                        <IconButton
                            className={styles["mask-create"]}
                            icon={<AddIcon/>}
                            text={Locale.Mask.Page.Create}
                            bordered
                            onClick={() => {
                                const createdMask = maskStore.create();
                                setEditingMaskId(createdMask.id);
                            }}
                        />
                    </div>

                    <div>
                        {masks.map((m) => (
                            <div className={styles["mask-item"]} key={m.id}>
                                <div className={styles["mask-header"]}>
                                    <div className={styles["mask-icon"]}>
                                        <MaskAvatar mask={m}/>
                                    </div>
                                    <div className={styles["mask-title"]}>
                                        <div className={styles["mask-name"]}>{m.name}</div>
                                        {/*<div className={styles["mask-info"] + " one-line"}>*/}
                                        {/*    {`${Locale.Mask.Item.Info(m.context.length)} / ${*/}
                                        {/*        ALL_LANG_OPTIONS[m.lang]*/}
                                        {/*    } / ${m.modelConfig.model}`}*/}
                                        {/*</div>*/}
                                    </div>
                                </div>
                                <div className={styles["mask-actions"]}>
                                    <IconButton
                                        icon={<AddIcon/>}
                                        text={Locale.Mask.Item.Chat}
                                        onClick={() => {
                                            chatStore.newSession(m);
                                            navigate(Path.Chat);
                                        }}
                                    />
                                    {m.builtin ? (
                                        <IconButton
                                            icon={<EyeIcon/>}
                                            text={Locale.Mask.Item.View}
                                            onClick={() => openMaskModal(m.id)}
                                        />
                                    ) : (
                                        <IconButton
                                            icon={<EditIcon/>}
                                            text={Locale.Mask.Item.Edit}
                                            onClick={() => openMaskModal(m.id)}
                                        />
                                    )}
                                    {/*{!m.builtin && (*/}
                                    {/*    <IconButton*/}
                                    {/*        icon={<DeleteIcon/>}*/}
                                    {/*        text={Locale.Mask.Item.Delete}*/}
                                    {/*        onClick={async () => {*/}
                                    {/*            if (await showConfirm(Locale.Mask.Item.DeleteConfirm)) {*/}
                                    {/*                maskStore.delete(m.id);*/}
                                    {/*            }*/}
                                    {/*        }}*/}
                                    {/*    />*/}
                                    {/*)}*/}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {editingMask && (
                <Modal
                    open={isModalOpen}
                    title={Locale.Mask.EditModal.Title(editingMask?.builtin)}
                    onCancel={closeMaskModal}
                    width={"75vw"}
                    footer={[
                        <Button
                            icon={<DownloadIcon/>}
                            key="updateMask"
                            onClick={() => {
                                updateMask(editingMask)
                            }}
                        >保存面具</Button>,
                        <Button
                            icon={<DownloadIcon/>}
                            key="applyMask"
                            onClick={() => {
                                handleOnApplyMask(editingMask)
                            }}
                        >应用面具</Button>,
                        <Button
                            icon={<DeleteIcon/>}
                            key="deleteMask"
                            onClick={() => {
                                deleteMask(editingMask?.id)
                            }}
                        >删除面具</Button>,
                        <Button
                            icon={<DownloadIcon/>}
                            key="export"
                            onClick={() =>
                                downloadAs(
                                    JSON.stringify(editingMask),
                                    `${editingMask.name}.json`,
                                )
                            }
                        >{Locale.Mask.EditModal.Download}</Button>,
                        <Button
                            key="copy"
                            icon={<CopyIcon/>}
                            onClick={() => {
                                navigate(Path.Masks);
                                maskStore.create(editingMask);
                                setEditingMaskId(undefined);
                            }}
                        >{Locale.Mask.EditModal.Clone}</Button>,
                    ]}
                >
                    <MaskConfig
                        mask={editingMask}
                        updateMask={(updater) =>
                            maskStore.update(editingMaskId!, updater)
                        }
                        readonly={editingMask.builtin}
                    />
                </Modal>
            )}
        </ErrorBoundary>
    );
}
