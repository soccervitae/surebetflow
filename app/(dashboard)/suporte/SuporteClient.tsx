"use client"

import AiChat from "./AiChat"

export default function SuporteClient() {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Suporte</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Tire suas dúvidas sobre a SurebetFlow</p>
      </div>
      <AiChat />
    </div>
  )
}
