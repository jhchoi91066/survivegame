import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useMathRushStore } from '../game/mathrush/store';
import { hapticPatterns } from '../utils/haptics';
import { useGameStore } from '../game/shared/store';
import { updateMathRushRecord, loadGameRecord } from '../utils/statsManager';
import { incrementGameCount } from '../utils/reviewManager';
import { smartSync } from '../utils/cloudSync';
import { useTheme } from '../contexts/ThemeContext';

type MathRushGameNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MathRushGame'>;

const MathRushGame: React.FC = () => {
  const navigation = useNavigation<MathRushGameNavigationProp>();
  const { theme } = useTheme();
  const {
    currentQuestion, score, combo, highestCombo, timeRemaining, gameStatus, lives, answerQuestion, decrementTime, startGame, resetGame,
  } = useMathRushStore();

  const { updateBestRecord } = useGameStore();
  const [isNewRecord, setIsNewRecord] = useState(false);

  useEffect(() => {
    if (gameStatus === 'playing') {
      const interval = setInterval(() => { decrementTime(); }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameStatus]);

  useEffect(() => {
    if (gameStatus === 'finished') {
      handleGameFinish();
    }
  }, [gameStatus]);

  const handleGameFinish = async () => {
    hapticPatterns.gameOver();

    const oldRecord = await loadGameRecord('math_rush');
    if (!oldRecord || !oldRecord.highScore || score > oldRecord.highScore) {
      setIsNewRecord(true);
    }

    const playTime = 30 - timeRemaining;
    await updateMathRushRecord(score, highestCombo, playTime);
    updateBestRecord('math_rush', score);
    await smartSync({
      game_type: 'math_rush', score: score, time_seconds: playTime, difficulty: 'normal', played_at: new Date().toISOString()
    });
    await incrementGameCount();
  };

  const handleAnswer = (answer: number) => {
    if (!currentQuestion || gameStatus !== 'playing') return;
    const isCorrect = answer === currentQuestion.correctAnswer;
    if (isCorrect) hapticPatterns.correctAnswer(); else hapticPatterns.wrongAnswer();
    answerQuestion(answer);
  };

  const handleStart = () => {
    setIsNewRecord(false);
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
          <Pressable onPress={handleBackToMenu} style={styles.backButton}><Text style={styles.backButtonText}>← 메뉴</Text></Pressable>
          <Text style={styles.title}>➕ Math Rush</Text>
          <View style={{ width: 60 }} />
        </View>

        {gameStatus === 'ready' && (
          <View style={styles.startContainer}>
            <Text style={styles.startEmoji}>🧮</Text>
            <Text style={styles.startTitle}>Math Rush</Text>
            <Text style={styles.startDescription}>30초 안에 최대한 많은 문제를 푸세요!{`\n`}3번 틀리면 게임이 종료됩니다.</Text>
            <Pressable style={styles.startButton} onPress={handleStart}><Text style={styles.startButtonText}>시작하기</Text></Pressable>
          </View>
        )}

        {gameStatus === 'playing' && currentQuestion && (
          <>
            <View style={styles.stats}>
              <View style={styles.statItem}><Text style={styles.statLabel}>점수</Text><Text style={styles.statValue}>{score}</Text></View>
              <View style={styles.statItem}><Text style={styles.statLabel}>시간</Text><Text style={[styles.statValue, { color: getTimerColor() }]}>{timeRemaining}</Text></View>
              <View style={styles.statItem}><Text style={styles.statLabel}>생명</Text><Text style={styles.statValue}>{'❤️'.repeat(lives)}</Text></View>
            </View>
            {combo >= 5 && <View style={styles.comboContainer}><Text style={styles.comboText}>🔥 {combo} COMBO!</Text></View>}
            <View style={styles.questionContainer}><Text style={styles.question}>{currentQuestion.num1} {currentQuestion.operation} {currentQuestion.num2} = ?</Text></View>
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
              <Text style={styles.victoryEmoji}>🎯</Text>
              <Text style={styles.modalTitle}>게임 종료!</Text>
              {isNewRecord && <Text style={styles.newRecord}>🏆 신기록 달성!</Text>}
              <Text style={styles.finalScore}>최종 점수: {score}</Text>
              <Text style={styles.finalCombo}>최고 콤보: {highestCombo}</Text>
              <Pressable style={styles.nextButton} onPress={handleRestart}><Text style={styles.nextButtonText}>다시 하기</Text></Pressable>
              <Pressable style={styles.menuButton} onPress={handleBackToMenu}><Text style={styles.menuButtonText}>메뉴로</Text></Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
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
  comboContainer: { alignItems: 'center', marginBottom: 16 },
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
  newRecord: { fontSize: 20, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 16 },
  nextButton: { width: '100%', backgroundColor: theme.colors.success, paddingVertical: 16, borderRadius: 12, marginBottom: 8, alignItems: 'center' },
  nextButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  menuButton: { width: '100%', backgroundColor: theme.colors.surfaceSecondary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  menuButtonText: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
});

export default MathRushGame;