import { Mask } from "../store/mask";
import { CN_MASKS } from "./cn";
import { EN_MASKS } from "./en";

import { type BuiltinMask } from "./typing";
import {maskApi} from "@/app/client/mask/mask-api";
export { type BuiltinMask } from "./typing";

export const BUILTIN_MASK_STORE = {
  masks: {} as Record<string /*mask id*/, BuiltinMask>,
  get(id?: string) {
    if (!id) return undefined;
    return this.masks[id] as Mask | undefined;
  },
  add(m: BuiltinMask) {
    const mask = { ...m, builtin: true };
    this.masks[mask.id] = mask;
    return mask;
  },
  getAll() : BuiltinMask[] {
    maskApi.getAllMasks().then((masks) => {
      masks.forEach((m) => {
        BUILTIN_MASK_STORE.add(m);
      });
    });
    return Object.values(this.masks);
  },
};


export const BUILTIN_MASKS: BuiltinMask[] = BUILTIN_MASK_STORE.getAll();
// export const BUILTIN_MASKS: BuiltinMask[] = [...CN_MASKS, ...EN_MASKS].map(
//   (m) => BUILTIN_MASK_STORE.add(m),
// );  //TODO 使用api 获取所有的masks 覆盖掉这里的builtin masks
