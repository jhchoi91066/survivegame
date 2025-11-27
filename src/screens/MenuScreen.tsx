import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView, Dimensions, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { hapticPatterns } from '../utils/haptics';
import { soundManager } from '../utils/soundManager';
import { GameType, GameInfo } from '../game/shared/types';
import { loadGameRecord } from '../utils/statsManager';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming, interpolate, interpolateColor } from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Tutorial } from '../components/shared/Tutorial';
import { GlassView } from '../components/shared/GlassView';
import { BottomDock, TabType } from '../components/shared/BottomDock';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncGameRecords } from '../utils/cloudSync';
import Toast from '../components/shared/Toast';
import {
  RefreshCw,
  UserCircle,
  Users,
  Settings,
  BarChart3,
  Trophy,
  Medal,
  Swords,
  Gamepad2,
  Target,
  TrendingUp,
  Rocket
} from 'lucide-react-native';
import { GAMES } from '../game/shared/config';

import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';

type MenuScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<any, 'Menu'>,
  NativeStackNavigationProp<RootStackParamList>
>;

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
    const gameDataPromises = GAMES.map(async (game) => {
      const record = await loadGameRecord(game.id);
      let bestRecordValue = '-';

      if (record) {
        if ('bestTime' in record) bestRecordValue = `${record.bestTime}초`;
        else if ('highScore' in record) bestRecordValue = `${record.highScore}점`;
        else if ('highestLevel' in record) bestRecordValue = `Lv.${record.highestLevel}`;
      }

      return {
        ...game,
        bestRecordLabel: 'Best',
        bestRecordValue,
      };
    });

    const games = await Promise.all(gameDataPromises);
    setGameInfos(games);
  };

  const handleGamePress = (gameId: GameType) => {
    hapticPatterns.buttonPress();
    soundManager.playSound('button_press');
    const gameConfig = GAMES.find(g => g.id === gameId);
    if (gameConfig) {
      navigation.navigate(gameConfig.route as any);
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
              <HoverableIconButton
                onPress={() => { hapticPatterns.buttonPress(); soundManager.playSound('button_press'); navigation.navigate(user ? 'Profile' : 'Login'); }}
                icon={<UserCircle size={24} color={theme.colors.text} />}
                theme={theme}
                themeMode={themeMode}
                styles={styles}
              />
              {user && (
                <HoverableIconButton
                  onPress={handleManualSync}
                  disabled={isSyncing}
                  icon={<RefreshCw size={24} color={theme.colors.text} style={isSyncing ? { opacity: 0.5 } : {}} />}
                  theme={theme}
                  themeMode={themeMode}
                  styles={styles}
                />
              )}
              <HoverableIconButton
                onPress={() => { hapticPatterns.buttonPress(); soundManager.playSound('button_press'); navigation.navigate('Settings'); }}
                icon={<Settings size={24} color={theme.colors.text} />}
                theme={theme}
                themeMode={themeMode}
                styles={styles}
              />
            </View>
          </View>

          <View style={styles.gamesContainer}>
            {gameInfos.map((game, index) => (
              <GameCard
                key={game.id}
                game={game}
                onPress={() => handleGamePress(game.id as GameType)}
                gradientColors={theme.gradients[game.gradientKey]}
                index={index}
              />
            ))}
          </View>



          <Text style={styles.version}>v2.2.0</Text>
        </ScrollView>
      </SafeAreaView>
      <Toast message={toastMessage} visible={showToast} onHide={() => setShowToast(false)} duration={3000} />
    </View>
  );
};

// --- Components ---

interface HoverableIconButtonProps {
  onPress: () => void;
  icon: React.ReactNode;
  theme: any;
  themeMode: any;
  disabled?: boolean;
  styles: any;
}

const HoverableIconButton: React.FC<HoverableIconButtonProps> = ({ onPress, icon, theme, themeMode, disabled, styles }) => {
  const scale = useSharedValue(1);
  const hover = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(hover.value, [0, 1], ['transparent', 'rgba(255,255,255,0.1)']),
    borderRadius: 12,
  }));

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => { scale.value = withSpring(0.9); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      // @ts-ignore - Web only props
      onHoverIn={() => { hover.value = withTiming(1); scale.value = withSpring(1.1); }}
      // @ts-ignore
      onHoverOut={() => { hover.value = withTiming(0); scale.value = withSpring(1); }}
    >
      <Animated.View style={[styles.iconButton, animatedStyle]}>
        <GlassView style={styles.iconButtonGlass} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
          {icon}
        </GlassView>
      </Animated.View>
    </Pressable>
  );
};

