# 브레인 게임 컬렉션 - React Native 개발 로드맵

이 문서는 미니게임 컬렉션 앱의 개발 체크리스트입니다. 개발 진행 상황을 추적하는 데 사용됩니다.

---

## 🎮 게임 컨셉

**목표**: 단순하면서도 중독성 있는 브레인 게임 컬렉션
**구성**: 4개의 캐주얼 미니게임을 하나의 앱에 통합

### 포함된 게임
1. **🎴 Flip & Match** - 타일 뒤집기 메모리 게임 ✅
2. **🔢 Sequence** - 순서대로 터치하기 ✅
3. **➕ Math Rush** - 빠른 계산 게임 ✅
4. **🔢 Merge Puzzle** - 숫자 합치기 퍼즐 (2048 스타일) ✅

---

## Phase 0: 기존 프로젝트 정리 ✅

### 1. 프로젝트 구조 재설계
- [x] 불필요한 파일 정리 (기존 퍼즐 게임 관련 파일)
- [x] 새로운 폴더 구조 생성:
  ```
  src/
  ├── screens/
  │   ├── MenuScreen.tsx           ✅ (게임 선택 허브)
  │   ├── FlipMatchGame.tsx        ✅ (게임 1)
  │   ├── SequenceGame.tsx         ✅ (게임 2)
  │   ├── MathRushGame.tsx         ✅ (게임 3)
  │   ├── MergePuzzleGame.tsx      ✅ (게임 4)
  │   ├── StatsScreen.tsx          ✅ (통합 통계)
  │   ├── SettingsScreen.tsx       ✅ (설정)
  │   └── AchievementsScreen.tsx   ✅ (업적)
  ├── game/
  │   ├── shared/
  │   │   ├── store.ts             ✅ (공유 상태)
  │   │   └── types.ts             ✅ (공통 인터페이스)
  │   ├── flipmatch/               ✅ (게임 1 로직)
  │   ├── sequence/                ✅ (게임 2 로직)
  │   ├── mathrush/                ✅ (게임 3 로직)
  │   └── mergepuzzle/             ✅ (게임 4 로직)
  ├── components/
  │   └── shared/
  │       ├── GameTimer.tsx        ✅ (재사용)
  │       ├── Toast.tsx            ✅ (토스트)
  │       └── PlanningTimer.tsx    ✅ (계획 타이머)
  ├── contexts/
  │   └── ThemeContext.tsx         ✅ (테마 시스템)
  └── utils/
      ├── haptics.ts               ✅ (재사용)
      ├── achievementManager.ts    ✅ (확장)
      ├── statsManager.ts          ✅ (신규)
      └── theme.ts                 ✅ (테마)
  ```

### 2. 재사용 가능한 시스템 정리
- [x] 유지할 파일 확인:
  - [x] `src/utils/haptics.ts` - 햅틱 피드백
  - [x] `src/utils/achievementManager.ts` - 업적 시스템
  - [x] `src/components/shared/GameTimer.tsx` - 타이머 컴포넌트
  - [x] `src/components/shared/Toast.tsx` - 토스트 알림
  - [x] `src/screens/AchievementsScreen.tsx` - 업적 화면
- [x] 삭제할 파일:
  - [x] 퍼즐 게임 관련 모든 파일 (puzzleLevels.ts, obstacles.ts, synergies.ts 등)
  - [x] Survivor, Tile, ObstacleRemovalModal 등
  - [x] ConnectFlow 관련 파일 (Merge Puzzle로 대체)

---

## Phase 1: 공통 시스템 구축 ✅

### 1. 통합 상태 관리 시스템
- [x] `src/game/shared/store.ts` 생성
  - [x] 게임별 최고 기록 관리
  - [x] 통합 통계 (총 플레이 횟수, 플레이 시간)
  - [x] 현재 활성 게임 상태
- [x] `src/game/shared/types.ts` 공통 인터페이스 정의
  - [x] GameType: 'flip_match' | 'sequence' | 'math_rush' | 'merge_puzzle'
  - [x] GameStats, GameRecord 인터페이스

### 2. 통합 통계 매니저
- [x] `src/utils/statsManager.ts` 생성
  - [x] AsyncStorage를 통한 게임별 기록 저장/로드
  - [x] 통합 통계 계산 (총 플레이 시간, 게임별 최고 기록)
  - [x] 게임별 플레이 카운트
  - [x] 게임별 플레이 시간 추적

### 3. 업적 시스템 확장
- [x] 기존 업적 시스템 유지
  - [x] 업적 매니저 재사용
  - [x] 업적 화면 재사용

