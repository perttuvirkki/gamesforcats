import { useAppSettings } from "@/components/AppSettingsContext";
import { AndroidOptionSheetModal } from "@/components/AndroidOptionSheetModal";
import { useI18n } from "@/components/I18nContext";
import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { lightHaptic } from "@/lib/haptics";
import { getDevProOverride, hasProAccess, setDevProOverride } from "@/lib/revenuecat";
import { useFocusEffect } from "@react-navigation/native";
import * as Application from "expo-application";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import * as StoreReview from "expo-store-review";
import { useRouter } from "expo-router";
import React from "react";
import { ActionSheetIOS, Alert, Platform, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import type { TranslationKey } from "@/lib/i18n";

const PRIVACY_URL = "https://www.supersmart.fi/privacy";
const TERMS_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

const LANGUAGE_OPTIONS = [
  { label: "🇬🇧 English", value: "en" as const },
  { label: "🇩🇪 Deutsch", value: "de" as const },
  { label: "🇫🇷 Français", value: "fr" as const },
  { label: "🇪🇸 Español", value: "es" as const },
  { label: "🇫🇮 Suomi", value: "fi" as const },
  { label: "🇸🇪 Svenska", value: "sv" as const },
] as const;

type ThemeMode = "system" | "light" | "dark";
const THEME_OPTIONS: readonly { labelKey: TranslationKey; value: ThemeMode }[] = [
  { labelKey: "settings.theme.option.system", value: "system" },
  { labelKey: "settings.theme.option.light", value: "light" },
  { labelKey: "settings.theme.option.dark", value: "dark" },
];

type HapticsStrength = "light" | "medium" | "heavy";
const HAPTICS_OPTIONS: readonly { labelKey: TranslationKey; value: HapticsStrength }[] = [
  { labelKey: "settings.hapticsStrength.option.light", value: "light" },
  { labelKey: "settings.hapticsStrength.option.medium", value: "medium" },
  { labelKey: "settings.hapticsStrength.option.heavy", value: "heavy" },
];

type OptionSheetState = {
  title: string;
  options: string[];
  selectedIndex?: number;
  onSelect: (index: number) => void;
};

export function BasicSettingsMenu() {
  const router = useRouter();
  const { t } = useI18n();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [canReview, setCanReview] = React.useState(false);
  const [isPro, setIsPro] = React.useState(false);
  const [devProOverrideValue, setDevProOverrideValue] = React.useState<boolean | null>(() => (__DEV__ ? getDevProOverride() : null));

  const {
    hydrated,
    language,
    setLanguage,
    themeMode,
    setThemeMode,
    soundsEnabled,
    setSoundsEnabled,
    hapticsEnabled,
    setHapticsEnabled,
    hapticsStrength,
    setHapticsStrength,
    resetAppSettings,
  } = useAppSettings();

  const appVersion = Platform.OS === "web" ? null : (Application.nativeApplicationVersion ?? null);
  const buildVersion = Platform.OS === "web" ? null : (Application.nativeBuildVersion ?? null);

  const [optionSheet, setOptionSheet] = React.useState<OptionSheetState | null>(null);

  const showOptionSheet = React.useCallback(
    ({ title, options, selectedIndex, onSelect }: OptionSheetState) => {
      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            title,
            options: [...options, "Cancel"],
            cancelButtonIndex: options.length,
            userInterfaceStyle: undefined,
          },
          (buttonIndex) => {
            if (buttonIndex === options.length) return;
            onSelect(buttonIndex);
          },
        );
        return;
      }

      // On Android, `Alert.alert` effectively supports only up to 3 buttons.
      // For longer lists (like languages), show a custom modal that can render all options.
      if (options.length > 3) {
        setOptionSheet({ title, options, selectedIndex, onSelect });
        return;
      }

      Alert.alert(
        title,
        undefined,
        [
          ...options.map((label, index) => ({
            text: selectedIndex === index ? `${label} ✓` : label,
            onPress: () => onSelect(index),
          })),
          { text: "Cancel", style: "cancel" },
        ],
        { cancelable: true },
      );
    },
    [],
  );

  React.useEffect(() => {
    if (Platform.OS === "web") return;
    StoreReview.hasAction()
      .then(setCanReview)
      .catch(() => setCanReview(false));
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (!hydrated) return;
      if (Platform.OS === "web") return;

      if (__DEV__) {
        const override = getDevProOverride();
        setDevProOverrideValue(override);
        if (override !== null) {
          setIsPro(override);
          return;
        }
      }

      let cancelled = false;
      hasProAccess()
        .then((val) => {
          if (cancelled) return;
          setIsPro(val);
        })
        .catch(() => {
          if (cancelled) return;
          setIsPro(false);
        });
      return () => {
        cancelled = true;
      };
    }, [hydrated]),
  );

  const cycleDevProOverride = () => {
    if (!__DEV__) return;
    const next = devProOverrideValue === null ? true : devProOverrideValue === true ? false : null;
    setDevProOverride(next);
    setDevProOverrideValue(next);
    if (next !== null) {
      setIsPro(next);
      return;
    }
    hasProAccess()
      .then(setIsPro)
      .catch(() => setIsPro(false));
  };

  const openUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      // ignore
    }
  };

  const reviewThisApp = async () => {
    if (Platform.OS === "web") return;
    const hasAction = await StoreReview.hasAction().catch(() => false);
    if (!hasAction) {
      Alert.alert(t("common.notAvailable"), t("settings.review.notAvailable.body"));
      return;
    }
    try {
      await StoreReview.requestReview();
    } catch {
      Alert.alert(t("settings.review.failed.title"), t("settings.review.failed.body"));
    }
  };

  const testHaptics = async () => {
    if (!hapticsEnabled) return;
    const style =
      hapticsStrength === "light"
        ? Haptics.ImpactFeedbackStyle.Light
        : hapticsStrength === "heavy"
          ? Haptics.ImpactFeedbackStyle.Heavy
          : Haptics.ImpactFeedbackStyle.Medium;
    await Haptics.impactAsync(style);
  };

  const languageLabel = LANGUAGE_OPTIONS.find((o) => o.value === language)?.label ?? "English";
  const themeLabel = t(THEME_OPTIONS.find((o) => o.value === themeMode)?.labelKey ?? "settings.theme.option.system");
  const hapticsLabel = t(HAPTICS_OPTIONS.find((o) => o.value === hapticsStrength)?.labelKey ?? "settings.hapticsStrength.option.medium");

  if (!hydrated) {
    return <ThemedText style={styles.loading}>{t("common.loading")}</ThemedText>;
  }

  return (
    <View>
      <Section title={t("settings.section.basic")} emoji="⚙️" isDark={isDark}>
        <RowButton
          label={t("settings.language.label")}
          value={languageLabel}
          onPress={() => {
            void lightHaptic();
            showOptionSheet({
              title: t("settings.language.label"),
              options: LANGUAGE_OPTIONS.map((o) => o.label),
              selectedIndex: LANGUAGE_OPTIONS.findIndex((o) => o.value === language),
              onSelect: (index) => setLanguage(LANGUAGE_OPTIONS[index]?.value ?? "en"),
            });
          }}
          isDark={isDark}
        />
        <RowButton
          label={t("settings.theme.label")}
          value={themeLabel}
          onPress={() => {
            void lightHaptic();
            showOptionSheet({
              title: t("settings.theme.label"),
              options: THEME_OPTIONS.map((o) => t(o.labelKey)),
              selectedIndex: THEME_OPTIONS.findIndex((o) => o.value === themeMode),
              onSelect: (index) => setThemeMode(THEME_OPTIONS[index]?.value ?? "system"),
            });
          }}
          isDark={isDark}
        />
      </Section>

      <Section title={t("settings.section.sounds")} emoji="🔊" isDark={isDark}>
        <RowSwitch label={t("settings.soundEffects")} value={soundsEnabled} onChange={setSoundsEnabled} isDark={isDark} />
      </Section>

      <Section title={t("settings.section.haptics")} emoji="✨" isDark={isDark}>
        <RowSwitch label={t("settings.haptics")} value={hapticsEnabled} onChange={setHapticsEnabled} isDark={isDark} />
        <RowButton
          label={t("settings.hapticsStrength")}
          value={hapticsLabel}
          disabled={!hapticsEnabled}
          onPress={() => {
            void lightHaptic();
            showOptionSheet({
              title: t("settings.hapticsStrength"),
              options: HAPTICS_OPTIONS.map((o) => t(o.labelKey)),
              selectedIndex: HAPTICS_OPTIONS.findIndex((o) => o.value === hapticsStrength),
              onSelect: (index) => setHapticsStrength(HAPTICS_OPTIONS[index]?.value ?? "medium"),
            });
          }}
          isDark={isDark}
        />
        <RowButton label={t("settings.testHaptic")} onPress={() => void testHaptics()} disabled={!hapticsEnabled} isDark={isDark} />
      </Section>

      <Section title={t("settings.section.about")} emoji="ℹ️" isDark={isDark}>
        {Platform.OS !== "web" && !isPro ? (
          <RowButton
            label={t("settings.upgrade")}
            onPress={() => router.push("/paywall")}
            isDark={isDark}
          />
        ) : null}
        {__DEV__ ? (
          <RowButton
            label={`🧪 Debug isPro: ${String(isPro)}${devProOverrideValue !== null ? " (forced)" : ""}`}
            onPress={cycleDevProOverride}
            isDark={isDark}
          />
        ) : null}
        {Platform.OS !== "web" ? <RowButton label={t("settings.review")} onPress={() => void reviewThisApp()} disabled={!canReview} isDark={isDark} /> : null}
        <RowButton label={t("settings.feedback.button")} onPress={() => router.push("/feedback")} isDark={isDark} />
        {appVersion ? <Row label={t("settings.version")} value={appVersion} isDark={isDark} /> : null}
        {buildVersion ? <Row label={t("settings.build")} value={buildVersion} isDark={isDark} /> : null}
        <RowButton label={t("settings.privacy")} onPress={() => void openUrl(PRIVACY_URL)} isDark={isDark} />
        <RowButton label={t("settings.terms")} onPress={() => void openUrl(TERMS_URL)} isDark={isDark} />
        <RowCentered label={t("settings.madeWith")} isDark={isDark} />
      </Section>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.resetButton, isDark ? styles.resetButtonDark : null, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => {
            void lightHaptic();
            resetAppSettings();
          }}
        >
          <ThemedText lightColor="#b00020" darkColor="#ff6b81" style={styles.resetText}>
            {t("settings.reset")}
          </ThemedText>
        </Pressable>
      </View>

      <AndroidOptionSheetModal
        visible={optionSheet !== null}
        title={optionSheet?.title ?? ""}
        options={optionSheet?.options ?? []}
        selectedIndex={optionSheet?.selectedIndex}
        isDark={isDark}
        onSelect={(index) => {
          const handler = optionSheet?.onSelect;
          setOptionSheet(null);
          handler?.(index);
        }}
        onCancel={() => setOptionSheet(null)}
      />
    </View>
  );
}

