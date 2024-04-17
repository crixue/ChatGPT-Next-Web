
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

export interface UserLoginParamVO {
    loginType: LoginTypeEnum;
    loginUser: User;
    smsCode?: string;
}

export interface UserRegisterParamVO {
    registerType: LoginTypeEnum;
    registerUser: User;
    roleIds?: number[];
    smsCode?: string;
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
