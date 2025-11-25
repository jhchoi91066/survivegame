import React, { useEffect } from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Card as CardType } from '../../game/flipmatch/types';
import { useTheme } from '../../contexts/ThemeContext';
import { soundManager } from '../../utils/soundManager';
import { Brain } from 'lucide-react-native';

interface CardProps {
  card: CardType;
  onPress: () => void;
}

const Card: React.FC<CardProps> = ({ card, onPress }) => {
  const { theme } = useTheme();
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    rotation.value = withTiming(card.isFlipped ? 180 : 0, { duration: 400 });
    if (card.isFlipped && !card.isMatched) {
      soundManager.playSound('card_flip');
    }
  }, [card.isFlipped]);

  useEffect(() => {
    if (card.isMatched) {
      scale.value = withSequence(
        withSpring(1.1, { damping: 12, stiffness: 100 }),
        withSpring(1, { damping: 15, stiffness: 100 })
      );
      soundManager.playSound('card_match');
    }
  }, [card.isMatched]);

  const handlePress = () => {
    if (!card.isFlipped && !card.isMatched) {
      scale.value = withSequence(
        withTiming(0.95, { duration: 50 }),
        withTiming(1, { duration: 50 })
      );
    }
    onPress();
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(rotation.value, [0, 180], [180, 360]);
    const opacity = interpolate(rotation.value, [0, 90, 180], [0, 0, 1]);
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateValue}deg` },
        { scale: scale.value },
      ],
      opacity,
      zIndex: card.isFlipped ? 1 : 0,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(rotation.value, [0, 180], [0, 180]);
    const opacity = interpolate(rotation.value, [0, 90, 180], [1, 0, 0]);
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateValue}deg` },
        { scale: scale.value },
      ],
      opacity,
      zIndex: card.isFlipped ? 0 : 1,
    };
  });

  return (
    <Pressable
      onPress={handlePress}
      disabled={card.isFlipped || card.isMatched}
      style={styles.container}
    >
      {/* Front Face (Content) - Initially Hidden */}
      <Animated.View
        style={[
          styles.card,
          styles.cardFront,
          {
            backgroundColor: card.isMatched ? '#10b981' : '#4f46e5', // Emerald-500 or Indigo-600
            borderColor: card.isMatched ? '#34d399' : '#818cf8',
            shadowColor: card.isMatched ? '#10b981' : '#4f46e5',
          },
          frontAnimatedStyle,
        ]}
      >
        <Text style={styles.cardValue}>{card.value}</Text>
      </Animated.View>

      {/* Back Face (Brain Icon) - Initially Visible */}
      <Animated.View
        style={[
          styles.card,
          styles.cardBack,
          {
            backgroundColor: '#1e293b', // Slate-800
            borderColor: '#334155', // Slate-700
          },
          backAnimatedStyle,
        ]}
      >
        <View style={styles.iconContainer}>
          <Brain size={20} color="#475569" />
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backfaceVisibility: 'hidden',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cardFront: {
    // Dynamic background color
  },
  cardBack: {
    shadowColor: '#000',
  },
  cardValue: {
    fontSize: 32,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(51, 65, 85, 0.5)', // Slate-700/50
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Card;