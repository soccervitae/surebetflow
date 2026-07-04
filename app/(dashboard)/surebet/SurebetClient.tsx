"use client"

import { useState, useMemo } from "react"
import { useRealtimeSurebets } from "@/hooks/useRealtimeSurebets"
import type { SurebetRow } from "@/lib/types/surebet"
import SurebetRowComponent from "@/components/surebet/SurebetRow"
import SurebetFilters, { defaultFilters, type SurebetFiltersState } from "@/components/surebet/SurebetFilters"
import EmptyState from "@/components/surebet/EmptyState"
import { Badge } from "@/components/ui/badge"
import { Activity } from "lucide-react"

interface Props {
  initialData: SurebetRow[]
}

export default function SurebetClient({ initialData }: Props) {
  const { surebets, newIds } = useRealtimeSurebets(initialData)
  const [filters, setFilters] = useState<SurebetFiltersState>(defaultFilters)

  const allSports = useMemo(() => Array.from(new Set(surebets.map(s => s.sport))).sort(), [surebets])
  const allBookmakers = useMemo(() => {
    const names = surebets.flatMap(s => [s.leg_a.bookmaker_name, s.leg_b.bookmaker_name])
    return Array.from(new Set(names)).sort()
  }, [surebets])

  const filtered = useMemo(() => {
    let list = surebets.slice()

    const minP = filters.profitMin !== "" ? parseFloat(filters.profitMin) : null
    const maxP = filters.profitMax !== "" ? parseFloat(filters.profitMax) : null
    if (minP !== null) list = list.filter(s => Number(s.profit_pct) >= minP)
    if (maxP !== null) list = list.filter(s => Number(s.profit_pct) <= maxP)
    if (filters.sports.length > 0) list = list.filter(s => filters.sports.includes(s.sport))
    if (filters.bookmakers.length > 0) {
      list = list.filter(s =>
        filters.bookmakers.includes(s.leg_a.bookmaker_name) ||
        filters.bookmakers.includes(s.leg_b.bookmaker_name)
      )
    }

    list.sort((a, b) => {
      if (filters.sort === "profit") return Number(b.profit_pct) - Number(a.profit_pct)
      if (filters.sort === "starts_at") return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      return new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()
    })

    return list
  }, [surebets, filters])

  const hasFilters =
    filters.profitMin !== "" ||
    filters.profitMax !== "" ||
    filters.sports.length > 0 ||
    filters.bookmakers.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Surebets</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Oportunidades de arbitragem detectadas em tempo real</p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Activity className="w-4 h-4 text-green-500 animate-pulse" />
          <Badge variant="default" className="text-xs font-mono">
            {filtered.length} ativa{filtered.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <SurebetFilters
        filters={filters}
        onChange={setFilters}
        allSports={allSports}
        allBookmakers={allBookmakers}
      />

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState filtered={hasFilters} />
      ) : (
        <div className="space-y-3">
          {filtered.map(s => (
            <SurebetRowComponent
              key={s.id}
              surebet={s}
              isNew={newIds.has(s.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
