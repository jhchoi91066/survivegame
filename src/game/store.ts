import { create } from 'zustand';
import { getMovementEnergyCost } from './abilities';
import {
  ObstacleState,
  TileType,
  canSurvivorPassObstacle,
  getMovementEnergyCostWithObstacle,
  canRemoveObstacle,
  canBuildBridge,
} from './obstacles';

// Survivor role types
export type SurvivorRole = 'engineer' | 'doctor' | 'chef' | 'child';

export interface SurvivorState {
  id: string;
  x: number;
  y: number;
  role: SurvivorRole;
  health: number; // 0-100
  energy: number; // 0-100
  maxHealth: number;
  maxEnergy: number;
}

// Resource inventory
export interface ResourceInventory {
  food: number;
  water: number;
  tools: number;
  medicalSupplies: number;
}

// Grid cell data
export interface GridCell {
  terrain: TileType;
  obstacle: ObstacleState | null;
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
  resources: ResourceInventory;
  grid: GridCell[][];
  obstacles: ObstacleState[];
  selectSurvivor: (id: string | null) => void;
  moveSurvivor: (id: string, x: number, y: number) => void;
  nextTurn: () => void;
  getValidMoves: (survivorId: string) => {x: number; y: number}[];
  consumeEnergy: (id: string, amount: number) => void;
  consumeHealth: (id: string, amount: number) => void;
  restoreHealth: (id: string, amount: number) => void;
  restoreEnergy: (id: string, amount: number) => void;
  updateResources: (resource: keyof ResourceInventory, amount: number) => void;
  removeObstacle: (x: number, y: number, survivorId: string) => boolean;
  startBridgeBuild: (x: number, y: number, survivorId: string) => boolean;
  getObstacleAt: (x: number, y: number) => ObstacleState | null;
}