### 4. 메인 메뉴 화면 구현
- [x] `src/screens/MenuScreen.tsx` 재설계
  - [x] 게임 선택 카드 UI (2x2 그리드)
  - [x] 각 게임별 최고 기록 표시
  - [x] 통계 화면 버튼
  - [x] 업적 화면 버튼
  - [x] 설정 버튼
  - [x] 햅틱 피드백 연동
  - [x] 프리미엄 UI 디자인 (그라데이션, 글래스모피즘)
  - [x] 애니메이션 효과

### 5. 통합 통계 화면
- [x] `src/screens/StatsScreen.tsx` 생성
  - [x] 게임별 최고 기록
  - [x] 게임별 플레이 횟수
  - [x] 게임별 총 플레이 시간
  - [x] 다크/라이트 모드 지원

---

## Phase 2: 게임 1 - Flip & Match 구현 ✅

### 1. 게임 로직 구현
- [x] `src/game/flipmatch/types.ts` 정의
  - [x] Card 인터페이스 (id, value, isFlipped, isMatched)
  - [x] GameState 인터페이스
  - [x] Difficulty 타입
- [x] `src/game/flipmatch/store.ts` 생성
  - [x] 카드 배열 생성 및 셔플
  - [x] 카드 뒤집기 로직
  - [x] 매칭 검사 로직
  - [x] 타이머 및 점수 계산

### 2. UI 컴포넌트 구현
- [x] `src/components/flipmatch/Card.tsx` 생성
  - [x] 카드 뒤집기 애니메이션 (Reanimated)
  - [x] 매칭 성공 시 애니메이션
- [x] `src/components/flipmatch/GameBoard.tsx` 생성
  - [x] 그리드 레이아웃 (4x4, 4x6, 4x8 난이도별)
  - [x] 카드 배치
  - [x] 반응형 레이아웃

### 3. 게임 화면 구현
- [x] `src/screens/FlipMatchGame.tsx` 생성
  - [x] 난이도 선택 (Easy: 4x4, Medium: 4x6, Hard: 4x8)
  - [x] 게임 타이머 통합
  - [x] 이동 횟수 표시
  - [x] 게임오버 처리 (승리)
  - [x] 최고 기록 저장 (플레이 시간 포함)

---

## Phase 3: 게임 2 - Sequence 구현 ✅

### 1. 게임 로직 구현
- [x] `src/game/sequence/types.ts` 정의
  - [x] 숫자 시퀀스 생성 알고리즘
  - [x] 난이도별 시퀀스 길이 설정 (Easy, Normal, Hard)
- [x] `src/game/sequence/store.ts` 생성
  - [x] 랜덤 시퀀스 생성 (1 → 2 → 3...)
  - [x] 사용자 입력 검증
  - [x] 레벨 증가 로직
  - [x] 실수 카운트
  - [x] 레벨별 타이머 (0.01초 정밀도)
  - [x] 최고 기록 추적

### 2. UI 컴포넌트 구현
- [x] `src/components/sequence/NumberTile.tsx` 생성
  - [x] 번호 타일 (클릭 가능)
  - [x] 정답 시 애니메이션 (초록색 플래시)
  - [x] 오답 시 shake 애니메이션 (빨간색)

### 3. 게임 화면 구현
- [x] `src/screens/SequenceGame.tsx` 생성
  - [x] 난이도 선택 모달
  - [x] 현재 레벨 표시
  - [x] 레벨별 타이머 (소수점 2자리)
  - [x] 최고 기록 표시
  - [x] 실수 카운트 (3회 실수 시 게임오버)
  - [x] 최고 레벨 기록 저장 (플레이 시간 포함)

---

## Phase 4: 게임 3 - Math Rush 구현 ✅

### 1. 게임 로직 구현
- [x] `src/game/mathrush/types.ts` 정의
  - [x] 문제 타입 (덧셈, 뺄셈, 곱셈, 나눗셈)
  - [x] 난이도별 숫자 범위
- [x] `src/game/mathrush/store.ts` 생성
  - [x] 랜덤 문제 생성
  - [x] 정답 검증
  - [x] 연속 정답 콤보 시스템
  - [x] 제한 시간 관리 (30초)
  - [x] 오답 시 즉시 게임 종료

### 2. UI 컴포넌트 구현
- [x] 문제 표시 컴포넌트
  - [x] 수식 표시
  - [x] 답안 선택 버튼 (4지선다)
  - [x] 정답/오답 애니메이션

### 3. 게임 화면 구현
- [x] `src/screens/MathRushGame.tsx` 생성
  - [x] 30초 타이머
  - [x] 현재 점수 표시 (1점씩)
  - [x] 콤보 카운터
  - [x] 오답 시 즉시 종료
  - [x] 최고 점수 저장 (플레이 시간 포함)

---

