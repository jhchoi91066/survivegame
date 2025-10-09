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
    | 'games_played'        // 게임 플레이 횟수
    | 'game_score'          // 특정 게임 점수
    | 'total_score'         // 전체 게임 총점
    | 'perfect_score'       // 만점
    | 'streak'              // 연속 플레이
    | 'all_difficulties'    // 모든 난이도 플레이
    | 'speed_play'          // 빠른 플레이
    | 'mastery'             // 특정 게임 마스터
    | 'friend_count'        // 친구 수 (온라인)
    | 'leaderboard_rank'    // 리더보드 순위 (온라인)
    | 'all_games_rank_one'  // 모든 게임 1위 (온라인)
    | 'friend_wins';        // 친구와 비교 승리

  value: number | string | string[];
  count?: number; // 필요 횟수
  gameType?: string; // 특정 게임 타입
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
    id: 'first_game',
    name: '첫 게임',
    description: '첫 번째 게임을 플레이하세요',
    category: 'progress',
    emoji: '🎯',
    requirement: {
      type: 'games_played',
      value: 1,
    },
  },
  {
    id: 'brain_trainer',
    name: '두뇌 트레이너',
    description: '10게임을 플레이하세요',
    category: 'progress',
    emoji: '🏃',
    requirement: {
      type: 'games_played',
      value: 10,
    },
  },
  {
    id: 'dedicated_player',
    name: '헌신적인 플레이어',
    description: '50게임을 플레이하세요',
    category: 'progress',
    emoji: '🏆',
    requirement: {
      type: 'games_played',
      value: 50,
    },
  },
  {
    id: 'brain_master',
    name: '두뇌 마스터',
    description: '100게임을 플레이하세요',
    category: 'progress',
    emoji: '🧠',
    requirement: {
      type: 'games_played',
      value: 100,
    },
  },

  // === 스킬 업적 - Flip & Match ===
  {
    id: 'memory_novice',
    name: '기억력 초심자',
    description: 'Flip & Match에서 레벨 5 달성',
    category: 'skill',
    emoji: '🎴',
    requirement: {
      type: 'game_score',
      value: 5,
      gameType: 'flip_match',
    },
  },
  {
    id: 'memory_expert',
    name: '기억력 전문가',
    description: 'Flip & Match에서 레벨 10 달성',
    category: 'skill',
    emoji: '🎴',
    requirement: {
      type: 'game_score',
      value: 10,
      gameType: 'flip_match',
    },
  },
  {
    id: 'flip_perfectionist',
    name: 'Flip & Match 완벽주의자',
    description: 'Flip & Match 모든 난이도 클리어',
    category: 'skill',
    emoji: '💎',
    requirement: {
      type: 'all_difficulties',
      value: 'flip_match',
    },
  },

  // === 스킬 업적 - Spatial Memory ===
  {
    id: 'spatial_beginner',
    name: '공간 기억 초심자',
    description: 'Spatial Memory에서 레벨 5 달성',
    category: 'skill',
    emoji: '🧠',
    requirement: {
      type: 'game_score',
      value: 5,
      gameType: 'spatial_memory',
    },
  },
  {
    id: 'spatial_master',
    name: '공간 기억 마스터',
    description: 'Spatial Memory에서 레벨 10 달성',
    category: 'skill',
    emoji: '🧠',
    requirement: {
      type: 'game_score',
      value: 10,
      gameType: 'spatial_memory',
    },
  },
  {
    id: 'spatial_perfectionist',
    name: 'Spatial Memory 완벽주의자',
    description: 'Spatial Memory 모든 난이도 클리어',
    category: 'skill',
    emoji: '💎',
    requirement: {
      type: 'all_difficulties',
      value: 'spatial_memory',
    },
  },

  // === 스킬 업적 - Math Rush ===
  {
    id: 'math_student',
    name: '수학 학생',
    description: 'Math Rush에서 50점 달성',
    category: 'skill',
    emoji: '➕',
    requirement: {
      type: 'game_score',
      value: 50,
      gameType: 'math_rush',
    },
  },
  {
    id: 'math_genius',
    name: '수학 천재',
    description: 'Math Rush에서 100점 달성',
    category: 'skill',
    emoji: '➕',
    requirement: {
      type: 'game_score',
      value: 100,
      gameType: 'math_rush',
    },
  },

  // === 스킬 업적 - Stroop Test ===
  {
    id: 'color_rookie',
    name: '색상 루키',
    description: 'Stroop Test에서 20점 달성',
    category: 'skill',
    emoji: '🎨',
    requirement: {
      type: 'game_score',
      value: 20,
      gameType: 'stroop',
    },
  },
  {
    id: 'stroop_master',
    name: 'Stroop 마스터',
    description: 'Stroop Test에서 40점 달성',
    category: 'skill',
    emoji: '🎨',
    requirement: {
      type: 'game_score',
      value: 40,
      gameType: 'stroop',
    },
  },

  // === 도전 업적 ===
  {
    id: 'quick_thinker',
    name: '빠른 사고자',
    description: '1분 이내에 게임 완료 (3회)',
    category: 'challenge',
    emoji: '⚡',
    requirement: {
      type: 'speed_play',
      value: 60,
      count: 3,
    },
  },
  {
    id: 'all_rounder',
    name: '올라운더',
    description: '모든 게임을 플레이하세요',
    category: 'challenge',
    emoji: '🌟',
    requirement: {
      type: 'mastery',
      value: 4, // 4개 게임
    },
  },
  {
    id: 'dedicated_learner',
    name: '열정적인 학습자',
    description: '3일 연속 플레이하세요',
    category: 'challenge',
    emoji: '🔥',
    requirement: {
      type: 'streak',
      value: 3,
    },
  },
  {
    id: 'consistent_player',
    name: '꾸준한 플레이어',
    description: '7일 연속 플레이하세요',
    category: 'challenge',
    emoji: '🔥',
    requirement: {
      type: 'streak',
      value: 7,
    },
  },

  // === 컬렉션 업적 ===
  {
    id: 'game_explorer',
    name: '게임 탐험가',
    description: '각 게임을 최소 1회씩 플레이하세요',
    category: 'collection',
    emoji: '🗺️',
    requirement: {
      type: 'mastery',
      value: 4,
    },
  },
  {
    id: 'difficulty_challenger',
    name: '난이도 도전자',
    description: 'Easy, Medium, Hard 모두 플레이하세요',
    category: 'collection',
    emoji: '🎯',
    requirement: {
      type: 'all_difficulties',
      value: 'all',
    },
  },

  // === 히든 업적 ===
  {
    id: 'perfect_memory',
    name: '완벽한 기억력',
    description: '???',
    category: 'hidden',
    emoji: '��',
    isHidden: true,
    requirement: {
      type: 'game_score',
      value: 15,
      gameType: 'flip_match',
    },
    reward: {
      type: 'hint',
      value: '당신의 기억력은 천재 수준입니다!',
    },
  },
  {
    id: 'ultimate_brain',
    name: '궁극의 두뇌',
    description: '???',
    category: 'hidden',
    emoji: '🧩',
    isHidden: true,
    requirement: {
      type: 'total_score',
      value: 500,
    },
    reward: {
      type: 'unlock',
      value: '특별한 통계 배지를 획득했습니다!',
    },
  },

  // === 온라인 업적 ===
  {
    id: 'social_butterfly',
    name: '소셜 버터플라이',
    description: '친구 5명을 추가하세요',
    category: 'online',
    emoji: '🦋',
    requirement: {
      type: 'friend_count',
      value: 5,
    },
  },
  {
    id: 'friend_network',
    name: '친구 네트워크',
    description: '친구 10명을 추가하세요',
    category: 'online',
    emoji: '👥',
    requirement: {
      type: 'friend_count',
      value: 10,
    },
  },
  {
    id: 'competitive_spirit',
    name: '경쟁의 정신',
    description: '친구를 5회 이기세요',
    category: 'online',
    emoji: '🏅',
    requirement: {
      type: 'friend_wins',
      value: 5,
    },
  },
  {
    id: 'leaderboard_entry',
    name: '리더보드 입성',
    description: '리더보드 Top 100에 진입하세요',
    category: 'online',
    emoji: '🌟',
    requirement: {
      type: 'leaderboard_rank',
      value: 100,
    },
  },
  {
    id: 'top_player',
    name: '상위 플레이어',
    description: '리더보드 Top 10에 진입하세요',
    category: 'online',
    emoji: '⭐',
    requirement: {
      type: 'leaderboard_rank',
      value: 10,
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
    gamesPlayed: number;
    gameScores: { [gameType: string]: number };
    totalScore: number;
    speedPlays: number;
    difficultiesPlayed: { [gameType: string]: Set<string> };
    gamesPlayedSet: Set<string>;
    streakDays: number;
    // 온라인 통계
    friendCount?: number;
    friendWins?: number;
    leaderboardRanks?: { [gameType: string]: number };
  }
): { unlocked: boolean; progress: number; currentCount: number } => {
  const req = achievement.requirement;
  let unlocked = false;
  let progress = 0;
  let currentCount = 0;

  switch (req.type) {
    case 'games_played':
      currentCount = stats.gamesPlayed;
      const targetGames = req.value as number;
      progress = Math.min(100, (currentCount / targetGames) * 100);
      unlocked = currentCount >= targetGames;
      break;

    case 'game_score':
      const gameType = req.gameType!;
      currentCount = stats.gameScores?.[gameType] || 0;
      const targetScore = req.value as number;
      progress = Math.min(100, (currentCount / targetScore) * 100);
      unlocked = currentCount >= targetScore;
      break;

    case 'total_score':
      currentCount = stats.totalScore;
      const targetTotal = req.value as number;
      progress = Math.min(100, (currentCount / targetTotal) * 100);
      unlocked = currentCount >= targetTotal;
      break;

    case 'speed_play':
      currentCount = stats.speedPlays;
      const targetSpeed = req.count || 1;
      progress = Math.min(100, (currentCount / targetSpeed) * 100);
      unlocked = currentCount >= targetSpeed;
      break;

    case 'all_difficulties':
      const game = req.value as string;
      if (game === 'all') {
        // Check if player has played all difficulties across flip_match and spatial_memory
        const flipDifficulties = stats.difficultiesPlayed['flip_match']?.size || 0;
        const spatialDifficulties = stats.difficultiesPlayed['spatial_memory']?.size || 0;
        currentCount = flipDifficulties + spatialDifficulties;
        progress = Math.min(100, (currentCount / 6) * 100); // 3 + 3
        unlocked = flipDifficulties >= 3 && spatialDifficulties >= 3;
      } else {
        currentCount = stats.difficultiesPlayed[game]?.size || 0;
        progress = Math.min(100, (currentCount / 3) * 100);
        unlocked = currentCount >= 3;
      }
      break;

    case 'mastery':
      currentCount = stats.gamesPlayedSet.size;
      const targetMastery = req.value as number;
      progress = Math.min(100, (currentCount / targetMastery) * 100);
      unlocked = currentCount >= targetMastery;
      break;

    case 'streak':
      currentCount = stats.streakDays;
      const targetStreak = req.value as number;
      progress = Math.min(100, (currentCount / targetStreak) * 100);
      unlocked = currentCount >= targetStreak;
      break;

    case 'friend_count':
      currentCount = stats.friendCount || 0;
      const targetFriends = req.value as number;
      progress = Math.min(100, (currentCount / targetFriends) * 100);
      unlocked = currentCount >= targetFriends;
      break;

    case 'friend_wins':
      currentCount = stats.friendWins || 0;
      const targetWins = req.value as number;
      progress = Math.min(100, (currentCount / targetWins) * 100);
      unlocked = currentCount >= targetWins;
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
      const targetGamesCount = req.value as number;
      const rankOnes = Object.values(ranks2).filter(rank => rank === 1).length;
      currentCount = rankOnes;
      progress = Math.min(100, (rankOnes / targetGamesCount) * 100);
      unlocked = rankOnes >= targetGamesCount;
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