function Section({ title, emoji, children, isDark }: { title: string; emoji?: string; children: React.ReactNode; isDark: boolean }) {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>
        {emoji ? `${emoji} ` : ""}
        {title}
      </ThemedText>
      <View style={[styles.card, isDark ? styles.cardDark : null]}>{children}</View>
    </View>
  );
}

function Row({ label, value, disabled, isDark }: { label: string; value?: string; disabled?: boolean; isDark: boolean }) {
  return (
    <View style={[styles.row, isDark ? styles.rowDark : null, disabled ? styles.rowDisabled : null]}>
      <ThemedText style={styles.rowLabel}>{label}</ThemedText>
      {value ? (
        <ThemedText lightColor="rgba(0,0,0,0.55)" darkColor="rgba(255,255,255,0.65)" style={styles.rowValue}>
          {value}
        </ThemedText>
      ) : null}
    </View>
  );
}

function RowSwitch({ label, value, onChange, isDark }: { label: string; value: boolean; onChange: (val: boolean) => void; isDark: boolean }) {
  return (
    <View style={[styles.row, isDark ? styles.rowDark : null]}>
      <ThemedText style={styles.rowLabel}>{label}</ThemedText>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

function RowButton({
  label,
  value,
  onPress,
  disabled,
  isDark,
}: {
  label: string;
  value?: string;
  onPress: () => void;
  disabled?: boolean;
  isDark: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, isDark ? styles.rowDark : null, disabled ? styles.rowDisabled : null, { opacity: pressed ? 0.85 : 1 }]}
      disabled={disabled}
      onPress={onPress}
    >
      <ThemedText style={styles.rowLabel}>{label}</ThemedText>
      <View style={styles.rowRight}>
        {value ? (
          <ThemedText lightColor="rgba(0,0,0,0.55)" darkColor="rgba(255,255,255,0.65)" style={styles.rowValue} numberOfLines={1}>
            {value}
          </ThemedText>
        ) : null}
        <Text style={[styles.chevron, isDark ? styles.chevronDark : null]}>›</Text>
      </View>
    </Pressable>
  );
}

function RowCentered({ label, isDark }: { label: string; isDark: boolean }) {
  return (
    <View style={[styles.row, isDark ? styles.rowDark : null, styles.rowCentered]}>
      <ThemedText lightColor="rgba(0,0,0,0.55)" darkColor="rgba(255,255,255,0.65)" style={styles.rowCenteredText}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    opacity: 0.6,
    marginTop: 16,
    marginLeft: 4,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    opacity: 0.5,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(150, 150, 150, 0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
  },
  cardDark: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.14)",
  },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  rowDark: {
    borderBottomColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1,
    paddingRight: 8,
  },
  rowValue: {
    fontSize: 14,
    flexShrink: 1,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
    maxWidth: "55%",
  },
  chevron: {
    fontSize: 18,
    color: "rgba(0,0,0,0.35)",
  },
  chevronDark: {
    color: "rgba(255,255,255,0.35)",
  },
  rowCentered: {
    justifyContent: "center",
  },
  rowCenteredText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    marginTop: 18,
    marginBottom: 8,
    alignItems: "center",
  },
  resetButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  resetButtonDark: {
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  resetText: {
    fontWeight: "700",
  },
});
