import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Modal, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useSequenceStore } from '../game/sequence/store';
import NumberTile from '../components/sequence/NumberTile';
import { hapticPatterns } from '../utils/haptics';
import { useGameStore } from '../game/shared/store';
import { updateSequenceRecord } from '../utils/statsManager';
import { incrementGameCount } from '../utils/reviewManager';
import { smartSync } from '../utils/cloudSync';
import { useTheme } from '../contexts/ThemeContext';

type SequenceGameNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SequenceGame'>;

const SequenceGame: React.FC = () => {
  const navigation = useNavigation<SequenceGameNavigationProp>();
  const { theme } = useTheme();
  const {
    tiles,
    level,
    mistakes,
    maxMistakes,
    gameStatus,
    levelTime,
    bestLevelTime,
    difficulty,
    initializeGame,
    clickTile,
    nextLevel,
    resetGame,
    updateLevelTime,
    setBestLevelTime,
  } = useSequenceStore();

  const { updateBestRecord } = useGameStore();
  const [showDifficultyModal, setShowDifficultyModal] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [gameStartTime, setGameStartTime] = useState<number>(0);

  useEffect(() => {
    if (gameStatus === 'playing') {
      const interval = setInterval(() => {
        updateLevelTime();
      }, 100);
      return () => clearInterval(interval);
    }
  }, [gameStatus]);

  useEffect(() => {
    if (gameStatus === 'won') {
      handleLevelComplete();
    } else if (gameStatus === 'lost') {
      handleGameOver();
    }
  }, [gameStatus]);

  const handleLevelComplete = async () => {
    hapticPatterns.levelComplete();
    if (bestLevelTime === 0 || levelTime < bestLevelTime) {
      setBestLevelTime(levelTime);
    }
    const totalPlayTime = (Date.now() - gameStartTime) / 1000;
    await updateSequenceRecord(level, totalPlayTime);
    updateBestRecord('sequence', level);
  };

  const handleGameOver = async () => {
    hapticPatterns.gameOver();
    const totalPlayTime = (Date.now() - gameStartTime) / 1000;
    await updateSequenceRecord(level, totalPlayTime);
    await smartSync({
      game_type: 'sequence',
      score: level,
      level: level,
      time_seconds: totalPlayTime,
      difficulty: difficulty,
      played_at: new Date().toISOString()
    });
    await incrementGameCount();
  };

  const handleStartGame = () => {
    initializeGame(1, selectedDifficulty);
    setShowDifficultyModal(false);
    setGameStartTime(Date.now());
    hapticPatterns.buttonPress();
  };

  const handleNextLevel = () => {
    hapticPatterns.buttonPress();
    nextLevel();
  };

  const handleRestart = () => {
    hapticPatterns.buttonPress();
    resetGame();
  };

  const handleBackToMenu = () => {
    hapticPatterns.buttonPress();
    navigation.goBack();
  };

  const formatTime = (seconds: number): string => {
    return `${seconds.toFixed(2)}s`;
  };

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.header}>
            <Pressable onPress={handleBackToMenu} style={styles.backButton}>
              <Text style={styles.backButtonText}>← 메뉴</Text>
            </Pressable>
            <Text style={styles.title}>🔢 Sequence</Text>
            <Pressable onPress={handleRestart} style={styles.restartButton}>
              <Text style={styles.restartButtonText}>🔄</Text>
            </Pressable>
          </View>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>레벨</Text>
              <Text style={styles.statValue}>{level}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>시간</Text>
              <Text style={styles.statValue}>{formatTime(levelTime)}</Text>
              {bestLevelTime > 0 && (
                <Text style={styles.bestTime}>🏆 {formatTime(bestLevelTime)}</Text>
              )}
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>실수</Text>
              <Text style={[styles.statValue, mistakes > 0 && styles.statValueDanger]}>
                {mistakes}/{maxMistakes}
              </Text>
            </View>
          </View>

          {gameStatus !== 'ready' && (
            <View style={styles.gameBoard}>
              {tiles.map((tile) => (
                <NumberTile
                  key={tile.id}
                  tile={tile}
                  onPress={() => { clickTile(tile.id); hapticPatterns.buttonPress(); }}
                />
              ))}
            </View>
          )}
        </ScrollView>

        <Modal visible={showDifficultyModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>난이도 선택</Text>
              <Text style={styles.modalDescription}>숫자를 순서대로 터치하세요!</Text>
              <Pressable
                style={[styles.difficultyButton, { backgroundColor: '#10b981' }, selectedDifficulty === 'easy' && styles.difficultyButtonSelected ]}
                onPress={() => { setSelectedDifficulty('easy'); hapticPatterns.buttonPress(); }}
              >
                <Text style={styles.difficultyButtonText}>😊 쉬움</Text>
                <Text style={styles.difficultySubtext}>3개부터 시작</Text>
              </Pressable>
              <Pressable
                style={[styles.difficultyButton, { backgroundColor: '#22d3ee' }, selectedDifficulty === 'normal' && styles.difficultyButtonSelected ]}
                onPress={() => { setSelectedDifficulty('normal'); hapticPatterns.buttonPress(); }}
              >
                <Text style={styles.difficultyButtonText}>🎯 보통</Text>
                <Text style={styles.difficultySubtext}>5개부터 시작</Text>
              </Pressable>
              <Pressable
                style={[styles.difficultyButton, { backgroundColor: '#ef4444' }, selectedDifficulty === 'hard' && styles.difficultyButtonSelected ]}
                onPress={() => { setSelectedDifficulty('hard'); hapticPatterns.buttonPress(); }}
              >
                <Text style={styles.difficultyButtonText}>🔥 어려움</Text>
                <Text style={styles.difficultySubtext}>7개부터 시작</Text>
              </Pressable>
              <Pressable style={styles.startButton} onPress={handleStartGame}>
                <Text style={styles.startButtonText}>게임 시작</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Modal visible={gameStatus === 'won'} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.victoryEmoji}>🎉</Text>
              <Text style={styles.modalTitle}>레벨 {level} 완료!</Text>
              <Text style={styles.victoryStats}>시간: {formatTime(levelTime)}</Text>
              {bestLevelTime > 0 && levelTime === bestLevelTime && (
                <Text style={styles.newRecord}>🏆 신기록!</Text>
              )}
              <Pressable style={styles.nextButton} onPress={handleNextLevel}>
                <Text style={styles.nextButtonText}>다음 레벨 (Lv.{level + 1})</Text>
              </Pressable>
              <Pressable style={styles.menuButton} onPress={handleBackToMenu}>
                <Text style={styles.menuButtonText}>메뉴로</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Modal visible={gameStatus === 'lost'} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.gameOverEmoji}>😢</Text>
              <Text style={styles.modalTitle}>게임 오버</Text>
              <Text style={styles.gameOverText}>레벨 {level}까지 도달했습니다</Text>
              <Text style={styles.gameOverText}>시간: {formatTime(levelTime)}</Text>
              <Pressable style={styles.nextButton} onPress={handleRestart}>
                <Text style={styles.nextButtonText}>다시 시작</Text>
              </Pressable>
              <Pressable style={styles.menuButton} onPress={handleBackToMenu}>
                <Text style={styles.menuButtonText}>메뉴로</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  restartButton: {
    padding: 8,
  },
  restartButtonText: {
    fontSize: 24,
    color: theme.colors.text,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  bestTime: {
    fontSize: 11,
    color: theme.colors.primary,
    marginTop: 2,
  },
  statValueDanger: {
    color: theme.colors.error,
  },
  gameBoard: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 32,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  difficultyButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  difficultyButtonSelected: {
    borderWidth: 3,
    borderColor: theme.colors.text,
  },
  difficultyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  difficultySubtext: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  startButton: {
    width: '100%',
    backgroundColor: theme.colors.success,
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
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  newRecord: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 16,
  },
  gameOverEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  gameOverText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  nextButton: {
    width: '100%',
    backgroundColor: theme.colors.success,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
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
    backgroundColor: theme.colors.surfaceSecondary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
});

export default SequenceGame;
