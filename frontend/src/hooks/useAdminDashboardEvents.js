import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../services/api';

export default function useAdminDashboardEvents(onUpdate, token, role) {
  const callbackRef = useRef(onUpdate);
  const [status, setStatus] = useState('connecting');

  useEffect(() => {
    callbackRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!token || role !== 'admin') {
      setStatus('disconnected');
      return undefined;
    }

    const controller = new AbortController();
    let active = true;

    const waitToReconnect = () => new Promise((resolve) => {
      const finish = () => {
        window.clearTimeout(timeoutId);
        controller.signal.removeEventListener('abort', finish);
        resolve();
      };
      const timeoutId = window.setTimeout(finish, 2000);
      controller.signal.addEventListener('abort', finish, { once: true });
    });

    const connect = async () => {
      while (active) {
        try {
          setStatus('connecting');
          const response = await fetch(`${API_BASE_URL}/admin/events`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal
          });

          if (response.status === 401) {
            window.dispatchEvent(new Event('auth:expired'));
            return;
          }
          if (!response.ok || !response.body) {
            throw new Error(`Live dashboard connection failed (${response.status})`);
          }

          setStatus('connected');
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (active) {
            const { value, done } = await reader.read();
            if (done) {
              throw new Error('Live dashboard connection closed');
            }
            buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
            let boundary = buffer.indexOf('\n\n');
            while (boundary !== -1) {
              const frame = buffer.slice(0, boundary);
              buffer = buffer.slice(boundary + 2);
              if (frame.split('\n').some((line) => line === 'event: dashboard-update')) {
                callbackRef.current();
              }
              boundary = buffer.indexOf('\n\n');
            }
          }
        } catch (error) {
          if (!active || controller.signal.aborted) {
            return;
          }
          setStatus('reconnecting');
          await waitToReconnect();
        }
      }
    };

    connect();
    return () => {
      active = false;
      controller.abort();
    };
  }, [token, role]);

  return status;
}
