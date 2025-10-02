import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Text, ScrollView, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import GameBoard from '../game/GameBoard';
import { useGameStore } from '../game/store';
import SurvivorStatusBar from '../components/SurvivorStatusBar';
import ResourcePanel from '../components/ResourcePanel';
import GameTimer from '../components/GameTimer';
import WeatherDisplay from '../components/WeatherDisplay';
import GameOverModal from '../components/GameOverModal';
import TutorialOverlay from '../components/TutorialOverlay';
import ObstacleRemovalModal from '../components/ObstacleRemovalModal';
import PlanningTimer from '../components/PlanningTimer';
import Toast, { ToastType } from '../components/Toast';
import AchievementUnlockedModal from '../components/AchievementUnlockedModal';
import { TUTORIAL_STEPS } from '../data/tutorialSteps';
import { getLevelData } from '../data/levelData';
import { recordLevelCompletion, isLevelUnlocked } from '../utils/progressManager';
import { updateStatsOnLevelComplete, updateStatsOnSynergyDiscovered } from '../utils/achievementManager';
import { Achievement } from '../data/achievements';
import { hapticPatterns } from '../utils/haptics';
import { RootStackParamList } from '../../App';
import { ObstacleState } from '../game/obstacles';
import { RemovalMethod } from '../game/obstacles';

const TUTORIAL_KEY = '@tutorial_completed';

type GameScreenRouteProp = RouteProp<RootStackParamList, 'Game'>;
type GameScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Game'>;

