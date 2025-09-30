import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGameStore } from '../game/store';
import { formatTime, getUrgencyLevel, getTimerColor } from '../game/timer';

const GameTimer: React.FC = () => {
  const timeRemaining = useGameStore((state) => state.timeRemaining);
  const gameStatus = useGameStore((state) => state.gameStatus);
  const tickTimer = useGameStore((state) => state.tickTimer);

  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const interval = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStatus, tickTimer]);

  const urgencyLevel = getUrgencyLevel(timeRemaining);
  const timerColor = getTimerColor(urgencyLevel);

  return (
    <View style={[styles.container, { borderColor: timerColor }]}>
      <Text style={styles.label}>시간</Text>
      <Text style={[styles.time, { color: timerColor }]}>
        {formatTime(timeRemaining)}
      </Text>
      {urgencyLevel === 'critical' && (
        <Text style={styles.warningText}>⚠️ 시간 부족!</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 3,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  time: {
    fontSize: 32,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  warningText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
    marginTop: 4,
  },
});

export default GameTimer;