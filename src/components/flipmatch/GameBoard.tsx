import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useFlipMatchStore } from '../../game/flipmatch/store';
import { GRID_SIZES } from '../../game/flipmatch/types';
import Card from './Card';

const { width: screenWidth } = Dimensions.get('window');

const GameBoard: React.FC = () => {
  const { cards, settings, flipCard } = useFlipMatchStore();
  const { rows, cols } = GRID_SIZES[settings.difficulty];

  // 카드 간격 계산
  const padding = 8;
  const gap = 6;
  const containerWidth = Math.min(screenWidth - padding * 2, 500);

  return (
    <View style={styles.container}>
      <View style={[styles.grid, { width: containerWidth, aspectRatio: cols / rows }]}>
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
    paddingVertical: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardWrapper: {
    aspectRatio: 1,
  },
});

export default GameBoard;
