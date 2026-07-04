"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { ApostaMin, ApostaLegMin } from "@/components/ApostaDesktopCard"

interface Props {
  aposta: ApostaMin
  statusBadge: (status: string) => React.ReactNode
  detectGreen: (legs: ApostaLegMin[], investimento: number, resultado: number | null | undefined) => string | null
  showProfile?: boolean
  showRoi?: boolean
  onFinalizar?: (aposta: ApostaMin) => void
}

export default function ApostaMobileCard({
  aposta,
  statusBadge,
  detectGreen,
  showProfile = false,
  showRoi = false,
  onFinalizar,
}: Props) {
  const legs = (aposta.legs ?? []) as ApostaLegMin[]
  const isFinished = aposta.status === "finalizada" && aposta.resultado_real != null
  const greenLegId = isFinished ? detectGreen(legs, aposta.investimento_total, aposta.resultado_real) : null
  const d = aposta.data_evento ? new Date(aposta.data_evento) : new Date(aposta.created_at)
  const dateStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
  const timeStr = aposta.data_evento ? ` às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : ""

  return (
    <Link href={`/apostas/${aposta.id}`}>
      <Card className="hover:border-[#1e3a8a]/40 transition-colors cursor-pointer overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2 mb-0.5 min-w-0">
            <p className="font-medium text-[var(--text-primary)] truncate">{aposta.evento}</p>
            <div className="flex-shrink-0">{statusBadge(aposta.status)}</div>
          </div>
          {aposta.competicao && (
            <p className="text-xs text-[var(--text-muted)] truncate mb-1">{aposta.competicao}</p>
          )}
          {showProfile && aposta.profile && (
            <p className="text-xs text-[var(--text-secondary)] mb-1">
              {aposta.profile.apelido ?? `${aposta.profile.nome} ${aposta.profile.sobrenome}`}
            </p>
          )}
          <p className="text-xs text-[var(--text-muted)] mb-3 flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            {dateStr + timeStr}
          </p>

          {legs.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {legs.map(leg => {
                const isGreen = greenLegId === leg.id
                const isRed = greenLegId !== null && greenLegId !== leg.id
                return (
                  <div key={leg.id} className={`rounded-xl px-3 py-3 flex items-center gap-3 ${
                    isGreen ? "bg-green-500/10" : isRed ? "bg-[#DC2626]/5" : "bg-[var(--bg-elevated)]"
                  }`}>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className={`text-base font-bold leading-tight ${isGreen ? "text-green-600" : isRed ? "text-[#DC2626]" : "text-[var(--accent-text)]"}`}>
                        {leg.profile_bet?.bet?.nome ?? "Casa"}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)] leading-snug">{leg.resultado_apostado}</p>
                      <p className="text-sm text-[var(--text-secondary)]">@{Number(leg.odd).toFixed(2)} · {formatCurrency(leg.stake)}</p>
                      {(isGreen || isRed) && (
                        <p className={`text-sm font-bold ${isGreen ? "text-green-600" : "text-[#DC2626]"}`}>
                          {isGreen
                            ? `Retorno: +${formatCurrency(leg.stake * leg.odd)}`
                            : `Perda: -${formatCurrency(leg.stake)}`}
                        </p>
                      )}
                    </div>
                    {(isGreen || isRed) && (
                      <span className={`px-2.5 py-1 rounded text-xs font-bold flex-shrink-0 ${
                        isGreen ? "bg-green-600 text-white" : "bg-[#DC2626] text-white"
                      }`}>
                        {isGreen ? "GREEN" : "RED"}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex items-end justify-between gap-2 pt-2 border-t border-[var(--border)]">
            <div>
              <p className="text-xs text-[var(--text-muted)]">Investimento</p>
              <p className="text-sm font-bold text-[var(--text-primary)]">{formatCurrency(aposta.investimento_total)}</p>
            </div>
            {showRoi && (
              <div className="text-center">
                <p className="text-xs text-[var(--text-muted)]">ROI</p>
                <p className="text-sm font-bold text-[#a855f7]">{Number(aposta.roi_percentual).toFixed(2)}%</p>
              </div>
            )}
            {aposta.status !== "cancelada" && (
              <div className="text-right">
                <p className="text-xs text-[var(--text-muted)]">
                  {aposta.status === "finalizada" ? "Lucro" : "Lucro esperado"}
                </p>
                {aposta.status === "finalizada" ? (
                  <p className={`text-sm font-bold ${(aposta.resultado_real ?? 0) >= 0 ? "text-[var(--accent-text)]" : "text-[#DC2626]"}`}>
                    {formatCurrency(aposta.resultado_real ?? 0)}
                  </p>
                ) : (
                  <>
                    <p className="text-sm font-bold text-[#D97706]">{formatCurrency(aposta.lucro_garantido)}</p>
                    {onFinalizar && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={e => { e.preventDefault(); onFinalizar(aposta) }}
                      >
                        Finalizar
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
