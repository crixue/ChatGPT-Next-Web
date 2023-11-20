import {Button, Form, Input, notification, Popconfirm, Select, Steps, Table, Tag, UploadFile} from "antd";
import React, {useEffect, useMemo, useState} from "react";
import {UserApi} from "@/app/client/user";
import {useMaskStore, useUserFolderStore} from "@/app/store";
import {UserFolderCreateReqVO, UserFolderVO} from "@/app/trypes/user-folder.vo";
import TextArea from "antd/es/input/TextArea";
import Locale from "@/app/locales";
import {IconButton} from "@/app/components/button";
import CloseIcon from "@/app/icons/close.svg";
import {Path} from "@/app/constant";
import {useNavigate} from "react-router-dom";
import styles from "./make-local-vector-store.module.scss";
import {List} from "@/app/components/ui-lib";
import {UploadPage} from "@/app/components/upload";
import {useUploadFileStore} from "@/app/store/upload-file";
import {UploadApi} from "@/app/client/upload";
import {MakeLocalVectorStoreApi} from "@/app/client/make-localvs";
import {MakeLocalVectorstoreTaskRecords, MakeLocalVSRequestVO} from "@/app/trypes/make-localvs-vo";
import {ColumnsType} from "antd/es/table";
import dayjs from "dayjs";
import {useMakeLocalVSStore} from "@/app/store/make-localvs";
import {TablePagination} from "@/app/trypes/common-type";
import {CheckCircleOutlined, CloseCircleOutlined, SyncOutlined} from "@ant-design/icons";
import {useGlobalSettingStore} from "@/app/store/global-setting";

const userService = new UserApi();
const uploadService = new UploadApi();
const makeLocalVSService = new MakeLocalVectorStoreApi();

const useInitUserFolders = () => {
    useEffect(() => {
        (async () => {
            await useUserFolderStore.getState().initUserFolders();
        })();
    },[]);
}

/**
 * 有以下步骤：
 * 1. （创建）选择需要上传的文件夹名称
 * 2. 上传 DEFAULT, CONTENT_STRING, URL, SPEECH_RECOGNIZE_TRANSCRIPT 几种类型的文件， 确认开始制作
 * 3. 制作完成后，显示制作结果
 * @constructor
 */
