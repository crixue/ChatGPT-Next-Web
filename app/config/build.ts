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
  const backendPaymentOrderApiUrl =  process.env.BACKEND_PAYMENT_ORDER_API_URL ?? "http://localhost:3000";
  const langchaingPyApiUrl = process.env.DEFAULT_LANGCHAIN_API_HOST ?? "http://localhost:3000";

  const emojiPrefixUrl = process.env.EMOJI_PREFIX_URL ?? "https://cdnjs.cloudflare.com/ajax/libs/emoji-datasource-apple/14.0.0";
  // USER_AGRREMENT_URL=https://www.baidu.com
  // USER_PRIVACY_URL=https://www.baidu.com
  const userAgreementUrl = process.env.USER_AGRREMENT_URL ?? "https://www.baidu.com";
  const userPrivacyUrl = process.env.USER_PRIVACY_URL ?? "https://www.baidu.com";
  const captchaAppId = process.env.CAPTCHA_APP_ID ?? "2040000000";

  return {
    version,
    buildMode,
    isApp,
    backendCoreApiUrl: backendCoreApiUrl,
    backendUserApiUrl,
    backendPaymentOrderApiUrl,
    defaultOpenAiUrl: langchaingPyApiUrl,
    emojiPrefixUrl,
    userAgreementUrl,
    userPrivacyUrl,
    captchaAppId
  };
};

export type BuildConfig = ReturnType<typeof getBuildConfig>;
