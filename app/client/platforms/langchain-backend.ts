import {LangchainBackendPath, REQUEST_TIMEOUT_MS,} from "@/app/constant";
import {
    ChatMessage,
    useAccessStore,
    useAppConfig,
} from "@/app/store";

import {
    getBackendApiHeaders,
    getHeaders,
    LLMUsage
} from "../api";
import Locale from "../../locales";
import {StartupMaskRequestVO, StartUpModelRequestVO, SupportedModelVO} from "@/app/types/model-vo";
import {handleServerResponse} from "../../common-api";
import {getClientConfig} from "@/app/config/client";

export interface OpenAIListModelResponse {
    object: string;
    data: Array<{
        id: string;
        object: string;
        root: string;
    }>;
}

export class LangchainBackendApi {

    private disableListModels = true;

    path(path: string): string {
        let openaiUrl = useAccessStore.getState().openaiUrl;
        // console.log("openaiUrl:" + openaiUrl)
        return [openaiUrl, path].join("/");
    }

    async triggerNewModel() {
        const modelConfig = useAppConfig.getState().modelConfig;
        const request: StartUpModelRequestVO = {
            llm_type: modelConfig.model,
            llm_model_config: {
                max_tokens: modelConfig.maxTokens,
                temperature: modelConfig.temperature,
                top_p: modelConfig.topP,
                repetition_penalty: modelConfig.frequencyPenalty,
                streaming: true,  //暂时写死
            },
        };

        const res = await fetch(this.path("llm-backend/v1/trigger-model"), {
            method: "POST",
            body: JSON.stringify(request),
            headers: getBackendApiHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
    }

    async listAllModels() {
        const res = await fetch(this.path("llm-backend/v1/llm-list"), {
            method: "GET",
            headers: getHeaders(),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return handleServerResponse<SupportedModelVO[]>(await res.json());
    }


    async usage() {
        const formatDate = (d: Date) =>
            `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
                .getDate()
                .toString()
                .padStart(2, "0")}`;
        const ONE_DAY = 1 * 24 * 60 * 60 * 1000;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startDate = formatDate(startOfMonth);
        const endDate = formatDate(new Date(Date.now() + ONE_DAY));

        const [used, subs] = await Promise.all([
            fetch(
                this.path(
                    `${LangchainBackendPath.UsagePath}?start_date=${startDate}&end_date=${endDate}`,
                ),
                {
                    method: "GET",
                    headers: getHeaders(),
                },
            ),
            fetch(this.path(LangchainBackendPath.SubsPath), {
                method: "GET",
                headers: getHeaders(),
            }),
        ]);

        if (used.status === 401) {
            throw new Error(Locale.Error.Unauthorized);
        }

        if (!used.ok || !subs.ok) {
            throw new Error("Failed to query usage from openai");
        }

        const response = (await used.json()) as {
            total_usage?: number;
            error?: {
                type: string;
                message: string;
            };
        };

        const total = (await subs.json()) as {
            hard_limit_usd?: number;
        };

        if (response.error && response.error.type) {
            throw Error(response.error.message);
        }

        if (response.total_usage) {
            response.total_usage = Math.round(response.total_usage) / 100;
        }

        if (total.hard_limit_usd) {
            total.hard_limit_usd = Math.round(total.hard_limit_usd * 100) / 100;
        }

        return {
            used: response.total_usage,
            total: total.hard_limit_usd,
        } as LLMUsage;
    }

    async share(messages: ChatMessage[], avatarUrl: string | null = null) {
        const msgs = messages
            .map((m) => ({
                from: m.role === "user" ? "human" : "gpt",
                value: m.content,
            }))
            .concat([
                {
                    from: "human",
                    value:
                        "Share from [ChatGPT Next Web]: https://github.com/Yidadaa/ChatGPT-Next-Web",
                },
            ]);
        // 敬告二开开发者们，为了开源大模型的发展，请不要修改上述消息，此消息用于后续数据清洗使用
        // Please do not modify this message

        console.log("[Share]", messages, msgs);
        const clientConfig = getClientConfig();
        const proxyUrl = "/sharegpt";
        const rawUrl = "https://sharegpt.com/api/conversations";
        const shareUrl = clientConfig?.isApp ? rawUrl : proxyUrl;
        const res = await fetch(shareUrl, {
            body: JSON.stringify({
                avatarUrl,
                items: msgs,
            }),
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
        });

        const resJson = await res.json();
        console.log("[Share]", resJson);
        if (resJson.id) {
            return `https://shareg.pt/${resJson.id}`;
        }
    }
}

export {LangchainBackendPath};