"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Profile } from "@/lib/types"
import { Wallet, ArrowDownLeft, ArrowUpRight, DollarSign, SlidersHorizontal, X } from "lucide-react"

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

type Periodo = "hoje" | "semana" | "mes" | "todos"

export default function FinanceiroPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [showFilter, setShowFilter] = useState(false)

  // Filters
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setFilterProfileBets(
          (data ?? [])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((pb: any) => pb.bet?.nome)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((pb: any) => ({ id: pb.id, nome: pb.bet.nome }))
        )
      })
  }, [filterProfile])


  // Unique bets across all movimentacoes
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

      // Período
      if (filterPeriodo === "hoje") {
        if (date.toDateString() !== now.toDateString()) return false
      } else if (filterPeriodo === "semana") {
        const semanaAtras = new Date(now)
        semanaAtras.setDate(now.getDate() - 7)
        if (date < semanaAtras) return false
      } else if (filterPeriodo === "mes") {
        if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) return false
      }

      if (filterTipo !== "todos" && m.tipo !== filterTipo) return false
      if (filterProfile && m.profile_id !== filterProfile) return false
      if (filterBet) {
        // quando perfil selecionado, filterBet é profile_bet_id; senão, é bet_id
        if (filterProfile) {
          if (m.profile_bet_id !== filterBet) return false
        } else {
          if (m.profile_bet?.bet?.id !== filterBet) return false
        }
      }

      return true
    })
  }, [movimentacoes, filterPeriodo, filterTipo, filterProfile, filterBet])

  const totalDepositos = filtered.filter(m => m.tipo === "deposito").reduce((s, m) => s + m.valor, 0)
  const totalSaques = filtered.filter(m => m.tipo === "saque").reduce((s, m) => s + m.valor, 0)

  const hasActiveFilters = filterTipo !== "todos" || filterProfile !== "" || filterBet !== ""

  function clearFilters() {
    setFilterTipo("todos")
    setFilterProfile("")
    setFilterBet("")
    setFilterProfileBets([])
    setFilterPeriodo("mes")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="hidden md:flex w-9 h-9 bg-[#2563EB]/10 rounded-xl items-center justify-center flex-shrink-0">
            <Wallet className="w-5 h-5 text-[#2563EB]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Financeiro</h1>
            <p className="text-sm text-[var(--text-secondary)]">Depósitos e saques por perfil</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowFilter(v => !v)}
            className={`md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
              showFilter
                ? "bg-[#1e3a8a]/10 border-[#1e3a8a]/30 text-[var(--accent-text)]"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
            }`}
          >
            {showFilter ? <X className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
            <span className="hidden sm:inline">Filtrar</span>
          </button>
        </div>
      </div>


      {/* Filtros — sempre visível no desktop, toggle no mobile */}
      <div className={`${showFilter ? "block" : "hidden"} md:block`}>
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[var(--text-secondary)]" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">Filtros</span>
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[#DC2626] transition-colors">
                <X className="h-3 w-3" /> Limpar filtros
              </button>
            )}
          </div>

          {/* Período */}
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-2 uppercase tracking-wide font-medium">Período</p>
            <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-lg p-1 w-fit">
              {([
                { value: "hoje", label: "Hoje" },
                { value: "semana", label: "Semana" },
                { value: "mes", label: "Mês" },
                { value: "todos", label: "Todos" },
              ] as { value: Periodo; label: string }[]).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFilterPeriodo(value)}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    filterPeriodo === value
                      ? "bg-[var(--bg-surface)] text-[#1e3a8a] border border-[var(--border)] shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo + Perfil + Casa */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Tipo */}
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-2 uppercase tracking-wide font-medium">Tipo</p>
              <div className="flex gap-1">
                {([
                  { value: "todos", label: "Todos" },
                  { value: "deposito", label: "Depósito" },
                  { value: "saque", label: "Saque" },
                ] as { value: "todos" | "deposito" | "saque"; label: string }[]).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFilterTipo(value)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      filterTipo === value
                        ? value === "deposito"
                          ? "border-[#1e3a8a] bg-[#1e3a8a]/10 text-[#1e3a8a]"
                          : value === "saque"
                          ? "border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626]"
                          : "border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]"
                        : "border-[var(--border)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Perfil */}
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-2 uppercase tracking-wide font-medium">Perfil</p>
              <select
                value={filterProfile}
                onChange={e => setFilterProfile(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm"
              >
                <option value="">Todos os perfis</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.apelido || `${p.nome} ${p.sobrenome}`}</option>
                ))}
              </select>
            </div>

            {/* Bet */}
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-2 uppercase tracking-wide font-medium">Bet</p>
              <select
                value={filterBet}
                onChange={e => setFilterBet(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm"
                disabled={filterProfile !== "" && filterProfileBets.length === 0}
              >
                <option value="">Todas as casas</option>
                {(filterProfile ? filterProfileBets : allBets).map(b => (
                  <option key={b.id} value={b.id}>{b.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownLeft className="h-4 w-4 text-[#1e3a8a]" />
              <span className="text-xs text-[var(--text-secondary)]">Total Depositado</span>
            </div>
            <p className="text-lg font-bold text-[#1e3a8a]">{formatCurrency(totalDepositos)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight className="h-4 w-4 text-[#DC2626]" />
              <span className="text-xs text-[var(--text-secondary)]">Total Sacado</span>
            </div>
            <p className="text-lg font-bold text-[#DC2626]">{formatCurrency(totalSaques)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-[#2563EB]" />
              <span className="text-xs text-[var(--text-secondary)]">Saldo Líquido</span>
            </div>
            <p className="text-lg font-bold text-[#2563EB]">{formatCurrency(totalDepositos - totalSaques)}</p>
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
              {filtered.map(m => (
                <div key={m.id} className="flex items-center gap-4 p-3 rounded-xl border border-[var(--border)]">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${m.tipo === "deposito" ? "bg-[#1e3a8a]/10" : "bg-[#DC2626]/10"}`}>
                    {m.tipo === "deposito"
                      ? <ArrowDownLeft className="h-4 w-4 text-[#1e3a8a]" />
                      : <ArrowUpRight className="h-4 w-4 text-[#DC2626]" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {m.profile?.apelido || `${m.profile?.nome} ${m.profile?.sobrenome}`}
                      {m.profile_bet?.bet?.nome && (
                        <Badge variant="secondary" className="ml-2 text-xs">{m.profile_bet.bet.nome}</Badge>
                      )}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(m.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      {m.descricao && ` · ${m.descricao}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-base font-bold ${m.tipo === "deposito" ? "text-[#1e3a8a]" : "text-[#DC2626]"}`}>
                      {m.tipo === "deposito" ? "+" : "-"}{formatCurrency(Number(m.valor))}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">{m.tipo === "deposito" ? "Depósito" : "Saque"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
