import {
    Alert,
    Badge,
    Button,
    Card,
    Form,
    FormInstance,
    Input,
    notification,
    Popconfirm,
    Select,
    Space,
    Steps,
    Table,
    Tag,
    UploadFile
} from "antd";
import React, {useEffect, useMemo, useState} from "react";
import {UserApiClient} from "@/app/client/user-api";
import {useUserFolderStore} from "@/app/store";
import {UserFolderCreateReqVO, UserFolderUpdateReqVO} from "@/app/types/user-folder-vo";
import Locale from "@/app/locales";
import {IconButton} from "@/app/components/button";
import CloseIcon from "@/app/icons/close.svg";
import {useNavigate} from "react-router-dom";
import styles from "./make-local-vector-store.module.scss";
import {UploadVectorStoreOriFilesPage} from "@/app/components/upload-vector-store-ori-files";
import {useUploadFileStore} from "@/app/store/upload-file";
import {UploadApi} from "@/app/client/upload";
import {MakeLocalVectorStoreApi} from "@/app/client/make-localvs";
import {MakeLocalVectorstoreTaskRecords, MakeLocalVSRequestVO} from "@/app/types/make-localvs-vo";
import {ColumnsType} from "antd/es/table";
import dayjs from "dayjs";
import {useMakeLocalVSStore} from "@/app/store/make-localvs";
import {TablePagination} from "@/app/types/common-type";
import {CheckCircleOutlined, CloseCircleOutlined, SyncOutlined} from "@ant-design/icons";
import {useGlobalSettingStore} from "@/app/store/global-setting";
import TextArea from "antd/es/input/TextArea";
import {VectorstorePaymentTransactionApi} from "@/app/client/vectorestore-payment-transaction-api";
import {GlobalLoading} from "@/app/components/global";

const userService = new UserApiClient();
const uploadService = new UploadApi();
const makeLocalVSService = new MakeLocalVectorStoreApi();
const vectorstorePaymentTransactionApi = new VectorstorePaymentTransactionApi();

export const useInitUserFolders = (reload: Boolean | undefined) => {
    useEffect(() => {
        (async () => {
            await useUserFolderStore.getState().initUserLocalVSFolders();
        })();
    }, [reload]);
}


/**
 * 有以下步骤：
 * 1. （创建）选择需要上传的文件夹名称
 * 2. 上传 DEFAULT, CONTENT_STRING, URL, SPEECH_RECOGNIZE_TRANSCRIPT 几种类型的文件， 确认开始制作
 * 3. 制作完成后，显示制作结果
 * @constructor
 */
