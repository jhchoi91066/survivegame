import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useGameStore, SurvivorState } from '../game/store';
import { ABILITIES } from '../game/abilities';

interface AbilityPanelProps {
  survivor: SurvivorState;
}

const AbilityPanel: React.FC<AbilityPanelProps> = ({ survivor }) => {
  const { removeObstacle, startBridgeBuild, restoreHealth, restoreEnergy, updateResources } =
    useGameStore((state) => ({
      removeObstacle: state.removeObstacle,
      startBridgeBuild: state.startBridgeBuild,
      restoreHealth: state.restoreHealth,
      restoreEnergy: state.restoreEnergy,
      updateResources: state.updateResources,
    }));

  const abilities = ABILITIES[survivor.role];

  const handleAbilityUse = (abilityIndex: number) => {
    const ability = abilities[abilityIndex];

    switch (survivor.role) {
      case 'engineer':
        if (abilityIndex === 0) {
          // Bridge building - would need position selection
          console.log('다리 건설 모드 활성화');
        } else if (abilityIndex === 1) {
          // Obstacle removal - would need position selection
          console.log('장애물 제거 모드 활성화');
        }
        break;

      case 'doctor':
        if (abilityIndex === 0) {
          // Heal adjacent survivor - would need target selection
          console.log('치료 대상 선택');
        } else if (abilityIndex === 1) {
          // Cure status effect
          console.log('상태이상 치료');
        }
        break;

      case 'chef':
        if (abilityIndex === 0) {
          // Create food
          if (survivor.energy >= ability.energyCost) {
            updateResources('food', 2);
            useGameStore.getState().consumeEnergy(survivor.id, ability.energyCost);
          }
        } else if (abilityIndex === 1) {
          // Restore team energy
          if (survivor.energy >= ability.energyCost) {
            const allSurvivors = useGameStore.getState().survivors;
            allSurvivors.forEach((s: SurvivorState) => {
              restoreEnergy(s.id, 20);
            });
            useGameStore.getState().consumeEnergy(survivor.id, ability.energyCost);
          }
        }
        break;

      case 'child':
        if (abilityIndex === 0) {
          // Narrow passage - passive ability
          console.log('좁은 통로 통과 (패시브)');
        } else if (abilityIndex === 1) {
          // Hide
          console.log('숨기 능력 사용');
        }
        break;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>특수 능력</Text>
      <View style={styles.abilitiesContainer}>
        {abilities.map((ability, index) => {
          const canUse = survivor.energy >= ability.energyCost;
          return (
            <Pressable
              key={index}
              style={[styles.abilityButton, !canUse && styles.abilityButtonDisabled]}
              onPress={() => canUse && handleAbilityUse(index)}
              disabled={!canUse}
            >
              <Text style={[styles.abilityName, !canUse && styles.abilityTextDisabled]}>
                {ability.name}
              </Text>
              <Text style={[styles.abilityDescription, !canUse && styles.abilityTextDisabled]}>
                {ability.description}
              </Text>
              <Text style={[styles.abilityCost, !canUse && styles.abilityTextDisabled]}>
                에너지: {ability.energyCost}
              </Text>
            </Pressable>
          );
        })}
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
    marginTop: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  abilitiesContainer: {
    gap: 8,
  },
  abilityButton: {
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  abilityButtonDisabled: {
    backgroundColor: '#f9fafb',
    opacity: 0.5,
  },
  abilityName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  abilityDescription: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  abilityCost: {
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: '500',
  },
  abilityTextDisabled: {
    color: '#9ca3af',
  },
});

export default AbilityPanel;