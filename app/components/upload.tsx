import React, { useState } from 'react';
import {Upload, Button, Spin, notification, UploadProps, UploadFile, Radio, Form} from 'antd';
import {InboxOutlined, LoadingOutlined, MinusCircleOutlined, PlusOutlined} from '@ant-design/icons';
import Dragger from "antd/es/upload/Dragger";
import {UploadApi} from "@/app/client/upload";
import {RcFile} from "antd/es/upload";
import {useUploadFileStore} from "@/app/store/upload-file";
import {isAVFileType} from "@/app/utils/common-util";
import TextArea from "antd/es/input/TextArea";
import styles from "./upload.module.scss";

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
    const selectedLang = uploadFileStore.selectedLang;
    const setFileList = uploadFileStore.setUploadFileList;
    const setPlainTextItems = uploadFileStore.setUploadPlainTextItems;
    const setSelectedLang = uploadFileStore.setSelectedLang;

    const [notify, contextHolder] = notification.useNotification();
    const [uploading, setUploading] = useState<boolean>(false);

    const handleUploadChange: UploadProps['onChange'] = ((info) => {
        console.log('handleUploadChange:', info.file);
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
                message: `${file.name} 文件移除成功`,
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
                message: `${file.name} 文件移除成功`,
            });
        }).catch((error) => {
            // console.log('removeUploadFile:', error);
            notify['error']({
                message: `${file.name} 文件删除失败,请稍后重试`,
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
                    message: `${file.name} 文件上传成功`,
                });
            }).catch((error) => {
                // @ts-ignore
                option.onError("文件上传失败", file);
                const errInfo = JSON.parse(error.message);
                if(errInfo.code === 63002) {
                    notify['error']({
                        message: `请勿重复上传相同文件：${file.name}`,
                    });
                    return;
                }
                notify['error']({
                    message: `${file.name} 文件上传失败`,
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
                message: `${file.name} 文件上传成功`,
            });
        }).catch((error) => {
            // @ts-ignore
            option.onError("文件上传失败", file);
            const errInfo = JSON.parse(error.message);
            if(errInfo.code === 63002) {
                notify['error']({
                    message: `请勿重复上传相同文件：${file.name}`,
                });
                return;
            }
            notify['error']({
                message: `${file.name} 文件上传失败`,
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

    return (
        <div>
            {contextHolder}
            <div>
                <div>
                    <Radio.Group value={selectedLang} onChange={e => {
                        setSelectedLang(e.target.value)
                    }}>
                        <Radio value={"zh"}>中文</Radio>
                        <Radio value={"en"}>英文</Radio>
                    </Radio.Group>
                </div>
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
                    <p className="ant-upload-text">单击或拖动文件到此区域进行上传</p>
                    <p className="ant-upload-hint">
                        支持单次或批量上传。严禁上传公司数据或其他非法的文件!
                    </p>
                </Dragger>
                {/*{uploading && (*/}
                {/*    <div style={{ marginTop: '16px' }}>*/}
                {/*        <Spin indicator={<LoadingOutlined />} />*/}
                {/*        <span style={{ marginLeft: '8px' }}>正在上传...</span>*/}
                {/*    </div>*/}
                {/*)}*/}
            </div>
            <div>
                <Form
                    name={"dynamic_form_plain_text_items"}
                    onFinish={(values) => {
                        console.log('Received values of form:', values);
                    }}
                    onValuesChange={(changedValues, allValues) => {
                        // console.log('onValuesChange:', changedValues, allValues);
                        setPlainTextItems(allValues.plain_text_items.filter((item: string) =>
                            item !== undefined && item.trim() !== ''));
                    }}
                >
                    <Form.List name="plain_text_items">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map((field, index) => (
                                    <Form.Item
                                        {...(index === 0 ? formItemLayout : formItemLayoutWithOutLabel)}
                                        label={index === 0 ? '文本内容：' : ''}
                                        required={false}
                                        key={field.key}
                                    >
                                        <Form.Item
                                            {...field}
                                            validateTrigger={['onChange', 'onBlur']}
                                            rules={
                                                [
                                                    {
                                                        required: true,
                                                        message: '请输入内容',
                                                    },
                                                    {
                                                        max: 4096,
                                                        message: '内容长度不能超过4096',
                                                    }
                                                ]
                                            }
                                            noStyle
                                        >
                                            <TextArea
                                                placeholder="请输入内容"
                                                autoSize={{ minRows: 3, maxRows: 5 }}
                                                style={{ width: '90%' }}
                                            />
                                        </Form.Item>
                                        <MinusCircleOutlined
                                            className={styles["dynamic-delete-button"]}
                                            onClick={() => remove(field.name)}
                                        />
                                    </Form.Item>
                                ))}
                                <Form.Item>
                                    <Button
                                        type="dashed"
                                        onClick={() => add()}
                                        icon={<PlusOutlined />}
                                    >
                                        添加新文本
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </Form>
            </div>
        </div>
    );
};

