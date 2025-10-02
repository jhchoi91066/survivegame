import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';

export type ChainReactionEffectType = 'flood' | 'explosion' | 'fire_spread' | 'extinguish' | 'melt';

interface ChainReactionEffectProps {
  type: ChainReactionEffectType;
  x: number;
  y: number;
  visible: boolean;
  onComplete?: () => void;
}

const ChainReactionEffect: React.FC<ChainReactionEffectProps> = ({
  type,
  x,
  y,
  visible,
  onComplete,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // 애니메이션 시작
      scale.value = withSequence(
        withTiming(0.5, { duration: 100 }),
        withTiming(1.5, { duration: 400 }),
        withTiming(0, { duration: 200 }, () => {
          if (onComplete) {
            runOnJS(onComplete)();
          }
        })
      );

      opacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0.8, { duration: 400 }),
        withTiming(0, { duration: 200 })
      );

      // 폭발 효과는 회전 추가
      if (type === 'explosion') {
        rotation.value = withTiming(360, { duration: 700 });
      }
    }
  }, [visible, type]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
    opacity: opacity.value,
  }));

  const getEffectEmoji = () => {
    switch (type) {
      case 'explosion':
        return '💥';
      case 'flood':
        return '🌊';
      case 'fire_spread':
        return '🔥';
      case 'extinguish':
        return '💧';
      case 'melt':
        return '💨';
      default:
        return '✨';
    }
  };

  const getEffectColor = () => {
    switch (type) {
      case 'explosion':
        return '#ef4444';
      case 'flood':
        return '#3b82f6';
      case 'fire_spread':
        return '#f97316';
      case 'extinguish':
        return '#06b6d4';
      case 'melt':
        return '#a5f3fc';
      default:
        return '#fbbf24';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: x,
          top: y,
          backgroundColor: getEffectColor(),
        },
        animatedStyle,
      ]}
    >
      <Text style={styles.emoji}>{getEffectEmoji()}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  emoji: {
    fontSize: 32,
  },
});

export default ChainReactionEffect;
