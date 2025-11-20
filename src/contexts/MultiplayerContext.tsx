import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface MultiplayerContextValue {
  isMultiplayer: boolean;
  roomId: string | null;
  opponentScore: number;
  myScore: number;
  updateMyScore: (score: number) => Promise<void>;
  finishGame: () => Promise<void>;
}

const MultiplayerContext = createContext<MultiplayerContextValue | null>(null);

/**
 * Provider component that wraps game screens to enable multiplayer functionality
 *
 * Features:
 * - Tracks opponent score in real-time via Supabase subscriptions
 * - Provides methods to update own score and finish game
 * - Gracefully handles single-player mode (when roomId is undefined)
 *
 * @param roomId - Optional room ID. If provided, enables multiplayer mode
 * @param children - Child components (game screens)
 */
import { usePresence } from '../hooks/usePresence';
import Toast from '../components/shared/Toast';

export const MultiplayerProvider: React.FC<{
  roomId?: string;
  children: React.ReactNode;
}> = ({ roomId, children }) => {
  const { user } = useAuth();
  const [opponentScore, setOpponentScore] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'info' | 'success' | 'warning' | 'error' }>({ visible: false, message: '', type: 'info' });

  // Integrate presence management
  // We don't pass shouldDisconnectOnUnmount here, so it defaults to true (disconnect when game ends/leaves)
  usePresence({
    roomId: roomId || '',
    onPlayerDisconnected: () => {
      setToast({
        visible: true,
        message: '상대방 연결 끊김 - 재연결 대기 중',
        type: 'warning',
      });
    },
    onPlayerReconnected: () => {
      setToast({
        visible: true,
        message: '상대방이 재연결되었습니다!',
        type: 'success',
      });
    },
  });

  useEffect(() => {
    if (!roomId || !user) return;

    // Subscribe to opponent score updates (filtered by room)
    const subscription = supabase
      .channel(`scores_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'multiplayer_game_states',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          // Only update opponent score, not our own
          if (payload.new.user_id !== user.id) {
            setOpponentScore(payload.new.score || 0);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId, user]);

  const updateMyScore = async (score: number) => {
    if (!roomId || !user) return;

    setMyScore(score);
    await supabase
      .from('multiplayer_game_states')
      .update({ score, updated_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('user_id', user.id);
  };

  const finishGame = async () => {
    if (!roomId || !user) return;

    await supabase
      .from('multiplayer_game_states')
      .update({
        finished: true,
        finish_time: new Date().toISOString(),
        status: 'finished',
      })
      .eq('room_id', roomId)
      .eq('user_id', user.id);
  };

  return (
    <MultiplayerContext.Provider
      value={{
        isMultiplayer: !!roomId,
        roomId: roomId || null,
        opponentScore,
        myScore,
        updateMyScore,
        finishGame,
      }}
    >
      {children}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ visible: false, message: '', type: 'info' })}
      />
    </MultiplayerContext.Provider>
  );
};

/**
 * Hook to access multiplayer context in game components
 *
 * @returns Multiplayer context with score tracking and game control methods
 *
 * Note: Returns a default "single-player" context if used outside MultiplayerProvider
 */
export const useMultiplayer = () => {
  const context = useContext(MultiplayerContext);

  if (!context) {
    // Return null context for single-player mode
    return {
      isMultiplayer: false,
      roomId: null,
      opponentScore: 0,
      myScore: 0,
      updateMyScore: async () => { },
      finishGame: async () => { },
    };
  }

  return context;
};
