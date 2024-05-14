import {RuleObject, StoreValue} from "rc-field-form/lib/interface";
import {AuthApi} from "@/app/client/auth";
import {LoginTypeEnum} from "@/app/types/user-vo";

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
        registerType: registerType ?? LoginTypeEnum.ALPHA_TEST_1,  //TODO 暂时使用这个
        fieldValue: value,
    });
    if(result){
        callback("用户名已经存在");
        return Promise.reject(new Error("用户名已经存在"));
    }
    callback();
    return Promise.resolve();
}