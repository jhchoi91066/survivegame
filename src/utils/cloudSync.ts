import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameType } from '../game/shared/types';

export interface GameRecord {
  game_type: GameType;
  score: number;
  level?: number;
  time_seconds?: number;
  moves?: number;
  difficulty?: string;
  played_at: string;
}

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
 * Upload a single game record to Supabase
 */
export async function uploadGameRecord(record: GameRecord): Promise<CloudSyncResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('game_records')
      .insert({
        user_id: user.id,
        ...record
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Update leaderboard
    await updateLeaderboard(user.id, record);

    return { success: true, recordsUploaded: 1 };
  } catch (error) {
    console.error('Upload exception:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Update leaderboard with new record
 */
async function updateLeaderboard(userId: string, record: GameRecord): Promise<void> {
  try {
    // Get current leaderboard entry
    const { data: existing } = await supabase
      .from('leaderboards')
      .select('*')
      .eq('user_id', userId)
      .eq('game_type', record.game_type)
      .eq('difficulty', record.difficulty || 'normal')
      .single();

    const shouldUpdate = !existing || isBetterScore(record, existing);

    if (shouldUpdate) {
      await supabase
        .from('leaderboards')
        .upsert({
          user_id: userId,
          game_type: record.game_type,
          difficulty: record.difficulty || 'normal',
          best_score: record.score,
          best_level: record.level,
          best_time_seconds: record.time_seconds,
          best_moves: record.moves,
          last_updated: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Leaderboard update error:', error);
  }
}

/**
 * Check if new record is better than existing
 */
function isBetterScore(newRecord: GameRecord, existing: any): boolean {
  switch (newRecord.game_type) {
    case 'flip_match':
      // Lower time is better
      return !existing.best_time_seconds ||
             !!(newRecord.time_seconds && newRecord.time_seconds < existing.best_time_seconds);

    case 'sequence':
      // Higher level is better
      return !existing.best_level ||
             !!(newRecord.level && newRecord.level > existing.best_level);

    case 'math_rush':
      // Higher score is better
      return !existing.best_score || newRecord.score > existing.best_score;

    case 'merge_puzzle':
      // Lower moves is better
      return !existing.best_moves ||
             !!(newRecord.moves && newRecord.moves < existing.best_moves);

    default:
      return false;
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
      .order('played_at', { ascending: false })
      .limit(1000);

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
 * Get best records from cloud for specific game
 */
export async function getBestCloudRecord(
  gameType: GameType,
  difficulty?: string
): Promise<any | null> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return null;
    }

    const { data } = await supabase
      .from('leaderboards')
      .select('*')
      .eq('user_id', user.id)
      .eq('game_type', gameType)
      .eq('difficulty', difficulty || 'normal')
      .single();

    return data;
  } catch (error) {
    console.error('Get best record error:', error);
    return null;
  }
}

/**
 * Sync local records with cloud (merge strategy)
 */
export async function syncGameRecords(): Promise<CloudSyncResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Download cloud records
    const downloadResult = await downloadGameRecords();
    if (!downloadResult.success) {
      return downloadResult;
    }

    // Get local records from AsyncStorage
    const localRecordsStr = await AsyncStorage.getItem('game_records');
    const localRecords = localRecordsStr ? JSON.parse(localRecordsStr) : [];

    // Upload any local records not in cloud
    let uploadedCount = 0;
    for (const record of localRecords) {
      // Simple check: upload all local records (Supabase will handle duplicates)
      const uploadResult = await uploadGameRecord(record);
      if (uploadResult.success) {
        uploadedCount++;
      }
    }

    return {
      success: true,
      recordsUploaded: uploadedCount,
      recordsDownloaded: downloadResult.recordsDownloaded
    };
  } catch (error) {
    console.error('Sync exception:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Resolve conflicts between local and cloud records
 * Strategy: Keep the best score
 */
export async function resolveConflicts(
  localRecord: any,
  cloudRecord: any,
  gameType: GameType
): Promise<any> {
  switch (gameType) {
    case 'flip_match':
      // Keep lower time
      return localRecord.time < cloudRecord.best_time_seconds ? localRecord : cloudRecord;

    case 'sequence':
      // Keep higher level
      return localRecord.level > cloudRecord.best_level ? localRecord : cloudRecord;

    case 'math_rush':
      // Keep higher score
      return localRecord.score > cloudRecord.best_score ? localRecord : cloudRecord;

    case 'merge_puzzle':
      // Keep lower moves
      return localRecord.moves < cloudRecord.best_moves ? localRecord : cloudRecord;

    default:
      return cloudRecord;
  }
}

/**
 * Queue record for upload when offline
 */
export async function queueRecordForUpload(record: GameRecord): Promise<void> {
  try {
    const queueStr = await AsyncStorage.getItem('upload_queue');
    const queue = queueStr ? JSON.parse(queueStr) : [];

    queue.push({
      ...record,
      queued_at: new Date().toISOString()
    });

    await AsyncStorage.setItem('upload_queue', JSON.stringify(queue));
  } catch (error) {
    console.error('Queue error:', error);
  }
}

/**
 * Process upload queue when online
 */
export async function processUploadQueue(): Promise<CloudSyncResult> {
  try {
    const queueStr = await AsyncStorage.getItem('upload_queue');
    if (!queueStr) {
      return { success: true, recordsUploaded: 0 };
    }

    const queue = JSON.parse(queueStr);
    let uploadedCount = 0;

    for (const record of queue) {
      const result = await uploadGameRecord(record);
      if (result.success) {
        uploadedCount++;
      }
    }

    // Clear queue after processing
    await AsyncStorage.removeItem('upload_queue');

    return { success: true, recordsUploaded: uploadedCount };
  } catch (error) {
    console.error('Process queue error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Check if user is online
 */
export function isOnline(): boolean {
  // In React Native, you'd use NetInfo
  // For now, assume online
  return true;
}

/**
 * Sync wrapper that handles online/offline
 */
export async function smartSync(record: GameRecord): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    // Not logged in, just save locally
    return;
  }

  if (isOnline()) {
    await uploadGameRecord(record);
  } else {
    await queueRecordForUpload(record);
  }
}