interface GameCardProps { game: any; onPress: () => void; gradientColors: [string, string]; index: number; }

const GameCard: React.FC<GameCardProps> = ({ game, onPress, gradientColors, index }) => {
  const { theme, themeMode } = useTheme();
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const Icon = game.icon;

  useEffect(() => {
    translateY.value = withDelay(index * 100, withSpring(0, { damping: 12, stiffness: 90 }));
    opacity.value = withDelay(index * 100, withTiming(1, { duration: 500 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
    opacity: opacity.value
  }));

  const styles = getStyles(theme);

  return (
    <Animated.View style={[styles.gameCardWrapper, animatedStyle]}>
      <Pressable
        style={styles.gameCard}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.95); }}
        onPressOut={() => { scale.value = withSpring(1); }}
      >
        <GlassView style={styles.gameCardGlass} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
          {/* Background Gradient opacity */}
          <LinearGradient
            colors={[gradientColors[0], gradientColors[1]]}
            style={[StyleSheet.absoluteFill, { opacity: 0.15 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <View style={styles.gameCardContent}>
            {/* Top Row: Icon and Stat */}
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconContainer, { backgroundColor: gradientColors[0] }]}>
                <Icon size={24} color="#fff" />
              </View>
              <View style={styles.statBadge}>
                <Text style={styles.statText}>{game.bestRecordValue}</Text>
              </View>
            </View>

            {/* Bottom Row: Title and Description */}
            <View style={styles.cardBottomRow}>
              <Text style={styles.gameName}>{game.name}</Text>
              <Text style={styles.gameDescription}>{game.description}</Text>
            </View>
          </View>
        </GlassView>
      </Pressable>
    </Animated.View>
  );
};

interface BottomButtonProps { onPress: () => void; icon: React.ReactNode; label: string; theme: any; themeMode: any; }

const BottomButton: React.FC<BottomButtonProps> = ({ onPress, icon, label, theme, themeMode }) => {
  const hoverScale = useSharedValue(1);
  const styles = getStyles(theme);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: hoverScale.value }]
  }));

  return (
    <Animated.View style={[styles.bottomButton, animatedStyle]}>
      <Pressable
        style={{ flex: 1 }}
        onPress={onPress}
        onPressIn={() => { hoverScale.value = withSpring(0.95); }}
        onPressOut={() => { hoverScale.value = withSpring(1); }}
        // @ts-ignore
        onHoverIn={() => { hoverScale.value = withSpring(1.05); }}
        // @ts-ignore
        onHoverOut={() => { hoverScale.value = withSpring(1); }}
      >
        <GlassView style={styles.bottomButtonGlass} intensity={30} tint={themeMode === 'dark' ? 'dark' : 'light'}>
          {icon}
          <Text style={styles.bottomButtonText}>{label}</Text>
        </GlassView>
      </Pressable>
    </Animated.View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1 },
  backgroundGradient: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'web' ? 40 : 0 },
  scrollContent: { flexGrow: 1, padding: 20, paddingTop: 10, paddingBottom: 120 },
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
  gameCardGlass: { flex: 1, borderRadius: 24 },
  gameCardContent: { flex: 1, padding: 16, justifyContent: 'space-between' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  iconContainer: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  statBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statText: { fontSize: 12, fontWeight: '700', color: theme.colors.textSecondary },
  cardBottomRow: { marginTop: 'auto' },
  gameName: { fontSize: 20, fontWeight: '800', color: theme.colors.text, marginBottom: 4 },
  gameDescription: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '500' },
  bottomButtonsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24, justifyContent: 'space-between' },
  bottomButton: { width: (width - 52) / 2, borderRadius: 20, overflow: 'hidden', marginBottom: 0 },
  bottomButtonGlass: { paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, borderRadius: 20 },
  bottomButtonText: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  version: { fontSize: 12, color: theme.colors.textTertiary, textAlign: 'center', marginBottom: 20 },
});

export default MenuScreen;