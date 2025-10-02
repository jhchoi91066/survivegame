import { create } from 'zustand';
import { getMovementEnergyCost } from './abilities';
import {
  ObstacleState,
  TileType,
  canSurvivorPassObstacle,
  getMovementEnergyCostWithObstacle,
  canRemoveObstacle,
  canBuildBridge,
  getChainReactionTargets,
  isObstacleLocked,
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
  used?: boolean; // 퍼즐 게임에서 이미 사용되었는지 여부
}

// Resource inventory - 확장된 자원 시스템
export interface ResourceInventory {
  food: number;
  water: number;
  tool: number;  // 도구 (이전 tools에서 변경)
  medical: number; // 의료용품 (이전 medicalSupplies에서 변경)
  explosive: number; // 폭탄
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

// 게임 단계
export type GamePhase = 'planning' | 'executing' | 'result';

interface GameState {
  currentLevelId: number | null;
  gridWidth: number;
  gridHeight: number;
  survivors: SurvivorState[];
  resources: ResourceInventory;
  grid: GridCell[][];
  obstacles: ObstacleState[];
  timeRemaining: number;
  gameStatus: GameStatus;
  weather: WeatherEvent | null;
  rescuePoint: { x: number; y: number };

  // 퍼즐 게임 플로우
  gamePhase: GamePhase; // planning, executing, result
  planningTimeRemaining: number; // 60초 계획 시간
  actionsPlanned: number; // 계획된 행동 수

  // 별점 및 달성 시스템
  initialResources: ResourceInventory; // 초기 자원 (효율 계산용)
  hiddenAchievement: string | null; // 히든 달성

  // 연쇄 반응 애니메이션 이벤트
  chainReactionEvents: Array<{
    id: string;
    type: 'flood' | 'explosion' | 'fire_spread' | 'extinguish' | 'melt';
    x: number;
    y: number;
    timestamp: number;
  }>;
  addChainReactionEvent: (type: string, x: number, y: number) => void;
  clearChainReactionEvent: (id: string) => void;

  // 시너지 발견 시스템
  discoveredSynergies: string[]; // 발견한 시너지 ID들
  addDiscoveredSynergy: (synergyId: string) => void;

  initializeLevel: (levelConfig: LevelConfig) => void;

  // 턴제 시스템 제거 - 생존자 이동 불필요
  // selectSurvivor, moveSurvivor, nextTurn, getValidMoves 제거
  consumeEnergy: (id: string, amount: number) => void;
  consumeHealth: (id: string, amount: number) => void;
  takeDamage: (id: string, amount: number) => void;
  restoreHealth: (id: string, amount: number) => void;
  restoreEnergy: (id: string, amount: number) => void;
  updateResources: (resource: keyof ResourceInventory, amount: number) => void;
  removeObstacle: (x: number, y: number, survivorId: string) => boolean;
  startBridgeBuild: (x: number, y: number, survivorId: string) => boolean;
  getObstacleAt: (x: number, y: number) => ObstacleState | null;

  // 새로운 퍼즐 게임 메서드
  removeObstacleWithMethod: (
    obstacleId: string,
    method: { type: string; resourceType?: string; resourceCost?: number },
    survivorIds?: string[]
  ) => boolean;
  triggerChainReaction: (obstacleId: string) => void;
  unlockBlockedObstacles: (removedObstacleId: string) => void;
  scoutFog: (obstacleId: string, survivorId: string) => boolean; // 안개 정찰

  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  tickTimer: () => void;
  tickPlanningTimer: () => void; // 계획 단계 타이머 틱

  // 퍼즐 게임 플로우 메서드
  startPlanningPhase: () => void; // 계획 단계 시작
  executeActions: () => void; // 계획된 행동 실행 (계획 → 실행 단계)
  showResult: () => void; // 결과 표시 (실행 → 결과 단계)

