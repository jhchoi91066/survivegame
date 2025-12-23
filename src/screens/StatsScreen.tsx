import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Platform, Dimensions } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
// [C5] statsManager 제거 - Zustand persist로 대체
import { GameRecord } from '../game/shared/types';
import { useTheme } from '../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from '../components/shared/GlassView';
import {
  ArrowLeft,
  Grid3X3,
  Calculator,
  Brain,
  Palette,
  Trophy,
  Timer,
  Clock,
  Hash,
  Target,
  Flame,
  Zap,
  TrendingUp,
  Activity,
  Layers
} from 'lucide-react-native';

import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';

type StatsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<any, 'Stats'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1 },
  backgroundGradient: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'web' ? 40 : 0 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 10, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { marginRight: 16, borderRadius: 12, overflow: 'hidden' },
  iconButtonGlass: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'space-between' },
  title: { fontSize: 28, fontWeight: '900', color: theme.colors.text },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(30, 41, 59, 0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#cbd5e1' },

  gridContainer: { gap: 16, marginBottom: 24 },
  row: { flexDirection: 'row', gap: 16 },

  sectionContainer: { marginBottom: 32 },
  cardGlass: { padding: 20, borderRadius: 24, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },

  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 200, paddingBottom: 10 },
  chartBarContainer: { alignItems: 'center', gap: 8, flex: 1 },
  chartBarTrack: { width: '100%', height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  chartBar: { width: 8, borderRadius: 4, minHeight: 4 },
  chartLabel: { fontSize: 10, color: '#64748b', fontWeight: '600' },

  skillsContainer: { gap: 4 },

  sectionTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text, marginBottom: 16 },

  gameCardWrapper: { marginBottom: 16, borderRadius: 20, overflow: 'hidden' },
  gameCardGlass: { padding: 20, borderRadius: 20 },
  gameCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1 },
  gameTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
  statsContainer: { gap: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabelContainer: { flexDirection: 'row', alignItems: 'center' },
  statIcon: { marginRight: 6 },
  statLabel: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: '500' },
  gameStatValue: { fontSize: 16, fontWeight: '700', color: theme.colors.text },

  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 140,
    justifyContent: 'space-between'
  },
  statCardGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.1,
    transform: [{ scale: 1.5 }]
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  statIconContainer: {
    padding: 8,
    borderRadius: 12,
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statTitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.text
  },
  skillRow: {
    marginBottom: 16
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  skillLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text
  },
  skillScore: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: theme.colors.textSecondary
  },
  skillTrack: {
    height: 8,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 4,
    overflow: 'hidden'
  },
  skillBar: {
    height: '100%',
    borderRadius: 4
  }
});

