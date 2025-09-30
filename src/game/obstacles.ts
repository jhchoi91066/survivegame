// Obstacle types
export type ObstacleType = 'rock' | 'swamp' | 'deep_water' | 'narrow_passage' | 'bridge';

export interface ObstacleState {
  id: string;
  type: ObstacleType;
  x: number;
  y: number;
  isPassable: boolean; // Can survivors walk through?
  isRemovable: boolean; // Can it be removed/modified?
  turnsBuildRemaining?: number; // For bridges under construction
}

// Tile types for terrain
export type TileType = 'grass' | 'sand' | 'water';

export interface TileData {
  type: TileType;
  obstacle?: ObstacleState;
}

// Obstacle configuration
export const OBSTACLE_CONFIG = {
  rock: {
    name: '바위',
    emoji: '🪨',
    isPassable: false,
    isRemovable: true, // Only by engineer
    energyCostToRemove: 20,
    color: '#78716c', // stone-600
  },
  swamp: {
    name: '늪지',
    emoji: '🟫',
    isPassable: true,
    energyMultiplier: 2, // Double energy cost to move through
    isRemovable: true, // Engineer can restore
    energyCostToRestore: 15,
    color: '#92400e', // amber-800
  },
  deep_water: {
    name: '깊은 물',
    emoji: '🌊',
    isPassable: false,
    isRemovable: false,
    canBuildBridge: true,
    bridgeBuildTurns: 3,
    energyCostToBuild: 30,
    color: '#1e40af', // blue-800
  },
  narrow_passage: {
    name: '좁은 통로',
    emoji: '🚪',
    isPassable: false, // Only child can pass
    childCanPass: true,
    color: '#6b7280', // gray-500
  },
  bridge: {
    name: '다리',
    emoji: '🌉',
    isPassable: true,
    color: '#92400e', // amber-800
  },
};

// Helper functions
export const canSurvivorPassObstacle = (
  obstacle: ObstacleState | undefined,
  survivorRole: string,
): boolean => {
  if (!obstacle) return true;

  switch (obstacle.type) {
    case 'rock':
      return false;
    case 'swamp':
      return true; // Passable but costs more energy
    case 'deep_water':
      return false;
    case 'narrow_passage':
      return survivorRole === 'child';
    case 'bridge':
      return true;
    default:
      return true;
  }
};

export const getMovementEnergyCostWithObstacle = (
  obstacle: ObstacleState | undefined,
  baseEnergyCost: number,
): number => {
  if (!obstacle) return baseEnergyCost;

  if (obstacle.type === 'swamp') {
    return baseEnergyCost * (OBSTACLE_CONFIG.swamp.energyMultiplier || 2);
  }

  return baseEnergyCost;
};

export const canRemoveObstacle = (
  obstacle: ObstacleState,
  survivorRole: string,
): boolean => {
  if (!obstacle.isRemovable) return false;

  // Only engineers can remove obstacles
  if (survivorRole !== 'engineer') return false;

  return obstacle.type === 'rock' || obstacle.type === 'swamp';
};

export const canBuildBridge = (
  obstacle: ObstacleState | undefined,
  survivorRole: string,
): boolean => {
  if (!obstacle) return false;
  if (survivorRole !== 'engineer') return false;
  return obstacle.type === 'deep_water';
};