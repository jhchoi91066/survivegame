import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Modal, Platform } from 'react-native';
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
  Target
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from '../components/shared/GlassView';
import { RootStackParamList } from '../../App';
import { useStroopStore } from '../game/stroop/store';
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
  const { theme } = useTheme();
  const { user } = useAuth();
  const { isMultiplayer, opponentScore, updateMyScore, finishGame } = useMultiplayer();
  const {
    currentProblem, score, timeRemaining, gameStatus, lives, answerProblem, decrementTime, startGame, resetGame,
  } = useStroopStore();

  const { updateBestRecord } = useGameStore();
  const [isNewRecord, setIsNewRecord] = useState(false);
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

    const playTime = 30 - timeRemaining;
    console.log('🎨 Stroop Test - Saving stats:', { score, playTime });
    await updateStroopRecord(score, playTime);
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
        });
      }
    }

    const newAchievements = await updateStatsOnGamePlayed('stroop', score, playTime, 'normal');
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
    startGame();
  };

  const handleRestart = () => {
    setIsNewRecord(false);
    hapticPatterns.buttonPress();
    resetGame();
    startGame();
  };

  const handleBackToMenu = () => {
    hapticPatterns.buttonPress();
    navigation.goBack();
  };

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.background} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={handleBackToMenu} style={styles.backButton}>
            <GlassView style={styles.iconButtonGlass} intensity={20}>
              <ArrowLeft size={24} color={theme.colors.textSecondary} />
            </GlassView>
          </Pressable>
          <View style={styles.titleContainer}>
            <Palette size={24} color={theme.colors.text} style={{ marginRight: 8 }} />
            <Text style={styles.title}>Stroop Test</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {gameStatus === 'ready' && (
          <View style={styles.startContainer}>
            <GlassView style={styles.startGlass} intensity={30}>
              <Palette size={80} color={theme.colors.primary} style={{ marginBottom: 24 }} />
              <Text style={styles.startTitle}>Stroop Test</Text>
              <Text style={styles.startDescription}>글자의 의미가 아닌, 글자의 색깔을 맞추세요!{`\n`}3번 틀리면 게임이 종료됩니다.</Text>
              <Pressable style={styles.startButton} onPress={handleStart}>
                <Play size={24} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.startButtonText}>시작하기</Text>
              </Pressable>
            </GlassView>
          </View>
        )}

        {gameStatus === 'playing' && currentProblem && (
          <>
            <GlassView style={styles.stats} intensity={20}>
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
              <GlassView style={styles.questionContainer} intensity={30}>
                <Text style={[styles.question, { color: currentProblem.color }]}>{currentProblem.text}</Text>
              </GlassView>
            </View>
            <View style={styles.optionsContainer}>
              {currentProblem.options.map((option) => (
                <Pressable key={option} style={styles.optionButton} onPress={() => handleAnswer(option)}>
                  <GlassView style={styles.optionGlass} intensity={20} tint="light">
                    <Text style={styles.optionText}>{option}</Text>
                  </GlassView>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Modal visible={gameStatus === 'finished'} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <GlassView style={styles.modalContent} intensity={30} tint="dark">
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
              <Pressable style={styles.menuButton} onPress={handleBackToMenu}>
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
  startButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.success, paddingVertical: 16, paddingHorizontal: 48, borderRadius: 16 },
  startButtonText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
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
