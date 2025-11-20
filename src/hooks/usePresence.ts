import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UsePresenceOptions {
  roomId: string;
  onPlayerDisconnected?: (userId: string) => void;
  onPlayerReconnected?: (userId: string) => void;
}

/**
 * Custom hook for managing player presence in multiplayer games
 *
 * Features:
 * - Sends heartbeat every 5 seconds to mark player as online
 * - Subscribes to opponent presence changes (disconnect/reconnect)
 * - Generates reconnection token for recovery
 * - Auto-cleanup on unmount
 *
 * @param options - Configuration object
 * @returns Object with reconnectToken for session recovery
 */
export const usePresence = ({
  roomId,
  onPlayerDisconnected,
  onPlayerReconnected,
  shouldDisconnectOnUnmount,
}: UsePresenceOptions & { shouldDisconnectOnUnmount?: React.MutableRefObject<boolean> }) => {
  const { user } = useAuth();
  const heartbeatInterval = useRef<NodeJS.Timeout>(undefined);
  const reconnectToken = useRef<string>(Math.random().toString(36).substring(2) + Date.now().toString(36));

  // Send heartbeat to mark player as online
  const sendHeartbeat = useCallback(async () => {
    if (!user) return;

    try {
      await supabase
        .from('player_presence')
        .upsert({
          user_id: user.id,
          room_id: roomId,
          last_heartbeat: new Date().toISOString(),
          status: 'online',
        });
    } catch (error) {
      console.error('Heartbeat failed:', error);
    }
  }, [user, roomId]);

  useEffect(() => {
    if (!user) return;

    // Start heartbeat immediately
    sendHeartbeat();
    heartbeatInterval.current = setInterval(sendHeartbeat, 5000);

    // Subscribe to presence changes (filtered by room only, not global)
    const subscription = supabase
      .channel(`presence:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'player_presence',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const { user_id, status } = payload.new as {
            user_id: string;
            status: string;
          };

          // Ignore own updates
          if (user_id === user.id) return;

          // Notify callbacks
          if (status === 'disconnected' && onPlayerDisconnected) {
            onPlayerDisconnected(user_id);
          } else if (status === 'online' && onPlayerReconnected) {
            onPlayerReconnected(user_id);
          }
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      subscription.unsubscribe();

      // Mark as disconnected (fire-and-forget) ONLY if allowed
      if (!shouldDisconnectOnUnmount || shouldDisconnectOnUnmount.current) {
        supabase
          .from('player_presence')
          .update({ status: 'disconnected' })
          .eq('user_id', user.id)
          .eq('room_id', roomId)
          .then(() => { });
      }
    };
  }, [user, roomId, sendHeartbeat, onPlayerDisconnected, onPlayerReconnected, shouldDisconnectOnUnmount]);

  return {
    reconnectToken: reconnectToken.current,
  };
};
