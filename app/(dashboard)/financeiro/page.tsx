"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Profile } from "@/lib/types"
import { Wallet, ArrowDownLeft, ArrowUpRight, DollarSign, X } from "lucide-react"

type Movimentacao = {
  id: string
  profile_id: string
  profile_bet_id?: string | null
  tipo: "deposito" | "saque"
  valor: number
  descricao?: string | null
  created_at: string
  profile?: { nome: string; sobrenome: string; apelido?: string | null }
  profile_bet?: { id: string; bet?: { id: string; nome: string } }
}

type Periodo = "hoje" | "semana" | "mes" | "ano" | "todos"

export default function FinanceiroPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])

  const [filterPeriodo, setFilterPeriodo] = useState<Periodo>("mes")
  const [filterTipo, setFilterTipo] = useState<"todos" | "deposito" | "saque">("todos")
  const [filterProfile, setFilterProfile] = useState("")
  const [filterBet, setFilterBet] = useState("")
  const [filterProfileBets, setFilterProfileBets] = useState<{ id: string; nome: string }[]>([])

  async function load() {
    const supabase = createClient()
    const [{ data: profs }, { data: movs }] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase
        .from("movimentacoes_financeiras")
        .select("*, profile:profiles(nome, sobrenome, apelido), profile_bet:profile_bets(id, bet:bets(id, nome))")
        .order("created_at", { ascending: false })
        .limit(500),
    ])
    setProfiles(profs ?? [])
    setMovimentacoes((movs ?? []) as Movimentacao[])
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    setFilterBet("")
    if (!filterProfile) { setFilterProfileBets([]); return }
    const supabase = createClient()
    supabase
      .from("profile_bets")
      .select("id, bet:bets(id, nome)")
      .eq("profile_id", filterProfile)
      .then(({ data }) => {
        setFilterProfileBets(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data ?? []).filter((pb: any) => pb.bet?.nome).map((pb: any) => ({ id: pb.id, nome: pb.bet.nome }))
        )
      })
  }, [filterProfile])

  const allBets = useMemo(() => {
    const map = new Map<string, string>()
    movimentacoes.forEach(m => {
      if (m.profile_bet?.bet?.id) map.set(m.profile_bet.bet.id, m.profile_bet.bet.nome)
    })
    return Array.from(map.entries()).map(([id, nome]) => ({ id, nome }))
  }, [movimentacoes])

  const filtered = useMemo(() => {
    const now = new Date()
    return movimentacoes.filter(m => {
      const date = new Date(m.created_at)
      if (filterPeriodo === "hoje") {
        if (date.toDateString() !== now.toDateString()) return false
      } else if (filterPeriodo === "semana") {
        const semanaAtras = new Date(now); semanaAtras.setDate(now.getDate() - 7)
        if (date < semanaAtras) return false
      } else if (filterPeriodo === "mes") {
        if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) return false
      } else if (filterPeriodo === "ano") {
        if (date.getFullYear() !== now.getFullYear()) return false
      }
      if (filterTipo !== "todos" && m.tipo !== filterTipo) return false
      if (filterProfile && m.profile_id !== filterProfile) return false
      if (filterBet) {
        if (filterProfile) { if (m.profile_bet_id !== filterBet) return false }
        else { if (m.profile_bet?.bet?.id !== filterBet) return false }
      }
      return true
    })
  }, [movimentacoes, filterPeriodo, filterTipo, filterProfile, filterBet])

  const totalDepositos = filtered.filter(m => m.tipo === "deposito").reduce((s, m) => s + m.valor, 0)
  const totalSaques    = filtered.filter(m => m.tipo === "saque").reduce((s, m) => s + m.valor, 0)
  const hasActiveFilters = filterTipo !== "todos" || filterProfile !== "" || filterBet !== ""

  function clearFilters() {
    setFilterTipo("todos"); setFilterProfile(""); setFilterBet("")
    setFilterProfileBets([]); setFilterPeriodo("mes")
  }

  const periodos: { value: Periodo; label: string }[] = [
    { value: "hoje",   label: "Dia" },
    { value: "semana", label: "Semana" },
    { value: "mes",    label: "Mês" },
    { value: "ano",    label: "Ano" },
    { value: "todos",  label: "Todos" },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex w-9 h-9 bg-[#2563EB]/10 rounded-xl items-center justify-center flex-shrink-0">
          <Wallet className="w-5 h-5 text-[#2563EB]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Financeiro</h1>
          <p className="text-sm text-[var(--text-secondary)]">Depósitos e saques por perfil</p>
        </div>
      </div>

      {/* Filtros — sempre visíveis */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Período</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[#DC2626] transition-colors">
                <X className="h-3 w-3" /> Limpar
              </button>
            )}
          </div>

          {/* Período */}
          <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-lg p-1">
            {periodos.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilterPeriodo(value)}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filterPeriodo === value
                    ? "bg-[var(--bg-surface)] text-[var(--accent-text)] border border-[var(--border)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tipo */}
          <div className="flex gap-1">
            {([
              { value: "todos",   label: "Todos" },
              { value: "deposito", label: "Depósito" },
              { value: "saque",   label: "Saque" },
            ] as { value: "todos" | "deposito" | "saque"; label: string }[]).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilterTipo(value)}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  filterTipo === value
                    ? value === "deposito" ? "border-[#1e3a8a] bg-[#1e3a8a]/10 text-[var(--accent-text)]"
                    : value === "saque"    ? "border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626]"
                    :                       "border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]"
                    : "border-[var(--border)] text-[var(--text-secondary)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Perfil + Bet */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1 font-medium">Perfil</p>
              <select
                value={filterProfile}
                onChange={e => setFilterProfile(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm"
              >
                <option value="">Todos</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.apelido || `${p.nome} ${p.sobrenome}`}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1 font-medium">Bet</p>
              <select
                value={filterBet}
                onChange={e => setFilterBet(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm"
                disabled={filterProfile !== "" && filterProfileBets.length === 0}
              >
                <option value="">Todas</option>
                {(filterProfile ? filterProfileBets : allBets).map(b => (
                  <option key={b.id} value={b.id}>{b.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowDownLeft className="h-3.5 w-3.5 text-[var(--accent-text)]" />
              <span className="text-xs text-[var(--text-secondary)]">Depósitos</span>
            </div>
            <p className="text-sm font-bold text-[var(--accent-text)]">{formatCurrency(totalDepositos)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowUpRight className="h-3.5 w-3.5 text-[#DC2626]" />
              <span className="text-xs text-[var(--text-secondary)]">Saques</span>
            </div>
            <p className="text-sm font-bold text-[#DC2626]">{formatCurrency(totalSaques)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-[#2563EB]" />
              <span className="text-xs text-[var(--text-secondary)]">Líquido</span>
            </div>
            <p className="text-sm font-bold text-[#2563EB]">{formatCurrency(totalDepositos - totalSaques)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista */}
      <Card>
        <CardContent className="pt-4">
          {filtered.length === 0 ? (
            <p className="text-center text-[var(--text-muted)] py-8 text-sm">Nenhuma movimentação encontrada.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map(m => {
                const betNome    = m.profile_bet?.bet?.nome
                const perfilNome = m.profile?.apelido || `${m.profile?.nome ?? ""} ${m.profile?.sobrenome ?? ""}`.trim()
                const data       = new Date(m.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
                return (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)]">
                    {/* Ícone */}
                    <div className={`p-2 rounded-lg flex-shrink-0 ${m.tipo === "deposito" ? "bg-[#1e3a8a]/10" : "bg-[#DC2626]/10"}`}>
                      {m.tipo === "deposito"
                        ? <ArrowDownLeft className="h-4 w-4 text-[var(--accent-text)]" />
                        : <ArrowUpRight  className="h-4 w-4 text-[#DC2626]" />
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {/* Bet */}
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {betNome ?? "—"}
                      </p>
                      {/* Perfil + data */}
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {perfilNome} · {data}
                      </p>
                      {m.descricao && (
                        <p className="text-xs text-[var(--text-muted)] truncate">{m.descricao}</p>
                      )}
                    </div>

                    {/* Valor */}
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${m.tipo === "deposito" ? "text-[var(--accent-text)]" : "text-[#DC2626]"}`}>
                        {m.tipo === "deposito" ? "+" : "-"}{formatCurrency(Number(m.valor))}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">{m.tipo === "deposito" ? "Depósito" : "Saque"}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {filtered.length > 0 && (
            <p className="text-xs text-[var(--text-muted)] text-center pt-3">
              {filtered.length} movimentaç{filtered.length !== 1 ? "ões" : "ão"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
