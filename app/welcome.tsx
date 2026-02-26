import { useAppSettings } from "@/components/AppSettingsContext";
import { useI18n } from "@/components/I18nContext";
import { LanguageContextMenu } from "@/components/LanguageContextMenu";
import { SegmentedPicker } from "@/components/SegmentedPicker";
import { Colors, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { lightHaptic } from "@/lib/haptics";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

const LANGUAGE_OPTIONS = ["🇬🇧 English", "🇩🇪 Deutsch", "🇫🇷 Français", "🇪🇸 Español", "🇫🇮 Suomi", "🇸🇪 Svenska"] as const;
const ACCENT = Colors.light.tint;
const WelcomeImage = require("@/assets/welcome.png");

export default function WelcomeScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? "light";
  const isDark = theme === "dark";
  const { t } = useI18n();
  const { language, setLanguage, setHasSeenWelcome } = useAppSettings();

  const onContinue = React.useCallback(() => {
    setHasSeenWelcome(true);
    router.replace("/(tabs)");
  }, [router, setHasSeenWelcome]);

  const languageIndex = language === "de" ? 1 : language === "fr" ? 2 : language === "es" ? 3 : language === "fi" ? 4 : language === "sv" ? 5 : 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Colors[theme].background }]}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View pointerEvents="none" style={styles.topTitleWrap}>
            <Text style={[styles.topTitle, isDark ? styles.topTitleDark : null]}>
              GamesFor<Text style={styles.topTitleAccent}>BoredCats</Text>
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <Image source={WelcomeImage} style={[styles.heroImage, isDark ? styles.heroImageDark : null]} resizeMode="contain" />
          <Text style={[styles.title, { color: Colors[theme].text }]}>{t("welcome.title")}</Text>
          <Text style={[styles.body, { color: Colors[theme].icon }]}>{t("welcome.body")}</Text>
          <View style={styles.languageBlock}>
            <Text style={[styles.languageQuestion, { color: Colors[theme].text }]}>{t("welcome.languageQuestion")}</Text>
            {Platform.OS === "web" ? (
              <View style={styles.languageWide}>
                <SegmentedPicker
                  options={[...LANGUAGE_OPTIONS]}
                  selectedIndex={languageIndex}
                  onOptionSelected={(index) =>
                    setLanguage(index === 1 ? "de" : index === 2 ? "fr" : index === 3 ? "es" : index === 4 ? "fi" : index === 5 ? "sv" : "en")
                  }
                />
              </View>
            ) : (
              <View collapsable={false} style={styles.languagePicker}>
                <LanguageContextMenu
                  options={[...LANGUAGE_OPTIONS]}
                  selectedIndex={languageIndex}
                  title={t("settings.language.label")}
                  onSelectIndex={(index) =>
                    setLanguage(index === 1 ? "de" : index === 2 ? "fr" : index === 3 ? "es" : index === 4 ? "fi" : index === 5 ? "sv" : "en")
                  }
                />
              </View>
            )}
          </View>
        </View>

        <Pressable
          onPress={() => {
            void lightHaptic();
            onContinue();
          }}
          style={({ pressed }) => [styles.button, { backgroundColor: Colors[theme].tint, opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={styles.buttonText}>{t("common.continue")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 22,
    justifyContent: "space-between",
  },
  topBar: {
    height: 44,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  topTitleWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 56,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  topTitleDark: {
    color: "rgba(255,255,255,0.92)",
  },
  topTitleAccent: {
    color: ACCENT,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  heroImage: {
    width: "100%",
    maxWidth: 420,
    height: 200,
    borderRadius: 18,
  },
  heroImageDark: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  languageBlock: {
    width: "100%",
    maxWidth: 420,
    marginTop: 12,
    gap: 10,
    alignItems: "center",
  },
  languageQuestion: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  languagePicker: {
    width: "100%",
    maxWidth: 220,
    height: 44,
  },
  languageWide: {
    width: "100%",
    maxWidth: 420,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    textAlign: "center",
    fontFamily: Fonts.rounded,
    fontWeight: "800",
  },
  body: {
    maxWidth: 360,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    fontWeight: "500",
  },
  button: {
    height: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
