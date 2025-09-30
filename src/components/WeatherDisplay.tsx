import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGameStore } from '../game/store';
import { WEATHER_CONFIG } from '../game/weather';

const WeatherDisplay: React.FC = () => {
  const weather = useGameStore((state) => state.weather);

  if (!weather) return null;

  const config = WEATHER_CONFIG[weather.type];

  return (
    <View style={[styles.container, { borderColor: config.color }]}>
      <Text style={styles.emoji}>{config.emoji}</Text>
      <View style={styles.info}>
        <Text style={[styles.name, { color: config.color }]}>{config.name}</Text>
        <Text style={styles.description}>{config.description}</Text>
        {weather.turnsRemaining > 0 && (
          <Text style={styles.turns}>
            남은 턴: {weather.turnsRemaining}
          </Text>
        )}
      </View>
    </View>
  );
};

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