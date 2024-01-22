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
    ChatMessage, createMessage,
    useAppConfig,
    useChatStore, useUserFolderStore,
} from "../store";
import {
    CustomList,
    CustomListItem,
    Popover,
    CustomSelect,
    showConfirm,
} from "./ui-lib";
import {Avatar, AvatarPicker} from "./emoji";
import Locale, {AllLangs, ALL_LANG_OPTIONS, Lang} from "../locales";
import {useNavigate} from "react-router-dom";

import chatStyle from "./chat.module.scss";
import React, {useEffect, useState} from "react";
import {copyToClipboard, downloadAs, readFromFile} from "../utils";
import {Updater} from "../typing";
import {ModelConfigList} from "./model-config";
import {DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS, FileName, ModelConfig, Path} from "../constant";
import {BUILTIN_MASK_STORE} from "../masks";
import {Button, Card, Col, Input, InputNumber, Modal, notification, Radio, Select, Slider, Switch, Tag} from "antd";
import {CheckOutlined, CloseOutlined} from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import {assembleSaveOrUpdateMaskRequest, maskApi} from "@/app/client/mask/mask-api";
import {nanoid} from "nanoid";
import {validateMask} from "@/app/utils/mask";

// drag and drop helper function
function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
    const result = [...list];
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
}

export function MaskAvatar(props: { mask: Mask, isTyping?: boolean }) {
    return <Avatar isModel={true} avatar={DEFAULT_MASK_AVATAR} spin={props.isTyping}/>
}

