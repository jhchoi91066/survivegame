# 무인도 긴급 구조 작전 - React Native 개발 로드맵

이 문서는 'React Native 개발 계획서'를 기반으로 한 개발 체크리스트입니다. 개발 진행 상황을 추적하는 데 사용됩니다.
github test

---

## Phase 0: 사전 준비 (2주)

- [x] React Native + Expo 프로젝트 초기화
- [x] TypeScript, ESLint, Prettier 등 코딩 환경 설정
- [x] Git 브랜치 전략 수립 (`main`, `develop`, `feature/*`)
- [x] 프로젝트 구조 설계 (`src/features`, `src/components`, `src/utils` 등)
- [x] 상태 관리 아키텍처 설계 (Zustand)
- [x] 네비게이션 구조 설계 (React Navigation)

---

## Phase 1: 핵심 개발 (8주)

### 1. 핵심 게임 루프 (Week 3-4)
- [x] 5x5 그리드 시스템 UI 구현 (View 기반)
- [x] 생존자 이동 로직 (Pressable 기반)
- [x] 턴 시스템 로직 구현
- [x] React Native Reanimated 버전 이슈 해결 및 설정 완료
- [x] 기본 이동 애니메이션 구현
- [x] 생존자 선택 애니메이션 (스케일, 테두리 효과)
- [x] 이동 가능한 타일 하이라이트 기능
- [x] 이동 제한 로직 (인접 타일만 이동 가능)

### 2. 상태 & 자원 시스템 (Week 5-6)
- [x] 생존자 상태(체력, 에너지 등) 관리 Store 구현 (Zustand)
- [x] 자원 인벤토리 시스템 구현 (음식, 물, 도구, 의료용품)
- [x] 생존자별 능력 시스템 구현:
  - [x] 엔지니어: 다리 건설, 장비 수리
  - [x] 의사: 체력 회복, 상태이상 치료
  - [x] 요리사: 음식 효율 증가, 체력 보너스
  - [x] 아이: 좁은 공간 이동, 숨기 능력
- [x] 생존자 상태 및 자원 UI 컴포넌트 제작
- [x] 상태 변경에 따른 UI 애니메이션 연동
- [x] 자원 소모 및 획득 로직 구현

### 3. 장애물 & 특수 능력 (Week 7-8)
- [x] 장애물 시스템 구현:
  - [x] 바위: 이동 불가, 엔지니어만 파괴 가능
  - [x] 늪지: 이동 시 에너지 2배 소모, 엔지니어가 복구 가능
  - [x] 깊은 물: 일반적으로 이동 불가, 다리 건설 후 통과 가능
- [x] 지형 타입별 렌더링 및 상호작용 로직
- [x] 특수 능력 구현:
  - [x] 엔지니어: 다리 건설 (3턴 소요), 장애물 제거
  - [x] 의사: 인접 생존자 체력 회복, 독/질병 치료
  - [x] 요리사: 음식 아이템 제작, 팀 전체 에너지 회복
  - [x] 아이: 어른이 갈 수 없는 좁은 통로 이동
- [x] 능력 사용 UI 및 애니메이션 구현

### 4. 타이머 & 이벤트 (Week 9-10)
- [x] 120초 게임 타이머 구현:
  - [x] 카운트다운 타이머 UI (색상 변화 포함)
  - [x] 시간 경과에 따른 긴급도 표시
  - [x] 타이머 일시정지/재개 기능
- [x] 날씨 이벤트 시스템 구현:
  - [x] 폭풍: 이동 제한 (2턴간 이동 불가)
  - [x] 비: 늪지 확산, 시야 제한
  - [x] 맑음: 에너지 회복 보너스
  - [x] 이벤트 예고 시스템 (2턴 전 경고)
- [x] 승리/패배 조건 로직:
  - [x] 승리: 모든 생존자가 구조 지점 도달
  - [x] 패배: 시간 초과 또는 생존자 체력 0
  - [x] 별점 시스템 (시간, 자원 효율, 생존자 상태)
- [x] 결과 화면 UI 및 통계 표시

---

## Phase 2: 폴리싱 & 콘텐츠 (4주)

### 1. UI/UX 완성 (Week 11-12)
- [x] 메인 메뉴, 레벨 선택, 설정 등 전체 화면 UI 구현
- [x] 화면 전환 애니메이션 적용 (`react-navigation` + `reanimated`)
- [x] 튜토리얼 및 온보딩 플로우 구현

### 2. 사운드 & 레벨 확장 (Week 13-14)
- [x] BGM/SFX 재생 시스템 구현 (`expo-av`)
- [x] 레벨 데이터 관리 시스템 구현 (JSON 기반)
- [x] 별 평가 시스템 및 진행도 저장/불러오기 (`AsyncStorage`)
- [x] 50개 레벨 데이터 생성 및 적용

