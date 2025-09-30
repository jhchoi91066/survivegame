# 무인도 긴급 구조 작전 - React Native 개발 계획서

## 📋 프로젝트 개요

### 프로젝트 정보
- **프로젝트명**: 무인도 긴급 구조 작전 (Island Emergency Rescue)
- **개발 기간**: 4개월 (MVP 3개월 + 폴리싱 1개월)
- **기술 스택**: React Native + Expo
- **팀 구성**: 7-8명
- **예산**: 약 1억 8,000만원 (개발비 + 마케팅비)

### 기술 스택 선정 이유

#### ✅ React Native를 선택한 핵심 이유
1. **빠른 개발 속도**: React 개발자라면 1-2주 내 생산성 확보
2. **검증된 성능**: 90%+ 코드 공유, 60 FPS 유지 가능
3. **우수한 수익화**: AdMob 완벽 지원, 인앱결제 네이티브 연동
4. **실제 성공 사례**: "Quick Tap Me!" 1주일 개발, "Ordinary Puzzles" 상용화 성공
5. **비용 효율**: Unity Pro 라이선스 불필요, 오픈소스 생태계

---

## 👥 팀 구성 및 역할

### 핵심 팀

| 역할 | 인원 | 주요 책임 | 월급 |
|------|------|-----------|------|
| **프로젝트 매니저** | 1명 | 전체 일정 관리, 팀 조율 | 500만원 |
| **게임 디자이너** | 1명 | 레벨 디자인, 밸런싱, 게임 메커니즘 | 450만원 |
| **React Native 개발자** | 2명 | 게임 로직, 시스템 구현, 최적화 | 550만원 |
| **UI/UX 디자이너** | 1명 | 인터페이스 디자인, 인터랙션 | 450만원 |
| **2D 아티스트** | 1명 | 캐릭터, 배경, 아이콘 제작 | 400만원 |
| **사운드 디자이너** | 0.5명 | BGM, SFX 제작 (파트타임) | 200만원 |
| **QA 테스터** | 1명 | 버그 찾기, 밸런스 테스트 | 350만원 |

**총 인건비**: 약 3,900만원/월

---

## 🛠 기술 스택

### 개발 도구

| 카테고리 | 도구 | 버전 | 용도 |
|----------|------|------|------|
| **프레임워크** | React Native | 0.74+ | 크로스 플랫폼 개발 |
| **빌드 시스템** | Expo | SDK 51+ | 개발/빌드/배포 자동화 |
| **언어** | TypeScript | 5.0+ | 타입 안전성 |
| **상태 관리** | Zustand | 4.0+ | 게임 상태 관리 |
| **애니메이션** | React Native Reanimated | 3.0+ | 60 FPS 애니메이션 |
| **IDE** | VS Code | 최신 | 코드 작성 |
| **버전 관리** | Git + GitHub | - | 소스 관리 |
| **프로젝트 관리** | Linear / Notion | - | 태스크 관리 |
| **디자인** | Figma | - | UI/UX 디자인 |

### 핵심 React Native 패키지

| 패키지 | 용도 | 이유 |
|--------|------|------|
| **react-native-reanimated** | 애니메이션 | UI 쓰레드 60 FPS 보장 |
| **react-native-gesture-handler** | 제스처 처리 | 네이티브 터치 성능 |
| **react-native-skia** | 고급 그래픽 | Canvas 기반 복잡한 효과 |
| **expo-av** | 오디오 재생 | BGM/SFX 관리 |
| **expo-haptics** | 햅틱 피드백 | 촉각 피드백 |
| **@react-native-firebase** | 애널리틱스 | 사용자 행동 분석 |
| **react-native-admob** | 광고 | 수익화 (리워드 광고) |
| **react-native-iap** | 인앱결제 | 프리미엄 기능 판매 |

### 외부 서비스

| 서비스 | 용도 | 월 비용 |
|--------|------|---------|
| **Firebase** | 애널리틱스, 크래시리틱스 | 무료 |
| **Expo EAS** | 빌드 및 배포 | $99 |
| **Sentry** | 에러 트래킹 | $26 |
| **AdMob** | 광고 수익화 | 무료 (수수료) |

---

## 📅 개발 일정 (4개월)

### Phase 0: 사전 준비 (2주)

#### Week 1: 프로젝트 셋업
**전체 팀**:
- [ ] React Native + Expo 프로젝트 초기화
- [ ] TypeScript 설정 및 코딩 컨벤션
- [ ] Git 브랜치 전략 수립
- [ ] CI/CD 파이프라인 구축 (GitHub Actions)

**React Native 개발자**:
- [ ] 프로젝트 구조 설계 (features, components, utils)
- [ ] 상태 관리 아키텍처 설계 (Zustand)
- [ ] 네비게이션 구조 설계 (React Navigation)
- [ ] 성능 모니터링 셋업 (Flashlight)

**산출물**:
- 실행 가능한 Hello World 앱
- 기술 명세서 v1.0
- 개발 환경 가이드

