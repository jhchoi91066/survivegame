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
import { RootStackParamList } from '../types/navigation';
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
  Target,
  Shield
} from 'lucide-react-native';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY_PREFIX = '@leaderboard_cache_';

import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';

type LeaderboardScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<any, 'Leaderboard'>,
  NativeStackNavigationProp<RootStackParamList>
>;

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
    if (game === 'flip_match' || game === 'spatial_memory' || game === 'stroop') {
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

        {/* Your Rank Card (New) */}
        {user && myRank && (
          <View style={styles.yourRankContainer}>
            <GlassView style={styles.yourRankGlass} intensity={20} tint="dark">
              <View style={styles.yourRankIcon}>
                <Crown size={24} color="#FACC15" fill="#FACC15" />
              </View>
              <View>
                <Text style={styles.yourRankLabel}>MY RANK</Text>
                <Text style={styles.yourRankValue}>#{myRank}</Text>
              </View>
            </GlassView>
          </View>
        )}

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
              {/* Podium for Top 3 */}
              {leaderboard.length > 0 && (
                <View style={styles.podiumContainer}>
                  {/* Rank 2 */}
                  {leaderboard[1] && (
                    <View style={styles.podiumItem}>
                      <View style={styles.podiumAvatarContainer}>
                        <LinearGradient colors={['#94a3b8', '#64748b']} style={styles.podiumAvatar}>
                          <Text style={styles.podiumAvatarText}>{leaderboard[1].username[0].toUpperCase()}</Text>
                        </LinearGradient>
                        <View style={[styles.podiumBadge, { backgroundColor: '#94a3b8' }]}>
                          <Text style={styles.podiumBadgeText}>2</Text>
                        </View>
                      </View>
                      <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[1].username}</Text>
                      <Text style={styles.podiumScore}>{formatScore(leaderboard[1])}</Text>
                      <View style={[styles.podiumBar, { height: 100, backgroundColor: '#94a3b8', opacity: 0.3 }]} />
                    </View>
                  )}

                  {/* Rank 1 */}
                  {leaderboard[0] && (
                    <View style={styles.podiumItem}>
                      <View style={styles.podiumAvatarContainer}>
                        <LinearGradient colors={['#FACC15', '#EAB308']} style={[styles.podiumAvatar, { width: 80, height: 80, borderRadius: 40 }]}>
                          <Text style={[styles.podiumAvatarText, { fontSize: 32 }]}>{leaderboard[0].username[0].toUpperCase()}</Text>
                        </LinearGradient>
                        <View style={[styles.podiumBadge, { backgroundColor: '#FACC15', width: 28, height: 28, bottom: -5 }]}>
                          <Text style={styles.podiumBadgeText}>1</Text>
                        </View>
                        <Crown size={32} color="#FACC15" fill="#FACC15" style={{ position: 'absolute', top: -36 }} />
                      </View>
                      <Text style={[styles.podiumName, { fontSize: 16, fontWeight: '800' }]} numberOfLines={1}>{leaderboard[0].username}</Text>
                      <Text style={[styles.podiumScore, { color: '#FACC15', fontSize: 16 }]}>{formatScore(leaderboard[0])}</Text>
                      <View style={[styles.podiumBar, { height: 140, backgroundColor: '#FACC15', opacity: 0.3 }]} />
                    </View>
                  )}

                  {/* Rank 3 */}
                  {leaderboard[2] && (
                    <View style={styles.podiumItem}>
                      <View style={styles.podiumAvatarContainer}>
                        <LinearGradient colors={['#fb923c', '#ea580c']} style={styles.podiumAvatar}>
                          <Text style={styles.podiumAvatarText}>{leaderboard[2].username[0].toUpperCase()}</Text>
                        </LinearGradient>
                        <View style={[styles.podiumBadge, { backgroundColor: '#fb923c' }]}>
                          <Text style={styles.podiumBadgeText}>3</Text>
                        </View>
                      </View>
                      <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[2].username}</Text>
                      <Text style={styles.podiumScore}>{formatScore(leaderboard[2])}</Text>
                      <View style={[styles.podiumBar, { height: 80, backgroundColor: '#fb923c', opacity: 0.3 }]} />
                    </View>
                  )}
                </View>
              )}

              {/* List for Rank 4+ */}
              <View style={styles.listContainer}>
                <GlassView style={styles.listGlass} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
                  <View style={styles.listHeader}>
                    <Text style={[styles.listHeaderTitle, { flex: 0.15, textAlign: 'center' }]}>Rank</Text>
                    <Text style={[styles.listHeaderTitle, { flex: 0.55 }]}>Player</Text>
                    <Text style={[styles.listHeaderTitle, { flex: 0.3, textAlign: 'right' }]}>Score</Text>
                  </View>

                  {leaderboard.map((entry) => (
                    <View key={entry.user_id} style={[
                      styles.listItem,
                      entry.user_id === user?.id && styles.listItemHighlight
                    ]}>
                      <Text style={[styles.listRank, { flex: 0.15 }]}>#{entry.rank}</Text>
                      <View style={{ flex: 0.55, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={styles.listAvatar}>
                          <Text style={styles.listAvatarText}>{entry.username[0].toUpperCase()}</Text>
                        </View>
                        <Text style={[styles.listName, entry.user_id === user?.id && { color: theme.colors.primary }]} numberOfLines={1}>
                          {entry.username}
                        </Text>
                      </View>
                      <Text style={[styles.listScore, { flex: 0.3 }]}>{formatScore(entry)}</Text>
                    </View>
                  ))}
                </GlassView>
              </View>
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
  scrollContent: { padding: 20, paddingTop: 0, paddingBottom: 100 },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 16, fontSize: 16, color: theme.colors.textSecondary },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: theme.colors.textSecondary },

  yourRankContainer: { paddingHorizontal: 20, marginBottom: 24 },
  yourRankGlass: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, backgroundColor: 'rgba(250, 204, 21, 0.1)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.2)' },
  yourRankIcon: { marginRight: 12 },
  yourRankLabel: { fontSize: 12, fontWeight: '800', color: '#FDE047', letterSpacing: 1 },
  yourRankValue: { fontSize: 24, fontWeight: '900', color: '#FACC15' },
  podiumContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', height: 280, marginBottom: 20, paddingHorizontal: 20, gap: 12 },
  podiumItem: { alignItems: 'center', flex: 1 },
  podiumAvatarContainer: { alignItems: 'center', marginBottom: 12, position: 'relative' },
  podiumAvatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: theme.colors.background },
  podiumAvatarText: { fontSize: 24, fontWeight: '800', color: '#fff' },
  podiumBadge: { position: 'absolute', bottom: -4, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.colors.background },
  podiumBadgeText: { fontSize: 12, fontWeight: '800', color: '#1e293b' },
  podiumName: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 4, textAlign: 'center' },
  podiumScore: { fontSize: 12, fontWeight: '700', color: theme.colors.primary, marginBottom: 8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  podiumBar: { width: '100%', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  listContainer: { paddingHorizontal: 20, marginBottom: 20 },
  listGlass: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  listHeader: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  listHeaderTitle: { fontSize: 12, fontWeight: '700', color: theme.colors.textSecondary, textTransform: 'uppercase' },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  listItemHighlight: { backgroundColor: theme.colors.primary + '10', borderLeftWidth: 4, borderLeftColor: theme.colors.primary },
  listRank: { fontSize: 14, fontWeight: '800', color: theme.colors.textSecondary, textAlign: 'center' },
  listAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  listAvatarText: { fontSize: 12, fontWeight: '700', color: theme.colors.text },
  listName: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  listScore: { fontSize: 14, fontWeight: '700', color: theme.colors.primary, textAlign: 'right', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
});

export default LeaderboardScreen;
