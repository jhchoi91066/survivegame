// 문제 타입
export type OperationType = '+' | '-' | '×' | '÷';

// 문제 인터페이스
export interface Question {
  num1: number;
  num2: number;
  operation: OperationType;
  correctAnswer: number;
  options: number[]; // 4지선다 옵션
}

// 게임 상태
export type GameStatus = 'ready' | 'playing' | 'finished';

// 난이도별 숫자 범위
export const DIFFICULTY_RANGES = {
  easy: { min: 1, max: 10 },
  medium: { min: 1, max: 20 },
  hard: { min: 1, max: 50 },
};
