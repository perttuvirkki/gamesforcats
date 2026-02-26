import emojiSvgs from '@/assets/emojiSvgs';
import { GAME_SOUNDS, type GameSoundId } from '@/assets/sounds/gameSounds';
import { useAppSettings } from '@/components/AppSettingsContext';
import { getPatternById } from '@/constants/background-patterns';
import { Ionicons } from '@expo/vector-icons';
import { createAudioPlayer } from 'expo-audio';
import { useRouter } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '@/components/I18nContext';
import { lightHaptic } from '@/lib/haptics';
import { ensureGameAudioAsync } from '@/lib/audio';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { SvgProps } from 'react-native-svg';
import { AnimatedMeshGradient } from './AnimatedMeshGradient';
import { getEmojiFacingOffsetRad } from './emojiFacing';
import { EscapeCritter } from './EscapeCritter';
import { useGameSettings } from './GameContext';

const box1 = require('../assets/box1.png');
const box2 = require('../assets/box2.png');
const box3 = require('../assets/box3.png');

const BOX_IMAGES = [box1, box2, box3];
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOX_CLICK_SQUEAKS: GameSoundId[] = ['mouse', 'squeak2', 'squeak3', 'squeak4'];
const pickBoxClickSound = (): GameSoundId => (Math.random() < 0.22 ? 'bell' : (BOX_CLICK_SQUEAKS[Math.floor(Math.random() * BOX_CLICK_SQUEAKS.length)] ?? 'mouse'));

interface BoxDashRunnerProps {
  Asset: React.FC<SvgProps>;
  assets?: React.FC<SvgProps>[];
  backgroundColor?: string;
}

type Critter = {
  id: string;
  Asset: React.FC<SvgProps>;
  facingOffsetRad: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  durationMs: number;
};

// Helper to get emoji component from code
const getEmojiComponent = (code: string): React.FC<SvgProps> | null => {
  const key = `${code}.svg` as keyof typeof emojiSvgs;
  return emojiSvgs[key] || null;
};