export const MakeLocalVectorStorePage = () => {
    useInitUserFolders();

    const [current, setCurrent] = useState(0);
    const [nextBtnDisabled, setNextBtnDisabled] = useState(false);
    const navigate = useNavigate();
    const [notify, contextHolder] = notification.useNotification();

    const globalSettingStore = useGlobalSettingStore();

    const userFolderStore = useUserFolderStore();
    const currentSelectedFolderId = userFolderStore.currentSelectedFolder?.id;

    const uploadFileStore = useUploadFileStore();
    const haveUploadFileList: UploadFile<any>[] = uploadFileStore.uploadFileList.filter((item) => item.status === 'done');
    const haveUploadFileListLength = haveUploadFileList.length;
    const haveAddedPlainTextItems: string[] = uploadFileStore.uploadPlainTextItems.filter(item => item !== undefined && item.trim() !== "");
    const haveAddedPlainTextItemsLength = haveAddedPlainTextItems.length;
    const selectedLang = uploadFileStore.selectedLang;


    useEffect(() => {
        if (current == 0 && !currentSelectedFolderId) {
            setNextBtnDisabled(true);
        } else if(current == 0) {
            setNextBtnDisabled(false);
        } else if(current == 1 && (haveUploadFileListLength == 0 && haveAddedPlainTextItemsLength == 0)) {
            setNextBtnDisabled(true);
        } else if(current == 1) {
            setNextBtnDisabled(false);
        }
    }, [current, currentSelectedFolderId, haveUploadFileListLength, haveAddedPlainTextItemsLength])

    const onChange = (value: number) => {
        // console.log('onChange:', value);
        setCurrent(value);
    };

    const next = () => {
        setCurrent(current + 1);
    };

    const prev = () => {
        setCurrent(current - 1);
    };

    const steps = [
        {
            title: '第一步',
            description: '选择一个知识库',
            content: <UserFolderSelection
                uploadFolderId={currentSelectedFolderId ?? ""}/>,
        },
        {
            title: '第二步',
            description: '上传文件',
            // content: <MakeLocalVectorTaskRecordsView
            //     uploadFolderId={currentSelectedFolderId ?? ""}/>,
            content: <UploadPage
                uploadFolderId={currentSelectedFolderId ?? ""}/>,
        },
        {
            title: '第三步',
            description: '开始制作，查看结果',
            content: <MakeLocalVectorTaskRecordsView
                uploadFolderId={currentSelectedFolderId ?? ""}/>,
        },
    ];

    const start2Make = async () => {
        globalSettingStore.switchShowGlobalLoading();

        let makeLocalVSRequests: MakeLocalVSRequestVO[] = [];
        const speechRecognizeTaskIds: string[] = [];
        if(haveAddedPlainTextItems.length > 0) {
            const savedServerPaths = await uploadService.uploadPlainTextFile({
                folderId: currentSelectedFolderId ?? "",
                plainTextList: haveAddedPlainTextItems
            });
            for (const savedServerPath of savedServerPaths) {
                const item = {
                    makeLocalVSType: "DEFAULT",
                    isChineseText: selectedLang === "zh",
                    userFolderId: currentSelectedFolderId ?? "",
                    localVSFolderName: userFolderStore.currentSelectedFolder?.folderName,
                    oriFilePath: savedServerPath,
                } as MakeLocalVSRequestVO;
                makeLocalVSRequests.push(item);
            }
        }
        for(const haveUploadFile of haveUploadFileList) {
            const resp = haveUploadFile.response;
            if (resp === undefined) {
                continue;
            }
            if (resp.uploadType === "DEFAULT") {
                const item = {
                    makeLocalVSType: "DEFAULT",
                    isChineseText: selectedLang === "zh",
                    userFolderId: currentSelectedFolderId ?? "",
                    localVSFolderName: userFolderStore.currentSelectedFolder?.folderName,
                    oriFilePath: resp.filePath,
                } as MakeLocalVSRequestVO;
                makeLocalVSRequests.push(item);
            } else if (resp.uploadType === "AUDIO_OR_VIDEO") {
                const item = {
                    makeLocalVSType: "SPEECH_RECOGNIZE_TRANSCRIPT",
                    isChineseText: selectedLang === "zh",
                    userFolderId: currentSelectedFolderId ?? "",
                    localVSFolderName: userFolderStore.currentSelectedFolder?.folderName,
                    referSpeechRecognizeTaskId: resp.taskId,
                } as MakeLocalVSRequestVO;
                makeLocalVSRequests.push(item);
                speechRecognizeTaskIds.push(resp.taskId);
            }
        }

        makeLocalVSService.doMakeLocalVS(makeLocalVSRequests).then((resp) => {
            makeLocalVSService.executeSpeechRecognize({speechRecognizeTaskIds});
            next();
        }).catch((error) => {
            console.log(error);
            notify['error']({
                message: `操作失败，请稍后重试`,
            });
        }).finally(() => {
            globalSettingStore.switchShowGlobalLoading();
        });
    }

    const reset = () => {
        setCurrent(0);
        uploadFileStore.clearUploadFiles();
    }

    return (
        <>
            {contextHolder}
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
                            onClick={() => navigate(Path.Home)}
                            bordered
                        />
                    </div>
                </div>
            </div>
            <div className={styles["local-vs-container"]}>
                <Steps
                    style={{paddingBottom: '24px'}}
                    current={current}
                    onChange={onChange}
                    items={steps}
                />
                <List>
                    <div className={styles['local-vs-item']}>
                        {steps[current].content}
                    </div>
                </List>
                <div className={styles["step-btns"]}>
                    {current === 0 && (
                        <Button
                            disabled={nextBtnDisabled}
                            type="primary"
                            onClick={() => next()}>
                            下一步
                        </Button>
                    )}
                    {current === 1 && (
                            <Button
                                disabled={nextBtnDisabled}
                                onClick={start2Make}
                                type="primary">
                                下一步
                            </Button>
                    )}
                    {current === steps.length - 1 && (
                        <>
                            <Button
                                type="primary"

                            >
                                完成
                            </Button>
                            <Button
                                style={{ margin: '0 8px' }}
                                onClick={() => {
                                    reset();
                                }}>
                                继续制作
                            </Button>
                        </>
                    )}
                    {current <= 1 && (
                        <Button style={{ margin: '0 8px' }} onClick={() => prev()}>
                            上一步
                        </Button>
                    )}
                </div>
            </div>
        </>
    )
}

