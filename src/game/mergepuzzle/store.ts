import { create } from 'zustand';
import { Tile, GameStatus, GRID_SIZE, TARGET_NUMBER, MAX_MOVES, INITIAL_TILES } from './types';

interface MergePuzzleStore {
  tiles: Tile[];
  selectedTile: string | null;
  moves: number;
  maxMoves: number;
  gameStatus: GameStatus;
  targetNumber: number;

  initializeGame: () => void;
  selectTile: (tileId: string) => void;
  mergeTiles: () => void;
  resetGame: () => void;
}

// 랜덤 위치에 타일 생성
const generateRandomTile = (existingTiles: Tile[]): Tile => {
  const occupiedPositions = new Set(
    existingTiles.map(t => `${t.position.row},${t.position.col}`)
  );

  const availablePositions: { row: number; col: number }[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (!occupiedPositions.has(`${row},${col}`)) {
        availablePositions.push({ row, col });
      }
    }
  }

  if (availablePositions.length === 0) return null as any;

  const randomPos = availablePositions[Math.floor(Math.random() * availablePositions.length)];
  const value = Math.random() < 0.8 ? 2 : 4; // 80% 확률로 2, 20% 확률로 4

  return {
    id: `tile-${Date.now()}-${Math.random()}`,
    value,
    position: randomPos,
    isSelected: false,
    isMerged: false,
  };
};

// 초기 타일 생성
const createInitialTiles = (): Tile[] => {
  const tiles: Tile[] = [];
  for (let i = 0; i < INITIAL_TILES; i++) {
    const newTile = generateRandomTile(tiles);
    if (newTile) tiles.push(newTile);
  }
  return tiles;
};

export const useMergePuzzleStore = create<MergePuzzleStore>((set, get) => ({
  tiles: [],
  selectedTile: null,
  moves: 0,
  maxMoves: MAX_MOVES,
  gameStatus: 'ready',
  targetNumber: TARGET_NUMBER,

  initializeGame: () => {
    const tiles = createInitialTiles();
    set({
      tiles,
      selectedTile: null,
      moves: 0,
      gameStatus: 'playing',
    });
  },

  selectTile: (tileId) => {
    const state = get();
    if (state.gameStatus !== 'playing') return;

    const tile = state.tiles.find(t => t.id === tileId);
    if (!tile || tile.isMerged) return;

    // 이미 선택된 타일을 다시 클릭하면 선택 해제
    if (state.selectedTile === tileId) {
      set({
        tiles: state.tiles.map(t => ({ ...t, isSelected: false })),
        selectedTile: null,
      });
      return;
    }

    // 첫 번째 타일 선택
    if (!state.selectedTile) {
      set({
        tiles: state.tiles.map(t =>
          t.id === tileId ? { ...t, isSelected: true } : t
        ),
        selectedTile: tileId,
      });
      return;
    }

    // 두 번째 타일 선택 - 합치기 시도
    const firstTile = state.tiles.find(t => t.id === state.selectedTile);
    const secondTile = tile;

    if (firstTile && firstTile.value === secondTile.value) {
      get().mergeTiles();
    } else {
      // 값이 다르면 선택만 변경
      set({
        tiles: state.tiles.map(t => ({
          ...t,
          isSelected: t.id === tileId,
        })),
        selectedTile: tileId,
      });
    }
  },

  mergeTiles: () => {
    const state = get();
    const firstTile = state.tiles.find(t => t.id === state.selectedTile);
    if (!firstTile) return;

    const secondTile = state.tiles.find(t => t.isSelected && t.id !== state.selectedTile);
    if (!secondTile) return;

    const newValue = firstTile.value * 2;

    // 첫 번째 타일 위치에 새 값, 두 번째 타일 제거
    const updatedTiles = state.tiles
      .filter(t => t.id !== secondTile.id)
      .map(t =>
        t.id === firstTile.id
          ? { ...t, value: newValue, isSelected: false, isMerged: true }
          : t
      );

    // 새 타일 추가
    const newTile = generateRandomTile(updatedTiles);
    if (newTile) {
      updatedTiles.push(newTile);
    }

    const newMoves = state.moves + 1;

    // 승리 조건 체크
    const hasTarget = updatedTiles.some(t => t.value >= TARGET_NUMBER);
    // 패배 조건 체크 (이동 횟수 초과 또는 더 이상 합칠 수 없음)
    const canMerge = checkCanMerge(updatedTiles);
    const isLost = newMoves >= MAX_MOVES || (!canMerge && updatedTiles.length >= GRID_SIZE * GRID_SIZE);

    // 합쳐진 표시 리셋
    setTimeout(() => {
      set(state => ({
        tiles: state.tiles.map(t => ({ ...t, isMerged: false })),
      }));
    }, 300);

    set({
      tiles: updatedTiles,
      selectedTile: null,
      moves: newMoves,
      gameStatus: hasTarget ? 'won' : isLost ? 'lost' : 'playing',
    });
  },

  resetGame: () => {
    get().initializeGame();
  },
}));

// 합칠 수 있는 타일이 있는지 체크
const checkCanMerge = (tiles: Tile[]): boolean => {
  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[i].value === tiles[j].value) {
        return true;
      }
    }
  }
  return false;
};