#### Week 2: 기획 및 디자인
**게임 디자이너**:
- [ ] 게임 컨셉 문서 최종화
- [ ] 튜토리얼 플로우 설계
- [ ] 레벨 1-20 기초 디자인
- [ ] 밸런싱 스프레드시트 초안

**UI/UX 디자이너**:
- [ ] 무드보드 및 색상 팔레트
- [ ] 와이어프레임 (10개 주요 화면)
- [ ] 프로토타입 (Figma)
- [ ] 디자인 시스템 구축

**2D 아티스트**:
- [ ] 캐릭터 컨셉 스케치 (4명 × 3버전)
- [ ] 타일 스타일 테스트
- [ ] 아이콘 스타일 가이드

**산출물**:
- 게임 디자인 문서 (GDD) v1.0
- UI/UX 프로토타입
- 아트 스타일 가이드

---

### Phase 1: 핵심 개발 (8주)

#### Week 3-4: 핵심 게임 루프
**React Native 개발자**:
- [ ] 5×5 그리드 시스템 구현 (FlatList 최적화)
- [ ] 생존자 이동 로직 (Gesture Handler)
- [ ] 턴 시스템 구현
- [ ] 기본 애니메이션 (Reanimated 3)

**게임 디자이너**:
- [ ] 레벨 1-10 세부 디자인
- [ ] 밸런싱 1차 테스트

**2D 아티스트**:
- [ ] 타일 에셋 제작 (일반, 바위, 늪지)
- [ ] 생존자 기본 스프라이트

**산출물**:
- 플레이 가능한 프로토타입 v0.1
- 10개 레벨 플레이 가능

**Week 5-6: 상태 & 자원 시스템**
**React Native 개발자**:
- [ ] 생존자 상태 관리 (Zustand store)
- [ ] 자원 인벤토리 시스템
- [ ] 상태 UI 컴포넌트 (진행바, 아이콘)
- [ ] 애니메이션 연동 (상태 변화 시)

**UI/UX 디자이너**:
- [ ] 생존자 정보 패널 디자인
- [ ] 자원 UI 레이아웃
- [ ] 인터랙션 디자인 (터치 피드백)

**2D 아티스트**:
- [ ] 자원 아이콘 제작 (8종)
- [ ] 상태바 디자인 에셋
- [ ] 이펙트 스프라이트

**산출물**:
- 완전한 상태 관리 시스템
- UI 컴포넌트 라이브러리 v1.0

**Week 7-8: 장애물 & 특수 능력**
**React Native 개발자**:
- [ ] 장애물 시스템 (바위, 늪지)
- [ ] 다리 건설 로직
- [ ] 늪지 복구 로직
- [ ] 생존자별 특수 능력 구현

**2D 아티스트**:
- [ ] 캐릭터 최종 아트 (4명)
- [ ] 장애물 에셋 완성
- [ ] 건설/복구 애니메이션 프레임

**산출물**:
- 알파 버전 v0.2
- 완전한 게임 루프 작동

**Week 9-10: 타이머 & 이벤트**
**React Native 개발자**:
- [ ] 120초 타이머 구현 (useInterval 최적화)
- [ ] 타이머 색상 변화 애니메이션
- [ ] 날씨 이벤트 시스템
- [ ] 승리/패배 조건 및 화면

**게임 디자이너**:
- [ ] 레벨 11-30 디자인
- [ ] 난이도 밸런싱 2차 테스트
- [ ] 내부 플레이테스트 진행

**사운드 디자이너**:
- [ ] 메인 BGM 제작 (초안)
- [ ] 주요 SFX 10개 제작

**산출물**:
- 베타 버전 v0.3
- 30개 레벨 플레이 가능
- 사운드 샘플 50%

---

### Phase 2: 폴리싱 & 콘텐츠 (4주)

#### Week 11-12: UI/UX 완성
**UI/UX 디자이너**:
- [ ] 메인 메뉴 최종 디자인
- [ ] 레벨 선택 화면
- [ ] 설정 화면 (볼륨, 언어 등)
- [ ] 튜토리얼 UI

**React Native 개발자**:
- [ ] 화면 전환 애니메이션 (SharedTransition)
- [ ] 버튼 인터랙션 폴리싱
- [ ] 로딩 화면 구현
- [ ] 온보딩 플로우 구현

**2D 아티스트**:
- [ ] 배경 아트 (하늘, 바다, 섬)
- [ ] 파티클 에셋 (반짝임, 연기 등)
- [ ] 아이콘 완성 (50개+)

**산출물**:
- UI/UX 95% 완성
- 비주얼 폴리싱 완료

#### Week 13-14: 사운드 & 레벨 확장
**사운드 디자이너**:
- [ ] BGM 3곡 완성 (메뉴, 게임, 긴급)
- [ ] SFX 30개 완성
- [ ] 환경음 (파도, 갈매기, 바람)
- [ ] 오디오 믹싱 및 마스터링