const UserFolderSelection = (props: {
    uploadFolderId?: string;
}) => {
    const userFolderStore = useUserFolderStore();
    const userFolders = userFolderStore.userFolders;
    const selectedFolder = userFolderStore.currentSelectedFolder;
    const setSelectedFolder = userFolderStore.setCurrentSelectedFolder;

    const [form] = Form.useForm();
    const [notify, contextHolder] = notification.useNotification();

    const createNewOption = {
        label: '新建文件夹',
        value: '-1',
    };
    const allOptions = [
        createNewOption,
        ...userFolders.map((userFolder) => ({
            label: userFolder.folderName,
            value: userFolder.id,
        }))
    ];
    const [defaultValue, setDefaultValue] = useState<string>(props.uploadFolderId === '' ?
        createNewOption.value :
        allOptions.filter((item) => item.value === props.uploadFolderId)[0].value
    );

    const handleChange = (selectedId: string) => {
        if (selectedId === '-1') {
            setSelectedFolder(null);
            return;
        }
        for (const userFolder of userFolders) {
            if (userFolder.id === selectedId) {
                setSelectedFolder(userFolder);
                return;
            }
        }
    };

    const handleSubmit = async(values:{folderName: string, folderDesc?: string}) => {
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

        userService.createFolder(userFolderCreateRequest)
            .then((respItem) => {
                userFolderStore.setUserFolders([respItem, ...userFolders]);
                // setDefaultOption(respItem.folderName);
                form.resetFields();
                notify['success']({
                    message: `文件夹 ${respItem.folderName} 创建成功`,
                });
            })
            .catch((error) => {
                console.log(error);
                const errInfo = JSON.parse(error.message);
                if (errInfo.code === 62001) {
                    notify['error']({
                        message: '文件名已存在',
                    });
                    return;
                }
                notify['error']({
                    message: `操作失败，请稍后重试`,
                });
            });
    }

    return (
        <div>
            {contextHolder}
            <Select
                placeholder={"请选择文件夹"}
                defaultActiveFirstOption={true}
                defaultValue={defaultValue}
                onChange={handleChange}
                style={{ width: 200 }}
                options={allOptions}
            >
            </Select>
            {selectedFolder !== null && (
                <div>
                    <div>文件夹名称：{selectedFolder.folderName}</div>
                    <div>文件夹描述：{selectedFolder.folderDesc}</div>
                </div>
            )}
            {selectedFolder === null && (
                <Form
                    form={form}
                    onFinish={handleSubmit}
                    >
                    <Form.Item
                        label="新建文件夹"
                        name="folderName"
                        rules={[
                            {
                                required: true,
                                message: '请输入文件夹名称' },
                            {
                                pattern: /^[a-zA-Z0-9_]+([a-zA-Z0-9_ ]*[a-zA-Z0-9_]+)*$/,
                                message: '请输入空格、字母、数字或下划线组成的字符串',
                            },
                            ]}
                    >
                        <Input id={"folderName"} allowClear placeholder={"请输入文件夹名称"}/>
                    </Form.Item>
                    <Form.Item
                        label="文件夹描述"
                        name="folderDesc"
                    >
                        <TextArea id={"folderDesc"} allowClear placeholder={"请输入文件夹描述"}/>
                    </Form.Item>
                    <Form.Item
                        wrapperCol={{ offset: 8, span: 16 }}
                    >
                        <Button type="primary" htmlType="submit">
                            确认创建
                        </Button>
                    </Form.Item>
                </Form>
            )}
        </div>
    )
}

