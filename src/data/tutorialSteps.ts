export interface TutorialStep {
  title: string;
  description: string;
  highlightArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: '무인도 긴급 구조 작전에 오신 것을 환영합니다!',
    description:
      '무인도에 고립된 생존자들을 구조 지점까지 안전하게 이동시켜야 합니다. 120초 안에 모든 생존자를 구출하세요!',
  },
  {
    title: '생존자 선택하기',
    description:
      '화면의 생존자를 탭하면 선택됩니다. 선택된 생존자는 노란색 테두리로 표시되며, 이동 가능한 타일이 초록색으로 하이라이트됩니다.',
  },
  {
    title: '생존자 이동하기',
    description:
      '생존자는 인접한 타일로만 이동할 수 있습니다. 이동할 때마다 에너지가 소모되니 신중하게 움직이세요. 에너지가 부족하면 이동할 수 없습니다!',
  },
  {
    title: '생존자의 역할',
    description:
      '각 생존자는 고유한 역할을 가지고 있습니다.\n\n🔧 엔지니어: 장애물 제거, 다리 건설\n⚕️ 의사: 체력 회복, 상태이상 치료\n👨‍🍳 요리사: 음식 제작, 에너지 회복\n👶 아이: 좁은 통로 통과 가능',
  },
  {
    title: '장애물 주의',
    description:
      '지형에는 다양한 장애물이 있습니다.\n\n🪨 바위: 이동 불가, 엔지니어만 제거 가능\n🟫 늪지: 에너지 2배 소모\n🌊 깊은 물: 다리 건설 후 통과 가능',
  },
  {
    title: '날씨 이벤트',
    description:
      '게임 중 날씨가 변합니다.\n\n☀️ 맑음: 에너지 회복 보너스\n🌧️ 비: 늪지 확산\n⛈️ 폭풍: 이동 제한 (2턴간)',
  },
  {
    title: '턴 시스템',
    description:
      '각 생존자는 턴당 한 번만 이동할 수 있습니다. 모든 생존자를 이동시켰다면 "턴 종료" 버튼을 눌러 다음 턴으로 진행하세요.',
  },
  {
    title: '승리 조건',
    description:
      '120초 안에 모든 생존자를 구조 지점(오른쪽 하단)으로 이동시키면 승리합니다! 시간, 체력, 에너지 상태에 따라 별점이 매겨집니다.',
  },
];