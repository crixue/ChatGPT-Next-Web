import {create} from "zustand";
import {getLang, Lang} from "../locales";
import {DEFAULT_TOPIC, ChatMessage} from "./chat";

import {
    DEFAULT_CONFIG,
    DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS,
    SearchContextSourceConfig, StoreKey
} from "../constant";
import {nanoid} from "nanoid";
import {assembleSaveOrUpdateMaskRequest, maskApi} from "@/app/client/mask-api";
import {MaskItemResponseVO} from "@/app/types/mask-vo";
import {LangchainBackendBaseLLMConfig} from "@/app/client/api";

export type Mask = {
    id: string;
    createdAt: number;
    updateAt: number;
    avatar: string;
    name: string;
    hideContext?: boolean;
    isChineseText?: boolean;
    haveContext?: boolean;
    relevantSearchOptions: SearchContextSourceConfig;
    relevantSearchOptionsJsonStr?: string;
    promptId?: string,
    context: ChatMessage[];
    fewShotContext: Record<string, [ChatMessage, ChatMessage]>;
    syncGlobalConfig?: boolean;
    modelConfig: LangchainBackendBaseLLMConfig;
    modelConfigJsonStr?: string;
    lang: Lang;
    builtin: boolean;
    isCreatedNew?: boolean;  // 是否是新创建的mask
    llmId?: string;
};

export const DEFAULT_MASK_STATE = {
    masks: {} as Record<string, Mask>,
};

export type MaskState = typeof DEFAULT_MASK_STATE;
type MaskStore = MaskState & {
    initMasks: () => void;
    create: (mask?: Partial<Mask>) => Mask;
    update: (id: string, updater: (mask: Mask) => void) => void;
    delete: (id: string) => void;
    search: (text: string) => Mask[];
    get: (id?: string) => Mask | null;
    getAll: () => Mask[];
    ifShowUserPromptError: boolean;
    setShowUserPromptError: (show: boolean) => void;
};

export const DEFAULT_MASK_AVATAR = "gpt-bot";
export const createEmptyMask = () =>
    ({
        id: nanoid(6),
        avatar: DEFAULT_MASK_AVATAR,
        name: DEFAULT_TOPIC,
        hideContext: false,
        isChineseText: true,
        haveContext: true,
        relevantSearchOptions: DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS,
        promptId: "",
        context: DEFAULT_CONFIG.chatMessages,
        fewShotContext: {},
        syncGlobalConfig: true, // use global config as default
        modelConfig: {...DEFAULT_CONFIG.modelConfig} as unknown as LangchainBackendBaseLLMConfig,
        lang: getLang(),
        builtin: false,
        createdAt: Date.now(),
    } as Mask);


export const useMaskStore = create<MaskStore>()((set, get) => ({
        // ...DEFAULT_MASK_STATE,
        masks: {} as Record<string, Mask>,
        async initMasks() {
            const masks =  {} as Record<string, Mask>;
            const allMasks = await maskApi.getAllMasks();
            allMasks.forEach((m) => {
                const modelConfigJsonStr = m.modelConfigJsonStr;
                if(modelConfigJsonStr) {
                    m.modelConfig = JSON.parse(modelConfigJsonStr);
                } else {
                    m.modelConfig = DEFAULT_CONFIG["modelConfig"] as unknown as LangchainBackendBaseLLMConfig;
                }

                if (m.relevantSearchOptionsJsonStr) {
                    m.relevantSearchOptions = JSON.parse(m.relevantSearchOptionsJsonStr,);
                } else {
                    m.relevantSearchOptions = DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS;
                }
                //createdAt: 2024-03-21T14:15:59.000+00:00 covert to timestamp
                m.createdAt = new Date(m.createdAt).getTime();
                m.updateAt = new Date(m.updateAt).getTime();
                masks[m.id] = m;
            });
            set(() => ({masks}));
        },
        create(mask) {
            const masks = get().masks;
            const newMask = {...createEmptyMask(), isCreatedNew: true};
            console.log("newMask:" + JSON.stringify(newMask));
            // const maskCreationRequestVO = assembleSaveOrUpdateMaskRequest(newMask);
            // const resp:MaskItemResponseVO = await maskApi.createMask(maskCreationRequestVO);
            // let createdMask = resp.mask;
            // createdMask = {...newMask, id: createdMask.id, promptId: createdMask.promptId};  // 因为返回的mask没有context和fewShotContext，手动添加
            masks[newMask.id] = newMask;
            set(() => ({masks}));

            return masks[newMask.id];
        },
        update(id, updater: (mask: Mask) => void) {
            const masks = get().masks;
            const mask = masks[id];
            if (!mask) return;
            let updateMask = {...mask};
            updater(updateMask);
            masks[id] = updateMask;
            set(() => ({masks}));
        },
        delete(id) {
            const masks = get().masks;
            delete masks[id];
            set(() => ({masks}));
        },
        get(id) {
            return get().masks[id ?? 1145141919810];
        },
        getAll() {
            return Object.values(get().masks).sort((a, b) => a.updateAt - b.updateAt);
        },
        search(text) {
            return Object.values(get().masks);
        },
        ifShowUserPromptError: false,
        setShowUserPromptError(show: boolean) {
            set(() => ({ifShowUserPromptError: show}));
        }
    })
);
