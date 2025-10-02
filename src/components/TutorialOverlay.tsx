import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface TutorialStep {
  title: string;
  description: string;
  highlightArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  pointerPosition?: {
    x: number;
    y: number;
  };
  actionRequired?: boolean; // 특정 액션을 해야만 다음으로 진행
  actionType?: 'tap' | 'swipe' | 'long_press';
}

interface TutorialOverlayProps {
  visible: boolean;
  currentStep: number;
  steps: TutorialStep[];
  onNext: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  visible,
  currentStep,
  steps,
  onNext,
  onSkip,
  onComplete,
}) => {
  // 포인터 애니메이션
  const pointerScale = useSharedValue(1);
  const pointerOpacity = useSharedValue(1);
  const pointerTranslateY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // 탭 애니메이션
      pointerScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );

      pointerOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );

      // 위아래 움직임
      pointerTranslateY.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 600 }),
          withTiming(0, { duration: 600 })
        ),
        -1,
        true
      );
    }
  }, [visible, currentStep]);

  const pointerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: pointerScale.value },
      { translateY: pointerTranslateY.value }
    ],
    opacity: pointerOpacity.value,
  }));

  if (!visible || currentStep >= steps.length) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {/* Dark overlay */}
        <View style={styles.darkOverlay} />

        {/* Highlight area (if specified) */}
        {step.highlightArea && (
          <View
            style={[
              styles.highlight,
              {
                left: step.highlightArea.x,
                top: step.highlightArea.y,
                width: step.highlightArea.width,
                height: step.highlightArea.height,
              },
            ]}
          />
        )}

        {/* Pointer animation */}
        {step.pointerPosition && (
          <Animated.View
            style={[
              styles.pointer,
              {
                left: step.pointerPosition.x - 20,
                top: step.pointerPosition.y - 40,
              },
              pointerAnimatedStyle,
            ]}
          >
            <Text style={styles.pointerEmoji}>👆</Text>
          </Animated.View>
        )}

        {/* Tutorial content */}
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.stepIndicator}>
              {currentStep + 1} / {steps.length}
            </Text>
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.description}>{step.description}</Text>

            <View style={styles.buttons}>
              <Pressable style={styles.skipButton} onPress={onSkip}>
                <Text style={styles.skipButtonText}>건너뛰기</Text>
              </Pressable>

              <Pressable
                style={styles.nextButton}
                onPress={isLastStep ? onComplete : onNext}
              >
                <Text style={styles.nextButtonText}>
                  {isLastStep ? '시작하기' : '다음'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    position: 'relative',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  highlight: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#fbbf24',
    backgroundColor: 'transparent',
  },
  pointer: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  pointerEmoji: {
    fontSize: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  stepIndicator: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  nextButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
});

export default TutorialOverlay;