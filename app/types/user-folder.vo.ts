


export interface UserFolderVO {

    id: string;
    createdUserId: string;
    folderName: string;
    folderType: string;
    folderDesc?: string;
    updateAt?: number;
}


export interface UserFolderCreateReqVO {

    userId?: string;
    folderName: string;
    folderDesc?: string;
    folderType: 'PROMPT_FOLDER' | 'LOCAL_VECTOR_STORE_FOLDER';
    requiredPermissions?: Permission[];
}


export interface Permission {

    permissionId: number;
    name?: string;
    description?: string;

}