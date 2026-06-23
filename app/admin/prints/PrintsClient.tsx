"use client"

import { useState, useRef } from "react"
import { Download, Loader2, Monitor, Smartphone } from "lucide-react"

const PAGES = [
  { label: "Dashboard",         href: "/dashboard" },
  { label: "Perfis",            href: "/perfis" },
  { label: "Apostas",           href: "/apostas" },
  { label: "Tutorial",          href: "/tutorial" },
  { label: "Financeiro",        href: "/financeiro" },
  { label: "Configurações",     href: "/configuracoes" },
  { label: "Assinatura",        href: "/assinatura" },
  { label: "Suporte",           href: "/suporte" },
]

// Mobile frame: iPhone 14 Pro dimensions
const FRAME_W = 390
const FRAME_H = 844

export default function PrintsClient() {
  const [downloading, setDownloading] = useState<string | null>(null)
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({})

  async function handleDownload(page: { label: string; href: string }) {
    setDownloading(page.href)
    try {
      const html2canvas = (await import("html2canvas")).default
      const iframe = iframeRefs.current[page.href]
      if (!iframe || !iframe.contentDocument?.body) {
        // Fallback: open in new window
        window.open(page.href, "_blank")
        return
      }
      const canvas = await html2canvas(iframe.contentDocument.body, {
        width: FRAME_W,
        height: FRAME_H,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#0B1220",
      })
      const link = document.createElement("a")
      link.download = `surebetflow-${page.label.toLowerCase().replace(/\s+/g, "-")}-mobile.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch {
      // If html2canvas fails, open in new tab for manual screenshot
      window.open(page.href, "_blank")
    } finally {
      setDownloading(null)
    }
  }

  function handleDownloadAll() {
    PAGES.forEach((p, i) => {
      setTimeout(() => handleDownload(p), i * 800)
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Prints Mobile</h1>
          <p className="text-gray-400 text-sm mt-1">
            Capturas de tela das páginas em formato mobile (390 × 844 px)
          </p>
        </div>
        <button
          onClick={handleDownloadAll}
          className="flex items-center gap-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Baixar todos
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-[#1e3a8a]/10 border border-[#1e3a8a]/30 rounded-xl px-4 py-3 flex items-start gap-3">
        <Smartphone className="w-4 h-4 text-[#60a5fa] mt-0.5 flex-shrink-0" />
        <p className="text-sm text-gray-400">
          Cada página é renderizada em viewport mobile (390 × 844). O download gera um arquivo PNG de alta resolução.
          Se a captura automática falhar, a página abrirá em nova aba para captura manual.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {PAGES.map(page => (
          <div key={page.href} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
            {/* Label bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-sm font-medium text-white">{page.label}</span>
              </div>
              <span className="text-xs text-gray-600 font-mono">{page.href}</span>
            </div>

            {/* Phone frame */}
            <div className="flex items-center justify-center bg-gray-950 p-4">
              <div
                className="relative rounded-[2rem] overflow-hidden border-4 border-gray-700 shadow-2xl"
                style={{ width: 220, height: 477 }}
              >
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-700 rounded-b-xl z-10" />
                {/* Iframe scaled down to preview */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ transform: `scale(${220 / FRAME_W})`, transformOrigin: "top left", width: FRAME_W, height: FRAME_H }}
                >
                  <iframe
                    ref={el => { iframeRefs.current[page.href] = el }}
                    src={page.href}
                    width={FRAME_W}
                    height={FRAME_H}
                    className="border-0"
                    title={page.label}
                    sandbox="allow-same-origin allow-scripts allow-forms"
                  />
                </div>
              </div>
            </div>

            {/* Download button */}
            <div className="p-3 border-t border-gray-800">
              <button
                onClick={() => handleDownload(page)}
                disabled={downloading === page.href}
                className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                {downloading === page.href ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Gerando PNG...</>
                ) : (
                  <><Download className="w-4 h-4" />Download PNG</>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
