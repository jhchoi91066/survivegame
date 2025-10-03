# 브레인 게임 컬렉션 - React Native 개발 로드맵

이 문서는 미니게임 컬렉션 앱의 개발 체크리스트입니다. 개발 진행 상황을 추적하는 데 사용됩니다.

---

## 🎮 게임 컨셉

**목표**: 단순하면서도 중독성 있는 브레인 게임 컬렉션
**구성**: 2-3개의 캐주얼 미니게임을 하나의 앱에 통합

### 포함될 게임
1. **🎴 Flip & Match** - 타일 뒤집기 메모리 게임
2. **🔢 Sequence** - 순서대로 터치하기
3. **➕ Math Rush** - 빠른 계산 게임
4. **🔗 Connect Flow** - 라인 연결 퍼즐

---

## Phase 0: 기존 프로젝트 정리 (1일)

### 1. 프로젝트 구조 재설계
- [ ] 불필요한 파일 정리 (기존 퍼즐 게임 관련 파일)
- [ ] 새로운 폴더 구조 생성:
  ```
  src/
  ├── screens/
  │   ├── MenuScreen.tsx           (게임 선택 허브)
  │   ├── FlipMatchGame.tsx        (게임 1)
  │   ├── SequenceGame.tsx         (게임 2)
  │   ├── MathRushGame.tsx         (게임 3)
  │   ├── ConnectFlowGame.tsx      (게임 4)
  │   ├── StatsScreen.tsx          (통합 통계)
  │   └── AchievementsScreen.tsx   (업적 - 재사용)
  ├── game/
  │   ├── shared/
  │   │   ├── store.ts             (공유 상태)
  │   │   └── types.ts             (공통 인터페이스)
  │   ├── flipmatch/               (게임 1 로직)
  │   ├── sequence/                (게임 2 로직)
  │   ├── mathrush/                (게임 3 로직)
  │   └── connectflow/             (게임 4 로직)
  ├── components/
  │   └── shared/
  │       ├── GameTimer.tsx        (재사용)
  │       ├── ScorePanel.tsx       (점수 표시)
  │       └── GameOverModal.tsx    (재사용)
  └── utils/
      ├── haptics.ts               (재사용)
      ├── achievementManager.ts    (확장)
      └── statsManager.ts          (신규)
  ```

### 2. 재사용 가능한 시스템 정리
- [ ] 유지할 파일 확인:
  - [ ] `src/utils/haptics.ts` - 햅틱 피드백
  - [ ] `src/utils/achievementManager.ts` - 업적 시스템
  - [ ] `src/components/GameTimer.tsx` - 타이머 컴포넌트
  - [ ] `src/components/GameOverModal.tsx` - 게임오버 모달
  - [ ] `src/components/Toast.tsx` - 토스트 알림
  - [ ] `src/components/AchievementUnlockedModal.tsx` - 업적 모달
  - [ ] `src/screens/AchievementsScreen.tsx` - 업적 화면
- [ ] 삭제할 파일:
  - [ ] 퍼즐 게임 관련 모든 파일 (puzzleLevels.ts, obstacles.ts, synergies.ts 등)
  - [ ] Survivor, Tile, ObstacleRemovalModal 등

---

## Phase 1: 공통 시스템 구축 (2일)

### 1. 통합 상태 관리 시스템
- [ ] `src/game/shared/store.ts` 생성
  - [ ] 게임별 최고 기록 관리
  - [ ] 통합 통계 (총 플레이 횟수, 플레이 시간)
  - [ ] 현재 활성 게임 상태
- [ ] `src/game/shared/types.ts` 공통 인터페이스 정의
  - [ ] GameType: 'flip_match' | 'sequence' | 'math_rush' | 'connect_flow'
  - [ ] GameStats, GameRecord 인터페이스

### 2. 통합 통계 매니저
- [ ] `src/utils/statsManager.ts` 생성
  - [ ] AsyncStorage를 통한 게임별 기록 저장/로드
  - [ ] 통합 통계 계산 (총 플레이 시간, 게임별 최고 기록)
  - [ ] 게임별 플레이 카운트

