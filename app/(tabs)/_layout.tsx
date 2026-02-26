import { GlassIconButton } from "@/components/GlassIconButton";
import { useI18n } from "@/components/I18nContext";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SETTINGS_BUTTON_SIZE = 46;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const iconColor = Colors[colorScheme ?? 'light'].icon;
  const tabBarBackground =
    colorScheme === 'dark' ? 'rgba(21, 23, 24, 0.92)' : 'rgba(255, 255, 255, 0.92)';
  const tabBarShadow = colorScheme === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.15)';
  const tabBarBorder = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.10)';
  const settingsButtonTop = insets.top + 12;

  const openSettings = React.useCallback(() => {
    router.push("/settings");
  }, [router]);

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.root}>
        <NativeTabs
          tintColor={tintColor}
          backgroundColor={tabBarBackground}
          blurEffect={colorScheme === "dark" ? "systemChromeMaterialDark" : "systemChromeMaterial"}
          shadowColor={tabBarShadow}
          disableTransparentOnScrollEdge
          iconColor={{ default: iconColor, selected: tintColor }}
          labelStyle={{ default: { color: iconColor }, selected: { color: tintColor } }}
        >
          <NativeTabs.Trigger name="index">
            <Label>{t("tabs.games")}</Label>
            <Icon sf={{ default: "gamecontroller", selected: "gamecontroller.fill" }} />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="sounds">
            <Label>{t("tabs.sounds")}</Label>
            <Icon sf={{ default: "speaker.wave.3", selected: "speaker.wave.3.fill" }} />
          </NativeTabs.Trigger>
        </NativeTabs>
        <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
          <GlassIconButton
            name="settings-sharp"
            onPress={openSettings}
            size={SETTINGS_BUTTON_SIZE}
            style={[styles.settingsButton, { top: settingsButtonTop }]}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: tintColor,
          tabBarInactiveTintColor: iconColor,
          tabBarStyle: { backgroundColor: tabBarBackground, borderTopColor: tabBarBorder },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t("tabs.games"),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "game-controller" : "game-controller-outline"} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="sounds"
          options={{
            title: t("tabs.sounds"),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "volume-high" : "volume-high-outline"} size={24} color={color} />
            ),
          }}
        />
      </Tabs>
      <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
        <GlassIconButton
          name="settings-sharp"
          onPress={openSettings}
          size={SETTINGS_BUTTON_SIZE}
          style={[styles.settingsButton, { top: settingsButtonTop }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  settingsButton: {
    position: "absolute",
    right: 16,
    zIndex: 50,
  },
});
