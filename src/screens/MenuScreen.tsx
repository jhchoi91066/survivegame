import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type MenuScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Menu'>;

interface MenuScreenProps {
  navigation: MenuScreenNavigationProp;
}

const MenuScreen: React.FC<MenuScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.emoji}>🏝️</Text>
          <Text style={styles.title}>무인도 긴급 구조 작전</Text>
          <Text style={styles.subtitle}>Desert Island Rescue</Text>
        </View>

        {/* Menu Buttons */}
        <View style={styles.menu}>
          <Pressable style={styles.button} onPress={() => navigation.navigate('Game', {})}>
            <Text style={styles.buttonText}>🎮 게임 시작</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.navigate('LevelSelect')}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              📋 레벨 선택
            </Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.navigate('Stats')}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              📊 통계
            </Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              ⚙️ 설정
            </Text>
          </Pressable>
        </View>

        {/* Version */}
        <Text style={styles.version}>v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0ea5e9', // sky-500
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#e0f2fe',
    textAlign: 'center',
  },
  menu: {
    width: '100%',
    maxWidth: 300,
    gap: 16,
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0ea5e9',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  secondaryButtonText: {
    color: '#0369a1', // sky-700
  },
  version: {
    position: 'absolute',
    bottom: 20,
    fontSize: 12,
    color: '#bae6fd',
  },
});

export default MenuScreen;