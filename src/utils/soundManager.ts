import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 게임별 사운드 타입 정의
export type SoundType =
  // 공통 사운드
  | 'button_press'
  | 'game_start'
  | 'game_win'
  | 'game_lose'
  | 'achievement'

  // Flip Match
  | 'card_flip'
  | 'card_match'

  // Spatial Memory
  | 'tile_show'
  | 'tile_correct'
  | 'tile_wrong'

  // Math Rush & Stroop Test
  | 'correct_answer'
  | 'wrong_answer'
  | 'combo'
  | 'time_warning'

  // Merge Puzzle
  | 'tile_merge'
  | 'tile_move';

interface SoundSettings {
  soundEnabled: boolean;
  volume: number;
}

class SoundManager {
  private sounds: Map<SoundType, Audio.Sound> = new Map();
  private settings: SoundSettings = {
    soundEnabled: true,
    volume: 0.7, // 기본 볼륨 70%
  };
  private initialized: boolean = false;

  // 사운드 파일 경로
  // 다운로드한 파일: button.wav, start.wav, win.mp3, achievement.wav, flip.ogg,
  //                 show.wav, correct.wav, wrong.mp3, move.wav
  private soundPaths: Partial<Record<SoundType, any>> = {
    // 공통 사운드
    button_press: require('../../assets/sounds/button.wav'),
    game_start: require('../../assets/sounds/start.wav'),
    game_win: require('../../assets/sounds/win.mp3'),
    game_lose: require('../../assets/sounds/wrong.mp3'), // wrong으로 대체
    achievement: require('../../assets/sounds/achievement.wav'),

    // Flip Match
    card_flip: require('../../assets/sounds/flip.ogg'),
    card_match: require('../../assets/sounds/correct.wav'), // correct로 대체

    // Spatial Memory
    tile_show: require('../../assets/sounds/show.wav'),
    tile_correct: require('../../assets/sounds/correct.wav'),
    tile_wrong: require('../../assets/sounds/wrong.mp3'),

    // Math Rush & Stroop Test
    correct_answer: require('../../assets/sounds/correct.wav'),
    wrong_answer: require('../../assets/sounds/wrong.mp3'),
    combo: require('../../assets/sounds/achievement.wav'), // achievement로 대체
    time_warning: require('../../assets/sounds/show.wav'), // show로 대체 (경고음)

    // Merge Puzzle
    tile_merge: require('../../assets/sounds/correct.wav'), // correct로 대체
    tile_move: require('../../assets/sounds/move.wav'),
  };

  constructor() {
    this.loadSettings();
  }

  // AsyncStorage에서 설정 로드
  private async loadSettings() {
    try {
      const [enabledStr, volumeStr] = await Promise.all([
        AsyncStorage.getItem('sound_enabled'),
        AsyncStorage.getItem('sound_volume'),
      ]);

      if (enabledStr !== null) {
        this.settings.soundEnabled = enabledStr === 'true';
      }
      if (volumeStr !== null) {
        this.settings.volume = parseFloat(volumeStr);
      }
    } catch (error) {
      console.log('사운드 설정 로드 실패:', error);
    }
  }

  // 오디오 모드 초기화
  async initialize() {
    if (this.initialized) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      this.initialized = true;
    } catch (error) {
      console.log('오디오 초기화 실패:', error);
    }
  }

  // 사운드 파일 사전 로드 (선택적 최적화)
  async loadSound(type: SoundType) {
    const path = this.soundPaths[type];
    if (!path || this.sounds.has(type)) return;

    try {
      const { sound } = await Audio.Sound.createAsync(path, {
        shouldPlay: false,
        volume: this.settings.volume,
      });
      this.sounds.set(type, sound);
    } catch (error) {
      console.log(`사운드 로드 실패 (${type}):`, error);
    }
  }

  // 사운드 재생 (메인 메서드)
  async playSound(type: SoundType) {
    if (!this.settings.soundEnabled) return;

    const path = this.soundPaths[type];
    if (!path) return; // 파일이 없으면 조용히 스킵

    try {
      await this.initialize();

      // 이미 로드된 사운드가 있으면 재사용
      const existingSound = this.sounds.get(type);
      if (existingSound) {
        await existingSound.setPositionAsync(0);
        await existingSound.setVolumeAsync(this.settings.volume);
        await existingSound.playAsync();
      } else {
        // 즉시 재생 (로드 + 재생)
        const { sound } = await Audio.Sound.createAsync(path, {
          shouldPlay: true,
          volume: this.settings.volume,
        });

        // 재생 완료 후 메모리 정리
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync().catch(() => {});
          }
        });
      }
    } catch (error) {
      console.log(`사운드 재생 실패 (${type}):`, error);
    }
  }

  // 사운드 활성화/비활성화
  async setEnabled(enabled: boolean) {
    this.settings.soundEnabled = enabled;
    await AsyncStorage.setItem('sound_enabled', enabled.toString());
  }

  // 볼륨 조절 (0.0 ~ 1.0)
  async setVolume(volume: number) {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    await AsyncStorage.setItem('sound_volume', this.settings.volume.toString());

    // 로드된 사운드의 볼륨 업데이트
    for (const sound of this.sounds.values()) {
      await sound.setVolumeAsync(this.settings.volume).catch(() => {});
    }
  }

  // 현재 설정 가져오기
  getSettings(): SoundSettings {
    return { ...this.settings };
  }

  // 메모리 정리
  async cleanup() {
    for (const sound of this.sounds.values()) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        // 무시
      }
    }
    this.sounds.clear();
  }
}

export const soundManager = new SoundManager();