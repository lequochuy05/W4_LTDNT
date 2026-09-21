import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

// Create a global override state so we can toggle it for testing
let manualOverride: boolean | null = null;
const listeners: Set<() => void> = new Set();

export function toggleManualNetwork(isOnline: boolean) {
  manualOverride = isOnline;
  listeners.forEach(fn => fn());
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(manualOverride !== null ? manualOverride : navigator.onLine);

  useEffect(() => {
    // Initial fetch for native
    if (Capacitor.isNativePlatform()) {
      Network.getStatus().then(status => {
        if (manualOverride === null) setIsOnline(status.connected);
      });
    }

    const handleOnline = () => {
      if (manualOverride === null) setIsOnline(true);
    };
    const handleOffline = () => {
      if (manualOverride === null) setIsOnline(false);
    };

    const handleOverride = () => {
      if (manualOverride !== null) {
        setIsOnline(manualOverride);
      } else {
        if (Capacitor.isNativePlatform()) {
          Network.getStatus().then(status => setIsOnline(status.connected));
        } else {
          setIsOnline(navigator.onLine);
        }
      }
    };

    listeners.add(handleOverride);

    if (Capacitor.isNativePlatform()) {
      const listener = Network.addListener('networkStatusChange', status => {
        if (manualOverride === null) setIsOnline(status.connected);
      });
      return () => {
        listener.then(l => l.remove());
        listeners.delete(handleOverride);
      };
    } else {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        listeners.delete(handleOverride);
      };
    }
  }, []);

  return isOnline;
}
