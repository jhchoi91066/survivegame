import { LevelConfig, PuzzleLevelObstacle } from './levelData';

// 튜토리얼 퍼즐 레벨 (5개)
export const PUZZLE_TUTORIAL_LEVELS: LevelConfig[] = [
  // 튜토리얼 1: 기본 장애물 제거
  {
    id: 101,
    name: '퍼즐 튜토리얼 1: 바위 치우기',
    difficulty: 'easy',
    gridSize: { width: 5, height: 3 },
    timeLimit: 120,
    planningTime: 60,
    isPuzzle: true,
    hint: '엔지니어를 사용해서 바위를 제거하세요',
    survivors: [
      { role: 'engineer', position: { x: 0, y: 1 } },
    ],
    rescuePoint: { x: 4, y: 1 },
    obstacles: [
      {
        id: 'rock1',
        type: 'rock',
        x: 2,
        y: 1,
      } as PuzzleLevelObstacle,
    ],
    starThresholds: { threeStar: 100, twoStar: 60 },
  },

  // 튜토리얼 2: 의존성 시스템
  {
    id: 102,
    name: '퍼즐 튜토리얼 2: 순서대로',
    difficulty: 'easy',
    gridSize: { width: 6, height: 3 },
    timeLimit: 120,
    planningTime: 60,
    isPuzzle: true,
    hint: 'A를 먼저 제거해야 B를 제거할 수 있습니다',
    survivors: [
      { role: 'engineer', position: { x: 0, y: 1 } },
    ],
    rescuePoint: { x: 5, y: 1 },
    obstacles: [
      {
        id: 'tree1',
        type: 'tree',
        x: 2,
        y: 1,
        blocksIds: ['rock1'], // tree1 제거 시 rock1 잠금 해제
      } as PuzzleLevelObstacle,
      {
        id: 'rock1',
        type: 'rock',
        x: 3,
        y: 1,
        blockedBy: ['tree1'], // tree1 먼저 제거해야 함
        isLocked: true,
      } as PuzzleLevelObstacle,
    ],
    starThresholds: { threeStar: 100, twoStar: 60 },
  },

  // 튜토리얼 3: 연쇄 반응 - 물 범람
  {
    id: 103,
    name: '퍼즐 튜토리얼 3: 물댐 폭파',
    difficulty: 'medium',
    gridSize: { width: 7, height: 3 },
    timeLimit: 150,
    planningTime: 60,
    isPuzzle: true,
    hint: '물댐을 폭파하면 주변 나무가 쓸려갑니다',
    survivors: [
      { role: 'engineer', position: { x: 0, y: 1 } },
    ],
    rescuePoint: { x: 6, y: 1 },
    obstacles: [
      {
        id: 'dam1',
        type: 'water_dam',
        x: 2,
        y: 1,
        chainReaction: { type: 'flood', range: 1 }, // 반경 1칸 범람
      } as PuzzleLevelObstacle,
      {
        id: 'tree1',
        type: 'tree',
        x: 3,
        y: 1,
      } as PuzzleLevelObstacle,
      {
        id: 'tree2',
        type: 'tree',
        x: 4,
        y: 1,
      } as PuzzleLevelObstacle,
    ],
    starThresholds: { threeStar: 120, twoStar: 80 },
    expectedSolution: ['explosive_dam'], // 폭탄으로 댐 폭파
  },

  // 튜토리얼 4: 생존자 시너지
  {
    id: 104,
    name: '퍼즐 튜토리얼 4: 팀워크',
    difficulty: 'medium',
    gridSize: { width: 6, height: 3 },
    timeLimit: 150,
    planningTime: 60,
    isPuzzle: true,
    hint: '엔지니어와 의사를 함께 사용하면 안전하게 폭탄을 해체할 수 있습니다',
    survivors: [
      { role: 'engineer', position: { x: 0, y: 1 } },
      { role: 'doctor', position: { x: 0, y: 2 } },
    ],
    rescuePoint: { x: 5, y: 1 },
    obstacles: [
      {
        id: 'explosive1',
        type: 'explosive',
        x: 3,
        y: 1,
        chainReaction: { type: 'explosion', radius: 1 },
      } as PuzzleLevelObstacle,
    ],
    starThresholds: { threeStar: 120, twoStar: 80 },
    expectedSolution: ['synergy_engineer_doctor'], // 시너지 사용
  },

  // 튜토리얼 5: 안개 정찰
  {
    id: 105,
    name: '퍼즐 튜토리얼 5: 숨겨진 위험',
    difficulty: 'medium',
    gridSize: { width: 7, height: 3 },
    timeLimit: 180,
    planningTime: 60,
    isPuzzle: true,
    hint: '아이를 보내서 안개 속 장애물을 확인하세요',
    survivors: [
      { role: 'child', position: { x: 0, y: 1 } },
      { role: 'engineer', position: { x: 0, y: 2 } },
    ],
    rescuePoint: { x: 6, y: 1 },
    obstacles: [
      {
        id: 'fog1',
        type: 'fog',
        x: 3,
        y: 1,
        isRevealed: false,
        hiddenObstacles: [
          {
            id: 'rock_hidden',
            type: 'rock',
            x: 3,
            y: 1,
          } as PuzzleLevelObstacle,
        ],
      } as PuzzleLevelObstacle,
    ],
    starThresholds: { threeStar: 150, twoStar: 100 },
    expectedSolution: ['scout_fog', 'remove_rock'], // 정찰 후 제거
  },
];

