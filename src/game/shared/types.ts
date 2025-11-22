export type GameType = 'flip_match' | 'math_rush' | 'spatial_memory' | 'stroop';

export interface GameStats {
  totalPlays: number;
  totalPlayTime: number;
  bestRecord: number | string;
  lastPlayed: number;
}

export interface GameRecord {
  flip_match: {
    bestTime: number;
    difficulty: 'easy' | 'medium' | 'hard';
    totalPlays: number;
    totalPlayTime: number;
  };
  math_rush: {
    highScore: number;
    highestCombo: number;
    totalPlays: number;
    totalPlayTime: number;
  };
  spatial_memory: {
    highestLevel: number;
    difficulty: 'easy' | 'medium' | 'hard';
    totalPlays: number;
    totalPlayTime: number;
  };
  stroop: {
    highScore: number;
    totalPlays: number;
    totalPlayTime: number;
  };
}

export interface GlobalStats {
  totalGamesPlayed: number;
  totalPlayTime: number;
  favoriteGame: GameType | null;
  achievementsUnlocked: number;
  gamesStats: {
    [key in GameType]: GameStats;
  };
}

export interface GameState {
  currentGame: GameType | null;
  isPlaying: boolean;
  isPaused: boolean;
}

import { LucideIcon } from 'lucide-react-native';

export interface GameInfo {
  id: GameType;
  name: string;
  description: string;
  icon: LucideIcon;
  route: string;
  gradientKey: 'flipMatch' | 'mathRush' | 'spatialMemory' | 'stroop';
  bestRecordLabel: string;
  bestRecordValue: string | number;
}