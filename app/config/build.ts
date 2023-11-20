import tauriConfig from "../../src-tauri/tauri.conf.json";

export const getBuildConfig = () => {
  if (typeof process === "undefined") {
    throw Error(
      "[Server Config] you are importing a nodejs-only module outside of nodejs",
    );
  }

  const buildMode = process.env.BUILD_MODE ?? "standalone";
  const isApp = !!process.env.BUILD_APP;
  const version = "v" + tauriConfig.package.version;
  const backendCoreApiUrl = process.env.BACKEND_CORE_API_URL ?? "http://localhost:3000";
  const backendUserApiUrl = process.env.BACKEND_USER_API_URL ?? "http://localhost:3000";
  console.log("[Server Config] default backend api url: ", backendCoreApiUrl);
  const defaultOpenAiUrl = process.env.DEFAULT_LANGCHAIN_API_HOST ?? "http://localhost:3000";
  console.log("[Server Config] default openai url: ", defaultOpenAiUrl);

  const commitInfo = (() => {
    try {
      const childProcess = require("child_process");
      const commitDate: string = childProcess
        .execSync('git log -1 --format="%at000" --date=unix')
        .toString()
        .trim();
      const commitHash: string = childProcess
        .execSync('git log --pretty=format:"%H" -n 1')
        .toString()
        .trim();

      return { commitDate, commitHash };
    } catch (e) {
      console.error("[Build Config] No git or not from git repo.");
      return {
        commitDate: "unknown",
        commitHash: "unknown",
      };
    }
  })();

  return {
    version,
    ...commitInfo,
    buildMode,
    isApp,
    backendCoreApiUrl: backendCoreApiUrl,
    backendUserApiUrl,
    defaultOpenAiUrl,
  };
};

export type BuildConfig = ReturnType<typeof getBuildConfig>;
