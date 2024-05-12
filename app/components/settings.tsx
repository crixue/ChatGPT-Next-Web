import {useState, useEffect, useMemo} from "react";

import styles from "./settings.module.scss";

import ResetIcon from "../icons/reload.svg";
import AddIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
import CopyIcon from "../icons/copy.svg";
import ClearIcon from "../icons/clear.svg";
import LoadingIcon from "../icons/three-dots.svg";
import EditIcon from "../icons/edit.svg";
import EyeIcon from "../icons/eye.svg";
import {
    CustomTextAreaInput,
    CustomList,
    CustomListItem,
    CustomModal,
    Popover,
    CustomSelect,
    showConfirm,
} from "./ui-lib";

import {IconButton} from "./button";
import {
    useChatStore,
    useAccessStore,
    useAppConfig,
} from "../store";

import Locale, {
    AllLangs,
    ALL_LANG_OPTIONS,
    changeLang,
    getLang,
} from "../locales";
import {copyToClipboard} from "../utils";
import {Path, RELEASE_URL, SubmitKey, Theme, UPDATE_URL} from "../constant";
import {Prompt, SearchService, usePromptStore} from "../store/prompt";
import {ErrorBoundary} from "./error";
import {InputRange} from "./input-range";
import {useNavigate} from "react-router-dom";
import {Avatar, AvatarPicker} from "./emoji";
import {getClientConfig} from "../config/client";
import {nanoid} from "nanoid";
import {Button} from "antd";
import {useAuthStore} from "@/app/store/auth";

function EditPromptModal(props: { id: string; onClose: () => void }) {
    const promptStore = usePromptStore();
    const prompt = promptStore.get(props.id);

    return prompt ? (
        <div className="modal-mask">
            <CustomModal
                title={Locale.Settings.Prompt.EditModal.Title}
                onClose={props.onClose}
                actions={[
                    <IconButton
                        key=""
                        onClick={props.onClose}
                        text={Locale.UI.Confirm}
                        bordered
                    />,
                ]}
            >
                <div className={styles["edit-prompt-modal"]}>
                    <input
                        type="text"
                        value={prompt.title}
                        readOnly={!prompt.isUser}
                        className={styles["edit-prompt-title"]}
                        onInput={(e) =>
                            promptStore.update(
                                props.id,
                                (prompt) => (prompt.title = e.currentTarget.value),
                            )
                        }
                    ></input>
                    <CustomTextAreaInput
                        value={prompt.content}
                        readOnly={!prompt.isUser}
                        className={styles["edit-prompt-content"]}
                        rows={10}
                        onInput={(e) =>
                            promptStore.update(
                                props.id,
                                (prompt) => (prompt.content = e.currentTarget.value),
                            )
                        }
                    ></CustomTextAreaInput>
                </div>
            </CustomModal>
        </div>
    ) : null;
}

