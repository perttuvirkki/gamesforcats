import { useAppSettings } from '@/components/AppSettingsContext';
import BoxDashRunner from '@/components/BoxDashRunner';
import BoxEscapeRunner from '@/components/BoxEscapeRunner';
import { useGameSettings } from '@/components/GameContext';
import GameRunner from '@/components/GameRunner';
import { useI18n } from '@/components/I18nContext';
import InvertedBoxDashRunner from '@/components/InvertedBoxDashRunner';
import LoadingScreenRunner from '@/components/LoadingScreenRunner';
import PianoRunner from '@/components/PianoRunner';
import TopJumpRunner from '@/components/TopJumpRunner';
import { getPatternById } from '@/constants/background-patterns';
import { getBackgroundColor, getGameById } from '@/constants/games';
import { MovementPattern } from '@/constants/movements';
import { useGameBackgroundSound } from '@/hooks/useGameBackgroundSound';
import { hasProAccess } from '@/lib/revenuecat';
import { recordGamePlayed } from '@/lib/reviewPrompt';
import { getWeeklyFreeGames } from '@/lib/weeklyFreeGames';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useLayoutEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function DynamicGameScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = getGameById(id ?? '');
  const { t } = useI18n();
  const { installId } = useAppSettings();
  const {
    setActiveGameId,
    setSpeed,
    setSize,
    setBackgroundMode,
    setBackgroundColor,
    setBackgroundPattern,
    setBackgroundTexture,
    setObjectCount,
    setMovementPattern,
    setCustomEmoji,
    backgroundSound,
  } = useGameSettings();

  // Play looping background sound for the game (user selected or game default)
  useGameBackgroundSound(game?.backgroundSound, backgroundSound);

  const weeklyFree = React.useMemo(() => getWeeklyFreeGames(installId), [installId]);
  const isFreeThisWeek = Boolean(
    game?.id && (game.id === weeklyFree.freeInteractiveGameId || weeklyFree.freeRegularGameIds.includes(game.id)),
  );
  const [access, setAccess] = React.useState<"unknown" | "allowed" | "blocked">("unknown");

  useEffect(() => {
    if (!game?.id) return;
    if (isFreeThisWeek) {
      setAccess("allowed");
      return;
    }

    let cancelled = false;
    hasProAccess()
      .then((isPro) => {
        if (cancelled) return;
        setAccess(isPro ? "allowed" : "blocked");
      })
      .catch(() => {
        if (cancelled) return;
        setAccess("blocked");
      });

    return () => {
      cancelled = true;
    };
  }, [game?.id, isFreeThisWeek]);

  useEffect(() => {
    if (access !== "blocked") return;
    const timeout = setTimeout(() => {
      router.push("/paywall");
    }, 1000);
    return () => clearTimeout(timeout);
  }, [access, router]);

  // Use layout effect so dependent effects (like background sound) don't run with a stale activeGameId.
  useLayoutEffect(() => {
    if (game) {
      setActiveGameId(game.id);
	      // Reset to defaults when switching games
	      setSpeed(game.defaultSpeed ?? 2000);
	      setSize(80);
	      setMovementPattern((game.defaultMovementPattern ?? 'random') as MovementPattern);
	      setCustomEmoji(null);

      setBackgroundColor(getBackgroundColor(game.background));
    }

    if (game?.defaultBackgroundPattern) {
      const defaultPattern = getPatternById(game.defaultBackgroundPattern);

      if (defaultPattern?.type === 'image') {
        setBackgroundMode('texture');
        setBackgroundTexture(game.defaultBackgroundPattern);
        setBackgroundPattern('none');
      } else {
        setBackgroundMode('pattern');
        setBackgroundTexture('none');
        setBackgroundPattern(game.defaultBackgroundPattern);
      }

    } else {
      setBackgroundMode('pattern');
      setBackgroundTexture('none');
      setBackgroundPattern('none');
    }
    setObjectCount(game?.defaultObjectCount ?? 1);
  }, [
    game,
    setActiveGameId,
    setCustomEmoji,
    setBackgroundColor,
    setBackgroundMode,
    setBackgroundPattern,
    setBackgroundTexture,
    setObjectCount,
    setMovementPattern,
    setSize,
    setSpeed,
  ]);

  useEffect(() => {
    if (!game?.id) return;
    const startedAt = Date.now();
    return () => {
      const playedForMs = Date.now() - startedAt;
      if (playedForMs < 10_000) return;
      recordGamePlayed().catch(() => {});
    };
  }, [game?.id]);

  if (!game) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>{t('game.notFound')}</Text>
      </View>
    );
  }

  if (game.id === 'box-escape') {
    return <BoxEscapeRunner Asset={game.asset} assets={game.assets} backgroundColor={getBackgroundColor(game.background)} />;
  }
  if (game.id === 'box-dash') {
    return <BoxDashRunner Asset={game.asset} assets={game.assets} backgroundColor={getBackgroundColor(game.background)} />;
  }
  if (game.id === 'inverted-box-dash') {
    return (
      <InvertedBoxDashRunner
        Asset={game.asset}
        assets={game.assets}
        backgroundColor={getBackgroundColor(game.background)}
      />
    );
  }
  if (game.id === 'top-jump') {
    return <TopJumpRunner Asset={game.asset} assets={game.assets} backgroundColor={getBackgroundColor(game.background)} />;
  }
  if (game.id === 'piano') {
    return <PianoRunner backgroundColor={getBackgroundColor(game.background)} assets={game.assets} />;
  }
  if (game.id === 'loading-screen') {
    return <LoadingScreenRunner />;
  }

  return (
    <GameRunner
      Asset={game.asset}
      assets={game.assets}
      backgroundColor={getBackgroundColor(game.background)}
      assetRotationOffsetRad={game.assetRotationOffsetRad}
    />
  );
}

const styles = StyleSheet.create({
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
});
