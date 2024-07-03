import {Button, Form, Input, notification, Space} from "antd";
import {RuleObject, StoreValue} from "rc-field-form/lib/interface";
import React, {useState} from "react";
import styles from "./index.module.scss";
import {
    emailExistsValidator,
    phoneExistsValidator,
    popUpCaptcha,
    userLoginTransactionRecord,
    userNameExistsValidator
} from "./util";
import {RequestStatusEnum} from "@/app/constant";
import {LoginTypeEnum} from "@/app/types/user-vo";
import {useAuthStore} from "@/app/store/auth";
import Locales from "@/app/locales";
import {UserAgreementCheckbox} from "@/app/components/unauthenticated/user-agreement";
import {UserApiClient} from "@/app/client/user-api";
import {ApiRequestException} from "@/app/exceptions/api-request-exception";


export const RegisterScreen = () => {
    const [isQuickLogin, setIsQuickLogin] = useState<boolean>(false);

    return (
        <div className={styles["register-container"]}>
            {isQuickLogin ? <QuickRegisterTags/> : <NormalRegisterTags/>}
            <UserAgreementCheckbox/>
        </div>
    )
}

const QuickRegisterTags = () => {
    return (
        <div>
            {/*<WxQuickLoginCard/>*/}
        </div>
    );
}

const NormalRegisterTags = () => {
    const [api, contextHolder] = notification.useNotification();

    return (
        <>
            {contextHolder}
            <PhoneRegisterScreen onError={(err) => {
                if (err !== null) {
                    api.error({
                        message: Locales.RegisterFailed,
                        description: (err as ApiRequestException).message,
                        duration: 3
                    });
                }
            }}/>
        </>

    )
}


export const rawPwdValidator = (rule: RuleObject, value: StoreValue, callback: (error?: string) => void) => {
    if (value) {
        if (value.length < 8 || value.length > 30) {
            callback('密码长度8-30位');
        }
        const passwordReg = /^(?=.*\d)(?=.*[a-zA-Z]).*$/;
        if (!passwordReg.test(value)) {
            callback("密码必须包含数字和字母");
        }
    }
    callback();
}

const UserNameRegisterScreen = ({onError} : {
    onError: (error: unknown) => void
}) => {
    const [form] = Form.useForm();
    const authStore = useAuthStore();
    const [requestStatus, setRequestStatus] = useState<RequestStatusEnum>();

    const handleSubmit = async (values: {username: string, password: string, cpassword: string}) => {
        setRequestStatus(RequestStatusEnum.isLoading);
        try {
            await authStore.register(
                {
                    registerType: LoginTypeEnum.USERNAME,
                    registerUser: {
                        username: values.username,
                        password: values.password
                    },
                    roleIds: [1052]  //暂时写死

                });
            window.location.href = "/";
        } catch (e: any) {
            onError(e);
        }  finally {
            setRequestStatus(undefined);
        }
    }

    const confirmPwdValidator = (rule: RuleObject, value: StoreValue, callback: (error?: string) => void) => {
        if (value) {
            let rawPwd = form.getFieldValue('password');
            if (rawPwd !== value) {
                callback('两次输入的密码不一致');
            }
        }
        callback();
    }

    return <Form onFinish={handleSubmit} form={form}>
        <Form.Item name={'username'}
                   hasFeedback
                   validateTrigger={'onBlur'}
                   rules={[
                    {required: true, message: "请输入用户名"},
                    {max: 24, message: "请限制在24个字符以内"},
                    {validator: userNameExistsValidator}]}
        >
            <Input placeholder={'请输入用户名'} type="text" id={'username'} allowClear/>
        </Form.Item>
        <Form.Item name={'password'}
                   hasFeedback
                   rules={[
            {required: true, message: "请输入密码"},
            {validator: rawPwdValidator}
        ]}
        >
            <Input placeholder={'请输入密码'} type="password" id={'password'} allowClear/>
        </Form.Item>
        <Form.Item name={'cpassword'}
                   hasFeedback
                   rules={[
            {required: true, message: "请确认密码"},
            {validator: confirmPwdValidator}
        ]}>
            <Input placeholder={'再次确认密码'} type="password" id={'cpassword'} allowClear/>
        </Form.Item>
        <Form.Item className={styles["register-btn"]}>
            <Button style={{width: "100%"}}
                    disabled={!authStore.acceptTerms}
                    loading={requestStatus == RequestStatusEnum.isLoading}
                    htmlType="submit" type={"primary"}>注册</Button>
        </Form.Item>
    </Form>
}

