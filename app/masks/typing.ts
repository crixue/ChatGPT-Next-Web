import { ModelConfig } from "../store";
import { type Mask } from "../store/mask";

export type BuiltinMask = Omit<Mask, "modelConfig"> & {
  builtin: Boolean;
  modelConfig: Partial<ModelConfig>;
};