export const useGameStore = create<GameState>((set, get) => ({
  survivors: [
    {
      id: 'survivor-1',
      x: 0,
      y: 0,
      role: 'engineer',
      health: 100,
      energy: 100,
      maxHealth: 100,
      maxEnergy: 100,
    },
    {
      id: 'survivor-2',
      x: 4,
      y: 4,
      role: 'doctor',
      health: 100,
      energy: 100,
      maxHealth: 100,
      maxEnergy: 100,
    },
  ],
  selectedSurvivorId: null,
  turn: 1,
  movedSurvivorIds: [],
  resources: {
    food: 10,
    water: 10,
    tools: 5,
    medicalSupplies: 5,
  },
  // Initialize 5x5 grid with grass terrain
  grid: Array.from({ length: 5 }, (_, y) =>
    Array.from({ length: 5 }, (_, x) => ({
      terrain: 'grass' as TileType,
      obstacle: null,
    }))
  ),
  // Sample obstacles for testing
  obstacles: [
    {
      id: 'obstacle-1',
      type: 'rock',
      x: 2,
      y: 2,
      isPassable: false,
      isRemovable: true,
    },
    {
      id: 'obstacle-2',
      type: 'swamp',
      x: 1,
      y: 3,
      isPassable: true,
      isRemovable: true,
    },
  ],
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

      // Check obstacle at target position
      const obstacle = state.obstacles.find(obs => obs.x === x && obs.y === y);
      if (obstacle && !canSurvivorPassObstacle(obstacle, survivor.role)) {
        return state; // Cannot pass this obstacle
      }

      // Calculate energy cost (role-based + obstacle modifier)
      const baseEnergyCost = getMovementEnergyCost(survivor.role);
      const energyCost = getMovementEnergyCostWithObstacle(obstacle, baseEnergyCost);

      // Check if survivor has enough energy
      if (survivor.energy < energyCost) return state;

      return {
        survivors: state.survivors.map((s) =>
          s.id === id ? { ...s, x, y, energy: s.energy - energyCost } : s
        ),
        selectedSurvivorId: null, // Deselect after moving
        movedSurvivorIds: [...state.movedSurvivorIds, id],
      };
    }),
  nextTurn: () =>
    set((state) => {
      // Apply role passive effects at turn end
      const updatedSurvivors = state.survivors.map((s) => {
        let newHealth = s.health;
        // Doctor passive: heal 5 HP per turn
        if (s.role === 'doctor') {
          newHealth = Math.min(s.maxHealth, s.health + 5);
        }
        return { ...s, health: newHealth };
      });

      // Update bridge construction progress
      const updatedObstacles = state.obstacles.map((obs) => {
        if (obs.type === 'bridge' && obs.turnsBuildRemaining !== undefined && obs.turnsBuildRemaining > 0) {
          const newTurns = obs.turnsBuildRemaining - 1;
          return {
            ...obs,
            turnsBuildRemaining: newTurns,
            isPassable: newTurns === 0, // Bridge becomes passable when construction completes
          };
        }
        return obs;
      });

      return {
        turn: state.turn + 1,
        movedSurvivorIds: [],
        selectedSurvivorId: null,
        survivors: updatedSurvivors,
        obstacles: updatedObstacles,
      };
    }),
  getValidMoves: (survivorId) => {
    const state = get();
    const survivor = state.survivors.find((s) => s.id === survivorId);
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
        // Check if obstacle blocks movement
        const obstacle = state.obstacles.find((obs) => obs.x === newX && obs.y === newY);
        if (!obstacle || canSurvivorPassObstacle(obstacle, survivor.role)) {
          // Check if survivor has enough energy
          const baseEnergyCost = getMovementEnergyCost(survivor.role);
          const energyCost = getMovementEnergyCostWithObstacle(obstacle, baseEnergyCost);
          if (survivor.energy >= energyCost) {
            validMoves.push({ x: newX, y: newY });
          }
        }
      }
    }

    return validMoves;
  },
  consumeEnergy: (id, amount) =>
    set((state) => ({
      survivors: state.survivors.map((s) =>
        s.id === id ? { ...s, energy: Math.max(0, s.energy - amount) } : s
      ),
    })),
  consumeHealth: (id, amount) =>
    set((state) => ({
      survivors: state.survivors.map((s) =>
        s.id === id ? { ...s, health: Math.max(0, s.health - amount) } : s
      ),
    })),
  restoreHealth: (id, amount) =>
    set((state) => ({
      survivors: state.survivors.map((s) =>
        s.id === id
          ? { ...s, health: Math.min(s.maxHealth, s.health + amount) }
          : s
      ),
    })),
  restoreEnergy: (id, amount) =>
    set((state) => ({
      survivors: state.survivors.map((s) =>
        s.id === id
          ? { ...s, energy: Math.min(s.maxEnergy, s.energy + amount) }
          : s
      ),
    })),
  updateResources: (resource, amount) =>
    set((state) => ({
      resources: {
        ...state.resources,
        [resource]: Math.max(0, state.resources[resource] + amount),
      },
    })),
  getObstacleAt: (x, y) => {
    const state = get();
    return state.obstacles.find((obs) => obs.x === x && obs.y === y) || null;
  },
  removeObstacle: (x, y, survivorId) => {
    const state = get();
    const survivor = state.survivors.find((s) => s.id === survivorId);
    if (!survivor) return false;

    const obstacle = state.obstacles.find((obs) => obs.x === x && obs.y === y);
    if (!obstacle) return false;

    if (!canRemoveObstacle(obstacle, survivor.role)) return false;

    // Check if survivor has enough energy
    const energyCost = obstacle.type === 'rock' ? 20 : 15;
    if (survivor.energy < energyCost) return false;

    set({
      obstacles: state.obstacles.filter((obs) => obs.id !== obstacle.id),
      survivors: state.survivors.map((s) =>
        s.id === survivorId ? { ...s, energy: s.energy - energyCost } : s
      ),
    });
    return true;
  },
  startBridgeBuild: (x, y, survivorId) => {
    const state = get();
    const survivor = state.survivors.find((s) => s.id === survivorId);
    if (!survivor) return false;

    const obstacle = state.obstacles.find((obs) => obs.x === x && obs.y === y);
    if (!canBuildBridge(obstacle, survivor.role)) return false;

    // Check if survivor has enough energy
    const energyCost = 30;
    if (survivor.energy < energyCost) return false;

    // Create bridge obstacle (will take 3 turns)
    const newBridge: ObstacleState = {
      id: `bridge-${Date.now()}`,
      type: 'bridge',
      x,
      y,
      isPassable: false, // Not passable until construction is complete
      isRemovable: false,
      turnsBuildRemaining: 3,
    };

    set({
      obstacles: [...state.obstacles.filter((obs) => obs.id !== obstacle?.id), newBridge],
      survivors: state.survivors.map((s) =>
        s.id === survivorId ? { ...s, energy: s.energy - energyCost } : s
      ),
    });
    return true;
  },
}));