export const MakeLocalVectorStorePage = () => {
    useInitUserFolders(true);

    const [current, setCurrent] = useState(0);
    const [nextBtnDisabled, setNextBtnDisabled] = useState(false);
    const navigate = useNavigate();
    const [notify, contextHolder] = notification.useNotification();
    const [fstStepForm] = Form.useForm();
    const fstFormFolderName = Form.useWatch("folderName", fstStepForm);
    const globalSettingStore = useGlobalSettingStore();

    const userFolderStore = useUserFolderStore();
    const currentSelectedFolder = userFolderStore.currentSelectedFolder;
    const currentSelectedFolderId = currentSelectedFolder?.id;

    const uploadFileStore = useUploadFileStore();
    const haveUploadFileList: UploadFile<any>[] = uploadFileStore.uploadFileList.filter((item) => item.status === 'done');
    const haveUploadFileListLength = haveUploadFileList.length;
    const haveAddedPlainTextItems: string[] = uploadFileStore.uploadPlainTextItems.filter(item => item !== undefined && item.trim() !== "");
    const haveAddedPlainTextItemsLength = haveAddedPlainTextItems.length;
    const selectedLang = uploadFileStore.selectedLang;

    const [showLoading, setShowLoading] = useState<boolean>(false);
    const [currentProductId, setCurrentProductId] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (current == 0 && (!fstFormFolderName || fstFormFolderName === "")) {
            setNextBtnDisabled(true);
        } else if (current == 0) {
            setNextBtnDisabled(false);
        } else if (current == 1 && (haveUploadFileListLength == 0 && haveAddedPlainTextItemsLength == 0)) {
            setNextBtnDisabled(true);
        } else if (current == 1) {
            setNextBtnDisabled(false);
        }
    }, [current, currentSelectedFolderId, haveUploadFileListLength, haveAddedPlainTextItemsLength, fstFormFolderName])

    const next = () => {
        setCurrent(current + 1);
    };

    const prev = () => {
        setCurrent(current - 1);
    };

    const steps = [
        {
            title: Locale.MakeLocalVSStore.Steps.FirstStep.Title,
            description: Locale.MakeLocalVSStore.Steps.FirstStep.Descriptions,
            content: <UserFolderSelection
                form={fstStepForm}
                uploadFolderId={currentSelectedFolderId ?? ""}/>,
        },
        {
            title: Locale.MakeLocalVSStore.Steps.SecondStep.Title,
            description: Locale.MakeLocalVSStore.Steps.SecondStep.Descriptions,
            content: <UploadVectorStoreOriFilesPage
                uploadFolderId={currentSelectedFolderId ?? ""}
                currentUserProductId={currentProductId}
            />,
        },
        {
            title: Locale.MakeLocalVSStore.Steps.ThirdStep.Title,
            description: Locale.MakeLocalVSStore.Steps.ThirdStep.Descriptions,
            content: <MakeLocalVectorTaskRecordsView
                showCardTitle={Locale.MakeLocalVSStore.Steps.ThirdStep.CardTitle}
                uploadFolderId={currentSelectedFolderId ?? ""}/>,
        },
    ];

    const handleSubmitFstForm = async () => {
        // create or Update?
        const isUpdate = currentSelectedFolder !== null;

        try {
            const currentUserVSOrder = await vectorstorePaymentTransactionApi.createAnDefaultFreeVectorstoreOrder();
            setCurrentProductId(currentUserVSOrder.productId);
        } catch (e: any) {
            console.log("[handleSubmitFstForm] create default free vs order failed:", e);
        }

        const values: { folderName: string, folderDesc?: string } = fstStepForm.getFieldsValue();
        if (isUpdate) {
            // check if need update first
            const needUpdate = currentSelectedFolder?.folderName !== values.folderName || currentSelectedFolder?.folderDesc !== values?.folderDesc;
            if (!needUpdate) {
                return
            }

            const userFolderUpdateRequest: UserFolderUpdateReqVO = {
                id: currentSelectedFolder?.id ?? "",
                folderName: values.folderName,
                folderDesc: values.folderDesc,
                folderType: "LOCAL_VECTOR_STORE_FOLDER",
            }
            try {
                const respItem = await userService.updateFolder(userFolderUpdateRequest);
                const userFolders = userFolderStore.userFolders;
                const index = userFolders.findIndex((item) => item.id === respItem.id);
                if (index !== -1) {
                    userFolders[index] = respItem;
                    userFolderStore.setUserFolders(userFolders);
                }
                fstStepForm.resetFields();
                userFolderStore.setCurrentSelectedFolder(respItem);
                notify['success']({
                    message: `${Locale.LocalVectorStoreName} ${respItem.folderName} ${Locale.Common.UpdateSuccess}`,
                });
            } catch (e: any) {
                console.log(e);
                const errInfo = JSON.parse(e.message);
                userFolderStore.setCurrentSelectedFolder(null);
                notify['error']({
                    message: Locale.Common.OperateFailed,
                });
            }

            return;
        }

        const userFolderCreateRequest: UserFolderCreateReqVO = {
            folderName: values.folderName,
            folderDesc: values.folderDesc,
            folderType: "LOCAL_VECTOR_STORE_FOLDER",
            requiredPermissions: [  //这里暂时写死默认的读写权限
                {
                    permissionId: 636,
                    name: "default_folder_read",
                },
                {
                    permissionId: 637,
                    name: "default_folder_write",
                }
            ]
        }

        try {
            const respItem = await userService.createFolder(userFolderCreateRequest);
            const userFolders = userFolderStore.userFolders;
            userFolderStore.setUserFolders([respItem, ...userFolders]);
            fstStepForm.resetFields();
            userFolderStore.setCurrentSelectedFolder(respItem);
            notify['success']({
                message: `${Locale.LocalVectorStoreName} ${respItem.folderName} ${Locale.Common.CreateSuccess}`,
            });
        } catch (e: any) {
            console.log(e);
            const errInfo = JSON.parse(e.message);
            if (errInfo.code === 62001) {
                notify['error']({
                    message: `${Locale.LocalVectorStoreName} ${values.folderName} ${Locale.MakeLocalVSStore.LocalVSFolderNameHaveExisted}`,
                });
                return;
            }
            userFolderStore.setCurrentSelectedFolder(null);
            notify['error']({
                message: Locale.Common.OperateFailed,
            });
        }
        return;
    }

    const start2Make = async () => {
        setShowLoading(true);
        const makeLocalVSConfig = uploadFileStore.makeLocalVSConfig;

        let makeLocalVSRequests: MakeLocalVSRequestVO[] = [];
        const speechRecognizeTaskIds: string[] = [];
        if (haveAddedPlainTextItems.length > 0) {
            const savedServerPaths = await uploadService.uploadPlainTextFile({
                folderId: currentSelectedFolderId ?? "",
                plainTextList: haveAddedPlainTextItems
            });
            for (const savedServerPath of savedServerPaths) {
                const item = {
                    makeLocalVSType: "DEFAULT",
                    isChineseText: selectedLang === "zh",
                    userFolderId: currentSelectedFolderId ?? "",
                    localVSFolderName: currentSelectedFolder?.folderName,
                    oriFilePath: savedServerPath,
                    makeVsConfig: makeLocalVSConfig
                } as MakeLocalVSRequestVO;
                makeLocalVSRequests.push(item);
            }
        }
        for (const haveUploadFile of haveUploadFileList) {
            const resp = haveUploadFile.response;
            if (resp === undefined) {
                continue;
            }
            if (resp.uploadType === "DEFAULT") {
                const item = {
                    makeLocalVSType: "DEFAULT",
                    isChineseText: selectedLang === "zh",
                    userFolderId: currentSelectedFolderId ?? "",
                    localVSFolderName: currentSelectedFolder?.folderName,
                    oriFilePath: resp.filePath,
                    makeVsConfig: makeLocalVSConfig
                } as MakeLocalVSRequestVO;
                makeLocalVSRequests.push(item);
            } else if (resp.uploadType === "AUDIO_OR_VIDEO") {
                const item = {
                    makeLocalVSType: "SPEECH_RECOGNIZE_TRANSCRIPT",
                    isChineseText: selectedLang === "zh",
                    userFolderId: currentSelectedFolderId ?? "",
                    localVSFolderName: currentSelectedFolder?.folderName,
                    referSpeechRecognizeTaskId: resp.taskId,
                    makeVsConfig: makeLocalVSConfig
                } as MakeLocalVSRequestVO;
                makeLocalVSRequests.push(item);
                speechRecognizeTaskIds.push(resp.taskId);
            }
        }

        try {
            await makeLocalVSService.doMakeLocalVS(makeLocalVSRequests);
            if (speechRecognizeTaskIds.length > 0) {
                await makeLocalVSService.executeSpeechRecognize({speechRecognizeTaskIds});
            }
            next();
        } catch (e) {
            console.log(e);
            notify['error']({
                message: Locale.Common.OperateFailed,
            });
        } finally {
            setShowLoading(false);
        }
    }

    const reset = () => {
        setCurrent(0);
        uploadFileStore.clearUploadFiles();
    }

    return (
        <>
            {contextHolder}
            <GlobalLoading showLoading={showLoading}/>
            <div className="window-header" data-tauri-drag-region>
                <div className="window-header-title">
                    <div className="window-header-main-title">
                        {Locale.MakeLocalVSStore.Title}
                    </div>
                    <div className="window-header-sub-title">
                        {Locale.MakeLocalVSStore.SubTitle}
                    </div>
                </div>
                <div className="window-actions">
                    <div className="window-action-button"></div>
                    <div className="window-action-button"></div>
                    <div className="window-action-button">
                        <IconButton
                            icon={<CloseIcon/>}
                            onClick={() => navigate(-1)}
                            bordered
                        />
                    </div>
                </div>
            </div>
            <div className={styles["local-vs-container"]}>
                <Steps
                    style={{marginBottom: '40px'}}
                    current={current}
                    items={steps}
                />
                <div className={styles['local-vs-item']}>
                    {steps[current].content}
                </div>
                <div className={styles["step-btns"]}>
                    {current === 0 && (
                        <Button
                            disabled={nextBtnDisabled}
                            type="primary"
                            onClick={() => {
                                handleSubmitFstForm().then(() => {
                                    next();
                                });
                            }}>
                            {Locale.MakeLocalVSStore.Steps.NextStep}
                        </Button>
                    )}
                    {current === 1 && (
                        <Button
                            disabled={nextBtnDisabled}
                            onClick={start2Make}
                            type="primary">
                            {Locale.MakeLocalVSStore.Steps.NextStep}
                        </Button>
                    )}
                    {current === steps.length - 1 && (
                        <>
                            <Button
                                type="primary"
                                onClick={() => {
                                    reset();
                                    navigate(-1);
                                }
                                }
                            >
                                {Locale.Common.Complete}
                            </Button>
                            <Button
                                style={{margin: '0 8px'}}
                                onClick={() => {
                                    reset();
                                }}>
                                {Locale.MakeLocalVSStore.Steps.ContinueToMake}
                            </Button>
                        </>
                    )}
                    {current > 0 && current <= 1 && (
                        <Button style={{margin: '0 8px'}} onClick={() => prev()}>
                            {Locale.MakeLocalVSStore.Steps.PreviousStep}
                        </Button>
                    )}
                </div>
            </div>
        </>
    )
}

