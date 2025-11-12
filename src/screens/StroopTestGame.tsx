import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Modal, Platform } from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={handleBackToMenu} style={styles.backButton}><Text style={styles.backButtonText}>← 메뉴</Text></Pressable>
          <Text style={styles.title}>🎨 Stroop Test</Text>
          <View style={{ width: 60 }} />
        </View>

        {gameStatus === 'ready' && (
          <View style={styles.startContainer}>
            <Text style={styles.startEmoji}>🎨</Text>
            <Text style={styles.startTitle}>Stroop Test</Text>
            <Text style={styles.startDescription}>글자의 의미가 아닌, 글자의 색깔을 맞추세요!{`\n`}3번 틀리면 게임이 종료됩니다.</Text>
            <Pressable style={styles.startButton} onPress={handleStart}><Text style={styles.startButtonText}>시작하기</Text></Pressable>
          </View>
        )}

        {gameStatus === 'playing' && currentProblem && (
          <>
            <View style={styles.stats}>
              <View style={styles.statItem}><Text style={styles.statLabel}>점수</Text><Text style={styles.statValue}>{score}</Text></View>
              <View style={styles.statItem}><Text style={styles.statLabel}>시간</Text><Text style={[styles.statValue, { color: timeRemaining <= 5 ? theme.colors.error : theme.colors.text }]}>{timeRemaining}</Text></View>
              {isMultiplayer ? (
                <View style={styles.statItem} accessible={true} accessibilityRole="text" accessibilityLabel={`상대방 점수: ${opponentScore}점`}>
                  <Text style={styles.statLabel}>상대 점수</Text>
                  <Text style={styles.statValue}>{opponentScore}</Text>
                </View>
              ) : (
                <View style={styles.statItem}><Text style={styles.statLabel}>생명</Text><Text style={styles.statValue}>{'❤️'.repeat(lives)}</Text></View>
              )}
            </View>
            <View style={styles.questionContainer}><Text style={[styles.question, { color: currentProblem.color }]}>{currentProblem.text}</Text></View>
            <View style={styles.optionsContainer}>
              {currentProblem.options.map((option) => (
                <Pressable key={option} style={styles.optionButton} onPress={() => handleAnswer(option)}><Text style={styles.optionText}>{option}</Text></Pressable>
              ))}
            </View>
          </>
        )}

        <Modal visible={gameStatus === 'finished'} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.victoryEmoji}>🎯</Text>
              <Text style={styles.modalTitle}>게임 종료!</Text>
              {isNewRecord && <Text style={styles.newRecord}>🏆 신기록 달성!</Text>}
              <Text style={styles.finalScore}>최종 점수: {score}</Text>
              <Pressable style={styles.nextButton} onPress={handleRestart}><Text style={styles.nextButtonText}>다시 하기</Text></Pressable>
              <Pressable style={styles.menuButton} onPress={handleBackToMenu}><Text style={styles.menuButtonText}>메뉴로</Text></Pressable>
            </View>
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

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, paddingTop: Platform.OS === 'web' ? 40 : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  backButton: { padding: 8 },
  backButtonText: { color: theme.colors.textSecondary, fontSize: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text },
  startContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  startEmoji: { fontSize: 80, marginBottom: 24 },
  startTitle: { fontSize: 36, fontWeight: 'bold', color: theme.colors.text, marginBottom: 16 },
  startDescription: { fontSize: 16, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  startButton: { backgroundColor: theme.colors.success, paddingVertical: 16, paddingHorizontal: 48, borderRadius: 12 },
  startButtonText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  stats: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, backgroundColor: theme.colors.surface, marginHorizontal: 16, borderRadius: 12, marginBottom: 16 },
  statItem: { alignItems: 'center', minWidth: 60 },
  statLabel: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text },
  questionContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, backgroundColor: theme.colors.surface, borderRadius: 16, marginBottom: 24 },
  question: { fontSize: 64, fontWeight: 'bold' },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 16, gap: 12, paddingBottom: 16 },
  optionButton: { width: '45%', backgroundColor: theme.colors.primary, paddingVertical: 24, borderRadius: 12, alignItems: 'center' },
  optionText: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 32, width: '80%', maxWidth: 400, alignItems: 'center' },
  modalTitle: { fontSize: 28, fontWeight: 'bold', color: theme.colors.text, marginBottom: 16 },
  victoryEmoji: { fontSize: 64, marginBottom: 16 },
  finalScore: { fontSize: 24, color: theme.colors.success, marginBottom: 24, fontWeight: 'bold' },
  newRecord: { fontSize: 20, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 16 },
  nextButton: { width: '100%', backgroundColor: theme.colors.success, paddingVertical: 16, borderRadius: 12, marginBottom: 8, alignItems: 'center' },
  nextButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  menuButton: { width: '100%', backgroundColor: theme.colors.surfaceSecondary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  menuButtonText: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
});

export default StroopTestGame;
