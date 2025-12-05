import { Alert } from 'react-native';

export interface ToastOptions {
    type: 'success' | 'error' | 'info';
    text1: string;
    text2?: string;
    visibilityTime?: number;
}

export const showToast = (options: ToastOptions) => {
    const { text1, text2 } = options;
    // Web fallback using Alert or console
    console.log(`[Toast] ${text1}: ${text2 || ''}`);
    // You could use a web-friendly toast library here if needed
    // For now, console log is safer than Alert which blocks UI
};

export default {
    show: showToast,
};
