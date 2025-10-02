import { Audio } from 'expo-av';

export type SoundType = 'bgm' | 'move' | 'select' | 'victory' | 'defeat' | 'ability' | 'click';

interface SoundSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  volume: number;
}

class SoundManager {
  private sounds: Map<SoundType, Audio.Sound> = new Map();
  private bgm: Audio.Sound | null = null;
  private settings: SoundSettings = {
    soundEnabled: true,
    musicEnabled: true,
    volume: 1.0,
  };

  // 사운드 파일 경로 (추후 실제 파일로 교체)
  private soundPaths: Record<SoundType, any> = {
    bgm: null, // require('../../assets/sounds/bgm.mp3')
    move: null, // require('../../assets/sounds/move.mp3')
    select: null, // require('../../assets/sounds/select.mp3')
    victory: null, // require('../../assets/sounds/victory.mp3')
    defeat: null, // require('../../assets/sounds/defeat.mp3')
    ability: null, // require('../../assets/sounds/ability.mp3')
    click: null, // require('../../assets/sounds/click.mp3')
  };

  async initialize() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  async loadSound(type: SoundType) {
    const path = this.soundPaths[type];
    if (!path) return; // 파일이 없으면 스킵

    try {
      const { sound } = await Audio.Sound.createAsync(path);
      this.sounds.set(type, sound);
    } catch (error) {
      console.error(`Failed to load sound ${type}:`, error);
    }
  }

  async playSound(type: SoundType) {
    if (!this.settings.soundEnabled || type === 'bgm') return;

    const sound = this.sounds.get(type);
    if (sound) {
      try {
        await sound.setPositionAsync(0);
        await sound.setVolumeAsync(this.settings.volume);
        await sound.playAsync();
      } catch (error) {
        console.error(`Failed to play sound ${type}:`, error);
      }
    }
  }

  async playBGM() {
    if (!this.settings.musicEnabled || !this.soundPaths.bgm) return;

    try {
      if (this.bgm) {
        await this.bgm.stopAsync();
        await this.bgm.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        this.soundPaths.bgm,
        { shouldPlay: true, isLooping: true, volume: this.settings.volume * 0.5 }
      );
      this.bgm = sound;
    } catch (error) {
      console.error('Failed to play BGM:', error);
    }
  }

  async stopBGM() {
    if (this.bgm) {
      try {
        await this.bgm.stopAsync();
        await this.bgm.unloadAsync();
        this.bgm = null;
      } catch (error) {
        console.error('Failed to stop BGM:', error);
      }
    }
  }

  async pauseBGM() {
    if (this.bgm) {
      try {
        await this.bgm.pauseAsync();
      } catch (error) {
        console.error('Failed to pause BGM:', error);
      }
    }
  }

  async resumeBGM() {
    if (this.bgm) {
      try {
        await this.bgm.playAsync();
      } catch (error) {
        console.error('Failed to resume BGM:', error);
      }
    }
  }

  updateSettings(settings: Partial<SoundSettings>) {
    this.settings = { ...this.settings, ...settings };

    // BGM 볼륨 즉시 적용
    if (this.bgm) {
      this.bgm.setVolumeAsync(this.settings.volume * 0.5);
    }

    // BGM 상태 즉시 적용
    if (!this.settings.musicEnabled && this.bgm) {
      this.pauseBGM();
    } else if (this.settings.musicEnabled && this.bgm) {
      this.resumeBGM();
    }
  }

  getSettings(): SoundSettings {
    return { ...this.settings };
  }

  async cleanup() {
    // 모든 사운드 정리
    for (const sound of this.sounds.values()) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.error('Failed to unload sound:', error);
      }
    }
    this.sounds.clear();

    // BGM 정리
    await this.stopBGM();
  }
}

export const soundManager = new SoundManager();