import React from 'react';
import { View, StyleSheet, Dimensions, Pressable, Text } from 'react-native';

import { useGameStore } from './store';
import { OBSTACLE_CONFIG } from './obstacles';

const { width: screenWidth } = Dimensions.get('window');
export const TILE_SIZE = Math.floor((screenWidth * 0.9) / 5);

interface TileProps {
  x: number;
  y: number;
}

const Tile: React.FC<TileProps> = ({ x, y }) => {
  const { selectedSurvivorId, moveSurvivor, getValidMoves, getObstacleAt } = useGameStore(state => ({
    selectedSurvivorId: state.selectedSurvivorId,
    moveSurvivor: state.moveSurvivor,
    getValidMoves: state.getValidMoves,
    getObstacleAt: state.getObstacleAt,
  }));

  const isValidMove = selectedSurvivorId
    ? getValidMoves(selectedSurvivorId).some(move => move.x === x && move.y === y)
    : false;

  const obstacle = getObstacleAt(x, y);

  const handlePress = () => {
    if (selectedSurvivorId) {
      moveSurvivor(selectedSurvivorId, x, y);
    }
  };

  return (
    <Pressable
      style={[styles.tile, isValidMove && styles.validMove]}
      onPress={handlePress}
    >
      {obstacle && (
        <View style={[
          styles.obstacleContainer,
          { backgroundColor: OBSTACLE_CONFIG[obstacle.type]?.color || '#6b7280' }
        ]}>
          <Text style={styles.obstacleEmoji}>
            {OBSTACLE_CONFIG[obstacle.type]?.emoji || '❓'}
          </Text>
          {obstacle.turnsBuildRemaining !== undefined && obstacle.turnsBuildRemaining > 0 && (
            <Text style={styles.buildTurns}>{obstacle.turnsBuildRemaining}</Text>
          )}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  validMove: {
    backgroundColor: '#10b981', // green-500
    opacity: 0.3,
    borderColor: '#059669', // green-600
    borderWidth: 2,
  },
  obstacleContainer: {
    width: '80%',
    height: '80%',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  obstacleEmoji: {
    fontSize: TILE_SIZE * 0.5,
  },
  buildTurns: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
});

export default Tile;
