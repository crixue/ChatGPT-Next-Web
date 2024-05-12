import {UserUsageApi} from "@/app/client/user-usage-api";
import React, {useEffect, useState} from "react";
import {ErrorBoundary} from "@/app/components/error";
import Locale from "@/app/locales";
import styles from "@/app/components/usage.module.scss";
import {Col, Divider, Row, Statistic, Tabs} from "antd";


const userUsageApi = new UserUsageApi();

export const UserUsage = () => {

    const [currentMonthTotalUsageInt, setCurrentMonthTotalUsageInt] = useState(0);
    const [currentMonthTotalCost, setCurrentMonthTotalCost] = useState(0);

    useEffect(() => {
        // fetch balance
        (async () => {
            const usageInfo = await userUsageApi.simpleShowTokenUsage();
            setCurrentMonthTotalUsageInt(usageInfo.currentMonthTotalUsageInt);
            setCurrentMonthTotalCost(usageInfo.currentMonthTotalCost);
        })();
    }, []);

    return (
        <>
            <ErrorBoundary>
                <div className="window-header" data-tauri-drag-region>
                    <div className="window-header-title">
                        <div className="window-header-main-title">
                            {Locale.Usage.Title}
                        </div>
                        <div className="window-header-sub-title">
                            {Locale.Usage.SubTitle}
                        </div>
                    </div>
                </div>
                <div className={styles["main-content-container"]}>
                    <div className="billing-header-title">
                        <h2>{Locale.Usage.MonthlyStatistics}</h2>
                    </div>
                    <Divider style={{margin: "12px 0"}}/>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Statistic title="当月token总用量" value={currentMonthTotalUsageInt} />
                        </Col>
                        <Col span={12}>
                            <Statistic title="当月总消费(元)" value={currentMonthTotalCost} precision={2} />
                        </Col>
                    </Row>
                </div>
            </ErrorBoundary>
        </>
    )
}
