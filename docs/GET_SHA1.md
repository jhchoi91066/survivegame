# Android SHA-1 지문 얻는 방법

Google OAuth Android 클라이언트를 만들 때 필요한 정보입니다.

## 필요한 정보

### 1. 패키지 이름
```
com.braingames.collection
```
(이것은 `app.json`의 `android.package` 값입니다)

---

## SHA-1 디지털 지문 얻기

### 방법 1: Expo를 사용하는 경우 (권장)

Expo를 사용 중이므로 빌드할 때까지 SHA-1이 없습니다. **개발 중에는 웹 로그인만 사용**하고, 나중에 빌드 시 SHA-1을 추가하세요.

#### 개발 빌드 생성 후 SHA-1 얻기:

```bash
# 1. EAS로 개발 빌드 생성
cd /Users/jinhochoi/Desktop/개발/survivegame
eas build --platform android --profile development

# 2. 빌드 완료 후 SHA-1 확인
eas credentials
# → Android → App Signing Credentials → SHA-1 복사
```

### 방법 2: 로컬 Debug Keystore 사용 (대안)

prebuild 후에 로컬 빌드를 실행하면 자동으로 debug keystore가 생성됩니다:

```bash
# 1. Android 프로젝트 생성
npx expo prebuild --platform android

# 2. Android 앱 빌드 (SHA-1 생성됨)
cd android
./gradlew assembleDebug

# 3. SHA-1 확인
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA1
```

---

## 간단한 해결책 (추천)

### 현재 단계: 웹에서만 테스트

1. **지금은 Android 클라이언트 ID를 만들지 마세요**
2. **웹 클라이언트 ID만** 만들어서 웹 브라우저에서 Google 로그인 테스트
3. 웹에서 모든 기능이 정상 작동하는지 확인
4. 나중에 출시 준비할 때 Android 빌드 + SHA-1 추가

### Google Cloud Console에서:

**웹 클라이언트만 생성:**
- Application type: **Web application**
- Name: `Brain Games Web`
- Authorized redirect URIs:
  ```
  https://yqngfoowohacuozaofyb.supabase.co/auth/v1/callback
  ```

**Android는 나중에:**
- 출시 준비 단계에서 EAS 빌드 생성 후
- SHA-1 확인 후 추가

---

## 요약

| 플랫폼 | 지금 필요? | SHA-1 필요? |
|--------|-----------|------------|
| **웹** | ✅ 예 | ❌ 아니오 |
| **Android** | ❌ 나중에 | ✅ 예 (빌드 후) |
| **iOS** | ❌ 나중에 | ❌ 아니오 |

**결론**: 지금은 **웹 클라이언트 ID만** 만들고, 웹 브라우저에서 Google 로그인 테스트하세요!
