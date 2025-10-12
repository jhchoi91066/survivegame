import React, { useEffect } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Card as CardType } from '../../game/flipmatch/types';
import { useTheme } from '../../contexts/ThemeContext';
import { soundManager } from '../../utils/soundManager';

interface CardProps {
  card: CardType;
  onPress: () => void;
}

const Card: React.FC<CardProps> = ({ card, onPress }) => {
  const { theme } = useTheme();
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withTiming(card.isFlipped ? 180 : 0, { duration: 300 });
    if (card.isFlipped && !card.isMatched) {
      soundManager.playSound('card_flip');
    }
  }, [card.isFlipped]);

  useEffect(() => {
    if (card.isMatched) {
      soundManager.playSound('card_match');
    }
  }, [card.isMatched]);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(rotation.value, [0, 180], [0, 180]);
    return { transform: [{ rotateY: `${rotateValue}deg` }] };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(rotation.value, [0, 180], [180, 360]);
    return { transform: [{ rotateY: `${rotateValue}deg` }] };
  });

  const cardMatchedStyle = card.isMatched && {
    opacity: 0.6,
    backgroundColor: theme.colors.success,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={card.isFlipped || card.isMatched}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: theme.colors.primary },
          cardMatchedStyle,
          frontAnimatedStyle,
        ]}
      >
        <Text style={[styles.cardBackText, { color: theme.colors.text }]}>?</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.card,
          styles.cardBack,
          { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border 
          },
          cardMatchedStyle,
          backAnimatedStyle,
        ]}
      >
        <Text style={[styles.cardValue, { color: theme.colors.text }]}>{card.value}</Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backfaceVisibility: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  cardBack: {
    borderWidth: 2,
  },
  cardBackText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  cardValue: {
    fontSize: 40,
  },
});

export default Card;