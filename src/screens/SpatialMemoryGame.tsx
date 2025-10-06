import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useSpatialMemoryStore } from '../game/spatialmemory/store';
import { Difficulty } from '../game/spatialmemory/types';
import TileGrid from '../components/spatialmemory/TileGrid';
import { hapticPatterns } from '../utils/haptics';
import { useGameStore } from '../game/shared/store';
import { updateSpatialMemoryRecord } from '../utils/statsManager';

type SpatialMemoryGameNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SpatialMemoryGame'>;

const SpatialMemoryGame: React.FC = () => {
  const navigation = useNavigation<SpatialMemoryGameNavigationProp>();
  const {
    gameStatus,
    currentLevel,
    initializeGame,
    startRound,
    resetGame,
    settings,
  } = useSpatialMemoryStore();

  const { updateBestRecord } = useGameStore();

  const [showDifficultyModal, setShowDifficultyModal] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [startTime, setStartTime] = useState<number>(0);

  // 게임 시작 시간 기록
  useEffect(() => {
    if (gameStatus === 'showing' && startTime === 0) {
      setStartTime(Date.now());
    }
  }, [gameStatus]);

  // 게임 오버 처리
  useEffect(() => {
    if (gameStatus === 'gameover') {
      handleGameOver();
    }
  }, [gameStatus]);

  const handleGameOver = async () => {
    hapticPatterns.error();

    // 최고 기록 업데이트 (레벨은 높을수록 좋음)
    const finalLevel = currentLevel - 1; // 실패한 레벨이므로 -1
    const playTime = Math.floor((Date.now() - startTime) / 1000);

    await updateSpatialMemoryRecord(finalLevel, settings.difficulty, playTime);
    updateBestRecord('spatial_memory', finalLevel);
  };

  const handleStartGame = () => {
    const difficultySettings = {
      easy: { difficulty: 'easy' as Difficulty, flashSpeed: 600, startingLevel: 3 },
      medium: { difficulty: 'medium' as Difficulty, flashSpeed: 500, startingLevel: 3 },
      hard: { difficulty: 'hard' as Difficulty, flashSpeed: 400, startingLevel: 4 },
    };

    initializeGame(difficultySettings[selectedDifficulty]);
    setShowDifficultyModal(false);
    hapticPatterns.buttonPress();

    // 게임 시작
    setTimeout(() => {
      startRound();
    }, 500);
  };

  const handleRestart = () => {
    resetGame();
    hapticPatterns.buttonPress();
    setTimeout(() => {
      startRound();
    }, 500);
  };

  const handleBackToMenu = () => {
    hapticPatterns.buttonPress();
    navigation.goBack();
  };

  const getStatusText = () => {
    switch (gameStatus) {
      case 'ready':
        return '준비';
      case 'showing':
        return '패턴 기억하기...';
      case 'input':
        return '입력하세요!';
      case 'correct':
        return '정답! 🎉';
      case 'wrong':
        return '틀렸습니다 ❌';
      case 'gameover':
        return '게임 오버';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBackToMenu} style={styles.backButton}>
          <Text style={styles.backButtonText}>← 메뉴</Text>
        </Pressable>
        <Text style={styles.title}>🧠 Spatial Memory</Text>
        <Pressable onPress={handleRestart} style={styles.restartButton}>
          <Text style={styles.restartButtonText}>🔄</Text>
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>레벨</Text>
          <Text style={styles.statValue}>{currentLevel}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>상태</Text>
          <Text style={[
            styles.statValue,
            styles.statusText,
            gameStatus === 'wrong' && styles.wrongText,
            gameStatus === 'correct' && styles.correctText,
          ]}>{getStatusText()}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>난이도</Text>
          <Text style={styles.statValue}>
            {settings.difficulty === 'easy' ? '쉬움' : settings.difficulty === 'medium' ? '보통' : '어려움'}
          </Text>
        </View>
      </View>

      {/* Game Grid */}
      {gameStatus !== 'ready' && <TileGrid />}

      {/* Difficulty Selection Modal */}
      <Modal visible={showDifficultyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>난이도 선택</Text>
            <Text style={styles.modalDescription}>
              깜빡이는 타일의 순서를 기억하세요!{'\n'}
              레벨이 올라갈수록 더 많은 타일이 깜빡입니다.
            </Text>

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
              <Text style={styles.difficultyButtonText}>쉬움 (3×3)</Text>
              <Text style={styles.difficultySubText}>레벨 3부터 시작 · 느린 속도</Text>
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
              <Text style={styles.difficultyButtonText}>보통 (4×4)</Text>
              <Text style={styles.difficultySubText}>레벨 3부터 시작 · 보통 속도</Text>
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
              <Text style={styles.difficultyButtonText}>어려움 (5×5)</Text>
              <Text style={styles.difficultySubText}>레벨 4부터 시작 · 빠른 속도</Text>
            </Pressable>

            <Pressable style={styles.startButton} onPress={handleStartGame}>
              <Text style={styles.startButtonText}>게임 시작</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Game Over Modal */}
      <Modal visible={gameStatus === 'gameover'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.gameOverEmoji}>🧠</Text>
            <Text style={styles.modalTitle}>게임 오버!</Text>
            <Text style={styles.finalScore}>최종 레벨: {currentLevel - 1}</Text>
            <Text style={styles.victoryStats}>
              {currentLevel - 1}개의 타일 순서를 기억했습니다!
            </Text>

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
  statusText: {
    fontSize: 16,
  },
  wrongText: {
    color: '#ef4444',
  },
  correctText: {
    color: '#10b981',
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
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
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
  difficultySubText: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 4,
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
  gameOverEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  finalScore: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 8,
  },
  victoryStats: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 24,
    textAlign: 'center',
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

export default SpatialMemoryGame;
