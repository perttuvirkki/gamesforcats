import { PIANO_BLACK_KEYS_C4, PIANO_WHITE_KEYS_C4, type PianoNote, type PianoNoteId } from "@/assets/notes";
import emojiSvgs from "@/assets/emojiSvgs";
import { useAppSettings } from "@/components/AppSettingsContext";
import { useGameSettings } from "@/components/GameContext";
import { JumpingCritter } from "@/components/JumpingCritter";
import { getEmojiFacingOffsetRad } from "@/components/emojiFacing";
import { lightHaptic } from "@/lib/haptics";
import { Ionicons } from "@expo/vector-icons";
import type { AudioPlayer } from "expo-audio";
import { createAudioPlayer } from "expo-audio";
import { useRouter } from "expo-router";
import { GlassView } from "expo-glass-effect";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Dimensions, Image, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SvgProps } from "react-native-svg";
import { getPatternById } from "@/constants/background-patterns";
import { ensureGameAudioAsync } from "@/lib/audio";

type PianoRunnerProps = {
  backgroundColor?: string;
  assets?: React.FC<SvgProps>[];
};

function buildPlayers(notes: PianoNote[]) {
  const players = new Map<PianoNoteId, AudioPlayer>();
  for (const note of notes) {
    const player = createAudioPlayer(note.source, { updateInterval: 250, keepAudioSessionActive: false });
    players.set(note.id, player);
  }
  return players;
}

type Layout = { width: number; height: number };

type BlackKeyLayout = {
  id: PianoNoteId;
  // Boundary index from the top between white keys (1..6). For example, 1 means between whiteKeys[0] and whiteKeys[1].
  boundaryIndex: number;
};

const KEYBOARD_PADDING = 0;
const WHITE_KEY_GAP = 5;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const BLACK_KEYS_LAYOUT: BlackKeyLayout[] = [
  { id: "Bb4", boundaryIndex: 1 }, // between B and A
  { id: "Ab4", boundaryIndex: 2 }, // between A and G
  { id: "Gb4", boundaryIndex: 3 }, // between G and F
  // no black key between F and E
  { id: "Eb4", boundaryIndex: 5 }, // between E and D
  { id: "Db4", boundaryIndex: 6 }, // between D and C
];

type Jump = {
  id: string;
  Asset: React.FC<SvgProps>;
  facingOffsetRad: number;
  baseRotateRad: number;
  x: number;
  startX: number;
  y: number;
  peakY: number;
  lingerMs: number;
  durationMs: number;
};

const getEmojiComponent = (code: string): React.FC<SvgProps> | null => {
  const key = `${code}.svg` as keyof typeof emojiSvgs;
  return emojiSvgs[key] || null;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function TextureBackground({ textureId }: { textureId: string }) {
  const texture = getPatternById(textureId);
  if (!texture || textureId === "none" || texture.type !== "image" || !texture.imageSource) return null;

  const tileSize = 800;
  const cols = Math.ceil(SCREEN_WIDTH / tileSize) + 1;
  const rows = Math.ceil(SCREEN_HEIGHT / tileSize) + 1;

  return (
    <View style={styles.textureBackground} pointerEvents="none">
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={styles.patternRow}>
          {Array.from({ length: cols }, (_, col) => (
            <Image key={col} source={texture.imageSource} style={{ width: tileSize, height: tileSize }} resizeMode="cover" />
          ))}
        </View>
      ))}
    </View>
  );
}

