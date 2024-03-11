import {create} from "zustand";


type GlobalSettingStore = {
    showGlobalLoading: boolean;
    showGlobalLoadingText: string;
    switchShowGlobalLoading: (loadingText?: string) => void;
}

export const useGlobalSettingStore = create<GlobalSettingStore>((set, get) => ({
        showGlobalLoading: false,
        showGlobalLoadingText: "Loading",
        switchShowGlobalLoading: (loadingText?: string) => {
            set(() => ({
                showGlobalLoading: !get().showGlobalLoading,
                showGlobalLoadingText: loadingText ?? "Loading",
            }));
        }
    })
)