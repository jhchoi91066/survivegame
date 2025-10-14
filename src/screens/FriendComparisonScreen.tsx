import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import * as Haptics from 'expo-haptics';

type FriendComparisonScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FriendComparison'>;
type FriendComparisonScreenRouteProp = RouteProp<RootStackParamList, 'FriendComparison'>;

interface FriendComparisonScreenProps {
  navigation: FriendComparisonScreenNavigationProp;
  route: FriendComparisonScreenRouteProp;
}

interface GameRecord {
  game_type: string;
  difficulty: string;
  best_score?: number;
  best_level?: number;
  best_time_seconds?: number;
  best_moves?: number;
  last_updated: string;
}

interface ComparisonData {
  myRecords: GameRecord[];
  friendRecords: GameRecord[];
  friendUsername: string;
}

type GameType = 'flip_match' | 'math_rush' | 'spatial_memory' | 'stroop';

const { width } = Dimensions.get('window');

const FriendComparisonScreen: React.FC<FriendComparisonScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { friendId, friendUsername } = route.params;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ComparisonData | null>(null);

  useEffect(() => {
    loadComparisonData();
  }, [friendId]);

  const loadComparisonData = async () => {
    try {
      setLoading(true);

      // Fetch my records
      const { data: myData, error: myError } = await supabase
        .from('leaderboards')
        .select('game_type, difficulty, best_score, best_level, best_time_seconds, best_moves, last_updated')
        .eq('user_id', user?.id);

      if (myError) throw myError;

      // Fetch friend's records
      const { data: friendData, error: friendError } = await supabase
        .from('leaderboards')
        .select('game_type, difficulty, best_score, best_level, best_time_seconds, best_moves, last_updated')
        .eq('user_id', friendId);

      if (friendError) throw friendError;

      setData({
        myRecords: myData || [],
        friendRecords: friendData || [],
        friendUsername,
      });
    } catch (error) {
      console.error('Load comparison error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMyRecord = (gameType: GameType, difficulty: string): GameRecord | null => {
    return data?.myRecords.find(r => r.game_type === gameType && r.difficulty === difficulty) || null;
  };

  const getFriendRecord = (gameType: GameType, difficulty: string): GameRecord | null => {
    return data?.friendRecords.find(r => r.game_type === gameType && r.difficulty === difficulty) || null;
  };

  const formatScore = (record: GameRecord | null, gameType: GameType): string => {
    if (!record) return '-';

    switch (gameType) {
      case 'flip_match':
        return record.best_time_seconds ? `${record.best_time_seconds}초` : '-';
      case 'spatial_memory':
        return record.best_level ? `Lv.${record.best_level}` : '-';
      case 'math_rush':
        return record.best_score ? `${record.best_score}점` : '-';
      case 'stroop':
        return record.best_score ? `${record.best_score}점` : '-';
      default:
        return '-';
    }
  };

  const getWinner = (myRecord: GameRecord | null, friendRecord: GameRecord | null, gameType: GameType): 'me' | 'friend' | 'tie' => {
    if (!myRecord && !friendRecord) return 'tie';
    if (!myRecord) return 'friend';
    if (!friendRecord) return 'me';

    let myValue: number = 0;
    let friendValue: number = 0;

    switch (gameType) {
      case 'flip_match':
        myValue = myRecord.best_time_seconds || Infinity;
        friendValue = friendRecord.best_time_seconds || Infinity;
        // Lower is better for time
        return myValue < friendValue ? 'me' : myValue > friendValue ? 'friend' : 'tie';
      case 'spatial_memory':
        myValue = myRecord.best_level || 0;
        friendValue = friendRecord.best_level || 0;
        // Higher is better for level
        return myValue > friendValue ? 'me' : myValue < friendValue ? 'friend' : 'tie';
      case 'math_rush':
        myValue = myRecord.best_score || 0;
        friendValue = friendRecord.best_score || 0;
        // Higher is better for score
        return myValue > friendValue ? 'me' : myValue < friendValue ? 'friend' : 'tie';
      case 'stroop':
        myValue = myRecord.best_score || 0;
        friendValue = friendRecord.best_score || 0;
        // Higher is better for score
        return myValue > friendValue ? 'me' : myValue < friendValue ? 'friend' : 'tie';
      default:
        return 'tie';
    }
  };

  const getOverallWins = (): { myWins: number; friendWins: number; ties: number } => {
    const games: Array<{ type: GameType; difficulty: string }> = [
      { type: 'flip_match', difficulty: 'easy' },
      { type: 'flip_match', difficulty: 'medium' },
      { type: 'flip_match', difficulty: 'hard' },
      { type: 'spatial_memory', difficulty: 'easy' },
      { type: 'spatial_memory', difficulty: 'medium' },
      { type: 'spatial_memory', difficulty: 'hard' },
      { type: 'math_rush', difficulty: 'normal' },
      { type: 'stroop', difficulty: 'normal' },
    ];

    let myWins = 0;
    let friendWins = 0;
    let ties = 0;

    games.forEach(game => {
      const myRecord = getMyRecord(game.type, game.difficulty);
      const friendRecord = getFriendRecord(game.type, game.difficulty);
      const winner = getWinner(myRecord, friendRecord, game.type);

      if (winner === 'me') myWins++;
      else if (winner === 'friend') friendWins++;
      else ties++;
    });

    return { myWins, friendWins, ties };
  };

  const renderGameComparison = (gameType: GameType, gameName: string, emoji: string, difficulties: string[]) => {
    return (
      <View key={gameType} style={styles.gameSection}>
        <View style={styles.gameSectionHeader}>
          <Text style={styles.gameSectionEmoji}>{emoji}</Text>
          <Text style={styles.gameSectionTitle}>{gameName}</Text>
        </View>

        {difficulties.map(difficulty => {
          const myRecord = getMyRecord(gameType, difficulty);
          const friendRecord = getFriendRecord(gameType, difficulty);
          const winner = getWinner(myRecord, friendRecord, gameType);

          return (
            <View key={`${gameType}-${difficulty}`} style={styles.comparisonCard}>
              {difficulties.length > 1 && (
                <Text style={styles.difficultyLabel}>
                  {difficulty === 'easy' ? 'Easy' : difficulty === 'medium' ? 'Medium' : difficulty === 'hard' ? 'Hard' : 'Normal'}
                </Text>
              )}

              <View style={styles.recordsRow}>
                {/* My Record */}
                <View style={[styles.recordBox, winner === 'me' && styles.recordBoxWinner]}>
                  <Text style={styles.recordLabel}>나</Text>
                  <Text style={[styles.recordValue, winner === 'me' && styles.recordValueWinner]}>
                    {formatScore(myRecord, gameType)}
                  </Text>
                  {winner === 'me' && <Text style={styles.winnerEmoji}>🏆</Text>}
                </View>

                {/* VS */}
                <View style={styles.vsContainer}>
                  <Text style={styles.vsText}>VS</Text>
                </View>

                {/* Friend's Record */}
                <View style={[styles.recordBox, winner === 'friend' && styles.recordBoxWinner]}>
                  <Text style={styles.recordLabel}>{data?.friendUsername}</Text>
                  <Text style={[styles.recordValue, winner === 'friend' && styles.recordValueWinner]}>
                    {formatScore(friendRecord, gameType)}
                  </Text>
                  {winner === 'friend' && <Text style={styles.winnerEmoji}>🏆</Text>}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.gradient} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>기록 비교 중...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const { myWins, friendWins, ties } = getOverallWins();

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
          <Text style={styles.title}>⚔️ 기록 비교</Text>
          <Text style={styles.subtitle}>나 vs {data?.friendUsername}</Text>
        </View>

        {/* Overall Stats */}
        <View style={styles.overallStats}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.2)', 'rgba(139, 92, 246, 0.2)']}
            style={styles.overallStatsGradient}
          >
            <View style={styles.statColumn}>
              <Text style={styles.statValue}>{myWins}</Text>
              <Text style={styles.statLabel}>내 승리</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statColumn}>
              <Text style={styles.statValue}>{ties}</Text>
              <Text style={styles.statLabel}>무승부</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statColumn}>
              <Text style={styles.statValue}>{friendWins}</Text>
              <Text style={styles.statLabel}>{data?.friendUsername} 승리</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Game-by-Game Comparison */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {renderGameComparison('flip_match', 'Flip & Match', '🎴', ['easy', 'medium', 'hard'])}
          {renderGameComparison('spatial_memory', 'Spatial Memory', '🧠', ['easy', 'medium', 'hard'])}
          {renderGameComparison('math_rush', 'Math Rush', '➕', ['normal'])}
          {renderGameComparison('stroop', 'Stroop Test', '🎨', ['normal'])}
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
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94a3b8',
  },
  overallStats: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  overallStatsGradient: {
    flexDirection: 'row',
    padding: 20,
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 16,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.5)',
    marginHorizontal: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  gameSection: {
    marginBottom: 24,
  },
  gameSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameSectionEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  gameSectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  comparisonCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  difficultyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8b5cf6',
    marginBottom: 12,
    textAlign: 'center',
  },
  recordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
  },
  recordBoxWinner: {
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  recordLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
    fontWeight: '600',
  },
  recordValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  recordValueWinner: {
    color: '#fbbf24',
  },
  winnerEmoji: {
    position: 'absolute',
    top: -8,
    right: -8,
    fontSize: 20,
  },
  vsContainer: {
    paddingHorizontal: 12,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748b',
  },
});

export default FriendComparisonScreen;
