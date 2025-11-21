import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView, Dimensions, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { hapticPatterns } from '../utils/haptics';
import { soundManager } from '../utils/soundManager';
import { GameType, GameInfo } from '../game/shared/types';
import { loadGameRecord } from '../utils/statsManager';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Tutorial } from '../components/shared/Tutorial';
import { GlassView } from '../components/shared/GlassView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncGameRecords } from '../utils/cloudSync';
import Toast from '../components/shared/Toast';
import {
  Brain,
  Trophy,
  Users,
  Swords,
  Medal,
  BarChart3,
  Gamepad2,
  Grid2X2,
  Calculator,
  Palette,
  Rocket,
  Target,
  TrendingUp,
  Settings,
  UserCircle,
  RefreshCw
} from 'lucide-react-native';

type MenuScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Menu'>;

interface MenuScreenProps { navigation: MenuScreenNavigationProp; }

const { width: windowWidth } = Dimensions.get('window');
const width = windowWidth;
const isSmallScreen = width < 375;

const FIRST_VISIT_KEY = '@brain_games_first_visit';

const tutorialSteps = [
  { title: '환영합니다! 🎉', description: '4가지 두뇌 게임으로 당신의 기억력, 집중력, 계산 능력을 테스트하세요!', icon: Gamepad2 },
  { title: '게임 선택 ⚡', description: '원하는 게임을 탭하여 바로 시작하세요. 각 게임은 고유한 도전 과제를 제공합니다.', icon: Target },
  { title: '기록 확인 📊', description: '통계 탭에서 당신의 성장을 확인하고 최고 기록을 경신하세요!', icon: TrendingUp },
  { title: '준비 완료! 🎮', description: '지금 바로 첫 게임을 시작해보세요. 즐거운 시간 되세요!', icon: Rocket },
];

const MenuScreen: React.FC<MenuScreenProps> = ({ navigation }) => {
  const { theme, themeMode } = useTheme();
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

    const games: any[] = [
      { id: 'flip_match', name: 'Flip & Match', icon: Grid2X2, description: '카드 뒤집기', bestRecordLabel: 'Best', bestRecordValue: records[0]?.bestTime ? `${records[0].bestTime}초` : '-' },
      { id: 'math_rush', name: 'Math Rush', icon: Calculator, description: '빠른 계산', bestRecordLabel: 'Best', bestRecordValue: records[1]?.highScore ? `${records[1].highScore}점` : '-' },
      { id: 'spatial_memory', name: 'Spatial Memory', icon: Brain, description: '공간 기억', bestRecordLabel: 'Best', bestRecordValue: records[2]?.highestLevel ? `Lv.${records[2].highestLevel}` : '-' },
      { id: 'stroop', name: 'Stroop Test', icon: Palette, description: '색상-단어', bestRecordLabel: 'Best', bestRecordValue: records[3]?.highScore ? `${records[3].highScore}점` : '-' },
    ];
    setGameInfos(games);
  };

  const handleGamePress = (gameId: GameType) => {
    hapticPatterns.buttonPress();
    soundManager.playSound('button_press');
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
      if (result.success) hapticPatterns.correctAnswer(); else hapticPatterns.wrongAnswer();
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
      case 'spatial_memory': return theme.gradients.spatialMemory;
      case 'stroop': return theme.gradients.stroop;
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
              <Pressable style={styles.iconButton} onPress={() => { hapticPatterns.buttonPress(); soundManager.playSound('button_press'); navigation.navigate(user ? 'Profile' : 'Login'); }}>
                <GlassView style={styles.iconButtonGlass} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
                  <UserCircle size={24} color={theme.colors.text} />
                </GlassView>
              </Pressable>
              {user && (
                <Pressable style={styles.iconButton} onPress={handleManualSync} disabled={isSyncing}>
                  <GlassView style={styles.gameCardGlass} intensity={30} tint={themeMode === 'dark' ? 'dark' : 'light'}>
                    <RefreshCw size={20} color={theme.colors.text} style={isSyncing ? { opacity: 0.5 } : {}} />
                  </GlassView>
                </Pressable>
              )}
              <Pressable style={styles.iconButton} onPress={() => { hapticPatterns.buttonPress(); soundManager.playSound('button_press'); navigation.navigate('Settings'); }}>
                <GlassView style={styles.iconButtonGlass} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
                  <Settings size={24} color={theme.colors.text} />
                </GlassView>
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
              <GlassView style={styles.bottomButtonGlass} intensity={30} tint={themeMode === 'dark' ? 'dark' : 'light'}>
                <BarChart3 size={24} color={theme.colors.text} />
                <Text style={styles.bottomButtonText}>통계</Text>
              </GlassView>
            </Pressable>
            <Pressable style={styles.bottomButton} onPress={() => { hapticPatterns.buttonPress(); navigation.navigate('Leaderboard'); }}>
              <GlassView style={styles.bottomButtonGlass} intensity={30} tint={themeMode === 'dark' ? 'dark' : 'light'}>
                <Trophy size={24} color={theme.colors.warning} />
                <Text style={styles.bottomButtonText}>리더보드</Text>
              </GlassView>
            </Pressable>
            <Pressable style={styles.bottomButton} onPress={() => { hapticPatterns.buttonPress(); navigation.navigate('Friends'); }}>
              <GlassView style={styles.bottomButtonGlass} intensity={30} tint={themeMode === 'dark' ? 'dark' : 'light'}>
                <Users size={24} color={theme.colors.success} />
                <Text style={styles.bottomButtonText}>친구</Text>
              </GlassView>
            </Pressable>
            <Pressable style={styles.bottomButton} onPress={() => { hapticPatterns.buttonPress(); user ? navigation.navigate('MultiplayerLobby') : navigation.navigate('Login'); }}>
              <GlassView style={styles.bottomButtonGlass} intensity={30} tint={themeMode === 'dark' ? 'dark' : 'light'}>
                <Swords size={24} color={theme.colors.error} />
                <Text style={styles.bottomButtonText}>대전</Text>
              </GlassView>
            </Pressable>
            <Pressable style={styles.bottomButton} onPress={() => { hapticPatterns.buttonPress(); navigation.navigate('Achievements'); }}>
              <GlassView style={styles.bottomButtonGlass} intensity={30} tint={themeMode === 'dark' ? 'dark' : 'light'}>
                <Medal size={24} color={theme.colors.primary} />
                <Text style={styles.bottomButtonText}>업적</Text>
              </GlassView>
            </Pressable>
          </View>

          <Text style={styles.version}>v2.2.0</Text>
        </ScrollView>
      </SafeAreaView>
      <Toast message={toastMessage} visible={showToast} onHide={() => setShowToast(false)} duration={3000} />
    </View>
  );
};