function SvgPatternOverlay({ patternId }: { patternId: string }) {
  const pattern = getPatternById(patternId);
  if (!pattern || patternId === "none" || pattern.type !== "svg" || !pattern.component) return null;

  const PatternComponent = pattern.component;
  const scale = 2;
  const tileWidth = pattern.width * scale;
  const tileHeight = pattern.height * scale;
  const cols = Math.ceil(SCREEN_WIDTH / tileWidth) + 1;
  const rows = Math.ceil(SCREEN_HEIGHT / tileHeight) + 1;

  return (
    <View style={styles.patternOverlay} pointerEvents="none">
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={styles.patternRow}>
          {Array.from({ length: cols }, (_, col) => (
            <View key={col} style={{ width: tileWidth, height: tileHeight }}>
              <PatternComponent width={tileWidth} height={tileHeight} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export default function PianoRunner({ backgroundColor = "rgba(255,255,255,0.85)", assets }: PianoRunnerProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { soundsEnabled } = useAppSettings();
  const { speed, size, backgroundColor: selectedBackgroundColor, customEmoji, backgroundMode, backgroundPattern, backgroundTexture } =
    useGameSettings();

  const playersRef = React.useRef<Map<PianoNoteId, AudioPlayer> | null>(null);
  const [pressedId, setPressedId] = React.useState<PianoNoteId | null>(null);
  const [layout, setLayout] = React.useState<Layout>({ width: 0, height: 0 });
  const [jumps, setJumps] = React.useState<Jump[]>([]);

  const padTop = Math.max(14, insets.top + 10);
  const padBottom = Math.max(16, insets.bottom + 10);
  const effectiveBackgroundColor = selectedBackgroundColor || backgroundColor;

  React.useEffect(() => {
    ensureGameAudioAsync().catch(() => {});
  }, []);

  React.useEffect(() => {
    playersRef.current = buildPlayers([...PIANO_WHITE_KEYS_C4, ...PIANO_BLACK_KEYS_C4]);
    return () => {
      const players = playersRef.current;
      playersRef.current = null;
      if (!players) return;
      for (const p of players.values()) {
        try {
          p.remove();
        } catch {}
      }
    };
  }, []);

  const playNote = React.useCallback(
    async (noteId: PianoNoteId) => {
      if (!soundsEnabled) return;
      const players = playersRef.current;
      const player = players?.get(noteId);
      if (!player) return;

      try {
        await player.seekTo(0);
      } catch {}
      try {
        player.play();
      } catch {}
    },
    [soundsEnabled],
  );

  const geometry = React.useMemo(() => {
    if (!layout.width || !layout.height) return null;
    const contentHeight = Math.max(1, layout.height - padTop - padBottom);
    const totalGap = WHITE_KEY_GAP * (PIANO_WHITE_KEYS_C4.length - 1);
    const whiteKeyHeight = Math.max(1, (contentHeight - totalGap) / PIANO_WHITE_KEYS_C4.length);
    const blackKeyHeight = Math.max(24, whiteKeyHeight * 0.62);
    const availableWidth = Math.max(1, layout.width - KEYBOARD_PADDING * 2);
    const blackKeyWidth = Math.max(140, availableWidth * 0.5);
    const blackKeyLeft = 0;
    const maxX = Math.max(0, layout.width - size);
    const minX = clamp(blackKeyWidth + 10, 0, maxX);
    return { whiteKeyHeight, blackKeyHeight, blackKeyWidth, blackKeyLeft, maxX, minX };
  }, [layout.height, layout.width, padBottom, padTop, size]);

  const availableCritterAssets = React.useMemo(() => {
    const CustomEmojiComponent = customEmoji ? getEmojiComponent(customEmoji) : null;
    if (CustomEmojiComponent) return [CustomEmojiComponent];
    if (assets && assets.length > 0) return assets;
    const fallback = getEmojiComponent("1f400"); // rat
    return fallback ? [fallback] : [];
  }, [assets, customEmoji]);

  const spawnJump = React.useCallback(() => {
    if (!geometry) return;
    if (!availableCritterAssets.length) return;

    const chosen = availableCritterAssets[Math.floor(Math.random() * availableCritterAssets.length)];
    const keyIndex = Math.floor(Math.random() * PIANO_WHITE_KEYS_C4.length);
    const keyTop = padTop + keyIndex * geometry.whiteKeyHeight + keyIndex * WHITE_KEY_GAP;
    const y = clamp(keyTop + (geometry.whiteKeyHeight - size) / 2, padTop, layout.height - padBottom - size);

    // Horizontal move: come from off-screen right, land on the right side of the selected white key.
    const x = clamp(geometry.minX + Math.random() * (geometry.maxX - geometry.minX), geometry.minX, geometry.maxX);
    const startX = layout.width + size * (1.2 + Math.random() * 3.0);
    const durationMs = Math.round(Math.max(650, speed * (0.8 + Math.random() * 0.25)));
    const lingerMs = Math.round(Math.max(280, Math.min(1200, speed * (0.22 + Math.random() * 0.28))));
    const baseRotateRad = ([0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2] as const)[Math.floor(Math.random() * 4)];

    setJumps((prev) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const next: Jump = {
        id,
        Asset: chosen,
        facingOffsetRad: getEmojiFacingOffsetRad(chosen),
        baseRotateRad,
        x,
        startX,
        y,
        peakY: y,
        lingerMs,
        durationMs,
      };
      return prev.length ? [next] : [next];
    });
  }, [availableCritterAssets, geometry, layout.height, padBottom, padTop, size, speed]);

  React.useEffect(() => {
    if (!geometry) return;
    if (jumps.length > 0) return;
    const delay = 450 + Math.round(Math.random() * 850);
    const handle = setTimeout(() => spawnJump(), delay);
    return () => clearTimeout(handle);
  }, [geometry, jumps.length, spawnJump]);

  const handleDone = React.useCallback((id: string) => {
    setJumps((prev) => prev.filter((j) => j.id !== id));
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: effectiveBackgroundColor }]}>
      <StatusBar hidden />

      {backgroundMode === "texture" ? <TextureBackground textureId={backgroundTexture} /> : <SvgPatternOverlay patternId={backgroundPattern} />}

      <View
        style={[
          styles.keyboardWrap,
          {
            paddingTop: padTop,
            paddingBottom: padBottom,
          },
        ]}
        onLayout={({ nativeEvent }) => {
          const { width, height } = nativeEvent.layout;
          if (width !== layout.width || height !== layout.height) setLayout({ width, height });
        }}
      >
        {PIANO_WHITE_KEYS_C4.map((note, index) => {
          const isPressed = pressedId === note.id;
          return (
	            <Pressable
	              key={note.id}
	              onPressIn={() => {
	                lightHaptic();
	                setPressedId(note.id);
	                playNote(note.id).catch(() => {});
	              }}
	              onPressOut={() => setPressedId((prev) => (prev === note.id ? null : prev))}
	              style={({ pressed }) => [styles.whiteKeyOuter, { flex: 1, opacity: pressed ? 0.96 : 1 }]}
	            >
              <View style={[styles.whiteKey, index === 0 ? styles.whiteKeyFirst : null, isPressed ? styles.whiteKeyPressed : null]} />
            </Pressable>
          );
        })}

        {/* Black keys overlay */}
        {geometry
          ? BLACK_KEYS_LAYOUT.map((k) => {
              const note = PIANO_BLACK_KEYS_C4.find((n) => n.id === k.id);
              if (!note) return null;
              const boundaryY =
                k.boundaryIndex * geometry.whiteKeyHeight + (k.boundaryIndex - 1) * WHITE_KEY_GAP + WHITE_KEY_GAP / 2;
              const top = Math.max(padTop - geometry.blackKeyHeight / 2, padTop + boundaryY - geometry.blackKeyHeight / 2);
              const isPressed = pressedId === note.id;
              return (
	                <Pressable
	                  key={note.id}
	                  onPressIn={() => {
	                    lightHaptic();
	                    if (!soundsEnabled) return;
	                    setPressedId(note.id);
	                    playNote(note.id).catch(() => {});
	                  }}
	                  onPressOut={() => setPressedId((prev) => (prev === note.id ? null : prev))}
	                  style={({ pressed }) => [
	                    styles.blackKey,
                    {
                      top,
                      left: geometry.blackKeyLeft,
                      width: geometry.blackKeyWidth,
                      height: geometry.blackKeyHeight,
                      opacity: pressed ? 0.92 : 1,
                    },
                    isPressed ? styles.blackKeyPressed : null,
                  ]}
                />
              );
            })
          : null}
      </View>

      {jumps.map((jump) => (
        <JumpingCritter
          key={jump.id}
          id={jump.id}
          Asset={jump.Asset}
          facingOffsetRad={jump.facingOffsetRad}
          baseRotateRad={jump.baseRotateRad}
          size={size}
          x={jump.x}
          startX={jump.startX}
          y={jump.y}
          horizontal
          peakY={jump.peakY}
          returnToStart
          lingerMs={jump.lingerMs}
          durationMs={jump.durationMs}
          onDone={handleDone}
        />
      ))}

	      <Pressable
	        style={({ pressed }) => [styles.settingsButton, { opacity: pressed ? 0.7 : 1 }]}
	        onPress={() => {
	          lightHaptic();
	          spawnJump();
	        }}
	        onLongPress={() => {
	          lightHaptic();
	          router.push("/game/settings");
	        }}
	        delayLongPress={300}
	      >
	        {Platform.OS === "ios" ? (
	          <GlassView glassEffectStyle="regular" tintColor="rgba(255,255,255,0.28)" isInteractive={false} style={styles.settingsGlass}>
	            <Ionicons name="settings-sharp" size={26} color="#000" style={styles.settingsIcon} />
          </GlassView>
        ) : (
          <View style={styles.settingsAndroidFallback}>
            <Ionicons name="settings-sharp" size={26} color="#000" style={styles.settingsIcon} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textureBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1,
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.16,
  },
  patternRow: {
    flexDirection: "row",
  },
  keyboardWrap: {
    flex: 1,
    paddingHorizontal: KEYBOARD_PADDING,
    gap: WHITE_KEY_GAP,
  },
  whiteKeyOuter: {
    width: "100%",
  },
  whiteKey: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
  },
  whiteKeyFirst: {
    // no-op; kept for compatibility
  },
  whiteKeyPressed: {
    backgroundColor: "#E5E7EB",
  },
  blackKey: {
    position: "absolute",
    backgroundColor: "#4B5563",
    borderRadius: 12,
    borderWidth: 5,
    borderColor: "rgba(255,255,255,0.85)",
    marginLeft: -10,
  },
  blackKeyPressed: {
    backgroundColor: "#374151",
  },
  settingsButton: {
    position: "absolute",
    bottom: 35,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  settingsGlass: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.10)",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  settingsAndroidFallback: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.10)",
  },
  settingsIcon: {
    opacity: 0.65,
  },
});
