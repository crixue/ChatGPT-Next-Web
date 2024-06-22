"use client";

import React, {useState} from "react";
import {Button, Card, Checkbox, Radio} from "antd";
import {LoginScreen} from "@/app/components/unauthenticated/login";
import {RegisterScreen} from "@/app/components/unauthenticated/register";
import styles from "./index.module.scss";
import {useAuthStore} from "@/app/store/auth";


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
                    <Button type={"link"}
                            onClick={handleClick}>
                        {!isRegistered ? "已经有账号了？直接登录" : "没有账号？注册新账号"}
                    </Button>
                </div>
                {
                    isRegistered ? <LoginScreen/> : <RegisterScreen/>
                }
            </Card>
        </div>
    )
}
