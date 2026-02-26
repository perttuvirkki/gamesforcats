// NOTE: In Expo, `EXPO_PUBLIC_*` vars are inlined at build time when accessed as
// `process.env.EXPO_PUBLIC_*`. Reading `process.env` dynamically won't work.
const EXPO_PUBLIC_POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const EXPO_PUBLIC_POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST;
const EXPO_PUBLIC_REVENUECAT_IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

export const env = {
  posthog: {
    apiKey: EXPO_PUBLIC_POSTHOG_API_KEY ?? "",
    host: EXPO_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
  },
  revenueCat: {
    iosApiKey: EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? "",
    androidApiKey: EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? "",
  },
} as const;
