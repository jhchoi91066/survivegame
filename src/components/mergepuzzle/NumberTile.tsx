import React, { useEffect } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';

interface NumberTileProps {
  value: number;
  isSelected: boolean;
  isMerged: boolean;
  onPress: () => void;
}

const NumberTile: React.FC<NumberTileProps> = ({ value, isSelected, isMerged, onPress }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isMerged) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 10 }),
        withSpring(1, { damping: 10 })
      );
    }
  }, [isMerged]);

  useEffect(() => {
    scale.value = withSpring(isSelected ? 1.1 : 1, { damping: 10 });
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getTileColor = (num: number): string => {
    const colors: { [key: number]: string } = {
      2: '#eee4da',
      4: '#ede0c8',
      8: '#f2b179',
      16: '#f59563',
      32: '#f67c5f',
      64: '#f65e3b',
      128: '#edcf72',
      256: '#edcc61',
      512: '#edc850',
      1024: '#edc53f',
      2048: '#edc22e',
    };
    return colors[num] || '#3c3a32';
  };

  const getTextColor = (num: number): string => {
    return num <= 4 ? '#776e65' : '#f9f6f2';
  };

  return (
    <Animated.View style={[animatedStyle]}>
      <Pressable
        style={[
          styles.tile,
          { backgroundColor: getTileColor(value) },
          isSelected && styles.selectedTile,
        ]}
        onPress={onPress}
      >
        <Text style={[styles.tileText, { color: getTextColor(value) }]}>{value}</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tile: {
    width: 100,
    height: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  selectedTile: {
    borderWidth: 4,
    borderColor: '#22d3ee',
  },
  tileText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
});

export default NumberTile;
