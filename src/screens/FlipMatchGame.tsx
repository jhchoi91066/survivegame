import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useFlipMatchStore } from '../game/flipmatch/store';
import { Difficulty } from '../game/flipmatch/types';
import GameBoard from '../components/flipmatch/GameBoard';
import { hapticPatterns } from '../utils/haptics';
import { useGameStore } from '../game/shared/store';
import { updateFlipMatchRecord } from '../utils/statsManager';
import { incrementGameCount } from '../utils/reviewManager';

type FlipMatchGameNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FlipMatchGame'>;

const FlipMatchGame: React.FC = () => {
  const navigation = useNavigation<FlipMatchGameNavigationProp>();
  const {
    gameStatus,
    moves,
    matchedPairs,
    totalPairs,
    timeElapsed,
    initializeGame,
    resetGame,
    incrementTime,
    settings,
  } = useFlipMatchStore();

  const { incrementTotalPlays, addPlayTime, updateBestRecord } = useGameStore();

  const [showDifficultyModal, setShowDifficultyModal] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');

  // 타이머
  useEffect(() => {
    if (gameStatus === 'playing') {
      const interval = setInterval(() => {
        incrementTime();
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [gameStatus]);

  // 게임 승리 처리
  useEffect(() => {
    if (gameStatus === 'won') {
      handleGameWon();
    }
  }, [gameStatus]);

  const handleGameWon = async () => {
    hapticPatterns.levelComplete();

    // 최고 기록 업데이트 (플레이 통계 포함)
    await updateFlipMatchRecord(timeElapsed, settings.difficulty, timeElapsed);
    updateBestRecord('flip_match', timeElapsed);

    // 게임 카운트 증가 및 리뷰 요청
    await incrementGameCount();
  };

  const handleStartGame = () => {
    initializeGame({
      difficulty: selectedDifficulty,
      theme: 'animals',
    });
    setShowDifficultyModal(false);
    hapticPatterns.buttonPress();
  };

  const handleRestart = () => {
    resetGame();
    hapticPatterns.buttonPress();
  };

  const handleBackToMenu = () => {
    hapticPatterns.buttonPress();
    navigation.goBack();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBackToMenu} style={styles.backButton}>
          <Text style={styles.backButtonText}>← 메뉴</Text>
        </Pressable>
        <Text style={styles.title}>🎴 Flip & Match</Text>
        <Pressable onPress={handleRestart} style={styles.restartButton}>
          <Text style={styles.restartButtonText}>🔄</Text>
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>시간</Text>
          <Text style={styles.statValue}>{formatTime(timeElapsed)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>이동</Text>
          <Text style={styles.statValue}>{moves}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>진행</Text>
          <Text style={styles.statValue}>{matchedPairs}/{totalPairs}</Text>
        </View>
      </View>

      {/* Game Board */}
      {gameStatus !== 'ready' && <GameBoard />}

      {/* Difficulty Selection Modal */}
      <Modal visible={showDifficultyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>난이도 선택</Text>

            <Pressable
              style={[
                styles.difficultyButton,
                selectedDifficulty === 'easy' && styles.difficultyButtonSelected,
              ]}
              onPress={() => {
                setSelectedDifficulty('easy');
                hapticPatterns.buttonPress();
              }}
            >
              <Text style={styles.difficultyButtonText}>쉬움 (4x4)</Text>
            </Pressable>

            <Pressable
              style={[
                styles.difficultyButton,
                selectedDifficulty === 'medium' && styles.difficultyButtonSelected,
              ]}
              onPress={() => {
                setSelectedDifficulty('medium');
                hapticPatterns.buttonPress();
              }}
            >
              <Text style={styles.difficultyButtonText}>보통 (4x6)</Text>
            </Pressable>

            <Pressable
              style={[
                styles.difficultyButton,
                selectedDifficulty === 'hard' && styles.difficultyButtonSelected,
              ]}
              onPress={() => {
                setSelectedDifficulty('hard');
                hapticPatterns.buttonPress();
              }}
            >
              <Text style={styles.difficultyButtonText}>어려움 (4x8)</Text>
            </Pressable>

            <Pressable style={styles.startButton} onPress={handleStartGame}>
              <Text style={styles.startButtonText}>게임 시작</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Victory Modal */}
      <Modal visible={gameStatus === 'won'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.victoryEmoji}>🎉</Text>
            <Text style={styles.modalTitle}>완료!</Text>
            <Text style={styles.victoryStats}>시간: {formatTime(timeElapsed)}</Text>
            <Text style={styles.victoryStats}>이동 횟수: {moves}</Text>

            <Pressable style={styles.startButton} onPress={handleRestart}>
              <Text style={styles.startButtonText}>다시 하기</Text>
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
  restartButton: {
    padding: 8,
  },
  restartButtonText: {
    fontSize: 24,
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
    marginBottom: 24,
  },
  difficultyButton: {
    width: '100%',
    backgroundColor: '#475569',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  difficultyButtonSelected: {
    backgroundColor: '#3b82f6',
  },
  difficultyButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  startButton: {
    width: '100%',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  victoryEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  victoryStats: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 8,
  },
  menuButton: {
    width: '100%',
    backgroundColor: '#475569',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default FlipMatchGame;
