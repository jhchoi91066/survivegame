import { create } from 'zustand';
import { Question, OperationType, GameStatus } from './types';

interface MathRushStore {
  currentQuestion: Question | null;
  score: number;
  combo: number;
  highestCombo: number;
  timeRemaining: number;
  totalTime: number;
  gameStatus: GameStatus;
  lives: number;

  generateQuestion: (score: number) => void;
  answerQuestion: (answer: number) => void;
  decrementTime: () => void;
  startGame: () => void;
  resetGame: () => void;
}

const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const createQuestion = (score: number): Question => {
  let num1: number, num2: number, correctAnswer: number;
  let operation: OperationType;

  if (score <= 4) {
    // 0-4점: 한 자릿수 덧셈/뺄셈
    operation = Math.random() > 0.5 ? '+' : '-';
    if (operation === '+') {
      num1 = randomInt(1, 9);
      num2 = randomInt(1, 9);
      correctAnswer = num1 + num2;
    } else {
      num1 = randomInt(5, 9);
      num2 = randomInt(1, num1 - 1);
      correctAnswer = num1 - num2;
    }
  } else if (score <= 9) {
    // 5-9점: 두 자릿수 덧셈/뺄셈
    operation = Math.random() > 0.5 ? '+' : '-';
    if (operation === '+') {
      num1 = randomInt(10, 50);
      num2 = randomInt(10, 50);
      correctAnswer = num1 + num2;
    } else {
      num1 = randomInt(20, 99);
      num2 = randomInt(10, num1 - 1);
      correctAnswer = num1 - num2;
    }
  } else if (score <= 14) {
    // 10-14점: 한 자릿수 곱셈, 간단한 나눗셈
    operation = Math.random() > 0.5 ? '×' : '÷';
    if (operation === '×') {
      num1 = randomInt(2, 9);
      num2 = randomInt(2, 9);
      correctAnswer = num1 * num2;
    } else {
      num2 = randomInt(2, 9);
      correctAnswer = randomInt(2, 9);
      num1 = num2 * correctAnswer;
    }
  } else {
    // 15점 이상: 두 자릿수 곱셈, 복잡한 나눗셈
    operation = Math.random() > 0.5 ? '×' : '÷';
    if (operation === '×') {
      num1 = randomInt(10, 25);
      num2 = randomInt(10, 25);
      correctAnswer = num1 * num2;
    } else {
      num2 = randomInt(2, 15);
      correctAnswer = randomInt(2, 15);
      num1 = num2 * correctAnswer;
    }
  }

  const wrongAnswers = new Set<number>();
  while (wrongAnswers.size < 3) {
    const offset = randomInt(-10, 10) || 1;
    const wrong = correctAnswer + offset;
    if (wrong !== correctAnswer) {
      wrongAnswers.add(wrong);
    }
  }

  const options = [correctAnswer, ...Array.from(wrongAnswers)];
  const shuffledOptions = options.sort(() => Math.random() - 0.5);

  return {
    num1,
    num2,
    operation,
    correctAnswer,
    options: shuffledOptions,
  };
};

export const useMathRushStore = create<MathRushStore>((set, get) => ({
  currentQuestion: null,
  score: 0,
  combo: 0,
  highestCombo: 0,
  timeRemaining: 30,
  totalTime: 30,
  gameStatus: 'ready',
  lives: 3,

  generateQuestion: (score) => {
    const question = createQuestion(score);
    set({ currentQuestion: question });
  },

  answerQuestion: (answer) => {
    const state = get();
    if (!state.currentQuestion) return;

    const isCorrect = answer === state.currentQuestion.correctAnswer;

    if (isCorrect) {
      const newCombo = state.combo + 1;
      const newScore = state.score + 1;

      set({
        score: newScore,
        combo: newCombo,
        highestCombo: Math.max(state.highestCombo, newCombo),
      });

      get().generateQuestion(newScore);
    } else {
      const newLives = state.lives - 1;
      set({
        lives: newLives,
        combo: 0, // 콤보 초기화
        gameStatus: newLives > 0 ? 'playing' : 'finished',
      });

      if (newLives > 0) {
        get().generateQuestion(state.score);
      }
    }
  },

  decrementTime: () => {
    const state = get();
    const newTime = state.timeRemaining - 1;

    if (newTime < 0) {
      set({
        timeRemaining: 0,
        gameStatus: 'finished',
      });
    } else {
      set({ timeRemaining: newTime });
    }
  },

  startGame: () => {
    set({
      score: 0,
      combo: 0,
      highestCombo: 0,
      timeRemaining: 30,
      gameStatus: 'playing',
      lives: 3,
    });
    get().generateQuestion(0);
  },

  resetGame: () => {
    set({
      currentQuestion: null,
      score: 0,
      combo: 0,
      highestCombo: 0,
      timeRemaining: 30,
      gameStatus: 'ready',
      lives: 3,
    });
  },
}));
