import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useMergePuzzleStore } from '../game/mergepuzzle/store';
import { GRID_SIZE, MAX_MOVES, TARGET_NUMBER } from '../game/mergepuzzle/types';
import NumberTile from '../components/mergepuzzle/NumberTile';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { updateMergePuzzleRecord } from '../utils/statsManager';
import { incrementGameCount } from '../utils/reviewManager';
import { useTheme } from '../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from '../components/shared/GlassView';
import { ArrowLeft, RotateCcw, Trophy, AlertCircle } from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MergePuzzleGame'>;

const MergePuzzleGame: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { tiles, moves, maxMoves, gameStatus, targetNumber, initializeGame, selectTile, resetGame } =
    useMergePuzzleStore();
  const { theme, themeMode } = useTheme();

  const [gameStartTime, setGameStartTime] = React.useState<number>(0);

  useEffect(() => {
    initializeGame();
    setGameStartTime(Date.now());
  }, []);

  // 게임 종료 시 기록 저장
  useEffect(() => {
    if (gameStatus === 'won' || gameStatus === 'lost') {
      const handleGameEnd = async () => {
        const highestNumber = Math.max(...tiles.map(t => t.value));
        const playTime = (Date.now() - gameStartTime) / 1000;
        await updateMergePuzzleRecord(moves, highestNumber, playTime);

        // 게임 카운트 증가 및 리뷰 요청
        await incrementGameCount();
      };

      handleGameEnd();
    }
  }, [gameStatus]);

  const handleTilePress = (tileId: string) => {
    selectTile(tileId);
  };

  const handleRestart = () => {
    resetGame();
    setGameStartTime(Date.now());
  };

  const handleBackToMenu = () => {
    navigation.navigate('Menu');
  };

  // 3x3 그리드 생성
  const renderGrid = () => {
    const grid: (typeof tiles[0] | null)[][] = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(null));

    tiles.forEach((tile) => {
      grid[tile.position.row][tile.position.col] = tile;
    });

    return (
      <View style={styles.gridContainer}>
        {grid.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((tile, colIndex) => (
              <View key={`${rowIndex}-${colIndex}`} style={styles.cellWrapper}>
                {tile ? (
                  <NumberTile
                    value={tile.value}
                    isSelected={tile.isSelected}
                    isMerged={tile.isMerged}
                    onPress={() => handleTilePress(tile.id)}
                  />
                ) : (
                  <View style={styles.emptyCell} />
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={themeMode === 'dark' ? ['#0f172a', '#1e293b'] : ['#f0f9ff', '#e0f2fe']}
        style={StyleSheet.absoluteFill}
      />
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBackToMenu}>
          <GlassView style={styles.iconButtonGlass} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </GlassView>
        </Pressable>
        <Text style={[styles.title, { color: theme.colors.text }]}>Merge Puzzle</Text>
      </View>

      {/* 게임 정보 */}
      <View style={styles.infoContainer}>
        <GlassView style={styles.infoBox} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>목표</Text>
          <Text style={[styles.infoValue, { color: theme.colors.primary }]}>{targetNumber}</Text>
        </GlassView>
        <GlassView style={styles.infoBox} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>이동</Text>
          <Text style={[styles.infoValue, { color: theme.colors.primary }]}>
            {moves}/{maxMoves}
          </Text>
        </GlassView>
      </View>

      {/* 설명 */}
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>같은 숫자를 선택하여 합치세요!</Text>

      {/* 게임 보드 */}
      {renderGrid()}

      {/* 재시작 버튼 */}
      <Pressable style={styles.restartButton} onPress={handleRestart}>
        <GlassView style={styles.restartButtonGlass} intensity={30} tint={themeMode === 'dark' ? 'dark' : 'light'}>
          <RotateCcw size={20} color={theme.colors.text} style={{ marginRight: 8 }} />
          <Text style={[styles.restartButtonText, { color: theme.colors.text }]}>재시작</Text>
        </GlassView>
      </Pressable>

      {/* 승리 모달 */}
      <Modal visible={gameStatus === 'won'} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <GlassView style={styles.modalContent} intensity={30} tint={themeMode === 'dark' ? 'dark' : 'light'}>
            <Trophy size={64} color={theme.colors.warning} style={{ marginBottom: 16 }} />
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>성공!</Text>
            <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>
              {targetNumber}를 만들었습니다!{'\n'}
              이동 횟수: {moves}회
            </Text>
            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalButton, styles.retryButton]} onPress={handleRestart}>
                <Text style={styles.modalButtonText}>다시 도전</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, { backgroundColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]} onPress={handleBackToMenu}>
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>메뉴로</Text>
              </Pressable>
            </View>
          </GlassView>
        </View>
      </Modal>

      {/* 패배 모달 */}
      <Modal visible={gameStatus === 'lost'} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <GlassView style={styles.modalContent} intensity={30} tint={themeMode === 'dark' ? 'dark' : 'light'}>
            <AlertCircle size={64} color={theme.colors.error} style={{ marginBottom: 16 }} />
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>실패!</Text>
            <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>
              더 이상 합칠 수 없습니다.{'\n'}
              이동 횟수: {moves}회
            </Text>
            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalButton, styles.retryButton]} onPress={handleRestart}>
                <Text style={styles.modalButtonText}>다시 도전</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, { backgroundColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]} onPress={handleBackToMenu}>
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>메뉴로</Text>
              </Pressable>
            </View>
          </GlassView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 16,
  },
  iconButtonGlass: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginRight: 56, // Balance back button width
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  infoBox: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100,
    overflow: 'hidden',
  },
  infoLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  infoValue: {
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
  },
  gridContainer: {
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden', // Ensure glass effect stays within bounds if needed, though Grid is usually transparent
  },
  row: {
    flexDirection: 'row',
  },
  cellWrapper: {
    width: 108,
    height: 108,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCell: {
    width: 100,
    height: 100,
    backgroundColor: '#334155',
    borderRadius: 8,
    margin: 4,
  },
  restartButton: {
    marginTop: 24,
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  restartButtonGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  restartButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  modalEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 100,
  },
  retryButton: {
    backgroundColor: '#22d3ee',
  },
  menuButton: {
    // backgroundColor: '#475569', // Handled dynamically
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
});

export default MergePuzzleGame;
