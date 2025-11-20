import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Modal, Platform } from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  Easing
} from 'react-native-reanimated';
import {
  ArrowLeft,
  Pause,
  Play,
  Calculator,
  Heart,
  Flame,
  Trophy,
  Target,
  RotateCcw,
  Menu,
  Timer,
  Award
} from 'lucide-react-native';
import { RootStackParamList } from '../../App';
import { useMathRushStore } from '../game/mathrush/store';
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
import { PauseMenu } from '../components/shared/PauseMenu';
import { FeedbackOverlay } from '../components/shared/FeedbackOverlay';
import { MultiplayerProvider, useMultiplayer } from '../contexts/MultiplayerContext';

type MathRushGameNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MathRushGame'>;

// Wrapper component that provides multiplayer context
const MathRushGame: React.FC = () => {
  const route = useRoute<any>();
  const multiplayerRoomId = route.params?.multiplayerRoomId;

  return (
    <MultiplayerProvider roomId={multiplayerRoomId}>
      <MathRushGameContent />
    </MultiplayerProvider>
  );
};

// Main game component with multiplayer support
const MathRushGameContent: React.FC = () => {
  const navigation = useNavigation<MathRushGameNavigationProp>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { isMultiplayer, opponentScore, updateMyScore, finishGame } = useMultiplayer();
  const {
    currentQuestion, score, combo, highestCombo, timeRemaining, gameStatus, lives, answerQuestion, decrementTime, startGame, resetGame,
  } = useMathRushStore();

  const { updateBestRecord } = useGameStore();
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'correct' | 'wrong' | null>(null);
  const isMounted = React.useRef(true);

  // Animation Shared Values
  const timerScale = useSharedValue(1);
  const scoreScale = useSharedValue(1);
  const questionShake = useSharedValue(0);

  const timerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timerScale.value }],
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

  // 화면이 포커스될 때마다 게임 상태 리셋
  useFocusEffect(
    useCallback(() => {
      resetGame();
      setIsNewRecord(false);
    }, [resetGame])
  );

  useEffect(() => {
    if (gameStatus === 'playing' && !isPaused) {
      const interval = setInterval(() => { decrementTime(); }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameStatus, isPaused]);

  useEffect(() => {
    if (gameStatus === 'finished') {
      handleGameFinish();
    }
  }, [gameStatus]);

  // Update multiplayer score when score changes
  useEffect(() => {
    if (isMultiplayer && gameStatus === 'playing' && score > 0) {
      updateMyScore(score);
    }
  }, [isMultiplayer, score, gameStatus]);

  // 시간 경고 사운드 (5초 남았을 때) & Animation
  useEffect(() => {
    if (gameStatus === 'playing' && timeRemaining <= 5 && timeRemaining > 0) {
      if (timeRemaining === 5) soundManager.playSound('time_warning');
      timerScale.value = withSequence(
        withTiming(1.2, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
    }
  }, [timeRemaining, gameStatus]);

  // Score pulse animation
  useEffect(() => {
    if (score > 0) {
      scoreScale.value = withSequence(
        withSpring(1.2, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 150 })
      );
    }
  }, [score]);

  // Question shake on wrong answer
  useEffect(() => {
    if (feedbackType === 'wrong') {
      questionShake.value = withSequence(
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [feedbackType]);

  const handleGameFinish = async () => {
    hapticPatterns.gameOver();
    soundManager.playSound(score > 0 ? 'game_win' : 'game_lose');

    const oldRecord = await loadGameRecord('math_rush');
    if (!isMounted.current) return;

    if (!oldRecord || !oldRecord.highScore || score > oldRecord.highScore) {
      setIsNewRecord(true);
    }

    const playTime = 30 - timeRemaining;
    await updateMathRushRecord(score, highestCombo, playTime);
    updateBestRecord('math_rush', score);
    await incrementGameCount();

    // 클라우드 동기화 (로그인 상태일 때만)
    if (user) {
      const record = await loadGameRecord('math_rush');
      if (record) {
        await uploadGameStats('math_rush', {
          highScore: record.highScore,
          highestCombo: record.highestCombo,
          totalPlays: record.totalPlays,
          totalPlayTime: record.totalPlayTime,
        });
      }
    }

    const newAchievements = await updateStatsOnGamePlayed('math_rush', score, playTime, 'normal');
    if (!isMounted.current) return;

    if (newAchievements.length > 0) {
      setUnlockedAchievements(newAchievements);
      setShowAchievementModal(true);
      soundManager.playSound('achievement');
    }

    // Finish multiplayer game
    if (isMultiplayer) {
      await finishGame();
    }
  };

  const handleAnswer = (answer: number) => {
    if (!currentQuestion || gameStatus !== 'playing' || isPaused) return;
    const isCorrect = answer === currentQuestion.correctAnswer;

    // 피드백 표시
    setFeedbackType(isCorrect ? 'correct' : 'wrong');
    setTimeout(() => setFeedbackType(null), 1100);

    if (isCorrect) {
      hapticPatterns.correctAnswer();
      soundManager.playSound('correct_answer');
      if (combo > 0 && combo % 5 === 0) {
        soundManager.playSound('combo'); // 5콤보마다 추가 사운드
      }
    } else {
      hapticPatterns.wrongAnswer();
      soundManager.playSound('wrong_answer');
    }
    answerQuestion(answer);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    hapticPatterns.buttonPress();
    soundManager.playSound('button_press');
  };

  const handleStart = () => {
    setIsNewRecord(false);
    hapticPatterns.buttonPress();
    soundManager.playSound('game_start');
    startGame();
  };

  const handleRestart = () => {
    setIsNewRecord(false);
    hapticPatterns.buttonPress();
    soundManager.playSound('button_press');
    resetGame();
    startGame();
  };

  const handleBackToMenu = () => {
    hapticPatterns.buttonPress();
    soundManager.playSound('button_press');
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
            <ArrowLeft size={24} color={theme.colors.textSecondary} />
          </Pressable>
          <View style={styles.titleContainer}>
            <Calculator size={24} color={theme.colors.text} style={{ marginRight: 8 }} />
            <Text style={styles.title}>Math Rush</Text>
          </View>
          <Pressable
            onPress={togglePause}
            style={styles.pauseButton}
            disabled={gameStatus !== 'playing'}
          >
            {isPaused ? (
              <Play size={24} color={theme.colors.text} />
            ) : (
              <Pause size={24} color={theme.colors.text} />
            )}
          </Pressable>
        </View>

        {gameStatus === 'ready' && (
          <View style={styles.startContainer}>
            <Calculator size={80} color={theme.colors.primary} style={{ marginBottom: 24 }} />
            <Text style={styles.startTitle}>Math Rush</Text>
            <Text style={styles.startDescription}>30초 안에 최대한 많은 문제를 푸세요!{`\n`}3번 틀리면 게임이 종료됩니다.</Text>
            <Pressable style={styles.startButton} onPress={handleStart}>
              <Play size={24} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.startButtonText}>시작하기</Text>
            </Pressable>
          </View>
        )}

        {gameStatus === 'playing' && currentQuestion && (
          <>
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Award size={20} color={theme.colors.textSecondary} style={{ marginBottom: 4 }} />
                <Animated.Text style={[styles.statValue, scoreAnimatedStyle]}>{score}</Animated.Text>
              </View>
              <View style={styles.statItem}>
                <Timer size={20} color={theme.colors.textSecondary} style={{ marginBottom: 4 }} />
                <Animated.Text style={[styles.statValue, { color: getTimerColor() }, timerAnimatedStyle]}>{timeRemaining}</Animated.Text>
              </View>
              <View style={styles.statItem}>
                <Heart size={20} color={theme.colors.error} style={{ marginBottom: 4 }} />
                <Text style={styles.statValue}>{lives}</Text>
              </View>
              {isMultiplayer && (
                <View
                  style={styles.statItem}
                  accessible={true}
                  accessibilityRole="text"
                  accessibilityLabel={`상대방 점수: ${opponentScore}점`}
                >
                  <Trophy size={20} color={theme.colors.warning} style={{ marginBottom: 4 }} />
                  <Text style={styles.statValue}>{opponentScore}</Text>
                </View>
              )}
            </View>
            {combo >= 5 && (
              <View style={styles.comboContainer}>
                <Flame size={24} color={theme.colors.warning} style={{ marginRight: 8 }} />
                <Text style={styles.comboText}>{combo} COMBO!</Text>
              </View>
            )}
            <Animated.View style={[styles.questionContainer, questionAnimatedStyle]}>
              <Text style={styles.question}>{currentQuestion.num1} {currentQuestion.operation} {currentQuestion.num2} = ?</Text>
            </Animated.View>
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, index) => (
                <Pressable key={index} style={styles.optionButton} onPress={() => handleAnswer(option)}><Text style={styles.optionText}>{option}</Text></Pressable>
              ))}
            </View>
          </>
        )}

        <Modal visible={gameStatus === 'finished'} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Target size={64} color={theme.colors.primary} style={{ marginBottom: 16 }} />
              <Text style={styles.modalTitle}>게임 종료!</Text>
              {isNewRecord && (
                <View style={styles.newRecordContainer}>
                  <Trophy size={24} color={theme.colors.warning} style={{ marginRight: 8 }} />
                  <Text style={styles.newRecord}>신기록 달성!</Text>
                </View>
              )}
              <Text style={styles.finalScore}>최종 점수: {score}</Text>
              <Text style={styles.finalCombo}>최고 콤보: {highestCombo}</Text>
              <Pressable style={styles.nextButton} onPress={handleRestart}>
                <RotateCcw size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.nextButtonText}>다시 하기</Text>
              </Pressable>
              <Pressable style={styles.menuButton} onPress={handleBackToMenu}>
                <Menu size={20} color={theme.colors.text} style={{ marginRight: 8 }} />
                <Text style={styles.menuButtonText}>메뉴로</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <AchievementUnlockModal
          visible={showAchievementModal}
          achievements={unlockedAchievements}
          onClose={() => setShowAchievementModal(false)}
        />

        <PauseMenu
          visible={isPaused && gameStatus === 'playing'}
          gameStats={[
            { label: '점수', value: score },
            { label: '시간', value: `${timeRemaining}초` },
            { label: '콤보', value: combo },
          ]}
          onResume={togglePause}
          onRestart={() => {
            setIsPaused(false);
            handleRestart();
          }}
          onQuit={handleBackToMenu}
        />

        <FeedbackOverlay
          type={feedbackType}
          onComplete={() => setFeedbackType(null)}
        />
      </SafeAreaView>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, paddingTop: Platform.OS === 'web' ? 40 : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  backButton: { padding: 8 },
  backButtonText: { color: theme.colors.textSecondary, fontSize: 16 },
  titleContainer: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text },
  pauseButton: { padding: 8 },
  pauseButtonText: { fontSize: 20, color: theme.colors.text },
  startContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  startEmoji: { fontSize: 80, marginBottom: 24 },
  startTitle: { fontSize: 36, fontWeight: 'bold', color: theme.colors.text, marginBottom: 16 },
  startDescription: { fontSize: 16, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  startButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.success, paddingVertical: 16, paddingHorizontal: 48, borderRadius: 12 },
  startButtonText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  stats: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, backgroundColor: theme.colors.surface, marginHorizontal: 16, borderRadius: 12, marginBottom: 16 },
  statItem: { alignItems: 'center', minWidth: 60 },
  statLabel: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text },
  comboContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  comboText: { fontSize: 24, fontWeight: 'bold', color: theme.colors.warning },
  questionContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, backgroundColor: theme.colors.surface, borderRadius: 16, marginBottom: 24 },
  question: { fontSize: 48, fontWeight: 'bold', color: theme.colors.text },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 16, gap: 12, paddingBottom: 16 },
  optionButton: { width: '45%', backgroundColor: theme.colors.primary, paddingVertical: 24, borderRadius: 12, alignItems: 'center' },
  optionText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 32, width: '80%', maxWidth: 400, alignItems: 'center' },
  modalTitle: { fontSize: 28, fontWeight: 'bold', color: theme.colors.text, marginBottom: 16 },
  victoryEmoji: { fontSize: 64, marginBottom: 16 },
  finalScore: { fontSize: 20, color: theme.colors.success, marginBottom: 8, fontWeight: 'bold' },
  finalCombo: { fontSize: 16, color: theme.colors.textSecondary, marginBottom: 24 },
  newRecordContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  newRecord: { fontSize: 20, fontWeight: 'bold', color: theme.colors.primary },
  nextButton: { flexDirection: 'row', justifyContent: 'center', width: '100%', backgroundColor: theme.colors.success, paddingVertical: 16, borderRadius: 12, marginBottom: 8, alignItems: 'center' },
  nextButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  menuButton: { flexDirection: 'row', justifyContent: 'center', width: '100%', backgroundColor: theme.colors.surfaceSecondary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  menuButtonText: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
});

export default MathRushGame;