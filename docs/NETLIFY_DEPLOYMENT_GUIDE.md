# Netlify 배포 가이드 - 멀티플레이어 테스트

**목적:** 멀티플레이어 기능을 실제 배포 환경에서 테스트

---

## ✅ 준비 완료

- ✅ `netlify.toml` 설정 완료
- ✅ 웹 빌드 완료 (`dist` 폴더)
- ✅ 빌드 크기: ~2MB (optimized)

---

## 🚀 배포 방법 (3가지 옵션)

### Option 1: Netlify CLI (가장 빠름) ⭐ 추천

```bash
# 1. Netlify CLI 설치 (처음 한 번만)
npm install -g netlify-cli

# 2. Netlify 로그인
netlify login

# 3. 배포 (첫 배포)
netlify deploy --prod

# 선택사항:
# - Site name을 입력하거나 엔터 (자동 생성)
# - Publish directory: dist

# 4. 배포된 URL 확인
# 예: https://your-app-name.netlify.app
```

**재배포 (수정 후):**
```bash
# 웹 빌드
npx expo export -p web

# 재배포
netlify deploy --prod
```

---

### Option 2: Netlify 웹사이트 (GUI)

1. **Netlify 사이트 접속**
   - https://app.netlify.com

2. **로그인 또는 회원가입**

3. **"Add new site" → "Deploy manually"**

4. **`dist` 폴더를 드래그 & 드롭**
   - 프로젝트 루트의 `dist` 폴더 전체를 드롭

5. **배포 완료!**
   - 몇 초 후 URL 생성됨
   - 예: `https://random-name-123.netlify.app`

---

### Option 3: GitHub 연동 (자동 배포)

1. **GitHub에 코드 푸시**
   ```bash
   git add .
   git commit -m "Add multiplayer features"
   git push origin main
   ```

2. **Netlify에서 GitHub 연동**
   - "Add new site" → "Import from Git"
   - GitHub 선택 → 저장소 선택
   - Build settings:
     - Build command: `npx expo export --platform web`
     - Publish directory: `dist`

3. **환경 변수 설정 (중요!)**
   - Site settings → Environment variables
   - 추가:
     - `EXPO_PUBLIC_SUPABASE_URL`: Supabase URL
     - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key

4. **Deploy 버튼 클릭**

---

## 🔧 환경 변수 설정 (필수)

Netlify에서 Supabase에 접근하려면 환경 변수를 설정해야 합니다.

### Netlify UI에서 설정:
1. Site settings → Environment variables
2. "Add a variable" 클릭
3. 다음 변수 추가:

```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 현재 .env 파일 확인:
```bash
cat .env
```

⚠️ **중요:** `.env` 파일의 값을 Netlify 환경 변수에 복사하세요!

---

## 🧪 배포 후 테스트

### 1. 배포 URL 확인
배포가 완료되면 다음과 같은 URL을 받습니다:
- 예: `https://survivegame-123.netlify.app`

### 2. 멀티플레이어 테스트 시작

**브라우저 2개 창:**
- Window 1: `https://your-app.netlify.app`
- Window 2: `https://your-app.netlify.app` (시크릿 모드)

**테스트 시나리오:**
1. ✅ Happy Path - 정상 게임 플레이
2. ✅ Disconnect & Reconnect
3. ✅ Race Condition
4. ✅ Heartbeat
5. ✅ Single-Player

### 3. 데이터베이스 모니터링

배포된 사이트에서 테스트하는 동안:

```sql
-- 활성 방 확인
SELECT * FROM multiplayer_rooms WHERE status != 'finished';

-- 플레이어 presence 확인
SELECT
  user_id,
  status,
  last_heartbeat,
  EXTRACT(EPOCH FROM (NOW() - last_heartbeat)) as seconds_ago
FROM player_presence;

-- 게임 상태 확인
SELECT * FROM multiplayer_game_states;
```

---

## 🐛 트러블슈팅

### 문제 1: 페이지가 로딩되지 않음
**원인:** 빌드 오류 또는 라우팅 문제
**해결:**
```bash
# 로컬에서 빌드 테스트
npx expo export -p web
npx serve dist

# 브라우저에서 localhost:3000 확인
```

### 문제 2: Supabase 연결 실패
**원인:** 환경 변수 누락
**해결:**
1. Netlify UI → Environment variables 확인
2. `EXPO_PUBLIC_SUPABASE_URL` 존재하는지 확인
3. 변수 수정 후 **Redeploy** 필요

### 문제 3: 멀티플레이어 기능 작동 안 함
**원인:** Database 권한 또는 RLS 정책
**해결:**
```sql
-- RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename IN ('multiplayer_rooms', 'multiplayer_game_states', 'player_presence');

-- 함수 존재 확인
SELECT proname FROM pg_proc WHERE proname LIKE 'join_multiplayer%';
```

### 문제 4: 느린 빌드
**원인:** 캐시 문제
**해결:**
```bash
# 캐시 클리어 후 재빌드
npx expo export -p web --clear
```

---

## 📊 배포 체크리스트

배포 전:
- [ ] `.env` 파일에 Supabase 정보 있음
- [ ] `netlify.toml` 설정 완료
- [ ] 로컬 빌드 성공 (`npx expo export -p web`)
- [ ] `dist` 폴더 생성됨

배포 중:
- [ ] Netlify 계정 로그인
- [ ] 사이트 생성 또는 선택
- [ ] 환경 변수 설정 (Supabase URL, Key)
- [ ] 배포 완료

배포 후:
- [ ] URL 접속 확인
- [ ] 로그인 작동 확인
- [ ] 멀티플레이어 로비 접근 확인
- [ ] 방 생성/참가 테스트
- [ ] 데이터베이스 연결 확인

---

## 🎯 빠른 배포 (CLI 사용)

이미 `dist` 폴더가 있으므로 바로 배포 가능:

```bash
# 1. CLI 설치 (한 번만)
npm install -g netlify-cli

# 2. 로그인
netlify login

# 3. 배포
netlify deploy --prod

# 프롬프트에서:
# - Publish directory: dist (입력)
# - Site name: 엔터 (자동 생성)

# 4. 배포 완료!
# URL이 출력됨: https://xxx.netlify.app
```

---

## 📱 모바일에서 테스트

배포 후 모바일 브라우저에서도 테스트 가능:

1. **QR 코드 생성**
   - https://www.qr-code-generator.com
   - URL 입력: `https://your-app.netlify.app`

2. **모바일 브라우저로 접속**
   - Safari (iOS)
   - Chrome (Android)

3. **멀티플레이어 테스트**
   - 모바일 + 데스크톱
   - 또는 모바일 2대

---

## 🚀 다음 단계

배포 성공 후:

1. **성능 모니터링**
   - Netlify Analytics 활성화
   - Supabase Dashboard에서 쿼리 모니터링

2. **도메인 연결** (선택사항)
   - Netlify에서 커스텀 도메인 추가
   - 예: `survivegame.com`

3. **HTTPS 자동 적용**
   - Netlify는 자동으로 SSL 인증서 발급

---

**배포 완료 후 이 문서에 URL을 기록하세요:**

```
Production URL: https://_____________________.netlify.app
Deployed on: _____________________
```

---

**참고 링크:**
- Netlify Docs: https://docs.netlify.com
- Expo Web Docs: https://docs.expo.dev/workflow/web
- Supabase Docs: https://supabase.com/docs