## Phase 5: 게임 4 - Merge Puzzle 구현 ✅

### 1. 게임 로직 구현
- [x] `src/game/mergepuzzle/types.ts` 정의
  - [x] Tile 인터페이스
  - [x] 3x3 그리드 구조
  - [x] 목표 숫자 64, 최대 이동 20회
- [x] `src/game/mergepuzzle/store.ts` 생성
  - [x] 타일 선택 및 합치기 로직
  - [x] 같은 숫자 합치기 (2배로 증가)
  - [x] 랜덤 타일 생성
  - [x] 승리/패배 조건 검사

### 2. UI 컴포넌트 구현
- [x] `src/components/mergepuzzle/NumberTile.tsx` 생성
  - [x] 숫자 타일 (2048 스타일 색상)
  - [x] 선택 애니메이션
  - [x] 합치기 애니메이션

### 3. 게임 화면 구현
- [x] `src/screens/MergePuzzleGame.tsx` 생성
  - [x] 3x3 그리드
  - [x] 이동 횟수 표시
  - [x] 목표 숫자 표시
  - [x] 승리/패배 모달
  - [x] 최고 기록 저장 (플레이 시간 포함)

---

## Phase 6: UI/UX 고도화 ✅

### 1. 프리미엄 디자인 시스템
- [x] 그라데이션 배경 적용
- [x] 글래스모피즘 효과
- [x] 게임별 고유 색상 테마:
  - [x] Flip & Match: 인디고-퍼플
  - [x] Sequence: 시안-블루
  - [x] Math Rush: 앰버-레드
  - [x] Merge Puzzle: 그린-시안
- [x] 섀도우 및 깊이감
- [x] 애니메이션 효과 (순차 등장)

### 2. 다크/라이트 모드
- [x] `src/contexts/ThemeContext.tsx` 생성
  - [x] 테마 Provider
  - [x] 다크/라이트 모드 정의
  - [x] AsyncStorage 저장
- [x] SettingsScreen에 테마 토글 추가
- [x] MenuScreen에 테마 적용
- [x] StatsScreen에 테마 적용

### 3. 반응형 디자인
- [x] Dimensions API 사용
- [x] 화면 크기별 레이아웃 조정
- [x] 작은 화면 대응

---

## Phase 7: 통합 & 폴리싱 ✅

### 1. 네비게이션 통합
- [x] `App.tsx` 업데이트
  - [x] ThemeProvider 통합
  - [x] 모든 게임 화면 라우트 추가
  - [x] 통계 화면 라우트
  - [x] 설정 화면 라우트

### 2. 햅틱 피드백 통합
- [x] 모든 게임에 햅틱 추가:
  - [x] 정답 시 성공 패턴
  - [x] 오답 시 에러 패턴
  - [x] 게임 완료 시 승리 패턴
  - [x] 버튼 클릭 시 경량 패턴

### 3. 통계 시스템
- [x] 게임별 플레이 횟수 추적
- [x] 게임별 플레이 시간 추적
- [x] 최고 기록 저장
- [x] StatsScreen에서 모든 통계 표시

---

## Phase 8: 출시 준비 (진행 중) 🚀

### 1. 온보딩 시스템 ✅
- [x] `src/components/shared/Tutorial.tsx` 생성
  - [x] 단계별 튜토리얼 컴포넌트
  - [x] 프리미엄 UI 디자인 (그라데이션, 글래스모피즘)
  - [x] 건너뛰기 기능
  - [x] 진행 상태 표시
- [x] MenuScreen에 첫 방문 감지 시스템 추가
  - [x] AsyncStorage로 첫 방문 체크
  - [x] 4단계 환영 튜토리얼
  - [x] 햅틱 피드백 통합

### 2. 앱 리뷰 시스템 ✅
- [x] `expo-store-review` 패키지 설치
- [x] `src/utils/reviewManager.ts` 생성
  - [x] 게임 플레이 카운트 추적
  - [x] 10게임 후 자동 리뷰 요청
  - [x] AsyncStorage 기반 상태 관리
  - [x] 수동 리뷰 요청 함수
- [x] 모든 게임에 리뷰 카운트 통합
  - [x] FlipMatchGame
  - [x] SequenceGame
  - [x] MathRushGame
  - [x] MergePuzzleGame

### 3. 에러 처리 강화 ✅
- [x] `src/components/ErrorBoundary.tsx` 개선
  - [x] 프리미엄 UI 디자인 (다크 그라데이션)
  - [x] 사용자 친화적 에러 메시지
  - [x] onReset 콜백 지원
  - [x] 에러 정보 로깅

### 4. 프로젝트 메타데이터 ✅
- [x] `package.json` 업데이트
  - [x] 앱 이름: brain-games-collection
  - [x] 버전: 2.0.0
  - [x] 설명 및 키워드 추가
  - [x] Author 정보 추가

