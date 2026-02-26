import { setAudioModeAsync, setIsAudioActiveAsync } from "expo-audio";
import { Platform } from "react-native";

let audioConfigured = false;
let configuringPromise: Promise<void> | null = null;
let warnedUnavailable = false;

function warnOnce(message: string, error: unknown) {
  if (!__DEV__) return;
  if (warnedUnavailable) return;
  warnedUnavailable = true;
  // eslint-disable-next-line no-console
  console.warn(message, error);
}

export async function ensureGameAudioAsync(): Promise<void> {
  if (audioConfigured) return;
  if (configuringPromise) return configuringPromise;

  configuringPromise = (async () => {
    try {
      await setIsAudioActiveAsync(true);
    } catch (error) {
      warnOnce("Audio unavailable (setIsAudioActiveAsync failed). If you're on Android Expo Go, use a dev build (expo run:android).", error);
    }

    try {
      if (Platform.OS === "android") {
        await setAudioModeAsync({
          // Request audio focus (vs. mixWithOthers = no focus) to improve reliability on Android/emulators.
          interruptionMode: "duckOthers",
          shouldRouteThroughEarpiece: false,
          shouldPlayInBackground: false,
        });
      } else {
        await setAudioModeAsync({
          interruptionMode: "mixWithOthers",
          playsInSilentMode: true,
        });
      }
    } catch (error) {
      warnOnce("Audio unavailable (setAudioModeAsync failed). If you're on Android Expo Go, use a dev build (expo run:android).", error);
    }

    audioConfigured = true;
  })().finally(() => {
    configuringPromise = null;
  });

  return configuringPromise;
}

