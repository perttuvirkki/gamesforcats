import { BasicSettingsMenu } from "@/components/BasicSettingsMenu";
import { FormSheetHeader } from "@/components/FormSheetHeader";
import { useI18n } from "@/components/I18nContext";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, "background");

  return (
    <>
      {/* Keep header + ScrollView as direct siblings so iOS FormSheet can lay out correctly. */}
      <View style={[styles.headerWrap, { backgroundColor }]} collapsable={false}>
        <FormSheetHeader title={t("tabs.settings")} onClose={() => router.back()} style={styles.header} />
      </View>
      <ScrollView
        style={[styles.scroll, { backgroundColor }]}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(24, insets.bottom + 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <BasicSettingsMenu />
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
});
