-- Brain Games v3.0 Supabase Database Schema
-- Project: yqngfoowohacuozaofyb

-- ============================================
-- 1. Users Profile Table (확장 프로필)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  country_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 20)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- 2. Game Records Table (게임 기록)
-- ============================================
CREATE TYPE game_type AS ENUM ('flip_match', 'sequence', 'math_rush', 'merge_puzzle');
CREATE TYPE difficulty_type AS ENUM ('easy', 'medium', 'hard');

CREATE TABLE IF NOT EXISTS public.game_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_type game_type NOT NULL,

  -- Flip & Match
  best_time INTEGER, -- seconds
  difficulty difficulty_type,

  -- Sequence
  highest_level INTEGER,

  -- Math Rush
  high_score INTEGER,
  highest_combo INTEGER,

  -- Merge Puzzle
  best_moves INTEGER,
  highest_number INTEGER,

  -- Common
  total_plays INTEGER DEFAULT 0,
  total_play_time INTEGER DEFAULT 0, -- seconds

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, game_type, difficulty)
);

-- Enable RLS
ALTER TABLE public.game_records ENABLE ROW LEVEL SECURITY;

-- Game Records Policies
CREATE POLICY "Users can view their own records"
  ON public.game_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own records"
  ON public.game_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own records"
  ON public.game_records FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_game_records_user_game ON public.game_records(user_id, game_type);
CREATE INDEX idx_game_records_game_type ON public.game_records(game_type);

-- ============================================
-- 3. Leaderboards Table (리더보드)
-- ============================================
CREATE TYPE timeframe_type AS ENUM ('daily', 'weekly', 'monthly', 'all_time');

CREATE TABLE IF NOT EXISTS public.leaderboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_type game_type NOT NULL,
  difficulty difficulty_type,
  timeframe timeframe_type NOT NULL,

  score NUMERIC NOT NULL, -- 점수 (작을수록 좋음: 시간, 클수록 좋음: 점수)
  rank INTEGER,

  -- Metadata
  country_code TEXT,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  UNIQUE(user_id, game_type, difficulty, timeframe, period_start)
);

-- Enable RLS
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;

-- Leaderboards Policies (읽기는 모두 가능)
CREATE POLICY "Leaderboards are viewable by everyone"
  ON public.leaderboards FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own leaderboard entries"
  ON public.leaderboards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leaderboard entries"
  ON public.leaderboards FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_leaderboards_game_timeframe ON public.leaderboards(game_type, timeframe, period_start);
CREATE INDEX idx_leaderboards_rank ON public.leaderboards(game_type, difficulty, timeframe, rank);
CREATE INDEX idx_leaderboards_country ON public.leaderboards(country_code, game_type);

-- ============================================
-- 4. Friends Table (친구 관계)
-- ============================================
CREATE TYPE friend_status AS ENUM ('pending', 'accepted', 'blocked');

CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status friend_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT no_self_friendship CHECK (user_id != friend_id),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Friendships Policies
CREATE POLICY "Users can view their own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own friendships"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their own friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_friendships_user ON public.friendships(user_id, status);
CREATE INDEX idx_friendships_friend ON public.friendships(friend_id, status);

-- ============================================
-- 5. Achievements Table (업적)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Achievements Policies
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index
CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id);

-- ============================================
-- 6. Functions & Triggers
-- ============================================

-- Function: 프로필 생성 시 자동으로 유저 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, country_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'player_' || substr(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'country'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: 새 유저 생성 시 프로필 자동 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_game_records
  BEFORE UPDATE ON public.game_records
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_friendships
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 7. Helper Functions (게임 기록 업데이트)
-- ============================================

-- Function: 게임 기록 업데이트 또는 생성
CREATE OR REPLACE FUNCTION public.upsert_game_record(
  p_user_id UUID,
  p_game_type game_type,
  p_difficulty difficulty_type,
  p_score NUMERIC,
  p_play_time INTEGER
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.game_records (
    user_id,
    game_type,
    difficulty,
    best_time,
    total_plays,
    total_play_time
  )
  VALUES (
    p_user_id,
    p_game_type,
    p_difficulty,
    p_score,
    1,
    p_play_time
  )
  ON CONFLICT (user_id, game_type, difficulty)
  DO UPDATE SET
    best_time = CASE
      WHEN p_game_type = 'flip_match' AND p_score < game_records.best_time
      THEN p_score
      ELSE game_records.best_time
    END,
    total_plays = game_records.total_plays + 1,
    total_play_time = game_records.total_play_time + p_play_time,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: 리더보드 순위 계산 (일간)
CREATE OR REPLACE FUNCTION public.update_daily_leaderboard(
  p_game_type game_type,
  p_difficulty difficulty_type
)
RETURNS void AS $$
BEGIN
  WITH ranked_scores AS (
    SELECT
      user_id,
      game_type,
      difficulty,
      best_time as score,
      ROW_NUMBER() OVER (ORDER BY best_time ASC) as rank,
      (SELECT country_code FROM public.profiles WHERE id = game_records.user_id) as country
    FROM public.game_records
    WHERE game_type = p_game_type
      AND difficulty = p_difficulty
      AND best_time IS NOT NULL
  )
  INSERT INTO public.leaderboards (
    user_id,
    game_type,
    difficulty,
    timeframe,
    score,
    rank,
    country_code,
    period_start,
    period_end
  )
  SELECT
    user_id,
    game_type,
    difficulty,
    'daily'::timeframe_type,
    score,
    rank::INTEGER,
    country,
    CURRENT_DATE,
    CURRENT_DATE
  FROM ranked_scores
  ON CONFLICT (user_id, game_type, difficulty, timeframe, period_start)
  DO UPDATE SET
    score = EXCLUDED.score,
    rank = EXCLUDED.rank,
    achieved_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. Sample Data (테스트용)
-- ============================================

-- 나중에 삭제할 것
-- INSERT INTO public.profiles (id, username, country_code) VALUES
-- (gen_random_uuid(), 'player1', 'KR'),
-- (gen_random_uuid(), 'player2', 'US'),
-- (gen_random_uuid(), 'player3', 'JP');

-- ============================================
-- 9. Realtime Subscriptions (실시간)
-- ============================================

-- 리더보드 실시간 구독 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboards;

-- ============================================
-- 완료!
-- ============================================
-- 이제 Supabase 대시보드에서 SQL Editor를 열고
-- 이 스크립트를 실행하세요.
