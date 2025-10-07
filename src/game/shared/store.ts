import { create } from 'zustand';
import { GameType, GameState, GlobalStats, GameStats } from './types';

interface GameStore extends GameState {
  globalStats: GlobalStats;
  setCurrentGame: (game: GameType | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setIsPaused: (isPaused: boolean) => void;
  updateGameStats: (game: GameType, stats: Partial<GameStats>) => void;
  incrementTotalPlays: (game: GameType) => void;
  addPlayTime: (game: GameType, seconds: number) => void;
  updateBestRecord: (game: GameType, record: number | string) => void;
  getTotalGamesPlayed: () => number;
  getTotalPlayTime: () => number;
  getFavoriteGame: () => GameType | null;
  resetGame: () => void;
}

const initialGlobalStats: GlobalStats = {
  totalGamesPlayed: 0,
  totalPlayTime: 0,
  favoriteGame: null,
  achievementsUnlocked: 0,
  gamesStats: {
    flip_match: { totalPlays: 0, totalPlayTime: 0, bestRecord: 0, lastPlayed: 0 },
    math_rush: { totalPlays: 0, totalPlayTime: 0, bestRecord: 0, lastPlayed: 0 },
    spatial_memory: { totalPlays: 0, totalPlayTime: 0, bestRecord: 0, lastPlayed: 0 },
    stroop: { totalPlays: 0, totalPlayTime: 0, bestRecord: 0, lastPlayed: 0 },
  },
};

export const useGameStore = create<GameStore>((set, get) => ({
  currentGame: null,
  isPlaying: false,
  isPaused: false,
  globalStats: initialGlobalStats,

  setCurrentGame: (game) => set({ currentGame: game }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setIsPaused: (isPaused) => set({ isPaused }),

  updateGameStats: (game, stats) => {
    set((state) => ({
      globalStats: {
        ...state.globalStats,
        gamesStats: {
          ...state.globalStats.gamesStats,
          [game]: { ...state.globalStats.gamesStats[game], ...stats },
        },
      },
    }));
  },

  incrementTotalPlays: (game) => {
    const state = get();
    const currentStats = state.globalStats.gamesStats[game];
    state.updateGameStats(game, { totalPlays: currentStats.totalPlays + 1, lastPlayed: Date.now() });
    set((s) => ({ globalStats: { ...s.globalStats, totalGamesPlayed: s.globalStats.totalGamesPlayed + 1 } }));
  },

  addPlayTime: (game, seconds) => {
    const state = get();
    const currentStats = state.globalStats.gamesStats[game];
    state.updateGameStats(game, { totalPlayTime: currentStats.totalPlayTime + seconds });
    set((s) => ({ globalStats: { ...s.globalStats, totalPlayTime: s.globalStats.totalPlayTime + seconds } }));
  },

  updateBestRecord: (game, record) => {
    const state = get();
    const currentBest = state.globalStats.gamesStats[game].bestRecord;
    let shouldUpdate = false;
    if (currentBest === 0 || !currentBest) {
      shouldUpdate = true;
    } else if (game === 'flip_match') {
      shouldUpdate = (record as number) < (currentBest as number);
    } else {
      shouldUpdate = (record as number) > (currentBest as number);
    }
    if (shouldUpdate) {
      state.updateGameStats(game, { bestRecord: record });
    }
  },

  getTotalGamesPlayed: () => get().globalStats.totalGamesPlayed,
  getTotalPlayTime: () => get().globalStats.totalPlayTime,

  getFavoriteGame: () => {
    const games = Object.entries(get().globalStats.gamesStats) as [GameType, GameStats][];
    if (games.every(([, stats]) => stats.totalPlays === 0)) return null;
    return games.reduce((prev, current) => (current[1].totalPlays > prev[1].totalPlays ? current : prev))[0];
  },

  resetGame: () => set({ currentGame: null, isPlaying: false, isPaused: false }),
}));