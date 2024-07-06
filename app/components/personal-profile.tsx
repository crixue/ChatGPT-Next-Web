import {ErrorBoundary} from "@/app/components/error";
import Locale from "@/app/locales";
import styles from "@/app/components/personal-profile.module.scss";
import {Button, Form, Image, Input, notification} from "antd";
import React, {useEffect, useState} from "react";
import {UserApiClient} from "@/app/client/user-api";
import {userNameExistsValidator} from "@/app/components/unauthenticated/util";
import {LoginTypeEnum} from "@/app/types/user-vo";
import TextArea from "antd/es/input/TextArea";
import {useAuthStore} from "@/app/store/auth";

const userApi = new UserApiClient();

export const PersonalProfile = () => {
    const [form] = Form.useForm();
    const [notify, contextHolder] = notification.useNotification();
    const [userInfo, setUserInfo] = useState<any>({});
    const [userAvatarUrl, setUserAvatarUrl] = useState<string | undefined>();
    const [retrieveAvatarLoading, setRetrieveAvatarLoading] = useState(false);
    const [saveBtnDisabled, setSaveBtnDisabled] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const authStore = useAuthStore();

    useEffect(() => {
        // fetch balance
        (async () => {
            const userInfo = await userApi.getUserProfile();
            setUserInfo(userInfo);
            setUserAvatarUrl(userInfo.avatar);
            form.setFieldsValue(
                userInfo);
        })();
    }, [refresh]);

    function retrieveRandomAvatarUrl() {
        setRetrieveAvatarLoading(true);
        userApi.randomUserAvatarCdnUrl()
            .then((url) => {
                form.setFieldsValue({avatar: url});
                setUserAvatarUrl(url);
            }).catch((e) => {
            console.error(e);
        }).finally(() => {
            setRetrieveAvatarLoading(false);
        });
    }

    function handleSaveUserProfile(values: any) {
        setSaveLoading(true);
        userApi.saveUserProfile(values)
            .then(() => {
                authStore.refreshToken(authStore.token!);
                notify.success({message: Locale.Common.UpdateSuccess});
                setRefresh(!refresh);
            }).catch((e) => {
            notify.error({message: Locale.Common.OperateFailed});
        }).finally(() => {
            setSaveLoading(false);
        });
    }

    return (
        <>
            {contextHolder}
            <ErrorBoundary>
                <div className="window-header" data-tauri-drag-region>
                    <div className="window-header-title">
                        <div className="window-header-main-title">
                            {Locale.Profile.Title}
                        </div>
                        <div className="window-header-sub-title">
                            {Locale.Profile.SubTitle}
                        </div>
                    </div>
                </div>
                <div className={styles["main-content-container"]}>
                    <div className={styles["form-wrapper"]}>
                        <Form
                            layout="vertical"
                            form={form}
                            onFinish={handleSaveUserProfile}
                        >
                            <Form.Item
                                className={styles["avatar-form-item"]}
                                name={"avatar"}
                                required
                                label={Locale.Profile.Avatar}
                            >
                                <Input style={{display: "None"}} id={'avatar'}/>
                            </Form.Item>
                            <div className={styles["avatar-img-box"]}>
                                <Image src={userAvatarUrl}
                                       preview={false}
                                       style={{borderRadius: "50%"}}
                                       width={96} height={96}/>
                                <div className={styles["avatar-refresh-btn"]}>
                                    <Button loading={retrieveAvatarLoading}
                                            onClick={retrieveRandomAvatarUrl}>
                                        {Locale.Profile.RetrieveNewAvatar}
                                    </Button>
                                </div>
                            </div>
                            <Form.Item
                                name={"username"}
                                label={Locale.Profile.UserName}
                                required
                                hasFeedback
                                validateTrigger={'onBlur'}
                                rules={[
                                    {required: true, message: "请输入用户名"},
                                    {max: 24, message: "请限制在24个字符以内"},
                                    {
                                        validator: (rule, value, callback) => {
                                            if (value === userInfo.username) {
                                                callback();
                                                return Promise.resolve();
                                            }
                                            return userNameExistsValidator(rule, value, callback, LoginTypeEnum.ALPHA_TEST_1);
                                        }
                                    }
                                ]}
                                tooltip={Locale.Profile.UserNameTip}>
                                <Input placeholder={Locale.Profile.UserName} type="text" id={'username'} allowClear/>
                            </Form.Item>
                            <Form.Item
                                name={"email"}
                                label={Locale.Profile.Email}
                                validateTrigger={'onBlur'}
                                hasFeedback
                                tooltip={Locale.Profile.EmailTip}
                                rules={[
                                    {message: "邮箱格式不正确", type: "email"},
                                ]}
                            >
                                <Input
                                    allowClear={true}
                                />
                            </Form.Item>
                            <Form.Item
                                name={"phone"}
                                hasFeedback
                                label={Locale.Profile.Phone}
                                tooltip={Locale.Profile.PhoneTip}>
                                <Input disabled={true}/>
                            </Form.Item>
                            <Form.Item
                                name={"userDesc"}
                                label={Locale.Profile.UserDesc}
                            >
                                <TextArea maxLength={144} showCount/>
                            </Form.Item>
                            <Form.Item className={styles["login-btn"]}>
                                <Button style={{marginTop: "20px"}}
                                        disabled={saveBtnDisabled}
                                        loading={saveLoading}
                                        htmlType="submit"
                                        type={"primary"}>
                                    {Locale.Profile.SaveBtn}
                                </Button>
                            </Form.Item>
                        </Form>
                    </div>
                </div>
            </ErrorBoundary>
        </>
    );
}