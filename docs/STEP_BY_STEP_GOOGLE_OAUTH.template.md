# Google OAuth 클라이언트 ID 얻기 - 단계별 가이드

웹에서 Google 로그인을 사용하기 위한 간단한 설정 가이드입니다.

---

## 🚀 전체 과정 요약

1. Google Cloud Console에서 프로젝트 생성 (2분)
2. OAuth 동의 화면 설정 (3분)
3. 웹 클라이언트 ID 생성 (2분)
4. Supabase에 설정 (2분)
5. .env 파일에 추가 (1분)

**총 소요시간: 약 10분**

---

## 1단계: Google Cloud Console 접속 및 프로젝트 생성

### 1-1. 콘솔 접속
1. 브라우저에서 https://console.cloud.google.com/ 접속
2. Google 계정으로 로그인

### 1-2. 새 프로젝트 만들기
1. 상단 드롭다운 메뉴 클릭 (프로젝트 선택 버튼)
2. **새 프로젝트(New Project)** 클릭
3. 프로젝트 이름 입력:
   ```
   Brain Games
   ```
4. **만들기(Create)** 클릭
5. 프로젝트가 생성될 때까지 잠시 대기 (10-30초)
6. 상단 알림에서 **프로젝트 선택(Select Project)** 클릭

---

## 2단계: OAuth 동의 화면 설정

### 2-1. OAuth 동의 화면으로 이동
1. 좌측 메뉴 **≡** 클릭
2. **APIs & Services** → **OAuth consent screen** 클릭

### 2-2. User Type 선택
1. **External** 선택
2. **CREATE** 버튼 클릭

### 2-3. 앱 정보 입력 (1/4 페이지)

**App information:**
- App name: `Brain Games`
- User support email: (본인의 Gmail 주소 선택)

**App domain (선택사항 - 비워둬도 됨):**
- Application home page: (비워두기)
- Application privacy policy link: (비워두기)
- Application terms of service link: (비워두기)

**Authorized domains (선택사항):**
- (비워두기)

**Developer contact information:**
- Email addresses: (본인의 Gmail 주소)

**SAVE AND CONTINUE** 클릭

### 2-4. Scopes 설정 (2/4 페이지)
1. 아무것도 추가하지 않고 **SAVE AND CONTINUE** 클릭
   (기본 scope인 email, profile, openid가 자동으로 포함됨)

### 2-5. Test users 추가 (3/4 페이지)
1. **+ ADD USERS** 클릭
2. 본인의 Gmail 주소 입력
   ```
   your-email@gmail.com
   ```
3. **ADD** 클릭
4. **SAVE AND CONTINUE** 클릭

### 2-6. 요약 확인 (4/4 페이지)
1. 설정 내용 확인
2. **BACK TO DASHBOARD** 클릭

---

## 3단계: 웹 OAuth 클라이언트 ID 생성

### 3-1. Credentials 페이지로 이동
1. 좌측 메뉴에서 **Credentials** 클릭

### 3-2. OAuth 클라이언트 ID 생성
1. 상단의 **+ CREATE CREDENTIALS** 클릭
2. **OAuth client ID** 선택

### 3-3. 클라이언트 정보 입력

**Application type:**
- **Web application** 선택

**Name:**
```
Brain Games Web
```

**Authorized JavaScript origins (선택사항):**
- (비워두기 또는 나중에 추가)

**Authorized redirect URIs:**
1. **+ ADD URI** 클릭
2. 다음 URL 정확히 입력:
   ```
   https://yqngfoowohacuozaofyb.supabase.co/auth/v1/callback
   ```
   ⚠️ **중요**: 본인의 Supabase Project URL을 사용하세요!
   - 형식: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

### 3-4. 클라이언트 ID 생성
1. **CREATE** 버튼 클릭
2. 팝업이 나타나면:
   - **Client ID** 복사 (메모장에 저장)
   - **Client secret** 복사 (메모장에 저장)
3. **OK** 클릭

**예시:**
```
Client ID: YOUR_CLIENT_ID.apps.googleusercontent.com
Client secret: GOCSPX-YOUR_CLIENT_SECRET
```

---

## 4단계: Supabase 설정

