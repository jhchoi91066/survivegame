# 빠른 인증 설정 가이드

로그인 기능을 빠르게 테스트하려면 아래 단계를 따라주세요.

## 옵션 1: 익명 로그인 (즉시 사용 가능) ✅

**추가 설정 불필요!** 익명 로그인은 이미 작동합니다.

1. 앱 실행: `npx expo start`
2. LoginScreen에서 "익명으로 계속하기" 버튼 클릭
3. 즉시 사용 가능!

**장점**:
- 설정 불필요
- 즉시 테스트 가능
- 온라인 기능 모두 사용 가능

**단점**:
- 기기별로 별도 계정
- 다른 기기에서 로그인 불가

---

## 옵션 2: Google 로그인 (권장) 🔐

Google 계정으로 로그인하려면 다음 3단계만 진행하세요.

### 1단계: Google Cloud Console 설정 (10분)

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성: `Brain Games`
3. **OAuth consent screen** 설정:
   - User Type: External
   - App name: `Brain Games`
   - User support email: (본인 이메일)
   - Test users: (본인 Gmail) 추가
4. **Credentials** → **OAuth 2.0 Client ID** 생성:
   - Type: **Web application**
   - Name: `Brain Games Web`
   - Authorized redirect URIs:
     ```
     https://yqngfoowohacuozaofyb.supabase.co/auth/v1/callback
     ```
   - **Client ID**와 **Client Secret** 복사

### 2단계: Supabase 설정 (2분)

1. [Supabase Dashboard](https://app.supabase.com/) → 프로젝트 선택
2. **Authentication** → **Providers** → **Google**
3. Enable Google provider
4. Client ID와 Client Secret 입력
5. **Save**

### 3단계: 환경 변수 설정 (1분)

`.env` 파일 수정:

```env
# 기존 (유지)
EXPO_PUBLIC_SUPABASE_URL=https://yqngfoowohacuozaofyb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# 새로 추가
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
```

### 4단계: 서버 재시작

```bash
# Ctrl+C로 서버 종료 후
npx expo start -c
```

---

## 테스트 방법

### 웹에서 테스트 (가장 간단)
1. `npx expo start`
2. `w` 키 눌러서 웹 브라우저 열기
3. LoginScreen → "Google로 계속하기" 클릭
4. Google 계정 선택
5. 로그인 성공!

### 모바일에서 테스트 (추가 설정 필요)
- Android: SHA-1 지문 필요
- iOS: iOS Client ID 필요
- 자세한 내용: [GOOGLE_AUTH_SETUP.md](./GOOGLE_AUTH_SETUP.md)

---

## 문제 해결

### "Developer Error"
- Supabase Redirect URI가 정확한지 확인
- 형식: `https://PROJECT_REF.supabase.co/auth/v1/callback`

### 웹에서만 작동
- 정상입니다! 모바일은 추가 설정 필요 (SHA-1 등)
- 웹 테스트로 충분하면 추가 설정 불필요

### 환경 변수가 안 읽힘
- 서버 완전 재시작 (`-c` 옵션)
- `.env` 파일 위치 확인 (프로젝트 루트)

---

## 다음 단계

1. ✅ 익명 로그인 → 즉시 사용
2. ✅ Google 웹 로그인 → 13분 설정
3. 🔒 Google 모바일 → 추가 30분 ([GOOGLE_AUTH_SETUP.md](./GOOGLE_AUTH_SETUP.md) 참고)
4. 🔒 Apple 로그인 → Apple Developer 계정 필요

**권장**: 개발 중에는 **익명 로그인** 또는 **Google 웹 로그인**만 사용하고,
정식 출시 전에 모바일 OAuth 설정을 완료하세요.
