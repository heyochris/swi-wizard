const CACHE_NAME = "swi-wizard-v27";
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
    ).then(() => self.clients.claim()).then(() =>
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: "SW_UPDATED", cache: CACHE_NAME }));
      })
    )
  );
});

function isAppShellRequest(request, url) {
  if (request.mode === "navigate") return true;
  const path = url.pathname;
  return path.endsWith("/") || path.endsWith("/index.html") || path.endsWith("swi-wizard");
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // HTML shell: network-first so Home Screen app picks up updates when online.
  // Falls back to cache when offline.
  if (isAppShellRequest(event.request, url)) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put("./index.html", copy.clone());
              cache.put(event.request, copy);
            });
          }
          return res;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match("./index.html"))
        )
    );
    return;
  }

  // Other assets: cache-first for offline PDFs/icons/scripts.
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
