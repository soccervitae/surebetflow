"use client"

import { useEffect, useState } from "react"
import { Download, X, Wifi, WifiOff, Bell, BellOff } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export default function PWAProvider() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineToast, setShowOfflineToast] = useState(false)
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default")

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          // Check for updates every 60 seconds
          setInterval(() => reg.update(), 60_000)
        })
        .catch(() => {})
    }
  }, [])

  // Capture install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      // Show banner after 30s or if user hasn't dismissed before
      const dismissed = localStorage.getItem("pwa-install-dismissed")
      if (!dismissed) {
        setTimeout(() => setShowInstallBanner(true), 5000)
      }
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineToast(false)
    }
    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineToast(true)
    }
    setIsOnline(navigator.onLine)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Notification permission state
  useEffect(() => {
    if ("Notification" in window) {
      setNotifPermission(Notification.permission)
    }
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === "accepted") setShowInstallBanner(false)
    setInstallPrompt(null)
  }

  function dismissInstall() {
    setShowInstallBanner(false)
    localStorage.setItem("pwa-install-dismissed", "1")
  }

  async function requestNotifications() {
    if (!("Notification" in window)) return
    const permission = await Notification.requestPermission()
    setNotifPermission(permission)
  }

  return (
    <>
      {/* Offline/Online status toast */}
      {showOfflineToast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 bg-red-950 border border-red-800 text-red-200 text-sm font-medium px-4 py-3 rounded-xl shadow-xl">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          Você está offline. Algumas funções podem estar limitadas.
        </div>
      )}

      {!isOnline || (
        <OnlineRestoredToast />
      )}

      {/* Install banner */}
      {showInstallBanner && installPrompt && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[9998]">
          <div className="bg-[#0f1a2e] border border-[#1e3a8a]/60 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/icon-72x72.png" alt="SurebetFlow" className="w-12 h-12 rounded-xl flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">Instalar SurebetFlow</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Adicione ao seu celular para acesso rápido e uso offline.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleInstall}
                    className="flex items-center gap-1.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Instalar
                  </button>
                  <button
                    onClick={dismissInstall}
                    className="text-slate-400 hover:text-white text-xs px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Agora não
                  </button>
                </div>
              </div>
              <button onClick={dismissInstall} className="text-slate-500 hover:text-white transition-colors flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notification permission prompt (show only if not yet decided) */}
            {notifPermission === "default" && (
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Bell className="w-3.5 h-3.5" />
                  Ativar notificações de apostas?
                </div>
                <button
                  onClick={requestNotifications}
                  className="text-xs text-[#a0f0c0] hover:underline font-medium"
                >
                  Ativar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function OnlineRestoredToast() {
  const [show, setShow] = useState(false)
  const [prev, setPrev] = useState(true)

  useEffect(() => {
    const handleOnline = () => {
      if (!prev) {
        setShow(true)
        setTimeout(() => setShow(false), 3000)
      }
      setPrev(true)
    }
    const handleOffline = () => setPrev(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [prev])

  if (!show) return null
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 bg-green-950 border border-green-800 text-green-200 text-sm font-medium px-4 py-3 rounded-xl shadow-xl">
      <Wifi className="w-4 h-4 flex-shrink-0" />
      Conexão restaurada!
    </div>
  )
}
