import React, { useEffect, useMemo } from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { TILE_SIZE } from './Tile';
import { useGameStore } from './store';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface SurvivorProps {
  id: string;
  x: number;
  y: number;
  onPress?: (survivor: any) => void;
}

const Survivor: React.FC<SurvivorProps> = React.memo(({ id, x, y, onPress }) => {
  const survivors = useGameStore(state => state.survivors);

  const survivor = useMemo(() => {
    return survivors.find(s => s.id === id);
  }, [survivors, id]);

  const role = survivor?.role || 'engineer';
  const isUsed = survivor?.used || false;

  const offsetX = useSharedValue(x * TILE_SIZE);
  const offsetY = useSharedValue(y * TILE_SIZE);
  const shakeX = useSharedValue(0);

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

  // Shake animation when taking damage
  useEffect(() => {
    if (survivor?.damageTrigger) {
      shakeX.value = withSequence(
        withTiming(5, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [survivor?.damageTrigger, shakeX]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: 0,
      top: 0,
      transform: [
        { translateX: offsetX.value + shakeX.value },
        { translateY: offsetY.value },
      ],
    };
  });

  const roleColor = useMemo(() => getRoleColor(role), [role]);
  const roleEmoji = useMemo(() => getRoleEmoji(role), [role]);

  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPress={() => onPress && onPress(survivor)}>
        <Animated.View style={[
          styles.survivor,
          { backgroundColor: roleColor },
          isUsed && styles.usedSurvivor,
        ]}>
          <Text style={[styles.text, isUsed && styles.usedText]}>{roleEmoji}</Text>
          {isUsed && (
            <Text style={styles.usedBadge}>✓</Text>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

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

// Get role-based emoji
const getRoleEmoji = (role: string): string => {
  switch (role) {
    case 'engineer':
      return '👷';
    case 'doctor':
      return '👨‍⚕️';
    case 'chef':
      return '👨‍🍳';
    case 'child':
      return '👶';
    default:
      return '🧑';
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
    position: 'relative',
  },
  usedSurvivor: {
    opacity: 0.4,
    backgroundColor: '#9ca3af', // gray-400
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: TILE_SIZE * 0.4,
  },
  usedText: {
    opacity: 0.6,
  },
  usedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    fontSize: 14,
    backgroundColor: '#10b981', // green-500
    borderRadius: 10,
    width: 20,
    height: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default Survivor;
