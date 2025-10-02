// Obstacle types - 확장된 타입
export type ObstacleType =
  | 'rock'
  | 'swamp'
  | 'deep_water'
  | 'narrow_passage'
  | 'bridge'
  | 'fire'        // 불
  | 'tree'        // 나무
  | 'water_dam'   // 물댐
  | 'explosive'   // 폭탄
  | 'ice'         // 얼음
  | 'fog';        // 안개

// 연쇄 반응 타입
export type ChainReactionType =
  | { type: 'flood'; range: number; } // 물 범람
  | { type: 'extinguish_fire'; range: number; } // 불 끄기
  | { type: 'explosion'; radius: number; } // 폭발
  | { type: 'melt_ice'; range: number; } // 얼음 녹이기
  | { type: 'spread_fire'; range: number; } // 불 확산
  | { type: 'collapse'; targetIds: string[]; }; // 특정 장애물 무너뜨리기

export interface ObstacleState {
  id: string;
  type: ObstacleType;
  x: number;
  y: number;
  isPassable: boolean; // Can survivors walk through?
  isRemovable: boolean; // Can it be removed/modified?
  turnsBuildRemaining?: number; // For bridges under construction

  // 연쇄 반응 시스템
  blockedBy?: string[]; // 이 장애물을 제거하려면 먼저 제거해야 할 장애물 ID들
  blocksIds?: string[]; // 이 장애물이 제거되면 잠금 해제되는 장애물 ID들
  chainReaction?: ChainReactionType; // 제거 시 발동되는 연쇄 효과
  isLocked?: boolean; // 다른 장애물 때문에 잠겨있는지

  // 시간 관련 (실시간 효과)
  spreadTimer?: number; // 불 확산, 얼음 녹음 등의 타이머
  naturalDecayTime?: number; // 자연 소멸 시간 (초)

