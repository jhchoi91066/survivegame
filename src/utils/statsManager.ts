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
    await AsyncStorage.setItem(key, JSON.stringify(record));
  } catch (error) {
    console.error(`Failed to save record for ${game}:`, error);
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
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error(`Failed to load record for ${game}:`, error);
    return null;
  }
};

// Flip & Match 기록 업데이트
export const updateFlipMatchRecord = async (
  time: number,
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<void> => {
  const current = await loadGameRecord('flip_match');

  if (!current || time < current.bestTime || current.bestTime === 0) {
    await saveGameRecord('flip_match', {
      bestTime: time,
      difficulty,
    });
  }
};

// Sequence 기록 업데이트
export const updateSequenceRecord = async (level: number): Promise<void> => {
  const current = await loadGameRecord('sequence');

  if (!current || level > current.highestLevel) {
    await saveGameRecord('sequence', {
      highestLevel: level,
    });
  }
};

// Math Rush 기록 업데이트
export const updateMathRushRecord = async (
  score: number,
  combo: number
): Promise<void> => {
  const current = await loadGameRecord('math_rush');

  const newRecord = {
    highScore: !current || score > current.highScore ? score : current.highScore,
    highestCombo: !current || combo > current.highestCombo ? combo : current.highestCombo,
  };

  await saveGameRecord('math_rush', newRecord);
};

// Connect Flow 기록 업데이트
export const updateConnectFlowRecord = async (
  levelId: number,
  moves: number
): Promise<void> => {
  const current = await loadGameRecord('connect_flow');

  const levelsCompleted = current?.levelsCompleted || [];
  if (!levelsCompleted.includes(levelId)) {
    levelsCompleted.push(levelId);
  }

  const newRecord = {
    bestMoves: !current || moves < current.bestMoves || current.bestMoves === 0
      ? moves
      : current.bestMoves,
    levelsCompleted,
  };

  await saveGameRecord('connect_flow', newRecord);
};

// 통계 초기화
export const clearAllStats = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STATS_KEY,
      `${RECORDS_KEY}_flip_match`,
      `${RECORDS_KEY}_sequence`,
      `${RECORDS_KEY}_math_rush`,
      `${RECORDS_KEY}_connect_flow`,
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
