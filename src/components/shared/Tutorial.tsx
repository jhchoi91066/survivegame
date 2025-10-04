import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface TutorialStep {
  title: string;
  description: string;
  emoji: string;
}

interface TutorialProps {
  visible: boolean;
  steps: TutorialStep[];
  onComplete: () => void;
  gradientColors: [string, string];
}

export const Tutorial: React.FC<TutorialProps> = ({
  visible,
  steps,
  onComplete,
  gradientColors,
}) => {
  const [currentStep, setCurrentStep] = React.useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(0);
      onComplete();
    }
  };

  const handleSkip = () => {
    setCurrentStep(0);
    onComplete();
  };

  if (!visible) return null;

  const step = steps[currentStep];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={styles.content}
        >
          <LinearGradient
            colors={gradientColors}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.glassOverlay} />

            <View style={styles.header}>
              <Text style={styles.emoji}>{step.emoji}</Text>
              <Text style={styles.stepIndicator}>
                {currentStep + 1} / {steps.length}
              </Text>
            </View>

            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.description}>{step.description}</Text>

            <View style={styles.buttons}>
              {currentStep === 0 && (
                <Pressable
                  style={[styles.button, styles.skipButton]}
                  onPress={handleSkip}
                >
                  <Text style={styles.skipButtonText}>건너뛰기</Text>
                </Pressable>
              )}

              <Pressable
                style={[
                  styles.button,
                  styles.nextButton,
                  currentStep === 0 && { flex: 1 }
                ]}
                onPress={handleNext}
              >
                <Text style={styles.nextButtonText}>
                  {currentStep < steps.length - 1 ? '다음' : '시작하기'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.dots}>
              {steps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentStep && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  gradient: {
    padding: 32,
    minHeight: 400,
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  emoji: {
    fontSize: 64,
  },
  stepIndicator: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
    marginBottom: 32,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#fff',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 24,
  },
});
