const CACHE_NAME = 'filekit-v1';

// 앱 셸: 오프라인에서도 기본 UI가 로드되도록 캐시
const PRECACHE_URLS = ['/', '/manifest.json', '/icons/icon.svg'];

// 설치: 핵심 에셋 사전 캐시
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// 활성화: 오래된 캐시 삭제
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// 요청 처리: Cache-first 전략 (네트워크 실패 시 캐시 반환)
self.addEventListener('fetch', (event) => {
  // 동일 출처 GET 요청만 처리
  if (
    event.request.method !== 'GET' ||
    !event.request.url.startsWith(self.location.origin)
  ) {
    return;
  }

  // API 라우트는 캐시하지 않음
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((response) => {
        // 정상 응답만 캐시에 저장
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });

      // 캐시가 있으면 즉시 반환하고 백그라운드에서 업데이트
      return cached || networkFetch;
    })
  );
});