**게임 디자이너**:
- [ ] 레벨 31-50 디자인 완료
- [ ] 보스 레벨 (10, 20, 30, 40, 50) 디자인
- [ ] 별 평가 조건 최종 조정

**React Native 개발자**:
- [ ] 레벨 데이터 시스템 (JSON)
- [ ] 별 평가 시스템
- [ ] 진행도 저장/불러오기 (AsyncStorage)

**QA 테스터**:
- [ ] 전체 레벨 플레이테스트
- [ ] 버그 리포트 작성 (우선순위별)

**산출물**:
- 릴리즈 후보 RC1
- 50개 레벨 완성
- 사운드 100% 완성

---

### Phase 3: 최적화 & 출시 준비 (4주)

#### Week 15: 성능 최적화
**React Native 개발자**:
- [ ] 프로파일링 (Flashlight, React DevTools)
- [ ] 메모이제이션 최적화 (React.memo, useMemo)
- [ ] 이미지 최적화 (WebP, 압축)
- [ ] 번들 사이즈 최적화
- [ ] 로딩 시간 개선 (3초 이내 목표)

**목표 성능**:
- 60 FPS 유지 (저사양 기기 45+ FPS)
- 메모리 사용량: 150MB 이하
- APK/IPA 크기: 60MB 이하
- 초기 로딩: 3초 이내

**산출물**:
- 성능 최적화 리포트
- 프로파일링 결과

#### Week 16: 버그 수정 & QA
**QA 테스터**:
- [ ] 전체 기능 테스트 (100개 테스트 케이스)
- [ ] 디바이스 테스트 (iOS 3종, Android 5종)
- [ ] 엣지 케이스 테스트
- [ ] 크래시 리포트 분석

**React Native 개발자**:
- [ ] 크리티컬 버그 수정 (우선순위 높음)
- [ ] 메이저 버그 수정
- [ ] 크래시 방지 코드 추가
- [ ] 에러 바운더리 구현

**버그 수정 목표**:
- 크리티컬 버그: 0개
- 메이저 버그: 5개 이하
- 마이너 버그: 15개 이하

**산출물**:
- 릴리즈 후보 RC2
- 버그 수정 리포트
- QA 테스트 리포트

#### Week 17: 수익화 & 분석 통합
**React Native 개발자**:
- [ ] AdMob 통합 (리워드 광고)
- [ ] Firebase Analytics 통합
- [ ] Firebase Crashlytics 통합
- [ ] 인앱결제 준비 (react-native-iap)

**마케팅 담당**:
- [ ] 앱스토어 스크린샷 제작 (각 5개)
- [ ] 앱 설명 작성 (한국어, 영어)
- [ ] 프로모션 비디오 제작 (30초)
- [ ] 앱 아이콘 A/B 테스트

**산출물**:
- 정식 출시 버전 v1.0
- 스토어 리스팅 완료
- 마케팅 에셋 패키지

#### Week 18: 출시
**전체 팀**:
- [ ] 앱스토어 심사 제출
- [ ] 구글 플레이 스토어 제출
- [ ] 출시 모니터링 (크래시, 리뷰)
- [ ] 긴급 핫픽스 대응 준비

**마케팅 담당**:
- [ ] 출시 프레스 릴리스
- [ ] 소셜 미디어 캠페인 시작
- [ ] 인플루언서 컨택
- [ ] 커뮤니티 관리

**산출물**:
- 정식 출시 완료 🎉
- 모니터링 대시보드
- 출시 주간 리포트

---

## 💰 예산 계획 (4개월)

### 인건비
| 역할 | 월급 | 기간 | 소계 |
|------|------|------|------|
| PM | 500만원 | 4개월 | 2,000만원 |
| 게임 디자이너 | 450만원 | 4개월 | 1,800만원 |
| React Native 개발자 | 550만원 × 2명 | 4개월 | 4,400만원 |
| UI/UX 디자이너 | 450만원 | 4개월 | 1,800만원 |
| 2D 아티스트 | 400만원 | 4개월 | 1,600만원 |
| 사운드 디자이너 | 200만원 | 2개월 | 400만원 |
| QA 테스터 | 350만원 | 2개월 | 700만원 |
| **인건비 합계** | - | - | **1억 2,700만원** |

### 개발 비용
| 항목 | 비용 |
|------|------|
| Expo EAS (4개월) | 40만원 |
| Adobe CC (5개) | 60만원 |
| 개발 장비 (Mac 2대) | 800만원 |
| 테스트 기기 (10대) | 500만원 |
| Sentry (4개월) | 10만원 |
| Firebase (무료 플랜) | 0원 |
| 기타 도구/에셋 | 100만원 |
| **개발비 합계** | **1,510만원** |

### 마케팅 비용
| 항목 | 비용 |
|------|------|
| ASO (앱스토어 최적화) | 200만원 |
| 인플루언서 마케팅 | 800만원 |
| 페이스북/구글 광고 | 1,500만원 |
| 프로모션 영상 제작 | 300만원 |
| 커뮤니티 운영 | 200만원 |
| **마케팅비 합계** | **3,000만원** |

