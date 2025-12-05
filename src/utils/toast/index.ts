export interface ToastOptions {
    type: 'success' | 'error' | 'info';
    text1: string;
    text2?: string;
    visibilityTime?: number;
}

export const showToast = (options: ToastOptions) => {
    console.warn('Toast not implemented for this platform');
};

export default {
    show: showToast,
};
