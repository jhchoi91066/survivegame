import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getAllLevels, LevelConfig } from '../data/levelData';
import { loadProgress, isLevelUnlocked, LevelProgress } from '../utils/progressManager';

type LevelSelectScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'LevelSelect'
>;

interface LevelSelectScreenProps {
  navigation: LevelSelectScreenNavigationProp;
}

const LevelSelectScreen: React.FC<LevelSelectScreenProps> = ({ navigation }) => {
  const [levels, setLevels] = useState<LevelConfig[]>([]);
  const [progressData, setProgressData] = useState<Record<number, LevelProgress>>({});
  const [unlockedLevels, setUnlockedLevels] = useState<Set<number>>(new Set([1]));

  useEffect(() => {
    const loadData = async () => {
      const allLevels = getAllLevels();
      const progress = await loadProgress();

      // Check which levels are unlocked
      const unlocked = new Set<number>();
      for (const level of allLevels) {
        const isUnlocked = await isLevelUnlocked(level.id);
        if (isUnlocked) {
          unlocked.add(level.id);
        }
      }

      setLevels(allLevels);
      setProgressData(progress.levels);
      setUnlockedLevels(unlocked);
    };

    loadData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </Pressable>
        <Text style={styles.title}>레벨 선택</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.levelGrid}>
          {levels.map((level) => {
            const progress = progressData[level.id];
            const isUnlocked = unlockedLevels.has(level.id);
            const stars = progress?.stars || 0;
            const completed = progress?.completed || false;

            return (
              <Pressable
                key={level.id}
                style={[
                  styles.levelCard,
                  !isUnlocked && styles.levelCardLocked,
                  completed && styles.levelCardCompleted,
                ]}
                onPress={() => {
                  if (isUnlocked) {
                    navigation.navigate('Game', { level: level.id });
                  }
                }}
                disabled={!isUnlocked}
              >
                <Text style={[styles.levelNumber, !isUnlocked && styles.levelNumberLocked]}>
                  {isUnlocked ? level.id : '🔒'}
                </Text>
                <View style={styles.stars}>
                  <Text style={styles.starText}>
                    {isUnlocked ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '☆☆☆'}
                  </Text>
                </View>
                <Text style={styles.levelStatus}>
                  {!isUnlocked ? '잠금' : completed ? '완료' : '미완료'}
                </Text>
                <Text style={styles.levelDifficulty}>
                  {level.difficulty === 'easy' ? '쉬움' : level.difficulty === 'medium' ? '보통' : '어려움'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  placeholder: {
    width: 60,
  },
  scrollContent: {
    padding: 16,
  },
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  levelCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  levelNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 8,
  },
  stars: {
    marginBottom: 4,
  },
  starText: {
    fontSize: 14,
    color: '#d1d5db',
  },
  levelStatus: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
  },
  levelDifficulty: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  levelCardLocked: {
    backgroundColor: '#e5e7eb',
    opacity: 0.6,
  },
  levelCardCompleted: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  levelNumberLocked: {
    fontSize: 24,
  },
});

export default LevelSelectScreen;