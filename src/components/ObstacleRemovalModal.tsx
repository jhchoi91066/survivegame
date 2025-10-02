import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Alert } from 'react-native';
import { ObstacleState, getObstacleRemovalMethods, RemovalMethod, OBSTACLE_CONFIG } from '../game/obstacles';
import { findAvailableSynergies } from '../game/synergies';

interface ObstacleRemovalModalProps {
  visible: boolean;
  obstacle: ObstacleState | null;
  availableSurvivors: { id: string; role: string; used: boolean }[];
  availableResources: { [key: string]: number };
  onClose: () => void;
  onSelectMethod: (method: RemovalMethod, survivorIds?: string[]) => void;
  onSynergyDiscovered?: (synergyId: string, synergyName: string, synergyDescription: string) => void;
}

const ObstacleRemovalModal: React.FC<ObstacleRemovalModalProps> = ({
  visible,
  obstacle,
  availableSurvivors,
  availableResources,
  onClose,
  onSelectMethod,
  onSynergyDiscovered,
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingMethod, setPendingMethod] = useState<RemovalMethod | null>(null);

  if (!obstacle) return null;

  const config = OBSTACLE_CONFIG[obstacle.type];
  const methods = getObstacleRemovalMethods(obstacle.type);

  // 잠긴 장애물인지 확인
  const isLocked = obstacle.isLocked || false;

  // 사용 가능한 시너지 확인
  const availableRoles = availableSurvivors
    .filter(s => !s.used)
    .map(s => s.role);
  const synergies = findAvailableSynergies(availableRoles);

  const canAffordMethod = (method: RemovalMethod): boolean => {
    if (!method.resourceCost || !method.resourceType) return true;
    return (availableResources[method.resourceType] || 0) >= method.resourceCost;
  };

  const canUseMethod = (method: RemovalMethod): boolean => {
    // 자원 확인
    if (!canAffordMethod(method)) return false;

    // 생존자 역할 확인
    if (method.type.startsWith('survivor_')) {
      const requiredRole = method.type.replace('survivor_', '');
      return availableSurvivors.some(
        s => s.role === requiredRole && !s.used
      );
    }

    return true;
  };

  const handleMethodClick = (method: RemovalMethod) => {
    // 생존자가 필요한 경우 사용 가능한 생존자 찾기
    let survivorIds: string[] | undefined = undefined;

    if (method.type.startsWith('survivor_')) {
      const requiredRole = method.type.replace('survivor_', '');
      const availableSurvivor = availableSurvivors.find(
        s => s.role === requiredRole && !s.used
      );

      if (availableSurvivor) {
        survivorIds = [availableSurvivor.id];
      }
    }

    // 위험한 방법인 경우 확인 다이얼로그 표시
    if (method.warning) {
      setPendingMethod(method);
      setShowConfirmDialog(true);
    } else {
      // 안전한 방법은 바로 실행
      onSelectMethod(method, survivorIds);
    }
  };

  const handleConfirm = () => {
    if (pendingMethod) {
      // 생존자가 필요한 경우 사용 가능한 생존자 찾기
      let survivorIds: string[] | undefined = undefined;

      if (pendingMethod.type.startsWith('survivor_')) {
        const requiredRole = pendingMethod.type.replace('survivor_', '');
        const availableSurvivor = availableSurvivors.find(
          s => s.role === requiredRole && !s.used
        );

        if (availableSurvivor) {
          survivorIds = [availableSurvivor.id];
        }
      }

      onSelectMethod(pendingMethod, survivorIds);
    }
    setShowConfirmDialog(false);
    setPendingMethod(null);
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setPendingMethod(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.obstacleEmoji}>{config?.emoji}</Text>
            <Text style={styles.title}>{config?.name}</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {/* 잠김 상태 */}
          {isLocked && obstacle.blockedBy && obstacle.blockedBy.length > 0 && (
            <View style={styles.lockedBanner}>
              <Text style={styles.lockedText}>
                🔒 잠겨있음
              </Text>
              <Text style={styles.lockedSubtext}>
                먼저 제거해야 할 장애물: {obstacle.blockedBy.length}개
              </Text>
              <View style={styles.blockerList}>
                {obstacle.blockedBy.slice(0, 3).map((blockerId, idx) => (
                  <View key={idx} style={styles.blockerItem}>
                    <Text style={styles.blockerEmoji}>🔗</Text>
                    <Text style={styles.blockerText}>ID: {blockerId}</Text>
                  </View>
                ))}
                {obstacle.blockedBy.length > 3 && (
                  <Text style={styles.moreBlockers}>외 {obstacle.blockedBy.length - 3}개</Text>
                )}
              </View>
            </View>
          )}

          {/* 제거 방법 목록 */}
          <ScrollView style={styles.methodsContainer}>
            <Text style={styles.sectionTitle}>제거 방법:</Text>

            {methods.map((method, index) => {
              const canUse = canUseMethod(method);
              const canAfford = canAffordMethod(method);

              // 생존자 방법인 경우 사용 여부 체크
              const isSurvivorMethod = method.type.startsWith('survivor_');
              const isUsedSurvivor = isSurvivorMethod && availableSurvivors.some(
                s => s.role === method.type.replace('survivor_', '') && s.used
              );

              return (
                <Pressable
                  key={index}
                  style={[
                    styles.methodCard,
                    !canUse && styles.methodCardDisabled,
                    method.warning && styles.methodCardWarning,
                  ]}
                  onPress={() => canUse && !isLocked && handleMethodClick(method)}
                  disabled={!canUse || isLocked}
                >
                  <View style={styles.methodHeader}>
                    <Text style={styles.methodName}>
                      {getMethodName(method)}
                    </Text>
                    {method.safe && (
                      <View style={styles.safeBadge}>
                        <Text style={styles.safeBadgeText}>안전</Text>
                      </View>
                    )}
                    {isUsedSurvivor && (
                      <View style={styles.usedBadge}>
                        <Text style={styles.usedBadgeText}>사용됨</Text>
                      </View>
                    )}
                  </View>

                  {/* 비용 */}
                  {method.resourceCost && method.resourceType && (
                    <Text style={[
                      styles.methodCost,
                      !canAfford && styles.methodCostInsufficient
                    ]}>
                      {getResourceEmoji(method.resourceType)} {method.resourceCost}개
                      {!canAfford && ' (부족)'}
                    </Text>
                  )}

                  {/* 시간 */}
                  {method.time && (
                    <Text style={styles.methodTime}>
                      ⏱️ {method.time}초 소요
                    </Text>
                  )}

                  {/* 경고 */}
                  {method.warning && (
                    <View style={styles.warningBox}>
                      <Text style={styles.warningText}>
                        ⚠️ {method.warning}
                      </Text>
                    </View>
                  )}

                  {/* 생존자 필요 */}
                  {method.type.startsWith('survivor_') && (
                    <Text style={styles.methodSurvivor}>
                      {getRoleEmoji(method.type.replace('survivor_', ''))} 필요
                    </Text>
                  )}
                </Pressable>
              );
            })}

            {/* 시너지 옵션 */}
            {synergies.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>💡 시너지 발견!</Text>
                {synergies.map((synergy, index) => (
                  <Pressable
                    key={index}
                    style={styles.synergyCard}
                    onPress={() => {
                      if (onSynergyDiscovered) {
                        onSynergyDiscovered(synergy.id, synergy.name, synergy.description);
                      }
                    }}
                  >
                    <Text style={styles.synergyEmoji}>{synergy.emoji}</Text>
                    <Text style={styles.synergyName}>{synergy.name}</Text>
                    <Text style={styles.synergyDescription}>
                      {synergy.description}
                    </Text>
                    <Text style={styles.synergyHint}>탭하여 자세히 보기 →</Text>
                  </Pressable>
                ))}
              </>
            )}
          </ScrollView>

          {/* 취소 버튼 */}
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>취소</Text>
          </Pressable>
        </View>

        {/* 확인 다이얼로그 (위험한 선택 시) */}
        {showConfirmDialog && pendingMethod && (
          <View style={styles.confirmDialogOverlay}>
            <View style={styles.confirmDialog}>
              <Text style={styles.confirmTitle}>⚠️ 위험한 선택</Text>
              <Text style={styles.confirmMessage}>{pendingMethod.warning}</Text>
              <Text style={styles.confirmQuestion}>정말 이 방법을 사용하시겠습니까?</Text>
              <View style={styles.confirmButtons}>
                <Pressable style={styles.confirmCancelButton} onPress={handleCancel}>
                  <Text style={styles.confirmCancelText}>취소</Text>
                </Pressable>
                <Pressable style={styles.confirmOkButton} onPress={handleConfirm}>
                  <Text style={styles.confirmOkText}>확인</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

// 헬퍼 함수들
const getMethodName = (method: RemovalMethod): string => {
  if (method.type.startsWith('survivor_')) {
    const role = method.type.replace('survivor_', '');
    return `${getRoleName(role)} 사용${method.action ? ` (${method.action})` : ''}`;
  }
  if (method.type === 'natural_decay') return '자연 소멸 대기';
  if (method.type === 'fire') return '불로 태우기';
  if (method.type === 'explosive') return '폭탄 사용';
  if (method.type === 'detonate') return '폭파';
  return method.type;
};

const getRoleName = (role: string): string => {
  const names: { [key: string]: string } = {
    engineer: '엔지니어',
    doctor: '의사',
    chef: '요리사',
    child: '아이',
  };
  return names[role] || role;
};

const getRoleEmoji = (role: string): string => {
  const emojis: { [key: string]: string } = {
    engineer: '👷',
    doctor: '👨‍⚕️',
    chef: '👨‍🍳',
    child: '👶',
  };
  return emojis[role] || '🧑';
};

const getResourceEmoji = (resourceType: string): string => {
  const emojis: { [key: string]: string } = {
    tool: '🔧',
    water: '💧',
    food: '🍖',
    medical: '💊',
  };
  return emojis[resourceType] || '📦';
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
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  obstacleEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    color: '#6b7280',
  },
  lockedBanner: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f59e0b',
  },
  lockedText: {
    color: '#92400e',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  lockedSubtext: {
    color: '#78350f',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  blockerList: {
    flexDirection: 'column',
    gap: 4,
  },
  blockerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  blockerEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  blockerText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
  },
  moreBlockers: {
    fontSize: 12,
    color: '#78350f',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  methodsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    marginTop: 8,
  },
  methodCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  methodCardDisabled: {
    opacity: 0.5,
    backgroundColor: '#f3f4f6',
  },
  methodCardWarning: {
    borderColor: '#fbbf24',
    backgroundColor: '#fffbeb',
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  safeBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  safeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  usedBadge: {
    backgroundColor: '#9ca3af',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  usedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  methodCost: {
    fontSize: 14,
    color: '#3b82f6',
    marginBottom: 4,
  },
  methodCostInsufficient: {
    color: '#ef4444',
  },
  methodTime: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  methodSurvivor: {
    fontSize: 14,
    color: '#8b5cf6',
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  warningText: {
    color: '#92400e',
    fontSize: 13,
  },
  synergyCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  synergyEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  synergyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  synergyDescription: {
    fontSize: 13,
    color: '#1e3a8a',
    marginBottom: 8,
  },
  synergyHint: {
    fontSize: 12,
    color: '#3b82f6',
    fontStyle: 'italic',
    textAlign: 'right',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    borderRadius: 8,
    padding: 14,
    margin: 16,
    marginTop: 0,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmDialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmDialog: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 15,
    color: '#92400e',
    marginBottom: 12,
    textAlign: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
  },
  confirmQuestion: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmCancelButton: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  confirmCancelText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmOkButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  confirmOkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ObstacleRemovalModal;
