import emojiSvgs from '@/assets/emojiSvgs';
import { SvgProps } from 'react-native-svg';

const UP_FACING_CODES = new Set([
  '1f41b', // bug
  '1f41c', // ant
  '1f41d', // bee
  '1f41e', // ladybug
  '1f997', // cricket
  '1fab3', // cockroach
  '1f577', // spider
]);

const COMPONENT_TO_CODE = new Map<React.FC<SvgProps>, string>();
for (const [key, Component] of Object.entries(emojiSvgs)) {
  if (typeof Component !== 'function') continue;
  COMPONENT_TO_CODE.set(Component as React.FC<SvgProps>, key.replace(/\.svg$/i, ''));
}

export function getFacingOffsetByEmojiCodeRad(code: string): number {
  // In RN coordinates, 0 rad = facing right, +π/2 = facing down.
  // Most Twemojis are drawn facing left, so we apply -π so:
  // - moving left (π) => π + (-π) = 0 (unrotated, faces left)
  // - moving right (0) => 0 + (-π) = -π (flipped to face right)
  if (UP_FACING_CODES.has(code)) return Math.PI / 2;
  return -Math.PI;
}

export function getEmojiFacingOffsetRad(Asset: React.FC<SvgProps>): number {
  const code = COMPONENT_TO_CODE.get(Asset);
  if (!code) return -Math.PI;
  return getFacingOffsetByEmojiCodeRad(code);
}