### 예비비
| 항목 | 비용 |
|------|------|
| 긴급 상황 대응 | 500만원 |
| 외주 작업 | 300만원 |
| **예비비 합계** | **800만원** |

### **총 예산: 약 1억 8,010만원**

**Unity 대비 절감액**: 약 1억 1,000만원 (38% 절감)
- Unity Pro 라이선스 불필요
- 개발 기간 단축 (6개월 → 4개월)
- 오픈소스 생태계 활용

---

## 🎯 마일스톤 및 체크포인트

### M1: 프로토타입 완성 (4주차)
**성공 기준**:
- [ ] 5×5 그리드에서 생존자 이동 가능
- [ ] 기본 상태 시스템 작동
- [ ] 10개 레벨 플레이 가능
- [ ] 60 FPS 유지

**검증 방법**: 내부 플레이테스트 (5명, 각 30분)

### M2: 알파 버전 (8주차)
**성공 기준**:
- [ ] 모든 핵심 기능 구현 완료
- [ ] 30개 레벨 플레이 가능
- [ ] 기본 UI/UX 완성
- [ ] 사운드 50% 완성
- [ ] 크래시율 5% 이하

**검증 방법**: 
- 내부 테스트 (10명, 각 1시간)
- TestFlight/내부 테스트 (20명)

### M3: 베타 버전 (12주차)
**성공 기준**:
- [ ] 50개 레벨 완성
- [ ] 모든 UI/UX 폴리싱 완료
- [ ] 사운드 100% 완성
- [ ] 크래시율 2% 이하
- [ ] 평균 60 FPS 유지

**검증 방법**:
- 베타 테스트 (50-100명)
- TestFlight/Google Play 내부 테스트

### M4: 출시 (16주차)
**성공 기준**:
- [ ] 모든 주요 버그 수정
- [ ] 스토어 리스팅 완료
- [ ] 크래시율 1% 이하
- [ ] 앱스토어 심사 통과

**검증 방법**: 
- 스토어 출시
- 모니터링 대시보드 운영

---

## 📊 KPI 및 성공 지표

### 개발 단계 KPI

#### 프로토타입 단계 (Week 4)
- [ ] 핵심 게임 루프 완성도 90%+
- [ ] 내부 플레이테스터 만족도 8/10 이상
- [ ] 60 FPS 달성

#### 알파 단계 (Week 8)
- [ ] 기능 완성도 80%+
- [ ] 플레이테스트 참여율 90%+
- [ ] 크리티컬 버그 0개

#### 베타 단계 (Week 12)
- [ ] 기능 완성도 95%+
- [ ] 베타 테스터 D7 리텐션 30%+
- [ ] 평균 플레이 시간 12분+

### 출시 후 KPI

#### 1주차 목표
- 다운로드: 5,000+
- D1 리텐션: 35%+
- 크래시율: 1.5% 이하
- 평균 평점: 4.0+ / 5.0

#### 1개월차 목표
- 다운로드: 50,000+
- D7 리텐션: 25%+
- D30 리텐션: 15%+
- 평균 세션 시간: 12분+
- 레벨 10 완료율: 60%+

#### 3개월차 목표
- 다운로드: 200,000+
- DAU: 10,000+
- 평균 평점: 4.3+ / 5.0
- 광고 수익: $5,000+/월

---

## 🛡️ React Native 성능 최적화 전략

### 1. 렌더링 최적화
```typescript
// 생존자 컴포넌트 메모이제이션
const Survivor = React.memo(({ survivor, onMove }) => {
  // 불필요한 리렌더링 방지
}, (prev, next) => {
  return prev.survivor.id === next.survivor.id && 
         prev.survivor.position === next.survivor.position;
});

// 그리드 최적화
const Grid = () => {
  const tiles = useMemo(() => generateTiles(), [level]);
  
  return (
    <FlatList
      data={tiles}
      renderItem={renderTile}
      keyExtractor={(item) => item.id}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
};
```

### 2. 애니메이션 최적화
```typescript
// Reanimated 3 사용 (UI 쓰레드에서 실행)
const animatedStyle = useAnimatedStyle(() => {
  return {
    transform: [
      {
        translateX: withSpring(position.value.x * TILE_SIZE, {
          damping: 20,
          stiffness: 90,
        }),
      },
      {
        translateY: withSpring(position.value.y * TILE_SIZE, {
          damping: 20,
          stiffness: 90,
        }),
      },
    ],
  };
});
```

### 3. 상태 관리 최적화
```typescript
// Zustand를 사용한 효율적인 상태 관리
const useGameStore = create((set) => ({
  survivors: [],
  resources: {},
  
  // 선택적 구독으로 불필요한 리렌더링 방지
  moveSurvivor: (id, position) => 
    set((state) => ({
      survivors: state.survivors.map(s => 
        s.id === id ? { ...s, position } : s
      )
    })),
}));

// 필요한 상태만 구독
const position = useGameStore((state) => 
  state.survivors.find(s => s.id === survivorId)?.position
);
```

