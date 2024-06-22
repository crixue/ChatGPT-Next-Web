import styles from "@/app/components/unauthenticated/index.module.scss";
import {Checkbox} from "antd";
import React, {useMemo} from "react";
import {useAuthStore} from "@/app/store/auth";
import {getClientConfig} from "@/app/config/client";


export const UserAgreementCheckbox = () => {
    const authStore = useAuthStore();
    const clientConfig = useMemo(() => getClientConfig(), []);
    return (
        <div
            style={{justifyContent: "center"}}
            className={styles["unauth-card-footer"]}>
            <Checkbox
                defaultChecked={true}
                onChange={(e) => {
                    authStore.setAcceptTerms(e.target.checked);
                    if (e.target.checked) {
                        localStorage.setItem('cookieAccepted', 'true');
                    } else {
                        localStorage.removeItem('cookieAccepted');
                    }
                }
                }>
                注册/登录即代表同意
                <a href={clientConfig?.userAgreementUrl} target="_blank">《用户协议》</a>
                和
                <a href={clientConfig?.userPrivacyUrl} target="_blank">《隐私政策》</a>
            </Checkbox>
        </div>
    );
}
