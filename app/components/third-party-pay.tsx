import styles from "./third-party-pay.module.scss";

import {WapOrderResponseVO} from "@/app/types/payment-order-vo";
import WeChatPayIcon from "@/app/icons/wechat_pay.svg";
import React from "react";
import {QRCode} from "antd";


export const WechatPay = (props: {
    orderInfo?: WapOrderResponseVO;
}) => {
    const orderInfo = props.orderInfo;

    return (
        <>
            <div className={styles["wechat-payment-info-box"]}>
                <div>
                    <p>订单编号：<b>{orderInfo?.txnId}</b></p>
                    <p>订单金额：<b>￥{orderInfo?.orderAmount}</b></p>
                    <p>请使用微信扫描二维码于 {orderInfo?.expireTime} 前完成支付</p>
                </div>
            </div>
            <div className={styles["charge-qrcode-display-box"]}>
                <div className={styles["charge-pay-tool-box"]}>
                    <div style={{paddingLeft: "6px"}}><WeChatPayIcon/></div>
                    <span style={{paddingLeft: "8px"}}>微信支付</span>
                </div>
                <QRCode
                    value={orderInfo?.wechatPayH5Url ?? ""}
                    size={200}
                    fgColor="#000000"
                />
            </div>
        </>
    );
}