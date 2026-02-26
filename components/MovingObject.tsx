import { GAME_SOUNDS, GameSoundId } from '@/assets/sounds/gameSounds';
import { useAppSettings } from '@/components/AppSettingsContext';
import { MOVEMENT_FUNCTIONS, MovementPattern, PATTERN_CYCLE_MULTIPLIERS } from '@/constants/movements';
import { lightHaptic } from '@/lib/haptics';
import { createAudioPlayer } from 'expo-audio';
import { ensureGameAudioAsync } from '@/lib/audio';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet } from 'react-native';
import Animated, {
    Easing,
    cancelAnimation,
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { SvgProps } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MovingObjectProps {
  Asset: React.FC<SvgProps>;
  size: number;
  speed: number;
  pattern: MovementPattern;
  facingOffsetRad?: number;
  spawnSound?: GameSoundId;
  deathSound?: GameSoundId;
  onCatch?: () => void;
}

// Helper to get random position
const randomX = (size: number) => Math.random() * Math.max(0, SCREEN_WIDTH - size);
const randomY = (size: number) => Math.random() * Math.max(0, SCREEN_HEIGHT - size);
const MOUSE_SQUEAK_IDS: GameSoundId[] = ['mouse', 'squeak2', 'squeak3', 'squeak4'];
const KILL_SPLAT_IDS: GameSoundId[] = ['splat1', 'splat2', 'splat3', 'splat4'];

export default function MovingObject({
  Asset,
  size,
  speed,
  pattern,
  facingOffsetRad,
  spawnSound,
  deathSound,
  onCatch,
}: MovingObjectProps) {
  const translateX = useSharedValue(randomX(size));
  const translateY = useSharedValue(randomY(size));
  const respawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const popInTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cycleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cycleGenerationRef = useRef(0);
  const { soundsEnabled } = useAppSettings();
  
  // Destroy animation values
  const shakeX = useSharedValue(0);
  const destroyScale = useSharedValue(1);
  const destroyOpacity = useSharedValue(1);
  const movementScale = useSharedValue(1);
  const [isDestroyed, setIsDestroyed] = useState(false);

  // Subtle movement jitter (like BoxEscape critters)
  const jitterRotate = useSharedValue(0);
  const jitterX = useSharedValue(0);
  const jitterY = useSharedValue(0);
  const facingRotate = useSharedValue(0);
  const facingOffset = facingOffsetRad ?? 0;
  const jitterConfig = useMemo(() => {
    const base = Math.max(1, Math.min(6, size * 0.04));
    return {
      rotateRad: 0.08 + Math.random() * 0.12,
      x: base * (0.3 + Math.random() * 0.7),
      y: base * (0.25 + Math.random() * 0.6),
      rotMs: 110 + Math.floor(Math.random() * 90),
      posMs: 140 + Math.floor(Math.random() * 140),
    };
  }, [size]);

  useAnimatedReaction(
    () => ({ x: translateX.value, y: translateY.value }),
    (curr, prev) => {
      if (!prev) return;
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Ignore huge jumps (teleports between cycles) and tiny noise.
      if (dist < 0.5 || dist > size * 8) return;
      facingRotate.value = Math.atan2(dy, dx);
    },
    [size]
  );

  useEffect(() => {
    jitterRotate.value = 0;
    jitterX.value = 0;
    jitterY.value = 0;

    jitterRotate.value = withRepeat(
      withSequence(
        withTiming(-jitterConfig.rotateRad, {
          duration: jitterConfig.rotMs,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(jitterConfig.rotateRad, {
          duration: jitterConfig.rotMs,
          easing: Easing.inOut(Easing.quad),
        })
      ),
      -1,
      true
    );

    jitterX.value = withRepeat(
      withSequence(
        withTiming(-jitterConfig.x, { duration: jitterConfig.posMs, easing: Easing.inOut(Easing.quad) }),
        withTiming(jitterConfig.x, { duration: jitterConfig.posMs, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
    jitterY.value = withRepeat(
      withSequence(
        withTiming(-jitterConfig.y, { duration: jitterConfig.posMs + 60, easing: Easing.inOut(Easing.quad) }),
        withTiming(jitterConfig.y, { duration: jitterConfig.posMs + 60, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    return () => {
      cancelAnimation(jitterRotate);
      cancelAnimation(jitterX);
      cancelAnimation(jitterY);
    };
  }, [jitterConfig, jitterRotate, jitterX, jitterY]);

  // Play spawn sound
  const playSpawnSound = useCallback(async () => {
    if (!soundsEnabled || !spawnSound) return;
    try {
      await ensureGameAudioAsync().catch(() => {});
      
      const resolvedId = spawnSound === 'mouse'
        ? (MOUSE_SQUEAK_IDS[Math.floor(Math.random() * MOUSE_SQUEAK_IDS.length)] ?? 'mouse')
        : spawnSound;
      const source = GAME_SOUNDS[resolvedId];
      const player = createAudioPlayer(source);
      player.volume = 1.0;
      player.play();
      // Auto-cleanup not easily possible without listener, but createAudioPlayer seems lightweight enough for occasional sfx
    } catch (e) {
      // ignore
    }
  }, [soundsEnabled, spawnSound]);

  // Play death sound
  const playDeathSound = useCallback(async () => {
    if (!soundsEnabled || !deathSound) return;
    try {
      await ensureGameAudioAsync().catch(() => {});
      const resolvedId =
        deathSound === 'mouse'
          ? (MOUSE_SQUEAK_IDS[Math.floor(Math.random() * MOUSE_SQUEAK_IDS.length)] ?? 'mouse')
          : deathSound.startsWith('splat')
            ? (KILL_SPLAT_IDS[Math.floor(Math.random() * KILL_SPLAT_IDS.length)] ?? 'splat1')
            : deathSound;
      const source = GAME_SOUNDS[resolvedId];
      const player = createAudioPlayer(source);
      player.volume = 1.0;
      player.play();
    } catch (e) {
      // ignore
    }
  }, [soundsEnabled, deathSound]);

  const startAnimation = useCallback((speedOverride?: number) => {
    cancelAnimation(translateX);
    cancelAnimation(translateY);
    cancelAnimation(movementScale);
    movementScale.value = 1;

    const maxX = Math.max(0, SCREEN_WIDTH - size);
    const maxY = Math.max(0, SCREEN_HEIGHT - size);
    translateX.value = Math.min(Math.max(0, translateX.value), maxX);
    translateY.value = Math.min(Math.max(0, translateY.value), maxY);

    // Get the movement function for this pattern
    const movementFn = MOVEMENT_FUNCTIONS[pattern];
    if (movementFn) {
      const effectiveSpeed = speedOverride ?? speed;
      movementFn({
        translateX,
        translateY,
        scale: movementScale,
        size,
        speed: effectiveSpeed,
        screenWidth: SCREEN_WIDTH,
        screenHeight: SCREEN_HEIGHT,
      });
    }
    
    // Play sound on new cycle start / spawn
    playSpawnSound();
  }, [movementScale, pattern, size, speed, translateX, translateY, playSpawnSound]);

  const stopCycle = useCallback(() => {
    cycleGenerationRef.current += 1;
    if (cycleTimerRef.current) {
      clearTimeout(cycleTimerRef.current);
      cycleTimerRef.current = null;
    }
  }, []);

  const startCycle = useCallback(() => {
    stopCycle();
    const generation = cycleGenerationRef.current;

    const runCycle = () => {
      if (cycleGenerationRef.current !== generation) return;
      const speedFactor = 0.75 + Math.random() * 0.5; // 0.75–1.25x loop length variance
      const effectiveSpeed = speed * speedFactor;
      startAnimation(effectiveSpeed);
      const cycleMs = Math.max(16, effectiveSpeed * PATTERN_CYCLE_MULTIPLIERS[pattern]);
      cycleTimerRef.current = setTimeout(runCycle, cycleMs);
    };

    runCycle();
  }, [pattern, speed, startAnimation, stopCycle]);

  useEffect(() => {
    startCycle();

    return () => {
      if (respawnTimerRef.current) {
        clearTimeout(respawnTimerRef.current);
        respawnTimerRef.current = null;
      }
      if (popInTimerRef.current) {
        clearTimeout(popInTimerRef.current);
        popInTimerRef.current = null;
      }
      stopCycle();
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(movementScale);
    };
  }, [movementScale, startCycle, stopCycle, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value + shakeX.value + jitterX.value },
      { translateY: translateY.value + jitterY.value },
      { rotate: `${facingRotate.value + facingOffset + jitterRotate.value}rad` },
      { scale: destroyScale.value * movementScale.value },
    ],
    opacity: destroyOpacity.value,
    width: size,
    height: size,
  }));

  const handlePress = () => {
    // Haptic feedback
    lightHaptic();
    
    // Play death sound
    playDeathSound();

    // Pause movement cycle so the next spawn doesn't inherit "remaining time" from the previous cycle.
    // Without this, a cycle timeout that was scheduled before the kill can fire right after respawn.
    stopCycle();
    cancelAnimation(translateX);
    cancelAnimation(translateY);
    cancelAnimation(movementScale);
    
    // Shake animation
    shakeX.value = withSequence(
      withTiming(-5, { duration: 30 }),
      withTiming(5, { duration: 30 }),
      withTiming(-5, { duration: 30 }),
      withTiming(5, { duration: 30 }),
      withTiming(0, { duration: 30 }),
    );
    
    // Pop and fade out
    destroyScale.value = withSequence(
      withSpring(1.3, { damping: 3 }),
      withTiming(0, { duration: 150 }),
    );
    destroyOpacity.value = withDelay(100, withTiming(0, { duration: 100 }));
    
    // Respawn after animation
    if (respawnTimerRef.current) {
      clearTimeout(respawnTimerRef.current);
      respawnTimerRef.current = null;
    }
    if (popInTimerRef.current) {
      clearTimeout(popInTimerRef.current);
      popInTimerRef.current = null;
    }

    respawnTimerRef.current = setTimeout(() => {
      setIsDestroyed(true);
      translateX.value = randomX(size);
      translateY.value = randomY(size);
      destroyScale.value = 0;
      destroyOpacity.value = 1;
      
      // Pop back in after longer delay
      popInTimerRef.current = setTimeout(() => {
        destroyScale.value = withSpring(1, { damping: 8 });
        setIsDestroyed(false);
        startCycle();
      }, 400);
    }, 500);
    
    onCatch?.();
  };

  if (isDestroyed) return null;

  return (
    <Animated.View style={[styles.item, animatedStyle]}>
      <Pressable onPress={handlePress}>
        <Asset width={size} height={size} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  item: {
    position: 'absolute',
  },
});
