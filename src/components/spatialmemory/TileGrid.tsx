import React from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { useSpatialMemoryStore } from '../../game/spatialmemory/store';
import { GRID_SIZES } from '../../game/spatialmemory/types';
import { hapticPatterns } from '../../utils/haptics';

const { width } = Dimensions.get('window');
const GRID_PADDING = 20;
const TILE_GAP = 8;

const TileGrid: React.FC = () => {
  const { tiles, settings, gameStatus, handleTilePress } = useSpatialMemoryStore();
  const { rows, cols } = GRID_SIZES[settings.difficulty];

  const gridWidth = width - GRID_PADDING * 2;
  const tileSize = (gridWidth - TILE_GAP * (cols - 1)) / cols;

  const onTilePress = (tileId: number) => {
    if (gameStatus === 'input') {
      hapticPatterns.buttonPress();
      handleTilePress(tileId);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.grid, { width: gridWidth }]}>
        {tiles.map((tile) => (
          <Tile
            key={tile.id}
            tile={tile}
            size={tileSize}
            onPress={() => onTilePress(tile.id)}
            disabled={gameStatus !== 'input'}
          />
        ))}
      </View>
    </View>
  );
};

interface TileProps {
  tile: { id: number; isActive: boolean; isHighlighted: boolean };
  size: number;
  onPress: () => void;
  disabled: boolean;
}

const Tile: React.FC<TileProps> = ({ tile, size, onPress, disabled }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = tile.isActive || tile.isHighlighted
      ? withSpring(1.1, { damping: 10, stiffness: 100 })
      : withSpring(1, { damping: 10, stiffness: 100 });

    return {
      transform: [{ scale }],
    };
  });

  const backgroundColor = tile.isActive
    ? '#3b82f6' // 파란색 (보여주기)
    : tile.isHighlighted
    ? '#10b981' // 초록색 (사용자 입력)
    : '#475569'; // 기본 회색

  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <Animated.View
        style={[
          styles.tile,
          {
            width: size,
            height: size,
            backgroundColor,
          },
          animatedStyle,
        ]}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: GRID_PADDING,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TILE_GAP,
  },
  tile: {
    borderRadius: 12,
    marginBottom: TILE_GAP,
  },
});

export default TileGrid;