  updateRealTimeEffects: () => void; // 실시간 효과 업데이트 (불 확산, 얼음 녹음)
  calculateStars: () => number; // 별점 계산
  checkHiddenAchievement: () => string | null; // 히든 달성 확인
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
      used: false,
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
      used: false,
    },
  ],
  resources: {
    food: 10,
    water: 10,
    tool: 5,  // 도구
    medical: 5,  // 의료용품
    explosive: 3,  // 폭탄
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
  gamePhase: 'planning' as GamePhase,
  planningTimeRemaining: 60, // 60초 계획 시간
  actionsPlanned: 0,
  initialResources: {
    food: 10,
    water: 10,
    tool: 5,
    medical: 5,
    explosive: 3,
  },
  hiddenAchievement: null,
  chainReactionEvents: [],
  addChainReactionEvent: (type: string, x: number, y: number) =>
    set((state) => ({
      chainReactionEvents: [
        ...state.chainReactionEvents,
        {
          id: `chain-${Date.now()}-${Math.random()}`,
          type: type as any,
          x,
          y,
          timestamp: Date.now(),
        },
      ],
    })),
  clearChainReactionEvent: (id: string) =>
    set((state) => ({
      chainReactionEvents: state.chainReactionEvents.filter((e) => e.id !== id),
    })),
  discoveredSynergies: [],
  addDiscoveredSynergy: (synergyId: string) =>
    set((state) => {
      if (!state.discoveredSynergies.includes(synergyId)) {
        return {
          discoveredSynergies: [...state.discoveredSynergies, synergyId],
        };
      }
      return state;
    }),
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
        used: false, // 초기에는 모두 사용 가능
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
        isPassable: obs.type === 'swamp' || obs.type === 'narrow_passage' || obs.type === 'fog',
        isRemovable: obs.type !== 'deep_water',
        // Convert PuzzleLevelObstacle hiddenObstacles to ObstacleState if present
        hiddenObstacles: ('hiddenObstacles' in obs && obs.hiddenObstacles)
          ? obs.hiddenObstacles.map((hidden: any) => ({
              ...hidden,
              isPassable: hidden.type === 'swamp' || hidden.type === 'narrow_passage' || hidden.type === 'fog',
              isRemovable: hidden.type !== 'deep_water',
            }))
          : undefined,
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
        weather: null,
        resources: {
          food: 10,
          water: 10,
          tool: 5,
          medical: 5,
          explosive: 3,
        },
        initialResources: {
          food: 10,
          water: 10,
          tool: 5,
          medical: 5,
          explosive: 3,
        },
        gamePhase: 'planning' as GamePhase,
        planningTimeRemaining: levelConfig.planningTime || 60,
        actionsPlanned: 0,
        hiddenAchievement: null,
      };
    }),

  // 턴제 이동 시스템 제거됨 - selectSurvivor, moveSurvivor, nextTurn 삭제됨
  // 퍼즐 게임에서는 장애물 제거만 진행

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
      gamePhase: 'planning',
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

  // 새로운 퍼즐 게임 메서드 구현
  removeObstacleWithMethod: (obstacleId, method, survivorIds) => {
    const state = get();
    const obstacle = state.obstacles.find(obs => obs.id === obstacleId);

    if (!obstacle) return false;

    // 잠긴 장애물인지 확인
    if (isObstacleLocked(obstacle, state.obstacles)) {
      return false;
    }

    // 자원 확인 및 소비
    if (method.resourceType && method.resourceCost) {
      const available = state.resources[method.resourceType as keyof ResourceInventory] || 0;
      if (available < method.resourceCost) {
        return false;
      }

      // 자원 소비
      set((state) => ({
        resources: {
          ...state.resources,
          [method.resourceType!]: state.resources[method.resourceType as keyof ResourceInventory] - method.resourceCost!,
        },
      }));
    }

    // 생존자 사용 처리 - 1회 사용 제한
    if (survivorIds && survivorIds.length > 0) {
      // 이미 사용된 생존자가 있는지 확인
      const hasUsedSurvivor = survivorIds.some(id => {
        const survivor = state.survivors.find(s => s.id === id);
        return survivor?.used === true;
      });

      if (hasUsedSurvivor) {
        return false; // 이미 사용된 생존자는 다시 사용 불가
      }

      // 생존자를 '사용됨' 상태로 표시
      set((state) => ({
        survivors: state.survivors.map(s =>
          survivorIds.includes(s.id) ? { ...s, used: true } : s
        ),
      }));
    }

    // 연쇄 반응 트리거
    if (obstacle.chainReaction) {
      get().triggerChainReaction(obstacleId);
    }

    // 장애물 제거
    set((state) => ({
      obstacles: state.obstacles.filter(obs => obs.id !== obstacleId),
    }));

    // 다른 장애물 잠금 해제
    get().unlockBlockedObstacles(obstacleId);

    return true;
  },

  triggerChainReaction: (obstacleId) => {
    const state = get();
    const obstacle = state.obstacles.find(obs => obs.id === obstacleId);

    if (!obstacle || !obstacle.chainReaction) return;

    const targets = getChainReactionTargets(
      obstacle,
      state.obstacles,
      state.gridWidth,
      state.gridHeight
    );

    // 연쇄 반응 애니메이션 이벤트 생성
    const reactionType = obstacle.chainReaction.type;
    let animationType: string = 'explosion';

    switch (reactionType) {
      case 'flood':
        animationType = 'flood';
        break;
      case 'explosion':
        animationType = 'explosion';
        break;
      case 'spread_fire':
        animationType = 'fire_spread';
        break;
      case 'extinguish_fire':
        animationType = 'extinguish';
        break;
      case 'melt_ice':
        animationType = 'melt';
        break;
    }

    // 장애물 위치에 애니메이션 이벤트 추가
    get().addChainReactionEvent(animationType, obstacle.x, obstacle.y);

    // 영향받는 타겟들에도 애니메이션 추가
    targets.forEach(target => {
      get().addChainReactionEvent(animationType, target.x, target.y);
    });

    // 연쇄 반응으로 영향받은 장애물 처리
    set((state) => ({
      obstacles: state.obstacles.filter(obs =>
        !targets.some(target => target.id === obs.id)
      ),
    }));
  },

  unlockBlockedObstacles: (removedObstacleId) => {
    set((state) => ({
      obstacles: state.obstacles.map(obs => {
        if (obs.blockedBy && obs.blockedBy.includes(removedObstacleId)) {
          // 이 장애물에서 제거된 장애물 ID 삭제
          const newBlockedBy = obs.blockedBy.filter(id => id !== removedObstacleId);
          return {
            ...obs,
            blockedBy: newBlockedBy,
            isLocked: newBlockedBy.length > 0, // 아직 다른 장애물이 막고 있으면 잠김 유지
          };
        }
        return obs;
      }),
    }));
  },

  // 계획 단계 타이머 틱 (매초 호출)
  tickPlanningTimer: () => {
    const state = get();
    if (state.gamePhase !== 'planning' || state.gameStatus !== 'playing') return;

    const newTime = state.planningTimeRemaining - 1;

    if (newTime <= 0) {
      // 계획 시간 종료 - 자동으로 실행 단계로 전환
      get().executeActions();
    } else {
      set({ planningTimeRemaining: newTime });
    }
  },

  // 계획 단계 시작
  startPlanningPhase: () => {
    set((state) => ({
      gamePhase: 'planning',
      planningTimeRemaining: 60,
      actionsPlanned: 0,
      // 생존자 사용 제한 초기화 (새 계획 단계마다 리셋)
      survivors: state.survivors.map(s => ({ ...s, used: false })),
    }));
  },

  // 계획된 행동 실행 (계획 → 실행 단계)
  executeActions: () => {
    set({ gamePhase: 'executing' });
    // 실행 단계에서는 실시간 효과가 적용됨
    // 승리 조건 체크
    const victory = get().checkVictoryCondition();
    if (victory) {
      get().showResult();
    }
  },

  // 결과 표시 (실행 → 결과 단계)
  showResult: () => {
    set({ gamePhase: 'result' });
  },

  // 실시간 효과 업데이트 (매초 호출)
  updateRealTimeEffects: () => {
    const state = get();
    if (state.gamePhase === 'planning' || state.gameStatus !== 'playing') return;

    const updatedObstacles = state.obstacles.map(obs => {
      // 불 확산
      if (obs.type === 'fire' && obs.spreadTimer !== undefined) {
        const newSpreadTimer = (obs.spreadTimer || 0) + 1;

        if (newSpreadTimer >= 5) {
          // 5초마다 불이 인접한 나무로 확산
          // TODO: 인접한 나무 찾아서 불로 변환
          return { ...obs, spreadTimer: 0 };
        }
        return { ...obs, spreadTimer: newSpreadTimer };
      }

      // 얼음 자연 녹음
      if (obs.type === 'ice' && obs.naturalDecayTime !== undefined) {
        const newDecayTime = (obs.naturalDecayTime || 10) - 1;

        if (newDecayTime <= 0) {
          // 얼음 제거 (녹음)
          return null;
        }
        return { ...obs, naturalDecayTime: newDecayTime };
      }

      // 불 자연 소멸
      if (obs.type === 'fire' && obs.naturalDecayTime !== undefined) {
        const newDecayTime = (obs.naturalDecayTime || 5) - 1;

        if (newDecayTime <= 0) {
          // 불 제거 (소멸)
          return null;
        }
        return { ...obs, naturalDecayTime: newDecayTime };
      }

      return obs;
    }).filter(obs => obs !== null) as ObstacleState[];

    set({ obstacles: updatedObstacles });
  },

  // 안개 정찰 (아이 생존자만 가능)
  scoutFog: (obstacleId, survivorId) => {
    const state = get();
    const obstacle = state.obstacles.find(obs => obs.id === obstacleId);
    const survivor = state.survivors.find(s => s.id === survivorId);

    if (!obstacle || obstacle.type !== 'fog' || !survivor) return false;

    // 아이 생존자만 정찰 가능
    if (survivor.role !== 'child') return false;

    // 안개 정찰 완료 - isRevealed를 true로 설정
    set((state) => ({
      obstacles: state.obstacles.map(obs =>
        obs.id === obstacleId
          ? { ...obs, isRevealed: true }
          : obs
      ),
    }));

    return true;
  },

  // 별점 계산 (1~3성)
  calculateStars: () => {
    const state = get();

    // 1성: 기본 클리어
    let stars = 1;

    // 2성: 자원 효율적 클리어 (초기 자원의 50% 이상 남음)
    const initialTotal = Object.values(state.initialResources).reduce((sum, val) => sum + val, 0);
    const remainingTotal = Object.values(state.resources).reduce((sum, val) => sum + val, 0);
    const efficiency = remainingTotal / initialTotal;

    if (efficiency >= 0.5) {
      stars = 2;
    }

    // 3성: 완벽한 클리어 (모든 생존자 체력 80% 이상 + 자원 50% 이상)
    const allSurvivorsHealthy = state.survivors.every(s => s.health >= s.maxHealth * 0.8);

    if (efficiency >= 0.5 && allSurvivorsHealthy) {
      stars = 3;
    }

    return stars;
  },

  // 히든 달성 확인
  checkHiddenAchievement: () => {
    const state = get();

    // 히든 달성 예시: "폭탄을 사용하지 않고 클리어"
    if (state.initialResources.explosive === 3 && state.resources.explosive === 3) {
      return '평화주의자';
    }

    // 히든 달성 예시: "모든 생존자 체력 100%로 클리어"
    if (state.survivors.every(s => s.health === s.maxHealth)) {
      return '무결한 승리';
    }

    // 히든 달성 예시: "자원 하나도 사용하지 않고 클리어"
    const noResourcesUsed = Object.keys(state.initialResources).every(
      key => state.initialResources[key as keyof ResourceInventory] === state.resources[key as keyof ResourceInventory]
    );
    if (noResourcesUsed) {
      return '미니멀리스트';
    }

    return null;
  },
}));