---

## Phase 2.5: 완성도 향상 (1-2주)

### 1. 즉시 해결 (Priority 1 - 출시 필수)
- [ ] 사운드 에셋 추가 및 연동
  - [ ] assets/sounds/ 폴더 생성
  - [ ] 무료 사운드 파일 수집 (bgm, move, select, victory, defeat, ability, click)
  - [ ] soundManager.ts의 soundPaths 업데이트
  - [ ] 실제 사운드 파일 require() 경로 설정
- [ ] 설정 화면과 soundManager 연동
  - [ ] SettingsScreen에서 soundManager.updateSettings() 호출
  - [ ] 사운드/음악 토글 시 즉시 반영
- [ ] 게임 내 효과음 트리거 구현
  - [ ] GameScreen에서 BGM 재생/정지
  - [ ] 이동 시 move 효과음
  - [ ] 능력 사용 시 ability 효과음
  - [ ] 승리/패배 시 음악 재생
  - [ ] 버튼 클릭 시 click 효과음
- [ ] 에러 처리 강화
  - [ ] 레벨 로드 실패 시 에러 UI 표시
  - [ ] AsyncStorage 실패 시 사용자 알림
  - [ ] 잘못된 레벨 ID 처리
  - [ ] ErrorBoundary 컴포넌트 추가

### 2. 플레이 경험 개선 (Priority 2)
- [ ] 레벨 밸런싱
  - [ ] 레벨 1-10 플레이테스트
  - [ ] 타임 리밋 조정 (너무 쉽거나 어려운 레벨 수정)
  - [ ] 별점 임계값 조정 (threeStar, twoStar)
  - [ ] 장애물 배치 개선 (막다른 길 제거)
  - [ ] 난이도 곡선 검증 (레벨 진행에 따라 자연스럽게 증가)
- [x] 시각적 개선
  - [x] 장애물 아이콘 추가 (🪨 바위, 🌊 물, 🚪 통로 등)
  - [x] 날씨 아이콘 추가 (☀️ 맑음, 🌧️ 비, ⛈️ 폭풍)
  - [x] 생존자 역할별 아이콘 (👷 엔지니어, 👨‍⚕️ 의사, 👨‍🍳 요리사, 👶 아이)
  - [x] 구조 지점 시각화 개선 (🚁 헬리콥터 등)
- [x] UI/UX 개선
  - [x] GameOverModal에 "다음 레벨" 버튼 추가
  - [x] 레벨 선택 화면에 레벨 이름 표시
  - [x] 능력 사용 가능 여부 시각적 표시 (비활성화 상태)
  - [x] 이동 불가능한 타일 표시 (빨간색 오버레이)
  - [x] 로딩 인디케이터 추가 (회전 스피너 애니메이션)

### 3. 폴리싱 (Priority 3 - 선택적)
- [x] 애니메이션 강화
  - [x] 승리 시 축하 애니메이션 (모달 스케일 + 별 회전 효과)
  - [x] 데미지 입을 때 shake 애니메이션 (Survivor damageTrigger)
  - [x] 능력 사용 시 이펙트 애니메이션 (AbilityButton glow + scale)
  - [x] 날씨 변화 transition 애니메이션 (fade in/out + scale + emoji rotation)
  - [x] 턴 종료 시 fade 효과 (GameScreen opacity transition)
- [x] 통계 시스템
  - [x] 통계 화면 추가 (총 별 수, 클리어율, 총 플레이 횟수)
  - [x] 레벨별 최고 기록 표시 (Top 5 레벨)
  - [ ] 업적 시스템 기초 구현
- [ ] 튜토리얼 개선
  - [ ] 인터랙티브 튜토리얼 (실제 게임에서 가이드)
  - [ ] 각 단계마다 손가락 포인터 표시
  - [ ] 튜토리얼 중 특정 액션 강제 (다음으로 넘어가기 전)
- [x] 성능 최적화
  - [x] React.memo로 컴포넌트 최적화 (Tile, Survivor, SurvivorStatusBar, AbilityPanel, WeatherDisplay)
  - [x] useMemo/useCallback으로 불필요한 재계산 방지
  - [ ] 이미지 최적화 (WebP 포맷)
  - [ ] 번들 사이즈 분석
- [ ] 기타 개선사항
  - [ ] 다국어 지원 준비 (i18n 구조 설계)
  - [ ] 접근성 개선 (스크린 리더 지원)
  - [ ] 햅틱 피드백 추가 (진동)

