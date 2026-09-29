const DEFAULT_APP_NAME = "RiverX App";
const DEFAULT_API_BASE_URL = "/api";

export const env = {
  appName: import.meta.env.VITE_APP_NAME || DEFAULT_APP_NAME,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL,
};