### 5. 출시 문서화 ✅
- [x] `docs/privacy-policy.md` 작성
  - [x] 한국어/영어 개인정보처리방침
  - [x] 데이터 수집 내역 (로컬 저장만 사용)
  - [x] 권한 설명 (VIBRATE)
  - [x] 아동 안전성 명시
- [x] `docs/store-listing.md` 작성
  - [x] 앱 이름 (한/영)
  - [x] 짧은 설명 & 상세 설명
  - [x] 키워드 목록
  - [x] 프로모션 텍스트
  - [x] 카테고리 선정
  - [x] ASO 전략
  - [x] 마케팅 계획
- [x] `docs/LAUNCH_CHECKLIST.md` 작성
  - [x] Phase 1: 필수 준비사항
  - [x] Phase 2: 빌드 & 테스트
  - [x] Phase 3: 스토어 등록
  - [x] Phase 4: 베타 테스트
  - [x] Phase 5: 심사 제출
  - [x] Phase 6: 출시 후 관리
  - [x] KPI 및 성공 지표

### 6. 앱 아이콘 & 스플래시 (대기 중) ⏳
- [ ] 앱 아이콘 제작 (1024x1024px)
  - [ ] Brain Games 브랜드 컬러 사용
  - [ ] 두뇌/게임 테마 디자인
- [ ] Adaptive Icon (Android)
  - [ ] Foreground: 512x512px
  - [ ] Background: 512x512px
- [ ] Splash Screen 디자인
- [ ] Favicon (Web)

### 7. 스토어 스크린샷 (대기 중) ⏳
- [ ] iPhone 스크린샷 (3-8장)
  - [ ] iPhone 15 Pro Max: 1290x2796px
  - [ ] iPhone 13 Pro: 1170x2532px
  - [ ] iPhone 8 Plus: 1242x2208px
- [ ] Android 스크린샷 (3-8장)
  - [ ] Phone: 1080x1920px 이상
- [ ] 필수 스크린샷 화면:
  - [ ] 메뉴 화면 (4개 게임 카드)
  - [ ] Flip & Match 플레이
  - [ ] Sequence 플레이
  - [ ] Math Rush 플레이
  - [ ] Merge Puzzle 플레이
  - [ ] 통계 화면
  - [ ] 다크/라이트 모드 비교
  - [ ] 승리 모달

### 8. 프로모션 자료 (대기 중) ⏳
- [ ] Google Play 프로모션 그래픽 (1024x500px)
- [ ] 프로모션 비디오 (30-60초, 선택)

### 9. 개발자 계정 (대기 중) ⏳
- [ ] Google Play Console 등록 ($25)
- [ ] Apple Developer 등록 ($99/년)
- [ ] 개인정보처리방침 호스팅 (GitHub Pages)

### 10. Production 빌드 (대기 중) ⏳
- [ ] Android AAB 생성
  ```bash
  npx eas build --profile production --platform android
  ```
- [ ] iOS IPA 생성
  ```bash
  npx eas build --profile production --platform ios
  ```
- [ ] QA 테스트 (다양한 기기)

---

## 📊 개발 진행 상황

### ✅ 완료 (Phase 0-8 부분)
- React Native + Expo 초기 설정
- TypeScript 개발 환경
- Zustand 상태 관리
- React Native Reanimated
- expo-linear-gradient
- expo-store-review
- 햅틱 피드백 시스템
- 업적 시스템
- 타이머 컴포넌트
- 토스트 알림
- **4개 게임 완전 구현**
- **프리미엄 UI 디자인**
- **다크/라이트 모드**
- **통합 통계 시스템**
- **게임별 플레이 시간 추적**
- **첫 방문 온보딩 튜토리얼**
- **앱 리뷰 요청 시스템**
- **강화된 에러 바운더리**
- **출시 문서 완성 (개인정보처리방침, 스토어 등록정보, 체크리스트)**

### 🚧 현재 작업 (Phase 8)
- 앱 아이콘 & 스플래시 제작
- 스크린샷 촬영
- 개발자 계정 등록 준비

### 🎯 남은 작업 (출시까지)
1. **이번 주 (10/4 - 10/11)**
   - [ ] 앱 아이콘 제작
   - [ ] 스플래시 스크린 디자인
   - [ ] 스크린샷 8장 촬영
   - [ ] 개인정보처리방침 GitHub Pages 호스팅

2. **다음 주 (10/12 - 10/18)**
   - [ ] Google Play Console 계정 등록
   - [ ] Apple Developer 계정 등록
   - [ ] Production 빌드 생성 (Android AAB, iOS IPA)
   - [ ] QA 테스트 (3개 이상 기기)

