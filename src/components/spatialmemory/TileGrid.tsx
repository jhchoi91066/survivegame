import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolateColor
} from 'react-native-reanimated';
import { useSpatialMemoryStore } from '../../game/spatialmemory/store';
import { GRID_SIZES } from '../../game/spatialmemory/types';
import { hapticPatterns } from '../../utils/haptics';
import { soundManager } from '../../utils/soundManager';
import { useTheme } from '../../contexts/ThemeContext';

const TILE_GAP = 12;

const TileGrid: React.FC = () => {
  const { tiles, settings, gameStatus, handleTilePress } = useSpatialMemoryStore();
  const { rows, cols } = GRID_SIZES[settings.difficulty];

  // 타일 표시 시 사운드
  useEffect(() => {
    if (gameStatus === 'showing') {
      soundManager.playSound('tile_show');
    }
  }, [gameStatus]);

  const onTilePress = (tileId: number) => {
    if (gameStatus === 'input') {
      hapticPatterns.buttonPress();
      handleTilePress(tileId);
      soundManager.playSound('button_press');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.grid, { aspectRatio: cols / rows }]}>
        {tiles.map((tile) => (
          <Tile
            key={tile.id}
            tile={tile}
            onPress={() => onTilePress(tile.id)}
            disabled={gameStatus !== 'input'}
            cols={cols}
            gameStatus={gameStatus}
          />
        ))}
      </View>
    </View>
  );
};

interface TileProps {
  tile: { id: number; isActive: boolean; isHighlighted: boolean };
  onPress: () => void;
  disabled: boolean;
  cols: number;
  gameStatus: string;
}

const Tile: React.FC<TileProps> = ({ tile, onPress, disabled, cols, gameStatus }) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    if (tile.isActive) {
      scale.value = withSequence(
        withSpring(1.1, { damping: 10 }),
        withSpring(1)
      );
      opacity.value = withTiming(1, { duration: 200 });
    } else if (tile.isHighlighted) {
      scale.value = withSequence(
        withSpring(0.9, { damping: 10 }),
        withSpring(1)
      );
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      opacity.value = withTiming(0.3, { duration: 300 });
      scale.value = withTiming(1);
    }
  }, [tile.isActive, tile.isHighlighted]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
      backgroundColor: tile.isActive
        ? '#fff'
        : tile.isHighlighted
          ? '#a855f7' // Purple-500
          : 'rgba(255,255,255,0.5)',
    };
  });

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.tileWrapper, { width: `${100 / cols}%` }]}
    >
      <Animated.View style={[styles.tile, animatedStyle]} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: TILE_GAP,
    width: '100%',
  },
  grid: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tileWrapper: {
    padding: TILE_GAP / 2,
    aspectRatio: 1,
  },
  tile: {
    flex: 1,
    borderRadius: 16,
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default TileGrid;
