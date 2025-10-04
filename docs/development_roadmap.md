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
