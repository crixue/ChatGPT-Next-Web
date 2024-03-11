import {Mask} from "@/app/store";
import Locale from "@/app/locales";


export const validateMask = (mask: Mask) => {
    let context = (mask.context ?? []).slice(0, 1);  //目前只支持system prompt
    const haveContext = mask.haveContext;
}