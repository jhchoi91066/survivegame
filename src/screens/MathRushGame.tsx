import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useMathRushStore } from '../game/mathrush/store';
import { hapticPatterns } from '../utils/haptics';
import { useGameStore } from '../game/shared/store';
import { updateMathRushRecord } from '../utils/statsManager';
import { incrementGameCount } from '../utils/reviewManager';
import { smartSync } from '../utils/cloudSync';

type MathRushGameNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MathRushGame'>;

const MathRushGame: React.FC = () => {
  const navigation = useNavigation<MathRushGameNavigationProp>();
  const {
    currentQuestion,
    score,
    combo,
    highestCombo,
    timeRemaining,
    gameStatus,
    answerQuestion,
    decrementTime,
    startGame,
    resetGame,
  } = useMathRushStore();

  const { incrementTotalPlays, addPlayTime, updateBestRecord } = useGameStore();

  // 타이머
  useEffect(() => {
    if (gameStatus === 'playing') {
      const interval = setInterval(() => {
        decrementTime();
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [gameStatus]);

  // 게임 종료 처리
  useEffect(() => {
    if (gameStatus === 'finished') {
      handleGameFinish();
    }
  }, [gameStatus]);

  const handleGameFinish = async () => {
    hapticPatterns.gameOver();
    const playTime = 30 - timeRemaining;
    await updateMathRushRecord(score, highestCombo, playTime);
    updateBestRecord('math_rush', score);

    // 클라우드 동기화 (로그인한 경우)
    await smartSync({
      game_type: 'math_rush',
      score: score,
      time_seconds: playTime,
      difficulty: 'normal',
      played_at: new Date().toISOString()
    });

    // 게임 카운트 증가 및 리뷰 요청
    await incrementGameCount();
  };

  const handleAnswer = (answer: number) => {
    if (!currentQuestion) return;

    const isCorrect = answer === currentQuestion.correctAnswer;
    if (isCorrect) {
      hapticPatterns.correctAnswer();
    } else {
      hapticPatterns.wrongAnswer();
    }

    answerQuestion(answer);
  };

  const handleStart = () => {
    hapticPatterns.buttonPress();
    startGame();
  };

  const handleRestart = () => {
    hapticPatterns.buttonPress();
    resetGame();
    startGame();
  };

  const handleBackToMenu = () => {
    hapticPatterns.buttonPress();
    navigation.goBack();
  };

  const getTimerColor = (): string => {
    if (timeRemaining > 30) return '#10b981'; // green
    if (timeRemaining > 10) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBackToMenu} style={styles.backButton}>
          <Text style={styles.backButtonText}>← 메뉴</Text>
        </Pressable>
        <Text style={styles.title}>➕ Math Rush</Text>
        <View style={{ width: 60 }} />
      </View>

      {gameStatus === 'ready' && (
        <View style={styles.startContainer}>
          <Text style={styles.startEmoji}>🧮</Text>
          <Text style={styles.startTitle}>Math Rush</Text>
          <Text style={styles.startDescription}>
            30초 안에 틀리지 않고 최대한 많이 푸세요!{'\n'}
            한 문제당 1점, 틀리면 즉시 종료!
          </Text>
          <Pressable style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>시작하기</Text>
          </Pressable>
        </View>
      )}

      {gameStatus === 'playing' && currentQuestion && (
        <>
          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>점수</Text>
              <Text style={styles.statValue}>{score}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>시간</Text>
              <Text style={[styles.statValue, { color: getTimerColor() }]}>
                {timeRemaining}s
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>콤보</Text>
              <Text style={styles.statValue}>{combo}</Text>
            </View>
          </View>

          {/* Combo Indicator */}
          {combo >= 5 && (
            <View style={styles.comboContainer}>
              <Text style={styles.comboText}>🔥 {combo} COMBO!</Text>
            </View>
          )}

          {/* Question */}
          <View style={styles.questionContainer}>
            <Text style={styles.question}>
              {currentQuestion.num1} {currentQuestion.operation} {currentQuestion.num2} = ?
            </Text>
          </View>

          {/* Answer Options */}
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <Pressable
                key={index}
                style={styles.optionButton}
                onPress={() => handleAnswer(option)}
              >
                <Text style={styles.optionText}>{option}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {/* Game Over Modal */}
      <Modal visible={gameStatus === 'finished'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.victoryEmoji}>🎯</Text>
            <Text style={styles.modalTitle}>게임 종료!</Text>
            <Text style={styles.finalScore}>최종 점수: {score}</Text>
            <Text style={styles.finalCombo}>최고 콤보: {highestCombo}</Text>

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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e293b',
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
    color: '#94a3b8',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
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
    color: '#fff',
    marginBottom: 16,
  },
  startDescription: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
  },
  startButton: {
    backgroundColor: '#10b981',
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
    backgroundColor: '#334155',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  comboContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  comboText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  questionContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    marginHorizontal: 16,
    backgroundColor: '#334155',
    borderRadius: 16,
    marginBottom: 24,
  },
  question: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  optionButton: {
    width: '45%',
    backgroundColor: '#3b82f6',
    paddingVertical: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#334155',
    borderRadius: 20,
    padding: 32,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  victoryEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  finalScore: {
    fontSize: 20,
    color: '#10b981',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  finalCombo: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 24,
  },
  nextButton: {
    width: '100%',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 24,
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
    backgroundColor: '#475569',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default MathRushGame;
