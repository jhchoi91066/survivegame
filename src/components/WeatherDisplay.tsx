import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useGameStore } from '../game/store';
import { WEATHER_CONFIG } from '../game/weather';

const WeatherDisplay: React.FC = React.memo(() => {
  const weather = useGameStore((state) => state.weather);

  const config = useMemo(() => {
    if (!weather) return null;
    return WEATHER_CONFIG[weather.type];
  }, [weather]);

  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const emojiRotation = useSharedValue(0);

  // Trigger animations when weather changes
  useEffect(() => {
    if (weather && config) {
      // Fade in and scale up
      opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
      scale.value = withSequence(
        withTiming(1.1, { duration: 300, easing: Easing.out(Easing.back(1.5)) }),
        withTiming(1, { duration: 200 })
      );

      // Emoji shake/rotate animation
      emojiRotation.value = withSequence(
        withTiming(-10, { duration: 100 }),
        withTiming(10, { duration: 100 }),
        withTiming(-5, { duration: 100 }),
        withTiming(5, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
    } else {
      // Fade out when weather ends
      opacity.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(0.8, { duration: 300 });
    }
  }, [weather?.type, config]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const emojiAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${emojiRotation.value}deg` }],
  }));

  if (!weather || !config) return null;

  return (
    <Animated.View style={[styles.container, { borderColor: config.color }, containerAnimatedStyle]}>
      <Animated.Text style={[styles.emoji, emojiAnimatedStyle]}>
        {config.emoji}
      </Animated.Text>
      <View style={styles.info}>
        <Text style={[styles.name, { color: config.color }]}>{config.name}</Text>
        <Text style={styles.description}>{config.description}</Text>
        {weather.turnsRemaining > 0 && (
          <Text style={styles.turns}>
            남은 턴: {weather.turnsRemaining}
          </Text>
        )}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emoji: {
    fontSize: 32,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  description: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  turns: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '600',
  },
});

export default WeatherDisplay;