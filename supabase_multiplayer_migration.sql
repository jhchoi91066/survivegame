-- 멀티플레이어 방 테이블
CREATE TABLE IF NOT EXISTS multiplayer_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  difficulty TEXT,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, playing, finished
  max_players INTEGER NOT NULL DEFAULT 2,
  current_players INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 멀티플레이어 게임 상태 테이블
CREATE TABLE IF NOT EXISTS multiplayer_game_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  score INTEGER DEFAULT 0,
  finished BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'waiting',
  start_time TIMESTAMP WITH TIME ZONE,
  finish_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- 방 참가 함수
CREATE OR REPLACE FUNCTION join_multiplayer_room(
  room_id UUID,
  user_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- 방의 현재 인원 확인
  IF (SELECT current_players FROM multiplayer_rooms WHERE id = room_id) >= (SELECT max_players FROM multiplayer_rooms WHERE id = room_id) THEN
    RAISE EXCEPTION 'Room is full';
  END IF;

  -- current_players 증가
  UPDATE multiplayer_rooms
  SET current_players = current_players + 1,
      updated_at = NOW()
  WHERE id = room_id;

  -- 게임 상태 추가
  INSERT INTO multiplayer_game_states (room_id, user_id, username)
  VALUES (room_id, user_id, (SELECT COALESCE(raw_user_meta_data->>'username', 'Player') FROM auth.users WHERE id = user_id))
  ON CONFLICT (room_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_status ON multiplayer_rooms(status);
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_created_by ON multiplayer_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_multiplayer_game_states_room_id ON multiplayer_game_states(room_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_game_states_user_id ON multiplayer_game_states(user_id);

-- RLS 정책
ALTER TABLE multiplayer_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_game_states ENABLE ROW LEVEL SECURITY;

-- 방 조회 (모든 사용자)
CREATE POLICY "Anyone can view rooms"
  ON multiplayer_rooms FOR SELECT
  USING (true);

-- 방 생성 (인증된 사용자만)
CREATE POLICY "Authenticated users can create rooms"
  ON multiplayer_rooms FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- 방 업데이트 (방장만)
CREATE POLICY "Room creators can update their rooms"
  ON multiplayer_rooms FOR UPDATE
  USING (auth.uid() = created_by);

-- 방 삭제 (방장만)
CREATE POLICY "Room creators can delete their rooms"
  ON multiplayer_rooms FOR DELETE
  USING (auth.uid() = created_by);

-- 게임 상태 조회 (모든 사용자)
CREATE POLICY "Anyone can view game states"
  ON multiplayer_game_states FOR SELECT
  USING (true);

-- 게임 상태 생성 (인증된 사용자만)
CREATE POLICY "Authenticated users can create game states"
  ON multiplayer_game_states FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 게임 상태 업데이트 (본인 것만)
CREATE POLICY "Users can update their own game states"
  ON multiplayer_game_states FOR UPDATE
  USING (auth.uid() = user_id);

-- 게임 상태 삭제 (본인 것만)
CREATE POLICY "Users can delete their own game states"
  ON multiplayer_game_states FOR DELETE
  USING (auth.uid() = user_id);
