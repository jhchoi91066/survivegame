import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECONNECT_STORAGE_KEY = 'multiplayer_reconnect';
const RECONNECT_TIMEOUT = 60000; // 60 seconds

export interface ReconnectData {
  roomId: string;
  userId: string;
  token: string;
  timestamp: number;
}

/**
 * Save reconnection data to AsyncStorage for session recovery
 *
 * @param roomId - The multiplayer room ID
 * @param userId - The user ID
 * @param token - Unique reconnection token
 */
export const saveReconnectData = async (
  roomId: string,
  userId: string,
  token: string
) => {
  const data: ReconnectData = {
    roomId,
    userId,
    token,
    timestamp: Date.now(),
  };
  await AsyncStorage.setItem(RECONNECT_STORAGE_KEY, JSON.stringify(data));
};

/**
 * Retrieve reconnection data from AsyncStorage
 *
 * @returns ReconnectData if valid and not expired, null otherwise
 */
export const getReconnectData = async (): Promise<ReconnectData | null> => {
  try {
    const json = await AsyncStorage.getItem(RECONNECT_STORAGE_KEY);
    if (!json) return null;

    const data: ReconnectData = JSON.parse(json);

    // Check if expired (> 60 seconds)
    if (Date.now() - data.timestamp > RECONNECT_TIMEOUT) {
      await AsyncStorage.removeItem(RECONNECT_STORAGE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to get reconnect data:', error);
    return null;
  }
};

/**
 * Clear reconnection data from AsyncStorage
 */
export const clearReconnectData = async () => {
  await AsyncStorage.removeItem(RECONNECT_STORAGE_KEY);
};

/**
 * Attempt to reconnect to a multiplayer game session
 *
 * @param data - Reconnection data from AsyncStorage
 * @returns true if reconnection successful, false otherwise
 */
export const attemptReconnect = async (
  data: ReconnectData
): Promise<boolean> => {
  try {
    // 1. Verify room still exists and is active
    const { data: room, error: roomError } = await supabase
      .from('multiplayer_rooms')
      .select('status')
      .eq('id', data.roomId)
      .single();

    if (roomError || !room || room.status === 'finished') {
      await clearReconnectData();
      return false;
    }

    // 2. Verify user was in this room and token matches
    const { data: gameState, error: stateError } = await supabase
      .from('multiplayer_game_states')
      .select('reconnect_token')
      .eq('room_id', data.roomId)
      .eq('user_id', data.userId)
      .single();

    if (stateError || !gameState || gameState.reconnect_token !== data.token) {
      await clearReconnectData();
      return false;
    }

    // 3. Mark as reconnected in game state
    await supabase
      .from('multiplayer_game_states')
      .update({
        connection_status: 'connected',
        last_seen: new Date().toISOString(),
      })
      .eq('room_id', data.roomId)
      .eq('user_id', data.userId);

    // 4. Mark as online in presence
    await supabase.from('player_presence').upsert({
      user_id: data.userId,
      room_id: data.roomId,
      status: 'online',
      last_heartbeat: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error('Reconnection failed:', error);
    return false;
  }
};