3. **3주차 (10/19 - 10/25)**
   - [ ] 스토어 등록 정보 입력
   - [ ] 빌드 업로드
   - [ ] 심사 제출
   - [ ] 베타 테스트 (선택)

4. **4주차 (10/26 이후)**
   - [ ] 심사 대응
   - [ ] 앱 출시 🚀
   - [ ] 마케팅 시작
   - [ ] 사용자 피드백 수집

### 💡 향후 업데이트 계획 (출시 후)
1. **v2.0.1 (버그 픽스)** - 출시 후 1주일
   - 크리티컬 버그 수정
   - 성능 최적화
   - 사용자 피드백 반영

2. **v2.1.0 (마이너 업데이트)** - 출시 후 1개월
   - 사운드 시스템 (BGM, SFX)
   - 추가 게임 모드
   - UI/UX 개선
   - 추가 업적

3. **v3.0.0 (메이저 업데이트)** - 출시 후 3개월
   - 새로운 게임 추가 (5번째 게임)
   - 소셜 기능 (친구와 경쟁)
   - 리더보드 (온라인)
   - 일일 챌린지

---

## 🎮 최종 앱 구조

```
🎮 Brain Games

메인 메뉴:
├── 🎴 Flip & Match    (Best: XX초) ✅
├── 🔢 Sequence        (Best: Level XX) ✅
├── ➕ Math Rush       (Best: XX점) ✅
├── 🔢 Merge Puzzle    (Best: XX회) ✅
├── 📊 통계 (게임별 상세 통계) ✅
├── 🏆 업적 ✅
└── ⚙️ 설정 (다크/라이트 모드) ✅
```

---

## 🎨 기술 스택

- **프레임워크**: React Native + Expo
- **언어**: TypeScript
- **상태관리**: Zustand
- **애니메이션**: React Native Reanimated
- **UI 라이브러리**: expo-linear-gradient
- **저장소**: AsyncStorage
- **햅틱**: expo-haptics
- **네비게이션**: React Navigation

---

## 📱 주요 기능

1. **4개의 독특한 브레인 게임**
   - 메모리 게임 (Flip & Match)
   - 순서 게임 (Sequence)
   - 계산 게임 (Math Rush)
   - 퍼즐 게임 (Merge Puzzle)

2. **프리미엄 UI/UX**
   - 게임별 고유 색상 테마
   - 그라데이션 및 글래스모피즘
   - 부드러운 애니메이션
   - 다크/라이트 모드 지원

3. **통합 통계 시스템**
   - 게임별 최고 기록
   - 플레이 횟수 추적
   - 총 플레이 시간 기록
   - 실시간 업데이트

4. **사용자 경험**
   - 햅틱 피드백
   - 직관적인 인터페이스
   - 반응형 디자인
   - 설정 저장

---

## 🎉 프로젝트 현황

**현재 상태**: 앱 출시 준비 단계 (Phase 8 진행 중)
**개발 기간**: 약 4주
**게임 수**: 4개
**총 화면 수**: 8개 (Menu, Settings, Stats, Achievements, 4 Games)
**앱 버전**: 2.0.0

**완료율**:
- 코어 기능: ✅ 100%
- UI/UX: ✅ 100%
- 출시 준비 문서: ✅ 100%
- 아트 에셋: ⏳ 0% (아이콘, 스크린샷 필요)
- 스토어 등록: ⏳ 0%

**예상 출시일**: 2025년 10월 25일 🚀

모든 핵심 기능과 출시 문서가 완성되었으며, 아이콘/스크린샷 제작 후 스토어 등록이 가능합니다.

---

## Phase 9: v3.0 온라인 기능 (v2.0 출시 후) 🌐

**목표**: 소셜 & 온라인 기능으로 사용자 참여도 극대화
**예상 기간**: 14-16주 (3.5-4개월)
**예상 출시**: 2026년 1월

### 핵심 원칙
⚠️ **계정 없이도 완전히 플레이 가능**
- 로그인은 100% 선택 사항
- 로그인 안 해도: 모든 게임 + 로컬 기록
- 로그인하면: 온라인 기능 추가 활성화

### 1. 백엔드 인프라 설정 (1-2주)

#### 1.1 Supabase 프로젝트 설정
- [x] Supabase MCP 서버 연결
  - [x] 전역 패키지 설치 (`@supabase/mcp-server-supabase`)
  - [x] `.mcp.json` 설정 (프로젝트 루트)
  - [x] `.claude/settings.local.json`에 `enableAllProjectMcpServers: true` 추가
  - [x] 프로젝트 참조: `yqngfoowohacuozaofyb`
  - [x] Access Token 설정
  - [x] .gitignore에 보안 파일 추가
