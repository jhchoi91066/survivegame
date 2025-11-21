import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Switch, Alert, Platform, ScrollView } from 'react-native';
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
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from '../components/shared/GlassView';
import {
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Gamepad2,
  Globe,
  User,
  Info,
  ArrowLeft,
  Download,
  Trash2
} from 'lucide-react-native';

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

      if (Platform.OS === 'web') {
        // Web handling for download
        const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        Alert.alert('완료', `데이터가 다운로드되었습니다: ${filename}`);
      } else {
        // Native handling
        const fs = FileSystem as any;
        const fileUri = (fs.documentDirectory || fs.cacheDirectory) + filename;
        await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(userData, null, 2));

        // Share the file
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Alert.alert('완료', `데이터가 다운로드되었습니다: ${filename}`);
        }
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

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.background} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <GlassView style={styles.backButtonGlass} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
              <ArrowLeft size={24} color={theme.colors.text} />
            </GlassView>
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.text }]}>설정</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Appearance Settings */}
          <GlassView style={styles.section} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
            <View style={styles.sectionHeader}>
              {themeMode === 'dark' ? <Moon size={20} color={theme.colors.primary} /> : <Sun size={20} color={theme.colors.primary} />}
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>외관</Text>
            </View>

            <View style={[styles.setting, { borderBottomColor: theme.colors.border }]}>
              <View>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>다크 모드</Text>
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
          </GlassView>

          {/* Sound Settings */}
          <GlassView style={styles.section} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
            <View style={styles.sectionHeader}>
              {soundEnabled ? <Volume2 size={20} color={theme.colors.primary} /> : <VolumeX size={20} color={theme.colors.primary} />}
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>사운드</Text>
            </View>

            <View style={[styles.setting, { borderBottomColor: theme.colors.border }]}>
              <View>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>효과음</Text>
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

            <View style={[styles.setting, { borderBottomColor: 'transparent' }]}>
              <View>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>진동</Text>
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
          </GlassView>

          {/* Game Settings */}
          <GlassView style={styles.section} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
            <View style={styles.sectionHeader}>
              <Gamepad2 size={20} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>게임</Text>
            </View>

            <Pressable style={styles.button} onPress={handleResetTutorial}>
              <GlassView style={styles.buttonGlass} intensity={30} tint={themeMode === 'dark' ? 'dark' : 'light'}>
                <Text style={[styles.buttonText, { color: theme.colors.text }]}>튜토리얼 다시 보기</Text>
              </GlassView>
            </Pressable>

            <Pressable style={styles.button} onPress={handleResetProgress}>
              <GlassView style={styles.buttonGlass} intensity={30} tint={themeMode === 'dark' ? 'dark' : 'light'}>
                <Text style={[styles.buttonText, { color: theme.colors.text }]}>진행도 초기화</Text>
              </GlassView>
            </Pressable>
          </GlassView>

          {/* Online Settings */}
          {user && (
            <GlassView style={styles.section} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
              <View style={styles.sectionHeader}>
                <Globe size={20} color={theme.colors.primary} />
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>온라인 설정</Text>
              </View>

              <View style={[styles.setting, { borderBottomColor: theme.colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>자동 동기화</Text>
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

              <View style={[styles.setting, { borderBottomColor: theme.colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>리더보드 참여</Text>
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

              <View style={[styles.setting, { borderBottomColor: 'transparent' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>친구 요청 수신</Text>
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
            </GlassView>
          )}

          {/* Account Management */}
          {user && (
            <GlassView style={styles.section} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
              <View style={styles.sectionHeader}>
                <User size={20} color={theme.colors.primary} />
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>계정 관리</Text>
              </View>

              <Pressable style={styles.button} onPress={handleDownloadData}>
                <GlassView style={styles.buttonGlass} intensity={30} tint={themeMode === 'dark' ? 'dark' : 'light'}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Download size={18} color={theme.colors.primary} />
                    <Text style={[styles.buttonText, { color: theme.colors.text }]}>
                      내 데이터 다운로드
                    </Text>
                  </View>
                </GlassView>
              </Pressable>

              <Text style={[styles.infoText, { marginTop: 8, marginBottom: 16, color: theme.colors.textTertiary }]}>
                GDPR 규정에 따라 모든 개인정보를 JSON 파일로 다운로드할 수 있습니다
              </Text>

              <Pressable style={styles.button} onPress={handleDeleteAccount}>
                <GlassView style={[styles.buttonGlass, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]} intensity={30} tint={themeMode === 'dark' ? 'dark' : 'light'}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Trash2 size={18} color="#ef4444" />
                    <Text style={[styles.buttonText, { color: '#ef4444' }]}>
                      계정 삭제
                    </Text>
                  </View>
                </GlassView>
              </Pressable>

              <Text style={[styles.infoText, { marginTop: 8, color: theme.colors.textTertiary }]}>
                계정 삭제 시 모든 데이터가 영구적으로 삭제됩니다
              </Text>
            </GlassView>
          )}

          {/* About */}
          <GlassView style={styles.section} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
            <View style={styles.sectionHeader}>
              <Info size={20} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>정보</Text>
            </View>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>버전: 3.0.0</Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>개발: React Native + Expo</Text>
          </GlassView>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'web' ? 40 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 20,
  },
  backButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  backButtonGlass: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    borderRadius: 16,
    marginBottom: 8,
    overflow: 'hidden',
  },
  buttonGlass: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 13,
    marginBottom: 4,
  },
});

export default SettingsScreen;