function UserPromptModal(props: { onClose?: () => void }) {
    const promptStore = usePromptStore();
    const userPrompts = promptStore.getUserPrompts();
    const builtinPrompts = SearchService.builtinPrompts;
    const allPrompts = userPrompts.concat(builtinPrompts);
    const [searchInput, setSearchInput] = useState("");
    const [searchPrompts, setSearchPrompts] = useState<Prompt[]>([]);
    const prompts = searchInput.length > 0 ? searchPrompts : allPrompts;

    const [editingPromptId, setEditingPromptId] = useState<string>();

    useEffect(() => {
        if (searchInput.length > 0) {
            const searchResult = SearchService.search(searchInput);
            setSearchPrompts(searchResult);
        } else {
            setSearchPrompts([]);
        }
    }, [searchInput]);

    return (
        <div className="modal-mask">
            <CustomModal
                title={Locale.Settings.Prompt.Modal.Title}
                onClose={() => props.onClose?.()}
                actions={[
                    <IconButton
                        key="add"
                        onClick={() =>
                            promptStore.add({
                                id: nanoid(),
                                createdAt: Date.now(),
                                title: "Empty Prompt",
                                content: "Empty Prompt Content",
                            })
                        }
                        icon={<AddIcon/>}
                        bordered
                        text={Locale.Settings.Prompt.Modal.Add}
                    />,
                ]}
            >
                <div className={styles["user-prompt-modal"]}>
                    <input
                        type="text"
                        className={styles["user-prompt-search"]}
                        placeholder={Locale.Settings.Prompt.Modal.Search}
                        value={searchInput}
                        onInput={(e) => setSearchInput(e.currentTarget.value)}
                    ></input>

                    <div className={styles["user-prompt-list"]}>
                        {prompts.map((v, _) => (
                            <div className={styles["user-prompt-item"]} key={v.id ?? v.title}>
                                <div className={styles["user-prompt-header"]}>
                                    <div className={styles["user-prompt-title"]}>{v.title}</div>
                                    <div className={styles["user-prompt-content"] + " one-line"}>
                                        {v.content}
                                    </div>
                                </div>

                                <div className={styles["user-prompt-buttons"]}>
                                    {v.isUser && (
                                        <IconButton
                                            icon={<ClearIcon/>}
                                            className={styles["user-prompt-button"]}
                                            onClick={() => promptStore.remove(v.id!)}
                                        />
                                    )}
                                    {v.isUser ? (
                                        <IconButton
                                            icon={<EditIcon/>}
                                            className={styles["user-prompt-button"]}
                                            onClick={() => setEditingPromptId(v.id)}
                                        />
                                    ) : (
                                        <IconButton
                                            icon={<EyeIcon/>}
                                            className={styles["user-prompt-button"]}
                                            onClick={() => setEditingPromptId(v.id)}
                                        />
                                    )}
                                    <IconButton
                                        icon={<CopyIcon/>}
                                        className={styles["user-prompt-button"]}
                                        onClick={() => copyToClipboard(v.content)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CustomModal>

            {editingPromptId !== undefined && (
                <EditPromptModal
                    id={editingPromptId!}
                    onClose={() => setEditingPromptId(undefined)}
                />
            )}
        </div>
    );
}

function DangerItems() {
    const chatStore = useChatStore();
    const appConfig = useAppConfig();

    return (
        <CustomList>
            <CustomListItem
                title={Locale.Settings.Danger.Reset.Title}
                subTitle={Locale.Settings.Danger.Reset.SubTitle}
            >
                <Button
                    danger={true}
                    onClick={async () => {
                        if (await showConfirm(Locale.Settings.Danger.Reset.Confirm)) {
                            appConfig.reset();
                        }
                    }}
                >
                    {Locale.Settings.Danger.Reset.Action}
                </Button>
            </CustomListItem>
            <CustomListItem
                title={Locale.Settings.Danger.Clear.Title}
                subTitle={Locale.Settings.Danger.Clear.SubTitle}
            >
                <Button
                    danger={true}
                    onClick={async () => {
                        if (await showConfirm(Locale.Settings.Danger.Clear.Confirm)) {
                            chatStore.clearAllData();
                        }

                    }}
                >
                    {Locale.Settings.Danger.Clear.Action}
                </Button>
            </CustomListItem>
        </CustomList>
    );
}

export function Settings() {
    const navigate = useNavigate();
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const config = useAppConfig();
    const updateConfig = config.update;

    const authStore = useAuthStore();

    const [shouldShowPromptModal, setShowPromptModal] = useState(false);

    useEffect(() => {
        const keydownEvent = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                navigate(Path.Home);
            }
        };
        document.addEventListener("keydown", keydownEvent);
        return () => {
            document.removeEventListener("keydown", keydownEvent);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const clientConfig = useMemo(() => getClientConfig(), []);

    return (
        <ErrorBoundary>
            <div className="window-header" data-tauri-drag-region>
                <div className="window-header-title">
                    <div className="window-header-main-title">
                        {Locale.Settings.Title}
                    </div>
                    <div className="window-header-sub-title">
                        {Locale.Settings.SubTitle}
                    </div>
                </div>
                <div className="window-actions">
                    <div className="window-action-button"></div>
                    <div className="window-action-button"></div>
                    <div className="window-action-button">
                        <IconButton
                            icon={<CloseIcon/>}
                            onClick={() => navigate(Path.Home)}
                            bordered
                        />
                    </div>
                </div>
            </div>
            <div className={styles["settings"]}>
                <CustomList>
                    <CustomListItem title={Locale.Settings.Avatar}>
                        <Popover
                            onClose={() => setShowEmojiPicker(false)}
                            content={
                                <AvatarPicker
                                    onEmojiClick={(avatar: string) => {
                                        updateConfig((config) => (config.avatar = avatar));
                                        setShowEmojiPicker(false);
                                    }}
                                />
                            }
                            open={showEmojiPicker}
                        >
                            <div
                                className={styles.avatar}
                                onClick={() => setShowEmojiPicker(true)}
                            >
                                <Avatar avatar={config.avatar}/>
                            </div>
                        </Popover>
                    </CustomListItem>

                    <CustomListItem title={Locale.Settings.SendKey}>
                        <CustomSelect
                            value={config.submitKey}
                            onChange={(e) => {
                                updateConfig(
                                    (config) =>
                                        (config.submitKey = e.target.value as any as SubmitKey),
                                );
                            }}
                        >
                            {Object.values(SubmitKey).map((v) => (
                                <option value={v} key={v}>
                                    {v}
                                </option>
                            ))}
                        </CustomSelect>
                    </CustomListItem>

                    <CustomListItem title={Locale.Settings.Theme}>
                        <CustomSelect
                            value={config.theme}
                            onChange={(e) => {
                                updateConfig(
                                    (config) => (config.theme = e.target.value as any as Theme),
                                );
                            }}
                        >
                            {Object.values(Theme).map((v) => (
                                <option value={v} key={v}>
                                    {v}
                                </option>
                            ))}
                        </CustomSelect>
                    </CustomListItem>

                    <CustomListItem title={Locale.Settings.Lang.Name}>
                        <CustomSelect
                            value={getLang()}
                            onChange={(e) => {
                                changeLang(e.target.value as any);
                            }}
                        >
                            {AllLangs.map((lang) => (
                                <option value={lang} key={lang}>
                                    {ALL_LANG_OPTIONS[lang]}
                                </option>
                            ))}
                        </CustomSelect>
                    </CustomListItem>

                    <CustomListItem
                        title={Locale.Settings.FontSize.Title}
                        subTitle={Locale.Settings.FontSize.SubTitle}
                    >
                        <InputRange
                            title={`${config.fontSize ?? 14}px`}
                            value={config.fontSize}
                            min="12"
                            max="18"
                            step="1"
                            onChange={(e) =>
                                updateConfig(
                                    (config) =>
                                        (config.fontSize = Number.parseInt(e.currentTarget.value)),
                                )
                            }
                        ></InputRange>
                    </CustomListItem>

                    <CustomListItem
                        title={Locale.Settings.AutoGenerateTitle.Title}
                        subTitle={Locale.Settings.AutoGenerateTitle.SubTitle}
                    >
                        <input
                            type="checkbox"
                            checked={config.enableAutoGenerateTitle}
                            onChange={(e) =>
                                updateConfig(
                                    (config) =>
                                        (config.enableAutoGenerateTitle = e.currentTarget.checked),
                                )
                            }
                        ></input>
                    </CustomListItem>

                    <CustomListItem
                        title={Locale.Settings.SendPreviewBubble.Title}
                        subTitle={Locale.Settings.SendPreviewBubble.SubTitle}
                    >
                        <input
                            type="checkbox"
                            checked={config.sendPreviewBubble}
                            onChange={(e) =>
                                updateConfig(
                                    (config) =>
                                        (config.sendPreviewBubble = e.currentTarget.checked),
                                )
                            }
                        ></input>
                    </CustomListItem>
                </CustomList>

                <CustomList>
                    <CustomListItem
                        title={Locale.Settings.Mask.Splash.Title}
                        subTitle={Locale.Settings.Mask.Splash.SubTitle}
                    >
                        <input
                            type="checkbox"
                            checked={!config.dontShowMaskSplashScreen}
                            onChange={(e) =>
                                updateConfig(
                                    (config) =>
                                        (config.dontShowMaskSplashScreen =
                                            !e.currentTarget.checked),
                                )
                            }
                        ></input>
                    </CustomListItem>

                    <CustomListItem
                        title={Locale.Settings.Mask.Builtin.Title}
                        subTitle={Locale.Settings.Mask.Builtin.SubTitle}
                    >
                        <input
                            type="checkbox"
                            checked={config.hideBuiltinMasks}
                            onChange={(e) =>
                                updateConfig(
                                    (config) =>
                                        (config.hideBuiltinMasks = e.currentTarget.checked),
                                )
                            }
                        ></input>
                    </CustomListItem>
                </CustomList>

                {/*<SyncItems/>*/}

                <CustomList>
                    <CustomListItem
                        title={Locale.ManageLocalVectorStore.Title}
                        subTitle={Locale.ManageLocalVectorStore.SubTitle}
                    >
                        <Button
                            type="primary"
                            onClick={() => {
                                navigate(Path.ManageLocalVectorStore);
                            }}
                        >
                            {Locale.ManageLocalVectorStore.ButtonContent}
                        </Button>
                    </CustomListItem>
                </CustomList>

                {/*<List>*/}
                {/*    <ModelConfigList*/}
                {/*        modelConfig={config.modelConfig}*/}
                {/*        updateConfig={(updater) => {*/}
                {/*            const modelConfig = {...config.modelConfig};*/}
                {/*            updater(modelConfig);*/}
                {/*            config.update((config) => (config.modelConfig = modelConfig));*/}
                {/*        }}*/}
                {/*    />*/}
                {/*</List>*/}

                {shouldShowPromptModal && (
                    <UserPromptModal onClose={() => setShowPromptModal(false)}/>
                )}

                <CustomList>
                    <CustomListItem
                        title={Locale.Plugins.Title}
                        subTitle={Locale.Plugins.SubTitle}
                    >
                        <Button
                            type="primary"
                            onClick={() => {
                                navigate(Path.Plugins);
                            }}
                        >
                            {Locale.Plugins.GoToViewBtn}
                        </Button>
                    </CustomListItem>
                </CustomList>

                <DangerItems/>

                <CustomList>
                    <CustomListItem
                        title={Locale.Logout.Title}
                    >
                        <Button
                            type="primary"
                            onClick={() => {
                                authStore.logout();
                            }}
                        >
                            {Locale.Logout.LogoutBtn}
                        </Button>
                    </CustomListItem>
                </CustomList>
            </div>
        </ErrorBoundary>
    );
}
