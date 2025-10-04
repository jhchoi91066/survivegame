import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { loadGameRecord } from '../utils/statsManager';
import { GameRecord } from '../game/shared/types';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

type StatsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Stats'>;

const StatsScreen: React.FC = () => {
  const navigation = useNavigation<StatsScreenNavigationProp>();
  const [flipMatchRecord, setFlipMatchRecord] = useState<GameRecord['flip_match'] | null>(null);
  const [sequenceRecord, setSequenceRecord] = useState<GameRecord['sequence'] | null>(null);
  const [mathRushRecord, setMathRushRecord] = useState<GameRecord['math_rush'] | null>(null);
  const [mergePuzzleRecord, setMergePuzzleRecord] = useState<GameRecord['merge_puzzle'] | null>(null);

  useEffect(() => {
    loadAllStats();
  }, []);

  const loadAllStats = async () => {
    const flipMatch = await loadGameRecord('flip_match');
    const sequence = await loadGameRecord('sequence');
    const mathRush = await loadGameRecord('math_rush');
    const mergePuzzle = await loadGameRecord('merge_puzzle');

    setFlipMatchRecord(flipMatch);
    setSequenceRecord(sequence);
    setMathRushRecord(mathRush);
    setMergePuzzleRecord(mergePuzzle);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← 뒤로</Text>
          </Pressable>
          <Text style={styles.title}>통계</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Game Stats Cards */}
        <GameStatCard
          icon="🎴"
          title="Flip & Match"
          stats={[
            { label: '최고 기록', value: flipMatchRecord?.bestTime ? `${flipMatchRecord.bestTime}초` : '-' },
            { label: '난이도', value: flipMatchRecord?.difficulty ? getDifficultyText(flipMatchRecord.difficulty) : '-' },
            { label: '플레이 횟수', value: flipMatchRecord?.totalPlays ? `${flipMatchRecord.totalPlays}회` : '-' },
            { label: '총 플레이 시간', value: flipMatchRecord?.totalPlayTime ? formatPlayTime(flipMatchRecord.totalPlayTime) : '-' },
          ]}
          delay={0}
        />

        <GameStatCard
          icon="🔢"
          title="Sequence"
          stats={[
            { label: '최고 레벨', value: sequenceRecord?.highestLevel ? `Level ${sequenceRecord.highestLevel}` : '-' },
            { label: '플레이 횟수', value: sequenceRecord?.totalPlays ? `${sequenceRecord.totalPlays}회` : '-' },
            { label: '총 플레이 시간', value: sequenceRecord?.totalPlayTime ? formatPlayTime(sequenceRecord.totalPlayTime) : '-' },
          ]}
          delay={100}
        />

        <GameStatCard
          icon="➕"
          title="Math Rush"
          stats={[
            { label: '최고 점수', value: mathRushRecord?.highScore ? `${mathRushRecord.highScore}점` : '-' },
            { label: '최고 콤보', value: mathRushRecord?.highestCombo ? `${mathRushRecord.highestCombo}연속` : '-' },
            { label: '플레이 횟수', value: mathRushRecord?.totalPlays ? `${mathRushRecord.totalPlays}회` : '-' },
            { label: '총 플레이 시간', value: mathRushRecord?.totalPlayTime ? formatPlayTime(mathRushRecord.totalPlayTime) : '-' },
          ]}
          delay={200}
        />

        <GameStatCard
          icon="🔢"
          title="Merge Puzzle"
          stats={[
            { label: '최소 이동', value: mergePuzzleRecord?.bestMoves ? `${mergePuzzleRecord.bestMoves}회` : '-' },
            { label: '최고 숫자', value: mergePuzzleRecord?.highestNumber ? `${mergePuzzleRecord.highestNumber}` : '-' },
            { label: '플레이 횟수', value: mergePuzzleRecord?.totalPlays ? `${mergePuzzleRecord.totalPlays}회` : '-' },
            { label: '총 플레이 시간', value: mergePuzzleRecord?.totalPlayTime ? formatPlayTime(mergePuzzleRecord.totalPlayTime) : '-' },
          ]}
          delay={300}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const getDifficultyText = (difficulty: 'easy' | 'medium' | 'hard'): string => {
  switch (difficulty) {
    case 'easy': return '쉬움 (4x4)';
    case 'medium': return '보통 (4x6)';
    case 'hard': return '어려움 (4x8)';
  }
};

const formatPlayTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  } else if (minutes > 0) {
    return `${minutes}분 ${secs}초`;
  } else {
    return `${secs}초`;
  }
};

interface GameStatCardProps {
  icon: string;
  title: string;
  stats: { label: string; value: string }[];
  delay: number;
}

const GameStatCard: React.FC<GameStatCardProps> = ({ icon, title, stats, delay }) => {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 60,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22d3ee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 60,
  },
  gameCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  gameCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  gameIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsContainer: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22d3ee',
  },
});

export default StatsScreen;