### 4. 이미지 최적화
```typescript
// WebP 포맷 사용, 적절한 크기로 압축
<Image
  source={require('./assets/survivor.webp')}
  style={styles.survivor}
  resizeMode="contain"
  // 캐싱 활성화
  cache="force-cache"
/>

// 필요시 react-native-fast-image 사용
<FastImage
  source={{ uri: imageUrl }}
  style={styles.image}
  resizeMode={FastImage.resizeMode.contain}
/>
```

### 5. 메모리 관리
```typescript
// useEffect 클린업으로 메모리 누수 방지
useEffect(() => {
  const timer = setInterval(() => {
    updateTimer();
  }, 1000);
  
  return () => clearInterval(timer); // 클린업
}, []);

// 큰 데이터는 useMemo로 캐싱
const levelData = useMemo(() => 
  parseLevelData(currentLevel), 
  [currentLevel]
);
```

---

## 🔍 리스크 관리

### 주요 리스크 및 대응 방안

#### 1. React Native 학습 곡선
**위험도**: 낮음

**대응 방안**:
- 팀원 중 최소 1명은 React Native 경험자 채용
- 첫 2주간 집중 학습 및 프로토타입 제작
- Expo 활용으로 네이티브 설정 복잡도 제거

#### 2. 성능 이슈
**위험도**: 중간

**대응 방안**:
- 초기부터 Reanimated 3 사용 (UI 쓰레드)
- 주간 성능 프로파일링
- 저사양 기기(Android 5.0, iPhone 8)에서 우선 테스트
- 필요시 react-native-skia로 복잡한 그래픽 처리
- Hermes 엔진 활성화로 시작 시간 단축

#### 3. 앱스토어 심사 거부
**위험도**: 낮음

**대응 방안**:
- React Native는 Facebook/Instagram에서 사용 (검증된 기술)
- Apple/Google 가이드라인 철저히 준수
- TestFlight 사전 배포로 문제 조기 발견
- 심사 거부 시 48시간 내 수정 및 재제출

#### 4. 크로스 플랫폼 버그
**위험도**: 중간

**대응 방안**:
- 개발 초기부터 iOS/Android 동시 테스트
- Platform.select() 활용한 플랫폼별 분기 처리
- Expo Dev Client로 네이티브 모듈 테스트
- 각 플랫폼별 QA 체크리스트 운영

---

## 📱 출시 전략

### 소프트 런치 전략

#### 1단계: 필리핀 출시 (Week 17)
**목표**:
- 기술적 안정성 검증
- AdMob 광고 수익화 테스트
- 초기 KPI 데이터 수집

**기간**: 1주
**예산**: 30만원 (소규모 UA)

**React Native 장점 활용**:
- Expo OTA 업데이트로 즉각적인 버그 수정
- Firebase Remote Config로 A/B 테스트
- 앱 재배포 없이 실시간 밸런싱 조정

#### 2단계: 동남아 확대 (Week 18)
**국가**: 베트남, 태국, 인도네시아
**목표**:
- 스케일링 테스트
- 리텐션 곡선 확인
- 광고 수익 검증

**기간**: 1주
**예산**: 100만원

#### 3단계: 글로벌 출시 (Week 19+)
**주요 국가**: 한국, 미국, 일본
**목표**:
- 대규모 유저 확보
- 브랜드 인지도 구축

**예산**: 2,000만원

---

## 💰 수익화 전략

### Phase 1: 광고 중심 (출시 ~3개월)

#### 리워드 광고 (AdMob)
```typescript
// React Native AdMob 통합
import { RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';

const rewarded = RewardedAd.createForAdRequest('ad-unit-id');

// 광고 시청 후 보상
rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
  // 자원 2배 보상
  givePlayerResources(reward.amount * 2);
});
```

**적용 위치**:
- 레벨 실패 시 부활 기회 (광고 시청)
- 추가 자원 획득 (1일 5회 제한)
- 힌트 보기 (광고 시청)

**예상 수익**:
- eCPM: $15-20
- 시청률: 30-40% (퍼즐 게임 평균)
- 월 수익: $3,000-5,000 (DAU 5,000 기준)

### Phase 2: 프리미엄 옵션 (3-6개월)

#### 광고 제거 IAP
```typescript
import * as InAppPurchases from 'expo-in-app-purchases';

// 일회성 구매
const PRODUCTS = {
  removeAds: 'com.islandrescue.removeads',
  starterPack: 'com.islandrescue.starterpack',
};

// 구매 처리
const handlePurchase = async (productId) => {
  const { results } = await InAppPurchases.purchaseItemAsync(productId);
  // 서버에 영수증 검증
};
```

**가격 정책**:
- 광고 제거: ₩4,900 (영구)
- 스타터 팩: ₩2,200 (자원 대량)
- 프리미엄 패스: ₩9,900/월 (독점 스킨 + 자원)

