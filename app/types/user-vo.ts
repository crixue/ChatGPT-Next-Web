
export enum LoginTypeEnum {
    EMAIL, PHONE, USERNAME, QUICK_LOGIN_WX,
    ALPHA_TEST_1,
    ALPHA_TEST_2,
}

export interface User {
    userId?: string;
    username?: string;
    password?: string;
    email?: string;
    phone?: string;
    status?: number;
    sex?: number;
    avatar?: string;
    userDesc?: string;
    descShown?: number;
    createdAt?: string;
    updatedAt?: string;
    lastPasswordResetDate?: string;
}

export interface UserLoginTransaction {
    phoneNum?: string;
    loginType?: number;  //1: 注册；2：登录
    deviceName?: string;
    channel?: number;
    deviceSystemName?: string;
    isPhysicalDevice?: boolean;
}

export interface CaptchaVerifyRequestVO {
    phoneNum: string;
    ticket: string;
    randstr?: string;
}

export interface UserLoginParamVO {
    loginType: LoginTypeEnum;
    loginUser: User;
    smsCode?: string;
    userLoginTransaction?: UserLoginTransaction;
    captchaVerifyRequestVO?: CaptchaVerifyRequestVO;
    useSmsCodeLogin?: boolean;
}

export interface UserRegisterParamVO {
    registerType: LoginTypeEnum;
    registerUser: User;
    roleIds?: number[];
    smsCode?: string;
    userLoginTransaction?: UserLoginTransaction;
}

export interface UserRole {
    id?: number;
    userId?: string;
    roleId?: number;
}

export interface UserShownVO {
    user: User;
    userRoles?: UserRole[];
    token: string;
}

export interface UserRegisterFiledCheckParamVO {
    registerType: LoginTypeEnum;
    fieldValue: string;
}

export interface UserProfileVO {
    username?: string;
    email?: string;
    phone?: string;
    avatar?: string;
    userDesc?: string;
}

export interface ICaptchaResult {
    ret: number;
    ticket: string;
    randstr: string;
    CaptchaAppId?: string;
    bizState?: string;
    errorCode?: number;
    errorMessage?: string;
}
