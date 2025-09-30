import React from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';

import { useGameStore } from './store';

const { width: screenWidth } = Dimensions.get('window');
export const TILE_SIZE = Math.floor((screenWidth * 0.9) / 5);

interface TileProps {
  x: number;
  y: number;
}

const Tile: React.FC<TileProps> = ({ x, y }) => {
  const { selectedSurvivorId, moveSurvivor, getValidMoves } = useGameStore(state => ({
    selectedSurvivorId: state.selectedSurvivorId,
    moveSurvivor: state.moveSurvivor,
    getValidMoves: state.getValidMoves,
  }));

  const isValidMove = selectedSurvivorId
    ? getValidMoves(selectedSurvivorId).some(move => move.x === x && move.y === y)
    : false;

  const handlePress = () => {
    if (selectedSurvivorId) {
      moveSurvivor(selectedSurvivorId, x, y);
    } else {
      console.log(`Tapped tile at (${x}, ${y})`);
    }
  };

  return (
    <Pressable
      style={[styles.tile, isValidMove && styles.validMove]}
      onPress={handlePress}
    >
      {/* Tile is now just a pressable area */}
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
});

export default Tile;
