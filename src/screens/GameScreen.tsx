import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Text, Button, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, RouteProp } from '@react-navigation/native';
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
import { recordLevelCompletion } from '../utils/progressManager';
import { RootStackParamList } from '../../App';

const TUTORIAL_KEY = '@tutorial_completed';

type GameScreenRouteProp = RouteProp<RootStackParamList, 'Game'>;

const GameScreen: React.FC = () => {
  const route = useRoute<GameScreenRouteProp>();
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

  // Initialize level data
  useEffect(() => {
    const loadLevel = async () => {
      const config = getLevelData(levelId);
      if (config) {
        setLevelConfig(config);
        initializeLevel(config);
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

  return (
    <SafeAreaView style={styles.container}>
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
      />

      <TutorialOverlay
        visible={showTutorial}
        currentStep={tutorialStep}
        steps={TUTORIAL_STEPS}
        onNext={handleTutorialNext}
        onSkip={handleTutorialSkip}
        onComplete={handleTutorialComplete}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
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
