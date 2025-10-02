// 생존자 시너지 시스템
// 두 명 이상의 생존자를 조합하여 특별한 효과 발동

export type SynergyType =
  | 'safe_explosion'    // 안전 폭파
  | 'emergency_food'    // 비상식량
  | 'antidote'          // 해독제
  | 'rapid_construction' // 빠른 건설
  | 'fire_control';     // 불 조절

export interface Synergy {
  id: string;
  name: string;
  description: string;
  emoji: string;
  requiredRoles: string[]; // 필요한 생존자 역할들
  effect: SynergyEffect;
  discovered?: boolean; // 플레이어가 발견했는지 (히든 요소)
}

export interface SynergyEffect {
  type: SynergyType;
  // 효과 상세
  resourceSaved?: number; // 절약되는 자원
  timeSaved?: number; // 절약되는 시간
  timeAdded?: number; // 추가되는 시간
  safeAction?: string; // 안전하게 수행할 수 있는 액션
  removeObstacleType?: string; // 영구 제거 가능한 장애물 타입
}

// 정의된 시너지 목록
export const SYNERGIES: Synergy[] = [
  {
    id: 'engineer_doctor_safe_explosion',
    name: '안전 폭파',
    description: '엔지니어와 의사가 협력하여 폭탄을 안전하게 폭파합니다. 주변에 피해가 없습니다.',
    emoji: '💣➕👨‍⚕️',
    requiredRoles: ['engineer', 'doctor'],
    effect: {
      type: 'safe_explosion',
      safeAction: 'explosive_detonation',
    },
  },
  {
    id: 'chef_child_emergency_food',
    name: '비상식량',
    description: '요리사와 아이가 협력하여 효율적인 비상식량을 만듭니다. 시간이 20초 추가됩니다.',
    emoji: '👨‍🍳➕👶',
    requiredRoles: ['chef', 'child'],
    effect: {
      type: 'emergency_food',
      timeAdded: 20,
    },
  },
  {
    id: 'doctor_chef_antidote',
    name: '해독제',
    description: '의사와 요리사가 협력하여 해독제를 만듭니다. 독가스를 영구 제거할 수 있습니다.',
    emoji: '👨‍⚕️➕👨‍🍳',
    requiredRoles: ['doctor', 'chef'],
    effect: {
      type: 'antidote',
      removeObstacleType: 'poison_gas', // 나중에 추가될 장애물
    },
  },
  {
    id: 'engineer_child_rapid_construction',
    name: '빠른 건설',
    description: '엔지니어와 아이가 협력하여 빠르게 구조물을 건설합니다. 건설 시간이 절반으로 줄어듭니다.',
    emoji: '👷➕👶',
    requiredRoles: ['engineer', 'child'],
    effect: {
      type: 'rapid_construction',
      timeSaved: 50, // 50% 시간 절약
    },
  },
  {
    id: 'engineer_chef_fire_control',
    name: '불 조절',
    description: '엔지니어와 요리사가 협력하여 불을 조절합니다. 불을 의도한 방향으로만 확산시킬 수 있습니다.',
    emoji: '👷➕👨‍🍳',
    requiredRoles: ['engineer', 'chef'],
    effect: {
      type: 'fire_control',
      safeAction: 'controlled_fire_spread',
    },
  },
];

// 특정 생존자 조합으로 가능한 시너지 찾기
export const findAvailableSynergies = (
  survivorRoles: string[]
): Synergy[] => {
  return SYNERGIES.filter(synergy => {
    // 필요한 역할이 모두 있는지 확인
    return synergy.requiredRoles.every(role =>
      survivorRoles.includes(role)
    );
  });
};

// 시너지 적용 가능 여부 확인
export const canApplySynergy = (
  synergy: Synergy,
  selectedSurvivors: { id: string; role: string; used: boolean }[]
): boolean => {
  // 필요한 역할의 생존자가 모두 사용되지 않았는지 확인
  const availableSurvivors = selectedSurvivors.filter(s => !s.used);

  return synergy.requiredRoles.every(requiredRole =>
    availableSurvivors.some(survivor => survivor.role === requiredRole)
  );
};

// 시너지 발견 알림용
export const getSynergyDiscoveryMessage = (synergy: Synergy): string => {
  return `🎉 새로운 시너지 발견!\n\n${synergy.emoji} ${synergy.name}\n${synergy.description}`;
};

// 생존자 역할별 가능한 시너지 힌트
export const getSynergyHints = (role: string): string[] => {
  const hints: string[] = [];

  SYNERGIES.forEach(synergy => {
    if (synergy.requiredRoles.includes(role)) {
      const otherRole = synergy.requiredRoles.find(r => r !== role);
      if (otherRole) {
        hints.push(`${getRoleEmoji(otherRole)}와 조합 가능`);
      }
    }
  });

  return hints;
};

// 역할별 이모지
const getRoleEmoji = (role: string): string => {
  switch (role) {
    case 'engineer': return '👷';
    case 'doctor': return '👨‍⚕️';
    case 'chef': return '👨‍🍳';
    case 'child': return '👶';
    default: return '🧑';
  }
};
