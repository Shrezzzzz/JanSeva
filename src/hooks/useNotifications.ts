import { useCallback, useEffect, useState } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) setPermission(Notification.permission);
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    const p = await Notification.requestPermission();
    setPermission(p);
  }, []);

  const notify = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return;
    new Notification(title, { icon: '/icons/icon-192.png', ...options });
  }, [permission]);

  return { permission, requestPermission, notify };
}
