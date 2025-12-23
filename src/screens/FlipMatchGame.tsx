import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useFlipMatchStore } from '../game/flipmatch/store';
import { Difficulty } from '../game/flipmatch/types';
import GameBoard from '../components/flipmatch/GameBoard';
import { hapticPatterns } from '../utils/haptics';
import { soundManager } from '../utils/soundManager';
import { useGameStore } from '../game/shared/store';
// [C5] statsManager 제거 - Zustand persist로 대체
import { incrementGameCount } from '../utils/reviewManager';
import { useTheme } from '../contexts/ThemeContext';
import { updateStatsOnGamePlayed } from '../utils/achievementManager';
import { Achievement } from '../data/achievements';
import AchievementUnlockModal from '../components/shared/AchievementUnlockModal';
import { uploadGameStats } from '../utils/cloudSync';
import { useAuth } from '../contexts/AuthContext';
import { PauseMenu } from '../components/shared/PauseMenu';
import { MultiplayerProvider, useMultiplayer } from '../contexts/MultiplayerContext';
import { showToast } from '../utils/toast'; // [H7][H8] Platform-safe toast
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from '../components/shared/GlassView';
import {
  ArrowLeft,
  Pause,
  RotateCcw,
  Trophy,
  Timer,
  Brain,
  Play,
  Menu,
  Move,
  Star,
  RefreshCw
} from 'lucide-react-native';
import { useShallow } from 'zustand/react/shallow'; // [H3] Prevent unnecessary re-renders

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
  const { theme, themeMode } = useTheme();
  const { user } = useAuth();
  const { isMultiplayer, opponentScore, opponentFinished, gameResult, elapsedTime, updateMyScore, finishGame } = useMultiplayer();

  // [H3] Use shallow comparison to prevent unnecessary re-renders
  const {
    gameStatus, moves, matchedPairs, totalPairs, timeRemaining, initializeGame, resetGame, decrementTime, settings, setGameStatus
  } = useFlipMatchStore(
    useShallow(state => ({
      gameStatus: state.gameStatus,
      moves: state.moves,
      matchedPairs: state.matchedPairs,
      totalPairs: state.totalPairs,
      timeRemaining: state.timeRemaining,
      initializeGame: state.initializeGame,
      resetGame: state.resetGame,
      decrementTime: state.decrementTime,
      settings: state.settings,
      setGameStatus: state.setGameStatus,
    }))
  );

  const { updateBestRecord, incrementTotalPlays, addPlayTime } = useGameStore();

  const [showDifficultyModal, setShowDifficultyModal] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [opponentWon, setOpponentWon] = useState(false);

  // Animation values for score updates
  const opponentScoreScale = useSharedValue(1);
  const opponentScoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: opponentScoreScale.value }],
  }));

  const isMounted = React.useRef(true);

  // Helper function to get time limit based on difficulty
  const getTimeLimit = (): number => {
    const limits = { easy: 120, medium: 90, hard: 60 };
    return limits[settings.difficulty];
  };

  // Calculate display time: use synchronized time in multiplayer, local time otherwise
  const displayTime = isMultiplayer && gameStatus === 'playing'
    ? Math.max(0, getTimeLimit() - elapsedTime)
    : timeRemaining;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Prevent refresh during multiplayer game
  useEffect(() => {
    if (!isMultiplayer) return;

    if (Platform.OS === 'web') {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '멀티플레이어 게임 중입니다. 정말로 나가시겠습니까?';
        return '멀티플레이어 게임 중입니다. 정말로 나가시겠습니까?';
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [isMultiplayer]);

  // Animate opponent score when it changes
  useEffect(() => {
    if (isMultiplayer && opponentScore > 0) {
      opponentScoreScale.value = withSequence(
        withSpring(1.3, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 12 })
      );
    }
  }, [opponentScore, isMultiplayer]);

  // Handle opponent finish
  useEffect(() => {
    if (isMultiplayer && opponentFinished && gameStatus === 'playing') {
      setOpponentWon(true);
      setGameStatus('lost'); // Force game end
      hapticPatterns.errorAction();
      soundManager.playSound('game_lose');
      finishGame(); // Mark myself as finished too
    }
  }, [isMultiplayer, opponentFinished, gameStatus, setGameStatus, finishGame]);

  // 화면이 포커스될 때마다 게임 상태 리셋
  useFocusEffect(
    useCallback(() => {
      resetGame();
      setShowDifficultyModal(true);
      setIsNewRecord(false);
      setOpponentWon(false);
    }, [resetGame])
  );

  useEffect(() => {
    if (gameStatus === 'playing' && !isPaused && !isMultiplayer) {
      // Only use local timer for single player
      const interval = setInterval(() => { decrementTime(); }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameStatus, isPaused, isMultiplayer]);

  // Handle multiplayer timer timeout
  useEffect(() => {
    if (isMultiplayer && gameStatus === 'playing' && displayTime <= 0) {
      setGameStatus('lost');
    }
  }, [isMultiplayer, gameStatus, displayTime, setGameStatus]);

  useEffect(() => {
    if (gameStatus === 'won' || gameStatus === 'lost') {
      handleGameEnd();
    }
  }, [gameStatus]);

  // Update multiplayer score when pairs are matched
  useEffect(() => {
    if (isMultiplayer && gameStatus === 'playing') {
      // Use matchedPairs directly for real-time progress tracking
      updateMyScore(matchedPairs);
    }
  }, [isMultiplayer, matchedPairs, gameStatus, updateMyScore]);

  const handleGameEnd = async () => {
    if (gameStatus === 'won') {
      hapticPatterns.levelComplete();
      soundManager.playSound('game_win');
      const timeTaken = getTimeLimit() - timeRemaining;

      // [C5] Zustand에서 이전 기록 확인
      const currentBest = useGameStore.getState().globalStats.gamesStats.flip_match.bestRecord;
      if (!isMounted.current) return;

      if (!currentBest || timeTaken < (currentBest as number)) {
        setIsNewRecord(true);
      }

      // [C5] Zustand에 업데이트 (persist가 자동 저장)
      updateBestRecord('flip_match', timeTaken);
      incrementTotalPlays('flip_match');
      addPlayTime('flip_match', Math.floor(timeTaken));

      // [H7] 클라우드 동기화 with error handling (로그인 상태일 때만)
      if (user) {
        try {
          const stats = useGameStore.getState().globalStats.gamesStats.flip_match;
          await uploadGameStats('flip_match', {
            bestTime: stats.bestRecord as number,
            totalPlays: stats.totalPlays,
            totalPlayTime: stats.totalPlayTime,
            difficulty: settings.difficulty,
          });
        } catch (error) {
          console.error('Failed to upload game stats:', error);
          showToast({
            type: 'error',
            text1: '저장 실패',
            text2: '게임 기록을 클라우드에 저장하지 못했습니다.',
            visibilityTime: 3000,
          });
          // 로컬에는 이미 저장됨 (Zustand persist)
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
      // Game Lost (Time up or Opponent won)
      if (!opponentWon) {
        hapticPatterns.errorAction();
        soundManager.playSound('game_lose');
      }

      // Also finish multiplayer game on loss
      if (isMultiplayer) {
        await finishGame();
      }
    }
    await incrementGameCount();
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
      <LinearGradient colors={theme.gradients.flipMatch} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={handleBackToMenu} style={styles.backButton}>
            <GlassView style={styles.iconButtonGlass} intensity={20} tint="light">
              <ArrowLeft size={24} color="#fff" />
            </GlassView>
          </Pressable>
          <View style={styles.titleContainer}>
            <Brain size={24} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.title}>Flip & Match</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              onPress={togglePause}
              style={styles.pauseButton}
              disabled={gameStatus !== 'playing'}
            >
              <GlassView style={styles.iconButtonGlass} intensity={20} tint="light">
                {isPaused ? (
                  <Play size={24} color="#fff" />
                ) : (
                  <Pause size={24} color="#fff" />
                )}
              </GlassView>
            </Pressable>
            <Pressable onPress={handleRestart} style={styles.restartButton}>
              <GlassView style={styles.iconButtonGlass} intensity={20} tint="light">
                <RotateCcw size={24} color="#fff" />
              </GlassView>
            </Pressable>
          </View>
        </View>

        {gameStatus !== 'ready' && (
          <View style={styles.gameContent}>
            <GlassView style={styles.stats} intensity={20} tint="light">
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>MOVES</Text>
                <Text style={styles.statValue}>{moves}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>MATCHES</Text>
                <Text style={styles.statValue}>
                  <Text style={{ color: '#34d399' }}>{matchedPairs}</Text>
                  <Text style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)' }}> / {totalPairs}</Text>
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>TIME</Text>
                <Text style={[styles.statValue, displayTime <= 10 && styles.statValueWarning]}>{formatTime(displayTime)}</Text>
              </View>
            </GlassView>

            {isMultiplayer && (
              <Animated.View style={[opponentScoreAnimatedStyle, { marginHorizontal: 16, marginBottom: 16 }]}>
                <GlassView style={styles.opponentScore} intensity={25} tint="light">
                  <View style={styles.opponentScoreContent}>
                    <Text style={styles.opponentLabel}>상대방 진행률</Text>
                    <Text style={styles.opponentValue}>
                      <Text style={{ color: '#fbbf24' }}>{opponentScore}</Text>
                      <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}> / {totalPairs}</Text>
                    </Text>
                    {opponentFinished && (
                      <Text style={styles.opponentFinishedBadge}>✓ 완료</Text>
                    )}
                  </View>
                </GlassView>
              </Animated.View>
            )}

            {gameStatus === 'preview' && (
              <View style={styles.previewOverlay}>
                <GlassView style={styles.previewGlass} intensity={40} tint="light">
                  <Text style={styles.previewText}>카드의 위치를 기억하세요!</Text>
                </GlassView>
              </View>
            )}

            <View style={styles.boardContainer}>
              <GameBoard />
            </View>
          </View>
        )}

        <Modal visible={showDifficultyModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <GlassView style={styles.modalContent} intensity={30} tint="light">
              <View style={styles.iconContainer}>
                <Brain size={48} color="#fff" />
              </View>
              <Text style={styles.modalTitle}>Flip & Match</Text>
              <Text style={styles.modalDescription}>Find all matching pairs with the fewest moves possible.</Text>

              <Pressable style={[styles.difficultyButton, selectedDifficulty === 'easy' && styles.difficultyButtonSelected]} onPress={() => { setSelectedDifficulty('easy'); hapticPatterns.buttonPress(); }}>
                <Text style={[styles.difficultyButtonText, selectedDifficulty === 'easy' && { color: theme.colors.primary }]}>Easy (4x4)</Text>
              </Pressable>
              <Pressable style={[styles.difficultyButton, selectedDifficulty === 'medium' && styles.difficultyButtonSelected]} onPress={() => { setSelectedDifficulty('medium'); hapticPatterns.buttonPress(); }}>
                <Text style={[styles.difficultyButtonText, selectedDifficulty === 'medium' && { color: theme.colors.primary }]}>Medium (6x4)</Text>
              </Pressable>
              <Pressable style={[styles.difficultyButton, selectedDifficulty === 'hard' && styles.difficultyButtonSelected]} onPress={() => { setSelectedDifficulty('hard'); hapticPatterns.buttonPress(); }}>
                <Text style={[styles.difficultyButtonText, selectedDifficulty === 'hard' && { color: theme.colors.primary }]}>Hard (8x4)</Text>
              </Pressable>

              <Pressable style={styles.startButton} onPress={handleStartGame}>
                <Play size={24} color={theme.colors.warning} style={{ marginRight: 8 }} />
                <Text style={styles.startButtonText}>Start Game</Text>
              </Pressable>
            </GlassView>
          </View>
        </Modal>

        <Modal visible={gameStatus === 'won'} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <GlassView style={styles.modalContent} intensity={30} tint="light">
              <View style={[styles.iconContainer, { backgroundColor: '#10b981', borderColor: '#059669' }]}>
                <Star size={48} color="#fff" fill="#fff" />
              </View>
              <Text style={styles.modalTitle}>
                {isMultiplayer && gameResult === 'win' ? 'YOU WIN! 🏆' : isMultiplayer && gameResult === 'tie' ? "IT'S A TIE! 🤝" : 'Level Complete!'}
              </Text>
              <Text style={styles.modalDescription}>
                {isMultiplayer && gameResult === 'win'
                  ? '상대방보다 먼저 완성했습니다!'
                  : isMultiplayer && gameResult === 'tie'
                    ? '동시에 완성했습니다!'
                    : `Perfect memory! You finished in ${moves} moves.`
                }
              </Text>

              {isNewRecord && !isMultiplayer && (
                <View style={styles.newRecordBadge}>
                  <Trophy size={16} color="#f59e0b" style={{ marginRight: 4 }} />
                  <Text style={styles.newRecordText}>New Record!</Text>
                </View>
              )}

              <View style={styles.modalButtons}>
                <Pressable style={styles.menuButton} onPress={handleBackToMenu}>
                  <Text style={styles.menuButtonText}>Menu</Text>
                </Pressable>
                <Pressable style={styles.retryButton} onPress={handleRestart}>
                  <RefreshCw size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.retryButtonText}>Play Again</Text>
                </Pressable>
              </View>
            </GlassView>
          </View>
        </Modal>

        <Modal visible={gameStatus === 'lost'} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <GlassView style={styles.modalContent} intensity={30} tint="light">
              <View style={[styles.iconContainer, { backgroundColor: '#ef4444', borderColor: '#b91c1c' }]}>
                <Timer size={48} color="#fff" />
              </View>
              <Text style={styles.modalTitle}>
                {isMultiplayer && gameResult === 'lose' ? 'YOU LOSE! 💔' : opponentWon ? 'Opponent Won!' : "Time's Up!"}
              </Text>
              <Text style={styles.modalDescription}>
                {isMultiplayer && gameResult === 'lose'
                  ? '상대방이 먼저 완성했습니다.'
                  : opponentWon
                    ? '상대방이 먼저 게임을 끝냈습니다.'
                    : `Matches: ${matchedPairs}/${totalPairs}\nMoves: ${moves}`
                }
              </Text>

              <View style={styles.modalButtons}>
                <Pressable style={styles.menuButton} onPress={handleBackToMenu}>
                  <Text style={styles.menuButtonText}>Menu</Text>
                </Pressable>
                <Pressable style={styles.retryButton} onPress={handleRestart}>
                  <RefreshCw size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </Pressable>
              </View>
            </GlassView>
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
            { label: '남은 시간', value: formatTime(displayTime) },
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
  gameContent: { flex: 1, paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  backButton: { borderRadius: 12, overflow: 'hidden' },
  iconButtonGlass: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)' },
  titleContainer: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pauseButton: { borderRadius: 12, overflow: 'hidden' },
  restartButton: { borderRadius: 12, overflow: 'hidden' },

  stats: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, marginHorizontal: 16, borderRadius: 24, marginBottom: 24, backgroundColor: 'rgba(15, 23, 42, 0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statItem: { alignItems: 'flex-start' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  statValue: { fontSize: 32, fontWeight: '900', color: '#fff' },
  statValueWarning: { color: '#ef4444' },

  previewOverlay: { alignItems: 'center', marginBottom: 16, zIndex: 10 },
  previewGlass: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 16, backgroundColor: 'rgba(59, 130, 246, 0.8)' },
  previewText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },

  boardContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { borderRadius: 32, padding: 32, width: '100%', maxWidth: 400, alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.9)' },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(249, 115, 22, 0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 4, borderColor: 'rgba(249, 115, 22, 0.1)' },
  modalTitle: { fontSize: 36, fontWeight: '900', color: '#fff', marginBottom: 8, letterSpacing: -1 },
  modalDescription: { fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 32, lineHeight: 24 },

  difficultyButton: { width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 20, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  difficultyButtonSelected: { backgroundColor: '#fff', borderColor: '#fff' },
  difficultyButtonText: { fontSize: 18, fontWeight: '700', color: '#fff' },

  startButton: { flexDirection: 'row', justifyContent: 'center', width: '100%', backgroundColor: '#fff', paddingVertical: 18, borderRadius: 20, marginTop: 12, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  startButtonText: { fontSize: 20, fontWeight: '900', color: theme.colors.warning },

  newRecordBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 24 },
  newRecordText: { color: '#f59e0b', fontWeight: '700', fontSize: 12 },

  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  menuButton: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: 'rgba(30, 41, 59, 0.8)', alignItems: 'center' },
  menuButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  retryButton: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: '#10b981', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', shadowColor: "#10b981", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  retryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  opponentScore: { borderRadius: 16, padding: 16, backgroundColor: 'rgba(15, 23, 42, 0.6)', borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.3)' },
  opponentScoreContent: { alignItems: 'center' },
  opponentLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginBottom: 4 },
  opponentValue: { fontSize: 24, fontWeight: '900', color: '#fff' },
  opponentFinishedBadge: { fontSize: 14, color: '#10b981', fontWeight: '700', marginTop: 4 },
});

export default FlipMatchGame;