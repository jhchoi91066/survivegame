import { create } from 'zustand';
import { Problem, Difficulty, GameStatus } from './types';

interface MathRushStore {
  currentProblem: Problem | null;
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
  answerProblem: (answer: number) => void;
  decrementTime: () => void; // Deprecated, use updateTimeRemaining
  updateTimeRemaining: () => void; // [H2] Date.now() based timer
  startGame: (difficulty: Difficulty) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  resetGame: () => void;
}

const generateProblem = (difficulty: Difficulty): Problem => {
  let num1: number, num2: number, answer: number;
  let operator: string;

  // Difficulty settings
  const isHard = difficulty === 'hard';
  const isMedium = difficulty === 'medium';

  // Decide operation based on difficulty
  const operations = ['+', '-'];
  if (isMedium || isHard) operations.push('×');
  if (isHard) operations.push('÷');

  operator = operations[Math.floor(Math.random() * operations.length)];

  // Generate numbers
  if (operator === '+') {
    num1 = Math.floor(Math.random() * (isHard ? 50 : 20)) + 1;
    num2 = Math.floor(Math.random() * (isHard ? 50 : 20)) + 1;
    answer = num1 + num2;
  } else if (operator === '-') {
    num1 = Math.floor(Math.random() * (isHard ? 50 : 20)) + 5;
    num2 = Math.floor(Math.random() * num1) + 1;
    answer = num1 - num2;
  } else if (operator === '×') {
    num1 = Math.floor(Math.random() * (isHard ? 12 : 9)) + 2;
    num2 = Math.floor(Math.random() * (isHard ? 12 : 9)) + 2;
    answer = num1 * num2;
  } else { // Division
    num2 = Math.floor(Math.random() * 9) + 2;
    answer = Math.floor(Math.random() * 9) + 2;
    num1 = num2 * answer;
  }

  // Generate options
  const options = new Set<number>();
  options.add(answer);

  while (options.size < 4) {
    const offset = Math.floor(Math.random() * 10) + 1;
    const wrongAnswer = Math.random() > 0.5 ? answer + offset : answer - offset;
    if (wrongAnswer >= 0) { // Avoid negative options unless the answer is negative (which shouldn't happen with current logic)
      options.add(wrongAnswer);
    }
  }

  return {
    id: Date.now(),
    text: `${num1} ${operator} ${num2} = ?`,
    correctAnswer: answer,
    options: Array.from(options).sort(() => Math.random() - 0.5)
  };
};

export const useMathRushStore = create<MathRushStore>((set, get) => ({
  currentProblem: null,
  score: 0,
  timeRemaining: 60,
  gameStatus: 'ready',
  lives: 3,
  difficulty: 'medium',
  // [H2] Timer accuracy fields
  gameStartTime: null,
  pausedAt: null,
  totalPausedTime: 0,
  timeLimit: 60,

  generateProblem: () => {
    const { difficulty } = get();
    const problem = generateProblem(difficulty);
    set({ currentProblem: problem });
  },

  answerProblem: (answer: number) => {
    const { currentProblem, score, lives } = get();
    if (!currentProblem) return;

    const isCorrect = answer === currentProblem.correctAnswer;

    if (isCorrect) {
      set({ score: score + 1 });
      get().generateProblem();
    } else {
      const newLives = lives - 1;
      set({ lives: newLives });
      if (newLives <= 0) {
        set({ gameStatus: 'finished' });
      } else {
        get().generateProblem();
      }
    }
  },

  decrementTime: () => {
    const { timeRemaining, gameStatus } = get();
    if (gameStatus !== 'playing') return;

    if (timeRemaining > 0) {
      set({ timeRemaining: timeRemaining - 1 });
    } else {
      set({ gameStatus: 'finished' });
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
    const timeLimit = difficulty === 'easy' ? 60 : difficulty === 'medium' ? 45 : 30;
    set({
      score: 0,
      lives: 3,
      timeRemaining: timeLimit,
      timeLimit,
      gameStatus: 'playing',
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
      timeRemaining: 60,
      gameStatus: 'ready',
      lives: 3,
      // [H2] Reset timer tracking
      gameStartTime: null,
      pausedAt: null,
      totalPausedTime: 0,
      timeLimit: 60,
    });
  },
}));
