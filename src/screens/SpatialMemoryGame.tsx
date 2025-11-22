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
  Pause
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
import { updateSpatialMemoryRecord, loadGameRecord } from '../utils/statsManager';
import { incrementGameCount } from '../utils/reviewManager';
import { updateStatsOnGamePlayed } from '../utils/achievementManager';
import { useTheme } from '../contexts/ThemeContext';
import { Achievement } from '../data/achievements';
import AchievementUnlockModal from '../components/shared/AchievementUnlockModal';
import { uploadGameStats } from '../utils/cloudSync';
import { useAuth } from '../contexts/AuthContext';
import { MultiplayerProvider, useMultiplayer } from '../contexts/MultiplayerContext';

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
  const { isMultiplayer, opponentScore, updateMyScore, finishGame } = useMultiplayer();
  const {
    gameStatus, currentLevel, initializeGame, startRound, resetGame, settings, pauseGame, resumeGame
  } = useSpatialMemoryStore();

  const { updateBestRecord } = useGameStore();

  const [showDifficultyModal, setShowDifficultyModal] = useState(true);
  const [isPauseMenuVisible, setIsPauseMenuVisible] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [startTime, setStartTime] = useState<number>(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [hasRecordedStats, setHasRecordedStats] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const isMounted = React.useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // 화면이 포커스될 때마다 게임 상태 리셋
  useFocusEffect(
    useCallback(() => {
      resetGame();
      setShowDifficultyModal(true);
      setStartTime(0);
      setIsNewRecord(false);
      setHasRecordedStats(false);
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

    const oldRecord = await loadGameRecord('spatial_memory');
    if (!isMounted.current) return;

    if (!oldRecord || !oldRecord.highestLevel || finalLevel > oldRecord.highestLevel) {
      setIsNewRecord(true);
    }

    const playTime = startTime > 0 ? Math.floor((Date.now() - startTime) / 1000) : 0;
    console.log('🧠 Spatial Memory - Saving stats:', { finalLevel, difficulty: settings.difficulty, playTime, startTime, now: Date.now() });

    await updateSpatialMemoryRecord(finalLevel, settings.difficulty, playTime);
    updateBestRecord('spatial_memory', finalLevel);
    await incrementGameCount();

    // 클라우드 동기화 (로그인 상태일 때만)
    if (user) {
      const record = await loadGameRecord('spatial_memory');
      if (record) {
        await uploadGameStats('spatial_memory', {
          highestLevel: record.highestLevel,
          totalPlays: record.totalPlays,
          totalPlayTime: record.totalPlayTime,
          difficulty: settings.difficulty,
        });
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
      case 'ready': return '준비';
      case 'showing': return '패턴 기억하기...';
      case 'input': return '입력하세요!';
      case 'correct': return '정답!';
      case 'wrong': return '틀렸습니다';
      case 'gameover': return '게임 오버';
      default: return '';
    }
  };

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.background} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={handleBackToMenu} style={styles.backButton}>
            <GlassView style={styles.iconButtonGlass} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
              <ArrowLeft size={24} color={theme.colors.textSecondary} />
            </GlassView>
          </Pressable>
          <View style={styles.titleContainer}>
            <Brain size={24} color={theme.colors.text} style={{ marginRight: 8 }} />
            <Text style={styles.title}>Spatial Memory</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {gameStatus === 'input' ? (
              <Pressable onPress={handlePause} style={styles.restartButton}>
                <GlassView style={styles.iconButtonGlass} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
                  <Pause size={24} color={theme.colors.text} />
                </GlassView>
              </Pressable>
            ) : (
              <Pressable onPress={handleRestart} style={styles.restartButton}>
                <GlassView style={styles.iconButtonGlass} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
                  <RotateCcw size={24} color={theme.colors.text} />
                </GlassView>
              </Pressable>
            )}
          </View>
        </View>

        <GlassView style={styles.stats} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
          <View style={styles.statItem}>
            <Layers size={20} color={theme.colors.textSecondary} style={{ marginBottom: 4 }} />
            <Text style={styles.statValue}>{currentLevel}</Text>
          </View>
          <View style={styles.statItem}>
            <Activity size={20} color={theme.colors.textSecondary} style={{ marginBottom: 4 }} />
            <View style={styles.statusContainer}>
              {getStatusIcon()}
              <Text style={[styles.statValue, styles.statusText, gameStatus === 'wrong' && styles.wrongText, gameStatus === 'correct' && styles.correctText, { marginLeft: getStatusIcon() ? 4 : 0 }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>
          {isMultiplayer ? (
            <View style={styles.statItem} accessible={true} accessibilityRole="text" accessibilityLabel={`상대방 점수: ${opponentScore}점`}>
              <Trophy size={20} color={theme.colors.warning} style={{ marginBottom: 4 }} />
              <Text style={styles.statValue}>{opponentScore}</Text>
            </View>
          ) : (
            <View style={styles.statItem}>
              <Grid3x3 size={20} color={theme.colors.textSecondary} style={{ marginBottom: 4 }} />
              <Text style={styles.statValue}>{settings.difficulty === 'easy' ? '쉬움' : settings.difficulty === 'medium' ? '보통' : '어려움'}</Text>
            </View>
          )}
        </GlassView>

        {gameStatus !== 'ready' && <TileGrid />}

        <Modal visible={showDifficultyModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <GlassView style={styles.modalContent} intensity={30} tint={themeMode === 'dark' ? 'dark' : 'light'}>
              <Grid3x3 size={48} color={theme.colors.primary} style={{ marginBottom: 16 }} />
              <Text style={styles.modalTitle}>난이도 선택</Text>
              <Text style={styles.modalDescription}>깜빡이는 타일의 순서를 기억하세요!{`\n`}레벨이 올라갈수록 더 많은 타일이 깜빡입니다.</Text>

              <Pressable style={[styles.difficultyButton, selectedDifficulty === 'easy' && styles.difficultyButtonSelected, { backgroundColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]} onPress={() => { setSelectedDifficulty('easy'); hapticPatterns.buttonPress(); }}>
                <Text style={[styles.difficultyButtonText, selectedDifficulty === 'easy' && { color: '#fff' }, selectedDifficulty !== 'easy' && { color: theme.colors.text }]}>쉬움 (3×3)</Text>
                <Text style={[styles.difficultySubText, selectedDifficulty === 'easy' && { color: 'rgba(255,255,255,0.8)' }, selectedDifficulty !== 'easy' && { color: theme.colors.textSecondary }]}>레벨 3부터 시작 · 느린 속도</Text>
              </Pressable>

              <Pressable style={[styles.difficultyButton, selectedDifficulty === 'medium' && styles.difficultyButtonSelected, { backgroundColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]} onPress={() => { setSelectedDifficulty('medium'); hapticPatterns.buttonPress(); }}>
                <Text style={[styles.difficultyButtonText, selectedDifficulty === 'medium' && { color: '#fff' }, selectedDifficulty !== 'medium' && { color: theme.colors.text }]}>보통 (4×4)</Text>
                <Text style={[styles.difficultySubText, selectedDifficulty === 'medium' && { color: 'rgba(255,255,255,0.8)' }, selectedDifficulty !== 'medium' && { color: theme.colors.textSecondary }]}>레벨 3부터 시작 · 보통 속도</Text>
              </Pressable>

              <Pressable style={[styles.difficultyButton, selectedDifficulty === 'hard' && styles.difficultyButtonSelected, { backgroundColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]} onPress={() => { setSelectedDifficulty('hard'); hapticPatterns.buttonPress(); }}>
                <Text style={[styles.difficultyButtonText, selectedDifficulty === 'hard' && { color: '#fff' }, selectedDifficulty !== 'hard' && { color: theme.colors.text }]}>어려움 (5×5)</Text>
                <Text style={[styles.difficultySubText, selectedDifficulty === 'hard' && { color: 'rgba(255,255,255,0.8)' }, selectedDifficulty !== 'hard' && { color: theme.colors.textSecondary }]}>레벨 4부터 시작 · 빠른 속도</Text>
              </Pressable>

              <Pressable style={styles.startButton} onPress={handleStartGame}>
                <Play size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.startButtonText}>게임 시작</Text>
              </Pressable>
            </GlassView>
          </View>
        </Modal>

        <Modal visible={gameStatus === 'gameover'} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <GlassView style={styles.modalContent} intensity={30} tint={themeMode === 'dark' ? 'dark' : 'light'}>
              <Brain size={64} color={theme.colors.primary} style={{ marginBottom: 16 }} />
              <Text style={styles.modalTitle}>게임 오버!</Text>
              {isNewRecord && (
                <View style={styles.newRecordContainer}>
                  <Trophy size={24} color={theme.colors.warning} style={{ marginRight: 8 }} />
                  <Text style={styles.newRecord}>신기록 달성!</Text>
                </View>
              )}
              <Text style={styles.finalScore}>최종 레벨: {currentLevel - 1}</Text>
              <Text style={styles.victoryStats}>{currentLevel - 1}개의 타일 순서를 기억했습니다!</Text>
              <Pressable style={styles.startButton} onPress={handleRestart}>
                <RotateCcw size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.startButtonText}>다시 하기</Text>
              </Pressable>
              <Pressable style={[styles.menuButton, { backgroundColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]} onPress={handleBackToMenu}>
                <Menu size={20} color={theme.colors.text} style={{ marginRight: 8 }} />
                <Text style={styles.menuButtonText}>메뉴로</Text>
              </Pressable>
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
  iconButtonGlass: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  backButtonText: { color: theme.colors.textSecondary, fontSize: 16 },
  titleContainer: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text },
  restartButton: { borderRadius: 12, overflow: 'hidden' },
  restartButtonText: { fontSize: 24, color: theme.colors.text },
  stats: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 16, marginHorizontal: 16, borderRadius: 20, marginBottom: 16 },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text },
  statusContainer: { flexDirection: 'row', alignItems: 'center' },
  statusText: { fontSize: 16 },
  wrongText: { color: theme.colors.error },
  correctText: { color: theme.colors.success },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { borderRadius: 24, padding: 32, width: '85%', maxWidth: 400, alignItems: 'center' },
  modalTitle: { fontSize: 28, fontWeight: 'bold', color: theme.colors.text, marginBottom: 12 },
  modalDescription: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  difficultyButton: { width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16, marginBottom: 12, alignItems: 'center' },
  difficultyButtonSelected: { backgroundColor: theme.colors.primary },
  difficultyButtonText: { fontSize: 18, fontWeight: '600', color: theme.colors.text },
  difficultySubText: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 },
  startButton: { flexDirection: 'row', justifyContent: 'center', width: '100%', backgroundColor: theme.colors.success, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16, marginTop: 12, alignItems: 'center' },
  startButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  gameOverEmoji: { fontSize: 64, marginBottom: 16 },
  finalScore: { fontSize: 32, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 8 },
  victoryStats: { fontSize: 16, color: theme.colors.textSecondary, marginBottom: 24, textAlign: 'center' },
  newRecordContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  newRecord: { fontSize: 20, fontWeight: 'bold', color: theme.colors.primary },
  menuButton: { flexDirection: 'row', justifyContent: 'center', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16, marginTop: 8, alignItems: 'center' },
  menuButtonText: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
});

export default SpatialMemoryGame;