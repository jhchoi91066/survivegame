# Brain Games Collection - 수정 계획 로드맵

**작성일**: 2025-11-29
**목표**: 안정적인 프로덕션 배포 준비

---

## 🔴 CRITICAL - 즉시 수정 필요 (1-3일)

### 보안 취약점

- [x] **[C1] Leaderboard 점수 조작 방지** ✅
  - **우선순위**: P0 (최우선)
  - **예상 시간**: 4시간
  - **영향도**: 리더보드 무결성 완전 붕괴 가능
  - **영향 파일**:
    - `docs/supabase-schema.sql`
    - `src/screens/LeaderboardScreen.tsx`
  - **작업 내용**:
    1. Leaderboard INSERT/UPDATE RLS 정책 삭제
    2. 클라이언트 직접 접근 차단
    3. 서버 측 검증 함수 생성
  ```sql
  -- docs/supabase-schema.sql
  DROP POLICY "Users can insert their own leaderboard entries" ON leaderboards;
  DROP POLICY "Users can update their own leaderboard entries" ON leaderboards;

  CREATE FUNCTION submit_verified_score(
    p_game_type game_type,
    p_difficulty difficulty_type,
    p_score INTEGER,
    p_game_session_token TEXT -- 게임 세션 검증
  ) RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
  BEGIN
    -- 점수 범위 검증
    -- 세션 토큰 검증
    -- game_records 업데이트
    -- leaderboards 자동 갱신 (트리거)
  END;
  $$;
  ```

- [x] **[C2] search_path 보안 취약점 수정** ✅
  - **우선순위**: P0
  - **예상 시간**: 1시간
  - **영향도**: 스키마 인젝션 공격 가능
  - **영향 파일**: `docs/supabase-schema.sql`
  - **작업 내용**:
  ```sql
  -- 3개 함수 수정
  ALTER FUNCTION public.handle_new_user() SET search_path = public;
  ALTER FUNCTION public.upsert_game_record(...) SET search_path = public;
  ALTER FUNCTION public.update_daily_leaderboard(...) SET search_path = public;
  ```

- [x] **[C3] Game Records 점수 검증 추가** ✅
  - **우선순위**: P0
  - **예상 시간**: 6시간
  - **영향도**: 클라이언트가 임의 점수 제출 가능
  - **영향 파일**:
    - `src/utils/cloudSync.ts`
    - `docs/supabase-schema.sql`
  - **작업 내용**:
    1. game_records INSERT/UPDATE RLS 정책 제한
    2. 검증 함수 통해서만 업데이트 허용
    3. 점수 범위, 시간, 난이도별 한계치 검증

### 데이터 손실 방지

- [x] **[C4] Zustand Persistence 적용** ✅
  - **우선순위**: P0
  - **예상 시간**: 3시간
  - **영향도**: 앱 재시작 시 모든 게임 기록 소실
  - **영향 파일**:
    - `src/game/shared/store.ts`
    - `src/game/flipmatch/store.ts`
    - `src/game/mathrush/store.ts`
    - `src/game/spatialmemory/store.ts`
    - `src/game/stroop/store.ts`
  - **작업 내용**:
  ```typescript
  // src/game/shared/store.ts
  import { persist, createJSONStorage } from 'zustand/middleware';
  import AsyncStorage from '@react-native-async-storage/async-storage';

  export const useGameStore = create<GameStore>()(
    persist(
      (set, get) => ({
        globalStats: initialGlobalStats,
        // ... 기존 로직
      }),
      {
        name: 'game-storage',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          globalStats: state.globalStats
        }),
        version: 1,
      }
    )
  );
  ```

- [x] **[C5] statsManager.ts 제거 및 통합** ✅
  - **우선순위**: P0 (C4와 함께 진행)
  - **예상 시간**: 4시간
  - **영향도**: 이중 상태 관리로 데이터 불일치
  - **영향 파일**:
    - `src/utils/statsManager.ts` (삭제)
    - 모든 게임 화면 (statsManager 호출 제거)
  - **작업 내용**:
    1. AsyncStorage 직접 호출 코드 제거
    2. Zustand persist middleware로 자동 관리
    3. 각 게임 화면에서 `loadStats()`, `saveStats()` 호출 제거

### 게임 로직 치명적 버그