- [x] 데이터베이스 스키마 설계
  - [x] `docs/supabase-schema.sql` 작성
  - [x] 테이블 구조 정의
- [x] Supabase 설정 가이드 작성
  - [x] `docs/SUPABASE_SETUP_GUIDE.md` 생성
  - [x] 단계별 실행 가이드
  - [x] 문제 해결 섹션
  - [x] 테스트 쿼리 예시
- [x] Supabase SQL 스키마 실행
  - [x] profiles 테이블
  - [x] game_records 테이블
  - [x] leaderboards 테이블
  - [x] friendships 테이블
  - [x] user_achievements 테이블
  - [x] Row Level Security (RLS) 정책 설정
  - [x] 함수 및 트리거 생성

#### 1.2 React Native 라이브러리 설치
- [x] `@supabase/supabase-js` 설치
- [x] `react-native-url-polyfill` 설치
- [x] AsyncStorage 설정 확인

#### 1.3 Supabase 클라이언트 설정
- [x] `src/lib/supabase.ts` 생성
- [x] 환경 변수 설정 (.env with Anon Key)
- [x] 클라이언트 초기화

### 2. 사용자 인증 시스템 (2주)

#### 2.1 인증 Context 생성
- [x] `src/contexts/AuthContext.tsx` 생성
  - [x] 로그인 상태 관리
  - [x] 세션 관리
  - [x] 자동 로그인 (토큰 저장)
- [x] App.tsx에 AuthProvider 통합

#### 2.2 로그인 화면 구현
- [x] `src/screens/LoginScreen.tsx` 생성
  - [x] Google 로그인 버튼
  - [x] Apple 로그인 버튼 (iOS)
  - [x] 익명 로그인 옵션
  - [x] "나중에" 버튼 (건너뛰기)
- [x] 로그인 UI 디자인
  - [x] 프리미엄 그라데이션
  - [x] 애니메이션 효과
  - [x] 로딩 상태

#### 2.3 소셜 로그인 통합 (출시 전 보류)
- [ ] 🔒 Google OAuth 설정 (보류 - 익명 로그인으로 충분)
  - [ ] Google Cloud Console 설정
  - [ ] Android Studio 키 지문 생성
  - [ ] Supabase에 Google 프로바이더 추가
  - [x] `expo-auth-session` 설치
- [ ] 🔒 Apple Sign In (iOS) (보류 - 익명 로그인으로 충분)
  - [ ] Apple Developer 설정
  - [ ] Supabase에 Apple 프로바이더 추가
- [x] 익명 로그인 구현 ✅ (현재 사용 중)

#### 2.4 프로필 생성 흐름
- [x] 닉네임 입력 화면
- [x] 프로필 이미지 선택 (선택) - Avatar 이니셜 표시
- [x] 국가 선택 (선택)
- [x] Supabase profiles 테이블에 저장

### 3. 사용자 프로필 화면 (1주)

#### 3.1 프로필 화면 구현
- [x] `src/screens/ProfileScreen.tsx` 생성
  - [x] 사용자 정보 표시
  - [x] 프로필 편집 버튼
  - [x] 로그아웃 버튼
  - [x] 계정 삭제 버튼
- [x] Navigation에 Profile 라우트 추가

#### 3.2 프로필 편집
- [x] 닉네임 변경
- [x] 프로필 이미지 업로드 (Avatar 이니셜로 대체)
- [x] 국가 변경

#### 3.3 UI 통합
- [x] MenuScreen에 로그인/프로필 버튼 추가
  - [x] 로그인 전: 🔐 아이콘
  - [x] 로그인 후: 👤 아이콘

### 4. 클라우드 동기화 ✅

#### 4.1 동기화 유틸리티 생성
- [x] `src/utils/cloudSync.ts` 생성
  - [x] uploadGameRecord 함수
  - [x] downloadGameRecords 함수
  - [x] syncConflictResolver 함수
  - [x] getCurrentUser 함수
  - [x] smartSync (자동 온라인/오프라인 처리)
  - [x] queueRecordForUpload (오프라인 큐)
  - [x] processUploadQueue (큐 처리)

#### 4.2 게임 기록 업로드
- [x] FlipMatchGame 통합 (smartSync 사용)
- [x] SequenceGame 통합 (smartSync 사용)
- [x] MathRushGame 통합 (smartSync 사용)
- [x] MergePuzzleGame 통합 (smartSync 사용)

#### 4.3 게임 기록 다운로드
- [x] 앱 시작 시 자동 동기화 (App.tsx)
- [x] 수동 동기화 버튼 (MenuScreen - 🔄 아이콘)
- [x] 오프라인 큐 구현

