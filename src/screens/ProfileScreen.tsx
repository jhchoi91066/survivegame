import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import * as Haptics from 'expo-haptics';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Menu'>;

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  country_code?: string;
  created_at: string;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState('');
  const [countryCode, setCountryCode] = useState('');

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setUsername(data.username);
        setCountryCode(data.country_code || '');
      } else {
        // 프로필이 없으면 생성 모드로
        setEditing(true);
      }
    } catch (error) {
      console.error('프로필 로드 오류:', error);
      Alert.alert('오류', '프로필을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!username || username.length < 3) {
      Alert.alert('오류', '닉네임은 3자 이상이어야 합니다.');
      return;
    }

    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const profileData = {
        id: user?.id,
        username: username.trim(),
        country_code: countryCode.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (profile) {
        // 업데이트
        const { error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user?.id);

        if (error) throw error;
      } else {
        // 생성
        const { error } = await supabase
          .from('profiles')
          .insert([profileData]);

        if (error) throw error;
      }

      await loadProfile();
      setEditing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('성공', '프로필이 저장되었습니다!');
    } catch (error: any) {
      console.error('프로필 저장 오류:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      if (error.code === '23505') {
        Alert.alert('오류', '이미 사용 중인 닉네임입니다.');
      } else {
        Alert.alert('오류', '프로필을 저장할 수 없습니다.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('정말 로그아웃하시겠습니까?')) {
        try {
          await signOut();
          navigation.navigate('Menu');
        } catch (error) {
          window.alert('로그아웃 중 문제가 발생했습니다.');
        }
      }
    } else {
      Alert.alert(
        '로그아웃',
        '정말 로그아웃하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '로그아웃',
            style: 'destructive',
            onPress: async () => {
              try {
                await signOut();
                navigation.navigate('Menu');
              } catch (error) {
                Alert.alert('오류', '로그아웃 중 문제가 발생했습니다.');
              }
            },
          },
        ]
      );
    }
  };

  const handleDeleteAccount = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('정말 계정을 삭제하시겠습니까? 모든 데이터가 영구적으로 삭제됩니다.')) {
        try {
          const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', user?.id);

          if (error) throw error;

          await signOut();
          navigation.navigate('Menu');
          window.alert('계정이 삭제되었습니다.');
        } catch (error) {
          console.error('계정 삭제 오류:', error);
          window.alert('계정을 삭제할 수 없습니다.');
        }
      }
    } else {
      Alert.alert(
        '계정 삭제',
        '정말 계정을 삭제하시겠습니까? 모든 데이터가 영구적으로 삭제됩니다.',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: async () => {
              try {
                const { error } = await supabase
                  .from('profiles')
                  .delete()
                  .eq('id', user?.id);

                if (error) throw error;

                await signOut();
                navigation.navigate('Menu');
                Alert.alert('완료', '계정이 삭제되었습니다.');
              } catch (error) {
                console.error('계정 삭제 오류:', error);
                Alert.alert('오류', '계정을 삭제할 수 없습니다.');
              }
            },
          },
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.gradient} />
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.gradient} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <Text style={styles.backText}>← 뒤로</Text>
          </Pressable>
          <Text style={styles.title}>내 프로필</Text>
        </View>

        {/* 아바타 */}
        <View style={styles.avatarSection}>
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {username ? username[0].toUpperCase() : '?'}
            </Text>
          </LinearGradient>
        </View>

        {/* 프로필 정보 */}
        <View style={styles.section}>
          <Text style={styles.label}>닉네임 *</Text>
          <TextInput
            style={[styles.input, !editing && styles.inputDisabled]}
            value={username}
            onChangeText={setUsername}
            placeholder="3-20자 닉네임"
            placeholderTextColor="#475569"
            editable={editing}
            maxLength={20}
          />

          <Text style={styles.label}>국가 코드 (선택)</Text>
          <TextInput
            style={[styles.input, !editing && styles.inputDisabled]}
            value={countryCode}
            onChangeText={(text) => setCountryCode(text.toUpperCase())}
            placeholder="KR, US, JP 등"
            placeholderTextColor="#475569"
            editable={editing}
            maxLength={2}
            autoCapitalize="characters"
          />

          <Text style={styles.hint}>
            국가 코드는 지역별 리더보드에 사용됩니다.
          </Text>
        </View>

        {/* 계정 정보 */}
        {profile && (
          <View style={styles.section}>
            <Text style={styles.label}>계정 정보</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>이메일</Text>
              <Text style={styles.infoValue}>{user?.email || '익명'}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>가입일</Text>
              <Text style={styles.infoValue}>
                {new Date(profile.created_at).toLocaleDateString('ko-KR')}
              </Text>
            </View>
          </View>
        )}

        {/* 버튼들 */}
        <View style={styles.buttons}>
          {editing ? (
            <>
              <Pressable
                onPress={handleSave}
                disabled={saving}
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                ]}
              >
                <LinearGradient
                  colors={['#6366f1', '#8b5cf6']}
                  style={styles.buttonGradient}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>저장</Text>
                  )}
                </LinearGradient>
              </Pressable>

              {profile && (
                <Pressable
                  onPress={() => {
                    setUsername(profile.username);
                    setCountryCode(profile.country_code || '');
                    setEditing(false);
                  }}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>취소</Text>
                </Pressable>
              )}
            </>
          ) : (
            <>
              <Pressable
                onPress={() => setEditing(true)}
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                ]}
              >
                <LinearGradient
                  colors={['#6366f1', '#8b5cf6']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>프로필 수정</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={handleSignOut}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.secondaryButtonText}>로그아웃</Text>
              </Pressable>

              <Pressable
                onPress={handleDeleteAccount}
                style={({ pressed }) => [
                  styles.dangerButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.dangerButtonText}>계정 삭제</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    marginBottom: 16,
    padding: 8,
    alignSelf: 'flex-start',
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  backText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  hint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: -8,
  },
  infoCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  buttons: {
    gap: 12,
    marginBottom: 40,
  },
  button: {
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#94a3b8',
    fontSize: 18,
    fontWeight: '700',
  },
  dangerButton: {
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default ProfileScreen;
