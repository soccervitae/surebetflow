"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { BookOpen, Filter, X, Calculator, CalendarIcon, AlertTriangle, Download, Check, SlidersHorizontal } from "lucide-react"
import type { Aposta, ApostaLeg } from "@/lib/types"
import SurebetCalculator from "@/components/SurebetCalculator"

interface Props {
  apostas: (Aposta & { profile?: { nome: string; sobrenome: string; apelido?: string | null } })[]
  profiles: { id: string; nome: string; sobrenome: string; apelido?: string | null }[]
  betCountMap: Record<string, number>
}

function statusBadge(status: string) {
  switch (status) {
    case "finalizada": return <Badge variant="default">Finalizada</Badge>
    case "cancelada": return <Badge variant="destructive">Cancelada</Badge>
    default: return <Badge variant="yellow">Pendente</Badge>
  }
}

function ProfilePickerContent({ profiles, betCountMap, onSelect, onClose }: {
  profiles: { id: string; nome: string; sobrenome: string; apelido?: string | null }[]
  betCountMap: Record<string, number>
  onSelect: (id: string, name: string) => void
  onClose: () => void
}) {
  return (
    <div className="space-y-2">
      {profiles.map(p => {
        const name = p.apelido || `${p.nome} ${p.sobrenome}`
        const count = betCountMap[p.id] ?? 0
        const insufficient = count < 2
        if (insufficient) {
          return (
            <div key={p.id} className="px-4 py-3 rounded-xl border border-[var(--border)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--text-primary)] text-sm opacity-60">{name}</span>
                <span className="text-xs text-amber-500 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {count === 0 ? "Sem bets" : `${count} bet — mín. 2`}
                </span>
              </div>
              <Link
                href={`/perfis/${p.id}?tab=bets`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-xs text-[#4d82d6] hover:underline font-medium"
              >
                Adicionar bets neste perfil →
              </Link>
            </div>
          )
        }
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id, name)}
            className="w-full text-left px-4 py-3 rounded-xl border border-[var(--border)] hover:border-[#4d82d6] hover:bg-[#1e3a8a]/5 transition-colors"
          >
            <span className="font-semibold text-[var(--text-primary)] text-sm">{name}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function ApostasClient({ apostas: initialApostas, profiles, betCountMap }: Props) {
  const [apostas, setApostas] = useState(initialApostas)
  const [filterStatus, setFilterStatus] = useState("todos")
  const [filterProfile, setFilterProfile] = useState("todos")
  const [filterPeriod, setFilterPeriod] = useState<"todos" | "dia" | "semana" | "mes" | "custom">("todos")
  const [filterCustomMode, setFilterCustomMode] = useState<"single" | "range">("single")
  const [filterCustomDate, setFilterCustomDate] = useState("")
  const [filterCustomFrom, setFilterCustomFrom] = useState("")
  const [filterCustomTo, setFilterCustomTo] = useState("")
  const [filterEsporte, setFilterEsporte] = useState("")
  const [filterCompeticao, setFilterCompeticao] = useState("")
  const [sortBy, setSortBy] = useState<"data_desc" | "data_asc" | "valor_desc" | "roi_desc">("data_desc")
  const [finalizarDialog, setFinalizarDialog] = useState<Aposta | null>(null)
  const [deletarDialog, setDeletarDialog] = useState<Aposta | null>(null)
  const [showFilter, setShowFilter] = useState(false)
  const [novaModal, setNovaModal] = useState(false)
  const [selectProfileModal, setSelectProfileModal] = useState(false)
  const [selectedProfileId, setSelectedProfileId] = useState<string>("")
  const [selectedProfileName, setSelectedProfileName] = useState<string>("")
  const [resultadoReal, setResultadoReal] = useState("")
  const [greenLegId, setGreenLegId] = useState<string | null>(null)
  const [finalizando, setFinalizando] = useState(false)
  const [deletando, setDeletando] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const client = createClient()
    const profileIds = profiles.map(p => p.id)

    async function refetch() {
      const { data } = await client
        .from("apostas")
        .select("*, profile:profiles(nome, sobrenome, apelido), legs:aposta_legs(*, profile_bet:profile_bets(*, bet:bets(*)))")
        .in("profile_id", profileIds)
        .order("created_at", { ascending: false })
      if (data) setApostas(data as any)
    }

    const channel = client
      .channel("apostas-global-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "apostas" }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "aposta_legs" }, refetch)
      .subscribe()

    return () => { client.removeChannel(channel) }
  }, [])

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
    if (filterEsporte && !(a.esporte ?? "").toLowerCase().includes(filterEsporte.toLowerCase())) return false
    if (filterCompeticao && !(a.competicao ?? "").toLowerCase().includes(filterCompeticao.toLowerCase())) return false
    return true
  }).sort((a, b) => {
    if (sortBy === "data_asc") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    if (sortBy === "valor_desc") return b.investimento_total - a.investimento_total
    if (sortBy === "roi_desc") return b.roi_percentual - a.roi_percentual
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  function exportCSV() {
    const headers = ["Evento", "Competição", "Esporte", "Tipo", "Investimento", "Lucro Esperado", "ROI%", "Status", "Resultado Real", "Data"]
    const rows = filtered.map(a => [
      a.evento,
      a.competicao ?? "",
      a.esporte ?? "",
      a.tipo,
      a.investimento_total.toFixed(2),
      a.lucro_garantido.toFixed(2),
      a.roi_percentual.toFixed(2),
      a.status,
      a.resultado_real != null ? a.resultado_real.toFixed(2) : "",
      new Date(a.created_at).toLocaleDateString("pt-BR"),
    ])
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(";")).join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `apostas_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function handleFinalizar() {
    if (!finalizarDialog) return
    if (!greenLegId) {
      toast({ title: "Selecione qual casa deu green", variant: "destructive" })
      return
    }
    setFinalizando(true)
    const greenLeg = (finalizarDialog.legs ?? []).find(l => l.id === greenLegId)
    if (!greenLeg) { setFinalizando(false); return }
    const resultado = greenLeg.stake * greenLeg.odd - finalizarDialog.investimento_total

    const { error } = await supabase
      .from("apostas")
      .update({ status: "finalizada", resultado_real: resultado, finalizada_at: new Date().toISOString() })
      .eq("id", finalizarDialog.id)

    if (error) {
      toast({ title: "Erro ao finalizar aposta", variant: "destructive" })
    } else {
      for (const leg of finalizarDialog.legs ?? []) {
        if (!leg.profile_bet_id) continue
        const isGreen = leg.id === greenLegId
        const tipo = isGreen ? "lucro" : "perda"
        const movValor = isGreen ? leg.stake * leg.odd - leg.stake : leg.stake
        if (movValor > 0) {
          await supabase.from("movimentacoes_financeiras").insert({
            profile_id: finalizarDialog.profile_id,
            profile_bet_id: leg.profile_bet_id,
            tipo,
            valor: movValor,
            descricao: `Aposta: ${finalizarDialog.evento}`,
          })
        }
        const { data: movs } = await supabase
          .from("movimentacoes_financeiras")
          .select("tipo, valor")
          .eq("profile_bet_id", leg.profile_bet_id)
        const novoSaldo = (movs ?? []).reduce((acc, m) => {
          const val = parseFloat(String(m.valor)) || 0
          if (m.tipo === "deposito" || m.tipo === "lucro") return acc + val
          if (m.tipo === "saque" || m.tipo === "perda") return acc - val
          return acc
        }, 0)
        await supabase.from("profile_bets").update({ saldo: novoSaldo }).eq("id", leg.profile_bet_id)
      }

      setApostas(prev => prev.map(a => a.id === finalizarDialog.id
        ? { ...a, status: "finalizada" as const, resultado_real: resultado, finalizada_at: new Date().toISOString() }
        : a
      ))
      toast({ title: "Aposta finalizada!" })
      setFinalizarDialog(null)
      setGreenLegId(null)
      setResultadoReal("")
      router.refresh()
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Apostas</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Histórico de todas as suas apostas</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filtrar button */}
          {(() => {
            const hasActive = filterStatus !== "todos" || filterProfile !== "todos" || filterPeriod !== "todos" || !!filterEsporte || !!filterCompeticao
            return (
              <button
                onClick={() => setShowFilter(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors flex-shrink-0 ${
                  showFilter || hasActive
                    ? "bg-[#1e3a8a]/10 border-[#1e3a8a]/30 text-[var(--accent-text)]"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                }`}
              >
                {showFilter ? <X className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
                Filtrar{hasActive && !showFilter ? " •" : ""}
              </button>
            )
          })()}
          <button
            onClick={exportCSV}
            className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilter && <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Filtros</p>
            {(filterStatus !== "todos" || filterProfile !== "todos" || filterPeriod !== "todos" || filterEsporte || filterCompeticao) && (
              <button
                onClick={() => { setFilterStatus("todos"); setFilterProfile("todos"); setFilterPeriod("todos"); setFilterCustomDate(""); setFilterCustomFrom(""); setFilterCustomTo(""); setFilterEsporte(""); setFilterCompeticao("") }}
                className="text-xs text-[var(--accent-text)] font-medium"
              >
                Limpar
              </button>
            )}
          </div>

          <>

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

          {/* Esporte + Competição */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Esporte</Label>
              <Input
                value={filterEsporte}
                onChange={e => setFilterEsporte(e.target.value)}
                placeholder="ex: Futebol"
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Competição</Label>
              <Input
                value={filterCompeticao}
                onChange={e => setFilterCompeticao(e.target.value)}
                placeholder="ex: Champions League"
                className="text-xs h-9"
              />
            </div>
          </div>

          {/* Ordenação */}
          <div className="space-y-1.5">
            <Label className="text-xs">Ordenar por</Label>
            <Select value={sortBy} onValueChange={v => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="data_desc">Data (mais recente)</SelectItem>
                <SelectItem value="data_asc">Data (mais antigo)</SelectItem>
                <SelectItem value="valor_desc">Maior investimento</SelectItem>
                <SelectItem value="roi_desc">Maior ROI</SelectItem>
              </SelectContent>
            </Select>
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

          </>
        </CardContent>
      </Card>}

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-[var(--text-secondary)]">Nenhuma aposta encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Desktop table ── */}
          {(() => {
            function formatGroupDate(iso: string) {
              return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "")
            }
            const map = new Map<string, typeof filtered>()
            for (const a of filtered) {
              const key = new Date(a.created_at).toISOString().slice(0, 10)
              if (!map.has(key)) map.set(key, [])
              map.get(key)!.push(a)
            }
            const groups = Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
            return (
          <div className="hidden md:block space-y-6">
            {groups.map(([dateKey, apostasGroup]) => (
              <div key={dateKey}>
                <p className="text-xs font-semibold text-[var(--text-muted)] px-1 mb-2">{formatGroupDate(dateKey)}</p>
                <div className="space-y-3">
            {apostasGroup.map(aposta => {
              const legs = (aposta as Aposta & { legs?: ApostaLeg[] }).legs ?? []
              const d = aposta.data_evento ? new Date(aposta.data_evento) : new Date(aposta.created_at)
              const dataStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
              const horaStr = aposta.data_evento ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : null
              const isFinished = aposta.status === "finalizada" && aposta.resultado_real != null
              const detectedGreenLegId = isFinished
                ? (() => {
                    let minDiff = Infinity, minId: string | null = null
                    for (const l of legs) {
                      const stake = parseFloat(String(l.stake))
                      const odd = parseFloat(String(l.odd))
                      const inv = parseFloat(String(aposta.investimento_total))
                      const res = parseFloat(String(aposta.resultado_real ?? 0))
                      const diff = Math.abs(stake * odd - inv - res)
                      if (diff < minDiff) { minDiff = diff; minId = l.id }
                    }
                    return minDiff < 5 ? minId : null
                  })()
                : null

              return (
                <Card
                  key={aposta.id}
                  className="overflow-hidden cursor-pointer hover:border-[#1e3a8a]/40 transition-colors"
                  onClick={() => window.location.href = `/apostas/${aposta.id}`}
                >
                  <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                    <div className="flex flex-col min-w-0">
                      <p className={`font-semibold truncate ${aposta.status === "pendente" ? "text-red-500 dark:text-[var(--text-primary)]" : "text-[var(--text-primary)]"}`}>{aposta.evento}</p>
                      {aposta.competicao && <span className="text-xs text-[var(--text-muted)] truncate">{aposta.competicao}</span>}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-[var(--text-secondary)]">{dataStr}{horaStr ? ` · ${horaStr}` : ""}</span>
                      {statusBadge(aposta.status)}
                      <span className={`font-bold text-base ${
                        isFinished
                          ? (aposta.resultado_real ?? 0) >= 0 ? "text-green-500" : "text-[#DC2626]"
                          : "text-green-500"
                      }`}>
                        {isFinished ? formatCurrency(aposta.resultado_real ?? 0) : formatCurrency(aposta.lucro_garantido)}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">{aposta.roi_percentual.toFixed(2)}%</span>
                    </div>
                  </div>

                  <div className="divide-y divide-[var(--border)]">
                    {legs.map(leg => {
                      const isGreen = detectedGreenLegId === leg.id
                      const isRed = isFinished && detectedGreenLegId !== null && !isGreen
                      return (
                        <div key={leg.id} className={`flex items-center gap-4 px-5 py-3 ${isGreen ? "bg-green-500/5" : isRed ? "bg-[#DC2626]/5" : ""}`}>
                          <div className="w-36 flex-shrink-0">
                            <p className="font-semibold text-[var(--text-primary)] text-sm">{leg.profile_bet?.bet?.nome ?? "—"}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[var(--text-secondary)] truncate">{leg.resultado_apostado}</p>
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
                                {isGreen ? `+${formatCurrency(leg.stake * leg.odd)}` : `-${formatCurrency(leg.stake)}`}
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
            })}
                </div>
              </div>
            ))}
          </div>
            )
          })()}

          {/* ── Mobile cards ── */}
          {(() => {
            function formatGroupDate(iso: string) {
              return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "")
            }
            const map = new Map<string, typeof filtered>()
            for (const a of filtered) {
              const key = new Date(a.created_at).toISOString().slice(0, 10)
              if (!map.has(key)) map.set(key, [])
              map.get(key)!.push(a)
            }
            const groups = Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
            return (
          <div className="md:hidden space-y-6">
            {groups.map(([dateKey, apostasGroup]) => (
              <div key={dateKey}>
                <p className="text-xs font-semibold text-[var(--text-muted)] px-1 mb-2">{formatGroupDate(dateKey)}</p>
                <div className="space-y-3">
            {apostasGroup.map(aposta => {
              const legs = (aposta as Aposta & { legs?: ApostaLeg[] }).legs ?? []
              const greenLegId = aposta.status === "finalizada" && aposta.resultado_real != null
                ? (() => {
                    const inv = parseFloat(String(aposta.investimento_total))
                    const res = parseFloat(String(aposta.resultado_real))
                    let minDiff = Infinity, minId: string | null = null
                    for (const l of legs) {
                      const diff = Math.abs(parseFloat(String(l.stake)) * parseFloat(String(l.odd)) - inv - res)
                      if (diff < minDiff) { minDiff = diff; minId = l.id }
                    }
                    return minDiff < 5 ? minId : null
                  })()
                : null

              return (
              <Link key={aposta.id} href={`/apostas/${aposta.id}`}>
              <Card className="hover:border-[#1e3a8a]/40 transition-colors cursor-pointer overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-0.5 min-w-0">
                    <p className="font-medium text-[var(--text-primary)] truncate">{aposta.evento}</p>
                    <div className="flex-shrink-0">{statusBadge(aposta.status)}</div>
                  </div>
                  {aposta.competicao && (
                    <p className="text-xs text-[var(--text-muted)] truncate mb-1">{aposta.competicao}</p>
                  )}
                  <p className="text-xs text-[var(--text-secondary)] mb-1">
                    Perfil: {aposta.profile ? (aposta.profile.apelido || `${aposta.profile.nome} ${aposta.profile.sobrenome}`) : "—"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mb-3 flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {(() => {
                      const d = aposta.data_evento ? new Date(aposta.data_evento) : new Date(aposta.created_at)
                      const dateStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
                      const timeStr = aposta.data_evento ? ` às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : ""
                      return dateStr + timeStr
                    })()}
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
                                  {isGreen ? `Retorno: +${formatCurrency(leg.stake * leg.odd)}` : `Perda: -${formatCurrency(leg.stake)}`}
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
                    <div className="text-center">
                      <p className="text-xs text-[var(--text-muted)]">ROI</p>
                      <p className="text-sm font-bold text-[#a855f7]">{parseFloat(String(aposta.roi_percentual)).toFixed(2)}%</p>
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
              </div>
            ))}
          </div>
            )
          })()}
        </>
      )}

      {/* Profile picker — Sheet mobile / Dialog desktop */}
      <Sheet open={selectProfileModal} onOpenChange={setSelectProfileModal}>
        <SheetContent side="bottom" className="md:hidden rounded-t-2xl px-4 pb-8">
          <SheetHeader className="mb-4">
            <SheetTitle>Escolha o perfil</SheetTitle>
          </SheetHeader>
          <ProfilePickerContent
            profiles={profiles}
            betCountMap={betCountMap}
            onSelect={(id, name) => { setSelectedProfileId(id); setSelectedProfileName(name); setSelectProfileModal(false); setNovaModal(true) }}
            onClose={() => setSelectProfileModal(false)}
          />
        </SheetContent>
      </Sheet>
      <Dialog open={selectProfileModal} onOpenChange={setSelectProfileModal}>
        <DialogContent className="hidden md:block max-w-sm">
          <DialogHeader>
            <DialogTitle>Escolha o perfil</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <ProfilePickerContent
              profiles={profiles}
              betCountMap={betCountMap}
              onSelect={(id, name) => { setSelectedProfileId(id); setSelectedProfileName(name); setSelectProfileModal(false); setNovaModal(true) }}
              onClose={() => setSelectProfileModal(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

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
            defaultProfileId={selectedProfileId || undefined}
            profileName={selectedProfileName || undefined}
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

      {/* Finalizar — Sheet no mobile */}
      <Sheet open={!!finalizarDialog} onOpenChange={open => { if (!open) { setFinalizarDialog(null); setGreenLegId(null) } }}>
        <SheetContent side="bottom" className="md:hidden rounded-t-2xl px-5 pb-8 pt-5 space-y-5">
          <SheetTitle>Finalizar Aposta</SheetTitle>
          <p className="text-sm text-[var(--text-secondary)]">
            <strong className="text-[var(--text-primary)]">{finalizarDialog?.evento}</strong>
          </p>
          <div className="space-y-2">
            <Label>Qual casa deu green?</Label>
            <div className="space-y-2">
              {(finalizarDialog?.legs ?? []).map(leg => (
                <button
                  key={leg.id}
                  onClick={() => setGreenLegId(leg.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${
                    greenLegId === leg.id
                      ? "border-green-500 bg-green-500/10"
                      : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[#1e3a8a]/40"
                  }`}
                >
                  <div>
                    <p className={`font-semibold text-sm ${greenLegId === leg.id ? "text-green-600" : "text-[var(--text-primary)]"}`}>
                      {(leg as any).profile_bet?.bet?.nome ?? "Bet"}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">@{Number(leg.odd).toFixed(2)} · {formatCurrency(leg.stake)}</p>
                  </div>
                  {greenLegId === leg.id && <Check className="w-4 h-4 text-green-600 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setFinalizarDialog(null); setGreenLegId(null) }}>Cancelar</Button>
            <Button className="flex-1" onClick={handleFinalizar} disabled={finalizando || !greenLegId}>
              {finalizando ? "Finalizando..." : "Confirmar"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Finalizar — Dialog no desktop */}
      <Dialog open={!!finalizarDialog} onOpenChange={open => { if (!open) { setFinalizarDialog(null); setGreenLegId(null) } }}>
        <DialogContent className="hidden md:block">
          <DialogHeader>
            <DialogTitle>Finalizar Aposta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              <strong>{finalizarDialog?.evento}</strong>
            </p>
            <div className="space-y-2">
              <Label>Qual casa deu green?</Label>
              <div className="space-y-2">
                {(finalizarDialog?.legs ?? []).map(leg => (
                  <button
                    key={leg.id}
                    onClick={() => setGreenLegId(leg.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${
                      greenLegId === leg.id
                        ? "border-green-500 bg-green-500/10"
                        : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[#1e3a8a]/40"
                    }`}
                  >
                    <div>
                      <p className={`font-semibold text-sm ${greenLegId === leg.id ? "text-green-600" : "text-[var(--text-primary)]"}`}>
                        {(leg as any).profile_bet?.bet?.nome ?? "Bet"}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">@{Number(leg.odd).toFixed(2)} · {formatCurrency(leg.stake)}</p>
                    </div>
                    {greenLegId === leg.id && <Check className="w-4 h-4 text-green-600 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFinalizarDialog(null); setGreenLegId(null) }}>Cancelar</Button>
            <Button onClick={handleFinalizar} disabled={finalizando || !greenLegId}>
              {finalizando ? "Finalizando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