#### 4.4 충돌 해결
- [x] 로컬 vs 클라우드 비교 (resolveConflicts 함수)
- [x] 최고 기록 우선 정책 (isBetterScore 함수)
- [x] 리더보드 자동 업데이트

### 5. 온라인 리더보드 (3주) ✅

#### 5.1 리더보드 데이터 구조 ✅
- [x] 게임별 리더보드 테이블 (leaderboards)
- [x] 난이도별 분리 (Easy/Medium/Hard/Normal)
- [x] 순위 계산 함수 (클라이언트 측에서 정렬 후 순위 부여)

#### 5.2 리더보드 화면 구현 ✅
- [x] `src/screens/LeaderboardScreen.tsx` 생성
- [x] 게임 선택 탭 (Horizontal Scroll, 4개 게임)
- [x] 난이도 선택 (Flip & Match만 Easy/Medium/Hard)
- [x] 순위 목록 UI (Top 100)
  - [x] 1-3위 메달 표시 (🥇🥈🥉)
  - [x] 프로필 정보와 조인 (username)
  - [x] 게임별 점수 포맷 (초, 레벨, 점, 회)
  - [x] 현재 사용자 하이라이트

#### 5.3 리더보드 업데이트 ✅
- [x] 게임 완료 시 자동 제출 (smartSync → updateLeaderboard)
- [x] Pull-to-Refresh 지원
- [x] 내 순위 표시 (하단 요약)
- [x] 로그인 안내 메시지 (비로그인 시)

#### 5.4 게임별 리더보드 ✅
- [x] Flip & Match 리더보드
  - [x] Easy/Medium/Hard 별도
  - [x] 최단 시간 기준 (오름차순)
- [x] Sequence 리더보드
  - [x] 최고 레벨 기준 (내림차순)
- [x] Math Rush 리더보드
  - [x] 최고 점수 기준 (내림차순)
- [x] Merge Puzzle 리더보드
  - [x] 최소 이동 기준 (오름차순)

#### 5.5 Navigation 통합 ✅
- [x] App.tsx에 Leaderboard 라우트 추가
- [x] MenuScreen에 리더보드 버튼 추가 (3개 버튼으로 확장)
  - [x] 📊 통계
  - [x] 🏆 리더보드 (로그인 시 보라색 그라데이션)
  - [x] 🎖️ 업적

### 6. 친구 시스템 (2주)

#### 6.1 친구 목록 화면
- [ ] `src/screens/FriendsScreen.tsx` 생성
  - [ ] 친구 목록 표시
  - [ ] 온라인 상태 표시
  - [ ] 친구 기록 간단 보기

#### 6.2 친구 추가 기능
- [ ] 사용자 ID로 검색
- [ ] QR 코드 생성/스캔
- [ ] 친구 요청 보내기
- [ ] 친구 요청 알림

#### 6.3 친구 관리
- [ ] 친구 요청 수락/거절
- [ ] 친구 삭제
- [ ] 친구 차단

#### 6.4 친구 기록 비교
- [ ] `src/screens/FriendComparisonScreen.tsx` 생성
- [ ] 게임별 기록 비교
- [ ] 승률 통계
- [ ] 도전장 보내기 (준비)

### 7. 실시간 멀티플레이어 (3주, 선택적)

#### 7.1 매칭 시스템
- [ ] `src/screens/MultiplayerLobbyScreen.tsx` 생성
- [ ] 친구와 대결
- [ ] 랜덤 매칭
- [ ] 방 만들기 (코드 공유)

#### 7.2 실시간 게임 룸
- [ ] Supabase Realtime 설정
- [ ] 게임 룸 테이블
- [ ] 플레이어 상태 동기화

#### 7.3 Math Rush 1:1 대결
- [ ] 실시간 점수 동기화
- [ ] 30초 타이머 공유
- [ ] 승패 판정

#### 7.4 Sequence 경쟁 모드
- [ ] 동시에 같은 패턴 도전
- [ ] 실시간 진행 상황 공유
- [ ] 먼저 실패한 사람 패배

### 8. 업적 시스템 확장 (1주)

#### 8.1 온라인 전용 업적
- [ ] "첫 승리" - 첫 온라인 대결 승리
- [ ] "소셜 버터플라이" - 친구 10명 추가
- [ ] "글로벌 스타" - 리더보드 Top 100
- [ ] "연승 행진" - 5연승
- [ ] "완벽주의자" - 모든 게임 1위

#### 8.2 업적 알림
- [ ] 업적 달성 토스트
- [ ] 업적 배지 표시
- [ ] 업적 공유 기능

### 9. 설정 & 개인정보 (1주)

