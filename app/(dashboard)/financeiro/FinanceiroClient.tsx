"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { ArrowDownLeft, ArrowUpRight, DollarSign } from "lucide-react"
import type { MovimentacaoFinanceira } from "@/lib/types"
import MovimentacaoRow, { fmtGroupDate } from "@/components/MovimentacaoRow"
import type { MovimentacaoItem } from "@/components/MovimentacaoRow"

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
              <ArrowDownLeft className="h-4 w-4 text-[var(--accent-text)]" />
              <span className="text-xs text-[var(--text-secondary)]">Total Depositado</span>
            </div>
            <p className="text-lg font-bold text-[var(--accent-text)]">{formatCurrency(totalDepositos)}</p>
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

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-[var(--text-secondary)]">
            Nenhuma movimentação encontrada
          </CardContent>
        </Card>
      ) : (() => {
        const items: MovimentacaoItem[] = filtered.map(mov => ({
          id: mov.id,
          created_at: mov.created_at,
          tipo: mov.tipo,
          valor: mov.valor,
          betNome: (mov as any).profile_bet?.bet?.nome ?? null,
          descricao: mov.descricao,
          profileNome: (mov as any).profile
            ? ((mov as any).profile.apelido || `${(mov as any).profile.nome} ${(mov as any).profile.sobrenome}`)
            : null,
        }))
        const groupMap = new Map<string, MovimentacaoItem[]>()
        for (const item of items) {
          const key = item.created_at.slice(0, 10)
          if (!groupMap.has(key)) groupMap.set(key, [])
          groupMap.get(key)!.push(item)
        }
        const groups = Array.from(groupMap.entries()).sort((a, b) => b[0].localeCompare(a[0]))
        return (
          <div className="space-y-4">
            {groups.map(([dateKey, groupItems]) => (
              <div key={dateKey}>
                <p className="text-xs font-semibold text-[var(--text-muted)] px-1 mb-2">{fmtGroupDate(dateKey)}</p>
                <Card>
                  <CardContent className="p-0 divide-y divide-[var(--border)]">
                    {groupItems.map(item => (
                      <MovimentacaoRow key={item.id} item={item} />
                    ))}
                  </CardContent>
                </Card>
              </div>
            ))}
            <p className="text-xs text-[var(--text-muted)] text-center pb-2">
              {items.length} movimentaç{items.length !== 1 ? "ões" : "ão"}
            </p>
          </div>
        )
      })()}
    </div>
  )
}
