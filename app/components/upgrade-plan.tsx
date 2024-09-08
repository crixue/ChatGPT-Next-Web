import {Alert, Badge, Button, Card, Divider, InputNumber, Modal, notification, Radio, Space, Typography} from "antd";
import styles from "@/app/components/upload.module.scss";
import {PaymentToolDescEnum, WalletChargeTxnRequestVO} from "@/app/types/payment-order-vo";
import AliPayIcon from "@/app/icons/ali_pay.svg";
import WeChatPayIcon from "@/app/icons/wechat_pay.svg";
import React, {useEffect, useState} from "react";
import type {InputStatus} from "antd/es/_util/statusUtils";
import {RadioChangeEvent} from "antd/es/radio/interface";
import {PaymentOderApi} from "@/app/client/payment-oder-api";
import {useNavigate} from "react-router-dom";
import {Path} from "@/app/constant";
import {VectorestorePlanProductEnum, VectorestoreUpgradeRequestVO} from "@/app/types/vectorestore-payment-txn-vo";
import {VectorstorePaymentTransactionApi} from "@/app/client/vectorestore-payment-transaction-api";
import {useUpgradePlanStore} from "@/app/store/upgrade-plan";

const paymentOrderApi = new PaymentOderApi();
const vectorstorePaymentTransactionApi = new VectorstorePaymentTransactionApi();

export const UpgradePlanComponent = () => {
    const upgradePlanStore = useUpgradePlanStore();

    const [balance, setBalance] = useState('查询中');
    const [minimumCharge, setMinimumCharge] = useState<number>(100);
    const [openChargeModal, setOpenChargeModal] = useState<boolean>(false);
    const [chargeAmount, setChargeAmount] = useState<number | null>(null);
    const [expireTime, setExpireTime] = useState<string | undefined>(undefined);
    const [openNotifyToPayModal, setOpenNotifyToPayModal] = useState(false);
    const [notify, contextHolder] = notification.useNotification();

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
            // setOpenUpgradeModelVisible(false);
            upgradePlanStore.setUpgradeModelVisible(false);
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

    const UpgradeVectorStoreServiceModal = () => {
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
                    upgradePlanStore.setUpgradeModelVisible(false);
                    setOpenChargeModal(true);
                } else {
                    upgradePlanStore.setUpgradeModelVisible(false);
                    setOpenChargeModal(false);
                    // navigate(Path.MakeLocalVSStore);
                    upgradePlanStore.setUpgradedProductId(vectorestoreUpgradeResponseVO.activeProductId);
                    notify.success({
                        message: '升级成功',
                        duration: 3
                    });
                }
            } catch (e) {
                console.error('createOrder:', e);
                upgradePlanStore.setUpgradeModelVisible(false);
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
                    open={upgradePlanStore.upgradeModelVisible}
                    onOk={handleUpgrade}
                    okText={"立即升级"}
                    onCancel={() => {
                        upgradePlanStore.setUpgradeModelVisible(false);
                    }}
                    cancelText={"取消"}
                >
                    <div style={{margin: "20px 40px 20px 40px"}}>
                        <Alert message={<Typography.Text>您的知识库空间不足，请升级服务</Typography.Text>}
                               type="warning" showIcon/>
                    </div>
                    <div className={styles["upgrade-vs-service-container"]}>
                        <Radio.Group onChange={onSelectVectorStoreChange} value={vectorStoreProductId}>
                            <Space size={"middle"} direction={"horizontal"}>
                                {upgradePlanStore.upgradeProducts.map((product) => {
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

    return (
        <>
            {contextHolder}
            <ChargeModal/>
            <NotifyToPayModal/>
            <UpgradeVectorStoreServiceModal/>
        </>
    );
}

