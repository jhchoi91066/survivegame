import { create } from 'zustand';
import { Card, Difficulty, GameStatus, GameSettings, GRID_SIZES, CARD_THEMES } from './types';

// 난이도별 제한 시간 (초)
const TIME_LIMITS: Record<Difficulty, number> = {
  easy: 120,   // 2분 (4x4 = 8쌍)
  medium: 90,  // 1분 30초 (4x6 = 12쌍)
  hard: 60,    // 1분 (4x8 = 16쌍)
};

// 난이도별 미리보기 시간 (밀리초)
const PREVIEW_TIMES: Record<Difficulty, number> = {
  easy: 2500,    // 2.5초
  medium: 2500,  // 2.5초
  hard: 2500,    // 2.5초
};

interface FlipMatchStore {
  // 게임 상태
  cards: Card[];
  flippedCards: string[]; // 현재 뒤집힌 카드 ID들
  gameStatus: GameStatus;
  moves: number;
  matchedPairs: number;
  totalPairs: number;
  timeRemaining: number; // 카운트다운으로 변경
  settings: GameSettings;

  // 액션
  initializeGame: (settings: GameSettings) => void;
  flipCard: (cardId: string) => void;
  checkMatch: () => void;
  resetGame: () => void;
  setGameStatus: (status: GameStatus) => void;
  decrementTime: () => void; // incrementTime -> decrementTime
}

// 카드 배열 생성 및 셔플
const createShuffledCards = (settings: GameSettings): Card[] => {
  const { rows, cols } = GRID_SIZES[settings.difficulty];
  const totalCards = rows * cols;
  const pairsNeeded = totalCards / 2;

  const theme = CARD_THEMES[settings.theme];
  const values = theme.slice(0, pairsNeeded);

  // 각 값을 2번씩 (쌍 만들기)
  const cardValues = [...values, ...values];

  // 셔플
  const shuffled = cardValues.sort(() => Math.random() - 0.5);

  // Card 객체로 변환
  return shuffled.map((value, index) => ({
    id: `card-${index}`,
    value,
    isFlipped: false,
    isMatched: false,
  }));
};

export const useFlipMatchStore = create<FlipMatchStore>((set, get) => ({
  // 초기 상태
  cards: [],
  flippedCards: [],
  gameStatus: 'ready',
  moves: 0,
  matchedPairs: 0,
  totalPairs: 0,
  timeRemaining: 0,
  settings: {
    difficulty: 'easy',
    theme: 'animals',
  },

  // 게임 초기화
  initializeGame: (settings) => {
    const cards = createShuffledCards(settings);
    const totalPairs = cards.length / 2;
    const timeLimit = TIME_LIMITS[settings.difficulty];

    // 모든 카드를 뒤집은 상태로 시작 (미리보기)
    const previewCards = cards.map(c => ({ ...c, isFlipped: true }));

    set({
      cards: previewCards,
      flippedCards: [],
      gameStatus: 'preview', // 미리보기 상태
      moves: 0,
      matchedPairs: 0,
      totalPairs,
      timeRemaining: timeLimit,
      settings,
    });

    // 난이도별 시간 후 카드 뒤집기
    setTimeout(() => {
      const hiddenCards = cards.map(c => ({ ...c, isFlipped: false }));
      set({
        cards: hiddenCards,
        gameStatus: 'playing',
      });
    }, PREVIEW_TIMES[settings.difficulty]);
  },

  // 카드 뒤집기
  flipCard: (cardId) => {
    // [C7] Race condition 방지를 위해 set 함수 내에서 상태 체크
    set((state) => {
      // 게임이 진행중이 아니면 무시
      if (state.gameStatus !== 'playing') return state;

      // [C7] 이미 2장이 뒤집혀있으면 무시 (최신 상태 기준)
      if (state.flippedCards.length >= 2) return state;

      // 해당 카드 찾기
      const card = state.cards.find((c) => c.id === cardId);
      if (!card || card.isFlipped || card.isMatched) return state;

      // 카드 뒤집기
      const updatedCards = state.cards.map((c) =>
        c.id === cardId ? { ...c, isFlipped: true } : c
      );

      const newFlippedCards = [...state.flippedCards, cardId];

      // 2장이 뒤집혔으면 매칭 체크 예약
      if (newFlippedCards.length === 2) {
        setTimeout(() => {
          const currentState = get();
          // [C7] setTimeout 실행 시점에도 여전히 2장인지 재확인
          if (currentState.flippedCards.length === 2) {
            get().checkMatch();
          }
        }, 800);
      }

      return {
        ...state,
        cards: updatedCards,
        flippedCards: newFlippedCards,
      };
    });
  },

  // 매칭 체크
  checkMatch: () => {
    const state = get();
    const [firstId, secondId] = state.flippedCards;

    const firstCard = state.cards.find((c) => c.id === firstId);
    const secondCard = state.cards.find((c) => c.id === secondId);

    if (!firstCard || !secondCard) return;

    const isMatch = firstCard.value === secondCard.value;

    if (isMatch) {
      // 매칭 성공
      const updatedCards = state.cards.map((c) =>
        c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c
      );

      const newMatchedPairs = state.matchedPairs + 1;
      const gameWon = newMatchedPairs === state.totalPairs;

      set({
        cards: updatedCards,
        flippedCards: [],
        moves: state.moves + 1,
        matchedPairs: newMatchedPairs,
        gameStatus: gameWon ? 'won' : 'playing',
      });
    } else {
      // 매칭 실패 - 카드 다시 뒤집기
      const updatedCards = state.cards.map((c) =>
        c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c
      );

      set({
        cards: updatedCards,
        flippedCards: [],
        moves: state.moves + 1,
      });
    }
  },

  // 게임 리셋
  resetGame: () => {
    const settings = get().settings;
    get().initializeGame(settings);
  },

  // 게임 상태 설정
  setGameStatus: (status) => {
    set({ gameStatus: status });
  },

  // 시간 감소 (카운트다운)
  decrementTime: () => {
    const state = get();
    const newTime = state.timeRemaining - 1;

    if (newTime <= 0) {
      // 시간 초과 - 게임 오버
      set({
        timeRemaining: 0,
        gameStatus: 'lost'
      });
    } else {
      set({ timeRemaining: newTime });
    }
  },
}));
