export interface UserFolderVo {
    id: string;
    createdUserId: string;
    folderName: string;
    folderType: string;
    folderDesc?: string ;
    updateAt?: number;
    folderNameElement?: React.ReactNode;
}


export interface UserFolderCreateReqVO {
    userId?: string;
    folderName: string;
    folderDesc?: string;
    folderType: 'PROMPT_FOLDER' | 'LOCAL_VECTOR_STORE_FOLDER';
    requiredPermissions?: Permission[];
    makeKnowledgeBaseTool?: 'LOCAL_VECTOR_STORE' | 'KNOWLEDGE_GRAPH';
}

export interface UserFolderUpdateReqVO extends UserFolderCreateReqVO  {
    id: string;
    status?: number;
}


export interface Permission {
    permissionId: number;
    name?: string;
    description?: string;
}