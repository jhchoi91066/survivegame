import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Modal, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useFlipMatchStore } from '../game/flipmatch/store';
import { Difficulty } from '../game/flipmatch/types';
import GameBoard from '../components/flipmatch/GameBoard';
import { hapticPatterns } from '../utils/haptics';
import { soundManager } from '../utils/soundManager';
import { useGameStore } from '../game/shared/store';
import { updateFlipMatchRecord, loadGameRecord } from '../utils/statsManager';
import { incrementGameCount } from '../utils/reviewManager';
import { useTheme } from '../contexts/ThemeContext';
import { updateStatsOnGamePlayed } from '../utils/achievementManager';
import { Achievement } from '../data/achievements';
import AchievementUnlockModal from '../components/shared/AchievementUnlockModal';

type FlipMatchGameNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FlipMatchGame'>;

const FlipMatchGame: React.FC = () => {
  const navigation = useNavigation<FlipMatchGameNavigationProp>();
  const { theme } = useTheme();
  const {
    gameStatus, moves, matchedPairs, totalPairs, timeRemaining, initializeGame, resetGame, decrementTime, settings,
  } = useFlipMatchStore();

  const { updateBestRecord } = useGameStore();

  const [showDifficultyModal, setShowDifficultyModal] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);

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
      const interval = setInterval(() => { decrementTime(); }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameStatus]);

  useEffect(() => {
    if (gameStatus === 'won' || gameStatus === 'lost') {
      handleGameEnd();
    }
  }, [gameStatus]);

  const handleGameEnd = async () => {
    if (gameStatus === 'won') {
      hapticPatterns.levelComplete();
      soundManager.playSound('game_win');
      const timeTaken = getTimeLimit() - timeRemaining;

      const oldRecord = await loadGameRecord('flip_match');
      if (!oldRecord || !oldRecord.bestTime || timeTaken < oldRecord.bestTime) {
        setIsNewRecord(true);
      }

      await updateFlipMatchRecord(timeTaken, settings.difficulty, timeTaken);
      updateBestRecord('flip_match', timeTaken);

      const newAchievements = await updateStatsOnGamePlayed('flip_match', moves, timeTaken, settings.difficulty);
      if (newAchievements.length > 0) {
        setUnlockedAchievements(newAchievements);
        setShowAchievementModal(true);
        soundManager.playSound('achievement');
      }
    } else {
      hapticPatterns.error();
      soundManager.playSound('game_lose');
    }
    await incrementGameCount();
  };

  const getTimeLimit = (): number => {
    const limits = { easy: 120, medium: 90, hard: 60 };
    return limits[settings.difficulty];
  };

  const handleStartGame = () => {
    setIsNewRecord(false);
    setShowDifficultyModal(false);
    hapticPatterns.buttonPress();
    soundManager.playSound('game_start');
    // 사운드가 재생된 후 게임 초기화 (약간의 지연)
    setTimeout(() => {
      initializeGame({ difficulty: selectedDifficulty, theme: 'animals' });
    }, 100);
  };

  const handleRestart = () => {
    setIsNewRecord(false);
    resetGame();
    hapticPatterns.buttonPress();
    soundManager.playSound('button_press');
  };

  const handleBackToMenu = () => {
    hapticPatterns.buttonPress();
    soundManager.playSound('button_press');
    navigation.goBack();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Pressable onPress={handleBackToMenu} style={styles.backButton}><Text style={styles.backButtonText}>← 메뉴</Text></Pressable>
            <Text style={styles.title}>🎴 Flip & Match</Text>
            <Pressable onPress={handleRestart} style={styles.restartButton}><Text style={styles.restartButtonText}>🔄</Text></Pressable>
          </View>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>남은 시간</Text>
              <Text style={[styles.statValue, timeRemaining <= 10 && styles.statValueWarning]}>{formatTime(timeRemaining)}</Text>
            </View>
            <View style={styles.statItem}><Text style={styles.statLabel}>이동</Text><Text style={styles.statValue}>{moves}</Text></View>
            <View style={styles.statItem}><Text style={styles.statLabel}>진행</Text><Text style={styles.statValue}>{matchedPairs}/{totalPairs}</Text></View>
          </View>

          {gameStatus === 'preview' && <View style={styles.previewOverlay}><Text style={styles.previewText}>🧠 카드를 기억하세요!</Text></View>}
          {gameStatus !== 'ready' && <GameBoard />}
        </ScrollView>

        <Modal visible={showDifficultyModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>난이도 선택</Text>
              <Pressable style={[styles.difficultyButton, selectedDifficulty === 'easy' && styles.difficultyButtonSelected]} onPress={() => { setSelectedDifficulty('easy'); hapticPatterns.buttonPress(); }}>
                <Text style={styles.difficultyButtonText}>쉬움 (4x4)</Text>
              </Pressable>
              <Pressable style={[styles.difficultyButton, selectedDifficulty === 'medium' && styles.difficultyButtonSelected]} onPress={() => { setSelectedDifficulty('medium'); hapticPatterns.buttonPress(); }}>
                <Text style={styles.difficultyButtonText}>보통 (6x4)</Text>
              </Pressable>
              <Pressable style={[styles.difficultyButton, selectedDifficulty === 'hard' && styles.difficultyButtonSelected]} onPress={() => { setSelectedDifficulty('hard'); hapticPatterns.buttonPress(); }}>
                <Text style={styles.difficultyButtonText}>어려움 (8x4)</Text>
              </Pressable>
              <Pressable style={styles.startButton} onPress={handleStartGame}><Text style={styles.startButtonText}>게임 시작</Text></Pressable>
            </View>
          </View>
        </Modal>

        <Modal visible={gameStatus === 'won'} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.victoryEmoji}>🎉</Text>
              <Text style={styles.modalTitle}>완료!</Text>
              {isNewRecord && <Text style={styles.newRecord}>🏆 신기록 달성!</Text>}
              <Text style={styles.victoryStats}>소요 시간: {formatTime(getTimeLimit() - timeRemaining)}</Text>
              <Text style={styles.victoryStats}>이동 횟수: {moves}</Text>
              <Pressable style={styles.startButton} onPress={handleRestart}><Text style={styles.startButtonText}>다시 하기</Text></Pressable>
              <Pressable style={styles.menuButton} onPress={handleBackToMenu}><Text style={styles.menuButtonText}>메뉴로</Text></Pressable>
            </View>
          </View>
        </Modal>

        <Modal visible={gameStatus === 'lost'} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.defeatEmoji}>⏰</Text>
              <Text style={styles.modalTitle}>시간 초과!</Text>
              <Text style={styles.victoryStats}>완성: {matchedPairs}/{totalPairs} 쌍</Text>
              <Text style={styles.victoryStats}>이동 횟수: {moves}</Text>
              <Pressable style={styles.startButton} onPress={handleRestart}><Text style={styles.startButtonText}>다시 하기</Text></Pressable>
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
  scrollContent: { flexGrow: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  backButton: { padding: 8 },
  backButtonText: { color: theme.colors.textSecondary, fontSize: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text },
  restartButton: { padding: 8 },
  restartButtonText: { fontSize: 24, color: theme.colors.text },
  stats: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.colors.surface, marginHorizontal: 16, borderRadius: 12, marginBottom: 16 },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text },
  statValueWarning: { color: theme.colors.error },
  previewOverlay: { position: 'absolute', top: 120, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  previewText: { fontSize: 28, fontWeight: 'bold', color: '#fff', backgroundColor: 'rgba(59, 130, 246, 0.9)', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 },
  modalOverlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 32, width: '80%', maxWidth: 400, alignItems: 'center' },
  modalTitle: { fontSize: 28, fontWeight: 'bold', color: theme.colors.text, marginBottom: 24 },
  difficultyButton: { width: '100%', backgroundColor: theme.colors.surfaceSecondary, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12, marginBottom: 12, alignItems: 'center' },
  difficultyButtonSelected: { backgroundColor: theme.colors.primary },
  difficultyButtonText: { fontSize: 18, fontWeight: '600', color: theme.colors.text },
  startButton: { width: '100%', backgroundColor: theme.colors.success, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12, marginTop: 12, alignItems: 'center' },
  startButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  victoryEmoji: { fontSize: 64, marginBottom: 16 },
  defeatEmoji: { fontSize: 64, marginBottom: 16 },
  victoryStats: { fontSize: 16, color: theme.colors.textSecondary, marginBottom: 8 },
  newRecord: { fontSize: 20, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 16 },
  menuButton: { width: '100%', backgroundColor: theme.colors.surfaceSecondary, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12, marginTop: 8, alignItems: 'center' },
  menuButtonText: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
});

export default FlipMatchGame;