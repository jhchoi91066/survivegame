
import { create } from 'zustand';
import { GameState, GameStatus, OddOneOutProblem, GridItem, ShapeType, Difficulty } from './types';

const initialDifficulty: Difficulty = {
  level: 1,
  gridSize: 3,
  colorDifference: 30,
  angleDifference: 45,
  sizeDifference: 0.2,
};

const createProblem = (difficulty: Difficulty): OddOneOutProblem => {
  const items: GridItem[] = [];
  const gridSize = difficulty.gridSize;
  const totalItems = gridSize * gridSize;
  const oddItemIndex = Math.floor(Math.random() * totalItems);

  const shapes: ShapeType[] = ['circle', 'square', 'triangle'];
  const baseShape = shapes[Math.floor(Math.random() * shapes.length)];

  const diffType = difficulty.level % 3; // Now 3 types of diff: color, rotation, shape

  let oddShape = baseShape;
  if (diffType === 0) {
    const otherShapes = shapes.filter(s => s !== baseShape);
    oddShape = otherShapes[Math.floor(Math.random() * otherShapes.length)];
  }

  const baseColorVal = Math.floor(Math.random() * (255 - difficulty.colorDifference));
  const baseColor = `rgb(${baseColorVal}, ${baseColorVal}, ${baseColorVal})`;
  const oddColor = `rgb(${baseColorVal + difficulty.colorDifference}, ${baseColorVal + difficulty.colorDifference}, ${baseColorVal + difficulty.colorDifference})`;
  const baseRotation = Math.floor(Math.random() * 360);
  const oddRotation = baseRotation + difficulty.angleDifference;

  for (let i = 0; i < totalItems; i++) {
    const isOdd = i === oddItemIndex;
    items.push({
      id: `item-${i}`,
      shape: isOdd && diffType === 0 ? oddShape : baseShape,
      color: isOdd && diffType === 1 ? oddColor : baseColor,
      rotation: isOdd && diffType === 2 ? oddRotation : baseRotation,
    });
  }

  return { items, oddItemIndex, difficulty };
};

interface GameStore extends GameState {
  startGame: (mode: 'speed' | 'survival') => void;
  answer: (index: number) => boolean;
  tick: () => void;
}

export const useFindTheOddStore = create<GameStore>((set, get) => ({
  gameStatus: 'ready',
  score: 0,
  timeRemaining: 60,
  currentProblem: null,
  difficulty: initialDifficulty,
  combo: 0,
  lives: 3,

  startGame: (mode) => {
    const difficulty = initialDifficulty;
    set({
      gameStatus: 'playing',
      score: 0,
      timeRemaining: mode === 'speed' ? 60 : 3,
      difficulty,
      combo: 0,
      lives: 3,
      currentProblem: createProblem(difficulty),
    });
  },

  answer: (selectedIndex) => {
    const { currentProblem, score, combo, difficulty, timeRemaining } = get();
    if (!currentProblem) return false;

    const isCorrect = selectedIndex === currentProblem.oddItemIndex;

    if (isCorrect) {
      const newDifficulty = { ...difficulty, level: difficulty.level + 1 };
      if (newDifficulty.level % 5 === 0) {
        newDifficulty.colorDifference = Math.max(5, newDifficulty.colorDifference - 5);
        newDifficulty.angleDifference = Math.max(5, newDifficulty.angleDifference - 5);
        newDifficulty.sizeDifference = Math.max(0.05, newDifficulty.sizeDifference - 0.05);
      }

      set({
        score: score + 100 + (combo * 10),
        combo: combo + 1,
        difficulty: newDifficulty,
        currentProblem: createProblem(newDifficulty),
        timeRemaining: timeRemaining + 1, // Add time for correct answer
      });
    } else {
      set({
        combo: 0,
        lives: (get().lives ?? 3) - 1,
        timeRemaining: timeRemaining - 2, // Penalty
      });
      if ((get().lives ?? 0) <= 0) {
        set({ gameStatus: 'finished' });
      }
    }
    return isCorrect;
  },

  tick: () => {
    const { timeRemaining } = get();
    if (timeRemaining > 0) {
      set({ timeRemaining: timeRemaining - 1 });
    } else {
      set({ gameStatus: 'finished' });
    }
  },
}));
