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
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { GlassView } from '../components/shared/GlassView';
import { ArrowLeft, User, Mail, Calendar, Globe, LogOut, Trash2, Edit2, Check, X } from 'lucide-react-native';

import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';

type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<any, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

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
  const { theme } = useTheme();
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
          navigation.navigate('MainTabs');
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
                navigation.navigate('MainTabs');
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
          navigation.navigate('MainTabs');
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
                navigation.navigate('MainTabs');
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

  const styles = getStyles(theme);

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={theme.gradients.background} style={styles.backgroundGradient} />
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.background} style={styles.backgroundGradient} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <GlassView style={styles.iconButtonGlass} intensity={20}>
                <ArrowLeft size={24} color={theme.colors.text} />
              </GlassView>
            </Pressable>
            <Text style={styles.title}>내 프로필</Text>
            <View style={styles.placeholder} />
          </View>

          {/* 아바타 */}
          <View style={styles.avatarSection}>
            <LinearGradient
              colors={theme.gradients.primary}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {username ? username[0].toUpperCase() : '?'}
              </Text>
            </LinearGradient>
            <Text style={styles.usernameDisplay}>{username || '사용자'}</Text>
            <Text style={styles.emailDisplay}>{user?.email || '익명 사용자'}</Text>
          </View>

          {/* 프로필 정보 */}
          <GlassView style={styles.section} intensity={20}>
            <View style={styles.sectionHeader}>
              <User size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>프로필 정보</Text>
              {!editing && (
                <Pressable onPress={() => setEditing(true)} style={styles.editButton}>
                  <Edit2 size={16} color={theme.colors.primary} />
                </Pressable>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>닉네임</Text>
              <GlassView style={styles.inputContainer} intensity={10} tint="dark" border={false}>
                <TextInput
                  style={[styles.input, !editing && styles.inputDisabled]}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="3-20자 닉네임"
                  placeholderTextColor={theme.colors.textTertiary}
                  editable={editing}
                  maxLength={20}
                />
              </GlassView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>국가 코드</Text>
              <GlassView style={styles.inputContainer} intensity={10} tint="dark" border={false}>
                <TextInput
                  style={[styles.input, !editing && styles.inputDisabled]}
                  value={countryCode}
                  onChangeText={(text) => setCountryCode(text.toUpperCase())}
                  placeholder="KR, US, JP 등 (선택)"
                  placeholderTextColor={theme.colors.textTertiary}
                  editable={editing}
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </GlassView>
              {editing && (
                <Text style={styles.hint}>
                  국가 코드는 지역별 리더보드에 사용됩니다.
                </Text>
              )}
            </View>

            {editing && (
              <View style={styles.editActions}>
                <Pressable
                  onPress={() => {
                    setUsername(profile?.username || '');
                    setCountryCode(profile?.country_code || '');
                    setEditing(false);
                  }}
                  style={styles.cancelButton}
                >
                  <X size={20} color={theme.colors.textSecondary} />
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  disabled={saving}
                  style={styles.saveButton}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Check size={20} color="#fff" />
                  )}
                </Pressable>
              </View>
            )}
          </GlassView>

          {/* 계정 정보 */}
          {profile && (
            <GlassView style={styles.section} intensity={20}>
              <View style={styles.sectionHeader}>
                <Mail size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>계정 상세</Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>이메일</Text>
                  <Text style={styles.infoValue}>{user?.email || '익명'}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>가입일</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Calendar size={14} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                    <Text style={styles.infoValue}>
                      {new Date(profile.created_at).toLocaleDateString('ko-KR')}
                    </Text>
                  </View>
                </View>
              </View>
            </GlassView>
          )}

          {/* 계정 관리 버튼들 */}
          {!editing && (
            <View style={styles.buttons}>
              <Pressable
                onPress={handleSignOut}
                style={styles.actionButton}
              >
                <GlassView style={styles.actionButtonGlass} intensity={20}>
                  <LogOut size={20} color={theme.colors.text} />
                  <Text style={styles.actionButtonText}>로그아웃</Text>
                </GlassView>
              </Pressable>

              <Pressable
                onPress={handleDeleteAccount}
                style={styles.actionButton}
              >
                <GlassView style={[styles.actionButtonGlass, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]} intensity={20}>
                  <Trash2 size={20} color={theme.colors.error} />
                  <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>계정 삭제</Text>
                </GlassView>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'web' ? 40 : 0,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  backButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  iconButtonGlass: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.text,
  },
  placeholder: {
    width: 44,
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
    marginBottom: 16,
    elevation: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#fff',
  },
  usernameDisplay: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 4,
  },
  emailDisplay: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  section: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginLeft: 10,
    flex: 1,
  },
  editButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: theme.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: theme.colors.text,
  },
  inputDisabled: {
    opacity: 0.7,
  },
  hint: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginTop: 6,
    marginLeft: 4,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: theme.colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  infoRow: {
    marginBottom: 8,
  },
  infoItem: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 16,
    opacity: 0.5,
  },
  buttons: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButtonGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
    borderRadius: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
});

export default ProfileScreen;
