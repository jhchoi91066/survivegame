import React from 'react';
import { View, StyleSheet, SafeAreaView, Text, Button, ScrollView } from 'react-native';
import GameBoard from '../game/GameBoard';
import { useGameStore } from '../game/store';
import SurvivorStatusBar from '../components/SurvivorStatusBar';
import ResourcePanel from '../components/ResourcePanel';

const GameScreen: React.FC = () => {
  const { turn, nextTurn, survivors, resources } = useGameStore((state) => ({
    turn: state.turn,
    nextTurn: state.nextTurn,
    survivors: state.survivors,
    resources: state.resources,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.turnText}>Turn: {turn}</Text>
          <ResourcePanel resources={resources} />
        </View>

        {/* Game Board */}
        <View style={styles.boardWrapper}>
          <GameBoard />
        </View>

        {/* Survivor Status Panel */}
        <View style={styles.statusPanel}>
          <Text style={styles.statusTitle}>생존자 상태</Text>
          {survivors.map((survivor) => (
            <SurvivorStatusBar key={survivor.id} survivor={survivor} />
          ))}
        </View>

        {/* Controls */}
        <View style={styles.buttonContainer}>
          <Button title="턴 종료" onPress={nextTurn} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  turnText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  boardWrapper: {
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusPanel: {
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  buttonContainer: {
    marginBottom: 20,
  },
});

export default GameScreen;
