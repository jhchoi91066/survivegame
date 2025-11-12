# Multiplayer Implementation Plan - "Working Safely"

**Timeline:** 2-3 weeks (17 days)
**Status:** Planning Complete - Ready for Implementation
**Last Updated:** 2025-10-30

---

## Executive Summary

This plan focuses on getting multiplayer functionality working safely with core features:
- ✅ Presence/heartbeat system for disconnect detection
- ✅ Reconnection support within 60 seconds
- ✅ Synchronized countdown and game start
- ✅ Games aware of multiplayer context
- ✅ Critical security fixes (race conditions, RLS policies)

**Scope:** Fix critical issues to achieve "working safely" milestone, defer production polish.

---

## Current State Assessment

### Database (via MCP - 2025-10-30)
```
✅ Tables exist: multiplayer_rooms, multiplayer_game_states
✅ Foreign keys point to profiles (not auth.users)
✅ Both tables empty (0 rows) - safe to modify
✅ RLS enabled on both tables
❌ Missing: player_presence table
❌ Missing: reconnection fields (reconnect_token, connection_status)
❌ Missing: timeout fields (game_started_at, game_timeout_at)
❌ Missing: cleanup functions
```

### Critical Issues to Fix
From comprehensive review by supabase-rn-backend-dev agent:

**Security (CRITICAL):**
1. ❌ Missing search_path locking in join_multiplayer_room function
2. ❌ Race condition in room joining (check-then-act without locking)
3. ❌ No authorization on realtime subscriptions (global subscriptions)
4. ❌ Subscription memory leaks in client code
5. ❌ Parameter name mismatch (p_room_id vs room_id)

**Functionality (HIGH):**
6. ❌ No presence/heartbeat system
7. ❌ No reconnection support
8. ❌ Games not aware of multiplayer mode
9. ❌ Countdown not synchronized
10. ❌ No cleanup for stale rooms/sessions

---

## Phase 1: Database & Security Foundation (Days 1-5)

### Goal
Fix database structure, eliminate race conditions, add presence tracking.

### 1.1 Database Schema Overhaul (Day 1-2) - 8 hours

#### Create player_presence table
```sql
CREATE TABLE player_presence (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  room_id UUID,
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'online', -- online, away, disconnected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_player_presence_room_id ON player_presence(room_id);
CREATE INDEX idx_player_presence_status ON player_presence(status);
```

#### Add missing columns to multiplayer_rooms
```sql
ALTER TABLE multiplayer_rooms ADD COLUMN game_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE multiplayer_rooms ADD COLUMN game_timeout_at TIMESTAMP WITH TIME ZONE;
```

