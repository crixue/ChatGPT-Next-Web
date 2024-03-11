import { type Mask } from "../store/mask";
import {ModelConfig} from "@/app/constant";

export type BuiltinMask = Omit<Mask, "modelConfig"> & {
  builtin: Boolean;
  modelConfig: Partial<ModelConfig>;
};
