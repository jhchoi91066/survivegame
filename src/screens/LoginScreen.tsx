import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { GlassView } from '../components/shared/GlassView';
import { showToast } from '../utils/toast'; // [H7][H8] Platform-safe toast
import {
  Gamepad2,
  Trophy,
  Users,
  Cloud,
  Gift,
  Chrome,
  Ghost,
  LogIn,
  LucideIcon
} from 'lucide-react-native';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
  onSkip?: () => void;
}

const { width } = Dimensions.get('window');

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, onSkip }) => {
  const { signInWithGoogle, signInWithApple, signInAnonymously, user } = useAuth();
  const { theme, themeMode } = useTheme();
  const [loading, setLoading] = useState(false);

  // 로그인 성공 시 자동으로 Menu로 이동
  useEffect(() => {
    if (user) {
      navigation.replace('MainTabs');
    }
  }, [user, navigation]);

  // [H8] Google 로그인 with error handling
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Google 로그인 실패:', error);
      showToast({
        type: 'error',
        text1: 'Google 로그인 실패',
        text2: error?.message || '다시 시도해주세요.',
        visibilityTime: 4000,
      });
      setLoading(false);
    }
  };

  // [H8] Apple 로그인 with error handling
  const handleAppleLogin = async () => {
    setLoading(true);
    try {
      await signInWithApple();
    } catch (error: any) {
      console.error('Apple 로그인 실패:', error);
      showToast({
        type: 'error',
        text1: 'Apple 로그인 실패',
        text2: error?.message || '다시 시도해주세요.',
        visibilityTime: 4000,
      });
      setLoading(false);
    }
  };

  // [H8] 익명 로그인 with error handling
  const handleAnonymousLogin = async () => {
    setLoading(true);
    try {
      await signInAnonymously();
    } catch (error: any) {
      console.error('익명 로그인 실패:', error);
      showToast({
        type: 'error',
        text1: '익명 로그인 실패',
        text2: error?.message || '다시 시도해주세요.',
        visibilityTime: 4000,
      });
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      navigation.navigate('MainTabs');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.gradients.background}
        style={styles.gradient}
      />

      <View style={styles.content}>
        <GlassView style={styles.glassCard} intensity={30} tint={themeMode === 'dark' ? 'dark' : 'light'}>
          {/* 헤더 */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <View style={styles.iconGlow}>
                <Gamepad2 size={48} color={theme.colors.primary} />
              </View>
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Brain Games</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              로그인하고 온라인 기능을 사용해보세요!
            </Text>
          </View>

          {/* 혜택 안내 */}
          <View style={styles.benefits}>
            <BenefitItem icon={Trophy} text="글로벌 리더보드 참여" />
            <BenefitItem icon={Users} text="친구 추가 및 경쟁" />
            <BenefitItem icon={Cloud} text="기록 백업 및 복구" />
            <BenefitItem icon={Gift} text="특별 업적 해제" />
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
                    <Chrome size={24} color="#fff" />
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
                      <LogIn size={24} color="#fff" />
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
                    <Ghost size={24} color="#fff" />
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
            <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>나중에 하기</Text>
          </Pressable>

          {/* 안내 */}
          <Text style={[styles.notice, { color: theme.colors.textTertiary }]}>
            로그인 없이도 모든 게임을 플레이할 수 있습니다.{'\n'}
            온라인 기능만 제한됩니다.
          </Text>
        </GlassView>
      </View>
    </View>
  );
};

interface BenefitItemProps {
  icon: LucideIcon;
  text: string;
}

const BenefitItem: React.FC<BenefitItemProps> = ({ icon: Icon, text }) => {
  const { theme, themeMode } = useTheme();
  return (
    <View style={[styles.benefitItem, { backgroundColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
      <View style={[styles.benefitIconContainer, { backgroundColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
        <Icon size={18} color={theme.colors.text} />
      </View>
      <Text style={[styles.benefitText, { color: theme.colors.text }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  glassCard: {
    borderRadius: 32,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconGlow: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 20,
  },
  benefits: {
    marginBottom: 32,
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 16,
  },
  benefitIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  buttons: {
    gap: 12,
    marginBottom: 20,
  },
  loginButton: {
    height: 52,
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  skipButtonPressed: {
    opacity: 0.6,
  },
  skipText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  notice: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default LoginScreen;