#### Add missing columns to multiplayer_game_states
```sql
ALTER TABLE multiplayer_game_states ADD COLUMN connection_status TEXT DEFAULT 'connected';
ALTER TABLE multiplayer_game_states ADD COLUMN reconnect_token TEXT;
ALTER TABLE multiplayer_game_states ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

#### Add critical indexes
```sql
CREATE INDEX idx_multiplayer_rooms_status ON multiplayer_rooms(status);
CREATE INDEX idx_multiplayer_rooms_created_by ON multiplayer_rooms(created_by);
CREATE INDEX idx_multiplayer_game_states_room_status ON multiplayer_game_states(room_id, status);
CREATE INDEX idx_multiplayer_game_states_user_id ON multiplayer_game_states(user_id);
```

#### Add unique constraint
```sql
ALTER TABLE multiplayer_game_states ADD CONSTRAINT unique_room_user UNIQUE(room_id, user_id);
```

### 1.2 Fix join_multiplayer_room Function (Day 2) - 3 hours

**Fixes:** CRITICAL #1, #3, #5, HIGH #1

```sql
CREATE OR REPLACE FUNCTION join_multiplayer_room(
  p_room_id UUID,
  p_user_id UUID
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_players INTEGER;
  v_max_players INTEGER;
  v_username TEXT;
BEGIN
  -- RLS validation
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot join room for another user';
  END IF;

  -- Lock the room row to prevent race conditions
  SELECT current_players, max_players
  INTO v_current_players, v_max_players
  FROM multiplayer_rooms
  WHERE id = p_room_id
  FOR UPDATE;

  -- Check room exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- Check room capacity
  IF v_current_players >= v_max_players THEN
    RAISE EXCEPTION 'Room is full';
  END IF;

  -- Get username from profiles
  SELECT username INTO v_username
  FROM profiles
  WHERE id = p_user_id;

  -- Increment current_players
  UPDATE multiplayer_rooms
  SET current_players = current_players + 1,
      updated_at = NOW()
  WHERE id = p_room_id;

  -- Insert/update game state with reconnect token
  INSERT INTO multiplayer_game_states (
    room_id,
    user_id,
    username,
    connection_status,
    reconnect_token
  )
  VALUES (
    p_room_id,
    p_user_id,
    COALESCE(v_username, 'Player'),
    'connected',
    gen_random_uuid()::text
  )
  ON CONFLICT (room_id, user_id) DO UPDATE
  SET connection_status = 'connected',
      last_seen = NOW(),
      reconnect_token = COALESCE(
        multiplayer_game_states.reconnect_token,
        gen_random_uuid()::text
      );

  -- Insert/update presence record
  INSERT INTO player_presence (user_id, room_id, status)
  VALUES (p_user_id, p_room_id, 'online')
  ON CONFLICT (user_id) DO UPDATE
  SET room_id = p_room_id,
      last_heartbeat = NOW(),
      status = 'online';
END;
$$;
```

### 1.3 Secure RLS Policies (Day 3) - 4 hours

**Fixes:** CRITICAL #2, #4, #8, HIGH #9

```sql
-- Drop old policies
DROP POLICY IF EXISTS "Room creators can update their rooms" ON multiplayer_rooms;

-- Strict update policy
CREATE POLICY "Room creators can update status and metadata"
  ON multiplayer_rooms FOR UPDATE
  USING (
    auth.uid() = created_by
    AND auth.jwt() ->> 'is_anonymous' IS NULL  -- Block anonymous
  )
  WITH CHECK (
    auth.uid() = created_by
    AND (
      -- Allow status transitions
      (status = 'playing' AND OLD.status = 'waiting' AND current_players = max_players)
      OR (status = 'finished' AND OLD.status = 'playing')
      OR (status = OLD.status)  -- Metadata updates only
    )
  );

-- Block anonymous users from creating game states
CREATE POLICY "Authenticated users only can create game states"
  ON multiplayer_game_states FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND auth.jwt() ->> 'is_anonymous' IS NULL
  );

-- Enable RLS on presence
ALTER TABLE player_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own presence"
  ON player_presence FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view presence in their room"
  ON player_presence FOR SELECT
  USING (
    room_id IN (
      SELECT room_id FROM multiplayer_game_states WHERE user_id = auth.uid()
    )
  );
```

### 1.4 Add Cleanup Functions (Day 3) - 2 hours

**Fixes:** CRITICAL #6, HIGH #8

```sql
-- Mark disconnected players (heartbeat > 10 seconds old)
CREATE OR REPLACE FUNCTION mark_disconnected_players()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE player_presence
  SET status = 'disconnected'
  WHERE status = 'online'
    AND last_heartbeat < NOW() - INTERVAL '10 seconds';

  UPDATE multiplayer_game_states gs
  SET connection_status = 'disconnected',
      updated_at = NOW()
  FROM player_presence pp
  WHERE gs.user_id = pp.user_id
    AND pp.status = 'disconnected'
    AND gs.connection_status != 'disconnected';
END;
$$;

-- Cleanup stale rooms
CREATE OR REPLACE FUNCTION cleanup_stale_rooms()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete old finished rooms (> 1 hour)
  DELETE FROM multiplayer_rooms
  WHERE status = 'finished'
    AND updated_at < NOW() - INTERVAL '1 hour';

  -- Delete abandoned waiting rooms (> 5 minutes)
  DELETE FROM multiplayer_rooms
  WHERE status = 'waiting'
    AND created_at < NOW() - INTERVAL '5 minutes';

  -- Delete orphaned presence records
  DELETE FROM player_presence
  WHERE room_id NOT IN (SELECT id FROM multiplayer_rooms);
END;
$$;

-- Timeout stale games (> 10 minutes)
CREATE OR REPLACE FUNCTION timeout_stale_games()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE multiplayer_rooms
  SET status = 'finished',
      updated_at = NOW()
  WHERE status = 'playing'
    AND game_started_at < NOW() - INTERVAL '10 minutes';
