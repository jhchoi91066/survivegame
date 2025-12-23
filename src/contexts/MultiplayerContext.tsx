import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { usePresence } from '../hooks/usePresence';
import Toast from '../components/shared/Toast';

interface MultiplayerContextValue {
  isMultiplayer: boolean;
  roomId: string | null;
  opponentScore: number;
  opponentFinished: boolean;
  myScore: number;
  gameResult: 'none' | 'win' | 'lose' | 'tie';
  gameTimeRemaining: number | null;
  elapsedTime: number; // Synchronized elapsed time in seconds
  updateMyScore: (score: number) => Promise<void>;
  finishGame: () => Promise<void>;
}

const MultiplayerContext = createContext<MultiplayerContextValue | null>(null);

export const MultiplayerProvider: React.FC<{
  roomId?: string;
  children: React.ReactNode;
}> = ({ roomId, children }) => {
  const { user } = useAuth();
  const [opponentScore, setOpponentScore] = useState(0);
  const [opponentFinished, setOpponentFinished] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [gameResult, setGameResult] = useState<'none' | 'win' | 'lose' | 'tie'>('none');
  const [gameTimeRemaining, setGameTimeRemaining] = useState<number | null>(null);
  const [opponentFinishTime, setOpponentFinishTime] = useState<string | null>(null);
  const [myFinishTime, setMyFinishTime] = useState<string | null>(null);
  const [gameStartedAt, setGameStartedAt] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'info' | 'success' | 'warning' | 'error' }>({ visible: false, message: '', type: 'info' });

  // Integrate presence management
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

  // Fetch room data to get game_started_at
  useEffect(() => {
    if (!roomId) return;

    const fetchRoomData = async () => {
      const { data } = await supabase
        .from('multiplayer_rooms')
        .select('game_started_at')
        .eq('id', roomId)
        .single();

      if (data?.game_started_at) {
        setGameStartedAt(data.game_started_at);
      }
    };

    fetchRoomData();
  }, [roomId]);

  // Update elapsed time based on game_started_at
  useEffect(() => {
    if (!gameStartedAt) return;

    const updateElapsedTime = () => {
      const now = new Date().getTime();
      const startTime = new Date(gameStartedAt).getTime();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsed >= 0 ? elapsed : 0);
    };

    // Update immediately
    updateElapsedTime();

    // Then update every second
    const interval = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(interval);
  }, [gameStartedAt]);

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
            setOpponentFinished(payload.new.finished || false);
            if (payload.new.finished && payload.new.finish_time) {
              setOpponentFinishTime(payload.new.finish_time);
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId, user]);

  // Determine game result when both players finish
  useEffect(() => {
    if (!myFinishTime || !opponentFinishTime) return;

    // For time-based games (Flip & Match), lower time wins
    // For score-based games, higher score wins
    // We'll use finish_time to determine who finished first
    const myFinish = new Date(myFinishTime).getTime();
    const opponentFinish = new Date(opponentFinishTime).getTime();

    if (myFinish < opponentFinish) {
      setGameResult('win');
    } else if (myFinish > opponentFinish) {
      setGameResult('lose');
    } else {
      // If same time, compare scores
      if (myScore > opponentScore) {
        setGameResult('win');
      } else if (myScore < opponentScore) {
        setGameResult('lose');
      } else {
        setGameResult('tie');
      }
    }
  }, [myFinishTime, opponentFinishTime, myScore, opponentScore]);

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

    const finishTime = new Date().toISOString();
    setMyFinishTime(finishTime);

    await supabase
      .from('multiplayer_game_states')
      .update({
        finished: true,
        finish_time: finishTime,
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
        opponentFinished,
        myScore,
        gameResult,
        gameTimeRemaining,
        elapsedTime,
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

export const useMultiplayer = () => {
  const context = useContext(MultiplayerContext);

  if (!context) {
    return {
      isMultiplayer: false,
      roomId: null,
      opponentScore: 0,
      opponentFinished: false,
      myScore: 0,
      gameResult: 'none' as const,
      gameTimeRemaining: null,
      elapsedTime: 0,
      updateMyScore: async () => { },
      finishGame: async () => { },
    };
  }

  return context;
};
