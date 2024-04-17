import {getClientConfig} from "../config/client";
import {SubmitKey} from "@/app/constant";

const isApp = !!getClientConfig()?.isApp;

const cn = {
    WIP: "该功能仍在开发中……",
    DefaultChatMessages: {
        systemContent: "你是一个AI对话助手。请用中文回答用户的问题，你的回答可以基于给定的上下文信息，如果你不知道答案，请不要编造答案。",
        userContent: "以下是上下文：{context}\\n 用户问题是: {query}\\n",
    },
    Common: {
        Confirm: "确认",
        Cancel: "取消",
        ConfirmDelete: "确认删除？",
        Delete: "删除",
        OperateSuccess: "操作成功",
        InProgress: "处理中",
        Success: "成功",
        Failed: "失败",
        Refresh: "刷新",
        OperateFailed: "操作失败，请稍后重试",
        Complete: "完成",
        Action: "操作",
        View: "查看",
        Or: "或",
        UpdateSuccess: "更新成功",
        CreateSuccess: "创建成功",
        InProgressTip: "正在处理中，请稍后",
    },
    Error: {
        Unauthorized: isApp
            ? "检测到无效 API Key，请前往[设置](/#/settings)页检查 API Key 是否配置正确。"
            : "访问密码不正确或为空，请前往[登录](/#/auth)页输入正确的访问密码，或者在[设置](/#/settings)页填入你自己的 OpenAI API Key。",
    },
    Auth: {
        Title: "需要密码",
        Tips: "管理员开启了密码验证，请在下方填入访问码",
        Input: "在此处填写访问码",
        Confirm: "确认",
        Later: "稍后再说",
    },
    ChatItem: {
        ChatItemCount: (count: number) => `${count} 条对话`,
    },
    Chat: {
        SubTitle: (count: number) => `共 ${count} 条对话`,
        EditMessage: {
            Title: "编辑消息记录",
            Topic: {
                Title: "聊天主题",
                SubTitle: "更改当前聊天主题",
            },
        },
        Actions: {
            ChatList: "查看消息列表",
            CompressedHistory: "查看压缩后的历史 Prompt",
            Export: "导出聊天记录",
            Copy: "复制",
            Stop: "停止",
            Retry: "重试",
            Pin: "固定",
            PinToastContent: "已将 1 条对话固定至预设提示词",
            PinToastAction: "查看",
            Delete: "删除",
            Edit: "编辑",
        },
        Commands: {
            new: "新建聊天",
            newm: "从面具新建聊天",
            next: "下一个聊天",
            prev: "上一个聊天",
            clear: "清除上下文",
            del: "删除聊天",
        },
        InputActions: {
            Stop: "停止响应",
            ToBottom: "滚到最新",
            Theme: {
                auto: "自动主题",
                light: "亮色模式",
                dark: "深色模式",
            },
            Prompt: "快捷指令",
            Masks: "所有面具",
            Clear: "清除聊天",
            Settings: "对话设置",
        },
        Rename: "重命名对话",
        Typing: "正在处理…",
        Input: (submitKey: string) => {
            var inputHints = `${submitKey} 发送`;
            if (submitKey === String(SubmitKey.Enter)) {
                inputHints += "，Shift + Enter 换行";
            }
            return inputHints + "，: 触发命令";
        },
        Send: "发送",
        Config: {
            Reset: "清除记忆",
        },
        IsContext: "预设提示词",
        SourceText: "来源: ",
        SourceDetail: "搜索来源",
        SourceFromLocalVS: "本地文件",
        SourceFromWebSearch: "网络搜索",
        SearchKeywords: "搜索关键词: ",
        UsedPlugins: "使用插件: ",
    },
    Export: {
        Title: "分享聊天记录",
        Copy: "全部复制",
        Download: "下载文件",
        Share: "分享到 ShareGPT",
        MessageFromYou: "来自你的消息",
        MessageFromChatGPT: "来自 ChatGPT 的消息",
        Format: {
            Title: "导出格式",
            SubTitle: "可以导出 Markdown 文本或者 PNG 图片",
        },
        IncludeContext: {
            Title: "包含面具上下文",
            SubTitle: "是否在消息中展示面具上下文",
        },
        Steps: {
            Select: "选取",
            Preview: "预览",
        },
        Image: {
            Toast: "正在生成截图",
            Modal: "长按或右键保存图片",
        },
    },
    Select: {
        Search: "搜索消息",
        All: "选取全部",
        Latest: "最近几条",
        Clear: "清除选中",
    },
    Memory: {
        Title: "历史摘要",
        EmptyContent: "对话内容过短，无需总结",
        Send: "自动压缩聊天记录并作为上下文发送",
        Copy: "复制摘要",
        Reset: "[unused]",
        ResetConfirm: "确认清空历史摘要？",
    },
    Home: {
        NewChat: "新的聊天",
        DeleteChat: "确认删除选中的对话？",
        DeleteToast: "已删除会话",
        Revert: "撤销",
    },
    Settings: {
        Title: "设置",
        SubTitle: "所有设置选项",

        Danger: {
            Reset: {
                Title: "重置所有设置",
                SubTitle: "重置所有设置项回默认值",
                Action: "立即重置",
                Confirm: "确认重置所有设置？",
            },
            Clear: {
                Title: "清除所有数据",
                SubTitle: "清除所有聊天、设置数据",
                Action: "立即清除",
                Confirm: "确认清除所有聊天、设置数据？",
            },
        },
        Lang: {
            Name: "Language", // ATTENTION: if you wanna add a new translation, please do not translate this value, leave it as `Language`
            All: "所有语言",
        },
        Avatar: "头像",
        FontSize: {
            Title: "字体大小",
            SubTitle: "聊天内容的字体大小",
        },
        InjectSystemPrompts: {
            Title: "注入系统级提示信息",
            SubTitle: "强制给每次请求的消息列表开头添加一个模拟 ChatGPT 的系统提示",
        },
        InputTemplate: {
            Title: "用户输入预处理",
            SubTitle: "用户最新的一条消息会填充到此模板",
        },

        Update: {
            Version: (x: string) => `当前版本：${x}`,
            IsLatest: "已是最新版本",
            CheckUpdate: "检查更新",
            IsChecking: "正在检查更新...",
            FoundUpdate: (x: string) => `发现新版本：${x}`,
            GoToUpdate: "前往更新",
        },
        SendKey: "发送键",
        Theme: "主题",
        TightBorder: "无边框模式",
        SendPreviewBubble: {
            Title: "预览气泡",
            SubTitle: "在预览气泡中预览 Markdown 内容",
        },
        AutoGenerateTitle: {
            Title: "自动生成标题",
            SubTitle: "根据对话内容生成合适的标题",
        },
        Mask: {
            Splash: {
                Title: "面具启动页",
                SubTitle: "新建聊天时，展示面具启动页",
            },
            Builtin: {
                Title: "隐藏内置面具",
                SubTitle: "在所有面具列表中隐藏内置面具",
            },
        },
        Prompt: {
            Disable: {
                Title: "禁用提示词自动补全",
                SubTitle: "在输入框开头输入 / 即可触发自动补全",
            },
            List: "自定义提示词列表",
            ListCount: (builtin: number, custom: number) =>
                `内置 ${builtin} 条，用户定义 ${custom} 条`,
            Edit: "编辑",
            Modal: {
                Title: "提示词列表",
                Add: "新建",
                Search: "搜索提示词",
            },
            EditModal: {
                Title: "编辑提示词",
            },
        },
        HistoryWindowCount: {
            Title: "附带历史消息数",
            SubTitle: "每次请求携带的历史消息数",
        },
        CompressThreshold: {
            Title: "历史消息长度最大token数",
            SubTitle: "最大可以压缩的历史消息长度",
        },
        Token: {
            Title: "API Key",
            SubTitle: "使用自己的 Key 可绕过密码访问限制",
            Placeholder: "OpenAI API Key",
        },

        Usage: {
            Title: "余额查询",
            SubTitle(used: any, total: any) {
                return `本月已使用 $${used}，订阅总额 $${total}`;
            },
            IsChecking: "正在检查…",
            Check: "重新检查",
            NoAccess: "输入 API Key 或访问密码查看余额",
        },
        AccessCode: {
            Title: "访问密码",
            SubTitle: "管理员已开启加密访问",
            Placeholder: "请输入访问密码",
        },
        Endpoint: {
            Title: "接口地址",
            SubTitle: "除默认地址外，必须包含 http(s)://",
        },
        CustomModel: {
            Title: "自定义模型名",
            SubTitle: "增加自定义模型可选项，使用英文逗号隔开",
        },
        Model: "模型 (model)",
        ChatMode: {
            Title: "聊天模式",
            SubTitle: "创意模式会给出具有原创性的、富有想象力的回答",
            SubTitle1: "精确性模式会更注重准确性和相关性，更真实、更简洁",
            SubTitle2: "平衡性模式介于创造性模式和精确性模式两者之间，更加平衡",
            MoreCreative: "更有创意",
            MoreBalanced: "更具平衡",
            MorePrecise: "更加精确",
        },
        ContainHistory: {
            Title: "传递历史消息",
            SubTitle: "开启后将每次请求向模型发送历史聊天消息",
            Switch: {
                Checked: "开启",
                Unchecked: "关闭",
            }
        },
        StreamingMode: {
            Title: "开启流式输出",
            SubTitleStreamingMode: "流式输出下，模型会实时返回生成的结果，直到所有内容都全部返回",
            SubTitleNotStreamingMode: "非流式输出下，会等到所有结果生成完毕后，才会一次性返回所有的结果，这种方式结果可能会返回比较慢",
            Switch: {
                Checked: "流式",
                Unchecked: "非流式",
            }
        },
        Plugins: {
            Title: "插件",
            SubTitle: "在当前面具中使用插件，从而增强模型能力。 ",
            KnowMore: "点击了解更多",
            ChoosePlugin: "选择插件",
        },
        Temperature: {
            Title: "随机性 (temperature)",
            SubTitle: "值越大，回复越随机",
        },
        TopP: {
            Title: "核采样 (top_p)",
            SubTitle: "与随机性类似，但不要和随机性一起更改",
        },
        MaxTokens: {
            Title: "单次回复字数",
            SubTitle: "单次交互所用的最大 Token 数",
        },
        PresencePenalty: {
            Title: "话题新鲜度 (presence_penalty)",
            SubTitle: "值越大，越有可能扩展到新话题",
        },
        FrequencyPenalty: {
            Title: "频率惩罚度 (frequency_penalty)",
            SubTitle: "值越大，越有可能降低重复字词",
        },
        ApplyModel: {
            Title: "应用模型",
            SubTitle: "使用当前模型参数配置重新构建模型",
            ButtonContent: "应用模型",
        },
        MakingLocalVS: {
            Title: "构建本地知识库",
            SubTitle: "使用本地文件构建属于您的知识库",
            ButtonContent: "立即构建",
            GoToMakeLocalVS: "您还没有本地知识库，是否前去构建？",
            CancelButtonContent: "取消",
        }
    },
    Store: {
        DefaultTopic: "新的聊天",
        BotHello: "有什么可以帮你的吗",
        Error: "出错了，稍后重试吧",
        Prompt: {
            History: (content: string) => "这是历史聊天总结作为前情提要：" + content,
            Topic:
                "使用四到五个字直接返回这句话的简要主题，不要解释、不要标点、不要语气词、不要多余文本，如果没有主题，请直接返回“闲聊”",
            Summarize:
                "简要总结一下对话内容，用作后续的上下文提示 prompt，控制在 200 字以内",
        },
    },
    Copy: {
        Success: "已写入剪切板",
        Failed: "复制失败，请赋予剪切板权限",
    },
    Context: {
        Toast: (x: any) => `包含 ${x} 条预设提示词`,
        Edit: "当前对话设置",
        Add: "新增一条对话",
        Clear: "上下文已清除",
        Revert: "恢复上下文",
    },
    Plugin: {
        Name: "插件",
    },
    FineTuned: {
        Sysmessage: "你是一个助手",
    },
    Mask: {
        Tags: {
            Tag0: "面具设置",
            Tag1: "上下文设置",
            Tag2: "模型设置",
        },
        Name: "面具",
        Page: {
            Title: "预设角色面具",
            SubTitle: (count: number) => `${count} 个预设角色定义`,
            Search: "搜索角色面具",
            Create: "新建",
        },
        Item: {
            Info: (count: number) => `包含 ${count} 条预设对话`,
            Chat: "对话",
            View: "查看",
            Edit: "编辑",
            Delete: "删除",
            DeleteConfirm: "确认删除？",
        },
        EditModal: {
            Title: (readonly: boolean) =>
                `编辑预设面具 ${readonly ? "（只读）" : ""}`,
            Download: "下载预设",
            Clone: "克隆预设",
        },
        Config: {
            Avatar: "角色头像",
            Name: "角色名称",
            Sync: {
                Title: "使用全局设置",
                SubTitle: "当前对话是否使用全局模型设置",
                Confirm: "当前对话的自定义设置将会被自动覆盖，确认启用全局设置？",
            },
            PromptPath: {
                Title: "提示文本路径",
                // SubTitle: "隐藏后预设对话不会出现在聊天界面",
            },
            IsChineseText: {
                Title: "对话是否为中文",
                SubTitle: "目前支持中文和英文两种语言，不同语言查询和使用到的上下文不同",
            },
            PromptId: {
                Title: "提示id(prompt id)",
            },
            HideContext: {
                Title: "隐藏预设对话",
                SubTitle: "隐藏后预设对话不会出现在聊天界面",
            },
            HaveContext: {
                Title: "是否引入上下文",
                SubTitle: "使用本地知识库或网络搜索的文本内容能更准确为模型提供信息",
                ContextSources: {
                    Title: "上下文来源",
                    RetrieverType: {
                        WebSearch: "网络搜索",
                        LocalVectorStores: "本地知识库",
                        Fixed: "混合模式",
                    }
                },
                ChooseLocalVSFolder: {
                    Title: "选择本地知识库",
                    SubTitle: "构建您的本地知识库"
                },
                ManageLocalVSFolder: {
                    SubTitle: "管理您已有的本地知识库",
                },
                WebSearchNums: {
                    Title: "网络搜索的数量",
                    SubTitle: "网络搜索的相关数据，供下一步检索提供外部数据源。搜索的数量越多，响应的时间越长"
                },
                SearchedContextNums: {
                    Title: "检索文档的数量",
                    SubTitle: "通过对外部数据源相关性等的筛选，为模型提供更有效信息（RAG）。检索文档的数量越多，响应的时间越长"
                },
                UseMultiQueryAssist: {
                    Title: "使用多关键词搜索",
                    SubTitle: "使用多个关键词搜索，提高搜索的准确性"
                },
            },
            Share: {
                Title: "分享此面具",
                SubTitle: "生成此面具的直达链接",
                Action: "复制链接",
            },
            SaveAs: "保存面具",
            ApplyMask: "应用面具",
            DeleteMask: "删除面具",
            SwitchSingleConfig: "切换 精简设置",
            SwitchAdvancedConfig: "切换 高级设置",
            Validator: {
                Prompt: {
                    QueryPlaceHolderInvalid: "用户角色设置中 {query} 占位符必须存在",
                    ContextPlaceHolderInvalid: "用户角色设置中 {context} 占位符必须存在",
                    NotExistsContextPlaceHolderInvalid: "用户角色设置中 {context} 占位符必须不存在",
                }
            }
        },
        PromptItem: {
            System: {
                name: "系统角色",
                color: "red",
            },
            User: {
                name: "用户角色",
                color: "green",
            },
            Assistant: {
                name: "助手角色",
                color: "blue",
            },
            Tool: {
                name: "工具角色",
                color: "magenta",
            },
            Delete: "删除",
            DefaultAddedContextStr: "来源:{context}。 "
        },
        ContextPrompt: {
            CardTitle: "引导案例",
            AddNewFewShotExampleBtn: "添加新的引导案例",
            UserExampleContentPrefix: "用户的问题",
            AssistantExampleContentPrefix: "助手的回答",
        }

    },
    NewChat: {
        Return: "返回",
        Skip: "直接开始",
        NotShow: "不再展示",
        ConfirmNoShow: "确认禁用？禁用后可以随时在设置中重新启用。",
        Title: "挑选一个面具",
        SubTitle: "现在开始，与面具背后的灵魂思维碰撞",
        More: "查看全部",
    },

    URLCommand: {
        Code: "检测到链接中已经包含访问码，是否自动填入？",
        Settings: "检测到链接中包含了预制设置，是否自动填入？",
    },

    UI: {
        Confirm: "确认",
        Cancel: "取消",
        Close: "关闭",
        Create: "新建",
        Edit: "编辑",
    },
    Exporter: {
        Model: "模型",
        Messages: "消息",
        Topic: "主题",
        Time: "时间",
    },
    MakeLocalVSStore: {
        Title: "构建本地知识库",
        SubTitle: "上传本地文件，构建属于你的独家知识库",
        CreateNewLocalVS: "新建知识库",
        ReSelectLocalVS: "重新选择知识库",
        LocalVSName: "知识库名称",
        LocalVSDesc: "知识库描述",
        PleaseChoiceLocalVS: "请选择本地知识库",
        ConfirmToCreate: "确认创建",
        Steps: {
            FirstStep: {
                Title: "第一步",
                Descriptions: "选择一个知识库",
                CardTitle: "设置知识库",
            },
            SecondStep: {
                Title: "第二步",
                Descriptions: "上传文件用于构建知识库"
            },
            ThirdStep: {
                Title: "第三步",
                Descriptions: "开始构建，查看结果",
                CardTitle: "构建结果",
            },
            PreviousStep: "上一步",
            NextStep: "下一步",
            ContinueToMake: "继续制作",
        },
        TaskRecordsColumn: {
            createdAt: "创建时间",
            id: "任务id",
            status: "任务状态",
            makeType: "制作类型",
            fileName: "文件名称",
            action: "操作"
        },
        ListMakeLocalVSFolders: {
            Title: "本地知识库列表",
            Column: {
                folderName: "知识库名称",
                folderDesc: "知识库描述",
                updateAt: "更新时间",
            }
        },
        Rules: {
            PleaseInputLocalVSName: "请输入知识库名称",
            PleaseInputLocalVSDesc: "请输入知识库描述",
            Rule1: "请输入空格、字母、数字或下划线组成的字符串"
        },
        SelectLocalVS: "选择知识库",
        StartToBuildNewVS: "点击构建属于您的知识库",
        StartToBuild: "构建知识库",
        Descriptions: "通过收集、整理、归纳和标注相关的数据和文献，构建属于您自己的知识库。知识库可以帮助模型更好地理解、分析和回答您的问题，提高模型的性能和准确性。",
        LocalVSFolderNameHaveExisted: "知识库名称已存在，请重新输入",
        Upload: {
            Config: "配置",
            TriggerAdvancedConfig: "切换高级配置",
            TriggerSimpleConfig: "切换精简配置",
            Chinese: "中文",
            English: "英文",
            ChunkSizeTitle: "每个文本块的最大长度",
            ChunkSizeDesc: "控制文本切分成文本块的参数，文本块的大小决定了模型能够处理的最大文本长度。文本块的大小越大，模型能够获取到的信心量越大，但是模型处理的速度越慢。",
            ChunkOverlapTitle: "文本块的重叠长度",
            ChunkOverlapDesc: "相邻两个文本块之间的重叠长度。合理地文本块的重叠长度可以保证文本的连贯性和准确性",
            UploadFileCardTitle: "文件上传",
            SupportedFileTypeTip: "目前支持 .txt,.doc,.docx,.mp3,.mp4,.wav,.pdf,.ppt,.pptx,.xls,.xlsx,.csv,.html等格式文件的上传与制作，如果您上传的文件格式不在支持范围内，知识库可能会制作失败。",
            UploadFileTip: "单击或拖动文件到此区域进行上传",
            RemoveSuccess: "文件移除成功",
            RemoveFailed: "文件删除失败,请稍后重试",
            UploadFileSuccess: "文件上传成功",
            UploadFileFailed: "文件上传失败,请稍后重试",
            DoNotUploadSameFile: "请不要重复上传相同名称的文件",
        }
    },
    ManageLocalVectorStore: {
        Title: "本地知识库",
        SubTitle: "管理本地知识库，查看知识库的详细信息",
        ButtonContent: "立即查看",
        ViewLocalVS: "查看知识库",
    },
    LocalVectorStoreName: "知识库",
    Plugins: {
        Title: "插件",
        SubTitle: "插件能将模型连接到第三方应用程序。这些插件使模型能够从开发人员定义的API获取数据，从而增强模型的功能",
        Switch: {
            Checked: "开启",
            Unchecked: "关闭",
        },
        GoToViewBtn: "查看插件",
    },
    ShownAlertMsg: {
        UserNameOrPwdIncorrect: "用户名或密码错误",
        UserValidateFailed: "用户验证失败，请重新登录",
        AccountHasBeenRegistered: "账号已被注册",
        SmsCodeNotCorrected: "短信验证码不正确",
        PicVerifyCodeNotCorrected: "图片验证码不正确",
        UsernameLengthExceed: "用户名长度超过16位限制",
        UserNotExists: "用户不存在",
        UserPasswordShouldNotBeEmpty: "密码不能为空",
        NotValidRegisterType: "无效的注册/登录类型",
    },
    Logout: {
        Title: "退出",
        LogoutBtn: "退出登录",
    },
    LoginFailed: "登录失败",
    RegisterFailed: "注册失败",
};

type DeepPartial<T> = T extends object
    ? {
        [P in keyof T]?: DeepPartial<T[P]>;
    }
    : T;

export type LocaleType = typeof cn;
export type PartialLocaleType = DeepPartial<typeof cn>;

export default cn;
