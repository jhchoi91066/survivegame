import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { loadGameRecord } from '../utils/statsManager';
import { GameRecord } from '../game/shared/types';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';

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
    setRecords({ flip_match: flipMatch, math_rush: mathRush, spatial_memory: spatialMemory, stroop: stroop });
  };

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← 뒤로</Text>
          </Pressable>
          <Text style={styles.title}>통계</Text>
          <View style={styles.placeholder} />
        </View>

        <GameStatCard
          icon="🎴"
          title="Flip & Match"
          stats={[
            { label: '최고 기록', value: records.flip_match?.bestTime ? `${records.flip_match.bestTime}초` : '-' },
            { label: '난이도', value: records.flip_match?.difficulty ? getDifficultyText(records.flip_match.difficulty) : '-' },
            { label: '플레이 횟수', value: records.flip_match?.totalPlays ? `${records.flip_match.totalPlays}회` : '-' },
            { label: '총 플레이 시간', value: records.flip_match?.totalPlayTime ? formatPlayTime(records.flip_match.totalPlayTime) : '-' },
          ]}
          delay={0}
        />

        <GameStatCard
          icon="➕"
          title="Math Rush"
          stats={[
            { label: '최고 점수', value: records.math_rush?.highScore ? `${records.math_rush.highScore}점` : '-' },
            { label: '최고 콤보', value: records.math_rush?.highestCombo ? `${records.math_rush.highestCombo}연속` : '-' },
            { label: '플레이 횟수', value: records.math_rush?.totalPlays ? `${records.math_rush.totalPlays}회` : '-' },
            { label: '총 플레이 시간', value: records.math_rush?.totalPlayTime ? formatPlayTime(records.math_rush.totalPlayTime) : '-' },
          ]}
          delay={100}
        />

        <GameStatCard
          icon="🧠"
          title="Spatial Memory"
          stats={[
            { label: '최고 레벨', value: records.spatial_memory?.highestLevel ? `Level ${records.spatial_memory.highestLevel}` : '-' },
            { label: '난이도', value: records.spatial_memory?.difficulty ? getDifficultyText(records.spatial_memory.difficulty) : '-' },
            { label: '플레이 횟수', value: records.spatial_memory?.totalPlays ? `${records.spatial_memory.totalPlays}회` : '-' },
            { label: '총 플레이 시간', value: records.spatial_memory?.totalPlayTime ? formatPlayTime(records.spatial_memory.totalPlayTime) : '-' },
          ]}
          delay={200}
        />

        <GameStatCard
          icon="🎨"
          title="Stroop Test"
          stats={[
            { label: '최고 점수', value: records.stroop?.highScore ? `${records.stroop.highScore}점` : '-' },
            { label: '플레이 횟수', value: records.stroop?.totalPlays ? `${records.stroop.totalPlays}회` : '-' },
            { label: '총 플레이 시간', value: records.stroop?.totalPlayTime ? formatPlayTime(records.stroop.totalPlayTime) : '-' },
          ]}
          delay={300}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const getDifficultyText = (difficulty: 'easy' | 'medium' | 'hard'): string => {
  switch (difficulty) {
    case 'easy': return '쉬움';
    case 'medium': return '보통';
    case 'hard': return '어려움';
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

interface GameStatCardProps { icon: string; title: string; stats: { label: string; value: string }[]; delay: number; }

const GameStatCard: React.FC<GameStatCardProps> = ({ icon, title, stats, delay }) => {
  const { theme } = useTheme();
  const scale = useSharedValue(0);
  const styles = getStyles(theme);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 15, stiffness: 150 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.gameCard, animatedStyle]}>
      <View style={styles.gameCardHeader}>
        <Text style={styles.gameIcon}>{icon}</Text>
        <Text style={styles.gameTitle}>{title}</Text>
      </View>
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statRow}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 10, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  backButton: { width: 60 },
  backButtonText: { fontSize: 16, fontWeight: '600', color: theme.colors.primary },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text },
  placeholder: { width: 60 },
  gameCard: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border },
  gameCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  gameIcon: { fontSize: 20, marginRight: 12 },
  gameTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text },
  statsContainer: { gap: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontSize: 14, color: theme.colors.textSecondary },
  statValue: { fontSize: 16, fontWeight: '600', color: theme.colors.primary },
});

export default StatsScreen;