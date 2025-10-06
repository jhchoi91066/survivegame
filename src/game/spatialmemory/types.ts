// 타일 인터페이스
export interface Tile {
  id: number;
  isActive: boolean; // 현재 깜빡이는 중
  isHighlighted: boolean; // 사용자가 터치한 타일
}

// 난이도
export type Difficulty = 'easy' | 'medium' | 'hard';

// 난이도별 그리드 크기
export const GRID_SIZES: Record<Difficulty, { rows: number; cols: number }> = {
  easy: { rows: 3, cols: 3 }, // 3x3 그리드
  medium: { rows: 4, cols: 4 }, // 4x4 그리드
  hard: { rows: 5, cols: 5 }, // 5x5 그리드
};

// 게임 상태
export type GameStatus = 'ready' | 'showing' | 'input' | 'correct' | 'wrong' | 'gameover';

// 게임 설정
export interface GameSettings {
  difficulty: Difficulty;
  flashSpeed: number; // 각 타일 깜빡이는 속도 (ms)
  startingLevel: number; // 시작 레벨 (타일 개수)
}

// 난이도별 기본 설정
export const DEFAULT_SETTINGS: Record<Difficulty, GameSettings> = {
  easy: {
    difficulty: 'easy',
    flashSpeed: 600,
    startingLevel: 3,
  },
  medium: {
    difficulty: 'medium',
    flashSpeed: 500,
    startingLevel: 3,
  },
  hard: {
    difficulty: 'hard',
    flashSpeed: 400,
    startingLevel: 4,
  },
};
