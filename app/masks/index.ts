import { Mask } from "../store/mask";

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
