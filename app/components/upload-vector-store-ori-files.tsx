import React, {useEffect, useState} from 'react';
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Divider,
    InputNumber,
    Modal,
    notification,
    Radio,
    Space, Typography,
    UploadFile,
    UploadProps
} from 'antd';
import {InboxOutlined} from '@ant-design/icons';
import Dragger from "antd/es/upload/Dragger";
import {UploadApi} from "@/app/client/upload";
import {RcFile} from "antd/es/upload";
import {useUploadFileStore} from "@/app/store/upload-file";
import {isAVFileType} from "@/app/utils/common-util";
import styles from "./upload.module.scss";
import {CustomListItem} from "@/app/components/ui-lib";
import Locale from "@/app/locales";
import {MakeLocalVectorStoreApi} from "@/app/client/make-localvs";
import {Product} from "@/app/types/product-vo";
import {GlobalLoading} from "@/app/components/global";
import {RadioChangeEvent} from "antd/es/radio/interface";
import type {InputStatus} from "antd/es/_util/statusUtils";
import {VectorestorePlanProductEnum, VectorestoreUpgradeRequestVO} from "@/app/types/vectorestore-payment-txn-vo";
import {VectorstorePaymentTransactionApi} from "@/app/client/vectorestore-payment-transaction-api";
import {useNavigate} from "react-router-dom";
import {PaymentToolDescEnum, WalletChargeTxnRequestVO} from "@/app/types/payment-order-vo";
import AliPayIcon from "@/app/icons/ali_pay.svg";
import WeChatPayIcon from "@/app/icons/wechat_pay.svg";
import {PaymentOderApi} from "@/app/client/payment-oder-api";
import {Path} from "@/app/constant";


export type CustomUploadFile = UploadFile & {
    taskId?: string;
    uploadType?: 'DEFAULT' | 'AUDIO_OR_VIDEO'
}

const uploadService = new UploadApi();
const makeLocalVectorStoreApi = new MakeLocalVectorStoreApi();
const vectorstorePaymentTransactionApi = new VectorstorePaymentTransactionApi();
const paymentOrderApi = new PaymentOderApi();

