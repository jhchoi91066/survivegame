import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { Achievement } from '../../data/achievements';
import { hapticPatterns } from '../../utils/haptics';
import { GlassView } from './GlassView';

interface AchievementUnlockModalProps {
  visible: boolean;
  achievements: Achievement[];
  onClose: () => void;
}

const AchievementUnlockModal: React.FC<AchievementUnlockModalProps> = ({
  visible,
  achievements,
  onClose,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible && achievements.length > 0) {
      hapticPatterns.correctAnswer();
      scale.value = withSpring(1, { damping: 12, stiffness: 100 });
      opacity.value = withSpring(1);
    } else {
      scale.value = 0;
      opacity.value = 0;
    }
  }, [visible, achievements]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible || achievements.length === 0) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, animatedStyle]}>
          <LinearGradient
            colors={['#fbbf24', '#f59e0b', '#d97706']}
            style={styles.gradient}
          >
            <View style={styles.content}>
              <Text style={styles.title}>🎉 업적 달성! 🎉</Text>

              {achievements.map((achievement, index) => (
                <GlassView key={achievement.id} style={styles.achievementCard} intensity={20} tint="light">
                  <View style={styles.iconContainer}>
                    <Text style={styles.icon}>{achievement.emoji}</Text>
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.achievementName}>{achievement.name}</Text>
                    <Text style={styles.achievementDesc}>{achievement.description}</Text>
                  </View>
                </GlassView>
              ))}

              <Pressable
                style={styles.button}
                onPress={() => {
                  hapticPatterns.buttonPress();
                  onClose();
                }}
              >
                <LinearGradient
                  colors={['#334155', '#1e293b']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>확인</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </LinearGradient>
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
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  gradient: {
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
  },
  iconContainer: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 32,
  },
  textContainer: {
    flex: 1,
  },
  achievementName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  achievementDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  button: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

export default AchievementUnlockModal;