const UserFolderSelection = (props: {
    form: FormInstance<any>;
    uploadFolderId?: string;
}) => {
    const form = props.form;
    const userFolderStore = useUserFolderStore();
    const userFolders = userFolderStore.userFolders;
    const currentSelectedFolder = userFolderStore.currentSelectedFolder;
    const setCurrentSelectedFolder = userFolderStore.setCurrentSelectedFolder;

    const [formData, setFormData] = useState<any | undefined>(undefined);
    const [notify, contextHolder] = notification.useNotification();


    useMemo(() => {
        if (currentSelectedFolder !== null) {
            form.setFieldsValue({
                folderName: currentSelectedFolder.folderName,
                folderDesc: currentSelectedFolder.folderDesc,
            });
        } else {
            form.resetFields();
        }
    }, [formData, currentSelectedFolder]);

    const createNewOption = {
        label: Locale.MakeLocalVSStore.CreateNewLocalVS,
        value: '-1',
    };

    let defaultOption = createNewOption;
    if (currentSelectedFolder !== null) {
        defaultOption = {
            label: currentSelectedFolder.folderName,
            value: currentSelectedFolder.id,
        };
    }

    const allOptions = [
        createNewOption,
        ...userFolders.map((userFolder) => ({
            label: userFolder.folderName,
            value: userFolder.id,
        }))
    ];

    const handleChange = (selectedId: string) => {
        if (selectedId === '-1') {
            setCurrentSelectedFolder(null);
            return;
        }
        for (const userFolder of userFolders) {
            if (userFolder.id === selectedId) {
                setCurrentSelectedFolder(userFolder);
                return;
            }
        }
    };

    return (
        <>
            {contextHolder}
            <Space direction="vertical" size="middle" style={{display: 'flex'}}>
                <Card
                    title={Locale.MakeLocalVSStore.Steps.FirstStep.CardTitle}
                    size={"small"}>
                    <Form
                        labelCol={{span: 6}}
                        // wrapperCol={{span: 18 }}
                        layout="vertical"
                        form={form}
                        style={{padding: "20px"}}
                    >
                        <Form.Item
                            label={Locale.MakeLocalVSStore.SelectLocalVS}>
                            <Select
                                placeholder={Locale.MakeLocalVSStore.PleaseChoiceLocalVS}
                                defaultActiveFirstOption={true}
                                defaultValue={defaultOption.value}
                                onChange={handleChange}
                                // style={{ width: 200 }}
                                options={allOptions}
                            />
                        </Form.Item>
                        <Form.Item
                            label={Locale.MakeLocalVSStore.LocalVSName}
                            name="folderName"
                            tooltip={Locale.MakeLocalVSStore.Rules.Rule1}
                            rules={[
                                {
                                    required: true,
                                    message: Locale.MakeLocalVSStore.Rules.PleaseInputLocalVSName
                                },
                                {
                                    pattern: /^[a-zA-Z0-9_-]+([a-zA-Z0-9_ -]*[a-zA-Z0-9_-]+)*$/,
                                    message: Locale.MakeLocalVSStore.Rules.Rule1,
                                },
                            ]}
                        >
                            <Input id={"folderName"} allowClear
                                   placeholder={Locale.MakeLocalVSStore.Rules.PleaseInputLocalVSName}/>
                        </Form.Item>
                        <Form.Item
                            label={Locale.MakeLocalVSStore.LocalVSDesc}
                            name="folderDesc"
                        >
                            <TextArea id={"folderDesc"} allowClear
                                      placeholder={Locale.MakeLocalVSStore.Rules.PleaseInputLocalVSDesc}/>
                        </Form.Item>
                    </Form>
                </Card>
            </Space>
        </>
    )
}

