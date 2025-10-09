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
  gamesPlayed: number;
  gameScores: { [gameType: string]: number };
  totalScore: number;
  speedPlays: number;
  difficultiesPlayed: { [gameType: string]: string[] };
  gamesPlayedList: string[];
  streakDays: number;
  lastPlayDate?: string;
  // 온라인 통계
  friendCount: number;
  friendWins: number;
  leaderboardRanks: { [gameType: string]: number };
}

// 초기 통계
const DEFAULT_STATS: AchievementStats = {
  gamesPlayed: 0,
  gameScores: {},
  totalScore: 0,
  speedPlays: 0,
  difficultiesPlayed: {},
  gamesPlayedList: [],
  streakDays: 0,
  friendCount: 0,
  friendWins: 0,
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
      const parsed = JSON.parse(data);
      // Ensure all required fields exist
      return {
        ...DEFAULT_STATS,
        ...parsed,
        gameScores: parsed.gameScores || {},
        difficultiesPlayed: parsed.difficultiesPlayed || {},
        gamesPlayedList: parsed.gamesPlayedList || [],
        leaderboardRanks: parsed.leaderboardRanks || {},
      };
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

// 날짜 차이 계산 (일 단위)
const getDaysDifference = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// 게임 플레이 시 통계 업데이트
export const updateStatsOnGamePlayed = async (
  gameType: string,
  score: number,
  timeSeconds: number,
  difficulty?: string
): Promise<Achievement[]> => {
  const stats = await loadAchievementStats();
  const previousProgress = await loadAchievementProgress();

  // 게임 플레이 횟수 증가
  stats.gamesPlayed += 1;

  // 게임별 최고 점수 업데이트
  if (!stats.gameScores[gameType] || score > stats.gameScores[gameType]) {
    stats.gameScores[gameType] = score;
  }

  // 총점 업데이트
  stats.totalScore += score;

  // 빠른 플레이 체크 (60초 이내)
  if (timeSeconds <= 60) {
    stats.speedPlays += 1;
  }

  // 난이도 플레이 기록
  if (difficulty) {
    if (!stats.difficultiesPlayed[gameType]) {
      stats.difficultiesPlayed[gameType] = [];
    }
    if (!stats.difficultiesPlayed[gameType].includes(difficulty)) {
      stats.difficultiesPlayed[gameType].push(difficulty);
    }
  }

  // 게임 타입 플레이 기록
  if (!stats.gamesPlayedList.includes(gameType)) {
    stats.gamesPlayedList.push(gameType);
  }

  // 연속 플레이 일수 업데이트
  const today = new Date().toISOString().split('T')[0];
  if (stats.lastPlayDate) {
    const daysDiff = getDaysDifference(stats.lastPlayDate, today);
    if (daysDiff === 1) {
      // 연속 플레이
      stats.streakDays += 1;
    } else if (daysDiff > 1) {
      // 연속 끊김
      stats.streakDays = 1;
    }
    // daysDiff === 0이면 오늘 이미 플레이했으므로 유지
  } else {
    // 첫 플레이
    stats.streakDays = 1;
  }
  stats.lastPlayDate = today;

  // 통계 저장
  await saveAchievementStats(stats);

  // 업적 진행도 재계산
  const updatedProgress: AchievementProgress[] = ACHIEVEMENTS.map(achievement => {
    const statsWithSets = {
      ...stats,
      difficultiesPlayed: stats.difficultiesPlayed ? Object.keys(stats.difficultiesPlayed).reduce((acc, key) => {
        acc[key] = new Set(stats.difficultiesPlayed[key]);
        return acc;
      }, {} as { [key: string]: Set<string> }) : {},
      gamesPlayedSet: new Set(stats.gamesPlayedList || []),
    };
    const { unlocked, progress, currentCount } = checkAchievementProgress(achievement, statsWithSets);

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
    const statsWithSets = {
      ...stats,
      difficultiesPlayed: stats.difficultiesPlayed ? Object.keys(stats.difficultiesPlayed).reduce((acc, key) => {
        acc[key] = new Set(stats.difficultiesPlayed[key]);
        return acc;
      }, {} as { [key: string]: Set<string> }) : {},
      gamesPlayedSet: new Set(stats.gamesPlayedList || []),
    };
    const { unlocked, progress, currentCount } = checkAchievementProgress(achievement, statsWithSets);

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

// 친구 승리 업데이트 (온라인)
export const updateFriendWins = async (winsToAdd: number = 1): Promise<Achievement[]> => {
  const stats = await loadAchievementStats();
  const previousProgress = await loadAchievementProgress();

  stats.friendWins += winsToAdd;
  await saveAchievementStats(stats);

  const updatedProgress: AchievementProgress[] = ACHIEVEMENTS.map(achievement => {
    const statsWithSets = {
      ...stats,
      difficultiesPlayed: stats.difficultiesPlayed ? Object.keys(stats.difficultiesPlayed).reduce((acc, key) => {
        acc[key] = new Set(stats.difficultiesPlayed[key]);
        return acc;
      }, {} as { [key: string]: Set<string> }) : {},
      gamesPlayedSet: new Set(stats.gamesPlayedList || []),
    };
    const { unlocked, progress, currentCount } = checkAchievementProgress(achievement, statsWithSets);

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
    const statsWithSets = {
      ...stats,
      difficultiesPlayed: stats.difficultiesPlayed ? Object.keys(stats.difficultiesPlayed).reduce((acc, key) => {
        acc[key] = new Set(stats.difficultiesPlayed[key]);
        return acc;
      }, {} as { [key: string]: Set<string> }) : {},
      gamesPlayedSet: new Set(stats.gamesPlayedList || []),
    };
    const { unlocked, progress, currentCount } = checkAchievementProgress(achievement, statsWithSets);

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
