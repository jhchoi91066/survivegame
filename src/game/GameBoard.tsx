import React from 'react';
import { View, StyleSheet } from 'react-native';
import Tile from './Tile';
import Survivor from './Survivor';
import { useGameStore } from './store';

const GRID_SIZE = 5;

const GameBoard: React.FC = () => {
  const survivors = useGameStore((state) => state.survivors);

  const renderTiles = () => {
    const tiles = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        tiles.push(<Tile key={`${x}-${y}`} x={x} y={y} />);
      }
    }
    return tiles;
  };

  const renderSurvivors = () => {
    return survivors.map((survivor) => (
      <Survivor
        key={survivor.id}
        id={survivor.id}
        x={survivor.x}
        y={survivor.y}
      />
    ));
  };

  return (
    <View style={styles.boardContainer}>
      <View style={styles.tileGrid}>{renderTiles()}</View>
      {renderSurvivors()}
    </View>
  );
};

const styles = StyleSheet.create({
  boardContainer: {
    position: 'relative',
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

export default GameBoard;
