const CACHE_NAME = "surebetflow-v1"
const OFFLINE_URL = "/offline.html"

// Static assets to pre-cache on install
const PRECACHE_ASSETS = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
]

// Routes that should always go to network (API, auth, webhooks)
const NETWORK_ONLY_PATTERNS = [
  /^\/api\//,
  /^\/auth\//,
  /\/_next\/static\/chunks\/app\//,
]

// Routes to cache with network-first strategy
const NETWORK_FIRST_PATTERNS = [
  /^\/(dashboard|apostas|perfis|financeiro|calculadora|assinatura|configuracoes)/,
]

// Install: pre-cache critical assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Fetch strategy
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return

  // Skip non-GET requests
  if (request.method !== "GET") return

  // Network-only for API and auth routes
  if (NETWORK_ONLY_PATTERNS.some((p) => p.test(url.pathname))) return

  // Network-first for app pages (fall back to cache, then offline page)
  if (NETWORK_FIRST_PATTERNS.some((p) => p.test(url.pathname))) {
    event.respondWith(networkFirstWithOfflineFallback(request))
    return
  }

  // Cache-first for static assets (_next/static, icons, fonts)
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Default: network-first
  event.respondWith(networkFirstWithOfflineFallback(request))
})

async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      return caches.match(OFFLINE_URL)
    }
    return new Response("Offline", { status: 503 })
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response("Not found", { status: 404 })
  }
}

// Push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return
  let data = {}
  try { data = event.data.json() } catch { data = { title: "SurebetFlow", body: event.data.text() } }

  const options = {
    body: data.body ?? "",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [100, 50, 100],
    data: { url: data.url ?? "/dashboard" },
    actions: data.actions ?? [],
    tag: data.tag ?? "surebetflow",
    renotify: true,
  }

  event.waitUntil(self.registration.showNotification(data.title ?? "SurebetFlow", options))
})

// Notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url ?? "/dashboard"
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      return clients.openWindow(targetUrl)
    })
  )
})

// Background sync for offline bet submissions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-apostas") {
    event.waitUntil(syncPendingApostas())
  }
})

async function syncPendingApostas() {
  // Reads pending apostas from IndexedDB and submits them when back online
  // Implementation handled client-side via PWASync component
}

// Periodic background sync (if supported)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "update-dashboard") {
    event.waitUntil(updateDashboardCache())
  }
})

async function updateDashboardCache() {
  try {
    const response = await fetch("/dashboard")
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put("/dashboard", response)
    }
  } catch {
    // Ignore if offline
  }
}
