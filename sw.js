const CACHE_NAME = "swi-wizard-v14";
const ASSETS = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./SWI-106_Troubleshooting_Guide.pdf",
  "./SWI-206_Troubleshooting_Guide.pdf",
  "./SWI-211_Brake_Assembly_Replacement.pdf",
  "./SWI-109_Brake_Bushing_Replacement.pdf",
  "./SWI-118_Service_Tool_Guide.pdf",
  "./SWI-137_ConnectBox_Data_Log_Retrieval.pdf",
  "./SWI-124_Motor_Lead_Testing.pdf",
  "./pdfjs/pdf.min.js",
  "./pdfjs/pdf.worker.min.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first for everything in this app's scope: works fully offline once installed,
// including the very first navigation request (no network round-trip, no login re-check).
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
