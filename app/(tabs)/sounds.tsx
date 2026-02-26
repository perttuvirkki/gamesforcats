import { SOUNDS } from "@/assets/sounds";
import { useAppSettings } from "@/components/AppSettingsContext";
import { useI18n } from "@/components/I18nContext";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { lightHaptic } from "@/lib/haptics";
import type { TranslationKey } from "@/lib/i18n";
import { createAudioPlayer } from "expo-audio";
import React from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ensureGameAudioAsync } from "@/lib/audio";

const MenuBackgroundBox = require("@/assets/backgrounds/background_box.jpg");
const BigTape = require("@/assets/bigtape.png");
const SmallTapes = [require("@/assets/smalltape1.png"), require("@/assets/smalltape2.png"), require("@/assets/smalltape3.png")] as const;

const MENU_BG_ASPECT_RATIO = (() => {
  const resolved = Image.resolveAssetSource(MenuBackgroundBox as number);
  const width = resolved?.width ?? 0;
  const height = resolved?.height ?? 0;
  return width > 0 && height > 0 ? width / height : 0.75;
})();

const CARD_COLORS_LIGHT = ["#E3F2FD", "#FCE4EC", "#E8F5E9", "#FFF8DC", "#EDE7F6", "#FFE0B2"] as const;
const CARD_COLORS_DARK = ["#263238", "#311B92", "#1B5E20", "#4E342E", "#0D47A1", "#37474F"] as const;

const SOUND_NAME_KEY_BY_ID: Record<string, TranslationKey> = {
  "mixkit-angry-cartoon-kitty-meow-94": "sound.angryKittyMeow",
  "mixkit-angry-wild-cat-roar-89": "sound.angryCatRoar",
  "mixkit-big-wild-cat-long-purr-96": "sound.longPurr",
  "mixkit-big-wild-cat-scary-roar-88": "sound.scaryRoar",
  "mixkit-big-wild-cat-slow-moan-90": "sound.slowMoan",
  "mixkit-big-wild-lion-growl-95": "sound.lionGrowl",
  "mixkit-cartoon-kitty-begging-meow-92": "sound.beggingMeow",
  "mixkit-cartoon-little-cat-meow-91": "sound.littleMeow",
  "mixkit-domestic-cat-hungry-meow-45": "sound.hungryMeow",
  "mixkit-little-cat-attention-meow-86": "sound.attentionMeow",
  "mixkit-little-cat-pain-meow-87": "sound.painMeow",
  "mixkit-sweet-kitty-meow-93": "sound.sweetMeow",
  "mixkit-wild-lion-animal-roar-6": "sound.lionRoar",
};

function hashString(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) h = (h * 31 + input.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickSmallTape(id: string) {
  return SmallTapes[hashString(id) % SmallTapes.length];
}

function MenuBackground({ width, height, variant }: { width: number; height: number; variant: "light" | "dark" }) {
  const backdropColor = variant === "dark" ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.menuBackgroundImageWrap}>
        <Image source={MenuBackgroundBox} style={[styles.menuBackgroundImage, { aspectRatio: MENU_BG_ASPECT_RATIO }]} resizeMode="cover" />
      </View>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: backdropColor }]} />
    </View>
  );
}

