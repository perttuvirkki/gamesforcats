import { SOUND_OPTIONS } from "@/assets/sounds/gameSounds";
import { FormSheetHeader } from "@/components/FormSheetHeader";
import { useGameSettings } from "@/components/GameContext";
import { useI18n } from "@/components/I18nContext";
import { getGameById } from "@/constants/games";
import { lightHaptic } from "@/lib/haptics";
import { hasProAccess } from "@/lib/revenuecat";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

export default function SoundPickerScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [isPro, setIsPro] = React.useState(false);
  const locked = !isPro;
  const { backgroundSound, setBackgroundSound, activeGameId } = useGameSettings();

  // Get the active game's default background sound
  const activeGame = activeGameId ? getGameById(activeGameId) : undefined;
  const gameDefaultSound = activeGame?.backgroundSound;

  // Determine what to show as selected:
  // - If user has explicitly selected a sound, use that
  // - Otherwise, use the game's default sound (or 'none' if no default)
  const effectiveSelectedSound = backgroundSound ?? gameDefaultSound ?? "none";

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

  const handleSelect = (id: string | null) => {
    void lightHaptic();
    setBackgroundSound(id);
    router.back();
  };

  const renderItem = ({ item }: { item: (typeof SOUND_OPTIONS)[0] }) => {
    const isSelected = effectiveSelectedSound === item.id;
    return (
      <Pressable
        style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
        onPress={locked ? openPaywall : () => handleSelect(item.id === "none" ? null : item.id)}
      >
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>{item.emoji}</Text>
        </View>
        <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
          {t(item.nameKey)}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FormSheetHeader title={t("picker.sound.title")} onClose={() => router.back()} />

      <FlatList
        data={SOUND_OPTIONS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 24,
  },
  lockCard: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    marginBottom: 16,
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
  listContent: {
    paddingBottom: 100,
  },
  optionButton: {
    flex: 1,
    margin: 6,
    borderRadius: 14,
    backgroundColor: "rgba(150, 150, 150, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    maxWidth: "33%",
  },
  optionButtonSelected: {
    backgroundColor: "#FF8A00",
  },
  emojiContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: {
    fontSize: 28,
  },
  optionLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
  },
  optionLabelSelected: {
    color: "#fff",
    fontWeight: "600",
  },
});
