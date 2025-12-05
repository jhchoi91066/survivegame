import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Achievement } from '../../data/achievements';
import { hapticPatterns } from '../../utils/haptics';
import { GlassView } from './GlassView';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Trophy,
  Medal,
  Brain,
  Grid3X3,
  Calculator,
  Palette,
  Zap,
  Star,
  Flame,
  Compass,
  Swords,
  Crown,
  Users,
  TrendingUp,
  Check,
  LucideIcon,
} from 'lucide-react-native';

interface AchievementUnlockModalProps {
  visible: boolean;
  achievements: Achievement[];
  onClose: () => void;
}

const getAchievementIcon = (id: string): LucideIcon => {
  if (id.includes('memory') || id.includes('flip')) return Grid3X3;
  if (id.includes('spatial')) return Brain;
  if (id.includes('math')) return Calculator;
  if (id.includes('color') || id.includes('stroop')) return Palette;
  if (id.includes('quick')) return Zap;
  if (id.includes('all_rounder') || id.includes('explorer')) return Compass;
  if (id.includes('dedicated') || id.includes('consistent')) return Flame;
  if (id.includes('difficulty') || id.includes('competitive')) return Swords;
  if (id.includes('social') || id.includes('friend')) return Users;
  if (id.includes('leaderboard') || id.includes('top')) return TrendingUp;
  if (id.includes('perfect') || id.includes('ultimate') || id.includes('champion')) return Crown;
  if (id.includes('master') || id.includes('genius')) return Trophy;
  return Medal;
};

const AchievementUnlockModal: React.FC<AchievementUnlockModalProps> = ({
  visible,
  achievements,
  onClose,
}) => {
  const { theme, themeMode } = useTheme();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible && achievements.length > 0) {
      hapticPatterns.correctAnswer();
      scale.value = withSpring(1, { damping: 12, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      scale.value = withTiming(0, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, achievements]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible && opacity.value === 0) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, animatedStyle]}>
          <GlassView
            style={styles.glassContainer}
            intensity={40}
            tint={themeMode === 'dark' ? 'dark' : 'light'}
          >
            <LinearGradient
              colors={themeMode === 'dark'
                ? ['rgba(30, 41, 59, 0.95)', 'rgba(15, 23, 42, 0.98)']
                : ['rgba(255, 255, 255, 0.95)', 'rgba(248, 250, 252, 0.98)']}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.content}>
              <View style={styles.headerIconContainer}>
                <LinearGradient
                  colors={['#FCD34D', '#F59E0B']}
                  style={styles.headerIconGradient}
                >
                  <Trophy size={32} color="#FFF" />
                </LinearGradient>
                <View style={styles.headerIconGlow} />
              </View>

              <Text style={[styles.title, { color: theme.colors.text }]}>
                업적 달성!
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                새로운 기록을 세우셨네요!
              </Text>

              <View style={styles.achievementsList}>
                {achievements.map((achievement) => {
                  const Icon = getAchievementIcon(achievement.id);
                  return (
                    <View key={achievement.id} style={[styles.achievementCard, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                      <View style={[styles.iconContainer, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#fff' }]}>
                        <Icon size={24} color={theme.colors.primary} />
                      </View>
                      <View style={styles.textContainer}>
                        <Text style={[styles.achievementName, { color: theme.colors.text }]}>
                          {achievement.name}
                        </Text>
                        <Text style={[styles.achievementDesc, { color: theme.colors.textSecondary }]}>
                          {achievement.description}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed
                ]}
                onPress={() => {
                  hapticPatterns.buttonPress();
                  onClose();
                }}
              >
                <LinearGradient
                  colors={theme.gradients.primary}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.buttonText}>확인</Text>
                  <Check size={18} color="#fff" strokeWidth={3} />
                </LinearGradient>
              </Pressable>
            </View>
          </GlassView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(4px)',
      } as any,
    }),
  },
  container: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  glassContainer: {
    width: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  headerIconContainer: {
    marginBottom: 16,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  headerIconGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  achievementsList: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  textContainer: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  buttonGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

export default AchievementUnlockModal;
