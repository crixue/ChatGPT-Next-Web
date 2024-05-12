import React, {FormEvent, FormEventHandler, useEffect, useState} from "react";
import {Avatar, Button, Divider, Form, Input, message, notification, Tabs} from "antd";
import WechatRegisterIcon from "../../icons/wechat-register.svg";
import styles from "./index.module.scss";
import {Link} from "react-router-dom";
import TabPane from "antd/es/tabs/TabPane";
import {RequestStatusEnum} from "@/app/constant";
import {LoginTypeEnum} from "@/app/types/user-vo";
import {AuthException} from "@/app/exceptions/auth-exception";
import {useAuthStore} from "@/app/store/auth";
import Locales from "@/app/locales";


export const LoginScreen = () => {
    const [isQuickLogin, setIsQuickLogin] = useState<boolean>(false);

    return (
        <div className={styles["login-container"]}>
            {isQuickLogin ? <QuickLoginTags/> : <NormalLoginTags/>}
            {isQuickLogin ?
                <div></div>
                : <div className={styles["forget-pwd-btn"]}>
                    <Button type={"text"} style={{color: "#999"}}><Link to={"/forget-pwd"}>忘记密码?</Link></Button>
                </div>
            }

            <Divider>{isQuickLogin ? <span className={styles["login-type-divider-desc"]}>其他方式登录</span>:
                <span className={styles["login-type-divider-desc"]}>快捷登录</span> }</Divider>
            <div className={"quick-login-container"}>
                {
                    isQuickLogin ?
                        <div className={"normal-login-wrapper"} onClick={() => setIsQuickLogin(false)}>
                            <span>密码登录</span>
                        </div>:
                        <div className={"quick-login-wechat-icon"} onClick={() => setIsQuickLogin(true)}>
                            <Avatar src={WechatRegisterIcon} size={34}/>
                        </div>
                }
            </div>
        </div>
    )
}

const QuickLoginTags = () => {
    return (
        <div>
            {/*<WxQuickLoginCard/>*/}
        </div>
    );
}

const NormalLoginTags = () => {
    const [api, contextHolder] = notification.useNotification();

    return (
        <div>
            {contextHolder}
            <UserNameLoginScreen onError={(err) => {
                if (err !== null) {
                    api.error({
                        message: Locales.LoginFailed,
                        description: (err as AuthException).message,
                        duration: 3
                    });
                }
            }}/>
            {/*<Tabs defaultActiveKey={"phone"} centered>*/}
            {/*    <TabPane tab={"手机"} key={"phone"}>*/}
            {/*        <PhoneLoginScreen onError={setErr}/>*/}
            {/*    </TabPane>*/}
            {/*    <TabPane tab={"用户名"} key={"userName"}>*/}
            {/*        <UserNameLoginScreen onError={setErr}/>*/}
            {/*    </TabPane>*/}
            {/*    <TabPane tab={"邮箱"} key={"email"}>*/}
            {/*        <EmailLoginScreen onError={setErr}/>*/}
            {/*    </TabPane>*/}
            {/*</Tabs>*/}
        </div>
    )
}


const UserNameLoginScreen = ({onError} : {
    onError: (error: unknown) => void
}) => {
    const [form] = Form.useForm();
    const [requestStatus, setRequestStatus] = useState<RequestStatusEnum>();
    const authStore = useAuthStore();

    const handleSubmit = async (values: {username: string, password: string}) => {
        setRequestStatus(RequestStatusEnum.isLoading);
        try {
            await authStore.login({
                loginType: LoginTypeEnum.ALPHA_TEST_1,  //TODO 暂时使用这个
                loginUser: {
                    username: values.username,
                    password: values.password
                }
            });
            window.location.href = "/";
        } catch (e: any) {
            onError(e);
        } finally {
            setRequestStatus(undefined);
        }
    }

    return <Form onFinish={handleSubmit} form={form}>
        <Form.Item name={'username'}
                   rules={[
                       {required: true, message: "请输入用户名"}]}
        >
            <Input placeholder={'用户名'} type="text" id={'username'} allowClear/>
        </Form.Item>
        <Form.Item name={'password'} rules={[
            {required: true, message: "请输入密码"},
        ]}
        >
            <Input placeholder={'密码: 包含字母和数字'} type="password" id={'password'} allowClear/>
        </Form.Item>
        <Form.Item className={styles["login-btn"]}>
            <Button style={{width: "100%"}}
                    disabled={!authStore.acceptTerms}
                    loading={requestStatus == RequestStatusEnum.isLoading}
                    htmlType="submit" type={"primary"}>登录</Button>
        </Form.Item>
    </Form>
}

