import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSpatialMemoryStore } from '../../game/spatialmemory/store';
import { GRID_SIZES } from '../../game/spatialmemory/types';
import { hapticPatterns } from '../../utils/haptics';
import { soundManager } from '../../utils/soundManager';
import { useTheme } from '../../contexts/ThemeContext';

const TILE_GAP = 8;

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
      const result = handleTilePress(tileId);
      // 정답/오답 사운드는 store에서 직접 처리하는 것이 나을 수 있지만,
      // 여기서는 간단하게 버튼 클릭 사운드만 재생
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
}

const Tile: React.FC<TileProps> = ({ tile, onPress, disabled, cols }) => {
  const { theme } = useTheme();

  const backgroundColor = tile.isActive
    ? theme.colors.primary
    : tile.isHighlighted
    ? theme.colors.success
    : theme.colors.surfaceSecondary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.tileWrapper, { width: `${100 / cols}%` }]}
    >
      <View style={[styles.tile, { backgroundColor }]} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: TILE_GAP,
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tileWrapper: {
    padding: TILE_GAP / 2,
    aspectRatio: 1,
  },
  tile: {
    flex: 1,
    borderRadius: 12,
  },
});

export default TileGrid;