  // 안개 시스템
  isRevealed?: boolean; // 안개가 정찰되었는지 (fog 타입만 사용)
  hiddenObstacles?: ObstacleState[]; // 안개 뒤에 숨겨진 장애물들
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
    removalMethods: [
      { type: 'survivor_engineer', resourceCost: 2, resourceType: 'tool' },
      { type: 'explosive', resourceCost: 1, resourceType: 'explosive', warning: '폭발로 주변이 파괴될 수 있습니다' },
    ],
  },
  swamp: {
    name: '늪지',
    emoji: '💩',
    isPassable: true,
    energyMultiplier: 2, // Double energy cost to move through
    isRemovable: true, // Engineer can restore
    energyCostToRestore: 15,
    color: '#92400e', // amber-800
    removalMethods: [
      { type: 'survivor_engineer', resourceCost: 1, resourceType: 'tool', action: 'restore' },
    ],
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
    removalMethods: [
      { type: 'survivor_engineer', resourceCost: 3, resourceType: 'tool', action: 'build_bridge', time: 3 },
    ],
  },
  narrow_passage: {
    name: '좁은 통로',
    emoji: '🚪',
    isPassable: false, // Only child can pass
    childCanPass: true,
    color: '#6b7280', // gray-500
    removalMethods: [
      { type: 'survivor_child', resourceCost: 0, action: 'pass_through' },
      { type: 'survivor_engineer', resourceCost: 2, resourceType: 'tool', action: 'widen' },
    ],
  },
  bridge: {
    name: '다리',
    emoji: '🌉',
    isPassable: true,
    color: '#92400e', // amber-800
  },
  fire: {
    name: '불',
    emoji: '🔥',
    isPassable: false,
    isRemovable: true,
    naturalDecayTime: 5, // 5초 후 자연 소멸
    spreadTime: 3, // 3초마다 확산
    color: '#dc2626', // red-600
    removalMethods: [
      { type: 'survivor_doctor', resourceCost: 2, resourceType: 'water' },
      { type: 'natural_decay', time: 5 },
    ],
  },
  tree: {
    name: '나무',
    emoji: '🌲',
    isPassable: false,
    isRemovable: true,
    color: '#15803d', // green-700
    removalMethods: [
      { type: 'survivor_engineer', resourceCost: 1, resourceType: 'tool' },
      { type: 'fire', warning: '불이 확산될 수 있습니다' },
    ],
  },
  water_dam: {
    name: '물댐',
    emoji: '💧',
    isPassable: false,
    isRemovable: true,
    color: '#0369a1', // sky-700
    removalMethods: [
      { type: 'survivor_engineer', resourceCost: 3, resourceType: 'tool', safe: true },
      { type: 'explosive', resourceCost: 1, warning: '물이 범람합니다!', chainReaction: 'flood' },
    ],
  },
  explosive: {
    name: '폭탄',
    emoji: '💣',
    isPassable: false,
    isRemovable: true,
    color: '#991b1b', // red-800
    removalMethods: [
      { type: 'detonate', resourceCost: 0, warning: '반경 1칸이 파괴됩니다', chainReaction: 'explosion' },
      { type: 'survivor_engineer', resourceCost: 2, resourceType: 'tool', safe: true, action: 'defuse' },
    ],
  },
  ice: {
    name: '얼음',
    emoji: '🧊',
    isPassable: false,
    isRemovable: true,
    naturalDecayTime: 10, // 10초 후 자연 소멸
    color: '#0891b2', // cyan-600
    removalMethods: [
      { type: 'fire', resourceCost: 0, time: 2 }, // 불로 2초만에 녹음
      { type: 'natural_decay', time: 10 },
    ],
  },
  fog: {
    name: '안개',
    emoji: '🌫️',
    isPassable: true, // 통과 가능하지만 보이지 않음
    isRemovable: true,
    color: '#9ca3af', // gray-400
    removalMethods: [
      { type: 'survivor_child', action: 'scout', resourceCost: 0 },
    ],
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
    case 'tree':
    case 'water_dam':
    case 'explosive':
    case 'ice':
      return false;
    case 'fire':
      return false; // 불은 통과 불가
    case 'swamp':
      return true; // Passable but costs more energy
    case 'deep_water':
      return false;
    case 'narrow_passage':
      return survivorRole === 'child';
    case 'bridge':
      return true;
    case 'fog':
      return true; // 안개는 통과 가능하지만 보이지 않음
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

// 장애물 제거 방법 가져오기
export interface RemovalMethod {
  type: string;
  survivorRole?: string;
  resourceCost?: number;
  resourceType?: string;
  time?: number;
  warning?: string;
  chainReaction?: string;
  safe?: boolean;
  action?: string;
}

export const getObstacleRemovalMethods = (obstacleType: ObstacleType): RemovalMethod[] => {
  const config = OBSTACLE_CONFIG[obstacleType] as any;
  return config?.removalMethods || [];
};

// 장애물이 잠겨있는지 확인
export const isObstacleLocked = (obstacle: ObstacleState, allObstacles: ObstacleState[]): boolean => {
  if (!obstacle.blockedBy || obstacle.blockedBy.length === 0) {
    return false;
  }

  // blockedBy에 있는 장애물 중 하나라도 아직 존재하면 잠김
  return obstacle.blockedBy.some(blockerId =>
    allObstacles.some(obs => obs.id === blockerId)
  );
};

// 연쇄 반응 처리
export const getChainReactionTargets = (
  obstacle: ObstacleState,
  allObstacles: ObstacleState[],
  gridWidth: number,
  gridHeight: number
): ObstacleState[] => {
  if (!obstacle.chainReaction) return [];

  const targets: ObstacleState[] = [];
  const { x, y } = obstacle;

  switch (obstacle.chainReaction.type) {
    case 'explosion':
      // 반경 내의 모든 장애물
      const radius = obstacle.chainReaction.radius;
      allObstacles.forEach(obs => {
        const distance = Math.abs(obs.x - x) + Math.abs(obs.y - y);
        if (distance <= radius && obs.id !== obstacle.id) {
          targets.push(obs);
        }
      });
      break;

    case 'flood':
      // 물 범람: 아래쪽으로 확산
      const range = obstacle.chainReaction.range;
      allObstacles.forEach(obs => {
        if (obs.type === 'fire' && obs.y >= y && obs.y <= y + range && Math.abs(obs.x - x) <= 1) {
          targets.push(obs); // 불을 끔
        }
      });
      break;

    case 'extinguish_fire':
      // 주변 불 끄기
      const fireRange = obstacle.chainReaction.range;
      allObstacles.forEach(obs => {
        const distance = Math.abs(obs.x - x) + Math.abs(obs.y - y);
        if (obs.type === 'fire' && distance <= fireRange) {
          targets.push(obs);
        }
      });
      break;

    case 'spread_fire':
      // 불 확산: 인접한 나무로
      allObstacles.forEach(obs => {
        const distance = Math.abs(obs.x - x) + Math.abs(obs.y - y);
        if (obs.type === 'tree' && distance === 1) {
          targets.push(obs);
        }
      });
      break;

    case 'melt_ice':
      // 얼음 녹이기
      const iceRange = obstacle.chainReaction.range;
      allObstacles.forEach(obs => {
        const distance = Math.abs(obs.x - x) + Math.abs(obs.y - y);
        if (obs.type === 'ice' && distance <= iceRange) {
          targets.push(obs);
        }
      });
      break;

    case 'collapse':
      // 특정 장애물 무너뜨리기
      obstacle.chainReaction.targetIds?.forEach(targetId => {
        const target = allObstacles.find(obs => obs.id === targetId);
        if (target) targets.push(target);
      });
      break;
  }

  return targets;
};