const EmailLoginScreen = ({onError} : {
    onError: (error: unknown) => void
}) => {
    const [form] = Form.useForm();
    const authStore = useAuthStore();
    const [requestStatus, setRequestStatus] = useState<RequestStatusEnum>();

    const handleSubmit = async (values: {email: string, password: string}) => {
        setRequestStatus(RequestStatusEnum.isLoading);
        try {
            await authStore.login({
                loginType: LoginTypeEnum.ALPHA_TEST_1,  //TODO 暂时使用这个
                loginUser: {
                    email: values.email,
                    password: values.password
                }
            });
            window.location.href = "/";
        } catch (e: any) {
            onError(e);
        } finally {
            setRequestStatus(undefined);
        }
    }

    return <Form onFinish={handleSubmit} form={form}>
        <Form.Item name={'email'}
                   rules={[
                       {required: true, message: "邮箱格式不正确", type: "email"},
                   ]}
        >
            <Input placeholder={'邮箱'} type="text" id={'email'} allowClear/>
        </Form.Item>
        <Form.Item name={'password'} rules={[
            {required: true, message: "请输入密码"},
        ]}
        >
            <Input placeholder={'密码: 包含字母和数字'} type="password" id={'password'} allowClear/>
        </Form.Item>
        <Form.Item className={styles["login-btn"]}>
            <Button style={{width: "100%"}} loading={requestStatus == RequestStatusEnum.isLoading} htmlType="submit" type={"primary"}>登录</Button>
        </Form.Item>
    </Form>
}


const PhoneLoginScreen = ({onError} : {
    onError: (error: unknown) => void
}) => {
    const [form] = Form.useForm();
    const authStore = useAuthStore();
    const [requestStatus, setRequestStatus] = useState<RequestStatusEnum>();

    const handleSubmit = async (values: {phone: string, password: string}) => {
        setRequestStatus(RequestStatusEnum.isLoading);
        try {
            await authStore.login({
                loginType: LoginTypeEnum.ALPHA_TEST_1,  //TODO 暂时使用这个
                loginUser: {
                    phone: values.phone,
                    password: values.password
                }
            });
            window.location.href = "/";
        } catch (e: any) {
            onError(e);
        } finally {
            setRequestStatus(undefined);
        }
    }

    return <Form onFinish={handleSubmit} form={form}>
        <Form.Item name={'phone'}
                   rules={[
                       {required: true, message: "请输入手机号码"},
                       {pattern: /^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/, message: "手机号码格式不正确"},
                   ]}
        >
            <Input placeholder={'手机号码'} type="text" id={'phone'} allowClear/>
        </Form.Item>
        <Form.Item name={'password'} rules={[
            {required: true, message: "请输入密码"},
        ]}
        >
            <Input placeholder={'密码: 包含字母和数字'} type="password" id={'password'} allowClear/>
        </Form.Item>
        <Form.Item className={styles["login-btn"]}>
            <Button style={{width: "100%"}} loading={requestStatus == RequestStatusEnum.isLoading} htmlType="submit" type={"primary"}>登录</Button>
        </Form.Item>
    </Form>
}