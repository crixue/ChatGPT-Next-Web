import {ModalConfigValidator, useAppConfig} from "../store";

import Locale from "../locales";
import {CustomListItem, showConfirm,} from "./ui-lib";
import {
    Button,
    Col,
    InputNumber,
    notification,
    Radio,
    RadioChangeEvent,
    Select,
    Switch
} from "antd";
import React, {useEffect} from "react";
import {useGlobalSettingStore} from "@/app/store/global-setting";
import {ModelConfig, Path} from "@/app/constant";
import {useNavigate} from "react-router-dom";
import {usePluginsStore} from "@/app/store/plugins";
import {useInitSupportedFunctions} from "@/app/components/plugins";


export function ModelConfigList(props: {
    modelConfig: ModelConfig;
    updateConfig: (updater: (config: ModelConfig) => void) => void;
    isAdvancedConfig: boolean;
}) {
    useInitSupportedFunctions(true);

    // console.log(props.modelConfig);
    const config = useAppConfig();
    const globalSettingStore = useGlobalSettingStore();
    const pluginsStore = usePluginsStore();
    const navigate = useNavigate();

    const [notify, contextHolder] = notification.useNotification();
    const [temperature, setTemperature] = React.useState<number>(props.modelConfig.temperature);
    const [frequencyPenalty, setFrequencyPenalty] = React.useState<number>(props.modelConfig.frequencyPenalty);

    const onTemperatureChange = (val: number | null) => {
        setTemperature(val || 1);
        props.updateConfig(
            (config) =>
            {
                config.temperature = ModalConfigValidator.temperature(val || 1,);
            }
        );
    }

    const [topP, setTopP] = React.useState<number>(props.modelConfig.topP);
    const onTopPChange = (val: number | null) => {
        // console.log("Before update topP:" + props.modelConfig.topP + " And after update topP:" + val);
        props.updateConfig(
            (config) =>
                (config.topP = ModalConfigValidator.top_p(
                    val || 1,
                )),
        );
        setTopP(val || 1);
    }

    const onFrequencyPenaltyChange = (val: number | null) => {
        setFrequencyPenalty(val || 1.1);
        props.updateConfig(
            (config) =>
                (config.frequencyPenalty = ModalConfigValidator.frequencyPenalty(
                    val || 1.1,
                )),
        );
    }

    const [historyMessageCount, setHistoryMessageCount] = React.useState(props.modelConfig.historyMessageCount);
    const onHistoryMessageCountChange = (val: number | null) => {
        setHistoryMessageCount(val || 0);
        props.updateConfig(
            (config) =>

            {config.historyMessageCount = val || 0;},
        );
    }

    const [streamingMode, setStreamingMode] = React.useState<boolean>(props.modelConfig.streaming ?? true);
    // console.log("streamingMode:" + streamingMode);
    const onStreamingModeChange = (checked: boolean) => {
        // checked = !checked;
        // console.log("streamingMode now:" + checked);
        setStreamingMode(checked);
        props.updateConfig(
            (config) =>
                (config.streaming = checked),
        );
    }

    const [containHistory, setContainHistory] = React.useState<boolean>(props.modelConfig.historyMessageCount == 0 ? false : true);
    const onContainHistoryChange = (checked: boolean) => {
        // console.log("containHistory now:" + checked);
        setContainHistory(checked);
        if(!checked) {
            onHistoryMessageCountChange(0);
        } else {
            onHistoryMessageCountChange(4);
        }
    }

    const allSupportPlugins = pluginsStore.supportedFunctions;
    const [checkedPluginIds, setCheckedPluginIds] = React.useState<string[]>(pluginsStore.defaultShownPluginIds);
    console.log("checkedPluginIds:" + checkedPluginIds);

    const onPluginsChange = (val: string[] | null) => {
        setCheckedPluginIds(val || pluginsStore.defaultShownPluginIds);
        props.updateConfig(
            (config) =>
                (config.checkedPluginIds = val || pluginsStore.defaultShownPluginIds),
        );
    }

    const chatModeOptions = [
        {label: Locale.Settings.ChatMode.MoreCreative, value: "creative"},
        {label: Locale.Settings.ChatMode.MoreBalanced, value: "balanced"},
        {label: Locale.Settings.ChatMode.MorePrecise, value: "precise"},
    ];

    let initChatMode = "balanced";
    if(temperature >= 0.8) {
        initChatMode = "creative";
    } else if(temperature <= 0.2) {
        initChatMode = "precise";
    }
    const [chatMode, setChatMode] = React.useState<string>(initChatMode);

    const onChatModeChange = ({ target: { value } }: RadioChangeEvent) => {
        setChatMode(value);
        if(value === "creative") {
            onTemperatureChange(0.8);
        } else if(value === "balanced") {
            onTemperatureChange(0.5);
        } else {
            onTemperatureChange(0.2);
        }
    }

    const SingleConfig = () => {
        return (
            <>
                {contextHolder}
                <CustomListItem
                    title={Locale.Settings.ChatMode.Title}
                    subTitle={
                        <div>
                            <p>{Locale.Settings.ChatMode.SubTitle}</p>
                            <p>{Locale.Settings.ChatMode.SubTitle1}</p>
                            <p>{Locale.Settings.ChatMode.SubTitle2}</p>

                        </div>
                    }
                >
                    <Radio.Group
                        options={chatModeOptions}
                        onChange={onChatModeChange}
                        value={chatMode}
                        optionType="button"
                        buttonStyle="solid"
                    />
                </CustomListItem>

                <CustomListItem
                    title={Locale.Settings.StreamingMode.Title}
                    subTitle={<div>
                        <p>{Locale.Settings.StreamingMode.SubTitleStreamingMode}</p>
                        <p>{Locale.Settings.StreamingMode.SubTitleNotStreamingMode}</p>
                    </div>}
                >
                    <Switch
                        checkedChildren={Locale.Settings.StreamingMode.Switch.Checked}
                        unCheckedChildren={Locale.Settings.StreamingMode.Switch.Unchecked}
                        defaultChecked={streamingMode}
                        onChange={onStreamingModeChange}/>
                </CustomListItem>
                <CustomListItem
                    style={{flexDirection: "column", alignItems: "flex-start"}}
                    title={Locale.Settings.Plugins.Title}
                    subTitle={<div>
                        <span>{Locale.Settings.Plugins.SubTitle}</span>
                        <Button
                            style={{padding: 0, fontSize: "12px"}}
                            onClick={() => navigate(Path.Plugins)}
                            type="link"
                        >
                            {Locale.Settings.Plugins.KnowMore}
                        </Button>
                    </div>}
                >
                    <Select
                        mode="multiple"
                        style={{ width: '100%' }}
                        placeholder={Locale.Settings.Plugins.ChoosePlugin}
                        defaultValue={checkedPluginIds.map((id, i) => (
                                allSupportPlugins.find((v) => v.id === id)?.nameAlias || ""
                            ))
                        }
                        onChange={onPluginsChange}
                        options={allSupportPlugins.map((v, i) => (
                            {label: v.nameAlias, value: v.id}
                        ))}
                    />
                </CustomListItem>
                <CustomListItem
                    title={Locale.Settings.ContainHistory.Title}
                    subTitle={Locale.Settings.ContainHistory.SubTitle}
                >
                    <Switch
                        checkedChildren={Locale.Settings.ContainHistory.Switch.Checked}
                        unCheckedChildren={Locale.Settings.ContainHistory.Switch.Unchecked}
                        defaultChecked={containHistory}
                        onChange={onContainHistoryChange}/>
                </CustomListItem>
            </>
        )
    }

    const AdvancedConfig = () => {
        return (
            <>
                {contextHolder}
                <CustomListItem
                    title={Locale.Settings.StreamingMode.Title}
                    subTitle={<div>
                        <p>{Locale.Settings.StreamingMode.SubTitleStreamingMode}</p>
                        <p>{Locale.Settings.StreamingMode.SubTitleNotStreamingMode}</p>
                    </div>}
                >
                    <Switch
                        checkedChildren={Locale.Settings.StreamingMode.Switch.Checked}
                        unCheckedChildren={Locale.Settings.StreamingMode.Switch.Unchecked}
                        defaultChecked={streamingMode}
                        onChange={onStreamingModeChange}/>
                </CustomListItem>
                {
                    !streamingMode &&
                    <CustomListItem
                        style={{flexDirection: "column", alignItems: "flex-start"}}
                        title={Locale.Settings.Plugins.Title}
                        subTitle={<div>
                            <span>{Locale.Settings.Plugins.SubTitle}</span>
                            <Button
                                style={{padding: 0, fontSize: "12px"}}
                                onClick={() => navigate(Path.Plugins)}
                                type="link"
                            >
                                {Locale.Settings.Plugins.KnowMore}
                            </Button>
                        </div>}
                    >
                        <Select
                            mode="multiple"
                            style={{ width: '100%' }}
                            placeholder={Locale.Settings.Plugins.ChoosePlugin}
                            defaultValue={checkedPluginIds.map((id, i) => (
                                allSupportPlugins.find((v) => v.id === id)?.nameAlias || ""
                            ))
                            }
                            onChange={onPluginsChange}
                            options={allSupportPlugins.map((v, i) => (
                                {label: v.nameAlias, value: v.id}
                            ))}
                        />
                    </CustomListItem>
                }
                <CustomListItem title={Locale.Settings.Model}>
                    <Select
                        style={{minWidth: "250px"}}
                        defaultValue={config.defaultModel?.alias}
                        options={config.supportedModels.map((v, i) => (
                            {label: v.alias, value: v.name}
                        ))}
                        onChange={(value) => {
                            props.updateConfig(
                                (config) =>
                                    (config.model = ModalConfigValidator.model(
                                        value,
                                    )),
                            );
                        }}
                    />
                </CustomListItem>

                <CustomListItem
                    title={Locale.Settings.Temperature.Title}
                    subTitle={Locale.Settings.Temperature.SubTitle}
                >
                    <Col span={4}>
                        <InputNumber
                            min={0}
                            max={1} // lets limit it to 0-1
                            step={0.1}
                            style={{margin: '0 4px'}}
                            value={temperature}
                            onChange={onTemperatureChange}
                        />
                    </Col>
                </CustomListItem>
                <CustomListItem
                    title={Locale.Settings.TopP.Title}
                    subTitle={Locale.Settings.TopP.SubTitle}
                >
                    <Col span={4}>
                        <InputNumber
                            min={0}
                            max={1} // lets limit it to 0-1
                            step={0.1}
                            style={{margin: '0 4px'}}
                            value={topP}
                            onChange={onTopPChange}
                        />
                    </Col>
                </CustomListItem>
                <CustomListItem
                    title={Locale.Settings.MaxTokens.Title}
                    subTitle={Locale.Settings.MaxTokens.SubTitle}
                >
                    <InputNumber
                        defaultValue={props.modelConfig.maxTokens}
                        min={50}
                        max={16000}
                        controls
                        onChange={(val) =>
                            props.updateConfig(
                                (config) =>
                                    (config.maxTokens = ModalConfigValidator.maxTokens(
                                        val || 2000,
                                    )),
                            )
                        }
                    />
                </CustomListItem>
                <CustomListItem
                    title={Locale.Settings.FrequencyPenalty.Title}
                    subTitle={Locale.Settings.FrequencyPenalty.SubTitle}
                >
                    <Col span={4}>
                        <InputNumber
                            min={0.5}
                            max={2} // lets limit it to 0-1
                            step={0.1}
                            style={{margin: '0 4px'}}
                            value={frequencyPenalty}
                            onChange={onFrequencyPenaltyChange}
                        />
                    </Col>
                </CustomListItem>
                <CustomListItem
                    title={Locale.Settings.HistoryWindowCount.Title}
                    subTitle={Locale.Settings.HistoryWindowCount.SubTitle}
                >
                    <Col span={4}>
                        <InputNumber
                            min={0}
                            max={10} // lets limit it to 0-1
                            step={1}
                            style={{margin: '0 4px'}}
                            value={historyMessageCount}
                            onChange={onHistoryMessageCountChange}
                        />
                    </Col>
                </CustomListItem>
            </>
        );
    }

    // return <AdvancedConfig/>;
    return props.isAdvancedConfig ? <AdvancedConfig/> : <SingleConfig/>;
}
