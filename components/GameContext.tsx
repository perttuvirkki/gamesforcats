import { MovementPattern } from '@/constants/movements';
import React, { createContext, useContext, useState } from 'react';

export type BackgroundMode = 'pattern' | 'texture';

interface GameSettings {
  activeGameId: string | null;
  setActiveGameId: (val: string | null) => void;
  speed: number;
  setSpeed: (val: number) => void;
  size: number;
  setSize: (val: number) => void;
  objectCount: number;
  setObjectCount: (val: number) => void;
  movementPattern: MovementPattern;
  setMovementPattern: (val: MovementPattern) => void;
  backgroundMode: BackgroundMode;
  setBackgroundMode: (val: BackgroundMode) => void;
  backgroundColor: string;
  setBackgroundColor: (val: string) => void;
  backgroundPattern: string;
  setBackgroundPattern: (val: string) => void;
  backgroundTexture: string;
  setBackgroundTexture: (val: string) => void;
  customEmoji: string | null;  // Emoji code (e.g., '1f41f') or null for default
  setCustomEmoji: (val: string | null) => void;
  // Per-game override: value is the selected sound id; null means "use game default".
  // Stored per activeGameId so changing a game's sound won't affect other games.
  backgroundSound: string | null;
  setBackgroundSound: (val: string | null) => void;
}

const GameContext = createContext<GameSettings | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [speed, setSpeed] = useState(2000);
  const [size, setSize] = useState(80);
  const [objectCount, setObjectCount] = useState(1);
  const [movementPattern, setMovementPattern] = useState<MovementPattern>('random');
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>('pattern');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [backgroundPattern, setBackgroundPattern] = useState('none');
  const [backgroundTexture, setBackgroundTexture] = useState('none');
  const [customEmoji, setCustomEmoji] = useState<string | null>(null);
  const [backgroundSoundByGame, setBackgroundSoundByGame] = useState<Record<string, string>>({});

  const backgroundSound = activeGameId ? (backgroundSoundByGame[activeGameId] ?? null) : null;
  const setBackgroundSound = (val: string | null) => {
    if (!activeGameId) return;
    setBackgroundSoundByGame((prev) => {
      // Keep the map small: store only explicit overrides.
      if (val == null) {
        if (!(activeGameId in prev)) return prev;
        const { [activeGameId]: _removed, ...rest } = prev;
        return rest;
      }
      if (prev[activeGameId] === val) return prev;
      return { ...prev, [activeGameId]: val };
    });
  };

  return (
    <GameContext.Provider
      value={{
        activeGameId,
        setActiveGameId,
        speed,
        setSpeed,
        size,
        setSize,
        objectCount,
        setObjectCount,
        movementPattern,
        setMovementPattern,
        backgroundMode,
        setBackgroundMode,
        backgroundColor,
        setBackgroundColor,
        backgroundPattern,
        setBackgroundPattern,
        backgroundTexture,
        setBackgroundTexture,
        customEmoji,
        setCustomEmoji,
        backgroundSound,
        setBackgroundSound,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGameSettings() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameSettings must be used within a GameProvider');
  }
  return context;
}
