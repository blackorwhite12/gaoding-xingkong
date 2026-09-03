/* 待炸星空 PWA 离线缓存
 * 每次发布新版时需同步 bump 这里的 CACHE 版本号，否则用户会命中旧缓存。
 * 策略：导航请求(navigate)走 network-first 再回退缓存，保证 index.html 能更新；
 *       其余同源静态资源走 cache-first，离线也能开。 */
const VERSION = 'v5';
const CACHE = 'gaoding-xingkong-' + VERSION;
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './lib/three.min.js',
  './lib/OrbitControls.js',
  './lib/EffectComposer.js',
  './lib/RenderPass.js',
  './lib/UnrealBloomPass.js',
  './lib/ShaderPass.js',
  './lib/LuminosityHighPassShader.js',
  './lib/CopyShader.js',
  './lib/gsap.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('gaoding-xingkong-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  if (url.origin !== self.location.origin) return;   /* 不缓存跨域资源 */
  e.respondWith(
    caches.match(req).then((cached) =>
      cached ||
      fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => cached)
    )
  );
});
