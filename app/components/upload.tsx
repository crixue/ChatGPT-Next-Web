import React, {useEffect, useState} from 'react';
import {
    Upload,
    Button,
    Spin,
    notification,
    UploadProps,
    UploadFile,
    Radio,
    Form,
    Space,
    Card,
    Col,
    InputNumber
} from 'antd';
import {InboxOutlined, LoadingOutlined, MinusCircleOutlined, PlusOutlined} from '@ant-design/icons';
import Dragger from "antd/es/upload/Dragger";
import {UploadApi} from "@/app/client/upload";
import {RcFile} from "antd/es/upload";
import {useUploadFileStore} from "@/app/store/upload-file";
import {isAVFileType} from "@/app/utils/common-util";
import TextArea from "antd/es/input/TextArea";
import styles from "./upload.module.scss";
import {MakeLocalVSConfig} from "@/app/types/mask-vo";
import {CustomListItem} from "@/app/components/ui-lib";
import Locale from "@/app/locales";

export type CustomUploadFile = UploadFile & {
    taskId?: string;
    uploadType?: 'DEFAULT' | 'AUDIO_OR_VIDEO'
}

const uploadService = new UploadApi();

export const UploadPage = (props: {
    uploadFolderId: string;
}) => {
    const uploadFileStore = useUploadFileStore();
    const fileList = uploadFileStore.uploadFileList;
    const setFileList = uploadFileStore.setUploadFileList;
    const setPlainTextItems = uploadFileStore.setUploadPlainTextItems;
    const selectedLang = uploadFileStore.selectedLang;
    const setSelectedLang = uploadFileStore.setSelectedLang;
    const makeLocalVSConfig = uploadFileStore.makeLocalVSConfig;
    const setMakeLocalVSConfig = uploadFileStore.setMakeLocalVSConfig;

    const [notify, contextHolder] = notification.useNotification();
    const [uploading, setUploading] = useState<boolean>(false);

    const handleUploadChange: UploadProps['onChange'] = ((info) => {
        // console.log('handleUploadChange:', info.file);
        const status = info.file.status;
        const fileName = info.file.name;
        if (status === 'uploading') {
            // console.log(info.file, info.fileList);
            setFileList(info.fileList);
        }
        if (status === 'done') {
            // console.log(info.file, info.fileList);
            setFileList(info.fileList);
        } else if (status === 'error') {
            // console.log(info.file, info.fileList);
            setFileList(info.fileList);
        }
    });

    const handleOnUploadRemove: UploadProps['onRemove'] = (file) => {
        if (file.status !== 'done') {
            setFileList(fileList.filter((item) => item.uid !== file.uid));
            notify['success']({
                message: `${file.name} ${Locale.MakeLocalVSStore.Upload.RemoveSuccess}`,
            });
            return true;
        }
        const response = file.response;
        uploadService.removeUploadFile({
            folderId: props.uploadFolderId,
            fileName: file.name,
            uploadType: response.uploadType ?? 'DEFAULT',
            taskId: response.taskId,
        }).then((result) => {
            // console.log('removeUploadFile:', result);
            setFileList(fileList.filter((item) => item.uid !== file.uid));
            notify['success']({
                message: `${file.name} ${Locale.MakeLocalVSStore.Upload.RemoveSuccess}`,
            });
        }).catch((error) => {
            // console.log('removeUploadFile:', error);
            notify['error']({
                message: `${file.name} ${Locale.MakeLocalVSStore.Upload.RemoveFailed}`,
            });
        });
    }

    const handleUpload: UploadProps['customRequest'] = (option) => {
        const file = option.file as RcFile;
        const uid = (fileList.length + 1).toString();

        const uploadItem = {
            uid: uid,
            fileName: file.name,
            status: 'uploading',
            originFileObj: file,
        } as CustomUploadFile;
        // @ts-ignore
        option.onProgress({percent: 20});
        setUploading(true);
        if (isAVFileType(file.type)) {  //上传音视频文件
            uploadService.uploadAVFileAndDoSpeechRecognition(file, {
                folderId: props.uploadFolderId,
                language: selectedLang,
            }).then((result) => {
                const responseResult = {
                    "uploadType": "AUDIO_OR_VIDEO",
                    "taskId": result
                }
                // @ts-ignore
                option.onSuccess(responseResult, uploadItem);
                notify['success']({
                    message: `${file.name} ${Locale.MakeLocalVSStore.Upload.UploadFileSuccess}`,
                });
            }).catch((error) => {
                // @ts-ignore
                option.onError(Locale.MakeLocalVSStore.Upload.UploadFileFailed, file);
                const errInfo = JSON.parse(error.message);
                if(errInfo.code === 63002) {
                    notify['error']({
                        message: `${Locale.MakeLocalVSStore.Upload.DoNotUploadSameFile}：${file.name}`,
                    });
                    return;
                }
                notify['error']({
                    message: `${file.name} ${Locale.MakeLocalVSStore.Upload.UploadFileFailed}`,
                });
            }).finally(() => {
                setUploading(false);
            });
            return;
        }

        //上传非音视频文件
        uploadService.upload(file, props.uploadFolderId).then((result) => {
            const responseResult = {
                "uploadType": "DEFAULT",
                "filePath": result
            }
            // onSuccess的回调参数可以在 uploadItem.response 中获取
            // @ts-ignore
            option.onSuccess(responseResult, uploadItem);
            notify['success']({
                message: `${file.name} ${Locale.MakeLocalVSStore.Upload.UploadFileSuccess}`,
            });
        }).catch((error) => {
            // @ts-ignore
            option.onError(Locale.MakeLocalVSStore.Upload.UploadFileFailed, file);
            const errInfo = JSON.parse(error.message);
            if(errInfo.code === 63002) {
                notify['error']({
                    message: `${Locale.MakeLocalVSStore.Upload.DoNotUploadSameFile}：${file.name}`,
                });
                return;
            }
            notify['error']({
                message: `${file.name} ${Locale.MakeLocalVSStore.Upload.UploadFileFailed}`,
            });
        }).finally(() => {
            setUploading(false);
        });

    };

    const formItemLayout = {
        labelCol: {
            xs: { span: 24 },
            sm: { span: 2 },
        },
        wrapperCol: {
            xs: { span: 24 },
            sm: { span: 22 },
        },
    };

    const formItemLayoutWithOutLabel = {
        wrapperCol: {
            xs: { span: 24, offset: 0 },
            sm: { span: 22, offset: 2 },
        },
    };

    const [isSimpleConfig, setIsSimpleConfig] = useState<boolean>(true);

    const onChunkSizeChange = (value: number | null) => {
        if (value === null) {
            return;
        }
        if (selectedLang === 'zh') {
            setMakeLocalVSConfig({
                ...makeLocalVSConfig,
                cnChunkSize: value
            });
        } else if (selectedLang === 'en') {
            setMakeLocalVSConfig({
                ...makeLocalVSConfig,
                enChunkSize: value
            });
        }
    }

    const onChunkOverlapChange = (value: number | null) => {
        if (value === null) {
            return;
        }
        if (selectedLang === 'zh') {
            setMakeLocalVSConfig({
                ...makeLocalVSConfig,
                cnChunkOverlap: value
            });
        } else if (selectedLang === 'en') {
            setMakeLocalVSConfig({
                ...makeLocalVSConfig,
                enChunkOverlap: value
            });
        }
    }

    return (
        <div>
            {contextHolder}
            <div>
                <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                    <Card
                        title={Locale.MakeLocalVSStore.Upload.Config}
                        extra={<Button type="link" onClick={() => {
                            setIsSimpleConfig(!isSimpleConfig);
                        }}>
                                {isSimpleConfig ? Locale.MakeLocalVSStore.Upload.TriggerAdvancedConfig : Locale.MakeLocalVSStore.Upload.TriggerSimpleConfig}
                            </Button>}
                        size={"small"}>
                        <div className={styles["card-item"]}>
                            <Radio.Group value={selectedLang} onChange={e => {
                                setSelectedLang(e.target.value)
                            }}>
                                <Radio value={"zh"}>{Locale.MakeLocalVSStore.Upload.Chinese}</Radio>
                                <Radio value={"en"}>{Locale.MakeLocalVSStore.Upload.English}</Radio>
                            </Radio.Group>
                        </div>
                        {!isSimpleConfig && (
                            <>
                                <CustomListItem
                                    title={Locale.MakeLocalVSStore.Upload.ChunkSizeTitle}
                                    subTitle={Locale.MakeLocalVSStore.Upload.ChunkSizeDesc}
                                    className={styles["card-item"]}
                                >
                                    <Col span={4}>
                                        <InputNumber
                                            min={50}
                                            max={800} // lets limit it to 0-1
                                            step={50}
                                            style={{margin: '0 4px'}}
                                            value={selectedLang === 'zh' ? makeLocalVSConfig.cnChunkSize : makeLocalVSConfig.enChunkSize}
                                            onChange={onChunkSizeChange}
                                        />
                                    </Col>
                                </CustomListItem>
                                <CustomListItem
                                    title={Locale.MakeLocalVSStore.Upload.ChunkOverlapTitle}
                                    subTitle={Locale.MakeLocalVSStore.Upload.ChunkOverlapDesc}
                                    className={styles["card-item"]}
                                >
                                    <Col span={4}>
                                        <InputNumber
                                            min={0}
                                            max={50} // lets limit it to 0-1
                                            step={10}
                                            style={{margin: '0 4px'}}
                                            value={selectedLang === 'zh' ? makeLocalVSConfig.cnChunkOverlap : makeLocalVSConfig.enChunkOverlap}
                                            onChange={onChunkOverlapChange}
                                        />
                                    </Col>
                                </CustomListItem>
                            </>)
                        }
                    </Card>
                    <Card
                        title={Locale.MakeLocalVSStore.Upload.UploadFileCardTitle}
                        size={"small"}>
                        <Dragger
                            name="upload-file"
                            multiple={true}
                            fileList={fileList}
                            onChange={handleUploadChange}
                            onRemove={handleOnUploadRemove}
                            customRequest={handleUpload}
                        >
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined />
                            </p>
                            <p className="ant-upload-text">
                                <p style={{fontSize: "13px"}}>{Locale.MakeLocalVSStore.Upload.SupportedFileTypeTip}</p>
                                <p>{Locale.MakeLocalVSStore.Upload.UploadFileTip}</p>
                            </p>
                        </Dragger>
                    </Card>
                    {/*<Card title={"上传文本内容"} size={"small"}>*/}
                    {/*    <Form*/}
                    {/*        name={"dynamic_form_plain_text_items"}*/}
                    {/*        onFinish={(values) => {*/}
                    {/*            console.log('Received values of form:', values);*/}
                    {/*        }}*/}
                    {/*        onValuesChange={(changedValues, allValues) => {*/}
                    {/*            // console.log('onValuesChange:', changedValues, allValues);*/}
                    {/*            setPlainTextItems(allValues.plain_text_items.filter((item: string) =>*/}
                    {/*                item !== undefined && item.trim() !== ''));*/}
                    {/*        }}*/}
                    {/*    >*/}
                    {/*        <Form.List name="plain_text_items">*/}
                    {/*            {(fields, { add, remove }) => (*/}
                    {/*                <>*/}
                    {/*                    {fields.map((field, index) => (*/}
                    {/*                        <Form.Item*/}
                    {/*                            {...(index === 0 ? formItemLayout : formItemLayoutWithOutLabel)}*/}
                    {/*                            label={index === 0 ? '文本内容：' : ''}*/}
                    {/*                            required={false}*/}
                    {/*                            key={field.key}*/}
                    {/*                        >*/}
                    {/*                            <Form.Item*/}
                    {/*                                {...field}*/}
                    {/*                                validateTrigger={['onChange', 'onBlur']}*/}
                    {/*                                rules={*/}
                    {/*                                    [*/}
                    {/*                                        {*/}
                    {/*                                            required: true,*/}
                    {/*                                            message: '请输入内容',*/}
                    {/*                                        },*/}
                    {/*                                        {*/}
                    {/*                                            max: 4096,*/}
                    {/*                                            message: '内容长度不能超过4096',*/}
                    {/*                                        }*/}
                    {/*                                    ]*/}
                    {/*                                }*/}
                    {/*                                noStyle*/}
                    {/*                            >*/}
                    {/*                                <TextArea*/}
                    {/*                                    placeholder="请输入内容"*/}
                    {/*                                    autoSize={{ minRows: 3, maxRows: 5 }}*/}
                    {/*                                    style={{ width: '90%' }}*/}
                    {/*                                />*/}
                    {/*                            </Form.Item>*/}
                    {/*                            <MinusCircleOutlined*/}
                    {/*                                className={styles["dynamic-delete-button"]}*/}
                    {/*                                onClick={() => remove(field.name)}*/}
                    {/*                            />*/}
                    {/*                        </Form.Item>*/}
                    {/*                    ))}*/}
                    {/*                    <Form.Item>*/}
                    {/*                        <Button*/}
                    {/*                            type="dashed"*/}
                    {/*                            onClick={() => add()}*/}
                    {/*                            icon={<PlusOutlined />}*/}
                    {/*                        >*/}
                    {/*                            添加新文本*/}
                    {/*                        </Button>*/}
                    {/*                    </Form.Item>*/}
                    {/*                </>*/}
                    {/*            )}*/}
                    {/*        </Form.List>*/}
                    {/*    </Form>*/}
                    {/*</Card>*/}
                </Space>
            </div>
        </div>
    );
};

