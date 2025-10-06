// 업적 시스템

export type AchievementCategory = 'progress' | 'skill' | 'challenge' | 'collection' | 'hidden' | 'online';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  emoji: string;
  isHidden?: boolean; // 달성 전까지 숨김

  // 달성 조건
  requirement: AchievementRequirement;

  // 보상
  reward?: {
    type: 'hint' | 'unlock' | 'cosmetic';
    value: string;
  };
}

export interface AchievementRequirement {
  type:
    | 'level_complete'      // 특정 레벨 클리어
    | 'star_count'          // 별 개수
    | 'synergy_discover'    // 시너지 발견
    | 'perfect_clear'       // 완벽한 클리어 (3성)
    | 'speed_clear'         // 빠른 클리어
    | 'resource_efficient'  // 자원 효율적 사용
    | 'chain_reaction'      // 연쇄 반응 트리거
    | 'no_damage'           // 무피해 클리어
    | 'all_survivors'       // 모든 생존자 사용
    | 'specific_method'     // 특정 방법 사용
    | 'friend_count'        // 친구 수 (온라인)
    | 'leaderboard_rank'    // 리더보드 순위 (온라인)
    | 'all_games_rank_one'; // 모든 게임 1위 (온라인)

  value: number | string | string[];
  count?: number; // 필요 횟수
}

export interface AchievementProgress {
  achievementId: string;
  unlocked: boolean;
  unlockedAt?: number; // timestamp
  progress: number; // 0-100
  currentCount?: number; // 현재 진행도
}

