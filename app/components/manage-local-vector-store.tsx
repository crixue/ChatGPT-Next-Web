import {List, notification, Space} from "antd";
import {useUserFolderStore} from "@/app/store";
import {UserFolderVo} from "@/app/types/user-folder-vo";
import Locales from "@/app/locales";
import Locale from "@/app/locales";
import dayjs from "dayjs";
import React, {ReactElement, useEffect, useState} from "react";
import {TablePagination} from "@/app/types/common-type";
import {IconButton} from "@/app/components/button";
import CloseIcon from "@/app/icons/close.svg";
import styles from "@/app/components/make-local-vector-store.module.scss";
import {useNavigate} from "react-router-dom";
import {UserApiClient} from "@/app/client/user-api";
import {Path} from "@/app/constant";
import {DeleteOutlined, EditOutlined, FileSearchOutlined} from "@ant-design/icons";
import {MakeLocalVectorTaskRecordsView} from "@/app/components/make-local-vector-store";
import LeftIcon from "@/app/icons/left.svg";
import {useGlobalSettingStore} from "@/app/store/global-setting";
import {GlobalLoading} from "@/app/components/global";
import {MakeKnowledgeBaseStoreApi} from "@/app/client/make-kb";


const userService = new UserApiClient();
const makeKnowledgeBaseStoreApi = new MakeKnowledgeBaseStoreApi();

export const useInitUserFolders = (reload: Boolean | undefined) => {
    useEffect(() => {
        (async () => {
            await useUserFolderStore.getState().initUserLocalVSFolders();
        })();
    }, [reload]);
}

export const ManageLocalVectorStorePage = () => {
    const [reload, setReload] = useState(false);  // 用于刷新页面
    useInitUserFolders(reload)

    const [showLoading, setShowLoading] = useState<boolean>(false);
    const userFolderStore = useUserFolderStore();
    const userFolders = userFolderStore.userFolders;
    const navigate = useNavigate();
    const [notify, contextHolder] = notification.useNotification();
    const [showWhichPage, setShowWhichPage] = useState<"mainPage" | "viewPage" | undefined>("mainPage");
    const [viewFolder, setViewFolder] = useState<UserFolderVo | undefined>(undefined);

    const [tablePagination, setTablePagination] = useState<TablePagination>({
        current: 1,
        defaultCurrent: 1,
        defaultPageSize: 6,
    });

    const DeleteItem = ({record}: { record: UserFolderVo }) => {
        const handleDelete = (record: UserFolderVo) => {
            setShowLoading(true);
            makeKnowledgeBaseStoreApi.dropAllKnowledgeBase({userFolderId: record.id})
                .then((res) => {
                    notify.success({
                        message: Locale.Common.OperateSuccess,
                    });
                    setReload(!reload);
                }).catch((err) => {
                notify.error({
                    message: Locale.Common.OperateFailed,
                });
            }).finally(() => {
                setShowLoading(false);
            });
        }

        return (
            <a className={styles["action-item"]} onClick={() => handleDelete(record)}>{Locale.Common.Delete}</a>
        );
    }

    const ViewItem = ({record}: { record: UserFolderVo }) => {
        const handleView = (record: UserFolderVo) => {
            setViewFolder(record);
            setShowWhichPage("viewPage");
        }

        return (
            <a className={styles["action-item"]} onClick={() => handleView(record)}>{Locale.Common.View}</a>
        );
    }


    const BuildItem = ({record}: { record: UserFolderVo }) => {
        const handleBuild = (record: UserFolderVo) => {
            userFolderStore.setCurrentSelectedFolder(record);
            navigate(Path.MakeLocalVSStore);
        }

        return (
            <a className={styles["action-item"]}
               onClick={() => handleBuild(record)}>{Locales.MakeLocalVSStore.StartToBuild}</a>
        );
    }


    let dataSource = (userFolders ?? []).map((item) => {
        let folderDesc = item.folderDesc || "";
        folderDesc = folderDesc.length > 20 ? folderDesc.substring(0, 20) + "..." : folderDesc;

        return {
            ...item,
            folderDesc: folderDesc,
        } as UserFolderVo;
    });

    const fstItem = {
        id: "",
        createdUserId: "-1",
        folderName: "",
        folderNameElement: <a
            style={{color: "#1677ff"}}
            onClick={() => navigate(Path.MakeLocalVSStore)}>{Locale.MakeLocalVSStore.StartToBuildNewVS}</a>,
        folderType: "",
        folderDesc: Locale.MakeLocalVSStore.Descriptions,
    };

    dataSource = [fstItem, ...dataSource];

    const IconText = ({icon, text}: { icon: ReactElement | null; text: string | ReactElement | null }) => (
        <Space>
            <>
                {icon}
                {text}
            </>
        </Space>
    );

    if (showWhichPage === "viewPage") {
        return (
            <>
                {contextHolder}
                <div>
                    <GlobalLoading showLoading={showLoading}/>
                    <div className="window-header" data-tauri-drag-region>
                        <IconButton
                            icon={<LeftIcon/>}
                            text={Locale.NewChat.Return}
                            onClick={() => setShowWhichPage("mainPage")}
                        />
                        <div className="window-actions">
                            <div className="window-action-button"></div>
                            <div className="window-action-button"></div>
                            <div className="window-action-button">
                                <IconButton
                                    icon={<CloseIcon/>}
                                    onClick={() => navigate(-1)}
                                    bordered
                                />
                            </div>
                        </div>
                    </div>
                    <div className={styles["local-vs-container"]}>
                        <MakeLocalVectorTaskRecordsView
                            uploadFolderId={viewFolder?.id ?? ""}
                            showCardTitle={viewFolder?.folderName ?? ""}
                        />
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            {contextHolder}
            <div className="window-header" data-tauri-drag-region>
                <div className="window-header-title">
                    <div className="window-header-main-title">
                        {Locale.ManageLocalVectorStore.Title}
                    </div>
                    <div className="window-header-sub-title">
                        {Locale.ManageLocalVectorStore.SubTitle}
                    </div>
                </div>
            </div>
            <div className={styles["local-vs-container"]}>
                <List
                    itemLayout="vertical"
                    size="large"
                    pagination={{
                        ...tablePagination,
                        total: userFolders ? userFolders.length : 0,
                        onChange: (page, pageSize) => {
                            setTablePagination({
                                ...tablePagination,
                                current: page,
                            });
                        }
                    }}
                    dataSource={dataSource}
                    renderItem={(item) => (
                        <List.Item
                            key={item.id}
                            actions={item.id === "" ? undefined : [
                                <IconText
                                    key={"action-edit"}
                                    icon={<EditOutlined/>}
                                    text={<BuildItem record={item}/>}/>,
                                <IconText
                                    key={"action-check"}
                                    icon={<FileSearchOutlined/>}
                                    text={<ViewItem record={item}/>}/>,
                                <IconText
                                    key={"action-delete"}
                                    icon={<DeleteOutlined/>}
                                    text={<DeleteItem record={item}/>}/>,
                                <IconText
                                    key={"action-updateAt"}
                                    icon={null}
                                    text={item.updateAt ? dayjs(item.updateAt).format("YYYY-MM-DD HH:mm:ss") : null}/>,
                            ]}
                        >
                            <List.Item.Meta
                                title={item.folderNameElement ? item.folderNameElement : item.folderName}
                                description={item.folderDesc}
                            />
                        </List.Item>
                    )}
                />
            </div>
        </>
    );
}
