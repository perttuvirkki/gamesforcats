import { useAppSettings } from "@/components/AppSettingsContext";
import { useI18n } from "@/components/I18nContext";
import { LanguageContextMenu } from "@/components/LanguageContextMenu";
import { SegmentedPicker } from "@/components/SegmentedPicker";
import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getDevProOverride, hasProAccess, setDevProOverride } from "@/lib/revenuecat";
import { lightHaptic } from "@/lib/haptics";
import { useFocusEffect } from "@react-navigation/native";
import * as Application from "expo-application";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as StoreReview from "expo-store-review";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LANGUAGE_OPTIONS = ["🇬🇧 English", "🇩🇪 Deutsch", "🇫🇷 Français", "🇪🇸 Español", "🇫🇮 Suomi", "🇸🇪 Svenska"] as const;

const PRIVACY_URL = "https://www.supersmart.fi/privacy";
const TERMS_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

export function SettingsForm() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { t } = useI18n();
  const [canReview, setCanReview] = React.useState<boolean>(false);
  const [isPro, setIsPro] = React.useState<boolean>(false);
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

  const THEME_OPTIONS = React.useMemo(
    () => [t("settings.theme.option.system"), t("settings.theme.option.light"), t("settings.theme.option.dark")] as const,
    [t],
  );
  const HAPTICS_OPTIONS = React.useMemo(
    () =>
      [t("settings.hapticsStrength.option.light"), t("settings.hapticsStrength.option.medium"), t("settings.hapticsStrength.option.heavy")] as const,
    [t],
  );

  const languageIndex = language === "de" ? 1 : language === "fr" ? 2 : language === "es" ? 3 : language === "fi" ? 4 : language === "sv" ? 5 : 0;
  const themeIndex = themeMode === "light" ? 1 : themeMode === "dark" ? 2 : 0;
  const hapticsIndex = hapticsStrength === "light" ? 0 : hapticsStrength === "heavy" ? 2 : 1;

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

  const appVersion = Platform.OS === "web" ? null : (Application.nativeApplicationVersion ?? null);
  const buildVersion = Platform.OS === "web" ? null : (Application.nativeBuildVersion ?? null);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 56 }]} showsVerticalScrollIndicator={false}>
      {!hydrated ? (
        <ThemedText style={styles.loading}>{t("common.loading")}</ThemedText>
      ) : (
        <>
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>
                {"⚙️ "}
                {t("settings.section.basic")}
              </ThemedText>

              <View style={styles.basicCards}>
                <View style={[styles.card, isDark ? styles.cardDark : null, styles.languageCard]}>
                  <RowColumn
                    label={t("settings.language.label")}
                    description={t("settings.language.description")}
                    right={
                      <View collapsable={false} style={styles.inlineControl}>
                        {Platform.OS === "web" ? (
                          <SegmentedPicker
                            options={[...LANGUAGE_OPTIONS]}
                            selectedIndex={languageIndex}
                            onOptionSelected={(index) =>
                              setLanguage(
                                index === 1 ? "de" : index === 2 ? "fr" : index === 3 ? "es" : index === 4 ? "fi" : index === 5 ? "sv" : "en",
                              )
                            }
                          />
                        ) : (
                          <LanguageContextMenu
                            options={[...LANGUAGE_OPTIONS]}
                            selectedIndex={languageIndex}
                            title={t("settings.language.label")}
                            onSelectIndex={(index) =>
                              setLanguage(
                                index === 1 ? "de" : index === 2 ? "fr" : index === 3 ? "es" : index === 4 ? "fi" : index === 5 ? "sv" : "en",
                              )
                            }
                          />
                        )}
                      </View>
                    }
                    isDark={isDark}
                  />
                </View>

                <View style={[styles.card, isDark ? styles.cardDark : null]}>
                  <RowColumn label={t("settings.theme.label")} description={t("settings.theme.description")} isDark={isDark}>
                    <SegmentedPicker
                      options={[...THEME_OPTIONS]}
                      selectedIndex={themeIndex}
                      onOptionSelected={(index) => setThemeMode(index === 1 ? "light" : index === 2 ? "dark" : "system")}
                    />
                  </RowColumn>
                </View>
              </View>
            </View>

            <Section title={t("settings.section.sounds")} emoji="🔊" isDark={isDark}>
              <RowSwitch label={t("settings.soundEffects")} value={soundsEnabled} onChange={setSoundsEnabled} isDark={isDark} />
            </Section>

            <Section title={t("settings.section.haptics")} emoji="✨" isDark={isDark}>
              <RowSwitch label={t("settings.haptics")} value={hapticsEnabled} onChange={setHapticsEnabled} isDark={isDark} />
              <RowColumn label={t("settings.hapticsStrength")} disabled={!hapticsEnabled} isDark={isDark}>
                <SegmentedPicker
                  options={[...HAPTICS_OPTIONS]}
                  selectedIndex={hapticsIndex}
                  onOptionSelected={(index) => setHapticsStrength(index === 0 ? "light" : index === 2 ? "heavy" : "medium")}
                />
              </RowColumn>
              <RowButton label={t("settings.testHaptic")} onPress={testHaptics} disabled={!hapticsEnabled} isDark={isDark} />
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
              {Platform.OS !== "web" ? (
                <RowButton label={t("settings.review")} onPress={reviewThisApp} disabled={!canReview} isDark={isDark} />
              ) : null}
              <RowButton label={t("settings.feedback.button")} onPress={() => router.push("/feedback")} isDark={isDark} />
              {appVersion ? <Row label={t("settings.version")} value={appVersion} isDark={isDark} /> : null}
              {buildVersion ? <Row label={t("settings.build")} value={buildVersion} isDark={isDark} /> : null}
              <RowButton label={t("settings.privacy")} onPress={() => openUrl(PRIVACY_URL)} isDark={isDark} />
              <RowButton label={t("settings.terms")} onPress={() => openUrl(TERMS_URL)} isDark={isDark} />
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
          </>
        )}
    </ScrollView>
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

