# Google OAuth 설정 가이드

이 가이드는 Brain Games 앱에 Google 로그인을 설정하는 방법입니다.

## 1. Google Cloud Console 설정

### 1.1 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 프로젝트 이름: `Brain Games` (또는 원하는 이름)

### 1.2 OAuth 동의 화면 설정
1. 좌측 메뉴에서 **APIs & Services** → **OAuth consent screen** 선택
2. User Type: **External** 선택 후 **CREATE**
3. 앱 정보 입력:
   - App name: `Brain Games`
   - User support email: (본인 이메일)
   - Developer contact information: (본인 이메일)
4. Scopes: 기본값 유지 (email, profile, openid)
5. Test users: 본인 Gmail 주소 추가 (테스트용)
6. **SAVE AND CONTINUE** → **BACK TO DASHBOARD**

### 1.3 OAuth 2.0 클라이언트 ID 생성

#### A. Web 클라이언트 (필수)
1. **APIs & Services** → **Credentials** → **+ CREATE CREDENTIALS** → **OAuth client ID**
2. Application type: **Web application**
3. Name: `Brain Games Web`
4. Authorized redirect URIs:
   ```
   https://yqngfoowohacuozaofyb.supabase.co/auth/v1/callback
   ```
   (본인의 Supabase Project URL 사용)
5. **CREATE** 클릭
6. **Client ID**와 **Client secret** 복사 → 안전한 곳에 저장

#### B. Android 클라이언트 (선택)
1. 터미널에서 SHA-1 지문 생성:
   ```bash
   # Debug keystore
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

   # 또는 Expo를 사용하는 경우
   expo credentials:manager
   ```
2. **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Application type: **Android**
4. Name: `Brain Games Android`
5. Package name: `com.braingames.collection` (app.json의 package와 동일)
6. SHA-1 certificate fingerprint: (위에서 복사한 값)
7. **CREATE**

#### C. iOS 클라이언트 (선택)
1. **+ CREATE CREDENTIALS** → **OAuth client ID**
2. Application type: **iOS**
3. Name: `Brain Games iOS`
4. Bundle ID: `com.braingames.collection` (app.json의 bundleIdentifier와 동일)
5. **CREATE**

## 2. Supabase 설정

### 2.1 Google Provider 활성화
1. [Supabase Dashboard](https://app.supabase.com/) → 본인 프로젝트 선택
2. 좌측 메뉴 **Authentication** → **Providers** → **Google**
3. **Enable Google provider** 토글 ON
4. Google Cloud Console에서 복사한 정보 입력:
   - **Client ID (for OAuth)**: (Web 클라이언트 ID)
   - **Client Secret (for OAuth)**: (Web 클라이언트 secret)
5. **Authorized Client IDs** (선택):
   - Android Client ID 추가
   - iOS Client ID 추가
6. **Save** 클릭

## 3. 환경 변수 설정

`.env` 파일에 다음 추가:

```env
# Supabase (기존)
EXPO_PUBLIC_SUPABASE_URL=https://yqngfoowohacuozaofyb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Google OAuth (신규)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id.apps.googleusercontent.com (선택)
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id.apps.googleusercontent.com (선택)
```

## 4. app.json 업데이트

`app.json`의 `plugins` 섹션에 추가:

```json
{
  "expo": {
    "plugins": [
      "@react-native-google-signin/google-signin"
    ]
  }
}
```

## 5. 코드 통합

### 5.1 AuthContext 업데이트
`src/contexts/AuthContext.tsx`에서 Google 로그인 구현:

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// 초기화
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, // iOS만
});

const signInWithGoogle = async () => {
  await GoogleSignin.hasPlayServices();
  const userInfo = await GoogleSignin.signIn();
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: userInfo.idToken,
  });
  if (error) throw error;
};
```

## 6. 테스트

### 6.1 개발 환경
1. Expo 서버 재시작: `npx expo start -c`
2. 웹 브라우저에서 테스트 (가장 간단)
3. LoginScreen → Google 로그인 버튼 클릭
4. Google 계정 선택 → 권한 동의
5. 로그인 성공 확인

### 6.2 모바일 앱
- **Android**:
  - SHA-1 지문이 정확해야 함
  - `eas build --platform android --profile development`
- **iOS**:
  - Bundle ID가 일치해야 함
  - `eas build --platform ios --profile development`

## 7. 문제 해결

### "Developer Error" 또는 "idpiframe_initialization_failed"
- Redirect URI가 정확한지 확인
- Supabase Project URL 확인 (`https://PROJECT_REF.supabase.co`)

### Android에서 로그인 실패
- SHA-1 지문이 맞는지 재확인
- `keytool` 명령어로 다시 확인
- Google Cloud Console에 정확히 입력했는지 확인

### iOS에서 로그인 실패
- Bundle ID 일치 확인
- iOS Client ID가 올바른지 확인

## 8. 배포 시 주의사항

### Production Keystore (Android)
- 릴리스 빌드용 SHA-1 지문 별도 생성 필요
- `eas build --platform android --profile production`
- 생성된 keystore의 SHA-1도 Google Cloud Console에 추가

### App Store Connect (iOS)
- Bundle ID가 프로비저닝 프로필과 일치해야 함
- iOS Client ID 재확인

## 참고 자료
- [Supabase Google OAuth 문서](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 문서](https://developers.google.com/identity/protocols/oauth2)
- [Expo Google Sign-In](https://docs.expo.dev/guides/google-authentication/)
