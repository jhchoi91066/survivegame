export type OperationType = '+' | '-' | '×' | '÷';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Problem {
  id: number;
  text: string;
  correctAnswer: number;
  options: number[];
}

export type GameStatus = 'ready' | 'playing' | 'paused' | 'finished';