const GameScreen: React.FC = () => {
  const route = useRoute<GameScreenRouteProp>();
  const navigation = useNavigation<GameScreenNavigationProp>();
  const levelId = route.params?.level || 1;

  const survivors = useGameStore((state) => state.survivors);
  const resources = useGameStore((state) => state.resources);
  const gameStatus = useGameStore((state) => state.gameStatus);
  const startGame = useGameStore((state) => state.startGame);
  const checkVictoryCondition = useGameStore((state) => state.checkVictoryCondition);
  const checkDefeatCondition = useGameStore((state) => state.checkDefeatCondition);
  const initializeLevel = useGameStore((state) => state.initializeLevel);
  const timeRemaining = useGameStore((state) => state.timeRemaining);
  const currentLevelId = useGameStore((state) => state.currentLevelId);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const updateRealTimeEffects = useGameStore((state) => state.updateRealTimeEffects);

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [levelConfig, setLevelConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedObstacle, setSelectedObstacle] = useState<ObstacleState | null>(null);
  const [showObstacleModal, setShowObstacleModal] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('info');
  const [showGuide, setShowGuide] = useState(true);
  const [selectedSurvivor, setSelectedSurvivor] = useState<any>(null);
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);

  // Initialize level data
  useEffect(() => {
    const loadLevel = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const config = getLevelData(levelId);
        if (!config) {
          setError(`레벨 ${levelId}을(를) 찾을 수 없습니다`);
          return;
        }

        setLevelConfig(config);
        initializeLevel(config);
      } catch (err) {
        console.error('레벨 로딩 오류:', err);
        setError('레벨을 불러오는 중 오류가 발생했습니다');
      } finally {
        setIsLoading(false);
      }
    };

    loadLevel();
  }, [levelId]);

  useEffect(() => {
    // Check if tutorial has been completed
    const checkTutorial = async () => {
      try {
        const completed = await AsyncStorage.getItem(TUTORIAL_KEY);
        if (!completed) {
          setShowTutorial(true);
        }
      } catch (error) {
        console.error('Error checking tutorial status:', error);
      }
    };

    checkTutorial();
  }, []);

  useEffect(() => {
    // Auto-start game on mount (but not during tutorial)
    if (gameStatus === 'idle' && !showTutorial && levelConfig) {
      startGame();
    }
  }, [gameStatus, showTutorial, levelConfig]);

  // Handle victory and save progress
  useEffect(() => {
    const handleVictory = async () => {
      if (gameStatus === 'victory' && currentLevelId && levelConfig) {
        // 진행도 저장
        const stars = await recordLevelCompletion(
          currentLevelId,
          timeRemaining,
          levelConfig.starThresholds
        );

        // 업적 체크
        const timeUsed = levelConfig.timeLimit - timeRemaining;
        const chainReactionCount = useGameStore.getState().chainReactionEvents.length;
        const initialRes = useGameStore.getState().initialResources;
        const currentRes = useGameStore.getState().resources;
        const resourcesUsed =
          (initialRes.tool - currentRes.tool) +
          (initialRes.water - currentRes.water) +
          (initialRes.explosive - currentRes.explosive);

        const survivorsUsed = survivors
          .filter(s => s.used)
          .map(s => s.role);

        const newAchievements = await updateStatsOnLevelComplete(
          currentLevelId,
          stars,
          timeUsed,
          resourcesUsed,
          survivorsUsed,
          chainReactionCount
        );

        // 새로 달성한 업적이 있으면 표시
        if (newAchievements.length > 0) {
          setTimeout(() => {
            hapticPatterns.achievementUnlocked();
            setUnlockedAchievement(newAchievements[0]);
            setShowAchievementModal(true);
          }, 1000);
        }

        // 레벨 클리어 햅틱
        hapticPatterns.levelComplete();
      }
    };

    handleVictory();
  }, [gameStatus, currentLevelId, timeRemaining, levelConfig, survivors]);

  // Handle defeat
  useEffect(() => {
    if (gameStatus === 'defeat') {
      hapticPatterns.gameOver();
    }
  }, [gameStatus]);

  // 실시간 효과 업데이트 (실행 단계에서만)
  useEffect(() => {
    if (gamePhase === 'planning' || gameStatus !== 'playing') return;

    const interval = setInterval(() => {
      updateRealTimeEffects();
    }, 1000);

    return () => clearInterval(interval);
  }, [gamePhase, gameStatus, updateRealTimeEffects]);


  const handleRestart = () => {
    if (levelConfig) {
      initializeLevel(levelConfig);
      startGame();
    }
  };

  const handleTutorialNext = () => {
    setTutorialStep((prev) => prev + 1);
  };

  const handleTutorialSkip = async () => {
    await AsyncStorage.setItem(TUTORIAL_KEY, 'true');
    setShowTutorial(false);
    startGame();
  };

  const handleTutorialComplete = async () => {
    await AsyncStorage.setItem(TUTORIAL_KEY, 'true');
    setShowTutorial(false);
    startGame();
  };

  const handleNextLevel = async () => {
    const nextLevelId = levelId + 1;
    const unlocked = await isLevelUnlocked(nextLevelId);

    if (unlocked) {
      navigation.replace('Game', { level: nextLevelId });
    } else {
      // Next level not unlocked, go to level select
      navigation.navigate('LevelSelect');
    }
  };

  const handleMainMenu = () => {
    navigation.navigate('Menu');
  };

  const handleObstacleClick = (obstacle: ObstacleState) => {
    // 가이드가 표시 중이면 장애물 클릭 무시
    if (showGuide) return;

    hapticPatterns.obstacleSelect();
    setSelectedObstacle(obstacle);
    setShowObstacleModal(true);
  };

  const handleCloseObstacleModal = () => {
    setShowObstacleModal(false);
    setSelectedObstacle(null);
  };

  const showToast = (message: string, type: ToastType = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleSynergyDiscovered = async (synergyId: string, synergyName: string, synergyDescription: string) => {
    const addDiscoveredSynergy = useGameStore.getState().addDiscoveredSynergy;
    const discoveredSynergies = useGameStore.getState().discoveredSynergies;

    // 이미 발견한 시너지인지 확인
    if (!discoveredSynergies.includes(synergyId)) {
      addDiscoveredSynergy(synergyId);
      hapticPatterns.synergyDiscovered();
      showToast(`🎉 ${synergyName} 시너지 발견!\n${synergyDescription}`, 'success');

      // 업적 업데이트
      const newAchievements = await updateStatsOnSynergyDiscovered();
      if (newAchievements.length > 0) {
        setTimeout(() => {
          setUnlockedAchievement(newAchievements[0]);
          setShowAchievementModal(true);
        }, 2000);
      }
    } else {
      showToast(`${synergyName}\n${synergyDescription}`, 'info');
    }
  };

  const handleSelectMethod = (method: RemovalMethod, survivorIds?: string[]) => {
    if (selectedObstacle) {
      // 안개 정찰인 경우
      if (selectedObstacle.type === 'fog' && method.type === 'survivor_child') {
        const scoutFog = useGameStore.getState().scoutFog;
        const childSurvivorId = survivorIds && survivorIds.length > 0 ? survivorIds[0] : null;

        if (childSurvivorId) {
          const success = scoutFog(selectedObstacle.id, childSurvivorId);
          if (success) {
            hapticPatterns.obstacleRemove();
            handleCloseObstacleModal();
            showToast('안개를 정찰했습니다!', 'success');
          } else {
            hapticPatterns.errorAction();
            showToast('정찰에 실패했습니다', 'error');
          }
        }
      } else {
        // 일반 장애물 제거
        const removeObstacleWithMethod = useGameStore.getState().removeObstacleWithMethod;
        const success = removeObstacleWithMethod(selectedObstacle.id, method, survivorIds);

        if (success) {
          hapticPatterns.obstacleRemove();
          if (method.chainReaction) {
            setTimeout(() => hapticPatterns.chainReaction(), 300);
          }
          handleCloseObstacleModal();
          if (method.warning) {
            hapticPatterns.warningAction();
            showToast('장애물을 제거했습니다 (위험)', 'warning');
          } else {
            showToast('장애물을 제거했습니다', 'success');
          }
        } else {
          hapticPatterns.errorAction();
          showToast('장애물 제거에 실패했습니다', 'error');
        }
      }
    }
  };

  // Error retry handler
  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    const config = getLevelData(levelId);
    if (config) {
      setLevelConfig(config);
      initializeLevel(config);
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return <LoadingScreen levelId={levelId} />;
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>오류 발생</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </Pressable>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>돌아가기</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <PlanningTimer />
            <View style={styles.headerRow}>
              <GameTimer />
            </View>
            <View style={styles.headerRow}>
              <ResourcePanel resources={resources} />
            </View>
            <WeatherDisplay />
          </View>

          {/* Game Board */}
          <View style={styles.boardWrapper}>
            <GameBoard onObstacleClick={handleObstacleClick} onSurvivorClick={setSelectedSurvivor} />
          </View>

          {/* Survivor Status Panel */}
          <View style={styles.statusPanel}>
            <Text style={styles.statusTitle}>생존자 상태</Text>
            {survivors.map((survivor) => (
              <SurvivorStatusBar key={survivor.id} survivor={survivor} />
            ))}
          </View>
        </ScrollView>

        <GameOverModal
          visible={gameStatus === 'victory' || gameStatus === 'defeat'}
          onRestart={handleRestart}
          onNextLevel={gameStatus === 'victory' ? handleNextLevel : undefined}
          onMainMenu={handleMainMenu}
        />

        <TutorialOverlay
          visible={showTutorial}
          currentStep={tutorialStep}
          steps={TUTORIAL_STEPS}
          onNext={handleTutorialNext}
          onSkip={handleTutorialSkip}
          onComplete={handleTutorialComplete}
        />

        <ObstacleRemovalModal
          visible={showObstacleModal}
          obstacle={selectedObstacle}
          availableSurvivors={survivors.map(s => ({
            id: s.id,
            role: s.role,
            used: false
          }))}
          availableResources={resources as unknown as { [key: string]: number }}
          onClose={handleCloseObstacleModal}
          onSelectMethod={handleSelectMethod}
          onSynergyDiscovered={handleSynergyDiscovered}
        />

        <Toast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          onHide={() => setToastVisible(false)}
        />

        <AchievementUnlockedModal
          visible={showAchievementModal}
          achievement={unlockedAchievement}
          onClose={() => {
            setShowAchievementModal(false);
            setUnlockedAchievement(null);
          }}
        />

        {/* 게임 가이드 */}
        {showGuide && (
          <View style={styles.guideOverlay}>
            <View style={styles.guideModal}>
              <Text style={styles.guideTitle}>🎮 게임 방법</Text>
              <Text style={styles.guideText}>
                1. 🪨 장애물을 클릭하세요{'\n'}
                2. 📋 제거 방법 선택 모달에서 생존자를 선택하세요{'\n'}
                3. 💰 필요한 자원이 자동으로 소모됩니다{'\n'}
                4. 🎯 모든 장애물을 제거하면 승리!{'\n'}
                5. ⚠️ 각 생존자는 한 번만 사용 가능합니다{'\n'}
                6. 👤 생존자 클릭 = 정보 보기 (제거 X)
              </Text>
              <Pressable
                style={styles.guideButton}
                onPress={() => setShowGuide(false)}
              >
                <Text style={styles.guideButtonText}>시작하기</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* 생존자 정보 모달 */}
        {selectedSurvivor && (
          <View style={styles.guideOverlay}>
            <Pressable style={styles.overlayBackground} onPress={() => setSelectedSurvivor(null)} />
            <View style={styles.survivorInfoModal}>
              <Text style={styles.survivorInfoTitle}>👤 생존자 정보</Text>
              <View style={styles.survivorInfoContent}>
                <Text style={styles.survivorInfoLabel}>이름:</Text>
                <Text style={styles.survivorInfoValue}>{selectedSurvivor.name}</Text>
              </View>
              <View style={styles.survivorInfoContent}>
                <Text style={styles.survivorInfoLabel}>역할:</Text>
                <Text style={styles.survivorInfoValue}>{selectedSurvivor.role}</Text>
              </View>
              <View style={styles.survivorInfoContent}>
                <Text style={styles.survivorInfoLabel}>체력:</Text>
                <Text style={styles.survivorInfoValue}>{selectedSurvivor.health} / 100</Text>
              </View>
              <View style={styles.survivorInfoContent}>
                <Text style={styles.survivorInfoLabel}>배고픔:</Text>
                <Text style={styles.survivorInfoValue}>{selectedSurvivor.hunger} / 100</Text>
              </View>
              <View style={styles.survivorInfoContent}>
                <Text style={styles.survivorInfoLabel}>사기:</Text>
                <Text style={styles.survivorInfoValue}>{selectedSurvivor.morale} / 100</Text>
              </View>
              <Pressable
                style={styles.guideButton}
                onPress={() => setSelectedSurvivor(null)}
              >
                <Text style={styles.guideButtonText}>닫기</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

// Loading spinner component
const LoadingScreen: React.FC<{ levelId: number }> = ({ levelId }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loadingContainer}>
        <Animated.View style={[styles.spinner, animatedStyle]}>
          <View style={styles.spinnerInner} />
        </Animated.View>
        <Text style={styles.loadingText}>레벨 로딩 중...</Text>
        <Text style={styles.loadingSubtext}>레벨 {levelId}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#e5e7eb',
    borderTopColor: '#3b82f6',
    marginBottom: 24,
  },
  spinnerInner: {
    width: '100%',
    height: '100%',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#6b7280',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  boardWrapper: {
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusPanel: {
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  guideOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  guideModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: '90%',
  },
  guideTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  guideText: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 24,
  },
  guideButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  guideButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  survivorInfoModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: '90%',
  },
  survivorInfoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  survivorInfoContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  survivorInfoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
  },
  survivorInfoValue: {
    fontSize: 16,
    color: '#1f2937',
  },
});

export default GameScreen;
