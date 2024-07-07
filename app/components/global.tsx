import {useGlobalSettingStore} from "@/app/store/global-setting";
import React from "react";
import styles from "@/app/components/global.module.scss";
import BotIcon from "@/app/icons/bot.svg";
import LoadingIcon from "@/app/icons/three-dots.svg";
import {UnauthenticatedApp} from "@/app/components/unauthenticated";

export const GlobalLoading = (props: { showLoading: boolean, noLogo?: boolean }) => {
    if (props.showLoading) {
        return (
            <div style={{display: "flex"}}>
                <div className={styles["overlay"]}>
                    <div className={styles["loading-content"] + " no-dark"}>
                        {!props.noLogo && <BotIcon/>}
                        <div style={{marginTop: "24px"}}>
                            <LoadingIcon/>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    return null;
}
