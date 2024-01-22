import {Mask} from "@/app/store";
import Locale from "@/app/locales";


export const validateMask = (mask: Mask) => {
    let context = (mask.context ?? []).slice(0, 2);  //目前只支持system 和 一个user role 的 prompt
    const userRolePrompt = context.find((c) => c.role === "user");
    // Check if user role prompt contains `{query}` in text
    if (userRolePrompt && userRolePrompt.content.indexOf("{query}") < 0) {
        throw new Error(Locale.Mask.Config.Validator.Prompt.QueryPlaceHolderInvalid);
    }

    const haveContext = mask.haveContext;
    if (haveContext && userRolePrompt && userRolePrompt.content.indexOf("{context}") < 0) {  // Check if haveContext is true, user role prompt must contains `{context}` in text
        throw new Error(Locale.Mask.Config.Validator.Prompt.ContextPlaceHolderInvalid);
    } else if (!haveContext && userRolePrompt && userRolePrompt.content.indexOf("{context}") >= 0) {  // Check if haveContext is false, user role prompt must not contains `{context}` in text
        throw new Error(Locale.Mask.Config.Validator.Prompt.NotExistsContextPlaceHolderInvalid);
    }
}