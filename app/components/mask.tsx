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
    ChatMessage, createMessage, ModalConfigValidator,
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
import React, {useEffect, useRef, useState} from "react";
import {copyToClipboard, downloadAs, readFromFile} from "../utils";
import {ModelConfigList} from "./model-config";
import {DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS, FileName, ModelConfig, Path} from "../constant";
import {BUILTIN_MASK_STORE} from "../masks";
import {
    Button,
    Card,
    Col,
    Input,
    InputNumber,
    Modal,
    notification,
    Radio, RadioChangeEvent,
    Select,
    Slider,
    Switch, Tabs,
    TabsProps,
    Tag
} from "antd";
import {CheckOutlined, CloseOutlined, PlusOutlined} from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import {assembleSaveOrUpdateMaskRequest, maskApi} from "@/app/client/mask-api";
import {nanoid} from "nanoid";
import {validateMask} from "@/app/utils/mask";
import {MaskItemResponseVO} from "@/app/types/mask-vo";
import {Updater} from "@/app/typing";

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
    onGoToMakeLocalVS?: (val: boolean) => void;
}) {
    // const updateConfig = (updater: (config: ModelConfig) => void) => {
    //     const config = {...props.mask.modelConfig};
    //     updater(config);
    //     props.updateMask((mask) => {
    //         mask.modelConfig = config;
    //         // if user changed current session mask, it will disable auto sync
    //         mask.syncGlobalConfig = false;
    //     });
    //     // console.log("modelConfig:" + JSON.stringify(props.mask.modelConfig));
    // };

    const copyMaskLink = () => {
        const maskLink = `${location.protocol}//${location.host}/#${Path.NewChat}?mask=${props.mask.id}`;
        copyToClipboard(maskLink);
    };

    const maskNameRef = useRef<string>(props.mask.name);

    const Tag0 = () => {
        // const maskConfigStore = useMaskConfigStore();
        const [fewShotMessages, setFewShotMessages] = useState(props.mask.fewShotContext ?? {});
        const [context, setContext] = useState(props.mask.context ?? []);
        const [showPicker, setShowPicker] = useState(false);
        const currentMask = props.mask;

        return (
            <>
                <ContextPrompts
                    context={context}
                    updateContext={(updater) => {
                        const newContext = context.slice();
                        updater(newContext);
                        // maskConfigStore.setMaskConfig({...currentMask, context: newContext});
                        setContext(newContext);
                        props.updateMask((mask) => (mask.context = newContext));
                    }}
                    fewShotMessages={fewShotMessages}
                    updateFewShotMessages={(updater) => {
                        const newFewShotMessages = {...fewShotMessages};
                        updater(newFewShotMessages);
                        // maskConfigStore.setMaskConfig({...currentMask, fewShotContext: newFewShotMessages});
                        setFewShotMessages(newFewShotMessages);
                        props.updateMask((mask) => (mask.fewShotContext = newFewShotMessages));
                    }}
                />
                <CustomList>
                    <CustomListItem title={Locale.Mask.Config.Avatar}>
                        <Popover
                            content={
                                <AvatarPicker
                                    onEmojiClick={(emoji) => {
                                        // maskConfigStore.setMaskConfig({...currentMask, avatar: emoji});
                                        props.updateMask((mask) => (mask.avatar = emoji));
                                        setShowPicker(false);
                                    }}
                                />
                            }
                            open={showPicker}
                            onClose={() => setShowPicker(false)}
                        >
                            <div
                                onClick={() => setShowPicker(true)}
                                style={{cursor: "pointer"}}
                            >
                                <MaskAvatar mask={currentMask}/>
                            </div>
                        </Popover>
                    </CustomListItem>
                    <CustomListItem title={Locale.Mask.Config.Name}>
                        <Input
                            type={"text"}
                            style={{
                                width: "60%",
                            }}
                            defaultValue={currentMask.name}
                            onChange={(e) => {
                                maskNameRef.current = e.currentTarget.value;
                            }}
                            onBlur={(e) => {
                                // maskConfigStore.setMaskConfig({...currentMask, name: maskNameRef.current});
                                props.updateMask((mask) => {
                                    mask.name = maskNameRef.current
                                });
                            }}
                        />
                    </CustomListItem>
                </CustomList>
            </>
        )
    }

    const Tag1 = () => {
        // const maskConfigStore = useMaskConfigStore();

        let currentMask = {...props.mask};
        const [needRetrieveUserLocalVSFolders, setNeedRetrieveUserLocalVSFolders] = useState(true);
        // const relevantSearchOptions = props.mask.relevantSearchOptions ?? DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS;
        // console.log("currentMask:" + JSON.stringify(currentMask));
        const [isAdvancedConfig, setIsAdvancedConfig] = useState(true);
        const [haveContext, setHaveContext] = useState(currentMask.haveContext);
        const [searchContextNums, setSearchContextNums] =
            useState(currentMask.relevantSearchOptions?.search_top_k ?? DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS.search_top_k);

        const [webSearchResultsCount, setWebSearchResultsCount] = useState(
            currentMask.relevantSearchOptions?.web_search_results_count ?? DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS.web_search_results_count);
        const [contextSourcesOptions, setContextSourcesOptions] =
            useState((props.mask.relevantSearchOptions ?? DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS).retriever_type);

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

        const onWebSearchResultsCountChange = (val: number | null) => {
            if (val == null) return;
            setWebSearchResultsCount(val || DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS.web_search_results_count);
        }

        const onWebSearchResultsCountBlur = (val: number | null) => {
            props.updateMask(
                (mask) =>
                    (mask.relevantSearchOptions.web_search_results_count = val || DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS.web_search_results_count),
            );
        }

        const handleOnAddContext = (checked: boolean) => {
            let context = (currentMask.context ?? []).slice(0, 2);  //目前只支持system 和 一个user role 的 prompt
            const defaultAddedContextStr = Locale.Mask.PromptItem.DefaultAddedContextStr;
            const userRolePrompt = context.find((c) => c.role === "user");
            setHaveContext(checked);
            // console.log("context:" + JSON.stringify(context));
            props.updateMask((mask) => {
                mask.haveContext = checked;
                mask.context = context;
            });
        }

        const onSearchContextNumsChange = (val: number | null) => {
            if (val == null) return;
            setSearchContextNums(val || DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS.search_top_k);
        }

        const onSearchContextNumsBlur = (val: number | null) => {
            setSearchContextNums(val || DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS.search_top_k);
            props.updateMask(
                (mask) =>
                    (mask.relevantSearchOptions.search_top_k = val || DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS.search_top_k),
            );
        }

        const onContextSourceChange = (value: string) => {
            props.updateMask((mask) => {
                mask.relevantSearchOptions.retriever_type = value;
            });
            if (value === "web_search") {
                // maskConfigStore.setMaskConfig({...maskConfig,
                //     relevantSearchOptions: {...maskConfig.relevantSearchOptions, local_vs_folder_name: "web_search"}});
                setContextSourcesOptions(value);
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
                    setContextSourcesOptions(value);
                    if(props.onGoToMakeLocalVS != null) {
                        props.onGoToMakeLocalVS(true);
                    }
                    // setIsOpenMakingLocalVSModal(true);
                    return;
                }
                setContextSourcesOptions(value);
                props.updateMask((mask) => {
                    mask.relevantSearchOptions.local_vs_folder_name = userFolders[0].folderName ?? "" as string;
                    mask.relevantSearchOptions.user_folder_id = userFolders[0].id;
                });
            }
        }

        const onSelectedUserFolderChange = (selectedId: string) => {
            for (const userFolder of userFolderStore.userFolders) {
                if (userFolder.id === selectedId) {
                    props.updateMask((mask) => {
                        mask.relevantSearchOptions.local_vs_folder_name = userFolder.folderName ?? "";
                        mask.relevantSearchOptions.user_folder_id = userFolder.id;
                    });
                    userFolderStore.setCurrentSelectedFolder(userFolder);
                    break;
                }
            }
        }

        const onHideContextChange = (checked: boolean) => {
            const maskConfig = currentMask;
            props.updateMask((mask) => {
                mask.hideContext = checked;
            });
        }

        const onIsChineseTextChange = (checked: boolean) => {
            const maskConfig = currentMask;
            props.updateMask((mask) => {
                mask.isChineseText = checked;
            });
        }

        return (
            <>
                {/*<Button type={"link"} onClick={() => setIsAdvancedConfig(!isAdvancedConfig)}>*/}
                {/*    {isAdvancedConfig ? Locale.Mask.Config.SwitchSingleConfig: Locale.Mask.Config.SwitchAdvancedConfig}*/}
                {/*</Button>*/}
                <CustomList>
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
                        haveContext ? (
                            <>
                                <CustomListItem title={Locale.Mask.Config.HaveContext.ContextSources.Title}>
                                    <Select
                                        value={contextSourcesOptions ?? "web_search"}
                                        options={[
                                            {label: Locale.Mask.Config.HaveContext.ContextSources.RetrieverType.WebSearch, value: "web_search"},
                                            {label: Locale.Mask.Config.HaveContext.ContextSources.RetrieverType.LocalVectorStores, value: "local_vector_stores"},
                                            {label: Locale.Mask.Config.HaveContext.ContextSources.RetrieverType.Fixed, value: "fixed"},
                                        ]}
                                        onChange={(value) => onContextSourceChange(value)}
                                        style={{width: 130}}
                                    />
                                </CustomListItem>
                                {
                                    (contextSourcesOptions === "web_search" ||  contextSourcesOptions === "fixed") && isAdvancedConfig && (
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
                                                    defaultValue={webSearchResultsCount}
                                                    onChange={onWebSearchResultsCountChange}
                                                    onBlur={event => onWebSearchResultsCountBlur(Number(event.target.value ?? 5))}
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
                                                    max={5}
                                                    step={1}
                                                    style={{margin: '0 4px'}}
                                                    defaultValue={searchContextNums}
                                                    onBlur={event => {
                                                        onSearchContextNumsBlur(Number(event.target.value ?? 4));
                                                    }}
                                                    onChange={onSearchContextNumsChange}
                                                />
                                            </Col>
                                        </CustomListItem>
                                    )
                                }
                                {
                                    contextSourcesOptions === "local_vector_stores"
                                    ||  contextSourcesOptions === "fixed"? (
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
                                                            defaultValue={props.mask.relevantSearchOptions.user_folder_id ?? localVSFoldersOptions[0].value}
                                                            onChange={onSelectedUserFolderChange}
                                                        >
                                                        </Select>
                                                    </CustomListItem>
                                                ) : (() => {
                                                    props.updateMask((mask) => {  //先设置默认值，后续再修改
                                                        mask.relevantSearchOptions.retriever_type = "web_search";
                                                        mask.relevantSearchOptions.local_vs_folder_name = "web_search";
                                                    });
                                                    if(props.onGoToMakeLocalVS != null) {
                                                        props.onGoToMakeLocalVS(true);
                                                    }
                                                    // setIsOpenMakingLocalVSModal(true);
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
                                        onChange={onHideContextChange}/>
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
                            onChange={onIsChineseTextChange}/>
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
                {/*<CustomList>*/}
                {/*    <ModelConfigList*/}
                {/*        modelConfig={props.mask.modelConfig}*/}
                {/*        updateConfig={(updater) => {*/}
                {/*            const modelConfig = {...props.mask.modelConfig};*/}
                {/*            updater(modelConfig);*/}
                {/*            props.updateMask((mask) => {*/}
                {/*                mask.modelConfig = modelConfig;*/}
                {/*                mask.syncGlobalConfig = false;*/}
                {/*            });*/}
                {/*        }}*/}
                {/*        isAdvancedConfig={isAdvancedConfig}*/}
                {/*    />*/}
                {/*</CustomList>*/}
            </>
        );
    }

    const Tag2 = () => {
        const [isAdvancedConfig, setIsAdvancedConfig] = useState(false);
        const currentMask = {...props.mask};

        return (
            <>
                {/*<Button type={"link"} onClick={() => setIsAdvancedConfig(!isAdvancedConfig)}>*/}
                {/*    {isAdvancedConfig ? Locale.Mask.Config.SwitchSingleConfig: Locale.Mask.Config.SwitchAdvancedConfig}*/}
                {/*</Button>*/}
                <CustomList>
                    <ModelConfigList
                        mask={currentMask}
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
        )
    }

    const items: TabsProps['items'] = [
        {
            key: '0',
            label: Locale.Mask.Tags.Tag0,
            children: <Tag0/>,
        },
        {
            key: '1',
            label: Locale.Mask.Tags.Tag1,
            children: <Tag1/>,
        },
        {
            key: '2',
            label: Locale.Mask.Tags.Tag2,
            children: <Tag2/>,
        },
    ];

    return (
        <Tabs defaultActiveKey="0" items={items} />
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

    const [content, setContent] = useState<string>(props.prompt.content ?? "")

    return (
        <div className={chatStyle["context-prompt-row"]}>
            <div>
                <Tag bordered={false} color={roleColor}>
                    {roleName}
                </Tag>
            </div>
            <TextArea
                value={content}
                minLength={1}
                maxLength={400}
                autoSize={true}
                allowClear={true}
                onChange={(e) => {
                    setContent(e.target.value);
                }}
                onBlur={(e) => {
                    props.update({
                        ...props.prompt,
                        content: content,
                    })
                }}
            />
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
                    Object.entries(shownFewShotMessages).map(([id, value], i) => {
                        return (<div className={chatStyle["context-prompt-item"]} key={"context-prompt-item-"+i}>
                            <Card size={"small"} title={Locale.Mask.ContextPrompt.CardTitle}
                                  extra={<a onClick={() => removeFewShotMsgs(id)}>{Locale.Common.Delete}</a>}>
                                <div className={chatStyle["context-prompt-row"]}>
                                    <div>
                                        <Tag bordered={false} color={Locale.Mask.PromptItem.User.color}>
                                            {Locale.Mask.PromptItem.User.name}
                                        </Tag>
                                    </div>
                                    <TextArea
                                        defaultValue={value[0].content ?? ""}
                                        minLength={1}
                                        maxLength={400}
                                        autoSize={true}
                                        allowClear={true}
                                        onBlur={(e) => {
                                            const lastUserMsg: ChatMessage = value[0];
                                            value[0].content = e.target.value;
                                            updateFewShotMsgs(id, [{...lastUserMsg, content: value[0].content ?? ""}, value[1]])
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
                                        defaultValue={value[1].content ?? ""}
                                        minLength={1}
                                        maxLength={400}
                                        autoSize={true}
                                        allowClear={true}
                                        onBlur={(e) => {
                                            const lastAssistantMsg: ChatMessage = value[1];
                                            value[1].content = e.target.value;
                                            updateFewShotMsgs(id, [value[0], {...lastAssistantMsg, content: value[1].content ?? ""}])
                                        }}
                                    />
                                </div>
                            </Card>
                        </div>
                    )})
                }
                <div>
                    <Button
                        type={"dashed"}
                        className={chatStyle["add-few-examples-button"]}
                        icon={<PlusOutlined />}
                        onClick={() => {
                            const count = shownFewShotMessages ? Object.keys(shownFewShotMessages).length : 0;
                            addFewShotMsgs([createMessage({
                                role: "user",
                                content: Locale.Mask.ContextPrompt.UserExampleContentPrefix + (count + 1),
                                date: new Date().toISOString()
                            }), createMessage({
                                role: "assistant",
                                content: Locale.Mask.ContextPrompt.AssistantExampleContentPrefix + (count + 1),
                                date: new Date().toISOString()
                            })])}
                    }>{Locale.Mask.ContextPrompt.AddNewFewShotExampleBtn}</Button>
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
    const [isOpenMakingLocalVSModal, setIsOpenMakingLocalVSModal] = useState(false);

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

    // console.log(editingMaskId)
    const editingMask = maskStore.get(editingMaskId);
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
                message: Locale.Common.OperateSuccess,
            });
        }).finally(() => {
            maskStore.delete(id);
        });
    }

    const createMaskOnDB = async (newMask: Mask) => {
        const updateMask = newMask;
        const maskCreationRequestVO = assembleSaveOrUpdateMaskRequest(updateMask);
        try{
            const resp:MaskItemResponseVO = await maskApi.createMask(maskCreationRequestVO);
            let createdMask = resp.mask;
            createdMask = {...updateMask, id: createdMask.id, promptId: createdMask.promptId, isCreatedNew: false};  // 因为返回的mask没有context和fewShotContext，手动添加
            maskStore.update(createdMask.id, (mask) => {
                mask.id = createdMask.id;
                mask.promptId = createdMask.promptId;
                mask.isCreatedNew = false;
            });
        } catch (e: any) {
            console.log("createMaskOnDB failed", e);
            notify['error']({
                message: Locale.Common.OperateFailed,
            });
            maskStore.delete(updateMask.id);
        } finally {
            closeMaskModal();
        }
    }

    const updateMask = (updatedMask: Mask) => {
        try {
            validateMask(updatedMask);
        } catch (e: any) {
            console.log("validate applyedMask failed", e);
            maskStore.setShowUserPromptError(true);
            notify['error']({
                message: e.message,
                duration: 10,
            });
            return;
        }

        const maskUpdateRequestVO = assembleSaveOrUpdateMaskRequest(updatedMask);
        maskApi.updateMask(maskUpdateRequestVO)
            .then((res: void) => {
                // maskStore.update(updatedMask.id, (mask) => {
                //     mask = updatedMask;
                // });
                notify['success']({
                    message: Locale.Common.OperateSuccess,
                });
            }).catch((err: Error) => {
                console.log(err);
                notify['error']({
                    message: Locale.Common.OperateFailed,
                });
            }).finally(() => {
                closeMaskModal();
            });
    }

    const handleOnApplyMask = async (mask: Mask) => {
        // create or update mask setting
        if(mask.isCreatedNew){
            createMaskOnDB(mask);
        } else {
            updateMask(mask);
        }
        navigate(Path.Chat);
        chatStore.newSession(mask);
    }

    const handleOnChat = (mask: Mask) => {
        navigate(Path.Chat);
        chatStore.newSession(mask);
    }

    const downloadAll = () => {
        downloadAs(JSON.stringify(masks), FileName.Masks);
    };

    // const importFromFile = () => {
    //     readFromFile().then((content) => {
    //         try {
    //             const importMasks = JSON.parse(content);
    //             if (Array.isArray(importMasks)) {
    //                 for (const mask of importMasks) {
    //                     if (mask.name) {
    //                         maskStore.create(mask);
    //                     }
    //                 }
    //                 return;
    //             }
    //             //if the content is a single mask.
    //             if (importMasks.name) {
    //                 maskStore.create(importMasks);
    //             }
    //         } catch {
    //         }
    //     });
    // };

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
                                const newMask = maskStore.create();
                                openMaskModal(newMask.id);
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
                                            handleOnChat(m);
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
                                            onClick={() => {
                                                openMaskModal(m.id);
                                            }}
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
                <>
                    <Modal
                        open={isModalOpen}
                        title={Locale.Mask.EditModal.Title(editingMask?.builtin)}
                        onCancel={() => {
                            closeMaskModal();
                            if (editingMask.isCreatedNew) {
                                maskStore.delete(editingMask.id);
                            }
                        }}
                        width={"75vw"}
                        footer={[
                            <Button
                                icon={<DownloadIcon/>}
                                key="updateMask"
                                onClick={() => {
                                    if (editingMask.isCreatedNew) {
                                        createMaskOnDB(editingMask);
                                    } else {
                                        updateMask(editingMask);
                                    }
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
                            onGoToMakeLocalVS={(val) => setIsOpenMakingLocalVSModal(val)}
                            readonly={editingMask.builtin
                        }
                        />
                    </Modal>
                    <Modal title={Locale.Settings.MakingLocalVS.Title}
                           open={isOpenMakingLocalVSModal}
                           onOk={() => navigate(Path.MakeLocalVSStore)}
                           okText={Locale.Settings.MakingLocalVS.ButtonContent}
                           onCancel={() => setIsOpenMakingLocalVSModal(false)}
                           cancelText={Locale.Settings.MakingLocalVS.CancelButtonContent}
                    >
                        <p>{Locale.Settings.MakingLocalVS.GoToMakeLocalVS}</p>
                    </Modal>
                </>

            )}
        </ErrorBoundary>
    );
}
