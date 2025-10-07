import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView, Dimensions, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { hapticPatterns } from '../utils/haptics';
import { GameType, GameInfo } from '../game/shared/types';
import { loadGameRecord } from '../utils/statsManager';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Tutorial } from '../components/shared/Tutorial';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncGameRecords } from '../utils/cloudSync';
import Toast from '../components/shared/Toast';

type MenuScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Menu'>;

interface MenuScreenProps { navigation: MenuScreenNavigationProp; }

const { width: windowWidth } = Dimensions.get('window');
const width = Platform.OS === 'web' ? 430 : windowWidth;
const isSmallScreen = width < 375;

const FIRST_VISIT_KEY = '@brain_games_first_visit';

const tutorialSteps = [
  { title: '환영합니다! 🎉', description: '4가지 두뇌 게임으로 당신의 기억력, 집중력, 계산 능력을 테스트하세요!', emoji: '🎮' },
  { title: '게임 선택 ⚡', description: '원하는 게임을 탭하여 바로 시작하세요. 각 게임은 고유한 도전 과제를 제공합니다.', emoji: '🎯' },
  { title: '기록 확인 📊', description: '통계 탭에서 당신의 성장을 확인하고 최고 기록을 경신하세요!', emoji: '📈' },
  { title: '준비 완료! 🎮', description: '지금 바로 첫 게임을 시작해보세요. 즐거운 시간 되세요!', emoji: '🚀' },
];