function TextureBackground({ textureId }: { textureId: string }) {
  const texture = getPatternById(textureId);
  if (!texture || textureId === 'none' || texture.type !== 'image' || !texture.imageSource) return null;

  const tileSize = 800;
  const cols = Math.ceil(SCREEN_WIDTH / tileSize) + 1;
  const rows = Math.ceil(SCREEN_HEIGHT / tileSize) + 1;

  return (
    <View style={styles.textureBackground} pointerEvents="none">
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={styles.patternRow}>
          {Array.from({ length: cols }, (_, col) => (
            <Image
              key={col}
              source={texture.imageSource}
              style={{ width: tileSize, height: tileSize }}
              resizeMode="cover"
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function SvgPatternOverlay({ patternId }: { patternId: string }) {
  const pattern = getPatternById(patternId);
  if (!pattern || patternId === 'none' || pattern.type !== 'svg' || !pattern.component) return null;

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

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export default function BoxDashRunner({ Asset, assets, backgroundColor = '#fff' }: BoxDashRunnerProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { soundsEnabled } = useAppSettings();
  const {
    speed,
    size,
    backgroundMode,
    backgroundColor: selectedBackgroundColor,
    backgroundPattern,
    backgroundTexture,
    customEmoji,
  } = useGameSettings();

  const hintOpacity = useSharedValue(0);
  const hintTranslateX = useSharedValue(50);

  const [boxImageIndex, setBoxImageIndex] = useState(0);
  const [critters, setCritters] = useState<Critter[]>([]);

  const effectiveBackgroundColor = selectedBackgroundColor || backgroundColor;
  const CustomEmojiComponent = customEmoji ? getEmojiComponent(customEmoji) : null;

  const availableCritterAssets = useMemo(() => {
    if (CustomEmojiComponent) return [CustomEmojiComponent];
    if (assets && assets.length > 0) return assets;
    return [Asset];
  }, [Asset, assets, CustomEmojiComponent]);

  const dashVertical = SCREEN_HEIGHT >= SCREEN_WIDTH;
  const boxSize = Math.min(220, Math.max(110, SCREEN_WIDTH * 0.34));
  const boxInset = 18;
  const boxX = dashVertical ? (SCREEN_WIDTH - boxSize) / 2 : boxInset;
  const boxY = dashVertical ? SCREEN_HEIGHT - boxSize - boxInset : (SCREEN_HEIGHT - boxSize) / 2;

  const playBoxClickSound = useCallback(async () => {
    if (!soundsEnabled) return;
    try {
      await ensureGameAudioAsync().catch(() => {});
      const id = pickBoxClickSound();
      const player = createAudioPlayer(GAME_SOUNDS[id]);
      player.volume = 0.9;
      player.play?.();
      setTimeout(() => {
        try {
          player.remove?.();
        } catch {}
      }, 8000);
    } catch {
      // ignore
    }
  }, [soundsEnabled]);

  const spawnCritters = useCallback(() => {
    const count = 1 + Math.floor(Math.random() * 3);
    const now = Date.now();

    setBoxImageIndex(Math.floor(Math.random() * BOX_IMAGES.length));

    setCritters((prev) => {
      const next: Critter[] = [];
      const targetInset = size * 2.2;

      for (let i = 0; i < count; i += 1) {
        const chosenAsset = availableCritterAssets[Math.floor(Math.random() * availableCritterAssets.length)];
        const startX =
          boxX + boxSize / 2 - size / 2 + (Math.random() * 2 - 1) * (size * 0.25);
        const startY =
          boxY + boxSize * 0.6 - size / 2 + (Math.random() * 2 - 1) * (size * 0.2);

        next.push({
          id: `${now}-${Math.random().toString(16).slice(2)}-${i}`,
          Asset: chosenAsset,
          facingOffsetRad: getEmojiFacingOffsetRad(chosenAsset),
          startX,
          startY,
          targetX: dashVertical
            ? clamp(Math.random() * (SCREEN_WIDTH - size), -targetInset, SCREEN_WIDTH + targetInset)
            : SCREEN_WIDTH + targetInset,
          targetY: dashVertical
            ? -targetInset
            : clamp(Math.random() * (SCREEN_HEIGHT - size), -targetInset, SCREEN_HEIGHT + targetInset),
          durationMs: Math.round(Math.max(900, speed * (0.8 + Math.random() * 0.5))),
        });
      }

      const combined = [...prev, ...next];
      return combined.length > 30 ? combined.slice(combined.length - 30) : combined;
    });
  }, [availableCritterAssets, boxSize, boxX, boxY, dashVertical, size, speed]);

  const removeCritter = useCallback((id: string) => {
    setCritters((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleTap = () => {
    void lightHaptic();
    hintOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(1, { duration: 1500 }),
      withTiming(0, { duration: 300 })
    );
    hintTranslateX.value = withSequence(
      withTiming(0, { duration: 200 }),
      withTiming(0, { duration: 1500 }),
      withTiming(-50, { duration: 300 })
    );
  };

  const hintStyle = useAnimatedStyle(() => ({
    opacity: hintOpacity.value,
    transform: [{ translateX: hintTranslateX.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: effectiveBackgroundColor }]}>
      <StatusBar hidden />

      {backgroundMode === 'texture' ? (
        <TextureBackground textureId={backgroundTexture} />
      ) : (
        <SvgPatternOverlay patternId={backgroundPattern} />
      )}

      {Platform.OS === 'ios' ? <AnimatedMeshGradient /> : null}

      {critters.map((c) => (
        <EscapeCritter
          key={c.id}
          id={c.id}
          Asset={c.Asset}
          facingOffsetRad={c.facingOffsetRad}
          size={size}
          startX={c.startX}
          startY={c.startY}
          targetX={c.targetX}
          targetY={c.targetY}
          screenWidth={SCREEN_WIDTH}
          screenHeight={SCREEN_HEIGHT}
          durationMs={c.durationMs}
          onDone={removeCritter}
        />
      ))}

      <Pressable
        style={({ pressed }) => [
          styles.boxPressable,
          {
            left: boxX,
            top: boxY,
            width: boxSize,
            height: boxSize,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
        onPress={() => {
          void lightHaptic();
          void playBoxClickSound();
          spawnCritters();
        }}
      >
        <Image source={BOX_IMAGES[boxImageIndex]} style={styles.boxImage} resizeMode="contain" />
      </Pressable>

      <Animated.View style={[styles.hintContainer, hintStyle]} pointerEvents="none">
        <Text style={styles.hintText}>{t('hint.holdToOpenSettings')}</Text>
      </Animated.View>

      <Pressable
        style={({ pressed }) => [styles.settingsButton, { opacity: pressed ? 0.7 : 1 }]}
        onPress={handleTap}
        onLongPress={() => {
          void lightHaptic();
          router.push('/game/settings');
        }}
        delayLongPress={300}
      >
        {Platform.OS === 'ios' ? (
          <GlassView
            glassEffectStyle="regular"
            tintColor="rgba(255,255,255,0.28)"
            isInteractive={false}
            style={styles.settingsGlass}
          >
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
    opacity: 0.15,
  },
  patternRow: {
    flexDirection: 'row',
  },
  boxPressable: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  boxImage: {
    width: '100%',
    height: '100%',
  },
  settingsButton: {
    position: 'absolute',
    bottom: 40,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  settingsGlass: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.10)',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  settingsAndroidFallback: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.10)',
  },
  settingsIcon: {
    opacity: 0.65,
  },
  hintContainer: {
    position: 'absolute',
    bottom: 52,
    right: 100,
    zIndex: 9999,
    elevation: 9999,
  },
  hintText: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});
