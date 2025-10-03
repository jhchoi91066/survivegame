import { create } from 'zustand';
import { GameType, GameState, GlobalStats, GameStats } from './types';

interface GameStore extends GameState {
  // 전역 통계
  globalStats: GlobalStats;

  // 액션
  setCurrentGame: (game: GameType | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setIsPaused: (isPaused: boolean) => void;

  // 통계 업데이트
  updateGameStats: (game: GameType, stats: Partial<GameStats>) => void;
  incrementTotalPlays: (game: GameType) => void;
  addPlayTime: (game: GameType, seconds: number) => void;
  updateBestRecord: (game: GameType, record: number | string) => void;

  // 전역 통계
  getTotalGamesPlayed: () => number;
  getTotalPlayTime: () => number;
  getFavoriteGame: () => GameType | null;

  // 초기화
  resetGame: () => void;
}

const initialGlobalStats: GlobalStats = {
  totalGamesPlayed: 0,
  totalPlayTime: 0,
  favoriteGame: null,
  achievementsUnlocked: 0,
  gamesStats: {
    flip_match: {
      totalPlays: 0,
      totalPlayTime: 0,
      bestRecord: 0,
      lastPlayed: 0,
    },
    sequence: {
      totalPlays: 0,
      totalPlayTime: 0,
      bestRecord: 0,
      lastPlayed: 0,
    },
    math_rush: {
      totalPlays: 0,
      totalPlayTime: 0,
      bestRecord: 0,
      lastPlayed: 0,
    },
    connect_flow: {
      totalPlays: 0,
      totalPlayTime: 0,
      bestRecord: 0,
      lastPlayed: 0,
    },
  },
};

export const useGameStore = create<GameStore>((set, get) => ({
  // 초기 상태
  currentGame: null,
  isPlaying: false,
  isPaused: false,
  globalStats: initialGlobalStats,

  // 게임 상태 설정
  setCurrentGame: (game) => set({ currentGame: game }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setIsPaused: (isPaused) => set({ isPaused }),

  // 통계 업데이트
  updateGameStats: (game, stats) => {
    set((state) => ({
      globalStats: {
        ...state.globalStats,
        gamesStats: {
          ...state.globalStats.gamesStats,
          [game]: {
            ...state.globalStats.gamesStats[game],
            ...stats,
          },
        },
      },
    }));
  },

  incrementTotalPlays: (game) => {
    const state = get();
    const currentStats = state.globalStats.gamesStats[game];
    state.updateGameStats(game, {
      totalPlays: currentStats.totalPlays + 1,
      lastPlayed: Date.now(),
    });

    // 전역 통계 업데이트
    set((state) => ({
      globalStats: {
        ...state.globalStats,
        totalGamesPlayed: state.globalStats.totalGamesPlayed + 1,
      },
    }));
  },

  addPlayTime: (game, seconds) => {
    const state = get();
    const currentStats = state.globalStats.gamesStats[game];
    state.updateGameStats(game, {
      totalPlayTime: currentStats.totalPlayTime + seconds,
    });

    // 전역 통계 업데이트
    set((state) => ({
      globalStats: {
        ...state.globalStats,
        totalPlayTime: state.globalStats.totalPlayTime + seconds,
      },
    }));
  },

  updateBestRecord: (game, record) => {
    const state = get();
    state.updateGameStats(game, {
      bestRecord: record,
    });
  },

  // 전역 통계 조회
  getTotalGamesPlayed: () => {
    return get().globalStats.totalGamesPlayed;
  },

  getTotalPlayTime: () => {
    return get().globalStats.totalPlayTime;
  },

  getFavoriteGame: () => {
    const state = get();
    const games = Object.entries(state.globalStats.gamesStats) as [GameType, GameStats][];

    if (games.every(([_, stats]) => stats.totalPlays === 0)) {
      return null;
    }

    const favorite = games.reduce((prev, current) => {
      return current[1].totalPlays > prev[1].totalPlays ? current : prev;
    });

    return favorite[0];
  },

  // 게임 초기화
  resetGame: () => {
    set({
      currentGame: null,
      isPlaying: false,
      isPaused: false,
    });
  },
}));
