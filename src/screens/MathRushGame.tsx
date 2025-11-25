import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Modal, Platform, Dimensions } from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Calculator,
  Play,
  RotateCcw,
  Menu,
  Timer,
  Trophy,
  Zap,
  Pause,
  Flame,
  Target
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from '../components/shared/GlassView';
import { PauseMenu } from '../components/shared/PauseMenu';
import { RootStackParamList } from '../../App';
import { useMathRushStore } from '../game/mathrush/store';
import { Difficulty } from '../game/mathrush/types';
import { hapticPatterns } from '../utils/haptics';
import { soundManager } from '../utils/soundManager';
import { useGameStore } from '../game/shared/store';
import { updateMathRushRecord, loadGameRecord } from '../utils/statsManager';
import { incrementGameCount } from '../utils/reviewManager';
import { useTheme } from '../contexts/ThemeContext';
import { updateStatsOnGamePlayed } from '../utils/achievementManager';
import { Achievement } from '../data/achievements';
import AchievementUnlockModal from '../components/shared/AchievementUnlockModal';
import { uploadGameStats } from '../utils/cloudSync';
import { useAuth } from '../contexts/AuthContext';
import { MultiplayerProvider, useMultiplayer } from '../contexts/MultiplayerContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  FadeInDown,
  FadeOutUp
} from 'react-native-reanimated';

type MathRushGameNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MathRushGame'>;

const { width } = Dimensions.get('window');

// Wrapper component for multiplayer support
const MathRushGame: React.FC = () => {
  const route = useRoute<any>();
  const multiplayerRoomId = route.params?.multiplayerRoomId;

  return (
    <MultiplayerProvider roomId={multiplayerRoomId}>
      <MathRushGameContent />
    </MultiplayerProvider>
  );
};

