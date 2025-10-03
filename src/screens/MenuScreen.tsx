import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { hapticPatterns } from '../utils/haptics';
import { useGameStore } from '../game/shared/store';
import { GameType, GameInfo } from '../game/shared/types';
import { loadStats, loadGameRecord } from '../utils/statsManager';

type MenuScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Menu'>;

interface MenuScreenProps {
  navigation: MenuScreenNavigationProp;
}

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

const MenuScreen: React.FC<MenuScreenProps> = ({ navigation }) => {
  const { globalStats } = useGameStore();
  const [gameInfos, setGameInfos] = useState<GameInfo[]>([]);

  useEffect(() => {
    loadGameData();
  }, []);

  const loadGameData = async () => {
    const flipMatchRecord = await loadGameRecord('flip_match');
    const sequenceRecord = await loadGameRecord('sequence');
    const mathRushRecord = await loadGameRecord('math_rush');
    const connectFlowRecord = await loadGameRecord('connect_flow');

    const games: GameInfo[] = [
      {
        id: 'flip_match',
        name: 'Flip & Match',
        emoji: '🎴',
        description: '카드 뒤집기',
        bestRecordLabel: 'Best',
        bestRecordValue: flipMatchRecord?.bestTime
          ? `${flipMatchRecord.bestTime}초`
          : '-',
      },
      {
        id: 'sequence',
        name: 'Sequence',
        emoji: '🔢',
        description: '순서 맞추기',
        bestRecordLabel: 'Best',
        bestRecordValue: sequenceRecord?.highestLevel
          ? `Lv.${sequenceRecord.highestLevel}`
          : '-',
      },
      {
        id: 'math_rush',
        name: 'Math Rush',
        emoji: '➕',
        description: '빠른 계산',
        bestRecordLabel: 'Best',
        bestRecordValue: mathRushRecord?.highScore
          ? `${mathRushRecord.highScore}점`
          : '-',
      },
      {
        id: 'connect_flow',
        name: 'Color Match',
        emoji: '🎨',
        description: '색깔 매칭',
        bestRecordLabel: 'Best',
        bestRecordValue: connectFlowRecord?.bestMoves
          ? `${connectFlowRecord.bestMoves}회`
          : '-',
      },
    ];

    setGameInfos(games);
  };

  const handleGamePress = (gameId: GameType) => {
    hapticPatterns.buttonPress();

    switch (gameId) {
      case 'flip_match':
        navigation.navigate('FlipMatchGame');
        break;
      case 'sequence':
        navigation.navigate('SequenceGame');
        break;
      case 'math_rush':
        navigation.navigate('MathRushGame');
        break;
      case 'connect_flow':
        navigation.navigate('ConnectFlowGame');
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Brain Games</Text>
            <Text style={styles.subtitle}>두뇌 게임 컬렉션</Text>
          </View>
          <Pressable
            style={styles.settingsButton}
            onPress={() => {
              hapticPatterns.buttonPress();
              navigation.navigate('Settings');
            }}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </Pressable>
        </View>

        {/* Game Grid - 2x2 */}
        <View style={styles.gamesContainer}>
          {gameInfos.map((game) => (
            <Pressable
              key={game.id}
              style={styles.gameCard}
              onPress={() => handleGamePress(game.id)}
            >
              <View style={styles.gameIconContainer}>
                <Text style={styles.gameEmoji}>{game.emoji}</Text>
              </View>
              <Text style={styles.gameName}>{game.name}</Text>
              <Text style={styles.gameDescription}>{game.description}</Text>
              <View style={styles.recordContainer}>
                <Text style={styles.recordValue}>{game.bestRecordValue}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Bottom Buttons */}
        <View style={styles.bottomButtons}>
          <Pressable
            style={styles.bottomButton}
            onPress={() => {
              hapticPatterns.buttonPress();
              navigation.navigate('Stats');
            }}
          >
            <Text style={styles.bottomButtonIcon}>📊</Text>
            <Text style={styles.bottomButtonText}>통계</Text>
          </Pressable>

          <Pressable
            style={styles.bottomButton}
            onPress={() => {
              hapticPatterns.buttonPress();
              navigation.navigate('Achievements');
            }}
          >
            <Text style={styles.bottomButtonIcon}>🏆</Text>
            <Text style={styles.bottomButtonText}>업적</Text>
          </Pressable>
        </View>

        <Text style={styles.version}>v2.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // darker slate
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    marginTop: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: isSmallScreen ? 28 : 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  settingsButton: {
    width: 44,
    height: 44,
    backgroundColor: '#1e293b',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 20,
  },
  gamesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  gameCard: {
    width: `${(100 - 1.5) / 2}%`, // 2열 그리드
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  gameIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#334155',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameEmoji: {
    fontSize: 36,
  },
  gameName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 12,
  },
  recordContainer: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  recordValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22d3ee',
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  bottomButton: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bottomButtonIcon: {
    fontSize: 20,
  },
  bottomButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  version: {
    fontSize: 11,
    color: '#334155',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default MenuScreen;
