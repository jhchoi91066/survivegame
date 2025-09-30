import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getStats, loadProgress, LevelProgress } from '../utils/progressManager';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

type StatsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Stats'>;

interface Stats {
  totalLevels: number;
  completedLevels: number;
  totalStars: number;
  maxStars: number;
  totalAttempts: number;
}

const StatsScreen: React.FC = () => {
  const navigation = useNavigation<StatsScreenNavigationProp>();
  const [stats, setStats] = useState<Stats | null>(null);
  const [topLevels, setTopLevels] = useState<LevelProgress[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const statsData = await getStats();
    setStats(statsData);

    // Get top 5 levels by stars and best time
    const progress = await loadProgress();
    const levels = Object.values(progress.levels)
      .filter(l => l.completed)
      .sort((a, b) => {
        if (b.stars !== a.stars) return b.stars - a.stars;
        return b.bestTime - a.bestTime;
      })
      .slice(0, 5);
    setTopLevels(levels);
  };

  if (!stats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const completionRate = ((stats.completedLevels / stats.totalLevels) * 100).toFixed(1);
  const starRate = ((stats.totalStars / stats.maxStars) * 100).toFixed(1);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📊 통계</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← 돌아가기</Text>
          </Pressable>
        </View>

        {/* Summary Cards */}
        <View style={styles.cardsContainer}>
          <StatCard
            icon="⭐"
            value={stats.totalStars}
            max={stats.maxStars}
            label="총 별"
            percentage={starRate}
            delay={0}
          />
          <StatCard
            icon="✅"
            value={stats.completedLevels}
            max={stats.totalLevels}
            label="완료한 레벨"
            percentage={completionRate}
            delay={100}
          />
          <StatCard
            icon="🎮"
            value={stats.totalAttempts}
            max={null}
            label="총 플레이 횟수"
            percentage={null}
            delay={200}
          />
        </View>

        {/* Top Levels */}
        {topLevels.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 최고 기록</Text>
            {topLevels.map((level, index) => (
              <TopLevelCard key={level.levelId} level={level} rank={index + 1} />
            ))}
          </View>
        )}

        {/* Achievement Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 업적</Text>
          <View style={styles.achievementPlaceholder}>
            <Text style={styles.placeholderText}>업적 시스템 준비 중...</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Animated stat card component
interface StatCardProps {
  icon: string;
  value: number;
  max: number | null;
  label: string;
  percentage: string | null;
  delay: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, max, label, percentage, delay }) => {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSpring(1, {
        damping: 15,
        stiffness: 150,
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.statCard, animatedStyle]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>
          {value}
          {max !== null && <Text style={styles.statMax}> / {max}</Text>}
        </Text>
        <Text style={styles.statLabel}>{label}</Text>
        {percentage !== null && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${parseFloat(percentage)}%` as any }]} />
          </View>
        )}
        {percentage !== null && (
          <Text style={styles.percentageText}>{percentage}%</Text>
        )}
      </View>
    </Animated.View>
  );
};

// Top level card component
interface TopLevelCardProps {
  level: LevelProgress;
  rank: number;
}

const TopLevelCard: React.FC<TopLevelCardProps> = ({ level, rank }) => {
  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}위`;
    }
  };

  return (
    <View style={styles.topLevelCard}>
      <Text style={styles.rankEmoji}>{getRankEmoji(rank)}</Text>
      <View style={styles.topLevelContent}>
        <Text style={styles.topLevelName}>레벨 {level.levelId}</Text>
        <View style={styles.topLevelStats}>
          <Text style={styles.topLevelStar}>
            {'⭐'.repeat(level.stars)}{'☆'.repeat(3 - level.stars)}
          </Text>
          <Text style={styles.topLevelTime}>
            최고 시간: {Math.floor(level.bestTime / 60)}:{(level.bestTime % 60).toString().padStart(2, '0')}
          </Text>
        </View>
        <Text style={styles.topLevelAttempts}>시도 횟수: {level.attempts}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statMax: {
    fontSize: 20,
    color: '#9ca3af',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  topLevelCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  rankEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  topLevelContent: {
    flex: 1,
  },
  topLevelName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  topLevelStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  topLevelStar: {
    fontSize: 14,
  },
  topLevelTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  topLevelAttempts: {
    fontSize: 11,
    color: '#9ca3af',
  },
  achievementPlaceholder: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});

export default StatsScreen;