import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { hapticPatterns } from '../utils/haptics';
import { useGameStore } from '../game/shared/store';
import { GameType, GameInfo } from '../game/shared/types';
import { loadStats, loadGameRecord } from '../utils/statsManager';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Tutorial } from '../components/shared/Tutorial';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncGameRecords } from '../utils/cloudSync';
import Toast from '../components/shared/Toast';

type MenuScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Menu'>;

interface MenuScreenProps {
  navigation: MenuScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const cardWidth = (width - 60) / 2; // padding 20 * 2 + gap 20

const FIRST_VISIT_KEY = '@brain_games_first_visit';

const tutorialSteps = [
  {
    title: '환영합니다! 🎉',
    description: '4가지 두뇌 게임으로 당신의 기억력, 집중력, 계산 능력을 테스트하세요!',
    emoji: '🎮',
  },
  {
    title: '게임 선택 ⚡',
    description: '원하는 게임을 탭하여 바로 시작하세요. 각 게임은 고유한 도전 과제를 제공합니다.',
    emoji: '🎯',
  },
  {
    title: '기록 확인 📊',
    description: '통계 탭에서 당신의 성장을 확인하고 최고 기록을 경신하세요!',
    emoji: '📈',
  },
  {
    title: '준비 완료! 🎮',
    description: '지금 바로 첫 게임을 시작해보세요. 즐거운 시간 되세요!',
    emoji: '🚀',
  },
];

const MenuScreen: React.FC<MenuScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { globalStats } = useGameStore();
  const [gameInfos, setGameInfos] = useState<GameInfo[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    loadGameData();
    checkFirstVisit();
  }, []);

  const checkFirstVisit = async () => {
    try {
      const visited = await AsyncStorage.getItem(FIRST_VISIT_KEY);
      if (!visited) {
        setShowTutorial(true);
      }
    } catch (error) {
      console.error('Failed to check first visit:', error);
    }
  };

  const handleTutorialComplete = async () => {
    try {
      await AsyncStorage.setItem(FIRST_VISIT_KEY, 'true');
      setShowTutorial(false);
      hapticPatterns.buttonPress();
    } catch (error) {
      console.error('Failed to save first visit:', error);
    }
  };

  const loadGameData = async () => {
    const flipMatchRecord = await loadGameRecord('flip_match');
    const sequenceRecord = await loadGameRecord('sequence');
    const mathRushRecord = await loadGameRecord('math_rush');
    const mergePuzzleRecord = await loadGameRecord('merge_puzzle');

    const games: GameInfo[] = [
      {
        id: 'flip_match',
        name: 'Flip & Match',
        emoji: '🎴',
        description: '카드 뒤집기',
        bestRecordLabel: 'Best',
        bestRecordValue: flipMatchRecord?.bestTime
          ? `${flipMatchRecord.bestTime}초`
          : '-',
      },
      {
        id: 'sequence',
        name: 'Sequence',
        emoji: '🔢',
        description: '순서 맞추기',
        bestRecordLabel: 'Best',
        bestRecordValue: sequenceRecord?.highestLevel
          ? `Lv.${sequenceRecord.highestLevel}`
          : '-',
      },
      {
        id: 'math_rush',
        name: 'Math Rush',
        emoji: '➕',
        description: '빠른 계산',
        bestRecordLabel: 'Best',
        bestRecordValue: mathRushRecord?.highScore
          ? `${mathRushRecord.highScore}점`
          : '-',
      },
      {
        id: 'merge_puzzle',
        name: 'Merge Puzzle',
        emoji: '🔢',
        description: '숫자 합치기',
        bestRecordLabel: 'Best',
        bestRecordValue: mergePuzzleRecord?.bestMoves
          ? `${mergePuzzleRecord.bestMoves}회`
          : '-',
      },
    ];

    setGameInfos(games);
  };

  const handleGamePress = (gameId: GameType) => {
    hapticPatterns.buttonPress();

    switch (gameId) {
      case 'flip_match':
        navigation.navigate('FlipMatchGame');
        break;
      case 'sequence':
        navigation.navigate('SequenceGame');
        break;
      case 'math_rush':
        navigation.navigate('MathRushGame');
        break;
      case 'merge_puzzle':
        navigation.navigate('MergePuzzleGame');
        break;
    }
  };

  const handleManualSync = async () => {
    if (!user) {
      setToastMessage('로그인이 필요합니다');
      setShowToast(true);
      return;
    }

    setIsSyncing(true);
    hapticPatterns.buttonPress();

    try {
      const result = await syncGameRecords();
      if (result.success) {
        setToastMessage(`동기화 완료! (업로드: ${result.recordsUploaded || 0}, 다운로드: ${result.recordsDownloaded || 0})`);
        hapticPatterns.correctAnswer();
        await loadGameData(); // Refresh game data
      } else {
        setToastMessage(`동기화 실패: ${result.error}`);
        hapticPatterns.wrongAnswer();
      }
    } catch (error) {
      setToastMessage('동기화 중 오류 발생');
      hapticPatterns.wrongAnswer();
    } finally {
      setIsSyncing(false);
      setShowToast(true);
    }
  };

  const getGradientColors = (gameId: GameType): [string, string] => {
    switch (gameId) {
      case 'flip_match':
        return theme.gradients.flipMatch;
      case 'sequence':
        return theme.gradients.sequence;
      case 'math_rush':
        return theme.gradients.mathRush;
      case 'merge_puzzle':
        return theme.gradients.mergePuzzle;
      default:
        return theme.gradients.flipMatch;
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={theme.gradients.background}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* First-time Tutorial */}
      <Tutorial
        visible={showTutorial}
        steps={tutorialSteps}
        onComplete={handleTutorialComplete}
        gradientColors={theme.gradients.flipMatch}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Brain Games</Text>
              <Text style={styles.subtitle}>두뇌를 깨우는 즐거운 시간</Text>
            </View>
            <View style={styles.headerButtons}>
              {/* 로그인/프로필 버튼 */}
              <Pressable
                style={styles.iconButton}
                onPress={() => {
                  hapticPatterns.buttonPress();
                  navigation.navigate(user ? 'Profile' : 'Login');
                }}
              >
                <LinearGradient
                  colors={user ? ['#6366f1', '#8b5cf6'] : ['#334155', '#1e293b']}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.iconText}>{user ? '👤' : '🔐'}</Text>
                </LinearGradient>
              </Pressable>

              {/* 동기화 버튼 (로그인 시에만 표시) */}
              {user && (
                <Pressable
                  style={styles.iconButton}
                  onPress={handleManualSync}
                  disabled={isSyncing}
                >
                  <LinearGradient
                    colors={isSyncing ? ['#94a3b8', '#64748b'] : ['#10b981', '#059669']}
                    style={styles.iconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.iconText}>{isSyncing ? '⏳' : '🔄'}</Text>
                  </LinearGradient>
                </Pressable>
              )}

              {/* 설정 버튼 */}
              <Pressable
                style={styles.iconButton}
                onPress={() => {
                  hapticPatterns.buttonPress();
                  navigation.navigate('Settings');
                }}
              >
                <LinearGradient
                  colors={['#334155', '#1e293b']}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.iconText}>⚙️</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          {/* Game Grid - 2x2 */}
          <View style={styles.gamesContainer}>
            {gameInfos.map((game, index) => (
              <GameCard
                key={game.id}
                game={game}
                onPress={() => handleGamePress(game.id)}
                gradientColors={getGradientColors(game.id)}
                index={index}
              />
            ))}
          </View>

          {/* Bottom Buttons */}
          <View style={styles.bottomButtons}>
            <Pressable
              style={styles.bottomButton}
              onPress={() => {
                hapticPatterns.buttonPress();
                navigation.navigate('Stats');
              }}
            >
              <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={styles.bottomButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.bottomButtonIcon}>📊</Text>
                <Text style={styles.bottomButtonText}>통계</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={styles.bottomButton}
              onPress={() => {
                hapticPatterns.buttonPress();
                navigation.navigate('Leaderboard');
              }}
            >
              <LinearGradient
                colors={user ? ['#6366f1', '#8b5cf6'] : ['#1e293b', '#0f172a']}
                style={styles.bottomButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.bottomButtonIcon}>🏆</Text>
                <Text style={styles.bottomButtonText}>리더보드</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={styles.bottomButton}
              onPress={() => {
                hapticPatterns.buttonPress();
                navigation.navigate('Achievements');
              }}
            >
              <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={styles.bottomButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.bottomButtonIcon}>🎖️</Text>
                <Text style={styles.bottomButtonText}>업적</Text>
              </LinearGradient>
            </Pressable>
          </View>

          <Text style={styles.version}>v2.0.0</Text>
        </ScrollView>
      </SafeAreaView>

      {/* Toast for sync status */}
      <Toast
        message={toastMessage}
        visible={showToast}
        onHide={() => setShowToast(false)}
        duration={3000}
      />
    </View>
  );
};

