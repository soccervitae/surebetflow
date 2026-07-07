"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "lucide-react"

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0)
}

type FilterStatus = "todos" | "ativo" | "inativo"
type SortBy = "default" | "saldo_desc" | "saldo_asc" | "lucro_desc" | "lucro_asc" | "roi_desc" | "roi_asc"

interface ProfileDashboard {
  profile_id: string
  user_id: string
  nome: string
  sobrenome: string
  apelido: string | null
  foto_url: string | null
  ativo: boolean
  saldo_total: number
  lucro_realizado: number
  lucro_pendente: number
  total_investido: number
  total_apostas: number
  apostas_finalizadas: number
  roi_percentual: number
  bonus_total: number
}

interface Props {
  profiles: ProfileDashboard[]
  userId: string
  planLimit: number
}

export default function PerfisClient({ profiles: initialProfiles, planLimit }: Props) {
  const [profiles] = useState(initialProfiles)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("todos")
  const [sortBy, setSortBy] = useState<SortBy>("default")

  const atLimit = profiles.length >= planLimit

  const displayed = useMemo(() => {
    let list = [...profiles]
    if (filterStatus === "ativo") list = list.filter(p => p.ativo)
    if (filterStatus === "inativo") list = list.filter(p => !p.ativo)
    if (sortBy === "saldo_desc") list.sort((a, b) => b.saldo_total - a.saldo_total)
    if (sortBy === "saldo_asc") list.sort((a, b) => a.saldo_total - b.saldo_total)
    if (sortBy === "lucro_desc") list.sort((a, b) => b.lucro_realizado - a.lucro_realizado)
    if (sortBy === "lucro_asc") list.sort((a, b) => a.lucro_realizado - b.lucro_realizado)
    if (sortBy === "roi_desc") list.sort((a, b) => b.roi_percentual - a.roi_percentual)
    if (sortBy === "roi_asc") list.sort((a, b) => a.roi_percentual - b.roi_percentual)
    return list
  }, [profiles, filterStatus, sortBy])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Perfis</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Gerencie seus perfis de apostador</p>
        </div>
      </div>

      {atLimit && (
        <p className="text-xs text-amber-600 sm:text-right">
          Limite do plano atingido ({profiles.length}/{planLimit} perfis).{" "}
          <Link href="/assinatura" className="underline font-medium hover:text-amber-700">
            Faça upgrade para Trader Pro.
          </Link>
        </p>
      )}

      {/* Fixed filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["todos", "ativo", "inativo"] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              filterStatus === s
                ? s === "ativo" ? "bg-green-500/10 border-green-500/40 text-green-600"
                  : s === "inativo" ? "bg-red-500/10 border-red-500/40 text-red-500"
                  : "bg-[#1e3a8a] border-[#1e3a8a] text-white"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
            }`}
          >
            {{ todos: "Todos", ativo: "Ativos", inativo: "Inativos" }[s]}
          </button>
        ))}

        <div className="w-px h-4 bg-[var(--border)]" />

        {([
          { value: "saldo_desc", label: "Maior saldo" },
          { value: "saldo_asc",  label: "Menor saldo" },
          { value: "lucro_desc", label: "Maior lucro" },
          { value: "lucro_asc",  label: "Menor lucro" },
          { value: "roi_desc",   label: "Maior ROI" },
          { value: "roi_asc",    label: "Menor ROI" },
        ] as { value: SortBy; label: string }[]).map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setSortBy(value)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              sortBy === value
                ? "bg-[#1e3a8a]/10 border-[#1e3a8a]/30 text-[var(--accent-text)]"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <User className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-[var(--text-secondary)]">
              {filterStatus !== "todos" ? "Nenhum perfil encontrado com os filtros aplicados" : "Nenhum perfil cadastrado"}
            </p>
            {filterStatus === "todos" && (
              <p className="text-xs text-[var(--text-muted)] mt-2">Use o botão (+) para criar seu primeiro perfil.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayed.map(p => (
            <Link
              key={p.profile_id}
              href={`/perfis/${p.profile_id}`}
              className="flex flex-col gap-3 p-4 rounded-xl border border-[var(--border-subtle)] hover:border-[#1e3a8a]/40 hover:bg-[#1e3a8a]/5 transition-all"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  {p.foto_url && <AvatarImage src={p.foto_url} alt={p.apelido ?? p.nome} />}
                  <AvatarFallback className="bg-[#1e3a8a]/20 text-[var(--accent-text)] text-sm font-bold">
                    {p.nome.charAt(0)}{p.sobrenome.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{p.apelido ?? `${p.nome} ${p.sobrenome}`}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{p.total_apostas} aposta{p.total_apostas !== 1 ? "s" : ""}</p>
                </div>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${p.ativo ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-400"}`}>
                  {p.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-subtle)] w-full">
                <div className="flex flex-col items-center text-center">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Saldo</p>
                  <p className="text-xs font-bold text-[#3b82f6] truncate">{formatCurrency(p.saldo_total)}</p>
                </div>
                <div className="flex flex-col items-center text-center border-x border-[var(--border-subtle)]">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Lucro</p>
                  <p className={`text-xs font-bold truncate ${p.lucro_realizado >= 0 ? "text-green-500" : "text-red-500"}`}>{formatCurrency(p.lucro_realizado)}</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">ROI</p>
                  <p className={`text-xs font-bold truncate ${p.roi_percentual >= 0 ? "text-[#a855f7]" : "text-red-500"}`}>{parseFloat(String(p.roi_percentual)).toFixed(1)}%</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
