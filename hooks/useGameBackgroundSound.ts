import { GAME_SOUNDS, GameSoundId } from '@/assets/sounds/gameSounds';
import { useAppSettings } from '@/components/AppSettingsContext';
import { createAudioPlayer } from 'expo-audio';
import { useEffect, useRef } from 'react';
import { ensureGameAudioAsync } from '@/lib/audio';

const MOUSE_SQUEAK_IDS: GameSoundId[] = ['mouse', 'squeak2', 'squeak3', 'squeak4'];
const randomBetween = (minMs: number, maxMs: number) => Math.floor(minMs + Math.random() * (maxMs - minMs + 1));

/**
 * Hook to play looping background sounds for games.
 * Automatically starts on mount and stops on unmount.
 * Respects the app's soundsEnabled setting.
 * 
 * @param gameDefaultSound - The game's default background sound
 * @param userSelectedSound - User's selected sound override (null = use game default, 'none' = disabled)
 */
export function useGameBackgroundSound(
  gameDefaultSound: GameSoundId | undefined,
  userSelectedSound: string | null
) {
  const { soundsEnabled } = useAppSettings();
  const playerRef = useRef<any>(null);
  const statusSubRef = useRef<{ remove: () => void } | null>(null);
  const lastMouseSqueakRef = useRef<GameSoundId | null>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Determine effective sound: user selected > game default
  // If user selected 'none' (which comes as null from settings), disable sound
  // If user hasn't selected anything (null), use game default
  const effectiveSoundId: GameSoundId | undefined = userSelectedSound
    ? (userSelectedSound as GameSoundId)
    : gameDefaultSound;

  useEffect(() => {
    let cancelled = false;

    const cleanup = () => {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
      pauseTimerRef.current = null;
      try {
        statusSubRef.current?.remove?.();
      } catch {}
      statusSubRef.current = null;
      try {
        playerRef.current?.pause?.();
        playerRef.current?.remove?.();
      } catch {}
      playerRef.current = null;
    };

    // Only play if sounds are enabled and a sound ID is provided
    if (!soundsEnabled || !effectiveSoundId) {
      cleanup();
      return () => {
        cancelled = true;
        cleanup();
      };
    }

    async function startSound() {
      try {
        await ensureGameAudioAsync().catch(() => {});

        if (cancelled) return;

        cleanup();

        const soundId = effectiveSoundId as GameSoundId;

        if (soundId === 'mouse') {
          const playNext = () => {
            if (cancelled) return;

            if (pauseTimerRef.current) {
              clearTimeout(pauseTimerRef.current);
              pauseTimerRef.current = null;
            }

            // Avoid immediate repeats for variety.
            const prev = lastMouseSqueakRef.current;
            const candidates = prev ? MOUSE_SQUEAK_IDS.filter((id) => id !== prev) : MOUSE_SQUEAK_IDS;
            const chosen = candidates[Math.floor(Math.random() * candidates.length)] ?? 'mouse';
            lastMouseSqueakRef.current = chosen;

            const source = GAME_SOUNDS[chosen];
            const player = createAudioPlayer(source, { updateInterval: 750 });
            playerRef.current = player;
            player.loop = false;
            player.volume = 0.4;

            statusSubRef.current = player.addListener?.('playbackStatusUpdate', (status: any) => {
              if (cancelled) return;
              if (!status?.isLoaded) return;
              if (status.didJustFinish) {
                cleanup();
                // Add a small pause between squeaks so it feels less "machine-gun".
                const pauseMs = randomBetween(250, 650);
                pauseTimerRef.current = setTimeout(() => {
                  pauseTimerRef.current = null;
                  playNext();
                }, pauseMs);
              }
            }) ?? null;

            player.play?.();
          };

          playNext();
          return;
        }

        const source = GAME_SOUNDS[soundId];
        const player = createAudioPlayer(source, { updateInterval: 1000 });

        playerRef.current = player;

        // Set to loop and start playing
        player.loop = true;
        player.volume = 0.4; // Subtle background volume
        player.play?.();
      } catch (error) {
        console.warn('Failed to start background sound:', error);
      }
    }

    startSound();

    // Cleanup on unmount or when dependencies change
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [soundsEnabled, effectiveSoundId]);
}
