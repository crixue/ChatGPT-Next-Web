import {User, UserLoginParamVO, UserRegisterParamVO, UserShownVO} from "@/app/types/user-vo";
import {create} from "zustand";
import {persist} from "zustand/middleware";
import {StoreKey} from "@/app/constant";
import {AuthApi} from "@/app/client/auth";


interface AuthStore {
    user: UserShownVO | null;
    setUser: (user: UserShownVO) => void;
    token?: string | null;
    login: (userLoginParamVO: UserLoginParamVO) => Promise<UserShownVO>;
    logout: () => void;
    register: (userRegisterParamVO: UserRegisterParamVO) => Promise<UserShownVO>;
    validateTokenIsExpired: (token: string) => Promise<boolean>;
    refreshToken: (oldToken: string) => Promise<string>;
}

const authApi = new AuthApi();

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            user: null,
            setUser: (user: UserShownVO) => {
                set({user: user});
            },
            getUser: () => {
                return get().user;
            },
            token: null,
            getToken: () => {
                return get().token;
            },
            login: async (userLoginParamVO: UserLoginParamVO) => {
                const userShowVO = await authApi.userLogin(userLoginParamVO);
                set({user: userShowVO, token: userShowVO?.token});
                return userShowVO;
            },
            logout: () => {
                set({user: null, token: null});
            },
            register: async (userRegisterParamVO: UserRegisterParamVO) => {
                const userShowVO = await authApi.userRegister(userRegisterParamVO);
                set({user: userShowVO, token: userShowVO?.token});
                return userShowVO;
            },
            validateTokenIsExpired: async (token: string) => {
                return await authApi.validateTokenIsExpired(token);
            },
            refreshToken: async (oldToken: string) => {
                const userShowVO = await authApi.refreshToken(oldToken);
                set({user: userShowVO, token: userShowVO?.token});
                return userShowVO.token;
            },
        }),
        {
            name: StoreKey.Auth,
        }
    )
);


