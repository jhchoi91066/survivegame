import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  gradientColors?: [string, string];
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = '로딩 중...',
  size = 'large',
  color = '#6366f1',
  gradientColors = ['#6366f1', '#8b5cf6'],
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, animatedStyle]}>
        <LinearGradient
          colors={gradientColors}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.icon}>🎮</Text>
        </LinearGradient>
      </Animated.View>
      <ActivityIndicator size={size} color={color} style={styles.spinner} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

/**
 * 전체 화면 로딩 오버레이
 */
interface FullScreenLoadingProps {
  visible: boolean;
  message?: string;
  gradientColors?: [string, string];
}

export const FullScreenLoading: React.FC<FullScreenLoadingProps> = ({
  visible,
  message = '게임 준비 중...',
  gradientColors = ['#6366f1', '#8b5cf6'],
}) => {
  if (!visible) return null;

  return (
    <View style={styles.fullScreenContainer}>
      <LinearGradient
        colors={['rgba(15, 23, 42, 0.95)', 'rgba(30, 41, 59, 0.95)']}
        style={styles.fullScreenGradient}
      >
        <LoadingIndicator message={message} gradientColors={gradientColors} />
      </LinearGradient>
    </View>
  );
};

/**
 * 인라인 로딩 (작은 영역용)
 */
interface InlineLoadingProps {
  message?: string;
  color?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  message,
  color = '#6366f1',
}) => {
  return (
    <View style={styles.inlineContainer}>
      <ActivityIndicator size="small" color={color} />
      {message && <Text style={[styles.inlineMessage, { color }]}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 40,
  },
  spinner: {
    marginVertical: 16,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginTop: 8,
  },
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  fullScreenGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  inlineMessage: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 10,
  },
});

export default LoadingIndicator;
