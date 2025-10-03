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

  generateQuestion: () => void;
  answerQuestion: (answer: number) => void;
  decrementTime: () => void;
  startGame: () => void;
  resetGame: () => void;
}

// 랜덤 숫자 생성
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// 문제 생성
const createQuestion = (): Question => {
  const operations: OperationType[] = ['+', '-', '×'];
  const operation = operations[randomInt(0, operations.length - 1)];

  let num1: number, num2: number, correctAnswer: number;

  switch (operation) {
    case '+':
      num1 = randomInt(1, 50);
      num2 = randomInt(1, 50);
      correctAnswer = num1 + num2;
      break;
    case '-':
      num1 = randomInt(10, 50);
      num2 = randomInt(1, num1 - 1);
      correctAnswer = num1 - num2;
      break;
    case '×':
      num1 = randomInt(1, 12);
      num2 = randomInt(1, 12);
      correctAnswer = num1 * num2;
      break;
  }

  // 오답 옵션 생성
  const wrongAnswers = new Set<number>();
  while (wrongAnswers.size < 3) {
    const offset = randomInt(-10, 10);
    const wrong = correctAnswer + offset;
    if (wrong !== correctAnswer && wrong > 0) {
      wrongAnswers.add(wrong);
    }
  }

  const options = [correctAnswer, ...Array.from(wrongAnswers)];
  // 옵션 섞기
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

  generateQuestion: () => {
    const question = createQuestion();
    set({ currentQuestion: question });
  },

  answerQuestion: (answer) => {
    const state = get();
    if (!state.currentQuestion) return;

    const isCorrect = answer === state.currentQuestion.correctAnswer;

    if (isCorrect) {
      const newCombo = state.combo + 1;
      const points = state.score + 1; // 1점씩 증가

      set({
        score: points,
        combo: newCombo,
        highestCombo: Math.max(state.highestCombo, newCombo),
      });

      // 다음 문제
      get().generateQuestion();
    } else {
      // 오답 시 즉시 게임 종료
      set({
        gameStatus: 'finished',
      });
    }
  },

  decrementTime: () => {
    const state = get();
    const newTime = state.timeRemaining - 1;

    if (newTime <= 0) {
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
    });
    get().generateQuestion();
  },

  resetGame: () => {
    set({
      currentQuestion: null,
      score: 0,
      combo: 0,
      highestCombo: 0,
      timeRemaining: 30,
      gameStatus: 'ready',
    });
  },
}));
