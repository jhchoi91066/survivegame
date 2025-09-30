import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { useGameStore } from '../game/store';

interface GameOverModalProps {
  visible: boolean;
  onRestart: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ visible, onRestart }) => {
  const { gameStatus, timeRemaining, turn, survivors } = useGameStore((state) => ({
    gameStatus: state.gameStatus,
    timeRemaining: state.timeRemaining,
    turn: state.turn,
    survivors: state.survivors,
  }));

  if (!visible || (gameStatus !== 'victory' && gameStatus !== 'defeat')) {
    return null;
  }

  const isVictory = gameStatus === 'victory';

  // Calculate statistics
  const totalHealth = survivors.reduce((sum, s) => sum + s.health, 0);
  const avgHealth = Math.floor(totalHealth / survivors.length);
  const totalEnergy = survivors.reduce((sum, s) => sum + s.energy, 0);
  const avgEnergy = Math.floor(totalEnergy / survivors.length);

  // Star rating (1-3 stars)
  let stars = 1;
  if (isVictory) {
    if (timeRemaining > 60 && avgHealth > 80) stars = 3;
    else if (timeRemaining > 30 || avgHealth > 50) stars = 2;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRestart}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={[styles.title, isVictory ? styles.victoryTitle : styles.defeatTitle]}>
            {isVictory ? '🎉 구조 성공!' : '💀 실패...'}
          </Text>

          {isVictory && (
            <View style={styles.stars}>
              <Text style={styles.starText}>
                {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
              </Text>
            </View>
          )}

          <View style={styles.stats}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>총 턴 수:</Text>
              <Text style={styles.statValue}>{turn}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>남은 시간:</Text>
              <Text style={styles.statValue}>
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>평균 체력:</Text>
              <Text style={styles.statValue}>{avgHealth}%</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>평균 에너지:</Text>
              <Text style={styles.statValue}>{avgEnergy}%</Text>
            </View>
          </View>

          <Pressable style={styles.button} onPress={onRestart}>
            <Text style={styles.buttonText}>다시 시작</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  victoryTitle: {
    color: '#10b981', // green-500
  },
  defeatTitle: {
    color: '#ef4444', // red-500
  },
  stars: {
    alignItems: 'center',
    marginBottom: 20,
  },
  starText: {
    fontSize: 32,
  },
  stats: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GameOverModal;