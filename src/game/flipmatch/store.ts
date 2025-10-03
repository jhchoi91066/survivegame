import { create } from 'zustand';
import { Card, Difficulty, GameStatus, GameSettings, GRID_SIZES, CARD_THEMES } from './types';

interface FlipMatchStore {
  // 게임 상태
  cards: Card[];
  flippedCards: string[]; // 현재 뒤집힌 카드 ID들
  gameStatus: GameStatus;
  moves: number;
  matchedPairs: number;
  totalPairs: number;
  timeElapsed: number;
  settings: GameSettings;

  // 액션
  initializeGame: (settings: GameSettings) => void;
  flipCard: (cardId: string) => void;
  checkMatch: () => void;
  resetGame: () => void;
  setGameStatus: (status: GameStatus) => void;
  incrementTime: () => void;
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
  timeElapsed: 0,
  settings: {
    difficulty: 'easy',
    theme: 'animals',
  },

  // 게임 초기화
  initializeGame: (settings) => {
    const cards = createShuffledCards(settings);
    const totalPairs = cards.length / 2;

    set({
      cards,
      flippedCards: [],
      gameStatus: 'playing',
      moves: 0,
      matchedPairs: 0,
      totalPairs,
      timeElapsed: 0,
      settings,
    });
  },

  // 카드 뒤집기
  flipCard: (cardId) => {
    const state = get();

    // 게임이 진행중이 아니면 무시
    if (state.gameStatus !== 'playing') return;

    // 이미 2장이 뒤집혀있으면 무시
    if (state.flippedCards.length >= 2) return;

    // 해당 카드 찾기
    const card = state.cards.find((c) => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    // 카드 뒤집기
    const updatedCards = state.cards.map((c) =>
      c.id === cardId ? { ...c, isFlipped: true } : c
    );

    const newFlippedCards = [...state.flippedCards, cardId];

    set({
      cards: updatedCards,
      flippedCards: newFlippedCards,
    });

    // 2장이 뒤집혔으면 매칭 체크
    if (newFlippedCards.length === 2) {
      setTimeout(() => {
        get().checkMatch();
      }, 800);
    }
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

  // 시간 증가
  incrementTime: () => {
    set((state) => ({ timeElapsed: state.timeElapsed + 1 }));
  },
}));
