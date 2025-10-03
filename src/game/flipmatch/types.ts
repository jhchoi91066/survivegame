// 카드 인터페이스
export interface Card {
  id: string;
  value: string; // 이모지 또는 숫자
  isFlipped: boolean;
  isMatched: boolean;
}

// 난이도
export type Difficulty = 'easy' | 'medium' | 'hard';

// 난이도별 그리드 크기
export const GRID_SIZES: Record<Difficulty, { rows: number; cols: number }> = {
  easy: { rows: 4, cols: 4 }, // 16장 (8쌍)
  medium: { rows: 4, cols: 6 }, // 24장 (12쌍)
  hard: { rows: 4, cols: 8 }, // 32장 (16쌍)
};

// 게임 상태
export type GameStatus = 'ready' | 'playing' | 'paused' | 'won' | 'lost';

// 카드 테마 (이모지)
export const CARD_THEMES = {
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔'],
  fruits: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍑', '🍒', '🍍', '🥝', '🥭', '🍈', '🍏', '🥥'],
  sports: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥊', '🥋'],
};

// 게임 설정
export interface GameSettings {
  difficulty: Difficulty;
  theme: keyof typeof CARD_THEMES;
  timeLimit?: number; // 초 단위, undefined면 무제한
}
