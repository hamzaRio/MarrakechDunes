self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.delete('api-cache'),
    caches.delete('static-files'),
  ]));
});
