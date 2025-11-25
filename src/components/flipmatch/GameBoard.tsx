import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useFlipMatchStore } from '../../game/flipmatch/store';
import { GRID_SIZES } from '../../game/flipmatch/types';
import Card from './Card';

const GameBoard: React.FC = () => {
  const { cards, settings, flipCard } = useFlipMatchStore();
  const { rows, cols } = GRID_SIZES[settings.difficulty];
  const [boardSize, setBoardSize] = React.useState({ width: 0, height: 0 });

  const gap = 6;

  const onLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setBoardSize({ width, height });
  };

  // Calculate card size to fit within the board
  const calculateCardSize = () => {
    if (boardSize.width === 0 || boardSize.height === 0) return 0;

    const availableWidth = boardSize.width - (gap * (cols + 1)); // Padding included in gap calculation logic roughly
    const availableHeight = boardSize.height - (gap * (rows + 1));

    const cardWidth = availableWidth / cols;
    const cardHeight = availableHeight / rows;

    // Use the smaller dimension to ensure it fits
    return Math.min(cardWidth, cardHeight);
  };

  const cardSize = calculateCardSize();
  const totalBoardWidth = cardSize * cols + gap * (cols - 1); // Actual width used
  // We don't strictly need totalBoardHeight for styling the grid container if we center content

  return (
    <View style={styles.container} onLayout={onLayout}>
      {cardSize > 0 && (
        <View style={[styles.grid, { width: totalBoardWidth }]}>
          {cards.map((card) => (
            <View
              key={card.id}
              style={[
                styles.cardWrapper,
                {
                  width: cardSize,
                  height: cardSize,
                  margin: gap / 2,
                },
              ]}
            >
              <Card card={card} onPress={() => flipCard(card.id)} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    aspectRatio: 1,
  },
});

export default GameBoard;