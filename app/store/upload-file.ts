import {create} from "zustand";
import {UploadFile} from "antd";


type UploadFileStore = {
    uploadFileList: UploadFile[];
    uploadPlainTextItems: string[];
    selectedLang: string;
    setUploadFileList: (uploadFileList: UploadFile[]) => void;
    setUploadPlainTextItems: (uploadPlainTextItems: string[]) => void;
    setSelectedLang: (lang: string) => void;
    clearUploadFiles: () => void;
}

export const useUploadFileStore = create<UploadFileStore>((set, get) => ({
    uploadFileList: [],
    uploadPlainTextItems: [],
    selectedLang: "zh",
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
    clearUploadFiles: () => set(() => ({
        uploadFileList: [],
        uploadPlainTextItems: [],
    })),
}))