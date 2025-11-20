import React, { useState, useEffect } from 'react';
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

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Menu'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
  onSkip?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, onSkip }) => {
  const { signInWithGoogle, signInWithApple, signInAnonymously, user } = useAuth();
  const [loading, setLoading] = useState(false);

  // 로그인 성공 시 자동으로 Menu로 이동
  useEffect(() => {
    if (user) {
      navigation.replace('Menu');
    }
  }, [user, navigation]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // 웹에서는 리다이렉트되므로 여기 도달 안 함
      // 모바일에서는 user가 변경되면 useEffect가 처리
    } catch (error) {
      console.error('Google 로그인 실패:', error);
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    try {
      await signInWithApple();
    } catch (error) {
      console.error('Apple 로그인 실패:', error);
      setLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setLoading(true);
    try {
      await signInAnonymously();
    } catch (error) {
      console.error('익명 로그인 실패:', error);
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
          <View style={styles.iconContainer}>
            <Gamepad2 size={64} color="#fff" />
          </View>
          <Text style={styles.title}>Brain Games</Text>
          <Text style={styles.subtitle}>
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
                    {/* Apple icon is not in Lucide, using LogIn as generic or just text */}
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
  icon: LucideIcon;
  text: string;
}

const BenefitItem: React.FC<BenefitItemProps> = ({ icon: Icon, text }) => (
  <View style={styles.benefitItem}>
    <Icon size={24} color="#cbd5e1" style={{ marginRight: 12 }} />
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
  iconContainer: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
