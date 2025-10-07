export type GameStatus = 'ready' | 'playing' | 'finished';

export type ShapeType = 'circle' | 'square' | 'triangle';

export interface OddOneOutProblem {
  items: GridItem[];
  oddItemIndex: number;
  difficulty: Difficulty;
}

export interface GridItem {
  id: string;
  shape: ShapeType;
  color: string;
  rotation: number;
}

export interface Difficulty {
  level: number;
  gridSize: number; // e.g., 3 for 3x3
  colorDifference: number; // RGB difference
  angleDifference: number; // Rotation difference
  sizeDifference: number; // Size multiplier difference
}

export interface GameState {
  gameStatus: GameStatus;
  score: number;
  timeRemaining: number; // For speed challenge mode
  currentProblem: OddOneOutProblem | null;
  difficulty: Difficulty;
  combo: number;
  lives?: number; // For survival mode
}
