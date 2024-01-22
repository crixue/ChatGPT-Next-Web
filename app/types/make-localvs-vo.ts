import {PageInfo} from "@/app/types/common-type";


export interface MakeLocalVSRequestVO {
    makeLocalVSType: 'DEFAULT' | 'CONTENT_STRING' | 'URL' | 'SPEECH_RECOGNIZE_TRANSCRIPT';
    isChineseText: boolean;
    userFolderId: string;
    localVSFolderName: string;  // userFolderId 对应的文件夹名称
    referSpeechRecognizeTaskId?: string;
    oriFilePath?: string;
}

export interface MakeLocalVectorstoreTaskRecords {
    id: string;
    makeType: string;
    oriFilePath?: string;
    isChineseText: boolean;
    confirmToMake: boolean;
    userFolderNameId: string;
    localVSFolderName: string;
    // makeVsConfig: string;
    referId?: string;
    status: number;
    createdUserId: string;
    errInfo?: string;
    // docsIndexCount: number;
    createdAt: Date;
    updateAt: Date;
}

export interface MakeFolderLocalVSTaskRecordsVO {
    isAllDone: boolean;
    userFolderNameId: string;
    folderName: string;
    records?: PageInfo<MakeLocalVectorstoreTaskRecords>;
}