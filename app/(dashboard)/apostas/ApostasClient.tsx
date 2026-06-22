"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/useToast"
import { BookOpen, Filter, Trash2 } from "lucide-react"
import type { Aposta, ApostaLeg } from "@/lib/types"

interface Props {
  apostas: (Aposta & { profile?: { nome: string; sobrenome: string; apelido?: string | null } })[]
  profiles: { id: string; nome: string; sobrenome: string; apelido?: string | null }[]
}

function statusBadge(status: string) {
  switch (status) {
    case "finalizada": return <Badge variant="default">Finalizada</Badge>
    case "cancelada": return <Badge variant="destructive">Cancelada</Badge>
    default: return <Badge variant="yellow">Pendente</Badge>
  }
}

export default function ApostasClient({ apostas: initialApostas, profiles }: Props) {
  const [apostas, setApostas] = useState(initialApostas)
  const [filterStatus, setFilterStatus] = useState("todos")
  const [filterProfile, setFilterProfile] = useState("todos")
  const [finalizarDialog, setFinalizarDialog] = useState<Aposta | null>(null)
  const [deletarDialog, setDeletarDialog] = useState<Aposta | null>(null)
  const [resultadoReal, setResultadoReal] = useState("")
  const [finalizando, setFinalizando] = useState(false)
  const [deletando, setDeletando] = useState(false)
  const { toast } = useToast()
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

  const filtered = apostas.filter(a => {
    if (filterStatus !== "todos" && a.status !== filterStatus) return false
    if (filterProfile !== "todos" && a.profile_id !== filterProfile) return false
    return true
  })

  async function handleFinalizar() {
    if (!finalizarDialog) return
    setFinalizando(true)
    const valor = parseBRL(resultadoReal)
    if (isNaN(valor)) {
      toast({ title: "Valor inválido", variant: "destructive" })
      setFinalizando(false)
      return
    }
    const { error } = await supabase
      .from("apostas")
      .update({ status: "finalizada", resultado_real: valor, finalizada_at: new Date().toISOString() })
      .eq("id", finalizarDialog.id)

    if (error) {
      toast({ title: "Erro ao finalizar aposta", variant: "destructive" })
    } else {
      setApostas(prev => prev.map(a => a.id === finalizarDialog.id
        ? { ...a, status: "finalizada" as const, resultado_real: valor, finalizada_at: new Date().toISOString() }
        : a
      ))
      toast({ title: "Aposta finalizada!" })
      setFinalizarDialog(null)
      setResultadoReal("")
    }
    setFinalizando(false)
  }

  async function handleDeletar() {
    if (!deletarDialog) return
    setDeletando(true)
    const { error } = await supabase.from("apostas").delete().eq("id", deletarDialog.id)
    if (error) {
      toast({ title: "Erro ao deletar aposta", variant: "destructive" })
    } else {
      setApostas(prev => prev.filter(a => a.id !== deletarDialog.id))
      toast({ title: "Aposta deletada" })
      setDeletarDialog(null)
    }
    setDeletando(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Apostas</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Histórico completo de todas as suas apostas</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-[var(--text-secondary)]" />
            <span className="text-sm font-medium text-[var(--text-primary)]">Filtros</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="finalizada">Finalizadas</SelectItem>
                  <SelectItem value="cancelada">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Perfil</Label>
              <Select value={filterProfile} onValueChange={setFilterProfile}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os perfis</SelectItem>
                  {profiles.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.apelido || `${p.nome} ${p.sobrenome}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-[var(--text-secondary)]">Nenhuma aposta encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(aposta => (
            <Link key={aposta.id} href={`/apostas/${aposta.id}`}>
            <Card className="hover:border-[#1e3a8a]/40 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-medium text-[var(--text-primary)] truncate">{aposta.evento}</p>
                      {statusBadge(aposta.status)}
                      <Badge variant="secondary">{aposta.tipo}</Badge>
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] space-y-0.5">
                      <p>
                        Perfil: {aposta.profile ? (aposta.profile.apelido || `${aposta.profile.nome} ${aposta.profile.sobrenome}`) : "—"}
                      </p>
                      <p>
                        Investimento: {formatCurrency(aposta.investimento_total)} ·
                        ROI: {aposta.roi_percentual.toFixed(2)}% ·
                        {new Date(aposta.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    {/* Legs */}
                    {(aposta as Aposta & { legs?: ApostaLeg[] }).legs && (aposta as Aposta & { legs?: ApostaLeg[] }).legs!.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {(aposta as Aposta & { legs?: ApostaLeg[] }).legs!.map((leg) => (
                          <div key={leg.id} className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                            <span className="bg-[var(--bg-elevated)] rounded px-1.5 py-0.5">
                              {leg.profile_bet?.bet?.nome ?? "Casa"}
                            </span>
                            <span>{leg.resultado_apostado}</span>
                            <span className="font-medium">@{leg.odd}</span>
                            <span className="text-[var(--accent-text)]">{formatCurrency(leg.stake)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <button
                    onClick={e => { e.preventDefault(); setDeletarDialog(aposta) }}
                    className="p-1 rounded text-gray-400 hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="text-right">
                    {aposta.status === "finalizada" ? (
                      <>
                        <p className="text-xs text-[var(--text-muted)]">Resultado real</p>
                        <p className="text-base font-bold text-[var(--accent-text)]">{formatCurrency(aposta.resultado_real ?? 0)}</p>
                        {aposta.finalizada_at && (
                          <p className="text-xs text-[var(--text-muted)]">{new Date(aposta.finalizada_at).toLocaleDateString("pt-BR")}</p>
                        )}
                      </>
                    ) : aposta.status === "pendente" ? (
                      <>
                        <p className="text-xs text-[var(--text-muted)]">Lucro esperado</p>
                        <p className="text-base font-bold text-yellow-600">{formatCurrency(aposta.lucro_garantido)}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={e => {
                            e.preventDefault()
                            setFinalizarDialog(aposta)
                            setResultadoReal(formatBRL((aposta.lucro_garantido * 100).toFixed(0)))
                          }}
                        >
                          Finalizar
                        </Button>
                      </>
                    ) : (
                      <p className="text-sm text-[var(--text-muted)]">Cancelada</p>
                    )}
                  </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={!!deletarDialog} onOpenChange={open => !open && setDeletarDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar Aposta</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--text-secondary)]">
            Tem certeza que deseja deletar a aposta <strong className="text-[var(--text-primary)]">{deletarDialog?.evento}</strong>? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletarDialog(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeletar} disabled={deletando}>
              {deletando ? "Deletando..." : "Deletar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!finalizarDialog} onOpenChange={open => !open && setFinalizarDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Aposta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Evento: <strong>{finalizarDialog?.evento}</strong><br />
              Lucro esperado: <strong>{formatCurrency(finalizarDialog?.lucro_garantido ?? 0)}</strong>
            </p>
            <div className="space-y-2">
              <Label>Resultado real obtido (R$)</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={resultadoReal}
                onChange={e => setResultadoReal(formatBRL(e.target.value))}
                placeholder="0,00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalizarDialog(null)}>Cancelar</Button>
            <Button onClick={handleFinalizar} disabled={finalizando}>
              {finalizando ? "Finalizando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
