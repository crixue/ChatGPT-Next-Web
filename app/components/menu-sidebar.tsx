import {useEffect, useRef, useState} from "react";

import styles from "./menu-sidebar.module.scss";

import {IconButton} from "./button";
import PersonalIcon from "../icons/personal.svg";
import SettingsIcon from "../icons/settings.svg";
import WalletIcon from "../icons/wallet.svg";
import UsageIcon from "../icons/usage.svg";
import ChatGptIcon from "../icons/chatgpt.svg";
import AddIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
import MaskIcon from "../icons/mask.svg";
import PluginIcon from "../icons/plugin.svg";
// import DragIcon from "../icons/drag.svg";
import LeftArrowIcon from "../icons/left.svg";
import RightArrowIcon from "../icons/right.svg";
import HomeIcon from "../icons/home.svg";

import Locale from "../locales";

import {useAppConfig, useChatStore} from "../store";

import {MENU_MAX_SIDEBAR_WIDTH, MENU_MIN_SIDEBAR_WIDTH, MENU_NARROW_SIDEBAR_WIDTH, Path,} from "../constant";

import {Link, useLocation, useNavigate} from "react-router-dom";
import {useMobileScreen} from "../utils";


function useDragSideBar() {
    const limit = (x: number) => Math.min(MENU_MAX_SIDEBAR_WIDTH, x);

    const config = useAppConfig();
    const startX = useRef(0);
    const startDragWidth = useRef(config.sidebarWidth ?? 300);
    const lastUpdateTime = useRef(Date.now());

    const handleMouseMove = useRef((e: MouseEvent) => {
        if (Date.now() < lastUpdateTime.current + 50) {
            return;
        }
        lastUpdateTime.current = Date.now();
        const d = e.clientX - startX.current;
        const nextWidth = limit(startDragWidth.current + d);
        config.update((config) => (config.sidebarWidth = nextWidth));
        console.log(config.sidebarWidth)
    });

    const handleMouseUp = useRef(() => {
        startDragWidth.current = config.sidebarWidth ?? 300;
        window.removeEventListener("mousemove", handleMouseMove.current);
        window.removeEventListener("mouseup", handleMouseUp.current);
    });

    const onDragMouseDown = (e: MouseEvent) => {
        startX.current = e.clientX;

        window.addEventListener("mousemove", handleMouseMove.current);
        window.addEventListener("mouseup", handleMouseUp.current);
    };
    const isMobileScreen = useMobileScreen();
    const shouldNarrow =
        !isMobileScreen && config.sidebarWidth < MENU_MIN_SIDEBAR_WIDTH;

    useEffect(() => {
        const barWidth = shouldNarrow
            ? MENU_NARROW_SIDEBAR_WIDTH
            : limit(config.sidebarWidth ?? 300);
        const sideBarWidth = isMobileScreen ? "100vw" : `${barWidth}px`;
        document.documentElement.style.setProperty("--sidebar-width", sideBarWidth);
    }, [config.sidebarWidth, isMobileScreen, shouldNarrow]);

    return {
        onDragMouseDown,
        shouldNarrow,
    };
}

