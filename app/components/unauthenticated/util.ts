import {RuleObject, StoreValue} from "rc-field-form/lib/interface";
import {AuthApi} from "@/app/client/auth";
import {LoginTypeEnum} from "@/app/types/user-vo";

const authApi = new AuthApi();

export const emailExistsValidator = async (rule: RuleObject, value: StoreValue, callback: (error?: string) => void, userId?: string) => {
    await authApi.checkRegisterFieldExists({
        registerType: LoginTypeEnum.EMAIL,
        fieldValue: value,})
        .then(resp => {
            if (resp) {
                callback("邮箱已经存在");
            }
            callback();
        }).catch(err => {
        callback(err.message);
    })
}

export const phoneExistsValidator = async (rule: RuleObject, value: StoreValue, callback: (error?: string) => void, userId?: string) => {
    await authApi.checkRegisterFieldExists({
        registerType: LoginTypeEnum.PHONE,
        fieldValue: value,
        })
        .then(resp => {
            if (resp) {
                callback("手机号已经存在");
            }
            callback();
        }).catch(err => {
        callback(err.message);
    })
}

export const userNameExistsValidator = async (rule: RuleObject, value: StoreValue, callback: (error?: string) => void, userId?: string) => {
    await authApi.checkRegisterFieldExists({
        registerType: LoginTypeEnum.USERNAME,
        fieldValue: value,
        })
        .then(resp => {
            if (resp) {
                callback("用户名已经存在");
            }
            callback();
        }).catch(err => {
        callback(err.message);
    })
}