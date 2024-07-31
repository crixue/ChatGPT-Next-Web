import React, {useEffect, useRef, useState} from "react";

import styles from "./menu-sidebar.module.scss";

import {IconButton} from "./button";
import PersonalIcon from "../icons/personal.svg";
import SettingsIcon from "../icons/settings.svg";
import WalletIcon from "../icons/wallet.svg";
import UsageIcon from "../icons/usage.svg";
import ChatGptIcon from "../icons/lingro-logo.svg";
import AddIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
import MaskIcon from "../icons/mask.svg";
import PluginIcon from "../icons/plugin.svg";
// import DragIcon from "../icons/drag.svg";
import LeftArrowIcon from "../icons/left.svg";
import RightArrowIcon from "../icons/right.svg";
import HomeIcon from "../icons/home.svg";
import MobileTerminalIcon from "../icons/mobile_terminal.svg";
import FeedbackIcon from "../icons/feedback.svg";

import Locale from "../locales";

import {useAppConfig, useChatStore} from "../store";

import {MENU_MAX_SIDEBAR_WIDTH, MENU_MIN_SIDEBAR_WIDTH, MENU_NARROW_SIDEBAR_WIDTH, Path,} from "../constant";

import {Link, useLocation, useNavigate} from "react-router-dom";
import {useMobileScreen} from "../utils";
import {
    Button,
    Dropdown,
    Input,
    MenuProps,
    Modal,
    notification,
    Popconfirm,
    Popover,
    QRCode,
    Tabs,
    Tooltip
} from "antd";
import {AndroidOutlined, AppleOutlined} from "@ant-design/icons";
import ChatGptQRCodeIcon from "@/app/icons/lingro-logo-36px-round.svg";
import {PaymentOderApi} from "@/app/client/payment-oder-api";
import {ApiRequestException} from "@/app/exceptions/api-request-exception";