export function MaskConfig(props: {
    mask: Mask;
    updateMask: Updater<Mask>;
    extraListItems?: JSX.Element;
    readonly?: boolean;
    shouldSyncFromGlobal?: boolean;
}) {
    // console.log("MaskConfig:" + JSON.stringify(props.mask));
    const [showPicker, setShowPicker] = useState(false);
    const [needRetrieveUserLocalVSFolders, setNeedRetrieveUserLocalVSFolders] = useState(true);
    const [contextSourcesOptions, setContextSourcesOptions] = useState('web_search');
    const [searchContextNums, setSearchContextNums] = useState(props.mask.relevantSearchOptions.search_top_k);
    const [webSearchResultsCount, setWebSearchResultsCount] = useState(props.mask.relevantSearchOptions.web_search_results_count);
    const [isOpenMakingLocalVSModal, setIsOpenMakingLocalVSModal] = useState(false);
    const [isAdvancedConfig, setIsAdvancedConfig] = useState(false);


    const onWebSearchResultsCountChange = (val: number | null) => {
        setWebSearchResultsCount(val || DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS.web_search_results_count);
        props.updateMask(
            (mask) =>
                (mask.relevantSearchOptions.web_search_results_count = val || DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS.web_search_results_count),
        );
    }

    const onSearchContextNumsChange = (val: number | null) => {
        setSearchContextNums(val || 4);
        props.updateMask(
            (mask) =>
                (mask.relevantSearchOptions.search_top_k = val || 4),
        );
    }

    const userFolderStore = useUserFolderStore();
    const navigate = useNavigate();

    useEffect(() => {
        needRetrieveUserLocalVSFolders && (async () => {
            await userFolderStore.initUserLocalVSFolders();
        })();
    }, [needRetrieveUserLocalVSFolders]);

    const localVSFoldersOptions = userFolderStore.userFolders.map((folder) => {
        return {
            label: folder.folderName,
            value: folder.id,
        }
    })

    const updateConfig = (updater: (config: ModelConfig) => void) => {
        const config = {...props.mask.modelConfig};
        updater(config);
        props.updateMask((mask) => {
            mask.modelConfig = config;
            // if user changed current session mask, it will disable auto sync
            mask.syncGlobalConfig = false;
        });
        // console.log("modelConfig:" + JSON.stringify(props.mask.modelConfig));
    };

    const copyMaskLink = () => {
        const maskLink = `${location.protocol}//${location.host}/#${Path.NewChat}?mask=${props.mask.id}`;
        copyToClipboard(maskLink);
    };

    const globalConfig = useAppConfig();
    // console.log("Current mask:" + JSON.stringify(props.mask));

    const handleOnAddContext = (checked: boolean) => {
        let context = (props.mask.context ?? []).slice(0, 2);  //目前只支持system 和 一个user role 的 prompt
        const defaultAddedContextStr = Locale.Mask.PromptItem.DefaultAddedContextStr;
        const userRolePrompt = context.find((c) => c.role === "user");

        if(checked) {
            // check if user role's prompt exists `{context}` in the context, if not exists, add `The source:{context}.` at the beginning of the context
            if (userRolePrompt) {
                const userRolePromptContent = userRolePrompt.content;
                if (!userRolePromptContent.includes("{context}")) {
                    userRolePrompt.content = defaultAddedContextStr + userRolePromptContent;
                }
            }
        } else {
            // remove the `{context}` in the context
            if (userRolePrompt) {
                const userRolePromptContent = userRolePrompt.content;
                console.log("userRolePromptContent:" + userRolePromptContent);
                if (userRolePromptContent.includes(defaultAddedContextStr)) {
                    const replacedContext = userRolePromptContent.replace(defaultAddedContextStr, "");
                    userRolePrompt.content = replacedContext;
                } else if (userRolePromptContent.includes("{context}")) {
                    userRolePrompt.content = userRolePromptContent.replace("{context}", " ");
                }  //TODO 应用面具的时候需要验证！
            }
        }

        // console.log("context:" + JSON.stringify(context));
        props.updateMask((mask) => {
            mask.haveContext = checked;
            mask.context = context;
        });
    }

    return (
        <>
            <Modal title={Locale.Settings.MakingLocalVS.Title}
                   open={isOpenMakingLocalVSModal}
                   onOk={() => navigate(Path.MakeLocalVSStore)}
                   okText={Locale.Settings.MakingLocalVS.ButtonContent}
                   onCancel={() => setIsOpenMakingLocalVSModal(false)}
                   cancelText={Locale.Settings.MakingLocalVS.CancelButtonContent}
            >
                <p>{Locale.Settings.MakingLocalVS.GoToMakeLocalVS}</p>
            </Modal>
            <ContextPrompts
                context={props.mask.context}
                updateContext={(updater) => {
                    const context = props.mask.context.slice();
                    updater(context);
                    props.updateMask((mask) => (mask.context = context));
                }}
                fewShotMessages={props.mask.fewShotContext}
                updateFewShotMessages={(updater) => {
                    const newFewShotMessages = {...props.mask.fewShotContext};
                    updater(newFewShotMessages);
                    props.updateMask((mask) => (mask.fewShotContext = newFewShotMessages));
                }}
            />

            <Button type={"link"} onClick={() => setIsAdvancedConfig(!isAdvancedConfig)}>
                {isAdvancedConfig ? Locale.Mask.Config.SwitchSingleConfig: Locale.Mask.Config.SwitchAdvancedConfig}
            </Button>
            <CustomList>
                <CustomListItem title={Locale.Mask.Config.Avatar}>
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
                </CustomListItem>
                <CustomListItem title={Locale.Mask.Config.Name}>
                    <Input
                        type={"text"}
                        defaultValue={props.mask.name}
                        onChange={(e) => {
                            props.updateMask((mask) => {
                                mask.name = e.currentTarget.value
                            });
                        }}/>
                </CustomListItem>
                <CustomListItem
                    title={Locale.Mask.Config.HaveContext.Title}
                    subTitle={Locale.Mask.Config.HaveContext.SubTitle}
                >
                    <Switch
                        checkedChildren={<CheckOutlined/>}
                        unCheckedChildren={<CloseOutlined/>}
                        defaultChecked={props.mask.haveContext}
                        onChange={handleOnAddContext}/>
                </CustomListItem>
                {
                    props.mask.haveContext ? (
                        <>
                            <CustomListItem title={Locale.Mask.Config.HaveContext.ContextSources.Title}>
                                <Select
                                    defaultValue={props.mask.relevantSearchOptions.retriever_type ?? "web_search"}
                                    value={props.mask.relevantSearchOptions.retriever_type}
                                    options={[
                                        {label: Locale.Mask.Config.HaveContext.ContextSources.RetrieverType.WebSearch, value: "web_search"},
                                        {label: Locale.Mask.Config.HaveContext.ContextSources.RetrieverType.LocalVectorStores, value: "local_vector_stores"},
                                        {label: Locale.Mask.Config.HaveContext.ContextSources.RetrieverType.Fixed, value: "fixed"},
                                    ]}
                                    onChange={(value) => {
                                        props.updateMask((mask) => {
                                            mask.relevantSearchOptions.retriever_type = value;
                                        });
                                        if (value === "web_search") {
                                            props.updateMask((mask) => {
                                                mask.relevantSearchOptions.local_vs_folder_name = "web_search";
                                            });
                                        } else if (value === "fixed" || value === "local_vector_stores") {
                                            const userFolders = userFolderStore.userFolders;
                                            if (userFolders.length === 0) {
                                                props.updateMask((mask) => {  //先设置默认值，后续再修改
                                                    mask.relevantSearchOptions.retriever_type = "web_search";
                                                    mask.relevantSearchOptions.local_vs_folder_name = "web_search";
                                                });
                                                setIsOpenMakingLocalVSModal(true);
                                                return;
                                            }
                                            props.updateMask((mask) => {
                                                mask.relevantSearchOptions.local_vs_folder_name = userFolders[0].folderName ?? "";
                                                mask.relevantSearchOptions.user_folder_id = userFolders[0].id;
                                            });
                                        }
                                        setContextSourcesOptions(value);
                                    }}
                                    style={{width: 130}}
                                />
                            </CustomListItem>
                            {
                                props.mask.relevantSearchOptions.retriever_type === "web_search" && isAdvancedConfig && (
                                    <CustomListItem
                                        title={Locale.Mask.Config.HaveContext.WebSearchNums.Title}
                                        subTitle={Locale.Mask.Config.HaveContext.WebSearchNums.SubTitle}
                                    >
                                        <Col span={4}>
                                            <InputNumber
                                                min={1}
                                                max={9}
                                                step={1}
                                                style={{margin: '0 4px'}}
                                                value={webSearchResultsCount}
                                                onChange={onWebSearchResultsCountChange}
                                            />
                                        </Col>
                                    </CustomListItem>
                                )
                            }
                            {
                                isAdvancedConfig && (
                                    <CustomListItem
                                        title={Locale.Mask.Config.HaveContext.SearchedContextNums.Title}
                                        subTitle={Locale.Mask.Config.HaveContext.SearchedContextNums.SubTitle}
                                    >
                                        <Col span={4}>
                                            <InputNumber
                                                min={1}
                                                max={10}
                                                step={1}
                                                style={{margin: '0 4px'}}
                                                value={searchContextNums}
                                                onChange={onSearchContextNumsChange}
                                            />
                                        </Col>
                                    </CustomListItem>
                                )
                            }
                            {
                                props.mask.relevantSearchOptions.retriever_type === "local_vector_stores"
                                    ||  props.mask.relevantSearchOptions.retriever_type === "fixed"? (
                                    <>
                                        {
                                            localVSFoldersOptions.length > 0 ? (
                                                <CustomListItem
                                                    title={Locale.Mask.Config.HaveContext.ChooseLocalVSFolder.Title}
                                                    subTitle={
                                                        <>
                                                            <Button
                                                                style={{padding: "0px 4px", fontSize: "12px"}}
                                                                onClick={() => navigate(Path.MakeLocalVSStore)}
                                                                type="link"
                                                            >
                                                                {Locale.Mask.Config.HaveContext.ChooseLocalVSFolder.SubTitle}
                                                            </Button>
                                                            <span>{Locale.Common.Or}</span>
                                                            <Button
                                                                style={{padding: "0px 4px", fontSize: "12px"}}
                                                                onClick={() => navigate(Path.ManageLocalVectorStore)}
                                                                type="link"
                                                            >
                                                                {Locale.Mask.Config.HaveContext.ManageLocalVSFolder.SubTitle}
                                                            </Button>
                                                        </>

                                                    }
                                                >
                                                    <Select
                                                        options={localVSFoldersOptions}
                                                        defaultValue={localVSFoldersOptions[0].value}
                                                        onChange={(selectedId: string) => {
                                                            for (const userFolder of userFolderStore.userFolders) {
                                                                if (userFolder.id === selectedId) {
                                                                    props.updateMask((mask) => {
                                                                        mask.relevantSearchOptions.local_vs_folder_name = userFolder.folderName ?? "";
                                                                        mask.relevantSearchOptions.user_folder_id = userFolder.id;
                                                                    });
                                                                    userFolderStore.setCurrentSelectedFolder(userFolder);
                                                                    break;
                                                                }
                                                            }}
                                                        }
                                                    >

                                                    </Select>
                                                </CustomListItem>
                                            ) : (() => {
                                                props.updateMask((mask) => {  //先设置默认值，后续再修改
                                                    mask.relevantSearchOptions.retriever_type = "web_search";
                                                    mask.relevantSearchOptions.local_vs_folder_name = "web_search";
                                                });
                                                setIsOpenMakingLocalVSModal(true);
                                            })
                                        }
                                    </>
                                ) : null
                            }
                        </>
                    ) : null
                }
                {
                    isAdvancedConfig ? (
                        <>
                            <CustomListItem
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
                            </CustomListItem>
                        </>
                    ) : null
                }
                <CustomListItem
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
                </CustomListItem>
                {/*{!props.shouldSyncFromGlobal ? (*/}
                {/*    <ListItem*/}
                {/*        title={Locale.Mask.Config.Share.Title}*/}
                {/*        subTitle={Locale.Mask.Config.Share.SubTitle}*/}
                {/*    >*/}
                {/*        <IconButton*/}
                {/*            icon={<CopyIcon/>}*/}
                {/*            text={Locale.Mask.Config.Share.Action}*/}
                {/*            onClick={copyMaskLink}*/}
                {/*        />*/}
                {/*    </ListItem>*/}
                {/*) : null}*/}

                {/*{props.shouldSyncFromGlobal ? (*/}
                {/*    <CustomListItem*/}
                {/*        title={Locale.Mask.Config.Sync.Title}*/}
                {/*        subTitle={Locale.Mask.Config.Sync.SubTitle}*/}
                {/*    >*/}
                {/*        <Switch*/}
                {/*            checkedChildren={<CheckOutlined/>}*/}
                {/*            unCheckedChildren={<CloseOutlined/>}*/}
                {/*            defaultChecked={props.mask.syncGlobalConfig}*/}
                {/*            onChange={async (checked) => {*/}
                {/*                if (*/}
                {/*                    checked &&*/}
                {/*                    (await showConfirm(Locale.Mask.Config.Sync.Confirm))*/}
                {/*                ) {*/}
                {/*                    props.updateMask((mask) => {*/}
                {/*                        mask.syncGlobalConfig = checked;*/}
                {/*                        mask.modelConfig = {...globalConfig.modelConfig};*/}
                {/*                    });*/}
                {/*                } else if (!checked) {*/}
                {/*                    props.updateMask((mask) => {*/}
                {/*                        mask.syncGlobalConfig = checked;*/}
                {/*                    });*/}
                {/*                }*/}
                {/*            }}/>*/}
                {/*    </CustomListItem>*/}
                {/*) : null}*/}
            </CustomList>
            <CustomList>
                <ModelConfigList
                    modelConfig={props.mask.modelConfig}
                    updateConfig={(updater) => {
                        const modelConfig = {...props.mask.modelConfig};
                        updater(modelConfig);
                        props.updateMask((mask) => {
                            mask.modelConfig = modelConfig;
                            mask.syncGlobalConfig = false;
                        });
                    }}
                    isAdvancedConfig={isAdvancedConfig}
                />
            </CustomList>
        </>
    );
}

