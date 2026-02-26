import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, usePathname, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import { PostHogProvider } from "posthog-react-native";
import { Platform, View } from "react-native";
import "react-native-reanimated";

import AnimatedSplash from "@/components/AnimatedSplash";
import { AppSettingsProvider, useAppSettings } from "@/components/AppSettingsContext";
import { GameProvider } from "@/components/GameContext";
import { I18nProvider } from "@/components/I18nContext";
import { PostHogRouterTracker } from "@/components/PostHogRouterTracker";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { env } from "@/lib/env";
import { formSheetFitToContentsOptions } from "@/lib/formSheetOptions";
import { configureRevenueCat } from "@/lib/revenuecat";
import { useEffect } from "react";

function AppContent() {
  const colorScheme = useColorScheme();
  const { hydrated, hasSeenWelcome } = useAppSettings();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    configureRevenueCat();
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return;
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const isWelcomeRoute = pathname === "/welcome";
    if (!hasSeenWelcome && !isWelcomeRoute) {
      router.replace("/welcome");
      return;
    }
    if (hasSeenWelcome && isWelcomeRoute) {
      router.replace("/(tabs)");
    }
  }, [hydrated, hasSeenWelcome, pathname, router]);

  return (
    <AnimatedSplash>
      {!hydrated ? (
        <View style={{ flex: 1, backgroundColor: "#FF8A00" }} />
      ) : (
        <GameProvider>
          <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: "none" }} />
              <Stack.Screen name="welcome" options={{ headerShown: false, animation: "none" }} />
              <Stack.Screen name="game" options={{ headerShown: false }} />
              <Stack.Screen
                name="settings"
                options={formSheetFitToContentsOptions({ headerShown: false })}
              />
              <Stack.Screen
                name="feedback"
                options={formSheetFitToContentsOptions({ headerShown: false })}
              />
              <Stack.Screen name="paywall" options={{ presentation: "fullScreenModal", headerShown: false }} />
            </Stack>
            <StatusBar style="auto" hidden={Platform.OS === "android"} />
          </ThemeProvider>
        </GameProvider>
      )}
    </AnimatedSplash>
  );
}

export default function RootLayout() {
  const AppTree = (
    <AppSettingsProvider>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </AppSettingsProvider>
  );

  if (Platform.OS === "web") return AppTree;

  if (!env.posthog.apiKey) return AppTree;

  return (
    <PostHogProvider
      apiKey={env.posthog.apiKey}
      debug={__DEV__}
      options={{
        host: env.posthog.host,
        captureAppLifecycleEvents: true,
        flushAt: __DEV__ ? 1 : 20,
      }}
    >
      <PostHogRouterTracker />
      {AppTree}
    </PostHogProvider>
  );
}
