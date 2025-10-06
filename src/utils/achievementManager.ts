import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Achievement,
  AchievementProgress,
  ACHIEVEMENTS,
  checkAchievementProgress,
  getNewlyUnlockedAchievements,
} from '../data/achievements';

const ACHIEVEMENTS_KEY = '@achievements_progress';
const ACHIEVEMENT_STATS_KEY = '@achievement_stats';

// 업적 통계
export interface AchievementStats {
  levelsCompleted: number[];
  totalStars: number;
  synergiesDiscovered: number;
  perfectClears: number;
  chainReactions: number;
  speedClears: number;
  resourceEfficientClears: number;
  noDamageClears: number;
  specificMethodUsage: { [key: string]: number };
  // 온라인 통계
  friendCount: number;
  leaderboardRanks: { [gameType: string]: number };
}

// 초기 통계
const DEFAULT_STATS: AchievementStats = {
  levelsCompleted: [],
  totalStars: 0,
  synergiesDiscovered: 0,
  perfectClears: 0,
  chainReactions: 0,
  speedClears: 0,
  resourceEfficientClears: 0,
  noDamageClears: 0,
  specificMethodUsage: {},
  friendCount: 0,
  leaderboardRanks: {},
};

// 업적 진행도 불러오기
export const loadAchievementProgress = async (): Promise<AchievementProgress[]> => {
  try {
    const data = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    if (data) {
      return JSON.parse(data);
    }

    // 초기화
    const initialProgress: AchievementProgress[] = ACHIEVEMENTS.map(a => ({
      achievementId: a.id,
      unlocked: false,
      progress: 0,
      currentCount: 0,
    }));

    await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(initialProgress));
    return initialProgress;
  } catch (error) {
    console.error('Failed to load achievement progress:', error);
    return [];
  }
};

// 업적 진행도 저장
export const saveAchievementProgress = async (progress: AchievementProgress[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save achievement progress:', error);
  }
};

