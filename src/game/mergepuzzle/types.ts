// 타일 인터페이스
export interface Tile {
  id: string;
  value: number; // 2, 4, 8, 16, 32, 64, 128
  position: { row: number; col: number };
  isSelected: boolean;
  isMerged: boolean;
}

// 게임 상태
export type GameStatus = 'ready' | 'playing' | 'won' | 'lost';

// 게임 설정
export const GRID_SIZE = 3;
export const TARGET_NUMBER = 64;
export const MAX_MOVES = 20;
export const INITIAL_TILES = 4;
