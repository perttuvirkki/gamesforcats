import React, { useEffect } from "react";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SvgProps } from "react-native-svg";

export function JumpingCritter({
  id,
  Asset,
  facingOffsetRad = 0,
  baseRotateRad = 0,
  size,
  x,
  startX,
  y,
  horizontal,
  returnToStart,
  lingerMs,
  peakY,
  durationMs,
  onDone,
}: {
  id: string;
  Asset: React.FC<SvgProps>;
  facingOffsetRad?: number;
  baseRotateRad?: number;
  size: number;
  x: number;
  startX?: number;
  y?: number;
  horizontal?: boolean;
  returnToStart?: boolean;
  lingerMs?: number;
  peakY: number;
  durationMs: number;
  onDone: (id: string) => void;
}) {
  const translateX = useSharedValue(x);
  const translateY = useSharedValue(-size * 2.2);
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);
  const jitterRotate = useSharedValue(0);
  const facingRotate = useSharedValue(0);

  useAnimatedReaction(
    () => ({ y: translateY.value }),
    (curr, prev) => {
      if (!prev) return;
      const dy = curr.y - prev.y;
      if (Math.abs(dy) < 0.5 || Math.abs(dy) > size * 10) return;
      facingRotate.value = dy > 0 ? Math.PI / 2 : -Math.PI / 2;
    },
    [size],
  );

  useEffect(() => {
    const shouldSlideIn = typeof startX === "number" && Number.isFinite(startX) && Math.abs(startX - x) > 1;
    translateX.value = shouldSlideIn ? (startX as number) : x;
    translateY.value = horizontal ? (typeof y === "number" ? y : peakY) : -size * 2.2;
    scale.value = 0.3;
    opacity.value = 0;
    jitterRotate.value = 0;

    opacity.value = withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) });
    scale.value = withSequence(
      withTiming(1.05, { duration: 160, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 120, easing: Easing.out(Easing.cubic) }),
    );

    jitterRotate.value = withRepeat(
      withSequence(
        withTiming(-0.12, { duration: 120, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.12, { duration: 120, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );

    if (horizontal) {
      const baselineY = typeof y === "number" ? y : peakY;
      const inMs = Math.max(220, Math.min(460, Math.round(durationMs * 0.34)));
      const outMs = Math.max(220, Math.min(560, Math.round(durationMs * 0.36)));
      const holdMsRaw = typeof lingerMs === "number" && Number.isFinite(lingerMs) ? lingerMs : Math.round(durationMs * 0.55);
      const holdMs = Math.max(260, Math.min(1100, Math.round(holdMsRaw)));

      // Horizontal-only: keep Y fixed and animate only X.
      translateY.value = baselineY;
      translateX.value = withSequence(
        withTiming(x, { duration: inMs, easing: Easing.out(Easing.cubic) }),
        withTiming(x, { duration: holdMs, easing: Easing.linear }),
        returnToStart && shouldSlideIn
          ? withTiming(startX as number, { duration: outMs, easing: Easing.inOut(Easing.cubic) })
          : withTiming(x, { duration: outMs, easing: Easing.inOut(Easing.cubic) }),
      );

      opacity.value = withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(1, { duration: inMs + holdMs + Math.round(outMs * 0.35) }),
        withTiming(0, { duration: Math.round(outMs * 0.65), easing: Easing.in(Easing.quad) }),
      );

      const timeout = setTimeout(() => onDone(id), inMs + holdMs + outMs + 180);
      return () => {
        clearTimeout(timeout);
        cancelAnimation(translateX);
        cancelAnimation(translateY);
        cancelAnimation(scale);
        cancelAnimation(opacity);
        cancelAnimation(jitterRotate);
      };
    }

    const downMs = Math.max(180, Math.round(durationMs * 0.58));
    const upMs = Math.max(140, durationMs - downMs);

    if (shouldSlideIn) {
      const slideMs = Math.max(160, Math.min(320, Math.round(durationMs * 0.32)));
      translateX.value = withTiming(x, { duration: slideMs, easing: Easing.out(Easing.cubic) });
    }

    translateY.value = withSequence(
      withTiming(peakY, { duration: downMs, easing: Easing.out(Easing.cubic) }),
      withTiming(-size * 2.2, { duration: upMs, easing: Easing.in(Easing.cubic) }),
    );

    const timeout = setTimeout(() => onDone(id), downMs + upMs + 120);
    return () => {
      clearTimeout(timeout);
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(scale);
      cancelAnimation(opacity);
      cancelAnimation(jitterRotate);
    };
  }, [durationMs, horizontal, id, lingerMs, onDone, peakY, returnToStart, size, startX, translateX, translateY, scale, opacity, jitterRotate, x, y]);

  const style = useAnimatedStyle(() => ({
    position: "absolute",
    width: size,
    height: size,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${baseRotateRad + facingRotate.value + facingOffsetRad + jitterRotate.value}rad` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={style} pointerEvents="none">
      <Asset width={size} height={size} />
    </Animated.View>
  );
}
