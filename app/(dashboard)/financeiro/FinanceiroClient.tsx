"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { ArrowDownLeft, ArrowUpRight, Filter, DollarSign } from "lucide-react"
import type { MovimentacaoFinanceira } from "@/lib/types"

interface Props {
  movimentacoes: (MovimentacaoFinanceira & {
    profile?: { nome: string; sobrenome: string; apelido?: string | null }
    profile_bet?: { bet?: { nome: string } }
  })[]
  profiles: { id: string; nome: string; sobrenome: string; apelido?: string | null }[]
  profileBets: { id: string; profile_id: string; bet?: { nome: string } }[]
}

export default function FinanceiroClient({ movimentacoes: initial, profiles, profileBets: _profileBets }: Props) {
  const [movimentacoes] = useState(initial)
  const [filterProfile, setFilterProfile] = useState("todos")
  const [filterTipo, setFilterTipo] = useState("todos")

  const filtered = movimentacoes.filter(m => {
    if (filterProfile !== "todos" && m.profile_id !== filterProfile) return false
    if (filterTipo !== "todos" && m.tipo !== filterTipo) return false
    return true
  })

  const totalDepositos = filtered.filter(m => m.tipo === "deposito").reduce((s, m) => s + m.valor, 0)
  const totalSaques = filtered.filter(m => m.tipo === "saque").reduce((s, m) => s + m.valor, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Financeiro</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Controle de depósitos e saques</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
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

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
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
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${mov.tipo === "deposito" ? "bg-[#1e3a8a]/10" : "bg-[#DC2626]/10"}`}>
                    {mov.tipo === "deposito"
                      ? <ArrowDownLeft className="h-4 w-4 text-[#1e3a8a]" />
                      : <ArrowUpRight className="h-4 w-4 text-[#DC2626]" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[var(--text-primary)] text-sm">
                        {mov.tipo === "deposito" ? "Depósito" : "Saque"}
                      </p>
                      {mov.profile_bet?.bet && (
                        <Badge variant="secondary">{mov.profile_bet.bet.nome}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {mov.profile ? (mov.profile.apelido || `${mov.profile.nome} ${mov.profile.sobrenome}`) : "—"}
                      {mov.descricao && ` · ${mov.descricao}`}
                      {" · "}{new Date(mov.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <p className={`font-bold text-base flex-shrink-0 ${mov.tipo === "deposito" ? "text-[#1e3a8a]" : "text-[#DC2626]"}`}>
                    {mov.tipo === "deposito" ? "+" : "-"}{formatCurrency(mov.valor)}
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
