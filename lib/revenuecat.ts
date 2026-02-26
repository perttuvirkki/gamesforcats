import { Platform } from "react-native";
import { env } from "@/lib/env";

type PurchasesModule = {
  default: {
    configure: (options: { apiKey: string }) => void;
    setLogLevel: (level: unknown) => void;
    getCustomerInfo?: () => Promise<{ entitlements?: { active?: Record<string, unknown> } }>;
  };
  LOG_LEVEL?: Record<string, unknown>;
};

let configured = false;
let devProOverride: boolean | null = null;

const DEFAULT_ENTITLEMENT_IDS = ["Paws"] as const;

export function getDevProOverride(): boolean | null {
  return devProOverride;
}

export function setDevProOverride(val: boolean | null) {
  devProOverride = val;
}

export function configureRevenueCat() {
  if (configured) return;
  if (Platform.OS !== "ios" && Platform.OS !== "android") return;

  const apiKey = Platform.OS === "ios" ? env.revenueCat.iosApiKey : env.revenueCat.androidApiKey;
  if (!apiKey) return;

  let mod: PurchasesModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require("react-native-purchases");
  } catch {
    return;
  }

  const Purchases = mod.default;
  const LOG_LEVEL = mod.LOG_LEVEL ?? {};

  if (__DEV__) {
    Purchases.setLogLevel((LOG_LEVEL as any).VERBOSE ?? (LOG_LEVEL as any).DEBUG ?? (LOG_LEVEL as any).INFO ?? (LOG_LEVEL as any).WARN);
  }

  try {
    Purchases.configure({ apiKey });
    configured = true;
  } catch (e) {
    configured = false;
    // Avoid crashing the app if the API key is invalid or the SDK throws.
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn("[RevenueCat] configure failed", e);
    }
  }
}

export async function hasProAccess(entitlementIds: readonly string[] = DEFAULT_ENTITLEMENT_IDS): Promise<boolean> {
  if (__DEV__ && devProOverride !== null) return devProOverride;
  if (Platform.OS !== "ios" && Platform.OS !== "android") return false;

  const apiKey = Platform.OS === "ios" ? env.revenueCat.iosApiKey : env.revenueCat.androidApiKey;
  if (!apiKey) return false;

  configureRevenueCat();

  let mod: PurchasesModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require("react-native-purchases");
  } catch {
    return false;
  }

  const Purchases = mod.default;
  if (!Purchases.getCustomerInfo) return false;

  try {
    const info = await Purchases.getCustomerInfo();
    const active = info?.entitlements?.active ?? {};
    if (entitlementIds.some((id) => Boolean((active as any)[id]))) return true;
    return Object.keys(active).length > 0;
  } catch {
    return false;
  }
}
