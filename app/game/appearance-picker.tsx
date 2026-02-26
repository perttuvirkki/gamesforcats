import { FormSheetHeader } from "@/components/FormSheetHeader";
import { useGameSettings } from "@/components/GameContext";
import { useI18n } from "@/components/I18nContext";
import { SegmentedPicker } from "@/components/SegmentedPicker";
import { ThemedText } from "@/components/themed-text";
import { BACKGROUND_PATTERNS } from "@/constants/background-patterns";
import { lightHaptic } from "@/lib/haptics";
import { hasProAccess } from "@/lib/revenuecat";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import ColorPicker, { HueSlider, Panel1, Swatches } from "reanimated-color-picker";

const SVG_PATTERN_OPTIONS = BACKGROUND_PATTERNS.filter((p) => p.id === "none" || p.type === "svg");
const TEXTURE_OPTIONS = [
  { id: "none", nameKey: "pattern.none" as const },
  ...BACKGROUND_PATTERNS.filter((p) => p.type === "image").map((p) => ({ id: p.id, nameKey: p.nameKey })),
];
const COMMON_COLOR_SWATCHES = [
  "#FFFFFF",
  "#000000",
  "#FF3B30",
  "#FF9500",
  "#FFCC00",
  "#34C759",
  "#00C7BE",
  "#007AFF",
  "#5856D6",
  "#AF52DE",
];

export default function AppearancePickerScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [isPro, setIsPro] = React.useState(false);
  const locked = !isPro;
  const {
    backgroundMode,
    setBackgroundMode,
    backgroundPattern,
    setBackgroundPattern,
    backgroundTexture,
    setBackgroundTexture,
    backgroundColor,
    setBackgroundColor,
  } = useGameSettings();

  const [tab, setTab] = React.useState<"pattern" | "background">(
    backgroundMode === "texture" ? "background" : "pattern"
  );

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
    }, [])
  );

  const handleSelectPattern = (id: string) => {
    void lightHaptic();
    setBackgroundPattern(id);
    setBackgroundMode("pattern");
  };

  const handleSelectTexture = (id: string) => {
    void lightHaptic();
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

  const renderPatternItem = ({ item }: { item: (typeof SVG_PATTERN_OPTIONS)[0] }) => {
    const isSelected = backgroundPattern === item.id;
    const PatternPreview = item.component;
    return (
      <Pressable
        style={[styles.tileButton, isSelected && styles.tileButtonSelected]}
        onPress={locked ? openPaywall : () => handleSelectPattern(item.id)}
      >
        <View style={[styles.tilePreviewContainer, { backgroundColor }]}>
          {item.id === "none" ? (
            <Text style={styles.tileIcon}>✕</Text>
          ) : PatternPreview && item.type === "svg" ? (
            <View style={styles.patternSvgPreview}>
              <PatternPreview width={56} height={56} />
            </View>
          ) : null}
        </View>
        <Text style={[styles.tileLabel, isSelected && styles.tileLabelSelected]} numberOfLines={1}>
          {t(item.nameKey)}
        </Text>
      </Pressable>
    );
  };

  const renderTextureItem = ({ item }: { item: (typeof TEXTURE_OPTIONS)[0] }) => {
    const isSelected = backgroundTexture === item.id;
    const pattern = BACKGROUND_PATTERNS.find((p) => p.id === item.id);
    return (
      <Pressable
        style={[styles.tileButton, isSelected && styles.tileButtonSelected]}
        onPress={locked ? openPaywall : () => handleSelectTexture(item.id)}
      >
        <View style={styles.tilePreviewContainer}>
          {item.id === "none" ? (
            <Text style={styles.tileIcon}>✕</Text>
          ) : pattern?.type === "image" && pattern.imageSource ? (
            <Image source={pattern.imageSource} style={styles.tileImagePreview} resizeMode="cover" />
          ) : (
            <Text style={styles.tileIcon}>✕</Text>
          )}
        </View>
        <Text style={[styles.tileLabel, isSelected && styles.tileLabelSelected]} numberOfLines={1}>
          {t(item.nameKey)}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FormSheetHeader title={t("picker.appearance.title")} onClose={() => router.back()} />

      {/* Segmented Toggle */}
      <View style={styles.segmentRow}>
        <SegmentedPicker
          options={[t("gameSettings.segment.pattern"), t("gameSettings.segment.background")]}
          selectedIndex={tab === "pattern" ? 0 : 1}
          onOptionSelected={(index) => setTab(index === 0 ? "pattern" : "background")}
        />
      </View>

      {tab === "pattern" ? (
        <FlatList
          data={SVG_PATTERN_OPTIONS}
          renderItem={renderPatternItem}
          keyExtractor={(item) => item.id}
          numColumns={4}
          ListHeaderComponent={
            <View>
              {locked ? (
                <View style={styles.lockCard}>
                  <Text style={styles.lockText}>{t("gameSettings.lockedHint")}</Text>
                  <Pressable
                    style={({ pressed }) => [styles.lockButton, { opacity: pressed ? 0.85 : 1 }]}
                    onPress={openPaywall}
                  >
                    <Text style={styles.lockButtonText}>{t("settings.upgrade")}</Text>
                  </Pressable>
                </View>
              ) : null}
              <View pointerEvents={locked ? "none" : "auto"} style={locked ? styles.lockedControl : null}>
                <ColorPicker value={backgroundColor} onChangeJS={({ hex }) => handleColorSelect(hex)}>
                  <Panel1 style={styles.colorPanel} />
                  <HueSlider style={styles.hueSlider} />
                  <Swatches colors={COMMON_COLOR_SWATCHES} style={styles.swatches} />
                </ColorPicker>
              </View>
              <View style={styles.sectionHeader}>
                <ThemedText>{t("picker.pattern.section")}</ThemedText>
              </View>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={TEXTURE_OPTIONS}
          renderItem={renderTextureItem}
          keyExtractor={(item) => item.id}
          numColumns={4}
          ListHeaderComponent={
            locked ? (
              <View style={styles.lockCard}>
                <Text style={styles.lockText}>{t("gameSettings.lockedHint")}</Text>
                <Pressable
                  style={({ pressed }) => [styles.lockButton, { opacity: pressed ? 0.85 : 1 }]}
                  onPress={openPaywall}
                >
                  <Text style={styles.lockButtonText}>{t("settings.upgrade")}</Text>
                </Pressable>
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 24,
  },
  segmentRow: {
    marginBottom: 16,
  },
  lockCard: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  lockText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    opacity: 0.8,
    color: "#11181C",
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
  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 100,
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
  tileButton: {
    flex: 1,
    margin: 4,
    borderRadius: 12,
    backgroundColor: "rgba(150, 150, 150, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    maxWidth: "25%",
  },
  tileButtonSelected: {
    backgroundColor: "#FF8A00",
  },
  tilePreviewContainer: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  patternSvgPreview: {
    opacity: 0.5,
  },
  tileImagePreview: {
    width: "100%",
    height: "100%",
  },
  tileIcon: {
    fontSize: 22,
    color: "#666",
  },
  tileLabel: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: "500",
    color: "#666",
    textAlign: "center",
  },
  tileLabelSelected: {
    color: "#fff",
    fontWeight: "600",
  },
});
