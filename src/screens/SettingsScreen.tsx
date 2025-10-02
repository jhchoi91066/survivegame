import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Switch, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TUTORIAL_KEY = '@tutorial_completed';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </Pressable>
        <Text style={styles.title}>설정</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Sound Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>사운드</Text>

          <View style={styles.setting}>
            <Text style={styles.settingLabel}>효과음</Text>
            <Switch value={soundEnabled} onValueChange={setSoundEnabled} />
          </View>

          <View style={styles.setting}>
            <Text style={styles.settingLabel}>배경 음악</Text>
            <Switch value={musicEnabled} onValueChange={setMusicEnabled} />
          </View>

          <View style={styles.setting}>
            <Text style={styles.settingLabel}>진동</Text>
            <Switch value={vibrationEnabled} onValueChange={setVibrationEnabled} />
          </View>
        </View>

        {/* Game Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>게임</Text>

          <Pressable style={styles.button} onPress={handleResetTutorial}>
            <Text style={styles.buttonText}>튜토리얼 다시 보기</Text>
          </Pressable>

          <Pressable style={styles.button} onPress={handleResetProgress}>
            <Text style={styles.buttonText}>진행도 초기화</Text>
          </Pressable>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>정보</Text>
          <Text style={styles.infoText}>버전: 1.0.0</Text>
          <Text style={styles.infoText}>개발: React Native + Expo</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  placeholder: {
    width: 60,
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLabel: {
    fontSize: 16,
    color: '#4b5563',
  },
  button: {
    backgroundColor: '#f3f4f6',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 16,
    color: '#3b82f6',
    textAlign: 'center',
    fontWeight: '500',
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
});

export default SettingsScreen;