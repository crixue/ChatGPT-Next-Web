import {RuleObject, StoreValue} from "rc-field-form/lib/interface";
import {AuthApi} from "@/app/client/auth";
import {CaptchaVerifyRequestVO, ICaptchaResult, LoginTypeEnum, UserLoginTransaction} from "@/app/types/user-vo";
import {ApiRequestException} from "@/app/exceptions/api-request-exception";
import {UserApiClient} from "@/app/client/user-api";
import {collectUserDeviceInfo} from "@/app/utils/common-util";
import {getClientConfig} from "@/app/config/client";

const authApi = new AuthApi();

export const emailExistsValidator = async (rule: RuleObject, value: StoreValue, callback: (error?: string) => void, userId?: string) => {
    const result = await authApi.checkRegisterFieldExists({
        registerType: LoginTypeEnum.PHONE,
        fieldValue: value,
    });
    if(result){
        callback("邮箱已经存在");
        return Promise.reject(new Error("邮箱已经存在"));
    }
    callback();
    return Promise.resolve();
}

export const phoneExistsValidator = async (rule: RuleObject, value: StoreValue, callback: (error?: string) => void, userId?: string) => {
    const result = await authApi.checkRegisterFieldExists({
        registerType: LoginTypeEnum.PHONE,
        fieldValue: value,
        });
    if(result){
        callback("手机号已经存在");
        return Promise.reject(new Error("手机号已经存在"));
    }
    callback();
    return Promise.resolve();
}

export const userNameExistsValidator = async (rule: RuleObject, value: StoreValue, callback: (error?: string) => void,
                                              registerType?: LoginTypeEnum) => {
    const result = await authApi.checkRegisterFieldExists({
        registerType: registerType ?? LoginTypeEnum.EMAIL,
        fieldValue: value,
    });
    if(result){
        callback("用户名已经存在");
        return Promise.reject(new Error("用户名已经存在"));
    }
    callback();
    return Promise.resolve();
}

const captchaCallback = (res: ICaptchaResult) => {
    // 暂时不处理
}

const loadErrorCallback = () => {
    var appid = '195406904';

    // 生成容灾票据或自行做其它处理
    var ticket = 'trerror_1001_' + appid + '_' + Math.floor(new Date().getTime() / 1000);
    captchaCallback({
        ret: 0,
        randstr: '@' + Math.random().toString(36).substr(2),
        ticket: ticket,
        errorCode: 1001,
        errorMessage: 'jsload_error',
    });
}

export const popUpCaptcha = async (phoneNum: string, onSuccess?: (data: CaptchaVerifyRequestVO) => void,
                                   onError?: (error: unknown) => void
                                   ) => {
    const userApiClient = new UserApiClient();

    try {
        var ifPopUpCaptcha = await userApiClient.ableToPopupCaptchaCode(phoneNum);
        if (!ifPopUpCaptcha) {
            //不需要弹出验证码
            var captchaVerifyRequestVO = {
                phoneNum: phoneNum,
                ticket: "",
                randstr: ""
            }
            if (onSuccess) {
                onSuccess(captchaVerifyRequestVO);
            }
            return;
        }
        var aidEncrypted =  await userApiClient.generateCaptchaAppId();
        // @ts-ignore
        const captcha = new TencentCaptcha(getClientConfig()?.captchaAppId,
            (res: ICaptchaResult) => {
                console.log('callback:', res);
                var captchaVerifyRequestVO = {
                    phoneNum: phoneNum,
                    ticket: res.ticket,
                    randstr: res.randstr
                }
                if (onSuccess) {
                    onSuccess(captchaVerifyRequestVO);
                }
            },
            {aidEncrypted: aidEncrypted}
        );
        captcha.show();
    } catch (e: any) {
        if (e instanceof ApiRequestException) {
            if (onError) {
                onError(e);
            }
            return;
        }
        loadErrorCallback();
    }
}

export const userLoginTransactionRecord = (phoneNum: string) => {
    const userDeviceInfo = collectUserDeviceInfo();
    const deviceInfoCollector = {
        ...userDeviceInfo,
        phoneNum: phoneNum,
        loginType: 2,
    } as UserLoginTransaction;
    return deviceInfoCollector;
}