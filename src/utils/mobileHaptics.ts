export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

export const triggerHapticFeedback = (type: HapticType = 'light') => {
  // Check if device supports haptic feedback
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      selection: [5],
      success: [10, 50, 10],
      warning: [20, 100, 20],
      error: [50, 100, 50]
    };

    try {
      navigator.vibrate(patterns[type] || patterns.light);
    } catch (error) {
      console.debug('Haptic feedback not available:', error);
    }
  }

  // For iOS devices with haptic feedback API
  if ('DeviceMotionEvent' in window && 'requestPermission' in (DeviceMotionEvent as any)) {
    try {
      // This would require iOS specific implementation
      // For now, we'll use the vibration API fallback
    } catch (error) {
      console.debug('iOS haptic feedback not available:', error);
    }
  }
};