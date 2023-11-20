import {MakeFolderLocalVSTaskRecordsVO} from "@/app/trypes/make-localvs-vo";
import {MakeLocalVectorStoreApi} from "@/app/client/make-localvs";
import {create} from "zustand";


type MakeLocalVSStore = {
    makeFolderLocalVSTaskRecordsView: MakeFolderLocalVSTaskRecordsVO | null;
    initMakeFolderLocalVSTaskRecordsView: (folderId: string, pageSize?: number) => Promise<void>;
    getMakeFolderLocalVSTaskRecordsView: (folderId: string, pageNum?: number, pageSize?: number) => Promise<void>;
}

const makeLocalVSService = new MakeLocalVectorStoreApi();

export const useMakeLocalVSStore = create<MakeLocalVSStore>((set, get) => ({
    makeFolderLocalVSTaskRecordsView: null,
    async initMakeFolderLocalVSTaskRecordsView(folderId: string, pageSize?: number) {
        await get().getMakeFolderLocalVSTaskRecordsView(folderId, 1, pageSize ?? 10);
    },
    async getMakeFolderLocalVSTaskRecordsView(folderId: string, pageNum?: number, pageSize?: number) {
        const item = await makeLocalVSService.getMakeRecordsByFolderId({
            folderId: folderId,
            pageNum: pageNum,
            pageSize: pageSize,
        });
        set(() => ({
            makeFolderLocalVSTaskRecordsView: item,
        }));
    },
}))