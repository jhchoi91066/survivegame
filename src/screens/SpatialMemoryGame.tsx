import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Modal, Platform } from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  RotateCcw,
  Brain,
  Play,
  Menu,
  Trophy,
  Grid3x3,
  Check,
  X,
  Activity,
  Layers,
  Pause,
  Zap,
  Target,
  Flame
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from '../components/shared/GlassView';
import { PauseMenu } from '../components/shared/PauseMenu';
import { RootStackParamList } from '../../App';
import { useSpatialMemoryStore } from '../game/spatialmemory/store';
import { Difficulty } from '../game/spatialmemory/types';
import TileGrid from '../components/spatialmemory/TileGrid';
import { hapticPatterns } from '../utils/haptics';
import { soundManager } from '../utils/soundManager';
import { useGameStore } from '../game/shared/store';
// [C5] statsManager 제거 - Zustand persist로 대체
import { incrementGameCount } from '../utils/reviewManager';
import { updateStatsOnGamePlayed } from '../utils/achievementManager';
import { useTheme } from '../contexts/ThemeContext';
import { Achievement } from '../data/achievements';
import AchievementUnlockModal from '../components/shared/AchievementUnlockModal';
import { uploadGameStats } from '../utils/cloudSync';
import { useAuth } from '../contexts/AuthContext';
import { MultiplayerProvider, useMultiplayer } from '../contexts/MultiplayerContext';
import { showToast } from '../utils/toast'; // [H7][H8] Platform-safe toast
import { useShallow } from 'zustand/react/shallow'; // [H3] Prevent unnecessary re-renders

type SpatialMemoryGameNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SpatialMemoryGame'>;

// Wrapper component for multiplayer support
const SpatialMemoryGame: React.FC = () => {
  const route = useRoute<any>();
  const multiplayerRoomId = route.params?.multiplayerRoomId;

  return (
    <MultiplayerProvider roomId={multiplayerRoomId}>
      <SpatialMemoryGameContent />
    </MultiplayerProvider>
  );
};

