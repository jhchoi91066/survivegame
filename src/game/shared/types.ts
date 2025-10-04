// 게임 타입 정의
export type GameType = 'flip_match' | 'sequence' | 'math_rush' | 'merge_puzzle';

// 게임 통계 인터페이스
export interface GameStats {
  totalPlays: number;
  totalPlayTime: number; // 초 단위
  bestRecord: number | string; // 게임마다 다름 (시간, 레벨, 점수 등)
  lastPlayed: number; // timestamp
}

// 게임별 기록
export interface GameRecord {
  flip_match: {
    bestTime: number; // 초
    difficulty: 'easy' | 'medium' | 'hard';
    totalPlays: number;
    totalPlayTime: number; // 초
  };
  sequence: {
    highestLevel: number;
    totalPlays: number;
    totalPlayTime: number; // 초
  };
  math_rush: {
    highScore: number;
    highestCombo: number;
    totalPlays: number;
    totalPlayTime: number; // 초
  };
  merge_puzzle: {
    bestMoves: number;
    highestNumber: number;
    totalPlays: number;
    totalPlayTime: number; // 초
  };
}

// 통합 통계
export interface GlobalStats {
  totalGamesPlayed: number;
  totalPlayTime: number;
  favoriteGame: GameType | null;
  achievementsUnlocked: number;
  gamesStats: {
    [key in GameType]: GameStats;
  };
}

// 게임 상태
export interface GameState {
  currentGame: GameType | null;
  isPlaying: boolean;
  isPaused: boolean;
}

// 게임 정보 (메뉴 표시용)
export interface GameInfo {
  id: GameType;
  name: string;
  emoji: string;
  description: string;
  bestRecordLabel: string;
  bestRecordValue: string | number;
}
