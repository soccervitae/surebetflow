import { createClient } from "@/lib/supabase/server"
import AdminSurebetsClient from "./AdminSurebetsClient"
import type { Bookmaker, ScraperRun, AdminSurebetRow, AdminStats } from "./types"

export const metadata = { title: "Admin — Surebets" }

export default async function AdminSurebetsPage() {
  const supabase = await createClient()

  const [
    { data: bookmakers },
    { data: scraperRuns },
    { data: surebets },
    { data: statsRow },
  ] = await Promise.all([
    supabase
      .from("bookmakers")
      .select("*")
      .order("name"),
    supabase
      .from("scraper_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(200),
    supabase
      .from("surebet_dashboard")
      .select("*")
      .order("profit_pct", { ascending: false })
      .limit(100),
    supabase
      .from("admin_surebet_stats")
      .select("*")
      .maybeSingle(),
  ])

  const stats: AdminStats = {
    surebets_24h: Number(statsRow?.surebets_24h ?? 0),
    avg_profit_pct: Number(statsRow?.avg_profit_pct ?? 0),
    surebets_ativas: Number(statsRow?.surebets_ativas ?? 0),
    bookmakers_ativos: Number(statsRow?.bookmakers_ativos ?? 0),
  }

  return (
    <AdminSurebetsClient
      initialBookmakers={(bookmakers ?? []) as Bookmaker[]}
      initialScraperRuns={(scraperRuns ?? []) as ScraperRun[]}
      initialSurebets={(surebets ?? []) as AdminSurebetRow[]}
      initialStats={stats}
    />
  )
}
