import {UserFolderVo} from "@/app/types/user-folder-vo";
import {UserApiClient} from "@/app/client/user-api";
import {create} from "zustand";


const userService = new UserApiClient();


type UserFolderStore = {
    currentSelectedFolder: UserFolderVo | null;
    userFolders: UserFolderVo[];
    initUserLocalVSFolders: () => Promise<void>;
    setCurrentSelectedFolder: (folder: UserFolderVo | null) => void;
    setUserFolders: (userFolders: UserFolderVo[]) => void;
}

export const useUserFolderStore = create<UserFolderStore>((set, get) => ({
    currentSelectedFolder: null,
    userFolders: [],
    async initUserLocalVSFolders() {
        const folders = await userService.getUserCreatedFolders('LOCAL_VECTOR_STORE_FOLDER');
        set(() => ({
            userFolders: folders,
        }));
    },
    setCurrentSelectedFolder(folder: UserFolderVo | null) {
        set(() => ({
            currentSelectedFolder: folder,
        }));
    },
    setUserFolders: (userFolders: UserFolderVo[]) => {
        set(() => ({
            userFolders: userFolders,
        }));
    },
}))
