import type { SurebetLeg } from "@/lib/types/surebet"

interface Props {
  leg: SurebetLeg
  label: "A" | "B"
}

export default function LegDisplay({ leg, label }: Props) {
  return (
    <div className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          Leg {label}
        </span>
        <span className="text-xs font-medium text-[var(--text-secondary)] truncate">{leg.bookmaker_name}</span>
      </div>
      <p className="text-sm text-[var(--text-primary)] truncate mb-1">{leg.selection}</p>
      {leg.line !== null && (
        <p className="text-[11px] text-[var(--text-muted)] mb-1">Linha: {leg.line}</p>
      )}
      <p className="text-base font-bold font-mono tabular-nums text-[var(--accent-text)]">{leg.odds.toFixed(2)}</p>
    </div>
  )
}
