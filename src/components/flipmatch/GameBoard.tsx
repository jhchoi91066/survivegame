import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useFlipMatchStore } from '../../game/flipmatch/store';
import { GRID_SIZES } from '../../game/flipmatch/types';
import Card from './Card';

const GameBoard: React.FC = () => {
  const { cards, settings, flipCard } = useFlipMatchStore();
  const { rows, cols } = GRID_SIZES[settings.difficulty];

  const gap = 6;

  return (
    <View style={styles.container}>
      <View style={[styles.grid, { aspectRatio: cols / rows }]}>
        {cards.map((card) => (
          <View
            key={card.id}
            style={[
              styles.cardWrapper,
              {
                width: `${100 / cols}%`,
                padding: gap / 2,
              },
            ]}
          >
            <Card card={card} onPress={() => flipCard(card.id)} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    padding: 16,
  },
  grid: {
    width: '100%',
    maxWidth: 600, // Limit max width for larger screens
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'center',
  },
  cardWrapper: {
    aspectRatio: 1,
  },
});

export default GameBoard;