import { BuildConfig, getBuildConfig } from "./build";

export function getClientConfig() {
  if (typeof document !== "undefined") {
    // client side
    const meta = queryMeta("config");
    // console.log("[Client Config] meta: ", JSON.parse(meta));
    return JSON.parse(meta) as BuildConfig;
  }

  if (typeof process !== "undefined") {
    // server side
    // console.log("[server side] process: ", getBuildConfig());
    return getBuildConfig();
  }
}

function queryMeta(key: string, defaultValue?: string): string {
  let ret: string;
  if (document) {
    const meta = document.head.querySelector(
      `meta[name='${key}']`,
    ) as HTMLMetaElement;
    ret = meta?.content ?? "{}";
  } else {
    ret = defaultValue ?? "{}";
  }

  return ret;
}
