import { useEffect } from 'react';

/**
 * Hook for modals and overlay screens to intercept Android back button / back gesture
 * When active, pressing back on Android closes the modal instead of exiting or navigating away
 */
export function useBackButton(isActive: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isActive) return;

    const handleBackButton = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    window.addEventListener('saloon:backbutton', handleBackButton);
    return () => {
      window.removeEventListener('saloon:backbutton', handleBackButton);
    };
  }, [isActive, onClose]);
}
