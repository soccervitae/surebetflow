import type { SurebetRow as SurebetRowType } from "@/lib/types/surebet"
import ProfitBadge from "./ProfitBadge"
import LegDisplay from "./LegDisplay"
import { Clock, CalendarDays, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

function relativeTime(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now()
  const abs = Math.abs(diff)
  const mins = Math.floor(abs / 60000)
  const hours = Math.floor(abs / 3600000)
  const days = Math.floor(abs / 86400000)
  const past = diff < 0

  if (mins < 1) return past ? "agora" : "em instantes"
  if (hours < 1) return past ? `há ${mins}min` : `em ${mins}min`
  if (days < 1) return past ? `há ${hours}h` : `em ${hours}h`
  return past ? `há ${days}d` : `em ${days}d`
}

function detectedAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  if (mins < 1) return "agora mesmo"
  if (hours < 1) return `há ${mins}min`
  return `há ${hours}h`
}

function fmtMarket(key: string): string {
  const map: Record<string, string> = {
    "1x2": "1X2",
    "over_under": "Mais/Menos",
    "btts": "Ambas Marcam",
    "asian_handicap": "Handicap Asiático",
    "draw_no_bet": "Empate Anulado",
  }
  return map[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}

interface Props {
  surebet: SurebetRowType
  isNew: boolean
}

export default function SurebetRow({ surebet: s, isNew }: Props) {
  return (
    <Card
      className={`transition-all duration-700 ${isNew ? "ring-2 ring-green-500/60 bg-green-500/5" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">{s.sport}</span>
                <span className="text-[var(--text-muted)]">·</span>
                <span className="text-xs text-[var(--text-muted)] truncate">{s.league}</span>
              </div>
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                {s.home_team} <span className="text-[var(--text-muted)] font-normal">vs</span> {s.away_team}
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{fmtMarket(s.market_key)}</p>
            </div>

            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <ProfitBadge pct={Number(s.profit_pct)} />
              <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                <Zap className="w-3 h-3" />
                <span>{detectedAgo(s.detected_at)}</span>
              </div>
            </div>
          </div>

          {/* Event time */}
          <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              {new Date(s.starts_at).toLocaleString("pt-BR", {
                day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {relativeTime(s.starts_at)}
            </span>
          </div>

          {/* Legs */}
          <div className="flex gap-2">
            <LegDisplay leg={s.leg_a} label="A" />
            <LegDisplay leg={s.leg_b} label="B" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
