import emojiSvgs from "@/assets/emojiSvgs";
import { SOUND_OPTIONS } from "@/assets/sounds/gameSounds";
import { FormSheetHeader } from "@/components/FormSheetHeader";
import { useI18n } from "@/components/I18nContext";
import { ThemedText } from "@/components/themed-text";
import { BACKGROUND_PATTERNS } from "@/constants/background-patterns";
import { getGameById } from "@/constants/games";
import { MOVEMENT_PATTERNS } from "@/constants/movements";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { lightHaptic } from "@/lib/haptics";
import { hasProAccess } from "@/lib/revenuecat";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SvgProps } from "react-native-svg";
import { useGameSettings } from "../../components/GameContext";


// Helper to get emoji component
const getEmojiComponent = (code: string): React.FC<SvgProps> | null => {
  const key = `${code}.svg` as keyof typeof emojiSvgs;
  return emojiSvgs[key] || null;
};

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const isDark = (useColorScheme() ?? "light") === "dark";
  const [isPro, setIsPro] = React.useState(false);
  const {
    activeGameId,
    speed,
    setSpeed,
    size,
    setSize,
    objectCount,
    setObjectCount,
    movementPattern,
    backgroundMode,
    backgroundColor,
    setBackgroundColor,
    backgroundPattern,
    setBackgroundPattern,
    backgroundTexture,
    setBackgroundTexture,
    setBackgroundMode,
    customEmoji,
    backgroundSound,
  } = useGameSettings();

  const activeGame = activeGameId ? getGameById(activeGameId) : undefined;
  const DefaultEmojiComponent = activeGame?.asset;

  const selectedPatternData = MOVEMENT_PATTERNS.find((p) => p.id === movementPattern);
  const CustomEmojiComponent = customEmoji ? getEmojiComponent(customEmoji) : null;
  const isTextureActive = backgroundMode === "texture";
  const [appearanceTab, setAppearanceTab] = React.useState<"pattern" | "background">(isTextureActive ? "background" : "pattern");
  const locked = !isPro;

  // Get the current pattern component for preview
  const currentPatternDef = BACKGROUND_PATTERNS.find((p) => p.id === backgroundPattern);
  const PatternPreviewComponent = currentPatternDef?.component;

  // Get the game's default background sound for display
  const gameDefaultSound = activeGame?.backgroundSound;
  const effectiveSound = backgroundSound ?? gameDefaultSound ?? 'none';
  const currentSoundOption = SOUND_OPTIONS.find((s) => s.id === effectiveSound);

  const openPaywall = React.useCallback(() => {
    void lightHaptic();
    router.push("/paywall");
  }, [router]);

  useFocusEffect(
    React.useCallback(() => {
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

  const handleSelectPattern = (id: string) => {
    setBackgroundPattern(id);
    setBackgroundMode("pattern");
  };

  const handleSelectTexture = (id: string) => {
    setBackgroundTexture(id);
    if (id === "none") {
      setBackgroundMode("pattern");
    } else {
      setBackgroundMode("texture");
    }
  };

  const handleColorSelect = (hexColor: string) => {
    setBackgroundColor(hexColor);
    setBackgroundMode("pattern");
  };

  const exitToMenu = () => {
    router.dismissAll();
    setTimeout(() => router.back(), 100);
  };

  return (
    <View style={styles.container}>
      {/* Header - first subview */}
      <FormSheetHeader
        title={t("gameSettings.title")}
        onClose={() => router.back()}
        leftAction={{ icon: "home-outline", onPress: exitToMenu }}
        style={styles.header}
      />

      {/* Content - second subview */}
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false}>
        {locked ? (
          <View style={[styles.lockCard, isDark ? styles.lockCardDark : null]}>
            <ThemedText style={[styles.lockText, isDark ? styles.lockTextDark : null]}>{t("gameSettings.lockedHint")}</ThemedText>
            <Pressable style={({ pressed }) => [styles.lockButton, { opacity: pressed ? 0.85 : 1 }]} onPress={openPaywall}>
              <Text style={styles.lockButtonText}>{t("settings.upgrade")}</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Emoji Button */}
        <View style={styles.controlGroup}>
          <Pressable
            style={styles.menuButton}
            onPress={() => {
              void lightHaptic();
              router.push("/game/emoji-picker");
            }}
          >
            <View style={styles.menuIconContainer}>
              {CustomEmojiComponent ? (
                <CustomEmojiComponent width={40} height={40} />
              ) : DefaultEmojiComponent ? (
                <DefaultEmojiComponent width={40} height={40} />
              ) : (
                <Text style={styles.menuIconText}>🎮</Text>
              )}
            </View>
            <View style={styles.menuInfo}>
              <ThemedText style={styles.menuLabel}>{t("gameSettings.emoji")}</ThemedText>
              <Text style={styles.menuHint}>
                {customEmoji ? t("gameSettings.customEmoji") : t("gameSettings.gameDefault")}
              </Text>
            </View>
            <ThemedText style={styles.chevron}>›</ThemedText>
          </Pressable>
        </View>

        {/* Movement Button */}
        <View style={styles.controlGroup}>
          <Pressable
            style={styles.menuButton}
            onPress={() => {
              void lightHaptic();
              router.push("/game/movement-picker");
            }}
          >
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIconText}>{selectedPatternData?.icon ?? "🎲"}</Text>
            </View>
            <View style={styles.menuInfo}>
              <ThemedText style={styles.menuLabel}>{t("gameSettings.movement")}</ThemedText>
              <Text style={styles.menuHint}>
                {selectedPatternData ? t(selectedPatternData.nameKey) : t("movement.random")}
              </Text>
            </View>
            <ThemedText style={styles.chevron}>›</ThemedText>
          </Pressable>
        </View>

        {/* Appearance Button */}
        <View style={styles.controlGroup}>
          <Pressable
            style={styles.menuButton}
            onPress={() => {
              void lightHaptic();
              router.push("/game/appearance-picker");
            }}
          >
            <View style={[styles.menuIconContainer, { backgroundColor }]}>
              {PatternPreviewComponent && backgroundPattern !== 'none' ? (
                <View style={{ opacity: 0.6 }}>
                  <PatternPreviewComponent width={32} height={32} />
                </View>
              ) : (
                <Text style={styles.menuIconText}>🎨</Text>
              )}
            </View>
            <View style={styles.menuInfo}>
              <ThemedText style={styles.menuLabel}>{t("gameSettings.appearance")}</ThemedText>
              <Text style={styles.menuHint}>
                {isTextureActive ? t("gameSettings.segment.background") : t("gameSettings.segment.pattern")}
              </Text>
            </View>
            <ThemedText style={styles.chevron}>›</ThemedText>
          </Pressable>
        </View>

        {/* Adjustments Button */}
        <View style={styles.controlGroup}>
          <Pressable
            style={styles.menuButton}
            onPress={() => {
              void lightHaptic();
              router.push("/game/adjustments-picker");
            }}
          >
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIconText}>⚙️</Text>
            </View>
            <View style={styles.menuInfo}>
              <ThemedText style={styles.menuLabel}>{t("picker.adjustments.title")}</ThemedText>
              <Text style={styles.menuHint}>
                {t("gameSettings.speed", { ms: Math.round(speed) })} · {t("gameSettings.size", { px: Math.round(size) })} · ×{objectCount}
              </Text>
            </View>
            <ThemedText style={styles.chevron}>›</ThemedText>
          </Pressable>
        </View>

        {/* Sound Button */}
        <View style={styles.controlGroup}>
          <Pressable
            style={styles.menuButton}
            onPress={() => {
              void lightHaptic();
              router.push("/game/sound-picker");
            }}
          >
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIconText}>{currentSoundOption?.emoji ?? '🔇'}</Text>
            </View>
            <View style={styles.menuInfo}>
              <ThemedText style={styles.menuLabel}>{t("gameSettings.backgroundSound")}</ThemedText>
              <Text style={styles.menuHint}>
                {t(currentSoundOption?.nameKey ?? 'gameSettings.sound.none')}
              </Text>
            </View>
            <ThemedText style={styles.chevron}>›</ThemedText>
          </Pressable>
        </View>

        <View style={{ marginBottom: insets.bottom + 100 }}>
          <Pressable
            style={({ pressed }) => [styles.exitButton, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => {
              void lightHaptic();
              exitToMenu();
            }}
          >
            <Text style={styles.buttonText}>{t("gameSettings.exitToMenu")}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 16,
    marginTop: 8,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  lockCard: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  lockCardDark: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255,255,255,0.14)",
  },
  lockText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    opacity: 0.8,
  },
  lockTextDark: {
    color: "rgba(255,255,255,0.82)",
    opacity: 1,
  },
  lockButton: {
    backgroundColor: "#FF8A00",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  lockButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
  },
  lockedControl: {
    opacity: 0.6,
  },
  dualControlRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  dualControlColumn: {
    flex: 1,
    minWidth: 160,
  },
  controlGroup: {
    marginBottom: 12,
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(150, 150, 150, 0.15)",
    padding: 14,
    borderRadius: 16,
    gap: 14,
  },
  menuIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuIconText: {
    fontSize: 28,
  },
  menuInfo: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  menuHint: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  appearanceSegmentRow: {
    marginTop: 10,
  },
  appearanceContent: {
    marginTop: 12,
  },
  colorPanel: {
    height: 170,
    borderRadius: 14,
    overflow: "hidden",
  },
  hueSlider: {
    marginTop: 12,
    height: 18,
    borderRadius: 999,
  },
  swatches: {
    marginTop: 12,
  },
  textureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  tileButton: {
    width: "31%",
    borderRadius: 12,
    backgroundColor: "rgba(150, 150, 150, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
  },
  tileButtonSelected: {
    backgroundColor: "#FF8A00",
  },
  tilePreviewContainer: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  patternSvgPreview: {
    opacity: 0.35,
  },
  tileImagePreview: {
    width: "100%",
    height: "100%",
  },
  tileIcon: {
    fontSize: 28,
    color: "#666",
  },
  tileLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
    textAlign: "center",
  },
  tileLabelSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  slider: {
    width: "100%",
    height: 40,
    marginTop: 4,
  },
  patternScrollView: {
    marginTop: 8,
  },
  patternContainer: {
    paddingVertical: 4,
  },
  patternRow: {
    flexDirection: "row",
    gap: 8,
  },
  patternButton: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(150, 150, 150, 0.2)",
    minWidth: 70,
    marginRight: 8,
  },
  patternButtonSelected: {
    backgroundColor: "#FF8A00",
  },
  patternIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  appearanceRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  appearanceCard: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 0,
    minWidth: 140,
  },
  appearanceBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 5,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "700",
    color: "#FF8A00",
  },
  appearanceCardActive: {},
  appearancePreview: {
    alignSelf: "center",
    width: "100%",
    aspectRatio: 1,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
  },
  appearancePreviewInactive: {
    transform: [{ scale: 0.92 }],
  },
  appearancePreviewActive: {
    borderColor: "#FF8A00",
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  previewRow: {
    flexDirection: "row",
  },
  texturePreviewFill: {
    width: "100%",
    height: "100%",
  },
  textureNonePreview: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  textureNoneIcon: {
    fontSize: 28,
    color: "#666",
  },
  appearanceCaption: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#222",
  },
  appearanceValue: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  patternLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exitButton: {
    backgroundColor: "#ff4444",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  emojiPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(150, 150, 150, 0.2)",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    gap: 12,
    minHeight: 80,
  },
  currentEmojiContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  defaultEmojiText: {
    fontSize: 32,
  },
  emojiPickerInfo: {
    flex: 1,
  },
  emojiPickerLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  emojiPickerHint: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: "#888",
    opacity: 0.5,
  },
});
