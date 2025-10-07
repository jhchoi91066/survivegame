import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../App';
import { useFindTheOddStore } from '../game/findtheodd/store';
import { GridItem } from '../game/findtheodd/types';
import { hapticPatterns } from '../utils/haptics';
import { useTheme } from '../contexts/ThemeContext';

type FindTheOddGameNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FindTheOddGame'>;

// --- Helper Components with improved styling ---

const Shape: React.FC<{ item: GridItem; styles: any }> = ({ item, styles }) => {
  const [color1, color2] = [item.color, `rgb(${Math.max(0, parseInt(item.color.slice(4, 7)) - 20)}, ${Math.max(0, parseInt(item.color.slice(9, 12)) - 20)}, ${Math.max(0, parseInt(item.color.slice(14, 17)) - 20)})`];

  const shapeStyle = {
    transform: [{ rotate: `${item.rotation}deg` }],
  };

  if (item.shape === 'circle') {
    return (
      <View style={styles.shapeGlow}>
        <LinearGradient colors={[color1, color2]} style={[styles.shape, shapeStyle, { borderRadius: 999 }]} />
      </View>
    );
  }
  if (item.shape === 'triangle') {
    return (
      <View style={styles.shapeGlow}>
         <View style={[styles.triangle, shapeStyle, { borderBottomColor: item.color }]} />
      </View>
    );
  }
  return (
    <View style={styles.shapeGlow}>
      <LinearGradient colors={[color1, color2]} style={[styles.shape, shapeStyle]} />
    </View>
  );
};

const GridCell: React.FC<{ item: GridItem; onPress: () => void; styles: any; }> = ({ item, onPress, styles }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.gridCell, animatedStyle]}>
        <Shape item={item} styles={styles} />
      </Animated.View>
    </Pressable>
  );
};

// --- Main Game Screen Component ---

const FindTheOddGame: React.FC = () => {
  const navigation = useNavigation<FindTheOddGameNavigationProp>();
  const { theme } = useTheme();
  const {
    gameStatus,
    score,
    timeRemaining,
    currentProblem,
    combo,
    lives,
    startGame,
    answer,
    tick,
  } = useFindTheOddStore();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameStatus === 'playing') {
      timer = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStatus, tick]);

  useEffect(() => {
    if (gameStatus === 'finished') {
      hapticPatterns.gameOver();
      // Add stat saving logic here later
    }
  }, [gameStatus]);

  const handleAnswer = (index: number) => {
    if (gameStatus !== 'playing') return;
    const isCorrect = answer(index);
    if (isCorrect) {
      hapticPatterns.correctAnswer();
    } else {
      hapticPatterns.wrongAnswer();
    }
  };

  const handleStart = () => {
    hapticPatterns.buttonPress();
    startGame('speed');
  };

  const handleRestart = () => {
    hapticPatterns.buttonPress();
    startGame('speed');
  };

  const handleBackToMenu = () => {
    hapticPatterns.buttonPress();
    navigation.goBack();
  };

  const getTimerColor = (): string => {
    if (timeRemaining > 10) return theme.colors.text;
    if (timeRemaining > 5) return theme.colors.warning;
    return theme.colors.error;
  };

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={handleBackToMenu} style={styles.backButton}>
            <Text style={styles.backButtonText}>← 메뉴</Text>
          </Pressable>
          <Text style={styles.title}>👀 Find the Odd</Text>
          <View style={{ width: 60 }} />
        </View>

        {gameStatus === 'ready' && (
          <View style={styles.startContainer}>
            <Text style={styles.startEmoji}>👀</Text>
            <Text style={styles.startTitle}>Find the Odd</Text>
            <Text style={styles.startDescription}>
              격자 속에서 다른 도형 하나를{`\n`}최대한 빨리 찾아보세요!
            </Text>
            <Pressable style={styles.startButton} onPress={handleStart}>
              <Text style={styles.startButtonText}>시작하기</Text>
            </Pressable>
          </View>
        )}

        {gameStatus === 'playing' && currentProblem && (
          <>
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>점수</Text>
                <Text style={styles.statValue}>{score}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>시간</Text>
                <Text style={[styles.statValue, { color: getTimerColor() }]}>
                  {timeRemaining}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>생명</Text>
                <Text style={styles.statValue}>{'❤️'.repeat(lives ?? 0)}</Text>
              </View>
            </View>

            {combo >= 3 && (
              <View style={styles.comboContainer}>
                <Text style={styles.comboText}>🔥 {combo} COMBO!</Text>
              </View>
            )}

            <View style={styles.gameContainer}>
              <View style={[styles.gridContainer, { gridTemplateColumns: `repeat(${currentProblem.difficulty.gridSize}, 1fr)` }]}>
                {currentProblem.items.map((item, index) => (
                  <GridCell key={item.id} item={item} onPress={() => handleAnswer(index)} styles={styles} />
                ))}
              </View>
            </View>
          </>
        )}

        <Modal visible={gameStatus === 'finished'} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.victoryEmoji}>🎯</Text>
              <Text style={styles.modalTitle}>게임 종료!</Text>
              <Text style={styles.finalScore}>최종 점수: {score}</Text>
              <Pressable style={styles.nextButton} onPress={handleRestart}>
                <Text style={styles.nextButtonText}>다시 하기</Text>
              </Pressable>
              <Pressable style={styles.menuButton} onPress={handleBackToMenu}>
                <Text style={styles.menuButtonText}>메뉴로</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  startEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  startTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  startDescription: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: theme.colors.success,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  comboContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  comboText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.warning,
  },
  gameContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  gridContainer: {
    display: 'grid',
    gap: 12,
    width: '90%',
    maxWidth: 400,
    aspectRatio: 1,
  },
  gridCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  shapeGlow: {
    width: '70%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999, // For circle glow
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  shape: {
    width: '100%',
    height: '100%',
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 25, // These values might need tweaking
    borderRightWidth: 25,
    borderBottomWidth: 45,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 32,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  victoryEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  finalScore: {
    fontSize: 20,
    color: theme.colors.success,
    marginBottom: 24,
    fontWeight: 'bold',
  },
  nextButton: {
    width: '100%',
    backgroundColor: theme.colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  menuButton: {
    width: '100%',
    backgroundColor: theme.colors.surfaceSecondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
});

export default FindTheOddGame;
