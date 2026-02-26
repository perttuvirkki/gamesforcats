import React, { useEffect } from 'react';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SvgProps } from 'react-native-svg';

type Point = { x: number; y: number };

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function normalize(x: number, y: number) {
  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len };
}

function makeZigZagPoints({
  start,
  target,
  screenWidth,
  screenHeight,
  size,
  segments,
}: {
  start: Point;
  target: Point;
  screenWidth: number;
  screenHeight: number;
  size: number;
  segments: number;
}): Point[] {
  const dx = target.x - start.x;
  const dy = target.y - start.y;
  const perp = normalize(-dy, dx);

  const baseAmp = clamp(size * 0.35, 10, 34);
  const points: Point[] = [];

  for (let i = 1; i <= segments; i += 1) {
    const t = i / segments;
    const direction = i % 2 === 0 ? 1 : -1;
    const amp = baseAmp * (0.65 + Math.random() * 0.75);
    const jitter = clamp(size * 0.08, 2, 10);

    const x =
      start.x +
      dx * t +
      perp.x * amp * direction +
      (Math.random() * 2 - 1) * jitter;
    const y =
      start.y +
      dy * t +
      perp.y * amp * direction +
      (Math.random() * 2 - 1) * jitter;

    points.push({
      x: clamp(x, -size * 3, screenWidth + size * 3),
      y: clamp(y, -size * 3, screenHeight + size * 3),
    });
  }

  points[points.length - 1] = target;
  return points;
}

export function EscapeCritter({
  id,
  Asset,
  facingOffsetRad = 0,
  size,
  startX,
  startY,
  targetX,
  targetY,
  screenWidth,
  screenHeight,
  durationMs,
  onDone,
}: {
  id: string;
  Asset: React.FC<SvgProps>;
  facingOffsetRad?: number;
  size: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  screenWidth: number;
  screenHeight: number;
  durationMs: number;
  onDone: (id: string) => void;
}) {
  const translateX = useSharedValue(startX);
  const translateY = useSharedValue(startY);
  const scale = useSharedValue(0.2);
  const opacity = useSharedValue(0);
  const jitterRotate = useSharedValue(0);
  const facingRotate = useSharedValue(0);

  useAnimatedReaction(
    () => ({ x: translateX.value, y: translateY.value }),
    (curr, prev) => {
      if (!prev) return;
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.5 || dist > size * 8) return;
      facingRotate.value = Math.atan2(dy, dx);
    },
    [size]
  );

  useEffect(() => {
    translateX.value = startX;
    translateY.value = startY;
    scale.value = 0.2;
    opacity.value = 0;

    const segments = 6;
    const segmentMs = Math.max(120, Math.round(durationMs / segments));
    const points = makeZigZagPoints({
      start: { x: startX, y: startY },
      target: { x: targetX, y: targetY },
      screenWidth,
      screenHeight,
      size,
      segments,
    });

    scale.value = withTiming(1, { duration: 160, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(1, { duration: 160, easing: Easing.out(Easing.cubic) });

    jitterRotate.value = withRepeat(
      withSequence(
        withTiming(-0.18, { duration: 120, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.18, { duration: 120, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    translateX.value = withSequence(
      ...points.map((p) => withTiming(p.x, { duration: segmentMs, easing: Easing.linear }))
    );
    translateY.value = withSequence(
      ...points.map((p) => withTiming(p.y, { duration: segmentMs, easing: Easing.linear }))
    );

    const timeout = setTimeout(() => onDone(id), segmentMs * segments + 300);
    return () => {
      clearTimeout(timeout);
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(scale);
      cancelAnimation(opacity);
      cancelAnimation(jitterRotate);
    };
  }, [
    durationMs,
    id,
    onDone,
    screenHeight,
    screenWidth,
    size,
    startX,
    startY,
    targetX,
    targetY,
    translateX,
    translateY,
    scale,
    opacity,
    jitterRotate,
  ]);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    width: size,
    height: size,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${facingRotate.value + facingOffsetRad + jitterRotate.value}rad` },
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
