"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

export interface SurebetFiltersState {
  profitMin: string
  profitMax: string
  sports: string[]
  bookmakers: string[]
  sort: "profit" | "starts_at" | "detected_at"
}

export const defaultFilters: SurebetFiltersState = {
  profitMin: "",
  profitMax: "",
  sports: [],
  bookmakers: [],
  sort: "profit",
}

interface Props {
  filters: SurebetFiltersState
  onChange: (f: SurebetFiltersState) => void
  allSports: string[]
  allBookmakers: string[]
}

function Toggle({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
        active
          ? "bg-[#1e3a8a] border-[#1e3a8a] text-white"
          : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[#1e3a8a]/60"
      }`}
    >
      {label}
    </button>
  )
}

function toggleArr(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]
}

export default function SurebetFilters({ filters, onChange, allSports, allBookmakers }: Props) {
  const isDirty =
    filters.profitMin !== "" ||
    filters.profitMax !== "" ||
    filters.sports.length > 0 ||
    filters.bookmakers.length > 0 ||
    filters.sort !== "profit"

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[var(--text-primary)]">Filtros & Ordenação</span>
        {isDirty && (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => onChange(defaultFilters)}>
            <X className="w-3 h-3" /> Resetar
          </Button>
        )}
      </div>

      {/* Profit range */}
      <div>
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">Profit%</p>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Mín"
            type="number"
            step="0.1"
            min="0"
            value={filters.profitMin}
            onChange={e => onChange({ ...filters, profitMin: e.target.value })}
            className="h-8 text-xs w-24"
          />
          <span className="text-[var(--text-muted)] text-xs">—</span>
          <Input
            placeholder="Máx"
            type="number"
            step="0.1"
            min="0"
            value={filters.profitMax}
            onChange={e => onChange({ ...filters, profitMax: e.target.value })}
            className="h-8 text-xs w-24"
          />
        </div>
      </div>

      {/* Sports */}
      {allSports.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">Esporte</p>
          <div className="flex flex-wrap gap-1.5">
            {allSports.map(s => (
              <Toggle
                key={s}
                label={s}
                active={filters.sports.includes(s)}
                onClick={() => onChange({ ...filters, sports: toggleArr(filters.sports, s) })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bookmakers */}
      {allBookmakers.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">Casas de Aposta</p>
          <div className="flex flex-wrap gap-1.5">
            {allBookmakers.map(b => (
              <Toggle
                key={b}
                label={b}
                active={filters.bookmakers.includes(b)}
                onClick={() => onChange({ ...filters, bookmakers: toggleArr(filters.bookmakers, b) })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sort */}
      <div>
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">Ordenar por</p>
        <div className="flex flex-wrap gap-1.5">
          {(["profit", "starts_at", "detected_at"] as const).map(s => {
            const labels = { profit: "Profit%", starts_at: "Horário do evento", detected_at: "Mais recente" }
            return (
              <Toggle
                key={s}
                label={labels[s]}
                active={filters.sort === s}
                onClick={() => onChange({ ...filters, sort: s })}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