const EmailRegisterScreen = ({onError} : {
    onError: (error: unknown) => void
}) => {
    const [form] = Form.useForm();
    const authStore = useAuthStore();
    const [requestStatus, setRequestStatus] = useState<RequestStatusEnum>();

    const handleSubmit = async (values: {email: string, password: string, cpassword: string}) => {
        setRequestStatus(RequestStatusEnum.isLoading);
        try {
            await authStore.register({
                registerType: LoginTypeEnum.EMAIL,
                registerUser: {
                    email: values.email,
                    password: values.password
                },
                roleIds: [1052]
            });
            window.location.href = "/";
        } catch (e: any) {
            onError(e);
        }  finally {
            setRequestStatus(undefined);
        }
    }

    const confirmPwdValidator = (rule: RuleObject, value: StoreValue, callback: (error?: string) => void) => {
        if (value) {
            let rawPwd = form.getFieldValue('password');
            if (rawPwd !== value) {
                callback('两次输入的密码不一致');
            }
        }
        callback();
    }

    return <Form onFinish={handleSubmit} form={form}>
        <Form.Item name={'email'}
                   validateTrigger={'onBlur'}
                   rules={[
                       {required: true, message: "邮箱格式不正确", type: "email"},
                       {validator: emailExistsValidator}
                   ]}
        >
            <Input placeholder={'邮箱'} type="text" id={'email'} allowClear/>
        </Form.Item>
        <Form.Item name={'password'} rules={[
            {required: true, message: "请输入密码"},
            {validator: rawPwdValidator}
        ]}
        >
            <Input placeholder={'密码: 须包含字母和数字，长度为8-30'} type="password" id={'password'} allowClear/>
        </Form.Item>
        <Form.Item name={'cpassword'} rules={[
            {required: true, message: "请确认密码"},
            {validator: confirmPwdValidator}
        ]}>
            <Input placeholder={'再次确认密码'} type="password" id={'cpassword'} allowClear/>
        </Form.Item>
        <Form.Item className={"register-btn"}>
            <Button style={{width: "100%"}} loading={requestStatus == RequestStatusEnum.isLoading} htmlType="submit" type={"primary"}>注册</Button>
        </Form.Item>
    </Form>
}

const PhoneRegisterScreen = ({onError} : {
    onError: (error: unknown) => void
}) => {
    const phonePattern = /^1[3-9]\d{9}$/;
    const phonePatternMessage = "请输入正确的手机号";
    const [form] = Form.useForm();
    const authStore = useAuthStore();
    const [requestStatus, setRequestStatus] = useState<RequestStatusEnum>();
    const [countdown, setCountdown] = useState<number | null>(null);

    const handleSubmit = async (values: {phone: string, password: string, cpassword: string, smsCode?: string,}) => {
        setRequestStatus(RequestStatusEnum.isLoading);
        try {
            await authStore.register({
                registerType: LoginTypeEnum.PHONE,
                registerUser: {
                    phone: values.phone,
                    password: values.password,
                },
                smsCode: values.smsCode,
                userLoginTransaction: userLoginTransactionRecord(values.phone),
                roleIds: [1052]  //暂时写死
            });
            window.location.href = "/";
        } catch (e: any) {
            onError(e);
        }  finally {
            setRequestStatus(undefined);
        }
    }

    const confirmPwdValidator = (rule: RuleObject, value: StoreValue, callback: (error?: string) => void) => {
        if (value) {
            let rawPwd = form.getFieldValue('password');
            if (rawPwd !== value) {
                callback('两次输入的密码不一致');
            }
        }
        callback();
    }

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

    return <Form onFinish={handleSubmit} form={form}>
        <Form.Item name={'phone'}
                   hasFeedback
                   validateTrigger={'onBlur'}
                   rules={[
                       {required: true, message: "请输入手机号"},
                       {pattern: phonePattern, message: phonePatternMessage},
                       {validator: phoneExistsValidator}]}
        >
            <Input placeholder={'手机号码'} type="text" id={'phone'} allowClear/>
        </Form.Item>
        <Form.Item
            name={'password'}
            hasFeedback
            rules={[
            {required: true, message: "请输入密码"},
            {validator: rawPwdValidator}
        ]}
        >
            <Input placeholder={'密码至少8位且至少有数字和字母组成'} type="password" id={'password'} allowClear/>
        </Form.Item>
        <Form.Item
            name={'cpassword'}
            hasFeedback
            rules={[
            {required: true, message: "请确认密码"},
            {validator: confirmPwdValidator}
        ]}>
            <Input placeholder={'再次确认密码'} type="password" id={'cpassword'} allowClear/>
        </Form.Item>
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
        <Form.Item className={"register-btn"}>
            <Button style={{width: "100%"}} loading={requestStatus == RequestStatusEnum.isLoading} htmlType="submit" type={"primary"}>注册</Button>
        </Form.Item>
    </Form>
}