export const MakeLocalVectorTaskRecordsView = (props: {
    uploadFolderId: string;
    showCardTitle?: React.ReactNode;
}) => {

    const [reload, setReload] = useState(false);  // 用于刷新页面
    const makeLocalVSStore = useMakeLocalVSStore();
    // const globalSettingStore = useGlobalSettingStore();

    const [tablePagination, setTablePagination] = useState<TablePagination>({
        current: 1,
        defaultCurrent: 1,
        defaultPageSize: 10,
    });
    const [notify, contextHolder] = notification.useNotification();
    const [showLoading, setShowLoading] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            // globalSettingStore.switchShowGlobalLoading();
            await makeLocalVSStore.initMakeFolderLocalVSTaskRecordsView(props.uploadFolderId);
            // globalSettingStore.switchShowGlobalLoading();
        })();
    }, [reload]);

    useMemo(() => {
        (async () => {
            await makeLocalVSStore.getMakeFolderLocalVSTaskRecordsView(props.uploadFolderId,
                tablePagination.current, tablePagination.defaultPageSize);
        })();
    }, [tablePagination]);

    const resultView = makeLocalVSStore.makeFolderLocalVSTaskRecordsView;
    const totalRecordSize = resultView?.records?.total ?? 0;

    const DeleteItem = ({record}: { record: MakeLocalVectorstoreTaskRecords }) => {
        const handleDelete = (record: MakeLocalVectorstoreTaskRecords) => {
            // globalSettingStore.switchShowGlobalLoading("Deleting...");
            setShowLoading(true);
            makeLocalVSService.deleteIndexInLocalVS(record.id).then((resp) => {
                notify['success']({
                    message: Locale.Common.OperateSuccess,
                });
            }).catch((error) => {
                console.log(error);
                notify['error']({
                    message: Locale.Common.OperateFailed,
                });
            }).finally(() => {
                setReload(!reload);
                setShowLoading(false);
                // globalSettingStore.switchShowGlobalLoading();
            });
        }

        return (
            <div>
                <Popconfirm title={Locale.Common.Confirm} okText={Locale.Common.Confirm}
                            cancelText={Locale.Common.Cancel} onConfirm={() => handleDelete(record)}>
                    <a>{Locale.Common.Delete}</a>
                </Popconfirm>
            </div>
        );
    }

    const columns: ColumnsType<MakeLocalVectorstoreTaskRecords> = [
        {
            title: Locale.MakeLocalVSStore.TaskRecordsColumn.createdAt,
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text, record) => {
                return dayjs(text).format("YYYY-MM-DD HH:mm:ss")
            }
        },
        {
            title: Locale.MakeLocalVSStore.TaskRecordsColumn.id,
            dataIndex: 'id',
            key: 'id',
            ellipsis: true,
        },
        {
            title: Locale.MakeLocalVSStore.TaskRecordsColumn.status,
            dataIndex: 'status',
            key: 'status',
            render: (text, record) => {
                text = Number(text);
                switch (text) {
                    case 0:
                        return (
                            <span>
                                <Tag icon={<SyncOutlined spin/>} color="processing">
                                    {Locale.Common.InProgress}
                                </Tag>
                            </span>
                        )
                    case 1:
                        return (
                            <span>
                                <Tag icon={<SyncOutlined spin/>} color="processing">
                                    {Locale.Common.InProgress}
                                </Tag>
                            </span>
                        )
                    case 100:
                        return (
                            <span>
                                <Tag icon={<CheckCircleOutlined/>} color="success">
                                    {Locale.Common.Success}
                                </Tag>
                            </span>
                        );
                }
                if (text < 0) {
                    return (
                        <span>
                            <Tag icon={<CloseCircleOutlined/>} color="error">
                                {Locale.Common.Failed}
                            </Tag>
                        </span>
                    );
                }
                return text;
            }
        },
        {
            title: Locale.MakeLocalVSStore.TaskRecordsColumn.makeType,
            dataIndex: 'makeType',
            key: 'makeType',
            render: (text, record) => {
                switch (text) {
                    case "DEFAULT":
                        return "默认";
                    case "SPEECH_RECOGNIZE_TRANSCRIPT":
                        return "语音识别";
                }
                return text;
            }
        },
        {
            title: Locale.MakeLocalVSStore.TaskRecordsColumn.fileName,
            dataIndex: 'oriFilePath',
            key: 'fileName',
            width: 200,
            render: (text, record) => {
                if (!text) {
                    return "";
                }
                return text.substring(text.lastIndexOf("/") + 1);
            }
        },
        {
            title: Locale.MakeLocalVSStore.TaskRecordsColumn.action,
            dataIndex: 'action',
            key: 'action',
            render: (_, record) => {
                return <DeleteItem record={record}/>
            }
        },
        // {
        //     title: '错误信息',
        //     dataIndex: 'errInfo',
        //     key: 'errInfo'
        // },
        // {
        //     title: '更新时间',
        //     dataIndex: 'updateAt',
        //     key: 'updateAt',
        //     render: (text, record) => {
        //         return dayjs(text).format("YYYY-MM-DD HH:mm:ss")
        //     }
        // },
    ];

    const RefreshItemBtn = () => {
        return (
            <Button
                type={"link"}
                onClick={() => {
                    setReload(!reload);
                }}
            >
                {Locale.Common.Refresh}
            </Button>
        )
    }

    return (
        <>
            {contextHolder}
            <div>
                <GlobalLoading showLoading={showLoading}/>
                <Card
                    title={props.showCardTitle}
                    extra={<RefreshItemBtn/>}
                >
                    <Alert
                        style={{marginBottom: '24px'}}
                        message={
                            <span>知识库中任务状态为<b>成功</b>的文件的内容才可以被模型被使用到，请您耐心等待知识库制作完成
                        </span>}
                        type="warning"
                        showIcon/>
                    <Table
                        columns={columns}
                        scroll={{x: 800}}
                        pagination={{
                            ...tablePagination,
                            total: totalRecordSize,
                            onChange: (page, pageSize) => {
                                setTablePagination({
                                    ...tablePagination,
                                    current: page,
                                });
                            }
                        }}
                        dataSource={resultView?.records?.list}
                    />

                </Card>
            </div>
        </>
    )
}
