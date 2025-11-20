import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Achievement, AchievementProgress } from '../../data/achievements';
import { useTheme } from '../../contexts/ThemeContext';
import { GlassView } from './GlassView';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { Lock, Check, Trophy, Target, Zap, Medal, Layers } from 'lucide-react-native';

interface AchievementCardProps {
  achievement: Achievement;
  progress: AchievementProgress;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, progress }) => {
  const { theme } = useTheme();
  const isLocked = !progress.unlocked && achievement.isHidden;
  const styles = getStyles(theme);

  // Animation values
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1);
    opacity.value = withTiming(1, { duration: 500 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'progress': return Target;
      case 'skill': return Zap;
      case 'challenge': return Medal;
      case 'collection': return Layers;
      default: return Trophy;
    }
  };

  const CategoryIcon = getCategoryIcon(achievement.category);

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <GlassView
        style={styles.glass}
        intensity={progress.unlocked ? 30 : 15}
        tint={progress.unlocked ? 'light' : 'dark'}
      >
        {/* Header / Icon */}
        <View style={styles.header}>
          <View style={[
            styles.iconContainer,
            progress.unlocked ? styles.iconUnlocked : styles.iconLocked
          ]}>
            {isLocked ? (
              <Lock size={24} color={theme.colors.textTertiary} />
            ) : (
              <Text style={styles.emoji}>{achievement.emoji}</Text>
            )}
          </View>
          <View style={styles.headerText}>
            <Text style={[
              styles.title,
              progress.unlocked && styles.titleUnlocked
            ]}>
              {isLocked ? '???' : achievement.name}
            </Text>
            <View style={styles.categoryBadge}>
              <CategoryIcon size={10} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={styles.categoryText}>{getCategoryName(achievement.category)}</Text>
            </View>
          </View>
          {progress.unlocked && (
            <View style={styles.checkBadge}>
              <LinearGradient
                colors={theme.gradients.success}
                style={styles.checkGradient}
              >
                <Check size={12} color="#fff" />
              </LinearGradient>
            </View>
          )}
        </View>

        {/* Description */}
        <Text style={styles.description}>
          {isLocked ? '숨겨진 업적을 달성하세요' : achievement.description}
        </Text>

        {/* Progress Bar */}
        {!progress.unlocked && !isLocked && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={theme.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${Math.min(progress.progress, 100)}%` }]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(progress.progress)}%
              {progress.currentCount !== undefined && achievement.requirement.count && (
                ` (${progress.currentCount}/${achievement.requirement.count})`
              )}
            </Text>
          </View>
        )}

        {/* Unlocked Date */}
        {progress.unlocked && progress.unlockedAt && (
          <Text style={styles.unlockedDate}>
            {new Date(progress.unlockedAt).toLocaleDateString('ko-KR')} 달성
          </Text>
        )}
      </GlassView>
    </Animated.View>
  );
};

const getCategoryName = (category: string): string => {
  switch (category) {
    case 'progress': return '진행';
    case 'skill': return '스킬';
    case 'challenge': return '도전';
    case 'collection': return '수집';
    case 'hidden': return '히든';
    default: return '기타';
  }
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  glass: {
    padding: 16,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  iconLocked: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconUnlocked: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  emoji: {
    fontSize: 24,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  titleUnlocked: {
    color: theme.colors.text,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  checkGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    textAlign: 'right',
  },
  unlockedDate: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
});

export default AchievementCard;
