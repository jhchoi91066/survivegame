import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
  ACHIEVEMENTS,
  AchievementCategory,
  getAchievementsByCategory,
  getVisibleAchievements,
} from '../data/achievements';
import { AchievementProgress } from '../data/achievements';
import {
  loadAchievementProgress,
  getAchievementCompletionRate,
} from '../utils/achievementManager';
import AchievementCard from '../components/shared/AchievementCard';

type AchievementsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Achievements'
>;

const CATEGORIES: { key: AchievementCategory | 'all'; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'progress', label: '진행' },
  { key: 'skill', label: '스킬' },
  { key: 'challenge', label: '도전' },
  { key: 'collection', label: '수집' },
];

const AchievementsScreen: React.FC = () => {
  const navigation = useNavigation<AchievementsScreenNavigationProp>();
  const [achievementProgress, setAchievementProgress] = useState<AchievementProgress[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [completionRate, setCompletionRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const progress = await loadAchievementProgress();
      const rate = await getAchievementCompletionRate();
      setAchievementProgress(progress);
      setCompletionRate(rate);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAchievements = () => {
    if (selectedCategory === 'all') {
      return ACHIEVEMENTS;
    }
    return getAchievementsByCategory(selectedCategory);
  };

  const getProgressForAchievement = (achievementId: string): AchievementProgress => {
    return (
      achievementProgress.find(p => p.achievementId === achievementId) || {
        achievementId,
        unlocked: false,
        progress: 0,
        currentCount: 0,
      }
    );
  };

  const unlockedCount = achievementProgress.filter(p => p.unlocked).length;
  const totalCount = ACHIEVEMENTS.length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>업적 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </Pressable>
        <Text style={styles.title}>업적</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 진행도 요약 */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>전체 달성률</Text>
        <View style={styles.summaryBar}>
          <View style={[styles.summaryFill, { width: `${completionRate}%` }]} />
        </View>
        <Text style={styles.summaryText}>
          {unlockedCount} / {totalCount} ({completionRate}%)
        </Text>
      </View>

      {/* 카테고리 필터 */}
      <ScrollView
        horizontal
        style={styles.categoryContainer}
        showsHorizontalScrollIndicator={false}
      >
        {CATEGORIES.map(category => (
          <Pressable
            key={category.key}
            style={[
              styles.categoryButton,
              selectedCategory === category.key && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category.key)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category.key && styles.categoryButtonTextActive,
              ]}
            >
              {category.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* 업적 리스트 */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {getFilteredAchievements().map(achievement => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            progress={getProgressForAchievement(achievement.id)}
          />
        ))}

        {getFilteredAchievements().length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>이 카테고리에 업적이 없습니다</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'web' ? 40 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
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
  summaryContainer: {
    padding: 20,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  summaryBar: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  summaryFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  summaryText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'right',
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#3b82f6',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
});

export default AchievementsScreen;
