import LoadingIcon from "../icons/three-dots.svg";
import {useGlobalSettingStore} from "@/app/store/global-setting";
import React from "react";
import {Modal, Space, Spin} from "antd";
import styles from "@/app/components/home.module.scss";


export const GlobalLoading = () => {
    const globalSettingStore = useGlobalSettingStore();
    const isLoading = globalSettingStore.showGlobalLoading;
    const loadingText = globalSettingStore.showGlobalLoadingText;
    console.log('isLoading', isLoading)
    if (isLoading) {
        return (
            <div style={{display: "flex"}}>
                <div className={styles["overlay"]}>
                    <Space>
                        <div className={styles["loading"]}>
                            <Spin tip={loadingText} size="large">
                                <div className="content" />
                            </Spin>
                        </div>
                    </Space>
                </div>
            </div>
        )
    }
    return null;
}