const MathRushGameContent: React.FC = () => {
  const navigation = useNavigation<MathRushGameNavigationProp>();
  const { theme, themeMode } = useTheme();
  const { user } = useAuth();
  const { isMultiplayer, opponentScore, updateMyScore, finishGame } = useMultiplayer();
  const {
    currentProblem, score, timeRemaining, gameStatus, lives, difficulty, answerProblem, decrementTime, startGame, resetGame, pauseGame, resumeGame
  } = useMathRushStore();

  const { updateBestRecord } = useGameStore();
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [isPauseMenuVisible, setIsPauseMenuVisible] = useState(false);
  const [showDifficultyModal, setShowDifficultyModal] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const isMounted = React.useRef(true);

  // Animation values
  const timeScale = useSharedValue(1);
  const scoreScale = useSharedValue(1);
  const questionShake = useSharedValue(0);

  const timeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timeScale.value }],
  }));

  const scoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  const questionAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: questionShake.value }],
  }));

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      resetGame();
      setShowDifficultyModal(true);
      setIsNewRecord(false);
    }, [resetGame])
  );

  useEffect(() => {
    if (gameStatus === 'playing') {
      const interval = setInterval(() => decrementTime(), 1000);
      return () => clearInterval(interval);
    }
  }, [gameStatus]);

  // Time warning animation
  useEffect(() => {
    if (timeRemaining <= 5 && timeRemaining > 0) {
      timeScale.value = withSequence(
        withTiming(1.2, { duration: 200 }),
        withTiming(1, { duration: 200 })
      );
    }
  }, [timeRemaining]);

  // Score pulse animation
  useEffect(() => {
    if (score > 0) {
      scoreScale.value = withSequence(
        withSpring(1.2),
        withSpring(1)
      );
    }
  }, [score]);

  // Update multiplayer score
  useEffect(() => {
    if (isMultiplayer && gameStatus === 'playing' && score > 0) {
      updateMyScore(score);
    }
  }, [isMultiplayer, score, gameStatus]);

  useEffect(() => {
    if (gameStatus === 'finished') {
      handleGameFinish();
    }
  }, [gameStatus]);

  const handleGameFinish = async () => {
    hapticPatterns.gameOver();
    soundManager.playSound(score > 0 ? 'game_win' : 'game_lose');

    // Finish multiplayer game
    if (isMultiplayer) {
      await finishGame();
    }

    const oldRecord = await loadGameRecord('math_rush');
    if (!isMounted.current) return;

    if (!oldRecord || !oldRecord.highScore || score > oldRecord.highScore) {
      setIsNewRecord(true);
    }

    const playTime = (difficulty === 'easy' ? 60 : difficulty === 'medium' ? 45 : 30) - timeRemaining;
    await updateMathRushRecord(score, playTime, difficulty);
    updateBestRecord('math_rush', score);
    await incrementGameCount();

    if (user) {
      const record = await loadGameRecord('math_rush');
      if (record) {
        await uploadGameStats('math_rush', {
          highScore: record.highScore,
          totalPlays: record.totalPlays,
          totalPlayTime: record.totalPlayTime,
          difficulty: difficulty,
        });
      }
    }

    const newAchievements = await updateStatsOnGamePlayed('math_rush', score, playTime, difficulty);
    if (!isMounted.current) return;

    if (newAchievements.length > 0) {
      setUnlockedAchievements(newAchievements);
      setShowAchievementModal(true);
      soundManager.playSound('achievement');
    }
  };

  const handleAnswer = (answer: number) => {
    if (gameStatus !== 'playing' || !currentProblem) return;

    const isCorrect = answer === currentProblem.correctAnswer;
    if (isCorrect) {
      hapticPatterns.correctAnswer();
      soundManager.playSound('correct_answer');
    } else {
      hapticPatterns.wrongAnswer();
      // Shake animation
      questionShake.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
    answerProblem(answer);
  };

  const handleStart = () => {
    setIsNewRecord(false);
    soundManager.playSound('game_start');
    hapticPatterns.buttonPress();
    setShowDifficultyModal(false);
    startGame(selectedDifficulty);
  };

  const handleRestart = () => {
    setIsNewRecord(false);
    hapticPatterns.buttonPress();
    resetGame();
    setShowDifficultyModal(true);
  };

  const handleBackToMenu = () => {
    hapticPatterns.buttonPress();
    navigation.goBack();
  };

  const handlePause = () => {
    hapticPatterns.buttonPress();
    pauseGame();
    setIsPauseMenuVisible(true);
  };

  const handleResume = () => {
    hapticPatterns.buttonPress();
    resumeGame();
    setIsPauseMenuVisible(false);
  };

  const handleQuit = () => {
    hapticPatterns.buttonPress();
    setIsPauseMenuVisible(false);
    resetGame();
    navigation.goBack();
  };

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.mathRush} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={handleBackToMenu} style={styles.backButton}>
            <GlassView style={styles.iconButtonGlass} intensity={20} tint="light">
              <ArrowLeft size={24} color="#fff" />
            </GlassView>
          </Pressable>
          <View style={styles.titleContainer}>
            <Calculator size={24} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.title}>Math Rush</Text>
          </View>
          <View style={{ width: 40 }}>
            {gameStatus === 'playing' && (
              <Pressable onPress={handlePause} style={styles.backButton}>
                <GlassView style={styles.iconButtonGlass} intensity={20} tint="light">
                  <Pause size={24} color="#fff" />
                </GlassView>
              </Pressable>
            )}
          </View>
        </View>

        {/* Difficulty Selection Modal */}
        <Modal visible={showDifficultyModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <GlassView style={styles.modalContent} intensity={30} tint="light">
              <View style={styles.iconContainer}>
                <Calculator size={48} color="#fff" />
              </View>
              <Text style={styles.modalTitle}>Math Rush</Text>
              <Text style={styles.modalDescription}>Solve as many math problems as you can before time runs out!</Text>

              <Pressable style={[styles.difficultyButton, selectedDifficulty === 'easy' && styles.difficultyButtonSelected]} onPress={() => { setSelectedDifficulty('easy'); hapticPatterns.buttonPress(); }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Zap size={20} color={selectedDifficulty === 'easy' ? theme.colors.primary : '#fff'} style={{ marginRight: 8 }} />
                  <Text style={[styles.difficultyButtonText, selectedDifficulty === 'easy' && { color: theme.colors.primary }]}>Easy</Text>
                </View>
                <Text style={[styles.difficultySubText, selectedDifficulty === 'easy' && { color: theme.colors.primary }]}>Add/Sub · 60s</Text>
              </Pressable>

              <Pressable style={[styles.difficultyButton, selectedDifficulty === 'medium' && styles.difficultyButtonSelected]} onPress={() => { setSelectedDifficulty('medium'); hapticPatterns.buttonPress(); }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Target size={20} color={selectedDifficulty === 'medium' ? theme.colors.primary : '#fff'} style={{ marginRight: 8 }} />
                  <Text style={[styles.difficultyButtonText, selectedDifficulty === 'medium' && { color: theme.colors.primary }]}>Medium</Text>
                </View>
                <Text style={[styles.difficultySubText, selectedDifficulty === 'medium' && { color: theme.colors.primary }]}>+ Mul · 45s</Text>
              </Pressable>

              <Pressable style={[styles.difficultyButton, selectedDifficulty === 'hard' && styles.difficultyButtonSelected]} onPress={() => { setSelectedDifficulty('hard'); hapticPatterns.buttonPress(); }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Flame size={20} color={selectedDifficulty === 'hard' ? theme.colors.primary : '#fff'} style={{ marginRight: 8 }} />
                  <Text style={[styles.difficultyButtonText, selectedDifficulty === 'hard' && { color: theme.colors.primary }]}>Hard</Text>
                </View>
                <Text style={[styles.difficultySubText, selectedDifficulty === 'hard' && { color: theme.colors.primary }]}>+ Div · 30s</Text>
              </Pressable>

              <Pressable style={styles.startButton} onPress={handleStart}>
                <Play size={20} color={theme.colors.success} style={{ marginRight: 8 }} />
                <Text style={styles.startButtonText}>Start Game</Text>
              </Pressable>
            </GlassView>
          </View>
        </Modal>

        {gameStatus === 'playing' && currentProblem && (
          <>
            <GlassView style={styles.stats} intensity={20} tint="light">
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>SCORE</Text>
                <Animated.Text style={[styles.statValue, scoreAnimatedStyle]}>{score}</Animated.Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>TIME</Text>
                <Animated.Text style={[styles.statValue, timeRemaining <= 5 && styles.timeWarning, timeAnimatedStyle]}>
                  {timeRemaining}s
                </Animated.Text>
              </View>
            </GlassView>

            <View style={styles.gameArea}>
              <Animated.View
                key={currentProblem.id}
                entering={FadeInDown.springify().damping(12)}
                exiting={FadeOutUp.duration(200)}
                style={[styles.problemCardWrapper, questionAnimatedStyle]}
              >
                <GlassView style={styles.problemCard} intensity={30} tint="light">
                  <Text style={styles.problemText}>{currentProblem.text}</Text>
                </GlassView>
              </Animated.View>

              <View style={styles.optionsContainer}>
                {currentProblem.options.map((option, index) => (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.optionButton,
                      pressed && { transform: [{ scale: 0.95 }] }
                    ]}
                    onPress={() => handleAnswer(option)}
                  >
                    <GlassView style={styles.optionButtonGlass} intensity={20} tint="light">
                      <Text style={styles.optionText}>{option}</Text>
                    </GlassView>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}

        <Modal visible={gameStatus === 'finished'} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <GlassView style={styles.modalContent} intensity={30} tint="light">
              <View style={styles.iconContainer}>
                <Timer size={48} color="#fff" />
              </View>
              <Text style={styles.modalTitle}>Time's Up!</Text>

              <View style={styles.resultStats}>
                <Text style={styles.resultLabel}>Final Score</Text>
                <Text style={styles.resultScore}>{score}</Text>
                {isNewRecord && (
                  <View style={styles.newRecordBadge}>
                    <Trophy size={14} color="#f59e0b" style={{ marginRight: 4 }} />
                    <Text style={styles.newRecordText}>New Record!</Text>
                  </View>
                )}
              </View>

              <View style={styles.modalButtons}>
                <Pressable style={styles.menuButton} onPress={handleBackToMenu}>
                  <Text style={styles.menuButtonText}>Menu</Text>
                </Pressable>
                <Pressable style={styles.retryButton} onPress={handleRestart}>
                  <RotateCcw size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.retryButtonText}>Retry</Text>
                </Pressable>
              </View>
            </GlassView>
          </View>
        </Modal>

        <AchievementUnlockModal
          visible={showAchievementModal}
          achievements={unlockedAchievements}
          onClose={() => setShowAchievementModal(false)}
        />

        <PauseMenu
          visible={isPauseMenuVisible}
          gameStats={[
            { label: '현재 점수', value: `${score}점` },
            { label: '남은 시간', value: `${timeRemaining}초` },
            { label: '남은 기회', value: `${lives}회` },
            { label: '난이도', value: difficulty === 'easy' ? '쉬움' : difficulty === 'medium' ? '보통' : '어려움' },
          ]}
          onResume={handleResume}
          onRestart={() => {
            setIsPauseMenuVisible(false);
            handleRestart();
          }}
          onQuit={handleQuit}
        />
      </SafeAreaView>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, paddingTop: Platform.OS === 'web' ? 40 : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  backButton: { borderRadius: 12, overflow: 'hidden' },
  iconButtonGlass: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)' },
  titleContainer: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { borderRadius: 32, padding: 32, width: '100%', maxWidth: 400, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 4, borderColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 36, fontWeight: '900', color: '#fff', marginBottom: 8, letterSpacing: -1 },
  modalDescription: { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 32, lineHeight: 24 },

  difficultyButton: { width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 20, marginBottom: 12, alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  difficultyButtonSelected: { backgroundColor: '#fff', borderColor: '#fff' },
  difficultyButtonText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  difficultySubText: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },

  startButton: { flexDirection: 'row', justifyContent: 'center', width: '100%', backgroundColor: '#fff', paddingVertical: 18, borderRadius: 20, marginTop: 12, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  startButtonText: { fontSize: 20, fontWeight: '900', color: theme.colors.success },

  // Game Styles
  stats: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, marginHorizontal: 16, borderRadius: 24, marginBottom: 24, backgroundColor: 'rgba(15, 23, 42, 0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statItem: { alignItems: 'flex-start' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  statValue: { fontSize: 32, fontWeight: '900', color: '#fff' },
  timeWarning: { color: '#ef4444' },

  gameArea: { flex: 1, alignItems: 'center', paddingHorizontal: 16, width: '100%' },
  problemCardWrapper: { width: '100%', marginBottom: 32 },
  problemCard: { width: '100%', height: 200, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  problemText: { fontSize: 48, fontWeight: '900', letterSpacing: 2, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 10, color: '#fff' },

  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, width: '100%', justifyContent: 'center' },
  optionButton: { width: '47%', aspectRatio: 1.5, borderRadius: 24, overflow: 'hidden', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  optionButtonGlass: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  optionText: { fontSize: 32, fontWeight: '900', color: '#fff' },

  // Result Modal
  resultStats: { alignItems: 'center', marginBottom: 32 },
  resultLabel: { fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  resultScore: { fontSize: 64, fontWeight: '900', color: '#34d399', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 10 },
  newRecordBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginTop: 8 },
  newRecordText: { color: '#f59e0b', fontWeight: '700', fontSize: 12 },

  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  menuButton: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: 'rgba(30, 41, 59, 0.8)', alignItems: 'center' },
  menuButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  retryButton: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: '#10b981', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', shadowColor: "#10b981", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  retryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default MathRushGame;