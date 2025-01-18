import React, {useEffect, useState} from 'react';
import {Badge, Button, Card, Col, InputNumber, notification, Radio, Space, UploadProps} from 'antd';
import {InboxOutlined} from '@ant-design/icons';
import Dragger from "antd/es/upload/Dragger";
import {UploadApi} from "@/app/client/upload";
import {RcFile} from "antd/es/upload";
import {useUploadFileStore} from "@/app/store/upload-file";
import {isAVFileType} from "@/app/utils/common-util";
import styles from "./upload.module.scss";
import {CustomListItem} from "@/app/components/ui-lib";
import Locale from "@/app/locales";
import {MakeKnowledgeBaseStoreApi} from "@/app/client/make-kb";
import {GlobalLoading} from "@/app/components/global";
import {VectorestorePlanProductEnum} from "@/app/types/vectorestore-payment-txn-vo";
import {VectorstorePaymentTransactionApi} from "@/app/client/vectorestore-payment-transaction-api";
import {UpgradePlanComponent} from "@/app/components/upgrade-plan";
import {useUpgradePlanStore} from "@/app/store/upgrade-plan";
import {CustomUploadFile} from "@/app/types/make-localvs-vo";

const uploadService = new UploadApi();
const makeLocalVectorStoreApi = new MakeKnowledgeBaseStoreApi();
const vectorstorePaymentTransactionApi = new VectorstorePaymentTransactionApi();

export const UploadVectorStoreOriFilesPage = (props: {
    uploadFolderId: string;
}) => {
    const uploadFileStore = useUploadFileStore();
    const upgradePlanStore = useUpgradePlanStore();
    const upgradedProductId = upgradePlanStore.upgradedProductId;

    const fileList = uploadFileStore.uploadFileList;
    const setFileList = uploadFileStore.setUploadFileList;
    const setPlainTextItems = uploadFileStore.setUploadPlainTextItems;
    const selectedLang = uploadFileStore.selectedLang;
    const setSelectedLang = uploadFileStore.setSelectedLang;
    const makeLocalVSConfig = uploadFileStore.makeLocalVSConfig;
    const setMakeLocalVSConfig = uploadFileStore.setMakeLocalVSConfig;

    const [notify, contextHolder] = notification.useNotification();
    const [showLoading, setShowLoading] = useState<boolean>(false);
    const [productBadge, setProductBadge] = useState<string>('Free');
    const [productBadgeColor, setProductBadgeColor] = useState<string>('grey');

    useEffect(() => {
        setFileList([]);
    }, []);

    useEffect(() => {
        if (upgradedProductId) {
            if (upgradedProductId === VectorestorePlanProductEnum.Exp) {
                setProductBadge('Exp');
                setProductBadgeColor('cyan');
            } else if (upgradedProductId === VectorestorePlanProductEnum.Plus) {
                setProductBadge('Plus');
                setProductBadgeColor('red');
            }
        }
    }, [upgradedProductId]);

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

    const handleUpload: UploadProps['customRequest'] = async (option) => {
        const file = option.file as RcFile;
        const uid = (fileList.length + 1).toString();

        const uploadItem = {
            uid: uid,
            fileName: file.name,
            status: 'uploading',
            originFileObj: file,
        } as CustomUploadFile;
        // @ts-ignore
        option.onProgress({percent: 10});
        const fileSizeInBytes = file.size;
        const isAvFile = isAVFileType(file.type);
        try {
            const preCheckVectorestoreLimitResponseVO = await makeLocalVectorStoreApi
                .preCheckUserIfExceedVectorstoreLimitSize({
                    fileSizeInBytes,
                    fileType: isAvFile ? 'AUDIO_OR_VIDEO' : 'DEFAULT',
                });

            if (preCheckVectorestoreLimitResponseVO.haveExceededLimit) {
                setFileList([]);
                upgradePlanStore.setUpgradeProducts(preCheckVectorestoreLimitResponseVO.upgradeProducts);
                upgradePlanStore.setUpgradeModelVisible(true);
                // 移除所有上传文件
                // @ts-ignore
                option.onError(Locale.MakeLocalVSStore.Upload.UploadFileFailed, file);
                return;
            } else {
                upgradePlanStore.setUpgradeProducts([]);
                upgradePlanStore.setUpgradeModelVisible(false);
            }
        } catch (e) {
            console.error('preCheckUserIfExceedVectorstoreLimitSize:', e);
        } finally {
            setShowLoading(false);
        }
        // @ts-ignore
        option.onProgress({percent: 15});
        if (isAvFile) {  //上传音视频文件
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
                if (errInfo.code === 63002) {
                    notify['error']({
                        message: `${Locale.MakeLocalVSStore.Upload.DoNotUploadSameFile}：${file.name}`,
                    });
                    return;
                }
                notify['error']({
                    message: `${file.name} ${Locale.MakeLocalVSStore.Upload.UploadFileFailed}`,
                });
            }).finally(() => {
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
            if (errInfo.code === 63002) {
                notify['error']({
                    message: `${Locale.MakeLocalVSStore.Upload.DoNotUploadSameFile}：${file.name}`,
                });
                return;
            }
            notify['error']({
                message: `${file.name} ${Locale.MakeLocalVSStore.Upload.UploadFileFailed}`,
            });
        }).finally(() => {
        });

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

    const handleOnUpgrade = async () => {
        const products = await vectorstorePaymentTransactionApi.showVectorestoreUpgradePlan();
        upgradePlanStore.setUpgradeProducts(products);
        upgradePlanStore.setUpgradeModelVisible(true);
    }

    return (
        <>
            {contextHolder}
            <div>
                <GlobalLoading showLoading={showLoading}/>
                <UpgradePlanComponent/>
                <Space direction="vertical" size="middle" style={{display: 'flex'}}>
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
                    <Badge.Ribbon text={productBadge} color={productBadgeColor}>
                        <Card
                            extra={<Button type="link"
                                           disabled={upgradedProductId === VectorestorePlanProductEnum.Plus}
                                           style={{marginRight: "28px"}}
                                           onClick={handleOnUpgrade}>
                                服务升级
                            </Button>}
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
                                    <InboxOutlined/>
                                </p>
                                <p className="ant-upload-text">
                                    <p style={{fontSize: "13px"}}>{Locale.MakeLocalVSStore.Upload.SupportedFileTypeTip}</p>
                                    <p>请注意上传相同文件名或相同内容，会影响最终生成的知识库文件</p>
                                    <p>{Locale.MakeLocalVSStore.Upload.UploadFileTip}</p>
                                </p>
                            </Dragger>
                        </Card>
                    </Badge.Ribbon>
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
        </>
    );
};