### 📊 완성도 체크리스트

#### 출시 가능 최소 요구사항 (MVP)
- [ ] 사운드 에셋 추가 (시스템은 완료, 오디오 파일 필요)
- [ ] 레벨 1-10 밸런싱 완료 (플레이테스트 필요)
- [x] 에러 처리 추가 (ErrorBoundary, 로딩/에러 상태)
- [x] 기본 시각적 피드백 (아이콘, 애니메이션)

#### 권장 완성도 (Recommended)
- [ ] 레벨 1-25 밸런싱 완료
- [x] 통계 시스템 구현
- [x] 애니메이션 강화
- [x] 성능 최적화

#### 완벽한 출시 (Polished)
- [ ] 전체 50개 레벨 밸런싱
- [ ] 업적 시스템
- [ ] 다국어 지원
- [ ] 접근성 완벽 지원

---

## 📍 현재 개발 상황 (2025년 1월 기준)

### ✅ 완료된 사항
- React Native + Expo 프로젝트 초기 설정
- TypeScript, ESLint, Prettier 개발 환경 구축
- 기본 프로젝트 구조 설계 완료
- Zustand 상태 관리 아키텍처 구현
- 5x5 그리드 시스템 기본 구현
- 생존자 이동 로직 (Pressable 기반)
- 턴 시스템 기본 구현
- 생존자 선택/이동 UI 기본 완성

### 🚧 진행 중
- React Native Reanimated 버전 호환성 이슈 해결

### 🎯 다음 우선순위 태스크
1. **React Native Reanimated 설정 완료** (Week 3)
2. **기본 애니메이션 구현** (Week 3-4)
3. **이동 제한 로직 추가** (Week 4)
4. **생존자 상태 시스템 구현** (Week 5)

---

## 🔧 기술적 구현 세부사항

### 데이터 구조

#### 게임 상태 (Zustand Store)
```typescript
interface GameState {
  // 기존 구현된 부분
  survivors: SurvivorState[];
  selectedSurvivorId: string | null;
  turn: number;
  movedSurvivorIds: string[];

  // 추가 구현 필요
  timer: number; // 120초 카운트다운
  gameStatus: 'playing' | 'paused' | 'victory' | 'defeat';
  resources: ResourceInventory;
  weather: WeatherEvent | null;
  obstacles: ObstacleState[];
}
```

#### 레벨 데이터 구조
```typescript
interface LevelData {
  id: number;
  name: string;
  grid: TileType[][]; // 5x5 격자의 지형 정보
  survivorStartPositions: Position[];
  rescuePoint: Position;
  obstacles: ObstacleConfig[];
  weatherEvents: WeatherEventConfig[];
  targetTime: number; // 목표 클리어 시간
  starConditions: StarCondition[];
}
```

### 애니메이션 시스템
- **이동 애니메이션**: Spring 기반 부드러운 이동
- **선택 효과**: Scale + 테두리 애니메이션
- **상태 변화**: Opacity + Color transition
- **UI 피드백**: 버튼 press, 성공/실패 효과

### 성능 최적화 방안
- React.memo를 통한 불필요한 리렌더링 방지
- Zustand 선택적 구독으로 상태 업데이트 최적화
- 애니메이션은 UI 쓰레드에서 실행 (Reanimated)
- 이미지 에셋 WebP 포맷 사용

---

## Phase 3: 최적화 & 출시 준비 (4주)

### 1. 성능 최적화 (Week 15)
- [ ] 렌더링 최적화 (`React.memo`, `useMemo`)
- [ ] 이미지 최적화 (WebP 포맷, 사이즈 최적화)
- [ ] 번들 사이즈 분석 및 최적화
- [ ] 저사양 기기에서 60 FPS 목표 성능 테스트

### 2. 버그 수정 & QA (Week 16)
- [ ] 기능 테스트 케이스 기반 전체 기능 검수
- [ ] 주요 타겟 디바이스(iOS/Android) 테스트
- [ ] 크리티컬 버그 제로 목표

### 3. 수익화 & 분석 (Week 17)
- [ ] 리워드 광고 모듈 통합 (`react-native-google-mobile-ads`)
- [ ] 데이터 분석 툴 통합 (`@react-native-firebase/analytics`)
- [ ] 크래시 리포팅 툴 통합 (`@react-native-firebase/crashlytics`)

### 4. 출시 (Week 18)
- [ ] 앱 아이콘, 스플래시 스크린 등 최종 에셋 적용
- [ ] 스토어 리스팅 정보 준비 (스크린샷, 설명)
- [ ] Expo EAS를 통한 앱스토어/플레이스토어 빌드 및 제출
