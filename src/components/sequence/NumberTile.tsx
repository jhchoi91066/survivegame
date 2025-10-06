import React, { useEffect } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Tile } from '../../game/sequence/types';
import { useTheme } from '../../contexts/ThemeContext';

interface NumberTileProps {
  tile: Tile;
  onPress: () => void;
}

const NumberTile: React.FC<NumberTileProps> = ({ tile, onPress }) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (tile.isCorrect) {
      scale.value = withSequence(withTiming(1.2), withTiming(1));
    } else if (tile.isWrong) {
      rotation.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 100 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [tile.isCorrect, tile.isWrong]);

  const animatedStyle = useAnimatedStyle(() => {
    const bgColor = tile.isCorrect
      ? theme.colors.success
      : tile.isWrong
      ? theme.colors.error
      : theme.colors.primary;

    return {
      transform: [{ scale: scale.value }, { rotateZ: `${rotation.value}deg` }],
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
        <Text style={[styles.number, { color: '#fff' }]}>{tile.number}</Text>
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
  },
});

export default NumberTile;