import { de, en, es, fi, fr, sv } from "@/lib/i18n/messages";
import type { AppLanguage } from "@/components/AppSettingsContext";

export type SupportedLanguage = "en" | "de" | "fr" | "es" | "fi" | "sv";
export type TranslationKey = keyof typeof en;

const MESSAGES: Record<SupportedLanguage, Partial<Record<TranslationKey, string>>> = { en, de, fr, es, fi, sv };

export function resolveLanguage(preferred: AppLanguage): SupportedLanguage {
  return preferred;
}

export function translate(key: TranslationKey, lang: SupportedLanguage, vars?: Record<string, string | number>): string {
  const raw = MESSAGES[lang]?.[key] ?? en[key] ?? String(key);
  if (!vars) return raw;
  return Object.keys(vars).reduce((acc, k) => acc.replaceAll(`{${k}}`, String(vars[k])), raw);
}
