import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ResourceInventory } from '../game/store';

interface ResourcePanelProps {
  resources: ResourceInventory;
}

const ResourcePanel: React.FC<ResourcePanelProps> = ({ resources }) => {
  const resourceItems = [
    { key: 'tool', label: '도구', emoji: '🔧', color: '#6b7280' },
    { key: 'water', label: '물', emoji: '💧', color: '#3b82f6' },
    { key: 'explosive', label: '폭탄', emoji: '💣', color: '#ef4444' },
    { key: 'medical', label: '의약품', emoji: '💊', color: '#10b981' },
    { key: 'food', label: '음식', emoji: '🍖', color: '#f59e0b' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>자원</Text>
      <View style={styles.resourceGrid}>
        {resourceItems.map((item) => (
          <View key={item.key} style={styles.resourceItem}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={[styles.amount, { color: item.color }]}>
              {resources[item.key as keyof ResourceInventory]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  resourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  resourceItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ResourcePanel;