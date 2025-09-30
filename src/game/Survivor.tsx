import React, { useEffect } from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { TILE_SIZE } from './Tile';
import { useGameStore } from './store';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface SurvivorProps {
  id: string;
  x: number;
  y: number;
}

const Survivor: React.FC<SurvivorProps> = ({ id, x, y }) => {
  const { selectedSurvivorId, movedSurvivorIds, selectSurvivor, survivors } = useGameStore(
    (state) => ({
      selectedSurvivorId: state.selectedSurvivorId,
      movedSurvivorIds: state.movedSurvivorIds,
      selectSurvivor: state.selectSurvivor,
      survivors: state.survivors,
    }),
  );

  const survivor = survivors.find(s => s.id === id);
  const role = survivor?.role || 'engineer';

  const isSelected = id === selectedSurvivorId;
  const hasMoved = movedSurvivorIds.includes(id);

  const offsetX = useSharedValue(x * TILE_SIZE);
  const offsetY = useSharedValue(y * TILE_SIZE);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    offsetX.value = withSpring(x * TILE_SIZE, {
      damping: 15,
      stiffness: 150,
    });
    offsetY.value = withSpring(y * TILE_SIZE, {
      damping: 15,
      stiffness: 150,
    });
  }, [x, y, offsetX, offsetY]);

  useEffect(() => {
    scale.value = withSpring(isSelected ? 1.1 : 1, {
      damping: 12,
      stiffness: 200,
    });
  }, [isSelected, scale]);

  useEffect(() => {
    opacity.value = withSpring(hasMoved ? 0.5 : 1, {
      damping: 10,
      stiffness: 100,
    });
  }, [hasMoved, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: 0,
      top: 0,
      transform: [
        { translateX: offsetX.value },
        { translateY: offsetY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  const roleColor = getRoleColor(role);

  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPress={() => selectSurvivor(id)} disabled={hasMoved}>
        <Animated.View style={[
          styles.survivor,
          { backgroundColor: roleColor },
          isSelected && styles.selected
        ]}>
          <Text style={styles.text}>S</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

// Get role-based color
const getRoleColor = (role: string): string => {
  switch (role) {
    case 'engineer':
      return '#f59e0b'; // amber-500
    case 'doctor':
      return '#ef4444'; // red-500
    case 'chef':
      return '#8b5cf6'; // violet-500
    case 'child':
      return '#06b6d4'; // cyan-500
    default:
      return '#6b7280'; // gray-500
  }
};

const styles = StyleSheet.create({
  survivor: {
    width: TILE_SIZE * 0.7,
    height: TILE_SIZE * 0.7,
    borderRadius: (TILE_SIZE * 0.7) / 2,
    backgroundColor: '#3b82f6', // blue-500
    justifyContent: 'center',
    alignItems: 'center',
    margin: TILE_SIZE * 0.15, // Center the survivor within the tile area
  },
  selected: {
    borderColor: '#facc15', // yellow-400
    borderWidth: 3,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: TILE_SIZE * 0.4,
  },
});

export default Survivor;
