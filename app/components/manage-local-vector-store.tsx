import {notification, Popconfirm, Table} from "antd";
import {useUserFolderStore} from "@/app/store";
import {ColumnsType} from "antd/es/table";
import {UserFolderVO} from "@/app/trypes/user-folder.vo";
import Locales from "@/app/locales";
import dayjs from "dayjs";
import React, {useEffect, useState} from "react";
import {TablePagination} from "@/app/trypes/common-type";
import Locale from "@/app/locales";
import {IconButton} from "@/app/components/button";
import CloseIcon from "@/app/icons/close.svg";
import styles from "@/app/components/make-local-vector-store.module.scss";
import {useNavigate} from "react-router-dom";
import {UserApi} from "@/app/client/user";


const userService = new UserApi();

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

    const userFolders = useUserFolderStore().userFolders;
    const navigate = useNavigate();
    const [notify, contextHolder] = notification.useNotification();
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const [tablePagination, setTablePagination] = useState<TablePagination>({
        current: 1,
        defaultCurrent: 1,
        defaultPageSize: 10,
    });

    const DeleteItem = ({record}: {record: UserFolderVO}) => {
        const handleDelete = (record: UserFolderVO) => {
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
                })
        }

        return (
            <a onClick={() => handleDelete(record)}>{Locale.Common.Delete}</a>
        );
    }

    const columns: ColumnsType<UserFolderVO> = [
        {
            title: Locales.MakeLocalVSStore.ListMakeLocalVSFolders.Column.folderName,
            dataIndex: "folderName",
            key: "folderName",
            ellipsis: true,
        },
        {
            title: Locales.MakeLocalVSStore.ListMakeLocalVSFolders.Column.folderDesc,
            dataIndex: "folderDesc",
            key: "folderDesc",
            render: (text: string) => {
                text = text || "";
                text.length > 20 ? text.substring(0, 20) + "..." : text;
                return text;
            }
        },
        {
            title: Locales.MakeLocalVSStore.ListMakeLocalVSFolders.Column.updateAt,
            dataIndex: "updateAt",
            key: "updateAt",
            render: (text, record) => {
                return dayjs(text).format("YYYY-MM-DD HH:mm:ss")
            }
        },
        {
            title: Locales.Common.Action,
            dataIndex: "action",
            key: "action",
            render: (text, record) => {
                return (
                    <>
                        <DeleteItem record={record}/>
                    </>
                )
            }
        },
    ];

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
                <Table
                    columns={columns}
                    scroll={{ x: 800 }}
                    rowSelection={
                        {
                            selectedRowKeys,
                            type: "checkbox",
                            onChange: (selectedRowKeys, selectedRows) => {
                                // console.log(selectedRowKeys, selectedRows);
                                setSelectedRowKeys(selectedRowKeys);
                            },
                        }
                    }
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
                    dataSource={userFolders ?? []}
                />
            </div>
        </>
    );
}