### 4-1. Supabase Dashboard 접속
1. https://app.supabase.com/ 접속
2. 프로젝트 선택 (`survivegame`)

### 4-2. Google Provider 활성화
1. 좌측 메뉴에서 **Authentication** (🔐 아이콘) 클릭
2. **Providers** 탭 클릭
3. **Google** 찾아서 클릭

### 4-3. Google 정보 입력
1. **Enable Google provider** 토글을 **ON**으로 변경
2. **Client ID (for OAuth)** 입력:
   ```
   (Google Cloud Console에서 복사한 Client ID)
   ```
3. **Client Secret (for OAuth)** 입력:
   ```
   (Google Cloud Console에서 복사한 Client secret)
   ```
4. 하단의 **Save** 버튼 클릭

---

## 5단계: 환경 변수 설정

### 5-1. .env 파일 열기
프로젝트 루트의 `.env` 파일을 엽니다.

### 5-2. Google Client ID 추가
파일 끝에 다음 줄 추가:

```env
# Google OAuth
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
```

⚠️ **주의**: 본인의 Client ID로 교체하세요!

### 5-3. 파일 저장
- macOS: `Cmd + S`
- Windows/Linux: `Ctrl + S`

---

## 6단계: 테스트

### 6-1. Expo 서버 재시작
터미널에서:
```bash
# Ctrl+C로 서버 중지
# 그 다음 캐시 클리어하고 재시작
npx expo start -c
```

### 6-2. 웹 브라우저에서 테스트
1. 터미널에서 `w` 키 입력 (웹 브라우저 열기)
2. LoginScreen이 나타나면 **Google로 계속하기** 버튼 클릭
3. Google 계정 선택
4. 권한 동의 화면에서 **계속(Continue)** 클릭
5. ✅ 로그인 성공!

---

## 🎉 완료!

이제 Google 로그인이 작동합니다!

### 확인 방법:
- MenuScreen 우측 상단에 **👤** 아이콘 (로그인 상태)
- Profile 화면에서 본인 이메일 확인
- 리더보드, 친구, 대전 기능 모두 사용 가능

---

## ❌ 문제 해결

### "Developer Error" 또는 "400: redirect_uri_mismatch"
**원인**: Redirect URI가 일치하지 않음

**해결**:
1. Google Cloud Console → Credentials → 생성한 클라이언트 클릭
2. **Authorized redirect URIs** 확인:
   ```
   https://yqngfoowohacuozaofyb.supabase.co/auth/v1/callback
   ```
3. Supabase Project URL이 정확한지 재확인
4. 수정 후 **SAVE** 클릭

### ".env 파일이 안 읽힘"
**원인**: 서버 재시작 안 됨

**해결**:
```bash
# 완전 종료 후 재시작
npx expo start -c
```

### "Test users만 로그인 가능"
**정상입니다!**
- OAuth 동의 화면이 "Testing" 상태이면 Test users만 로그인 가능
- 개발 중에는 본인 계정만 추가해서 사용
- 출시 시 "Production"으로 변경 (심사 필요)

### 모바일 앱에서 안 됨
**정상입니다!**
- 현재 설정은 **웹 전용**
- 모바일은 추가 설정 필요 (SHA-1 등)
- 웹 브라우저에서만 테스트하세요

---

## 📌 중요 정보 저장

다음 정보는 안전한 곳에 보관하세요:

```
Google Cloud Project: Brain Games
Client ID: (생성된 ID)
Client Secret: (생성된 Secret)
Supabase Project: yqngfoowohacuozaofyb
```

---

## 다음 단계

### 선택 1: 그대로 사용
- 웹 브라우저에서 Google 로그인 사용
- 모바일은 익명 로그인 사용

### 선택 2: 모바일 추가 (출시 전)
1. EAS Build로 Android/iOS 앱 빌드
2. SHA-1 (Android) 또는 Bundle ID (iOS) 확인
3. Google Cloud Console에 추가 클라이언트 생성
4. [GOOGLE_AUTH_SETUP.md](./GOOGLE_AUTH_SETUP.md) 참고

---

**축하합니다! Google 로그인 설정이 완료되었습니다! 🎉**
