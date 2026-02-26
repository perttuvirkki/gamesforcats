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
import { useGameSettings } from './GameContext';
import { JumpingCritter } from './JumpingCritter';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOX_CLICK_SQUEAKS: GameSoundId[] = ['mouse', 'squeak2', 'squeak3', 'squeak4'];
const pickTapSound = (): GameSoundId =>
  Math.random() < 0.18 ? 'bell' : (BOX_CLICK_SQUEAKS[Math.floor(Math.random() * BOX_CLICK_SQUEAKS.length)] ?? 'mouse');

interface TopJumpRunnerProps {
  Asset: React.FC<SvgProps>;
  assets?: React.FC<SvgProps>[];
  backgroundColor?: string;
}

type Jump = {
  id: string;
  Asset: React.FC<SvgProps>;
  facingOffsetRad: number;
  x: number;
  peakY: number;
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

export default function TopJumpRunner({ Asset, assets, backgroundColor = '#fff' }: TopJumpRunnerProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { soundsEnabled } = useAppSettings();
  const {
    speed,
    size,
    objectCount,
    backgroundMode,
    backgroundColor: selectedBackgroundColor,
    backgroundPattern,
    backgroundTexture,
    customEmoji,
  } = useGameSettings();

  const effectiveBackgroundColor = selectedBackgroundColor || backgroundColor;
  const CustomEmojiComponent = customEmoji ? getEmojiComponent(customEmoji) : null;

  const availableCritterAssets = useMemo(() => {
    if (CustomEmojiComponent) return [CustomEmojiComponent];
    if (assets && assets.length > 0) return assets;
    return [Asset];
  }, [Asset, assets, CustomEmojiComponent]);

  const [hintKey, setHintKey] = useState<'hint.holdToOpenSettings' | 'topJump.hint.tapButton'>('hint.holdToOpenSettings');
  const hintOpacity = useSharedValue(0);
  const hintTranslateX = useSharedValue(-50);
  const hintStyle = useAnimatedStyle(() => ({
    opacity: hintOpacity.value,
    transform: [{ translateX: hintTranslateX.value }],
  }));

  const [jumps, setJumps] = useState<Jump[]>([]);
  const jumpButtonWidth = Math.min(240, Math.max(170, SCREEN_WIDTH - 200));
  const jumpButtonLeft = (SCREEN_WIDTH - jumpButtonWidth) / 2;

  const playTapSound = useCallback(async () => {
    if (!soundsEnabled) return;
    try {
      await ensureGameAudioAsync().catch(() => {});
      const id = pickTapSound();
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

  const spawnJump = useCallback(() => {
    const count = Math.max(1, Math.min(12, Math.round(objectCount || 1)));
    const now = Date.now();
    const maxX = Math.max(0, SCREEN_WIDTH - size);

    const next: Jump[] = Array.from({ length: count }, (_, i) => {
      const chosen = availableCritterAssets[Math.floor(Math.random() * availableCritterAssets.length)];
      const id = `${now}-${Math.random().toString(16).slice(2)}-${i}`;
      const x = clamp(Math.random() * maxX, 0, maxX);
      const peakY = clamp(size * 0.2 + Math.random() * (SCREEN_HEIGHT * 0.28), size * 0.15, SCREEN_HEIGHT * 0.4);
      const durationMs = Math.round(Math.max(650, speed * (0.85 + Math.random() * 0.2)));
      return {
        id,
        Asset: chosen,
        facingOffsetRad: getEmojiFacingOffsetRad(chosen),
        x,
        peakY,
        durationMs,
      };
    });

    setJumps((prev) => {
      const combined = [...prev, ...next];
      return combined.length > 40 ? combined.slice(combined.length - 40) : combined;
    });

    hintOpacity.value = withSequence(withTiming(0, { duration: 80 }), withTiming(0, { duration: 600 }));
  }, [availableCritterAssets, hintOpacity, objectCount, size, speed]);

  const handleDone = useCallback((id: string) => {
    setJumps((prev) => prev.filter((j) => j.id !== id));
  }, []);

  const showTapHint = () => {
    void lightHaptic();
    setHintKey('topJump.hint.tapButton');
    hintOpacity.value = withSequence(
      withTiming(1, { duration: 180 }),
      withTiming(1, { duration: 1200 }),
      withTiming(0, { duration: 220 })
    );
    hintTranslateX.value = withSequence(withTiming(0, { duration: 180 }), withTiming(0, { duration: 1200 }), withTiming(-50, { duration: 220 }));
  };

  const showSettingsHint = () => {
    void lightHaptic();
    setHintKey('hint.holdToOpenSettings');
    hintOpacity.value = withSequence(withTiming(1, { duration: 200 }), withTiming(1, { duration: 1500 }), withTiming(0, { duration: 300 }));
    hintTranslateX.value = withSequence(withTiming(0, { duration: 200 }), withTiming(0, { duration: 1500 }), withTiming(-50, { duration: 300 }));
  };

  return (
    <View style={[styles.container, { backgroundColor: effectiveBackgroundColor }]}>
      <StatusBar hidden />

      {backgroundMode === 'texture' ? (
        <TextureBackground textureId={backgroundTexture} />
      ) : (
        <SvgPatternOverlay patternId={backgroundPattern} />
      )}

      {Platform.OS === 'ios' ? <AnimatedMeshGradient /> : null}

      {jumps.map((jump) => (
        <JumpingCritter
          key={jump.id}
          id={jump.id}
          Asset={jump.Asset}
          facingOffsetRad={jump.facingOffsetRad}
          size={size}
          x={jump.x}
          peakY={jump.peakY}
          durationMs={jump.durationMs}
          onDone={handleDone}
        />
      ))}

      <Animated.View style={[styles.hintContainer, hintStyle]} pointerEvents="none">
        <Text style={styles.hintText}>{t(hintKey)}</Text>
      </Animated.View>

      <Pressable
        style={({ pressed }) => [
          styles.jumpButtonOuter,
          { width: jumpButtonWidth, left: jumpButtonLeft, opacity: pressed ? 0.85 : 1 },
        ]}
        onPress={() => {
          void lightHaptic();
          void playTapSound();
          spawnJump();
        }}
        onLongPress={showTapHint}
        delayLongPress={250}
      >
        {Platform.OS === 'ios' ? (
          <GlassView
            glassEffectStyle="regular"
            tintColor="rgba(255,255,255,0.22)"
            isInteractive={false}
            style={styles.jumpButtonInner}
          >
            <Ionicons name="paw" size={22} color="#000" style={styles.jumpButtonIcon} />
            <Text style={styles.jumpButtonText}>{t('topJump.button.jump')}</Text>
          </GlassView>
        ) : (
          <View style={[styles.jumpButtonInner, styles.jumpButtonAndroid]}>
            <Ionicons name="paw" size={22} color="#000" style={styles.jumpButtonIcon} />
            <Text style={styles.jumpButtonText}>{t('topJump.button.jump')}</Text>
          </View>
        )}
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.settingsButton, { opacity: pressed ? 0.7 : 1 }]}
        onPress={showSettingsHint}
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
  jumpButtonOuter: {
    position: 'absolute',
    bottom: 36,
    height: 58,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  jumpButtonInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.10)',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  jumpButtonAndroid: {
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  jumpButtonIcon: {
    opacity: 0.7,
  },
  jumpButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    opacity: 0.7,
  },
  settingsButton: {
    position: 'absolute',
    bottom: 35,
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
});