// 정의된 업적 목록
export const ACHIEVEMENTS: Achievement[] = [
  // === 진행 업적 ===
  {
    id: 'first_steps',
    name: '첫 걸음',
    description: '첫 번째 레벨을 클리어하세요',
    category: 'progress',
    emoji: '🎯',
    requirement: {
      type: 'level_complete',
      value: 1,
    },
  },
  {
    id: 'halfway_there',
    name: '반환점',
    description: '레벨 5를 클리어하세요',
    category: 'progress',
    emoji: '🏃',
    requirement: {
      type: 'level_complete',
      value: 5,
    },
  },
  {
    id: 'ten_levels',
    name: '열 고비',
    description: '레벨 10을 클리어하세요',
    category: 'progress',
    emoji: '🏆',
    requirement: {
      type: 'level_complete',
      value: 10,
    },
  },
  {
    id: 'star_collector',
    name: '별 수집가',
    description: '총 10개의 별을 획득하세요',
    category: 'progress',
    emoji: '⭐',
    requirement: {
      type: 'star_count',
      value: 10,
    },
  },
  {
    id: 'star_master',
    name: '별의 주인',
    description: '총 30개의 별을 획득하세요',
    category: 'progress',
    emoji: '🌟',
    requirement: {
      type: 'star_count',
      value: 30,
    },
  },

  // === 스킬 업적 ===
  {
    id: 'perfect_first',
    name: '완벽주의자',
    description: '첫 3성 클리어를 달성하세요',
    category: 'skill',
    emoji: '💎',
    requirement: {
      type: 'perfect_clear',
      value: 1,
      count: 1,
    },
  },
  {
    id: 'speedrunner',
    name: '스피드러너',
    description: '30초 이내에 레벨을 클리어하세요',
    category: 'skill',
    emoji: '⚡',
    requirement: {
      type: 'speed_clear',
      value: 30,
    },
  },
  {
    id: 'resource_saver',
    name: '절약왕',
    description: '자원을 1개도 사용하지 않고 레벨을 클리어하세요',
    category: 'skill',
    emoji: '💰',
    requirement: {
      type: 'resource_efficient',
      value: 0,
    },
  },
  {
    id: 'chain_master',
    name: '연쇄 반응 마스터',
    description: '연쇄 반응을 5회 트리거하세요',
    category: 'skill',
    emoji: '💥',
    requirement: {
      type: 'chain_reaction',
      value: 5,
      count: 5,
    },
  },

  // === 시너지 & 컬렉션 업적 ===
  {
    id: 'first_synergy',
    name: '팀워크 발견',
    description: '첫 번째 시너지를 발견하세요',
    category: 'collection',
    emoji: '🤝',
    requirement: {
      type: 'synergy_discover',
      value: 1,
      count: 1,
    },
  },
  {
    id: 'synergy_collector',
    name: '시너지 수집가',
    description: '모든 시너지를 발견하세요 (5개)',
    category: 'collection',
    emoji: '🎨',
    requirement: {
      type: 'synergy_discover',
      value: 5,
      count: 5,
    },
  },

  // === 도전 업적 ===
  {
    id: 'safe_bomber',
    name: '안전 폭파 전문가',
    description: '안전 폭파 시너지를 사용하세요',
    category: 'challenge',
    emoji: '🛡️',
    requirement: {
      type: 'specific_method',
      value: 'synergy_engineer_doctor',
    },
  },
  {
    id: 'firefighter',
    name: '소방관',
    description: '불을 10회 진압하세요',
    category: 'challenge',
    emoji: '🚒',
    requirement: {
      type: 'specific_method',
      value: 'extinguish_fire',
      count: 10,
    },
  },
  {
    id: 'engineer_specialist',
    name: '엔지니어 전문가',
    description: '엔지니어로만 레벨을 클리어하세요',
    category: 'challenge',
    emoji: '👷',
    requirement: {
      type: 'all_survivors',
      value: ['engineer'],
    },
  },

  // === 히든 업적 ===
  {
    id: 'no_damage_master',
    name: '무결점',
    description: '???',
    category: 'hidden',
    emoji: '🌈',
    isHidden: true,
    requirement: {
      type: 'no_damage',
      value: 5,
      count: 5,
    },
    reward: {
      type: 'hint',
      value: '히든 레벨 힌트를 획득했습니다!',
    },
  },
  {
    id: 'puzzle_genius',
    name: '퍼즐 천재',
    description: '???',
    category: 'hidden',
    emoji: '🧩',
    isHidden: true,
    requirement: {
      type: 'perfect_clear',
      value: 10,
      count: 10,
    },
    reward: {
      type: 'unlock',
      value: 'special_level',
    },
  },

  // === 온라인 업적 ===
  {
    id: 'social_butterfly',
    name: '소셜 버터플라이',
    description: '친구 10명을 추가하세요',
    category: 'online',
    emoji: '🦋',
    requirement: {
      type: 'friend_count',
      value: 10,
    },
  },
  {
    id: 'global_star',
    name: '글로벌 스타',
    description: '리더보드 Top 100에 진입하세요',
    category: 'online',
    emoji: '🌟',
    requirement: {
      type: 'leaderboard_rank',
      value: 100,
    },
  },
  {
    id: 'perfect_champion',
    name: '완벽한 챔피언',
    description: '모든 게임에서 1위를 달성하세요',
    category: 'online',
    emoji: '👑',
    requirement: {
      type: 'all_games_rank_one',
      value: 4, // 4개 게임
    },
  },
];