- [x] **[C6] Spatial Memory 메모리 누수 수정** ✅
  - **우선순위**: P0
  - **예상 시간**: 2시간
  - **영향도**: 장시간 플레이 시 앱 크래시
  - **영향 파일**: `src/game/spatialmemory/store.ts`
  - **작업 내용**:
  ```typescript
  interface SpatialMemoryStore {
    // ... 기존 필드
    activeTimers: NodeJS.Timeout[];
    cleanup: () => void;
  }

  // store.ts
  startRound: () => {
    const state = get();
    state.cleanup(); // 이전 타이머 정리

    const flashInterval = setInterval(() => {
      // ... 기존 로직
    }, speed);

    set((s) => ({
      activeTimers: [...s.activeTimers, flashInterval]
    }));
  },

  cleanup: () => {
    const { activeTimers } = get();
    activeTimers.forEach(timer => clearInterval(timer));
    set({ activeTimers: [] });
  },

  // 컴포넌트에서
  useEffect(() => {
    return () => {
      useSpatialMemoryStore.getState().cleanup();
    };
  }, []);
  ```

- [x] **[C7] Flip Match Race Condition 수정** ✅
  - **우선순위**: P0
  - **예상 시간**: 2시간
  - **영향도**: 3장 이상 카드 뒤집힘 버그
  - **영향 파일**: `src/game/flipmatch/store.ts`
  - **작업 내용**:
  ```typescript
  flipCard: (cardId) => {
    set((state) => {
      // 이미 2장이 뒤집혀 있으면 무시
      if (state.flippedCards.length >= 2) return state;

      const card = state.cards.find(c => c.id === cardId);
      if (!card || card.isFlipped || card.isMatched) return state;

      const newCards = state.cards.map(c =>
        c.id === cardId ? { ...c, isFlipped: true } : c
      );

      const newFlippedCards = [...state.flippedCards, cardId];

      // 2장이 되면 800ms 후 자동 체크
      if (newFlippedCards.length === 2) {
        setTimeout(() => {
          const currentState = get();
          // 여전히 2장이 뒤집혀 있는지 재확인
          if (currentState.flippedCards.length === 2) {
            currentState.checkMatch();
          }
        }, 800);
      }

      return {
        ...state,
        cards: newCards,
        flippedCards: newFlippedCards,
        moves: state.moves + 1,
      };
    });
  },
  ```

---

## 🟠 HIGH - 1주일 내 수정

### 게임 로직 주요 버그

- [x] **[H1] 타이머 일시정지 미작동 수정** ✅
  - **우선순위**: P1
  - **예상 시간**: 1시간
  - **영향 파일**:
    - `src/screens/MathRushGame.tsx`
    - `src/screens/StroopTestGame.tsx`
  - **작업 내용**:
  ```typescript
  // [H1] Timer pause fix - check gameStatus inside interval
  useEffect(() => {
    if (gameStatus === 'playing') {
      const interval = setInterval(() => {
        // Re-check current state to prevent timer ticking during pause transition
        const currentState = useMathRushStore.getState();
        if (currentState.gameStatus === 'playing') {
          decrementTime();
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameStatus, decrementTime]);
  ```

- [x] **[H2] 타이머 정확성 개선** ✅
  - **우선순위**: P1
  - **예상 시간**: 4시간
  - **영향도**: 게임 시간이 실제보다 3-5초 길어짐
  - **영향 파일**:
    - `src/game/mathrush/store.ts`
    - `src/game/stroop/store.ts`
    - `src/screens/MathRushGame.tsx`
    - `src/screens/StroopTestGame.tsx`
  - **작업 내용**:
  ```typescript
  // Store에 타이머 추적 필드 추가
  interface GameStore {
    gameStartTime: number | null;
    pausedAt: number | null;
    totalPausedTime: number;
    timeLimit: number;
    updateTimeRemaining: () => void; // [H2] Date.now() based timer
  }

  // Date.now() 기반 정확한 타이머 구현
  updateTimeRemaining: () => {
    const { gameStartTime, totalPausedTime, timeLimit, gameStatus } = get();
    if (gameStatus !== 'playing' || !gameStartTime) return;

    const elapsed = Math.floor((Date.now() - gameStartTime - totalPausedTime) / 1000);
    const remaining = Math.max(0, timeLimit - elapsed);
    set({ timeRemaining: remaining });

    if (remaining <= 0) {
      set({ gameStatus: 'finished' });
    }
  },

  // 컴포넌트에서 100ms마다 체크
  useEffect(() => {
    if (gameStatus === 'playing') {
      const interval = setInterval(() => {
        const currentState = useGameStore.getState();
        if (currentState.gameStatus === 'playing') {
          updateTimeRemaining();
        }
      }, 100); // 100ms마다 체크
      return () => clearInterval(interval);
    }
  }, [gameStatus, updateTimeRemaining]);
  ```

