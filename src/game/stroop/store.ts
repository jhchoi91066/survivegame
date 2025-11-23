import { create } from 'zustand';
import { GameStatus, StroopProblem, Difficulty } from './types';

interface StroopStore {
  currentProblem: StroopProblem | null;
  score: number;
  timeRemaining: number;
  gameStatus: GameStatus;
  lives: number;
  difficulty: Difficulty;

  generateProblem: () => void;
  answerProblem: (answer: string) => void;
  decrementTime: () => void;
  startGame: (difficulty: Difficulty) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  resetGame: () => void;
}

const ALL_COLORS = {
  '빨강': '#ef4444', '파랑': '#3b82f6', '초록': '#10b981', '노랑': '#f59e0b',
  '보라': '#8b5cf6', '주황': '#f97316', '분홍': '#ec4899', '하늘': '#06b6d4'
};

const getColorsForDifficulty = (difficulty: Difficulty) => {
  const keys = Object.keys(ALL_COLORS);
  if (difficulty === 'easy') return keys.slice(0, 4); // 4 colors
  if (difficulty === 'medium') return keys.slice(0, 6); // 6 colors
  return keys; // 8 colors
};

const createProblem = (difficulty: Difficulty): StroopProblem => {
  const availableColors = getColorsForDifficulty(difficulty);

  let text = availableColors[Math.floor(Math.random() * availableColors.length)];
  let colorName = availableColors[Math.floor(Math.random() * availableColors.length)];

  // 텍스트와 색상이 같지 않도록 보장
  while (text === colorName) {
    colorName = availableColors[Math.floor(Math.random() * availableColors.length)];
  }

  const color = ALL_COLORS[colorName as keyof typeof ALL_COLORS];
  const correctAnswer = colorName;

  const options = new Set<string>([correctAnswer]);
  while (options.size < 4) {
    options.add(availableColors[Math.floor(Math.random() * availableColors.length)]);
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
  difficulty: 'medium',

  generateProblem: () => {
    const { difficulty } = get();
    set({ currentProblem: createProblem(difficulty) });
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

  startGame: (difficulty: Difficulty) => {
    let timeLimit = 45;

    switch (difficulty) {
      case 'easy':
        timeLimit = 60;
        break;
      case 'medium':
        timeLimit = 45;
        break;
      case 'hard':
        timeLimit = 30;
        break;
    }

    set({
      score: 0,
      timeRemaining: timeLimit,
      gameStatus: 'playing',
      lives: 3, // Always 3 lives
      difficulty
    });
    get().generateProblem();
  },

  pauseGame: () => {
    set({ gameStatus: 'paused' });
  },

  resumeGame: () => {
    set({ gameStatus: 'playing' });
  },

  resetGame: () => {
    set({ currentProblem: null, score: 0, timeRemaining: 30, gameStatus: 'ready', lives: 3 });
  },
}));
