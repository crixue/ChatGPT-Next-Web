import {ModalConfigValidator, useAppConfig} from "../store";

import Locale from "../locales";
import {ListItem, } from "./ui-lib";
import {Button, Col, Descriptions, InputNumber, notification, Row, Select, Slider} from "antd";
import React from "react";
import {useGlobalSettingStore} from "@/app/store/global-setting";
import {ModelConfig} from "@/app/constant";


export function ModelConfigList(props: {
    modelConfig: ModelConfig;
    updateConfig: (updater: (config: ModelConfig) => void) => void;
}) {
    // console.log(props.modelConfig);
    const config = useAppConfig();
    const globalSettingStore = useGlobalSettingStore();

    const [notify, contextHolder] = notification.useNotification();
    const [temperature, setTemperature] = React.useState<number>(props.modelConfig.temperature);
    const [frequencyPenalty, setFrequencyPenalty] = React.useState<number>(props.modelConfig.frequencyPenalty);

    const onTemperatureChange = (val: number | null) => {
        setTemperature(val || 1);
        props.updateConfig(
            (config) =>
            {
                console.log("Before update temperature:" + config.temperature + " And after update temperature:" + val);
                config.temperature = ModalConfigValidator.temperature(val || 1,);
            }
        );
    }

    const [topP, setTopP] = React.useState<number>(props.modelConfig.topP);
    const onTopPChange = (val: number | null) => {
        console.log("Before update topP:" + props.modelConfig.topP + " And after update topP:" + val);
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
                (config.historyMessageCount = val || 0),
        );
    }

    return (
        <>
            {contextHolder}
            <ListItem title={Locale.Settings.Model}>
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
            </ListItem>
            <ListItem
                title={Locale.Settings.Temperature.Title}
                subTitle={Locale.Settings.Temperature.SubTitle}
            >
                {/*<Col style={{marginLeft: "120px"}} span={10}>*/}
                {/*    <Slider*/}
                {/*        min={0}*/}
                {/*        max={1}*/}
                {/*        onChange={onTemperatureChange}*/}
                {/*        value={temperature}*/}
                {/*        step={0.1}*/}
                {/*    />*/}
                {/*</Col>*/}
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
            </ListItem>
            <ListItem
                title={Locale.Settings.TopP.Title}
                subTitle={Locale.Settings.TopP.SubTitle}
            >
                {/*<Col style={{marginLeft: "48px"}} span={10}>*/}
                {/*    <Slider*/}
                {/*        min={0}*/}
                {/*        max={1}*/}
                {/*        onChange={onTopPChange}*/}
                {/*        value={topP}*/}
                {/*        step={0.1}*/}
                {/*    />*/}
                {/*</Col>*/}
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
            </ListItem>
            <ListItem
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
            </ListItem>
            <ListItem
                title={Locale.Settings.FrequencyPenalty.Title}
                subTitle={Locale.Settings.FrequencyPenalty.SubTitle}
            >
                {/*<Col style={{marginLeft: "48px"}} span={10}>*/}
                {/*    <Slider*/}
                {/*        min={0.5}*/}
                {/*        max={2}*/}
                {/*        onChange={onFrequencyPenaltyChange}*/}
                {/*        value={frequencyPenalty}*/}
                {/*        step={0.1}*/}
                {/*    />*/}
                {/*</Col>*/}
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
            </ListItem>
            <ListItem
                title={Locale.Settings.HistoryWindowCount.Title}
                subTitle={Locale.Settings.HistoryWindowCount.SubTitle}
                isSubList={false}
            >
                {/*<Col style={{marginLeft: "48px"}} span={10}>*/}
                {/*    <Slider*/}
                {/*        min={0}*/}
                {/*        max={10}*/}
                {/*        onChange={onHistoryMessageCountChange}*/}
                {/*        value={historyMessageCount}*/}
                {/*        step={1}*/}
                {/*    />*/}
                {/*</Col>*/}
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
            </ListItem>
        </>
    );
}
