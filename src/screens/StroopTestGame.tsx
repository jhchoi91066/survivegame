import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Modal, Platform, Dimensions } from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Palette,
  Play,
  RotateCcw,
  Menu,
  Heart,
  Timer,
  Award,
  Trophy,
  Target,
  Pause,
  Zap,
  Flame
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from '../components/shared/GlassView';
import { PauseMenu } from '../components/shared/PauseMenu';
import { RootStackParamList } from '../../App';
import { useStroopStore } from '../game/stroop/store';
import { Difficulty } from '../game/stroop/types';
import { hapticPatterns } from '../utils/haptics';
import { soundManager } from '../utils/soundManager';
import { useGameStore } from '../game/shared/store';
// [C5] statsManager 제거 - Zustand persist로 대체
import { incrementGameCount } from '../utils/reviewManager';
import { useTheme } from '../contexts/ThemeContext';
import { updateStatsOnGamePlayed } from '../utils/achievementManager';
import { Achievement } from '../data/achievements';
import AchievementUnlockModal from '../components/shared/AchievementUnlockModal';
import { uploadGameStats } from '../utils/cloudSync';
import { useAuth } from '../contexts/AuthContext';
import { MultiplayerProvider, useMultiplayer } from '../contexts/MultiplayerContext';
import Toast from 'react-native-toast-message'; // [H7] Network error handling
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, withSpring } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow'; // [H3] Prevent unnecessary re-renders

type StroopGameNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StroopTestGame'>;

const { width } = Dimensions.get('window');

// Wrapper component for multiplayer support
const StroopTestGame: React.FC = () => {
  const route = useRoute<any>();
  const multiplayerRoomId = route.params?.multiplayerRoomId;

  return (
    <MultiplayerProvider roomId={multiplayerRoomId}>
      <StroopTestGameContent />
    </MultiplayerProvider>
  );
};

