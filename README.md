# 🎮 Brain Games - 두뇌 게임 컬렉션

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/yourusername/brain-games)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0-000020.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

4가지 중독성 있는 두뇌 게임으로 당신의 기억력, 집중력, 계산 능력을 테스트하세요!

[English](#english) | [한국어](#korean)

---

## 📱 스크린샷

| 메뉴 화면 | Flip & Match | Sequence | Math Rush |
|:---:|:---:|:---:|:---:|
| ![Menu](docs/screenshots/menu.png) | ![FlipMatch](docs/screenshots/flip-match.png) | ![Sequence](docs/screenshots/sequence.png) | ![MathRush](docs/screenshots/math-rush.png) |

---

<a name="korean"></a>

## 🇰🇷 한국어

### ✨ 주요 기능

#### 🎴 **Flip & Match**
- 클래식 메모리 카드 게임
- 3가지 난이도 (쉬움, 보통, 어려움)
- 최단 시간 기록 도전
- 부드러운 카드 뒤집기 애니메이션

#### 🔢 **Sequence**
- 숫자 순서 기억 게임
- 레벨이 올라갈수록 증가하는 난이도
- 무한 도전 모드
- 실시간 타이머 (0.01초 정밀도)

#### ➕ **Math Rush**
- 30초 빠른 계산 게임
- 연속 정답 콤보 시스템
- 사칙연산 랜덤 출제
- 실시간 점수 표시

#### 🧩 **Merge Puzzle**
- 2048 스타일 숫자 합치기
- 전략적 사고력 개발
- 3x3 그리드 퍼즐
- 최소 이동 횟수 도전

### 🎨 디자인 & UX

- **프리미엄 디자인**: 그라데이션, 글래스모피즘 효과
- **다크/라이트 모드**: 자동 테마 전환 지원
- **반응형 레이아웃**: 모든 화면 크기 최적화
- **부드러운 애니메이션**: React Native Reanimated
- **햅틱 피드백**: 촉각적 반응
- **직관적인 인터페이스**: 간단하고 명확한 UX

### 📊 통계 & 진행 상황

- 게임별 최고 기록 추적
- 총 플레이 횟수 및 시간
- 상세한 통계 대시보드
- 업적 시스템 (준비 중)
- 로컬 저장 (서버 불필요)

### 🚀 시작하기

#### 필수 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Expo CLI
- iOS 시뮬레이터 또는 Android 에뮬레이터 (선택)

#### 설치

```bash
# 저장소 복제
git clone https://github.com/yourusername/brain-games.git
cd brain-games

# 의존성 설치
npm install

# 개발 서버 시작
npx expo start
```

#### 실행

```bash
# iOS에서 실행
npx expo run:ios

# Android에서 실행
npx expo run:android

# 웹에서 실행
npx expo start --web
```

### 🛠️ 기술 스택

- **프레임워크**: React Native + Expo
- **언어**: TypeScript
- **상태 관리**: Zustand
- **애니메이션**: React Native Reanimated
- **네비게이션**: React Navigation
- **UI**: expo-linear-gradient
- **저장소**: AsyncStorage
- **햅틱**: expo-haptics
- **리뷰**: expo-store-review

### 📁 프로젝트 구조

```
brain-games/
├── src/
│   ├── screens/          # 화면 컴포넌트
│   │   ├── MenuScreen.tsx
│   │   ├── FlipMatchGame.tsx
│   │   ├── SequenceGame.tsx
│   │   ├── MathRushGame.tsx
│   │   └── MergePuzzleGame.tsx
│   ├── game/            # 게임 로직
│   │   ├── flipmatch/
│   │   ├── sequence/
│   │   ├── mathrush/
│   │   └── mergepuzzle/
│   ├── components/      # 재사용 컴포넌트
│   │   └── shared/
│   ├── contexts/        # Context API
│   │   ├── ThemeContext.tsx
│   │   └── AccessibilityContext.tsx
│   └── utils/           # 유틸리티
│       ├── haptics.ts
│       ├── statsManager.ts
│       └── reviewManager.ts
├── docs/                # 문서
│   ├── development_roadmap.md
│   ├── LAUNCH_CHECKLIST.md
│   ├── privacy-policy.md
│   └── store-listing.md
└── assets/             # 이미지 및 폰트
```

### 🔧 빌드

#### Development 빌드

```bash
# Android
npx eas build --profile development --platform android

# iOS
npx eas build --profile development --platform ios
```

#### Production 빌드

```bash
# Android (AAB)
npx eas build --profile production --platform android

# iOS (IPA)
npx eas build --profile production --platform ios
```

### 📝 출시 체크리스트

자세한 출시 준비 사항은 [LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md)를 참조하세요.

- [x] 4개 게임 완성
- [x] 프리미엄 UI/UX
- [x] 다크/라이트 모드
- [x] 통계 시스템
- [x] 온보딩 튜토리얼
- [x] 앱 리뷰 시스템
- [x] 에러 처리
- [x] 출시 문서 작성
- [ ] 앱 아이콘 제작
- [ ] 스크린샷 촬영
- [ ] 스토어 등록

### 🤝 기여하기

기여를 환영합니다! 다음 단계를 따라주세요:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 📄 라이선스

MIT License - [LICENSE](LICENSE) 파일을 참조하세요.

### 📧 문의

- 이메일: support@braingames.com
- 이슈: [GitHub Issues](https://github.com/yourusername/brain-games/issues)

### 🙏 감사의 말

- React Native 팀
- Expo 팀
- 오픈 소스 커뮤니티

---

<a name="english"></a>

## 🇺🇸 English

### ✨ Features

#### 🎴 **Flip & Match**
- Classic memory card game
- 3 difficulty levels (Easy, Medium, Hard)
- Best time record challenge
- Smooth card flip animations

#### 🔢 **Sequence**
- Number sequence memory game
- Increasing difficulty as levels progress
- Infinite challenge mode
- Real-time timer (0.01s precision)

#### ➕ **Math Rush**
- 30-second quick calculation game
- Consecutive correct answer combo system
- Random arithmetic operations
- Real-time score display

#### 🧩 **Merge Puzzle**
- 2048-style number merging
- Strategic thinking development
- 3x3 grid puzzle
- Minimum moves challenge

### 🎨 Design & UX

- **Premium Design**: Gradients, glassmorphism effects
- **Dark/Light Mode**: Automatic theme switching
- **Responsive Layout**: Optimized for all screen sizes
- **Smooth Animations**: React Native Reanimated
- **Haptic Feedback**: Tactile responses
- **Intuitive Interface**: Simple and clear UX

### 📊 Statistics & Progress

- Track best records per game
- Total play count and time
- Detailed statistics dashboard
- Achievement system (coming soon)
- Local storage (no server required)

### 🚀 Getting Started

#### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (optional)

#### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/brain-games.git
cd brain-games

# Install dependencies
npm install

# Start development server
npx expo start
```

#### Running

```bash
# Run on iOS
npx expo run:ios

# Run on Android
npx expo run:android

# Run on Web
npx expo start --web
```

### 🛠️ Tech Stack

- **Framework**: React Native + Expo
- **Language**: TypeScript
- **State Management**: Zustand
- **Animation**: React Native Reanimated
- **Navigation**: React Navigation
- **UI**: expo-linear-gradient
- **Storage**: AsyncStorage
- **Haptics**: expo-haptics
- **Review**: expo-store-review

### 🔧 Building

#### Development Build

```bash
# Android
npx eas build --profile development --platform android

# iOS
npx eas build --profile development --platform ios
```

#### Production Build

```bash
# Android (AAB)
npx eas build --profile production --platform android

# iOS (IPA)
npx eas build --profile production --platform ios
```

### 📝 Launch Checklist

See [LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md) for detailed launch preparation.

- [x] 4 games completed
- [x] Premium UI/UX
- [x] Dark/Light mode
- [x] Statistics system
- [x] Onboarding tutorial
- [x] App review system
- [x] Error handling
- [x] Launch documentation
- [ ] App icon creation
- [ ] Screenshot capture
- [ ] Store registration

### 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

### 📧 Contact

- Email: support@braingames.com
- Issues: [GitHub Issues](https://github.com/yourusername/brain-games/issues)

### 🙏 Acknowledgments

- React Native Team
- Expo Team
- Open Source Community

---

## 🎯 Roadmap

### Version 2.0 (Current)
- ✅ 4 core games
- ✅ Statistics system
- ✅ Dark/Light mode
- ✅ Onboarding tutorial
- ✅ App review system

### Version 2.1 (Planned)
- 🔜 Sound effects & BGM
- 🔜 Additional game modes
- 🔜 More achievements
- 🔜 UI/UX enhancements

### Version 3.0 (Future)
- 📅 5th game
- 📅 Social features
- 📅 Global leaderboard
- 📅 Daily challenges

---

**Made with ❤️ by Brain Games Team**

⭐ Star us on GitHub if you like this project!
