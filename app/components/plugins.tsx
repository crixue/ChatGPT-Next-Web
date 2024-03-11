import React, {useEffect} from "react";
import {usePluginsStore} from "@/app/store/plugins";
import {useNavigate} from "react-router-dom";
import {Avatar, List, notification, Switch} from "antd";
import {FunctionPlugin} from "@/app/types/plugins";
import {Mask} from "@/app/store";
import {Updater} from "@/app/typing";
import Locales from "@/app/locales";
import Locale from "@/app/locales";
import {IconButton} from "@/app/components/button";
import CloseIcon from "@/app/icons/close.svg";
import styles from "@/app/components/plugins.module.scss";
import PluginIcon from "@/app/icons/plugin.svg";


export const useInitSupportedFunctions = (reload: Boolean | undefined) => {
    useEffect(() => {
        (async () => {
            await usePluginsStore.getState().initSupportedFunctions();
        })();
    },[reload]);
}


export const PluginListView = (props: {
    plugins: FunctionPlugin[],
    onlyView: boolean,
    updateMask?: Updater<Mask>;
}) => {
    const onlyView = props.onlyView;
    let checkedPluginIds: string[] = [];
    if (!onlyView) {
        checkedPluginIds = props.plugins.filter((plugin) => plugin.checked).map((plugin) => plugin.id);
    }

    const data = props.plugins;

    return (
        <>
            <List
                itemLayout="horizontal"
                // pagination={{
                //     pageSize: 8,
                // }}
                dataSource={data}
                renderItem={item => (
                    <List.Item
                        key={"plugin-"+item.id}
                        actions={[
                            !onlyView && <Switch
                                key={"switch-key-"+item.id}
                                checkedChildren={Locales.Plugins.Switch.Checked}
                                unCheckedChildren={Locales.Plugins.Switch.Unchecked}
                                onChange={(checked) => {
                                    if (checked) {
                                        checkedPluginIds.push(item.id);
                                    } else {
                                        checkedPluginIds = checkedPluginIds.filter((id) => id !== item.id);
                                    }
                                    props.updateMask && props.updateMask((mask) => {
                                        mask.modelConfig.checkedPluginIds = checkedPluginIds;
                                        console.log("checkedPluginIds:" + checkedPluginIds);
                                    })
                                }}
                                checked={checkedPluginIds.find(id => id === item.id) != undefined}/>
                            ]}
                    >
                        <List.Item.Meta
                            avatar={item.avatar.trim() === "" ? <PluginIcon width={16} height={16}/> : <Avatar src={item.avatar.trim()}/>}
                            title={<span>{item.nameAlias}</span>}
                            description={item.descriptionAlias}
                        />
                    </List.Item>
                )}
            />

        </>
    )

}

export const PluginsPage = () => {

    useInitSupportedFunctions(true);

    const navigate = useNavigate();
    const [notify, contextHolder] = notification.useNotification();
    const pluginsStore = usePluginsStore();

    return (
        <>
            {contextHolder}
            <div className="window-header" data-tauri-drag-region>
                <div className="window-header-title">
                    <div className="window-header-main-title">
                        {Locale.Plugins.Title}
                    </div>
                    <div className="window-header-sub-title">
                        {Locale.Plugins.SubTitle}
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
            <div className={styles["plugins-container"]}>
                <PluginListView
                    plugins={pluginsStore.supportedFunctions}
                    onlyView={true}
                />
            </div>
        </>
    )

}

