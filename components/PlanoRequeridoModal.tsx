"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Lock, Star, Zap, X, ArrowRight } from "lucide-react"

interface Props {
  open: boolean
  onClose: () => void
}

export default function PlanoRequeridoModal({ open, onClose }: Props) {
  // Fechar com ESC
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onClose])

  // Bloquear scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#0d1829] border border-[#1e3a8a]/40 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-200">

        {/* Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-white/10 hover:text-white transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-[#0f1e40] to-[#1e3a8a] px-6 py-6 text-center">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white">Plano necessário</h2>
          <p className="text-sm text-blue-200 mt-1">
            Esta funcionalidade requer um plano ativo
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed text-center">
            Para acessar o <strong className="text-[var(--text-primary)]">Dashboard</strong>, <strong className="text-[var(--text-primary)]">Apostas</strong>, <strong className="text-[var(--text-primary)]">Perfis</strong> e todas as outras funcionalidades do SurebetFlow, escolha um dos planos abaixo.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Plano Trader */}
            <Link
              href="/assinatura/checkout?plan=trader"
              onClick={onClose}
              className="flex flex-col items-center gap-1.5 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[#1e3a8a]/50 hover:bg-[#1e3a8a]/5 transition-all text-center group"
            >
              <Star className="w-5 h-5 text-[var(--accent-text)] group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold text-[var(--text-primary)]">Trader</span>
              <span className="text-xs text-[var(--text-muted)]">R$ 99/mês</span>
              <span className="text-[10px] text-[var(--text-secondary)] mt-0.5">Até 5 perfis</span>
            </Link>

            {/* Plano Trader Pro */}
            <Link
              href="/assinatura/checkout?plan=trader_pro"
              onClick={onClose}
              className="flex flex-col items-center gap-1.5 p-4 rounded-xl border border-[#1e3a8a]/50 bg-gradient-to-b from-[#0f1e40]/60 to-transparent hover:border-[#1e3a8a] hover:bg-[#1e3a8a]/10 transition-all text-center group relative overflow-hidden"
            >
              <span className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#1e3a8a] to-transparent" />
              <Zap className="w-5 h-5 text-[var(--accent-text)] group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold text-[var(--text-primary)]">Trader Pro</span>
              <span className="text-xs text-[var(--text-muted)]">R$ 179/mês</span>
              <span className="text-[10px] text-[var(--text-secondary)] mt-0.5">Até 20 perfis</span>
            </Link>
          </div>

          <Link
            href="/assinatura"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold transition-colors"
          >
            Ver planos completos
            <ArrowRight className="w-4 h-4" />
          </Link>

          <div className="text-center">
            <Link
              href="/tutorial"
              onClick={onClose}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] underline underline-offset-2 transition-colors"
            >
              Acessar o Tutorial gratuitamente
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
