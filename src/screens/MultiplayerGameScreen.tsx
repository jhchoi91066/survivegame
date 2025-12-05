import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  Share,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { hapticPatterns } from '../utils/haptics';
import { useTheme } from '../contexts/ThemeContext';
import { usePresence } from '../hooks/usePresence';
import {
  saveReconnectData,
  getReconnectData,
  attemptReconnect,
  clearReconnectData,
} from '../utils/reconnection';
import Toast from '../components/shared/Toast';
import { GlassView } from '../components/shared/GlassView';

type MultiplayerGameNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MultiplayerGame'
>;
type MultiplayerGameRouteProp = RouteProp<RootStackParamList, 'MultiplayerGame'>;

interface MultiplayerGameProps {
  navigation: MultiplayerGameNavigationProp;
  route: MultiplayerGameRouteProp;
}

interface Player {
  id: string;
  username: string;
  score: number;
  finished: boolean;
  connection_status: string;
}

interface GameState {
  status: 'waiting' | 'countdown' | 'playing' | 'finished';
  players: Player[];
  startTime?: number;
}

const MultiplayerGameScreen: React.FC<MultiplayerGameProps> = ({ navigation, route }) => {
  const { roomId, gameType, difficulty, isCreator } = route.params;
  const { user } = useAuth();
  const { theme, themeMode } = useTheme();
  const [gameState, setGameState] = useState<GameState>({
    status: 'waiting',
    players: [],
  });
  const [countdown, setCountdown] = useState(3);
  const [opponentReady, setOpponentReady] = useState(false);
  const [isRoomCreator, setIsRoomCreator] = useState(isCreator || false);
  const isRoomCreatorRef = React.useRef(isCreator || false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'info' | 'success' | 'warning' | 'error' }>({ visible: false, message: '', type: 'info' });
  const [waitingTime, setWaitingTime] = useState(0);
  const [waitingTimeoutReached, setWaitingTimeoutReached] = useState(false);
  const isGameStarting = React.useRef(false);
  const shouldDisconnectOnUnmount = React.useRef(true);

  // Animation values for countdown
  const countdownScale = useSharedValue(1);
  const countdownOpacity = useSharedValue(1);

  // Animated styles
  const countdownAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countdownScale.value }],
    opacity: countdownOpacity.value,
  }));

  // Presence tracking with disconnect/reconnect notifications
  const { reconnectToken } = usePresence({
    roomId,
    onPlayerDisconnected: (userId) => {
      setToast({
        visible: true,
        message: '상대방 연결 끊김 - 60초 내 재연결 대기 중',
        type: 'warning',
      });
    },
    onPlayerReconnected: (userId) => {
      setToast({
        visible: true,
        message: '상대방이 재연결되었습니다!',
        type: 'success',
      });
      hapticPatterns.levelComplete();
    },
    shouldDisconnectOnUnmount,
  });

  // Initial setup and reconnection attempt
  useEffect(() => {
    if (!user) {
      navigation.goBack();
      return;
    }

    // Check if this is the room creator (fallback if param missing)
    if (isCreator === undefined) {
      checkIfRoomCreator();
    }

    // Try to reconnect if coming back from disconnect
    tryReconnect();

    // Save reconnection data
    saveReconnectData(roomId, user.id, reconnectToken);

    // Load initial game state
    loadGameState();

    // Subscribe to game state changes (filtered by room)
    const subscription = supabase
      .channel(`game_room_${roomId}_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'multiplayer_game_states',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadGameState();
        }
      )
      .subscribe();

    // Subscribe to room changes for synchronized countdown
    const roomSubscription = supabase
      .channel(`room_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'multiplayer_rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          handleRoomUpdate(payload.new);
        }
      )
      .subscribe((status) => {
        console.log(`Room subscription status: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to room_${roomId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Failed to subscribe to room_${roomId}`);
        } else if (status === 'TIMED_OUT') {
          console.error(`Subscription to room_${roomId} timed out`);
        }
      });

    // Cleanup
    return () => {
      subscription.unsubscribe();
      roomSubscription.unsubscribe();
      // Do NOT clear reconnect data here automatically
      // It should only be cleared when explicitly leaving or finishing
    };
  }, [user, roomId, reconnectToken]);

  // Waiting time counter and timeout (120 seconds)
  useEffect(() => {
    if (gameState.status === 'waiting' && !opponentReady) {
      const interval = setInterval(() => {
        setWaitingTime((prev) => {
          const newTime = prev + 1;

          // Warning at 60 seconds
          if (newTime === 60) {
            setToast({
              visible: true,
              message: '상대방을 기다리는 중... (1분 경과)',
              type: 'warning',
            });
          }

          // Timeout at 120 seconds
          if (newTime >= 120) {
            setWaitingTimeoutReached(true);
            setToast({
              visible: true,
              message: '상대방이 참가하지 않아 방을 나갑니다',
              type: 'error',
            });
            hapticPatterns.wrongAnswer();

            // Leave room and go back after showing toast
            setTimeout(async () => {
              await leaveRoom();
              navigation.goBack();
            }, 2000);
          }

          return newTime;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      // Reset waiting time when opponent joins or game starts
      setWaitingTime(0);
    }
  }, [gameState.status, opponentReady]);

  // Countdown timer with animation
  useEffect(() => {
    if (gameState.status === 'countdown' && countdown > 0) {
      // Trigger animation on each countdown change
      countdownScale.value = withSequence(
        withSpring(0.5, { damping: 10, stiffness: 200 }),
        withSpring(1.3, { damping: 8, stiffness: 100 }),
        withSpring(1, { damping: 12 })
      );
      hapticPatterns.buttonPress();

      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState.status === 'countdown' && countdown === 0) {
      // Final "GO!" animation
      countdownOpacity.value = withTiming(0, { duration: 300 });
      // Countdown finished, start game
      startGame();
    }
  }, [gameState.status, countdown]);

  // [Fallback] Polling for room status in case Realtime fails
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    if (gameState.status === 'waiting') {
      pollInterval = setInterval(async () => {
        try {
          const { data, error } = await supabase
            .from('multiplayer_rooms')
            .select('status, game_started_at')
            .eq('id', roomId)
            .single();

          if (error) throw error;

          // Log what we found for debugging
          // console.log('Polling status:', data?.status); 

          if (data && (data.status === 'countdown' || data.status === 'playing')) {
            console.log('Polling found updated status:', data.status);
            handleRoomUpdate(data);
          } else {
            // Log occasionally or if status is unexpected
            if (Math.random() < 0.1) console.log('Still waiting, polled status:', data?.status);
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 500); // Poll every 0.5 second
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [gameState.status, roomId]);

  const checkIfRoomCreator = async () => {
    try {
      const { data, error } = await supabase
        .from('multiplayer_rooms')
        .select('created_by')
        .eq('id', roomId)
        .single();

      if (error) throw error;
      const isCreator = data.created_by === user?.id;
      setIsRoomCreator(isCreator);
      isRoomCreatorRef.current = isCreator;
    } catch (error) {
      console.error('Failed to check room creator:', error);
    }
  };

  const tryReconnect = async () => {
    const reconnectData = await getReconnectData();
    if (reconnectData && reconnectData.roomId === roomId) {
      const success = await attemptReconnect(reconnectData);
      if (success) {
        setToast({
          visible: true,
          message: '게임에 다시 연결되었습니다!',
          type: 'success',
        });
        hapticPatterns.correctAnswer();
      }
    }
  };

  const handleRoomUpdate = (roomData: any) => {
    console.log('Room update received:', roomData);
    // Handle synchronized countdown
    if (roomData.status === 'countdown' && roomData.game_started_at) {
      const startTime = new Date(roomData.game_started_at).getTime();
      const now = Date.now();
      const remainingMs = startTime - now;

      if (remainingMs > 0) {
        setGameState((prev) => ({ ...prev, status: 'countdown' }));
        setCountdown(Math.ceil(remainingMs / 1000));

        // Schedule game start
        setTimeout(() => {
          startGame();
        }, remainingMs);
      } else {
        // Already past start time, start immediately
        startGame();
      }
    } else if (roomData.status === 'playing') {
      // If game is already playing (we missed countdown), join immediately
      console.log('Game is already playing, joining immediately');
      startGame();
    }
  };

  const loadGameState = async () => {
    try {
      // Fetch game state (players)
      const { data, error } = await supabase
        .from('multiplayer_game_states')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log('Loaded game state:', data);

      // [New] Also fetch room status to catch up if we missed updates
      const { data: roomData, error: roomError } = await supabase
        .from('multiplayer_rooms')
        .select('status, game_started_at')
        .eq('id', roomId)
        .single();

      if (!roomError && roomData) {
        console.log('Loaded room status:', roomData.status);
        if (roomData.status === 'countdown' || roomData.status === 'playing') {
          // If room is already started, handle it (this will trigger startGame)
          handleRoomUpdate(roomData);
        }
      }

      // Self-healing: If I am not in the game state, insert myself
      const myState = data?.find((s: any) => s.user_id === user?.id);
      if (!myState && user) {
        console.log('Missing game state for current user, inserting...');
        const { error: insertError } = await supabase
          .from('multiplayer_game_states')
          .insert({
            room_id: roomId,
            user_id: user.id,
            username: user.user_metadata?.username || 'Player',
            status: 'waiting',
            score: 0,
            finished: false
          });

        if (insertError) {
          console.error('Failed to insert missing game state:', insertError);
        } else {
          // The subscription will trigger a reload
          return;
        }
      }

      if (data && data.length > 0) {
        const players = data.map((state: any) => ({
          id: state.user_id,
          username: state.username || 'Player',
          score: state.score || 0,
          finished: state.finished || false,
          connection_status: state.connection_status || 'connected',
        }));

        const allReady = players.length >= 2;
        setOpponentReady(allReady);
        console.log('Players:', players.length, 'All Ready:', allReady, 'Is Creator:', isRoomCreatorRef.current);

        const newStatus = data[0].status || 'waiting';

        setGameState({
          status: newStatus,
          players,
          startTime: data[0].start_time,
        });

        // If all ready and still waiting, room creator triggers countdown
        // Use ref to ensure we have the latest value inside the subscription callback
        // Also check if we are the creator by querying DB if needed
        if (allReady && newStatus === 'waiting') {
          // Double check creator status if not sure
          if (isRoomCreatorRef.current) {
            console.log('All players ready, starting countdown as creator');
            startCountdown();
          } else {
            // Fallback: Check if I am the creator in the room data
            checkIfRoomCreator().then(() => {
              if (isRoomCreatorRef.current) {
                console.log('All players ready, starting countdown as creator (delayed check)');
                startCountdown();
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
    }
  };

  const startCountdown = async () => {
    console.log('Attempting to start countdown. Is Creator:', isRoomCreatorRef.current);
    if (!isRoomCreatorRef.current) return; // Only room creator can start countdown

    try {
      // Set countdown start time in database (3 seconds from now)
      const startTime = new Date(Date.now() + 3000).toISOString();
      console.log('Updating room status to countdown:', startTime);

      const { error } = await supabase
        .from('multiplayer_rooms')
        .update({
          status: 'countdown',
          game_started_at: startTime,
        })
        .eq('id', roomId);

      if (error) {
        console.error('Error updating room status:', error);
      } else {
        console.log('Room status updated to countdown successfully');
        // [Optimistic Update] Immediately handle the update locally
        handleRoomUpdate({
          status: 'countdown',
          game_started_at: startTime
        });
      }
    } catch (error) {
      console.error('Failed to start countdown:', error);
    }
  };

  const startGame = async () => {
    try {
      isGameStarting.current = true;
      shouldDisconnectOnUnmount.current = false; // Don't disconnect when navigating to game
      hapticPatterns.levelComplete();

      // Update room status to playing
      if (isRoomCreator) {
        await supabase
          .from('multiplayer_rooms')
          .update({ status: 'playing' })
          .eq('id', roomId);
      }

      // Navigate to game with multiplayer context
      switch (gameType) {
        case 'flip_match':
          navigation.replace('FlipMatchGame', {
            multiplayerRoomId: roomId,
            difficulty: difficulty,
          });
          break;
        case 'spatial_memory':
          navigation.replace('SpatialMemoryGame', {
            multiplayerRoomId: roomId,
            difficulty: difficulty,
          });
          break;
        case 'math_rush':
          navigation.replace('MathRushGame', {
            multiplayerRoomId: roomId,
            difficulty: difficulty,
          });
          break;
        case 'stroop':
          navigation.replace('StroopTestGame', {
            multiplayerRoomId: roomId,
            difficulty: difficulty,
          });
          break;
      }
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  const leaveRoom = async () => {
    try {
      // Mark as disconnected in presence
      await supabase
        .from('player_presence')
        .update({ status: 'disconnected' })
        .eq('user_id', user?.id)
        .eq('room_id', roomId);

      // Delete game state
      await supabase
        .from('multiplayer_game_states')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user?.id);

      // Delete room if creator
      if (isRoomCreator) {
        await supabase.from('multiplayer_rooms').delete().eq('id', roomId);
      }

      // Clear reconnection data since we are explicitly leaving
      await clearReconnectData();
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  };

  const handleLeave = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('정말로 방을 나가시겠습니까?')) {
        leaveRoom();
        navigation.goBack();
      }
    } else {
      Alert.alert('방 나가기', '정말로 나가시겠습니까?', [
        { text: '취소', style: 'cancel' },
        {
          text: '나가기',
          style: 'destructive',
          onPress: () => {
            leaveRoom();
            navigation.goBack();
          },
        },
      ]);
    }
  };

  const handleShareRoomCode = async () => {
    try {
      hapticPatterns.buttonPress();
      const shortRoomId = roomId.slice(0, 8);

      if (Platform.OS === 'web') {
        // Web: Copy to clipboard
        await navigator.clipboard.writeText(roomId);
        setToast({
          visible: true,
          message: `방 코드 복사됨: ${shortRoomId}...`,
          type: 'success',
        });
      } else {
        // Mobile: Use Share API
        await Share.share({
          message: `Brain Games 멀티플레이어 방에 참가하세요!\n방 ID: ${roomId}\n게임: ${getGameName(gameType)}`,
          title: 'Brain Games 방 코드',
        });
      }
    } catch (error) {
      console.error('Failed to share room code:', error);
      setToast({
        visible: true,
        message: '방 코드 공유 실패',
        type: 'error',
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={themeMode === 'dark' ? ['#0f172a', '#1e293b', '#0f172a'] : ['#f0f9ff', '#e0f2fe', '#f0f9ff']}
        style={styles.gradient}
      />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={handleLeave}
            style={styles.leaveButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="게임 나가기"
            accessibilityHint="멀티플레이어 게임에서 나가고 로비로 돌아갑니다"
          >
            <Text style={styles.leaveText}>← 나가기</Text>
          </Pressable>
          <Text style={[styles.gameTitle, { color: theme.colors.text }]} accessibilityRole="header">
            <Text accessibilityElementsHidden={true}>{getGameEmoji(gameType)} </Text>
            {getGameName(gameType)}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Waiting for players */}
        {gameState.status === 'waiting' && (
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingEmoji}>⏳</Text>
            <Text style={[styles.waitingTitle, { color: theme.colors.text }]}>상대방을 기다리는 중...</Text>
            <Text style={[styles.waitingSubtitle, { color: theme.colors.textSecondary }]}>곧 게임이 시작됩니다</Text>
            {!opponentReady && waitingTime > 0 && (
              <Text
                style={[
                  styles.waitingTimer,
                  waitingTime >= 90 && styles.waitingTimerWarning,
                  { color: theme.colors.textSecondary }
                ]}
                accessible={true}
                accessibilityRole="timer"
                accessibilityLabel={`대기 시간: ${waitingTime}초`}
              >
                대기 시간: {waitingTime}초 / 120초
              </Text>
            )}

            {/* Room Code Share Button */}
            {!opponentReady && (
              <Pressable
                onPress={handleShareRoomCode}
                style={styles.shareButton}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="방 코드 공유하기"
                accessibilityHint="친구에게 방 코드를 공유하여 초대합니다"
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.shareButtonGradient}
                >
                  <Text style={styles.shareButtonText}>📋 방 코드 공유</Text>
                  <Text style={styles.shareButtonSubtext}>
                    {roomId.slice(0, 8)}...
                  </Text>
                </LinearGradient>
              </Pressable>
            )}

            {/* Players list with connection status */}
            <View style={styles.playersList}>
              {gameState.players.map((player) => (
                <View
                  key={player.id}
                  style={styles.playerCard}
                  accessible={true}
                  accessibilityRole="summary"
                  accessibilityLabel={`플레이어: ${player.username}`}
                  accessibilityValue={{
                    text:
                      player.connection_status === 'disconnected'
                        ? '연결 끊김'
                        : player.id === user?.id
                          ? '준비됨'
                          : opponentReady
                            ? '준비됨'
                            : '대기 중',
                  }}
                >
                  <GlassView
                    style={styles.playerCardGradient}
                    intensity={20}
                    tint={themeMode === 'dark' ? 'dark' : 'light'}
                  >
                    <Text style={styles.playerEmoji} accessibilityElementsHidden={true}>
                      {player.id === user?.id ? '👤' : '🎮'}
                    </Text>
                    <Text style={[styles.playerName, { color: theme.colors.text }]}>{player.username}</Text>
                    <Text style={[styles.playerStatus, { color: theme.colors.textSecondary }]}>
                      {player.connection_status === 'disconnected'
                        ? '연결 끊김'
                        : player.id === user?.id
                          ? '준비됨'
                          : opponentReady
                            ? '준비됨'
                            : '대기 중'}
                    </Text>
                  </GlassView>
                </View>
              ))}
            </View>

            {!opponentReady && (
              <>
                {/* Helpful tips */}
                <GlassView style={styles.tipsContainer} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
                  <Text style={[styles.tipsTitle, { color: theme.colors.primary }]}>💡 게임 팁</Text>
                  <Text style={[styles.tipsText, { color: theme.colors.text }]}>
                    {getGameTip(gameType)}
                  </Text>
                </GlassView>

                <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />

                {/* Manual Controls */}
                <View style={styles.manualControls}>
                  <Pressable
                    onPress={loadGameState}
                    style={styles.refreshButton}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="새로고침"
                  >
                    <Text style={styles.refreshButtonText}>🔄 새로고침</Text>
                  </Pressable>

                  {isRoomCreator && gameState.players.length >= 2 && (
                    <Pressable
                      onPress={startCountdown}
                      style={styles.forceStartButton}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="강제 시작"
                    >
                      <Text style={styles.forceStartButtonText}>▶️ 강제 시작</Text>
                    </Pressable>
                  )}
                </View>

                {/* Cancel button */}
                <Pressable
                  onPress={handleLeave}
                  style={styles.cancelButton}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="대기 취소"
                  accessibilityHint="대기를 취소하고 로비로 돌아갑니다"
                >
                  <Text style={styles.cancelButtonText}>대기 취소</Text>
                </Pressable>
              </>
            )}
          </View>
        )}

        {/* Synchronized countdown */}
        {gameState.status === 'countdown' && (
          <View
            style={styles.countdownContainer}
            accessible={true}
            accessibilityRole="timer"
            accessibilityLiveRegion="polite"
            accessibilityLabel={`게임 시작까지 ${countdown}초`}
          >
            <Animated.Text style={[styles.countdownNumber, countdownAnimatedStyle]} accessibilityElementsHidden={true}>
              {countdown > 0 ? countdown : 'GO!'}
            </Animated.Text>
            <Text style={[styles.countdownText, { color: theme.colors.text }]}>게임 시작!</Text>
          </View>
        )}

        {/* Game in progress */}
        {gameState.status === 'playing' && (
          <View style={styles.playingContainer}>
            <Text style={[styles.playingText, { color: theme.colors.text }]}>게임 진행 중...</Text>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        )}

        {/* Game finished */}
        {gameState.status === 'finished' && (
          <View style={styles.finishedContainer}>
            {(() => {
              const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
              const winner = sortedPlayers[0];
              const isWinner = winner?.id === user?.id;

              return (
                <>
                  <Text style={styles.finishedEmoji}>{isWinner ? '🎉' : '😊'}</Text>
                  <Text style={[styles.finishedTitle, { color: theme.colors.text }]}>
                    {isWinner ? '승리!' : '패배'}
                  </Text>

                  {isWinner && (
                    <Text style={[styles.winnerSubtitle, { color: theme.colors.textSecondary }]}>축하합니다! 상대를 이겼습니다!</Text>
                  )}

                  {/* Winner highlight */}
                  <GlassView style={styles.winnerCard} intensity={30} tint={themeMode === 'dark' ? 'dark' : 'light'}>
                    <Text style={styles.winnerBadge}>👑 우승자</Text>
                    <Text style={[styles.winnerName, { color: theme.colors.text }]}>{winner?.username}</Text>
                    <Text style={styles.winnerScore}>{winner?.score}점</Text>
                  </GlassView>

                  {/* Results */}
                  <View style={styles.results}>
                    <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>최종 결과</Text>
                    {sortedPlayers.map((player, index) => (
                      <GlassView
                        key={player.id}
                        style={[
                          styles.resultCard,
                          index === 0 && styles.resultCardWinner,
                          player.id === user?.id && styles.resultCardYou
                        ]}
                        intensity={20}
                        tint={themeMode === 'dark' ? 'dark' : 'light'}
                      >
                        <Text style={[styles.resultRank, index === 0 && styles.resultRankWinner]}>
                          {index === 0 ? '🥇' : '🥈'}
                        </Text>
                        <View style={styles.resultInfo}>
                          <Text style={[styles.resultName, index === 0 && styles.resultNameWinner, { color: theme.colors.text }]}>
                            {player.username}
                            {player.id === user?.id && ' (나)'}
                          </Text>
                          <Text style={[styles.resultRankText, { color: theme.colors.textSecondary }]}>#{index + 1}</Text>
                        </View>
                        <Text style={[styles.resultScore, index === 0 && styles.resultScoreWinner, { color: theme.colors.primary }]}>
                          {player.score}점
                        </Text>
                      </GlassView>
                    ))}
                  </View>

                  <Pressable
                    onPress={() => navigation.navigate('MultiplayerLobby' as never)}
                    style={styles.backToLobbyButton}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="로비로 돌아가기"
                    accessibilityHint="멀티플레이어 로비로 이동하여 새 게임을 시작합니다"
                  >
                    <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.backToLobbyGradient}>
                      <Text style={styles.backToLobbyText}>로비로 돌아가기</Text>
                    </LinearGradient>
                  </Pressable>
                </>
              );
            })()}
          </View>
        )}

        {/* Toast notifications */}
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast({ visible: false, message: '', type: 'info' })}
        />
      </View>
    </SafeAreaView>
  );
};

const getGameEmoji = (gameType: string): string => {
  const emojis: { [key: string]: string } = {
    flip_match: '🎴',
    spatial_memory: '🧠',
    math_rush: '➕',
    stroop: '🎨',
  };
  return emojis[gameType] || '🎮';
};

const getGameName = (gameType: string): string => {
  const names: { [key: string]: string } = {
    flip_match: 'Flip & Match',
    spatial_memory: 'Spatial Memory',
    math_rush: 'Math Rush',
    stroop: 'Stroop Test',
  };
  return names[gameType] || gameType;
};

const getGameTip = (gameType: string): string => {
  const tips: { [key: string]: string } = {
    flip_match: '같은 그림을 빠르게 찾아 매칭하세요. 패턴을 기억하면 더 빠르게 찾을 수 있습니다!',
    spatial_memory: '타일의 위치를 정확히 기억하세요. 집중력이 승부를 결정합니다!',
    math_rush: '빠르고 정확하게 계산하세요. 침착함이 승리의 열쇠입니다!',
    stroop: '글자가 아닌 색상에 집중하세요. 직관을 믿으면 더 빠릅니다!',
  };
  return tips[gameType] || '최선을 다하세요!';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: Platform.OS === 'web' ? 40 : 0,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  leaveButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaveText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 80,
  },
  waitingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  waitingEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  waitingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  waitingSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 32,
  },
  waitingTimer: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },
  waitingTimerWarning: {
    color: '#f59e0b',
  },
  shareButton: {
    width: '100%',
    maxWidth: 280,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  shareButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  shareButtonSubtext: {
    fontSize: 12,
    color: '#d1fae5',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  playersList: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  playerCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  playerCardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  playerEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  playerStatus: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  tipsContainer: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#60a5fa',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  loader: {
    marginTop: 16,
  },
  cancelButton: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 32,
    paddingVertical: 12,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  countdownContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNumber: {
    fontSize: 120,
    fontWeight: '900',
    color: '#3b82f6',
    marginBottom: 16,
  },
  countdownText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  playingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  playingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  finishedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  finishedEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  finishedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  winnerSubtitle: {
    fontSize: 16,
    color: '#10b981',
    marginBottom: 24,
    fontWeight: '600',
  },
  winnerCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 2,
    borderColor: '#10b981',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  winnerBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 12,
  },
  winnerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  winnerScore: {
    fontSize: 32,
    fontWeight: '900',
    color: '#10b981',
  },
  results: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 12,
    textAlign: 'center',
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
  },
  resultCardWinner: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  resultCardYou: {
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  resultRank: {
    fontSize: 32,
    marginRight: 16,
    width: 40,
  },
  resultRankWinner: {
    fontSize: 36,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  resultNameWinner: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
  },
  resultRankText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  resultScore: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
  },
  resultScoreWinner: {
    fontSize: 24,
    color: '#10b981',
  },
  backToLobbyButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  backToLobbyGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToLobbyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  manualControls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    justifyContent: 'center',
  },
  refreshButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  refreshButtonText: {
    color: '#60a5fa',
    fontWeight: '600',
    fontSize: 14,
  },
  forceStartButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  forceStartButtonText: {
    color: '#34d399',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default MultiplayerGameScreen;
