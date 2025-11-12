import {
  withSpring,
  withTiming,
  withSequence,
  Easing,
  SharedValue,
} from 'react-native-reanimated';

// 공통 스프링 설정
export const SPRING_CONFIGS = {
  gentle: { damping: 15, stiffness: 100 },
  bouncy: { damping: 10, stiffness: 150 },
  stiff: { damping: 20, stiffness: 200 },
};

// 공통 타이밍 설정
export const TIMING_CONFIGS = {
  fast: { duration: 150, easing: Easing.ease },
  medium: { duration: 300, easing: Easing.ease },
  slow: { duration: 500, easing: Easing.ease },
};

/**
 * 펄스 애니메이션 - 성공/강조 효과
 */
export const pulseAnimation = (
  scale: SharedValue<number>,
  config = SPRING_CONFIGS.bouncy
) => {
  'worklet';
  scale.value = withSequence(
    withSpring(1.1, config),
    withSpring(1, config)
  );
};

/**
 * 흔들림 애니메이션 - 오답 피드백
 */
export const shakeAnimation = (
  translateX: SharedValue<number>,
  intensity = 10
) => {
  'worklet';
  translateX.value = withSequence(
    withTiming(intensity, { duration: 50 }),
    withTiming(-intensity, { duration: 50 }),
    withTiming(intensity, { duration: 50 }),
    withTiming(0, { duration: 50 })
  );
};

/**
 * 페이드 인/아웃
 */
export const fadeAnimation = (
  opacity: SharedValue<number>,
  toValue: number,
  duration = 300
) => {
  'worklet';
  opacity.value = withTiming(toValue, { duration, easing: Easing.ease });
};

/**
 * 스케일 탭 피드백 - 버튼 클릭
 */
export const tapFeedback = (
  scale: SharedValue<number>,
  config = SPRING_CONFIGS.stiff
) => {
  'worklet';
  scale.value = withSequence(
    withSpring(0.95, config),
    withSpring(1, config)
  );
};

/**
 * 성공 애니메이션 - 매칭/정답
 */
export const successAnimation = (
  scale: SharedValue<number>,
  config = SPRING_CONFIGS.bouncy
) => {
  'worklet';
  scale.value = withSequence(
    withSpring(0, { damping: 15 }),
    withSpring(1.2, config),
    withSpring(1, config)
  );
};

/**
 * 카드 뒤집기 애니메이션
 */
export const flipCardAnimation = (
  rotation: SharedValue<number>,
  isFlipped: boolean
) => {
  'worklet';
  rotation.value = withSpring(
    isFlipped ? 180 : 0,
    { damping: 15, stiffness: 100 }
  );
};

/**
 * 슬라이드 인 애니메이션
 */
export const slideInAnimation = (
  translateY: SharedValue<number>,
  fromValue = 50,
  duration = 300
) => {
  'worklet';
  translateY.value = fromValue;
  translateY.value = withTiming(0, { duration, easing: Easing.out(Easing.ease) });
};

/**
 * 줌 인 애니메이션
 */
export const zoomInAnimation = (
  scale: SharedValue<number>,
  duration = 300
) => {
  'worklet';
  scale.value = 0;
  scale.value = withSpring(1, { damping: 12, stiffness: 120 });
};

/**
 * 타일 활성화 애니메이션 (Spatial Memory용)
 */
export const tileFlashAnimation = (
  scale: SharedValue<number>,
  opacity: SharedValue<number>
) => {
  'worklet';
  scale.value = withSequence(
    withSpring(1.15, { damping: 10 }),
    withSpring(1.05, { damping: 15 })
  );
  opacity.value = withTiming(1, { duration: 200 });
};

/**
 * 레벨업 애니메이션
 */
export const levelUpAnimation = (
  scale: SharedValue<number>,
  rotation: SharedValue<number>
) => {
  'worklet';
  scale.value = withSequence(
    withSpring(0, { damping: 15 }),
    withSpring(1.3, { damping: 10 }),
    withSpring(1, { damping: 15 })
  );
  rotation.value = withSpring(360, { damping: 15 });
};
