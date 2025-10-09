export type GameStatus = 'ready' | 'playing' | 'finished';

export interface StroopProblem {
  text: string;
  color: string;
  correctAnswer: string;
  options: string[];
}