END;
$$;
```

### Phase 1 Testing Steps (Day 4)

#### Test 1: Race Condition Prevention
1. Open 3 browser tabs
2. Create room with max_players=2
3. All 3 tabs try joining simultaneously
4. **Expected:** 2 succeed, 1 gets "Room is full" error

#### Test 2: Security
1. Try joining as anonymous user
2. **Expected:** Blocked with error
3. Try updating room status as non-creator
4. **Expected:** Update rejected

#### Test 3: Cleanup
1. Create room, wait 6 minutes without joining
2. Run: `SELECT * FROM multiplayer_rooms WHERE status='waiting'`
3. **Expected:** Room deleted

#### Test 4: Foreign Keys
1. Verify: `SELECT * FROM profiles LIMIT 1`
2. Create room, check `multiplayer_rooms.created_by`
3. **Expected:** No constraint errors

### Phase 1 Success Criteria
- [ ] Can create room without errors
- [ ] Only max_players can join (race condition prevented)
- [ ] Anonymous users blocked
- [ ] Non-creators cannot manipulate room status
- [ ] Stale rooms cleaned up

---

## Phase 2: Client-Side Presence & Integration (Days 5-9)

### Goal
Add heartbeat system, fix subscription leaks, make games multiplayer-aware.

### 2.1 Create usePresence Hook (Day 5) - 4 hours

**File:** `src/hooks/usePresence.ts`

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UsePresenceOptions {
  roomId: string;
  onPlayerDisconnected?: (userId: string) => void;
  onPlayerReconnected?: (userId: string) => void;
}

export const usePresence = ({
  roomId,
  onPlayerDisconnected,
  onPlayerReconnected
}: UsePresenceOptions) => {
  const { user } = useAuth();
  const heartbeatInterval = useRef<NodeJS.Timeout>();
  const reconnectToken = useRef<string>(crypto.randomUUID());

  // Send heartbeat every 5 seconds
  const sendHeartbeat = useCallback(async () => {
    if (!user) return;

    try {
      await supabase
        .from('player_presence')
        .upsert({
          user_id: user.id,
          room_id: roomId,
          last_heartbeat: new Date().toISOString(),
          status: 'online',
        });
    } catch (error) {
      console.error('Heartbeat failed:', error);
    }
  }, [user, roomId]);

  useEffect(() => {
    if (!user) return;

    // Start heartbeat
    sendHeartbeat();
    heartbeatInterval.current = setInterval(sendHeartbeat, 5000);

    // Subscribe to presence changes (filtered by room)
    const subscription = supabase
      .channel(`presence:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'player_presence',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const { user_id, status } = payload.new;
          if (user_id === user.id) return;

          if (status === 'disconnected' && onPlayerDisconnected) {
            onPlayerDisconnected(user_id);
          } else if (status === 'online' && onPlayerReconnected) {
            onPlayerReconnected(user_id);
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      subscription.unsubscribe();

      // Mark as disconnected
      supabase
        .from('player_presence')
        .update({ status: 'disconnected' })
        .eq('user_id', user.id)
        .eq('room_id', roomId)
        .then(() => {});
    };
  }, [user, roomId, sendHeartbeat, onPlayerDisconnected, onPlayerReconnected]);

  return {
    reconnectToken: reconnectToken.current,
  };
};
```

### 2.2 Fix Subscription Memory Leaks (Day 5-6) - 3 hours

**Fixes:** CRITICAL #7

**File:** `src/screens/MultiplayerLobbyScreen.tsx`

Change from:
```typescript
// BEFORE: Global subscription
const subscription = supabase
  .channel('multiplayer_rooms')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'multiplayer_rooms'
  }, () => {
    loadRooms();
  })
  .subscribe();
```

To:
```typescript
// AFTER: Filtered subscription
const subscription = supabase
  .channel('lobby_rooms')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'multiplayer_rooms',
      filter: 'status=eq.waiting'
    },
    () => {
      loadRooms();
    }
  )
  .subscribe();
```

**File:** `src/screens/MultiplayerGameScreen.tsx`

Change from:
```typescript
// BEFORE: Generic channel
const subscription = supabase
  .channel(`multiplayer_game_${roomId}`)
