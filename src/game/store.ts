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
import { GameStatus, GAME_DURATION } from './timer';
import { WeatherEvent, WeatherType, generateWeatherEvent, WEATHER_DURATION, getWeatherEnergyBonus, canMoveInWeather } from './weather';
import { LevelConfig } from '../data/levelData';

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
  damageTrigger?: number; // Timestamp to trigger shake animation
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

const isValidPosition = (x: number, y: number, gridWidth: number, gridHeight: number): boolean => {
  return x >= 0 && x < gridWidth && y >= 0 && y < gridHeight;
};

const isPositionOccupied = (x: number, y: number, survivors: SurvivorState[]): boolean => {
  return survivors.some(survivor => survivor.x === x && survivor.y === y);
};

interface GameState {
  currentLevelId: number | null;
  gridWidth: number;
  gridHeight: number;
  survivors: SurvivorState[];
  selectedSurvivorId: string | null;
  turn: number;
  movedSurvivorIds: string[];
  resources: ResourceInventory;
  grid: GridCell[][];
  obstacles: ObstacleState[];
  timeRemaining: number;
  gameStatus: GameStatus;
  weather: WeatherEvent | null;
  rescuePoint: { x: number; y: number };
  initializeLevel: (levelConfig: LevelConfig) => void;
  selectSurvivor: (id: string | null) => void;
  moveSurvivor: (id: string, x: number, y: number) => void;
  nextTurn: () => void;
  getValidMoves: (survivorId: string) => {x: number; y: number}[];
  consumeEnergy: (id: string, amount: number) => void;
  consumeHealth: (id: string, amount: number) => void;
  takeDamage: (id: string, amount: number) => void;
  restoreHealth: (id: string, amount: number) => void;
  restoreEnergy: (id: string, amount: number) => void;
  updateResources: (resource: keyof ResourceInventory, amount: number) => void;
  removeObstacle: (x: number, y: number, survivorId: string) => boolean;
  startBridgeBuild: (x: number, y: number, survivorId: string) => boolean;
  getObstacleAt: (x: number, y: number) => ObstacleState | null;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  tickTimer: () => void;
  checkVictoryCondition: () => boolean;
  checkDefeatCondition: () => boolean;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentLevelId: null,
  gridWidth: 5,
  gridHeight: 5,
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
  timeRemaining: GAME_DURATION,
  gameStatus: 'idle',
  weather: null,
  rescuePoint: { x: 4, y: 4 },
  initializeLevel: (levelConfig: LevelConfig) =>
    set(() => {
      // Create survivors from level config
      const survivors: SurvivorState[] = levelConfig.survivors.map((s, index) => ({
        id: `survivor-${index + 1}`,
        x: s.position.x,
        y: s.position.y,
        role: s.role,
        health: 100,
        energy: 100,
        maxHealth: 100,
        maxEnergy: 100,
      }));

      // Create grid
      const grid: GridCell[][] = Array.from({ length: levelConfig.gridSize.height }, (_, y) =>
        Array.from({ length: levelConfig.gridSize.width }, (_, x) => ({
          terrain: 'grass' as TileType,
          obstacle: null,
        }))
      );

      // Add obstacles with proper typing
      const obstacles: ObstacleState[] = levelConfig.obstacles.map((obs) => ({
        ...obs,
        isPassable: obs.type === 'swamp' || obs.type === 'narrow_passage',
        isRemovable: obs.type !== 'deep_water',
      }));

      return {
        currentLevelId: levelConfig.id,
        gridWidth: levelConfig.gridSize.width,
        gridHeight: levelConfig.gridSize.height,
        survivors,
        grid,
        obstacles,
        rescuePoint: levelConfig.rescuePoint,
        timeRemaining: levelConfig.timeLimit,
        gameStatus: 'idle' as GameStatus,
        turn: 1,
        movedSurvivorIds: [],
        selectedSurvivorId: null,
        weather: null,
        resources: {
          food: 10,
          water: 10,
          tools: 5,
          medicalSupplies: 5,
        },
      };
    }),
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