export const MakeLocalVectorTaskRecordsView = (props: {
    uploadFolderId: string;
}) => {

    const [reload, setReload] = useState(false);  // 用于刷新页面
    const makeLocalVSStore = useMakeLocalVSStore();
    const [tablePagination, setTablePagination] = useState<TablePagination>({
        current: 1,
        defaultCurrent: 1,
        defaultPageSize: 10,
    });
    const [notify, contextHolder] = notification.useNotification();

    useEffect(() => {
        (async () => {
            await makeLocalVSStore.initMakeFolderLocalVSTaskRecordsView(props.uploadFolderId);
        })();
    },[reload]);

    useMemo(() => {
        (async () => {
            await makeLocalVSStore.getMakeFolderLocalVSTaskRecordsView(props.uploadFolderId,
                tablePagination.current, tablePagination.defaultPageSize);
        })();
    }, [tablePagination]);

    const resultView = makeLocalVSStore.makeFolderLocalVSTaskRecordsView;
    const totalRecordSize = resultView?.records?.total ?? 0;

    const DeleteItem = ({record}: {record: MakeLocalVectorstoreTaskRecords}) => {
        const handleDelete = (record: MakeLocalVectorstoreTaskRecords) => {
            makeLocalVSService.deleteIndexInLocalVS(record.id).then((resp) => {
                notify['success']({
                    message: `删除成功`,
                });
            }).catch((error) => {
                console.log(error);
                notify['error']({
                    message: `操作失败，请稍后重试`,
                });
            }).finally(() => {
                setReload(!reload);
            });
        }

        return (
            <div>
                <Popconfirm title="确认删除？" okText={"确认"} cancelText={"取消"} onConfirm={() => handleDelete(record)}>
                    <a>删除</a>
                </Popconfirm>
            </div>
        );
    }

    const columns: ColumnsType<MakeLocalVectorstoreTaskRecords> = [
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text, record) => {
                return dayjs(text).format("YYYY-MM-DD HH:mm:ss")
            }
        },
        {
            title: '任务ID',
            dataIndex: 'id',
            key: 'id',
            ellipsis: true,
        },
        {
            title: '任务状态',
            dataIndex: 'status',
            key: 'status',
            render: (text, record) => {
                switch (text) {
                    case 0 || 1:
                        return (
                            <span>
                                <Tag icon={<SyncOutlined spin />} color="processing">
                                    处理中
                                </Tag>
                            </span>
                        )
                    case 100:
                        return (
                            <span>
                                <Tag icon={<CheckCircleOutlined />} color="success">
                                    成功
                                </Tag>
                            </span>
                        );
                }
                if (text < 0) {
                    return (
                        <span>
                            <Tag icon={<CloseCircleOutlined />} color="error">
                                失败
                            </Tag>
                        </span>
                    );
                }
                return text;
            }
        },
        {
            title: '制作类型',
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
            title: '文件名称',
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
            title: '操作',
            dataIndex: 'action',
            key: 'action',
            render: (_, record) => {
                return (totalRecordSize <= 1 ? null:
                    <div>
                        <DeleteItem record={record}/>
                    </div>
                )
            }
        },
        // {
        //     title: '保存地址',
        //     dataIndex: 'oriFilePath',
        //     key: 'oriFilePath'
        // },
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

    return (
        <>
            {contextHolder}
            <div>
                <Button
                    onClick={() => {
                        setReload(!reload);
                    }}
                >
                    刷新
                </Button>
            </div>
            <Table
                columns={columns}
                scroll={{ x: 800 }}
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
        </>
    )
}
