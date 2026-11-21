// Service Worker for Salah Notifications & Offline Support
const CACHE_NAME = 'salah-app-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handle incoming notification clicks (including actions)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  if (action === 'mark-prayed' && data.prayer) {
    // Post to API to mark as prayed
    event.waitUntil(
      fetch('/api/salah/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prayer_name: data.prayer,
          status: 'completed',
          date: new Date().toISOString().slice(0, 10),
        }),
      }).catch((err) => console.error('Failed to log from notification:', err))
    );
    return;
  }

  // Otherwise open or focus window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});
