"use client";


import React, {useEffect, useState} from "react";

import styles from "./home.module.scss";

import BotIcon from "../icons/bot.svg";
import LoadingIcon from "../icons/three-dots.svg";

import {getCSSVar, useMobileScreen} from "../utils";

import dynamic from "next/dynamic";
import {Path, SlotID} from "../constant";
import {ErrorBoundary} from "./error";

import {getISOLang} from "../locales";

import {HashRouter as Router, Route, Routes, useLocation,} from "react-router-dom";
import {HistorySidebar} from "./history-sidebar";
import {useAppConfig} from "../store/config";
import {getClientConfig} from "../config/client";
import {useMaskStore} from "../store";
import {useAuthStore} from "@/app/store/auth";
import {MenuSideBar} from "@/app/components/menu-sidebar";
import {UnauthenticatedApp} from "@/app/components/unauthenticated";


require("../polyfill");

export function Loading(props: { noLogo?: boolean }) {
    return (
        <div className={styles["loading-content"] + " no-dark"}>
            {!props.noLogo && <BotIcon/>}
            <div style={{marginTop: "24px"}}>
                <LoadingIcon/>
            </div>
        </div>
    );
}

const Settings = dynamic(async () => (await import("./settings")).Settings, {
    loading: () => <Loading noLogo/>,
});

const Chat = dynamic(async () => (await import("./chat")).Chat, {
    loading: () => <Loading noLogo/>,
});

const NewChat = dynamic(async () => (await import("./new-chat")).NewChat, {
    loading: () => <Loading noLogo/>,
});

const MaskPage = dynamic(async () => (await import("./mask")).MaskPage, {
    loading: () => <Loading noLogo/>,
});

const MakeLocalVectorStorePage = dynamic(async () => (await import("./make-local-vector-store")).MakeLocalVectorStorePage, {
    loading: () => <Loading noLogo/>,
});

const ManageLocalVectorStorePage = dynamic(async () => (await import("./manage-local-vector-store")).ManageLocalVectorStorePage, {
    loading: () => <Loading noLogo/>,
});

const PluginsPage = dynamic(async () => (await import("./plugins")).PluginsPage, {
    loading: () => <Loading noLogo/>,
});

const WalletPage = dynamic(async () => (await import("./wallet")).Wallet, {
    loading: () => <Loading noLogo/>,
});

const UsagePage = dynamic(async () => (await import("./user-usage")).UserUsage, {
    loading: () => <Loading noLogo/>,
});

const PersonalProfilePage = dynamic(async () => (await import("./personal-profile")).PersonalProfile, {
    loading: () => <Loading noLogo/>,
});

export function useSwitchTheme() {
    const config = useAppConfig();

    useEffect(() => {
        document.body.classList.remove("light");
        document.body.classList.remove("dark");

        if (config.theme === "dark") {
            document.body.classList.add("dark");
        } else if (config.theme === "light") {
            document.body.classList.add("light");
        }

        const metaDescriptionDark = document.querySelector(
            'meta[name="theme-color"][media*="dark"]',
        );
        const metaDescriptionLight = document.querySelector(
            'meta[name="theme-color"][media*="light"]',
        );

        if (config.theme === "auto") {
            metaDescriptionDark?.setAttribute("content", "#151515");
            metaDescriptionLight?.setAttribute("content", "#fafafa");
        } else {
            const themeColor = getCSSVar("--theme-color");
            metaDescriptionDark?.setAttribute("content", themeColor);
            metaDescriptionLight?.setAttribute("content", themeColor);
        }
    }, [config.theme]);
}

function useHtmlLang() {
    useEffect(() => {
        const lang = getISOLang();
        const htmlLang = document.documentElement.lang;

        if (lang !== htmlLang) {
            document.documentElement.lang = lang;
        }
    }, []);
}

const useHasHydrated = () => {
    const [hasHydrated, setHasHydrated] = useState<boolean>(false);

    useEffect(() => {
        setHasHydrated(true);
    }, []);

    return hasHydrated;
};