interface GameCardProps { game: any; onPress: () => void; gradientColors: [string, string]; index: number; }

const GameCard: React.FC<GameCardProps> = ({ game, onPress, gradientColors, index }) => {
  const { theme, themeMode } = useTheme();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const Icon = game.icon;

  useEffect(() => {
    scale.value = withDelay(index * 70, withSpring(1, { damping: 15, stiffness: 100 }));
    opacity.value = withDelay(index * 70, withSpring(1));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  const styles = getStyles(theme);

  return (
    <Animated.View style={[styles.gameCardWrapper, animatedStyle]}>
      <Pressable style={({ pressed }) => [styles.gameCard, pressed && styles.gameCardPressed]} onPress={onPress}>
        <GlassView style={styles.gameCardGlass} intensity={40} tint={themeMode === 'dark' ? 'dark' : 'light'}>
          <LinearGradient
            colors={[gradientColors[0] + '80', gradientColors[1] + '40']} // Semi-transparent gradient
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.gameCardContent}>
            <View style={styles.gameIconContainer}>
              <View style={[styles.iconGlow, { backgroundColor: gradientColors[0] + '40' }]}>
                <Icon size={32} color="#fff" />
              </View>
            </View>
            <View>
              <Text style={styles.gameName}>{game.name}</Text>
              <Text style={styles.gameDescription}>{game.description}</Text>
            </View>
            <View style={styles.recordContainer}>
              <Text style={styles.recordLabel}>BEST</Text>
              <Text style={styles.recordValue}>{game.bestRecordValue}</Text>
            </View>
          </View>
        </GlassView>
      </Pressable>
    </Animated.View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1 },
  backgroundGradient: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'web' ? 40 : 0 },
  scrollContent: { flexGrow: 1, padding: 20, paddingTop: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 8 },
  titleContainer: { flex: 1 },
  title: { fontSize: isSmallScreen ? 28 : 32, fontWeight: '900', color: theme.colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 4 },
  headerButtons: { flexDirection: 'row', gap: 12 },
  iconButton: { borderRadius: 12, overflow: 'hidden' },
  iconButtonGlass: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  gamesContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  gameCardWrapper: { width: (width - 52) / 2, marginBottom: 16 },
  gameCard: { borderRadius: 24, overflow: 'hidden', height: 180 },
  gameCardPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  gameCardGlass: { flex: 1, borderRadius: 24 },
  gameCardContent: { flex: 1, padding: 16, justifyContent: 'space-between', alignItems: 'center' },
  gameIconContainer: { width: 64, height: 64, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  iconGlow: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  gameName: { fontSize: 16, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 4 },
  gameDescription: { fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', marginBottom: 8 },
  recordContainer: { backgroundColor: 'rgba(0, 0, 0, 0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', minWidth: 80, alignItems: 'center' },
  recordLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(255, 255, 255, 0.6)', letterSpacing: 1, marginBottom: 2 },
  recordValue: { fontSize: 14, fontWeight: '800', color: '#fff' },
  bottomButtonsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24, justifyContent: 'space-between' },
  bottomButton: { width: (width - 52) / 2, borderRadius: 20, overflow: 'hidden', marginBottom: 0 },
  bottomButtonGlass: { paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, borderRadius: 20 },
  bottomButtonText: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  version: { fontSize: 12, color: theme.colors.textTertiary, textAlign: 'center', marginBottom: 20 },
});

export default MenuScreen;