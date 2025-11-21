import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { hapticPatterns } from '../utils/haptics';
import { useTheme } from '../contexts/ThemeContext';
import { GlassView } from '../components/shared/GlassView';

type MultiplayerLobbyNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MultiplayerLobby'
>;

interface MultiplayerLobbyProps {
  navigation: MultiplayerLobbyNavigationProp;
}

interface Room {
  id: string;
  created_by: string;
  game_type: string;
  difficulty?: string;
  status: 'waiting' | 'playing' | 'finished';
  max_players: number;
  current_players: number;
  created_at: string;
  creator_profile: {
    username: string;
    country_code?: string;
  };
}

const MultiplayerLobbyScreen: React.FC<MultiplayerLobbyProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { theme, themeMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) {
      Alert.alert('로그인 필요', '멀티플레이어 기능을 사용하려면 로그인해주세요.', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
      return;
    }

    loadRooms();

    // 실시간 업데이트 구독 (waiting 방만 필터링)
    const subscription = supabase
      .channel('lobby_rooms')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'multiplayer_rooms',
          filter: 'status=eq.waiting',
        },
        () => {
          loadRooms();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const loadRooms = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('multiplayer_rooms')
        .select(
          `
          id,
          created_by,
          game_type,
          difficulty,
          status,
          max_players,
          current_players,
          created_at,
          creator_profile:profiles!multiplayer_rooms_created_by_fkey (
            username,
            country_code
          )
        `
        )
        .eq('status', 'waiting')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRooms((data as any) || []);
    } catch (error) {
      console.error('Failed to load rooms:', error);
      Alert.alert('오류', '방 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async (gameType: string, difficulty?: string) => {
    if (!user) return;

    try {
      setCreating(true);
      hapticPatterns.buttonPress();

      const { data, error } = await supabase
        .from('multiplayer_rooms')
        .insert({
          created_by: user.id,
          game_type: gameType,
          difficulty: difficulty,
          status: 'waiting',
          max_players: 2,
          current_players: 0, // join_multiplayer_room이 1씩 증가시키므로 0으로 시작
        })
        .select()
        .single();

      if (error) throw error;

      console.log('[DEBUG] Room created with current_players:', data.current_players);

      // 방 생성자도 join_multiplayer_room 함수를 호출해야 game_state가 생성됨
      console.log('[DEBUG] Calling join_multiplayer_room for room creator:', data.id, user.id);
      const { error: joinError } = await supabase.rpc('join_multiplayer_room', {
        p_room_id: data.id,
        p_user_id: user.id,
      });
      console.log('[DEBUG] join_multiplayer_room result:', joinError ? `ERROR: ${joinError.message}` : 'SUCCESS');

      // 방 생성 후 current_players 확인
      const { data: roomCheck } = await supabase
        .from('multiplayer_rooms')
        .select('current_players')
        .eq('id', data.id)
        .single();
      console.log('[DEBUG] After join, current_players:', roomCheck?.current_players);

      if (joinError) throw joinError;

      // 방 생성 후 멀티플레이어 게임 화면으로 이동
      navigation.navigate('MultiplayerGame', {
        roomId: data.id,
        gameType: gameType,
        difficulty: difficulty,
      });
    } catch (error) {
      console.error('Failed to create room:', error);
      Alert.alert('오류', '방 생성에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const joinRoom = async (roomId: string, gameType: string, difficulty?: string) => {
    if (!user) return;

    try {
      hapticPatterns.buttonPress();

      // 방 참가 (current_players 증가, presence tracking 시작)
      console.log('[DEBUG] Calling join_multiplayer_room for joiner:', roomId, user.id);
      const { error } = await supabase.rpc('join_multiplayer_room', {
        p_room_id: roomId,
        p_user_id: user.id,
      });
      console.log('[DEBUG] join_multiplayer_room result:', error ? 'ERROR' : 'SUCCESS');

      if (error) throw error;

      // 멀티플레이어 게임 화면으로 이동
      navigation.navigate('MultiplayerGame', {
        roomId: roomId,
        gameType: gameType,
        difficulty: difficulty,
      });
    } catch (error) {
      console.error('Failed to join room:', error);
      Alert.alert('오류', '방 참가에 실패했습니다.');
    }
  };

  const renderGameTypeButton = (
    gameType: string,
    emoji: string,
    name: string,
    colors: string[],
    difficulty?: string
  ) => (
    <Pressable
      onPress={() => createRoom(gameType, difficulty)}
      disabled={creating}
      style={({ pressed }) => [styles.gameButton, pressed && styles.buttonPressed]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${name} 게임 방 만들기`}
      accessibilityHint={difficulty ? `난이도: ${difficulty}` : '버튼을 눌러 새 방을 생성합니다'}
      accessibilityState={{ disabled: creating }}
    >
      <LinearGradient colors={colors as any} style={styles.gameButtonGradient}>
        <Text style={styles.gameEmoji} accessibilityElementsHidden={true}>{emoji}</Text>
        <Text style={styles.gameName}>{name}</Text>
        {difficulty && <Text style={styles.gameDifficulty}>{difficulty}</Text>}
      </LinearGradient>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={themeMode === 'dark' ? ['#0f172a', '#1e293b'] : ['#f0f9ff', '#e0f2fe']}
        style={StyleSheet.absoluteFill}
      />
      {/* 로딩 오버레이 */}
      {creating && (
        <View style={styles.loadingOverlay}>
          <GlassView style={styles.loadingCard} intensity={30} tint={themeMode === 'dark' ? 'dark' : 'light'}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>방을 생성하는 중...</Text>
          </GlassView>
        </View>
      )}

      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            hapticPatterns.buttonPress();
            navigation.goBack();
          }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
          accessibilityHint="이전 화면으로 돌아갑니다"
        >
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">멀티플레이어</Text>
        <Pressable
          style={styles.refreshButton}
          onPress={loadRooms}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="방 목록 새로고침"
          accessibilityHint="대기 중인 방 목록을 다시 불러옵니다"
        >
          <Text style={styles.refreshText} accessibilityElementsHidden={true}>🔄</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 방 만들기 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>새 방 만들기</Text>
          <View style={styles.gameGrid}>
            {renderGameTypeButton('flip_match', '🎴', 'Flip & Match', theme.gradients.flipMatch)}
            {renderGameTypeButton(
              'spatial_memory',
              '🧠',
              'Spatial Memory',
              theme.gradients.spatialMemory
            )}
            {renderGameTypeButton('math_rush', '➕', 'Math Rush', theme.gradients.mathRush)}
            {renderGameTypeButton('stroop', '🎨', 'Stroop Test', theme.gradients.stroop)}
          </View>
        </View>

        {/* 대기 중인 방 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>대기 중인 방</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
          ) : rooms.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🎮</Text>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>대기 중인 방이 없습니다</Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textTertiary }]}>새 방을 만들어보세요!</Text>
            </View>
          ) : (
            rooms.map((room) => (
              <Pressable
                key={room.id}
                onPress={() => joinRoom(room.id, room.game_type, room.difficulty)}
                style={({ pressed }) => [styles.roomCard, pressed && styles.buttonPressed]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${getGameName(room.game_type)} 방 참가하기`}
                accessibilityHint={`방장: ${room.creator_profile.username}, 플레이어 ${room.current_players}명 중 ${room.max_players}명${room.difficulty ? `, 난이도: ${room.difficulty}` : ''}`}
              >
                <GlassView
                  style={styles.roomCardGradient}
                  intensity={20}
                  tint={themeMode === 'dark' ? 'dark' : 'light'}
                >
                  <View style={styles.roomInfo}>
                    <Text style={[styles.roomGame, { color: theme.colors.text }]}>
                      <Text accessibilityElementsHidden={true}>{getGameEmoji(room.game_type)} </Text>
                      {getGameName(room.game_type)}
                    </Text>
                    {room.difficulty && (
                      <Text style={[styles.roomDifficulty, { color: theme.colors.textSecondary }]}>{room.difficulty}</Text>
                    )}
                    <Text style={[styles.roomCreator, { color: theme.colors.textTertiary }]}>
                      방장: {room.creator_profile.username}
                    </Text>
                  </View>
                  <View style={styles.roomPlayers}>
                    <Text style={[styles.playersText, { color: theme.colors.primary }]}>
                      {room.current_players}/{room.max_players}
                    </Text>
                    <Text style={styles.playersIcon} accessibilityElementsHidden={true}>👥</Text>
                  </View>
                </GlassView>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
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
    backgroundColor: 'transparent',
    paddingTop: Platform.OS === 'web' ? 40 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 0,
  },
  backButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  refreshButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshText: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  gameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gameButton: {
    width: '48%',
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  gameButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  gameEmoji: {
    fontSize: 32,
  },
  gameName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  gameDifficulty: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  loader: {
    marginVertical: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  roomCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  roomCardGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomInfo: {
    flex: 1,
  },
  roomGame: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  roomDifficulty: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  roomCreator: {
    fontSize: 14,
    color: '#64748b',
  },
  roomPlayers: {
    alignItems: 'center',
  },
  playersText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 4,
  },
  playersIcon: {
    fontSize: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    // backgroundColor: '#1e293b', // Removed in favor of GlassView
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default MultiplayerLobbyScreen;
