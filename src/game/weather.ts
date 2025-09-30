// Weather event types
export type WeatherType = 'clear' | 'rain' | 'storm';

export interface WeatherEvent {
  type: WeatherType;
  turnsRemaining: number;
  turnsUntilNext: number;
}

export interface WeatherEffect {
  name: string;
  description: string;
  emoji: string;
  color: string;
}

// Weather configuration
export const WEATHER_CONFIG: Record<WeatherType, WeatherEffect> = {
  clear: {
    name: '맑음',
    description: '에너지 회복 보너스 +5',
    emoji: '☀️',
    color: '#fbbf24', // amber-400
  },
  rain: {
    name: '비',
    description: '늪지 확산, 시야 제한',
    emoji: '🌧️',
    color: '#3b82f6', // blue-500
  },
  storm: {
    name: '폭풍',
    description: '이동 제한 (2턴간)',
    emoji: '⛈️',
    color: '#6b7280', // gray-500
  },
};

// Weather event duration (in turns)
export const WEATHER_DURATION: Record<WeatherType, number> = {
  clear: 3,
  rain: 2,
  storm: 2,
};

// Generate random weather event
export const generateWeatherEvent = (): WeatherType => {
  const random = Math.random();

  if (random < 0.5) return 'clear';
  if (random < 0.8) return 'rain';
  return 'storm';
};

// Check if movement is allowed during weather
export const canMoveInWeather = (weather: WeatherType | null, turnsRemaining: number): boolean => {
  if (!weather) return true;
  if (weather === 'storm' && turnsRemaining > 0) return false;
  return true;
};

// Get energy recovery bonus from weather
export const getWeatherEnergyBonus = (weather: WeatherType | null): number => {
  if (weather === 'clear') return 5;
  return 0;
};