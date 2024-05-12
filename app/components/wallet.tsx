import styles from './wallet.module.scss'

import Locale from "@/app/locales";
import {IconButton} from "@/app/components/button";
import CloseIcon from "@/app/icons/close.svg";
import {Path} from "@/app/constant";
import {ErrorBoundary} from "@/app/components/error";
import {useNavigate} from "react-router-dom";
import {
    Button, Col, Divider,
    Input, InputNumber,
    List,
    Modal, notification,
    Radio,
    RadioChangeEvent, Row,
    Skeleton,
    Space, Statistic,
    StatisticProps,
    Tabs,
    TabsProps
} from "antd";
import React, {useEffect, useState} from "react";
import {UserUsageApi} from "@/app/client/user-usage-api";
// import DragIcon from "../icons/drag.svg";
import AliPayIcon from "@/app/icons/ali_pay.svg";
import WeChatPayIcon from "@/app/icons/wechat_pay.svg";
import RmbIcon from "@/app/icons/rmb.svg";

import {
    PaymentToolDescEnum, PaymentToolEnum,
    RefundableTxnResponseVO,
    WalletChargeTxnRequestVO, WalletPaymentTransaction
} from "@/app/types/payment-order-vo";
import {PaymentOderApi} from "@/app/client/payment-oder-api";
import dayjs from "dayjs";


const userUsageApi = new UserUsageApi();
const paymentOrderApi = new PaymentOderApi();