const StroopTestGameContent: React.FC = () => {
  const navigation = useNavigation<StroopGameNavigationProp>();
  const { theme, themeMode } = useTheme();
  const { user } = useAuth();
  const { isMultiplayer, opponentScore, updateMyScore, finishGame } = useMultiplayer();

  // [H3] Use shallow comparison to prevent unnecessary re-renders
  const {
    currentProblem, score, timeRemaining, gameStatus, lives, difficulty, answerProblem, updateTimeRemaining, startGame, resetGame, pauseGame, resumeGame
  } = useStroopStore(
    useShallow(state => ({
      currentProblem: state.currentProblem,
      score: state.score,
      timeRemaining: state.timeRemaining,
      gameStatus: state.gameStatus,
      lives: state.lives,
      difficulty: state.difficulty,
      answerProblem: state.answerProblem,
      updateTimeRemaining: state.updateTimeRemaining,
      startGame: state.startGame,
      resetGame: state.resetGame,
      pauseGame: state.pauseGame,
      resumeGame: state.resumeGame,
    }))
  );

  const { updateBestRecord, incrementTotalPlays, addPlayTime } = useGameStore();
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

  const timeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timeScale.value }],
  }));

  const scoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // 화면이 포커스될 때마다 게임 상태 리셋
  useFocusEffect(
    useCallback(() => {
      resetGame();
      setShowDifficultyModal(true);
      setIsNewRecord(false);
    }, [resetGame])
  );

  // [H1][H2] Accurate timer with pause support
  useEffect(() => {
    if (gameStatus === 'playing') {
      const interval = setInterval(() => {
        // Re-check current state to prevent timer ticking during pause transition
        const currentState = useStroopStore.getState();
        if (currentState.gameStatus === 'playing') {
          updateTimeRemaining(); // [H2] Use Date.now() based timer
        }
      }, 100); // [H2] Check every 100ms for accuracy
      return () => clearInterval(interval);
    }
  }, [gameStatus, updateTimeRemaining]);

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

    // [C5] Zustand에서 이전 기록 확인
    const currentBest = useGameStore.getState().globalStats.gamesStats.stroop.bestRecord;
    if (!isMounted.current) return;

    if (!currentBest || score > (currentBest as number)) {
      setIsNewRecord(true);
    }

    const playTime = (difficulty === 'easy' ? 60 : difficulty === 'medium' ? 45 : 30) - timeRemaining;
    console.log('🎨 Stroop Test - Saving stats:', { score, playTime, difficulty });

    // [C5] Zustand에 업데이트 (persist가 자동 저장)
    updateBestRecord('stroop', score);
    incrementTotalPlays('stroop');
    addPlayTime('stroop', Math.floor(playTime));
    await incrementGameCount();

    // [H7] 클라우드 동기화 with error handling (로그인 상태일 때만)
    if (user) {
      try {
        const stats = useGameStore.getState().globalStats.gamesStats.stroop;
        await uploadGameStats('stroop', {
          highScore: stats.bestRecord as number,
          totalPlays: stats.totalPlays,
          totalPlayTime: stats.totalPlayTime,
          difficulty: difficulty,
        });
      } catch (error) {
        console.error('Failed to upload game stats:', error);
        Toast.show({
          type: 'error',
          text1: '저장 실패',
          text2: '게임 기록을 클라우드에 저장하지 못했습니다.',
          visibilityTime: 3000,
        });
        // 로컬에는 이미 저장됨 (Zustand persist)
      }
    }

    const newAchievements = await updateStatsOnGamePlayed('stroop', score, playTime, difficulty);
    if (!isMounted.current) return;

    if (newAchievements.length > 0) {
      setUnlockedAchievements(newAchievements);
      setShowAchievementModal(true);
      soundManager.playSound('achievement');
    }
  };

  const handleAnswer = (answer: string) => {
    if (gameStatus !== 'playing') return;
    const isCorrect = answer === currentProblem?.correctAnswer;
    if (isCorrect) {
      hapticPatterns.correctAnswer();
      soundManager.playSound('correct_answer');
    } else {
      hapticPatterns.wrongAnswer();
      soundManager.playSound('wrong_answer');
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

  // Helper to get color value for buttons
  const getColorValue = (colorName: string) => {
    const colorMap: Record<string, string> = {
      '빨강': '#ef4444', '파랑': '#3b82f6', '초록': '#10b981', '노랑': '#f59e0b',
      '보라': '#8b5cf6', '주황': '#f97316', '분홍': '#ec4899', '하늘': '#06b6d4'
    };
    return colorMap[colorName] || '#94a3b8';
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.stroop} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={handleBackToMenu} style={styles.backButton}>
            <GlassView style={styles.iconButtonGlass} intensity={20} tint="light">
              <ArrowLeft size={24} color="#fff" />
            </GlassView>
          </Pressable>
          <View style={styles.titleContainer}>
            <Palette size={24} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.title}>Stroop Test</Text>
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
                <Palette size={48} color="#fff" />
              </View>
              <Text style={styles.modalTitle}>Stroop Test</Text>
              <Text style={styles.modalDescription}>글자의 의미가 아닌, 글자의 색깔을 맞추세요!</Text>

              <Pressable style={[styles.difficultyButton, selectedDifficulty === 'easy' && styles.difficultyButtonSelected]} onPress={() => { setSelectedDifficulty('easy'); hapticPatterns.buttonPress(); }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Zap size={20} color={selectedDifficulty === 'easy' ? theme.colors.primary : '#fff'} style={{ marginRight: 8 }} />
                  <Text style={[styles.difficultyButtonText, selectedDifficulty === 'easy' && { color: theme.colors.primary }]}>쉬움</Text>
                </View>
                <Text style={[styles.difficultySubText, selectedDifficulty === 'easy' && { color: theme.colors.primary }]}>4색 · 60초</Text>
              </Pressable>

              <Pressable style={[styles.difficultyButton, selectedDifficulty === 'medium' && styles.difficultyButtonSelected]} onPress={() => { setSelectedDifficulty('medium'); hapticPatterns.buttonPress(); }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Target size={20} color={selectedDifficulty === 'medium' ? theme.colors.primary : '#fff'} style={{ marginRight: 8 }} />
                  <Text style={[styles.difficultyButtonText, selectedDifficulty === 'medium' && { color: theme.colors.primary }]}>보통</Text>
                </View>
                <Text style={[styles.difficultySubText, selectedDifficulty === 'medium' && { color: theme.colors.primary }]}>6색 · 45초</Text>
              </Pressable>

              <Pressable style={[styles.difficultyButton, selectedDifficulty === 'hard' && styles.difficultyButtonSelected]} onPress={() => { setSelectedDifficulty('hard'); hapticPatterns.buttonPress(); }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Flame size={20} color={selectedDifficulty === 'hard' ? theme.colors.primary : '#fff'} style={{ marginRight: 8 }} />
                  <Text style={[styles.difficultyButtonText, selectedDifficulty === 'hard' && { color: theme.colors.primary }]}>어려움</Text>
                </View>
                <Text style={[styles.difficultySubText, selectedDifficulty === 'hard' && { color: theme.colors.primary }]}>8색 · 30초</Text>
              </Pressable>

              <Pressable style={styles.startButton} onPress={handleStart}>
                <Play size={20} color={theme.colors.success} style={{ marginRight: 8 }} />
                <Text style={styles.startButtonText}>게임 시작</Text>
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
              <GlassView style={styles.challengeCard} intensity={30} tint="light">
                <Text style={[styles.challengeText, { color: currentProblem.color }]}>
                  {currentProblem.text}
                </Text>
              </GlassView>

              <View style={styles.optionsGrid}>
                {currentProblem.options.map((option) => (
                  <Pressable
                    key={option}
                    style={({ pressed }) => [
                      styles.optionButton,
                      { backgroundColor: '#1e293b', borderColor: '#334155' },
                      pressed && { transform: [{ scale: 0.95 }] }
                    ]}
                    onPress={() => handleAnswer(option)}
                  >
                    <View style={[styles.colorDot, { backgroundColor: getColorValue(option) }]} />
                    <Text style={styles.optionText}>{option}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.instructionText}>위 글자의 <Text style={{ fontWeight: 'bold', color: '#fff' }}>색깔</Text>을 선택하세요</Text>
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

  gameArea: { flex: 1, alignItems: 'center', paddingHorizontal: 16 },
  challengeCard: { width: '100%', height: 240, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 32, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  challengeText: { fontSize: 72, fontWeight: '900', letterSpacing: 2, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 10 },

  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, width: '100%' },
  optionButton: { width: '48%', height: 80, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  optionText: { fontSize: 20, fontWeight: '700', color: '#fff' },

  instructionText: { marginTop: 32, color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },

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

export default StroopTestGame;
