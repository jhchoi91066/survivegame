import * as Haptics from 'expo-haptics';

// 햅틱 피드백 타입
export type HapticType =
  | 'light'       // 가벼운 탭 (버튼 클릭)
  | 'medium'      // 중간 강도 (선택, 이동)
  | 'heavy'       // 강한 피드백 (중요한 액션)
  | 'success'     // 성공 (레벨 클리어, 업적 달성)
  | 'warning'     // 경고 (위험한 선택)
  | 'error';      // 에러 (실패, 불가능)

// 햅틱 피드백 트리거
export const triggerHaptic = async (type: HapticType): Promise<void> => {
  try {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;

      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;

      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;

      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;

      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;

      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;

      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (error) {
    // 햅틱 피드백 실패는 무시 (일부 기기에서 지원 안 함)
    console.debug('Haptic feedback failed:', error);
  }
};

// 자주 사용되는 햅틱 패턴
export const hapticPatterns = {
  // 버튼 클릭
  buttonPress: () => triggerHaptic('light'),

  // 장애물 선택
  obstacleSelect: () => triggerHaptic('medium'),

  // 장애물 제거
  obstacleRemove: () => triggerHaptic('heavy'),

  // 생존자 선택
  survivorSelect: () => triggerHaptic('light'),

  // 시너지 발견
  synergyDiscovered: async () => {
    await triggerHaptic('success');
    // 연속 피드백 (기쁨 표현)
    setTimeout(() => triggerHaptic('light'), 100);
    setTimeout(() => triggerHaptic('light'), 200);
  },

  // 업적 달성
  achievementUnlocked: async () => {
    await triggerHaptic('success');
    setTimeout(() => triggerHaptic('medium'), 150);
  },

  // 레벨 클리어
  levelComplete: async () => {
    await triggerHaptic('success');
    setTimeout(() => triggerHaptic('medium'), 100);
    setTimeout(() => triggerHaptic('heavy'), 200);
  },

  // 연쇄 반응
  chainReaction: async () => {
    await triggerHaptic('heavy');
    setTimeout(() => triggerHaptic('medium'), 100);
  },

  // 게임 오버
  gameOver: async () => {
    await triggerHaptic('error');
    setTimeout(() => triggerHaptic('heavy'), 150);
  },

  // 경고 (위험한 선택)
  warningAction: () => triggerHaptic('warning'),

  // 에러 (불가능한 액션)
  errorAction: () => triggerHaptic('error'),

  // 스와이프/드래그
  dragStart: () => triggerHaptic('light'),
  dragEnd: () => triggerHaptic('medium'),
};

// 햅틱 설정 (사용자가 켜고 끌 수 있도록)
let hapticsEnabled = true;

export const setHapticsEnabled = (enabled: boolean) => {
  hapticsEnabled = enabled;
};

export const isHapticsEnabled = (): boolean => {
  return hapticsEnabled;
};

// 래퍼 함수 (설정 체크)
export const triggerHapticIfEnabled = async (type: HapticType): Promise<void> => {
  if (hapticsEnabled) {
    await triggerHaptic(type);
  }
};