### 3. 업적 시스템 확장
- [ ] `src/data/achievements.ts` 업데이트
  - [ ] 크로스 게임 업적 추가:
    - [ ] "게임 마스터" - 모든 게임 1회 이상 플레이
    - [ ] "스피드런" - 어떤 게임이든 10초 안에 클리어
    - [ ] "완벽주의자" - 3개 게임에서 최고 점수 달성
    - [ ] "연속 플레이" - 10판 연속 플레이
  - [ ] 게임별 업적 (게임 구현 시 추가)

### 4. 메인 메뉴 화면 구현
- [ ] `src/screens/MenuScreen.tsx` 재설계
  - [ ] 게임 선택 카드 UI (4개)
  - [ ] 각 게임별 최고 기록 표시
  - [ ] 통계 화면 버튼
  - [ ] 업적 화면 버튼 (기존 재사용)
  - [ ] 설정 버튼
  - [ ] 햅틱 피드백 연동

### 5. 통합 통계 화면
- [ ] `src/screens/StatsScreen.tsx` 생성
  - [ ] 전체 플레이 시간
  - [ ] 게임별 플레이 횟수
  - [ ] 게임별 최고 기록
  - [ ] 총 업적 달성률

---

## Phase 2: 게임 1 - Flip & Match 구현 (3일)

### 1. 게임 로직 구현
- [ ] `src/game/flipmatch/types.ts` 정의
  - [ ] Card 인터페이스 (id, value, isFlipped, isMatched)
  - [ ] GameState 인터페이스
- [ ] `src/game/flipmatch/store.ts` 생성
  - [ ] 카드 배열 생성 및 셔플
  - [ ] 카드 뒤집기 로직
  - [ ] 매칭 검사 로직
  - [ ] 타이머 및 점수 계산

### 2. UI 컴포넌트 구현
- [ ] `src/components/flipmatch/Card.tsx` 생성
  - [ ] 카드 뒤집기 애니메이션 (Reanimated)
  - [ ] 매칭 성공 시 애니메이션
- [ ] `src/components/flipmatch/GameBoard.tsx` 생성
  - [ ] 그리드 레이아웃 (4x4, 6x6 등 난이도별)
  - [ ] 카드 배치

### 3. 게임 화면 구현
- [ ] `src/screens/FlipMatchGame.tsx` 생성
  - [ ] 난이도 선택 (Easy: 4x4, Medium: 6x6, Hard: 8x8)
  - [ ] 게임 타이머 통합
  - [ ] 이동 횟수 표시
  - [ ] 게임오버 처리 (승리/포기)
  - [ ] 최고 기록 저장

### 4. 업적 추가
- [ ] Flip & Match 전용 업적:
  - [ ] "포토그래픽 메모리" - 6x6 그리드 완성
  - [ ] "완벽한 기억력" - 최소 이동으로 클리어
  - [ ] "스피드 마스터" - 30초 안에 클리어

---

## Phase 3: 게임 2 - Sequence 구현 (3일)

### 1. 게임 로직 구현
- [ ] `src/game/sequence/types.ts` 정의
  - [ ] 숫자 시퀀스 생성 알고리즘
  - [ ] 난이도별 시퀀스 길이 설정
- [ ] `src/game/sequence/store.ts` 생성
  - [ ] 랜덤 시퀀스 생성 (1 → 2 → 3...)
  - [ ] 사용자 입력 검증
  - [ ] 레벨 증가 로직
  - [ ] 실수 카운트

### 2. UI 컴포넌트 구현
- [ ] `src/components/sequence/NumberTile.tsx` 생성
  - [ ] 번호 타일 (클릭 가능)
  - [ ] 정답 시 애니메이션 (초록색 플래시)
  - [ ] 오답 시 shake 애니메이션 (빨간색)
