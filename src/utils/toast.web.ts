/**
 * Web-specific toast implementation using Alert
 */
import { Alert } from 'react-native';

export interface ToastOptions {
  type: 'success' | 'error' | 'info';
  text1: string;
  text2?: string;
  visibilityTime?: number;
}

export const showToast = (options: ToastOptions) => {
  const { text1, text2 } = options;
  Alert.alert(text1, text2 || '', [{ text: 'OK' }]);
};

export default {
  show: showToast,
};
