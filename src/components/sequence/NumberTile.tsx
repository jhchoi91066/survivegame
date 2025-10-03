import React, { useEffect } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Tile } from '../../game/sequence/types';

interface NumberTileProps {
  tile: Tile;
  onPress: () => void;
}

const NumberTile: React.FC<NumberTileProps> = ({ tile, onPress }) => {
  const scale = useSharedValue(1);
  const backgroundColor = useSharedValue(0);

  useEffect(() => {
    if (tile.isCorrect) {
      // 정답 애니메이션
      scale.value = withSequence(
        withSpring(1.2),
        withSpring(1)
      );
      backgroundColor.value = withTiming(1, { duration: 300 });
    } else if (tile.isWrong) {
      // 오답 애니메이션
      scale.value = withSequence(
        withTiming(0.9, { duration: 100 }),
        withTiming(1.1, { duration: 100 }),
        withTiming(0.9, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      backgroundColor.value = withTiming(2, { duration: 300 });
    }
  }, [tile.isCorrect, tile.isWrong]);

  const animatedStyle = useAnimatedStyle(() => {
    let bgColor = '#3b82f6'; // blue-500
    if (backgroundColor.value === 1) {
      bgColor = '#10b981'; // green-500
    } else if (backgroundColor.value === 2) {
      bgColor = '#ef4444'; // red-500
    }

    return {
      transform: [{ scale: scale.value }],
      backgroundColor: bgColor,
      opacity: tile.isClicked ? 0.3 : 1,
    };
  });

  return (
    <Pressable
      onPress={onPress}
      disabled={tile.isClicked}
      style={[
        styles.container,
        {
          left: `${tile.position.x * 20}%`,
          top: `${tile.position.y * 20}%`,
        },
      ]}
    >
      <Animated.View style={[styles.tile, animatedStyle]}>
        <Text style={styles.number}>{tile.number}</Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '20%',
    aspectRatio: 1,
    padding: 4,
  },
  tile: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  number: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default NumberTile;
