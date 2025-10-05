# 🗄️ Supabase 데이터베이스 설정 가이드

## 📋 개요

이 가이드는 Brain Games v3.0의 온라인 기능을 위한 Supabase 데이터베이스 설정 방법을 안내합니다.

**프로젝트 정보:**
- Project Reference: `yqngfoowohacuozaofyb`
- Region: 설정된 지역에 따라 다름
- Database: PostgreSQL 15+

---

## 🚀 설정 단계

### 1단계: Supabase 대시보드 접속

1. [Supabase 대시보드](https://app.supabase.com/) 접속
2. 프로젝트 `yqngfoowohacuozaofyb` 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭

### 2단계: SQL 스키마 실행

#### 방법 A: 전체 스크립트 실행 (권장)

1. SQL Editor에서 **New Query** 클릭
2. `docs/supabase-schema.sql` 파일 내용 전체 복사
3. SQL Editor에 붙여넣기
4. **Run** 버튼 클릭 (또는 `Cmd/Ctrl + Enter`)

#### 방법 B: 섹션별 실행 (문제 발생 시)

문제가 발생하면 다음 순서대로 각 섹션을 개별 실행:

**2-1. 프로필 테이블 생성**
```sql
-- Section 1: Users Profile Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  country_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 20)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);
```

**2-2. 게임 기록 테이블 생성**
```sql
-- Section 2: Game Records Table
CREATE TYPE game_type AS ENUM ('flip_match', 'sequence', 'math_rush', 'merge_puzzle');
CREATE TYPE difficulty_type AS ENUM ('easy', 'medium', 'hard');

CREATE TABLE IF NOT EXISTS public.game_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_type game_type NOT NULL,
  -- 나머지 필드들...
);

ALTER TABLE public.game_records ENABLE ROW LEVEL SECURITY;
-- RLS Policies 및 Indexes...
```

**2-3. 리더보드 테이블 생성**
```sql
-- Section 3: Leaderboards Table
CREATE TYPE timeframe_type AS ENUM ('daily', 'weekly', 'monthly', 'all_time');

CREATE TABLE IF NOT EXISTS public.leaderboards (
  -- 필드들...
);

ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
-- RLS Policies 및 Indexes...
```

**2-4. 친구 관계 테이블 생성**
```sql
-- Section 4: Friendships Table
CREATE TYPE friend_status AS ENUM ('pending', 'accepted', 'blocked');

CREATE TABLE IF NOT EXISTS public.friendships (
  -- 필드들...
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
-- RLS Policies 및 Indexes...
```

**2-5. 업적 테이블 생성**
```sql
-- Section 5: User Achievements Table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  -- 필드들...
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
-- RLS Policies...
```

**2-6. Functions & Triggers 생성**
```sql
-- Section 6: Functions & Triggers
CREATE OR REPLACE FUNCTION public.handle_new_user() ...
CREATE TRIGGER on_auth_user_created ...
CREATE OR REPLACE FUNCTION public.handle_updated_at() ...
CREATE TRIGGER set_updated_at_profiles ...
-- 나머지 triggers...
```

**2-7. Helper Functions 생성**
```sql
-- Section 7: Helper Functions
CREATE OR REPLACE FUNCTION public.upsert_game_record() ...
CREATE OR REPLACE FUNCTION public.update_daily_leaderboard() ...
```

**2-8. Realtime 활성화**
```sql
-- Section 9: Realtime Subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboards;
```

### 3단계: 실행 결과 확인

#### 테이블 생성 확인
1. 왼쪽 메뉴에서 **Table Editor** 클릭
2. 다음 테이블들이 생성되었는지 확인:
   - ✅ profiles
   - ✅ game_records
   - ✅ leaderboards
   - ✅ friendships
   - ✅ user_achievements

#### RLS 정책 확인
1. 각 테이블 클릭
2. 상단 탭에서 **Policies** 클릭
3. RLS가 활성화되어 있고 정책들이 생성되었는지 확인

#### Functions 확인
1. 왼쪽 메뉴에서 **Database** > **Functions** 클릭
2. 다음 함수들이 생성되었는지 확인:
   - ✅ handle_new_user
   - ✅ handle_updated_at
   - ✅ upsert_game_record
   - ✅ update_daily_leaderboard

#### Triggers 확인
1. **Database** > **Triggers** 클릭
2. 다음 트리거들이 생성되었는지 확인:
   - ✅ on_auth_user_created (auth.users 테이블)
   - ✅ set_updated_at_profiles
   - ✅ set_updated_at_game_records
   - ✅ set_updated_at_friendships

---

## 🧪 테스트

### 테스트 1: 프로필 생성 테스트

SQL Editor에서 실행:

```sql
-- 테스트 유저 생성 (실제 auth.users에 유저가 있다고 가정)
-- 주의: 이것은 테스트용이며, 실제로는 Supabase Auth를 통해 생성됩니다
SELECT * FROM public.profiles;
```

### 테스트 2: 게임 기록 함수 테스트

```sql
-- 게임 기록 추가 테스트 (실제 user_id로 교체 필요)
SELECT public.upsert_game_record(
  'YOUR_USER_UUID'::UUID,
  'flip_match'::game_type,
  'easy'::difficulty_type,
  45.5,
  60
);

-- 결과 확인
SELECT * FROM public.game_records;
```

### 테스트 3: 리더보드 업데이트 테스트

```sql
-- 리더보드 업데이트
SELECT public.update_daily_leaderboard(
  'flip_match'::game_type,
  'easy'::difficulty_type
);

-- 결과 확인
SELECT * FROM public.leaderboards ORDER BY rank ASC LIMIT 10;
```

---

## 🔧 문제 해결

### 오류: "type already exists"

**증상:** `CREATE TYPE` 실행 시 이미 존재한다는 오류

**해결:**
```sql
-- 기존 타입 삭제 후 재생성
DROP TYPE IF EXISTS game_type CASCADE;
DROP TYPE IF EXISTS difficulty_type CASCADE;
DROP TYPE IF EXISTS timeframe_type CASCADE;
DROP TYPE IF EXISTS friend_status CASCADE;

-- 그 다음 다시 CREATE TYPE 실행
```

### 오류: "relation already exists"

**증상:** 테이블이 이미 존재한다는 오류

**해결:**
```sql
-- 특정 테이블 삭제 후 재생성
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.friendships CASCADE;
DROP TABLE IF EXISTS public.leaderboards CASCADE;
DROP TABLE IF EXISTS public.game_records CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 그 다음 다시 CREATE TABLE 실행
```

⚠️ **주의:** 이미 데이터가 있는 경우 모두 삭제되므로 프로덕션 환경에서는 신중히 사용!

### 오류: "permission denied for schema public"

**증상:** 권한이 없다는 오류

**해결:**
1. Supabase 대시보드에서 **Settings** > **Database** 이동
2. **Connection string** 섹션에서 `postgres` 역할 확인
3. 또는 SQL Editor에서 다음 실행:
```sql
GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;
```

### 오류: "function auth.uid() does not exist"

**증상:** RLS 정책에서 auth.uid() 함수를 찾을 수 없음

**해결:**
Supabase는 기본적으로 `auth.uid()`를 제공합니다. 이 오류는 거의 발생하지 않지만, 만약 발생하면:
1. Supabase 프로젝트가 최신 버전인지 확인
2. 다시 로그인 후 재시도

---

## 📊 데이터베이스 구조 요약

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

### 주요 ENUM 타입

- **game_type**: `flip_match`, `sequence`, `math_rush`, `merge_puzzle`
- **difficulty_type**: `easy`, `medium`, `hard`
- **timeframe_type**: `daily`, `weekly`, `monthly`, `all_time`
- **friend_status**: `pending`, `accepted`, `blocked`

---

## 🔐 보안 (Row Level Security)

모든 테이블에 RLS가 활성화되어 있으며, 다음 원칙을 따릅니다:

1. **프로필 (profiles)**
   - 📖 누구나 조회 가능 (공개 프로필)
   - ✏️ 본인만 수정 가능

2. **게임 기록 (game_records)**
   - 📖 본인 기록만 조회 가능
   - ✏️ 본인 기록만 생성/수정 가능

3. **리더보드 (leaderboards)**
   - 📖 누구나 조회 가능 (공개 순위)
   - ✏️ 본인 기록만 생성/수정 가능

4. **친구 (friendships)**
   - 📖 관련된 사용자만 조회 가능
   - ✏️ 요청자만 생성 가능
   - ✏️ 양쪽 모두 수정 가능 (수락/거절)
   - 🗑️ 요청자만 삭제 가능

5. **업적 (user_achievements)**
   - 📖 본인 업적만 조회 가능
   - ✏️ 본인 업적만 생성 가능

---

## 🎯 다음 단계

데이터베이스 설정이 완료되면:

1. ✅ **Supabase 클라이언트 설정**
   ```bash
   npm install @supabase/supabase-js
   ```

2. ✅ **환경 변수 설정**
   - `.env` 파일에 Supabase URL 및 Anon Key 추가

3. ✅ **인증 시스템 구현**
   - Google/Apple 소셜 로그인 설정
   - 프로필 생성 플로우 구현

4. ✅ **게임 기록 동기화**
   - 로컬 AsyncStorage → Supabase 동기화 로직
   - 충돌 해결 전략 구현

5. ✅ **리더보드 UI 구현**
   - 실시간 구독 설정
   - 랭킹 화면 디자인

자세한 구현 가이드는 `docs/development_roadmap.md`의 **Phase 9: v3.0 온라인 기능**을 참고하세요.

---

## 📞 지원

문제가 발생하거나 질문이 있으면:
1. [Supabase 공식 문서](https://supabase.com/docs) 확인
2. [Supabase Discord](https://discord.supabase.com/) 커뮤니티 질문
3. 프로젝트 개발팀 문의

---

**작성일:** 2025-10-04
**버전:** 1.0.0
**프로젝트:** Brain Games v3.0
