# 사운드 파일 가이드

이 폴더에는 게임에서 사용할 사운드 효과(SFX) 파일들이 위치합니다.

## 📋 필요한 사운드 파일 목록

### 공통 사운드 (5개)
- `button.mp3` - 버튼 클릭 소리
- `start.mp3` - 게임 시작 소리
- `win.mp3` - 승리 소리
- `lose.mp3` - 패배 소리
- `achievement.mp3` - 업적 달성 소리

### Flip Match (2개)
- `flip.mp3` - 카드 뒤집기 소리
- `match.mp3` - 카드 매칭 성공 소리

### Spatial Memory (3개)
- `show.mp3` - 타일 표시 소리
- `correct.mp3` - 정답 소리
- `wrong.mp3` - 오답 소리

### Math Rush & Stroop Test (3개)
- `correct.mp3` - 정답 소리 (위와 동일 파일 재사용)
- `wrong.mp3` - 오답 소리 (위와 동일 파일 재사용)
- `combo.mp3` - 콤보 소리
- `warning.mp3` - 시간 경고 소리

### Merge Puzzle (2개)
- `merge.mp3` - 타일 합치기 소리
- `move.mp3` - 타일 이동 소리

---

## 🆓 무료 사운드 다운로드 사이트

### 1. Freesound.org (추천)
- **URL**: https://freesound.org
- **장점**: 고품질, 다양한 라이선스
- **사용법**:
  1. 회원가입 (무료)
  2. 검색 (예: "button click", "success", "card flip")
  3. 라이선스 확인 (CC0 또는 CC BY 추천)
  4. 다운로드 후 이름 변경

### 2. Mixkit (무료, 라이선스 제한 없음)
- **URL**: https://mixkit.co/free-sound-effects/
- **장점**: 상업적 사용 가능, 라이선스 걱정 없음
- **추천 카테고리**:
  - UI/Button Sounds
  - Game Sounds
  - Success/Fail Sounds

### 3. Zapsplat
- **URL**: https://www.zapsplat.com
- **장점**: 무료 회원은 하루 10개 다운로드
- **라이선스**: 상업적 사용 가능

### 4. Pixabay Sound Effects
- **URL**: https://pixabay.com/sound-effects/
- **장점**: CC0 (완전 무료), 저작권 표기 불필요

---

## 🎵 추천 검색 키워드

| 파일명 | 검색 키워드 (영어) |
|--------|-------------------|
| button.mp3 | "button click", "UI click", "pop" | x
| start.mp3 | "game start", "begin", "ready" | x
| win.mp3 | "victory", "success", "win fanfare" | x
| lose.mp3 | "game over", "fail", "wrong buzzer" |
| achievement.mp3 | "achievement", "unlock", "reward chime" | x
| flip.mp3 | "card flip", "paper flip", "swish" | x
| match.mp3 | "match", "correct ding", "success chime" |
| show.mp3 | "pop", "appear", "blip" | x
| correct.mp3 | "correct", "right answer", "ding" | x
| wrong.mp3 | "wrong", "error", "buzzer" | x
| combo.mp3 | "power up", "level up", "sparkle" |
| warning.mp3 | "warning", "alert", "beep" |
| merge.mp3 | "merge", "combine", "whoosh" |
| move.mp3 | "slide", "move", "swipe" | x

---

## 🛠️ 파일 준비 가이드

### 1. 다운로드 후 파일명 변경
다운로드한 파일을 위 목록의 파일명으로 정확히 변경하세요.

### 2. 파일 형식
- **권장**: MP3 (최고의 호환성)
- **대안**: WAV (고음질, 하지만 파일 크기 큼)

### 3. 파일 크기 최적화
- 사운드는 짧을수록 좋음 (0.5~2초)
- 비트레이트: 128kbps 정도면 충분
- 온라인 변환 도구: https://online-audio-converter.com

### 4. 볼륨 정규화
- 모든 사운드의 볼륨을 비슷하게 맞추기
- 온라인 도구: https://www.mp3louder.com

---

## 🔧 코드에서 활성화하기

파일을 모두 추가한 후, `src/utils/soundManager.ts` 파일을 열고 다음 부분의 주석을 해제하세요:

```typescript
private soundPaths: Partial<Record<SoundType, any>> = {
  // 주석 제거 ↓
  button_press: require('../../assets/sounds/button.mp3'),
  game_start: require('../../assets/sounds/start.mp3'),
  game_win: require('../../assets/sounds/win.mp3'),
  game_lose: require('../../assets/sounds/lose.mp3'),
  achievement: require('../../assets/sounds/achievement.mp3'),
  card_flip: require('../../assets/sounds/flip.mp3'),
  card_match: require('../../assets/sounds/match.mp3'),
  tile_show: require('../../assets/sounds/show.mp3'),
  tile_correct: require('../../assets/sounds/correct.mp3'),
  tile_wrong: require('../../assets/sounds/wrong.mp3'),
  correct_answer: require('../../assets/sounds/correct.mp3'),
  wrong_answer: require('../../assets/sounds/wrong.mp3'),
  combo: require('../../assets/sounds/combo.mp3'),
  time_warning: require('../../assets/sounds/warning.mp3'),
  tile_merge: require('../../assets/sounds/merge.mp3'),
  tile_move: require('../../assets/sounds/move.mp3'),
};
```

---

## ✅ 체크리스트

- [ ] 공통 사운드 5개 추가
- [ ] Flip Match 사운드 2개 추가
- [ ] Spatial Memory 사운드 3개 추가
- [ ] Math Rush 사운드 4개 추가
- [ ] Merge Puzzle 사운드 2개 추가
- [ ] 파일명 정확히 확인
- [ ] soundManager.ts 주석 해제
- [ ] 앱 재시작 후 테스트

---

## 📝 라이선스 주의사항

- **CC0**: 자유롭게 사용 가능, 저작권 표기 불필요
- **CC BY**: 사용 가능, 하지만 원작자 표기 필요
- **CC BY-NC**: 비상업적 사용만 가능 (이 프로젝트에는 부적합)

앱 출시 전, 사용한 모든 사운드의 라이선스를 확인하고 필요 시 크레딧에 추가하세요.
