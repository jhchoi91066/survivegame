import { create } from 'zustand';

export interface SurvivorState {
  id: string;
  x: number;
  y: number;
}

// Helper functions
const isAdjacent = (x1: number, y1: number, x2: number, y2: number): boolean => {
  const dx = Math.abs(x1 - x2);
  const dy = Math.abs(y1 - y2);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
};

const isValidPosition = (x: number, y: number): boolean => {
  return x >= 0 && x < 5 && y >= 0 && y < 5;
};

const isPositionOccupied = (x: number, y: number, survivors: SurvivorState[]): boolean => {
  return survivors.some(survivor => survivor.x === x && survivor.y === y);
};

interface GameState {
  survivors: SurvivorState[];
  selectedSurvivorId: string | null;
  turn: number;
  movedSurvivorIds: string[];
  selectSurvivor: (id: string | null) => void;
  moveSurvivor: (id: string, x: number, y: number) => void;
  nextTurn: () => void;
  getValidMoves: (survivorId: string) => {x: number; y: number}[];
}

export const useGameStore = create<GameState>((set) => ({
  survivors: [
    { id: 'survivor-1', x: 0, y: 0 },
    { id: 'survivor-2', x: 4, y: 4 },
  ],
  selectedSurvivorId: null,
  turn: 1,
  movedSurvivorIds: [],
  selectSurvivor: (id) =>
    set((state) => {
      if (id && state.movedSurvivorIds.includes(id)) {
        return {}; // Do not select if already moved
      }
      return { selectedSurvivorId: id };
    }),
  moveSurvivor: (id, x, y) =>
    set((state) => {
      const survivor = state.survivors.find(s => s.id === id);
      if (!survivor) return state;

      // Check if move is valid
      if (!isValidPosition(x, y)) return state;
      if (!isAdjacent(survivor.x, survivor.y, x, y)) return state;
      if (isPositionOccupied(x, y, state.survivors)) return state;

      return {
        survivors: state.survivors.map((s) =>
          s.id === id ? { ...s, x, y } : s
        ),
        selectedSurvivorId: null, // Deselect after moving
        movedSurvivorIds: [...state.movedSurvivorIds, id],
      };
    }),
  nextTurn: () =>
    set((state) => ({
      turn: state.turn + 1,
      movedSurvivorIds: [],
      selectedSurvivorId: null,
    })),
  getValidMoves: (survivorId) => {
    const state = useGameStore.getState();
    const survivor = state.survivors.find(s => s.id === survivorId);
    if (!survivor) return [];

    const validMoves: {x: number; y: number}[] = [];
    const directions = [
      { x: 0, y: -1 }, // up
      { x: 0, y: 1 },  // down
      { x: -1, y: 0 }, // left
      { x: 1, y: 0 },  // right
    ];

    for (const dir of directions) {
      const newX = survivor.x + dir.x;
      const newY = survivor.y + dir.y;

      if (isValidPosition(newX, newY) && !isPositionOccupied(newX, newY, state.survivors)) {
        validMoves.push({ x: newX, y: newY });
      }
    }

    return validMoves;
  },
}));