interface GameCardProps {
  game: GameInfo;
  onPress: () => void;
  gradientColors: [string, string];
  index: number;
}

const GameCard: React.FC<GameCardProps> = ({ game, onPress, gradientColors, index }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      index * 100,
      withSpring(1, {
        damping: 15,
        stiffness: 100,
      })
    );
    opacity.value = withDelay(index * 100, withSpring(1));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.gameCardWrapper, animatedStyle]}>
      <Pressable
        style={({ pressed }) => [
          styles.gameCard,
          pressed && styles.gameCardPressed,
        ]}
        onPress={onPress}
      >
        <LinearGradient
          colors={gradientColors}
          style={styles.gameCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Glassmorphism overlay */}
          <View style={styles.glassOverlay} />

          <View style={styles.gameIconContainer}>
            <View style={styles.iconGlow}>
              <Text style={styles.gameEmoji}>{game.emoji}</Text>
            </View>
          </View>

          <Text style={styles.gameName}>{game.name}</Text>
          <Text style={styles.gameDescription}>{game.description}</Text>

          <View style={styles.recordContainer}>
            <Text style={styles.recordLabel}>BEST</Text>
            <Text style={styles.recordValue}>{game.bestRecordValue}</Text>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
    marginTop: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: isSmallScreen ? 32 : 36,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
    textShadowColor: 'rgba(99, 102, 241, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 6,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
    fontWeight: '500',
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  settingsGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
  },
  settingsIcon: {
    fontSize: 22,
  },
  gamesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 28,
  },
  gameCardWrapper: {
    width: cardWidth,
  },
  gameCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  gameCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  gameCardGradient: {
    padding: 20,
    paddingVertical: 28,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'space-between',
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
  },
  gameIconContainer: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconGlow: {
    width: 72,
    height: 72,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  gameEmoji: {
    fontSize: 40,
  },
  gameName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  gameDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  recordContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 80,
    alignItems: 'center',
  },
  recordLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1,
    marginBottom: 2,
  },
  recordValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  bottomButton: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  bottomButtonGradient: {
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
  },
  bottomButtonIcon: {
    fontSize: 22,
  },
  bottomButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  version: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    fontWeight: '500',
  },
});

export default MenuScreen;
