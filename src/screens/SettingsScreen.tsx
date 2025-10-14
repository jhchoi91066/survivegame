import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Switch, Alert, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { soundManager } from '../utils/soundManager';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const TUTORIAL_KEY = '@brain_games_first_visit';
const AUTO_SYNC_KEY = '@auto_sync_enabled';
const LEADERBOARD_PARTICIPATE_KEY = '@leaderboard_participate';
const FRIEND_REQUESTS_KEY = '@friend_requests_enabled';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { theme, themeMode, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  // Online settings
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [leaderboardParticipate, setLeaderboardParticipate] = useState(true);
  const [friendRequestsEnabled, setFriendRequestsEnabled] = useState(true);

  // Load sound settings on mount
  useEffect(() => {
    const loadSoundSettings = async () => {
      const settings = soundManager.getSettings();
      setSoundEnabled(settings.soundEnabled);
    };
    loadSoundSettings();
  }, []);

  const handleResetTutorial = async () => {
    try {
      await AsyncStorage.removeItem(TUTORIAL_KEY);
      Alert.alert('완료', '튜토리얼이 초기화되었습니다. 게임을 시작하면 튜토리얼이 다시 표시됩니다.');
    } catch (error) {
      Alert.alert('오류', '튜토리얼 초기화에 실패했습니다.');
    }
  };

  const handleResetProgress = () => {
    Alert.alert(
      '진행도 초기화',
      '모든 레벨 진행도가 삭제됩니다. 계속하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement progress reset when level system is ready
            Alert.alert('알림', '진행도 초기화 기능은 곧 제공됩니다.');
          },
        },
      ]
    );
  };

  const handleDownloadData = async () => {
    if (!user) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Fetch all user data
      const [profileData, gameRecordsData, leaderboardsData, friendshipsData, achievementsData] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('game_records').select('*').eq('user_id', user.id),
        supabase.from('leaderboards').select('*').eq('user_id', user.id),
        supabase.from('friendships').select('*').or(`user_id.eq.${user.id},friend_id.eq.${user.id}`),
        supabase.from('user_achievements').select('*').eq('user_id', user.id),
      ]);

      const userData = {
        profile: profileData.data,
        game_records: gameRecordsData.data,
        leaderboards: leaderboardsData.data,
        friendships: friendshipsData.data,
        achievements: achievementsData.data,
        export_date: new Date().toISOString(),
      };

      // Save to file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `brain-games-data-${timestamp}.json`;
      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(userData, null, 2));

      // Share the file
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('완료', `데이터가 다운로드되었습니다: ${filename}`);
      }
    } catch (error: any) {
      console.error('Download data error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', '데이터 다운로드에 실패했습니다: ' + error.message);
    }
  };

  const handleDeleteAccount = () => {
    if (!user) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    Alert.alert(
      '계정 삭제',
      '계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

              // Delete user data from all tables
              await supabase.from('user_achievements').delete().eq('user_id', user.id);
              await supabase.from('friendships').delete().or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
              await supabase.from('leaderboards').delete().eq('user_id', user.id);
              await supabase.from('game_records').delete().eq('user_id', user.id);
              await supabase.from('profiles').delete().eq('id', user.id);

              // Sign out
              await signOut();

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('완료', '계정이 삭제되었습니다.');
              navigation.navigate('Menu');
            } catch (error: any) {
              console.error('Delete account error:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('오류', '계정 삭제에 실패했습니다: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const handleToggleAutoSync = async (value: boolean) => {
    setAutoSyncEnabled(value);
    await AsyncStorage.setItem(AUTO_SYNC_KEY, JSON.stringify(value));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleToggleLeaderboard = async (value: boolean) => {
    setLeaderboardParticipate(value);
    await AsyncStorage.setItem(LEADERBOARD_PARTICIPATE_KEY, JSON.stringify(value));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleToggleFriendRequests = async (value: boolean) => {
    setFriendRequestsEnabled(value);
    await AsyncStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(value));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleToggleSound = async (value: boolean) => {
    setSoundEnabled(value);
    await soundManager.setEnabled(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (value) {
      soundManager.playSound('button_press'); // 테스트 사운드
    }
  };

  const dynamicStyles = {
    container: {
      ...styles.container,
      backgroundColor: theme.colors.background,
    },
    header: {
      ...styles.header,
      backgroundColor: theme.colors.surface,
      borderBottomColor: theme.colors.border,
    },
    backButtonText: {
      ...styles.backButtonText,
      color: theme.colors.primary,
    },
    title: {
      ...styles.title,
      color: theme.colors.text,
    },
    section: {
      ...styles.section,
      backgroundColor: theme.colors.surface,
    },
    sectionTitle: {
      ...styles.sectionTitle,
      color: theme.colors.text,
    },
    setting: {
      ...styles.setting,
      borderBottomColor: theme.colors.border,
    },
    settingLabel: {
      ...styles.settingLabel,
      color: theme.colors.textSecondary,
    },
    button: {
      ...styles.button,
      backgroundColor: theme.colors.surfaceSecondary,
    },
    buttonText: {
      ...styles.buttonText,
      color: theme.colors.primary,
    },
    infoText: {
      ...styles.infoText,
      color: theme.colors.textTertiary,
    },
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={dynamicStyles.backButtonText}>← 뒤로</Text>
        </Pressable>
        <Text style={dynamicStyles.title}>설정</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Appearance Settings */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>외관</Text>

          <View style={dynamicStyles.setting}>
            <View>
              <Text style={dynamicStyles.settingLabel}>다크 모드</Text>
              <Text style={[styles.settingDescription, { color: theme.colors.textTertiary }]}>
                {themeMode === 'dark' ? '어두운 테마 사용 중' : '밝은 테마 사용 중'}
              </Text>
            </View>
            <Switch
              value={themeMode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#cbd5e1', true: theme.colors.primary }}
              thumbColor={themeMode === 'dark' ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Sound Settings */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>사운드</Text>

          <View style={dynamicStyles.setting}>
            <View>
              <Text style={dynamicStyles.settingLabel}>효과음</Text>
              <Text style={[styles.settingDescription, { color: theme.colors.textTertiary }]}>
                {soundEnabled ? '게임 사운드 효과 활성화' : '게임 사운드 효과 비활성화'}
              </Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={handleToggleSound}
              trackColor={{ false: '#cbd5e1', true: theme.colors.primary }}
              thumbColor={soundEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>

          <View style={dynamicStyles.setting}>
            <View>
              <Text style={dynamicStyles.settingLabel}>진동</Text>
              <Text style={[styles.settingDescription, { color: theme.colors.textTertiary }]}>
                {vibrationEnabled ? '햅틱 피드백 활성화' : '햅틱 피드백 비활성화'}
              </Text>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={setVibrationEnabled}
              trackColor={{ false: '#cbd5e1', true: theme.colors.primary }}
            />
          </View>
        </View>

        {/* Game Settings */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>게임</Text>

          <Pressable style={dynamicStyles.button} onPress={handleResetTutorial}>
            <Text style={dynamicStyles.buttonText}>튜토리얼 다시 보기</Text>
          </Pressable>

          <Pressable style={dynamicStyles.button} onPress={handleResetProgress}>
            <Text style={dynamicStyles.buttonText}>진행도 초기화</Text>
          </Pressable>
        </View>

        {/* Online Settings */}
        {user && (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>온라인 설정</Text>

            <View style={dynamicStyles.setting}>
              <View style={{ flex: 1 }}>
                <Text style={dynamicStyles.settingLabel}>자동 동기화</Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textTertiary }]}>
                  게임 기록을 자동으로 클라우드에 저장
                </Text>
              </View>
              <Switch
                value={autoSyncEnabled}
                onValueChange={handleToggleAutoSync}
                trackColor={{ false: '#cbd5e1', true: theme.colors.primary }}
              />
            </View>

            <View style={dynamicStyles.setting}>
              <View style={{ flex: 1 }}>
                <Text style={dynamicStyles.settingLabel}>리더보드 참여</Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textTertiary }]}>
                  내 기록을 리더보드에 표시
                </Text>
              </View>
              <Switch
                value={leaderboardParticipate}
                onValueChange={handleToggleLeaderboard}
                trackColor={{ false: '#cbd5e1', true: theme.colors.primary }}
              />
            </View>

            <View style={dynamicStyles.setting}>
              <View style={{ flex: 1 }}>
                <Text style={dynamicStyles.settingLabel}>친구 요청 수신</Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textTertiary }]}>
                  다른 사용자의 친구 요청 허용
                </Text>
              </View>
              <Switch
                value={friendRequestsEnabled}
                onValueChange={handleToggleFriendRequests}
                trackColor={{ false: '#cbd5e1', true: theme.colors.primary }}
              />
            </View>
          </View>
        )}

        {/* Account Management */}
        {user && (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>계정 관리</Text>

            <Pressable
              style={dynamicStyles.button}
              onPress={handleDownloadData}
            >
              <Text style={dynamicStyles.buttonText}>
                내 데이터 다운로드
              </Text>
            </Pressable>

            <Text style={[dynamicStyles.infoText, { marginTop: 8, marginBottom: 16 }]}>
              GDPR 규정에 따라 모든 개인정보를 JSON 파일로 다운로드할 수 있습니다
            </Text>

            <Pressable
              style={[dynamicStyles.button, { backgroundColor: '#ef4444' }]}
              onPress={handleDeleteAccount}
            >
              <Text style={[dynamicStyles.buttonText, { color: '#ffffff' }]}>
                계정 삭제
              </Text>
            </Pressable>

            <Text style={[dynamicStyles.infoText, { marginTop: 8 }]}>
              계정 삭제 시 모든 데이터가 영구적으로 삭제됩니다
            </Text>
          </View>
        )}

        {/* About */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>정보</Text>
          <Text style={dynamicStyles.infoText}>버전: 3.0.0</Text>
          <Text style={dynamicStyles.infoText}>개발: React Native + Expo</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'web' ? 40 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  content: {
    padding: 16,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
  },
});

export default SettingsScreen;
