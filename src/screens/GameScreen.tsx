import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Text, Button, ScrollView, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
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
import { TUTORIAL_STEPS } from '../data/tutorialSteps';
import { getLevelData } from '../data/levelData';
import { recordLevelCompletion, isLevelUnlocked } from '../utils/progressManager';
import { RootStackParamList } from '../../App';

const TUTORIAL_KEY = '@tutorial_completed';

type GameScreenRouteProp = RouteProp<RootStackParamList, 'Game'>;
type GameScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Game'>;

const GameScreen: React.FC = () => {
  const route = useRoute<GameScreenRouteProp>();
  const navigation = useNavigation<GameScreenNavigationProp>();
  const levelId = route.params?.level || 1;

  const {
    turn,
    nextTurn,
    survivors,
    resources,
    gameStatus,
    startGame,
    checkVictoryCondition,
    checkDefeatCondition,
    initializeLevel,
    timeRemaining,
    currentLevelId,
  } = useGameStore((state) => ({
    turn: state.turn,
    nextTurn: state.nextTurn,
    survivors: state.survivors,
    resources: state.resources,
    gameStatus: state.gameStatus,
    startGame: state.startGame,
    checkVictoryCondition: state.checkVictoryCondition,
    checkDefeatCondition: state.checkDefeatCondition,
    initializeLevel: state.initializeLevel,
    timeRemaining: state.timeRemaining,
    currentLevelId: state.currentLevelId,
  }));

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [levelConfig, setLevelConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Animation for turn transition
  const turnFadeOpacity = useSharedValue(1);

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
  }, [gameStatus, startGame, showTutorial, levelConfig]);

  // Handle victory and save progress
  useEffect(() => {
    const handleVictory = async () => {
      if (gameStatus === 'victory' && currentLevelId && levelConfig) {
        await recordLevelCompletion(
          currentLevelId,
          timeRemaining,
          levelConfig.starThresholds
        );
      }
    };

    handleVictory();
  }, [gameStatus, currentLevelId, timeRemaining, levelConfig]);

  const handleNextTurn = () => {
    // Fade effect
    turnFadeOpacity.value = withSequence(
      withTiming(0.7, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );

    nextTurn();
    // Check win/lose conditions after turn
    if (!checkVictoryCondition()) {
      checkDefeatCondition();
    }
  };

  const handleRestart = () => {
    if (levelConfig) {
      initializeLevel(levelConfig);
      startGame();
    }
  };

  const turnFadeStyle = useAnimatedStyle(() => ({
    opacity: turnFadeOpacity.value,
  }));

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
      <Animated.View style={[{ flex: 1 }, turnFadeStyle]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <Text style={styles.turnText}>Turn: {turn}</Text>
              </View>
              <GameTimer />
            </View>
            <View style={styles.headerRow}>
              <ResourcePanel resources={resources} />
            </View>
            <WeatherDisplay />
          </View>

          {/* Game Board */}
          <View style={styles.boardWrapper}>
            <GameBoard />
          </View>

          {/* Survivor Status Panel */}
          <View style={styles.statusPanel}>
            <Text style={styles.statusTitle}>생존자 상태</Text>
            {survivors.map((survivor) => (
              <SurvivorStatusBar key={survivor.id} survivor={survivor} />
            ))}
          </View>

          {/* Controls */}
          <View style={styles.buttonContainer}>
            <Button title="턴 종료" onPress={handleNextTurn} />
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
      </Animated.View>
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
  headerLeft: {
    flex: 1,
  },
  turnText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
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
  buttonContainer: {
    marginBottom: 20,
  },
});

export default GameScreen;
