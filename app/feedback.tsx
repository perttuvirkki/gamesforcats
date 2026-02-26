import { FormSheetHeader } from "@/components/FormSheetHeader";
import { useI18n } from "@/components/I18nContext";
import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { lightHaptic } from "@/lib/haptics";
import { useFocusEffect } from "@react-navigation/native";
import * as Application from "expo-application";
import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import React from "react";
import { Alert, Image, Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getDevProOverride, hasProAccess } from "@/lib/revenuecat";

const FeedbackCatImage = require("@/assets/feedbackcat.png");

export default function FeedbackScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useI18n();
  const isDark = (useColorScheme() ?? "light") === "dark";
  const backgroundColor = useThemeColor({}, "background");
  const posthog = usePostHog();

  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [keyboardVisible, setKeyboardVisible] = React.useState(false);
  const [isPro, setIsPro] = React.useState(false);

  const appVersion = Platform.OS === "web" ? null : (Application.nativeApplicationVersion ?? null);
  const buildVersion = Platform.OS === "web" ? null : (Application.nativeBuildVersion ?? null);

  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS === "web") return;

      if (__DEV__) {
        const override = getDevProOverride();
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
    }, []),
  );

  React.useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const close = React.useCallback(() => {
    Keyboard.dismiss();
    router.back();
  }, [router]);

  const submit = React.useCallback(async () => {
    const msg = text.trim();
    if (!msg) return;

    if (!posthog) {
      Alert.alert(t("common.notAvailable"), t("settings.feedback.notConfigured"));
      return;
    }

    setSending(true);
    try {
      posthog.capture("feedback_submitted", {
        message: msg,
        source: "settings",
        language,
        isPro,
        platform: Platform.OS,
        appVersion,
        buildVersion,
      });
      setText("");
      close();
      Alert.alert(t("settings.feedback.sent.title"), t("settings.feedback.sent.body"));
    } finally {
      setSending(false);
    }
  }, [appVersion, buildVersion, close, isPro, language, posthog, t, text]);

  return (
    <>
      {/* Keep header + ScrollView as direct siblings so iOS FormSheet can lay out correctly. */}
      <View style={[styles.headerWrap, { backgroundColor }]} collapsable={false}>
        <FormSheetHeader
          title={t("settings.feedback.sheetTitle")}
          onClose={close}
          leftAction={keyboardVisible ? { icon: "chevron-down", onPress: () => Keyboard.dismiss() } : undefined}
          style={styles.header}
        />
      </View>
      <ScrollView
        style={[styles.scroll, { backgroundColor }]}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(24, insets.bottom + 24) }]}
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.sheet, isDark ? styles.sheetDark : null]}>
          <Image source={FeedbackCatImage} style={[styles.image, isDark ? styles.imageDark : null]} resizeMode="cover" />

          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t("settings.feedback.placeholder")}
            placeholderTextColor={isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.35)"}
            multiline
            textAlignVertical="top"
            style={[styles.input, isDark ? styles.inputDark : null]}
            editable={!sending}
            maxLength={1000}
          />

          <ThemedText style={styles.body}>{t("settings.feedback.body")}</ThemedText>

          <Pressable
            onPress={() => {
              void lightHaptic();
              void submit();
            }}
            disabled={!text.trim() || sending}
            style={({ pressed }) => [styles.cta, !text.trim() || sending ? styles.ctaDisabled : null, { opacity: pressed ? 0.92 : 1 }]}
          >
            <Text style={styles.ctaText}>{sending ? t("common.processing") : t("settings.feedback.sendButton")}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    paddingTop: 18,
    paddingHorizontal: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    marginTop: 0,
    marginBottom: 10,
  },
  sheet: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(150, 150, 150, 0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.10)",
  },
  sheetDark: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.14)",
  },
  image: {
    width: "100%",
    maxWidth: 520,
    height: 240,
    alignSelf: "center",
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginBottom: 10,
  },
  imageDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
    opacity: 0.92,
  },
  input: {
    marginTop: 10,
    minHeight: 140,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "rgba(255,255,255,0.82)",
    color: "#11181C",
    fontSize: 16,
  },
  inputDark: {
    backgroundColor: "rgba(0,0,0,0.20)",
    borderColor: "rgba(255,255,255,0.14)",
    color: "rgba(255,255,255,0.92)",
  },
  body: {
    marginTop: 12,
    opacity: 0.8,
    lineHeight: 22,
    textAlign: "center",
  },
  cta: {
    marginTop: 16,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,138,0,1)",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
});
