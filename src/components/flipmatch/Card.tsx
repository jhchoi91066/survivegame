import React, { useEffect } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Card as CardType } from '../../game/flipmatch/types';

interface CardProps {
  card: CardType;
  onPress: () => void;
}

const Card: React.FC<CardProps> = ({ card, onPress }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    // 카드가 뒤집히면 애니메이션
    rotation.value = withTiming(card.isFlipped ? 180 : 0, { duration: 300 });
  }, [card.isFlipped]);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(rotation.value, [0, 180], [0, 180]);
    const opacity = interpolate(rotation.value, [0, 90, 180], [1, 0, 0]);

    return {
      transform: [{ rotateY: `${rotateValue}deg` }],
      opacity,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(rotation.value, [0, 180], [180, 360]);
    const opacity = interpolate(rotation.value, [0, 90, 180], [0, 0, 1]);

    return {
      transform: [{ rotateY: `${rotateValue}deg` }],
      opacity,
    };
  });

  return (
    <Pressable
      onPress={onPress}
      disabled={card.isFlipped || card.isMatched}
      style={styles.container}
    >
      {/* 앞면 (뒷면이 보이는 상태) */}
      <Animated.View
        style={[
          styles.card,
          styles.cardFront,
          card.isMatched && styles.cardMatched,
          frontAnimatedStyle,
        ]}
      >
        <Text style={styles.cardBack}>?</Text>
      </Animated.View>

      {/* 뒷면 (값이 보이는 상태) */}
      <Animated.View
        style={[
          styles.card,
          styles.cardBack,
          card.isMatched && styles.cardMatched,
          backAnimatedStyle,
        ]}
      >
        <Text style={styles.cardValue}>{card.value}</Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    aspectRatio: 1,
    padding: 4,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    backgroundColor: '#3b82f6', // blue-500
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardBack: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardMatched: {
    opacity: 0.6,
    backgroundColor: '#10b981', // green-500
  },
  cardBackText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  cardValue: {
    fontSize: 40,
  },
});

export default Card;