// 업적 통계 불러오기
export const loadAchievementStats = async (): Promise<AchievementStats> => {
  try {
    const data = await AsyncStorage.getItem(ACHIEVEMENT_STATS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return DEFAULT_STATS;
  } catch (error) {
    console.error('Failed to load achievement stats:', error);
    return DEFAULT_STATS;
  }
};

// 업적 통계 저장
export const saveAchievementStats = async (stats: AchievementStats): Promise<void> => {
  try {
    await AsyncStorage.setItem(ACHIEVEMENT_STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save achievement stats:', error);
  }
};

// 레벨 완료 시 통계 업데이트
export const updateStatsOnLevelComplete = async (
  levelId: number,
  stars: number,
  timeUsed: number,
  resourcesUsed: number,
  survivorsUsed: string[],
  chainReactionCount: number
): Promise<Achievement[]> => {
  const stats = await loadAchievementStats();
  const previousProgress = await loadAchievementProgress();

  // 통계 업데이트
  if (!stats.levelsCompleted.includes(levelId)) {
    stats.levelsCompleted.push(levelId);
  }

  stats.totalStars += stars;

  if (stars === 3) {
    stats.perfectClears += 1;
  }

  if (timeUsed <= 30) {
    stats.speedClears += 1;
  }

  if (resourcesUsed === 0) {
    stats.resourceEfficientClears += 1;
  }

  stats.chainReactions += chainReactionCount;

  // 통계 저장
  await saveAchievementStats(stats);

  // 업적 진행도 재계산
  const updatedProgress: AchievementProgress[] = ACHIEVEMENTS.map(achievement => {
    const { unlocked, progress, currentCount } = checkAchievementProgress(achievement, stats);

    return {
      achievementId: achievement.id,
      unlocked,
      unlockedAt: unlocked ? Date.now() : undefined,
      progress,
      currentCount,
    };
  });

  // 진행도 저장
  await saveAchievementProgress(updatedProgress);

  // 새로 해금된 업적 반환
  return getNewlyUnlockedAchievements(previousProgress, updatedProgress);
};

// 시너지 발견 시 통계 업데이트
export const updateStatsOnSynergyDiscovered = async (): Promise<Achievement[]> => {
  const stats = await loadAchievementStats();
  const previousProgress = await loadAchievementProgress();

  stats.synergiesDiscovered += 1;

  await saveAchievementStats(stats);

  const updatedProgress: AchievementProgress[] = ACHIEVEMENTS.map(achievement => {
    const { unlocked, progress, currentCount } = checkAchievementProgress(achievement, stats);

    return {
      achievementId: achievement.id,
      unlocked,
      unlockedAt: unlocked ? Date.now() : undefined,
      progress,
      currentCount,
    };
  });

  await saveAchievementProgress(updatedProgress);

  return getNewlyUnlockedAchievements(previousProgress, updatedProgress);
};

// 특정 방법 사용 시 통계 업데이트
export const updateStatsOnMethodUsed = async (methodKey: string): Promise<Achievement[]> => {
  const stats = await loadAchievementStats();
  const previousProgress = await loadAchievementProgress();

  if (!stats.specificMethodUsage[methodKey]) {
    stats.specificMethodUsage[methodKey] = 0;
  }
  stats.specificMethodUsage[methodKey] += 1;

  await saveAchievementStats(stats);

  const updatedProgress: AchievementProgress[] = ACHIEVEMENTS.map(achievement => {
    const { unlocked, progress, currentCount } = checkAchievementProgress(achievement, stats);

    return {
      achievementId: achievement.id,
      unlocked,
      unlockedAt: unlocked ? Date.now() : undefined,
      progress,
      currentCount,
    };
  });

  await saveAchievementProgress(updatedProgress);

  return getNewlyUnlockedAchievements(previousProgress, updatedProgress);
};

// 업적 진행률 (%) 계산
export const getAchievementCompletionRate = async (): Promise<number> => {
  const progress = await loadAchievementProgress();
  const unlockedCount = progress.filter(p => p.unlocked).length;
  return Math.round((unlockedCount / ACHIEVEMENTS.length) * 100);
};

// 친구 수 업데이트 (온라인)
export const updateFriendCount = async (friendCount: number): Promise<Achievement[]> => {
  const stats = await loadAchievementStats();
  const previousProgress = await loadAchievementProgress();

  stats.friendCount = friendCount;
  await saveAchievementStats(stats);

  const updatedProgress: AchievementProgress[] = ACHIEVEMENTS.map(achievement => {
    const { unlocked, progress, currentCount } = checkAchievementProgress(achievement, stats);

    return {
      achievementId: achievement.id,
      unlocked,
      unlockedAt: unlocked ? Date.now() : undefined,
      progress,
      currentCount,
    };
  });

  await saveAchievementProgress(updatedProgress);

  return getNewlyUnlockedAchievements(previousProgress, updatedProgress);
};

// 리더보드 순위 업데이트 (온라인)
export const updateLeaderboardRanks = async (ranks: { [gameType: string]: number }): Promise<Achievement[]> => {
  const stats = await loadAchievementStats();
  const previousProgress = await loadAchievementProgress();

  stats.leaderboardRanks = ranks;
  await saveAchievementStats(stats);

  const updatedProgress: AchievementProgress[] = ACHIEVEMENTS.map(achievement => {
    const { unlocked, progress, currentCount } = checkAchievementProgress(achievement, stats);

    return {
      achievementId: achievement.id,
      unlocked,
      unlockedAt: unlocked ? Date.now() : undefined,
      progress,
      currentCount,
    };
  });

  await saveAchievementProgress(updatedProgress);

  return getNewlyUnlockedAchievements(previousProgress, updatedProgress);
};

// 업적 초기화 (디버그용)
export const resetAchievements = async (): Promise<void> => {
  await AsyncStorage.removeItem(ACHIEVEMENTS_KEY);
  await AsyncStorage.removeItem(ACHIEVEMENT_STATS_KEY);
};
