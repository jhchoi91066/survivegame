# 🌐 Brain Games v3.0 - 온라인 기능 구현 계획

**버전**: 3.0.0
**예상 출시**: v2.0 출시 후 3개월
**목표**: 소셜 & 온라인 기능으로 사용자 참여도 극대화

---

## 📋 목차

1. [개요](#개요)
2. [기술 스택 선정](#기술-스택-선정)
3. [기능 명세](#기능-명세)
4. [데이터베이스 설계](#데이터베이스-설계)
5. [구현 단계](#구현-단계)
6. [보안 & 개인정보](#보안--개인정보)
7. [비용 분석](#비용-분석)

---

## 🎯 개요

### 현재 상태 (v2.0)
- ✅ 오프라인 전용
- ✅ 로컬 저장 (AsyncStorage)
- ✅ 개인정보 수집 없음

### v3.0 추가 기능
- 🆕 선택적 계정 시스템
- 🆕 온라인 리더보드
- 🆕 친구 시스템
- 🆕 클라우드 동기화
- 🆕 실시간 멀티플레이어 (선택)

### 핵심 원칙
⚠️ **계정 없이도 완전히 플레이 가능**
- 로그인은 선택 사항
- 로그인 없이: 모든 기능 사용 (로컬만)
- 로그인 시: 온라인 기능 추가 활성화

---

## 🛠️ 기술 스택 선정

### Option 1: Firebase (추천) ⭐

#### 장점
- ✅ 무료 할당량 넉넉함
- ✅ React Native 공식 지원
- ✅ 완전한 백엔드 솔루션
- ✅ 실시간 데이터베이스
- ✅ Google 계정 통합 쉬움

#### 서비스 구성
```
Firebase Authentication     - 소셜 로그인 (Google, Apple, 익명)
Cloud Firestore            - NoSQL 데이터베이스
Realtime Database          - 실시간 리더보드
Cloud Functions            - 서버리스 로직
Firebase Storage           - 프로필 이미지 (선택)
```

#### 무료 할당량 (Spark Plan)
- 인증: 무제한
- Firestore: 1GB 저장, 50K 읽기/20K 쓰기 per day
- Realtime DB: 1GB 저장, 10GB 다운로드/월
- Functions: 125K 호출/월, 40K GB-초/월

#### 예상 비용
- 10,000 DAU 기준: **$0 - $25/월**
- 50,000 DAU 기준: **$50 - $100/월**

---

### Option 2: Supabase

#### 장점
- ✅ 오픈소스
- ✅ PostgreSQL (관계형 DB)
- ✅ Row Level Security
- ✅ 무료 티어 넉넉함

#### 서비스 구성
```
Supabase Auth              - 인증 시스템
PostgreSQL Database        - 관계형 데이터베이스
Realtime                   - 실시간 구독
Edge Functions             - Deno 기반 서버리스
Storage                    - 파일 저장소
```

#### 무료 할당량 (Free Tier)
- 500MB 데이터베이스
- 1GB 파일 저장소
- 50,000 MAU (월간 활성 사용자)
- 2GB 대역폭

#### 예상 비용
- 10,000 DAU: **$0/월**
- 50,000+ DAU: **$25/월** (Pro Plan)

---

### Option 3: Clerk (고급)

#### 장점
- ✅ 최고급 인증 UX
- ✅ 소셜 로그인 간편
- ✅ 사용자 관리 대시보드

#### 단점
- ❌ 인증만 제공 (DB 별도 필요)
- ❌ 유료 (월 $25부터)

---

## 🏆 추천: Firebase

**이유:**
1. 완전한 올인원 솔루션
2. 무료 티어로 충분한 테스트
3. 확장 가능
4. React Native 통합 쉬움
5. Google/Apple 로그인 기본 제공

---

## 🎮 기능 명세

### 1. 선택적 로그인 시스템

#### 1.1 로그인 방법
```typescript
// 사용자 선택지
1. 게스트로 계속 (로그인 안 함) ← 기본값
2. Google 계정으로 로그인
3. Apple 계정으로 로그인
4. 익명 로그인 (나중에 연동 가능)
```

#### 1.2 UI/UX 흐름
```
앱 시작
  ↓
온보딩 튜토리얼
  ↓
메인 메뉴
  ↓
[선택] 로그인 프롬프트 (닫을 수 있음)
  ├─ "나중에" → 로컬 플레이
  └─ "로그인" → 온라인 기능 활성화
```

#### 1.3 로그인 인센티브
- 🏆 글로벌 리더보드 참여
- 👥 친구 추가 및 경쟁
- ☁️ 기록 백업 및 복구
- 🎁 특별 업적 (온라인 전용)

---

### 2. 온라인 리더보드 🏆

#### 2.1 리더보드 종류

**게임별 리더보드**
```typescript
interface Leaderboard {
  game: 'flip_match' | 'sequence' | 'math_rush' | 'merge_puzzle';
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all-time';
  region: 'global' | 'country' | 'friends';
}
```

**Flip & Match 리더보드**
- 최단 시간 (Easy/Medium/Hard 별도)
- 일일/주간/전체 랭킹

**Sequence 리더보드**
- 최고 레벨
- 일일/주간/전체 랭킹

**Math Rush 리더보드**
- 최고 점수
- 최고 콤보
- 일일/주간/전체 랭킹

**Merge Puzzle 리더보드**
- 최소 이동 횟수
- 일일/주간/전체 랭킹

#### 2.2 리더보드 UI

```typescript
// LeaderboardScreen.tsx
<View>
  <TabBar>
    <Tab>전체</Tab>
    <Tab>일간</Tab>
    <Tab>주간</Tab>
    <Tab>월간</Tab>
  </TabBar>

  <FilterBar>
    <Button>전 세계</Button>
    <Button>국가</Button>
    <Button>친구</Button>
  </FilterBar>

  <RankingList>
    {rankings.map((rank, index) => (
      <RankCard
        rank={index + 1}
        user={rank.user}
        score={rank.score}
        isCurrentUser={rank.userId === currentUser.id}
      />
    ))}
  </RankingList>

  <MyRank>
    내 순위: #42 / 10,234명
  </MyRank>
</View>
```

#### 2.3 데이터 구조 (Firestore)

```typescript
// Collection: leaderboards
{
  id: "flip_match_easy_daily_2025-10-04",
  game: "flip_match",
  difficulty: "easy",
  timeframe: "daily",
  date: "2025-10-04",
  rankings: [
    {
      userId: "user123",
      username: "Player1",
      score: 15.2,  // seconds
      achievedAt: timestamp,
      country: "KR",
    }
  ],
  updatedAt: timestamp
}
```

---

### 3. 친구 시스템 👥

#### 3.1 친구 추가 방법
```typescript
1. 사용자 ID로 검색
2. QR 코드 스캔
3. 같이 플레이한 사람 (멀티플레이어에서)
4. 추천 친구 (동일 지역/레벨)
```

#### 3.2 친구 기능
- 친구 목록 보기
- 친구 삭제
- 친구 기록 비교
- 친구에게 도전장 보내기
- 친구와 1:1 대결

#### 3.3 UI 구성
```typescript
// FriendsScreen.tsx
<View>
  <SearchBar placeholder="친구 검색 (ID 또는 이름)" />

  <FriendsList>
    {friends.map(friend => (
      <FriendCard
        name={friend.username}
        avatar={friend.avatar}
        status={friend.online ? "온라인" : "오프라인"}
        bestScore={friend.bestScores}
        onChallenge={() => sendChallenge(friend.id)}
        onCompare={() => navigateToComparison(friend.id)}
      />
    ))}
  </FriendsList>

  <AddFriendButton onPress={showAddFriendModal} />
</View>
```

#### 3.4 데이터 구조
```typescript
// Collection: users/{userId}/friends
{
  friendId: "user456",
  username: "Player2",
  avatar: "url",
  addedAt: timestamp,
  status: "accepted" | "pending" | "blocked"
}

// Collection: friendRequests
{
  from: "user123",
  to: "user456",
  status: "pending" | "accepted" | "rejected",
  sentAt: timestamp
}
```

---

### 4. 클라우드 동기화 ☁️

#### 4.1 동기화 데이터
```typescript
interface SyncData {
  userId: string;
  gameRecords: {
    flip_match: GameRecord;
    sequence: GameRecord;
    math_rush: GameRecord;
    merge_puzzle: GameRecord;
  };
  achievements: Achievement[];
  settings: UserSettings;
  lastSyncedAt: timestamp;
}
```

#### 4.2 동기화 전략
```typescript
// 자동 동기화
- 게임 완료 시: 기록 업로드
- 앱 시작 시: 최신 데이터 다운로드
- 충돌 해결: 서버 vs 로컬 비교 후 최고 기록 유지

// 수동 동기화
- 설정 화면에서 "지금 동기화" 버튼
```

#### 4.3 오프라인 지원
```typescript
// 오프라인 큐
- 네트워크 없을 때: 로컬에 저장
- 연결 복구 시: 자동 업로드
- 충돌 시: 사용자에게 선택권
```

---

### 5. 실시간 멀티플레이어 🎮 (선택적)

#### 5.1 지원 게임
**Math Rush 대결**
- 1:1 실시간 계산 대결
- 30초 동안 누가 더 많이 맞추나
- 실시간 점수 비교

**Sequence 경쟁**
- 동시에 같은 패턴 도전
- 누가 먼저 실패하나

#### 5.2 매칭 시스템
```typescript
// 매칭 옵션
1. 친구와 대결
2. 랜덤 매칭 (레벨 비슷한 사람)
3. 방 만들기 (코드 공유)
```

#### 5.3 기술 구현
```typescript
// Firebase Realtime Database 사용
const gameRoom = firebase.database().ref(`rooms/${roomId}`);

// 실시간 상태 동기화
gameRoom.on('value', (snapshot) => {
  const data = snapshot.val();
  updateGameState(data);
});

// 플레이어 액션 전송
gameRoom.child('player1/score').set(newScore);
```

---

## 🗄️ 데이터베이스 설계

### Firestore Collections

```
users/
  {userId}/
    - username: string
    - email: string
    - avatar: string
    - createdAt: timestamp
    - country: string
    - friends/
        {friendId}/
          - username
          - addedAt
    - gameRecords/
        flip_match/
          - bestTime
          - difficulty
          - totalPlays
        sequence/
          - highestLevel
        math_rush/
          - highScore
        merge_puzzle/
          - bestMoves

leaderboards/
  {game}_{difficulty}_{timeframe}_{date}/
    - rankings: array
    - updatedAt: timestamp

achievements/
  {userId}/
    - achievementId: string
    - unlockedAt: timestamp

multiplayer_rooms/
  {roomId}/
    - players: array
    - gameType: string
    - status: 'waiting' | 'playing' | 'finished'
    - scores: object
    - createdAt: timestamp
```

---

## 📝 구현 단계

### Phase 1: 기본 인프라 (2주)
- [ ] Firebase 프로젝트 생성
- [ ] React Native Firebase 설치
- [ ] 인증 시스템 통합
- [ ] 기본 DB 스키마 설계

### Phase 2: 인증 & 프로필 (2주)
- [ ] Google 로그인 구현
- [ ] Apple 로그인 구현
- [ ] 익명 로그인 구현
- [ ] 사용자 프로필 화면
- [ ] 로그인/로그아웃 흐름

### Phase 3: 데이터 동기화 (2주)
- [ ] 로컬 → 클라우드 업로드
- [ ] 클라우드 → 로컬 다운로드
- [ ] 충돌 해결 로직
- [ ] 오프라인 큐 구현

### Phase 4: 리더보드 (3주)
- [ ] 리더보드 데이터 구조
- [ ] 점수 제출 시스템
- [ ] 리더보드 UI 구현
- [ ] 필터링 (일/주/월/전체)
- [ ] 지역별/친구별 필터

### Phase 5: 친구 시스템 (2주)
- [ ] 친구 추가/삭제
- [ ] 친구 검색
- [ ] 친구 목록 UI
- [ ] 친구 요청 알림
- [ ] 친구 기록 비교

### Phase 6: 멀티플레이어 (3주, 선택)
- [ ] 실시간 매칭 시스템
- [ ] 게임 룸 생성
- [ ] 실시간 상태 동기화
- [ ] 매치 결과 저장
- [ ] 매치 히스토리

### Phase 7: 테스트 & 최적화 (2주)
- [ ] 성능 테스트
- [ ] 보안 감사
- [ ] 베타 테스트
- [ ] 버그 수정

**총 예상 기간: 14-16주 (3.5-4개월)**

---

## 🔐 보안 & 개인정보

### Firebase Security Rules

```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자는 자신의 데이터만 읽기/쓰기
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // 리더보드는 모두 읽기, 인증된 사용자만 쓰기
    match /leaderboards/{leaderboardId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // 친구는 양쪽 모두 읽기 가능
    match /users/{userId}/friends/{friendId} {
      allow read: if request.auth.uid == userId ||
                     request.auth.uid == friendId;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

### 개인정보 보호

```typescript
// 최소 정보만 수집
interface UserData {
  userId: string;           // Firebase Auth ID
  username: string;         // 닉네임 (이메일 X)
  avatar?: string;          // 프로필 이미지 (선택)
  country?: string;         // 국가 코드 (선택)
  createdAt: timestamp;
}

// 수집하지 않는 정보
❌ 이메일 주소 (Firebase에만 저장)
❌ 전화번호
❌ 위치 정보
❌ 결제 정보
```

### 개인정보처리방침 업데이트

```markdown
## v3.0 추가 사항

### 수집하는 정보 (로그인 시)
- 닉네임
- 게임 기록
- 친구 목록
- 프로필 이미지 (선택)

### 사용 목적
- 리더보드 순위 표시
- 친구와 기록 비교
- 클라우드 백업

### 제3자 공유
- Firebase (Google): 인증 및 데이터 저장
- 다른 제3자 공유 없음

### 데이터 삭제
- 설정 > 계정 삭제 버튼
- 모든 데이터 영구 삭제
```

---

## 💰 비용 분석

### 시나리오 1: 10,000 DAU

**Firebase 사용량**
- Firestore 읽기: ~500K/일 = 15M/월
- Firestore 쓰기: ~100K/일 = 3M/월
- 스토리지: ~5GB
- 대역폭: ~50GB

**예상 비용: $20-30/월**

---

### 시나리오 2: 50,000 DAU

**Firebase 사용량**
- Firestore 읽기: ~2.5M/일 = 75M/월
- Firestore 쓰기: ~500K/일 = 15M/월
- 스토리지: ~25GB
- 대역폭: ~250GB

**예상 비용: $100-150/월**

---

### 수익화 전략 (비용 충당)

1. **프리미엄 구독 ($2.99/월)**
   - 광고 제거
   - 특별 프로필 테마
   - 추가 통계
   - 500명만 구독해도 비용 충당

2. **보상형 광고**
   - 힌트 얻기
   - 재도전 기회
   - 추가 게임 모드

3. **인앱 구매**
   - 프로필 커스터마이징
   - 특별 업적 배지
   - 게임 스킨

---

## 🎯 성공 지표

### Phase 1 (출시 후 1개월)
- 로그인 전환율: 30%+
- 리더보드 조회: 일 5,000+
- 친구 추가: 사용자당 평균 3명

### Phase 2 (출시 후 3개월)
- 로그인 사용자: 50%+
- 리더보드 참여: 40%+
- 친구 대결: 일 1,000+
- 멀티플레이어: 일 500+ 매치

---

## 📋 체크리스트

### 기술 준비
- [ ] Firebase 프로젝트 생성
- [ ] React Native Firebase 설치
- [ ] 테스트 계정 생성
- [ ] 개발 환경 설정

### 법적 준비
- [ ] 개인정보처리방침 업데이트
- [ ] 이용약관 작성
- [ ] GDPR 준수 확인
- [ ] 아동 보호 정책

### 디자인
- [ ] 로그인 화면 디자인
- [ ] 리더보드 UI
- [ ] 친구 목록 UI
- [ ] 프로필 화면

### 마케팅
- [ ] v3.0 티저 준비
- [ ] 베타 테스터 모집
- [ ] 업데이트 노트 작성
- [ ] 프로모션 계획

---

## 🚀 출시 전략

### 단계별 출시
1. **v3.0 Beta (비공개)** - 베타 테스터 100명
2. **v3.0.0 (제한)** - 로그인만 출시
3. **v3.0.1** - 리더보드 추가
4. **v3.0.2** - 친구 시스템 추가
5. **v3.0.3** - 멀티플레이어 추가

### 피드백 수집
- 인앱 설문
- Discord 커뮤니티
- 이메일 피드백
- 앱스토어 리뷰

---

**작성일**: 2025년 10월 4일
**작성자**: Brain Games Team
**상태**: 계획 단계
