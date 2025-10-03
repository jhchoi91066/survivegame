import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useMergePuzzleStore } from '../game/mergepuzzle/store';
import { GRID_SIZE, MAX_MOVES, TARGET_NUMBER } from '../game/mergepuzzle/types';
import NumberTile from '../components/mergepuzzle/NumberTile';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MergePuzzleGame'>;

const MergePuzzleGame: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { tiles, moves, maxMoves, gameStatus, targetNumber, initializeGame, selectTile, resetGame } =
    useMergePuzzleStore();

  useEffect(() => {
    initializeGame();
  }, []);

  const handleTilePress = (tileId: string) => {
    selectTile(tileId);
  };

  const handleRestart = () => {
    resetGame();
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
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBackToMenu}>
          <Text style={styles.backButtonText}>← 메뉴</Text>
        </Pressable>
        <Text style={styles.title}>Merge Puzzle</Text>
      </View>

      {/* 게임 정보 */}
      <View style={styles.infoContainer}>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>목표</Text>
          <Text style={styles.infoValue}>{targetNumber}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>이동</Text>
          <Text style={styles.infoValue}>
            {moves}/{maxMoves}
          </Text>
        </View>
      </View>

      {/* 설명 */}
      <Text style={styles.description}>같은 숫자를 선택하여 합치세요!</Text>

      {/* 게임 보드 */}
      {renderGrid()}

      {/* 재시작 버튼 */}
      <Pressable style={styles.restartButton} onPress={handleRestart}>
        <Text style={styles.restartButtonText}>🔄 재시작</Text>
      </Pressable>

      {/* 승리 모달 */}
      <Modal visible={gameStatus === 'won'} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalEmoji}>🎉</Text>
            <Text style={styles.modalTitle}>성공!</Text>
            <Text style={styles.modalMessage}>
              {targetNumber}를 만들었습니다!{'\n'}
              이동 횟수: {moves}회
            </Text>
            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalButton, styles.retryButton]} onPress={handleRestart}>
                <Text style={styles.modalButtonText}>다시 도전</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.menuButton]} onPress={handleBackToMenu}>
                <Text style={styles.modalButtonText}>메뉴로</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 패배 모달 */}
      <Modal visible={gameStatus === 'lost'} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalEmoji}>😢</Text>
            <Text style={styles.modalTitle}>실패!</Text>
            <Text style={styles.modalMessage}>
              더 이상 합칠 수 없습니다.{'\n'}
              이동 횟수: {moves}회
            </Text>
            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalButton, styles.retryButton]} onPress={handleRestart}>
                <Text style={styles.modalButtonText}>다시 도전</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.menuButton]} onPress={handleBackToMenu}>
                <Text style={styles.modalButtonText}>메뉴로</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#22d3ee',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginRight: 60,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#22d3ee',
  },
  description: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
  },
  gridContainer: {
    alignSelf: 'center',
    backgroundColor: '#1e293b',
    padding: 8,
    borderRadius: 12,
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
    backgroundColor: '#22d3ee',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignSelf: 'center',
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
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '80%',
    maxWidth: 400,
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
    backgroundColor: '#475569',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
});

export default MergePuzzleGame;
