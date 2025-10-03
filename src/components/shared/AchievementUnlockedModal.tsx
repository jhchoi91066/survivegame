import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Achievement } from '../../data/achievements';

interface AchievementUnlockedModalProps {
  visible: boolean;
  achievement: Achievement | null;
  onClose: () => void;
}

const AchievementUnlockedModal: React.FC<AchievementUnlockedModalProps> = ({
  visible,
  achievement,
  onClose,
}) => {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (visible && achievement) {
      // 등장 애니메이션
      scale.value = withSpring(1, {
        damping: 10,
        stiffness: 100,
      });

      // 회전 애니메이션
      rotation.value = withSequence(
        withTiming(-10, { duration: 100 }),
        withTiming(10, { duration: 200 }),
        withTiming(-10, { duration: 200 }),
        withTiming(0, { duration: 100 })
      );
    } else {
      scale.value = 0;
      rotation.value = 0;
    }
  }, [visible, achievement]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  if (!achievement) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.modal, animatedStyle]}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.headerText}>🎉 업적 달성! 🎉</Text>
          </View>

          {/* 업적 아이콘 */}
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{achievement.emoji}</Text>
          </View>

          {/* 업적 정보 */}
          <Text style={styles.name}>{achievement.name}</Text>
          <Text style={styles.description}>{achievement.description}</Text>

          {/* 보상 */}
          {achievement.reward && (
            <View style={styles.rewardContainer}>
              <Text style={styles.rewardTitle}>🎁 보상</Text>
              <Text style={styles.rewardText}>{achievement.reward.value}</Text>
            </View>
          )}

          {/* 확인 버튼 */}
          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>확인</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#78350f',
  },
  emojiContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#fbbf24',
  },
  emoji: {
    fontSize: 56,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  rewardContainer: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  rewardText: {
    fontSize: 13,
    color: '#1e3a8a',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AchievementUnlockedModal;