**예상 전환율**: 2-3%
**월 예상 수익**: $10,000-15,000 (DAU 10,000 기준)

---

## 🎨 UI/UX 구현 상세

### 디자인 시스템

#### 색상 토큰 (Tailwind 스타일)
```typescript
export const colors = {
  primary: {
    50: '#E0F2FE',
    100: '#BAE6FD',
    500: '#0EA5E9',
    600: '#0284C7',
    700: '#0369A1',
  },
  success: {
    50: '#D1FAE5',
    500: '#10B981',
    600: '#059669',
  },
  warning: {
    50: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
  },
  danger: {
    50: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
  },
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    500: '#6B7280',
    900: '#111827',
  },
};
```

#### 타이포그래피
```typescript
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
};
```

### 애니메이션 패턴

#### 1. 생존자 이동
```typescript
const MoveAnimation: React.FC = () => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withSpring(translateX.value, CONFIG.spring) },
      { translateY: withSpring(translateY.value, CONFIG.spring) },
    ],
  }));
  
  return (
    <Animated.View style={animatedStyle}>
      <SurvivorSprite />
    </Animated.View>
  );
};
```

#### 2. 버튼 인터랙션
```typescript
const AnimatedButton: React.FC = ({ onPress, children }) => {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1);
  };
  
  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </Pressable>
  );
};
```

#### 3. 상태바 애니메이션
```typescript
const HealthBar: React.FC<{ health: number }> = ({ health }) => {
  const width = useSharedValue(health);
  
  useEffect(() => {
    width.value = withTiming(health, { duration: 300 });
  }, [health]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
    backgroundColor: interpolateColor(
      width.value,
      [0, 30, 50, 100],
      ['#EF4444', '#F59E0B', '#F59E0B', '#10B981']
    ),
  }));
  
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bar, animatedStyle]} />
    </View>
  );
};
```

---

## 🧪 테스트 전략

### 1. 유닛 테스트 (Jest)
```typescript
// 게임 로직 테스트
describe('Survivor Movement', () => {
  it('should move survivor to adjacent tile', () => {
    const survivor = { id: 1, position: { x: 0, y: 0 } };
    const newPosition = { x: 1, y: 0 };
    
    const moved = moveSurvivor(survivor, newPosition);
    
    expect(moved.position).toEqual(newPosition);
  });
  
  it('should not move to obstacle tile', () => {
    const survivor = { id: 1, position: { x: 0, y: 0 } };
    const obstaclePosition = { x: 1, y: 0 };
    
    const moved = moveSurvivor(survivor, obstaclePosition);
    
    expect(moved.position).toEqual(survivor.position);
  });
});
```

### 2. 컴포넌트 테스트 (React Native Testing Library)
```typescript
import { render, fireEvent } from '@testing-library/react-native';

describe('ResourceButton', () => {
  it('should consume resource when pressed', () => {
    const onUse = jest.fn();
    const { getByText } = render(
      <ResourceButton resource="food" count={5} onUse={onUse} />
    );
    
    fireEvent.press(getByText('Use'));
    
    expect(onUse).toHaveBeenCalledWith('food');
  });
});
```

### 3. E2E 테스트 (Detox)
```typescript
describe('Level Completion Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });
  
  it('should complete level 1', async () => {
    await element(by.id('level-1')).tap();
    
    // 생존자 이동
    await element(by.id('survivor-1')).tap();
    await element(by.id('tile-4-4')).tap();
    
    // 승리 화면 확인
    await expect(element(by.text('Victory!'))).toBeVisible();
  });
});
```

### 4. 성능 테스트
```typescript
// Flashlight 프로파일링
import { measurePerformance } from '@shopify/react-native-performance';

measurePerformance('level_load', async () => {
  await loadLevel(1);
});

// 메모리 모니터링
const memoryMonitor = setInterval(() => {
  const usage = performance.memory.usedJSHeapSize / 1024 / 1024;
  console.log(`Memory usage: ${usage.toFixed(2)} MB`);
}, 5000);
```

---

## 🚀 CI/CD 파이프라인

### GitHub Actions 워크플로우

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run linter
        run: npm run lint
      
      - name: Type check
        run: npm run type-check

  build-ios:
    needs: test
    runs-on: macos-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Build iOS
        run: eas build --platform ios --non-interactive

  build-android:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Build Android
        run: eas build --platform android --non-interactive
```

### Expo EAS Build 설정

```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "distribution": "store",
      "autoIncrement": true,
      "env": {
        "ENVIRONMENT": "production"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "developer@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD1234"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-api-key.json",
        "track": "production"
      }
    }
  }
}
```

---

## 📚 문서화 계획

### 필수 문서

#### 1. 게임 디자인 문서 (GDD)
**도구**: Notion
**업데이트 주기**: 주 1회
**포함 내용**:
- 게임 컨셉 및 메커니즘
- 레벨 디자인 가이드
- 밸런싱 데이터
- 캐릭터 정보

#### 2. 기술 문서
**도구**: GitHub Wiki
**포함 내용**:
- 시스템 아키텍처
- API 문서 (TypeDoc)
- 컴포넌트 카탈로그 (Storybook)
- 코딩 컨벤션
- 빌드 가이드

#### 3. React Native 개발 가이드
```markdown
# 프로젝트 셋업

