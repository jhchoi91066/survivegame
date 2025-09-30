import { SurvivorRole } from './store';

export interface AbilityConfig {
  name: string;
  description: string;
  energyCost: number;
  cooldown: number;
}

// Role-specific abilities
export const ABILITIES: Record<SurvivorRole, AbilityConfig[]> = {
  engineer: [
    {
      name: '다리 건설',
      description: '깊은 물 위에 다리를 건설합니다 (3턴 소요)',
      energyCost: 30,
      cooldown: 5,
    },
    {
      name: '장애물 제거',
      description: '바위를 파괴하거나 늪지를 복구합니다',
      energyCost: 20,
      cooldown: 3,
    },
  ],
  doctor: [
    {
      name: '체력 회복',
      description: '인접한 생존자의 체력을 30 회복합니다',
      energyCost: 20,
      cooldown: 2,
    },
    {
      name: '상태이상 치료',
      description: '독이나 질병 상태를 치료합니다',
      energyCost: 25,
      cooldown: 3,
    },
  ],
  chef: [
    {
      name: '음식 제작',
      description: '음식 아이템을 제작하여 인벤토리에 추가합니다',
      energyCost: 15,
      cooldown: 2,
    },
    {
      name: '팀 에너지 회복',
      description: '모든 생존자의 에너지를 20 회복합니다',
      energyCost: 30,
      cooldown: 4,
    },
  ],
  child: [
    {
      name: '좁은 통로 이동',
      description: '어른이 갈 수 없는 좁은 통로를 통과합니다',
      energyCost: 5,
      cooldown: 1,
    },
    {
      name: '숨기',
      description: '위험한 이벤트의 영향을 받지 않습니다 (1턴)',
      energyCost: 10,
      cooldown: 3,
    },
  ],
};

// Role passive abilities
export const ROLE_PASSIVES: Record<SurvivorRole, string> = {
  engineer: '장비 수리 및 건설 작업 가능',
  doctor: '매 턴 자동으로 체력 5 회복',
  chef: '음식 효율 50% 증가',
  child: '이동 시 에너지 소모 50% 감소',
};

// Get energy cost for movement based on role
export const getMovementEnergyCost = (role: SurvivorRole): number => {
  const baseCost = 10;
  return role === 'child' ? baseCost * 0.5 : baseCost;
};