import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import * as Haptics from 'expo-haptics';
import { updateLeaderboardRanks } from '../utils/achievementManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY_PREFIX = '@leaderboard_cache_';

type LeaderboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Menu'>;

interface LeaderboardScreenProps {
  navigation: LeaderboardScreenNavigationProp;
}

interface LeaderboardEntry {
  user_id: string;
  username: string;
  game_type: string;
  difficulty: string;
  best_score?: number;
  best_level?: number;
  best_time_seconds?: number;
  best_moves?: number;
  last_updated: string;
  rank?: number;
}

type GameType = 'flip_match' | 'math_rush' | 'spatial_memory' | 'stroop';
type Difficulty = 'easy' | 'medium' | 'hard' | 'normal';

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameType>('flip_match');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedGame, selectedDifficulty]);

  useEffect(() => {
    if (user) {
      updateMyRanksForAchievements();
    }
  }, [user]);

  const loadLeaderboard = async (forceRefresh = false) => {
    try {
      setLoading(true);

      const cacheKey = `${CACHE_KEY_PREFIX}${selectedGame}_${selectedDifficulty}`;

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedData = await AsyncStorage.getItem(cacheKey);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          const isValid = Date.now() - timestamp < CACHE_DURATION;

          if (isValid) {
            setLeaderboard(data);
            if (user) {
              const userIndex = data.findIndex((entry: LeaderboardEntry) => entry.user_id === user.id);
              setMyRank(userIndex >= 0 ? userIndex + 1 : null);
            }
            setLoading(false);
            setRefreshing(false);
            return;
          }
        }
      }

      // Fetch leaderboard data with profile info
      const { data, error } = await supabase
        .from('leaderboards')
        .select(`
          user_id,
          game_type,
          difficulty,
          best_score,
          best_level,
          best_time_seconds,
          best_moves,
          last_updated,
          profiles!inner (
            username
          )
        `)
        .eq('game_type', selectedGame)
        .eq('difficulty', selectedDifficulty)
        .order(getOrderColumn(), { ascending: getOrderAscending() })
        .limit(100);

      if (error) {
        console.error('Leaderboard load error:', error);
        setLeaderboard([]);
        return;
      }

      // Format data with ranks and usernames
      const formattedData: LeaderboardEntry[] = (data || []).map((entry: any, index: number) => ({
        user_id: entry.user_id,
        username: entry.profiles?.username || 'Unknown',
        game_type: entry.game_type,
        difficulty: entry.difficulty,
        best_score: entry.best_score,
        best_level: entry.best_level,
        best_time_seconds: entry.best_time_seconds,
        best_moves: entry.best_moves,
        last_updated: entry.last_updated,
        rank: index + 1,
      }));

      setLeaderboard(formattedData);

      // Cache the data
      await AsyncStorage.setItem(cacheKey, JSON.stringify({
        data: formattedData,
        timestamp: Date.now(),
      }));

      // Find current user's rank
      if (user) {
        const userIndex = formattedData.findIndex(entry => entry.user_id === user.id);
        setMyRank(userIndex >= 0 ? userIndex + 1 : null);
      }
    } catch (error) {
      console.error('Leaderboard exception:', error);
      setLeaderboard([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard(true); // Force refresh
    if (user) {
      await updateMyRanksForAchievements();
    }
  };

  const updateMyRanksForAchievements = async () => {
    if (!user) return;

    try {
      const games: GameType[] = ['flip_match', 'math_rush', 'spatial_memory', 'stroop'];
      const ranks: { [gameType: string]: number } = {};

      for (const game of games) {
        // Get the best difficulty for each game
        let difficulty: Difficulty = 'normal';
        if (game === 'flip_match' || game === 'spatial_memory') {
          difficulty = 'hard'; // Use hardest difficulty for flip_match and spatial_memory
        }

        const { data, error } = await supabase
          .from('leaderboards')
          .select('user_id')
          .eq('game_type', game)
          .eq('difficulty', difficulty)
          .order(getOrderColumnForGame(game), { ascending: getOrderAscendingForGame(game) });

        if (!error && data) {
          const userIndex = data.findIndex(entry => entry.user_id === user.id);
          if (userIndex >= 0) {
            ranks[game] = userIndex + 1;
          }
        }
      }

      // Update achievements
      await updateLeaderboardRanks(ranks);
    } catch (error) {
      console.error('Failed to update ranks for achievements:', error);
    }
  };

  const getOrderColumnForGame = (game: GameType): string => {
    switch (game) {
      case 'flip_match':
        return 'best_time_seconds';
      case 'spatial_memory':
        return 'best_level';
      case 'math_rush':
        return 'best_score';
      case 'stroop':
        return 'best_score';
      default:
        return 'best_score';
    }
  };

  const getOrderAscendingForGame = (game: GameType): boolean => {
    return game === 'flip_match';
  };

  const getOrderColumn = (): string => {
    switch (selectedGame) {
      case 'flip_match':
        return 'best_time_seconds';
      case 'spatial_memory':
        return 'best_level';
      case 'math_rush':
        return 'best_score';
      case 'stroop':
        return 'best_score';
      default:
        return 'best_score';
    }
  };

  const getOrderAscending = (): boolean => {
    // Lower is better for time, higher is better for score and level
    return selectedGame === 'flip_match';
  };

  const formatScore = (entry: LeaderboardEntry): string => {
    switch (selectedGame) {
      case 'flip_match':
        return entry.best_time_seconds ? `${entry.best_time_seconds}초` : '-';
      case 'spatial_memory':
        return entry.best_level ? `Lv.${entry.best_level}` : '-';
      case 'math_rush':
        return entry.best_score ? `${entry.best_score}점` : '-';
      case 'stroop':
        return entry.best_score ? `${entry.best_score}점` : '-';
      default:
        return '-';
    }
  };

  const getRankEmoji = (rank: number): string => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `${rank}`;
    }
  };

  const handleGameSelect = (game: GameType) => {
    setSelectedGame(game);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDifficultySelect = (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getDifficultiesForGame = (game: GameType): Difficulty[] => {
    if (game === 'flip_match' || game === 'spatial_memory') {
      return ['easy', 'medium', 'hard'];
    }
    return ['normal'];
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.gradient} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.goBack();
            }}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <Text style={styles.backText}>← 뒤로</Text>
          </Pressable>
          <Text style={styles.title}>🏆 리더보드</Text>
          <Text style={styles.subtitle}>전 세계 플레이어와 경쟁하세요!</Text>
        </View>

        {/* Game Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.gameSelectorContainer}
          contentContainerStyle={styles.gameSelectorContent}
        >
          {[
            { id: 'flip_match' as GameType, name: 'Flip & Match', emoji: '🎴' },
            { id: 'math_rush' as GameType, name: 'Math Rush', emoji: '➕' },
            { id: 'spatial_memory' as GameType, name: 'Spatial Memory', emoji: '🧠' },
            { id: 'stroop' as GameType, name: 'Stroop Test', emoji: '🎨' },
          ].map((game) => (
            <Pressable
              key={game.id}
              onPress={() => handleGameSelect(game.id)}
              style={({ pressed }) => [
                styles.gameTab,
                selectedGame === game.id && styles.gameTabActive,
                pressed && styles.gameTabPressed,
              ]}
            >
              <Text style={styles.gameTabEmoji}>{game.emoji}</Text>
              <Text
                style={[
                  styles.gameTabText,
                  selectedGame === game.id && styles.gameTabTextActive,
                ]}
              >
                {game.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Difficulty Selector */}
        {getDifficultiesForGame(selectedGame).length > 1 && (
          <View style={styles.difficultySelectorContainer}>
            {getDifficultiesForGame(selectedGame).map((difficulty) => (
              <Pressable
                key={difficulty}
                onPress={() => handleDifficultySelect(difficulty)}
                style={({ pressed }) => [
                  styles.difficultyTab,
                  selectedDifficulty === difficulty && styles.difficultyTabActive,
                  pressed && styles.difficultyTabPressed,
                ]}
              >
                <Text
                  style={[
                    styles.difficultyTabText,
                    selectedDifficulty === difficulty && styles.difficultyTabTextActive,
                  ]}
                >
                  {difficulty === 'easy' ? 'Easy' : difficulty === 'medium' ? 'Medium' : 'Hard'}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Not logged in warning */}
        {!user && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              🔐 로그인하면 리더보드에 참여할 수 있습니다
            </Text>
          </View>
        )}

        {/* Leaderboard List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#6366f1"
            />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>로딩 중...</Text>
            </View>
          ) : leaderboard.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🏆</Text>
              <Text style={styles.emptyText}>아직 기록이 없습니다</Text>
              <Text style={styles.emptySubtext}>첫 번째 플레이어가 되어보세요!</Text>
            </View>
          ) : (
            <>
              {leaderboard.map((entry) => (
                <View
                  key={entry.user_id}
                  style={[
                    styles.rankCard,
                    entry.user_id === user?.id && styles.rankCardHighlight,
                  ]}
                >
                  <LinearGradient
                    colors={
                      entry.rank === 1
                        ? ['#fbbf24', '#f59e0b']
                        : entry.rank === 2
                        ? ['#94a3b8', '#64748b']
                        : entry.rank === 3
                        ? ['#cd7f32', '#b87333']
                        : ['#1e293b', '#0f172a']
                    }
                    style={styles.rankBadge}
                  >
                    <Text style={styles.rankBadgeText}>{getRankEmoji(entry.rank!)}</Text>
                  </LinearGradient>

                  <View style={styles.rankInfo}>
                    <Text
                      style={[
                        styles.username,
                        entry.user_id === user?.id && styles.usernameHighlight,
                      ]}
                      numberOfLines={1}
                    >
                      {entry.username}
                      {entry.user_id === user?.id && ' (나)'}
                    </Text>
                    <Text style={styles.updateTime}>
                      {new Date(entry.last_updated).toLocaleDateString('ko-KR')}
                    </Text>
                  </View>

                  <Text style={styles.score}>{formatScore(entry)}</Text>
                </View>
              ))}

              {/* My Rank Summary */}
              {user && myRank && (
                <View style={styles.myRankContainer}>
                  <Text style={styles.myRankText}>
                    내 순위: #{myRank} / {leaderboard.length}명
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'web' ? 40 : 0,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    marginBottom: 16,
    padding: 8,
    alignSelf: 'flex-start',
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  backText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  gameSelectorContainer: {
    maxHeight: 70,
    marginBottom: 16,
  },
  gameSelectorContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  gameTab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gameTabActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  gameTabPressed: {
    opacity: 0.8,
  },
  gameTabEmoji: {
    fontSize: 20,
  },
  gameTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  gameTabTextActive: {
    color: '#fff',
  },
  difficultySelectorContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  difficultyTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  difficultyTabActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  difficultyTabPressed: {
    opacity: 0.8,
  },
  difficultyTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  difficultyTabTextActive: {
    color: '#fff',
  },
  warningContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  warningText: {
    fontSize: 14,
    color: '#fbbf24',
    textAlign: 'center',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94a3b8',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  rankCardHighlight: {
    borderColor: '#6366f1',
    borderWidth: 2,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  rankBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankBadgeText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },
  rankInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  usernameHighlight: {
    color: '#6366f1',
  },
  updateTime: {
    fontSize: 12,
    color: '#64748b',
  },
  score: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  myRankContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: '#6366f1',
    alignItems: 'center',
  },
  myRankText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366f1',
  },
});

export default LeaderboardScreen;
