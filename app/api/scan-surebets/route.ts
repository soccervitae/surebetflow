import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { fetchOdds } from "@/lib/odds-api/client"
import { detectSurebets } from "@/lib/surebet/detector"

const SPORTS = [
  "soccer_brazil_campeonato",
  "soccer_brazil_serie_b",
  "soccer_epl",
  "soccer_spain_la_liga",
  "soccer_germany_bundesliga",
  "soccer_italy_serie_a",
  "soccer_france_ligue_one",
  "soccer_uefa_champs_league",
  "soccer_conmebol_copa_libertadores",
  "soccer_fifa_world_cup",
]

const TTL_MINUTES = 3

export async function POST(req: NextRequest) {
  // Admin or cron only
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get("authorization")
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isCron) {
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean)
    if (!adminEmails.includes(user.email ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  const body = await req.json().catch(() => ({}))
  const sports: string[] = body.sports ?? SPORTS
  const regions: string = body.regions ?? "eu"
  const markets: string = body.markets ?? "h2h,totals"

  const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000).toISOString()

  let totalEvents = 0
  const allSurebets: ReturnType<typeof detectSurebets> = []

  for (const sport of sports) {
    try {
      const events = await fetchOdds({ sport, regions, markets })
      totalEvents += events.length
      const detected = detectSurebets(events, { minProfit: 0, maxProfit: 15 })
      allSurebets.push(...detected)
    } catch (err) {
      console.error(`[scan-surebets] failed for sport ${sport}:`, err)
    }
  }

  if (allSurebets.length > 0) {
    const rows = allSurebets.map(s => ({
      sport: s.sport,
      league: s.league,
      home_team: s.home_team,
      away_team: s.away_team,
      commence_time: s.commence_time,
      market_key: s.market_key,
      line: s.line ?? null,
      legs: s.legs,
      profit_pct: s.profit_pct,
      is_suspicious: s.is_suspicious,
      expires_at: expiresAt,
    }))

    const { error } = await supabase.from("surebets").insert(rows)
    if (error) {
      console.error("[scan-surebets] insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({
    ok: true,
    events_scanned: totalEvents,
    surebets_found: allSurebets.length,
    suspicious: allSurebets.filter(s => s.is_suspicious).length,
  })
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ error: "Use POST" }, { status: 405 })
}
