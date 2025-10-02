import React from 'react';
import { View, StyleSheet } from 'react-native';
import Tile, { TILE_SIZE } from './Tile';
import Survivor from './Survivor';
import { useGameStore } from './store';
import { ObstacleState } from './obstacles';
import ChainReactionEffect from '../components/ChainReactionEffect';

interface GameBoardProps {
  onObstacleClick?: (obstacle: ObstacleState) => void;
  onSurvivorClick?: (survivor: any) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ onObstacleClick, onSurvivorClick }) => {
  const survivors = useGameStore((state) => state.survivors);
  const gridWidth = useGameStore((state) => state.gridWidth);
  const gridHeight = useGameStore((state) => state.gridHeight);
  const chainReactionEvents = useGameStore((state) => state.chainReactionEvents);
  const clearChainReactionEvent = useGameStore((state) => state.clearChainReactionEvent);

  const renderTiles = () => {
    const tiles = [];
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        tiles.push(<Tile key={`${x}-${y}`} x={x} y={y} onObstacleClick={onObstacleClick} />);
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
        onPress={onSurvivorClick}
      />
    ));
  };

  const renderChainReactionEffects = () => {
    return chainReactionEvents.map((event) => (
      <ChainReactionEffect
        key={event.id}
        type={event.type}
        x={event.x * TILE_SIZE + TILE_SIZE / 2 - 30}
        y={event.y * TILE_SIZE + TILE_SIZE / 2 - 30}
        visible={true}
        onComplete={() => clearChainReactionEvent(event.id)}
      />
    ));
  };

  return (
    <View style={styles.boardContainer}>
      <View style={styles.tileGrid}>{renderTiles()}</View>
      {renderSurvivors()}
      {renderChainReactionEffects()}
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