const MenuScreen: React.FC<MenuScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [gameInfos, setGameInfos] = useState<GameInfo[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => { loadGameData(); });
    checkFirstVisit();
    return unsubscribe;
  }, [navigation]);

  const checkFirstVisit = async () => {
    try {
      const visited = await AsyncStorage.getItem(FIRST_VISIT_KEY);
      if (!visited) setShowTutorial(true);
    } catch (error) { console.error('Failed to check first visit:', error); }
  };

  const handleTutorialComplete = async () => {
    try {
      await AsyncStorage.setItem(FIRST_VISIT_KEY, 'true');
      setShowTutorial(false);
      hapticPatterns.buttonPress();
    } catch (error) { console.error('Failed to save first visit:', error); }
  };

  const loadGameData = async () => {
    const records = await Promise.all([
      loadGameRecord('flip_match'),
      loadGameRecord('math_rush'),
      loadGameRecord('spatial_memory'),
      loadGameRecord('stroop'),
    ]);

    const games: GameInfo[] = [
      { id: 'flip_match', name: 'Flip & Match', emoji: '🎴', description: '카드 뒤집기', bestRecordLabel: 'Best', bestRecordValue: records[0]?.bestTime ? `${records[0].bestTime}초` : '-' },
      { id: 'math_rush', name: 'Math Rush', emoji: '➕', description: '빠른 계산', bestRecordLabel: 'Best', bestRecordValue: records[1]?.highScore ? `${records[1].highScore}점` : '-' },
      { id: 'spatial_memory', name: 'Spatial Memory', emoji: '🧠', description: '공간 기억', bestRecordLabel: 'Best', bestRecordValue: records[2]?.highestLevel ? `Lv.${records[2].highestLevel}` : '-' },
      { id: 'stroop', name: 'Stroop Test', emoji: '🎨', description: '색상-단어', bestRecordLabel: 'Best', bestRecordValue: records[3]?.highScore ? `${records[3].highScore}점` : '-' },
    ];
    setGameInfos(games);
  };

  const handleGamePress = (gameId: GameType) => {
    hapticPatterns.buttonPress();
    switch (gameId) {
      case 'flip_match': navigation.navigate('FlipMatchGame'); break;
      case 'math_rush': navigation.navigate('MathRushGame'); break;
      case 'spatial_memory': navigation.navigate('SpatialMemoryGame'); break;
      case 'stroop': navigation.navigate('StroopTestGame'); break;
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
      setToastMessage(result.success ? `동기화 완료! (업로드: ${result.recordsUploaded || 0}, 다운로드: ${result.recordsDownloaded || 0})` : `동기화 실패: ${result.error}`);
      if(result.success) hapticPatterns.correctAnswer(); else hapticPatterns.wrongAnswer();
      await loadGameData();
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
      case 'flip_match': return theme.gradients.flipMatch;
      case 'math_rush': return theme.gradients.mathRush;
      case 'spatial_memory': return ['#8b5cf6', '#6366f1'];
      case 'stroop': return ['#ec4899', '#d946ef'];
      default: return theme.gradients.flipMatch;
    }
  };

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.background} style={styles.backgroundGradient} />
      <Tutorial visible={showTutorial} steps={tutorialSteps} onComplete={handleTutorialComplete} gradientColors={theme.gradients.flipMatch} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Brain Games</Text>
              <Text style={styles.subtitle}>두뇌를 깨우는 즐거운 시간</Text>
            </View>
            <View style={styles.headerButtons}>
              <Pressable style={styles.iconButton} onPress={() => { hapticPatterns.buttonPress(); navigation.navigate(user ? 'Profile' : 'Login'); }}>
                <LinearGradient colors={user ? theme.gradients.flipMatch : ['#334155', '#1e293b']} style={styles.iconGradient}>
                  <Text style={styles.iconText}>{user ? '👤' : '🔐'}</Text>
                </LinearGradient>
              </Pressable>
              {user && (
                <Pressable style={styles.iconButton} onPress={handleManualSync} disabled={isSyncing}>
                  <LinearGradient colors={isSyncing ? ['#94a3b8', '#64748b'] : ['#10b981', '#059669']} style={styles.iconGradient}>
                    <Text style={styles.iconText}>{isSyncing ? '⏳' : '🔄'}</Text>
                  </LinearGradient>
                </Pressable>
              )}
              <Pressable style={styles.iconButton} onPress={() => { hapticPatterns.buttonPress(); navigation.navigate('Settings'); }}>
                <LinearGradient colors={['#334155', '#1e293b']} style={styles.iconGradient}>
                  <Text style={styles.iconText}>⚙️</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          <View style={styles.gamesContainer}>
            {gameInfos.map((game, index) => (
              <GameCard key={game.id} game={game} onPress={() => handleGamePress(game.id as GameType)} gradientColors={getGradientColors(game.id as GameType)} index={index} />
            ))}
          </View>

          <View style={styles.bottomButtonsGrid}>
            <Pressable style={styles.bottomButton} onPress={() => { hapticPatterns.buttonPress(); navigation.navigate('Stats'); }}>
              <LinearGradient colors={theme.mode === 'dark' ? ['#1e293b', '#0f172a'] : ['#fff', '#e2e8f0']} style={styles.bottomButtonGradient}>
                <Text style={styles.bottomButtonIcon}>📊</Text>
                <Text style={styles.bottomButtonText}>통계</Text>
              </LinearGradient>
            </Pressable>
            <Pressable style={styles.bottomButton} onPress={() => { hapticPatterns.buttonPress(); navigation.navigate('Leaderboard'); }}>
              <LinearGradient colors={user ? theme.gradients.flipMatch : (theme.mode === 'dark' ? ['#1e293b', '#0f172a'] : ['#fff', '#e2e8f0'])} style={styles.bottomButtonGradient}>
                <Text style={styles.bottomButtonIcon}>🏆</Text>
                <Text style={styles.bottomButtonText}>리더보드</Text>
              </LinearGradient>
            </Pressable>
            <Pressable style={styles.bottomButton} onPress={() => { hapticPatterns.buttonPress(); navigation.navigate('Friends'); }}>
              <LinearGradient colors={user ? ['#10b981', '#059669'] : (theme.mode === 'dark' ? ['#1e293b', '#0f172a'] : ['#fff', '#e2e8f0'])} style={styles.bottomButtonGradient}>
                <Text style={styles.bottomButtonIcon}>👥</Text>
                <Text style={styles.bottomButtonText}>친구</Text>
              </LinearGradient>
            </Pressable>
            <Pressable style={styles.bottomButton} onPress={() => { hapticPatterns.buttonPress(); navigation.navigate('Achievements'); }}>
              <LinearGradient colors={theme.mode === 'dark' ? ['#1e293b', '#0f172a'] : ['#fff', '#e2e8f0']} style={styles.bottomButtonGradient}>
                <Text style={styles.bottomButtonIcon}>🎖️</Text>
                <Text style={styles.bottomButtonText}>업적</Text>
              </LinearGradient>
            </Pressable>
          </View>

          <Text style={styles.version}>v2.2.0</Text>
        </ScrollView>
      </SafeAreaView>
      <Toast message={toastMessage} visible={showToast} onHide={() => setShowToast(false)} duration={3000} />
    </View>
  );
};

