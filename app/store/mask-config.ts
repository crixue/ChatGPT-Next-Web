import {create} from "zustand";
import {Mask} from "@/app/store/mask";

export type MaskConfigStore = {
    maskConfig?: Mask;
    setMaskConfig: (mask: Mask) => void;
}

export const useMaskConfigStore = create<MaskConfigStore>((set, get) => ({
    maskConfig: undefined,
    setMaskConfig(mask) {
        set(() => ({maskConfig: mask}));
    }
}))

