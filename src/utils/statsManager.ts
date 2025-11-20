import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameType, GlobalStats, GameRecord } from '../game/shared/types';

const STATS_KEY = '@brain_games_stats';
const RECORDS_KEY = '@brain_games_records';

// 통계 저장
export const saveStats = async (stats: GlobalStats): Promise<void> => {
  try {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save stats:', error);
  }
};

// 통계 불러오기
export const loadStats = async (): Promise<GlobalStats | null> => {
  try {
    const data = await AsyncStorage.getItem(STATS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Failed to load stats:', error);
    return null;
  }
};

// 게임별 기록 저장
export const saveGameRecord = async <T extends GameType>(
  game: T,
  record: GameRecord[T]
): Promise<void> => {
  try {
    const key = `${RECORDS_KEY}_${game}`;
    console.log(`💾 Saving to AsyncStorage - Key: ${key}, Record:`, record);
    await AsyncStorage.setItem(key, JSON.stringify(record));
    console.log(`✅ Successfully saved ${game} record`);
  } catch (error) {
    console.error(`❌ Failed to save record for ${game}:`, error);
  }
};

// 게임별 기록 불러오기
export const loadGameRecord = async <T extends GameType>(
  game: T
): Promise<GameRecord[T] | null> => {
  try {
    const key = `${RECORDS_KEY}_${game}`;
    const data = await AsyncStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      console.log(`📖 Loaded ${game} record:`, parsed);
      return parsed;
    }
    console.log(`📖 No record found for ${game}`);
    return null;
  } catch (error) {
    console.error(`❌ Failed to load record for ${game}:`, error);
    return null;
  }
};

// Flip & Match 기록 업데이트
export const updateFlipMatchRecord = async (
  time: number,
  difficulty: 'easy' | 'medium' | 'hard',
  playTime: number
): Promise<void> => {
  const current = await loadGameRecord('flip_match');
  const newRecord = {
    bestTime: !current || time < current.bestTime || current.bestTime === 0 ? time : current.bestTime,
    difficulty: !current || time < current.bestTime || current.bestTime === 0 ? difficulty : current.difficulty,
    totalPlays: (current?.totalPlays || 0) + 1,
    totalPlayTime: (current?.totalPlayTime || 0) + playTime,
  };
  await saveGameRecord('flip_match', newRecord);
};

// Math Rush 기록 업데이트
export const updateMathRushRecord = async (
  score: number,
  combo: number,
  playTime: number
): Promise<void> => {
  const current = await loadGameRecord('math_rush');
  const newRecord = {
    highScore: !current || score > current.highScore ? score : current.highScore,
    highestCombo: !current || combo > current.highestCombo ? combo : current.highestCombo,
    totalPlays: (current?.totalPlays || 0) + 1,
    totalPlayTime: (current?.totalPlayTime || 0) + playTime,
  };
  await saveGameRecord('math_rush', newRecord);
};

// Spatial Memory 기록 업데이트
export const updateSpatialMemoryRecord = async (
  level: number,
  difficulty: 'easy' | 'medium' | 'hard',
  playTime: number
): Promise<void> => {
  const current = await loadGameRecord('spatial_memory');
  const newRecord = {
    highestLevel: !current || level > current.highestLevel ? level : current.highestLevel,
    difficulty: !current || level > current.highestLevel ? difficulty : current.difficulty,
    totalPlays: (current?.totalPlays || 0) + 1,
    totalPlayTime: (current?.totalPlayTime || 0) + playTime,
  };
  console.log('📊 Saving Spatial Memory record:', { current, newRecord });
  await saveGameRecord('spatial_memory', newRecord);
};


// Merge Puzzle 기록 업데이트
export const updateMergePuzzleRecord = async (
  moves: number,
  highestNumber: number,
  playTime: number
): Promise<void> => {
  // Merge Puzzle은 현재 별도 레코드로 관리되지 않거나 타입이 정의되지 않았을 수 있음
  // 임시로 로그만 남기거나 필요한 경우 구현
  console.log('Merge Puzzle record update not implemented yet', { moves, highestNumber, playTime });
};

// Stroop Test 기록 업데이트
export const updateStroopRecord = async (score: number, playTime: number): Promise<void> => {
  const current = await loadGameRecord('stroop');
  const newRecord = {
    highScore: !current || score > current.highScore ? score : current.highScore,
    totalPlays: (current?.totalPlays || 0) + 1,
    totalPlayTime: (current?.totalPlayTime || 0) + playTime,
  };
  console.log('📊 Saving Stroop Test record:', { current, newRecord });
  await saveGameRecord('stroop', newRecord);
};


// 통계 초기화
export const clearAllStats = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STATS_KEY,
      `${RECORDS_KEY}_flip_match`,
      `${RECORDS_KEY}_sequence`,
      `${RECORDS_KEY}_math_rush`,
      `${RECORDS_KEY}_spatial_memory`,
      `${RECORDS_KEY}_stroop`,
      `${RECORDS_KEY}_n_back`,
    ]);
  } catch (error) {
    console.error('Failed to clear stats:', error);
  }
};

// 플레이 시간 포맷팅 (초 → "1시간 23분")
export const formatPlayTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
};