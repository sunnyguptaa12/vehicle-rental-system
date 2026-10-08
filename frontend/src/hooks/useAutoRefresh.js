import { useEffect, useRef } from 'react';

export default function useAutoRefresh(callback, interval = 5000) {
  const callbackRef = useRef(callback);
  const requestInProgress = useRef(false);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== 'visible' || requestInProgress.current) {
        return;
      }
      requestInProgress.current = true;
      Promise.resolve(callbackRef.current()).finally(() => {
        requestInProgress.current = false;
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    const timerId = window.setInterval(refresh, interval);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.clearInterval(timerId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [interval]);
}
