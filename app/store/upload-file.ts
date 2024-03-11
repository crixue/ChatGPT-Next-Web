import {create} from "zustand";
import {UploadFile} from "antd";
import {MakeLocalVSConfig} from "@/app/types/mask-vo";


type UploadFileStore = {
    uploadFileList: UploadFile[];
    uploadPlainTextItems: string[];
    selectedLang: string;
    makeLocalVSConfig: MakeLocalVSConfig;
    setUploadFileList: (uploadFileList: UploadFile[]) => void;
    setUploadPlainTextItems: (uploadPlainTextItems: string[]) => void;
    setSelectedLang: (lang: string) => void;
    setMakeLocalVSConfig: (makeLocalVSConfig: MakeLocalVSConfig) => void;
    clearUploadFiles: () => void;
}

export const useUploadFileStore = create<UploadFileStore>((set, get) => ({
    uploadFileList: [],
    uploadPlainTextItems: [],
    selectedLang: "zh",
    makeLocalVSConfig: {
        cnChunkSize: 400,
        cnChunkOverlap: 10,
        enChunkSize: 500,
        enChunkOverlap: 10,
    },
    setUploadFileList: (uploadFileList: UploadFile[]) => {
        set(() => ({
            uploadFileList: uploadFileList,
        }));
    },
    setUploadPlainTextItems: (uploadPlainTextItems: string[]) => {
        set(() => ({
            uploadPlainTextItems: uploadPlainTextItems,
        }));
    },
    setSelectedLang: (lang: string) => {
        set(() => ({
            selectedLang: lang,
        }));
    },
    setMakeLocalVSConfig: (makeLocalVSConfig: MakeLocalVSConfig) => {
        set(() => ({
            makeLocalVSConfig: makeLocalVSConfig,
        }));
    },
    clearUploadFiles: () => set(() => ({
        uploadFileList: [],
        uploadPlainTextItems: [],
    })),
}))