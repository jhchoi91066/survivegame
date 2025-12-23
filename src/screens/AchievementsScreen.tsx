import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList } from '../types/navigation';
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
import { useTheme } from '../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from '../components/shared/GlassView';
import {
  ArrowLeft,
  Trophy,
  Medal,
  Target,
  Layers,
  Grid3X3,
  Zap
} from 'lucide-react-native';

type AchievementsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<any, 'Achievements'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const CATEGORIES: { key: AchievementCategory | 'all'; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: '전체', icon: Trophy },
  { key: 'progress', label: '진행', icon: Target },
  { key: 'skill', label: '스킬', icon: Zap },
  { key: 'challenge', label: '도전', icon: Medal },
  { key: 'collection', label: '수집', icon: Layers },
];

const AchievementsScreen: React.FC = () => {
  const navigation = useNavigation<AchievementsScreenNavigationProp>();
  const { theme, themeMode } = useTheme();
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
  const styles = getStyles(theme);

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={theme.gradients.background} style={styles.backgroundGradient} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>업적 불러오는 중...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.background} style={styles.backgroundGradient} />
      <SafeAreaView style={styles.safeArea}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <GlassView style={styles.iconButtonGlass} intensity={20}>
              <ArrowLeft size={24} color={theme.colors.text} />
            </GlassView>
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>업적</Text>
            <Text style={styles.subtitle}>나만의 트로피를 모아보세요!</Text>
          </View>
        </View>

        {/* 진행도 요약 */}
        <View style={styles.summaryContainer}>
          <GlassView style={styles.summaryGlass} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
            <View style={styles.summaryHeader}>
              <Trophy size={20} color={theme.colors.warning} style={{ marginRight: 8 }} />
              <Text style={styles.summaryTitle}>전체 달성률</Text>
            </View>
            <View style={styles.summaryBarContainer}>
              <View style={styles.summaryBarBg} />
              <LinearGradient
                colors={theme.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.summaryBarFill, { width: `${completionRate}%` }]}
              />
            </View>
            <Text style={styles.summaryText}>
              {unlockedCount} / {totalCount} ({completionRate}%)
            </Text>
          </GlassView>
        </View>

        {/* 카테고리 필터 */}
        <View style={styles.categoryContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContent}
          >
            {CATEGORIES.map(category => {
              const isActive = selectedCategory === category.key;
              const Icon = category.icon;
              return (
                <Pressable
                  key={category.key}
                  style={styles.categoryButtonWrapper}
                  onPress={() => setSelectedCategory(category.key)}
                >
                  <GlassView
                    style={styles.categoryButtonGlass}
                    intensity={isActive ? 40 : 20}
                    tint={isActive ? (themeMode === 'dark' ? 'light' : 'dark') : (themeMode === 'dark' ? 'dark' : 'light')}
                  >
                    <Icon size={16} color={isActive ? (themeMode === 'dark' ? theme.colors.text : '#fff') : theme.colors.textSecondary} style={{ marginRight: 6 }} />
                    <Text
                      style={[
                        styles.categoryButtonText,
                        isActive && { color: themeMode === 'dark' ? theme.colors.text : '#fff', fontWeight: '700' },
                      ]}
                    >
                      {category.label}
                    </Text>
                  </GlassView>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

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
              <Trophy size={48} color={theme.colors.textTertiary} style={{ marginBottom: 16 }} />
              <Text style={styles.emptyText}>이 카테고리에 업적이 없습니다</Text>
            </View>
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
  summaryContainer: { paddingHorizontal: 20, marginBottom: 24 },
  summaryGlass: { padding: 20, borderRadius: 20 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  summaryBarContainer: { height: 8, backgroundColor: theme.colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  summaryBarBg: { ...StyleSheet.absoluteFillObject, opacity: 0.3 },
  summaryBarFill: { height: '100%', borderRadius: 4 },
  summaryText: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'right', fontWeight: '600' },
  categoryContainer: { marginBottom: 16 },
  categoryContent: { paddingHorizontal: 20, gap: 8 },
  categoryButtonWrapper: { borderRadius: 12, overflow: 'hidden' },
  categoryButtonGlass: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  categoryButtonText: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 0, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: theme.colors.textSecondary },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: theme.colors.textSecondary, fontWeight: '600' },
});

export default AchievementsScreen;
