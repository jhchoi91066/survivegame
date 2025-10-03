import { create } from 'zustand';
import { Tile, GameStatus, GameSettings, DEFAULT_SETTINGS } from './types';

interface SequenceStore {
  tiles: Tile[];
  currentNumber: number; // 다음에 클릭해야 할 숫자
  level: number;
  mistakes: number;
  maxMistakes: number;
  gameStatus: GameStatus;
  settings: GameSettings;
  levelStartTime: number; // 레벨 시작 시간
  levelTime: number; // 현재 레벨 소요 시간 (초)
  bestLevelTime: number; // 현재 레벨 최고 기록
  difficulty: 'easy' | 'normal' | 'hard';

  initializeGame: (level?: number, difficulty?: 'easy' | 'normal' | 'hard') => void;
  clickTile: (tileId: string) => void;
  nextLevel: () => void;
  resetGame: () => void;
  setGameStatus: (status: GameStatus) => void;
  updateLevelTime: () => void;
  setBestLevelTime: (time: number) => void;
}

// 랜덤 타일 생성
const generateTiles = (count: number, gridSize: number): Tile[] => {
  const tiles: Tile[] = [];
  const positions: { x: number; y: number }[] = [];

  // 모든 가능한 위치 생성
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      positions.push({ x, y });
    }
  }

  // 위치 섞기
  const shuffledPositions = positions.sort(() => Math.random() - 0.5);

  // 타일 생성
  for (let i = 0; i < count; i++) {
    tiles.push({
      id: `tile-${i}`,
      number: i + 1,
      position: shuffledPositions[i],
      isClicked: false,
      isCorrect: false,
      isWrong: false,
    });
  }

  return tiles;
};

export const useSequenceStore = create<SequenceStore>((set, get) => ({
  tiles: [],
  currentNumber: 1,
  level: 1,
  mistakes: 0,
  maxMistakes: 3,
  gameStatus: 'ready',
  settings: DEFAULT_SETTINGS,
  levelStartTime: 0,
  levelTime: 0,
  bestLevelTime: 0,
  difficulty: 'normal',

  initializeGame: (level = 1, difficulty = 'normal') => {
    // 난이도별 타일 개수 조정
    const baseCount = difficulty === 'easy' ? 3 : difficulty === 'normal' ? 5 : 7;
    const tileCount = baseCount + (level - 1) * 2;
    const tiles = generateTiles(tileCount, DEFAULT_SETTINGS.gridSize);

    set({
      tiles,
      currentNumber: 1,
      level,
      mistakes: 0,
      gameStatus: 'playing',
      levelStartTime: Date.now(),
      levelTime: 0,
      difficulty,
    });
  },

  clickTile: (tileId) => {
    const state = get();
    if (state.gameStatus !== 'playing') return;

    const tile = state.tiles.find((t) => t.id === tileId);
    if (!tile || tile.isClicked) return;

    // 올바른 순서인지 체크
    if (tile.number === state.currentNumber) {
      // 정답
      const updatedTiles = state.tiles.map((t) =>
        t.id === tileId
          ? { ...t, isClicked: true, isCorrect: true }
          : t
      );

      const allClicked = updatedTiles.every((t) => t.isClicked);

      set({
        tiles: updatedTiles,
        currentNumber: state.currentNumber + 1,
        gameStatus: allClicked ? 'won' : 'playing',
      });
    } else {
      // 오답
      const updatedTiles = state.tiles.map((t) =>
        t.id === tileId ? { ...t, isWrong: true } : t
      );

      const newMistakes = state.mistakes + 1;

      set({
        tiles: updatedTiles,
        mistakes: newMistakes,
        gameStatus: newMistakes >= state.maxMistakes ? 'lost' : 'playing',
      });

      // 0.5초 후 오답 표시 제거
      setTimeout(() => {
        const currentTiles = get().tiles;
        const resetTiles = currentTiles.map((t) =>
          t.id === tileId ? { ...t, isWrong: false } : t
        );
        set({ tiles: resetTiles });
      }, 500);
    }
  },

  nextLevel: () => {
    const state = get();
    const nextLevel = state.level + 1;
    get().initializeGame(nextLevel, state.difficulty);
  },

  resetGame: () => {
    const difficulty = get().difficulty;
    get().initializeGame(1, difficulty);
  },

  setGameStatus: (status) => {
    set({ gameStatus: status });
  },

  updateLevelTime: () => {
    const state = get();
    if (state.gameStatus === 'playing') {
      const elapsed = (Date.now() - state.levelStartTime) / 1000; // 밀리초를 초로 변환
      set({ levelTime: elapsed });
    }
  },

  setBestLevelTime: (time) => {
    set({ bestLevelTime: time });
  },
}));
