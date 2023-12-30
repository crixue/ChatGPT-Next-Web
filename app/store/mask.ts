import {create} from "zustand";
import {getLang, Lang} from "../locales";
import {DEFAULT_TOPIC, ChatMessage} from "./chat";

import {
    DEFAULT_CONFIG, DEFAULT_PROMPT_TEMPLATE,
    DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS,
    ModelConfig, PromptTemplate,
    SearchContextSourceConfig, StoreKey
} from "../constant";
import {nanoid} from "nanoid";
import {assembleSaveOrUpdateMaskRequest, maskApi} from "@/app/client/mask/mask-api";
import {persist} from "zustand/middleware";
import {MaskItemResponseVO} from "@/app/trypes/mask-vo";

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
    modelConfig: ModelConfig;
    modelConfigJsonStr?: string;
    lang: Lang;
    builtin: boolean;
};

export const DEFAULT_MASK_STATE = {
    masks: {} as Record<string, Mask>,
};

export type MaskState = typeof DEFAULT_MASK_STATE;
type MaskStore = MaskState & {
    initMasks: () => void;
    create: (mask?: Partial<Mask>) => Promise<Mask>;
    update: (id: string, updater: (mask: Mask) => void) => void;
    delete: (id: string) => void;
    search: (text: string) => Mask[];
    get: (id?: string) => Mask | null;
    getAll: () => Mask[];
};

export const DEFAULT_MASK_AVATAR = "gpt-bot";
export const createEmptyMask = () =>
    ({
        id: nanoid(),
        avatar: DEFAULT_MASK_AVATAR,
        name: DEFAULT_TOPIC,
        isChineseText: true,
        haveContext: true,
        relevantSearchOptions: DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS,
        promptId: "",
        context: DEFAULT_CONFIG.chatMessages,
        fewShotContext: {},
        syncGlobalConfig: true, // use global config as default
        modelConfig: {...DEFAULT_CONFIG.modelConfig},
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
                    m.modelConfig = DEFAULT_CONFIG["modelConfig"];
                }

                if (m.relevantSearchOptionsJsonStr) {
                    m.relevantSearchOptions = JSON.parse(m.relevantSearchOptionsJsonStr,);
                } else {
                    m.relevantSearchOptions = DEFAULT_RELEVANT_DOCS_SEARCH_OPTIONS;
                }
                masks[m.id] = m;
            });
            set(() => ({masks}));
        },
        async create(mask) {
            const masks = get().masks;
            const newMask = {...createEmptyMask(), ...mask};
            const maskCreationRequestVO = assembleSaveOrUpdateMaskRequest(newMask);
            const resp:MaskItemResponseVO = await maskApi.createMask(maskCreationRequestVO);
            const createdMask = resp.mask;
            masks[createdMask.id] = createdMask;
            set(() => ({masks}));

            return masks[createdMask.id];
        },
        update(id, updater: (mask: Mask) => void) {
            const masks = get().masks;
            const mask = masks[id];
            if (!mask) return;
            const updateMask = {...mask};
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
    })
);
