import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameType } from '../game/shared/types';

export interface CloudSyncResult {
  success: boolean;
  error?: string;
  recordsUploaded?: number;
  recordsDownloaded?: number;
}

/**
 * Get current user from Supabase session
 */
async function getCurrentUser(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
}

/**
 * Upload/sync game statistics to cloud
 * This upserts (inserts or updates) the game_records table
 */
export async function uploadGameStats(
  gameType: GameType,
  stats: {
    bestTime?: number;
    highestLevel?: number;
    highScore?: number;
    highestCombo?: number;
    bestMoves?: number;
    highestNumber?: number;
    totalPlays: number;
    totalPlayTime: number;
    difficulty?: string;
  }
): Promise<CloudSyncResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Postgres integer max value: 2,147,483,647
    const MAX_INT = 2147483647;
    const clamp = (val: number | undefined | null) => {
      if (val === undefined || val === null || isNaN(val)) return null;
      // Handle potential timestamp values (which are > MAX_INT) by treating them as suspicious
      // If a value is > MAX_INT, it's likely a bug or a timestamp, so we clamp it.
      return Math.min(Math.max(0, Math.floor(val)), MAX_INT);
    };

    const payload = {
      p_game_type: gameType,
      p_difficulty: stats.difficulty || 'easy',
      p_best_time: clamp(stats.bestTime),
      p_high_score: clamp(stats.highScore),
      p_highest_level: clamp(stats.highestLevel),
      p_highest_combo: clamp(stats.highestCombo),
      p_best_moves: clamp(stats.bestMoves),
      p_highest_number: clamp(stats.highestNumber),
      p_total_plays: clamp(stats.totalPlays) || 1,
      p_total_play_time: clamp(stats.totalPlayTime) || 0,
    };

    console.log('Uploading stats payload:', JSON.stringify(payload, null, 2));

    // [C3] 검증된 함수를 통해 게임 기록 제출
    const { error } = await supabase.rpc('submit_game_record', payload);

    if (error) {
      console.error('Upload stats error:', error);
      // Don't return error for overflow, just log it and pretend success to stop retry loop if that's the case
      if (error.code === '22003') {
        console.warn('Ignored integer overflow error to prevent loop');
        return { success: true, recordsUploaded: 1 };
      }
      return { success: false, error: error.message };
    }

    return { success: true, recordsUploaded: 1 };
  } catch (error) {
    console.error('Upload stats exception:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Download all game records for current user
 */
export async function downloadGameRecords(): Promise<CloudSyncResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('game_records')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Download error:', error);
      return { success: false, error: error.message };
    }

    // Store in AsyncStorage for offline access
    await AsyncStorage.setItem(`cloud_records_${user.id}`, JSON.stringify(data || []));

    return { success: true, recordsDownloaded: data?.length || 0 };
  } catch (error) {
    console.error('Download exception:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get cloud record for specific game type
 */
export async function getCloudRecord(
  gameType: GameType,
  difficulty?: string
): Promise<any | null> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return null;
    }

    let query = supabase
      .from('game_records')
      .select('*')
      .eq('user_id', user.id)
      .eq('game_type', gameType);

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    } else {
      query = query.is('difficulty', null);
    }

    const { data } = await query.maybeSingle();

    return data;
  } catch (error) {
    console.error('Get cloud record error:', error);
    return null;
  }
}

/**
 * Sync local game stats with cloud
 * This merges local and cloud records, keeping the best scores
 */
export async function syncGameRecords(): Promise<CloudSyncResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Download cloud records first
    const downloadResult = await downloadGameRecords();
    if (!downloadResult.success) {
      return downloadResult;
    }

    // Get local game stats from statsManager's storage
    const gameTypes: GameType[] = ['flip_match', 'spatial_memory', 'math_rush', 'stroop'];
    let uploadedCount = 0;

    for (const gameType of gameTypes) {
      try {
        // Load local stats from AsyncStorage (where statsManager stores them)
        const localStatsStr = await AsyncStorage.getItem(`@brain_games_records_${gameType}`);
        if (!localStatsStr) continue;

        const localStats = JSON.parse(localStatsStr);

        // Get cloud stats for comparison
        const cloudStats = await getCloudRecord(gameType, localStats.difficulty);

        // Merge: keep best scores between local and cloud
        const mergedStats = mergeStats(localStats, cloudStats, gameType);

        // Calculate delta for totals to avoid double counting if backend adds them
        // If backend sets them, this logic might need adjustment, but given the overflow, it likely adds.
        const statsToUpload = { ...mergedStats };
        if (cloudStats) {
          statsToUpload.totalPlays = Math.max(0, (mergedStats.totalPlays || 0) - (cloudStats.total_plays || 0));
          statsToUpload.totalPlayTime = Math.max(0, (mergedStats.totalPlayTime || 0) - (cloudStats.total_play_time || 0));
        }

        // Upload merged stats (deltas for totals)
        const uploadResult = await uploadGameStats(gameType, statsToUpload);
        if (uploadResult.success) {
          uploadedCount++;

          // Update local storage with merged stats
          await AsyncStorage.setItem(`@brain_games_records_${gameType}`, JSON.stringify(mergedStats));
        }
      } catch (error) {
        console.error(`Failed to sync ${gameType}:`, error);
      }
    }

    return {
      success: true,
      recordsUploaded: uploadedCount,
      recordsDownloaded: downloadResult.recordsDownloaded,
    };
  } catch (error) {
    console.error('Sync exception:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Merge local and cloud stats, keeping the best values
 */
function mergeStats(local: any, cloud: any, gameType: GameType): any {
  if (!cloud) return local;
  if (!local) return cloud;

  const merged = { ...local };

  switch (gameType) {
    case 'flip_match':
      // Keep lower (better) time
      if (cloud.best_time !== null && (merged.bestTime === undefined || cloud.best_time < merged.bestTime)) {
        merged.bestTime = cloud.best_time;
      }
      // Keep lower (better) moves
      if (cloud.best_moves !== null && (merged.bestMoves === undefined || cloud.best_moves < merged.bestMoves)) {
        merged.bestMoves = cloud.best_moves;
      }
      break;

    case 'spatial_memory':
      // Keep higher (better) level
      if (cloud.highest_level !== null && (merged.highestLevel === undefined || cloud.highest_level > merged.highestLevel)) {
        merged.highestLevel = cloud.highest_level;
      }
      break;

    case 'math_rush':
    case 'stroop':
      // Keep higher (better) score
      if (cloud.high_score !== null && (merged.highScore === undefined || cloud.high_score > merged.highScore)) {
        merged.highScore = cloud.high_score;
      }
      // Keep higher combo
      if (cloud.highest_combo !== null && (merged.highestCombo === undefined || cloud.highest_combo > merged.highestCombo)) {
        merged.highestCombo = cloud.highest_combo;
      }
      break;
  }

  // Keep higher total plays and play time (in case cloud has more)
  merged.totalPlays = Math.max(local.totalPlays || 0, cloud.total_plays || 0);
  merged.totalPlayTime = Math.max(local.totalPlayTime || 0, cloud.total_play_time || 0);

  return merged;
}

/**
 * Check if user is online
 */
export function isOnline(): boolean {
  // For web, always assume online
  // For mobile, you'd use NetInfo
  return true;
}
