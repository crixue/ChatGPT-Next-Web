import {create} from "zustand";
import {BUILTIN_MASKS} from "../masks";
import {getLang, Lang} from "../locales";
import {DEFAULT_TOPIC, ChatMessage} from "./chat";
import {ModelConfig, useAppConfig} from "./config";
import {StoreKey} from "../constant";
import {nanoid} from "nanoid";
import {maskApi} from "@/app/client/mask/mask-api";
import {persist} from "zustand/middleware";

export type Mask = {
    id: string;
    createdAt: number;
    avatar: string;
    name: string;
    hideContext?: boolean;
    isChineseText?: boolean;
    haveContext?: boolean;
    promptId?: string,
    promptPath?: string,
    context: ChatMessage[];
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
    create: (mask?: Partial<Mask>) => Mask;
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
        promptId: "",
        context: [],
        syncGlobalConfig: true, // use global config as default
        modelConfig: {...useAppConfig.getState().modelConfig},
        lang: getLang(),
        builtin: false,
        createdAt: Date.now(),
    } as Mask);

export const useMaskStore = create<MaskStore>()(
    persist(
        (set, get) => ({
            // ...DEFAULT_MASK_STATE,
            masks: {} as Record<string, Mask>,
            async initMasks() {
                const masks = get().masks;
                const allMasks = await maskApi.getAllMasks();
                allMasks.forEach((m) => {
                    const modelConfigJsonStr = m.modelConfigJsonStr;
                    if(modelConfigJsonStr) {
                        m.modelConfig = JSON.parse(modelConfigJsonStr);
                    }
                    masks[m.id] = m;
                });
                set(() => ({masks}));
            },
            create(mask) {
                const masks = get().masks;
                const id = mask?.id ?? nanoid(6);
                masks[id] = {
                    ...createEmptyMask(),
                    ...mask,
                    builtin: false,
                };

                set(() => ({masks}));

                return masks[id];
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
                const userMasks = Object.values(get().masks).sort(
                    (a, b) => b.createdAt - a.createdAt,
                );
                return userMasks;
                // const userMasks = Object.values(get().masks).sort(
                //     (a, b) => b.createdAt - a.createdAt,
                // );
                // const config = useAppConfig.getState();
                // if (config.hideBuiltinMasks) return userMasks;
                // const buildinMasks = BUILTIN_MASKS.map(
                //     (m) =>
                //         ({
                //             ...m,
                //             modelConfig: {
                //                 ...config.modelConfig,
                //                 ...m.modelConfig,
                //             },
                //         } as Mask),
                // );
                // return userMasks.concat(buildinMasks);
            },
            search(text) {
                return Object.values(get().masks);
            },
        }),
        {
            name: StoreKey.Mask,
        }
    ),
);
