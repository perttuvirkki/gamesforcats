import React from "react";
import { useAppSettings } from "@/components/AppSettingsContext";
import { resolveLanguage, translate, type SupportedLanguage, type TranslationKey } from "@/lib/i18n";

type I18nContextValue = {
  language: SupportedLanguage;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = React.createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { language: preferred } = useAppSettings();
  const language = React.useMemo(() => resolveLanguage(preferred), [preferred]);
  const t = React.useCallback((key: TranslationKey, vars?: Record<string, string | number>) => translate(key, language, vars), [language]);

  return <I18nContext.Provider value={{ language, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
