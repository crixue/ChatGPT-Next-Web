import {UserFolderVO} from "@/app/trypes/user-folder.vo";
import {UserApi} from "@/app/client/user";
import {create} from "zustand";


const userService = new UserApi();


type UserFolderStore = {
    currentSelectedFolder: UserFolderVO | null;
    userFolders: UserFolderVO[];
    initUserFolders: () => Promise<void>;
    setCurrentSelectedFolder: (folder: UserFolderVO | null) => void;
    setUserFolders: (userFolders: UserFolderVO[]) => void;
}

export const useUserFolderStore = create<UserFolderStore>((set, get) => ({
    currentSelectedFolder: null,
    userFolders: [],
    async initUserFolders() {
        const folders = await userService.getUserCreatedFolders('LOCAL_VECTOR_STORE_FOLDER');
        set(() => ({
            userFolders: folders,
        }));
    },
    setCurrentSelectedFolder(folder: UserFolderVO | null) {
        set(() => ({
            currentSelectedFolder: folder,
        }));
    },
    setUserFolders: (userFolders: UserFolderVO[]) => {
        set(() => ({
            userFolders: userFolders,
        }));
    }
}))