- [ ] `src/components/sequence/GameGrid.tsx` 생성
  - [ ] 랜덤 배치 그리드 (5x5)

### 3. 게임 화면 구현
- [ ] `src/screens/SequenceGame.tsx` 생성
  - [ ] 현재 레벨 표시
  - [ ] 남은 숫자 개수 표시
  - [ ] 실수 카운트 (3회 실수 시 게임오버)
  - [ ] 최고 레벨 기록 저장

### 4. 업적 추가
- [ ] Sequence 전용 업적:
  - [ ] "순서의 달인" - 레벨 20 도달
  - [ ] "완벽한 집중력" - 실수 없이 레벨 10 클리어
  - [ ] "번개같은 손놀림" - 5초 안에 15개 숫자 터치

---

## Phase 4: 게임 3 - Math Rush 구현 (3일)

### 1. 게임 로직 구현
- [ ] `src/game/mathrush/types.ts` 정의
  - [ ] 문제 타입 (덧셈, 뺄셈, 곱셈)
  - [ ] 난이도별 숫자 범위
- [ ] `src/game/mathrush/store.ts` 생성
  - [ ] 랜덤 문제 생성 (난이도별)
  - [ ] 정답 검증
  - [ ] 연속 정답 콤보 시스템
  - [ ] 제한 시간 관리 (60초)

### 2. UI 컴포넌트 구현
- [ ] `src/components/mathrush/QuestionDisplay.tsx` 생성
  - [ ] 수식 표시 (큰 폰트)
  - [ ] 정답 입력 필드
- [ ] `src/components/mathrush/AnswerButtons.tsx` 생성
  - [ ] 4지선다 버튼 (정답 1개 + 오답 3개)
  - [ ] 정답 시 초록색 애니메이션
  - [ ] 오답 시 빨간색 shake

### 3. 게임 화면 구현
- [ ] `src/screens/MathRushGame.tsx` 생성
  - [ ] 60초 타이머 (시간 경과에 따라 색상 변화)
  - [ ] 현재 점수 표시
  - [ ] 콤보 카운터 (연속 정답 시 점수 배수 증가)
  - [ ] 최고 점수 저장

### 4. 업적 추가
- [ ] Math Rush 전용 업적:
  - [ ] "계산왕" - 100개 정답
  - [ ] "콤보 마스터" - 10 콤보 달성
  - [ ] "천재 수학자" - 50점 이상 기록

---

## Phase 5: 게임 4 - Connect Flow 구현 (3-4일)

### 1. 게임 로직 구현
- [ ] `src/game/connectflow/types.ts` 정의
  - [ ] 노드 쌍 (같은 색/숫자)
  - [ ] 경로 데이터 구조
  - [ ] 레벨 데이터 구조
- [ ] `src/game/connectflow/store.ts` 생성
  - [ ] 드래그 경로 추적
  - [ ] 경로 충돌 검사
  - [ ] 모든 노드 연결 완료 검증
  - [ ] 이동 횟수 계산

### 2. UI 컴포넌트 구현
- [ ] `src/components/connectflow/GridNode.tsx` 생성
  - [ ] 노드 표시 (색상/숫자)
  - [ ] 드래그 시작/종료 처리
- [ ] `src/components/connectflow/PathRenderer.tsx` 생성
  - [ ] SVG 기반 라인 렌더링
  - [ ] 연결된 경로 표시
- [ ] `src/components/connectflow/GameBoard.tsx` 생성
  - [ ] 5x5 그리드
  - [ ] 터치 제스처 처리 (PanGestureHandler)

### 3. 게임 화면 구현
- [ ] `src/screens/ConnectFlowGame.tsx` 생성
  - [ ] 레벨 선택 (10개 레벨)
  - [ ] 현재 이동 횟수 표시
  - [ ] 되돌리기 버튼
  - [ ] 힌트 버튼 (광고 시청 후)
  - [ ] 최소 이동 기록 저장

