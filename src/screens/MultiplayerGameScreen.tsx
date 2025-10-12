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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { hapticPatterns } from '../utils/haptics';
import { useTheme } from '../contexts/ThemeContext';

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
}

interface GameState {
  status: 'waiting' | 'countdown' | 'playing' | 'finished';
  players: Player[];
  startTime?: number;
}

const MultiplayerGameScreen: React.FC<MultiplayerGameProps> = ({ navigation, route }) => {
  const { roomId, gameType, difficulty } = route.params;
  const { user } = useAuth();
  const { theme } = useTheme();
  const [gameState, setGameState] = useState<GameState>({
    status: 'waiting',
    players: [],
  });
  const [countdown, setCountdown] = useState(3);
  const [myScore, setMyScore] = useState(0);
  const [opponentReady, setOpponentReady] = useState(false);

  useEffect(() => {
    if (!user) {
      navigation.goBack();
      return;
    }

    loadGameState();

    // 실시간 게임 상태 구독
    const subscription = supabase
      .channel(`multiplayer_game_${roomId}`)
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

    return () => {
      subscription.unsubscribe();
      leaveRoom();
    };
  }, [user, roomId]);

  useEffect(() => {
    if (gameState.status === 'countdown') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        startGame();
      }
    }
  }, [gameState.status, countdown]);

  const loadGameState = async () => {
    try {
      const { data, error } = await supabase
        .from('multiplayer_game_states')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const players = data.map((state: any) => ({
          id: state.user_id,
          username: state.username || 'Player',
          score: state.score || 0,
          finished: state.finished || false,
        }));

        const allReady = players.length >= 2;
        setOpponentReady(allReady);

        const newStatus = data[0].status || 'waiting';

        setGameState({
          status: newStatus,
          players,
          startTime: data[0].start_time,
        });

        // 모두 준비되면 카운트다운 시작 (현재 상태가 waiting인 경우만)
        if (allReady && newStatus === 'waiting') {
          await updateGameStatus('countdown');
        }
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
    }
  };

  const updateGameStatus = async (status: string) => {
    try {
      await supabase.from('multiplayer_game_states').upsert({
        room_id: roomId,
        user_id: user?.id,
        status: status,
        username: user?.user_metadata?.username || 'Player',
      });
    } catch (error) {
      console.error('Failed to update game status:', error);
    }
  };

  const startGame = async () => {
    try {
      hapticPatterns.levelComplete();

      // 게임 시작 상태 업데이트
      await updateGameStatus('playing');

      // 실제 게임 타입에 따라 게임 시작
      switch (gameType) {
        case 'flip_match':
          navigation.replace('FlipMatchGame');
          break;
        case 'spatial_memory':
          navigation.replace('SpatialMemoryGame');
          break;
        case 'math_rush':
          navigation.replace('MathRushGame');
          break;
        case 'stroop':
          navigation.replace('StroopTestGame');
          break;
      }
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  const leaveRoom = async () => {
    try {
      // 방에서 나가기
      await supabase
        .from('multiplayer_game_states')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user?.id);

      // 방 삭제 (방장인 경우)
      await supabase.from('multiplayer_rooms').delete().eq('id', roomId).eq('created_by', user?.id);
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  };

  const handleReady = async () => {
    hapticPatterns.buttonPress();
    await updateGameStatus('ready');
  };

  const handleLeave = () => {
    if (Platform.OS === 'web') {
      // 웹에서는 window.confirm 사용
      if (window.confirm('정말로 방을 나가시겠습니까?')) {
        leaveRoom();
        navigation.goBack();
      }
    } else {
      // 모바일에서는 Alert 사용
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

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={styles.gradient} />

      <View style={styles.content}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Pressable onPress={handleLeave} style={styles.leaveButton}>
            <Text style={styles.leaveText}>← 나가기</Text>
          </Pressable>
          <Text style={styles.gameTitle}>
            {getGameEmoji(gameType)} {getGameName(gameType)}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* 상태별 화면 */}
        {gameState.status === 'waiting' && (
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingEmoji}>⏳</Text>
            <Text style={styles.waitingTitle}>상대방을 기다리는 중...</Text>
            <Text style={styles.waitingSubtitle}>곧 게임이 시작됩니다</Text>

            {/* 플레이어 목록 */}
            <View style={styles.playersList}>
              {gameState.players.map((player, index) => (
                <View key={player.id} style={styles.playerCard}>
                  <LinearGradient
                    colors={
                      player.id === user?.id
                        ? ['#3b82f6', '#2563eb']
                        : ['#1e293b', '#0f172a']
                    }
                    style={styles.playerCardGradient}
                  >
                    <Text style={styles.playerEmoji}>
                      {player.id === user?.id ? '👤' : '🎮'}
                    </Text>
                    <Text style={styles.playerName}>{player.username}</Text>
                    <Text style={styles.playerStatus}>
                      {player.id === user?.id ? '준비됨' : opponentReady ? '준비됨' : '대기 중'}
                    </Text>
                  </LinearGradient>
                </View>
              ))}
            </View>

            {!opponentReady && (
              <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
            )}
          </View>
        )}

        {gameState.status === 'countdown' && (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownNumber}>{countdown}</Text>
            <Text style={styles.countdownText}>게임 시작!</Text>
          </View>
        )}

        {gameState.status === 'playing' && (
          <View style={styles.playingContainer}>
            <Text style={styles.playingText}>게임 진행 중...</Text>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        )}

        {gameState.status === 'finished' && (
          <View style={styles.finishedContainer}>
            <Text style={styles.finishedEmoji}>🏆</Text>
            <Text style={styles.finishedTitle}>게임 종료!</Text>

            {/* 결과 */}
            <View style={styles.results}>
              {gameState.players
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <View key={player.id} style={styles.resultCard}>
                    <Text style={styles.resultRank}>#{index + 1}</Text>
                    <Text style={styles.resultName}>{player.username}</Text>
                    <Text style={styles.resultScore}>{player.score}점</Text>
                  </View>
                ))}
            </View>

            <Pressable onPress={() => navigation.navigate('MultiplayerLobby')} style={styles.backToLobbyButton}>
              <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.backToLobbyGradient}>
                <Text style={styles.backToLobbyText}>로비로 돌아가기</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}
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
  loader: {
    marginTop: 16,
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
    marginBottom: 32,
  },
  results: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
  },
  resultRank: {
    fontSize: 24,
    fontWeight: '900',
    color: '#3b82f6',
    marginRight: 16,
    width: 40,
  },
  resultName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  resultScore: {
    fontSize: 20,
    fontWeight: '700',
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
});

export default MultiplayerGameScreen;
