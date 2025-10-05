# 🗄️ Supabase 백엔드 설정 현황

**마지막 업데이트:** 2025-10-04
**프로젝트:** Brain Games v3.0
**Supabase 프로젝트:** yqngfoowohacuozaofyb

---

## ✅ 완료된 작업

### 1. MCP 서버 연결
- ✅ `.claude/.mcp.json` 설정 완료
- ✅ 프로젝트 참조: `yqngfoowohacuozaofyb`
- ✅ 읽기/쓰기 권한 활성화 (--read-only 플래그 제거됨)

### 2. 데이터베이스 스키마 설계
- ✅ `docs/supabase-schema.sql` 작성 완료
- ✅ 5개 테이블 구조 정의:
  1. **profiles** - 사용자 프로필
  2. **game_records** - 게임 기록
  3. **leaderboards** - 순위표
  4. **friendships** - 친구 관계
  5. **user_achievements** - 업적
- ✅ Row Level Security (RLS) 정책 설계
- ✅ Functions & Triggers 설계
- ✅ Helper functions 설계

### 3. 설정 가이드 문서화
- ✅ `docs/SUPABASE_SETUP_GUIDE.md` 생성
- ✅ 단계별 실행 가이드 작성
- ✅ 문제 해결 섹션 포함
- ✅ 테스트 쿼리 예시 포함

### 4. 프로젝트 통합
- ✅ [SettingsScreen.tsx](../src/screens/SettingsScreen.tsx) - 튜토리얼 키 통일
- ✅ `docs/development_roadmap.md` - Phase 9 체크리스트 업데이트

---

## 🚧 다음 단계 (수동 작업 필요)

### 📝 즉시 실행 가능

#### 1. Supabase SQL 실행
**예상 소요 시간:** 5-10분

