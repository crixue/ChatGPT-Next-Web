"use client";

import React, {useState} from "react";
import {Button, Card} from "antd";
import {LoginScreen} from "@/app/components/unauthenticated/login";
import {RegisterScreen} from "@/app/components/unauthenticated/register";
import styles from "./index.module.scss";


export const UnauthScreen = () => {

    const [isRegistered, setIsRegistered] = useState(true);

    const handleClick = () => {
        setIsRegistered(!isRegistered);
    };

    // useDocumentTitle("登陆/注册");
    return (
        <div className={styles["unauth-card-container"]}>
            <Card className={styles["unauth-card"]}>
                <h2 className={styles["unauth-card-title"]}>
                    {isRegistered ? "请登录" : "请注册"}
                </h2>
                <div className={styles["trigger-register-login-btn"]}>
                    <Button type={"link"} onClick={handleClick}>{!isRegistered ? "已经有账号了？直接登录" : "没有账号？注册新账号"}</Button>
                </div>
                {
                    isRegistered ? <LoginScreen/> : <RegisterScreen/>
                }
                <div className={styles["unauth-card-footer"]}>
                    <span>
                        未注册手机验证后自动登录，注册即代表同意《用户协议》和《隐私政策》
                    </span>
                </div>
            </Card>
        </div>
    )
}
