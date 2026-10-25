/* NutriPerform — service worker de notificações (lembretes de refeição, treino e água). Não guarda cache. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let dados = {};
  try {
    dados = event.data ? event.data.json() : {};
  } catch {
    dados = { titulo: 'NutriPerform', corpo: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration.showNotification(dados.titulo || 'NutriPerform', {
      body: dados.corpo || '',
      icon: '/icons/icon-192.png?v=5',
      badge: '/icons/icon-maskable-192.png?v=5',
      tag: dados.tag || undefined,
      renotify: !!dados.tag,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) => {
      for (const j of janelas) if ('focus' in j) return j.focus();
      return self.clients.openWindow('/');
    })
  );
});