### 4. 레벨 데이터 생성
- [ ] `src/data/connectFlowLevels.ts` 생성
  - [ ] 10개 레벨 데이터 (난이도 증가)
  - [ ] 각 레벨의 최소 이동 수 설정

### 5. 업적 추가
- [ ] Connect Flow 전용 업적:
  - [ ] "최소 동선" - 최소 이동으로 퍼즐 완성
  - [ ] "마스터 플래너" - 10개 레벨 모두 클리어
  - [ ] "한 붓 그리기" - 되돌리기 없이 클리어

---

## Phase 6: 통합 & 폴리싱 (2일)

### 1. 네비게이션 통합
- [ ] `App.tsx` 업데이트
  - [ ] 모든 게임 화면 라우트 추가
  - [ ] 통계 화면 라우트
  - [ ] 화면 전환 애니메이션

### 2. 햅틱 피드백 통합
- [ ] 모든 게임에 햅틱 추가:
  - [ ] 정답 시 성공 패턴
  - [ ] 오답 시 에러 패턴
  - [ ] 게임 완료 시 승리 패턴
  - [ ] 버튼 클릭 시 경량 패턴

### 3. 사운드 시스템 (선택적)
- [ ] 사운드 에셋 추가
  - [ ] BGM (메뉴, 게임 중)
  - [ ] SFX (클릭, 정답, 오답, 승리, 패배)
- [ ] soundManager 연동
  - [ ] 설정 화면에서 음소거 토글

### 4. 최종 UI/UX 개선
- [ ] 로딩 화면 추가
- [ ] 앱 아이콘 디자인
- [ ] 스플래시 스크린 디자인
- [ ] 색상 테마 통일
- [ ] 폰트 적용

---

## Phase 7: 테스트 & 출시 준비 (2일)

### 1. QA & 버그 수정
- [ ] 모든 게임 플레이테스트
- [ ] 업적 시스템 동작 검증
- [ ] 통계 저장/로드 검증
- [ ] 크래시 없는지 확인

### 2. 성능 최적화
- [ ] React.memo 적용
- [ ] 불필요한 리렌더링 방지
- [ ] 애니메이션 최적화

### 3. 출시 준비
- [ ] 앱 스토어 스크린샷 준비
- [ ] 앱 설명 작성
- [ ] 개인정보 처리방침 작성
- [ ] EAS Build 설정
- [ ] 테스트 빌드 배포

---

## 📊 개발 진행 상황

### ✅ 완료
- React Native + Expo 초기 설정
- TypeScript 개발 환경
- Zustand 상태 관리
- React Native Reanimated
- 햅틱 피드백 시스템
- 업적 시스템 (기존)
- 타이머 컴포넌트 (기존)
- 토스트 알림 (기존)

### 🚧 현재 작업
- 없음 (새로운 로드맵 시작 대기 중)

### 🎯 다음 우선순위
1. Phase 0: 프로젝트 정리
2. Phase 1: 공통 시스템 구축
3. Phase 2: 첫 번째 게임 (Flip & Match) 구현

---

## 🎮 최종 앱 구조

```
🎮 Brain Games

메인 메뉴:
├── 🎴 Flip & Match    (Best: 12 sec)
├── 🔢 Sequence        (Best: Level 15)
├── ➕ Math Rush       (Best: 45 pts)
├── 🔗 Connect Flow    (Best: 8 moves)
├── 📊 통계
├── 🏆 업적
└── ⚙️ 설정
```

---

## 📅 예상 일정

- **Phase 0-1**: 3일 (프로젝트 정리 + 공통 시스템)
- **Phase 2**: 3일 (Flip & Match)
- **Phase 3**: 3일 (Sequence)
- **Phase 4**: 3일 (Math Rush)
- **Phase 5**: 4일 (Connect Flow)
- **Phase 6**: 2일 (통합 & 폴리싱)
- **Phase 7**: 2일 (테스트 & 출시)

**총 예상 기간**: 약 20일 (3주)
