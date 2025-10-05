import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Menu'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
  onSkip?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, onSkip }) => {
  const { signInWithGoogle, signInWithApple, signInAnonymously } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google 로그인 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    try {
      await signInWithApple();
    } catch (error) {
      console.error('Apple 로그인 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setLoading(true);
    try {
      await signInAnonymously();
    } catch (error) {
      console.error('익명 로그인 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      navigation.navigate('Menu');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={styles.gradient}
      />

      <View style={styles.content}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🎮</Text>
          <Text style={styles.title}>Brain Games</Text>
          <Text style={styles.subtitle}>
            로그인하고 온라인 기능을 사용해보세요!
          </Text>
        </View>

        {/* 혜택 안내 */}
        <View style={styles.benefits}>
          <BenefitItem emoji="🏆" text="글로벌 리더보드 참여" />
          <BenefitItem emoji="👥" text="친구 추가 및 경쟁" />
          <BenefitItem emoji="☁️" text="기록 백업 및 복구" />
          <BenefitItem emoji="🎁" text="특별 업적 해제" />
        </View>

        {/* 로그인 버튼들 */}
        <View style={styles.buttons}>
          {/* Google 로그인 */}
          <Pressable
            onPress={handleGoogleLogin}
            disabled={loading}
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={['#4285F4', '#357ae8']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonEmoji}>🔵</Text>
                  <Text style={styles.buttonText}>Google로 계속하기</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          {/* Apple 로그인 (iOS만) */}
          {Platform.OS === 'ios' && (
            <Pressable
              onPress={handleAppleLogin}
              disabled={loading}
              style={({ pressed }) => [
                styles.loginButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <LinearGradient
                colors={['#000000', '#1a1a1a']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonEmoji}>🍎</Text>
                    <Text style={styles.buttonText}>Apple로 계속하기</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          )}

          {/* 익명 로그인 */}
          <Pressable
            onPress={handleAnonymousLogin}
            disabled={loading}
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={['#64748b', '#475569']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonEmoji}>👤</Text>
                  <Text style={styles.buttonText}>익명으로 계속하기</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </View>

        {/* 나중에 버튼 */}
        <Pressable
          onPress={handleSkip}
          disabled={loading}
          style={({ pressed }) => [
            styles.skipButton,
            pressed && styles.skipButtonPressed,
          ]}
        >
          <Text style={styles.skipText}>나중에 하기</Text>
        </Pressable>

        {/* 안내 */}
        <Text style={styles.notice}>
          로그인 없이도 모든 게임을 플레이할 수 있습니다.{'\n'}
          온라인 기능만 제한됩니다.
        </Text>
      </View>
    </View>
  );
};

interface BenefitItemProps {
  emoji: string;
  text: string;
}

const BenefitItem: React.FC<BenefitItemProps> = ({ emoji, text }) => (
  <View style={styles.benefitItem}>
    <Text style={styles.benefitEmoji}>{emoji}</Text>
    <Text style={styles.benefitText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  benefits: {
    marginBottom: 40,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  benefitEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  buttons: {
    gap: 12,
    marginBottom: 24,
  },
  loginButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonEmoji: {
    fontSize: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  skipButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  skipButtonPressed: {
    opacity: 0.6,
  },
  skipText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  notice: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LoginScreen;
