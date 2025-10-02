import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Achievement, AchievementProgress } from '../data/achievements';

interface AchievementCardProps {
  achievement: Achievement;
  progress: AchievementProgress;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, progress }) => {
  const isLocked = !progress.unlocked && achievement.isHidden;

  return (
    <View style={[styles.card, progress.unlocked && styles.cardUnlocked]}>
      {/* 이모지 */}
      <View style={[styles.emojiContainer, progress.unlocked && styles.emojiContainerUnlocked]}>
        <Text style={styles.emoji}>{isLocked ? '🔒' : achievement.emoji}</Text>
      </View>

      {/* 정보 */}
      <View style={styles.infoContainer}>
        <Text style={[styles.name, progress.unlocked && styles.nameUnlocked]}>
          {isLocked ? '???' : achievement.name}
        </Text>
        <Text style={styles.description}>
          {isLocked ? '숨겨진 업적을 달성하세요' : achievement.description}
        </Text>

        {/* 진행도 바 */}
        {!progress.unlocked && !isLocked && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress.progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {Math.round(progress.progress)}%
              {progress.currentCount !== undefined && achievement.requirement.count && (
                ` (${progress.currentCount}/${achievement.requirement.count})`
              )}
            </Text>
          </View>
        )}

        {/* 달성 표시 */}
        {progress.unlocked && (
          <View style={styles.unlockedBadge}>
            <Text style={styles.unlockedText}>✓ 달성</Text>
            {progress.unlockedAt && (
              <Text style={styles.unlockedDate}>
                {new Date(progress.unlockedAt).toLocaleDateString('ko-KR')}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* 카테고리 배지 */}
      <View style={[styles.categoryBadge, getCategoryColor(achievement.category)]}>
        <Text style={styles.categoryText}>{getCategoryName(achievement.category)}</Text>
      </View>
    </View>
  );
};

const getCategoryName = (category: string): string => {
  switch (category) {
    case 'progress':
      return '진행';
    case 'skill':
      return '스킬';
    case 'challenge':
      return '도전';
    case 'collection':
      return '수집';
    case 'hidden':
      return '히든';
    default:
      return '';
  }
};

const getCategoryColor = (category: string): { backgroundColor: string } => {
  switch (category) {
    case 'progress':
      return { backgroundColor: '#3b82f6' };
    case 'skill':
      return { backgroundColor: '#8b5cf6' };
    case 'challenge':
      return { backgroundColor: '#ef4444' };
    case 'collection':
      return { backgroundColor: '#10b981' };
    case 'hidden':
      return { backgroundColor: '#f59e0b' };
    default:
      return { backgroundColor: '#6b7280' };
  }
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  cardUnlocked: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  emojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  emojiContainerUnlocked: {
    backgroundColor: '#fbbf24',
  },
  emoji: {
    fontSize: 32,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  nameUnlocked: {
    color: '#92400e',
  },
  description: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  progressContainer: {
    marginTop: 8,
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
  progressText: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'right',
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  unlockedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#15803d',
  },
  unlockedDate: {
    fontSize: 11,
    color: '#78350f',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default AchievementCard;