export function MenuSideBar(props: { className?: string }) {
    const chatStore = useChatStore();
    const appConfigStore = useAppConfig();
    const location = useLocation();

    const shouldNarrow = appConfigStore.shouldNarrowSidebar ?? false;
    // drag side bar
    // const { onDragMouseDown, shouldNarrow } = useDragSideBar();
    const navigate = useNavigate();
    const config = useAppConfig();

    const handleClick = (path: string) => {
        navigate(path, {state: {fromHome: true}})
    }

    const handleNewChatClick = () => {
        if (config.dontShowMaskSplashScreen) {
            chatStore.newSession();
            handleClick(Path.Chat);
        } else {
            handleClick(Path.NewChat);
        }
    }

    return (
        <div
            className={`${styles.sidebar} ${props.className} ${
                shouldNarrow && styles["narrow-sidebar"]
            }`}
        >
            <div className={styles["sidebar-header"]} data-tauri-drag-region>
                <div className={styles["sidebar-title"]} data-tauri-drag-region>
                    Lingro
                </div>
                {/*<div className={styles["sidebar-sub-title"]}>*/}
                {/*  Build your own AI assistant.*/}
                {/*</div>*/}
                <div className={styles["sidebar-logo"] + " no-dark"}>
                    <ChatGptIcon/>
                </div>
            </div>

            <div className={styles["sidebar-divider"]}/>
            <div className={styles["sidebar-body"]}>
                <a
                    className={`${(location.pathname != Path.Home) ?
                        styles["sidebar-bar-primary-box"] :
                        styles["sidebar-bar-primary-box-active-menu-item"]}`}
                    onClick={() => handleClick(Path.Home)}
                >
                    <HomeIcon className={styles["sidebar-bar-primary-box-icon"]}/>
                    {shouldNarrow ? null :
                        <span className={styles["sidebar-bar-primary-box-title"]}>{Locale.Home.Title}</span>}
                </a>
                <a
                    className={`${(location.pathname != Path.NewChat) ?
                        styles["sidebar-bar-primary-box"] :
                        styles["sidebar-bar-primary-box-active-menu-item"]}`}
                    onClick={() => handleNewChatClick()}
                >
                    <AddIcon className={styles["sidebar-bar-primary-box-icon"]}/>
                    {shouldNarrow ? null :
                        <span className={styles["sidebar-bar-primary-box-title"]}>{Locale.Home.NewChat}</span>}
                </a>
                <a
                    className={`${(location.pathname != Path.Masks) ?
                        styles["sidebar-bar-primary-box"] :
                        styles["sidebar-bar-primary-box-active-menu-item"]}`}
                    onClick={() => handleClick(Path.Masks)}
                >
                    <MaskIcon className={styles["sidebar-bar-primary-box-icon"]}/>
                    {shouldNarrow ? null :
                        <span className={styles["sidebar-bar-primary-box-title"]}>{Locale.Mask.Name}</span>}
                </a>
                <a
                    className={`${(location.pathname != Path.ManageLocalVectorStore && location.pathname != Path.MakeLocalVSStore) ?
                        styles["sidebar-bar-primary-box"] :
                        styles["sidebar-bar-primary-box-active-menu-item"]}`}
                    onClick={() => handleClick(Path.ManageLocalVectorStore)}
                >
                    <PluginIcon className={styles["sidebar-bar-primary-box-icon"]}/>
                    {shouldNarrow ? null :
                        <span className={styles["sidebar-bar-primary-box-title"]}>{Locale.LocalVectorStoreName}</span>}
                </a>
                <div className={styles["sidebar-divider"]}/>
                <a
                    className={`${(location.pathname != Path.Wallet) ?
                        styles["sidebar-bar-primary-box"] :
                        styles["sidebar-bar-primary-box-active-menu-item"]}`}
                    onClick={() => handleClick(Path.Wallet)}
                >
                    <WalletIcon className={styles["sidebar-bar-primary-box-icon"]}/>
                    {shouldNarrow ? null :
                        <span className={styles["sidebar-bar-primary-box-title"]}>{Locale.Wallet.Title}</span>}
                </a>
                <a
                    className={`${(location.pathname != Path.Usage) ?
                        styles["sidebar-bar-primary-box"] :
                        styles["sidebar-bar-primary-box-active-menu-item"]}`}
                    onClick={() => handleClick(Path.Usage)}
                >
                    <UsageIcon className={styles["sidebar-bar-primary-box-icon"]}/>
                    {shouldNarrow ? null :
                        <span className={styles["sidebar-bar-primary-box-title"]}>{Locale.Usage.Title}</span>}
                </a>
                <a
                    className={`${(location.pathname != Path.Settings) ?
                        styles["sidebar-bar-primary-box"] :
                        styles["sidebar-bar-primary-box-active-menu-item"]}`}
                    onClick={() => handleClick(Path.Settings)}
                >
                    <SettingsIcon className={styles["sidebar-bar-primary-box-icon"]}/>
                    {shouldNarrow ? null :
                        <span className={styles["sidebar-bar-primary-box-title"]}>{Locale.Settings.Title}</span>}
                </a>

                {/*<IconButton*/}
                {/*    icon={<PluginIcon/>}*/}
                {/*    text={shouldNarrow ? undefined : Locale.LocalVectorStoreName}*/}
                {/*    className={styles["sidebar-bar-button"]}*/}
                {/*    onClick={() => navigate(Path.ManageLocalVectorStore, {state: {fromHome: true}})}*/}
                {/*    shadow*/}
                {/*/>*/}
            </div>
            <div className={styles["sidebar-tail"]}>
                <a
                    className={`${(location.pathname != Path.Personal) ?
                        styles["sidebar-bar-primary-box"] :
                        styles["sidebar-bar-primary-box-active-menu-item"]}`}
                    onClick={() => handleClick(Path.Personal)}
                >
                    <PersonalIcon className={styles["sidebar-bar-primary-box-icon"]}/>
                    {shouldNarrow ? null :
                        <span className={styles["sidebar-bar-primary-box-title"]}>{Locale.Profile.SideBarTitle}</span>}
                </a>
            </div>
            <div
                className={styles["sidebar-drag"]}
                // onMouseDown={(e) => onDragMouseDown(e as any)}
                onClick={() => {
                    appConfigStore.update((config) => {
                            config.shouldNarrowSidebar = !config.shouldNarrowSidebar;
                        }
                    );
                }}
            >
                {!shouldNarrow ? <LeftArrowIcon/> : <RightArrowIcon/>}
            </div>
        </div>
    );
}
