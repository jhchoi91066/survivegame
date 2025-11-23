export type GameStatus = 'ready' | 'playing' | 'paused' | 'finished';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface StroopProblem {
  text: string;
  color: string;
  correctAnswer: string;
  options: string[];
}
