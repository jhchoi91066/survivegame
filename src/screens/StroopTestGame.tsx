import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Modal, Platform } from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  // Fix duplicate import
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
import { updateStroopRecord, loadGameRecord } from '../utils/statsManager';
import { incrementGameCount } from '../utils/reviewManager';
import { useTheme } from '../contexts/ThemeContext';
import { updateStatsOnGamePlayed } from '../utils/achievementManager';
import { Achievement } from '../data/achievements';
import AchievementUnlockModal from '../components/shared/AchievementUnlockModal';
import { uploadGameStats } from '../utils/cloudSync';
import { useAuth } from '../contexts/AuthContext';
import { MultiplayerProvider, useMultiplayer } from '../contexts/MultiplayerContext';

type StroopGameNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StroopTestGame'>;

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
  const {
    currentProblem, score, timeRemaining, gameStatus, lives, difficulty, answerProblem, decrementTime, startGame, resetGame, pauseGame, resumeGame
  } = useStroopStore();

  const { updateBestRecord } = useGameStore();
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [isPauseMenuVisible, setIsPauseMenuVisible] = useState(false);
  const [showDifficultyModal, setShowDifficultyModal] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const isMounted = React.useRef(true);

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

  useEffect(() => {
    if (gameStatus === 'playing') {
      const interval = setInterval(() => decrementTime(), 1000);
      return () => clearInterval(interval);
    }
  }, [gameStatus]);

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

    const oldRecord = await loadGameRecord('stroop');
    if (!isMounted.current) return;

    if (!oldRecord || !oldRecord.highScore || score > oldRecord.highScore) {
      setIsNewRecord(true);
    }

    const playTime = (difficulty === 'easy' ? 60 : difficulty === 'medium' ? 45 : 30) - timeRemaining;
    console.log('🎨 Stroop Test - Saving stats:', { score, playTime, difficulty });
    await updateStroopRecord(score, playTime, difficulty);
    updateBestRecord('stroop', score);
    await incrementGameCount();

    // 클라우드 동기화 (로그인 상태일 때만)
    if (user) {
      const record = await loadGameRecord('stroop');
      if (record) {
        await uploadGameStats('stroop', {
          highScore: record.highScore,
          totalPlays: record.totalPlays,
          totalPlayTime: record.totalPlayTime,
          difficulty: difficulty,
        });
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

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.background} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={handleBackToMenu} style={styles.backButton}>
            <GlassView style={styles.iconButtonGlass} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
              <ArrowLeft size={24} color={theme.colors.textSecondary} />
            </GlassView>
          </Pressable>
          <View style={styles.titleContainer}>
            <Palette size={24} color={theme.colors.text} style={{ marginRight: 8 }} />
            <Text style={styles.title}>Stroop Test</Text>
          </View>
          <View style={{ width: 40 }}>
            {gameStatus === 'playing' && (
              <Pressable onPress={handlePause} style={styles.backButton}>
                <GlassView style={styles.iconButtonGlass} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
                  <Pause size={24} color={theme.colors.textSecondary} />
                </GlassView>
              </Pressable>
            )}
          </View>
        </View>

        {/* Difficulty Selection Modal */}
        <Modal visible={showDifficultyModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <GlassView style={styles.modalContent} intensity={30} tint={themeMode === 'dark' ? 'dark' : 'light'}>
              <Palette size={48} color={theme.colors.primary} style={{ marginBottom: 16 }} />
              <Text style={styles.modalTitle}>난이도 선택</Text>
              <Text style={styles.modalDescription}>글자의 의미가 아닌, 글자의 색깔을 맞추세요!</Text>

              <Pressable style={[styles.difficultyButton, selectedDifficulty === 'easy' && styles.difficultyButtonSelected, { backgroundColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]} onPress={() => { setSelectedDifficulty('easy'); hapticPatterns.buttonPress(); }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Zap size={20} color={selectedDifficulty === 'easy' ? '#fff' : theme.colors.text} style={{ marginRight: 8 }} />
                  <Text style={[styles.difficultyButtonText, selectedDifficulty === 'easy' && { color: '#fff' }, selectedDifficulty !== 'easy' && { color: theme.colors.text }]}>쉬움</Text>
                </View>
                <Text style={[styles.difficultySubText, selectedDifficulty === 'easy' && { color: 'rgba(255,255,255,0.8)' }, selectedDifficulty !== 'easy' && { color: theme.colors.textSecondary }]}>4색 · 60초 · 목숨 3개</Text>
              </Pressable>

              <Pressable style={[styles.difficultyButton, selectedDifficulty === 'medium' && styles.difficultyButtonSelected, { backgroundColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]} onPress={() => { setSelectedDifficulty('medium'); hapticPatterns.buttonPress(); }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Target size={20} color={selectedDifficulty === 'medium' ? '#fff' : theme.colors.text} style={{ marginRight: 8 }} />
                  <Text style={[styles.difficultyButtonText, selectedDifficulty === 'medium' && { color: '#fff' }, selectedDifficulty !== 'medium' && { color: theme.colors.text }]}>보통</Text>
                </View>
                <Text style={[styles.difficultySubText, selectedDifficulty === 'medium' && { color: 'rgba(255,255,255,0.8)' }, selectedDifficulty !== 'medium' && { color: theme.colors.textSecondary }]}>6색 · 45초 · 목숨 3개</Text>
              </Pressable>

              <Pressable style={[styles.difficultyButton, selectedDifficulty === 'hard' && styles.difficultyButtonSelected, { backgroundColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]} onPress={() => { setSelectedDifficulty('hard'); hapticPatterns.buttonPress(); }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Flame size={20} color={selectedDifficulty === 'hard' ? '#fff' : theme.colors.text} style={{ marginRight: 8 }} />
                  <Text style={[styles.difficultyButtonText, selectedDifficulty === 'hard' && { color: '#fff' }, selectedDifficulty !== 'hard' && { color: theme.colors.text }]}>어려움</Text>
                </View>
                <Text style={[styles.difficultySubText, selectedDifficulty === 'hard' && { color: 'rgba(255,255,255,0.8)' }, selectedDifficulty !== 'hard' && { color: theme.colors.textSecondary }]}>8색 · 30초 · 목숨 3개</Text>
              </Pressable>

              <Pressable style={styles.startButton} onPress={handleStart}>
                <Play size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.startButtonText}>게임 시작</Text>
              </Pressable>
            </GlassView>
          </View>
        </Modal>

        {gameStatus === 'playing' && currentProblem && (
          <>
            <GlassView style={styles.stats} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
              <View style={styles.statItem}>
                <Award size={20} color={theme.colors.textSecondary} style={{ marginBottom: 4 }} />
                <Text style={styles.statValue}>{score}</Text>
              </View>
              <View style={styles.statItem}>
                <Timer size={20} color={theme.colors.textSecondary} style={{ marginBottom: 4 }} />
                <Text style={[styles.statValue, { color: timeRemaining <= 5 ? theme.colors.error : theme.colors.text }]}>{timeRemaining}</Text>
              </View>
              {isMultiplayer ? (
                <View style={styles.statItem} accessible={true} accessibilityRole="text" accessibilityLabel={`상대방 점수: ${opponentScore}점`}>
                  <Trophy size={20} color={theme.colors.warning} style={{ marginBottom: 4 }} />
                  <Text style={styles.statValue}>{opponentScore}</Text>
                </View>
              ) : (
                <View style={styles.statItem}>
                  <Heart size={20} color={theme.colors.error} style={{ marginBottom: 4 }} />
                  <Text style={styles.statValue}>{lives}</Text>
                </View>
              )}
            </GlassView>
            <View style={styles.questionContainerWrapper}>
              <GlassView style={styles.questionContainer} intensity={30} tint={themeMode === 'dark' ? 'dark' : 'light'}>
                <Text style={[styles.question, { color: currentProblem.color }]}>{currentProblem.text}</Text>
              </GlassView>
            </View>
            <View style={styles.optionsContainer}>
              {currentProblem.options.map((option) => (
                <Pressable key={option} style={styles.optionButton} onPress={() => handleAnswer(option)}>
                  <GlassView style={styles.optionGlass} intensity={20} tint={themeMode === 'dark' ? 'light' : 'dark'}>
                    <Text style={styles.optionText}>{option}</Text>
                  </GlassView>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Modal visible={gameStatus === 'finished'} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <GlassView style={styles.modalContent} intensity={30} tint={themeMode === 'dark' ? 'dark' : 'light'}>
              <Target size={64} color={theme.colors.primary} style={{ marginBottom: 16 }} />
              <Text style={styles.modalTitle}>게임 종료!</Text>
              {isNewRecord && (
                <View style={styles.newRecordContainer}>
                  <Trophy size={24} color={theme.colors.warning} style={{ marginRight: 8 }} />
                  <Text style={styles.newRecord}>신기록 달성!</Text>
                </View>
              )}
              <Text style={styles.finalScore}>최종 점수: {score}</Text>
              <Pressable style={styles.nextButton} onPress={handleRestart}>
                <RotateCcw size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.nextButtonText}>다시 하기</Text>
              </Pressable>
              <Pressable style={[styles.menuButton, { backgroundColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]} onPress={handleBackToMenu}>
                <Menu size={20} color={theme.colors.text} style={{ marginRight: 8 }} />
                <Text style={styles.menuButtonText}>메뉴로</Text>
              </Pressable>
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
  iconButtonGlass: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  backButtonText: { color: theme.colors.textSecondary, fontSize: 16 },
  titleContainer: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text },
  startContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  startGlass: { padding: 32, borderRadius: 24, alignItems: 'center', width: '100%', maxWidth: 400 },
  startEmoji: { fontSize: 80, marginBottom: 24 },
  startTitle: { fontSize: 36, fontWeight: 'bold', color: theme.colors.text, marginBottom: 16 },
  startDescription: { fontSize: 16, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  startButton: { flexDirection: 'row', justifyContent: 'center', width: '100%', backgroundColor: theme.colors.success, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16, marginTop: 12, alignItems: 'center' },
  startButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  stats: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, marginHorizontal: 16, borderRadius: 20, marginBottom: 16 },
  statItem: { alignItems: 'center', minWidth: 60 },
  statLabel: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text },
  questionContainerWrapper: { marginHorizontal: 16, marginBottom: 24 },
  questionContainer: { alignItems: 'center', justifyContent: 'center', padding: 32, borderRadius: 24 },
  question: { fontSize: 64, fontWeight: 'bold' },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 16, gap: 12, paddingBottom: 16 },
  optionButton: { width: '45%', borderRadius: 16, overflow: 'hidden' },
  optionGlass: { paddingVertical: 24, alignItems: 'center', backgroundColor: 'rgba(99, 102, 241, 0.3)' },
  optionText: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { borderRadius: 24, padding: 32, width: '85%', maxWidth: 400, alignItems: 'center' },
  modalTitle: { fontSize: 28, fontWeight: 'bold', color: theme.colors.text, marginBottom: 16 },
  modalDescription: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  difficultyButton: { width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16, marginBottom: 12, alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row' },
  difficultyButtonSelected: { backgroundColor: theme.colors.primary },
  difficultyButtonText: { fontSize: 18, fontWeight: '600', color: theme.colors.text },
  difficultySubText: { fontSize: 12, color: theme.colors.textSecondary },
  victoryEmoji: { fontSize: 64, marginBottom: 16 },
  finalScore: { fontSize: 24, color: theme.colors.success, marginBottom: 24, fontWeight: 'bold' },
  newRecordContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  newRecord: { fontSize: 20, fontWeight: 'bold', color: theme.colors.primary },
  nextButton: { flexDirection: 'row', justifyContent: 'center', width: '100%', backgroundColor: theme.colors.success, paddingVertical: 16, borderRadius: 16, marginBottom: 8, alignItems: 'center' },
  nextButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  menuButton: { flexDirection: 'row', justifyContent: 'center', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  menuButtonText: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
});

export default StroopTestGame;
