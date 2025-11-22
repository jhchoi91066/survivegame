import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { Play, RotateCcw, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { hapticPatterns } from '../../utils/haptics';
import { GlassView } from './GlassView';

interface GameStat {
  label: string;
  value: string | number;
}

interface PauseMenuProps {
  visible: boolean;
  gameStats: GameStat[];
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  visible,
  gameStats,
  onResume,
  onRestart,
  onQuit,
}) => {
  const { theme, themeMode } = useTheme();

  const handleResume = () => {
    hapticPatterns.buttonPress();
    onResume();
  };

  const handleRestart = () => {
    hapticPatterns.buttonPress();
    onRestart();
  };

  const handleQuit = () => {
    hapticPatterns.buttonPress();
    onQuit();
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.overlay}
      >
        <Animated.View
          entering={ZoomIn.springify().damping(15)}
          style={styles.contentContainer}
        >
          <GlassView style={styles.content} intensity={30} tint={themeMode === 'dark' ? 'dark' : 'light'}>
            <Text style={[styles.title, { color: theme.colors.text }]}>일시정지</Text>

            <View style={[styles.statsContainer, { backgroundColor: themeMode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)' }]}>
              {gameStats.map((stat, index) => (
                <View key={index} style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    {stat.label}
                  </Text>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>
                    {stat.value}
                  </Text>
                </View>
              ))}
            </View>

            <Pressable
              style={[styles.resumeButton, { backgroundColor: theme.colors.success }]}
              onPress={handleResume}
            >
              <View style={styles.buttonContent}>
                <Text style={styles.resumeButtonText}>계속하기</Text>
                <Play size={20} color="#fff" style={{ marginLeft: 8 }} />
              </View>
            </Pressable>

            <Pressable
              style={[styles.restartButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleRestart}
            >
              <View style={styles.buttonContent}>
                <Text style={styles.restartButtonText}>다시 시작</Text>
                <RotateCcw size={18} color="#fff" style={{ marginLeft: 8 }} />
              </View>
            </Pressable>

            <Pressable
              style={[styles.quitButton, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
              onPress={handleQuit}
            >
              <View style={styles.buttonContent}>
                <Text style={[styles.quitButtonText, { color: theme.colors.text }]}>
                  메뉴로
                </Text>
                <ArrowLeft size={18} color={theme.colors.text} style={{ marginLeft: 8 }} />
              </View>
            </Pressable>
          </GlassView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  content: {
    padding: 32,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  statsContainer: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  resumeButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  restartButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  restartButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  quitButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  quitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