const loadAsyncGoogleFont = () => {
    const linkEl = document.createElement("link");
    const proxyFontUrl = "/google-fonts";
    const remoteFontUrl = "https://fonts.googleapis.com";
    const googleFontUrl =
        getClientConfig()?.buildMode === "export" ? remoteFontUrl : proxyFontUrl;
    linkEl.rel = "stylesheet";
    linkEl.href =
        googleFontUrl + "/css2?family=Noto+Sans:wght@300;400;700;900&display=swap";
    document.head.appendChild(linkEl);
};

function Screen() {
    const config = useAppConfig();
    const location = useLocation();
    const authStore = useAuthStore();
    const isHome = location.pathname === Path.Home;
    const showHistoryMenuBar =
        location.pathname === Path.Home
        || location.pathname === Path.Chat
    ;

    // const needAuth = location.pathname === Path.Auth;
    const needAuth = authStore.user === null || !authStore.token;
    const isMobileScreen = useMobileScreen();

    useEffect(() => {
        loadAsyncGoogleFont();
    }, []);

    return (
        <div className={styles["main-container"]}>
            <div
                className={
                    ` ${(config.tightBorder && !isMobileScreen) || needAuth ? styles["tight-container"] : styles.container}`
                }>
                <>
                    {needAuth ? (
                        <div style={{display: "flex"}}>
                            <div className={styles["overlay"]}>
                                <UnauthenticatedApp/>
                            </div>
                        </div>
                    ) : null}
                    <MenuSideBar className={isHome ? styles["sidebar-show"] : ""}/>
                    {showHistoryMenuBar ? <HistorySidebar className={isHome ? styles["sidebar-show"] : ""}/> : null}
                    <div className={styles["window-main-container"]}>
                        <div className={styles["window-content"]} id={SlotID.AppBody}>
                            <Routes>
                                <Route path={Path.Home} element={<Chat/>}/>
                                <Route path={Path.NewChat} element={<NewChat/>}/>
                                <Route path={Path.Masks} element={<MaskPage/>}/>
                                <Route path={Path.Chat} element={<Chat/>}/>
                                <Route path={Path.Settings} element={<Settings/>}/>
                                <Route path={Path.MakeLocalVSStore} element={<MakeLocalVectorStorePage/>}/>
                                <Route path={Path.ManageLocalVectorStore} element={<ManageLocalVectorStorePage/>}/>
                                <Route path={Path.Plugins} element={<PluginsPage/>}/>
                                <Route path={Path.Wallet} element={<WalletPage/>}/>
                                <Route path={Path.Usage} element={<UsagePage/>}/>
                                <Route path={Path.Personal} element={<PersonalProfilePage/>}/>
                            </Routes>
                        </div>
                    </div>
                </>
            </div>
            <div className={styles["window-footer"]}>
                <p>© 2024 Lingro CopyRight |
                    <a href="https://beian.miit.gov.cn/" target="_blank">蜀ICP备2024083320号</a>
                    | <span>安全举报：Lingro001@163.com</span>
                </p>
            </div>
        </div>
    );
}

export function useLoadData() {
    useEffect(() => {
        (async () => {
            await useAppConfig.getState().allModels();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}

export function useRefreshToken() {
    useEffect(() => {
        (async () => {
            const token = useAuthStore.getState().token;
            if (!token || token === "") {
                return;
            }
            await useAuthStore.getState().refreshToken(token);
            // console.log("Refresh user token...");
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}


export function useInitMasks() {
    useEffect(() => {
        (async () => {
            await useMaskStore.getState().initMasks();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return true;
}

export function Home() {
    useInitMasks();
    useSwitchTheme();
    useLoadData();
    useRefreshToken();
    useHtmlLang();

    if (!useHasHydrated()) {
        return <Loading/>;
    }

    return (
        <ErrorBoundary>
            <Router>
                <Screen/>
            </Router>
        </ErrorBoundary>
    );
}
