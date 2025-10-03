// 앱 전체 색상 테마
export const colors = {
  // Background
  background: '#0f172a', // slate-950
  surface: '#1e293b', // slate-800
  surfaceLight: '#334155', // slate-700

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#94a3b8', // slate-400
  textTertiary: '#64748b', // slate-500

  // Accent
  accent: '#22d3ee', // cyan-400
  accentDark: '#06b6d4', // cyan-500

  // Status
  success: '#10b981', // green-500
  error: '#ef4444', // red-500
  warning: '#f59e0b', // amber-500

  // Border
  border: '#334155', // slate-700
  borderLight: '#475569', // slate-600
};

// 공통 스타일
export const commonStyles = {
  // 카드 스타일
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // 버튼 스타일
  button: {
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },

  // 헤더 스타일
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
};