#### 9.1 온라인 설정 추가
- [ ] 자동 동기화 on/off
- [ ] 리더보드 참여 on/off
- [ ] 친구 요청 수신 on/off
- [ ] 온라인 상태 표시 on/off

#### 9.2 개인정보 관리
- [ ] 데이터 다운로드 (GDPR)
- [ ] 계정 삭제
- [ ] 데이터 삭제 확인

#### 9.3 개인정보처리방침 업데이트
- [ ] v3.0 정보 수집 내역 추가
- [ ] Supabase 제3자 공유 명시
- [ ] 사용자 권리 안내

### 10. 테스트 & 최적화 (2주)

#### 10.1 기능 테스트
- [ ] 로그인/로그아웃 흐름
- [ ] 데이터 동기화 정확성
- [ ] 리더보드 순위 정확성
- [ ] 친구 기능 동작
- [ ] 멀티플레이어 안정성

#### 10.2 성능 최적화
- [ ] 리더보드 캐싱
- [ ] 이미지 최적화
- [ ] 네트워크 요청 최소화
- [ ] 오프라인 모드 개선

#### 10.3 보안 테스트
- [ ] RLS 정책 검증
- [ ] SQL Injection 방지
- [ ] 토큰 보안 확인
- [ ] 민감 정보 암호화

#### 10.4 베타 테스트
- [ ] 베타 테스터 100명 모집
- [ ] 피드백 수집
- [ ] 버그 수정
- [ ] 성능 모니터링

### 11. UI/UX 개선 (1주)

#### 11.1 로딩 상태
- [ ] 네트워크 요청 시 로딩 인디케이터
- [ ] 스켈레톤 UI (리더보드)
- [ ] 오프라인 모드 안내

#### 11.2 에러 처리
- [ ] 네트워크 에러 핸들링
- [ ] 인증 에러 처리
- [ ] 재시도 로직
- [ ] 사용자 친화적 에러 메시지

#### 11.3 온보딩 업데이트
- [ ] 온라인 기능 소개 추가
- [ ] 로그인 유도 메시지
- [ ] 리더보드 소개

---

## 📊 v3.0 개발 진행 상황

### ✅ 완료
- Supabase MCP 서버 연결
- 데이터베이스 스키마 설계
- 온라인 기능 계획 문서
- **Section 1**: 백엔드 인프라 설정 ✅
- **Section 2**: 사용자 인증 시스템 ✅
- **Section 3**: 사용자 프로필 화면 ✅
- **Section 4**: 클라우드 동기화 ✅
- **Section 5**: 온라인 리더보드 ✅ (2025-10-06 완료)

### 🚧 현재 작업
- ✅ Supabase SQL 스키마 실행 완료 (2025-10-06)
  - 5개 테이블 생성 완료 (profiles, game_records, leaderboards, friendships, user_achievements)
  - RLS 정책 활성화 완료
  - 4개 Functions 생성 완료 (handle_new_user, handle_updated_at, upsert_game_record, update_daily_leaderboard)
  - leaderboards 테이블에 게임별 컬럼 추가 (best_score, best_level, best_time_seconds, best_moves)
  - difficulty_type ENUM에 'normal' 값 추가
- 🔒 Google/Apple OAuth 설정 (출시 전 보류 - 익명 로그인으로 충분)
- ⏳ 친구 시스템 구현 (다음 단계)

### 🎯 다음 작업
1. ~~**Week 1-2**: Supabase 설정 & 인증 시스템~~ ✅
2. ~~**Week 3-4**: 프로필 & 클라우드 동기화~~ ✅
3. ~~**Week 5-7**: 리더보드 구현~~ ✅
4. **Week 8-9**: Supabase 배포 & 테스트 ← 현재
5. **Week 10-11**: 친구 시스템
6. **Week 12-14**: 멀티플레이어 (선택)
7. **Week 15-16**: 테스트 & 최적화
8. **Week 17**: 베타 & 버그 수정

---

## 🎨 기술 스택 (v3.0 추가)

### 백엔드
- **데이터베이스**: Supabase (PostgreSQL)
- **인증**: Supabase Auth
- **실시간**: Supabase Realtime
- **저장소**: Supabase Storage

### 프론트엔드 추가
- **Supabase 클라이언트**: @supabase/supabase-js
- **OAuth**: expo-auth-session
- **QR 코드**: react-native-qrcode-svg

---

## 💰 예상 비용 (v3.0)

### Supabase 무료 티어
- 500MB 데이터베이스
- 1GB 파일 저장소
- 50,000 MAU
- 2GB 대역폭

### 예상 사용량 (10,000 DAU)
- 월 비용: **$0** (무료 티어 내)

### 확장 시 (50,000+ DAU)
- Pro Plan: **$25/월**
- 또는 수익화로 충당

---