const paymentOrderApiClient = new PaymentOderApi();

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
                    {shouldNarrow ?
                        <Tooltip placement="right" title={Locale.Home.Title}
                                 trigger={["hover"]}
                                 arrow={true}
                        > <HomeIcon className={styles["sidebar-bar-primary-box-icon"]}/>
                        </Tooltip> :
                        <HomeIcon className={styles["sidebar-bar-primary-box-icon"]}/>
                    }
                    {shouldNarrow
                        ? null
                        : <span className={styles["sidebar-bar-primary-box-title"]}>{Locale.Home.Title}</span>}
                </a>
                <a
                    className={`${(location.pathname != Path.NewChat) ?
                        styles["sidebar-bar-primary-box"] :
                        styles["sidebar-bar-primary-box-active-menu-item"]}`}
                    onClick={() => handleNewChatClick()}
                >
                    {shouldNarrow ?
                        <Tooltip placement="right" title={Locale.Home.NewChat}
                                 trigger={["hover"]}
                                 arrow={true}
                        >
                            <AddIcon className={styles["sidebar-bar-primary-box-icon"]}/>
                        </Tooltip> :
                        <AddIcon className={styles["sidebar-bar-primary-box-icon"]}/>}
                    {shouldNarrow ? null :
                        <span className={styles["sidebar-bar-primary-box-title"]}>{Locale.Home.NewChat}</span>}
                </a>
                <a
                    className={`${(location.pathname != Path.Masks) ?
                        styles["sidebar-bar-primary-box"] :
                        styles["sidebar-bar-primary-box-active-menu-item"]}`}
                    onClick={() => handleClick(Path.Masks)}
                >
                    {shouldNarrow ?
                        <Tooltip placement="right" title={Locale.Mask.Name}
                                 trigger={["hover"]}
                                 arrow={true}
                        >
                            <MaskIcon className={styles["sidebar-bar-primary-box-icon"]}/>
                        </Tooltip> :
                        <MaskIcon className={styles["sidebar-bar-primary-box-icon"]}/>}
                    {shouldNarrow ? null :
                        <span className={styles["sidebar-bar-primary-box-title"]}>{Locale.Mask.Name}</span>}
                </a>
                <a
                    className={`${(location.pathname != Path.ManageLocalVectorStore && location.pathname != Path.MakeLocalVSStore) ?
                        styles["sidebar-bar-primary-box"] :
                        styles["sidebar-bar-primary-box-active-menu-item"]}`}
                    onClick={() => handleClick(Path.ManageLocalVectorStore)}
                >
                    {shouldNarrow ?
                        <Tooltip placement="right" title={Locale.LocalVectorStoreName}
                                 trigger={["hover"]}
                                 arrow={true}
                        >
                            <PluginIcon className={styles["sidebar-bar-primary-box-icon"]}/>
                        </Tooltip> :
                        <PluginIcon className={styles["sidebar-bar-primary-box-icon"]}/>}
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
                    {shouldNarrow ?
                        <Tooltip placement="right" title={Locale.Wallet.Title}
                                 trigger={["hover"]}
                                 arrow={true}
                        >
                            <WalletIcon className={styles["sidebar-bar-primary-box-icon"]}/>
                        </Tooltip> :
                        <WalletIcon className={styles["sidebar-bar-primary-box-icon"]}/>}
                    {shouldNarrow ? null :
                        <span className={styles["sidebar-bar-primary-box-title"]}>{Locale.Wallet.Title}</span>}
                </a>
                <a
                    className={`${(location.pathname != Path.Usage) ?
                        styles["sidebar-bar-primary-box"] :
                        styles["sidebar-bar-primary-box-active-menu-item"]}`}
                    onClick={() => handleClick(Path.Usage)}
                >
                    {shouldNarrow ?
                        <Tooltip placement="right" title={Locale.Usage.Title}
                                 trigger={["hover"]}
                                 arrow={true}
                        >
                            <UsageIcon className={styles["sidebar-bar-primary-box-icon"]}/>
                        </Tooltip> :
                        <UsageIcon className={styles["sidebar-bar-primary-box-icon"]}/>}
                    {shouldNarrow ? null :
                        <span className={styles["sidebar-bar-primary-box-title"]}>{Locale.Usage.Title}</span>}
                </a>
                <a
                    className={`${(location.pathname != Path.Settings) ?
                        styles["sidebar-bar-primary-box"] :
                        styles["sidebar-bar-primary-box-active-menu-item"]}`}
                    onClick={() => handleClick(Path.Settings)}
                >
                    {shouldNarrow ?
                        <Tooltip placement="right" title={Locale.Settings.Title}
                                 trigger={["hover"]}
                                 arrow={true}
                        >
                            <SettingsIcon className={styles["sidebar-bar-primary-box-icon"]}/>
                        </Tooltip> :
                        <SettingsIcon className={styles["sidebar-bar-primary-box-icon"]}/>}
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
                <Popover
                    placement="topLeft"
                    title={"扫码下载 Lingro App"}
                    content={<DownloadAppTag/>}
                    trigger={"click"}
                >
                    <a
                        className={styles["sidebar-bar-primary-box"]}
                    >
                        {shouldNarrow ?
                            <Tooltip placement="right" title={Locale.MobileTerminal.Title}
                                     trigger={["hover"]}
                                     arrow={true}
                            >
                                <MobileTerminalIcon className={styles["sidebar-bar-primary-box-icon"]}/>
                            </Tooltip> :
                            <MobileTerminalIcon className={styles["sidebar-bar-primary-box-icon"]}/>}
                        {shouldNarrow ? null :
                            <span
                                className={styles["sidebar-bar-primary-box-title"]}>{Locale.MobileTerminal.Title}</span>}
                    </a>
                </Popover>
                <MyDropDownComponent shouldNarrow={shouldNarrow}/>
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