export const UploadVectorStoreOriFilesPage = (props: {
    uploadFolderId: string;
    currentUserProductId?: string;
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
    const [showLoading, setShowLoading] = useState<boolean>(false);
    const [upgradedProductId, setUpgradedProductId] = useState<string | undefined>(props.currentUserProductId);
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

    const [openUpgradeModelVisible, setOpenUpgradeModelVisible] = useState<boolean>(false);
    const [upgradeProducts, setUpgradeProducts] = useState<Product[]>([]);

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
                setUpgradeProducts(preCheckVectorestoreLimitResponseVO.upgradeProducts);
                setOpenUpgradeModelVisible(true);
                // @ts-ignore
                option.onError(Locale.MakeLocalVSStore.Upload.UploadFileFailed, file);
                return;
            } else {
                setUpgradeProducts([]);
                setOpenUpgradeModelVisible(false);
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

    const [balance, setBalance] = useState('查询中');
    const [minimumCharge, setMinimumCharge] = useState<number>(100);
    const [openChargeModal, setOpenChargeModal] = useState<boolean>(false);
    const [chargeAmount, setChargeAmount] = useState<number | null>(null);
    const [expireTime, setExpireTime] = useState<string | undefined>(undefined);
    const [openNotifyToPayModal, setOpenNotifyToPayModal] = useState(false);

    const ChargeModal = () => {
        const [otherMonthOptionStatus, setOtherMonthOptionStatus] = useState<InputStatus | undefined>();
        const [otherMonthOptionValue, setOtherMonthOptionValue] = useState<number | null>(null);
        const [chargeMonthsOption, setChargeMonthsOption] = useState<number>(3);
        const [otherMonthOptionDisabled, setOtherMonthOptionDisabled] = useState<boolean>(true);
        const [paymentSelected, setPaymentSelected] =
            useState<PaymentToolDescEnum>(PaymentToolDescEnum.ALI_PAY);
        const [confirmChargeLoading, setConfirmChargeLoading] = useState<boolean>(false);

        function onSelectedChargeMonths(e: RadioChangeEvent) {
            const value = e.target.value;
            if (value == -1) {
                setOtherMonthOptionDisabled(false);
            } else {
                setOtherMonthOptionDisabled(true);
            }
            setChargeMonthsOption(value);
        }

        async function chargeNow() {
            if (!chargeAmount) {
                notify.error({
                    message: "请输入充值金额",
                    duration: 3
                });
                return;
            }
            const request = {
                orderAmount: chargeAmount,
                paymentTool: paymentSelected,
            } as WalletChargeTxnRequestVO;
            setConfirmChargeLoading(true);
            paymentOrderApi.createPcPaymentOrder(request)
                .then((res) => {
                    setExpireTime(res.expireTime);
                    window.open(res.aliPayRedirectUrl);
                }).catch((e) => {
                console.error(e);
            }).finally(
                () => {
                    setConfirmChargeLoading(false);
                    closeChargeModal();
                    setOpenNotifyToPayModal(true);
                }
            );
        }

        function closeChargeModal() {
            setOpenChargeModal(false);
            setOpenUpgradeModelVisible(false);
        }

        const chargeInputChange = (value: number | null) => {
            if (value !== null)
                setChargeAmount(value);
        }

        const handlePaymentSelectedOnChange = (e: RadioChangeEvent) => {
            const paymentTool = e.target.value;
            setPaymentSelected(paymentTool);
        }

        return (
            <>
                <Modal
                    title="快速充值"
                    open={openChargeModal}
                    okText={<span>立即充值</span>}
                    onOk={chargeNow}
                    confirmLoading={confirmChargeLoading}
                    cancelText={"取消"}
                    onCancel={closeChargeModal}
                >
                    <div>
                        <h2>充值金额</h2>
                        <p style={{
                            color: '#9E9E9E',
                            fontSize: '14px',
                        }}>
                            当前零钱余额 <b>{balance}</b> 元，您最低需要充值 <b>{minimumCharge}</b> 元
                        </p>
                        <InputNumber
                            style={{width: "100%"}}
                            size="large"
                            width={"240px"}
                            prefix="¥"
                            suffix="RMB"
                            placeholder={"请输入充值金额"}
                            min={minimumCharge}
                            max={1000}
                            precision={2}
                            controls={false}
                            value={chargeAmount}
                            onChange={chargeInputChange}/>
                    </div>
                    <Divider/>
                    <div className={styles["payment-tool-container"]}>
                        <h2>选择支付方式</h2>
                        <Radio.Group onChange={handlePaymentSelectedOnChange} value={paymentSelected}>
                            <div className={styles["payment-tool-radio-group-wrapper"]}>
                                <Radio value={PaymentToolDescEnum.ALI_PAY}>
                                    <div className={styles["charge-pay-tool-box"]}>
                                        <AliPayIcon/>
                                        <span>支付宝</span>
                                    </div>
                                </Radio>

                                <Radio value={PaymentToolDescEnum.WECHAT_PAY}>
                                    <div className={styles["charge-pay-tool-box"]}>
                                        <div style={{paddingLeft: "6px"}}><WeChatPayIcon/></div>
                                        <span style={{paddingLeft: "8px"}}>微信支付</span>
                                    </div>
                                </Radio>
                            </div>
                        </Radio.Group>
                    </div>
                    <div className={styles["user-charge-term-box"]}>
                        <Button type={"link"}>用户充值协议</Button>
                    </div>
                </Modal>
            </>
        )
    }

    const NotifyToPayModal = () => {
        const navigate = useNavigate();

        function closeNotifyToPayModal() {
            setOpenNotifyToPayModal(false);
            navigate(Path.Wallet);
        }

        return (
            <>
                <Modal
                    title={"请完成支付"}
                    open={openNotifyToPayModal}
                    cancelText={"取消"}
                    onCancel={closeNotifyToPayModal}
                    okText={"知道了"}
                    onOk={closeNotifyToPayModal}
                >
                    <div>
                        <p>正在请求支付中，请您在 {expireTime} 前完成支付,如您已支付完成请点击 <b>知道了</b> 按钮</p>
                    </div>
                </Modal>
            </>
        );
    }

    const UpgradeVectorStoreServiceModal = (props: { products: Product[] }) => {
        const [vectorStoreProductId, setVectorStoreProductId] = useState<string>(VectorestorePlanProductEnum.Plus);
        const [agreeAutoRewel, setAgreeAutoRewel] = useState<boolean>(true);

        async function handleUpgrade() {
            let chargeMonths = 1;  // 暂时不支持选择月份，固定为1个月
            // if (chargeMonthsOption == -1) {
            //     if (otherMonthOptionValue == null) {
            //         setOtherMonthOptionStatus('error');
            //         return;
            //     }
            //     chargeMonths = otherMonthOptionValue;
            // } else {
            //     chargeMonths = chargeMonthsOption;
            // }

            const requestData = {
                upgradeProductId: vectorStoreProductId,
                chargeMonths,
                isAutoRenew: agreeAutoRewel,
            } as VectorestoreUpgradeRequestVO;
            try {
                const vectorestoreUpgradeResponseVO = await vectorstorePaymentTransactionApi.createOrder(requestData);
                if (!vectorestoreUpgradeResponseVO.ifHaveEnoughMoney || !vectorestoreUpgradeResponseVO.haveActiveOrder) {  //余额不足
                    setBalance(vectorestoreUpgradeResponseVO.userRestBalance?.toFixed(2) ?? '查询失败');
                    setMinimumCharge(vectorestoreUpgradeResponseVO.atLeastCharge);
                    setChargeAmount(vectorestoreUpgradeResponseVO.recommendCharge);
                    setOpenUpgradeModelVisible(false);
                    setOpenChargeModal(true);
                } else {
                    setOpenUpgradeModelVisible(false);
                    setOpenChargeModal(false);
                    // navigate(Path.MakeLocalVSStore);
                    setUpgradedProductId(vectorestoreUpgradeResponseVO.activeProductId);
                    notify.success({
                        message: '升级成功',
                        duration: 3
                    });
                }
            } catch (e) {
                console.error('createOrder:', e);
                setOpenUpgradeModelVisible(false);
            }
        }

        function onSelectVectorStoreChange(e: RadioChangeEvent | string) {
            if (typeof e === 'string') {
                setVectorStoreProductId(e);
                return;
            }
            setVectorStoreProductId(e.target.value);
        }

        return (
            <>
                <Modal
                    width={750}
                    title={"升级服务"}
                    open={openUpgradeModelVisible}
                    onOk={handleUpgrade}
                    okText={"立即升级"}
                    onCancel={() => setOpenUpgradeModelVisible(false)}
                    cancelText={"取消"}
                >
                    <div style={{margin: "20px 40px 20px 40px"}}>
                        <Alert message={<Typography.Text>您的知识库空间不足，请升级服务</Typography.Text>}
                               type="warning" showIcon/>
                    </div>
                    <div className={styles["upgrade-vs-service-container"]}>
                        <Radio.Group onChange={onSelectVectorStoreChange} value={vectorStoreProductId}>
                            <Space size={"middle"} direction={"horizontal"}>
                                {props.products && props.products.map((product) => {
                                    let ribbonColor = 'grey';
                                    let ribbonText = 'Free';
                                    if (product.id === VectorestorePlanProductEnum.Exp) {
                                        ribbonColor = 'cyan';  //experience
                                        ribbonText = 'Exp';
                                    } else if (product.id === VectorestorePlanProductEnum.Plus) {
                                        ribbonColor = 'red';  //plus
                                        ribbonText = 'Plus';
                                    }
                                    return (
                                        <>
                                            <div className={
                                                styles["upgrade-item-box"]}>
                                                <Badge.Ribbon key={product.id} text={ribbonText} color={ribbonColor}>
                                                    <Card
                                                        className={styles["upgrade-item-card"]}
                                                        // style={{width: "300px"}}
                                                        size={"default"}
                                                        title={product.name}
                                                        hoverable={true}
                                                        onClick={() => {
                                                            onSelectVectorStoreChange(product.id);
                                                        }}
                                                    >
                                                        <div>
                                                            <div dangerouslySetInnerHTML={{__html: product.detail!}}/>
                                                        </div>
                                                    </Card>
                                                </Badge.Ribbon>
                                                <Radio value={product.id}><p>最新优惠价：{product.price} 元</p></Radio>
                                            </div>
                                        </>
                                    )
                                })}
                            </Space>
                        </Radio.Group>
                        {/*<Divider/>*/}
                        {/*<div className={styles['upgrade-radio-group-box']}>*/}
                        {/*    <Typography.Text strong style={{marginRight: "16px"}}>选择服务时长：</Typography.Text>*/}
                        {/*    <Radio.Group*/}
                        {/*        style={{display: 'flex', alignItems: 'center'}}*/}
                        {/*        onChange={onSelectedChargeMonths}*/}
                        {/*        value={chargeMonthsOption}>*/}
                        {/*        <Radio value={1}>1个月</Radio>*/}
                        {/*        <Radio value={3}>3个月</Radio>*/}
                        {/*        <Radio value={6}>6个月</Radio>*/}
                        {/*        <Radio value={12}>12个月</Radio>*/}
                        {/*        <Radio value={-1}>*/}
                        {/*            <InputNumber*/}
                        {/*                status={otherMonthOptionStatus}*/}
                        {/*                disabled={otherMonthOptionDisabled}*/}
                        {/*                onChange={(value) => {*/}
                        {/*                    setOtherMonthOptionStatus(undefined);*/}
                        {/*                    setOtherMonthOptionValue(value);*/}
                        {/*                }}*/}
                        {/*                controls={false}*/}
                        {/*                placeholder={"其他"}*/}
                        {/*                suffix={"月"}*/}
                        {/*                min={1} max={36} />*/}
                        {/*        </Radio>*/}
                        {/*    </Radio.Group>*/}
                        {/*</div>*/}
                        <Divider/>
                        <div className={styles['upgrade-radio-group-box']}>
                            <Typography.Text strong style={{marginRight: "16px"}}>是否开启自动续费：</Typography.Text>
                            <Radio.Group
                                style={{display: 'flex', alignItems: 'center'}}
                                onChange={() =>
                                    setAgreeAutoRewel(!agreeAutoRewel)
                                }
                                value={agreeAutoRewel}>
                                <Radio value={true}>是</Radio>
                                <Radio value={false}>否</Radio>
                            </Radio.Group>
                        </div>
                        {/*<Divider/>*/}
                    </div>
                </Modal>
            </>
        );
    }

    const handleOnUpgrade = async () => {
        const products = await vectorstorePaymentTransactionApi.showVectorestoreUpgradePlan();
        setUpgradeProducts(products);
        setOpenUpgradeModelVisible(true);
    }

    return (
        <>
            {contextHolder}
            <div>
                <GlobalLoading showLoading={showLoading}/>
                <UpgradeVectorStoreServiceModal products={upgradeProducts}/>
                <ChargeModal/>
                <NotifyToPayModal/>
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

