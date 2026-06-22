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
  const [resultadoReal, setResultadoReal] = useState("")
  const [finalizando, setFinalizando] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  function formatBRL(raw: string) {
    const digits = raw.replace(/\D/g, "")
    if (!digits) return ""
    const num = parseInt(digits, 10) / 100
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function parseBRL(formatted: string) {
    return parseFloat(formatted.replace(/\./g, "").replace(",", ".")) || 0
  }

  async function handleFinalizar() {
    const valor = parseBRL(resultadoReal)
    if (!valor || valor <= 0) {
      toast({ title: "Informe um valor válido", variant: "destructive" })
      return
    }
    setFinalizando(true)
    const { error } = await supabase
      .from("apostas")
      .update({ status: "finalizada", resultado_real: valor, finalizada_at: new Date().toISOString() })
      .eq("id", aposta.id)

    if (error) {
      toast({ title: "Erro ao finalizar aposta", variant: "destructive" })
    } else {
      setAposta(prev => ({ ...prev, status: "finalizada", resultado_real: valor, finalizada_at: new Date().toISOString() }))
      toast({ title: "Aposta finalizada com sucesso!" })
      setFinalizarOpen(false)
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
  const legs = aposta.legs ?? []
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
            onClick={() => {
              setResultadoReal(formatBRL((aposta.lucro_garantido * 100).toFixed(0)))
              setFinalizarOpen(true)
            }}
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
      <Dialog open={finalizarOpen} onOpenChange={setFinalizarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Aposta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
              <p className="text-sm font-medium text-[var(--text-primary)]">{aposta.evento}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Lucro esperado: {formatCurrency(aposta.lucro_garantido)}</p>
            </div>
            <div className="space-y-2">
              <Label>Resultado real obtido (R$)</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={resultadoReal}
                onChange={e => setResultadoReal(formatBRL(e.target.value))}
                placeholder="0,00"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalizarOpen(false)}>Cancelar</Button>
            <Button onClick={handleFinalizar} disabled={finalizando} className="bg-[#16A34A] hover:bg-[#15803D]">
              {finalizando ? "Finalizando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
