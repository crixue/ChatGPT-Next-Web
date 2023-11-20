import {DEFAULT_CONFIG, ModalConfigValidator, ModelConfig, useAppConfig} from "../store";

import Locale from "../locales";
import {InputRange} from "./input-range";
import {ListItem, CustomSelect} from "./ui-lib";
import {Button, Col, InputNumber, notification, Row, Select, Slider} from "antd";
import React from "react";
import {api, ClientApi, ConversationMemoryType, LangchainBackendBaseLLMConfig, MemoryTypeName} from "@/app/client/api";
import {useGlobalSettingStore} from "@/app/store/global-setting";
import {GlobalLoading} from "@/app/components/global";


export function ConversationMemoryConfigList(props: {
    modelConfig: ModelConfig;
    updateConfig: (updater: (config: ModelConfig) => void) => void;
}) {
    const config = useAppConfig();

    const [conversationMemoryType, setConversationMemoryType] = React.useState<string>(
        config.allConversationMemoryTypes()[0].name
    );
    const onConversationMemoryTypeChange = (val: string | null) => {
        const allMemoryTypes = config.allConversationMemoryTypes();
        let currentMemoryType = allMemoryTypes.find(item => item.name === val);
        currentMemoryType = currentMemoryType || DEFAULT_CONFIG.modelConfig.memoryType;
        // console.log(currentMemoryType)
        setConversationMemoryType(currentMemoryType.name);
        props.updateConfig(
            (config) =>
                config.memoryType = {
                    name: currentMemoryType?.name || "ConversationBufferWindowMemory" as MemoryTypeName,
                    available: currentMemoryType?.available || true,
                }
        );
    }

    const [historyMessageCount, setHistoryMessageCount] = React.useState(props.modelConfig.historyMessageCount);
    const onHistoryMessageCountChange = (val: number | null) => {
        setHistoryMessageCount(val || 1);
        props.updateConfig(
            (config) =>
                (config.historyMessageCount = val || 1),
        );
    }
    return (
        <>
            <ListItem
                title={Locale.Settings.ConversationMemoryType.Title}
                subTitle={Locale.Settings.ConversationMemoryType.SubTitle}
            >
                <Select
                    defaultValue={conversationMemoryType}
                    options={config.allConversationMemoryTypes().map((v, i) => {
                        const item = {label: v.label, value: v.name};
                        // console.log(item);
                        return item;
                    })}
                    onChange={onConversationMemoryTypeChange}
                />
            </ListItem>
            {conversationMemoryType === 'ConversationBufferWindowMemory' && (
                <ListItem
                    title={Locale.Settings.HistoryWindowCount.Title}
                    subTitle={Locale.Settings.HistoryWindowCount.SubTitle}
                >
                    <Col style={{marginLeft: "48px"}} span={10}>
                        <Slider
                            min={0}
                            max={20}
                            onChange={onHistoryMessageCountChange}
                            value={historyMessageCount}
                            step={1}
                        />
                    </Col>
                    <Col span={4}>
                        <InputNumber
                            min={0}
                            max={20} // lets limit it to 0-1
                            step={1}
                            style={{margin: '0 4px'}}
                            value={historyMessageCount}
                            onChange={onHistoryMessageCountChange}
                        />
                    </Col>
                </ListItem>
            )}
            {conversationMemoryType === 'ConversationSummaryBufferMemory' && (
                <ListItem
                    title={Locale.Settings.CompressThreshold.Title}
                    subTitle={Locale.Settings.CompressThreshold.SubTitle}
                >
                    <InputNumber
                        defaultValue={props.modelConfig.compressMessageLengthThreshold}
                        min={500}
                        max={4000}
                        controls
                        onChange={(value) =>
                            props.updateConfig(
                                (config) =>
                                    (config.compressMessageLengthThreshold = value || 2000),
                            )
                        }
                    />
                </ListItem>
            )}
        </>
    );
}

export const llmApi = new ClientApi();

export function ModelConfigList(props: {
    modelConfig: ModelConfig;
    updateConfig: (updater: (config: ModelConfig) => void) => void;
}) {
    // console.log(props.modelConfig);
    const config = useAppConfig();
    const globalSettingStore = useGlobalSettingStore();

    const [notify, contextHolder] = notification.useNotification();
    const [temperature, setTemperature] = React.useState<number>(props.modelConfig.temperature);
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

    const [frequencyPenalty, setFrequencyPenalty] = React.useState<number>(props.modelConfig.frequencyPenalty);
    const onFrequencyPenaltyChange = (val: number | null) => {
        setFrequencyPenalty(val || 1.1);
        props.updateConfig(
            (config) =>
                (config.frequencyPenalty = ModalConfigValidator.frequencyPenalty(
                    val || 1.1,
                )),
        );
    }

    const applyModel = () => {
        const modelCnf = config.modelConfig;
        globalSettingStore.switchShowGlobalLoading("正在创建模型中，请不要刷新页面...");
        llmApi.llm.startUpModel({  //这里应该使用切换模型的接口，不是创建模型的接口
            llm_type: modelCnf.model,
            llm_model_config: {
                temperature: modelCnf.temperature,
                top_p: modelCnf.topP,
                max_tokens: modelCnf.maxTokens,
                repetition_penalty: modelCnf.frequencyPenalty,
                streaming: true,  //暂时写死
            } as LangchainBackendBaseLLMConfig
        }).then((res) => {
            notify['success']({
                message: '已成功应用模型',
            });
        }).finally(() => {
            globalSettingStore.switchShowGlobalLoading();
        });
    }

    return (
        <>
            <ListItem title={Locale.Settings.Model}>
                <Select
                    style={{minWidth: "250px"}}
                    defaultValue={props.modelConfig.model}
                    options={config.allModels().map((v, i) => (
                        {label: v.name, value: v.name}
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
                <Col style={{marginLeft: "120px"}} span={10}>
                    <Slider
                        min={0}
                        max={1}
                        onChange={onTemperatureChange}
                        value={temperature}
                        step={0.1}
                    />
                </Col>
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
                <Col style={{marginLeft: "48px"}} span={10}>
                    <Slider
                        min={0}
                        max={1}
                        onChange={onTopPChange}
                        value={topP}
                        step={0.1}
                    />
                </Col>
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
                <Col style={{marginLeft: "48px"}} span={10}>
                    <Slider
                        min={0.5}
                        max={2}
                        onChange={onFrequencyPenaltyChange}
                        value={frequencyPenalty}
                        step={0.1}
                    />
                </Col>
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
            <ConversationMemoryConfigList
                modelConfig={props.modelConfig}
                updateConfig={props.updateConfig}
            />
            <ListItem
                title={Locale.Settings.ApplyModel.Title}
                subTitle={Locale.Settings.ApplyModel.SubTitle}
            >
                <Button
                    key={"applyModel"}
                    onClick={applyModel}
                >应用模型</Button>
            </ListItem>
        </>
    );
}
