import React, { useMemo, useCallback, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Pressable, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withRepeat } from 'react-native-reanimated';

import { useGameStore } from './store';
import { OBSTACLE_CONFIG } from './obstacles';

const { width: screenWidth } = Dimensions.get('window');
export const TILE_SIZE = Math.floor((screenWidth * 0.9) / 5);

interface TileProps {
  x: number;
  y: number;
  onObstacleClick?: (obstacle: any) => void; // 장애물 클릭 핸들러
}

const Tile: React.FC<TileProps> = React.memo(({ x, y, onObstacleClick }) => {
  const getObstacleAt = useGameStore(state => state.getObstacleAt);
  const rescuePoint = useGameStore(state => state.rescuePoint);

  // 안개 해제 애니메이션
  const fogOpacity = useSharedValue(1);
  const fogScale = useSharedValue(1);

  // 장애물 힌트 애니메이션
  const hintScale = useSharedValue(1);

  const isRescuePoint = useMemo(() => {
    return rescuePoint.x === x && rescuePoint.y === y;
  }, [rescuePoint, x, y]);

  const obstacle = useMemo(() => {
    return getObstacleAt(x, y);
  }, [getObstacleAt, x, y]);

  // 안개가 정찰되었을 때 애니메이션 실행
  useEffect(() => {
    if (obstacle && obstacle.type === 'fog' && obstacle.isRevealed) {
      // 안개가 사라지는 애니메이션
      fogOpacity.value = withSequence(
        withTiming(0, { duration: 500 }),
        withTiming(0, { duration: 100 }) // Keep at 0
      );
      fogScale.value = withTiming(1.2, { duration: 500 });
    } else {
      fogOpacity.value = 1;
      fogScale.value = 1;
    }
  }, [obstacle?.type, obstacle?.isRevealed]);

  const fogAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fogOpacity.value,
    transform: [{ scale: fogScale.value }],
  }));

  const hintAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: hintScale.value }],
  }));

  // 장애물이 있을 때 힌트 애니메이션
  useEffect(() => {
    if (obstacle) {
      hintScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    }
  }, [obstacle]);

  const handlePress = useCallback(() => {
    // 퍼즐 게임에서는 장애물만 클릭 가능
    if (obstacle && onObstacleClick) {
      onObstacleClick(obstacle);
    }
  }, [obstacle, onObstacleClick]);

  return (
    <Pressable
      style={[
        styles.tile,
        isRescuePoint && styles.rescuePoint,
      ]}
      onPress={handlePress}
    >
      {isRescuePoint && !obstacle && (
        <Text style={styles.rescueEmoji}>🚁</Text>
      )}
      {obstacle && (
        <>
          {/* 안개가 정찰되지 않았으면 안개 표시 (애니메이션 포함) */}
          {obstacle.type === 'fog' && !obstacle.isRevealed && (
            <Animated.View style={[styles.obstacleContainer, styles.fogOverlay, fogAnimatedStyle]}>
              <Pressable
                style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                onPress={(e) => {
                  e.stopPropagation();
                  if (onObstacleClick) {
                    onObstacleClick(obstacle);
                  }
                }}
              >
                <Text style={styles.obstacleEmoji}>
                  {OBSTACLE_CONFIG.fog?.emoji || '🌫️'}
                </Text>
                <Text style={styles.fogHint}>?</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* 안개가 정찰되었거나 다른 장애물인 경우 */}
          {(obstacle.type !== 'fog' || obstacle.isRevealed) && (
            <Animated.View style={hintAnimatedStyle}>
              <Pressable
                style={[
                  styles.obstacleContainer,
                  { backgroundColor: OBSTACLE_CONFIG[obstacle.type]?.color || '#6b7280' }
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  if (onObstacleClick) {
                    onObstacleClick(obstacle);
                  }
                }}
              >
                <Text style={styles.obstacleEmoji}>
                  {OBSTACLE_CONFIG[obstacle.type]?.emoji || '❓'}
                </Text>
                {obstacle.isLocked && (
                  <View style={styles.lockContainer}>
                    <Text style={styles.lockIcon}>🔒</Text>
                    {obstacle.blockedBy && obstacle.blockedBy.length > 0 && (
                      <Text style={styles.lockCount}>{obstacle.blockedBy.length}</Text>
                    )}
                  </View>
                )}
                {obstacle.turnsBuildRemaining !== undefined && obstacle.turnsBuildRemaining > 0 && (
                  <Text style={styles.buildTurns}>{obstacle.turnsBuildRemaining}</Text>
                )}
              </Pressable>
            </Animated.View>
          )}
        </>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rescuePoint: {
    backgroundColor: '#fef3c7', // amber-100
    borderColor: '#f59e0b', // amber-500
    borderWidth: 2,
  },
  rescueEmoji: {
    fontSize: TILE_SIZE * 0.6,
  },
  lockContainer: {
    position: 'absolute',
    top: -2,
    right: -2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  lockIcon: {
    fontSize: 14,
  },
  lockCount: {
    fontSize: 10,
    color: '#fbbf24',
    fontWeight: 'bold',
    marginLeft: 2,
  },
  obstacleContainer: {
    width: '80%',
    height: '80%',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  obstacleEmoji: {
    fontSize: TILE_SIZE * 0.5,
  },
  buildTurns: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  fogOverlay: {
    opacity: 0.7,
  },
  fogHint: {
    position: 'absolute',
    bottom: 2,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default Tile;