      // Check if weather allows movement
      if (state.weather && !canMoveInWeather(state.weather.type, state.weather.turnsRemaining)) {
        return state; // Cannot move during storm
      }

      // Check if move is valid
      if (!isValidPosition(x, y, state.gridWidth, state.gridHeight)) return state;
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
      let updatedSurvivors = state.survivors.map((s) => {
        let newHealth = s.health;
        let newEnergy = s.energy;

        // Doctor passive: heal 5 HP per turn
        if (s.role === 'doctor') {
          newHealth = Math.min(s.maxHealth, s.health + 5);
        }

        // Weather energy bonus
        const energyBonus = getWeatherEnergyBonus(state.weather?.type || null);
        if (energyBonus > 0) {
          newEnergy = Math.min(s.maxEnergy, s.energy + energyBonus);
        }

        return { ...s, health: newHealth, energy: newEnergy };
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

      // Update weather
      let updatedWeather = state.weather;
      if (updatedWeather) {
        if (updatedWeather.turnsRemaining > 0) {
          updatedWeather = {
            ...updatedWeather,
            turnsRemaining: updatedWeather.turnsRemaining - 1,
          };
        } else if (updatedWeather.turnsUntilNext > 0) {
          updatedWeather = {
            ...updatedWeather,
            turnsUntilNext: updatedWeather.turnsUntilNext - 1,
          };
        } else {
          // Generate new weather event
          const newWeatherType = generateWeatherEvent();
          updatedWeather = {
            type: newWeatherType,
            turnsRemaining: WEATHER_DURATION[newWeatherType],
            turnsUntilNext: Math.floor(Math.random() * 3) + 2, // 2-4 turns until next event
          };
        }
      } else {
        // Start first weather event
        const weatherType = generateWeatherEvent();
        updatedWeather = {
          type: weatherType,
          turnsRemaining: WEATHER_DURATION[weatherType],
          turnsUntilNext: Math.floor(Math.random() * 3) + 2,
        };
      }

      return {
        turn: state.turn + 1,
        movedSurvivorIds: [],
        selectedSurvivorId: null,
        survivors: updatedSurvivors,
        obstacles: updatedObstacles,
        weather: updatedWeather,
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

      if (isValidPosition(newX, newY, state.gridWidth, state.gridHeight) && !isPositionOccupied(newX, newY, state.survivors)) {
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
  takeDamage: (id, amount) =>
    set((state) => ({
      survivors: state.survivors.map((s) =>
        s.id === id
          ? { ...s, health: Math.max(0, s.health - amount), damageTrigger: Date.now() }
          : s
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
  startGame: () =>
    set((state) => ({
      gameStatus: 'playing',
      timeRemaining: state.timeRemaining, // Use level's timeLimit
      turn: 1,
      movedSurvivorIds: [],
      selectedSurvivorId: null,
    })),
  pauseGame: () =>
    set({
      gameStatus: 'paused',
    }),
  resumeGame: () =>
    set({
      gameStatus: 'playing',
    }),
  tickTimer: () =>
    set((state) => {
      if (state.gameStatus !== 'playing') return state;
      if (state.timeRemaining <= 0) return state;

      const newTimeRemaining = state.timeRemaining - 1;

      // Check defeat condition (time's up)
      if (newTimeRemaining <= 0) {
        return {
          timeRemaining: 0,
          gameStatus: 'defeat' as GameStatus,
        };
      }

      return {
        timeRemaining: newTimeRemaining,
      };
    }),
  checkVictoryCondition: () => {
    const state = get();
    const allAtRescue = state.survivors.every(
      (s) => s.x === state.rescuePoint.x && s.y === state.rescuePoint.y
    );

    if (allAtRescue) {
      set({ gameStatus: 'victory' });
      return true;
    }
    return false;
  },
  checkDefeatCondition: () => {
    const state = get();

    // Check if any survivor has 0 health
    const anyDead = state.survivors.some((s) => s.health <= 0);

    // Check if time ran out
    const timeUp = state.timeRemaining <= 0;

    if (anyDead || timeUp) {
      set({ gameStatus: 'defeat' });
      return true;
    }
    return false;
  },
}));
