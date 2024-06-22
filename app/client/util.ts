import {ServerResponse} from "@/app/common-api";
import {ApiRequestException} from "@/app/exceptions/api-request-exception";

export const handleAuthServerResponse = <T>(response: ServerResponse<T>) => {
    if (response.code !== 0) {
        console.log("[handleAuthServerResponse] response code:" + response.code);
        let showMsg = response.msg;
        switch (response.code) {
            case 60001:
                showMsg = '用户验证失败，请重新登录';
                break;
            case 60002:
                showMsg = '账号已被注册';
                break;
            case 60005:
                showMsg = '用户名不存在或密码错误';
                break;
            case 60006:
                showMsg = '用户名长度超过16位限制';
                break;
            case 60013:
                showMsg = '密码不能为空';
                break;
            case 60014:
                showMsg = '无效的注册/登录类型';
                break;
            case 60115:
                showMsg = '当前账号存在风险，请稍后重试';
                break;
            case 60118:
                showMsg = '当前账号存在风险，请五分钟后重试';
                break;
            case 60119:
                showMsg = '验证码已失效，请重新发送验证码';
                break;
            case 60120:
                showMsg = '验证码错误，请重新输入';
                break;
            case 60222:
                showMsg = '验证码验证失败，请重新认证';
                break;
            case 60122:
                showMsg = '当前用户还未注册，请先注册后再登录';
                break;
        }
        throw new ApiRequestException(showMsg, 200, response.code);
    }
    return response.data;
}