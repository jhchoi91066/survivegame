import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Modal, ScrollView, Platform } from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
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
import { uploadGameStats } from '../utils/cloudSync';
import { useAuth } from '../contexts/AuthContext';
import { PauseMenu } from '../components/shared/PauseMenu';
import { MultiplayerProvider, useMultiplayer } from '../contexts/MultiplayerContext';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import {
  ArrowLeft,
  Pause,
  RotateCcw,
  Trophy,
  Timer,
  Flame,
  Grid3X3,
  Play,
  Menu,
  Move
} from 'lucide-react-native';

type FlipMatchGameNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FlipMatchGame'>;

// Wrapper component that provides multiplayer context
const FlipMatchGame: React.FC = () => {
  const route = useRoute<any>();
  const multiplayerRoomId = route.params?.multiplayerRoomId;

  return (
    <MultiplayerProvider roomId={multiplayerRoomId}>
      <FlipMatchGameContent />
    </MultiplayerProvider>
  );
};

// Main game component with multiplayer support
const FlipMatchGameContent: React.FC = () => {
  const navigation = useNavigation<FlipMatchGameNavigationProp>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { isMultiplayer, opponentScore, updateMyScore, finishGame } = useMultiplayer();
  const {
    gameStatus, moves, matchedPairs, totalPairs, timeRemaining, initializeGame, resetGame, decrementTime, settings,
  } = useFlipMatchStore();

  const { updateBestRecord } = useGameStore();

  const [showDifficultyModal, setShowDifficultyModal] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Animation values for score updates
  const opponentScoreScale = useSharedValue(1);
  const opponentScoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: opponentScoreScale.value }],
  }));

  const isMounted = React.useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Animate opponent score when it changes
  useEffect(() => {
    if (isMultiplayer && opponentScore > 0) {
      opponentScoreScale.value = withSequence(
        withSpring(1.3, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 12 })
      );
    }
  }, [opponentScore, isMultiplayer]);

  // 화면이 포커스될 때마다 게임 상태 리셋
  useFocusEffect(
    useCallback(() => {
      resetGame();
      setShowDifficultyModal(true);
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
    if (gameStatus === 'won' || gameStatus === 'lost') {
      handleGameEnd();
    }
  }, [gameStatus]);

  // Update multiplayer score when pairs are matched
  useEffect(() => {
    if (isMultiplayer && gameStatus === 'playing' && matchedPairs > 0) {
      // Calculate score: pairs matched * 100 - moves * 5
      const score = matchedPairs * 100 - moves * 5;
      updateMyScore(score);
    }
  }, [isMultiplayer, matchedPairs, moves, gameStatus]);

  const handleGameEnd = async () => {
    if (gameStatus === 'won') {
      hapticPatterns.levelComplete();
      soundManager.playSound('game_win');
      const timeTaken = getTimeLimit() - timeRemaining;

      const oldRecord = await loadGameRecord('flip_match');
      if (!isMounted.current) return;

      if (!oldRecord || !oldRecord.bestTime || timeTaken < oldRecord.bestTime) {
        setIsNewRecord(true);
      }

      await updateFlipMatchRecord(timeTaken, settings.difficulty, timeTaken);
      updateBestRecord('flip_match', timeTaken);

      // 클라우드 동기화 (로그인 상태일 때만)
      if (user) {
        const record = await loadGameRecord('flip_match');
        if (record) {
          await uploadGameStats('flip_match', {
            bestTime: record.bestTime,
            totalPlays: record.totalPlays,
            totalPlayTime: record.totalPlayTime,
            difficulty: settings.difficulty,
          });
        }
      }

      const newAchievements = await updateStatsOnGamePlayed('flip_match', moves, timeTaken, settings.difficulty);
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
    } else {
      hapticPatterns.errorAction();
      soundManager.playSound('game_lose');

      // Also finish multiplayer game on loss
      if (isMultiplayer) {
        await finishGame();
      }
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
      if (isMounted.current) {
        initializeGame({ difficulty: selectedDifficulty, theme: 'animals' });
      }
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

  const togglePause = () => {
    setIsPaused(!isPaused);
    hapticPatterns.buttonPress();
    soundManager.playSound('button_press');
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
            <Pressable onPress={handleBackToMenu} style={styles.backButton}>
              <ArrowLeft size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={styles.title}>Flip & Match</Text>
            <View style={styles.headerRight}>
              <Pressable
                onPress={togglePause}
                style={styles.pauseButton}
                disabled={gameStatus !== 'playing'}
              >
                <Pause size={24} color={theme.colors.text} />
              </Pressable>
              <Pressable onPress={handleRestart} style={styles.restartButton}>
                <RotateCcw size={24} color={theme.colors.text} />
              </Pressable>
            </View>
          </View>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <View style={styles.statHeader}>
                <Timer size={16} color={theme.colors.textSecondary} />
                <Text style={styles.statLabel}>시간</Text>
              </View>
              <Text style={[styles.statValue, timeRemaining <= 10 && styles.statValueWarning]}>{formatTime(timeRemaining)}</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statHeader}>
                <Move size={16} color={theme.colors.textSecondary} />
                <Text style={styles.statLabel}>이동</Text>
              </View>
              <Text style={styles.statValue}>{moves}</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statHeader}>
                <Grid3X3 size={16} color={theme.colors.textSecondary} />
                <Text style={styles.statLabel}>진행</Text>
              </View>
              <Text style={styles.statValue}>{matchedPairs}/{totalPairs}</Text>
            </View>
            {isMultiplayer && (
              <View
                style={styles.statItem}
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel={`상대방 점수: ${opponentScore}점`}
              >
                <View style={styles.statHeader}>
                  <Trophy size={16} color={theme.colors.textSecondary} />
                  <Text style={styles.statLabel}>상대</Text>
                </View>
                <Animated.Text style={[styles.statValue, opponentScoreAnimatedStyle]}>{opponentScore}</Animated.Text>
              </View>
            )}
          </View>

          {gameStatus === 'preview' && (
            <View style={styles.previewOverlay}>
              <Text style={styles.previewText}>카드를 기억하세요!</Text>
            </View>
          )}
          {gameStatus !== 'ready' && <GameBoard />}
        </ScrollView>

        <Modal visible={showDifficultyModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Grid3X3 size={64} color={theme.colors.primary} style={{ marginBottom: 24 }} />
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
              <Pressable style={styles.startButton} onPress={handleStartGame}>
                <Play size={24} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.startButtonText}>게임 시작</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Modal visible={gameStatus === 'won'} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Trophy size={80} color={theme.colors.warning} style={{ marginBottom: 16 }} />
              <Text style={styles.modalTitle}>완료!</Text>
              {isNewRecord && <Text style={styles.newRecord}>🏆 신기록 달성!</Text>}
              <Text style={styles.victoryStats}>소요 시간: {formatTime(getTimeLimit() - timeRemaining)}</Text>
              <Text style={styles.victoryStats}>이동 횟수: {moves}</Text>
              <Pressable style={styles.startButton} onPress={handleRestart}>
                <RotateCcw size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.startButtonText}>다시 하기</Text>
              </Pressable>
              <Pressable style={styles.menuButton} onPress={handleBackToMenu}>
                <Menu size={20} color={theme.colors.text} style={{ marginRight: 8 }} />
                <Text style={styles.menuButtonText}>메뉴로</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Modal visible={gameStatus === 'lost'} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Timer size={80} color={theme.colors.error} style={{ marginBottom: 16 }} />
              <Text style={styles.modalTitle}>시간 초과!</Text>
              <Text style={styles.victoryStats}>완성: {matchedPairs}/{totalPairs} 쌍</Text>
              <Text style={styles.victoryStats}>이동 횟수: {moves}</Text>
              <Pressable style={styles.startButton} onPress={handleRestart}>
                <RotateCcw size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.startButtonText}>다시 하기</Text>
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
            { label: '남은 시간', value: formatTime(timeRemaining) },
            { label: '이동', value: moves },
            { label: '진행', value: `${matchedPairs}/${totalPairs}` },
          ]}
          onResume={togglePause}
          onRestart={() => {
            setIsPaused(false);
            handleRestart();
          }}
          onQuit={handleBackToMenu}
        />
      </SafeAreaView>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, paddingTop: Platform.OS === 'web' ? 40 : 0 },
  scrollContent: { flexGrow: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  backButton: { padding: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pauseButton: { padding: 8 },
  restartButton: { padding: 8 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.colors.surface, marginHorizontal: 16, borderRadius: 12, marginBottom: 16 },
  statItem: { alignItems: 'center' },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  statLabel: { fontSize: 12, color: theme.colors.textSecondary },
  statValue: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text },
  statValueWarning: { color: theme.colors.error },
  previewOverlay: { position: 'absolute', top: 120, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  previewText: { fontSize: 24, fontWeight: 'bold', color: '#fff', backgroundColor: 'rgba(59, 130, 246, 0.9)', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 },
  modalOverlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 32, width: '80%', maxWidth: 400, alignItems: 'center' },
  modalTitle: { fontSize: 28, fontWeight: 'bold', color: theme.colors.text, marginBottom: 24 },
  difficultyButton: { width: '100%', backgroundColor: theme.colors.surfaceSecondary, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12, marginBottom: 12, alignItems: 'center' },
  difficultyButtonSelected: { backgroundColor: theme.colors.primary },
  difficultyButtonText: { fontSize: 18, fontWeight: '600', color: theme.colors.text },
  startButton: { width: '100%', backgroundColor: theme.colors.success, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12, marginTop: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  startButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  victoryStats: { fontSize: 16, color: theme.colors.textSecondary, marginBottom: 8 },
  newRecord: { fontSize: 20, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 16 },
  menuButton: { width: '100%', backgroundColor: theme.colors.surfaceSecondary, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12, marginTop: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  menuButtonText: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
});

export default FlipMatchGame;