```

To:
```typescript
// AFTER: Unique per user + filtered
const subscription = supabase
  .channel(`game_room_${roomId}_${user.id}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'multiplayer_game_states',
      filter: `room_id=eq.${roomId}`,
    },
    () => {
      loadGameState();
    }
  )
  .subscribe();
```

### 2.3 Create MultiplayerContext (Day 6-7) - 6 hours

**File:** `src/contexts/MultiplayerContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface MultiplayerContextValue {
  isMultiplayer: boolean;
  roomId: string | null;
  opponentScore: number;
  myScore: number;
  updateMyScore: (score: number) => Promise<void>;
  finishGame: () => Promise<void>;
}

const MultiplayerContext = createContext<MultiplayerContextValue | null>(null);

export const MultiplayerProvider: React.FC<{
  roomId?: string;
  children: React.ReactNode
}> = ({ roomId, children }) => {
  const { user } = useAuth();
  const [opponentScore, setOpponentScore] = useState(0);
  const [myScore, setMyScore] = useState(0);

  useEffect(() => {
    if (!roomId || !user) return;

    // Subscribe to opponent score updates
    const subscription = supabase
      .channel(`scores_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'multiplayer_game_states',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.new.user_id !== user.id) {
            setOpponentScore(payload.new.score || 0);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId, user]);

  const updateMyScore = async (score: number) => {
    if (!roomId || !user) return;

    setMyScore(score);
    await supabase
      .from('multiplayer_game_states')
      .update({ score, updated_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('user_id', user.id);
  };

  const finishGame = async () => {
    if (!roomId || !user) return;

    await supabase
      .from('multiplayer_game_states')
      .update({
        finished: true,
        finish_time: new Date().toISOString(),
        status: 'finished',
      })
      .eq('room_id', roomId)
      .eq('user_id', user.id);
  };

  return (
    <MultiplayerContext.Provider
      value={{
        isMultiplayer: !!roomId,
        roomId,
        opponentScore,
        myScore,
        updateMyScore,
        finishGame,
      }}
    >
      {children}
    </MultiplayerContext.Provider>
  );
};

export const useMultiplayer = () => {
  const context = useContext(MultiplayerContext);
  if (!context) {
    return {
      isMultiplayer: false,
      roomId: null,
      opponentScore: 0,
      myScore: 0,
      updateMyScore: async () => {},
      finishGame: async () => {},
    };
  }
  return context;
};
```

### 2.4 Integrate into FlipMatchGame (Day 7-8) - 5 hours

**File:** `src/screens/MultiplayerGameScreen.tsx`

Update startGame function:
```typescript
const startGame = async () => {
  try {
    hapticPatterns.levelComplete();
    await updateGameStatus('playing');

    switch (gameType) {
      case 'flip_match':
        navigation.replace('FlipMatchGame', {
          multiplayerRoomId: roomId,  // NEW
          difficulty: difficulty
        });
        break;
      // ... other games
    }
  } catch (error) {
    console.error('Failed to start game:', error);
  }
};
```

**File:** `src/screens/FlipMatchGame.tsx`

```typescript
import { MultiplayerProvider, useMultiplayer } from '../contexts/MultiplayerContext';

const FlipMatchGame: React.FC = () => {
  const route = useRoute<any>();
  const multiplayerRoomId = route.params?.multiplayerRoomId;

  return (
    <MultiplayerProvider roomId={multiplayerRoomId}>
      <FlipMatchGameContent />
    </MultiplayerProvider>
  );
};

const FlipMatchGameContent: React.FC = () => {
  const { isMultiplayer, opponentScore, updateMyScore, finishGame } = useMultiplayer();

  // Update score when pairs matched
  useEffect(() => {
    if (isMultiplayer && matchedPairs > 0) {
      const score = matchedPairs * 100 - moves * 5;
      updateMyScore(score);
    }
  }, [matchedPairs, moves, isMultiplayer]);

  // Call finishGame when won
  const handleGameEnd = async () => {
    if (gameStatus === 'won') {
      // ... existing code
      if (isMultiplayer) {
        await finishGame();
      }
    }
  };

  return (
    <View>
      {isMultiplayer && (
        <View style={styles.opponentScore}>
          <Text>Opponent: {opponentScore}</Text>
        </View>
      )}
      {/* ... rest of UI */}
    </View>
  );
};
```

### Phase 2 Testing Steps (Day 8-9)

#### Test 1: Heartbeat
1. Create room, join with 2 players
2. Check DB: `SELECT * FROM player_presence`
3. **Expected:** Both show `status='online'`, heartbeat updating every 5s
4. Close one tab, wait 15s
5. **Expected:** Closed player shows `status='disconnected'`

#### Test 2: Memory Leaks
1. Open DevTools → Performance Monitor
2. Create/leave rooms 10 times
3. **Expected:** Memory stays stable

#### Test 3: Multiplayer Game
1. Create flip_match room, 2 players join
2. Start game, match pairs in both windows
3. **Expected:** Opponent scores update in real-time
4. Complete game
5. **Expected:** DB shows `finished=true`

#### Test 4: Single-Player
1. Play flip_match from main menu
2. **Expected:** Works as before, no multiplayer UI

### Phase 2 Success Criteria
- [ ] Heartbeat sends every 5 seconds
- [ ] Disconnects detected within 15 seconds
- [ ] Games receive multiplayer context
- [ ] Scores sync in real-time
- [ ] Single-player unaffected
- [ ] No memory leaks

---

## Phase 3: Synchronized Start & Reconnection (Days 10-14)

### Goal
Ensure synchronized game start, support reconnection.

### 3.1 Synchronized Countdown (Day 10-11) - 5 hours

**File:** `src/screens/MultiplayerGameScreen.tsx`

```typescript
// Room creator triggers countdown
const startCountdown = async () => {
  if (!user) return;

  const { data: room } = await supabase
    .from('multiplayer_rooms')
    .select('created_by')
    .eq('id', roomId)
    .single();

  if (room?.created_by !== user.id) return;

  // Set countdown_start in database
  await supabase
    .from('multiplayer_rooms')
    .update({
      status: 'countdown',
      game_started_at: new Date(Date.now() + 3000).toISOString()
    })
    .eq('id', roomId);
};

// Subscribe to countdown
useEffect(() => {
  if (!user || !roomId) return;

  const subscription = supabase
    .channel(`countdown_${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'multiplayer_rooms',
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        if (payload.new.status === 'countdown') {
          const startTime = new Date(payload.new.game_started_at).getTime();
          const now = Date.now();
          const remainingMs = startTime - now;

          if (remainingMs > 0) {
            setGameState(prev => ({ ...prev, status: 'countdown' }));
            setCountdown(Math.ceil(remainingMs / 1000));

            setTimeout(() => {
              startGame();
            }, remainingMs);
          }
        }
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [user, roomId]);
```

### 3.2 Reconnection Support (Day 11-13) - 8 hours

**File:** `src/utils/reconnection.ts`

```typescript
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECONNECT_STORAGE_KEY = 'multiplayer_reconnect';
const RECONNECT_TIMEOUT = 60000; // 60 seconds

interface ReconnectData {
  roomId: string;
  userId: string;
  token: string;
  timestamp: number;
}

export const saveReconnectData = async (
  roomId: string,
  userId: string,
  token: string
) => {
  const data: ReconnectData = {
    roomId,
    userId,
    token,
    timestamp: Date.now(),
  };
  await AsyncStorage.setItem(RECONNECT_STORAGE_KEY, JSON.stringify(data));
};

export const getReconnectData = async (): Promise<ReconnectData | null> => {
  try {
    const json = await AsyncStorage.getItem(RECONNECT_STORAGE_KEY);
    if (!json) return null;

    const data: ReconnectData = JSON.parse(json);

    if (Date.now() - data.timestamp > RECONNECT_TIMEOUT) {
      await AsyncStorage.removeItem(RECONNECT_STORAGE_KEY);
      return null;
    }

    return data;
  } catch {
    return null;
  }
};

export const clearReconnectData = async () => {
  await AsyncStorage.removeItem(RECONNECT_STORAGE_KEY);
};

export const attemptReconnect = async (data: ReconnectData): Promise<boolean> => {
  try {
    const { data: room } = await supabase
      .from('multiplayer_rooms')
      .select('status')
      .eq('id', data.roomId)
      .single();

    if (!room || room.status === 'finished') {
      await clearReconnectData();
      return false;
    }

    const { data: gameState } = await supabase
      .from('multiplayer_game_states')
      .select('reconnect_token')
      .eq('room_id', data.roomId)
      .eq('user_id', data.userId)
      .single();

    if (!gameState || gameState.reconnect_token !== data.token) {
      await clearReconnectData();
      return false;
    }

    await supabase
      .from('multiplayer_game_states')
      .update({
        connection_status: 'connected',
        last_seen: new Date().toISOString(),
      })
      .eq('room_id', data.roomId)
      .eq('user_id', data.userId);

    await supabase
      .from('player_presence')
      .upsert({
        user_id: data.userId,
        room_id: data.roomId,
        status: 'online',
        last_heartbeat: new Date().toISOString(),
      });

    return true;
  } catch (error) {
    console.error('Reconnection failed:', error);
    return false;
  }
};
```

**File:** `src/screens/MultiplayerGameScreen.tsx`

```typescript
import {
  saveReconnectData,
  getReconnectData,
  attemptReconnect,
  clearReconnectData
} from '../utils/reconnection';

const MultiplayerGameScreen: React.FC = () => {
  const { reconnectToken } = usePresence({
    roomId,
    onPlayerDisconnected: (userId) => {
      Alert.alert(
        '상대 연결 끊김',
        '상대방의 연결이 끊어졌습니다. 60초 내에 재연결되기를 기다립니다.'
      );
    },
    onPlayerReconnected: (userId) => {
      Alert.alert('상대 재연결', '상대방이 재연결되었습니다!');
    },
  });

  useEffect(() => {
    if (!user || !roomId) return;

    saveReconnectData(roomId, user.id, reconnectToken);

    const tryReconnect = async () => {
      const reconnectData = await getReconnectData();
      if (reconnectData && reconnectData.roomId === roomId) {
        const success = await attemptReconnect(reconnectData);
        if (success) {
          Alert.alert('재연결 성공', '게임에 다시 연결되었습니다!');
        }
      }
    };
    tryReconnect();

    return () => {
      clearReconnectData();
    };
  }, [user, roomId, reconnectToken]);
};
```

### Phase 3 Testing Steps (Day 13-14)

#### Test 1: Synchronized Start
1. Create room, 2 players join
2. Use stopwatch to measure start time difference
3. **Expected:** Both start within 100ms

#### Test 2: Countdown Sync
1. Watch countdown in both windows
2. **Expected:** Same number at same time

#### Test 3: Reconnection
1. Create room, start game
2. Close Player 2 tab immediately
3. Reopen within 60s, navigate to multiplayer
4. **Expected:** Rejoin prompt → Back in game

#### Test 4: Timeout
1. Close tab, wait 65s
2. Reopen
3. **Expected:** No rejoin prompt

#### Test 5: Disconnect Detection
1. Start game, close Player 2 tab
2. Wait 15s
3. **Expected:** Player 1 sees disconnect alert

### Phase 3 Success Criteria
- [ ] Countdown synchronized
- [ ] Game starts simultaneously
- [ ] Reconnection works within 60s
- [ ] Disconnects detected and notified
- [ ] Reconnect token validated

---

## Phase 4: Testing & Documentation (Days 15-17)

### Manual Testing Scenarios (Day 15-16)

#### Scenario 1: Happy Path
1. Player A creates flip_match room (easy)
2. Player B joins
3. Countdown starts automatically
4. Both play game
5. Both finish, see results
6. Navigate back to lobby

#### Scenario 2: Disconnect & Reconnect
1. Create room, join, start game
2. Player B refreshes page during game
3. Player B reconnects
4. Both finish game

#### Scenario 3: Abandonment
1. Create room, join, start game
2. Player B closes tab permanently
3. After 15s, Player A sees disconnect notice
4. Player A finishes alone

#### Scenario 4: Full Room
1. Create room, Player B joins (full)
2. Player C tries to join
3. **Expected:** "Room is full" error

#### Scenario 5: Anonymous Blocked
1. Log out (anonymous mode)
2. Try creating multiplayer room
3. **Expected:** Blocked or redirect to login

#### Scenario 6: Rapid Operations
1. Create 10 rooms quickly
2. Join/leave multiple rooms
3. Verify cleanup works

### Testing Checklist (Day 16)

**Database & Security:**
- [ ] Foreign keys to profiles working
- [ ] Anonymous users blocked
- [ ] Non-creators can't manipulate rooms
- [ ] Race condition prevented
- [ ] search_path locked
- [ ] Indexes used in queries

**Presence & Heartbeat:**
- [ ] Heartbeat every 5s
- [ ] Disconnect detected within 15s
- [ ] Reconnection works within 60s
- [ ] Reconnection blocked after 60s
- [ ] Presence records cleaned up

**Game Flow:**
- [ ] Room creation works
- [ ] Room joining works
- [ ] Countdown synchronized
- [ ] Game starts simultaneously
- [ ] Scores update real-time
- [ ] Game completion tracked
- [ ] Results show both players

**Edge Cases:**
- [ ] Full room rejection
- [ ] Stale room cleanup
- [ ] 10-minute timeout
- [ ] Page refresh during countdown
- [ ] Page refresh during game
- [ ] Both players finish simultaneously
- [ ] One player abandons

**Performance:**
- [ ] No memory leaks
- [ ] Subscriptions cleaned up
- [ ] Queries use indexes
- [ ] No global subscriptions

**Single-Player:**
- [ ] Single-player still works
- [ ] No multiplayer UI shown
- [ ] Stats/achievements save

### Documentation (Day 17)

Create: `docs/MULTIPLAYER_ARCHITECTURE.md`
Create: `docs/MULTIPLAYER_TESTING_GUIDE.md`
Update: `README.md` with multiplayer features

---

## Deferred to Future

### Not Included in 2-3 Week Plan:

**Validation & Polish:**
- Data validation (score ranges, enums)
- Leaderboard column name fixes
- Error recovery UI
- Network resilience improvements

**Advanced Features:**
- Spectator mode
- Private rooms with invite codes
- More than 2 players
- Chat/emoji reactions
- Matchmaking queue
- Tournament brackets

**Production Hardening:**
- Automated tests (unit/integration)
- Load testing
- Monitoring/analytics
- Admin dashboard
- Anti-cheat measures

**When to Address:**
- Phase 5 (Week 4-6): Validation, leaderboard, automated tests
- Phase 6 (Week 7-10): Advanced features based on feedback
- Phase 7 (Week 11-16): Production hardening

---

## Timeline Summary

| Phase | Days | Hours | Focus |
|-------|------|-------|-------|
| 1 | 1-5 | 17h | Database & Security |
| 2 | 5-9 | 18h | Client Integration |
| 3 | 10-14 | 13h | Synchronization |
| 4 | 15-17 | 12h | Testing & Docs |
| **Buffer** | - | 14h | Bug fixes (20%) |
| **TOTAL** | **17** | **74h** | **~3 weeks** |

---

## Success Criteria

### "Working Safely" Milestone Achieved When:
✅ 2-player games work reliably
✅ Disconnections detected within 15 seconds
✅ Reconnection supported within 60 seconds
✅ Games start simultaneously
✅ No race conditions
✅ No memory leaks
✅ Anonymous users blocked
✅ Single-player mode unaffected
✅ All manual tests pass
✅ Documentation complete

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Database changes break existing features | Low | High | Test single-player thoroughly |
| Reconnection logic complex | Medium | High | Phase 3 has extra time buffer |
| Edge cases discovered during testing | High | Medium | Phase 4 dedicated to testing |
| Network latency issues | Medium | Medium | Server-side timestamps for sync |

---

## Implementation Notes

### Database Changes (Phase 1)
- Use MCP `apply_migration` tool for schema changes
- Test each migration with `execute_sql` before proceeding
- Keep migration files for rollback if needed

### Client Code (Phase 2-3)
- Create new files in separate commits
- Test each component in isolation
- Use feature flags to enable/disable multiplayer

### Testing (Phase 4)
- Manual testing only (no automated tests yet)
- Test with 2 real devices/browsers
- Document all edge cases found

---

## Questions for Clarification

1. **Profiles table:** Does it exist with proper schema?
2. **Game integration:** Integrate all 4 games or just flip_match?
3. **Cleanup trigger:** Call from client (no pg_cron available)?
4. **Reconnection UX:** Auto-prompt or require navigation?
5. **Production data:** Confirm okay to wipe multiplayer tables?

---

**Status:** Ready for implementation approval
**Next Step:** Phase 1 - Database schema migration
**Estimated Start Date:** After plan approval
**Estimated Completion:** 3 weeks from start