const SpatialMemoryGameContent: React.FC = () => {
  const navigation = useNavigation<SpatialMemoryGameNavigationProp>();
  const { theme, themeMode } = useTheme();
  const { user } = useAuth();
  const { isMultiplayer, opponentScore, opponentFinished, updateMyScore, finishGame } = useMultiplayer();

  // [H3] Use shallow comparison to prevent unnecessary re-renders
  const {
    gameStatus, currentLevel, initializeGame, startRound, resetGame, settings, pauseGame, resumeGame, cleanup
  } = useSpatialMemoryStore(
    useShallow(state => ({
      gameStatus: state.gameStatus,
      currentLevel: state.currentLevel,
      initializeGame: state.initializeGame,
      startRound: state.startRound,
      resetGame: state.resetGame,
      settings: state.settings,
      pauseGame: state.pauseGame,
      resumeGame: state.resumeGame,
      cleanup: state.cleanup,
    }))
  );

  const { updateBestRecord, incrementTotalPlays, addPlayTime } = useGameStore();

  const [showDifficultyModal, setShowDifficultyModal] = useState(true);
  const [isPauseMenuVisible, setIsPauseMenuVisible] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [startTime, setStartTime] = useState<number>(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [hasRecordedStats, setHasRecordedStats] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [opponentWon, setOpponentWon] = useState(false);
  const isMounted = React.useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // [C6] 컴포넌트 언마운트 시 모든 타이머 정리
      cleanup();
    };
  }, [cleanup]);

  // Handle opponent finish
  useEffect(() => {
    if (isMultiplayer && opponentFinished && gameStatus !== 'gameover') {
      setOpponentWon(true);
      // Force game over logic
      // Spatial Memory doesn't have a direct "setGameStatus" exposed via store for this, 
      // but we can trigger handleGameOver directly or use cleanup/reset.
      // However, we want to show the modal.
      // Let's assume we can just show the modal and stop the game.
      cleanup(); // Stop the game
      handleGameOver();
    }
  }, [isMultiplayer, opponentFinished, gameStatus, cleanup]);

  // 화면이 포커스될 때마다 게임 상태 리셋
  useFocusEffect(
    useCallback(() => {
      resetGame();
      setShowDifficultyModal(true);
      setStartTime(0);
      setIsNewRecord(false);
      setHasRecordedStats(false);
      setOpponentWon(false);
    }, [resetGame])
  );

  useEffect(() => {
    if (gameStatus === 'showing' && startTime === 0) {
      setStartTime(Date.now());
    }
  }, [gameStatus]);

  // Update multiplayer score when level changes
  useEffect(() => {
    if (isMultiplayer && gameStatus === 'input' && currentLevel > 0) {
      const score = (currentLevel - 1) * 100;
      updateMyScore(score);
    }
  }, [isMultiplayer, currentLevel, gameStatus]);

  useEffect(() => {
    if (gameStatus === 'gameover' && !hasRecordedStats) {
      handleGameOver();
    }
  }, [gameStatus, hasRecordedStats]);

  const handleGameOver = async () => {
    if (hasRecordedStats) return; // 중복 실행 방지

    hapticPatterns.gameOver();
    soundManager.playSound(currentLevel > 1 ? 'game_win' : 'game_lose');
    const finalLevel = currentLevel - 1;

    // Finish multiplayer game
    if (isMultiplayer) {
      await finishGame();
    }

    // [C5] Zustand에서 이전 기록 확인
    const currentBest = useGameStore.getState().globalStats.gamesStats.spatial_memory.bestRecord;
    if (!isMounted.current) return;

    if (!currentBest || finalLevel > (currentBest as number)) {
      setIsNewRecord(true);
    }

    const playTime = startTime > 0 ? Math.floor((Date.now() - startTime) / 1000) : 0;
    console.log('🧠 Spatial Memory - Saving stats:', { finalLevel, difficulty: settings.difficulty, playTime, startTime, now: Date.now() });

    // [C5] Zustand에 업데이트 (persist가 자동 저장)
    updateBestRecord('spatial_memory', finalLevel);
    incrementTotalPlays('spatial_memory');
    addPlayTime('spatial_memory', Math.floor(playTime));
    await incrementGameCount();

    // [H7] 클라우드 동기화 with error handling (로그인 상태일 때만)
    if (user) {
      try {
        const stats = useGameStore.getState().globalStats.gamesStats.spatial_memory;
        await uploadGameStats('spatial_memory', {
          highestLevel: stats.bestRecord as number,
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

    const newAchievements = await updateStatsOnGamePlayed('spatial_memory', finalLevel, playTime, settings.difficulty);
    if (!isMounted.current) return;

    if (newAchievements.length > 0) {
      setUnlockedAchievements(newAchievements);
      soundManager.playSound('achievement');
      setShowAchievementModal(true);
    }

    setHasRecordedStats(true);
  };

  const handleStartGame = () => {
    setIsNewRecord(false);
    setStartTime(0);
    setHasRecordedStats(false);
    const difficultySettings = {
      easy: { difficulty: 'easy' as Difficulty, flashSpeed: 600, startingLevel: 3 },
      medium: { difficulty: 'medium' as Difficulty, flashSpeed: 500, startingLevel: 3 },
      hard: { difficulty: 'hard' as Difficulty, flashSpeed: 400, startingLevel: 4 },
    };
    initializeGame(difficultySettings[selectedDifficulty]);
    setShowDifficultyModal(false);
    hapticPatterns.buttonPress();
    setTimeout(() => {
      if (isMounted.current) {
        startRound();
      }
    }, 500);
  };

  const handleRestart = () => {
    setIsNewRecord(false);
    setStartTime(0);
    setHasRecordedStats(false);
    setShowDifficultyModal(true);
    resetGame();
    hapticPatterns.buttonPress();
  };

  const handleBackToMenu = () => {
    hapticPatterns.buttonPress();
    navigation.goBack();
  };

  const handlePause = () => {
    hapticPatterns.buttonPress();
    pauseGame();
    setIsPauseMenuVisible(true);
  };

  const handleResume = () => {
    hapticPatterns.buttonPress();
    resumeGame();
    setIsPauseMenuVisible(false);
  };

  const handleQuit = () => {
    hapticPatterns.buttonPress();
    setIsPauseMenuVisible(false);
    resetGame();
    navigation.goBack();
  };

  const getStatusIcon = () => {
    switch (gameStatus) {
      case 'correct': return <Check size={20} color={theme.colors.success} />;
      case 'wrong': return <X size={20} color={theme.colors.error} />;
      default: return null;
    }
  };

  const getStatusText = () => {
    switch (gameStatus) {
      case 'ready': return 'Ready';
      case 'showing': return 'Watch...';
      case 'input': return 'Your Turn!';
      case 'correct': return 'Correct!';
      case 'wrong': return 'Wrong!';
      case 'gameover': return 'Game Over';
      default: return '';
    }
  };

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.spatialMemory} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={handleBackToMenu} style={styles.backButton}>
            <GlassView style={styles.iconButtonGlass} intensity={20} tint="light">
              <ArrowLeft size={24} color="#fff" />
            </GlassView>
          </Pressable>
          <View style={styles.titleContainer}>
            <Brain size={24} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.title}>Spatial Memory</Text>
          </View>
          <View style={{ width: 40 }}>
            {gameStatus === 'input' && (
              <Pressable onPress={handlePause} style={styles.backButton}>
                <GlassView style={styles.iconButtonGlass} intensity={20} tint="light">
                  <Pause size={24} color="#fff" />
                </GlassView>
              </Pressable>
            )}
          </View>
        </View>

        <GlassView style={styles.stats} intensity={20} tint="light">
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>LEVEL</Text>
            <Text style={styles.statValue}>{currentLevel}</Text>
          </View>
          {isMultiplayer && (
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>OPPONENT</Text>
              <Text style={[styles.statValue, { color: '#fbbf24' }]}>{opponentScore}</Text>
            </View>
          )}
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>STATUS</Text>
            <View style={styles.statusContainer}>
              {getStatusIcon()}
              <Text style={[styles.statValue, styles.statusText, gameStatus === 'wrong' && styles.wrongText, gameStatus === 'correct' && styles.correctText, { marginLeft: getStatusIcon() ? 4 : 0 }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>
        </GlassView>

        {gameStatus !== 'ready' && <TileGrid />}

        <Modal visible={showDifficultyModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <GlassView style={styles.modalContent} intensity={30} tint="light">
              <View style={styles.iconContainer}>
                <Brain size={48} color="#fff" />
              </View>
              <Text style={styles.modalTitle}>Spatial Memory</Text>
              <Text style={styles.modalDescription}>반짝이는 타일의 순서를 기억하세요!</Text>

              <Pressable style={[styles.difficultyButton, selectedDifficulty === 'easy' && styles.difficultyButtonSelected]} onPress={() => { setSelectedDifficulty('easy'); hapticPatterns.buttonPress(); }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Zap size={20} color={selectedDifficulty === 'easy' ? theme.colors.primary : '#fff'} style={{ marginRight: 8 }} />
                  <Text style={[styles.difficultyButtonText, selectedDifficulty === 'easy' && { color: theme.colors.primary }]}>쉬움</Text>
                </View>
                <Text style={[styles.difficultySubText, selectedDifficulty === 'easy' && { color: theme.colors.primary }]}>3x3 격자 · 느림</Text>
              </Pressable>

              <Pressable style={[styles.difficultyButton, selectedDifficulty === 'medium' && styles.difficultyButtonSelected]} onPress={() => { setSelectedDifficulty('medium'); hapticPatterns.buttonPress(); }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Target size={20} color={selectedDifficulty === 'medium' ? theme.colors.primary : '#fff'} style={{ marginRight: 8 }} />
                  <Text style={[styles.difficultyButtonText, selectedDifficulty === 'medium' && { color: theme.colors.primary }]}>보통</Text>
                </View>
                <Text style={[styles.difficultySubText, selectedDifficulty === 'medium' && { color: theme.colors.primary }]}>4x4 격자 · 보통</Text>
              </Pressable>

              <Pressable style={[styles.difficultyButton, selectedDifficulty === 'hard' && styles.difficultyButtonSelected]} onPress={() => { setSelectedDifficulty('hard'); hapticPatterns.buttonPress(); }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Flame size={20} color={selectedDifficulty === 'hard' ? theme.colors.primary : '#fff'} style={{ marginRight: 8 }} />
                  <Text style={[styles.difficultyButtonText, selectedDifficulty === 'hard' && { color: theme.colors.primary }]}>어려움</Text>
                </View>
                <Text style={[styles.difficultySubText, selectedDifficulty === 'hard' && { color: theme.colors.primary }]}>5x5 격자 · 빠름</Text>
              </Pressable>

              <Pressable style={styles.startButton} onPress={handleStartGame}>
                <Play size={20} color={theme.colors.success} style={{ marginRight: 8 }} />
                <Text style={styles.startButtonText}>게임 시작</Text>
              </Pressable>
            </GlassView>
          </View>
        </Modal>

        <Modal visible={gameStatus === 'gameover' || opponentWon} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <GlassView style={styles.modalContent} intensity={30} tint="light">
              <View style={styles.iconContainer}>
                <Brain size={48} color="#fff" />
              </View>
              <Text style={styles.modalTitle}>
                {opponentWon ? 'Opponent Won!' : 'Game Over!'}
              </Text>

              <View style={styles.resultStats}>
                <Text style={styles.resultLabel}>
                  {opponentWon ? '상대방이 먼저 끝냈습니다' : 'Final Level'}
                </Text>
                <Text style={styles.resultScore}>{currentLevel - 1}</Text>
                {isNewRecord && !opponentWon && (
                  <View style={styles.newRecordBadge}>
                    <Trophy size={14} color="#f59e0b" style={{ marginRight: 4 }} />
                    <Text style={styles.newRecordText}>New Record!</Text>
                  </View>
                )}
              </View>

              <View style={styles.modalButtons}>
                <Pressable style={styles.menuButton} onPress={handleBackToMenu}>
                  <Text style={styles.menuButtonText}>Menu</Text>
                </Pressable>
                <Pressable style={styles.retryButton} onPress={handleRestart}>
                  <RotateCcw size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.retryButtonText}>Retry</Text>
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
          visible={isPauseMenuVisible}
          gameStats={[
            { label: '현재 레벨', value: `${currentLevel}` },
            { label: '난이도', value: settings.difficulty === 'easy' ? '쉬움' : settings.difficulty === 'medium' ? '보통' : '어려움' },
          ]}
          onResume={handleResume}
          onRestart={() => {
            setIsPauseMenuVisible(false);
            handleRestart();
          }}
          onQuit={handleQuit}
        />
      </SafeAreaView>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, paddingTop: Platform.OS === 'web' ? 40 : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  backButton: { borderRadius: 12, overflow: 'hidden' },
  iconButtonGlass: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)' },
  titleContainer: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { borderRadius: 32, padding: 32, width: '100%', maxWidth: 400, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 4, borderColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 36, fontWeight: '900', color: '#fff', marginBottom: 8, letterSpacing: -1 },
  modalDescription: { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 32, lineHeight: 24 },

  difficultyButton: { width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 20, marginBottom: 12, alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  difficultyButtonSelected: { backgroundColor: '#fff', borderColor: '#fff' },
  difficultyButtonText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  difficultySubText: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },

  startButton: { flexDirection: 'row', justifyContent: 'center', width: '100%', backgroundColor: '#fff', paddingVertical: 18, borderRadius: 20, marginTop: 12, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  startButtonText: { fontSize: 20, fontWeight: '900', color: theme.colors.success },

  // Game Styles
  stats: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, marginHorizontal: 16, borderRadius: 24, marginBottom: 24, backgroundColor: 'rgba(15, 23, 42, 0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statItem: { alignItems: 'flex-start' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  statValue: { fontSize: 32, fontWeight: '900', color: '#fff' },
  statusContainer: { flexDirection: 'row', alignItems: 'center' },
  statusText: { fontSize: 24, fontWeight: '900', color: '#fff' },
  wrongText: { color: '#ef4444' },
  correctText: { color: '#34d399' },

  // Result Modal
  resultStats: { alignItems: 'center', marginBottom: 32 },
  resultLabel: { fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  resultScore: { fontSize: 64, fontWeight: '900', color: '#a855f7', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 10 },
  newRecordBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginTop: 8 },
  newRecordText: { color: '#f59e0b', fontWeight: '700', fontSize: 12 },

  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  menuButton: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: 'rgba(30, 41, 59, 0.8)', alignItems: 'center' },
  menuButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  retryButton: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: '#a855f7', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', shadowColor: "#a855f7", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  retryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default SpatialMemoryGame;