const Balance = () => {
    const [notify, contextHolder] = notification.useNotification();
    const [balance, setBalance] = useState('查询中');
    const [open, setOpen] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [openNotifyToPayModal, setOpenNotifyToPayModal] = useState(false);
    const [expireTime, setExpireTime] = useState<string | undefined>(undefined);
    const [refresh, setRefresh] = useState(false);
    const [openApplyToRefundModal, setOpenApplyToRefundModal] = useState(false);
    const [queryRefundListLoading, setQueryRefundListLoading] = useState(false);
    const [refundInfo, setRefundInfo] = useState<RefundableTxnResponseVO | undefined>(undefined);
    const [paymentSelected, setPaymentSelected] =
        useState<PaymentToolDescEnum>(PaymentToolDescEnum.ALI_PAY);
    const [chargeAmount, setChargeAmount] = useState<number>(0);
    const [openConfirmToRefundModal, setOpenConfirmToRefundModal] = useState(false);
    const [confirmApplyToRefundLoading, setConfirmApplyToRefundLoading] = useState(false);

    useEffect(() => {
        // fetch balance
        (async () => {
            const balanceInfoVO = await userUsageApi.simpleShowUserBalance();
            setBalance(balanceInfoVO.balance.toString());
        })();
    }, [refresh]);


    const handlePaymentSelectedOnChange = (e: RadioChangeEvent) => {
        const paymentTool = e.target.value;
        setPaymentSelected(paymentTool);
    }

    async function chargeNow() {
        if(!chargeAmount) {
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
        setConfirmLoading(true);
        paymentOrderApi.createPcPaymentOrder(request)
            .then((res) => {
                setExpireTime(res.expireTime);
                window.open(res.aliPayRedirectUrl);
            }).catch((e) => {
            console.error(e);
        }).finally(
            () => {
                setConfirmLoading(false);
                setOpen(false);
                setOpenNotifyToPayModal(true);
            }
        );
    }

    const chargeInputChange = (value: number | null) => {
        if (value !== null)
            setChargeAmount(value);
    }

    function closeNotifyToPayModal() {
        setOpenNotifyToPayModal(false);
        setRefresh(!refresh);
    }

    function closeRefundModal() {
        setOpenApplyToRefundModal(false);
        setRefresh(!refresh);
    }

    function checkRefundList() {
        setQueryRefundListLoading(true);
        paymentOrderApi.listRefundableTxnsInfo()
            .then((res) => {
                if (res && res.refundableTotalAmount) {
                    setRefundInfo(res);
                } else {
                    console.error("无法查询到可退款的交易信息");
                }
            }).catch((e) => {
            console.error(e);
        }).finally(() => {
            setQueryRefundListLoading(false);
            setOpenApplyToRefundModal(true);
        });
    }

    function applyToRefund() {
        setConfirmApplyToRefundLoading(true);
        paymentOrderApi.createRefundOrder()
            .then(() => {
            }).catch((e) => {
            console.error(e);
        }).finally(() => {
            setConfirmApplyToRefundLoading(false);
            setOpenApplyToRefundModal(false);
            setOpenConfirmToRefundModal(false);
            setRefresh(!refresh);
            notify.success({
                message: "退款处理中",
                description: "申请退款处理中，预计1-3个工作日到账，如有疑问请联系客服",
                duration: 5
            },);
        });
    }

    function closeConfirmToRefund() {
        setOpenConfirmToRefundModal(false);
        setOpenApplyToRefundModal(false);
    }

    const title = (
        <div className={styles["balance-statistic-title"]}>
            <RmbIcon/>
            <span style={{paddingLeft: "8px"}}>{Locale.Wallet.CurrentBalance}</span>
        </div>
    )

    return (
        <>
            {contextHolder}
            <div>
                <Statistic title={title} value={balance} precision={2}/>
                <div className={styles["balance-action"]}>
                    <Button
                        className={styles["balance-action-button"]}
                        type="primary"
                        onClick={() => {
                            setOpen(true);
                        }}>
                        充值
                    </Button>
                    <Button
                        className={styles["balance-action-button"]}
                        onClick={checkRefundList} loading={queryRefundListLoading}>
                        退款
                    </Button>
                </div>
                <Modal
                    title="零钱充值"
                    open={open}
                    okText={<span>立即充值</span>}
                    onOk={chargeNow}
                    confirmLoading={confirmLoading}
                    cancelText={"取消"}
                    onCancel={() => {
                        setOpen(false);
                    }}
                >
                    <div>
                        <h2>充值金额</h2>
                        <p style={{
                            color: '#9E9E9E',
                            fontSize: '14px',
                        }}>
                            当前零钱余额 <b>{balance}</b> 元
                        </p>
                        <InputNumber
                            style={{width: "100%"}}
                            size="large"
                            width={"240px"}
                            prefix="¥"
                            suffix="RMB"
                            placeholder={"请输入充值金额"}
                            min={1}
                            max={1000}
                            precision={2}
                            controls={false}
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
                <Modal
                    width={850}
                    title={"零钱退款"}
                    open={openApplyToRefundModal}
                    cancelText={"取消"}
                    onCancel={closeRefundModal}
                    okText={"申请退款"}
                    onOk={() => setOpenConfirmToRefundModal(true)}
                >
                    <div>
                        <div>
                            <Statistic title="可退款总金额(元)" value={refundInfo?.refundableTotalAmount}
                                       precision={2}/>
                            {/*<p>可退款总金额(元)</p>*/}
                            {/*<p>{refundInfo?.refundableTotalAmount}</p>*/}
                        </div>
                        <Divider/>
                        <div className={styles["refund-list-box"]}>
                            <List
                                itemLayout="horizontal"
                                dataSource={refundInfo?.refundableTxnDetails ?? []}
                                renderItem={(item) => {
                                    const content = "订单号：" + item.txnId;
                                    const title = " 可退费：" + item.refundableAmount + " 元"
                                    let paymentTool = "未知";
                                    switch (item.paymentTool) {
                                        case PaymentToolDescEnum.ALI_PAY:
                                            paymentTool = "支付宝";
                                            break;
                                        case PaymentToolDescEnum.WECHAT_PAY:
                                            paymentTool = "微信支付";
                                            break;
                                        default:
                                            break;
                                    }

                                    const description = paymentTool + " | 充值时间：" + dayjs(item.orderTime).format("YYYY-MM-DD HH:mm:ss")
                                        + " | 充值：" + item.chargeAmount + " 元";
                                    return (
                                        <List.Item>
                                            <List.Item.Meta
                                                title={title}
                                                description={description}
                                            />
                                            <div>
                                                <span>{content}</span>
                                            </div>
                                        </List.Item>
                                    )
                                }}
                            />
                        </div>
                    </div>
                </Modal>
                <Modal
                    title={"退款提醒"}
                    confirmLoading={confirmApplyToRefundLoading}
                    open={openConfirmToRefundModal}
                    cancelText={"取消"}
                    onCancel={closeConfirmToRefund}
                    okText={"确认"}
                    onOk={applyToRefund}
                >
                    <div>
                        <p>请确认是否申请退款?</p>
                    </div>
                </Modal>
            </div>
        </>

    );
}

const WalletTransactionList = () => {
    const [pageNum, setPageNum] = useState(1);
    const [loadingData, setLoadingData] = useState(false);
    const [walletTxnList, setWalletTxnList] = useState<WalletPaymentTransaction[]>([]);
    const [haveMoreData, setHaveMoreData] = useState(true);

    useEffect(() => {
        // fetch balance
        (async () => {
            const data = await paymentOrderApi.listAllTxnsByUserId(pageNum);
            setWalletTxnList(data);
        })();
    }, []);

    const onLoadMore = () => {
        setLoadingData(true);
        const nextPage = pageNum + 1;
        paymentOrderApi.listAllTxnsByUserId(pageNum).then((data) => {
            if (data && data.length > 0) {
                setWalletTxnList(walletTxnList.concat(data));
                setPageNum(nextPage);
                setHaveMoreData(true);
                // Resetting window's offsetTop so as to display react-virtualized demo underfloor.
                // In real scene, you can using public method of react-virtualized:
                // https://stackoverflow.com/questions/46700726/how-to-use-public-method-updateposition-of-react-virtualized
                window.dispatchEvent(new Event('resize'));
            } else {
                setHaveMoreData(false);
            }
        }).catch((e) => {
            console.error(e);
        }).finally(() => {
            setLoadingData(false);
        });
    };

    const loadMore =
        !loadingData ? (
            <div
                style={{
                    textAlign: 'center',
                    marginTop: 12,
                    height: 32,
                    lineHeight: '32px',
                }}
            >
                {haveMoreData ? <Button onClick={onLoadMore}>加载更多</Button> :
                    <p style={{color: '#d9d9d9'}}>没有更多数据了</p>}
            </div>
        ) : null;

    return (
        <>
            <div className={styles["refund-content-box"]}>
                <List
                    loading={loadingData}
                    itemLayout="horizontal"
                    loadMore={loadMore}
                    dataSource={walletTxnList}
                    renderItem={(item) => {
                        let type;
                        let orderAmountText;
                        if (item.type == 1) {
                            //充值
                            type = '充值';
                            orderAmountText = '+' + item.orderAmount + ' 元';
                        } else if (item.type == 2) {
                            //退款
                            type = '退款';
                            orderAmountText = '-' + item.orderAmount + ' 元';
                        }

                        let paymentTool = "未知";
                        switch (item.paymentTools) {
                            case PaymentToolEnum.ALI_PAY:
                                paymentTool = "支付宝";
                                break;
                            case PaymentToolEnum.WECHAT_PAY:
                                paymentTool = "微信支付";
                                break;
                            default:
                                break;
                        }

                        const title = paymentTool + '-' + type;
                        const description = "订单号：" + item.id + " | 交易时间：" + dayjs(item.orderTime).format("YYYY-MM-DD HH:mm:ss");
                        const desc = (
                            <>
                                <p>订单号：{item.id}</p>
                                <p>交易时间：{dayjs(item.orderTime).format("YYYY-MM-DD HH:mm:ss")}</p>
                            </>
                        );
                        return (
                            <List.Item>
                                <Skeleton avatar title={false} loading={loadingData} active>
                                    <List.Item.Meta
                                        title={title}
                                        description={desc}
                                    />
                                    <div>
                                    <span
                                        className={`${item.type == 1 ?
                                            styles["wallet-txn-order-amount-charge-text"] :
                                            styles["wallet-txn-order-amount-refund-text"]}`}>
                                        {orderAmountText}
                                    </span>
                                    </div>
                                </Skeleton>
                            </List.Item>
                        );
                    }}
                />
            </div>
        </>
    );
}

export const Wallet = () => {
    const onChange = (key: string) => {
        console.log(key);
    };

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: '我的零钱',
            children: <Balance/>,
        },
        {
            key: '2',
            label: '账单明细',
            children: <WalletTransactionList/>,
        },
    ];

    return (
        <ErrorBoundary>
            <div className="window-header" data-tauri-drag-region>
                <div className="window-header-title">
                    <div className="window-header-main-title">
                        {Locale.Wallet.Title}
                    </div>
                    <div className="window-header-sub-title">
                        {Locale.Wallet.SubTitle}
                    </div>
                </div>
            </div>
            <div className={styles["main-content-container"]}>
                <div className="billing-header-title">
                    <h2>{Locale.Wallet.MyWallet}</h2>
                </div>
                <div>
                    <Tabs defaultActiveKey="1" items={items} onChange={onChange}/>
                </div>
            </div>
        </ErrorBoundary>
    );
}
