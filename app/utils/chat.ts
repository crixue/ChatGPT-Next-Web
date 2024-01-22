import {ChatMessage} from "@/app/store";
import {RequestMessage} from "@/app/client/api";


/**
 * 过滤历史消息，只保留用户和assistant的消息,
 * 并且保证user和assistant的消息是成对出现的，同时assistant的消息不能是错误消息
 * @param historyMessages
 * @param historyMsgCount
 */
export function filterHistoryMessages(historyMessages: ChatMessage[], historyMsgCount: number) {
    const filteredHistoryMessages = historyMessages.slice(-historyMsgCount * 2);
    const results: RequestMessage[] = [];
    for (let i = 0; i < filteredHistoryMessages.length; i++) {
        const var0 = filteredHistoryMessages[i];
        if(var0.role !== "user"){
            continue;
        }
        if (i+1 < filteredHistoryMessages.length) {
            const var1 = filteredHistoryMessages[++i];
            if(var1.role === "user" || (var1.role === "assistant" && var1.isError)){
                console.log("var1 is not assistant message")
                continue;
            }

            results.push(var0);
            results.push(var1);
        }
    }
    return results;
}