function ContextPromptItem(props: {
    index: number;
    prompt: ChatMessage;
    update: (prompt: ChatMessage) => void;
    remove: () => void;
}) {
    const roleName = props.prompt.role === "system" ? Locale.Mask.PromptItem.System.name : Locale.Mask.PromptItem.User.name;
    const roleColor = props.prompt.role === "system" ? Locale.Mask.PromptItem.System.color : Locale.Mask.PromptItem.User.color;

    return (
        <div className={chatStyle["context-prompt-row"]}>
            <div>
                <Tag bordered={false} color={roleColor}>
                    {roleName}
                </Tag>
            </div>
            <TextArea
                value={props.prompt.content ?? ""}
                minLength={2}
                autoSize={true}
                allowClear={true}
                onChange={(e) => {
                    const content = e.target.value as any;
                    props.update({
                        ...props.prompt,
                        content: content,
                    })}
                }
            />
            {/*<div>*/}
            {/*    <Button*/}
            {/*        danger={true}*/}
            {/*        disabled={props.prompt.role === "system"}*/}
            {/*        onClick={() => props.remove()}*/}
            {/*    >*/}
            {/*        {Locale.Mask.PromptItem.Delete}*/}
            {/*    </Button>*/}
            {/*</div>*/}
        </div>
    );
}