export default function SoundsScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 768;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t, language } = useI18n();
  const numColumns = isTablet ? Math.max(2, Math.min(5, Math.floor(width / 130))) : 2;
  const columnGap = 12;
  const rowGap = 20;
  const horizontalPadding = 32;
  const { soundsEnabled } = useAppSettings();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [playingId, setPlayingId] = React.useState<string | null>(null);
  const playerRef = React.useRef<any>(null);
  const statusSubRef = React.useRef<{ remove: () => void } | null>(null);

  React.useEffect(() => {
    ensureGameAudioAsync().catch(() => {});
  }, []);

  React.useEffect(() => {
    return () => {
      try {
        statusSubRef.current?.remove?.();
      } catch {}
      try {
        playerRef.current?.remove?.();
      } catch {}
    };
  }, []);

  const playSound = React.useCallback(
    async (id: string, source: number) => {
      if (!soundsEnabled) return;
      setPlayingId(id);
      try {
        await ensureGameAudioAsync().catch(() => {});
        try {
          statusSubRef.current?.remove?.();
        } catch {}
        try {
          playerRef.current?.remove?.();
        } catch {}

        const player = createAudioPlayer(source, { updateInterval: 250 });
        playerRef.current = player;
        statusSubRef.current = player.addListener?.("playbackStatusUpdate", (status: any) => {
          if (!status?.isLoaded) return;
          if (status.didJustFinish) {
            setPlayingId((prev) => (prev === id ? null : prev));
            try {
              statusSubRef.current?.remove?.();
              statusSubRef.current = null;
            } catch {}
            try {
              playerRef.current?.remove?.();
            } catch {}
            playerRef.current = null;
          }
        });
        player.play?.();
      } catch {
        setPlayingId((prev) => (prev === id ? null : prev));
      }
    },
    [soundsEnabled],
  );

  const ListHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleWrap}>
        <View pointerEvents="none" style={[styles.tapeBigWrap, isTablet ? styles.tapeBigWrapTablet : null]}>
          <Image source={BigTape} style={styles.tapeBigImage} resizeMode="contain" />
        </View>
        <View style={styles.titleBox}>
          <ThemedText
            type="title"
            lightColor="#1F1A12"
            darkColor="#1F1A12"
            style={[styles.titleText, isTablet ? styles.titleTablet : styles.titlePhone]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {t("sounds.title")}
          </ThemedText>
          <ThemedText
            lightColor="rgba(31,26,18,0.72)"
            darkColor="rgba(31,26,18,0.72)"
            style={[styles.titleSubtitle, isTablet ? styles.titleSubtitleTablet : null]}
          >
            {soundsEnabled ? t("sounds.subtitle.on") : t("sounds.subtitle.off")}
          </ThemedText>
        </View>
      </View>
    </View>
  );

  const ListFooter = !soundsEnabled ? (
    <View style={[styles.footerNote, { paddingBottom: insets.bottom + 10 }]}>
      <ThemedText style={styles.footerText}>{t("sounds.footer.off")}</ThemedText>
    </View>
  ) : null;

  return (
    <ThemedView style={styles.container} lightColor="transparent" darkColor="transparent">
      <MenuBackground width={width} height={height} variant={isDark ? "dark" : "light"} />

      <FlatList
        data={SOUNDS}
        extraData={language}
        key={numColumns}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        contentContainerStyle={[styles.list, { paddingHorizontal: horizontalPadding, paddingBottom: Math.max(120, insets.bottom + 24) }]}
        columnWrapperStyle={numColumns > 1 ? { gap: columnGap } : undefined}
        ItemSeparatorComponent={() => <View style={{ height: rowGap }} />}
        renderItem={({ item }) => {
          const selected = selectedId === item.id;
          const playing = playingId === item.id;
          const nameKey = SOUND_NAME_KEY_BY_ID[item.id];
          const label = nameKey ? t(nameKey) : item.name;
          const palette = isDark ? CARD_COLORS_DARK : CARD_COLORS_LIGHT;
          const cardColor = palette[hashString(item.id) % palette.length];
          const tape = pickSmallTape(item.id);
          const tiltDegRaw = ((hashString(item.id) % 7) - 3) * (isTablet ? 0.16 : 0.22);
          const tiltDeg = Math.max(-1.0, Math.min(1.0, tiltDegRaw));
          return (
            <Pressable
              disabled={!soundsEnabled}
              onPress={() => {
                void lightHaptic();
                setSelectedId(item.id);
                playSound(item.id, item.source);
              }}
              style={({ pressed }) => [
                styles.tile,
                isDark ? styles.tileDark : null,
                { flex: 1, opacity: pressed ? 0.9 : 1, transform: [{ rotate: `${tiltDeg}deg` }, { scale: pressed ? 0.99 : 1 }] },
                selected ? styles.tileSelected : null,
                !soundsEnabled ? styles.tileDisabled : null,
              ]}
            >
              <View pointerEvents="none" style={[styles.tapeSmallWrap, isTablet ? styles.tapeSmallWrapTablet : null]}>
                <Image source={tape} style={styles.tapeSmallImage} resizeMode="contain" />
              </View>
              <View style={[styles.tileInner, isTablet ? styles.tileInnerTablet : null, { backgroundColor: cardColor }]}>
                <View style={[styles.emojiWrap, isTablet ? styles.emojiWrapTablet : null]} pointerEvents="none">
                  <Text style={[styles.emoji, isTablet ? styles.emojiTablet : null]}>{item.emoji}</Text>
                </View>
                <View style={styles.cardBottomRow}>
                  <View
                    style={[
                      styles.cardNamePill,
                      isDark ? styles.cardNamePillDark : null,
                      selected ? (isDark ? styles.cardNamePillSelectedDark : styles.cardNamePillSelected) : null,
                    ]}
                  >
                    <ThemedText style={styles.tileName} numberOfLines={3}>
                      {label}
                    </ThemedText>
                  </View>
                </View>
                {playing ? (
                  <View pointerEvents="none" style={[styles.playingBadge, isDark ? styles.playingBadgeDark : null]}>
                    <Text style={styles.playingBadgeText}>{t("sounds.playing")}</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  menuBackgroundImageWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  menuBackgroundImage: {
    height: "100%",
  },
  header: {
    paddingTop: 60,
    alignItems: "center",
  },
  titleWrap: {
    position: "relative",
    alignSelf: "center",
    maxWidth: "100%",
    paddingTop: 24,
    marginBottom: 58,
    alignItems: "center",
  },
  titleBox: {
    minWidth: "50%",
    borderRadius: 14,
    paddingHorizontal: 50,
    paddingTop: 50,
    paddingBottom: 30,
    backgroundColor: "#FFF8E8",
    borderWidth: 1,
    borderColor: "rgba(31,26,18,0.16)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
    alignItems: "center",
    transform: [{ rotate: "-1.2deg" }],
  },
  titleText: {
    textAlign: "center",
  },
  titlePhone: {
    fontSize: 40,
    lineHeight: 40,
  },
  titleSubtitle: {
    opacity: 0.7,
    textAlign: "center",
  },
  titleTablet: {
    fontSize: 44,
    lineHeight: 44,
  },
  titleSubtitleTablet: {
    fontSize: 18,
    lineHeight: 26,
  },
  tapeBigWrap: {
    position: "absolute",
    top: -8,
    alignSelf: "center",
    width: 210,
    height: 48,
    zIndex: 10,
    transform: [{ rotate: "0.8deg" }],
  },
  tapeBigWrapTablet: {
    top: -10,
    width: 260,
    height: 58,
    transform: [{ rotate: "0.8deg" }],
  },
  tapeBigImage: {
    width: "100%",
    height: "100%",
  },
  list: {
    paddingTop: 18,
  },
  tile: {
    position: "relative",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.10)",
    overflow: "visible",
  },
  tileDark: {
    borderColor: "rgba(255,255,255,0.16)",
    shadowOpacity: 0.2,
  },
  tileInner: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    padding: 10,
    justifyContent: "flex-end",
    minHeight: 92,
  },
  tileInnerTablet: {
    minHeight: 112,
    padding: 12,
  },
  tileDisabled: {
    opacity: 0.45,
  },
  tileSelected: {
    shadowOpacity: 0.14,
    elevation: 3,
  },
  tapeSmallWrap: {
    position: "absolute",
    top: -14,
    alignSelf: "center",
    width: 78,
    height: 26,
    zIndex: 10,
  },
  tapeSmallWrapTablet: {
    top: -16,
    width: 92,
    height: 30,
  },
  tapeSmallImage: {
    width: "100%",
    height: "100%",
  },
  emojiWrap: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
  },
  emojiWrapTablet: {
    top: 12,
    right: 12,
    width: 52,
    height: 52,
  },
  emoji: {
    fontSize: 34,
  },
  emojiTablet: {
    fontSize: 42,
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  cardNamePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.10)",
    backgroundColor: "rgba(255,255,255,0.65)",
    maxWidth: "100%",
  },
  cardNamePillDark: {
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  cardNamePillSelectedDark: {
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(10,126,164,0.28)",
  },
  cardNamePillSelected: {
    borderColor: "rgba(0,0,0,0.10)",
    backgroundColor: "rgba(10,126,164,0.18)",
  },
  tileName: {
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 14,
  },
  playingBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  playingBadgeDark: {
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  playingBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  footerNote: {
    paddingTop: 10,
  },
  footerText: {
    opacity: 0.55,
    textAlign: "center",
  },
});