const MyDropDownComponent = ({shouldNarrow}: { shouldNarrow: boolean }) => {
    const navigate = useNavigate();
    const [openSubmitReferralCode, setOpenSubmitReferralCode] = useState(false);
    const [notify, contextHolder] = notification.useNotification();

    const applyReferralCode = async (referralCodeVal: string) => {
        if (referralCodeVal == '' || referralCodeVal.length < 6) {
            return;
        }
        let snakBarMsg = '暂时无法兑换邀请码，请您稍后重试';
        try {
            let tips = await paymentOrderApiClient.applyReferralCode(referralCodeVal);
            snakBarMsg = "兑换成功，" + tips;
        } catch (e) {
            if (e instanceof ApiRequestException) {
                switch (e.businessCode) {
                    case 70021:
                        snakBarMsg = '您已兑换过此邀请码，请勿重复兑换';
                        break;
                    case 70022:
                        snakBarMsg = '邀请码已过期或不存在';
                        break;
                    case 70023:
                        snakBarMsg = '邀请码奖励已发放完毕，下次早点来哦';
                        break;
                    default:
                        break;
                }
            }
        } finally {
            setOpenSubmitReferralCode(false);
            notify.info({
                message: '邀请码兑换',
                description: snakBarMsg,
                duration: 4,
            });
        }
    }

    const hideReferralCodeDialog = () => {
        setOpenSubmitReferralCode(false);
    }

    const items: MenuProps['items'] = [
        {
            label: <a
                onClick={() => navigate(Path.Personal, {state: {fromHome: true}})}
            >个人资料</a>,
            key: '0',
        },
        {
            type: 'divider',
        },
        {
            label: <a
                onClick={() => {
                    setOpenSubmitReferralCode(true);
                }}
            >邀请码</a>,
            key: '3',
        },
        {
            type: 'divider',
        },
        {
            label: <Popover
                placement="topLeft"
                title={"意见反馈"}
                content={
                    <div>
                        <p>请在微信中搜索并关注公众号【灵格若科技】进行反馈</p>
                        <p>感谢您使用我们的产品，您的意见对我们非常重要！</p>
                    </div>
                }  //"请在微信中搜索并关注公众号【灵格若科技】进行反馈\\n\\n感谢您使用我们的产品，您的意见对我们非常重要！"
                trigger={"click"}
            >
                <a>意见反馈</a>
            </Popover>,
            key: '1',
        },
    ];

    return (
        <>
            {contextHolder}
            <div
                className={`${(location.pathname != Path.Personal) ?
                    styles["sidebar-bar-primary-box"] :
                    styles["sidebar-bar-primary-box-active-menu-item"]}`}
            >
                <Modal
                    width={300}
                    title="输入邀请码"
                    open={openSubmitReferralCode}
                    footer={null}
                    onCancel={hideReferralCodeDialog}
                    cancelText="取消"
                >
                    <Input.OTP
                        style={{
                            marginTop: '20px',
                            marginBottom: '20px'
                        }}
                        placeholder="请输入邀请码"
                        length={6}
                        onChange={
                            (val) => {
                                applyReferralCode(val);
                            }
                        }/>
                </Modal>
                <Dropdown placement={"topLeft"} menu={{items}} trigger={['click']}>
                    <div>
                        {shouldNarrow ?
                            <Tooltip placement="right" title={Locale.Profile.SideBarTitle}
                                     trigger={["hover"]}
                                     arrow={true}
                            >
                                <PersonalIcon className={styles["sidebar-bar-primary-box-icon"]}/>
                            </Tooltip> :
                            <PersonalIcon className={styles["sidebar-bar-primary-box-icon"]}/>}
                        {shouldNarrow ? null :
                            <span
                                className={styles["sidebar-bar-primary-box-title"]}>{Locale.Profile.SideBarTitle}</span>}
                    </div>
                </Dropdown>
            </div>
        </>

    )
}

const DownloadAppTag = () => {
    const AndroidAppDownloadQRCodeComponent = () => {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                <QRCode
                    errorLevel="H"
                    value="https://cdn.i-lingro.com/archives/lingro-latest.apk"
                />
            </div>
        );
    }

    const IOSAppDownloadQRCodeComponent = () => {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                <span>正在开发中，敬请期待...</span>
            </div>
        );
    }

    return (
        <>
            <Tabs
                defaultActiveKey="1"
                items={
                    [
                        {
                            key: "Android",
                            label: `下载Android App`,
                            children: <AndroidAppDownloadQRCodeComponent/>,
                            icon: <AndroidOutlined/>,
                        },
                        {
                            key: "iOS",
                            label: `下载iOS App`,
                            children: <IOSAppDownloadQRCodeComponent/>,
                            icon: <AppleOutlined/>,
                        }
                    ]
                }
            />
        </>
    );
}