const StatsScreen: React.FC = () => {
  const navigation = useNavigation<StatsScreenNavigationProp>();
  const { theme, themeMode } = useTheme();
  const [records, setRecords] = useState<Partial<GameRecord>>({});
  const [totalPlays, setTotalPlays] = useState(0);
  const [totalPlayTime, setTotalPlayTime] = useState(0);
  const [avgScore, setAvgScore] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      loadAllStats();
    }, [])
  );

  const loadAllStats = async () => {
    // [C5] Zustand에서 직접 읽기
    const { useGameStore } = await import('../game/shared/store');
    const globalStats = useGameStore.getState().globalStats.gamesStats;

    // Convert Zustand stats to GameRecord format
    const flipMatch = globalStats.flip_match.bestRecord !== null ? {
      bestTime: globalStats.flip_match.bestRecord as number,
      totalPlays: globalStats.flip_match.totalPlays,
      totalPlayTime: globalStats.flip_match.totalPlayTime,
      difficulty: 'easy' as const,
    } : undefined;

    const mathRush = globalStats.math_rush.bestRecord !== null ? {
      highScore: globalStats.math_rush.bestRecord as number,
      totalPlays: globalStats.math_rush.totalPlays,
      totalPlayTime: globalStats.math_rush.totalPlayTime,
      highestCombo: 0,
      difficulty: 'medium' as const,
    } : undefined;

    const spatialMemory = globalStats.spatial_memory.bestRecord !== null ? {
      highestLevel: globalStats.spatial_memory.bestRecord as number,
      totalPlays: globalStats.spatial_memory.totalPlays,
      totalPlayTime: globalStats.spatial_memory.totalPlayTime,
      difficulty: 'medium' as const,
    } : undefined;

    const stroop = globalStats.stroop.bestRecord !== null ? {
      highScore: globalStats.stroop.bestRecord as number,
      totalPlays: globalStats.stroop.totalPlays,
      totalPlayTime: globalStats.stroop.totalPlayTime,
      difficulty: 'medium' as const,
    } : undefined;

    const newRecords = {
      flip_match: flipMatch,
      math_rush: mathRush,
      spatial_memory: spatialMemory,
      stroop: stroop
    };
    setRecords(newRecords);

    // Calculate summary stats
    let plays = 0;
    let time = 0;
    let totalScore = 0;
    let scoreCount = 0;

    Object.values(newRecords).forEach(record => {
      if (record) {
        plays += record.totalPlays || 0;
        time += record.totalPlayTime || 0;
        if ('highScore' in record && typeof record.highScore === 'number') {
          totalScore += record.highScore;
          scoreCount++;
        }
      }
    });

    setTotalPlays(plays);
    setTotalPlayTime(time);
    setAvgScore(scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0);
  };

  const styles = getStyles(theme);

  // Mock data for Activity Chart
  const activityData = [
    { label: '월', value: 40 },
    { label: '화', value: 30 },
    { label: '수', value: 60 },
    { label: '목', value: 45 },
    { label: '금', value: 80 },
    { label: '토', value: 55 },
    { label: '일', value: 70 },
  ];

  const maxActivityValue = Math.max(...activityData.map(d => d.value));

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.background} style={styles.backgroundGradient} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
              <GlassView style={styles.iconButtonGlass} intensity={20}>
                <ArrowLeft size={24} color={theme.colors.text} />
              </GlassView>
            </Pressable>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.title}>성과</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>최근 7일</Text>
              </View>
            </View>
          </View>

          {/* Stat Cards Grid */}
          <View style={styles.gridContainer}>
            <View style={styles.row}>
              <StatCard
                title="총 게임 수"
                value={totalPlays.toString()}
                trend="+14%"
                icon={Brain}
                color="indigo"
                theme={theme}
                themeMode={themeMode}
              />
              <StatCard
                title="평균 점수"
                value={avgScore.toString()}
                trend="+2.5%"
                icon={Target}
                color="emerald"
                theme={theme}
                themeMode={themeMode}
              />
            </View>
            <View style={styles.row}>
              <StatCard
                title="반응 속도"
                value={records.flip_match?.bestTime ? `${records.flip_match.bestTime}s` : '-'}
                trend="-12ms"
                icon={Zap}
                color="yellow"
                theme={theme}
                themeMode={themeMode}
              />
              <StatCard
                title="플레이 시간"
                value={formatPlayTime(totalPlayTime)}
                trend="+2h"
                icon={Clock}
                color="purple"
                theme={theme}
                themeMode={themeMode}
              />
            </View>
          </View>

          {/* Activity Chart & Skill Breakdown */}
          <View style={styles.sectionContainer}>
            {/* Activity Chart */}
            <GlassView style={styles.cardGlass} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>활동</Text>
                <TrendingUp size={20} color="#34d399" />
              </View>
              <View style={styles.chartContainer}>
                {activityData.map((item, index) => (
                  <View key={index} style={styles.chartBarContainer}>
                    <View style={styles.chartBarTrack}>
                      <LinearGradient
                        colors={['#6366f1', '#818cf8']}
                        style={[styles.chartBar, { height: `${(item.value / maxActivityValue) * 100}%` }]}
                      />
                    </View>
                    <Text style={styles.chartLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </GlassView>

            {/* Skill Breakdown */}
            <GlassView style={[styles.cardGlass, { marginTop: 16 }]} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
              <Text style={[styles.cardTitle, { marginBottom: 24 }]}>능력 분석</Text>
              <View style={styles.skillsContainer}>
                <SkillBar label="기억력" score={records.spatial_memory?.highestLevel ? Math.min(records.spatial_memory.highestLevel * 10, 100) : 0} color="#10b981" theme={theme} />
                <SkillBar label="속도" score={records.flip_match?.bestTime ? Math.min(100, Math.max(0, 100 - records.flip_match.bestTime)) : 0} color="#3b82f6" theme={theme} />
                <SkillBar label="논리력" score={records.math_rush?.highScore ? Math.min(100, records.math_rush.highScore / 10) : 0} color="#a855f7" theme={theme} />
                <SkillBar label="집중력" score={records.stroop?.highScore ? Math.min(100, records.stroop.highScore / 10) : 0} color="#f97316" theme={theme} />
              </View>
            </GlassView>
          </View>

          {/* Detailed Game Stats (Existing but styled) */}
          <Text style={styles.sectionTitle}>게임 상세</Text>

          <GameStatCard
            Icon={Grid3X3}
            title="Flip & Match"
            stats={[
              { label: '최고 기록', value: records.flip_match?.bestTime ? `${records.flip_match.bestTime}초` : '-', icon: Timer },
              { label: '난이도', value: records.flip_match?.difficulty ? getDifficultyText(records.flip_match.difficulty) : '-', icon: Target },
              { label: '플레이 횟수', value: records.flip_match?.totalPlays ? `${records.flip_match.totalPlays}회` : '-', icon: Hash },
              { label: '총 플레이 시간', value: records.flip_match?.totalPlayTime ? formatPlayTime(records.flip_match.totalPlayTime) : '-', icon: Clock },
            ]}
            gradientColors={theme.gradients.flipMatch}
          />

          <GameStatCard
            Icon={Calculator}
            title="Math Rush"
            stats={[
              { label: '최고 점수', value: records.math_rush?.highScore ? `${records.math_rush.highScore}점` : '-', icon: Trophy },
              { label: '최고 콤보', value: records.math_rush?.highestCombo ? `${records.math_rush.highestCombo}연속` : '-', icon: Flame },
              { label: '플레이 횟수', value: records.math_rush?.totalPlays ? `${records.math_rush.totalPlays}회` : '-', icon: Hash },
              { label: '총 플레이 시간', value: records.math_rush?.totalPlayTime ? formatPlayTime(records.math_rush.totalPlayTime) : '-', icon: Clock },
            ]}
            gradientColors={theme.gradients.mathRush}
          />

          <GameStatCard
            Icon={Brain}
            title="Spatial Memory"
            stats={[
              { label: '최고 레벨', value: records.spatial_memory?.highestLevel ? `Level ${records.spatial_memory.highestLevel}` : '-', icon: Layers },
              { label: '난이도', value: records.spatial_memory?.difficulty ? getDifficultyText(records.spatial_memory.difficulty) : '-', icon: Target },
              { label: '플레이 횟수', value: records.spatial_memory?.totalPlays ? `${records.spatial_memory.totalPlays}회` : '-', icon: Hash },
              { label: '총 플레이 시간', value: records.spatial_memory?.totalPlayTime ? formatPlayTime(records.spatial_memory.totalPlayTime) : '-', icon: Clock },
            ]}
            gradientColors={theme.gradients.spatialMemory}
          />

          <GameStatCard
            Icon={Palette}
            title="Stroop Test"
            stats={[
              { label: '최고 점수', value: records.stroop?.highScore ? `${records.stroop.highScore}점` : '-', icon: Trophy },
              { label: '플레이 횟수', value: records.stroop?.totalPlays ? `${records.stroop.totalPlays}회` : '-', icon: Hash },
              { label: '총 플레이 시간', value: records.stroop?.totalPlayTime ? formatPlayTime(records.stroop.totalPlayTime) : '-', icon: Clock },
            ]}
            gradientColors={theme.gradients.stroop}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const StatCard = ({ title, value, trend, icon: Icon, color, theme, themeMode }: any) => {
  const styles = getStyles(theme);
  const getColor = (c: string) => {
    switch (c) {
      case 'indigo': return '#6366f1';
      case 'emerald': return '#10b981';
      case 'yellow': return '#f59e0b';
      case 'purple': return '#a855f7';
      default: return '#6366f1';
    }
  };
  const baseColor = getColor(color);

  return (
    <GlassView style={styles.statCard} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
      <View style={[styles.statCardGlow, { backgroundColor: baseColor }]} />
      <View style={styles.statCardHeader}>
        <View style={[styles.statIconContainer, { backgroundColor: `${baseColor}20` }]}>
          <Icon size={16} color={baseColor} />
        </View>
        <View style={[styles.trendBadge, { backgroundColor: `${baseColor}10` }]}>
          <Text style={[styles.trendText, { color: baseColor }]}>{trend}</Text>
        </View>
      </View>
      <View>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </GlassView>
  );
};

const SkillBar = ({ label, score, color, theme }: any) => {
  const styles = getStyles(theme);
  return (
    <View style={styles.skillRow}>
      <View style={styles.skillHeader}>
        <Text style={styles.skillLabel}>{label}</Text>
        <Text style={styles.skillScore}>{Math.round(score)}/100</Text>
      </View>
      <View style={styles.skillTrack}>
        <View style={[styles.skillBar, { width: `${score}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const getDifficultyText = (difficulty: string): string => {
  switch (difficulty) {
    case 'easy': return '쉬움';
    case 'medium': return '보통';
    case 'hard': return '어려움';
    default: return difficulty;
  }
};

const formatPlayTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
};

interface GameStatCardProps {
  Icon: React.ElementType;
  title: string;
  stats: { label: string; value: string; icon: React.ElementType }[];
  gradientColors: [string, string];
}

const GameStatCard: React.FC<GameStatCardProps> = ({ Icon, title, stats, gradientColors }) => {
  const { theme, themeMode } = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={styles.gameCardWrapper}>
      <GlassView
        style={styles.gameCardGlass}
        intensity={30}
        tint={themeMode === 'dark' ? 'dark' : 'light'}
      >
        <View style={[styles.gameCardHeader, { borderBottomColor: theme.colors.border }]}>
          <View style={[styles.iconContainer, { backgroundColor: gradientColors[0] + '40', borderColor: gradientColors[0] + '60' }]}>
            <Icon size={24} color={themeMode === 'dark' ? '#fff' : theme.colors.primary} />
          </View>
          <Text style={styles.gameTitle}>{title}</Text>
        </View>
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => {
            const StatIcon = stat.icon;
            return (
              <View key={index} style={styles.statRow}>
                <View style={styles.statLabelContainer}>
                  <StatIcon size={14} color={theme.colors.textSecondary} style={styles.statIcon} />
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
                <Text style={styles.gameStatValue}>{stat.value}</Text>
              </View>
            );
          })}
        </View>
      </GlassView>
    </View>
  );
};

export default StatsScreen;