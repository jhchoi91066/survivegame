// Game timer configuration
export const GAME_DURATION = 120; // 120 seconds

export type GameStatus = 'idle' | 'playing' | 'paused' | 'victory' | 'defeat';

export interface TimerState {
  timeRemaining: number; // seconds
  isRunning: boolean;
  gameStatus: GameStatus;
}

// Get urgency level based on time remaining
export const getUrgencyLevel = (timeRemaining: number): 'safe' | 'warning' | 'danger' | 'critical' => {
  const percentage = (timeRemaining / GAME_DURATION) * 100;

  if (percentage > 60) return 'safe';
  if (percentage > 30) return 'warning';
  if (percentage > 10) return 'danger';
  return 'critical';
};

// Get color based on urgency level
export const getTimerColor = (urgencyLevel: string): string => {
  switch (urgencyLevel) {
    case 'safe':
      return '#10b981'; // green-500
    case 'warning':
      return '#f59e0b'; // amber-500
    case 'danger':
      return '#f97316'; // orange-500
    case 'critical':
      return '#ef4444'; // red-500
    default:
      return '#6b7280'; // gray-500
  }
};

// Format time as MM:SS
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};