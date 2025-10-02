import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useGameStore } from '../game/store';

const PlanningTimer: React.FC = () => {
  const gamePhase = useGameStore((state) => state.gamePhase);
  const planningTimeRemaining = useGameStore((state) => state.planningTimeRemaining);
  const gameStatus = useGameStore((state) => state.gameStatus);
  const tickPlanningTimer = useGameStore((state) => state.tickPlanningTimer);
  const executeActions = useGameStore((state) => state.executeActions);

  useEffect(() => {
    if (gamePhase !== 'planning' || gameStatus !== 'playing') return;

    const interval = setInterval(() => {
      tickPlanningTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [gamePhase, gameStatus, tickPlanningTimer]);

  if (gamePhase !== 'planning') return null;

  const minutes = Math.floor(planningTimeRemaining / 60);
  const seconds = planningTimeRemaining % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // 시간에 따른 색상 변화
  const getTimerColor = () => {
    if (planningTimeRemaining > 30) return '#10b981'; // green
    if (planningTimeRemaining > 10) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const handleEndPlanning = () => {
    executeActions();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.timerBox, { backgroundColor: getTimerColor() }]}>
        <Text style={styles.label}>계획 시간</Text>
        <Text style={styles.timer}>{timeString}</Text>
      </View>
      <Pressable style={styles.endButton} onPress={handleEndPlanning}>
        <Text style={styles.endButtonText}>계획 완료</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerBox: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  timer: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  endButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  endButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PlanningTimer;