**방법:**
1. [Supabase 대시보드](https://app.supabase.com/project/yqngfoowohacuozaofyb) 접속
2. 왼쪽 메뉴에서 **SQL Editor** 클릭
3. **New Query** 클릭
4. `docs/supabase-schema.sql` 내용 복사 & 붙여넣기
5. **Run** 버튼 클릭 (Cmd/Ctrl + Enter)

**상세 가이드:**
👉 [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md) 참고

**실행 후 확인 사항:**
- [ ] **Table Editor**에서 5개 테이블 생성 확인
- [ ] 각 테이블의 **Policies** 탭에서 RLS 활성화 확인
- [ ] **Database** > **Functions**에서 4개 함수 생성 확인
- [ ] **Database** > **Triggers**에서 4개 트리거 생성 확인

---

## 🎯 v3.0 개발 로드맵

SQL 스키마 실행 완료 후:

### Week 1-2: 인프라 설정
- [ ] React Native에 Supabase 라이브러리 설치
  ```bash
  npm install @supabase/supabase-js react-native-url-polyfill
  ```
- [ ] `src/lib/supabase.ts` 클라이언트 생성
- [ ] 환경 변수 설정 (.env)

### Week 3-4: 인증 시스템
- [ ] AuthContext 생성
- [ ] LoginScreen 구현
- [ ] Google/Apple 소셜 로그인 통합

### Week 5: 프로필 화면
- [ ] ProfileScreen 구현
- [ ] 프로필 편집 기능

### Week 6-7: 클라우드 동기화
- [ ] AsyncStorage ↔ Supabase 동기화 로직
- [ ] 충돌 해결 전략 구현

### Week 8-10: 온라인 리더보드
- [ ] LeaderboardScreen 구현
- [ ] 실시간 구독 설정
- [ ] 필터링 (daily/weekly/monthly/all-time)

### Week 11-12: 친구 시스템
- [ ] FriendsScreen 구현
- [ ] 친구 요청/수락/거절
- [ ] 친구와 기록 비교

### Week 13-15: 실시간 멀티플레이어
- [ ] 1vs1 매칭 시스템
- [ ] 실시간 게임 동기화
- [ ] 승패 기록

### Week 16: 테스트 & 최적화
- [ ] 통합 테스트
- [ ] 성능 최적화
- [ ] 버그 수정

**총 예상 기간:** 14-16주 (3.5-4개월)
**예상 출시:** 2026년 1월

---

## 📊 스키마 구조 요약

### 테이블 관계도

```
auth.users (Supabase Auth)
    ↓
profiles (1:1)
    ↓
    ├── game_records (1:N) → leaderboards (1:N)
    ├── friendships (N:N, self-referencing)
    └── user_achievements (1:N)
```

### ENUM 타입

| ENUM 타입 | 값 |
|-----------|-----|
| `game_type` | `flip_match`, `sequence`, `math_rush`, `merge_puzzle` |
| `difficulty_type` | `easy`, `medium`, `hard` |
| `timeframe_type` | `daily`, `weekly`, `monthly`, `all_time` |
| `friend_status` | `pending`, `accepted`, `blocked` |

### RLS 정책 요약

| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| profiles | 🌐 누구나 | ✋ 본인 | ✋ 본인 | ❌ |
| game_records | ✋ 본인 | ✋ 본인 | ✋ 본인 | ❌ |
| leaderboards | 🌐 누구나 | ✋ 본인 | ✋ 본인 | ❌ |
| friendships | 👥 관련자 | ✋ 본인 | 👥 관련자 | ✋ 본인 |
| user_achievements | ✋ 본인 | ✋ 본인 | ❌ | ❌ |

**아이콘 설명:**
- 🌐 누구나: 모든 사용자가 조회 가능 (공개)
- ✋ 본인: 해당 사용자만 가능
- 👥 관련자: 관련된 사용자들만 가능
- ❌ 불가능

---

## 🔐 보안 고려사항

### 1. Row Level Security (RLS)
- ✅ 모든 테이블에 RLS 활성화
- ✅ `auth.uid()`를 사용한 사용자 검증
- ✅ 최소 권한 원칙 적용

### 2. API 키 관리
- ⚠️ **중요:** Supabase Anon Key만 클라이언트에 노출
- ⚠️ Service Role Key는 절대 클라이언트에 포함 금지
- ✅ `.env` 파일에 저장 (Git에 커밋하지 않음)

### 3. 개인정보 보호
- ✅ 닉네임만 필수, 나머지는 선택
- ✅ 계정 삭제 시 CASCADE로 모든 관련 데이터 삭제
- ✅ 개인정보 최소 수집 원칙

---

## 💰 비용 예측

### Supabase Free Tier
- **데이터베이스:** 500MB
- **Storage:** 1GB
- **Bandwidth:** 2GB
- **Monthly Active Users:** 50,000
- **✅ 초기 단계에 충분함**

### Pro Tier ($25/month) - 필요 시
- **데이터베이스:** 8GB
- **Storage:** 100GB
- **Bandwidth:** 50GB
- **Monthly Active Users:** 제한 없음

**예상:**
- 10,000 DAU: Free Tier 가능
- 50,000+ DAU: Pro Tier 권장

---

## 📚 참고 문서

### 프로젝트 문서
- [개발 로드맵](./development_roadmap.md)
- [v3.0 온라인 기능 명세](./V3_ONLINE_FEATURES.md)
- [Supabase 설정 가이드](./SUPABASE_SETUP_GUIDE.md)
- [Supabase SQL 스키마](./supabase-schema.sql)

### 외부 문서
- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime](https://supabase.com/docs/guides/realtime)

---

## 🎯 현재 우선순위

### v2.0 출시 우선 (2025년 10월-11월)
v3.0 개발은 v2.0 출시 후 시작합니다.

**v2.0 남은 작업:**
1. 앱 아이콘 생성 (1024x1024px)
2. 스크린샷 준비 (iPhone & Android)
3. Google Play Console 등록
4. Apple Developer 계정 등록
5. 빌드 & 배포

**v2.0 출시 후:**
1. ✅ Supabase SQL 스키마 실행
2. ⏭️ Supabase 클라이언트 설정
3. ⏭️ 인증 시스템 구현
4. ⏭️ 온라인 기능 단계별 개발

---

**다음 단계:** [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md)를 따라 SQL 스키마를 Supabase에 실행하세요!
