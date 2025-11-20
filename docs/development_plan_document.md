# Brain Games Collection - 개발 계획 문서

## 🛠 기술 스택

### Frontend
- **Framework**: React Native (Expo SDK 50+)
- **Language**: TypeScript
- **State Management**: Zustand (가볍고 직관적인 전역 상태 관리)
- **Navigation**: React Navigation v6 (Native Stack)
- **Styling**: StyleSheet + expo-linear-gradient (프리미엄 UI)
- **Animations**: React Native Reanimated v3 (고성능 애니메이션)
- **Storage**: AsyncStorage (로컬 데이터), Supabase (클라우드 데이터)

### Backend (BaaS)
- **Platform**: Supabase
- **Database**: PostgreSQL
- **Auth**: Supabase Auth (Anonymous, OAuth)
- **Realtime**: Supabase Realtime (멀티플레이어 상태 동기화)

---

## 📅 개발 로드맵

### Phase 1: 핵심 게임 플레이 구현 (완료)
- [x] 프로젝트 초기 설정 (Expo, TypeScript)
- [x] **Flip & Match** 구현 (카드 매칭 로직, 애니메이션)
- [x] **Sequence** 구현 (순서 기억 로직)
- [x] **Math Rush** 구현 (사칙연산 생성, 타이머)
- [x] **Merge Puzzle** 구현 (2048 스타일 로직)
- [x] 기본 UI/UX 디자인 (메인 메뉴, 게임 오버 화면)
- [x] 로컬 데이터 저장 (최고 점수)

### Phase 2: 시스템 고도화 및 폴리싱 (완료)
- [x] **통계 시스템**: 게임별 플레이 횟수, 시간, 점수 추적
- [x] **업적 시스템**: 다양한 도전 과제 및 뱃지
- [x] **설정 기능**: 사운드/진동 제어, 다크 모드
- [x] **튜토리얼**: 게임별 가이드 및 온보딩
- [x] **햅틱 피드백**: 몰입감 향상을 위한 진동 효과

### Phase 3: 온라인 기능 통합 (진행 중)
- [x] **Supabase 연동**: 프로젝트 설정 및 클라이언트 초기화
- [x] **인증 시스템**: 익명 로그인 및 프로필 관리
- [x] **리더보드**: 글로벌/친구 랭킹 시스템
- [x] **친구 시스템**: 친구 추가, 검색, 목록 관리
- [ ] **클라우드 저장**: 기기 간 진행 상황 동기화

### Phase 4: 멀티플레이어 모드 (예정)
- [ ] **실시간 대전 로비**: 방 생성, 참여, 매치메이킹
- [ ] **게임 상태 동기화**: 상대방 점수/진행 상황 실시간 공유
- [ ] **이모지 채팅**: 대전 중 간단한 의사소통
- [ ] **대전 기록**: 승률, 전적 관리

### Phase 5: 수익화 및 확장 (미래)
- [ ] **광고 연동**: AdMob (보상형, 전면 광고)
- [ ] **IAP (인앱 결제)**: 광고 제거, 프리미엄 테마
- [ ] **신규 게임 추가**: Spatial Memory, Stroop Test 등
- [ ] **다국어 지원**: 영어, 한국어, 일본어 등

---

## 🏗 아키텍처 설계

### 폴더 구조
```
src/
├── components/     # 재사용 가능한 UI 컴포넌트 (Button, Card, Header...)
├── screens/        # 화면 단위 컴포넌트 (Menu, Game, Settings...)
├── game/           # 게임별 핵심 로직 (순수 함수 위주)
│   ├── flipmatch/
│   ├── sequence/
│   └── ...
├── contexts/       # 전역 상태 (Theme, Auth...)
├── hooks/          # 커스텀 훅 (useTimer, useSound...)
├── utils/          # 유틸리티 함수 (Format, Storage...)
├── lib/            # 외부 라이브러리 설정 (Supabase...)
└── assets/         # 이미지, 폰트, 사운드 리소스
```

### 데이터 흐름
1. **Local State**: 각 게임 화면 내에서 `useState`, `useReducer`로 관리 (타이머, 점수 등).
2. **Global State**: `Zustand` 스토어를 통해 사용자 설정, 프로필, 오디오 상태 관리.
3. **Persistence**: `AsyncStorage`에 즉시 저장하고, 네트워크 연결 시 `Supabase`와 동기화.

---

## ✅ 품질 관리 (QA)

### 테스트 전략
- **Unit Test**: 게임 핵심 로직(점수 계산, 매칭 알고리즘) 테스트 (Jest).
- **UI Test**: 주요 화면 렌더링 및 인터랙션 테스트.
- **Performance**: 리렌더링 최적화, 메모리 누수 점검.

### 배포 프로세스
- **CI/CD**: EAS Build를 통한 자동 빌드 및 배포.
- **OTA Updates**: Expo Updates를 통한 긴급 버그 수정.

---

## 📝 유지보수 계획
- **버그 리포트**: 사용자 피드백 채널 운영 (이메일, 인앱 피드백).
- **정기 업데이트**: 월 1회 신규 콘텐츠 또는 기능 개선 업데이트.
- **모니터링**: Sentry 등을 활용한 에러 트래킹.