import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

interface FeedbackOverlayProps {
  type: 'correct' | 'wrong' | 'success' | 'warning' | null;
  message?: string;
  onComplete?: () => void;
}

export const FeedbackOverlay: React.FC<FeedbackOverlayProps> = ({
  type,
  message,
  onComplete,
}) => {
  const { theme } = useTheme();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    if (type) {
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(1, { duration: 600 }),
        withTiming(0, { duration: 300 }, (finished) => {
          if (finished && onComplete) {
            runOnJS(onComplete)();
          }
        })
      );

      scale.value = withSequence(
        withTiming(1.1, { duration: 200 }),
        withTiming(1, { duration: 100 })
      );
    }
  }, [type]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!type) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case 'correct':
      case 'success':
        return theme.colors.success;
      case 'wrong':
        return theme.colors.error;
      case 'warning':
        return theme.colors.warning;
      default:
        return theme.colors.primary;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'correct':
      case 'success':
        return '✓';
      case 'wrong':
        return '✗';
      case 'warning':
        return '⚠';
      default:
        return '!';
    }
  };

  const getMessage = () => {
    if (message) return message;

    switch (type) {
      case 'correct':
        return '정답!';
      case 'wrong':
        return '오답!';
      case 'success':
        return '성공!';
      case 'warning':
        return '주의!';
      default:
        return '';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor() },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <Text style={styles.icon}>{getIcon()}</Text>
      <Text style={styles.message}>{getMessage()}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
  },
  icon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  message: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
});
