import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SurvivorState } from '../game/store';
import AbilityPanel from './AbilityPanel';

interface SurvivorStatusBarProps {
  survivor: SurvivorState;
}

const SurvivorStatusBar: React.FC<SurvivorStatusBarProps> = ({ survivor }) => {
  const [showAbilities, setShowAbilities] = useState(false);
  const healthPercent = (survivor.health / survivor.maxHealth) * 100;
  const energyPercent = (survivor.energy / survivor.maxEnergy) * 100;

  const getRoleEmoji = (role: string) => {
    switch (role) {
      case 'engineer':
        return '🔧';
      case 'doctor':
        return '⚕️';
      case 'chef':
        return '👨‍🍳';
      case 'child':
        return '👶';
      default:
        return '👤';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'engineer':
        return '#f59e0b'; // amber-500
      case 'doctor':
        return '#ef4444'; // red-500
      case 'chef':
        return '#8b5cf6'; // violet-500
      case 'child':
        return '#06b6d4'; // cyan-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setShowAbilities(!showAbilities)}>
        <View style={styles.header}>
          <Text style={styles.roleEmoji}>{getRoleEmoji(survivor.role)}</Text>
          <Text style={styles.survivorId}>{survivor.id}</Text>
          <Text style={styles.expandIcon}>{showAbilities ? '▼' : '▶'}</Text>
        </View>

        {/* Health Bar */}
        <View style={styles.statContainer}>
          <Text style={styles.label}>HP</Text>
          <View style={styles.barBackground}>
            <View
              style={[
                styles.barFill,
                styles.healthBar,
                { width: `${healthPercent}%` },
              ]}
            />
          </View>
          <Text style={styles.statText}>
            {survivor.health}/{survivor.maxHealth}
          </Text>
        </View>

        {/* Energy Bar */}
        <View style={styles.statContainer}>
          <Text style={styles.label}>EN</Text>
          <View style={styles.barBackground}>
            <View
              style={[
                styles.barFill,
                styles.energyBar,
                { width: `${energyPercent}%` },
              ]}
            />
          </View>
          <Text style={styles.statText}>
            {survivor.energy}/{survivor.maxEnergy}
          </Text>
        </View>

        {/* Position Info */}
        <Text style={styles.positionText}>
          위치: ({survivor.x}, {survivor.y})
        </Text>
      </Pressable>

      {showAbilities && <AbilityPanel survivor={survivor} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  survivorId: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  expandIcon: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    width: 24,
  },
  barBackground: {
    flex: 1,
    height: 16,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 8,
  },
  healthBar: {
    backgroundColor: '#ef4444', // red-500
  },
  energyBar: {
    backgroundColor: '#3b82f6', // blue-500
  },
  statText: {
    fontSize: 11,
    color: '#6b7280',
    width: 50,
    textAlign: 'right',
  },
  positionText: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
});

export default SurvivorStatusBar;