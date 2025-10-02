import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import { useGameStore } from '../game/store';

interface GameOverModalProps {
  visible: boolean;
  onRestart: () => void;
  onNextLevel?: () => void;
  onMainMenu?: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ visible, onRestart, onNextLevel, onMainMenu }) => {
  const gameStatus = useGameStore((state) => state.gameStatus);
  const timeRemaining = useGameStore((state) => state.timeRemaining);
  const survivors = useGameStore((state) => state.survivors);
  const calculateStars = useGameStore((state) => state.calculateStars);
  const checkHiddenAchievement = useGameStore((state) => state.checkHiddenAchievement);

  const isVictory = gameStatus === 'victory';

  // Animation values - MUST be called before any conditional returns
  const scale = useSharedValue(0);
  const starScale = useSharedValue(0);
  const starRotation = useSharedValue(0);

  // Trigger animations when modal becomes visible
  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });

      if (isVictory) {
        // Stagger star animations
        starScale.value = withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(1.3, { duration: 300 }),
          withSpring(1, { damping: 10 })
        );
        starRotation.value = withRepeat(
          withSequence(
            withTiming(10, { duration: 200 }),
            withTiming(-10, { duration: 200 }),
            withTiming(0, { duration: 200 })
          ),
          3,
          false
        );
      }
    } else {
      scale.value = 0;
      starScale.value = 0;
      starRotation.value = 0;
    }
  }, [visible, isVictory]);

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const starAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: starScale.value },
      { rotate: `${starRotation.value}deg` }
    ],
  }));

  // Calculate statistics
  const totalHealth = survivors.reduce((sum, s) => sum + s.health, 0);
  const avgHealth = Math.floor(totalHealth / survivors.length);
  const totalEnergy = survivors.reduce((sum, s) => sum + s.energy, 0);
  const avgEnergy = Math.floor(totalEnergy / survivors.length);

  // Star rating (1-3 stars) - 새로운 별점 계산
  const stars = isVictory ? calculateStars() : 0;

  // 히든 달성 확인
  const hiddenAchievement = isVictory ? checkHiddenAchievement() : null;

  // Return null after all hooks are called
  if (!visible || (gameStatus !== 'victory' && gameStatus !== 'defeat')) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRestart}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.modal, modalAnimatedStyle]}>
          <Text style={[styles.title, isVictory ? styles.victoryTitle : styles.defeatTitle]}>
            {isVictory ? '🎉 구조 성공!' : '💀 실패...'}
          </Text>

          {isVictory && (
            <Animated.View style={[styles.stars, starAnimatedStyle]}>
              <Text style={styles.starText}>
                {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
              </Text>
            </Animated.View>
          )}

          <View style={styles.stats}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>남은 시간:</Text>
              <Text style={styles.statValue}>
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>평균 체력:</Text>
              <Text style={styles.statValue}>{avgHealth}%</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>평균 에너지:</Text>
              <Text style={styles.statValue}>{avgEnergy}%</Text>
            </View>
          </View>

          {/* 히든 달성 표시 */}
          {hiddenAchievement && (
            <View style={styles.achievementBanner}>
              <Text style={styles.achievementIcon}>🏆</Text>
              <View style={styles.achievementTextContainer}>
                <Text style={styles.achievementTitle}>히든 달성!</Text>
                <Text style={styles.achievementName}>{hiddenAchievement}</Text>
              </View>
            </View>
          )}

          <View style={styles.buttonContainer}>
            {isVictory && onNextLevel && (
              <Pressable style={[styles.button, styles.nextButton]} onPress={onNextLevel}>
                <Text style={styles.buttonText}>다음 레벨 ➡️</Text>
              </Pressable>
            )}
            <Pressable style={[styles.button, styles.restartButton]} onPress={onRestart}>
              <Text style={styles.buttonText}>다시 시작</Text>
            </Pressable>
            {onMainMenu && (
              <Pressable style={[styles.button, styles.menuButton]} onPress={onMainMenu}>
                <Text style={styles.buttonText}>메인 메뉴</Text>
              </Pressable>
            )}
          </View>
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
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  victoryTitle: {
    color: '#10b981', // green-500
  },
  defeatTitle: {
    color: '#ef4444', // red-500
  },
  stars: {
    alignItems: 'center',
    marginBottom: 20,
  },
  starText: {
    fontSize: 32,
  },
  stats: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  buttonContainer: {
    gap: 10,
  },
  button: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#10b981', // green-500
  },
  restartButton: {
    backgroundColor: '#3b82f6', // blue-500
  },
  menuButton: {
    backgroundColor: '#6b7280', // gray-500
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  achievementBanner: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f59e0b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  achievementTextContainer: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  achievementName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#b45309',
  },
});

export default GameOverModal;