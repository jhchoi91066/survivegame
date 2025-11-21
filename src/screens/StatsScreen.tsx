import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { loadGameRecord } from '../utils/statsManager';
import { GameRecord } from '../game/shared/types';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
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
  Activity,
  Layers,
  Clock,
  Hash,
  Target,
  Flame,
  Zap
} from 'lucide-react-native';

type StatsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Stats'>;

const StatsScreen: React.FC = () => {
  const navigation = useNavigation<StatsScreenNavigationProp>();
  const { theme } = useTheme();
  const [records, setRecords] = useState<Partial<GameRecord>>({});

  useFocusEffect(
    React.useCallback(() => {
      loadAllStats();
    }, [])
  );

  const loadAllStats = async () => {
    const [flipMatch, mathRush, spatialMemory, stroop] = await Promise.all([
      loadGameRecord('flip_match'),
      loadGameRecord('math_rush'),
      loadGameRecord('spatial_memory'),
      loadGameRecord('stroop'),
    ]);
    setRecords({
      flip_match: flipMatch || undefined,
      math_rush: mathRush || undefined,
      spatial_memory: spatialMemory || undefined,
      stroop: stroop || undefined
    });
  };

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.background} style={styles.backgroundGradient} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
              <GlassView style={styles.iconButtonGlass} intensity={20}>
                <ArrowLeft size={24} color={theme.colors.text} />
              </GlassView>
            </Pressable>
            <Text style={styles.title}>통계</Text>
            <View style={styles.placeholder} />
          </View>

          <GameStatCard
            Icon={Grid3X3}
            title="Flip & Match"
            stats={[
              { label: '최고 기록', value: records.flip_match?.bestTime ? `${records.flip_match.bestTime}초` : '-', icon: Timer },
              { label: '난이도', value: records.flip_match?.difficulty ? getDifficultyText(records.flip_match.difficulty) : '-', icon: Target },
              { label: '플레이 횟수', value: records.flip_match?.totalPlays ? `${records.flip_match.totalPlays}회` : '-', icon: Hash },
              { label: '총 플레이 시간', value: records.flip_match?.totalPlayTime ? formatPlayTime(records.flip_match.totalPlayTime) : '-', icon: Clock },
            ]}
            delay={0}
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
            delay={100}
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
            delay={200}
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
            delay={300}
            gradientColors={theme.gradients.stroop}
          />
        </ScrollView>
      </SafeAreaView>
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
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  if (minutes > 0) return `${minutes}분 ${secs}초`;
  return `${secs}초`;
};

interface GameStatCardProps {
  Icon: React.ElementType;
  title: string;
  stats: { label: string; value: string; icon: React.ElementType }[];
  delay: number;
  gradientColors: [string, string];
}

const GameStatCard: React.FC<GameStatCardProps> = ({ Icon, title, stats, delay, gradientColors }) => {
  const { theme, themeMode } = useTheme();
  const scale = useSharedValue(0);
  const styles = getStyles(theme);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 15, stiffness: 150 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.gameCardWrapper, animatedStyle]}>
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
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
            );
          })}
        </View>
      </GlassView>
    </Animated.View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1 },
  backgroundGradient: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'web' ? 40 : 0 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 10, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  backButton: { borderRadius: 12, overflow: 'hidden' },
  iconButtonGlass: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  title: { fontSize: 24, fontWeight: '900', color: theme.colors.text },
  placeholder: { width: 44 },
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
  statValue: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
});

export default StatsScreen;