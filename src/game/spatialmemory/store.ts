import { create } from 'zustand';
import { Tile, Difficulty, GameStatus, GameSettings, GRID_SIZES, DEFAULT_SETTINGS } from './types';

interface SpatialMemoryStore {
  // 게임 상태
  tiles: Tile[];
  sequence: number[]; // 보여줄 순서 (타일 ID들)
  userInput: number[]; // 사용자가 입력한 순서
  currentLevel: number; // 현재 레벨 (시퀀스 길이)
  gameStatus: GameStatus;
  settings: GameSettings;
  currentFlashIndex: number; // 현재 깜빡이는 인덱스
  totalRounds: number; // 총 라운드 수
  accuracy: number; // 정확도 (%)
  activeTimers: ReturnType<typeof setInterval>[]; // [C6] 메모리 누수 방지용

  // 액션
  initializeGame: (settings: GameSettings) => void;
  startRound: () => void;
  handleTilePress: (tileId: number) => void;
  resetGame: () => void;
  setGameStatus: (status: GameStatus) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  cleanup: () => void; // [C6] 타이머 정리 함수
}

// 타일 생성
const createTiles = (difficulty: Difficulty): Tile[] => {
  const { rows, cols } = GRID_SIZES[difficulty];
  const totalTiles = rows * cols;

  return Array.from({ length: totalTiles }, (_, index) => ({
    id: index,
    isActive: false,
    isHighlighted: false,
  }));
};

// 랜덤 시퀀스 생성
const generateSequence = (length: number, maxTileId: number): number[] => {
  const sequence: number[] = [];
  for (let i = 0; i < length; i++) {
    sequence.push(Math.floor(Math.random() * maxTileId));
  }
  return sequence;
};

export const useSpatialMemoryStore = create<SpatialMemoryStore>((set, get) => ({
  // 초기 상태
  tiles: [],
  sequence: [],
  userInput: [],
  currentLevel: 1,
  gameStatus: 'ready',
  settings: DEFAULT_SETTINGS.easy,
  currentFlashIndex: 0,
  totalRounds: 0,
  accuracy: 100,
  activeTimers: [], // [C6] 타이머 배열 초기화

  // 게임 초기화
  initializeGame: (settings) => {
    const tiles = createTiles(settings.difficulty);

    set({
      tiles,
      sequence: [],
      userInput: [],
      currentLevel: settings.startingLevel,
      gameStatus: 'ready',
      settings,
      currentFlashIndex: 0,
      totalRounds: 0,
      accuracy: 100,
    });
  },

  // 라운드 시작 (시퀀스 보여주기)
  startRound: () => {
    const state = get();

    // [C6] 이전 타이머 정리
    state.cleanup();

    const tiles = createTiles(state.settings.difficulty);
    const sequence = generateSequence(state.currentLevel, tiles.length);

    set({
      tiles,
      sequence,
      userInput: [],
      gameStatus: 'showing',
      currentFlashIndex: 0,
    });

    // 시퀀스 보여주기
    let flashIndex = 0;
    const flashInterval = setInterval(() => {
      const state = get();

      if (flashIndex >= sequence.length) {
        // 모든 시퀀스를 보여줬으면 입력 대기
        clearInterval(flashInterval);
        set({
          gameStatus: 'input',
          tiles: createTiles(state.settings.difficulty),
        });
        return;
      }

      // 현재 타일 깜빡이기
      const tileId = sequence[flashIndex];
      const updatedTiles = state.tiles.map((tile) =>
        tile.id === tileId ? { ...tile, isActive: true } : { ...tile, isActive: false }
      );

      set({ tiles: updatedTiles, currentFlashIndex: flashIndex });

      // 깜빡임 해제
      setTimeout(() => {
        const state = get();
        const resetTiles = state.tiles.map((tile) => ({ ...tile, isActive: false }));
        set({ tiles: resetTiles });
      }, state.settings.flashSpeed / 2);

      flashIndex++;
    }, state.settings.flashSpeed);

    // [C6] 타이머 ID 저장
    set((s) => ({ activeTimers: [...s.activeTimers, flashInterval] }));
  },

  // 타일 클릭 처리
  handleTilePress: (tileId) => {
    const state = get();

    // 입력 상태가 아니면 무시
    if (state.gameStatus !== 'input') return;

    const newUserInput = [...state.userInput, tileId];
    const currentIndex = newUserInput.length - 1;

    // 현재 입력이 정답과 일치하는지 확인
    const isCorrect = state.sequence[currentIndex] === tileId;

    // 타일 하이라이트
    const updatedTiles = state.tiles.map((tile) =>
      tile.id === tileId ? { ...tile, isHighlighted: true } : tile
    );

    set({ tiles: updatedTiles, userInput: newUserInput });

    // 하이라이트 해제
    setTimeout(() => {
      const state = get();
      const resetTiles = state.tiles.map((tile) => ({ ...tile, isHighlighted: false }));
      set({ tiles: resetTiles });
    }, 200);

    if (!isCorrect) {
      // 틀렸을 때 - 게임 오버
      set({
        gameStatus: 'wrong',
        totalRounds: state.totalRounds + 1,
      });

      setTimeout(() => {
        set({ gameStatus: 'gameover' });
      }, 1000);
      return;
    }

    // 모든 시퀀스를 맞췄는지 확인
    if (newUserInput.length === state.sequence.length) {
      // 정답! 다음 레벨로
      const newLevel = state.currentLevel + 1;
      const newTotalRounds = state.totalRounds + 1;
      const newAccuracy = (newLevel / (newLevel + 1)) * 100;

      set({
        gameStatus: 'correct',
        currentLevel: newLevel,
        totalRounds: newTotalRounds,
        accuracy: newAccuracy,
      });

      // 잠시 후 다음 라운드 시작
      setTimeout(() => {
        get().startRound();
      }, 1000);
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

  pauseGame: () => {
    set({ gameStatus: 'paused' });
  },

  resumeGame: () => {
    // We only allow pausing during 'input' phase, so we resume to 'input'
    set({ gameStatus: 'input' });
  },

  // [C6] 모든 활성 타이머 정리
  cleanup: () => {
    const { activeTimers } = get();
    activeTimers.forEach(timer => clearInterval(timer));
    set({ activeTimers: [] });
  },
}));