export function ContextPrompts(props: {
    context: ChatMessage[];
    updateContext: (updater: (context: ChatMessage[]) => void) => void;
    fewShotMessages: Record<string /*id*/, [ChatMessage /*user*/, ChatMessage /*assistant*/]>;
    updateFewShotMessages: (updater: (fewShotMessages: Record<string /*id*/, [ChatMessage, ChatMessage]>) => void) => void;
}) {
    const context = (props.context ?? []).slice(0, 1);  //目前只支持system 的 prompt
    const shownFewShotMessages = props.fewShotMessages;
    const maskStore = useMaskStore();

    const addFewShotMsgs = (coupleMsg: [ChatMessage, ChatMessage]) => {
        const randId = nanoid();
        props.updateFewShotMessages((fewShotMessages) => {
            fewShotMessages[randId] = coupleMsg;
        });
    }

    const removeFewShotMsgs = (id: string) => {
        props.updateFewShotMessages((fewShotMessages) => {
            delete fewShotMessages[id];
        });
    }

    const updateFewShotMsgs = (id: string, coupleMsg: [ChatMessage, ChatMessage]) => {
        props.updateFewShotMessages((fewShotMessages) => {
            fewShotMessages[id] = coupleMsg;
        });
    }

    const addContextPrompt = (prompt: ChatMessage, i: number) => {
        props.updateContext((context) => context.splice(i, 0, prompt));
    };

    const removeContextPrompt = (i: number) => {
        props.updateContext((context) => context.splice(i, 1));
    };

    const updateContextPrompt = (i: number, prompt: ChatMessage) => {
        props.updateContext((context) => (context[i] = prompt));
    };

    return (
        <>
            <div className={chatStyle["context-prompt"]} style={{ marginBottom: 20 }}>
                {context.map((c, i) => (
                    <div className={chatStyle["context-prompt-item"]} key={"context-prompt-item-"+i}>
                        <ContextPromptItem
                            index={i}
                            prompt={c}
                            update={(prompt) => updateContextPrompt(i, prompt)}
                            remove={() => removeContextPrompt(i)}
                        />
                    </div>
                ))}
                {
                    shownFewShotMessages && Object.keys(shownFewShotMessages).length > 0 ? (
                        Object.entries(shownFewShotMessages).map(([id, value], i) => (
                            <div className={chatStyle["context-prompt-item"]} key={"context-prompt-item-"+i}>
                                <Card size={"small"} title={"引导案例"} extra={<a onClick={() => removeFewShotMsgs(id)}>{Locale.Common.Delete}</a>}>
                                    <div className={chatStyle["context-prompt-row"]}>
                                        <div>
                                            <Tag bordered={false} color={Locale.Mask.PromptItem.User.color}>
                                                {Locale.Mask.PromptItem.User.name}
                                            </Tag>
                                        </div>
                                        <TextArea
                                            value={value[0].content ?? ""}
                                            minLength={1}
                                            autoSize={true}
                                            allowClear={true}
                                            onChange={(e) => {
                                                const lastUserMsg: ChatMessage = value[0];
                                                const content = e.target.value as any;
                                                updateFewShotMsgs(id, [{...lastUserMsg, content}, value[1]])
                                            }}
                                        />
                                    </div>
                                    <div className={chatStyle["context-prompt-row"]}>
                                        <div>
                                            <Tag bordered={false} color={Locale.Mask.PromptItem.Assistant.color}>
                                                {Locale.Mask.PromptItem.Assistant.name}
                                            </Tag>
                                        </div>
                                        <TextArea
                                            status={"error"}  //TODO 有问题
                                            // status={maskStore.ifShowUserPromptError ? "error" : undefined}
                                            value={value[1].content ?? ""}
                                            minLength={1}
                                            autoSize={true}
                                            allowClear={true}
                                            onFocus={() => {
                                                if (maskStore.ifShowUserPromptError) {
                                                    maskStore.setShowUserPromptError(false);
                                                }
                                            }}
                                            onChange={(e) => {
                                                const lastAssistantMsg: ChatMessage = value[1];
                                                const content = e.target.value as any;
                                                updateFewShotMsgs(id, [value[0], {...lastAssistantMsg, content}])
                                            }}
                                        />
                                    </div>
                                </Card>
                            </div>
                        ))
                    ) : null
                }
                <div>
                    <Button onClick={() => {
                        const count = shownFewShotMessages ? Object.keys(shownFewShotMessages).length : 0;
                        addFewShotMsgs([createMessage({
                            role: "user",
                            content: "例子" + (count + 1),
                            date: new Date().toISOString()
                        }), createMessage({
                            role: "assistant",
                            content: "回答" + (count + 1),
                            date: new Date().toISOString()
                        })])}
                    }>新增引导案例</Button>
                </div>
                {props.context.length === 0 && (
                    <div className={chatStyle["context-prompt-row"]}>
                        <IconButton
                            icon={<AddIcon />}
                            text={Locale.Context.Add}
                            bordered
                            className={chatStyle["context-prompt-button"]}
                            onClick={() =>
                                addContextPrompt(
                                    createMessage({
                                        role: "user",
                                        content: "",
                                        date: "",
                                    }),
                                    props.context.length,
                                )
                            }
                        />
                    </div>
                )}
            </div>
        </>
    );
}

