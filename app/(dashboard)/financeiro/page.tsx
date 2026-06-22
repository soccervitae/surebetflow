"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Profile, ProfileBet, Bet } from "@/lib/types"
import { Plus, Wallet, ArrowDownLeft, ArrowUpRight, DollarSign, SlidersHorizontal, X } from "lucide-react"

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
  const [profileBets, setProfileBets] = useState<(ProfileBet & { bet: Bet })[]>([])
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [showForm, setShowForm] = useState(false)

  // Filters
  const [filterPeriodo, setFilterPeriodo] = useState<Periodo>("mes")
  const [filterTipo, setFilterTipo] = useState<"todos" | "deposito" | "saque">("todos")
  const [filterProfile, setFilterProfile] = useState("")
  const [filterBet, setFilterBet] = useState("")

  // Form
  const [formProfile, setFormProfile] = useState("")
  const [formBet, setFormBet] = useState("")
  const [formTipo, setFormTipo] = useState<"deposito" | "saque">("deposito")
  const [formValor, setFormValor] = useState("")
  const [formDescricao, setFormDescricao] = useState("")
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

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
    if (!formProfile) { setProfileBets([]); setFormBet(""); return }
    const supabase = createClient()
    supabase.from("profile_bets").select("*, bet:bets(*)").eq("profile_id", formProfile).then(({ data }) => {
      setProfileBets((data ?? []) as (ProfileBet & { bet: Bet })[])
    })
  }, [formProfile])

  function formatBRL(raw: string) {
    const digits = raw.replace(/\D/g, "")
    if (!digits) return ""
    const num = parseInt(digits, 10) / 100
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function parseBRL(formatted: string) {
    return parseFloat(formatted.replace(/\./g, "").replace(",", ".")) || 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError("")
    const val = parseBRL(formValor)
    if (isNaN(val) || val <= 0) { setFormError("Informe um valor válido."); return }
    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase.from("movimentacoes_financeiras").insert({
      profile_id: formProfile,
      profile_bet_id: formBet || null,
      tipo: formTipo,
      valor: val,
      descricao: formDescricao.trim() || null,
    })

    if (error) { setFormError("Erro ao registrar movimentação."); setSaving(false); return }

    if (formBet) {
      const { data: pb } = await supabase.from("profile_bets").select("saldo").eq("id", formBet).single()
      if (pb) {
        const newSaldo = formTipo === "deposito" ? Number(pb.saldo) + val : Number(pb.saldo) - val
        await supabase.from("profile_bets").update({ saldo: newSaldo }).eq("id", formBet)
      }
    }

    setShowForm(false)
    setFormProfile(""); setFormBet(""); setFormValor(""); setFormDescricao("")
    load()
    setSaving(false)
  }

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
      if (filterBet && m.profile_bet?.bet?.id !== filterBet) return false

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
    setFilterPeriodo("mes")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#2563EB]/10 rounded-xl flex items-center justify-center">
            <Wallet className="w-5 h-5 text-[#2563EB]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Financeiro</h1>
            <p className="text-sm text-[var(--text-secondary)]">Depósitos e saques por perfil</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-[#16A34A] hover:bg-[#15803D] text-white gap-2">
          <Plus className="w-4 h-4" /> Nova Movimentação
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Registrar Movimentação</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Perfil *</Label>
                  <select
                    className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm"
                    value={formProfile} onChange={e => setFormProfile(e.target.value)} required
                  >
                    <option value="">Selecione</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.apelido || `${p.nome} ${p.sobrenome}`}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Casa de Apostas (opcional)</Label>
                  <select
                    className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm"
                    value={formBet} onChange={e => setFormBet(e.target.value)}
                  >
                    <option value="">Nenhuma</option>
                    {profileBets.map(pb => <option key={pb.id} value={pb.id}>{pb.bet?.nome}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <div className="flex gap-2">
                    {(["deposito", "saque"] as const).map(t => (
                      <button key={t} type="button" onClick={() => setFormTipo(t)}
                        className={`flex-1 h-10 rounded-xl border text-sm font-medium transition-colors ${formTipo === t ? "border-[#16A34A] bg-[#16A34A]/10 text-[#16A34A]" : "border-[var(--border)] text-[var(--text-secondary)]"}`}>
                        {t === "deposito" ? "Depósito" : "Saque"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Valor (R$) *</Label>
                  <Input type="text" inputMode="numeric" value={formValor} onChange={e => setFormValor(formatBRL(e.target.value))} placeholder="0,00" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Input value={formDescricao} onChange={e => setFormDescricao(e.target.value)} placeholder="Ex: Depósito inicial via PIX" />
              </div>
              {formError && <p className="text-sm text-[#DC2626] bg-[#DC2626]/5 border border-[#DC2626]/20 rounded-lg px-3 py-2">{formError}</p>}
              <div className="flex gap-2">
                <Button type="submit" className="bg-[#16A34A] hover:bg-[#15803D] text-white" disabled={saving}>
                  {saving ? "Salvando..." : "Registrar"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
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
                      ? "bg-[var(--bg-surface)] text-[#16A34A] border border-[var(--border)] shadow-sm"
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
                          ? "border-[#16A34A] bg-[#16A34A]/10 text-[#16A34A]"
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

            {/* Casa de apostas */}
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-2 uppercase tracking-wide font-medium">Casa de Apostas</p>
              <select
                value={filterBet}
                onChange={e => setFilterBet(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm"
              >
                <option value="">Todas as casas</option>
                {allBets.map(b => (
                  <option key={b.id} value={b.id}>{b.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownLeft className="h-4 w-4 text-[#16A34A]" />
              <span className="text-xs text-[var(--text-secondary)]">Total Depositado</span>
            </div>
            <p className="text-lg font-bold text-[#16A34A]">{formatCurrency(totalDepositos)}</p>
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
                  <div className={`p-2 rounded-lg flex-shrink-0 ${m.tipo === "deposito" ? "bg-[#16A34A]/10" : "bg-[#DC2626]/10"}`}>
                    {m.tipo === "deposito"
                      ? <ArrowDownLeft className="h-4 w-4 text-[#16A34A]" />
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
                    <p className={`text-base font-bold ${m.tipo === "deposito" ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
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