// 업적 진행도 확인
export const checkAchievementProgress = (
  achievement: Achievement,
  stats: {
    levelsCompleted: number[];
    totalStars: number;
    synergiesDiscovered: number;
    perfectClears: number;
    chainReactions: number;
    speedClears: number;
    resourceEfficientClears: number;
    specificMethodUsage: { [key: string]: number };
    // 온라인 통계
    friendCount?: number;
    leaderboardRanks?: { [gameType: string]: number };
  }
): { unlocked: boolean; progress: number; currentCount: number } => {
  const req = achievement.requirement;
  let unlocked = false;
  let progress = 0;
  let currentCount = 0;

  switch (req.type) {
    case 'level_complete':
      unlocked = stats.levelsCompleted.includes(req.value as number);
      progress = unlocked ? 100 : 0;
      currentCount = unlocked ? 1 : 0;
      break;

    case 'star_count':
      currentCount = stats.totalStars;
      const targetStars = req.value as number;
      progress = Math.min(100, (currentCount / targetStars) * 100);
      unlocked = currentCount >= targetStars;
      break;

    case 'synergy_discover':
      currentCount = stats.synergiesDiscovered;
      const targetSynergies = req.count || (req.value as number);
      progress = Math.min(100, (currentCount / targetSynergies) * 100);
      unlocked = currentCount >= targetSynergies;
      break;

    case 'perfect_clear':
      currentCount = stats.perfectClears;
      const targetPerfect = req.count || (req.value as number);
      progress = Math.min(100, (currentCount / targetPerfect) * 100);
      unlocked = currentCount >= targetPerfect;
      break;

    case 'chain_reaction':
      currentCount = stats.chainReactions;
      const targetChain = req.count || (req.value as number);
      progress = Math.min(100, (currentCount / targetChain) * 100);
      unlocked = currentCount >= targetChain;
      break;

    case 'speed_clear':
      currentCount = stats.speedClears;
      progress = currentCount > 0 ? 100 : 0;
      unlocked = currentCount > 0;
      break;

    case 'resource_efficient':
      currentCount = stats.resourceEfficientClears;
      progress = currentCount > 0 ? 100 : 0;
      unlocked = currentCount > 0;
      break;

    case 'specific_method':
      const methodKey = req.value as string;
      currentCount = stats.specificMethodUsage[methodKey] || 0;
      const targetCount = req.count || 1;
      progress = Math.min(100, (currentCount / targetCount) * 100);
      unlocked = currentCount >= targetCount;
      break;

    case 'no_damage':
      // 특별 처리 필요 (게임 통계에서 가져와야 함)
      break;

    case 'all_survivors':
      // 특별 처리 필요
      break;

    case 'friend_count':
      currentCount = stats.friendCount || 0;
      const targetFriends = req.value as number;
      progress = Math.min(100, (currentCount / targetFriends) * 100);
      unlocked = currentCount >= targetFriends;
      break;

    case 'leaderboard_rank':
      // Check if user is in top N in ANY game
      const targetRank = req.value as number;
      const ranks = stats.leaderboardRanks || {};
      const hasTopRank = Object.values(ranks).some(rank => rank > 0 && rank <= targetRank);
      unlocked = hasTopRank;
      progress = hasTopRank ? 100 : 0;
      currentCount = hasTopRank ? 1 : 0;
      break;

    case 'all_games_rank_one':
      // Check if user is #1 in all games
      const ranks2 = stats.leaderboardRanks || {};
      const targetGames = req.value as number;
      const rankOnes = Object.values(ranks2).filter(rank => rank === 1).length;
      currentCount = rankOnes;
      progress = Math.min(100, (rankOnes / targetGames) * 100);
      unlocked = rankOnes >= targetGames;
      break;
  }

  return { unlocked, progress, currentCount };
};

// 새로 해금된 업적 확인
export const getNewlyUnlockedAchievements = (
  previousProgress: AchievementProgress[],
  currentProgress: AchievementProgress[]
): Achievement[] => {
  const newlyUnlocked: Achievement[] = [];

  currentProgress.forEach(current => {
    const previous = previousProgress.find(p => p.achievementId === current.achievementId);

    if (current.unlocked && (!previous || !previous.unlocked)) {
      const achievement = ACHIEVEMENTS.find(a => a.id === current.achievementId);
      if (achievement) {
        newlyUnlocked.push(achievement);
      }
    }
  });

  return newlyUnlocked;
};

// 업적 카테고리별 분류
export const getAchievementsByCategory = (category: AchievementCategory): Achievement[] => {
  return ACHIEVEMENTS.filter(a => a.category === category);
};

// 히든 업적이 아닌 것만 필터링
export const getVisibleAchievements = (): Achievement[] => {
  return ACHIEVEMENTS.filter(a => !a.isHidden);
};
