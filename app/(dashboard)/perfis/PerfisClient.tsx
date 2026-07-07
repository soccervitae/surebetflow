"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, SlidersHorizontal, X } from "lucide-react"

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0)
}

type FilterStatus = "todos" | "ativo" | "inativo"
type SortBy = "default" | "lucro" | "roi"

interface ProfileDashboard {
  profile_id: string
  user_id: string
  nome: string
  sobrenome: string
  apelido: string | null
  foto_url: string | null
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

  const [showFilter, setShowFilter] = useState(false)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("todos")
  const [sortBy, setSortBy] = useState<SortBy>("default")

  const atLimit = profiles.length >= planLimit
  const hasActiveFilters = filterStatus !== "todos" || sortBy !== "default"

  const displayed = useMemo(() => {
    let list = [...profiles]
    if (sortBy === "lucro") list.sort((a, b) => b.lucro_realizado - a.lucro_realizado)
    if (sortBy === "roi") list.sort((a, b) => b.roi_percentual - a.roi_percentual)
    return list
  }, [profiles, filterStatus, sortBy])

  function clearFilters() {
    setFilterStatus("todos")
    setSortBy("default")
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Perfis</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Gerencie seus perfis de apostador</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filtrar */}
          <button
            onClick={() => setShowFilter(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors flex-shrink-0 ${
              showFilter || hasActiveFilters
                ? "bg-[#1e3a8a]/10 border-[#1e3a8a]/30 text-[var(--accent-text)]"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
            }`}
          >
            {showFilter ? <X className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
            Filtrar{hasActiveFilters && !showFilter ? " •" : ""}
          </button>
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

      {/* Filtros */}
      {showFilter && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide flex-shrink-0">Ordenar</p>
              {([
                { value: "default", label: "Padrão" },
                { value: "lucro",   label: "Maior Lucro" },
                { value: "roi",     label: "Maior ROI" },
              ] as { value: SortBy; label: string }[]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    sortBy === opt.value
                      ? "bg-[#1e3a8a]/10 border-[#1e3a8a]/30 text-[var(--accent-text)]"
                      : "border-[var(--border)] text-[var(--text-secondary)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}

              {hasActiveFilters && (
                <button onClick={clearFilters} className="ml-auto text-xs text-[var(--accent-text)] font-medium">
                  Limpar
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {displayed.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <User className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-[var(--text-secondary)]">
              {hasActiveFilters ? "Nenhum perfil encontrado com os filtros aplicados" : "Nenhum perfil cadastrado"}
            </p>
            {!hasActiveFilters && (
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
