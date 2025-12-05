import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';

export interface ToastOptions {
    type: 'success' | 'error' | 'info';
    text1: string;
    text2?: string;
    visibilityTime?: number;
}

export const showToast = (options: ToastOptions) => {
    const { type, text1, text2, visibilityTime = 3000 } = options;

    try {
        Toast.show({
            type,
            text1,
            text2,
            visibilityTime,
        });
    } catch (error) {
        console.warn('Toast unavailable, using Alert:', error);
        Alert.alert(text1, text2 || '', [{ text: 'OK' }]);
    }
};

export default {
    show: showToast,
};
