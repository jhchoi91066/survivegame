import { create } from 'zustand';
import { GameStatus, StroopProblem } from './types';

interface StroopStore {
  currentProblem: StroopProblem | null;
  score: number;
  timeRemaining: number;
  gameStatus: GameStatus;
  lives: number;

  generateProblem: () => void;
  answerProblem: (answer: string) => void;
  decrementTime: () => void;
  startGame: () => void;
  resetGame: () => void;
}

const COLORS = { '빨강': '#ef4444', '파랑': '#3b82f6', '초록': '#10b981', '노랑': '#f59e0b' };
const COLOR_NAMES = Object.keys(COLORS);

const createProblem = (): StroopProblem => {
  let text = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
  let colorName = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];

  // 텍스트와 색상이 같지 않도록 보장
  while (text === colorName) {
    colorName = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
  }

  const color = COLORS[colorName as keyof typeof COLORS];
  const correctAnswer = colorName;

  const options = new Set<string>([correctAnswer]);
  while (options.size < 4) {
    options.add(COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)]);
  }

  const shuffledOptions = Array.from(options).sort(() => Math.random() - 0.5);

  return { text, color, correctAnswer, options: shuffledOptions };
};

export const useStroopStore = create<StroopStore>((set, get) => ({
  currentProblem: null,
  score: 0,
  timeRemaining: 30,
  gameStatus: 'ready',
  lives: 3,

  generateProblem: () => {
    set({ currentProblem: createProblem() });
  },

  answerProblem: (answer) => {
    const state = get();
    if (!state.currentProblem) return;

    if (answer === state.currentProblem.correctAnswer) {
      set({ score: state.score + 1 });
      state.generateProblem();
    } else {
      const newLives = state.lives - 1;
      set({ lives: newLives });
      if (newLives <= 0) {
        set({ gameStatus: 'finished' });
      } else {
        state.generateProblem();
      }
    }
  },

  decrementTime: () => {
    const state = get();
    if (state.timeRemaining <= 1) {
      set({ timeRemaining: 0, gameStatus: 'finished' });
    } else {
      set({ timeRemaining: state.timeRemaining - 1 });
    }
  },

  startGame: () => {
    set({ score: 0, timeRemaining: 30, gameStatus: 'playing', lives: 3 });
    get().generateProblem();
  },

  resetGame: () => {
    set({ currentProblem: null, score: 0, timeRemaining: 30, gameStatus: 'ready', lives: 3 });
  },
}));
