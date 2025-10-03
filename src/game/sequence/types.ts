// 타일 인터페이스
export interface Tile {
  id: string;
  number: number;
  position: { x: number; y: number };
  isClicked: boolean;
  isCorrect: boolean;
  isWrong: boolean;
}

// 게임 상태
export type GameStatus = 'ready' | 'playing' | 'won' | 'lost';

// 게임 설정
export interface GameSettings {
  gridSize: number; // 5x5 그리드
  initialNumbers: number; // 시작 숫자 개수
}

// 기본 설정
export const DEFAULT_SETTINGS: GameSettings = {
  gridSize: 5,
  initialNumbers: 5,
};