### 성능 최적화

- [x] **[H3] Zustand 셀렉터 패턴 도입** ✅
  - **우선순위**: P1
  - **예상 시간**: 6시간
  - **영향도**: 불필요한 리렌더링으로 FPS 30대 저하
  - **영향 파일**:
    - `src/screens/MathRushGame.tsx`
    - `src/screens/StroopTestGame.tsx`
    - `src/screens/FlipMatchGame.tsx`
    - `src/screens/SpatialMemoryGame.tsx`
  - **작업 내용**:
  ```typescript
  // [H3] Use shallow comparison to prevent unnecessary re-renders
  import { useShallow } from 'zustand/react/shallow';

  const {
    currentProblem, score, timeRemaining, gameStatus, lives, difficulty,
    answerProblem, updateTimeRemaining, startGame, resetGame, pauseGame, resumeGame
  } = useGameStore(
    useShallow(state => ({
      currentProblem: state.currentProblem,
      score: state.score,
      timeRemaining: state.timeRemaining,
      gameStatus: state.gameStatus,
      lives: state.lives,
      difficulty: state.difficulty,
      answerProblem: state.answerProblem,
      updateTimeRemaining: state.updateTimeRemaining,
      startGame: state.startGame,
      resetGame: state.resetGame,
      pauseGame: state.pauseGame,
      resumeGame: state.resumeGame,
    }))
  );
  ```

- [x] **[H4] 중복 set() 호출 제거** ✅
  - **우선순위**: P1
  - **예상 시간**: 2시간
  - **영향 파일**: `src/game/shared/store.ts`
  - **작업 내용**:
  ```typescript
  // [H4] Single set() call to prevent double render
  incrementTotalPlays: (game) => {
    set((state) => {
      const currentStats = state.globalStats.gamesStats[game];
      return {
        globalStats: {
          ...state.globalStats,
          totalGamesPlayed: state.globalStats.totalGamesPlayed + 1,
          gamesStats: {
            ...state.globalStats.gamesStats,
            [game]: {
              ...currentStats,
              totalPlays: currentStats.totalPlays + 1,
              lastPlayed: Date.now(),
            },
          },
        },
      };
    });
  },

  addPlayTime: (game, seconds) => {
    set((state) => {
      const currentStats = state.globalStats.gamesStats[game];
      return {
        globalStats: {
          ...state.globalStats,
          totalPlayTime: state.globalStats.totalPlayTime + seconds,
          gamesStats: {
            ...state.globalStats.gamesStats,
            [game]: {
              ...currentStats,
              totalPlayTime: currentStats.totalPlayTime + seconds,
            },
          },
        },
      };
    });
  },
  ```

### 데이터베이스 최적화

- [x] **[H5] 누락된 인덱스 추가** ✅
  - **우선순위**: P1
  - **예상 시간**: 1시간
  - **영향도**: 리더보드 조회 느림
  - **적용 완료**: Migration `add_performance_indexes` 생성
  - **추가된 인덱스**:
    - `idx_leaderboards_user_id` - 사용자별 리더보드 조회
    - `idx_game_records_flip_match_leaderboard` - Flip Match 리더보드 (시간 기준)
    - `idx_game_records_score_leaderboard` - Math Rush/Stroop 리더보드 (점수 기준)
    - `idx_game_records_level_leaderboard` - Spatial Memory 리더보드 (레벨 기준)
    - `idx_multiplayer_game_states_room_user` - 멀티플레이어 룸 조회
    - `idx_game_records_updated_at` - 최근 플레이 기록 조회

