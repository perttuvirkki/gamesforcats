import { File, Paths } from "expo-file-system";
import React from "react";
import { Platform } from "react-native";
import { setAppHapticsEnabled } from "@/lib/haptics";

export type AppLanguage = "en" | "de" | "fr" | "es" | "fi" | "sv";
export type HapticsStrength = "light" | "medium" | "heavy";
export type ThemeMode = "system" | "light" | "dark";

export interface AppSettingsState {
  language: AppLanguage;
  themeMode: ThemeMode;
  soundsEnabled: boolean;
  hapticsEnabled: boolean;
  hapticsStrength: HapticsStrength;
  hasSeenWelcome: boolean;
  hasSeenMenuIntro: boolean;
  installId: string;
}

interface AppSettingsContextValue extends AppSettingsState {
  hydrated: boolean;
  setLanguage: (val: AppLanguage) => void;
  setThemeMode: (val: ThemeMode) => void;
  setSoundsEnabled: (val: boolean) => void;
  setHapticsEnabled: (val: boolean) => void;
  setHapticsStrength: (val: HapticsStrength) => void;
  setHasSeenWelcome: (val: boolean) => void;
  setHasSeenMenuIntro: (val: boolean) => void;
  setInstallId: (val: string) => void;
  resetAppSettings: () => void;
}

const STORAGE_KEY = "gamesforcats.appSettings.v1";

function getSettingsFile(): File {
  return new File(Paths.document, "app-settings.json");
}

const AppSettingsContext = React.createContext<AppSettingsContextValue | null>(null);

function createInstallId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const rand2 = Math.random().toString(36).slice(2, 10);
  return `install_${Date.now().toString(36)}_${rand}_${rand2}`;
}

const DEFAULT_SETTINGS: AppSettingsState = {
  language: "en",
  themeMode: "system",
  soundsEnabled: true,
  hapticsEnabled: true,
  hapticsStrength: "medium",
  hasSeenWelcome: false,
  hasSeenMenuIntro: false,
  installId: createInstallId(),
};

function parseSettings(raw: unknown): AppSettingsState {
  if (!raw || typeof raw !== "object") return DEFAULT_SETTINGS;
  const obj = raw as any;

  // Migration: older installs may have used "system" or "fi" here.
  const language =
    obj.language === "en" || obj.language === "de" || obj.language === "fr" || obj.language === "es" || obj.language === "fi" || obj.language === "sv"
      ? obj.language
      : DEFAULT_SETTINGS.language;
  const themeMode = obj.themeMode === "system" || obj.themeMode === "light" || obj.themeMode === "dark" ? obj.themeMode : DEFAULT_SETTINGS.themeMode;
  const soundsEnabled = typeof obj.soundsEnabled === "boolean" ? obj.soundsEnabled : DEFAULT_SETTINGS.soundsEnabled;
  const hapticsEnabled = typeof obj.hapticsEnabled === "boolean" ? obj.hapticsEnabled : DEFAULT_SETTINGS.hapticsEnabled;
  const hapticsStrength =
    obj.hapticsStrength === "light" || obj.hapticsStrength === "medium" || obj.hapticsStrength === "heavy"
      ? obj.hapticsStrength
      : DEFAULT_SETTINGS.hapticsStrength;

  const hasSeenWelcome =
    typeof obj.hasSeenWelcome === "boolean"
      ? obj.hasSeenWelcome
      : // Migration: if settings exist but the flag is missing, assume existing users have already launched the app.
        true;
  const hasSeenMenuIntro =
    typeof obj.hasSeenMenuIntro === "boolean"
      ? obj.hasSeenMenuIntro
      : // Migration: if settings exist but this flag is missing, do not show intro popup for existing users.
        true;

  const installId = typeof obj.installId === "string" && obj.installId.length > 0 ? obj.installId : createInstallId();

  return { language, themeMode, soundsEnabled, hapticsEnabled, hapticsStrength, hasSeenWelcome, hasSeenMenuIntro, installId };
}

async function readStoredSettings(): Promise<AppSettingsState | null> {
  try {
    if (Platform.OS === "web") {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (!raw) return null;
      return parseSettings(JSON.parse(raw));
    }

    const file = getSettingsFile();
    if (!file.exists) return null;
    const raw = await file.text();
    if (!raw) return null;
    return parseSettings(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function writeStoredSettings(settings: AppSettingsState): Promise<void> {
  const payload = JSON.stringify(settings);
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, payload);
    return;
  }

  const file = getSettingsFile();
  if (!file.exists) file.create({ intermediates: true });
  file.write(payload);
}

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = React.useState(false);
  const [settings, setSettings] = React.useState<AppSettingsState>(DEFAULT_SETTINGS);

  React.useEffect(() => {
    let cancelled = false;
    readStoredSettings().then((stored) => {
      if (cancelled) return;
      if (stored) setSettings(stored);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    setAppHapticsEnabled(Boolean(settings.hapticsEnabled));
  }, [settings.hapticsEnabled]);

  React.useEffect(() => {
    if (!hydrated) return;
    const handle = setTimeout(() => {
      writeStoredSettings(settings).catch(() => {});
    }, 200);
    return () => clearTimeout(handle);
  }, [hydrated, settings]);

  const value: AppSettingsContextValue = React.useMemo(
    () => ({
      ...settings,
      hydrated,
      setLanguage: (val) => setSettings((s) => ({ ...s, language: val })),
      setThemeMode: (val) => setSettings((s) => ({ ...s, themeMode: val })),
      setSoundsEnabled: (val) => setSettings((s) => ({ ...s, soundsEnabled: val })),
      setHapticsEnabled: (val) => setSettings((s) => ({ ...s, hapticsEnabled: val })),
      setHapticsStrength: (val) => setSettings((s) => ({ ...s, hapticsStrength: val })),
      setHasSeenWelcome: (val) => setSettings((s) => ({ ...s, hasSeenWelcome: val })),
      setHasSeenMenuIntro: (val) => setSettings((s) => ({ ...s, hasSeenMenuIntro: val })),
      setInstallId: (val) => setSettings((s) => ({ ...s, installId: val })),
      resetAppSettings: () => setSettings((s) => ({ ...DEFAULT_SETTINGS, installId: s.installId })),
    }),
    [hydrated, settings],
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const ctx = React.useContext(AppSettingsContext);
  if (!ctx) throw new Error("useAppSettings must be used within AppSettingsProvider");
  return ctx;
}
