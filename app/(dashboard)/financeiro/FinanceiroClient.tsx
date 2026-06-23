"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/useToast"
import { ArrowDownLeft, ArrowUpRight, Plus, Filter, DollarSign, X, ArrowDownCircle, ArrowUpCircle } from "lucide-react"
import type { MovimentacaoFinanceira } from "@/lib/types"

interface Props {
  movimentacoes: (MovimentacaoFinanceira & {
    profile?: { nome: string; sobrenome: string; apelido?: string | null }
    profile_bet?: { bet?: { nome: string } }
  })[]
  profiles: { id: string; nome: string; sobrenome: string; apelido?: string | null }[]
  profileBets: { id: string; profile_id: string; bet?: { nome: string } }[]
}

export default function FinanceiroClient({ movimentacoes: initial, profiles, profileBets }: Props) {
  const [movimentacoes, setMovimentacoes] = useState(initial)
  const [filterProfile, setFilterProfile] = useState("todos")
  const [filterTipo, setFilterTipo] = useState("todos")
  const [showForm, setShowForm] = useState(false)
  const [showFilter, setShowFilter] = useState(false)

  // Form state
  const [formProfile, setFormProfile] = useState("")
  const [formProfileBet, setFormProfileBet] = useState("")
  const [formTipo, setFormTipo] = useState<"deposito" | "saque">("deposito")
  const [formValor, setFormValor] = useState("")
  const [formDescricao, setFormDescricao] = useState("")
  const [saving, setSaving] = useState(false)

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

  const filteredProfileBets = formProfile
    ? profileBets.filter(pb => pb.profile_id === formProfile)
    : []

  const filtered = movimentacoes.filter(m => {
    if (filterProfile !== "todos" && m.profile_id !== filterProfile) return false
    if (filterTipo !== "todos" && m.tipo !== filterTipo) return false
    return true
  })

  const totalDepositos = filtered.filter(m => m.tipo === "deposito").reduce((s, m) => s + m.valor, 0)
  const totalSaques = filtered.filter(m => m.tipo === "saque").reduce((s, m) => s + m.valor, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formProfile || !formValor) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" })
      return
    }
    const valor = parseBRL(formValor)
    if (isNaN(valor) || valor <= 0) {
      toast({ title: "Valor inválido", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const { data: mov, error } = await supabase
        .from("movimentacoes_financeiras")
        .insert({
          profile_id: formProfile,
          profile_bet_id: formProfileBet || null,
          tipo: formTipo,
          valor,
          descricao: formDescricao || null,
        })
        .select("*, profile:profiles(nome, sobrenome, apelido), profile_bet:profile_bets(*, bet:bets(nome))")
        .single()

      if (error) throw error

      // Update profile_bet saldo if profile_bet selected
      if (formProfileBet) {
        const pb = profileBets.find(pb => pb.id === formProfileBet)
        if (pb) {
          const { data: currentPb } = await supabase.from("profile_bets").select("saldo").eq("id", formProfileBet).single()
          if (currentPb) {
            const newSaldo = formTipo === "deposito"
              ? currentPb.saldo + valor
              : currentPb.saldo - valor
            await supabase.from("profile_bets").update({ saldo: newSaldo }).eq("id", formProfileBet)
          }
        }
      }

      setMovimentacoes(prev => [mov, ...prev])
      toast({ title: "Movimentação registrada com sucesso!" })
      setShowForm(false)
      setFormProfile("")
      setFormProfileBet("")
      setFormValor("")
      setFormDescricao("")
    } catch (err: unknown) {
      toast({ title: (err as Error)?.message ?? "Erro ao registrar movimentação", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Financeiro</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Controle de depósitos e saques</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilter(v => !v)}
            className={`md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
              showFilter
                ? "bg-[#1e3a8a]/10 border-[#1e3a8a]/30 text-[var(--accent-text)]"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
            }`}
          >
            {showFilter ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
            Filtrar
          </button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nova Movimentação</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </div>
      </div>

      {/* Summary */}
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

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nova Movimentação</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Perfil *</Label>
                  <Select value={formProfile} onValueChange={v => { setFormProfile(v); setFormProfileBet("") }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar perfil..." />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.apelido || `${p.nome} ${p.sobrenome}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select value={formTipo} onValueChange={(v: "deposito" | "saque") => setFormTipo(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deposito">Depósito</SelectItem>
                      <SelectItem value="saque">Saque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formProfile && filteredProfileBets.length > 0 && (
                <div className="space-y-2">
                  <Label>Bet (opcional)</Label>
                  <Select value={formProfileBet} onValueChange={setFormProfileBet}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar casa (opcional)..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredProfileBets.map(pb => (
                        <SelectItem key={pb.id} value={pb.id}>
                          {pb.bet?.nome ?? "Casa"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor (R$) *</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formValor}
                    onChange={e => setFormValor(formatBRL(e.target.value))}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Input value={formDescricao} onChange={e => setFormDescricao(e.target.value)} placeholder="Ex: Depósito inicial" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? "Salvando..." : "Registrar"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters — always visible on desktop, toggle on mobile */}
      <div className={`${showFilter ? "block" : "hidden"} md:block`}>
        <Card>
          <CardContent className="p-4">
            <div className="hidden md:flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-[var(--text-secondary)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">Filtros</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="deposito">Depósitos</SelectItem>
                  <SelectItem value="saque">Saques</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-[var(--text-secondary)]">
            Nenhuma movimentação encontrada
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(mov => (
            <Card key={mov.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${mov.tipo === "deposito" ? "bg-[#1e3a8a]/10" : "bg-[#DC2626]/10"}`}>
                    {mov.tipo === "deposito"
                      ? <ArrowDownCircle className="h-4 w-4 text-[var(--accent-text)]" />
                      : <ArrowUpCircle className="h-4 w-4 text-[#DC2626]" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    {mov.profile_bet?.bet?.nome && (
                      <p className="text-xs font-semibold text-[var(--accent-text)] mb-0.5">
                        {mov.profile_bet.bet.nome}
                      </p>
                    )}
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {mov.tipo === "deposito" ? "Depósito" : "Saque"}
                    </p>
                    {mov.profile && (
                      <p className="text-xs text-[var(--text-secondary)]">
                        {mov.profile.apelido || `${mov.profile.nome} ${mov.profile.sobrenome}`}
                      </p>
                    )}
                    {mov.descricao && (
                      <p className="text-xs text-[var(--text-muted)] truncate">{mov.descricao}</p>
                    )}
                    <p className="text-xs text-[var(--text-secondary)]">
                      {new Date(mov.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <p className={`font-bold text-sm flex-shrink-0 ${mov.tipo === "deposito" ? "text-[var(--accent-text)]" : "text-[#DC2626]"}`}>
                    {mov.tipo === "saque" ? "-" : "+"}{formatCurrency(mov.valor)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
