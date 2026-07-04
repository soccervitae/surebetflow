import type { SurebetRow } from "@/lib/types/surebet"

export interface Bookmaker {
  id: string
  slug: string
  name: string
  base_url: string | null
  is_licensed_br: boolean
  is_active: boolean
  created_at: string
}

export interface ScraperRun {
  id: number
  bookmaker_id: string | null
  started_at: string
  finished_at: string | null
  odds_count: number
  status: "success" | "error" | "partial"
  errors: string[]
  created_at: string
}

export type AdminSurebetRow = SurebetRow

export interface AdminStats {
  surebets_24h: number
  avg_profit_pct: number
  surebets_ativas: number
  bookmakers_ativos: number
}
