import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useGameStore, SurvivorState } from '../game/store';
import { ABILITIES } from '../game/abilities';

interface AbilityPanelProps {
  survivor: SurvivorState;
}

const AbilityPanel: React.FC<AbilityPanelProps> = React.memo(({ survivor }) => {
  const [activeAbilityIndex, setActiveAbilityIndex] = useState<number | null>(null);
  const removeObstacle = useGameStore((state) => state.removeObstacle);
  const startBridgeBuild = useGameStore((state) => state.startBridgeBuild);
  const restoreHealth = useGameStore((state) => state.restoreHealth);
  const restoreEnergy = useGameStore((state) => state.restoreEnergy);
  const updateResources = useGameStore((state) => state.updateResources);

  const abilities = useMemo(() => {
    return ABILITIES[survivor.role];
  }, [survivor.role]);

  const handleAbilityUse = useCallback((abilityIndex: number) => {
    const ability = abilities[abilityIndex];

    // Trigger animation
    setActiveAbilityIndex(abilityIndex);
    setTimeout(() => setActiveAbilityIndex(null), 500);

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
  }, [survivor.role, survivor.energy, survivor.id, updateResources, restoreEnergy]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>특수 능력</Text>
      <View style={styles.abilitiesContainer}>
        {abilities.map((ability, index) => {
          const canUse = survivor.energy >= ability.energyCost;
          const isActive = activeAbilityIndex === index;
          return (
            <AbilityButton
              key={index}
              ability={ability}
              canUse={canUse}
              isActive={isActive}
              onPress={() => handleAbilityUse(index)}
            />
          );
        })}
      </View>
    </View>
  );
});

// Animated ability button component
interface AbilityButtonProps {
  ability: { name: string; description: string; energyCost: number };
  canUse: boolean;
  isActive: boolean;
  onPress: () => void;
}

const AbilityButton: React.FC<AbilityButtonProps> = React.memo(({ ability, canUse, isActive, onPress }) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (isActive) {
      scale.value = withSequence(
        withTiming(1.1, { duration: 100 }),
        withSpring(1, { damping: 10 })
      );
      glowOpacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 400 })
      );
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[
          styles.abilityButton,
          !canUse && styles.abilityButtonDisabled,
        ]}
        onPress={onPress}
        disabled={!canUse}
      >
        {isActive && (
          <Animated.View style={[styles.glowEffect, glowStyle]} />
        )}
        <Text style={styles.abilityName}>{ability.name}</Text>
        <Text style={styles.abilityDescription}>{ability.description}</Text>
        <Text style={[styles.energyCost, !canUse && styles.energyCostDisabled]}>
          ⚡ {ability.energyCost}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

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
    position: 'relative',
    overflow: 'hidden',
  },
  abilityButtonDisabled: {
    backgroundColor: '#f9fafb',
    opacity: 0.5,
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#60a5fa',
    borderRadius: 6,
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
  energyCost: {
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: '500',
  },
  energyCostDisabled: {
    color: '#9ca3af',
  },
});

export default AbilityPanel;