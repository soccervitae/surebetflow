"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/useToast"
import { BookOpen, Filter, X, Plus, Calculator, CalendarIcon, ChevronDown } from "lucide-react"
import type { Aposta, ApostaLeg } from "@/lib/types"
import SurebetCalculator from "@/components/SurebetCalculator"

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
  const [filterPeriod, setFilterPeriod] = useState<"todos" | "dia" | "semana" | "mes" | "custom">("todos")
  const [filterCustomMode, setFilterCustomMode] = useState<"single" | "range">("single")
  const [filterCustomDate, setFilterCustomDate] = useState("")
  const [filterCustomFrom, setFilterCustomFrom] = useState("")
  const [filterCustomTo, setFilterCustomTo] = useState("")
  const [finalizarDialog, setFinalizarDialog] = useState<Aposta | null>(null)
  const [deletarDialog, setDeletarDialog] = useState<Aposta | null>(null)
  const [showFilter, setShowFilter] = useState(false)
  const [novaSheet, setNovaSheet] = useState(false)   // mobile
  const [novaModal, setNovaModal] = useState(false)   // desktop
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

  function getPeriodRange(): { from: Date | null; to: Date | null } {
    const now = new Date()
    if (filterPeriod === "dia") {
      const from = new Date(now); from.setHours(0, 0, 0, 0)
      const to = new Date(now); to.setHours(23, 59, 59, 999)
      return { from, to }
    }
    if (filterPeriod === "semana") {
      const from = new Date(now); from.setDate(now.getDate() - now.getDay()); from.setHours(0, 0, 0, 0)
      const to = new Date(now); to.setHours(23, 59, 59, 999)
      return { from, to }
    }
    if (filterPeriod === "mes") {
      const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      const to = new Date(now); to.setHours(23, 59, 59, 999)
      return { from, to }
    }
    if (filterPeriod === "custom") {
      if (filterCustomMode === "single" && filterCustomDate) {
        const from = new Date(filterCustomDate); from.setHours(0, 0, 0, 0)
        const to = new Date(filterCustomDate); to.setHours(23, 59, 59, 999)
        return { from, to }
      }
      if (filterCustomMode === "range") {
        const from = filterCustomFrom ? (() => { const d = new Date(filterCustomFrom); d.setHours(0,0,0,0); return d })() : null
        const to = filterCustomTo ? (() => { const d = new Date(filterCustomTo); d.setHours(23,59,59,999); return d })() : null
        return { from, to }
      }
    }
    return { from: null, to: null }
  }

  const filtered = apostas.filter(a => {
    if (filterStatus !== "todos" && a.status !== filterStatus) return false
    if (filterProfile !== "todos" && a.profile_id !== filterProfile) return false
    const { from, to } = getPeriodRange()
    const created = new Date(a.created_at)
    if (from && created < from) return false
    if (to && created > to) return false
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
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Apostas</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Histórico completo de todas as suas apostas</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNovaSheet(true)}
            className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1e3a8a] text-white text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Nova
          </button>
          <button
            onClick={() => setNovaModal(true)}
            className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nova aposta
          </button>
        </div>
      </div>

      {/* Filters — always visible (mobile + desktop) */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="hidden md:flex items-center gap-2">
            <Filter className="h-4 w-4 text-[var(--text-secondary)]" />
            <span className="text-sm font-medium text-[var(--text-primary)]">Filtros</span>
          </div>

          {/* Status + Perfil */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                <SelectTrigger><SelectValue /></SelectTrigger>
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

          {/* Period pills */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              Período
            </Label>
            <div className="flex flex-wrap gap-2">
              {(["todos", "dia", "semana", "mes"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setFilterPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    filterPeriod === p
                      ? "bg-[#1e3a8a] border-[#1e3a8a] text-white"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                  }`}
                >
                  {{ todos: "Todos", dia: "Hoje", semana: "Semana", mes: "Mês" }[p]}
                </button>
              ))}
              <button
                onClick={() => setFilterPeriod("custom")}
                title="Data personalizada"
                className={`flex items-center justify-center w-[34px] h-[34px] rounded-lg transition-colors border ${
                  filterPeriod === "custom"
                    ? "bg-[#1e3a8a] border-[#1e3a8a] text-white"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                }`}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            {filterPeriod === "custom" && (
              <div className="mt-2 space-y-2">
                {/* Mode toggle */}
                <div className="flex gap-1 p-0.5 bg-[var(--bg-elevated)] rounded-lg w-fit">
                  <button
                    onClick={() => setFilterCustomMode("single")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      filterCustomMode === "single"
                        ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                        : "text-[var(--text-secondary)]"
                    }`}
                  >
                    Data
                  </button>
                  <button
                    onClick={() => setFilterCustomMode("range")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      filterCustomMode === "range"
                        ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                        : "text-[var(--text-secondary)]"
                    }`}
                  >
                    Intervalo
                  </button>
                </div>
                {filterCustomMode === "single" ? (
                  <Input
                    type="date"
                    value={filterCustomDate}
                    onChange={e => setFilterCustomDate(e.target.value)}
                    className="text-xs h-8 max-w-[160px]"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={filterCustomFrom}
                      onChange={e => setFilterCustomFrom(e.target.value)}
                      className="text-xs h-8 max-w-[140px]"
                      placeholder="Início"
                    />
                    <span className="text-[var(--text-muted)] text-xs">até</span>
                    <Input
                      type="date"
                      value={filterCustomTo}
                      onChange={e => setFilterCustomTo(e.target.value)}
                      className="text-xs h-8 max-w-[140px]"
                      placeholder="Fim"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {(filterStatus !== "todos" || filterProfile !== "todos" || filterPeriod !== "todos") && (
            <button
              onClick={() => { setFilterStatus("todos"); setFilterProfile("todos"); setFilterPeriod("todos"); setFilterCustomDate(""); setFilterCustomFrom(""); setFilterCustomTo("") }}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
            >
              <X className="h-3 w-3" />
              Limpar filtros
            </button>
          )}
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
          {filtered.map(aposta => {
            const legs = (aposta as Aposta & { legs?: ApostaLeg[] }).legs ?? []
            const greenLegId = aposta.status === "finalizada" && aposta.resultado_real != null
              ? legs.find(l => Math.abs(l.stake * l.odd - aposta.investimento_total - aposta.resultado_real!) < 0.5)?.id ?? null
              : null

            return (
            <Link key={aposta.id} href={`/apostas/${aposta.id}`}>
            <Card className="hover:border-[#1e3a8a]/40 transition-colors cursor-pointer overflow-hidden">
              <CardContent className="p-4">
                {/* Linha 1: evento + badges */}
                <div className="flex items-center gap-2 flex-wrap mb-1 min-w-0">
                  <p className="font-medium text-[var(--text-primary)] truncate">{aposta.evento}</p>
                  {statusBadge(aposta.status)}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mb-2">
                  Perfil: {aposta.profile ? (aposta.profile.apelido || `${aposta.profile.nome} ${aposta.profile.sobrenome}`) : "—"} · {new Date(aposta.created_at).toLocaleDateString("pt-BR")}
                </p>

                {/* Legs */}
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

                {/* Linha final: Investimento + Lucro */}
                <div className="flex items-end justify-between gap-2 pt-2 border-t border-[var(--border)]">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Investimento</p>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{formatCurrency(aposta.investimento_total)}</p>
                  </div>
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
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            </Link>
            )
          })}
        </div>
      )}

      {/* Nova aposta — Sheet mobile */}
      <Sheet open={novaSheet} onOpenChange={setNovaSheet}>
        <SheetContent
          side="bottom"
          className="h-[70vh] flex flex-col p-0 rounded-t-2xl"
          onTouchStart={e => { (e.currentTarget as any)._swipeY = e.touches[0].clientY }}
          onTouchEnd={e => {
            const startY = (e.currentTarget as any)._swipeY
            if (startY !== undefined && e.changedTouches[0].clientY - startY > 80) setNovaSheet(false)
          }}
        >
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-[var(--border)] flex-shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-[var(--accent-text)]" />
              Nova aposta
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <SurebetCalculator
              profiles={profiles as any}
              onSaved={async () => {
                setNovaSheet(false)
                const { data } = await supabase
                  .from("apostas")
                  .select("*, profile:profiles(nome, sobrenome, apelido), legs:aposta_legs(*, profile_bet:profile_bets(*, bet:bets(*)))")
                  .in("profile_id", profiles.map(p => p.id))
                  .order("created_at", { ascending: false })
                if (data) setApostas(data as any)
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Nova aposta — Modal desktop */}
      <Dialog open={novaModal} onOpenChange={setNovaModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-[var(--accent-text)]" />
              Nova aposta
            </DialogTitle>
          </DialogHeader>
          <SurebetCalculator
            profiles={profiles as any}
            onSaved={async () => {
              setNovaModal(false)
              const { data } = await supabase
                .from("apostas")
                .select("*, profile:profiles(nome, sobrenome, apelido), legs:aposta_legs(*, profile_bet:profile_bets(*, bet:bets(*)))")
                .in("profile_id", profiles.map(p => p.id))
                .order("created_at", { ascending: false })
              if (data) setApostas(data as any)
            }}
          />
        </DialogContent>
      </Dialog>

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