// 메인 퍼즐 레벨 (1-10)
export const PUZZLE_MAIN_LEVELS: LevelConfig[] = [
  // 레벨 1: 불 끄기
  {
    id: 1,
    name: '레벨 1: 화재 진압',
    difficulty: 'easy',
    gridSize: { width: 5, height: 4 },
    timeLimit: 120,
    planningTime: 60,
    isPuzzle: true,
    hint: '의사가 물을 사용해서 불을 끌 수 있습니다',
    survivors: [
      { role: 'doctor', position: { x: 0, y: 1 } },
    ],
    rescuePoint: { x: 4, y: 1 },
    obstacles: [
      {
        id: 'fire1',
        type: 'fire',
        x: 2,
        y: 1,
      } as PuzzleLevelObstacle,
    ],
    initialResources: { food: 5, water: 3, tool: 2, medical: 3, explosive: 1 },
    starThresholds: { threeStar: 100, twoStar: 70 },
  },

  // 레벨 2: 나무와 바위
  {
    id: 2,
    name: '레벨 2: 길 만들기',
    difficulty: 'easy',
    gridSize: { width: 6, height: 4 },
    timeLimit: 150,
    planningTime: 60,
    isPuzzle: true,
    hint: '엔지니어로 장애물을 제거하세요',
    survivors: [
      { role: 'engineer', position: { x: 0, y: 2 } },
    ],
    rescuePoint: { x: 5, y: 2 },
    obstacles: [
      {
        id: 'tree1',
        type: 'tree',
        x: 2,
        y: 2,
      } as PuzzleLevelObstacle,
      {
        id: 'rock1',
        type: 'rock',
        x: 3,
        y: 2,
      } as PuzzleLevelObstacle,
    ],
    initialResources: { food: 5, water: 3, tool: 3, medical: 2, explosive: 1 },
    starThresholds: { threeStar: 120, twoStar: 80 },
  },

  // 레벨 3: 얼음 녹이기
  {
    id: 3,
    name: '레벨 3: 얼음 왕국',
    difficulty: 'medium',
    gridSize: { width: 6, height: 4 },
    timeLimit: 180,
    planningTime: 60,
    isPuzzle: true,
    hint: '불로 얼음을 녹일 수 있습니다',
    survivors: [
      { role: 'engineer', position: { x: 0, y: 2 } },
    ],
    rescuePoint: { x: 5, y: 2 },
    obstacles: [
      {
        id: 'ice1',
        type: 'ice',
        x: 2,
        y: 2,
      } as PuzzleLevelObstacle,
      {
        id: 'ice2',
        type: 'ice',
        x: 3,
        y: 2,
      } as PuzzleLevelObstacle,
      {
        id: 'ice3',
        type: 'ice',
        x: 4,
        y: 2,
      } as PuzzleLevelObstacle,
    ],
    initialResources: { food: 5, water: 3, tool: 2, medical: 2, explosive: 1 },
    starThresholds: { threeStar: 150, twoStar: 100 },
  },

  // 레벨 4: 연쇄 폭발
  {
    id: 4,
    name: '레벨 4: 폭탄 해체',
    difficulty: 'medium',
    gridSize: { width: 6, height: 5 },
    timeLimit: 180,
    planningTime: 60,
    isPuzzle: true,
    hint: '폭탄을 신중하게 해체하거나 연쇄 반응을 이용하세요',
    survivors: [
      { role: 'engineer', position: { x: 0, y: 2 } },
      { role: 'doctor', position: { x: 0, y: 3 } },
    ],
    rescuePoint: { x: 5, y: 2 },
    obstacles: [
      {
        id: 'explosive1',
        type: 'explosive',
        x: 3,
        y: 2,
        chainReaction: { type: 'explosion', radius: 1 },
      } as PuzzleLevelObstacle,
      {
        id: 'rock1',
        type: 'rock',
        x: 4,
        y: 2,
      } as PuzzleLevelObstacle,
    ],
    initialResources: { food: 5, water: 3, tool: 3, medical: 3, explosive: 0 },
    starThresholds: { threeStar: 150, twoStar: 100 },
  },

  // 레벨 5: 안개 숲
  {
    id: 5,
    name: '레벨 5: 안개 숲',
    difficulty: 'medium',
    gridSize: { width: 7, height: 5 },
    timeLimit: 200,
    planningTime: 60,
    isPuzzle: true,
    hint: '아이로 안개를 정찰한 후 장애물을 제거하세요',
    survivors: [
      { role: 'child', position: { x: 0, y: 2 } },
      { role: 'engineer', position: { x: 0, y: 3 } },
    ],
    rescuePoint: { x: 6, y: 2 },
    obstacles: [
      {
        id: 'fog1',
        type: 'fog',
        x: 3,
        y: 2,
        isRevealed: false,
        hiddenObstacles: [
          {
            id: 'rock_hidden1',
            type: 'rock',
            x: 3,
            y: 2,
          } as PuzzleLevelObstacle,
          {
            id: 'tree_hidden1',
            type: 'tree',
            x: 4,
            y: 2,
          } as PuzzleLevelObstacle,
        ],
      } as PuzzleLevelObstacle,
    ],
    initialResources: { food: 6, water: 4, tool: 3, medical: 3, explosive: 1 },
    starThresholds: { threeStar: 170, twoStar: 120 },
  },

  // 레벨 6: 물댐 위기
  {
    id: 6,
    name: '레벨 6: 댐 붕괴',
    difficulty: 'hard',
    gridSize: { width: 7, height: 5 },
    timeLimit: 200,
    planningTime: 60,
    isPuzzle: true,
    hint: '댐을 안전하게 해체하거나 폭파로 연쇄 반응을 일으키세요',
    survivors: [
      { role: 'engineer', position: { x: 0, y: 2 } },
    ],
    rescuePoint: { x: 6, y: 2 },
    obstacles: [
      {
        id: 'dam1',
        type: 'water_dam',
        x: 3,
        y: 2,
        chainReaction: { type: 'flood', range: 2 },
      } as PuzzleLevelObstacle,
      {
        id: 'fire1',
        type: 'fire',
        x: 4,
        y: 1,
      } as PuzzleLevelObstacle,
      {
        id: 'fire2',
        type: 'fire',
        x: 4,
        y: 3,
      } as PuzzleLevelObstacle,
    ],
    initialResources: { food: 6, water: 4, tool: 4, medical: 3, explosive: 1 },
    starThresholds: { threeStar: 170, twoStar: 120 },
  },

  // 레벨 7: 불 확산
  {
    id: 7,
    name: '레벨 7: 산불',
    difficulty: 'hard',
    gridSize: { width: 7, height: 5 },
    timeLimit: 220,
    planningTime: 60,
    isPuzzle: true,
    hint: '불이 나무로 확산됩니다. 시간 안에 진압하세요',
    survivors: [
      { role: 'doctor', position: { x: 0, y: 2 } },
      { role: 'engineer', position: { x: 0, y: 3 } },
    ],
    rescuePoint: { x: 6, y: 2 },
    obstacles: [
      {
        id: 'fire1',
        type: 'fire',
        x: 2,
        y: 2,
        chainReaction: { type: 'spread_fire', range: 1 },
      } as PuzzleLevelObstacle,
      {
        id: 'tree1',
        type: 'tree',
        x: 3,
        y: 2,
      } as PuzzleLevelObstacle,
      {
        id: 'tree2',
        type: 'tree',
        x: 4,
        y: 2,
      } as PuzzleLevelObstacle,
      {
        id: 'tree3',
        type: 'tree',
        x: 5,
        y: 2,
      } as PuzzleLevelObstacle,
    ],
    initialResources: { food: 6, water: 5, tool: 3, medical: 4, explosive: 1 },
    starThresholds: { threeStar: 180, twoStar: 130 },
  },

  // 레벨 8: 복합 퍼즐
  {
    id: 8,
    name: '레벨 8: 혼돈의 길',
    difficulty: 'hard',
    gridSize: { width: 8, height: 5 },
    timeLimit: 240,
    planningTime: 60,
    isPuzzle: true,
    hint: '여러 종류의 장애물이 있습니다. 순서를 잘 생각하세요',
    survivors: [
      { role: 'engineer', position: { x: 0, y: 2 } },
      { role: 'doctor', position: { x: 0, y: 3 } },
      { role: 'child', position: { x: 1, y: 2 } },
    ],
    rescuePoint: { x: 7, y: 2 },
    obstacles: [
      {
        id: 'fog1',
        type: 'fog',
        x: 3,
        y: 2,
        isRevealed: false,
        hiddenObstacles: [
          {
            id: 'ice_hidden1',
            type: 'ice',
            x: 3,
            y: 2,
          } as PuzzleLevelObstacle,
        ],
      } as PuzzleLevelObstacle,
      {
        id: 'tree1',
        type: 'tree',
        x: 2,
        y: 2,
        blocksIds: ['rock1'],
      } as PuzzleLevelObstacle,
      {
        id: 'rock1',
        type: 'rock',
        x: 5,
        y: 2,
        blockedBy: ['tree1'],
        isLocked: true,
      } as PuzzleLevelObstacle,
      {
        id: 'fire1',
        type: 'fire',
        x: 6,
        y: 2,
      } as PuzzleLevelObstacle,
    ],
    initialResources: { food: 7, water: 5, tool: 4, medical: 4, explosive: 1 },
    starThresholds: { threeStar: 200, twoStar: 150 },
  },

  // 레벨 9: 시너지 퍼즐
  {
    id: 9,
    name: '레벨 9: 팀워크의 힘',
    difficulty: 'expert',
    gridSize: { width: 8, height: 6 },
    timeLimit: 260,
    planningTime: 60,
    isPuzzle: true,
    hint: '생존자들을 조합하여 시너지를 발견하세요',
    survivors: [
      { role: 'engineer', position: { x: 0, y: 2 } },
      { role: 'doctor', position: { x: 0, y: 3 } },
      { role: 'chef', position: { x: 1, y: 2 } },
      { role: 'child', position: { x: 1, y: 3 } },
    ],
    rescuePoint: { x: 7, y: 3 },
    obstacles: [
      {
        id: 'explosive1',
        type: 'explosive',
        x: 4,
        y: 3,
        chainReaction: { type: 'explosion', radius: 2 },
      } as PuzzleLevelObstacle,
      {
        id: 'rock1',
        type: 'rock',
        x: 5,
        y: 3,
      } as PuzzleLevelObstacle,
      {
        id: 'rock2',
        type: 'rock',
        x: 6,
        y: 3,
      } as PuzzleLevelObstacle,
    ],
    initialResources: { food: 7, water: 5, tool: 4, medical: 4, explosive: 0 },
    starThresholds: { threeStar: 220, twoStar: 160 },
  },

  // 레벨 10: 최종 도전
  {
    id: 10,
    name: '레벨 10: 탈출!',
    difficulty: 'expert',
    gridSize: { width: 9, height: 6 },
    timeLimit: 300,
    planningTime: 60,
    isPuzzle: true,
    hint: '모든 기술을 사용해서 탈출하세요!',
    survivors: [
      { role: 'engineer', position: { x: 0, y: 2 } },
      { role: 'doctor', position: { x: 0, y: 3 } },
      { role: 'chef', position: { x: 0, y: 4 } },
      { role: 'child', position: { x: 1, y: 3 } },
    ],
    rescuePoint: { x: 8, y: 3 },
    obstacles: [
      {
        id: 'fog1',
        type: 'fog',
        x: 3,
        y: 3,
        isRevealed: false,
        hiddenObstacles: [
          {
            id: 'dam_hidden',
            type: 'water_dam',
            x: 3,
            y: 3,
            chainReaction: { type: 'flood', range: 2 },
          } as PuzzleLevelObstacle,
        ],
      } as PuzzleLevelObstacle,
      {
        id: 'fire1',
        type: 'fire',
        x: 4,
        y: 2,
      } as PuzzleLevelObstacle,
      {
        id: 'fire2',
        type: 'fire',
        x: 4,
        y: 4,
      } as PuzzleLevelObstacle,
      {
        id: 'tree1',
        type: 'tree',
        x: 5,
        y: 3,
        blocksIds: ['explosive1'],
      } as PuzzleLevelObstacle,
      {
        id: 'explosive1',
        type: 'explosive',
        x: 6,
        y: 3,
        blockedBy: ['tree1'],
        isLocked: true,
        chainReaction: { type: 'explosion', radius: 1 },
      } as PuzzleLevelObstacle,
      {
        id: 'rock1',
        type: 'rock',
        x: 7,
        y: 3,
      } as PuzzleLevelObstacle,
    ],
    initialResources: { food: 8, water: 6, tool: 5, medical: 5, explosive: 1 },
    starThresholds: { threeStar: 250, twoStar: 180 },
  },
];

// 기존 레벨 데이터에 퍼즐 레벨 추가
export const getAllPuzzleLevels = (): LevelConfig[] => {
  return [...PUZZLE_TUTORIAL_LEVELS, ...PUZZLE_MAIN_LEVELS];
};

export const getPuzzleLevelById = (id: number): LevelConfig | null => {
  const allLevels = getAllPuzzleLevels();
  return allLevels.find(level => level.id === id) || null;
};
