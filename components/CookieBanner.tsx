"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { X, Cookie } from "lucide-react"

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem("cookies_accepted")
    if (!accepted) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem("cookies_accepted", "true")
    setVisible(false)
  }

  function decline() {
    localStorage.setItem("cookies_accepted", "false")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <>
      {/* Desktop — barra no rodapé */}
      <div className="hidden md:flex fixed bottom-0 left-0 right-0 z-50 bg-[#0a0f1e]/95 backdrop-blur border-t border-white/10 px-6 py-4 items-center justify-between gap-6">
        <div className="flex items-center gap-3 min-w-0">
          <Cookie className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <p className="text-sm text-gray-400 leading-snug">
            Usamos cookies para melhorar sua experiência e analisar o tráfego do site. Ao continuar, você concorda com nossa{" "}
            <Link href="/privacidade" className="text-white underline underline-offset-2 hover:text-gray-300 transition-colors">
              Política de Privacidade
            </Link>
            {" "}e{" "}
            <Link href="/termos" className="text-white underline underline-offset-2 hover:text-gray-300 transition-colors">
              Termos de Uso
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={decline}
            className="text-sm text-gray-500 hover:text-white transition-colors px-4 py-2 rounded-lg border border-white/10 hover:border-white/20"
          >
            Recusar
          </button>
          <button
            onClick={accept}
            className="text-sm font-semibold text-white bg-[#1e3a8a] hover:bg-[#1e40af] transition-colors px-5 py-2 rounded-lg"
          >
            Aceitar cookies
          </button>
          <button onClick={decline} className="text-gray-600 hover:text-gray-400 transition-colors ml-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile — card flutuante no canto inferior */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 bg-[#0a0f1e] border border-white/10 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Cookie className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <p className="text-sm font-semibold text-white">Cookies</p>
          </div>
          <button onClick={decline} className="text-gray-600 hover:text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed mb-4">
          Usamos cookies para melhorar sua experiência. Veja nossa{" "}
          <Link href="/privacidade" className="text-white underline underline-offset-2">
            Privacidade
          </Link>
          {" "}e{" "}
          <Link href="/termos" className="text-white underline underline-offset-2">
            Termos
          </Link>
          .
        </p>
        <div className="flex gap-2">
          <button
            onClick={decline}
            className="flex-1 text-sm text-gray-400 border border-white/10 rounded-xl py-2 hover:border-white/20 transition-colors"
          >
            Recusar
          </button>
          <button
            onClick={accept}
            className="flex-1 text-sm font-semibold text-white bg-[#1e3a8a] hover:bg-[#1e40af] rounded-xl py-2 transition-colors"
          >
            Aceitar
          </button>
        </div>
      </div>
    </>
  )
}
