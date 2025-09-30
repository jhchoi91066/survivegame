import AsyncStorage from '@react-native-async-storage/async-storage';

const PROGRESS_KEY = '@game_progress';

export interface LevelProgress {
  levelId: number;
  completed: boolean;
  stars: number; // 0-3
  bestTime: number; // seconds remaining
  attempts: number;
}

export interface GameProgress {
  levels: Record<number, LevelProgress>; // levelId -> progress
  totalStars: number;
  lastPlayedLevel: number | null;
}

// 기본 진행도
const DEFAULT_PROGRESS: GameProgress = {
  levels: {},
  totalStars: 0,
  lastPlayedLevel: null,
};

// 진행도 로드
export const loadProgress = async (): Promise<GameProgress> => {
  try {
    const data = await AsyncStorage.getItem(PROGRESS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return DEFAULT_PROGRESS;
  } catch (error) {
    console.error('Failed to load progress:', error);
    return DEFAULT_PROGRESS;
  }
};

// 진행도 저장
export const saveProgress = async (progress: GameProgress): Promise<void> => {
  try {
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
};

// 레벨 완료 기록
export const recordLevelCompletion = async (
  levelId: number,
  timeRemaining: number,
  starThresholds: { threeStar: number; twoStar: number }
): Promise<GameProgress> => {
  const progress = await loadProgress();

  // 별 개수 계산
  let stars = 1; // 기본 1개
  if (timeRemaining >= starThresholds.threeStar) {
    stars = 3;
  } else if (timeRemaining >= starThresholds.twoStar) {
    stars = 2;
  }

  // 기존 기록 가져오기
  const existingProgress = progress.levels[levelId];

  // 새 기록 생성 또는 업데이트
  const newLevelProgress: LevelProgress = {
    levelId,
    completed: true,
    stars: existingProgress ? Math.max(existingProgress.stars, stars) : stars,
    bestTime: existingProgress
      ? Math.max(existingProgress.bestTime, timeRemaining)
      : timeRemaining,
    attempts: existingProgress ? existingProgress.attempts + 1 : 1,
  };

  progress.levels[levelId] = newLevelProgress;
  progress.lastPlayedLevel = levelId;

  // 총 별 개수 재계산
  progress.totalStars = Object.values(progress.levels).reduce(
    (sum, level) => sum + level.stars,
    0
  );

  await saveProgress(progress);
  return progress;
};

// 레벨 시도 횟수 증가
export const incrementLevelAttempts = async (levelId: number): Promise<void> => {
  const progress = await loadProgress();

  if (progress.levels[levelId]) {
    progress.levels[levelId].attempts += 1;
  } else {
    progress.levels[levelId] = {
      levelId,
      completed: false,
      stars: 0,
      bestTime: 0,
      attempts: 1,
    };
  }

  await saveProgress(progress);
};

// 특정 레벨 진행도 가져오기
export const getLevelProgress = async (
  levelId: number
): Promise<LevelProgress | null> => {
  const progress = await loadProgress();
  return progress.levels[levelId] || null;
};

// 레벨 잠금 해제 여부 확인
export const isLevelUnlocked = async (levelId: number): Promise<boolean> => {
  // 첫 번째 레벨은 항상 잠금 해제
  if (levelId === 1) return true;

  const progress = await loadProgress();

  // 이전 레벨이 완료되었는지 확인
  const previousLevel = progress.levels[levelId - 1];
  return previousLevel?.completed || false;
};

// 전체 진행도 초기화
export const resetProgress = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PROGRESS_KEY);
  } catch (error) {
    console.error('Failed to reset progress:', error);
  }
};

// 통계 가져오기
export const getStats = async () => {
  const progress = await loadProgress();
  const levels = Object.values(progress.levels);

  return {
    totalLevels: 50,
    completedLevels: levels.filter(l => l.completed).length,
    totalStars: progress.totalStars,
    maxStars: 150, // 50 levels * 3 stars
    totalAttempts: levels.reduce((sum, l) => sum + l.attempts, 0),
  };
};