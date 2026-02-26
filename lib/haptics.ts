import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

let lastLightImpactAt = 0;
let appHapticsEnabled = true;

export function setAppHapticsEnabled(enabled: boolean) {
  appHapticsEnabled = enabled;
}

export async function lightHaptic() {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return;
  if (!appHapticsEnabled) return;

  const now = Date.now();
  // Prevent spamming haptics during rapid tapping.
  if (now - lastLightImpactAt < 60) return;
  lastLightImpactAt = now;

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // ignore
  }
}
