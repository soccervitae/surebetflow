"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"
import SurebetCalculator from "@/components/SurebetCalculator"
import type { Profile } from "@/lib/types"

interface Props {
  profiles: Pick<Profile, "id" | "nome" | "sobrenome" | "apelido">[]
  betCountMap: Record<string, number>
}

export default function NovaApostaClient({ profiles, betCountMap }: Props) {
  const router = useRouter()
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [selectedProfileName, setSelectedProfileName] = useState<string>("")

  const hasEnoughBets = selectedProfileId ? (betCountMap[selectedProfileId] ?? 0) >= 2 : false

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => selectedProfileId ? setSelectedProfileId(null) : router.back()}
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
              const count = betCountMap[p.id] ?? 0
              const insufficient = count < 2
              return (
                <button
                  key={p.id}
                  onClick={() => { setSelectedProfileId(p.id); setSelectedProfileName(name) }}
                  className="w-full text-left px-4 py-4 rounded-xl border border-[var(--border)] hover:border-[#4d82d6] hover:bg-[#1e3a8a]/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[var(--text-primary)]">{name}</span>
                    {insufficient && (
                      <span className="text-xs text-amber-500 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {count === 0 ? "Sem bets" : `${count} bet`}
                      </span>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      ) : !hasEnoughBets ? (
        /* Insufficient bets warning */
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-center space-y-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 mx-auto">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-[var(--text-primary)]">Bets insuficientes</p>
            <p className="text-sm text-[var(--text-secondary)]">
              Para criar uma aposta no perfil <span className="font-medium text-[var(--text-primary)]">{selectedProfileName}</span> você precisa ter pelo menos <span className="font-medium">2 casas de apostas</span> cadastradas.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href={`/perfis/${selectedProfileId}?tab=bets`}
              className="px-4 py-2.5 rounded-xl bg-[#1e3a8a] text-white text-sm font-semibold"
            >
              Adicionar bets no perfil
            </Link>
            <button
              onClick={() => setSelectedProfileId(null)}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] text-sm"
            >
              Escolher outro perfil
            </button>
          </div>
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
