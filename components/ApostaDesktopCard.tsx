"use client"

import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

export type ApostaLegMin = {
  id: string
  stake: number
  odd: number
  resultado_apostado?: string | null
  profile_bet?: {
    bet?: { nome?: string | null } | null
  } | null
}

export type ApostaMin = {
  id: string
  status: string
  evento: string
  esporte?: string | null
  competicao?: string | null
  data_evento?: string | null
  created_at: string
  investimento_total: number
  roi_percentual: number
  lucro_garantido: number
  resultado_real?: number | null
  profile?: { nome: string; sobrenome: string; apelido?: string | null } | null
  legs?: ApostaLegMin[]
}

interface Props {
  aposta: ApostaMin
  statusBadge: (status: string) => React.ReactNode
  detectGreen: (legs: ApostaLegMin[], investimento: number, resultado: number | null | undefined) => string | null
}

export default function ApostaDesktopCard({ aposta, statusBadge, detectGreen }: Props) {
  const legs = (aposta.legs ?? []) as ApostaLegMin[]
  const d = aposta.data_evento ? new Date(aposta.data_evento) : new Date(aposta.created_at)
  const dataStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
  const horaStr = aposta.data_evento ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : null
  const isFinished = aposta.status === "finalizada" && aposta.resultado_real != null
  const detectedGreenLegId = isFinished ? detectGreen(legs, aposta.investimento_total, aposta.resultado_real) : null

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:border-[#1e3a8a]/40 transition-colors"
      onClick={() => window.location.href = `/apostas/${aposta.id}`}
    >
      {/* Header: profile name + status */}
      <div className="flex items-center justify-between px-5 py-2 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          {aposta.profile && (
            <span className="font-medium">
              {aposta.profile.apelido || `${aposta.profile.nome} ${aposta.profile.sobrenome}`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {statusBadge(aposta.status)}
        </div>
      </div>

      {/* Legs */}
      <div className="divide-y divide-[var(--border)]">
        {legs.map(leg => {
          const isGreen = detectedGreenLegId === leg.id
          const isRed = isFinished && detectedGreenLegId !== null && !isGreen
          return (
            <div key={leg.id} className={`flex items-center gap-4 px-5 py-3 ${isGreen ? "bg-green-500/5" : isRed ? "bg-[#DC2626]/5" : ""}`}>
              <div className="w-36 flex-shrink-0">
                <p className="font-semibold text-[var(--text-primary)] text-sm truncate">{leg.profile_bet?.bet?.nome ?? "—"}</p>
                {aposta.esporte && <p className="text-xs text-[var(--text-muted)] truncate">{aposta.esporte}</p>}
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-8">
                <div className="min-w-0">
                  <p className={`text-sm font-medium leading-snug line-clamp-2 ${aposta.status === "pendente" ? "text-red-500 dark:text-[var(--text-secondary)]" : "text-[var(--text-secondary)]"}`}>
                    {aposta.evento}
                  </p>
                  {aposta.competicao && <p className="text-xs text-[var(--text-muted)] truncate">{aposta.competicao}</p>}
                </div>
                <div className="flex-shrink-0 text-center">
                  <p className="text-xs font-medium text-[var(--text-secondary)]">{dataStr}</p>
                  {horaStr && <p className="text-xs text-[var(--text-muted)]">{horaStr}</p>}
                </div>
              </div>
              <div className="text-right flex-shrink-0 w-28">
                <p className="text-xs text-[var(--text-muted)]">Stake</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(leg.stake)}</p>
              </div>
              <div className="text-right flex-shrink-0 w-20">
                <p className="text-xs text-[var(--text-muted)]">Odd</p>
                <p className="text-sm font-bold text-[var(--text-primary)]">{Number(leg.odd).toFixed(3)}</p>
              </div>
              {isFinished && (
                <div className="text-right flex-shrink-0 w-28">
                  <p className="text-xs text-[var(--text-muted)]">{isGreen ? "Retorno" : "Perda"}</p>
                  <p className={`text-sm font-bold ${isGreen ? "text-green-600" : "text-[#DC2626]"}`}>
                    {isGreen
                      ? `+${formatCurrency(leg.stake * leg.odd)}`
                      : `-${formatCurrency(leg.stake)}`}
                  </p>
                </div>
              )}
              {isFinished && (
                <span className={`px-2.5 py-1 rounded text-xs font-bold w-14 text-center flex-shrink-0 ${isGreen ? "bg-green-600 text-white" : "bg-[#DC2626] text-white"}`}>
                  {isGreen ? "GREEN" : "RED"}
                </span>
              )}
            </div>
          )
        })}

        {/* Footer totals */}
        <div className="flex items-center gap-4 px-5 py-2 bg-[var(--bg-elevated)]">
          <div className="w-36 flex-shrink-0" />
          <div className="flex-1 min-w-0" />
          <div className="text-right flex-shrink-0 w-28">
            <p className="text-xs text-[var(--text-muted)]">Investimento</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(aposta.investimento_total)}</p>
          </div>
          <div className="text-right flex-shrink-0 w-20">
            <p className="text-xs text-[var(--text-muted)]">ROI</p>
            <p className="text-sm font-bold text-[#a855f7]">{aposta.roi_percentual.toFixed(2)}%</p>
          </div>
          <div className="text-right flex-shrink-0 w-28">
            <p className="text-xs text-[var(--text-muted)]">{isFinished ? "Lucro" : "Lucro esperado"}</p>
            <p className={`text-sm font-bold ${isFinished ? ((aposta.resultado_real ?? 0) >= 0 ? "text-green-500" : "text-[#DC2626]") : "text-[#D97706]"}`}>
              {isFinished ? formatCurrency(aposta.resultado_real ?? 0) : formatCurrency(aposta.lucro_garantido)}
            </p>
          </div>
          {isFinished && <div className="w-14 flex-shrink-0" />}
        </div>
      </div>
    </Card>
  )
}