export function MaskPage() {
    const navigate = useNavigate();

    const maskStore = useMaskStore();
    const chatStore = useChatStore();

    const session = chatStore.currentSession();

    const [filterLang, setFilterLang] = useState<Lang>();
    const allMasks = maskStore
        .getAll()
        .filter((m) => !filterLang || m.lang === filterLang)
    ;

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
    // console.log("editingMask:" + JSON.stringify(editingMask));

    const openMaskModal = (maskId: string) => {
        setIsModalOpen(true);
        setEditingMaskId(maskId);
    }
    const closeMaskModal = () => {
        setIsModalOpen(false);
        setEditingMaskId(undefined);
    };

    const deleteMask = (id: string) => {
        maskStore.delete(id);
        maskApi.deleteMask(id).then((res) => {
            closeMaskModal();
            notify['success']({
                message: '删除成功',
            });
        }).finally(() => {
            maskStore.delete(id);
        });
    }

    const updateMask = (mask?: Mask) => {
        if (!mask) {
            return;
        }
        try {
            validateMask(session.mask);
        } catch (e: any) {
            console.log("validate mask failed", e);
            maskStore.setShowUserPromptError(true);
            notify['error']({
                message: e.message,
                duration: 10,
            });
            return;
        }

        const maskUpdateRequestVO = assembleSaveOrUpdateMaskRequest(mask);
        maskApi.updateMask(maskUpdateRequestVO)
            .then((res: void) => {
                maskStore.update(mask.id, (mask) => {
                    mask = {...mask};
                });
                notify['success']({
                    message: '更新成功',
                });
            }).catch((err: Error) => {
                console.log(err);
                notify['error']({
                    message: '更新失败，请稍后重试',
                });
            }).finally(() => {
                closeMaskModal();
            });
    }

    const handleOnApplyMask = async (mask: Mask) => {
        // create or update mask setting
        updateMask(mask);
        navigate(Path.Chat);
        chatStore.newSession(mask);
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
                                maskStore.create().then((mask) => {
                                    openMaskModal(mask.id);
                                }).catch((err: Error) => {
                                    console.log(err);
                                    notify['error']({
                                        message: Locale.Common.OperateFailed,
                                    });
                                });
                            }}
                        />
                    </div>

                    <div>
                        {masks
                            .sort((a, b) =>  b?.updateAt -  a?.updateAt)
                            .map((m) => (
                            <div className={styles["mask-item"]} key={m.id}>
                                <div className={styles["mask-header"]}>
                                    <div className={styles["mask-icon"]}>
                                        <MaskAvatar mask={m}/>
                                    </div>
                                    <div className={styles["mask-title"]}>
                                        <div className={styles["mask-name"]}>{m.name}</div>
                                        {/*<div className={styles["mask-info"] + " one-line"}>*/}
                                        {/*    {`${Locale.Mask.Item.Info(m.context ? m.context.length: 0)} / ${*/}
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
                                            handleOnApplyMask(m);
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
                                    {!m.builtin && (
                                        <IconButton
                                            icon={<DeleteIcon/>}
                                            text={Locale.Mask.Item.Delete}
                                            onClick={async () => {
                                                if (await showConfirm(Locale.Mask.Item.DeleteConfirm)) {
                                                    deleteMask(m.id);
                                                }
                                            }}
                                        />
                                    )}
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
                    onCancel={() => updateMask(editingMask)}
                    width={"75vw"}
                    footer={[
                        <Button
                            icon={<DownloadIcon/>}
                            key="updateMask"
                            onClick={() => {
                                updateMask(editingMask)
                            }}
                        >{Locale.Mask.Config.SaveAs}</Button>,
                        <Button
                            icon={<DownloadIcon/>}
                            key="applyMask"
                            onClick={() => {
                                handleOnApplyMask(editingMask)
                            }}
                        >{Locale.Mask.Config.ApplyMask}</Button>,
                        <Button
                            icon={<DeleteIcon/>}
                            key="deleteMask"
                            onClick={() => {
                                deleteMask(editingMask?.id)
                            }}
                        >{Locale.Mask.Config.DeleteMask}</Button>,
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