## 요구사항
- Node.js 18+
- npm 9+
- Expo CLI
- iOS: Xcode 14+, CocoaPods
- Android: Android Studio, JDK 11

## 설치
npm install
npx expo prebuild
npm run ios # or npm run android

## 주요 명령어
npm start           # Expo 개발 서버
npm test            # Jest 테스트
npm run lint        # ESLint
npm run type-check  # TypeScript 체크
eas build           # 프로덕션 빌드
```

#### 4. 컴포넌트 문서 (Storybook)
```typescript
// Survivor.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import Survivor from './Survivor';

const meta: Meta<typeof Survivor> = {
  title: 'Game/Survivor',
  component: Survivor,
  argTypes: {
    type: {
      control: 'select',
      options: ['engineer', 'doctor', 'chef', 'child'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Survivor>;

export const Engineer: Story = {
  args: {
    type: 'engineer',
    health: 100,
    energy: 80,
  },
};

export const LowHealth: Story = {
  args: {
    type: 'doctor',
    health: 25,
    energy: 50,
  },
};
```

---

## 🎓 팀 온보딩 계획

### React Native 온보딩 (1주)

#### Day 1: 환경 설정
- [ ] Node.js, Expo CLI 설치
- [ ] Xcode, Android Studio 설정
- [ ] 프로젝트 클론 및 빌드 성공
- [ ] 개발 서버 실행 확인

**학습 자료**:
- React Native 공식 문서
- Expo 시작 가이드
- TypeScript 기초 (필요시)

#### Day 2-3: 기본 개념 학습
- [ ] React Native 컴포넌트 이해
- [ ] 스타일링 (StyleSheet)
- [ ] 네비게이션 (React Navigation)
- [ ] 상태 관리 (Zustand)

**실습 과제**:
- 간단한 화면 컴포넌트 제작
- 버튼 클릭 이벤트 처리
- 상태 업데이트 및 렌더링

#### Day 4-5: 프로젝트 코드베이스 이해
- [ ] 프로젝트 구조 설명
- [ ] 게임 로직 아키텍처
- [ ] 컴포넌트 카탈로그 탐색
- [ ] 첫 PR 제출 (간단한 버그 수정)

**페어 프로그래밍**:
- 시니어 개발자와 2시간 세션
- 실제 기능 구현 경험

---

## 🔄 포스트 런치 로드맵

### Month 1: 안정화
**Week 1-2**:
- [ ] 크리티컬 버그 핫픽스 (Expo OTA)
- [ ] 유저 피드백 수집 및 분석
- [ ] Firebase Analytics 대시보드 구축
- [ ] 첫 밸런싱 패치

**Week 3-4**:
- [ ] 레벨 10개 추가 (51-60)
- [ ] 일일 미션 시스템 구현
- [ ] 푸시 알림 통합
- [ ] 성능 최적화 패치

**예상 작업량**: 각 개발자 주 20-30시간

### Month 2: 콘텐츠 확장
- [ ] 새로운 생존자 추가 (소방관)
- [ ] 타임 어택 모드
- [ ] 친구 초대 시스템
- [ ] 시즌 이벤트 (여름 테마)

### Month 3: 수익화 강화
- [ ] 인앱 구매 출시
- [ ] 프리미엄 패스 시스템
- [ ] 캐릭터 스킨 상점
- [ ] A/B 테스트 (가격, UI)

---

## ✅ 출시 체크리스트

### 기술적 준비
- [ ] 프로덕션 빌드 생성 및 테스트
- [ ] 크래시율 1% 미만 달성
- [ ] 60 FPS 유지 확인
- [ ] 메모리 누수 없음 확인
- [ ] 앱 크기 60MB 이하
- [ ] 로딩 시간 3초 이내

### 콘텐츠 준비
- [ ] 50개 레벨 완성 및 테스트
- [ ] 모든 사운드 에셋 통합
- [ ] 튜토리얼 완성 및 테스트
- [ ] 다국어 번역 완료 (한/영/일)

### 스토어 준비
- [ ] 앱 아이콘 (1024×1024)
- [ ] 스크린샷 (각 플랫폼 5개)
- [ ] 앱 설명 작성
- [ ] 프로모션 비디오 (30초)
- [ ] 개인정보처리방침 페이지
- [ ] 고객 지원 이메일

### 수익화 준비
- [ ] AdMob 계정 및 광고 단위 설정
- [ ] 테스트 광고로 통합 검증
- [ ] 인앱 구매 상품 등록 (향후)
- [ ] 영수증 검증 서버 구축 (향후)

### 분석 준비
- [ ] Firebase Analytics 이벤트 설정
- [ ] Crashlytics 통합 검증
- [ ] 커스텀 대시보드 구축
- [ ] 알림 설정 (크래시율, 리텐션)

---

## 🌟 React Native 생태계 활용

### 커뮤니티 리소스

#### 공식 문서
- [React Native 공식 문서](https://reactnative.dev/)
- [Expo 문서](https://docs.expo.dev/)
- [Reanimated 문서](https://docs.swmansion.com/react-native-reanimated/)

#### 학습 자료
- **무료 강의**:
  - React Native School (YouTube)
  - William Candillon (YouTube)
  - Expo 공식 튜토리얼
  
- **유료 강의**:
  - "The Complete React Native + Hooks Course" (Udemy)
  - "React Native: Advanced Concepts" (Udemy)

#### 커뮤니티
- **Discord**: Reactiflux, Expo Community
- **Reddit**: r/reactnative
- **Stack Overflow**: #react-native 태그

### 오픈소스 참고 프로젝트

1. **Ordinary Puzzles**
   - GitHub: [github.com/mmazzarolo/ordinary-puzzles-app](https://github.com/mmazzarolo/ordinary-puzzles-app)
   - 학습 포인트: 그리드 게임 구현, 상태 관리

2. **React Native Games**
   - GitHub 검색: "react-native puzzle game"
   - 2D 게임 애니메이션 패턴 참고

---

## 📊 성공 지표 대시보드

### Firebase Analytics 커스텀 이벤트
```typescript
import analytics from '@react-native-firebase/analytics';

// 레벨 시작
analytics().logEvent('level_start', {
  level_number: 1,
  difficulty: 'easy',
});

// 레벨 완료
analytics().logEvent('level_complete', {
  level_number: 1,
  completion_time: 85,
  stars: 3,
  moves_used: 12,
});

// 자원 사용
analytics().logEvent('resource_used', {
  resource_type: 'food',
  survivor: 'chef',
  level_number: 5,
});

// 광고 시청
analytics().logEvent('ad_watched', {
  ad_type: 'rewarded',
  placement: 'level_failed',
  reward_granted: true,
});
```

### 주요 추적 지표

#### 유저 획득
- **일일 신규 설치수** (DAI)
- **채널별 유입** (오가닉 vs 페이드)
- **CPI** (Cost Per Install)

#### 참여도
- **DAU, WAU, MAU**
- **평균 세션 길이**: 목표 12분+
- **세션 빈도**: 목표 3회/일
- **레벨 완료율**: 각 레벨별 추적

#### 리텐션
- **D1 리텐션**: 목표 35%+
- **D7 리텐션**: 목표 25%+
- **D30 리텐션**: 목표 15%+

#### 수익화
- **광고 eCPM**: 목표 $15-20
- **광고 시청률**: 목표 30-40%
- **일일 광고 수익**: 추적
- **ARPDAU** (Average Revenue Per DAU)

---

## 🎯 최종 요약

### React Native를 선택한 이유 (재강조)

✅ **개발 속도**: Unity 대비 40% 빠른 출시 (4개월 vs 6개월)  
✅ **비용 절감**: 38% 예산 절감 (1.8억 vs 2.9억)  
✅ **팀 역량**: React 개발자라면 1-2주 내 생산성 확보  
✅ **검증된 기술**: Facebook, Instagram 등 메이저 앱 사용  
✅ **우수한 성능**: 60 FPS 달성 가능, 퍼즐 게임에 충분  
✅ **수익화**: AdMob, IAP 완벽 지원  
✅ **실제 성공사례**: "Quick Tap Me!" 1주 개발, "Ordinary Puzzles" 상용화

### 핵심 성공 요인

1. **빠른 MVP 출시**: 3개월 내 프로토타입 → 베타 → 출시
2. **지속적 최적화**: Expo OTA로 즉각적인 버그 수정
3. **데이터 기반 개선**: Firebase Analytics로 사용자 행동 분석
4. **커뮤니티 활용**: React Native 생태계의 방대한 리소스
5. **수익화 최적화**: 리워드 광고 + IAP 하이브리드 전략

### 다음 단계

1. ✅ **팀 구성**: React/React Native 개발자 2명 채용
2. ✅ **환경 셋업**: 첫 주 내 개발 환경 구축
3. ✅ **프로토타입**: 4주 내 플레이 가능한 프로토타입
4. ✅ **베타 출시**: 12주 내 TestFlight/내부 테스트
5. ✅ **정식 출시**: 16주 내 앱스토어 출시

---

**문서 버전**: v2.0 (React Native)  
**최종 수정일**: 2025년 1월  
**기술 스택**: React Native + Expo  
**예상 출시**: 4개월 후  
**총 예산**: 1억 8,010만원

> "React Native로 빠르게 출시하고, 데이터를 보며 개선하자. 완벽한 첫 출시보다 빠른 iteration이 성공의 열쇠다." 🚀