function RowColumn({
  label,
  description,
  children,
  right,
  disabled,
  isDark,
}: {
  label: string;
  description?: string;
  children?: React.ReactNode;
  right?: React.ReactNode;
  disabled?: boolean;
  isDark: boolean;
}) {
  const hasChildren = Boolean(children);
  const hasRight = Boolean(right);

  return (
    <View style={[styles.rowColumn, isDark ? styles.rowDark : null, disabled ? styles.rowDisabled : null]}>
      {hasRight ? (
        <View style={styles.rowColumnHeaderRow}>
          <View style={styles.rowColumnHeaderText}>
            <ThemedText style={styles.rowLabel}>{label}</ThemedText>
            {description ? (
              <ThemedText lightColor="rgba(0,0,0,0.45)" darkColor="rgba(255,255,255,0.55)" style={styles.rowDescription}>
                {description}
              </ThemedText>
            ) : null}
          </View>
          <View pointerEvents={disabled ? "none" : "auto"} style={disabled ? styles.disabledContent : null}>
            {right}
          </View>
        </View>
      ) : (
        <View style={[styles.rowColumnHeader, hasChildren ? null : styles.rowColumnHeaderTight]}>
          <ThemedText style={styles.rowLabel}>{label}</ThemedText>
          {description ? (
            <ThemedText lightColor="rgba(0,0,0,0.45)" darkColor="rgba(255,255,255,0.55)" style={styles.rowDescription}>
              {description}
            </ThemedText>
          ) : null}
        </View>
      )}

      {hasChildren ? (
        <View pointerEvents={disabled ? "none" : "auto"} style={disabled ? styles.disabledContent : null}>
          {children}
        </View>
      ) : null}
    </View>
  );
}

function RowButton({ label, onPress, disabled, isDark }: { label: string; onPress: () => void; disabled?: boolean; isDark: boolean }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, isDark ? styles.rowDark : null, disabled ? styles.rowDisabled : null, { opacity: pressed ? 0.85 : 1 }]}
      disabled={disabled}
      onPress={() => {
        void lightHaptic();
        onPress();
      }}
    >
      <ThemedText style={styles.rowLabel}>{label}</ThemedText>
      <ThemedText lightColor="rgba(0,0,0,0.55)" darkColor="rgba(255,255,255,0.65)" style={styles.rowValue}>
        ›
      </ThemedText>
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
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  loading: {
    opacity: 0.6,
    marginTop: 16,
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
  basicCards: {
    gap: 10,
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
  languageCard: {
    overflow: "visible",
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
  rowColumn: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  rowColumnHeader: {
    marginBottom: 10,
  },
  rowColumnHeaderTight: {
    marginBottom: 0,
  },
  rowColumnHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    minHeight: 44,
  },
  rowColumnHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  inlineControl: {
    width: 126,
    height: 44,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingTop: 0,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  rowValue: {
    fontSize: 14,
  },
  rowCentered: {
    justifyContent: "center",
  },
  rowCenteredText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
  rowDescription: {
    marginTop: 2,
    fontSize: 13,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  disabledContent: {
    opacity: 0.7,
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
