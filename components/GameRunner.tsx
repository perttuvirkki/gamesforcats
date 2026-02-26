import emojiSvgs from '@/assets/emojiSvgs';
import { useI18n } from '@/components/I18nContext';
import { getPatternById } from '@/constants/background-patterns';
import { getGameById } from '@/constants/games';
import { lightHaptic } from '@/lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo } from 'react';
import { Dimensions, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { SvgProps } from 'react-native-svg';
import { AnimatedMeshGradient } from './AnimatedMeshGradient';
import { getEmojiFacingOffsetRad } from './emojiFacing';
import { useGameSettings } from './GameContext';
import MovingObject from './MovingObject';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GameRunnerProps {
  Asset: React.FC<SvgProps>;
  assets?: React.FC<SvgProps>[]; // Optional array for variety
  backgroundColor?: string;
  assetRotationOffsetRad?: number;
}

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

export default function GameRunner({ Asset, assets, backgroundColor = '#fff', assetRotationOffsetRad }: GameRunnerProps) {
  const router = useRouter();
  const { t } = useI18n();
  const {
    speed,
    size,
    objectCount,
    movementPattern,
    backgroundMode,
    backgroundColor: selectedBackgroundColor,
    backgroundPattern,
    backgroundTexture,
    activeGameId,
    customEmoji,
  } = useGameSettings();

  // Get active game for spawn/death sounds
  const activeGame = activeGameId ? getGameById(activeGameId) : undefined;
  const spawnSound = activeGame?.spawnSound;
  const deathSound = activeGame?.deathSound;
  
  const hintOpacity = useSharedValue(0);
  const hintTranslateX = useSharedValue(50);

  // Get custom emoji component if set
  const CustomEmojiComponent = customEmoji ? getEmojiComponent(customEmoji) : null;

  // Pre-select random assets for each object (only recalculates when objectCount changes)
  const objectAssets = useMemo(() => {
    const pick = (Component: React.FC<SvgProps>) => ({
      Component,
      facingOffsetRad: getEmojiFacingOffsetRad(Component) + (assetRotationOffsetRad ?? 0),
    });

    if (CustomEmojiComponent) {
      // Don't apply any game-specific rotation offset to user-selected custom emoji.
      return Array.from({ length: objectCount }, () => ({
        Component: CustomEmojiComponent,
        facingOffsetRad: getEmojiFacingOffsetRad(CustomEmojiComponent),
      }));
    }

    const availableAssets = assets && assets.length > 0 ? assets : [Asset];
    return Array.from({ length: objectCount }, () =>
      pick(availableAssets[Math.floor(Math.random() * availableAssets.length)])
    );
  }, [objectCount, Asset, assets, CustomEmojiComponent, assetRotationOffsetRad]);

  const objects = Array.from({ length: objectCount }, (_, i) => i);

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

  const effectiveBackgroundColor = selectedBackgroundColor || backgroundColor;

	  return (
	    <View style={[styles.container, { backgroundColor: effectiveBackgroundColor }]}>
	      <StatusBar hidden />
	      
	      {backgroundMode === 'texture' ? (
	        <TextureBackground textureId={backgroundTexture} />
	      ) : (
	        <SvgPatternOverlay patternId={backgroundPattern} />
	      )}

	      {/* Mesh Gradient Overlay (iOS only) */}
	      {Platform.OS === 'ios' ? <AnimatedMeshGradient /> : null}
	      
	      {objects.map((id) => (
	        <MovingObject 
	          key={id} 
	          Asset={objectAssets[id].Component} 
	          facingOffsetRad={objectAssets[id].facingOffsetRad}
          size={size} 
          speed={speed} 
          pattern={movementPattern} 
          spawnSound={spawnSound}
          deathSound={deathSound}
        />
      ))}

      {/* Hint text */}
      <Animated.View style={[styles.hintContainer, hintStyle]} pointerEvents="none">
        <Text style={styles.hintText}>{t('hint.holdToOpenSettings')}</Text>
      </Animated.View>

      {/* Settings Trigger - Long Press */}
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
  meshGradient: {
    ...StyleSheet.absoluteFillObject,
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
