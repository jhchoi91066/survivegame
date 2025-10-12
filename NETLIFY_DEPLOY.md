# 🚀 Netlify 배포 가이드

## 📋 배포 방법

### 방법 1: Netlify Dashboard에서 수동 배포 (추천)

#### 1. dist 폴더 빌드
```bash
npx expo export --platform web
```

#### 2. Netlify에 로그인
- https://app.netlify.com/ 접속
- GitHub 계정으로 로그인

#### 3. 수동 배포
- "Add new site" → "Deploy manually" 클릭
- `dist` 폴더를 드래그 & 드롭
- 배포 완료! 🎉

---

### 방법 2: GitHub 연동 자동 배포

#### 1. GitHub에 코드 푸시
```bash
git add .
git commit -m "준비 완료: Netlify 배포 설정"
git push origin main
```

#### 2. Netlify에서 새 사이트 생성
- Netlify Dashboard → "Add new site" → "Import an existing project"
- GitHub 연결
- 저장소 선택: `survivegame`

#### 3. 빌드 설정
Netlify가 `netlify.toml`을 자동으로 감지합니다:
- **Build command**: `npx expo export --platform web`
- **Publish directory**: `dist`
- **Node version**: `18`

#### 4. 환경 변수 설정
Netlify Dashboard → Site settings → Environment variables에서 추가:

```
EXPO_PUBLIC_SUPABASE_URL=https://yqngfoowohacuozaofyb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=(Google OAuth 클라이언트 ID)
```

⚠️ **중요**: `.env` 파일의 값을 그대로 복사하세요.

#### 5. 배포 시작
- "Deploy site" 클릭
- 자동 빌드 & 배포 시작
- 완료되면 고유 URL 생성 (예: `https://random-name-123.netlify.app`)

---

## 🔧 커스텀 도메인 설정 (선택)

1. Netlify Dashboard → Domain management
2. "Add custom domain" 클릭
3. 도메인 입력 (예: `braingames.com`)
4. DNS 설정 안내에 따라 설정
5. SSL 인증서 자동 발급 (Let's Encrypt)

---

## 📦 빌드된 파일 구조

```
dist/
├── index.html                    # 메인 HTML
├── favicon.ico                   # 파비콘
├── metadata.json                 # 앱 메타데이터
├── _expo/
│   └── static/
│       ├── js/
│       │   └── web/
│       │       └── index-[hash].js  # 메인 JS 번들 (2MB)
│       └── assets/
│           ├── sounds/           # 사운드 파일들
│           └── icons/            # 아이콘들
```

---

## ✅ 배포 체크리스트

- [x] `metro.config.js` 생성 (오디오 파일 지원)
- [x] `netlify.toml` 생성 (빌드 설정)
- [x] `.env` 파일 확인 (환경 변수)
- [x] `npx expo export --platform web` 성공
- [ ] Netlify에 환경 변수 추가
- [ ] 배포 후 웹사이트 테스트

---

## 🐛 문제 해결

### 1. 빌드 실패: "Unable to resolve module"
- `metro.config.js`가 올바르게 설정되었는지 확인
- `node_modules` 삭제 후 재설치: `npm install`

### 2. 환경 변수가 적용되지 않음
- Netlify Dashboard에서 환경 변수 재확인
- 변수명이 정확히 일치하는지 확인 (`EXPO_PUBLIC_` 접두사 필수)
- 배포 재시작

### 3. 사운드가 재생되지 않음 (웹)
- 웹 브라우저는 사용자 인터랙션 후에만 오디오 재생 가능
- 첫 번째 클릭 후부터 사운드가 정상 작동

### 4. 페이지 새로고침 시 404 에러
- `netlify.toml`의 리다이렉트 설정 확인
- SPA 라우팅을 위해 모든 경로를 `index.html`로 리다이렉트

---

## 📊 배포 후 확인 사항

1. **기본 기능 테스트**
   - [ ] 메인 메뉴 로딩
   - [ ] 4개 게임 실행
   - [ ] 사운드 재생 (Settings에서 활성화)
   - [ ] 햅틱 피드백 (모바일만)

2. **온라인 기능 테스트**
   - [ ] 로그인/로그아웃
   - [ ] 리더보드 조회
   - [ ] 친구 추가/삭제
   - [ ] 게임 기록 동기화

3. **성능 확인**
   - [ ] 페이지 로딩 속도 (3초 이내)
   - [ ] 게임 실행 부드러움
   - [ ] 모바일 반응형 디자인

---

## 🎯 최종 배포 URL

배포 완료 후 URL:
- Production: `https://your-site-name.netlify.app`
- 커스텀 도메인: `https://your-domain.com` (설정 시)

---

## 📝 참고 링크

- [Netlify 공식 문서](https://docs.netlify.com/)
- [Expo Web 배포 가이드](https://docs.expo.dev/distribution/publishing-websites/)
- [개인정보처리방침](https://jhchoi91066.github.io/survivegame/privacy-policy.html)

---

**작성일**: 2025-10-12
**버전**: v1.0.0
