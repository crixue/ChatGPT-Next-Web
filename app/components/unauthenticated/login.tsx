import React, {useState} from "react";
import {Button, Divider, Form, Input, notification, Space} from "antd";
import {RequestStatusEnum} from "@/app/constant";
import {CaptchaVerifyRequestVO, LoginTypeEnum} from "@/app/types/user-vo";
import {useAuthStore} from "@/app/store/auth";
import Locales from "@/app/locales";
import {ApiRequestException} from "@/app/exceptions/api-request-exception";
import {UserApiClient} from "@/app/client/user-api";
import styles from "./index.module.scss";
import {CommentOutlined, KeyOutlined} from "@ant-design/icons";
import {UserAgreementCheckbox} from "@/app/components/unauthenticated/user-agreement";
import {popUpCaptcha, userLoginTransactionRecord} from "@/app/components/unauthenticated/util";


export const LoginScreen = () => {
    const [isQuickLogin, setIsQuickLogin] = useState<boolean>(false);

    return (
        <div className={styles["login-container"]}>
            <NormalLoginTags useSmsLogin={isQuickLogin}/>
            {/*{isQuickLogin ?*/}
            {/*    <div></div>*/}
            {/*    : <div className={styles["forget-pwd-btn"]}>*/}
            {/*        <Button type={"text"} style={{color: "#999"}}><Link to={"/forget-pwd"}>忘记密码?</Link></Button>*/}
            {/*    </div>*/}
            <UserAgreementCheckbox/>
            <Divider className={styles["login-type-divider"]}>
                <span className={styles["login-type-divider-desc"]}>其他登录方式</span>
            </Divider>
            <div className={styles["quick-login-container"]}>
                {
                    isQuickLogin ?
                        <div className={"normal-login-wrapper"} onClick={() => setIsQuickLogin(false)}>
                            <Button icon={<KeyOutlined />} type={"link"}>密码登录</Button>
                        </div> :
                        <div className={"normal-login-wrapper"} onClick={() => setIsQuickLogin(true)}>
                            <Button icon={<CommentOutlined />} type={"link"}>验证码登录</Button>
                        </div>
                //     <div className={"quick-login-wechat-icon"} onClick={() => setIsQuickLogin(true)}>
                // <Avatar src={WechatRegisterIcon} size={34}/>
                //         </div>
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

const NormalLoginTags = ({useSmsLogin}: {useSmsLogin: boolean}) => {
    const [api, contextHolder] = notification.useNotification();

    return (
        <div>
            {contextHolder}
            <PhoneLoginScreen
                useSmsLogin={useSmsLogin}
                onError={(err) => {
                if (err !== null) {
                    api.error({
                        message: Locales.LoginFailed,
                        description: (err as ApiRequestException).message,
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


const UserNameLoginScreen = ({onError}: {
    onError: (error: unknown) => void
}) => {
    const [form] = Form.useForm();
    const [requestStatus, setRequestStatus] = useState<RequestStatusEnum>();
    const authStore = useAuthStore();

    const handleSubmit = async (values: { username: string, password: string }) => {
        setRequestStatus(RequestStatusEnum.isLoading);
        try {
            await authStore.login({
                loginType: LoginTypeEnum.USERNAME,
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
                       {required: true, message: "请输入用户名"},
                       {max: 16, message: "请限制在16个字符以内"},
                   ]}
        >
            <Input placeholder={'用户名'} type="text" id={'username'} allowClear/>
        </Form.Item>
        <Form.Item name={'password'} rules={[
            {required: true, message: "请输入密码"},
            {max: 16, message: "请限制在16个字符以内"},
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

const EmailLoginScreen = ({onError}: {
    onError: (error: unknown) => void
}) => {
    const [form] = Form.useForm();
    const authStore = useAuthStore();
    const [requestStatus, setRequestStatus] = useState<RequestStatusEnum>();

    const handleSubmit = async (values: { email: string, password: string }) => {
        setRequestStatus(RequestStatusEnum.isLoading);
        try {
            await authStore.login({
                loginType: LoginTypeEnum.EMAIL,
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
            <Button style={{width: "100%"}} loading={requestStatus == RequestStatusEnum.isLoading} htmlType="submit"
                    type={"primary"}>登录</Button>
        </Form.Item>
    </Form>
}


const PhoneLoginScreen = ({useSmsLogin, onError}: {
    useSmsLogin: boolean,
    onError: (error: unknown) => void
}) => {
    const phonePattern = /^1[3-9]\d{9}$/;
    const phonePatternMessage = "请输入正确的手机号";
    const [form] = Form.useForm();
    const authStore = useAuthStore();
    const [requestStatus, setRequestStatus] = useState<RequestStatusEnum>();

    const [countdown, setCountdown] = useState<number | null>(null);


    const verifyCaptchaAndSendCode = async (phoneNum: string) => {
        await popUpCaptcha(phoneNum, async (data) => {
            const userApiClient = new UserApiClient();
            try {
                await userApiClient.verifyCaptchaAndSendSmsCode(data);
            } catch (e: any) {
                onError(e);
            }
        }, onError);
        setCountdown(60);
        const timer = setInterval(() => {
            setCountdown((prevCountdown) => prevCountdown ? prevCountdown - 1 : null);
        }, 1000);
        setTimeout(() => {
            clearInterval(timer);
        }, 60000);
    };

    const handleSubmit = async (values: { phone: string, password?: string, smsCode?: string,
        captchaVerifyRequestVO?: CaptchaVerifyRequestVO }) => {
        if (!authStore.acceptTerms) {
            onError(new ApiRequestException("请先同意用户协议及隐私协议", 500, 1000));
            return;
        }
        setRequestStatus(RequestStatusEnum.isLoading);
        try {
            const requestData = {
                loginType: LoginTypeEnum.PHONE,
                loginUser: {
                    phone: values.phone,
                    password: values.password
                },
                useSmsCodeLogin: useSmsLogin,
                smsCode: values.smsCode,
                userLoginTransaction: userLoginTransactionRecord(values.phone),
                captchaVerifyRequestVO: values.captchaVerifyRequestVO,
            };
            console.log(requestData);
            await authStore.login(requestData);
            window.location.href = "/";
        } catch (e: any) {
            if(e instanceof ApiRequestException) {
                const businessCode = e.businessCode;
                if (businessCode == 60121) {
                    //need pop up captcha first!
                    await popUpCaptcha(values.phone, async (captchaVerifyRequestVO) => {
                        await handleSubmit({
                            phone: values.phone,
                            password: values.password,
                            smsCode: values.smsCode,
                            captchaVerifyRequestVO: captchaVerifyRequestVO
                        });
                    }, onError);
                    return;
                }
            }
            onError(e);
        } finally {
            setRequestStatus(undefined);
        }
    }

    return <Form onFinish={handleSubmit} form={form}>
        <Form.Item name={'phone'}
                   rules={[
                       {required: true, message: "请输入手机号码"},
                       {pattern: phonePattern, message: phonePatternMessage},
                   ]}
        >
            <Input placeholder={'手机号码'} type="text" id={'phone'} allowClear/>
        </Form.Item>
        {
            useSmsLogin ?
                <Form.Item name={'smsCode'} rules={[
                    {required: true, message: "请输入验证码"},
                ]}
                >
                    <Space.Compact style={{width: "100%"}}>
                        <Input placeholder={'请输入验证码'} type="text" id={'smsCode'}/>
                        <Button type={"primary"} disabled={countdown !== null && countdown > 0 }
                                onClick={() => {
                                    form.validateFields(['phone']);
                                    verifyCaptchaAndSendCode(form.getFieldValue('phone'));
                                }}>
                            {(countdown !== null && countdown > 0) ? `${countdown}秒后重新获取` : '获取验证码'}
                        </Button>
                    </Space.Compact>
                </Form.Item>
                :
                <Form.Item name={'password'} rules={[
                    {required: true, message: "请输入密码"},
                ]}
                >
                    <Input placeholder={'请输入密码'} type="password" id={'password'} allowClear/>
                </Form.Item>
        }

        <Form.Item className={styles["login-btn"]}>
            <Button style={{width: "100%"}}
                    loading={requestStatus == RequestStatusEnum.isLoading} htmlType="submit"
                    type={"primary"}>登录</Button>
        </Form.Item>
    </Form>
}