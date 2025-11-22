export type GameStatus = 'ready' | 'playing' | 'paused' | 'finished';

export interface StroopProblem {
  text: string;
  color: string;
  correctAnswer: string;
  options: string[];
}
