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
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import * as Haptics from 'expo-haptics';
import { updateLeaderboardRanks } from '../utils/achievementManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { GlassView } from '../components/shared/GlassView';
import {
  ArrowLeft,
  Trophy,
  Grid3X3,
  Calculator,
  Brain,
  Palette,
  Medal,
  User,
  Calendar,
  Crown,
  Clock,
  Hash,
  Target
} from 'lucide-react-native';

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
  const { theme, themeMode } = useTheme();
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

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.background} style={styles.backgroundGradient} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.goBack();
            }}
            style={styles.backButton}
          >
            <GlassView style={styles.iconButtonGlass} intensity={20}>
              <ArrowLeft size={24} color={theme.colors.text} />
            </GlassView>
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>리더보드</Text>
            <Text style={styles.subtitle}>전 세계 플레이어와 경쟁하세요!</Text>
          </View>
        </View>

        {/* Game Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.gameSelectorContainer}
          contentContainerStyle={styles.gameSelectorContent}
        >
          {[
            { id: 'flip_match' as GameType, name: 'Flip & Match', icon: Grid3X3 },
            { id: 'math_rush' as GameType, name: 'Math Rush', icon: Calculator },
            { id: 'spatial_memory' as GameType, name: 'Spatial Memory', icon: Brain },
            { id: 'stroop' as GameType, name: 'Stroop Test', icon: Palette },
          ].map((game) => {
            const Icon = game.icon;
            const isActive = selectedGame === game.id;
            return (
              <Pressable
                key={game.id}
                onPress={() => handleGameSelect(game.id)}
                style={styles.gameTabWrapper}
              >
                <GlassView
                  style={styles.gameTabGlass}
                  intensity={isActive ? 40 : 20}
                  tint={isActive ? (themeMode === 'dark' ? 'light' : 'dark') : (themeMode === 'dark' ? 'dark' : 'light')}
                >
                  <Icon size={20} color={isActive ? (themeMode === 'dark' ? theme.colors.text : '#fff') : theme.colors.textSecondary} />
                  <Text style={[styles.gameTabText, isActive && { color: themeMode === 'dark' ? theme.colors.text : '#fff', fontWeight: '700' }]}>
                    {game.name}
                  </Text>
                </GlassView>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Difficulty Selector */}
        {getDifficultiesForGame(selectedGame).length > 1 && (
          <View style={styles.difficultySelectorContainer}>
            {getDifficultiesForGame(selectedGame).map((difficulty) => {
              const isActive = selectedDifficulty === difficulty;
              return (
                <Pressable
                  key={difficulty}
                  onPress={() => handleDifficultySelect(difficulty)}
                  style={styles.difficultyTabWrapper}
                >
                  <GlassView
                    style={styles.difficultyTabGlass}
                    intensity={isActive ? 30 : 10}
                    tint={isActive ? (themeMode === 'dark' ? 'light' : 'dark') : (themeMode === 'dark' ? 'dark' : 'light')}
                  >
                    <Text style={[styles.difficultyTabText, isActive && { color: themeMode === 'dark' ? theme.colors.text : '#fff', fontWeight: '700' }]}>
                      {difficulty === 'easy' ? 'Easy' : difficulty === 'medium' ? 'Medium' : 'Hard'}
                    </Text>
                  </GlassView>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Not logged in warning */}
        {!user && (
          <View style={styles.warningContainer}>
            <GlassView style={styles.warningGlass} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
              <User size={20} color={theme.colors.warning} style={{ marginBottom: 8 }} />
              <Text style={styles.warningText}>
                로그인하면 리더보드에 참여할 수 있습니다
              </Text>
            </GlassView>
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
              tintColor={theme.colors.primary}
            />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>로딩 중...</Text>
            </View>
          ) : leaderboard.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Trophy size={64} color={theme.colors.textTertiary} style={{ marginBottom: 16 }} />
              <Text style={styles.emptyText}>아직 기록이 없습니다</Text>
              <Text style={styles.emptySubtext}>첫 번째 플레이어가 되어보세요!</Text>
            </View>
          ) : (
            <>
              {leaderboard.map((entry) => (
                <View key={entry.user_id} style={styles.rankCardWrapper}>
                  <GlassView
                    style={styles.rankCardGlass}
                    intensity={entry.user_id === user?.id ? 40 : 20}
                    tint={themeMode === 'dark' ? 'dark' : 'light'}
                  >
                    <View style={styles.rankBadgeContainer}>
                      <LinearGradient
                        colors={
                          entry.rank === 1
                            ? ['#fbbf24', '#f59e0b']
                            : entry.rank === 2
                              ? ['#94a3b8', '#64748b']
                              : entry.rank === 3
                                ? ['#cd7f32', '#b87333']
                                : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
                        }
                        style={styles.rankBadge}
                      >
                        {entry.rank && entry.rank <= 3 ? (
                          <Crown size={20} color="#fff" />
                        ) : (
                          <Text style={styles.rankBadgeText}>{entry.rank}</Text>
                        )}
                      </LinearGradient>
                    </View>

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
                      <View style={styles.dateContainer}>
                        <Calendar size={12} color={theme.colors.textTertiary} style={{ marginRight: 4 }} />
                        <Text style={styles.updateTime}>
                          {new Date(entry.last_updated).toLocaleDateString('ko-KR')}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.score}>{formatScore(entry)}</Text>
                  </GlassView>
                </View>
              ))}

              {/* My Rank Summary */}
              {user && myRank && (
                <View style={styles.myRankWrapper}>
                  <GlassView style={styles.myRankGlass} intensity={30} tint={themeMode === 'dark' ? 'light' : 'dark'}>
                    <Medal size={20} color={themeMode === 'dark' ? theme.colors.primary : '#fff'} style={{ marginRight: 8 }} />
                    <Text style={[styles.myRankText, { color: themeMode === 'dark' ? theme.colors.primary : '#fff' }]}>
                      내 순위: #{myRank} / {leaderboard.length}명
                    </Text>
                  </GlassView>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1 },
  backgroundGradient: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'web' ? 40 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10 },
  backButton: { marginRight: 16, borderRadius: 12, overflow: 'hidden' },
  iconButtonGlass: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  headerTitleContainer: { flex: 1 },
  title: { fontSize: 28, fontWeight: '900', color: theme.colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 2 },
  gameSelectorContainer: { maxHeight: 60, marginBottom: 16 },
  gameSelectorContent: { paddingHorizontal: 20, gap: 12 },
  gameTabWrapper: { borderRadius: 16, overflow: 'hidden', marginRight: 8 },
  gameTabGlass: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8, borderRadius: 16 },
  gameTabText: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary },
  difficultySelectorContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  difficultyTabWrapper: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  difficultyTabGlass: { alignItems: 'center', paddingVertical: 10, borderRadius: 12 },
  difficultyTabText: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary },
  warningContainer: { marginHorizontal: 20, marginBottom: 16, borderRadius: 16, overflow: 'hidden' },
  warningGlass: { padding: 16, alignItems: 'center', borderRadius: 16 },
  warningText: { fontSize: 14, color: theme.colors.warning, fontWeight: '600', textAlign: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 0, paddingBottom: 40 },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 16, fontSize: 16, color: theme.colors.textSecondary },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: theme.colors.textSecondary },
  rankCardWrapper: { marginBottom: 12, borderRadius: 16, overflow: 'hidden' },
  rankCardGlass: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16 },
  rankBadgeContainer: { marginRight: 16 },
  rankBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rankBadgeText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  rankInfo: { flex: 1 },
  username: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  usernameHighlight: { color: theme.colors.primary },
  dateContainer: { flexDirection: 'row', alignItems: 'center' },
  updateTime: { fontSize: 12, color: theme.colors.textTertiary },
  score: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  myRankWrapper: { marginTop: 16, borderRadius: 16, overflow: 'hidden' },
  myRankGlass: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16 },
  myRankText: { fontSize: 16, fontWeight: '700', color: theme.colors.primary },
});

export default LeaderboardScreen;