interface GameCardProps { game: GameInfo; onPress: () => void; gradientColors: [string, string]; index: number; }

const GameCard: React.FC<GameCardProps> = ({ game, onPress, gradientColors, index }) => {
  const { theme } = useTheme();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(index * 70, withSpring(1, { damping: 15, stiffness: 100 }));
    opacity.value = withDelay(index * 70, withSpring(1));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  const styles = getStyles(theme);

  return (
    <Animated.View style={[styles.gameCardWrapper, animatedStyle]}>
      <Pressable style={({ pressed }) => [styles.gameCard, pressed && styles.gameCardPressed]} onPress={onPress}>
        <LinearGradient colors={gradientColors} style={styles.gameCardGradient}>
          <View style={styles.glassOverlay} />
          <View style={styles.gameIconContainer}>
            <View style={styles.iconGlow}><Text style={styles.gameEmoji}>{game.emoji}</Text></View>
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

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1 },
  backgroundGradient: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 16, paddingTop: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, marginTop: 8 },
  titleContainer: { flex: 1 },
  title: { fontSize: isSmallScreen ? 30 : 34, fontWeight: '900', color: theme.colors.text, letterSpacing: -1 },
  subtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 6 },
  headerButtons: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 40, height: 40, borderRadius: 12, overflow: 'hidden' },
  iconGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 18 },
  gamesContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  gameCardWrapper: { width: (width - 48) / 2, marginBottom: 16 },
  gameCard: { borderRadius: 20, overflow: 'hidden', shadowColor: theme.colors.shadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 10 },
  gameCardPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  gameCardGradient: { padding: 12, alignItems: 'center', minHeight: 165, justifyContent: 'space-between' },
  glassOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.2)', borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)', borderRadius: 20 },
  gameIconContainer: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  iconGlow: { width: 56, height: 56, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  gameEmoji: { fontSize: 32 },
  gameName: { fontSize: 15, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 2, textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  gameDescription: { fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center', marginBottom: 10, fontWeight: '500' },
  recordContainer: { backgroundColor: 'rgba(0, 0, 0, 0.3)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', minWidth: 60, alignItems: 'center' },
  recordLabel: { fontSize: 8, fontWeight: '700', color: 'rgba(255, 255, 255, 0.7)', letterSpacing: 0.5, marginBottom: 1 },
  recordValue: { fontSize: 13, fontWeight: '800', color: '#fff' },
  bottomButtonsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16, justifyContent: 'space-between' },
  bottomButton: { width: (width - 42) / 2, borderRadius: 16, overflow: 'hidden', shadowColor: theme.colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  bottomButtonGradient: { paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16 },
  bottomButtonIcon: { fontSize: 20, color: theme.colors.text },
  bottomButtonText: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  version: { fontSize: 11, color: theme.colors.textTertiary, textAlign: 'center', marginTop: 0, marginBottom: 16, fontWeight: '500' },
});

export default MenuScreen;