import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Switch, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

const TUTORIAL_KEY = '@tutorial_completed';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { theme, themeMode, toggleTheme } = useTheme();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

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
            <Text style={dynamicStyles.settingLabel}>효과음</Text>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: '#cbd5e1', true: theme.colors.primary }}
            />
          </View>

          <View style={dynamicStyles.setting}>
            <Text style={dynamicStyles.settingLabel}>배경 음악</Text>
            <Switch
              value={musicEnabled}
              onValueChange={setMusicEnabled}
              trackColor={{ false: '#cbd5e1', true: theme.colors.primary }}
            />
          </View>

          <View style={dynamicStyles.setting}>
            <Text style={dynamicStyles.settingLabel}>진동</Text>
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

        {/* About */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>정보</Text>
          <Text style={dynamicStyles.infoText}>버전: 2.0.0</Text>
          <Text style={dynamicStyles.infoText}>개발: React Native + Expo</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
