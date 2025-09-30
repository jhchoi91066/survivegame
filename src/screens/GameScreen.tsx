import React from 'react';
import { View, StyleSheet, SafeAreaView, Text, Button } from 'react-native';
import GameBoard from '../game/GameBoard';
import { useGameStore } from '../game/store';

const GameScreen: React.FC = () => {
  const turn = useGameStore((state) => state.turn);
  const nextTurn = useGameStore((state) => state.nextTurn);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.turnText}>Turn: {turn}</Text>
      <GameBoard />
      <View style={styles.buttonContainer}>
        <Button title="End Turn" onPress={nextTurn} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 20,
  },
});

export default GameScreen;
