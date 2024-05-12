import {Avatar, Button, Divider, Form, Image, Input, message, notification, Tabs} from "antd";
import {Rule, RuleObject, StoreValue} from "rc-field-form/lib/interface";
import {useEffect, useState} from "react";
import styles from "./index.module.scss";
import WechatRegisterIcon from "../../icons/wechat-register.svg";
import {emailExistsValidator, phoneExistsValidator, userNameExistsValidator} from "./util";
import {AuthException} from "@/app/exceptions/auth-exception";
import {RequestStatusEnum} from "@/app/constant";
import {LoginTypeEnum} from "@/app/types/user-vo";
import {useAuthStore} from "@/app/store/auth";
import Locales from "@/app/locales";


export const RegisterScreen = () => {
    const [isQuickLogin, setIsQuickLogin] = useState<boolean>(false);

    return (
        <div className={styles["register-container"]}>
            {isQuickLogin ? <QuickRegisterTags/> : <NormalRegisterTags/>}
            <Divider>{isQuickLogin ? <span className={styles["login-type-divider-desc"]}>其他方式注册</span>:
                <span className={styles["login-type-divider-desc"]}>快捷登录</span> }</Divider>
            <div className={"quick-login-container"}>
                {
                    isQuickLogin ?
                        <div className={"normal-login-wrapper"} onClick={() => setIsQuickLogin(false)}>
                            <span>密码注册</span>
                        </div>:
                        <div className={"quick-login-wechat-icon"} onClick={() => setIsQuickLogin(true)}>
                            <Avatar src={WechatRegisterIcon} size={34}/>
                        </div>
                }
            </div>
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
            <UserNameRegisterScreen onError={(err) => {
                if (err !== null) {
                    api.error({
                        message: Locales.RegisterFailed,
                        description: (err as AuthException).message,
                        duration: 3
                    });
                }
            }}/>
            {/*// <Tabs defaultActiveKey={"userName"} centered onChange={handleOnChange} style={{paddingBottom: "8px !important"}}>*/}
            {/*//         <TabPane tab={"用户名/密码"} key={"userName"}>*/}
            {/*//             <UserNameRegisterScreen onError={setErr}/>*/}
            {/*//         </TabPane>*/}
            {/*//         <TabPane tab={"邮箱/密码"} key={"email"}>*/}
            {/*//             <EmailRegisterScreen onError={setErr}/>*/}
            {/*//         </TabPane>*/}
            {/*//         <TabPane tab={"手机/密码"} key={"phone"}>*/}
            {/*//             <PhoneRegisterScreen onError={setErr}/>*/}
            {/*//         </TabPane>*/}
            {/*//     </Tabs>*/}
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
                    registerType: LoginTypeEnum.ALPHA_TEST_1,  //TODO 暂时使用这个
                    registerUser: {
                        username: values.username,
                        password: values.password
                    },
                    roleIds: [1052]  //TODO 暂时写死

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
                   validateTrigger={'onBlur'}
                   rules={[
                    {required: true, message: "请输入用户名"},
                    {max: 16, message: "请限制在16个字符以内"},
                    {validator: userNameExistsValidator}]}
        >
            <Input placeholder={'用户名'} type="text" id={'username'} allowClear/>
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
                roleIds: [1052]  //TODO 暂时写死
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
    const [form] = Form.useForm();
    const authStore = useAuthStore();
    const [requestStatus, setRequestStatus] = useState<RequestStatusEnum>();

    const handleSubmit = async (values: {phone: string, password: string, cpassword: string}) => {
        setRequestStatus(RequestStatusEnum.isLoading);
        try {
            await authStore.register({
                registerType: LoginTypeEnum.PHONE,
                registerUser: {
                    phone: values.phone,
                    password: values.password
                },
                roleIds: [1052]  //TODO 暂时写死
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
        <Form.Item name={'phone'}
                   validateTrigger={'onBlur'}
                   rules={[
                       {required: true, message: "请输入手机号码"},
                       {pattern: /^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/, message: "手机号码格式不正确"},
                       {validator: phoneExistsValidator}]}
        >
            <Input placeholder={'手机号码'} type="text" id={'phone'} allowClear/>
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
