const explicitBaseUrl = process.env.EXPO_BASE_URL;
const isCI = process.env.CI === "true" || process.env.CI === "1";
const customDomain = process.env.CUSTOM_DOMAIN;
const hasCustomDomain =
  typeof customDomain === "string" && customDomain.trim().length > 0;
const baseUrl =
  explicitBaseUrl !== undefined
    ? explicitBaseUrl
    : isCI && !hasCustomDomain
    ? "/Online-Event-AI"
    : undefined;

module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...(config.experiments ?? {}),
    ...(baseUrl !== undefined ? { baseUrl } : {}),
  },
});