- [x] **[H6] 스키마-코드 불일치 수정** ✅
  - **우선순위**: P1
  - **예상 시간**: 1시간
  - **영향 파일**: `src/utils/cloudSync.ts`
  - **상태**: C3 작업에서 이미 수정 완료 (RPC 함수 사용)
  - **검증 완료**:
    - Database schema: `best_time`, `highest_level`, `high_score` ✅
    - RPC parameters: `p_best_time`, `p_highest_level`, `p_high_score` ✅
    - 모든 필드 이름이 데이터베이스 스키마와 정확히 일치
    total_play_time: stats.totalPlayTime,
    updated_at: new Date().toISOString(),
  })
  ```

### 에러 처리

- [x] **[H7] 네트워크 에러 처리 추가** ✅
  - **우선순위**: P1
  - **예상 시간**: 4시간
  - **영향 파일**:
    - `src/screens/MathRushGame.tsx`
    - `src/screens/StroopTestGame.tsx`
    - `src/screens/FlipMatchGame.tsx`
    - `src/screens/SpatialMemoryGame.tsx`
  - **적용 완료**: 모든 게임 화면에 Toast 에러 처리 추가
  - **구현 내용**:
    - Toast import 추가
    - uploadGameStats 호출을 try-catch로 래핑
    - 실패 시 사용자에게 Toast 메시지 표시
    - 로컬 데이터는 Zustand persist로 안전하게 보존

- [x] **[H8] LoginScreen 에러 처리** ✅
  - **우선순위**: P1
  - **예상 시간**: 1시간
  - **영향 파일**: `src/screens/LoginScreen.tsx`
  - **적용 완료**:
    - Toast import 추가
    - Google, Apple, 익명 로그인 모두에 에러 처리 추가
    - 사용자에게 명확한 에러 메시지 제공
  - **구현 내용**:
  ```typescript
  // [H8] Google 로그인 with error handling
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Google 로그인 실패:', error);
      Toast.show({
        type: 'error',
        text1: 'Google 로그인 실패',
        text2: error?.message || '다시 시도해주세요.',
        visibilityTime: 4000,
      });
      setLoading(false);
    }
  };
  // Apple, 익명 로그인도 동일한 패턴 적용
  ```

---

## 🟡 MEDIUM - 2주일 내 수정

### 접근성 개선

- [ ] **[M1] VoiceOver/TalkBack 지원 추가**
  - **우선순위**: P2
  - **예상 시간**: 2일
  - **영향 파일**: 모든 UI 컴포넌트
  - **작업 내용**:
  ```typescript
  // 모든 버튼에 추가
  <Pressable
    accessible={true}
    accessibilityRole="button"
    accessibilityLabel="게임 시작"
    accessibilityHint="탭하여 Flip Match 게임을 시작합니다"
  >

  // 게임 상태 알림
  <View
    accessible={true}
    accessibilityRole="text"
    accessibilityLabel={`남은 시간 ${timeRemaining}초`}
    accessibilityLiveRegion="polite"
  >
  ```

- [ ] **[M2] 동적 폰트 크기 적용**
  - **우선순위**: P2
  - **예상 시간**: 1일
  - **영향 파일**: `src/utils/theme.ts`, 모든 스타일
  - **작업 내용**:
  ```typescript
  // theme.ts
  export const scaleFontSize = (size: number): number => {
    const fontScale = useAccessibilityStore(state => state.fontScale);
    return size * fontScale;
  };

  // 사용
  fontSize: scaleFontSize(16),
  ```

- [ ] **[M3] 색상 대비 개선**
  - **우선순위**: P2
  - **예상 시간**: 4시간
  - **영향 파일**: `src/utils/theme.ts`
  - **작업 내용**:
  ```typescript
  // WCAG AA 기준 (4.5:1) 충족하도록 수정
  textTertiary: '#999999', // → '#666666' (대비 7:1)

  // 고대비 모드 실제 적용
  const textColor = highContrast
    ? colors.textPrimary
    : colors.textSecondary;
  ```

- [ ] **[M4] reduceMotion 실제 적용**
  - **우선순위**: P2
  - **예상 시간**: 1일
  - **영향 파일**: 모든 애니메이션 컴포넌트
  - **작업 내용**:
  ```typescript
  const reduceMotion = useAccessibilityStore(state => state.reduceMotion);

  const animationConfig = reduceMotion
    ? { duration: 0 }  // 애니메이션 비활성화
    : { duration: 200, easing: Easing.ease };
  ```

### UX 개선

- [ ] **[M5] 튜토리얼 개선**
  - **우선순위**: P2
  - **예상 시간**: 1일
  - **영향 파일**: `src/components/shared/Tutorial.tsx`
  - **작업 내용**:
    - 진행 상태 저장 (중단 후 재개 가능)
    - "이전" 버튼 추가
    - "다시 보지 않기" 옵션
    - 애니메이션으로 단계별 설명

- [ ] **[M6] 통일된 로딩 상태**
  - **우선순위**: P2
  - **예상 시간**: 4시간
  - **영향 파일**: 모든 비동기 작업 화면
  - **작업 내용**:
  ```typescript
  // 공통 로딩 컴포넌트
  const LoadingOverlay = ({ message = '로딩 중...' }) => (
    <View style={styles.overlay}>
      <ActivityIndicator size="large" />
      <Text accessible accessibilityLabel={message}>
        {message}
      </Text>
    </View>
  );

  // 사용
  {isLoading && <LoadingOverlay message="리더보드 불러오는 중..." />}
  ```

- [ ] **[M7] 반응형 레이아웃**
  - **우선순위**: P2
  - **예상 시간**: 2일
  - **영향 파일**: 모든 화면 컴포넌트
  - **작업 내용**:
  ```typescript
  // 반응형 유틸리티
  export const responsive = {
    width: (percentage: number) => (Dimensions.get('window').width * percentage) / 100,
    isTablet: () => Dimensions.get('window').width >= 768,
    isLandscape: () => Dimensions.get('window').width > Dimensions.get('window').height,
  };

  // 태블릿 레이아웃
  const columns = responsive.isTablet() ? 3 : 2;
  ```

### 난이도 밸런싱

- [ ] **[M8] Flip Match 난이도 조정**
  - **우선순위**: P2
  - **예상 시간**: 2시간
  - **영향 파일**: `src/game/flipmatch/types.ts`
  - **작업 내용**:
  ```typescript
  // Medium 난이도 완화
  const GRID_CONFIG = {
    easy: { rows: 4, cols: 4, time: 120 },   // 16장, 120초
    medium: { rows: 5, cols: 4, time: 100 }, // 20장, 100초 (24장→20장, 90초→100초)
    hard: { rows: 8, cols: 4, time: 60 },    // 32장, 60초
  };
  ```

- [ ] **[M9] Math Rush Hard 난이도 조정**
  - **우선순위**: P2
  - **예상 시간**: 1시간
  - **영향 파일**: `src/game/mathrush/store.ts`
  - **작업 내용**:
  ```typescript
  // Hard: 30초 → 45초, 곱셈 범위 12 → 10
  const TIME_LIMITS = {
    easy: 60,
    medium: 45,
    hard: 45, // 30 → 45
  };

  const MAX_MULTIPLY = isHard ? 10 : 9; // 12 → 10
  ```

- [ ] **[M10] Stroop Easy 난이도 조정**
  - **우선순위**: P2
  - **예상 시간**: 1시간
  - **영향 파일**: `src/game/stroop/store.ts`
  - **작업 내용**:
  ```typescript
  // Easy: 4색 → 5색 (모든 색이 옵션에 포함되는 문제 해결)
  const getColorsForDifficulty = (difficulty: Difficulty): string[] => {
    const allColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown'];
    switch (difficulty) {
      case 'easy': return allColors.slice(0, 5);   // 4 → 5
      case 'medium': return allColors.slice(0, 6);
      case 'hard': return allColors;
      default: return allColors.slice(0, 5);
    }
  };
  ```

### 버그 수정

- [ ] **[M11] Math Rush 나눗셈 옵션 생성 개선**
  - **우선순위**: P2
  - **예상 시간**: 2시간
  - **영향 파일**: `src/game/mathrush/store.ts`
  - **작업 내용**:
  ```typescript
  // 나눗셈용 옵션 생성 로직 분리
  const createDivisionOptions = (answer: number): number[] => {
    const options = new Set<number>([answer]);
    const range = Math.max(5, answer);

    while (options.size < 4) {
      const offset = Math.floor(Math.random() * range) + 1;
      const wrongAnswer = Math.random() > 0.5
        ? answer + offset
        : Math.max(1, answer - offset); // 최소 1
      options.add(wrongAnswer);
    }

    return Array.from(options).sort(() => Math.random() - 0.5);
  };
  ```

- [ ] **[M12] Spatial Memory 연속 타일 중복 방지**
  - **우선순위**: P2
  - **예상 시간**: 1시간
  - **영향 파일**: `src/game/spatialmemory/store.ts`
  - **작업 내용**:
  ```typescript
  const generateSequence = (length: number, maxTileId: number): number[] => {
    const sequence: number[] = [];
    let lastTile = -1;

    for (let i = 0; i < length; i++) {
      let tile;
      do {
        tile = Math.floor(Math.random() * maxTileId);
      } while (tile === lastTile && maxTileId > 1);

      sequence.push(tile);
      lastTile = tile;
    }
    return sequence;
  };
  ```

---

## 🟢 LOW - 1개월 내 개선

### 코드 품질

- [ ] **[L1] 타입 정의 통합**
  - **우선순위**: P3
  - **예상 시간**: 1일
  - **작업 내용**: `Difficulty`, `GameType` 등을 `src/types/index.ts`로 이동

- [ ] **[L2] 인터페이스 표준화**
  - **우선순위**: P3
  - **예상 시간**: 2일
  - **작업 내용**: `BaseGameStore` 인터페이스 정의 및 적용

- [ ] **[L3] Fisher-Yates 셔플 적용**
  - **우선순위**: P3
  - **예상 시간**: 2시간
  - **작업 내용**: `Math.random() - 0.5` → 정확한 셔플 알고리즘

- [ ] **[L4] 파일 구조 개선**
  - **우선순위**: P3
  - **예상 시간**: 1일
  - **작업 내용**: 게임별 파일을 `games/[game]/` 폴더로 통합

### 고급 기능

- [ ] **[L5] Leaderboard Materialized View**
  - **우선순위**: P3
  - **예상 시간**: 1일
  - **작업 내용**: 리더보드 계산 최적화

- [ ] **[L6] 오프라인 동기화 개선**
  - **우선순위**: P3
  - **예상 시간**: 2일
  - **작업 내용**: Optimistic locking, 재시도 큐

- [ ] **[L7] 성능 모니터링**
  - **우선순위**: P3
  - **예상 시간**: 1일
  - **작업 내용**: Flipper 통합, FPS 모니터링

- [ ] **[L8] GDPR 완전 준수**
  - **우선순위**: P3
  - **예상 시간**: 1일
  - **작업 내용**: 데이터 내보내기, 완전 삭제, 개인정보 처리방침

---

## 📊 진행 상황 트래킹

### Critical (7개)
- [x] C1: Leaderboard 점수 조작 방지
- [x] C2: search_path 보안
- [x] C3: Game Records 점수 검증
- [x] C4: Zustand Persistence
- [x] C5: statsManager 통합
- [x] C6: Spatial Memory 메모리 누수
- [x] C7: Flip Match Race Condition
- **완료**: 7/7 (100%) ✅

### High (8개)
- [x] H1: 타이머 일시정지
- [x] H2: 타이머 정확성
- [x] H3: 셀렉터 패턴
- [x] H4: 중복 set() 제거
- [x] H5: 인덱스 추가
- [x] H6: 스키마-코드 불일치
- [x] H7: 네트워크 에러 처리
- [x] H8: LoginScreen 에러
- **완료**: 8/8 (100%) ✅🎉

### Medium (12개)
- [ ] M1-M12
- **완료**: 0/12 (0%)

### Low (8개)
- [ ] L1-L8
- **완료**: 0/8 (0%)

---

## 🎯 배포 전 필수 체크리스트

### 보안
- [ ] Leaderboard 점수 조작 방지 (C1)
- [ ] search_path 설정 (C2)
- [ ] 점수 검증 (C3)
- [ ] 환경 변수 보호 확인

### 안정성
- [ ] Zustand Persistence (C4)
- [ ] 메모리 누수 수정 (C6)
- [ ] Race condition 수정 (C7)
- [ ] 에러 처리 (H7, H8)

### 성능
- [ ] 셀렉터 패턴 (H3)
- [ ] 인덱스 추가 (H5)
- [ ] 타이머 정확성 (H2)

### 사용자 경험
- [ ] 접근성 기본 지원 (M1, M2)
- [ ] 로딩 상태 표시 (M6)
- [ ] 난이도 밸런싱 (M8, M9, M10)

---

## 📅 예상 일정

**Week 1 (CRITICAL)**
- Day 1-2: C1, C2, C3 (보안)
- Day 3-4: C4, C5 (데이터 손실)
- Day 5: C6, C7 (게임 버그)

**Week 2 (HIGH)**
- Day 1-2: H1, H2, H3 (성능)
- Day 3: H4, H5, H6 (최적화)
- Day 4-5: H7, H8 (에러 처리)

**Week 3-4 (MEDIUM)**
- M1-M4: 접근성
- M5-M7: UX 개선
- M8-M12: 밸런싱 및 버그

**Month 2 (LOW)**
- L1-L8: 코드 품질 및 고급 기능

---

**총 예상 작업 시간**: 약 120시간 (3주 풀타임)
**최소 배포 가능 시점**: Critical + High 완료 후 (2주)
**권장 배포 시점**: Medium M1-M7 완료 후 (3주)
