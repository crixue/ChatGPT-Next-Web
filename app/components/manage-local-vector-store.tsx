import {List, notification, Popconfirm, Space, Table} from "antd";
import {useUserFolderStore} from "@/app/store";
import {ColumnsType} from "antd/es/table";
import {UserFolderVO} from "@/app/types/user-folder.vo";
import Locales from "@/app/locales";
import dayjs from "dayjs";
import React, {ReactElement, useEffect, useState} from "react";
import {TablePagination} from "@/app/types/common-type";
import Locale from "@/app/locales";
import {IconButton} from "@/app/components/button";
import CloseIcon from "@/app/icons/close.svg";
import styles from "@/app/components/make-local-vector-store.module.scss";
import {useNavigate} from "react-router-dom";
import {UserApiClient} from "@/app/client/user";
import {Path} from "@/app/constant";
import {DeleteOutlined, EditOutlined, FileSearchOutlined} from "@ant-design/icons";
import {MakeLocalVectorTaskRecordsView} from "@/app/components/make-local-vector-store";
import {it} from "node:test";
import LeftIcon from "@/app/icons/left.svg";
import {useGlobalSettingStore} from "@/app/store/global-setting";


const userService = new UserApiClient();

export const useInitUserFolders = (reload: Boolean | undefined) => {
    useEffect(() => {
        (async () => {
            await useUserFolderStore.getState().initUserLocalVSFolders();
        })();
    },[reload]);
}

export const ManageLocalVectorStorePage = () => {
    const [reload, setReload] = useState(false);  // 用于刷新页面
    useInitUserFolders(reload)

    const globalSettingStore = useGlobalSettingStore();
    const userFolderStore = useUserFolderStore();
    const userFolders = userFolderStore.userFolders;
    const navigate = useNavigate();
    const [notify, contextHolder] = notification.useNotification();
    const [showWhichPage, setShowWhichPage] = useState<"mainPage" | "viewPage" | undefined>("mainPage");
    const [viewFolder, setViewFolder] = useState<UserFolderVO | undefined>(undefined);

    const [tablePagination, setTablePagination] = useState<TablePagination>({
        current: 1,
        defaultCurrent: 1,
        defaultPageSize: 8,
    });

    const DeleteItem = ({record}: {record: UserFolderVO}) => {
        const handleDelete = (record: UserFolderVO) => {
            globalSettingStore.switchShowGlobalLoading("Deleting...");
            userService.deleteUserFolder({userFolderId: record.id})
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
                    globalSettingStore.switchShowGlobalLoading();
                });
        }

        return (
            <a className={styles["action-item"]} onClick={() => handleDelete(record)}>{Locale.Common.Delete}</a>
        );
    }

    const ViewItem = ({record}: {record: UserFolderVO}) => {
        const handleView = (record: UserFolderVO) => {
            setViewFolder(record);
            setShowWhichPage("viewPage");
        }

        return (
            <a className={styles["action-item"]} onClick={() => handleView(record)}>{Locale.Common.View}</a>
        );
    }


    const BuildItem = ({record}: {record: UserFolderVO}) => {
        const handleBuild = (record: UserFolderVO) => {
            userFolderStore.setCurrentSelectedFolder(record);
            navigate(Path.MakeLocalVSStore);
        }

        return (
            <a className={styles["action-item"]} onClick={() => handleBuild(record)}>{Locales.MakeLocalVSStore.StartToBuild}</a>
        );
    }


    let dataSource = (userFolders ?? []).map((item) => {
        let folderDesc = item.folderDesc || "";
        folderDesc = folderDesc.length > 20 ? folderDesc.substring(0, 20) + "..." : folderDesc;

        return {
            ...item,
            folderDesc: folderDesc,
        } as UserFolderVO;
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

    const IconText = ({ icon, text }: { icon: ReactElement | null ; text: string | ReactElement | null  }) => (
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
                <div className="window-header" data-tauri-drag-region>
                    <IconButton
                        icon={<LeftIcon />}
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
                <List
                    itemLayout="vertical"
                    size="large"
                    pagination={{
                        ...tablePagination,
                        total: userFolders? userFolders.length : 0,
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
                                    text={<ViewItem record={item}/> }/>,
                                <IconText
                                    key={"action-delete"}
                                    icon={<DeleteOutlined/>}
                                    text={<DeleteItem record={item}/>}/>,
                                <IconText
                                    key={"action-updateAt"}
                                    icon={null}
                                    text={item.updateAt? dayjs(item.updateAt).format("YYYY-MM-DD HH:mm:ss"): null}/>,
                            ]}
                        >
                            <List.Item.Meta
                                title={item.folderNameElement ? item.folderNameElement: item.folderName}
                                description={item.folderDesc}
                            />
                        </List.Item>
                    )}
                />
            </div>
        </>
    );
}
