"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/useToast"
import {
  ArrowLeft, TrendingUp, DollarSign, Clock, BarChart2,
  CheckCircle2, XCircle, AlertCircle, CalendarDays, Tag
} from "lucide-react"
import type { Aposta } from "@/lib/types"

type ApostaWithDetails = Aposta & {
  profile?: { id: string; user_id: string; nome: string; sobrenome: string; apelido?: string | null }
  legs?: Array<{
    id: string
    aposta_id: string
    profile_bet_id: string
    resultado_apostado: string
    odd: number
    stake: number
    created_at: string
    profile_bet?: {
      id: string
      email: string
      saldo: number
      bet?: { id: string; nome: string; logo_url?: string | null }
    }
  }>
}

function StatusIcon({ status }: { status: string }) {
  if (status === "finalizada") return <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
  if (status === "cancelada") return <XCircle className="w-5 h-5 text-[#DC2626]" />
  return <AlertCircle className="w-5 h-5 text-yellow-500" />
}

function statusBadge(status: string) {
  if (status === "finalizada") return <Badge variant="default">Finalizada</Badge>
  if (status === "cancelada") return <Badge variant="destructive">Cancelada</Badge>
  return <Badge variant="yellow">Pendente</Badge>
}

export default function ApostaDetailClient({ aposta: initial }: { aposta: ApostaWithDetails }) {
  const [aposta, setAposta] = useState(initial)
  const [finalizarOpen, setFinalizarOpen] = useState(false)
  const [greenLegId, setGreenLegId] = useState<string | null>(null)
  const [finalizando, setFinalizando] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  function parseBRL(formatted: string) {
    return parseFloat(formatted.replace(/\./g, "").replace(",", ".")) || 0
  }

  // Calculate green/red per leg based on which leg won
  const legs = aposta.legs ?? []
  const totalInvestido = aposta.investimento_total

  function calcGreenRed(winnerLegId: string) {
    return legs.map(leg => {
      if (leg.id === winnerLegId) {
        const retorno = leg.stake * leg.odd
        const lucro = retorno - totalInvestido
        return { leg, tipo: "green" as const, valor: lucro, retorno }
      } else {
        return { leg, tipo: "red" as const, valor: -leg.stake, retorno: 0 }
      }
    })
  }

  const greenRedCalc = greenLegId ? calcGreenRed(greenLegId) : null
  const resultadoLiquido = greenRedCalc
    ? greenRedCalc.reduce((s, r) => s + r.valor, 0)
    : null

  async function handleFinalizar() {
    if (!greenLegId || resultadoLiquido === null) {
      toast({ title: "Selecione qual casa deu green", variant: "destructive" })
      return
    }
    setFinalizando(true)
    const { error } = await supabase
      .from("apostas")
      .update({ status: "finalizada", resultado_real: resultadoLiquido, finalizada_at: new Date().toISOString() })
      .eq("id", aposta.id)

    if (error) {
      toast({ title: "Erro ao finalizar aposta", variant: "destructive" })
    } else {
      setAposta(prev => ({ ...prev, status: "finalizada", resultado_real: resultadoLiquido, finalizada_at: new Date().toISOString() }))
      toast({ title: "Aposta finalizada com sucesso!" })
      setFinalizarOpen(false)
      setGreenLegId(null)
    }
    setFinalizando(false)
  }

  async function handleCancelar() {
    setCancelando(true)
    const { error } = await supabase
      .from("apostas")
      .update({ status: "cancelada" })
      .eq("id", aposta.id)

    if (error) {
      toast({ title: "Erro ao cancelar aposta", variant: "destructive" })
    } else {
      setAposta(prev => ({ ...prev, status: "cancelada" }))
      toast({ title: "Aposta cancelada" })
    }
    setCancelando(false)
  }

  const perfil = aposta.profile
  const lucroExibido = aposta.status === "finalizada"
    ? (aposta.resultado_real ?? aposta.lucro_garantido)
    : aposta.lucro_garantido

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4 md:p-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[var(--text-primary)] truncate">{aposta.evento}</h1>
          {perfil && (
            <Link href={`/perfis/${perfil.id}`} className="text-sm text-[var(--text-secondary)] hover:text-[#16A34A] transition-colors">
              {perfil.apelido ?? `${perfil.nome} ${perfil.sobrenome}`}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusIcon status={aposta.status} />
          {statusBadge(aposta.status)}
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#2563EB]/10 rounded-lg">
                <DollarSign className="h-4 w-4 text-[#2563EB]" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Investimento</p>
                <p className="text-base font-bold text-[var(--text-primary)]">{formatCurrency(aposta.investimento_total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${aposta.status === "finalizada" ? "bg-[#16A34A]/10" : "bg-yellow-50"}`}>
                <TrendingUp className={`h-4 w-4 ${aposta.status === "finalizada" ? "text-[#16A34A]" : "text-yellow-500"}`} />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {aposta.status === "finalizada" ? "Lucro Real" : "Lucro Esperado"}
                </p>
                <p className={`text-base font-bold ${aposta.status === "finalizada" ? "text-[#16A34A]" : "text-yellow-600"}`}>
                  {formatCurrency(lucroExibido)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart2 className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">ROI</p>
                <p className="text-base font-bold text-purple-600">{aposta.roi_percentual.toFixed(2)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--bg-elevated)] rounded-lg">
                <Tag className="h-4 w-4 text-[var(--text-secondary)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Tipo</p>
                <p className="text-base font-bold text-[var(--text-primary)]">{aposta.tipo}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Entradas por Casa de Apostas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {legs.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-4">Nenhuma entrada registrada</p>
          ) : (
            legs.map((leg, i) => (
              <div key={leg.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#16A34A]/10 flex items-center justify-center text-xs font-bold text-[#16A34A]">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-[var(--text-primary)]">
                      {leg.profile_bet?.bet?.nome ?? "Casa desconhecida"}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Resultado: <span className="font-medium text-[var(--text-primary)]">{leg.resultado_apostado}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[var(--text-primary)]">Odd {Number(leg.odd).toFixed(2)}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{formatCurrency(leg.stake)}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Datas */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <CalendarDays className="w-4 h-4" />
              <span>Registrada em</span>
            </div>
            <span className="font-medium text-[var(--text-primary)]">
              {new Date(aposta.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </span>
          </div>
          {aposta.finalizada_at && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <Clock className="w-4 h-4" />
                <span>Finalizada em</span>
              </div>
              <span className="font-medium text-[var(--text-primary)]">
                {new Date(aposta.finalizada_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações */}
      {aposta.status === "pendente" && (
        <div className="flex gap-3">
          <Button
            className="flex-1 bg-[#16A34A] hover:bg-[#15803D]"
            onClick={() => setFinalizarOpen(true)}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Finalizar Aposta
          </Button>
          <Button
            variant="outline"
            className="text-[#DC2626] border-[#DC2626]/30 hover:bg-[#DC2626]/5"
            onClick={handleCancelar}
            disabled={cancelando}
          >
            <XCircle className="w-4 h-4 mr-2" />
            {cancelando ? "Cancelando..." : "Cancelar"}
          </Button>
        </div>
      )}

      {/* Dialog Finalizar */}
      <Dialog open={finalizarOpen} onOpenChange={open => { setFinalizarOpen(open); if (!open) setGreenLegId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Aposta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
              <p className="text-sm font-medium text-[var(--text-primary)]">{aposta.evento}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Lucro garantido esperado: {formatCurrency(aposta.lucro_garantido)}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Qual casa deu green?</Label>
              <div className="space-y-2">
                {legs.map(leg => (
                  <button
                    key={leg.id}
                    type="button"
                    onClick={() => setGreenLegId(leg.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      greenLegId === leg.id
                        ? "border-[#16A34A] bg-[#16A34A]/10"
                        : "border-[var(--border)] bg-[var(--bg-muted)] hover:border-[#16A34A]/50"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {leg.profile_bet?.bet?.nome ?? "Casa desconhecida"}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {leg.resultado_apostado} · Odd {Number(leg.odd).toFixed(2)} · Stake {formatCurrency(leg.stake)}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                      greenLegId === leg.id ? "border-[#16A34A] bg-[#16A34A]" : "border-[var(--border)]"
                    }`} />
                  </button>
                ))}
              </div>
            </div>

            {greenRedCalc && (
              <div className="space-y-2 p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Resultado por casa</p>
                {greenRedCalc.map(r => (
                  <div key={r.leg.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${r.tipo === "green" ? "bg-[#16A34A] text-white" : "bg-[#DC2626] text-white"}`}>
                        {r.tipo === "green" ? "GREEN" : "RED"}
                      </span>
                      <span className="text-[var(--text-primary)]">{r.leg.profile_bet?.bet?.nome ?? "Casa"}</span>
                    </div>
                    <span className={`font-bold ${r.valor >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
                      {r.valor >= 0 ? "+" : ""}{formatCurrency(r.valor)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-sm font-bold">
                  <span className="text-[var(--text-primary)]">Resultado líquido</span>
                  <span className={resultadoLiquido! >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}>
                    {resultadoLiquido! >= 0 ? "+" : ""}{formatCurrency(resultadoLiquido!)}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFinalizarOpen(false); setGreenLegId(null) }}>Cancelar</Button>
            <Button onClick={handleFinalizar} disabled={finalizando || !greenLegId} className="bg-[#16A34A] hover:bg-[#15803D]">
              {finalizando ? "Finalizando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
