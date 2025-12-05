import { create } from 'zustand';
import { GameStatus, StroopProblem, Difficulty } from './types';

interface StroopStore {
  currentProblem: StroopProblem | null;
  score: number;
  timeRemaining: number;
  gameStatus: GameStatus;
  lives: number;
  difficulty: Difficulty;
  // [H2] Timer accuracy improvement
  gameStartTime: number | null;
  pausedAt: number | null;
  totalPausedTime: number;
  timeLimit: number;

  generateProblem: () => void;
  answerProblem: (answer: string) => void;
  decrementTime: () => void; // Deprecated, use updateTimeRemaining
  updateTimeRemaining: () => void; // [H2] Date.now() based timer
  startGame: (difficulty: Difficulty) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  resetGame: () => void;
  setGameStatus: (status: GameStatus) => void;
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
  // [H2] Timer accuracy fields
  gameStartTime: null,
  pausedAt: null,
  totalPausedTime: 0,
  timeLimit: 30,

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

  // [H2] Date.now() based accurate timer
  updateTimeRemaining: () => {
    const { gameStartTime, totalPausedTime, timeLimit, gameStatus } = get();
    if (gameStatus !== 'playing' || !gameStartTime) return;

    const elapsed = Math.floor((Date.now() - gameStartTime - totalPausedTime) / 1000);
    const remaining = Math.max(0, timeLimit - elapsed);

    set({ timeRemaining: remaining });

    if (remaining <= 0) {
      set({ gameStatus: 'finished' });
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
      timeLimit,
      gameStatus: 'playing',
      lives: 3, // Always 3 lives
      difficulty,
      // [H2] Initialize timer tracking
      gameStartTime: Date.now(),
      pausedAt: null,
      totalPausedTime: 0,
    });
    get().generateProblem();
  },

  pauseGame: () => {
    set({ gameStatus: 'paused', pausedAt: Date.now() });
  },

  resumeGame: () => {
    const { pausedAt, totalPausedTime } = get();
    if (pausedAt) {
      const pauseDuration = Date.now() - pausedAt;
      set({
        gameStatus: 'playing',
        pausedAt: null,
        totalPausedTime: totalPausedTime + pauseDuration,
      });
    }
  },

  resetGame: () => {
    set({
      currentProblem: null,
      score: 0,
      timeRemaining: 30,
      gameStatus: 'ready',
      lives: 3,
      // [H2] Reset timer tracking
      gameStartTime: null,
      pausedAt: null,
      totalPausedTime: 0,
      timeLimit: 30,
    });
  },

  setGameStatus: (status: GameStatus) => {
    set({ gameStatus: status });
  },
}));
