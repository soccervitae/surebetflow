"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import AiChat from "./AiChat"

export default function SuporteClient() {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">SureBet AI</h1>
          <p className="text-[var(--text-secondary)] text-sm">Tire suas dúvidas sobre a SurebetFlow</p>
        </div>
      </div>
      <AiChat />
    </div>
  )
}
