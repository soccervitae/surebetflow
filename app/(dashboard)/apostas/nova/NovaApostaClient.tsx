"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import SurebetCalculator from "@/components/SurebetCalculator"
import type { Profile } from "@/lib/types"

interface Props {
  profiles: Pick<Profile, "id" | "nome" | "sobrenome" | "apelido">[]
}

export default function NovaApostaClient({ profiles }: Props) {
  const router = useRouter()
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [selectedProfileName, setSelectedProfileName] = useState<string>("")

  const selectedProfile = selectedProfileId
    ? profiles.find(p => p.id === selectedProfileId) ?? null
    : null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Nova aposta</h1>
          {selectedProfileName && (
            <p className="text-sm text-[var(--text-secondary)]">{selectedProfileName}</p>
          )}
        </div>
      </div>

      {/* Profile picker step */}
      {!selectedProfileId ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)] font-medium px-1">Escolha o perfil</p>
          {profiles.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-muted)] text-sm">
              Nenhum perfil encontrado. Crie um perfil primeiro.
            </div>
          ) : (
            profiles.map(p => {
              const name = p.apelido || `${p.nome} ${p.sobrenome}`
              return (
                <button
                  key={p.id}
                  onClick={() => { setSelectedProfileId(p.id); setSelectedProfileName(name) }}
                  className="w-full text-left px-4 py-4 rounded-xl border border-[var(--border)] hover:border-[#4d82d6] hover:bg-[#1e3a8a]/5 transition-colors"
                >
                  <span className="font-semibold text-[var(--text-primary)]">{name}</span>
                </button>
              )
            })
          )}
        </div>
      ) : (
        <SurebetCalculator
          profiles={profiles as any}
          defaultProfileId={selectedProfileId}
          profileName={selectedProfileName}
          onSaved={() => router.push("/apostas")}
        />
      )}
    </div>
  )
}
